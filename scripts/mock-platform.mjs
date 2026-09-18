// Mock of the community platform's receiving side — for testing the account
// handoff locally, before the real site is connected.
//
//   PIE_HANDOFF_SECRET=<same secret as the PIE service> \
//   node scripts/mock-platform.mjs            # http://127.0.0.1:8899
//
// It implements the three things the real site has to do:
//   1. GET /api/member/handoff?t=<ticket>  verify the signature, find or create
//      the member, open a session, redirect into the signed-in page
//   2. GET /membership.html                the page the member lands on
//   3. GET /api/community                  the data their pages fetch
//
// This file is intentionally dependency-free and mirrors the layout of
// server/server.mjs in the community platform, so the same code can be dropped
// in there.

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 8899);
const SECRET = process.env.PIE_HANDOFF_SECRET || '';
const TTL_SKEW = 30;          // seconds of clock tolerance

/* The mock keeps its "database" in memory: one row per member, exactly the
   shape the real member table uses. */
const members = new Map();          // email -> member
const sessions = new Map();         // cookie value -> member email
const usedTickets = new Set();      // jti, so a ticket works once

const decode = (part) => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* ---------------------------------------------------------------- tickets -- */
function verifyTicket(ticket) {
  if (!SECRET) return { error: 'PIE_HANDOFF_SECRET is not set on the mock' };
  const [payload, signature] = String(ticket || '').split('.');
  if (!payload || !signature) return { error: 'malformed ticket' };

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: 'bad signature' };

  let claims;
  try { claims = JSON.parse(decode(payload)); } catch { return { error: 'unreadable payload' }; }
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp + TTL_SKEW < now) return { error: 'ticket expired' };
  if (claims.iat && claims.iat - TTL_SKEW > now) return { error: 'ticket is from the future' };
  if (!claims.email) return { error: 'no email in ticket' };
  if (claims.jti && usedTickets.has(claims.jti)) return { error: 'ticket already used' };
  return { claims };
}

/* ---------------------------------------------------------------- members -- */
// Find by email or create: an account exists after the first handoff, and the
// address counts as confirmed because the partner site verified it.
function findOrCreateMember(claims) {
  const email = claims.email.toLowerCase();
  const existing = members.get(email);
  if (existing) {
    Object.assign(existing, {
      name: claims.name || existing.name,
      country: claims.country || existing.country,
      interests: claims.interests && claims.interests.length ? claims.interests : existing.interests,
      lastHandoffAt: Date.now()
    });
    return { member: existing, created: false };
  }
  const member = {
    id: 'm-' + randomUUID().slice(0, 8),
    email,
    name: claims.name || email.split('@')[0],
    country: claims.country || '',
    city: claims.city || 'Paris',
    interests: claims.interests || [],
    member: false,
    joinedAt: Date.now(),
    emailConfirmedAt: Date.now(),
    confirmedVia: 'handoff',
    lastHandoffAt: Date.now()
  };
  members.set(email, member);
  return { member, created: true };
}

/* ----------------------------------------------------------------- serving -- */
const page = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Community platform — mock</title>
<style>
 :root { --blue:#2438b6; --ink:#151d32; --line:#dce1ec; --paper:#f8faff; --muted:#5b6478; }
 * { box-sizing:border-box; }
 body { margin:0; padding:56px 24px; background:var(--paper); color:var(--ink);
        font:400 16px/1.7 -apple-system, "DM Sans", system-ui, sans-serif; }
 main { max-width:760px; margin:0 auto; }
 .kicker { color:var(--blue); font-size:12px; font-weight:600; letter-spacing:.14em; }
 h1 { margin:10px 0 18px; font:400 42px/1.1 "Instrument Serif", Georgia, serif; letter-spacing:-.015em; }
 .card { margin-top:26px; padding:26px 28px; background:#fff; border:1px solid var(--line); }
 dl { display:grid; grid-template-columns:150px 1fr; gap:10px 18px; margin:0; font-size:14px; }
 dt { color:var(--muted); }
 dd { margin:0; }
 code { padding:2px 6px; background:var(--paper); border:1px solid var(--line); font-size:12.5px; }
 .tag { display:inline-block; margin:0 6px 6px 0; padding:3px 9px; border:1px solid var(--line); color:var(--muted); font-size:11.5px; }
 a { color:var(--blue); }
 .note { margin-top:22px; color:var(--muted); font-size:13px; }
</style></head><body><main>${body}</main></body></html>`;

function landing(member) {
  if (!member) {
    return page(`<p class="kicker">MOCK · COMMUNITY PLATFORM</p>
      <h1>Not signed in</h1>
      <div class="card"><p>This mock only signs people in through a handoff ticket from the PIE service.</p>
      <p class="note">Expected flow: PIE site → <code>POST /handoff</code> → <code>GET /api/member/handoff?t=…</code> here.</p></div>`);
  }
  const tags = (member.interests || []).map((t) => `<span class="tag">${t}</span>`).join('') || '<span class="tag">—</span>';
  return page(`<p class="kicker">MOCK · COMMUNITY PLATFORM</p>
    <h1>Welcome, ${member.name}</h1>
    <div class="card">
      <p>You arrived from the PIE website and you are <strong>already signed in</strong>. This is exactly what the other group's page should show.</p>
      <dl>
        <dt>Member id</dt><dd><code>${member.id}</code></dd>
        <dt>Email (private)</dt><dd>${member.email}</dd>
        <dt>Country</dt><dd>${member.country || '—'}</dd>
        <dt>City</dt><dd>${member.city}</dd>
        <dt>Interests</dt><dd>${tags}</dd>
        <dt>Email confirmed</dt><dd>${member.emailConfirmedAt ? new Date(member.emailConfirmedAt).toISOString() : '—'} <span class="tag">via ${member.confirmedVia || 'link'}</span></dd>
        <dt>Association member</dt><dd>${member.member ? 'yes' : 'no — they can join from here'}</dd>
      </dl>
      <p class="note">Member since ${new Date(member.joinedAt).toLocaleString('en-GB')} · mock database holds ${members.size} account(s) · <a href="/api/community">/api/community</a></p>
    </div>`);
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';')
    .map((part) => part.trim().split('=')).filter((pair) => pair[0]).map(([k, v]) => [k, v]));
  const current = sessions.has(cookies.pie_member_session) ? members.get(sessions.get(cookies.pie_member_session)) : null;

  // 1. the receiving endpoint the other site has to implement
  if (url.pathname === '/api/member/handoff') {
    const { claims, error } = verifyTicket(url.searchParams.get('t'));
    if (error) {
      console.log(`  ✗ handoff rejected: ${error}`);
      res.writeHead(303, { Location: '/membership.html?signin=' + encodeURIComponent(error) });
      return res.end();
    }
    if (claims.jti) usedTickets.add(claims.jti);
    const { member, created } = findOrCreateMember(claims);
    const session = randomUUID();
    sessions.set(session, member.email);
    console.log(`  ✓ handoff accepted: ${member.email} (${created ? 'account created' : 'account found'}), interests: ${(member.interests || []).join(', ') || '—'}`);
    res.writeHead(303, {
      'Set-Cookie': `pie_member_session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
      Location: '/membership.html?signin=ok&from=pie'
    });
    return res.end();
  }

  // 2. where the member lands
  if (url.pathname === '/membership.html' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(landing(current));
  }

  // 3. the data their pages read
  if (url.pathname === '/api/community') {
    return json(res, 200, {
      members: [...members.values()].map((m) => ({ id: m.id, name: m.name, country: m.country, city: m.city, interests: m.interests })),
      me: current ? { id: current.id, name: current.name, email: current.email } : null
    });
  }

  // convenience for inspecting the mock database
  if (url.pathname === '/mock/members') {
    return json(res, 200, { members: [...members.values()], usedTickets: [...usedTickets] });
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock community platform on http://127.0.0.1:${PORT}`);
  console.log(SECRET ? '  secret: set' : '  secret: MISSING — set PIE_HANDOFF_SECRET');
  console.log('  waiting for GET /api/member/handoff?t=…');
});
