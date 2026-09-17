# Member registration

Added 2026-09-16. Visitors can claim their existing profile or add a new one from `join.html`, and every change is stored in Cloudflare KV through the existing Worker. No extra server is required.

## How it works

```
join.html (browser)
   │  POST /auth/code     { email }
   ▼
Worker: pie-recommend.zixuangui.workers.dev
   ├─ checks the claimable registry (the six supplied real profiles)
   ├─ stores a 6-digit code in KV (10 min TTL)
   └─ sends it by email, or returns it in the response while no mail key is set
   │  POST /auth/verify   { email, code }
   ├─ issues a 30-day session token
   └─ answers { profileId, profile }  → existing profile, or null for a new one
   │  POST /profile       (Bearer token)
   └─ writes the profile to KV
members.html
   └─ GET /profiles → applies edits to existing cards and appends new members
```

## Endpoints

| Route | Purpose |
| --- | --- |
| `POST /auth/code` | Send a verification code for an email address |
| `POST /auth/verify` | Exchange the code for a session token; reports whether a profile is linked |
| `GET /me` | Current session and its profile |
| `GET /profiles` | Public list: `patched` edits for existing profiles and `dynamic` new members |
| `POST /profile` | Create or update the signed-in member's profile |
| `DELETE /profile` | Remove a self-created profile (directory profiles cannot be deleted this way) |
| `GET /photo/<id>` | Uploaded portrait bytes |

## Rules

- Only the six supplied real profiles can be claimed, and only through their own address; the 22 demo profiles use `example.com` placeholders and cannot be claimed.
- A claimed profile is stored as an edit on top of the static card, so `members.html` stays readable without JavaScript and without the service.
- New profiles are published immediately (no approval step) and appear at the end of the directory with a **Member** badge.
- Email addresses are hidden unless the member ticks "show my email"; the six supplied profiles keep the addresses the team provided.
- Photos are resized in the browser to 400 × 400 and stored in KV; the page then loads them from `/photo/<id>`.
- Registered members also join the AI recommendation catalog: the Worker appends them to the prompt and accepts their ids from the model.

## Limits and protections

- Code lifetime 10 minutes, at most 5 attempts, at most 3 codes per address per hour and 10 per IP per hour.
- Session tokens are 32 random bytes, valid for 30 days.
- Field limits: name 60, role 60, country 40, summary 320, eight tags of 30 characters, photo 400 KB.
- Server strips angle brackets and caps every value before it is stored.

## Enabling real email delivery

The service runs in demo mode while `BREVO_API_KEY` is unset, showing the code on the page so the flow can be tested. To switch it on:

1. Create a free [Brevo](https://www.brevo.com/) account (300 emails/day) and verify a sender address — no domain required.
2. `cd worker && npx wrangler secret put BREVO_API_KEY` and paste the key.
3. Optionally `npx wrangler secret put MAIL_FROM` with the verified sender address (defaults to `no-reply@learningplanetinstitute.org`).

Resend is a drop-in alternative but requires a verified domain to send to arbitrary recipients.

## Free-tier budget

KV: 100,000 reads and 1,000 writes per day. Worker: 100,000 requests per day. Brevo: 300 emails per day. A community of a few dozen members uses a small fraction of each.

## Operating notes

- Saved changes can take up to a minute to appear on the public pages: Cloudflare KV reads are cached briefly at the edge. The join page tells members this after saving.
- Inspect stored profiles: `npx wrangler kv key list --binding PIE_KV --remote`
- Remove a profile manually: `npx wrangler kv key delete --binding PIE_KV --remote "profile:<id>"` (also delete `email:<address>`)
- The claimable base data lives in `worker/claimable.js` and mirrors the six real cards in `members.html`; update both together.
