'use strict';
// The hub holds the current state of the example room and is the only place that changes it.
// Inputs:  serial lines from the UNO, simulator ticks, feedback submissions, review actions.
// Outputs: a snapshot for the dashboard, and records appended to the data files.

const { parseLine } = require('./protocol');
const { AlertEngine } = require('./alerts');
const { Simulator, SCENARIOS } = require('./simulation');
const fb = require('./feedback');

// How every metric is described. `kind` says what sort of value it is when it comes from the UNO.
const METRICS = {
  temperature_aht_c: { label: 'Temperature (AHT20)', unit: '°C' },
  temperature_lm35_c: { label: 'Temperature (LM35)', unit: '°C' },
  humidity_rh: { label: 'Humidity (AHT20)', unit: '%RH' },
  light_raw: { label: 'Relative light (photoresistor)', unit: 'ADC counts 0–1023, not lux' },
  ens160_eco2_ppm_equivalent: { label: 'eCO₂ estimate (ENS160)', unit: 'ppm-equivalent, estimate — not measured CO₂' },
  ens160_tvoc_ppb: { label: 'TVOC estimate (ENS160)', unit: 'ppb' },
  ens160_aqi_uba: { label: 'Air-quality index (ENS160, UBA 1–5)', unit: '' },
  simulated_co2_ppm: { label: 'Simulated CO₂, not measured', unit: 'ppm (synthetic)' },
};

// physical = a real sensor measurement; estimate = a sensor's derived estimate (ENS160);
// simulated = synthetic demo data.
function kindOf(metric, source) {
  if (source === 'serial') return metric.startsWith('ens160') ? 'estimate' : 'physical';
  return 'simulated';
}

// What people really do in a classroom (several thermostats, unclear controls, sometimes you ask instead).
const REVIEW_ACTIONS = {
  thermostat: 'Adjusted the thermostat(s) ourselves',
  teacher: 'Asked the teacher',
  hvac: 'Reported to facilities (AC / heating check)',
  ventilated: 'Opened a window or door',
  no_change: 'Checked the room — no change needed',
  other: 'Other',
};

class Hub {
  constructor(cfg, { store, now = () => Date.now() }) {
    this.cfg = cfg;
    this.store = store;
    this.now = now;
    this.listeners = new Set();
    this.metrics = {};
    this.history = {};
    this.ens = null;
    this.serial = { state: cfg.serial === 'off' ? 'disabled' : 'searching', port: null, since: this.iso(), firmware: null, enabled: null, lastLineAt: null, lastSampleAt: null, malformed: 0, lastMalformed: null, lastProblems: [], lastDeviceMessage: null, restarts: 0 };
    this.lastSeq = null;
    this.feedback = [];
    this.actions = [];
    this.cooldown = new Map();
    this.sim = new Simulator({ now, sensors: cfg.sensors === 'simulated' });
    this.alerts = new AlertEngine(cfg.alerts, {
      now,
      onChange: (a, what) => {
        this.store.append('alerts', a);
        this.logEvent(`alert ${what}`, { id: a.id, rule: a.rule });
      },
    });
    this.restore();
    // Continue simulated CO₂ from where the last run stopped, so restarting does not jump back to 650.
    const last = this.metrics.simulated_co2_ppm;
    if (last) this.sim.lastCo2 = last.value;
    this.sim.set(SCENARIOS[cfg.scenario] ? cfg.scenario : 'normal');
  }

  iso(ms = this.now()) {
    return new Date(ms).toISOString();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  changed() {
    for (const fn of this.listeners) fn();
  }

  logEvent(type, detail = {}) {
    this.store.append('events', { at: this.iso(), type, ...detail });
  }

  // ---- restore after restart -------------------------------------------------------------
  restore() {
    const since = this.now() - this.cfg.historyMinutes * 60000;
    for (const r of this.store.readAll('readings', { since })) {
      this.applyValues(r.source, r.values, Date.parse(r.at), false);
      if (r.ens) this.ens = { ...r.ens, at: r.at };
    }
    this.feedback = this.store.readAll('feedback');
    this.actions = this.store.readAll('actions');
    this.alerts.restore(this.store.readAll('alerts'));
    this.logEvent('app started', { profile: this.cfg.profile, sensors: this.cfg.sensors, serial: this.cfg.serial });
  }

  // ---- inputs ----------------------------------------------------------------------------
  ingestLine(line) {
    const at = this.now();
    this.serial.lastLineAt = this.iso(at);
    const r = parseLine(line);
    if (!r.ok) {
      if (r.reason === 'comment') this.serial.lastDeviceMessage = r.comment;
      else if (r.reason !== 'empty line') {
        this.serial.malformed++;
        this.serial.lastMalformed = { at: this.iso(at), reason: r.reason, sample: String(line).slice(0, 60) };
      }
      this.changed();
      return r;
    }
    if (r.kind === 'boot') {
      this.serial.firmware = r.firmware;
      this.serial.enabled = r.enabled;
      this.serial.restarts++;
      this.lastSeq = null;
      this.logEvent('board boot message', { firmware: r.firmware, enabled: r.enabled });
    } else if (r.kind === 'error') {
      this.serial.lastDeviceMessage = r.message;
      this.logEvent('board error', { message: r.message });
    } else {
      if (this.lastSeq !== null && r.seq <= this.lastSeq) this.logEvent('sequence reset (board restarted?)', { seq: r.seq, previous: this.lastSeq });
      this.lastSeq = r.seq;
      this.serial.lastSampleAt = this.iso(at);
      this.serial.lastProblems = r.problems;
      if (r.ens) this.ens = { ...r.ens, at: this.iso(at) };
      if (this.cfg.sensors === 'serial') this.recordSample('serial', r.fields, r.ens, r.seq);
    }
    this.changed();
    return r;
  }

  setSerialState(state, info = {}) {
    const prev = this.serial.state;
    Object.assign(this.serial, { state, since: this.iso() }, info);
    if (prev !== state) this.logEvent(`serial ${state}`, info);
    this.changed();
  }

  simTick() {
    const r = this.sim.tick();
    if (r.simulated_co2_ppm !== null) {
      this.recordSample('scenario', { simulated_co2_ppm: r.simulated_co2_ppm });
      this.alerts.sample('sim_co2', r.simulated_co2_ppm);
    }
    if (r.sensors) this.recordSample('simulator', r.sensors);
    this.checkFeedbackRule();
    this.changed();
  }

  setScenario(name) {
    this.sim.set(name);
    this.logEvent('scenario changed', { scenario: name });
    this.changed();
  }

  recordSample(source, values, ens, seq) {
    if (!values || !Object.keys(values).length) return;
    const at = this.now();
    this.applyValues(source, values, at, true);
    const rec = { at: this.iso(at), source, values };
    if (ens) rec.ens = ens;
    if (seq !== undefined) rec.seq = seq;
    this.store.append('readings', rec);
    if (source !== 'scenario') {
      const t = this.primaryTemperature();
      if (t && t.at === at) this.alerts.sample('temperature', t.value);
    }
  }

  applyValues(source, values, at, live) {
    for (const [k, v] of Object.entries(values)) {
      if (!METRICS[k] || typeof v !== 'number') continue;
      this.metrics[k] = { value: v, at, source, kind: kindOf(k, source) };
      const h = (this.history[k] ||= []);
      h.push([at, v]);
      const cutoff = at - this.cfg.historyMinutes * 60000;
      while (h.length && h[0][0] < cutoff) h.shift();
    }
    if (live) this.trimHistory();
  }

  trimHistory() {
    const cutoff = this.now() - this.cfg.historyMinutes * 60000;
    for (const h of Object.values(this.history)) while (h.length && h[0][0] < cutoff) h.shift();
  }

  addFeedback(body, deviceKey) {
    const { error, entry } = fb.validate(body, { roomId: this.cfg.room.id, commentMax: this.cfg.feedback.commentMax });
    if (error) return { status: 400, error };
    if (this.feedback.some((f) => f.id === entry.id)) return { status: 200, duplicate: true }; // double tap
    const last = this.cooldown.get(deviceKey);
    if (last && this.now() - last < this.cfg.feedback.perDeviceCooldownMs) {
      return { status: 429, error: 'Thanks — we just received feedback from this device. Please wait a few seconds.' };
    }
    this.cooldown.set(deviceKey, this.now());
    entry.at = this.iso();
    this.feedback.push(entry);
    this.store.append('feedback', entry);
    this.checkFeedbackRule();
    this.changed();
    return { status: 201, entry };
  }

  checkFeedbackRule() {
    const since = this.now() - this.cfg.alerts.feedback.windowMin * 60000;
    this.alerts.feedbackCounts(fb.windowCounts(this.feedback, since));
  }

  reviewAlert(id, body) {
    const action = body && REVIEW_ACTIONS[body.action] ? body.action : null;
    if (!action) return { status: 400, error: 'Choose what was done.' };
    const note = typeof body.note === 'string' ? body.note.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200) : '';
    const review = { action, actionLabel: REVIEW_ACTIONS[action], note, by: 'Demo presenter (role-play, not facilities staff)' };
    const a = this.alerts.review(id, review);
    if (!a) return { status: 404, error: 'Alert is no longer active.' };
    const rec = { at: this.iso(), alertId: id, rule: a.rule, ...review };
    this.actions.push(rec);
    this.store.append('actions', rec);
    this.changed();
    return { status: 200, alert: a };
  }

  // ---- outputs ---------------------------------------------------------------------------
  primaryTemperature() {
    const now = this.now();
    for (const k of ['temperature_aht_c', 'temperature_lm35_c']) {
      const m = this.metrics[k];
      if (m && this.freshness(k, m, now) === 'live') return { metric: k, ...m };
    }
    return null;
  }

  freshness(name, m, now = this.now()) {
    if (!m) return 'none';
    if (now - m.at > this.cfg.staleAfterMs) return 'stale';
    // Serial values are only live while connected AND after a sample arrived in this run of the app
    // (values restored from disk after a restart are history, not current readings).
    if (m.source === 'serial' && (this.serial.state !== 'connected' || !this.serial.lastSampleAt)) return 'stale';
    return 'live';
  }

  snapshot() {
    const now = this.now();
    const metrics = {};
    for (const [k, def] of Object.entries(METRICS)) {
      const m = this.metrics[k];
      metrics[k] = {
        ...def,
        ...(m ? { value: m.value, at: this.iso(m.at), source: m.source, kind: m.kind } : {}),
        freshness: this.freshness(k, m, now),
      };
    }
    const since = now - 60 * 60000;
    return {
      now: this.iso(now),
      room: this.cfg.room,
      mode: { sensors: this.cfg.sensors, profile: this.cfg.profile, serial: this.cfg.serial },
      config: { staleAfterMs: this.cfg.staleAfterMs, gapAfterMs: this.cfg.gapAfterMs, alerts: this.cfg.alerts, historyMinutes: this.cfg.historyMinutes },
      serial: this.serial,
      ens: this.ens,
      metrics,
      scenario: this.sim.info(),
      alerts: this.alerts.list(),
      feedback: {
        lastHour: fb.summary(this.feedback, since),
        window: fb.windowCounts(this.feedback, now - this.cfg.alerts.feedback.windowMin * 60000),
        recent: this.feedback.slice(-8).reverse(),
        // Every response in the last hour as a timeline event (no comment text).
        events: this.feedback
          .filter((f) => Date.parse(f.at) >= since)
          .map((f) => ({ at: f.at, temp: f.temp, air: f.air, light: f.light })),
        allTime: this.feedback.length,
      },
      actions: this.actions.slice(-10).reverse(),
    };
  }

  historySnapshot() {
    this.trimHistory();
    return this.history;
  }
}

module.exports = { Hub, METRICS, REVIEW_ACTIONS, kindOf };
