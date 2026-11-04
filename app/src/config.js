'use strict';
// All tunable values live here so the group can explain and change them in one place.
// Alert thresholds are ILLUSTRATIVE demo values, not health or safety limits.

const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function load(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  const profile = String(args.profile || env.C1_PROFILE || 'demo').replace(/[^a-zA-Z0-9_-]/g, '');
  return {
    port: Number(args.port || env.PORT || 3000),
    host: args.host || env.HOST || '0.0.0.0',
    // serial: 'auto' (find the UNO), a port path such as /dev/cu.usbmodem1101 or COM3,
    // 'stdin' (read lines from standard input, used by tools/fake-uno.js), or 'off'.
    serial: args.serial || env.SERIAL_PORT || 'auto',
    baud: Number(args.baud || env.SERIAL_BAUD || 9600),
    // sensors: 'serial' = real UNO readings only; 'simulated' = labelled synthetic sensor
    // values for a hardware-free demo. Simulated mode never mixes with serial data.
    sensors: args.sensors || env.C1_SENSORS || 'serial',
    // Allow the dashboard and demo controls to be opened from other devices on the network.
    // Off by default: phones only need the feedback page.
    // Simulated CO₂ scenario at start-up: off | normal | stuffy | ventilated.
    scenario: args.scenario || 'normal',
    lanDashboard:Boolean(args['lan-dashboard'] || env.C1_LAN_DASHBOARD),
    profile,
    dataDir: path.resolve(args['data-dir'] || env.C1_DATA_DIR || path.join(__dirname, '..', 'data', profile)),
    room: { id: 'example-room', name: 'Example Classroom (C1 demo)' },

    sampleIntervalMs: 2000,      // the UNO sketch sends one record every 2 s
    staleAfterMs: Number(args['stale-ms'] || 10000), // no valid sample for 10 s → "stale" (--stale-ms is for QA screenshots only)
    gapAfterMs: 8000,            // charts break the line when samples are further apart than this
    historyMinutes: 60,          // how much history the dashboard charts show

    alerts: {
      simCo2: { raise: 1200, clear: 1000, samples: 2 },       // simulated CO₂ only
      temperature: { raise: 28, clear: 27, samples: 5 },      // °C, illustrative comfort prompt
      feedback: { windowMin: 15, raiseCount: 3, clearCount: 2 },
    },
    feedback: { commentMax: 200, perDeviceCooldownMs: 10000 },
  };
}

module.exports = { load, parseArgs };
