// Local stand-in for the partner association site (paris-international-exchange.org).
//
// It reproduces the part that matters for account sharing: a visitor signs in
// with an email, and the server asks the PIE website whether that address is
// already known. When it is, the new account is filled with the name, country,
// role and interests from the PIE profile — so the person lands on their site
// already signed in with their details in place.
//
//   # terminal 1 — the PIE service, with a local KV and no production impact
//   cd worker && npx wrangler dev --port 8787
//
//   # terminal 2 — this stand-in
//   PIE_DIRECTORY_KEY=<the shared key> node scripts/mock-platform.mjs
//
// Then open http://127.0.0.1:8899/ and sign in with a known address.
//
// Environment:
//   PIE_DIRECTORY_URL   default http://127.0.0.1:8787
//   PIE_DIRECTORY_KEY   must match worker/.dev.vars
//   MOCK_PORT           default 8899

import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 8899);
const PIE_URL = String(process.env.PIE_DIRECTORY_URL || 'http://127.0.0.1:8787').replace(/\/+$/, '');
const PIE_KEY = process.env.PIE_DIRECTORY_KEY || '';

/* Their member table, in memory: one row per account, their own shape. */
const members = new Map();     // email -> member
const sessions = new Map();    // cookie -> email

const html = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Community platform — local stand-in</title>
<style>
 :root { --blue:#2438b6; --ink:#151d32; --line:#dce1ec; --paper:#f8faff; --muted:#5b6478; }
 * { box-sizing:border-box; }
 body { margin:0; padding:48px 22px; background:var(--paper); color:var(--ink);
        font:400 16px/1.7 -apple-system, "DM Sans", system-ui, sans-serif; }
 main { max-width:720px; margin:0 auto; }
 .kicker { color:var(--blue); font-size:12px; font-weight:600; letter-spacing:.14em; }
 h1 { margin:10px 0 18px; font:400 40px/1.1 "Instrument Serif", Georgia, serif; letter-spacing:-.015em; }
 .card { margin-top:24px; padding:24px 26px; background:#fff; border:1px solid var(--line); }
 label { display:block; margin:0 0 6px; font-size:11px; font-weight:600; letter-spacing:.04em;
         text-transform:uppercase; color:var(--muted); }
 input { width:100%; padding:13px 15px; background:var(--paper); border:1px solid var(--line);
         border-radius:2px; font:400 16px/1.6 inherit; color:var(--ink); }
 button { margin-top:18px; padding:13px 26px; background:var(--blue); border:0; border-radius:40px;
          color:#fff; font:500 15px inherit; cursor:pointer; }
 dl { display:grid; grid-template-columns:150px 1fr; gap:9px 18px; margin:0; font-size:14px; }
 dt { color:var(--muted); }
 dd { margin:0; }
 code { padding:2px 6px; background:var(--paper); border:1px solid var(--line); font-size:12.5px; }
 .tag { display:inline-block; margin:0 6px 6px 0; padding:3px 9px; border:1px solid var(--line);
        color:var(--muted); font-size:11.5px; }
 .note { margin-top:18px; color:var(--muted); font-size:13px; }
 .ok { color:#1c7a4a; font-weight:600; }
 .miss { color:#a3342f; font-weight:600; }
</style></head><body><main>${body}</main></body></html>`;

function signInPage(message = '') {
  return html(`<p class="kicker">LOCAL STAND-IN · PARTNER SITE</p>
    <h1>Sign in</h1>
    <div class="card">
      <p>This is the partner site's own sign-in, reproduced locally. Their real site asks for a
      name and sends a one-time link; what matters here is what happens next.</p>
      <form method="POST" action="/login">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required placeholder="zixuan.gui@learningplanetinstitute.org" />
        <label for="name" style="margin-top:16px">Name (used only when we have never seen the address)</label>
        <input id="name" name="name" placeholder="Your name" />
        <button type="submit">Sign in</button>
      </form>
      ${message ? `<p class="note">${message}</p>` : ''}
      <p class="note">Known addresses (the PIE team): zixuan.gui@learningplanetinstitute.org,
      sparlay.khan@learningplanetinstitute.org, matijevictamara@yahoo.com</p>
    </div>`);
}

function accountPage(member, fromDirectory) {
  const tags = (member.interests || []).map((t) => `<span class="tag">${t}</span>`).join('') || '<span class="tag">—</span>';
  return html(`<p class="kicker">LOCAL STAND-IN · PARTNER SITE</p>
    <h1>Signed in as ${member.name}</h1>
    <div class="card">
      <p>${fromDirectory
        ? '<span class="ok">Profile supplied by the PIE website</span> — the account was created from the shared directory entry, so no details had to be typed here.'
        : '<span class="miss">Not found in the PIE directory</span> — this account was created empty, as it would be for any stranger.'}</p>
      <dl>
        <dt>Member id here</dt><dd><code>${member.id}</code></dd>
        <dt>PIE id</dt><dd>${member.pieId ? `<code>${member.pieId}</code>` : '—'}</dd>
        <dt>Email</dt><dd>${member.email}</dd>
        <dt>Name</dt><dd>${member.name}</dd>
        <dt>Country</dt><dd>${member.country || '—'}</dd>
        <dt>City</dt><dd>${member.city || '—'}</dd>
        <dt>Interests</dt><dd>${tags}</dd>
        <dt>Bio</dt><dd>${member.bio || '—'}</dd>
        <dt>Filled from PIE</dt><dd>${member.syncedAt ? new Date(member.syncedAt).toLocaleString('en-GB') : '—'}</dd>
      </dl>
      <p class="note">Accounts held by this stand-in: ${members.size} · <a href="/">sign out</a></p>
    </div>`);
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

/* The bridge: ask the PIE website whether it knows this address. */
async function lookUp(email) {
  if (!PIE_KEY) return { error: 'PIE_DIRECTORY_KEY is not set for the stand-in' };
  const url = `${PIE_URL}/member?email=${encodeURIComponent(email)}`;
  try {
    const response = await fetch(url, { headers: { 'X-PIE-Key': PIE_KEY } });
    if (response.status === 404) return { found: false };
    if (!response.ok) return { error: `PIE directory answered ${response.status}` };
    return await response.json();
  } catch (error) {
    return { error: `could not reach ${PIE_URL} (${error.message})` };
  }
}

async function readForm(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';')
    .map((part) => part.trim().split('=')).filter((pair) => pair[0]).map(([k, v]) => [k, v]));
  const current = sessions.has(cookies.pie_partner_session) ? members.get(sessions.get(cookies.pie_partner_session)) : null;

  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(current ? accountPage(current, current.fromDirectory) : signInPage());
  }

  if (url.pathname === '/login' && req.method === 'POST') {
    const form = await readForm(req);
    const email = String(form.email || '').trim().toLowerCase();
    const typedName = String(form.name || '').trim();
    if (!email) {
      res.writeHead(303, { Location: '/' });
      return res.end();
    }

    const lookup = await lookUp(email);
    const existing = members.get(email);
    let member = existing;
    let fromDirectory = existing ? existing.fromDirectory : false;

    if (lookup.found && lookup.member) {
      const shared = lookup.member;
      member = {
        id: existing ? existing.id : 'member-' + randomUUID().slice(0, 8),
        pieId: shared.id,
        email,
        name: shared.name || typedName || email.split('@')[0],
        country: shared.country || '',
        city: shared.city || 'Paris',
        interests: Array.isArray(shared.tags) ? shared.tags : [],
        bio: shared.summary || '',
        member: false,
        joinedAt: existing ? existing.joinedAt : Date.now(),
        syncedAt: Date.now()
      };
      fromDirectory = true;
      console.log(`  ✓ ${email} → found in the PIE directory as "${shared.name}"${existing ? ' (account refreshed)' : ' (account created)'}`);
    } else if (!member) {
      member = {
        id: 'member-' + randomUUID().slice(0, 8),
        pieId: '',
        email,
        name: typedName || email.split('@')[0],
        country: '', city: 'Paris', interests: [], bio: '',
        member: false, joinedAt: Date.now(), syncedAt: 0
      };
      fromDirectory = false;
      console.log(`  · ${email} → not in the PIE directory (${lookup.error || 'no match'}), empty account created`);
    } else {
      console.log(`  · ${email} → already had an account here`);
    }

    member.fromDirectory = fromDirectory;
    members.set(email, member);
    const session = randomUUID();
    sessions.set(session, email);
    res.writeHead(303, {
      'Set-Cookie': `pie_partner_session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
      Location: '/'
    });
    return res.end();
  }

  if (url.pathname === '/logout') {
    res.writeHead(303, { 'Set-Cookie': 'pie_partner_session=; Path=/; Max-Age=0', Location: '/' });
    return res.end();
  }

  if (url.pathname === '/mock/members') {
    return json(res, 200, { members: [...members.values()] });
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Partner-site stand-in on http://127.0.0.1:${PORT}`);
  console.log(`  asks the PIE website at ${PIE_URL}/member`);
  console.log(PIE_KEY ? '  shared key: set' : '  shared key: MISSING — set PIE_DIRECTORY_KEY');
});
