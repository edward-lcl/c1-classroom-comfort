'use strict';
// Serial bridge: reads lines from the Arduino over USB and hands each line to the hub.
// A web browser cannot read USB by itself, so this small laptop-side program does it.
// It reconnects automatically if the cable is unplugged or the board restarts.

const readline = require('readline');

// USB vendor IDs commonly used by UNO boards and clones (Arduino, CH340, FTDI, CP210x).
const KNOWN_VENDORS = ['2341', '2a03', '1a86', '0403', '10c4'];
const RETRY_MS = 3000;

async function findPort(SerialPort) {
  const ports = await SerialPort.list();
  const score = (p) => {
    const vid = (p.vendorId || '').toLowerCase();
    const text = `${p.manufacturer || ''} ${p.path}`.toLowerCase();
    if (KNOWN_VENDORS.includes(vid)) return 2;
    if (/arduino|wch|ch340|usbmodem|usbserial|ttyacm|ttyusb/.test(text)) return 1;
    return 0;
  };
  return ports.map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0]?.p || null;
}

function startStdin(hub) {
  hub.setSerialState('connected', { port: 'stdin (simulated serial input, not a real UNO)' });
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (l) => hub.ingestLine(l));
  rl.on('close', () => hub.setSerialState('disconnected', { lastError: 'stdin closed' }));
  return { stop: () => rl.close() };
}

function startSerial(hub, { path: wanted, baud }) {
  let SerialPort, ReadlineParser;
  try {
    ({ SerialPort } = require('serialport'));
    ({ ReadlineParser } = require('@serialport/parser-readline'));
  } catch (e) {
    hub.setSerialState('disconnected', { lastError: 'serialport package not installed — run npm install' });
    return { stop() {} };
  }

  let port = null;
  let stopped = false;
  let timer = null;

  const retry = (msg) => {
    if (stopped) return;
    hub.setSerialState(msg ? 'disconnected' : 'searching', msg ? { lastError: msg, port: null } : { port: null });
    clearTimeout(timer);
    timer = setTimeout(connect, RETRY_MS);
  };

  async function connect() {
    if (stopped) return;
    let path = wanted;
    try {
      if (wanted === 'auto') {
        const found = await findPort(SerialPort);
        if (!found) return retry('No Arduino found on USB. Check the cable (it must be a data cable) and close Arduino IDE Serial Monitor.');
        path = found.path;
      }
      port = new SerialPort({ path, baudRate: baud, autoOpen: false });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      parser.on('data', (line) => hub.ingestLine(line));
      port.on('close', () => retry('Serial port closed (USB unplugged or board reset).'));
      port.on('error', (err) => hub.logEvent('serial error', { message: err.message }));
      port.open((err) => {
        if (err) return retry(`Could not open ${path}: ${err.message}. Is Arduino IDE Serial Monitor open?`);
        hub.setSerialState('connected', { port: path, lastError: null });
      });
    } catch (err) {
      retry(err.message);
    }
  }

  connect();
  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      if (port && port.isOpen) port.close();
    },
  };
}

module.exports = { startSerial, startStdin, findPort, KNOWN_VENDORS };
