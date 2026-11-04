'use strict';
// Serial message format v1 — see docs/SERIAL_PROTOCOL.md.
// The UNO prints ONE JSON object per line. This module turns a line into either
// { ok: true, kind: 'sample'|'boot'|'error', ... } or { ok: false, reason }.
// It never throws: malformed lines are reported and ignored by the caller.

const MAX_LINE = 300;

// ENS160 DEVICE_STATUS validity flag (datasheet v1.3, register 0x20 bits 3:2).
const ENS_VALIDITY = {
  0: { code: 'normal', label: 'Normal operation', usable: true },
  1: { code: 'warm-up', label: 'Warm-up (first ~3 min after power-on)', usable: false },
  2: { code: 'initial-start-up', label: 'Initial start-up (first ~1 h of operation)', usable: false },
  3: { code: 'invalid', label: 'Invalid output', usable: false },
};

// LM35: 10 mV/°C. UNO default ADC reference is the 5 V supply (nominal; USB power varies).
const LM35_VREF = 5.0;
function lm35RawToC(raw) {
  return Math.round(((raw * LM35_VREF) / 1024) * 100 * 10) / 10;
}

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const isNum = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

function parseLine(raw) {
  if (typeof raw !== 'string') return { ok: false, reason: 'not text' };
  const line = raw.replace(/\r/g, '').trim();
  if (!line) return { ok: false, reason: 'empty line' };
  if (line.length > MAX_LINE) return { ok: false, reason: 'line too long' };
  // Ignore human-readable debug lines the sketch may print (they start with '#').
  if (line.startsWith('#')) return { ok: false, reason: 'comment', comment: line.slice(1).trim() };
  if (line[0] !== '{' || line[line.length - 1] !== '}') return { ok: false, reason: 'incomplete or non-JSON line' };

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return { ok: false, reason: 'invalid JSON' };
  }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return { ok: false, reason: 'not an object' };
  if (msg.v !== 1) return { ok: false, reason: 'unsupported protocol version' };

  if (msg.t === 'boot') {
    return {
      ok: true,
      kind: 'boot',
      firmware: typeof msg.fw === 'string' ? msg.fw.slice(0, 40) : 'unknown',
      enabled: { ldr: !!msg.ldr, lm35: !!msg.lm35, aht: !!msg.aht, ens: !!msg.ens },
    };
  }
  if (msg.t === 'err') {
    return { ok: true, kind: 'error', message: typeof msg.msg === 'string' ? msg.msg.slice(0, 80) : 'unknown' };
  }
  if (msg.t !== 's') return { ok: false, reason: 'unknown message type' };

  if (!isInt(msg.seq, 0, 4294967295)) return { ok: false, reason: 'missing sequence number' };

  // Each sensor is checked separately: one bad field does not discard the others.
  const fields = {};
  const problems = [];

  if ('light_raw' in msg) {
    if (isInt(msg.light_raw, 0, 1023)) fields.light_raw = msg.light_raw;
    else problems.push('light_raw out of range');
  }
  if ('lm35_raw' in msg) {
    if (isInt(msg.lm35_raw, 0, 1023)) {
      fields.lm35_raw = msg.lm35_raw;
      const c = lm35RawToC(msg.lm35_raw);
      // An unconnected or miswired LM35 typically reads 0 or floats high; 2–60 °C is a plausible indoor range.
      if (c >= 2 && c <= 60) fields.temperature_lm35_c = c;
      else problems.push(`LM35 reading implausible (${c} °C) — check wiring`);
    } else problems.push('lm35_raw out of range');
  }
  if ('aht_ok' in msg) {
    if (msg.aht_ok === 1) {
      if (isNum(msg.aht_t, -40, 85)) fields.temperature_aht_c = Math.round(msg.aht_t * 10) / 10;
      else problems.push('AHT20 temperature out of range');
      if (isNum(msg.aht_rh, 0, 100)) fields.humidity_rh = Math.round(msg.aht_rh * 10) / 10;
      else problems.push('AHT20 humidity out of range');
    } else problems.push('AHT20 not responding');
  }
  let ens = null;
  if ('ens_ok' in msg) {
    if (msg.ens_ok === 1 && isInt(msg.ens_val, 0, 3)) {
      const validity = ENS_VALIDITY[msg.ens_val];
      ens = { validity: validity.code, validityLabel: validity.label, usable: validity.usable };
      if (isInt(msg.ens_eco2, 400, 65000)) fields.ens160_eco2_ppm_equivalent = msg.ens_eco2;
      else problems.push('ENS160 eCO₂ out of range');
      if (isInt(msg.ens_tvoc, 0, 65000)) fields.ens160_tvoc_ppb = msg.ens_tvoc;
      if (isInt(msg.ens_aqi, 1, 5)) fields.ens160_aqi_uba = msg.ens_aqi;
      ens.compensated = msg.ens_comp === 1;
    } else problems.push('ENS160 not responding');
  }

  return {
    ok: true,
    kind: 'sample',
    seq: msg.seq,
    deviceMs: isInt(msg.ms, 0, 4294967295) ? msg.ms : null,
    fields,
    ens,
    problems,
  };
}

module.exports = { parseLine, lm35RawToC, ENS_VALIDITY, MAX_LINE };
