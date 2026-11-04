'use strict';
// Rule-based "review the room" prompts. These are simple threshold RULES, not AI.
// Each rule has hysteresis (separate raise/clear levels) and needs several samples in a row,
// so one noisy reading cannot create a flood of alerts.
//
// Lifecycle:  open  --(person records review)-->  reviewed  --(condition clears)-->  resolved
//             open  --(condition clears before review)-------------------------->  resolved
// At most one active alert per rule. A new alert for the same rule only appears after the
// previous one resolved.

const RULES = {
  sim_co2: {
    title: 'Simulated CO₂ above illustrative level',
    describe: (v, c) => `Simulated CO₂ ${v} ppm ≥ ${c.raise} ppm (demo threshold, not measured)`,
  },
  temperature: {
    title: 'Room may be too warm',
    describe: (v, c) => `Temperature ${v} °C ≥ ${c.raise} °C (illustrative comfort threshold)`,
  },
  feedback: {
    title: 'Several students reported discomfort',
    describe: (d) => d,
  },
};

class AlertEngine {
  constructor(cfg, { onChange, now = () => Date.now() } = {}) {
    this.cfg = cfg;
    this.onChange = onChange || (() => {});
    this.now = now;
    this.active = {}; // rule -> alert
    this.recent = []; // resolved alerts, newest first
    this.counters = {}; // rule -> { above, below }
    this.seq = 0;
  }

  restore(records) {
    // records: alert snapshots in file order; keep the latest snapshot of each id.
    const byId = new Map();
    for (const r of records) byId.set(r.id, r);
    for (const a of byId.values()) {
      if (a.status === 'resolved') this.recent.unshift(a);
      else this.active[a.rule] = a;
    }
    this.recent.sort((x, y) => (y.resolvedAt || '').localeCompare(x.resolvedAt || ''));
    this.recent = this.recent.slice(0, 20);
  }

  iso() {
    return new Date(this.now()).toISOString();
  }

  // Threshold rules (sim_co2, temperature): call once per new valid sample.
  sample(rule, value) {
    const c = this.cfg[rule === 'sim_co2' ? 'simCo2' : rule];
    const k = (this.counters[rule] ||= { above: 0, below: 0 });
    if (value >= c.raise) {
      k.above++;
      k.below = 0;
    } else if (value < c.clear) {
      k.below++;
      k.above = 0;
    } else {
      k.above = 0;
      k.below = 0;
    }
    if (!this.active[rule] && k.above >= c.samples) this.open(rule, RULES[rule].describe(value, c), value);
    else if (this.active[rule] && k.below >= c.samples) this.resolve(rule, value);
  }

  // Feedback rule: call whenever feedback changes and periodically (the time window moves).
  feedbackCounts(counts) {
    const c = this.cfg.feedback;
    const labels = { hot: 'too hot', cold: 'too cold', stuffy: 'stuffy air' };
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['', 0];
    if (!this.active.feedback && top[1] >= c.raiseCount) {
      this.open('feedback', `${top[1]} reports of “${labels[top[0]] || top[0]}” in the last ${c.windowMin} min`, top[1], { category: top[0] });
    } else if (this.active.feedback && top[1] < c.clearCount) {
      this.resolve('feedback', top[1]);
    }
  }

  open(rule, detail, value, extra = {}) {
    const a = {
      ...extra,
      id: `A${this.now().toString(36)}${(this.seq++).toString(36)}`,
      rule,
      title: RULES[rule].title,
      detail,
      triggerValue: value,
      status: 'open',
      openedAt: this.iso(),
    };
    this.active[rule] = a;
    this.onChange(a, 'opened');
    return a;
  }

  review(id, review) {
    const a = Object.values(this.active).find((x) => x.id === id);
    if (!a) return null;
    if (a.status === 'open') a.status = 'reviewed';
    a.reviewedAt = this.iso();
    a.review = review;
    this.onChange(a, 'reviewed');
    return a;
  }

  resolve(rule, value) {
    const a = this.active[rule];
    if (!a) return;
    delete this.active[rule];
    a.status = 'resolved';
    a.resolvedAt = this.iso();
    a.resolveValue = value;
    this.recent.unshift(a);
    this.recent = this.recent.slice(0, 20);
    this.onChange(a, 'resolved');
  }

  list() {
    return { active: Object.values(this.active), recent: this.recent.slice(0, 10) };
  }
}

module.exports = { AlertEngine, RULES };
