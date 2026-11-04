'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../src/config');
const { Store } = require('../src/store');
const { Hub } = require('../src/hub');

function setup(extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c1-test-'));
  const cfg = config.load(['--data-dir=' + dir, ...extra], {});
  const clock = { t: Date.parse('2026-11-09T02:00:00Z') };
  const now = () => clock.t;
  const hub = new Hub(cfg, { store: new Store(dir), now });
  return { dir, cfg, clock, hub, now };
}
const sample = (seq, extra = '') => `{"t":"s","v":1,"seq":${seq},"light_raw":500,"aht_ok":1,"aht_t":24.0,"aht_rh":50.0${extra}}`;

test('serial reading is live, then stale after 10 s without data', () => {
  const { hub, clock } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1));
  let s = hub.snapshot();
  assert.equal(s.metrics.temperature_aht_c.freshness, 'live');
  assert.equal(s.metrics.temperature_aht_c.kind, 'physical');
  clock.t += 11000;
  s = hub.snapshot();
  assert.equal(s.metrics.temperature_aht_c.freshness, 'stale');
  assert.equal(s.metrics.temperature_aht_c.value, 24.0); // kept only as "last received"
});

test('USB disconnect immediately marks serial values stale', () => {
  const { hub } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1));
  hub.setSerialState('disconnected', { lastError: 'unplugged' });
  assert.equal(hub.snapshot().metrics.light_raw.freshness, 'stale');
});

test('a working light sensor does not make simulated CO2 look live-measured', () => {
  const { hub } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1));
  hub.simTick();
  const s = hub.snapshot();
  assert.equal(s.metrics.light_raw.kind, 'physical');
  assert.equal(s.metrics.simulated_co2_ppm.kind, 'simulated');
  assert.equal(s.metrics.ens160_eco2_ppm_equivalent.value, undefined);
});

test('ENS160 values are tagged as estimates with validity status', () => {
  const { hub } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1, ',"ens_ok":1,"ens_val":2,"ens_eco2":700,"ens_tvoc":50,"ens_aqi":2'));
  const s = hub.snapshot();
  assert.equal(s.metrics.ens160_eco2_ppm_equivalent.kind, 'estimate');
  assert.equal(s.ens.validity, 'initial-start-up');
  assert.equal(s.ens.usable, false);
});

test('malformed lines are counted and do not crash or change readings', () => {
  const { hub } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1));
  hub.ingestLine('{"t":"s","v":1,"seq":');
  hub.ingestLine('\u0000ÿ');
  const s = hub.snapshot();
  assert.equal(s.serial.malformed, 2);
  assert.equal(s.metrics.temperature_aht_c.value, 24.0);
});

test('stuffy scenario raises ONE simulated-CO2 alert; review is logged; ventilation scenario resolves it', () => {
  const { hub, clock } = setup();
  hub.setScenario('stuffy');
  for (let i = 0; i < 120; i++) {
    clock.t += 2000;
    hub.simTick();
  }
  let s = hub.snapshot();
  assert.equal(s.alerts.active.length, 1);
  const a = s.alerts.active[0];
  assert.equal(a.rule, 'sim_co2');
  assert.equal(hub.reviewAlert(a.id, { action: 'bogus' }).status, 400);
  assert.equal(hub.reviewAlert(a.id, { action: 'thermostat', note: 'set both thermostats to 24 °C' }).status, 200);
  s = hub.snapshot();
  assert.equal(s.alerts.active[0].status, 'reviewed');
  assert.equal(s.actions[0].note, 'set both thermostats to 24 °C');
  assert.equal(s.actions[0].actionLabel, 'Adjusted the thermostat(s) ourselves');
  hub.setScenario('ventilated');
  for (let i = 0; i < 120; i++) {
    clock.t += 2000;
    hub.simTick();
  }
  s = hub.snapshot();
  assert.equal(s.alerts.active.length, 0);
  assert.equal(s.alerts.recent[0].status, 'resolved');
  assert.equal(s.alerts.recent.length, 1, 'no repeated alerts');
});

test('a single noisy temperature spike does not raise an alert', () => {
  const { hub, clock } = setup();
  hub.setSerialState('connected', { port: 'test' });
  const t = (seq, temp) => `{"t":"s","v":1,"seq":${seq},"aht_ok":1,"aht_t":${temp},"aht_rh":50}`;
  hub.ingestLine(t(1, 24));
  clock.t += 2000;
  hub.ingestLine(t(2, 31)); // spike
  clock.t += 2000;
  hub.ingestLine(t(3, 24));
  assert.equal(hub.snapshot().alerts.active.length, 0);
  for (let i = 4; i < 10; i++) {
    clock.t += 2000;
    hub.ingestLine(t(i, 29));
  }
  assert.equal(hub.snapshot().alerts.active[0].rule, 'temperature');
});

test('feedback: validation, double-tap dedupe, per-device cooldown and alert', () => {
  const { hub, clock } = setup();
  const room = 'example-room';
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room, temp: 'boiling' }, 'p1').status, 400);
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room }, 'p1').status, 400);
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room: 'other', temp: 'hot' }, 'p1').status, 400);
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room, temp: 'hot', comment: 'x'.repeat(201) }, 'p1').status, 400);
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room, temp: 'hot', comment: '<img src=x onerror=alert(1)>' }, 'p1').status, 201);
  assert.equal(hub.addFeedback({ id: 'abcdefgh1', room, temp: 'hot' }, 'p1').duplicate, true); // double tap
  assert.equal(hub.addFeedback({ id: 'abcdefgh2', room, temp: 'hot' }, 'p1').status, 429); // same phone too soon
  hub.addFeedback({ id: 'abcdefgh3', room, temp: 'hot' }, 'p2');
  assert.equal(hub.snapshot().alerts.active.length, 0);
  hub.addFeedback({ id: 'abcdefgh4', room, air: 'stuffy', temp: 'hot' }, 'p3');
  const s = hub.snapshot();
  assert.equal(s.feedback.lastHour.total, 3);
  assert.equal(s.alerts.active[0].rule, 'feedback');
  assert.equal(s.feedback.recent[2].comment, '<img src=x onerror=alert(1)>'); // stored as text; escaped on display
  clock.t += 16 * 60000; // window moves on
  hub.simTick();
  assert.equal(hub.snapshot().alerts.active.length, 0);
});

test('restart keeps feedback, reviews, alerts and history', () => {
  const { dir, cfg, clock, hub, now } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(1));
  hub.addFeedback({ id: 'restart-1', room: 'example-room', air: 'stuffy' }, 'p1');
  hub.setScenario('stuffy');
  for (let i = 0; i < 120; i++) {
    clock.t += 2000;
    hub.simTick();
  }
  const id = hub.snapshot().alerts.active[0].id;
  hub.reviewAlert(id, { action: 'no_change' });

  const hub2 = new Hub(cfg, { store: new Store(dir), now });
  const s = hub2.snapshot();
  assert.equal(s.feedback.allTime, 1);
  assert.equal(s.actions.length, 1);
  assert.equal(s.alerts.active[0].id, id);
  assert.equal(s.alerts.active[0].status, 'reviewed');
  assert.ok(hub2.historySnapshot().simulated_co2_ppm.length > 100);
  // After restart nothing is connected yet, so restored serial values must not look live.
  assert.equal(s.metrics.temperature_aht_c.freshness, 'stale');
  // Even once the port reconnects, they stay stale until a NEW sample arrives.
  hub2.setSerialState('connected', { port: 'test' });
  assert.equal(hub2.snapshot().metrics.temperature_aht_c.freshness, 'stale');
  hub2.ingestLine(sample(2));
  assert.equal(hub2.snapshot().metrics.temperature_aht_c.freshness, 'live');
});

test('board restart (boot message / sequence reset) is handled', () => {
  const { hub, dir } = setup();
  hub.setSerialState('connected', { port: 'test' });
  hub.ingestLine(sample(10));
  hub.ingestLine('{"t":"boot","v":1,"fw":"c1-station 1.0","ldr":1,"lm35":1,"aht":1,"ens":1}');
  hub.ingestLine(sample(0));
  assert.equal(hub.snapshot().serial.restarts, 1);
  assert.equal(hub.snapshot().metrics.light_raw.freshness, 'live');
  const events = fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8');
  assert.match(events, /board boot message/);
});

test('simulated sensor mode labels everything as simulated and ignores serial', () => {
  const { hub } = setup(['--sensors=simulated']);
  hub.simTick();
  hub.ingestLine(sample(1));
  const s = hub.snapshot();
  assert.equal(s.metrics.temperature_aht_c.kind, 'simulated');
  assert.equal(s.metrics.light_raw.kind, 'simulated');
});
