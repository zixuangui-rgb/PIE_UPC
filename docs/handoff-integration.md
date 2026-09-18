# Account handoff: PIE website → community platform

One-way, one-click. A member signs in on the PIE website, clicks **Continue with
my account**, and lands on the community platform *already signed in*, with an
account created from their PIE profile. Nothing else is shared: no database
access, no cross-site cookie, no shared session.

```
PIE website (github.io)                 Community platform
  click "Continue with my account"
        │
        │  POST /handoff   (Bearer session)
        ▼
  signs { email, name, country, … } ──────────────►  GET /api/member/handoff?t=…
  with the shared secret                              verify signature + exp + jti
                                                      find-or-create member by email
                                                      open your own session cookie
                                                             │
                                                             ▼
                                                      303 /membership.html?signin=ok
```

The ticket is a short-lived signed string, so the receiving side never has to
trust the browser — it re-computes the signature itself.

## 1. The ticket

```
t = base64url(JSON payload) + "." + base64url(HMAC-SHA256(secret, base64url(JSON payload)))
```

Payload (issued by the PIE website):

| Field | Type | Notes |
| --- | --- | --- |
| `v` | number | format version, currently `1` |
| `email` | string | **the join key**, already lower-cased. PIE verified this address with a 6-digit code |
| `name` | string | display name from the PIE profile |
| `country` | string | e.g. `"China"` |
| `city` | string | always `"Paris"` |
| `interests` | string[] | PIE role + tags, e.g. `["Volunteer","Ski","Coding"]` |
| `iat` | number | issued at, seconds |
| `exp` | number | expiry, seconds — **5 minutes** after `iat` |
| `jti` | string | unique ticket id, for single-use enforcement |

Rules the receiver applies:

1. Re-compute the signature and compare in **constant time**.
2. Reject when `exp` (plus a small clock skew) is in the past.
3. Reject a `jti` that has already been used — store seen ids for ~10 minutes.
4. Never trust a field without a valid signature; never accept an unsigned email.

## 2. What the community platform adds

Two small pieces in `server/server.mjs` and `server/community-store.mjs`.
`scripts/mock-platform.mjs` in the PIE repository is a complete, runnable
reference of exactly this code (dependency-free, ~80 relevant lines) — see §4.

```js
// server.mjs — next to the other /api/member routes
if (req.method === "GET" && url.pathname === "/api/member/handoff") {
  const result = verifyHandoffTicket(url.searchParams.get("t") || "", process.env.PIE_HANDOFF_SECRET);
  if (result.error) {
    res.statusCode = 303;
    res.setHeader("Location", "/membership.html?signin=" + encodeURIComponent(result.error));
    return res.end();
  }
  const member = await community.handoffMember(result.claims);   // find-or-create by email
  setMemberSession(res, member.id, true);                        // the same call /api/member/verify uses
  res.statusCode = 303;
  res.setHeader("Location", "/membership.html?signin=ok&from=pie");
  return res.end();
}
```

```js
// community-store.mjs — find by email, or create a confirmed account
async handoffMember(claims) {
  const email = String(claims.email || "").toLowerCase();
  const existing = (await this.rows("members")).find(m => m.email === email);
  if (existing) {
    return this.updateMember(existing.id, {
      name: claims.name || existing.name,
      country: claims.country || existing.country,
      interests: claims.interests?.length ? claims.interests : existing.interests,
      lastHandoffAt: Date.now()
    });
  }
  return this.createMember({
    email,
    name: claims.name || email.split("@")[0],
    country: claims.country || "",
    city: claims.city || "Paris",
    interests: claims.interests || [],
    member: false,                  // association membership is decided on your side
    emailConfirmedAt: Date.now(),   // PIE verified it; do not send a magic link
    confirmedVia: "handoff",
    joinedAt: Date.now()
  });
}
```

Notes:

- **No email is sent**, so the handoff works even when `PIE_RESEND_API_KEY` is
  not configured — important, because without a mail provider `POST
  /api/member/magic` currently answers `503` and nobody can sign in on your side.
- `emailConfirmedAt` must be set, otherwise the member stays invisible in your
  public list (`publicData` filters on it) and cannot publish.
- `member: false` is deliberate: these are site accounts, not dues-paying
  association members. They can join from your membership page.
- The member's email stays private, exactly as your model already does. The PIE
  directory shows it, so the same person may be public there and private here —
  that is intentional and should stay a per-site decision.

## 3. Configuration

Both sides hold the same secret. Never commit it, never paste it into a chat.

```bash
# PIE side (already done)
cd worker && wrangler secret put PIE_HANDOFF_SECRET
wrangler deploy --var PLATFORM_URL:https://<your-worker-host> --var PLATFORM_NAME:"the community platform"

# Community platform side
wrangler secret put PIE_HANDOFF_SECRET      # same value
```

While `PLATFORM_URL` is empty on the PIE side, `GET /config` reports
`platformReady: false` and the button stays hidden — nothing breaks.

## 4. Testing before wiring the real sites

```bash
# PIE repository
PIE_HANDOFF_SECRET=<the shared secret> node scripts/mock-platform.mjs   # 127.0.0.1:8899
cd worker && wrangler deploy --var PLATFORM_URL:http://127.0.0.1:8899
```

Then sign in on the PIE site, open `events.html`, click the button, and the mock
prints the flow. It also exposes `/mock/members` to inspect the created accounts.

Checks worth repeating after the real endpoint exists:

| Case | Expected |
| --- | --- |
| Normal handoff | account created (first time) / found (later), signed in |
| Same ticket twice | second attempt → `ticket already used` |
| Payload edited (e.g. another email) | `bad signature` |
| Ticket older than 5 minutes | `ticket expired` |
| `POST /handoff` without a PIE session | `401 {"error":"sign in first"}` |

## 5. Optional next steps

- **Return trip**: the platform's activity pages can link back with
  `?from=pie` so the audience can compare both sites.
- **Photos**: the PIE profile carries a photo; the ticket has no photo field
  because the current member table has none. Adding one means one more column
  plus a served image URL, and can be done later without changing the format
  (`v` stays `1`; receivers ignore unknown fields).
- **Real single sign-on** (one session for both sites) was deliberately avoided:
  it would need a shared session store or an OAuth-style flow, and is far more
  work than a live demo needs.
