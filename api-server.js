// Local development API server
// Run with: node api-server.js
// This mimics Vercel serverless functions locally

import { createServer } from 'http';
import { readFileSync } from 'fs';

// Load .env manually
try {
  const env = readFileSync('.env', 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...vals] = line.trim().split('=');
    if (key && !key.startsWith('#')) {
      process.env[key] = vals.join('=').replace(/^["']|["']$/g, '');
    }
  });
} catch {}

const PORT = 3001;

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function createRes(res) {
  const headers = {};
  return {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => ({
      json: (data) => {
        res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
        res.end(JSON.stringify(data));
      },
      end: () => { res.writeHead(code, headers); res.end(); }
    }),
    json: (data) => {
      res.writeHead(200, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify(data));
    }
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  const mockRes = createRes(res);
  const body = await parseBody(req);
  const mockReq = { method: req.method, body, query: Object.fromEntries(url.searchParams) };

  try {
    if (path === '/api/payment') {
      const { default: handler } = await import('./api/payment.js');
      await handler(mockReq, mockRes);
    } else if (path === '/api/payment-webhook') {
      const { default: handler } = await import('./api/payment-webhook.js');
      await handler(mockReq, mockRes);
    } else if (path === '/api/payment-status') {
      const { default: handler } = await import('./api/payment-status.js');
      await handler(mockReq, mockRes);
    } else if (path === '/api/booking') {
      const { default: handler } = await import('./api/booking.js');
      await handler(mockReq, mockRes);
    } else if (path === '/api/cron-check-expiry') {
      const { default: handler } = await import('./api/cron-check-expiry.js');
      await handler(mockReq, mockRes);
    } else {
      mockRes.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('API error:', err);
    mockRes.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Local API server running at http://localhost:${PORT}`);
  console.log('   Routes: /api/payment, /api/payment-webhook, /api/booking');
});
