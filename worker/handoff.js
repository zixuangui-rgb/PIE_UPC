// Account handoff — carry a signed-in PIE member over to the community platform.
//
// The audience signs in here first; one click then hands their identity to the
// other site, which creates or finds the matching account and opens its own
// session there. Nothing is shared except a short-lived signed ticket, so no
// cross-site cookie is involved and neither site reads the other's database.
//
//   POST /handoff   (Bearer token)  -> { url }
//
// The ticket is  base64url(payload) + "." + base64url(HMAC-SHA256(payload)).
// Both sides hold the same PIE_HANDOFF_SECRET; the receiving side re-computes
// the signature, checks `exp`, and treats `jti` as single-use.
//
// Configuration:
//   PLATFORM_URL         origin of the other site, e.g. https://pie.example.org
//   PIE_HANDOFF_SECRET   shared secret (wrangler secret put)

export const HANDOFF_TTL_SECONDS = 300;   // five minutes is plenty to follow a link

const base64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const encodeJson = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)));

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64url(signature);
}

// What the other site needs to recognise the person. Kept to display fields:
// no session token, no password, nothing that grants access to this service.
export function handoffClaims(profile, email, now = Date.now()) {
  const interests = []
    .concat(profile && profile.role ? [profile.role] : [])
    .concat(Array.isArray(profile && profile.tags) ? profile.tags : [])
    .filter(Boolean)
    .slice(0, 8);
  return {
    v: 1,
    email: String(email || '').toLowerCase(),
    name: (profile && profile.name) || '',
    country: (profile && profile.country) || '',
    city: 'Paris',
    interests,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + HANDOFF_TTL_SECONDS,
    jti: crypto.randomUUID()
  };
}

export async function buildHandoffUrl(env, claims) {
  const origin = String(env.PLATFORM_URL || '').replace(/\/+$/, '');
  const secret = env.PIE_HANDOFF_SECRET;
  if (!origin) throw new Error('PLATFORM_URL is not configured');
  if (!secret) throw new Error('PIE_HANDOFF_SECRET is not configured');
  const payload = encodeJson(claims);
  const token = `${payload}.${await sign(payload, secret)}`;
  return `${origin}/api/member/handoff?t=${encodeURIComponent(token)}`;
}
