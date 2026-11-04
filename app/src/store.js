'use strict';
// Very small persistence layer: one append-only JSON Lines file per record type
// inside data/<profile>/. Easy to inspect, copy and delete; no database server.

const fs = require('fs');
const path = require('path');

const FILES = ['readings', 'feedback', 'alerts', 'actions', 'events'];

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    const marker = path.join(dir, 'README.txt');
    if (!fs.existsSync(marker)) {
      fs.writeFileSync(
        marker,
        'C1 prototype runtime data for this profile. Demo/test data only — NOT the research survey.\n' +
          'Each *.jsonl file has one JSON record per line. Delete this folder (or run npm run reset-demo) to start fresh.\n'
      );
    }
  }

  file(name) {
    if (!FILES.includes(name)) throw new Error('unknown store file ' + name);
    return path.join(this.dir, name + '.jsonl');
  }

  append(name, record) {
    fs.appendFileSync(this.file(name), JSON.stringify(record) + '\n');
  }

  // Reads all records, skipping any damaged line (e.g. after a power cut mid-write).
  readAll(name, { since } = {}) {
    const f = this.file(name);
    if (!fs.existsSync(f)) return [];
    const out = [];
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        if (since && r.at && Date.parse(r.at) < since) continue;
        out.push(r);
      } catch {
        /* skip damaged line */
      }
    }
    return out;
  }
}

module.exports = { Store, FILES };
