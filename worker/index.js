// PIE Worker entry point — routes the AI recommendation endpoint and the
// account service through one origin.

import { recommend, CATALOG_IDS, SYSTEM_PROMPT, buildDynamicLines, buildStoryLines } from './recommend.js';
import { handleAccount } from './account.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

const MAX_INPUT_CHARS = 600;

// Best-effort per-isolate rate limit for the AI endpoint.
const hits = new Map();
const LIMIT = 12;
const WINDOW_MS = 60000;

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json' }
});

async function dynamicMembers(env) {
  if (!env || !env.PIE_KV) return [];
  const listed = await env.PIE_KV.list({ prefix: 'profile:' });
  const members = [];
  for (const entry of listed.keys) {
    const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
    if (record && record.dynamic) members.push(record);
  }
  return members;
}

async function dynamicStories(env) {
  if (!env || !env.PIE_KV) return [];
  const listed = await env.PIE_KV.list({ prefix: 'story:' });
  const stories = [];
  for (const entry of listed.keys) {
    const record = JSON.parse((await env.PIE_KV.get(entry.name)) || 'null');
    if (record && record.quote) stories.push(record);
  }
  stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return stories.slice(0, 20);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);

    if (url.pathname === '/recommend') {
      if (request.method !== 'POST') return json({ error: 'not found' }, 404);
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (rateLimited(ip)) return json({ error: 'rate limited' }, 429);
      let input = '';
      try {
        const body = await request.json();
        input = String(body.input || '').trim().slice(0, MAX_INPUT_CHARS);
      } catch { input = ''; }
      if (!input) return json({ error: 'input required' }, 400);
      try {
        const extras = await dynamicMembers(env);
        const stories = await dynamicStories(env);
        const result = await recommend(input, env.DEEPSEEK_API_KEY, extras, stories);
        return json(result);
      } catch (err) {
        return json({ error: 'recommendation failed' }, 502);
      }
    }

    if (url.pathname === '/health') return json({ ok: true });

    try {
      return await handleAccount(request, env, url);
    } catch (err) {
      return json({ error: 'server error' }, 500);
    }
  }
};

export { SYSTEM_PROMPT, CATALOG_IDS, buildDynamicLines, buildStoryLines };
