'use strict';
// Deterministic demo scenarios. Nothing here is random, so every rehearsal behaves the same.
// Timescales are COMPRESSED for a short presentation (minutes, not a real lesson).
//
// - Simulated CO₂ is ALWAYS synthetic and always labelled "Simulated CO₂, not measured".
// - Simulated sensor values (light / temperature / humidity) are only produced when the app
//   is started with --sensors=simulated, for a hardware-free demo. They are never used to
//   fill gaps when a real sensor fails.

const SCENARIOS = {
  off: { label: 'Off', description: 'No simulated CO₂ values.' },
  normal: { label: 'Normal lesson', description: 'Simulated CO₂ steady around 650 ppm.' },
  stuffy: { label: 'Stuffy room', description: 'Simulated CO₂ rises to ~1500 ppm over 3 min.' },
  ventilated: { label: 'After ventilation', description: 'Simulated CO₂ falls back toward 600 ppm over ~2 min.' },
};

const wobble = (tSec, amp, periodSec) => amp * Math.sin((2 * Math.PI * tSec) / periodSec);

function simCo2(name, tSec, from) {
  switch (name) {
    case 'normal':
      return 650 + wobble(tSec, 20, 90);
    case 'stuffy':
      return from + (1500 - from) * Math.min(1, tSec / 180) + wobble(tSec, 15, 40);
    case 'ventilated':
      return 600 + (from - 600) * Math.exp(-tSec / 45) + wobble(tSec, 10, 40);
    default:
      return null;
  }
}

// Only used in --sensors=simulated mode.
function simSensors(name, tSec, fromTemp) {
  let temp = 24.5 + wobble(tSec, 0.3, 300);
  if (name === 'stuffy') temp = fromTemp + (28.8 - fromTemp) * Math.min(1, tSec / 180);
  if (name === 'ventilated') temp = 25 + (fromTemp - 25) * Math.exp(-tSec / 60);
  return {
    light_raw: Math.round(640 + wobble(tSec, 30, 120)),
    temperature_aht_c: Math.round(temp * 10) / 10,
    humidity_rh: Math.round((52 + wobble(tSec, 3, 240)) * 10) / 10,
  };
}

class Simulator {
  constructor({ now = () => Date.now(), sensors = false } = {}) {
    this.now = now;
    this.sensors = sensors;
    this.lastCo2 = 650;
    this.lastTemp = 24.5;
    this.set('normal');
  }

  set(name) {
    if (!SCENARIOS[name]) throw new Error('unknown scenario');
    this.name = name;
    this.startedAt = this.now();
    this.fromCo2 = this.lastCo2;
    this.fromTemp = this.lastTemp;
  }

  tick() {
    const t = (this.now() - this.startedAt) / 1000;
    const co2 = simCo2(this.name, t, this.fromCo2);
    const out = { simulated_co2_ppm: co2 === null ? null : Math.round(co2) };
    if (co2 !== null) this.lastCo2 = co2;
    if (this.sensors) {
      out.sensors = simSensors(this.name, t, this.fromTemp);
      this.lastTemp = out.sensors.temperature_aht_c;
    }
    return out;
  }

  info() {
    return { name: this.name, label: SCENARIOS[this.name].label, startedAt: new Date(this.startedAt).toISOString() };
  }
}

module.exports = { Simulator, SCENARIOS, simCo2, simSensors };
