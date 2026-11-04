'use strict';
// Deletes the runtime data of ONE profile (default: demo). Never touches the research survey.
const fs = require('fs');
const path = require('path');
const profile = (process.argv[2] || 'demo').replace(/[^a-zA-Z0-9_-]/g, '');
const dir = path.join(__dirname, '..', 'data', profile);
if (!fs.existsSync(dir)) return console.log(`Nothing to reset: ${dir} does not exist.`);
fs.rmSync(dir, { recursive: true });
console.log(`Removed demo data folder ${dir}. Stop and restart the app to begin with empty data.`);
