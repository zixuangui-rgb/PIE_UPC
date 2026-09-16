// Local development proxy for the Find your PIE AI endpoint.
// Serves the exact same contract as worker/recommend.js on http://localhost:8787
// so the homepage can use real AI matching before the worker is deployed.
//
//   DEEPSEEK_API_KEY=... node scripts/dev-proxy.mjs
//
// The key is read from the environment only; never store it in this repo.

import http from 'node:http';
import { recommend } from '../worker/recommend.js';

const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) {
  console.error('Missing DEEPSEEK_API_KEY environment variable.');
  process.exit(1);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Chrome Private Network Access: allow public (https) pages to call this
  // loopback endpoint. Without this header the browser blocks the request.
  'Access-Control-Allow-Private-Network': 'true'
};

// Light per-IP throttle for local use.
const hits = new Map();

const server = http.createServer(async (req, res) => {
  const send = (status, obj) => {
    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/health') {
    send(200, { ok: true });
    return;
  }
  if (url.pathname !== '/recommend' || req.method !== 'POST') {
    send(404, { error: 'not found' });
    return;
  }

  const ip = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (list.length >= 30) { send(429, { error: 'rate limited' }); return; }
  list.push(now);
  hits.set(ip, list);

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 10000) req.destroy();
  });
  req.on('end', async () => {
    let input = '';
    try {
      input = String((JSON.parse(body) || {}).input || '').trim();
    } catch (err) { input = ''; }
    if (!input) { send(400, { error: 'input required' }); return; }
    const started = Date.now();
    try {
      const result = await recommend(input, KEY);
      console.log(`[recommend] ${Date.now() - started}ms ok`);
      send(200, result);
    } catch (err) {
      console.error(`[recommend] ${Date.now() - started}ms failed:`, err.message);
      send(502, { error: 'recommendation failed' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`PIE recommend dev proxy listening on http://localhost:${PORT}`);
  console.log('POST /recommend  { "input": "..." }');
});
