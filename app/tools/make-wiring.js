'use strict';
// Generates the wiring diagrams (SVG) used by the /setup page and the docs:
//   node tools/make-wiring.js
// Drawn from the group's real parts (photos, 4 Nov 2026): Keyestudio UNO R3 (KS0069 kit),
// 830-hole breadboard (rows a–e next to the bottom rails), LM35DZ, photoresistor + 10 kΩ,
// Mingwu ENS160+AHT21 module (pins VIN 3V3 GND SCL SDA ADD CS INT).
// Wire colours are a suggestion; every wire is also labelled, so colour is never the only cue.
const fs = require('fs');
const path = require('path');

const OUT = [path.join(__dirname, '..', 'public', 'wiring'), path.join(__dirname, '..', '..', 'docs', 'wiring')];
const C = { ink: '#1b2330', muted: '#5d6878', board: '#f4f4f1', hole: '#9aa1ab', red: '#d23f45', black: '#2a2a2e', green: '#1e8a4c', yellow: '#c48600', blue: '#3e63dd', purple: '#8a4bc4', uno: '#1b1d22', unoPin: '#f2c230' };
const font = 'font-family="-apple-system, Segoe UI, PingFang SC, sans-serif"';

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n<title>${title}</title>\n<rect width="${w}" height="${h}" fill="#ffffff"/>\n${body}\n</svg>\n`;
const text = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${font} font-size="${o.size || 12}" fill="${o.fill || C.ink}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}>${s}</text>`;
const wire = (pts, color, label, lx, ly) =>
  `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` +
  (label ? text(lx, ly, label, { size: 11, fill: color, weight: 600 }) : '');

// ---------- breadboard (columns 1..N of the lower half: rows e,d,c,b,a + bottom rails) ----------
function breadboard(x0, y0, cols, opts = {}) {
  const P = 16; // hole pitch
  const pos = (col, row) => {
    const r = { e: 0, d: 1, c: 2, b: 3, a: 4, '-': 5.9, '+': 6.9 }[row];
    return [x0 + 30 + (col - 1) * P, y0 + 30 + r * P];
  };
  let s = `<rect x="${x0}" y="${y0}" width="${30 + cols * P + 10}" height="${30 + 8 * P}" rx="8" fill="${C.board}" stroke="#d6d6d0"/>`;
  for (let c = 1; c <= cols; c++) {
    for (const r of ['e', 'd', 'c', 'b', 'a', '-', '+']) {
      const [x, y] = pos(c, r);
      s += `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" rx="1" fill="${C.hole}"/>`;
    }
    if (c % 5 === 0 || c === 1) s += text(pos(c, 'e')[0], y0 + 18, c, { size: 10, fill: C.muted, anchor: 'middle' });
  }
  for (const r of ['e', 'd', 'c', 'b', 'a']) s += text(x0 + 14, pos(1, r)[1] + 4, r, { size: 10, fill: C.muted, anchor: 'middle' });
  const [, ym] = pos(1, '-');
  const [, yp] = pos(1, '+');
  s += `<line x1="${x0 + 22}" x2="${x0 + 30 + cols * P}" y1="${ym - 9}" y2="${ym - 9}" stroke="${C.blue}" stroke-width="1.5"/>`;
  s += `<line x1="${x0 + 22}" x2="${x0 + 30 + cols * P}" y1="${yp + 9}" y2="${yp + 9}" stroke="${C.red}" stroke-width="1.5"/>`;
  s += text(x0 + 12, ym + 4, '−', { size: 13, fill: C.blue, anchor: 'middle', weight: 700 });
  s += text(x0 + 12, yp + 4, '+', { size: 13, fill: C.red, anchor: 'middle', weight: 700 });
  return { s, pos };
}

// ---------- UNO header strip (bottom edge, as printed on the Keyestudio UNO R3) ----------
function unoHeader(x0, y0) {
  const pins = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin', '', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
  const W = 26;
  let s = `<rect x="${x0 - 14}" y="${y0 - 6}" width="${pins.length * W + 14}" height="78" rx="8" fill="${C.uno}"/>`;
  s += text(x0 + 2 * W, y0 + 66, 'POWER', { size: 10, fill: C.unoPin, anchor: 'middle', weight: 700 });
  s += text(x0 + 10.5 * W, y0 + 66, 'ANALOG IN', { size: 10, fill: C.unoPin, anchor: 'middle', weight: 700 });
  s += text(x0 - 24, y0 + 24, 'Arduino UNO R3', { size: 11, fill: C.muted, anchor: 'end', weight: 600 }) + text(x0 - 24, y0 + 39, '(Keyestudio)', { size: 10, fill: C.muted, anchor: 'end' }) + text(x0 - 24, y0 + 54, 'pins as printed', { size: 10, fill: C.muted, anchor: 'end' });
  const at = {};
  pins.forEach((p, i) => {
    if (!p) return;
    const x = x0 + i * W;
    s += `<rect x="${x - 7}" y="${y0}" width="14" height="14" rx="2" fill="${C.unoPin}"/><rect x="${x - 3}" y="${y0 + 4}" width="6" height="6" fill="#3a3a3a"/>`;
    s += `<text x="${x}" y="${y0 + 22}" ${font} font-size="9" fill="#ffffff" text-anchor="end" transform="rotate(-90 ${x} ${y0 + 22}) translate(-2 3)">${p}</text>`;
    at[p + (at[p] ? '_2' : '')] = [x, y0 + 7];
  });
  return { s, at };
}

// ---------- 1. Breadboard: rails + LDR + LM35 ----------
function analogBreadboard() {
  const bb = breadboard(20, 120, 30);
  const uno = unoHeader(250, 430);
  let s = bb.s;
  const p = bb.pos;
  // Rails from the UNO
  s += wire([uno.at['5V'], [uno.at['5V'][0], 392], [p(30, '+')[0] + 34, 392], [p(30, '+')[0] + 34, p(30, '+')[1]], p(30, '+')], C.red, '', 0, 0);
  s += wire([uno.at['GND'], [uno.at['GND'][0], 380], [p(30, '-')[0] + 22, 380], [p(30, '-')[0] + 22, p(30, '-')[1]], p(30, '-')], C.black, '', 0, 0);
  // LDR: legs e20, e22 (body above the board edge for clarity)
  s += `<line x1="${p(20, 'e')[0]}" y1="${p(20, 'e')[1]}" x2="${p(21, 'e')[0] - 4}" y2="${p(20, 'e')[1] - 22}" stroke="#888" stroke-width="2"/><line x1="${p(22, 'e')[0]}" y1="${p(22, 'e')[1]}" x2="${p(21, 'e')[0] + 4}" y2="${p(22, 'e')[1] - 22}" stroke="#888" stroke-width="2"/>`;
  s += `<ellipse cx="${p(21, 'e')[0]}" cy="${p(21, 'e')[1] - 28}" rx="13" ry="10" fill="#e9c9b9" stroke="#b5654b"/><path d="M${p(21, 'e')[0] - 8} ${p(21, 'e')[1] - 28} q3 -6 6 0 t6 0 t6 0" stroke="#b5654b" fill="none"/>`;
  s += text(p(21, 'e')[0], p(21, 'e')[1] - 44, 'LDR', { size: 11, anchor: 'middle', weight: 600 });
  // 10k resistor d22–d26
  const [r1x, ry] = p(22, 'd');
  const [r2x] = p(26, 'd');
  s += `<line x1="${r1x}" y1="${ry}" x2="${r2x}" y2="${ry}" stroke="#888" stroke-width="2"/><rect x="${(r1x + r2x) / 2 - 16}" y="${ry - 6}" width="32" height="12" rx="5" fill="#5aa7d6"/>`;
  s += text(r2x + 10, ry + 4, '10 kΩ', { size: 11, weight: 600 });
  // jumpers on the board
  s += wire([p(20, 'a'), p(20, '+')], C.red, '', 0, 0);
  s += wire([p(26, 'a'), p(26, '-')], C.black, '', 0, 0);
  s += wire([p(22, 'a'), [p(22, 'a')[0] - 4, p(22, 'a')[1]], [p(22, 'a')[0] - 4, 404], [uno.at.A1[0], 404], [uno.at.A1[0], uno.at.A1[1]]], C.green, '', 0, 0);
  // LM35 at e10 (+Vs), e11 (Vout), e12 (GND), flat face toward you
  const [lx, ly] = p(11, 'e');
  for (const c of [10, 11, 12]) s += `<line x1="${p(c, 'e')[0]}" y1="${ly}" x2="${lx + (c - 11) * 5}" y2="${ly - 22}" stroke="#888" stroke-width="2"/>`;
  s += `<path d="M${lx - 12} ${ly - 22} h24 v-16 a12 9 0 0 0 -24 0 z" fill="#1b1d22"/>`;
  s += text(lx, ly - 27, 'LM35', { size: 7, fill: '#ddd', anchor: 'middle' });
  s += text(lx, ly - 52, 'LM35DZ', { size: 11, anchor: 'middle', weight: 600 });
  s += text(p(10, 'e')[0] - 2, ly + 2 - 30, '+Vs', { size: 9, fill: C.red, anchor: 'end' });
  s += text(p(12, 'e')[0] + 2, ly + 2 - 30, 'GND', { size: 9, fill: C.black });
  s += wire([p(10, 'a'), p(10, '+')], C.red, '', 0, 0);
  s += wire([p(12, 'a'), p(12, '-')], C.black, '', 0, 0);
  s += wire([p(11, 'a'), [p(11, 'a')[0] + 4, p(11, 'a')[1]], [p(11, 'a')[0] + 4, 416], [uno.at.A0[0], 416], [uno.at.A0[0], uno.at.A0[1]]], C.yellow, '', 0, 0);
  s += uno.s;
  // Make the destination pins unmistakable: a coloured ring on each used UNO pin and a labelled tag under it.
  [['5V', C.red, '5V', 0], ['GND', C.black, 'GND', 1], ['A0', C.yellow, 'A0', 0], ['A1', C.green, 'A1', 1]].forEach(([pin, col, label, lower]) => {
    const [px, py] = uno.at[pin];
    const ty = py + 82 + lower * 28; // neighbouring pins get staggered tags so they never overlap
    s += `<rect x="${px - 10}" y="${py - 10}" width="20" height="20" rx="4" fill="none" stroke="${col === C.black ? '#ffffff' : col}" stroke-width="2.5"/>`;
    s += `<line x1="${px}" y1="${py + 66}" x2="${px}" y2="${ty}" stroke="${col}" stroke-width="2"/>`;
    s += `<rect x="${px - 20}" y="${ty}" width="40" height="22" rx="6" fill="${col}"/>` + text(px, ty + 15, label, { size: 12, fill: '#ffffff', anchor: 'middle', weight: 700 });
  });
  // connection key (instead of labels on top of wires)
  const key = [
    [C.red, 'UNO 5V → + rail (red line)'], [C.black, 'UNO GND → − rail (blue line)'],
    [C.red, 'a20 → + rail · a10 → + rail'], [C.black, 'a26 → − rail · a12 → − rail'],
    [C.green, 'a22 → UNO A1 (LDR/resistor junction)'], [C.yellow, 'a11 → UNO A0 (LM35 Vout)'],
  ];
  s += text(600, 140, 'Connections', { size: 13, weight: 700 });
  key.forEach(([col, label], i) => {
    s += `<line x1="600" x2="626" y1="${162 + i * 22}" y2="${162 + i * 22}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>` + text(634, 166 + i * 22, label, { size: 11.5 });
  });
  s += text(600, 310, 'Parts', { size: 13, weight: 700 });
  ['LDR legs: e20, e22 (no polarity)', '10 kΩ: d22 → d26 (no polarity)', 'LM35DZ: e10 +Vs · e11 Vout · e12 GND', '   (flat printed face toward you)'].forEach((l, i) => (s += text(600, 332 + i * 20, l, { size: 11.5 })));
  s += text(20, 24, 'Breadboard wiring: photoresistor (A1) and LM35 (A0)', { size: 15, weight: 700 });
  s += text(20, 600, 'Holes a–e with the same number are connected. Rails run along the length (+ red, − blue). Unplug USB before wiring.', { size: 11, fill: C.muted });
  return svg(900, 614, s, 'Breadboard wiring for photoresistor and LM35');
}

// ---------- 2. Schematics ----------
function schematics() {
  let s = text(20, 26, 'Circuits (electrical view)', { size: 15, weight: 700 });
  // LDR divider
  s += text(20, 56, 'A. Photoresistor voltage divider → A1', { size: 12, weight: 600 });
  const y = 100;
  s += `<circle cx="40" cy="${y}" r="4" fill="none" stroke="${C.ink}"/>` + text(40, y - 12, '5V', { anchor: 'middle', weight: 600 });
  s += `<line x1="44" y1="${y}" x2="80" y2="${y}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<circle cx="102" cy="${y}" r="20" fill="#fff" stroke="${C.ink}" stroke-width="2"/><path d="M88 ${y} l4 -6 l4 12 l4 -12 l4 12 l4 -12 l4 6" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="M86 ${y - 32} l8 9 M94 ${y - 34} l8 9" stroke="${C.yellow}" stroke-width="2"/>` + text(102, y + 36, 'LDR', { anchor: 'middle', size: 11 });
  s += `<line x1="122" y1="${y}" x2="190" y2="${y}" stroke="${C.ink}" stroke-width="2"/><circle cx="160" cy="${y}" r="4" fill="${C.ink}"/>`;
  s += `<line x1="160" y1="${y}" x2="160" y2="${y + 40}" stroke="${C.green}" stroke-width="2"/>` + text(160, y + 56, 'A1', { anchor: 'middle', fill: C.green, weight: 700 });
  s += `<path d="M190 ${y} l5 -7 l6 14 l6 -14 l6 14 l6 -14 l6 14 l5 -7" fill="none" stroke="${C.ink}" stroke-width="2"/>` + text(215, y - 14, '10 kΩ', { anchor: 'middle', size: 11 });
  s += `<line x1="240" y1="${y}" x2="270" y2="${y}" stroke="${C.ink}" stroke-width="2"/><circle cx="274" cy="${y}" r="4" fill="none" stroke="${C.ink}"/>` + text(274, y - 12, 'GND', { anchor: 'middle', weight: 600 });
  s += text(20, 186, 'More light → lower LDR resistance →', { size: 11, fill: C.muted }) + text(20, 201, 'higher voltage at A1 → higher number (0–1023).', { size: 11, fill: C.muted });
  // LM35
  s += text(340, 56, 'B. LM35DZ temperature sensor → A0', { size: 12, weight: 600 });
  s += `<rect x="350" y="74" width="110" height="58" rx="6" fill="#1b1d22"/>` + text(405, 98, 'LM35DZ', { size: 11, fill: '#fff', anchor: 'middle', weight: 600 }) + text(405, 114, 'flat face', { size: 9, fill: '#bbb', anchor: 'middle' });
  const legs = [['1 +Vs', '5V', C.red], ['2 Vout', 'A0', C.yellow], ['3 GND', 'GND', C.black]];
  legs.forEach(([pin, to, col], i) => {
    const x = 368 + i * 37;
    s += `<line x1="${x}" y1="132" x2="${x}" y2="165" stroke="#888" stroke-width="2.5"/>`;
    s += text(x, 180, pin, { size: 9.5, anchor: 'middle' }) + text(x, 196, '→ ' + to, { size: 10, anchor: 'middle', fill: col, weight: 700 });
  });
  s += text(480, 92, 'Hold it with the printed flat face', { size: 11, fill: C.muted });
  s += text(480, 107, 'toward you, legs down: left = +Vs,', { size: 11, fill: C.muted });
  s += text(480, 122, 'middle = Vout, right = GND.', { size: 11, fill: C.muted });
  s += text(480, 140, 'Check TI datasheet figure (LP package).', { size: 11, fill: C.muted });
  s += text(480, 155, 'Reversed = gets hot within seconds.', { size: 11, fill: C.red, weight: 600 });
  s += text(340, 226, 'T(°C) = raw × 5.0 / 1024 × 100  (≈ 0.49 °C per step)', { size: 11, fill: C.muted });
  return svg(760, 240, s, 'Schematics for photoresistor divider and LM35');
}

// ---------- 3. ENS160+AHT21 module to UNO ----------
function i2cModule() {
  let s = text(20, 26, 'ENS160 + AHT21 module (Mingwu) → UNO I²C — only after the checks in HARDWARE_GUIDE §3', { size: 14, weight: 700 });
  // module
  s += `<rect x="40" y="60" width="210" height="190" rx="10" fill="#2f78b7"/>`;
  s += `<rect x="150" y="95" width="34" height="30" rx="3" fill="#d9dde3"/>` + text(167, 140, 'ENS160', { size: 9, fill: '#fff', anchor: 'middle' });
  s += `<rect x="190" y="160" width="30" height="24" rx="3" fill="#d9dde3"/>` + text(205, 198, 'AHT21', { size: 9, fill: '#fff', anchor: 'middle' });
  const pins = ['VIN', '3V3', 'GND', 'SCL', 'SDA', 'ADD', 'CS', 'INT'];
  const conn = { VIN: ['5V', C.red, 'only if §3 checks pass'], GND: ['GND', C.black, ''], SCL: ['A5 / SCL', C.purple, ''], SDA: ['A4 / SDA', C.blue, ''] };
  pins.forEach((p, i) => {
    const y = 74 + i * 22;
    s += `<circle cx="60" cy="${y}" r="6" fill="#d9c27a" stroke="#8a7a3a"/>` + text(74, y + 4, p, { size: 11, fill: '#fff', weight: 600 });
    if (conn[p]) {
      const [to, col, note] = conn[p];
      s += `<line x1="250" y1="${y}" x2="420" y2="${y}" stroke="${col}" stroke-width="3.5" stroke-dasharray="${p === 'VIN' ? '7 4' : ''}"/>`;
      s += `<rect x="420" y="${y - 10}" width="86" height="20" rx="4" fill="${C.uno}"/>` + text(463, y + 4, to, { size: 11, fill: C.unoPin, anchor: 'middle', weight: 700 });
      if (note) s += text(516, y + 4, note, { size: 10.5, fill: C.red, weight: 600 });
    } else {
      s += text(260, y + 4, p === '3V3' ? 'leave unconnected (regulator output)' : p === 'INT' ? 'leave unconnected (not used)' : 'leave unconnected; measure (see below)', { size: 10.5, fill: C.muted });
    }
  });
  s += `<path d="M250 0" />`;
  s += text(40, 282, 'Header row as printed on the module: VIN · 3V3 · GND · SCL · SDA · ADD · CS · INT (check your board — labels win over this picture).', { size: 11, fill: C.muted });
  s += text(40, 300, 'ADD: high ≈ address 0x53, low ≈ 0x52 (the sketch tries both).  CS must read high (I²C mode).  AHT21 answers at 0x38.', { size: 11, fill: C.muted });
  s += text(40, 318, 'If SDA/SCL measure ≈ 0 V with the module powered: no pull-ups — add 4.7 kΩ from SDA and SCL to 3.3 V (never to 5 V).', { size: 11, fill: C.muted });
  return svg(820, 336, s, 'ENS160 plus AHT21 module to Arduino UNO I2C wiring');
}

// ---------- 4. System overview ----------
function system() {
  const box = (x, y, w, h, title, sub, col = C.ink) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#f6f7f9" stroke="${col}" stroke-width="1.5"/>` +
    text(x + w / 2, y + 24, title, { anchor: 'middle', weight: 700, size: 13, fill: col }) +
    sub.map((l, i) => text(x + w / 2, y + 44 + i * 15, l, { anchor: 'middle', size: 11, fill: C.muted })).join('');
  const arrow = (x1, y1, x2, y2, label, ly) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="2" marker-end="url(#ar)"/>` + (label ? text((x1 + x2) / 2, ly ?? y1 - 8, label, { anchor: 'middle', size: 10.5, fill: C.muted }) : '');
  let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker></defs>`;
  s += text(20, 26, 'C1 system overview — Sensing → Networking → Data analysis → Application', { size: 15, weight: 700 });
  s += text(110, 58, 'SENSING LAYER', { size: 10, fill: C.muted, anchor: 'middle', weight: 700 }) + text(380, 58, 'NETWORKING', { size: 10, fill: C.muted, anchor: 'middle', weight: 700 }) + text(560, 58, 'DATA ANALYSIS', { size: 10, fill: C.muted, anchor: 'middle', weight: 700 }) + text(790, 58, 'APPLICATION', { size: 10, fill: C.muted, anchor: 'middle', weight: 700 });
  s += box(20, 70, 180, 120, 'Sensors', ['Photoresistor (A1)', 'LM35DZ (A0)', 'ENS160 + AHT21 (I²C)', 'measured · estimate']);
  s += box(20, 210, 180, 70, 'Arduino UNO R3', ['reads every 2 s', 'prints 1 JSON line']);
  s += arrow(110, 190, 110, 208);
  s += box(450, 70, 220, 210, 'Laptop app (Node.js)', ['serial bridge (USB)', 'validates each line', 'freshness: stale after 10 s', 'rules + hysteresis (no AI)', 'simulated CO₂ (labelled)', 'saves JSON Lines files', 'web server'], C.blue);
  s += arrow(200, 245, 448, 245, 'USB serial cable', 238);
  s += box(720, 70, 180, 100, 'Staff dashboard', ['readings + feedback', '“Needs review” prompt', 'review log']);
  s += box(720, 190, 180, 90, 'Student phone', ['scans QR → form', '(same Wi-Fi / hotspot)']);
  s += arrow(670, 120, 718, 120, 'web page', 112);
  s += arrow(718, 235, 672, 235, 'feedback', 228);
  s += box(720, 300, 180, 64, 'Person reviews room', ['opens window / checks AC', 'logs what was done'], C.yellow);
  s += `<polyline points="900,130 912,130 912,332 902,332" fill="none" stroke="${C.ink}" stroke-width="2" marker-end="url(#ar)"/>` + text(906, 300, 'prompt', { size: 10.5, fill: C.muted, anchor: 'end' });
  s += text(20, 330, 'No cloud, no AI: one classroom, small data, rules a person can explain. Does not control the AC.', { size: 11, fill: C.muted });
  return svg(930, 380, s, 'C1 system overview');
}

const files = { 'breadboard-analog.svg': analogBreadboard(), 'schematics.svg': schematics(), 'ens160-aht21-i2c.svg': i2cModule(), 'system-overview.svg': system() };
for (const dir of OUT) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
}
console.log('Wrote', Object.keys(files).join(', '), 'to', OUT.join(' and '));
