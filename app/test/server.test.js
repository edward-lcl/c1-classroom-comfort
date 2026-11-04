'use strict';
// End-to-end over HTTP: phone form → API → dashboard state, plus access rules.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../src/config');
const { createApp, csv, isReachableLan } = require('../src/server');

test('feedback reaches the dashboard state; pages and exports work', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-http-'));
  const cfg = config.load(['--data-dir=' + dir, '--serial=off'], {});
  const app = createApp(cfg);
  const port = await app.start(0, '127.0.0.1');
  const base = `http://127.0.0.1:${port}`;
  try {
    for (const p of ['/', '/feedback?room=example-room', '/qr', '/static/style.css', '/static/dashboard.js']) {
      const r = await fetch(base + p);
      assert.equal(r.status, 200, p);
    }
    assert.equal((await fetch(base + '/static/../src/server.js')).status, 404);

    const post = (body) => fetch(base + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post({ id: 'http-test-1', room: 'example-room', temp: 'hot', comment: '=HYPERLINK("x")' })).status, 201);
    assert.equal((await post({ id: 'http-test-1', room: 'example-room', temp: 'hot' })).status, 200); // duplicate tap
    const bad = await fetch(base + '/api/feedback', { method: 'POST', body: '{not json' });
    assert.equal(bad.status, 400);

    const state = await (await fetch(base + '/api/state')).json();
    assert.equal(state.feedback.allTime, 1);
    assert.equal(state.room.id, 'example-room');

    const qr = await (await fetch(base + '/api/qr')).json();
    assert.ok(Array.isArray(qr.urls));
    for (const u of qr.urls) assert.ok(!u.url.includes('localhost') && u.svg.startsWith('<svg'));

    const exp = await (await fetch(base + '/api/export/feedback.csv')).text();
    assert.match(exp, /'=HYPERLINK/); // formula injection neutralised

    const sc = await fetch(base + '/api/scenario', { method: 'POST', body: JSON.stringify({ name: 'stuffy' }) });
    assert.equal(sc.status, 200);
    assert.equal((await fetch(base + '/api/scenario', { method: 'POST', body: JSON.stringify({ name: 'nope' }) })).status, 400);
  } finally {
    await app.stop();
  }
});

test('csv escaping', () => {
  assert.equal(csv([{ a: 'x,y', b: '-1' }], ['a', 'b']), 'a,b\n"x,y",\'-1\n');
});

test('QR addresses skip VPN and link-local ranges', () => {
  assert.equal(isReachableLan('192.168.11.198'), true);
  assert.equal(isReachableLan('10.7.3.20'), true);
  assert.equal(isReachableLan('100.88.46.57'), false); // Tailscale-style VPN
  assert.equal(isReachableLan('169.254.1.2'), false);
});
