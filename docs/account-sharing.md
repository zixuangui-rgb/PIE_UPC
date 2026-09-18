# Account sharing: PIE website → community platform

A member registers on the PIE website. When that same person signs in on
**paris-international-exchange.org** with the same address, the partner site asks
the PIE website who they are and creates the account with those details already
filled in. No second registration, nothing to type beyond their email.

```
PIE website (github.io)                  Community platform (their server)
   member registers, email verified
        │
        │        someone signs in there with the same email
        │                        │
        │                        ▼
        │        GET /member?email=…            ← server to server
        │◄───────────────────────────────────────  X-PIE-Key: <shared key>
        │
        └──────► { found: true, member: { id, name, country, role, tags, summary } }

                                 │
                                 ▼
                 account created / refreshed, session opened
                 → they are signed in with their PIE details
```

There is no redirect and no button: the visitor simply signs in on the partner
site the way they normally would, and their PIE profile is already there.

## 1. The endpoint

```
GET https://pie-recommend.zixuangui.workers.dev/member?email=<address>
Header: X-PIE-Key: <shared key>
```

| Response | Meaning |
| --- | --- |
| `200 {"found":true,"source":"pie-website","member":{…}}` | Known address — create or refresh the account with this |
| `404 {"found":false}` | Unknown address — treat as a brand-new visitor |
| `401 {"error":"bad key"}` | Wrong or missing key |
| `503 {"error":"the directory bridge is not configured"}` | The bridge is switched off on the PIE side |

The `member` object:

| Field | Notes |
| --- | --- |
| `id` | the PIE profile id, e.g. `zixuan-gui`. Keep it to link the two accounts |
| `email` | lower-cased, and already verified by a six-digit code on the PIE side |
| `name`, `country`, `city`, `role` | display details |
| `tags` | free-text interests from the PIE profile, e.g. `["Ski","Coding"]` |
| `summary` | short self-introduction (`bio` on your side) |
| `photo` | path to a portrait on the PIE site, or empty |

Read-only, key-protected and never cached. The key is compared in constant time
and the endpoint answers nothing without it, so the directory cannot be
enumerated.

## 2. What the community platform adds

One call at the moment an account is created (and optionally on every sign-in,
so edits on the PIE side flow through):

```js
// server/community-store.mjs
async sharedProfile(email) {
  const key = process.env.PIE_DIRECTORY_KEY;
  if (!key) return null;
  const url = `https://pie-recommend.zixuangui.workers.dev/member?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, { headers: { 'X-PIE-Key': key } });
  if (response.status === 404) return null;          // a stranger: nothing to copy
  if (!response.ok) return null;                     // never block a sign-in on this
  const { member } = await response.json();
  return member;
}
```

```js
// where the account is created — server.mjs, /api/member/verify (or /magic)
const shared = await community.sharedProfile(email);
if (shared) {
  member = await community.upsertMember({
    ...member,
    pieId: shared.id,
    name: member.name || shared.name,
    country: member.country || shared.country,
    city: member.city || shared.city || 'Paris',
    bio: member.bio || shared.summary
  });
}
```

Rules worth keeping:

- **Never block a sign-in** when the lookup fails: a timeout or an error means
  "no shared profile", not "access denied".
- **Their own fields win.** Only fill what the member has not set themselves, so
  someone who edits their name on your site keeps it.
- **`interests` differ**: your side uses codes (`boardgame`, `cooking`), the PIE
  side free text (`Ski`, `Coding`). Keep them apart (or map the ones you have) —
  free text in a coded field would break your filters.
- The PIE email stays verified: you do not need to send a confirmation again.
- `member: false` on your side — these are website accounts, not dues-paying
  association members.

## 3. Configuration

```bash
# PIE side (one secret, then the endpoint is live)
cd worker && wrangler secret put PIE_DIRECTORY_KEY

# Community platform side
wrangler secret put PIE_DIRECTORY_KEY      # the same value
```

While `PIE_DIRECTORY_KEY` is unset the endpoint answers `503` and every sign-in
on your side behaves exactly as it does today — nothing breaks.

## 4. Trying it locally (no deployment)

```bash
# terminal 1 — the PIE service on a local KV, production untouched
cd worker && npx wrangler dev --port 8788          # key comes from worker/.dev.vars

# terminal 2 — a stand-in for the partner site's sign-in
PIE_DIRECTORY_URL=http://127.0.0.1:8788 \
PIE_DIRECTORY_KEY=<the same key> node scripts/mock-platform.mjs
```

Open `http://127.0.0.1:8899/` and sign in with
`zixuan.gui@learningplanetinstitute.org`: the page reports *"Profile supplied by
the PIE website"* and shows the name, country, role, interests and bio. Any other
address produces an empty account, exactly as a stranger's would.

Cases worth repeating against the real endpoint:

| Case | Expected |
| --- | --- |
| Address registered on the PIE side | `200` with the profile |
| Address that only exists as a claimable PIE profile | `200` with the profile |
| Unknown address | `404 {"found":false}` |
| Missing or wrong `X-PIE-Key` | `401` |
| Partner service down | sign-in still succeeds, account just not filled |

## 5. Appendix: the click-through handoff (built, not in use)

An earlier plan shared the session with a one-click redirect instead: the PIE
events page offered *"Continue with my account"*, which signed a five-minute
single-use ticket and sent the browser to `/api/member/handoff` on the partner
site. The code is still in the repository and tested — `worker/handoff.js`,
`POST /handoff`, `PLATFORM_URL` / `PIE_HANDOFF_SECRET` — but the events-page
button was removed, so nothing links to it. It remains the better experience if
the two sites ever want a visibly connected flow; the email lookup above needs
nothing from the visitor.
