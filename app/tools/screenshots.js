'use strict';
// Takes the README screenshots with headless Chrome (via the DevTools protocol, because the dashboard's
// live connection never "finishes loading", which hangs Chrome's simple --screenshot mode).
// The app must already be running on port 3000:
//   node tools/make-fixture.js showcase
//   node tools/fake-uno.js | node src/server.js --serial=stdin --profile=showcase --scenario=stuffy
//   node tools/screenshots.js
// Screenshots therefore show the fake-UNO TEST INPUT, never real hardware. Needs Node 22+ (built-in WebSocket).
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, '..', '..', 'docs', 'screenshots');
const BASE = 'http://localhost:3000';
const PORT = 9333;

// [file, path, width, height, fullPage]
const SHOTS = [
  ['dashboard.png', '/', 1440, 900],
  ['dashboard-zh.png', '/?lang=zh', 1440, 900],
  ['dashboard-light.png', '/?theme=light', 1440, 900],
  ['how-it-works.png', '/#how', 1440, 900],
  ['qr-popup.png', '/#qr', 1440, 900],
  ['setup.png', '/setup', 1100, 900, true],
  ['phone-form.png', '/feedback?room=example-room', 390, 844],
  ['phone-form-zh.png', '/feedback?room=example-room&lang=zh', 390, 844],
  ['dashboard-phone.png', '/', 390, 844, true],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { send, close: () => ws.close() };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [file, url, w, h, full] of SHOTS) {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-shot-')); // fresh: English + dark by default
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
    try {
      let target;
      for (let i = 0; i < 50 && !target; i++) {
        await sleep(200);
        try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* not up yet */ }
      }
      if (!target) throw new Error('Chrome did not start');
      const c = await cdp(target.webSocketDebuggerUrl);
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 600 });
      await c.send('Page.enable');
      await c.send('Page.navigate', { url: BASE + url });
      await sleep(5000); // let live data, history and charts arrive
      let clip;
      if (full) {
        const r = await c.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
        const fullH = Math.min(r.result.result.value, 4000);
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: fullH, deviceScaleFactor: 2, mobile: w < 600 });
        await sleep(800);
        clip = { x: 0, y: 0, width: w, height: fullH, scale: 1 };
      }
      const shot = await c.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      fs.writeFileSync(path.join(OUT, file), Buffer.from(shot.result.data, 'base64'));
      c.close();
      console.log('saved', file);
    } finally {
      chrome.kill();
      await sleep(300);
      fs.rmSync(profile, { recursive: true, force: true });
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
