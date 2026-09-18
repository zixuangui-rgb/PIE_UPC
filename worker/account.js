// PIE account service — email registration, profile claiming, profile editing.
//
// Routes (all JSON, CORS for the GitHub Pages site and localhost):
//   POST /auth/code    { email }                  -> { sent, devCode? }
//   POST /auth/verify  { email, code }            -> { token, profileId|null, profile|null }
//   GET  /me           (Bearer token)             -> { profile }
//   GET  /profiles                                -> { patched: {id: patch}, dynamic: [record] }
//   POST /profile      (Bearer token) { fields }  -> { profile }
//   DELETE /profile    (Bearer token)             -> { deleted }
//   GET  /photo/<id>                              -> image bytes
//
// Email delivery: set the BREVO_API_KEY secret and codes are emailed. Without
// the secret the service runs in demo mode and returns the code in the response
// so the flow can be tested end to end.

import { CLAIMABLE, findClaimableByEmail, findClaimableById } from './claimable.js';
import { buildHandoffUrl, handoffClaims, HANDOFF_TTL_SECONDS } from './handoff.js';

const CODE_TTL = 600;            // 10 minutes
const SESSION_TTL = 60 * 60 * 24 * 30;
const MAX_ATTEMPTS = 5;
const MAX_CODE_PER_EMAIL_HOUR = 6;    // plenty for a retry or a resend
const MAX_CODE_PER_IP_HOUR = 200;     // a whole room shares one campus IP during a demo
const MAX_CODE_PER_IP_MINUTE = 60;    // stops a runaway client without blocking an audience
const CODE_COOLDOWN_SECONDS = 30;     // minimum gap between two requests for one address
const MAX_CODES_PER_DAY = 280;        // the mail provider's free plan stops at 300
const MAX_PHOTO_CHARS = 400 * 1024;   // base64 data URL cap (~300 KB image)
const IDEA_LIMIT = 200;               // characters per idea
const COMMENT_LIMIT = 500;            // characters per event comment
const MAX_COMMENTS_PER_HOUR = 10;
const MAX_LOOKUPS_PER_IP_HOUR = 30;   // only used when no shared key is configured
const EVENT_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const EVENT_SCOPE = /^(all|\d{4}-\d{2}-\d{2})$/;
const MAX_IDEAS_PER_HOUR = 5;
const MAX_IDEAS_PER_DAY = 20;
const FIELD_LIMITS = { name: 60, role: 60, country: 40, summary: 320, tags: 8, tag: 30, email: 120 };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json', ...extraHeaders }
});

const clean = (value, max) => String(value == null ? '' : value).replace(/[<>]/g, '').trim().slice(0, max);
const key = {
  code: (email) => `code:${email}`,
  session: (token) => `session:${token}`,
  profile: (id) => `profile:${id}`,
  email: (email) => `email:${email}`,
  rate: (bucket) => `rate:${bucket}`
};

// Best-effort counter. KV refuses concurrent writes to one key, and a burst of
// sign-ups all touch the same per-IP and daily buckets: when that write fails
// the request is allowed rather than failed, because a lost count must never
// stand between a member and their sign-in code. The limits therefore hold
// exactly under normal traffic and loosen, never tighten, under load.
async function bump(env, bucket, limit, ttl) {
  try {
    const current = Number(await env.PIE_KV.get(key.rate(bucket))) || 0;
    if (current >= limit) return false;
    await env.PIE_KV.put(key.rate(bucket), String(current + 1), { expirationTtl: Math.max(60, ttl) });
    return true;
  } catch (err) {
    return true;
  }
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendCode(env, email, code) {
  if (!env.BREVO_API_KEY) return { sent: true, devCode: code, mode: 'demo' };
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'PIE · Paris International Exchange', email: env.MAIL_FROM || 'no-reply@learningplanetinstitute.org' },
      to: [{ email }],
      subject: `Your PIE verification code: ${code}`,
      textContent: `Hello,\n\nYour PIE community verification code is ${code}.\nIt expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\nPIE · Paris International Exchange`
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) throw new Error('mail ' + resp.status);
  return { sent: true, mode: 'email' };
}

async function loadProfile(env, id) {
  return JSON.parse((await env.PIE_KV.get(key.profile(id))) || 'null');
}

async function listProfiles(env) {
  const listed = await env.PIE_KV.list({ prefix: 'profile:' });
  const profiles = [];
  for (const entry of listed.keys) {
    const record = await loadProfile(env, entry.name.slice('profile:'.length));
    if (record) profiles.push(record);
  }
  return profiles;
}

function publicRecord(record) {
  return {
    id: record.id,
    name: record.name,
    role: record.role || '',
    country: record.country || '',
    summary: record.summary || '',
    tags: record.tags || [],
    email: record.email || '',
    // Uploaded photos are served from KV; claimed profiles keep their asset path.
    photo: (typeof record.photo === 'string' && record.photo.startsWith('data:'))
      ? `/photo/${record.id}?v=${record.updatedAt}`
      : (record.photo || ''),
    dynamic: !!record.dynamic,
    updatedAt: record.updatedAt
  };
}

// The claimable registry stores the combined "Role · Country" line from the
// members page; split it back into form fields for the join page.
function claimableToProfile(claimed) {
  const [role, country] = String(claimed.role || '').split(' · ');
  return {
    id: claimed.id,
    name: claimed.name,
    role: role || '',
    country: country || '',
    summary: claimed.summary || '',
    tags: claimed.tags || [],
    email: '',
    photo: claimed.photoPath || '',
    dynamic: false
  };
}

async function sessionFrom(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const session = JSON.parse((await env.PIE_KV.get(key.session(token))) || 'null');
  return session && session.email ? { token, ...session } : null;
}

// Author details for a story: registered record first, then the base registry.
async function authorInfo(env, id) {
  if (!id) return null;
  const record = await loadProfile(env, id);
  if (record) {
    const uploaded = typeof record.photo === 'string' && record.photo.startsWith('data:');
    return {
      id: record.id,
      name: record.name,
      role: record.role || '',
      country: record.country || '',
      photo: uploaded ? `/photo/${record.id}?v=${record.updatedAt}` : (record.photo || '')
    };
  }
  const claimed = findClaimableById(id);
  if (!claimed) return null;
  const [role, country] = String(claimed.role || '').split(' · ');
  return { id: claimed.id, name: claimed.name, role: role || '', country: country || '', photo: claimed.photoPath || '' };
}

// Author lookups are repeated for every comment, so cache them per request.
async function cachedAuthor(env, id, cache) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  const info = await authorInfo(env, id);
  cache.set(id, info);
  return info;
}

// Constant-time compare so the key cannot be guessed a character at a time.
function safeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function ownsIdea(env, session, record) {
  if (!record || !record.authorId) return false;
  const profileId = await env.PIE_KV.get(key.email(session.email));
  const claimed = findClaimableByEmail(session.email);
  return (profileId && record.authorId === profileId) || (claimed && record.authorId === claimed.id);
}

// Validates the optional idea details (fields 3–6 of the submission form).
function parseIdea(body) {
  const text = clean(body.text, IDEA_LIMIT);
  if (text.length < 4) return { error: 'please write a few more words' };
  const dateFlexible = body.dateFlexible === true;
  let date = '';
  if (typeof body.date === 'string' && body.date.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date.trim())) return { error: 'please pick a valid date' };
    const today = new Date().toISOString().slice(0, 10);
    if (body.date.trim() < today) return { error: 'the suggested date is already in the past' };
    date = body.date.trim();
  }
  let time = '';
  if (typeof body.time === 'string' && body.time.trim()) {
    if (!/^\d{2}:\d{2}$/.test(body.time.trim())) return { error: 'please pick a valid time' };
    time = body.time.trim();
  }
  return {
    value: {
      text,
      title: clean(body.title, 60),
      date,
      dateFlexible,
      time,
      place: clean(body.place, 60)
    }
  };
}

export async function handleAccount(request, env, url) {
  const path = url.pathname;

  // ---- service configuration (used by the join page to explain the flow) ----
  if (path === '/config' && request.method === 'GET') {
    return json({
      emailEnabled: !!env.BREVO_API_KEY,
      platformReady: !!(env.PLATFORM_URL && env.PIE_HANDOFF_SECRET),
      platformName: clean(env.PLATFORM_NAME, 60) || 'the community platform'
    });
  }

  // ---- directory lookup for the partner site --------------------------------
  // Their server asks "do you know this address?" when someone signs in there,
  // and fills the new account with what comes back. Read-only, and only with
  // the shared key, so the directory is never open to enumeration.
  if (path === '/member' && request.method === 'GET') {
    const expected = env.PIE_DIRECTORY_KEY || '';
    if (expected) {
      /* A key is configured, so only the partner server may ask. */
      if (!safeEqual(request.headers.get('X-PIE-Key') || '', expected)) {
        return json({ error: 'bad key' }, 401);
      }
    } else {
      /* No key: the directory answers anyone, slowly enough that it cannot be
         harvested. Everything it returns is already published on the members
         page, so this guards traffic rather than a secret — which is why it can
         be left off without weakening anything that was not already public. */
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!(await bump(env, `member-ip:${ip}`, MAX_LOOKUPS_PER_IP_HOUR, 3600))) {
        return json({ error: 'too many lookups — please try again later' }, 429);
      }
    }
    const email = clean(url.searchParams.get('email'), FIELD_LIMITS.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid email' }, 400);

    const profileId = await env.PIE_KV.get(key.email(email));
    const own = profileId ? await loadProfile(env, profileId) : null;
    const claimed = own ? null : findClaimableByEmail(email);
    const profile = own || claimed;
    if (!profile) return json({ found: false }, 404);

    // A registered profile keeps role and country apart; the built-in registry
    // stores them together as "Role · Country".
    const [role, country] = own
      ? [profile.role || '', profile.country || '']
      : String(profile.role || '').split(' · ').map((part) => part.trim());
    const uploaded = typeof profile.photo === 'string' && profile.photo.startsWith('data:');
    return json({
      found: true,
      source: 'pie-website',
      member: {
        id: profile.id,
        email,
        name: profile.name || '',
        country: country || '',
        city: 'Paris',
        role: role || '',
        tags: Array.isArray(profile.tags) ? profile.tags.filter(Boolean).slice(0, 8) : [],
        summary: profile.summary || '',
        photo: uploaded ? `/photo/${profile.id}` : (profile.photoPath || profile.photo || '')
      }
    }, 200, { 'Cache-Control': 'no-store' });
  }

  // ---- hand a signed-in member over to the community platform ---------------
  if (path === '/handoff' && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'sign in first' }, 401);
    if (!env.PLATFORM_URL || !env.PIE_HANDOFF_SECRET) {
      return json({ error: 'the community platform is not connected yet' }, 503);
    }
    const profileId = await env.PIE_KV.get(key.email(session.email));
    const own = profileId ? await loadProfile(env, profileId) : null;
    const claimed = findClaimableByEmail(session.email);
    const profile = own || claimed || null;
    const claims = handoffClaims(profile, session.email);
    const url = await buildHandoffUrl(env, claims);
    // Recorded so a ticket can be recognised again by this side while it lives.
    await env.PIE_KV.put(`handoff:${claims.jti}`, JSON.stringify({ email: claims.email, exp: claims.exp }), { expirationTtl: HANDOFF_TTL_SECONDS + 60 });
    return json({ url, expiresIn: HANDOFF_TTL_SECONDS });
  }

  // ---- request a verification code -----------------------------------------
  if (path === '/auth/code' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const email = clean(body.email, FIELD_LIMITS.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid email' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    // KV refuses an expirationTtl below 60 seconds, so the cooldown length is
    // kept in the value and the key itself simply lives a little longer.
    const cooldownUntil = Number(await env.PIE_KV.get(`cooldown:${email}`)) || 0;
    if (cooldownUntil > Date.now()) {
      return json({ error: 'a code was just sent — please wait a moment before asking for another one' }, 429);
    }
    if (!(await bump(env, `code-email:${email}`, MAX_CODE_PER_EMAIL_HOUR, 3600))) return json({ error: 'too many codes for this address, try later' }, 429);
    if (!(await bump(env, `code-ip-minute:${ip}`, MAX_CODE_PER_IP_MINUTE, 60))) return json({ error: 'too many requests just now, please try again in a minute' }, 429);
    if (!(await bump(env, `code-ip:${ip}`, MAX_CODE_PER_IP_HOUR, 3600))) return json({ error: 'too many requests, try later' }, 429);
    if (!(await bump(env, `code-daily:${new Date().toISOString().slice(0, 10)}`, MAX_CODES_PER_DAY, 86400))) {
      return json({ error: 'the daily verification limit has been reached, please try again tomorrow' }, 429);
    }
    // A second request inside the code's lifetime keeps the SAME code: a
    // duplicated email then carries one answer, not two that disagree.
    const open = JSON.parse((await env.PIE_KV.get(key.code(email))) || 'null');
    const code = open && open.code ? open.code : randomCode();
    await env.PIE_KV.put(key.code(email), JSON.stringify({ code, attempts: 0 }), { expirationTtl: CODE_TTL });
    await env.PIE_KV.put(`cooldown:${email}`, String(Date.now() + CODE_COOLDOWN_SECONDS * 1000), { expirationTtl: 120 });
    try {
      const result = await sendCode(env, email, code);
      const known = findClaimableByEmail(email);
      return json({ ...result, knownProfile: known ? { id: known.id, name: known.name } : null });
    } catch (err) {
      return json({ error: 'could not send the email' }, 502);
    }
  }

  // ---- verify the code ------------------------------------------------------
  if (path === '/auth/verify' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const email = clean(body.email, FIELD_LIMITS.email).toLowerCase();
    const code = clean(body.code, 6);
    const stored = JSON.parse((await env.PIE_KV.get(key.code(email))) || 'null');
    if (!stored) return json({ error: 'code expired, please request a new one' }, 400);
    if (stored.attempts >= MAX_ATTEMPTS) {
      await env.PIE_KV.delete(key.code(email));
      return json({ error: 'too many attempts, please request a new code' }, 429);
    }
    if (stored.code !== code) {
      stored.attempts += 1;
      await env.PIE_KV.put(key.code(email), JSON.stringify(stored), { expirationTtl: CODE_TTL });
      return json({ error: 'wrong code' }, 400);
    }
    await env.PIE_KV.delete(key.code(email));
    const token = randomToken();
    await env.PIE_KV.put(key.session(token), JSON.stringify({ email, createdAt: Date.now() }), { expirationTtl: SESSION_TTL });

    const existingId = await env.PIE_KV.get(key.email(email));
    const claimed = findClaimableByEmail(email);
    const profileId = existingId || (claimed ? claimed.id : null);
    let profile = null;
    if (profileId) {
      const stored4 = await loadProfile(env, profileId);
      profile = stored4 ? publicRecord(stored4) : (claimed ? claimableToProfile(claimed) : null);
    }
    return json({ token, profileId, profile, isExisting: !!profileId });
  }

  // ---- current session ------------------------------------------------------
  if (path === '/me' && request.method === 'GET') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = await env.PIE_KV.get(key.email(session.email));
    const record = id ? await loadProfile(env, id) : null;
    const claimed = findClaimableByEmail(session.email);
    return json({
      email: session.email,
      profileId: id || (claimed ? claimed.id : null),
      profile: record ? publicRecord(record) : (claimed ? claimableToProfile(claimed) : null)
    });
  }

  // ---- public profile list (base data plus user edits) ----------------------
  if (path === '/profiles' && request.method === 'GET') {
    const records = await listProfiles(env);
    const patched = {};
    const dynamic = [];
    for (const record of records) {
      if (record.dynamic) dynamic.push(publicRecord(record));
      else patched[record.id] = publicRecord(record);
    }
    dynamic.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    return json({ patched, dynamic }, 200, { 'Cache-Control': 'no-store' });
  }

  // ---- photo bytes ----------------------------------------------------------
  if (path.startsWith('/photo/') && request.method === 'GET') {
    const id = clean(path.slice('/photo/'.length), 60);
    const record = await loadProfile(env, id);
    if (!record || !record.photo) return new Response('not found', { status: 404, headers: CORS });
    const match = /^data:(image\/[a-z+]+);base64,(.*)$/s.exec(record.photo);
    if (!match) return new Response('not found', { status: 404, headers: CORS });
    const binary = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    return new Response(binary, {
      headers: { ...CORS, 'Content-Type': match[1], 'Cache-Control': 'public, max-age=300' }
    });
  }

  // ---- create or update a profile ------------------------------------------
  if (path === '/profile' && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }

    const name = clean(body.name, FIELD_LIMITS.name);
    if (name.length < 2) return json({ error: 'please enter your name' }, 400);
    const tags = (Array.isArray(body.tags) ? body.tags : [])
      .map((tag) => clean(tag, FIELD_LIMITS.tag)).filter(Boolean).slice(0, FIELD_LIMITS.tags);
    let photo = '';
    if (typeof body.photo === 'string' && body.photo.startsWith('data:image/')) {
      if (body.photo.length > MAX_PHOTO_CHARS) return json({ error: 'photo too large' }, 413);
      photo = body.photo;
    }

    const claimed = findClaimableByEmail(session.email);
    let id = await env.PIE_KV.get(key.email(session.email));
    let existing = id ? await loadProfile(env, id) : null;
    let dynamic = existing ? !!existing.dynamic : !claimed;
    if (!id) {
      id = claimed ? claimed.id : 'm-' + randomToken().slice(0, 12);
      await env.PIE_KV.put(key.email(session.email), id);
    }

    const record = {
      id,
      email: session.email,
      name,
      role: clean(body.role, FIELD_LIMITS.role),
      country: clean(body.country, FIELD_LIMITS.country),
      summary: clean(body.summary, FIELD_LIMITS.summary),
      tags,
      photo: photo || (existing && existing.photo) || (claimed && claimed.photoPath) || '',
      dynamic,
      updatedAt: Date.now()
    };
    await env.PIE_KV.put(key.profile(id), JSON.stringify(record));
    return json({ profile: publicRecord(record) });
  }

  // ---- delete a self-created profile ---------------------------------------
  if (path === '/profile' && request.method === 'DELETE') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = await env.PIE_KV.get(key.email(session.email));
    if (!id) return json({ error: 'no profile to delete' }, 404);
    const record = await loadProfile(env, id);
    if (!record || !record.dynamic) return json({ error: 'directory profiles cannot be deleted here' }, 403);
    await env.PIE_KV.delete(key.profile(id));
    await env.PIE_KV.delete(key.email(session.email));
    return json({ deleted: true });
  }

  // ---- event attendance and comments ---------------------------------------
  // Attendance is keyed per member (rsvp:<event>:<scope>:<profileId>) so two
  // people clicking at once cannot overwrite each other, and a repeated click
  // is the same record. A recurring event carries the occurrence date as its
  // scope, so a new month starts with an empty list.
  if (path === '/events/social' && request.method === 'GET') {
    const spec = clean(url.searchParams.get('events'), 600);
    const wanted = [];
    for (const pair of spec.split(',')) {
      const [id, scope] = pair.split(':');
      if (EVENT_ID.test(id || '') && EVENT_SCOPE.test(scope || '')) wanted.push([id, scope]);
      if (wanted.length >= 12) break;
    }
    const authors = new Map();
    const events = {};
    for (const [id, scope] of wanted) {
      const listed = await env.PIE_KV.list({ prefix: `rsvp:${id}:${scope}:` });
      const going = [];
      for (const entry of listed.keys) {
        const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
        if (!record) continue;
        const author = await cachedAuthor(env, record.profileId, authors);
        going.push({
          profileId: record.profileId,
          name: (author && author.name) || record.name || 'A member',
          photo: (author && author.photo) || '',
          at: record.at || 0
        });
      }
      going.sort((a, b) => a.at - b.at);

      const listedComments = await env.PIE_KV.list({ prefix: `comment:${id}:` });
      const comments = [];
      for (const entry of listedComments.keys) {
        const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
        if (!record) continue;
        const author = await cachedAuthor(env, record.authorId, authors);
        comments.push({
          id: record.id,
          eventId: record.eventId || id,
          text: record.text,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt || 0,
          authorId: record.authorId,
          authorName: (author && author.name) || record.authorName || '',
          photo: (author && author.photo) || '',
          authorGone: !author
        });
      }
      comments.sort((a, b) => a.createdAt - b.createdAt);
      events[id] = { scope, going, comments };
    }
    return json({ events }, 200, { 'Cache-Control': 'no-store' });
  }

  const eventRoute = path.match(/^\/events\/([a-z0-9-]{1,40})\/(join|leave|comments)$/);
  if (eventRoute && request.method === 'POST') {
    const eventId = eventRoute[1];
    const action = eventRoute[2];
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'only verified members can take part' }, 401);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const scope = clean(body.scope, 10) || 'all';
    if (!EVENT_SCOPE.test(scope)) return json({ error: 'invalid scope' }, 400);
    const profileId = await env.PIE_KV.get(key.email(session.email));
    const claimed = findClaimableByEmail(session.email);
    const me = profileId || (claimed ? claimed.id : '');
    if (!me) return json({ error: 'please add your profile first' }, 400);

    if (action === 'join' || action === 'leave') {
      const rsvpKey = `rsvp:${eventId}:${scope}:${me}`;
      if (action === 'leave') {
        await env.PIE_KV.delete(rsvpKey);
        return json({ joined: false });
      }
      const author = await cachedAuthor(env, me, new Map());
      await env.PIE_KV.put(rsvpKey, JSON.stringify({
        eventId,
        scope,
        profileId: me,
        name: (author && author.name) || '',
        at: Date.now()
      }));
      return json({ joined: true });
    }

    const text = clean(body.text, COMMENT_LIMIT);
    if (text.length < 2) return json({ error: 'please write something first' }, 400);
    if (!(await bump(env, `comment-email:${session.email}`, MAX_COMMENTS_PER_HOUR, 3600))) {
      return json({ error: 'you have posted a lot just now, please try again later' }, 429);
    }
    const author = await cachedAuthor(env, me, new Map());
    const record = {
      id: 'c-' + randomToken().slice(0, 12),
      eventId,
      text,
      authorId: me,
      authorName: (author && author.name) || '',
      createdAt: Date.now()
    };
    await env.PIE_KV.put(`comment:${eventId}:${record.id}`, JSON.stringify(record));
    return json({ comment: { ...record, photo: (author && author.photo) || '', authorGone: false } });
  }

  // ---- edit or delete one's own comment ------------------------------------
  if (path.startsWith('/comments/') && (request.method === 'POST' || request.method === 'DELETE')) {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = clean(path.slice('/comments/'.length), 40);
    const listed = await env.PIE_KV.list({ prefix: 'comment:' });
    let found = null;
    for (const entry of listed.keys) {
      if (!entry.name.endsWith(':' + id)) continue;
      found = { key: entry.name, record: JSON.parse((await env.PIE_KV.get(entry.name)) || 'null') };
      break;
    }
    if (!found || !found.record) return json({ error: 'comment not found' }, 404);
    if (!(await ownsIdea(env, session, { authorId: found.record.authorId }))) {
      return json({ error: 'you can only change your own comment' }, 403);
    }
    if (request.method === 'DELETE') {
      await env.PIE_KV.delete(found.key);
      return json({ deleted: true });
    }
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const text = clean(body.text, COMMENT_LIMIT);
    if (text.length < 2) return json({ error: 'please write something first' }, 400);
    const updated = { ...found.record, text, updatedAt: Date.now() };
    await env.PIE_KV.put(found.key, JSON.stringify(updated));
    return json({ comment: updated });
  }

  // ---- member experiences: short quotes bound to their author ---------------
  if (path === '/stories' && request.method === 'GET') {
    const listed = await env.PIE_KV.list({ prefix: 'story:' });
    const stories = [];
    for (const entry of listed.keys) {
      const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
      if (!record) continue;
      record.author = await authorInfo(env, record.authorId);
      stories.push(record);
    }
    stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ stories: stories.slice(0, 50) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (path === '/stories' && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'only verified members can share an experience' }, 401);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const quote = clean(body.quote, 240);
    if (quote.length < 10) return json({ error: 'please write a little more' }, 400);
    const detail = clean(body.body, 600);
    const place = clean(body.place, 60);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await bump(env, `story-email:${session.email}`, 3, 3600))) return json({ error: 'you have shared a few already, please try again later' }, 429);
    await bump(env, `story-ip:${ip}`, 10, 3600);

    const profileId = await env.PIE_KV.get(key.email(session.email));
    const claimed = findClaimableByEmail(session.email);
    const authorId = profileId || (claimed ? claimed.id : '');
    if (!authorId) return json({ error: 'please add your profile first' }, 400);
    const record = {
      id: 's-' + randomToken().slice(0, 12),
      quote,
      place,
      body: detail,
      authorId,
      createdAt: Date.now()
    };
    await env.PIE_KV.put(`story:${record.id}`, JSON.stringify(record));
    return json({ story: { ...record, author: await authorInfo(env, authorId) } });
  }

  // ---- edit your own experience --------------------------------------------
  if (path.startsWith('/stories/') && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = clean(path.slice('/stories/'.length), 40);
    const record = JSON.parse((await env.PIE_KV.get(`story:${id}`)) || 'null');
    if (!record) return json({ error: 'not found' }, 404);
    if (!(await ownsIdea(env, session, { authorId: record.authorId }))) return json({ error: 'you can only edit your own experience' }, 403);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const quote = clean(body.quote, 240);
    if (quote.length < 10) return json({ error: 'please write a little more' }, 400);
    const updated = {
      ...record,
      quote,
      place: clean(body.place, 60),
      body: clean(body.body, 600),
      updatedAt: Date.now()
    };
    await env.PIE_KV.put(`story:${id}`, JSON.stringify(updated));
    return json({ story: { ...updated, author: await authorInfo(env, updated.authorId) } });
  }

  if (path.startsWith('/stories/') && request.method === 'DELETE') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = clean(path.slice('/stories/'.length), 40);
    const record = JSON.parse((await env.PIE_KV.get(`story:${id}`)) || 'null');
    if (!record) return json({ error: 'not found' }, 404);
    if (!(await ownsIdea(env, session, { authorId: record.authorId }))) return json({ error: 'you can only remove your own experience' }, 403);
    await env.PIE_KV.delete(`story:${id}`);
    return json({ deleted: true });
  }

  // ---- event ideas: posted by verified members, shown immediately ----------
  if (path === '/ideas' && request.method === 'GET') {
    const listed = await env.PIE_KV.list({ prefix: 'idea:' });
    const ideas = [];
    for (const entry of listed.keys) {
      const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
      if (record) ideas.push(record);
    }
    ideas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json({ ideas: ideas.slice(0, 50) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (path === '/ideas' && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'only verified members can post an idea' }, 401);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const parsed = parseIdea(body);
    if (parsed.error) return json({ error: parsed.error }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await bump(env, `idea-hour:${session.email}`, MAX_IDEAS_PER_HOUR, 3600))) return json({ error: 'you have posted several ideas already, please try again later' }, 429);
    if (!(await bump(env, `idea-day:${session.email}`, MAX_IDEAS_PER_DAY, 86400))) return json({ error: 'daily idea limit reached' }, 429);
    await bump(env, `idea-ip:${ip}`, 20, 3600);

    const profileId = await env.PIE_KV.get(key.email(session.email));
    const own = profileId ? await loadProfile(env, profileId) : null;
    const claimed = findClaimableByEmail(session.email);
    const name = clean(body.name, 40) || (own && own.name) || (claimed && claimed.name) || '';
    const record = {
      id: 'i-' + randomToken().slice(0, 12),
      ...parsed.value,
      authorId: profileId || (claimed ? claimed.id : ''),
      authorName: name,
      createdAt: Date.now()
    };
    await env.PIE_KV.put(`idea:${record.id}`, JSON.stringify(record));
    return json({ idea: record });
  }

  // ---- edit your own idea ---------------------------------------------------
  if (path.startsWith('/ideas/') && request.method === 'POST') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = clean(path.slice('/ideas/'.length), 40);
    const record = JSON.parse((await env.PIE_KV.get(`idea:${id}`)) || 'null');
    if (!record) return json({ error: 'idea not found' }, 404);
    if (!(await ownsIdea(env, session, record))) return json({ error: 'you can only edit your own idea' }, 403);
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const parsed = parseIdea(body);
    if (parsed.error) return json({ error: parsed.error }, 400);
    const updated = {
      ...record,
      ...parsed.value,
      authorName: clean(body.name, 40) || record.authorName || '',
      updatedAt: Date.now()
    };
    await env.PIE_KV.put(`idea:${id}`, JSON.stringify(updated));
    return json({ idea: updated });
  }

  if (path.startsWith('/ideas/') && request.method === 'DELETE') {
    const session = await sessionFrom(request, env);
    if (!session) return json({ error: 'not signed in' }, 401);
    const id = clean(path.slice('/ideas/'.length), 40);
    const record = JSON.parse((await env.PIE_KV.get(`idea:${id}`)) || 'null');
    if (!record) return json({ error: 'idea not found' }, 404);
    if (!(await ownsIdea(env, session, record))) return json({ error: 'you can only delete your own idea' }, 403);
    await env.PIE_KV.delete(`idea:${id}`);
    return json({ deleted: true });
  }

  return json({ error: 'not found' }, 404);
}

export { CLAIMABLE };
