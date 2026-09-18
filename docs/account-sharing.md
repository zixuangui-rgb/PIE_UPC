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
```

| Response | Meaning |
| --- | --- |
| `200 {"found":true,"source":"pie-website","member":{…}}` | Known address — create or refresh the account with this |
| `404 {"found":false}` | Unknown address — treat as a brand-new visitor |
| `429 {"error":"too many lookups…"}` | More than 30 lookups from one address in an hour |
| `401 {"error":"bad key"}` | Only when a key is configured and it does not match |

**No key is required.** Everything the endpoint returns is already published on
the PIE members page — names, roles, countries, introductions, and the email
addresses the members agreed to show — so a key would guard convenience, not a
secret. Without one the endpoint answers anyone, capped at **30 lookups per
address per hour**, which is enough for a whole room signing in and far too
little to harvest a directory. Setting `PIE_DIRECTORY_KEY` on both sides is
supported when the association would rather be asked by this one server alone;
nothing else changes.

The `member` object:

| Field | Notes |
| --- | --- |
| `id` | the PIE profile id, e.g. `zixuan-gui`. Keep it to link the two accounts |
| `email` | lower-cased, and already verified by a six-digit code on the PIE side |
| `name`, `country`, `city`, `role` | display details |
| `tags` | free-text interests from the PIE profile, e.g. `["Ski","Coding"]` |
| `summary` | short self-introduction (`bio` on your side) |
| `photo` | path to a portrait on the PIE site, or empty |

Read-only and never cached. When a key is configured it is compared in constant
time; when none is, the hourly cap above is what keeps the directory from being
enumerated.

## 2. What the community platform adds

One call at the moment an account is created (and optionally on every sign-in,
so edits on the PIE side flow through):

```js
// server/community-store.mjs
async sharedProfile(email) {
  const url = `https://pie-recommend.zixuangui.workers.dev/member?email=${encodeURIComponent(email)}`;
  const key = process.env.PIE_DIRECTORY_KEY;         // optional
  try {
    const response = await fetch(url, { headers: key ? { 'X-PIE-Key': key } : {} });
    if (!response.ok) return null;                   // 404 stranger, 429 busy: nothing to copy
    const { member } = await response.json();
    return member;
  } catch {
    return null;                                     // never block a sign-in on this
  }
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

Nothing to configure: the endpoint is live on the PIE side and the community
platform only needs `PIE_DIRECTORY_URL` (already in `wrangler.example.toml`).

Optionally, to make the directory answer this one server only, set the same
`PIE_DIRECTORY_KEY` on both sides — `wrangler secret put PIE_DIRECTORY_KEY` — and
the rate limit is replaced by the key check. Generating it with two halves sent
over two different channels keeps the value out of any single transcript.

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
| More than 30 lookups in an hour | `429`, and sign-in still succeeds with an empty account |
| `X-PIE-Key` when a key is configured but wrong | `401` |
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
