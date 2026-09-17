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

import { CLAIMABLE, findClaimableByEmail } from './claimable.js';

const CODE_TTL = 600;            // 10 minutes
const SESSION_TTL = 60 * 60 * 24 * 30;
const MAX_ATTEMPTS = 5;
const MAX_CODE_PER_EMAIL_HOUR = 3;
const MAX_CODE_PER_IP_HOUR = 10;
const CODE_COOLDOWN_SECONDS = 60;   // minimum gap between two requests for one address
const MAX_CODES_PER_DAY = 200;      // protects the mail provider's daily quota
const MAX_PHOTO_CHARS = 400 * 1024;   // base64 data URL cap (~300 KB image)
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

async function bump(env, bucket, limit, ttl) {
  const current = Number(await env.PIE_KV.get(key.rate(bucket))) || 0;
  if (current >= limit) return false;
  await env.PIE_KV.put(key.rate(bucket), String(current + 1), { expirationTtl: ttl });
  return true;
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

export async function handleAccount(request, env, url) {
  const path = url.pathname;

  // ---- service configuration (used by the join page to explain the flow) ----
  if (path === '/config' && request.method === 'GET') {
    return json({ emailEnabled: !!env.BREVO_API_KEY });
  }

  // ---- request a verification code -----------------------------------------
  if (path === '/auth/code' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const email = clean(body.email, FIELD_LIMITS.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid email' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await env.PIE_KV.get(`cooldown:${email}`)) {
      return json({ error: 'a code was just sent — please wait a minute before requesting another one' }, 429);
    }
    if (!(await bump(env, `code-email:${email}`, MAX_CODE_PER_EMAIL_HOUR, 3600))) return json({ error: 'too many codes for this address, try later' }, 429);
    if (!(await bump(env, `code-ip:${ip}`, MAX_CODE_PER_IP_HOUR, 3600))) return json({ error: 'too many requests, try later' }, 429);
    if (!(await bump(env, `code-daily:${new Date().toISOString().slice(0, 10)}`, MAX_CODES_PER_DAY, 86400))) {
      return json({ error: 'the daily verification limit has been reached, please try again tomorrow' }, 429);
    }
    const code = randomCode();
    await env.PIE_KV.put(key.code(email), JSON.stringify({ code, attempts: 0 }), { expirationTtl: CODE_TTL });
    await env.PIE_KV.put(`cooldown:${email}`, '1', { expirationTtl: CODE_COOLDOWN_SECONDS });
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

  return json({ error: 'not found' }, 404);
}

export { CLAIMABLE };
