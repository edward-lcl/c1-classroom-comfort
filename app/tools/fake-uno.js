'use strict';
// Test generator that prints the same serial lines the real UNO sketch prints.
// Use it to rehearse without hardware:  npm run fake-uno
// Output is clearly reported by the dashboard as "TEST INPUT", never as a real Arduino.
//   --chaos        also print malformed / partial lines to test error handling
//   --stop-after=N stop after N samples (simulates unplugging the USB cable)
//   --no-ens       leave the ENS160/AHT20 board out (as if not yet soldered)
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const interval = Number(args.interval || 2000);
const stopAfter = args['stop-after'] ? Number(args['stop-after']) : Infinity;
const ens = !args['no-ens'];
let seq = 0;
const out = (s) => process.stdout.write(s + '\n');

out('# fake-uno test generator (not real hardware)');
out(JSON.stringify({ t: 'boot', v: 1, fw: 'fake-uno 1.0', ldr: 1, lm35: 1, aht: ens ? 1 : 0, ens: ens ? 1 : 0 }));

const timer = setInterval(() => {
  const ms = seq * interval;
  const s = { t: 's', v: 1, seq, ms, light_raw: Math.round(600 + 80 * Math.sin(seq / 15)), lm35_raw: 48 + (seq % 3 === 0 ? 1 : 0) };
  if (ens) {
    Object.assign(s, { aht_ok: 1, aht_t: +(23.6 + 0.4 * Math.sin(seq / 40)).toFixed(2), aht_rh: +(48 + 2 * Math.sin(seq / 30)).toFixed(1) });
    // ENS160 validity: warm-up first, then initial start-up, then normal (shortened for testing).
    const val = seq < 10 ? 1 : seq < 25 ? 2 : 0;
    Object.assign(s, { ens_ok: 1, ens_val: val, ens_eco2: 420 + Math.round(seq * 3) % 400, ens_tvoc: 30 + (seq % 20), ens_aqi: 1 + (seq % 2), ens_comp: 1 });
  }
  out(JSON.stringify(s));
  if (args.chaos && seq % 5 === 2) {
    const bad = ['{"t":"s","v":1,"seq":', 'garbage \u0000ÿ', '{"t":"s","v":1,"seq":9999,"light_raw":5000}', '{"t":"x","v":1}', '[1,2,3]'];
    out(bad[(seq / 5) % bad.length | 0]);
  }
  seq++;
  if (seq >= stopAfter) {
    clearInterval(timer);
    process.exit(0);
  }
}, interval);
