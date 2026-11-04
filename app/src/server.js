'use strict';
// One small web server for everything: the staff dashboard, the student feedback page,
// the QR page and a JSON API. No external services; works offline on a local network.

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('./config');
const { Store } = require('./store');
const { Hub } = require('./hub');
const { SCENARIOS } = require('./simulation');
const { startSerial, startStdin } = require('./serial');

const PUBLIC = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };

function isLocal(req) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

// Addresses a classmate's phone could actually reach. VPN ranges (e.g. Tailscale's 100.64.0.0/10)
// and link-local 169.254.x.x are skipped: a QR code for them would never open on a phone.
function isReachableLan(ip) {
  const [a, b] = ip.split('.').map(Number);
  if (a === 169 && b === 254) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  return true;
}

function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal && isReachableLan(i.address)) out.push({ name, address: i.address });
  }
  return out;
}

function send(res, status, body, type = 'application/json') {
  const data = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'",
    'Referrer-Policy': 'no-referrer',
  });
  res.end(data);
}

function readJson(req, limit = 4096) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        resolve({ __error: 'Request too large.' });
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        resolve({ __error: 'Invalid JSON.' });
      }
    });
  });
}

function serveFile(res, file) {
  const full = path.join(PUBLIC, file);
  if (!full.startsWith(PUBLIC + path.sep) || !fs.existsSync(full)) return send(res, 404, 'Not found', 'text/plain');
  send(res, 200, fs.readFileSync(full), TYPES[path.extname(full)] || 'application/octet-stream');
}

function csv(rows, cols) {
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    // Prevent spreadsheet formula injection from comments.
    const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

function createApp(cfg, { now } = {}) {
  if (cfg.sensors === 'simulated') cfg.serial = 'off'; // never mix simulated and real sensor data
  const store = new Store(cfg.dataDir);
  const hub = new Hub(cfg, { store, now });
  const clients = new Set();
  let pending = null;
  hub.onChange(() => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      const msg = `event: state\ndata: ${JSON.stringify(hub.snapshot())}\n\n`;
      for (const c of clients) c.write(msg);
    }, 300);
  });

  const localOnly = (req, res) => {
    if (cfg.lanDashboard || isLocal(req)) return true;
    send(res, 403, { error: 'The staff dashboard is only available on the presenting laptop. Students: open /feedback.' });
    return false;
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    try {
      // ---- public: student feedback ----
      if (req.method === 'GET' && p === '/feedback') return serveFile(res, 'feedback.html');
      if (req.method === 'GET' && p.startsWith('/static/')) return serveFile(res, p.slice(8));
      if (req.method === 'GET' && p === '/api/room') return send(res, 200, { room: cfg.room });
      if (req.method === 'POST' && p === '/api/feedback') {
        const body = await readJson(req);
        if (body.__error) return send(res, 400, { error: body.__error });
        const r = hub.addFeedback(body, req.socket.remoteAddress || 'unknown');
        return send(res, r.status, r.error ? { error: r.error } : { ok: true, duplicate: !!r.duplicate });
      }
      if (req.method === 'GET' && p === '/') {
        if (!cfg.lanDashboard && !isLocal(req)) {
          res.writeHead(302, { Location: `/feedback?room=${encodeURIComponent(cfg.room.id)}` });
          return res.end();
        }
        return serveFile(res, 'dashboard.html');
      }

      // ---- presenter laptop only ----
      if (!localOnly(req, res)) return;
      if (req.method === 'GET' && p === '/qr') return serveFile(res, 'qr.html');
      if (req.method === 'GET' && p === '/setup') return serveFile(res, 'setup.html');
      if (req.method === 'GET' && p === '/api/state') return send(res, 200, hub.snapshot());
      if (req.method === 'GET' && p === '/api/history') return send(res, 200, { now: Date.now(), history: hub.historySnapshot() });
      if (req.method === 'GET' && p === '/api/scenarios') return send(res, 200, SCENARIOS);
      if (req.method === 'GET' && p === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
        res.write(`event: state\ndata: ${JSON.stringify(hub.snapshot())}\n\n`);
        clients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 15000);
        req.on('close', () => {
          clearInterval(ping);
          clients.delete(res);
        });
        return;
      }
      if (req.method === 'POST' && p === '/api/scenario') {
        const body = await readJson(req);
        if (!SCENARIOS[body.name]) return send(res, 400, { error: 'Unknown scenario.' });
        hub.setScenario(body.name);
        return send(res, 200, { ok: true });
      }
      const m = p.match(/^\/api\/alerts\/([A-Za-z0-9]+)\/review$/);
      if (req.method === 'POST' && m) {
        const body = await readJson(req);
        const r = hub.reviewAlert(m[1], body);
        return send(res, r.status, r.error ? { error: r.error } : { ok: true, alert: r.alert });
      }
      if (req.method === 'GET' && p === '/api/qr') {
        let QR;
        try {
          QR = require('qrcode');
        } catch {
          return send(res, 500, { error: 'qrcode package not installed — run npm install' });
        }
        const port = server.address().port;
        const urls = [];
        for (const a of lanAddresses()) {
          const link = `http://${a.address}:${port}/feedback?room=${encodeURIComponent(cfg.room.id)}`;
          urls.push({ interface: a.name, url: link, svg: await QR.toString(link, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }) });
        }
        return send(res, 200, { urls });
      }
      const ex = p.match(/^\/api\/export\/(readings|feedback|actions|alerts|events)\.csv$/);
      if (req.method === 'GET' && ex) {
        const rows = store.readAll(ex[1]).map((r) => ({ ...r, ...(r.values || {}), ...(r.review || {}), values: undefined, review: undefined, ens: r.ens ? r.ens.validity : undefined }));
        const cols = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => r[k] !== undefined && typeof r[k] !== 'object')))];
        res.setHeader('Content-Disposition', `attachment; filename="c1-${cfg.profile}-${ex[1]}.csv"`);
        return send(res, 200, csv(rows, cols), 'text/csv; charset=utf-8');
      }
      send(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error(err);
      send(res, 500, { error: 'Server error' });
    }
  });

  let simTimer = null;
  let serial = null;
  return {
    server,
    hub,
    store,
    start(port = cfg.port, host = cfg.host) {
      return new Promise((resolve) => {
        server.listen(port, host, () => {
          simTimer = setInterval(() => hub.simTick(), cfg.sampleIntervalMs);
          if (cfg.serial === 'stdin') serial = startStdin(hub);
          else if (cfg.serial !== 'off') serial = startSerial(hub, { path: cfg.serial, baud: cfg.baud });
          resolve(server.address().port);
        });
      });
    },
    stop() {
      clearInterval(simTimer);
      if (serial) serial.stop();
      for (const c of clients) c.end();
      return new Promise((r) => server.close(r));
    },
  };
}

if (require.main === module) {
  const cfg = config.load();
  const app = createApp(cfg);
  app.start().then((port) => {
    console.log('\nC1 Classroom Comfort prototype (student demo — not an official campus service)');
    console.log(`  Data profile : ${cfg.profile}  (${cfg.dataDir})`);
    console.log(`  Sensors      : ${cfg.sensors === 'simulated' ? 'SIMULATED (no hardware)' : 'Arduino over serial: ' + cfg.serial}`);
    console.log(`  Dashboard    : http://localhost:${port}/          (this laptop only)`);
    console.log(`  QR page      : http://localhost:${port}/qr`);
    for (const a of lanAddresses()) console.log(`  Phone form   : http://${a.address}:${port}/feedback?room=${cfg.room.id}   [${a.name}]`);
    console.log('\nPress Ctrl+C to stop.\n');
  });
  const shutdown = () => app.stop().then(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { createApp, lanAddresses, isReachableLan, csv };
