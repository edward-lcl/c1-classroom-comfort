'use strict';
// Lists serial ports so you can see which one is the Arduino:  npm run list-ports
const { SerialPort } = require('serialport');
const { KNOWN_VENDORS } = require('../src/serial');
SerialPort.list().then((ports) => {
  if (!ports.length) console.log('No serial ports found. Plug in the UNO with a USB DATA cable.');
  for (const p of ports) {
    const likely = KNOWN_VENDORS.includes((p.vendorId || '').toLowerCase()) ? '  <-- likely Arduino/clone' : '';
    console.log(`${p.path}  vendor=${p.vendorId || '?'} product=${p.productId || '?'} ${p.manufacturer || ''}${likely}`);
  }
});
