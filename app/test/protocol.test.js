'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseLine, lm35RawToC } = require('../src/protocol');

test('valid sample with all sensors', () => {
  const r = parseLine('{"t":"s","v":1,"seq":5,"ms":10000,"light_raw":612,"lm35_raw":48,"aht_ok":1,"aht_t":23.41,"aht_rh":51.23,"ens_ok":1,"ens_val":0,"ens_eco2":540,"ens_tvoc":38,"ens_aqi":2,"ens_comp":1}\r\n');
  assert.equal(r.ok, true);
  assert.equal(r.kind, 'sample');
  assert.deepEqual(r.fields, {
    light_raw: 612,
    lm35_raw: 48,
    temperature_lm35_c: 23.4,
    temperature_aht_c: 23.4,
    humidity_rh: 51.2,
    ens160_eco2_ppm_equivalent: 540,
    ens160_tvoc_ppb: 38,
    ens160_aqi_uba: 2,
  });
  assert.equal(r.ens.validity, 'normal');
  assert.equal(r.ens.usable, true);
  assert.equal(r.ens.compensated, true);
});

test('ENS160 warm-up is reported as not usable', () => {
  const r = parseLine('{"t":"s","v":1,"seq":1,"ens_ok":1,"ens_val":1,"ens_eco2":400,"ens_tvoc":0,"ens_aqi":1}');
  assert.equal(r.ens.validity, 'warm-up');
  assert.equal(r.ens.usable, false);
  assert.equal(r.ens.compensated, false);
});

test('eCO2 never lands in a CO2 field', () => {
  const r = parseLine('{"t":"s","v":1,"seq":1,"ens_ok":1,"ens_val":0,"ens_eco2":900}');
  assert.ok(!('co2_ppm' in r.fields));
  assert.ok(!('simulated_co2_ppm' in r.fields));
  assert.equal(r.fields.ens160_eco2_ppm_equivalent, 900);
});

test('malformed and partial lines are rejected without throwing', () => {
  for (const bad of ['', '{"t":"s","v":1,"seq":', 'garbage \u0000', '[1,2]', '{"t":"x","v":1}', '{"t":"s","v":2,"seq":1}', '{"t":"s","v":1}', 'x'.repeat(400), null]) {
    const r = parseLine(bad);
    assert.equal(r.ok, false, `should reject ${String(bad).slice(0, 20)}`);
  }
});

test('out-of-range field is dropped but other fields kept', () => {
  const r = parseLine('{"t":"s","v":1,"seq":2,"light_raw":5000,"lm35_raw":50}');
  assert.equal(r.ok, true);
  assert.equal(r.fields.light_raw, undefined);
  assert.equal(r.fields.lm35_raw, 50);
  assert.match(r.problems.join(), /light_raw/);
});

test('sensor not responding is reported as a problem, not a value', () => {
  const r = parseLine('{"t":"s","v":1,"seq":3,"aht_ok":0,"ens_ok":0}');
  assert.equal(r.fields.temperature_aht_c, undefined);
  assert.deepEqual(r.problems, ['AHT20 not responding', 'ENS160 not responding']);
});

test('LM35 conversion uses 10 mV/°C with a nominal 5 V reference', () => {
  assert.equal(lm35RawToC(48), 23.4); // 48 × 5 / 1024 = 0.234 V
  const r = parseLine('{"t":"s","v":1,"seq":3,"lm35_raw":0}');
  assert.equal(r.fields.temperature_lm35_c, undefined); // 0 °C reading = probably unwired
  assert.match(r.problems[0], /implausible/);
});

test('boot and comment lines', () => {
  const b = parseLine('{"t":"boot","v":1,"fw":"c1-station 1.0","ldr":1,"lm35":0,"aht":1,"ens":1}');
  assert.equal(b.kind, 'boot');
  assert.deepEqual(b.enabled, { ldr: true, lm35: false, aht: true, ens: true });
  const c = parseLine('# hello');
  assert.equal(c.ok, false);
  assert.equal(c.reason, 'comment');
});
