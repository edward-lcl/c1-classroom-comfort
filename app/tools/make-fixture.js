'use strict';
// Writes a fixed QA dataset to data/qa-fixture/ (timestamps relative to "now") whose expected
// dashboard answers are listed in docs/DASHBOARD_SPEC.md → Known totals. It triggers every problem rule.
// Run:  node tools/make-fixture.js && tail -f /dev/null | node src/server.js --profile=qa-fixture --serial=stdin --scenario=off
// Then check the dashboard within 10 s (live state); after 10 s the serial values must turn stale.
const fs = require('fs');
const path = require('path');

// Optional argument: profile name (default qa-fixture). `showcase` is used for README screenshots.
const dir = path.join(__dirname, '..', 'data', (process.argv[2] || 'qa-fixture').replace(/[^a-zA-Z0-9_-]/g, ''));
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const now = Date.now();
const iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();
const write = (file, rows) => fs.writeFileSync(path.join(dir, file + '.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

const readings = [];
// Serial samples every 2 s for the last 30 min, with a gap from 20 to 15 min ago (USB unplugged).
for (let s = 30 * 60 + 1; s >= 1; s -= 2) { // every 2 s like the UNO; last sample 1 s ago
  const m = s / 60;
  if (m < 20 && m > 15) continue;
  const values = {
    temperature_aht_c: m <= 1 / 60 ? 24.2 : +(23.6 + 0.6 * (1 - m / 30)).toFixed(1),
    humidity_rh: m <= 1 / 60 ? 51.0 : +(49 + 2 * (1 - m / 30)).toFixed(1),
    light_raw: m <= 1 / 60 ? 700 : Math.round(620 + 80 * (1 - m / 30)),
    ens160_eco2_ppm_equivalent: m <= 1 / 60 ? 640 : Math.round(520 + 120 * (1 - m / 30)),
    ens160_tvoc_ppb: 45,
    ens160_aqi_uba: 2,
  };
  if (m >= 5) values.temperature_lm35_c = 23.4; // LM35 stopped 5 min ago → stale
  readings.push({ at: iso(m), source: 'serial', values, ens: { validity: 'normal', validityLabel: 'Normal operation', usable: true, compensated: true } });
  // Simulated CO₂ rising linearly from 650 to 1250
  readings.push({ at: iso(m), source: 'scenario', values: { simulated_co2_ppm: Math.round(650 + 600 * (1 - (m - 1 / 60) / (30 - 1 / 60))) } });
}
readings.sort((a, b) => a.at.localeCompare(b.at));
write('readings', readings);

write('feedback', [
  { id: 'fx-07', room: 'example-room', temp: 'cold', at: iso(40) },
  { id: 'fx-01', room: 'example-room', temp: 'hot', air: 'stuffy', comment: 'back row warm', at: iso(14) },
  { id: 'fx-02', room: 'example-room', temp: 'hot', at: iso(10) },
  { id: 'fx-03', room: 'example-room', temp: 'hot', air: 'ok', at: iso(6) },
  { id: 'fx-04', room: 'example-room', temp: 'ok', air: 'ok', light: 'ok', at: iso(5) },
  { id: 'fx-05', room: 'example-room', temp: 'ok', comment: 'fine near the door', at: iso(3) },
  { id: 'fx-06', room: 'example-room', air: 'unsure', at: iso(2) },
]);

const opened = { id: 'Afx1', rule: 'sim_co2', title: 'Simulated CO₂ above illustrative level', detail: 'Simulated CO₂ 1213 ppm ≥ 1200 ppm (demo threshold, not measured)', triggerValue: 1213, status: 'open', openedAt: iso(4) };
const review = { action: 'ventilated', actionLabel: 'Opened a window or door', note: 'fixture review', by: 'Demo presenter (role-play, not facilities staff)' };
const old = { id: 'Afx0', rule: 'temperature', title: 'Room may be too warm', detail: 'Temperature 28.4 °C ≥ 28 °C (illustrative comfort threshold)', triggerValue: 28.4, status: 'resolved', openedAt: iso(55), reviewedAt: iso(52), review, resolvedAt: iso(45), resolveValue: 26.8 };
write('alerts', [opened, old]);
write('actions', [{ at: iso(52), alertId: 'Afx0', rule: 'temperature', ...review }]);
write('events', [{ at: iso(0), type: 'fixture written' }]);
console.log('Fixture written to ' + dir);
