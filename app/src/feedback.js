'use strict';
// Validation and summary for the student QR feedback form.
// No names, student IDs or contact details are requested or stored.

const CHOICES = {
  temp: ['cold', 'ok', 'hot'],
  air: ['ok', 'stuffy', 'unsure'],
  light: ['dark', 'ok', 'bright'],
};

function validate(body, { roomId, commentMax }) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request.' };
  const id = typeof body.id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(body.id) ? body.id : null;
  if (!id) return { error: 'Missing submission id. Please reload the page.' };
  if (body.room !== roomId) return { error: 'Unknown room. Please scan the classroom QR code again.' };

  const entry = { id, room: roomId };
  let answered = 0;
  for (const [k, allowed] of Object.entries(CHOICES)) {
    const v = body[k];
    if (v === undefined || v === null || v === '') continue;
    if (!allowed.includes(v)) return { error: `Invalid answer for ${k}.` };
    entry[k] = v;
    answered++;
  }
  if (!answered) return { error: 'Please answer at least one question.' };

  let comment = typeof body.comment === 'string' ? body.comment : '';
  // Normalise whitespace and strip control characters; HTML is escaped when displayed.
  comment = comment.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (comment.length > commentMax) return { error: `Comment is too long (max ${commentMax} characters).` };
  if (comment) entry.comment = comment;
  return { entry };
}

// Counts of discomfort reports within the time window, used by the feedback alert rule.
function windowCounts(list, sinceMs) {
  const counts = { hot: 0, cold: 0, stuffy: 0 };
  for (const f of list) {
    if (Date.parse(f.at) < sinceMs) continue;
    if (f.temp === 'hot') counts.hot++;
    if (f.temp === 'cold') counts.cold++;
    if (f.air === 'stuffy') counts.stuffy++;
  }
  return counts;
}

function summary(list, sinceMs) {
  const s = { total: 0, temp: { cold: 0, ok: 0, hot: 0 }, air: { ok: 0, stuffy: 0, unsure: 0 }, light: { dark: 0, ok: 0, bright: 0 } };
  for (const f of list) {
    if (Date.parse(f.at) < sinceMs) continue;
    s.total++;
    for (const k of ['temp', 'air', 'light']) if (f[k]) s[k][f[k]]++;
  }
  return s;
}

module.exports = { validate, windowCounts, summary, CHOICES };
