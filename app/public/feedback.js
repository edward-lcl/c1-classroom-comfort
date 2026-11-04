'use strict';
(function () {
  const t = (k, v) => window.I18N.t(k, v);
  const form = document.getElementById('form');
  const btn = document.getElementById('send');
  const msg = document.getElementById('msg');
  const comment = document.getElementById('comment');
  const count = document.getElementById('count');
  const done = document.getElementById('done');
  const roomEl = document.getElementById('room');
  const params = new URLSearchParams(location.search);
  let room = params.get('room') || 'example-room';
  let roomName = '';
  let submissionId = newId();
  let sending = false;
  let msgKey = '';

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function showRoom() {
    const k = 'room.' + room;
    roomEl.textContent = t(k) !== k ? t(k) : roomName;
  }

  fetch('/api/room')
    .then((r) => r.json())
    .then((d) => {
      roomName = d.room.name;
      if (!params.get('room')) room = d.room.id;
      showRoom();
    })
    .catch(() => {});

  comment.addEventListener('input', () => (count.textContent = comment.value.length));

  // Messages are stored as keys so they re-translate when the language changes.
  function show(key, isError, serverText) {
    msgKey = key;
    msg.textContent = key ? t(key) : serverText || '';
    msg.className = 'msg' + (isError ? ' error' : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return; // protects against double taps
    const data = new FormData(form);
    const body = { id: submissionId, room, temp: data.get('temp'), air: data.get('air'), light: data.get('light'), comment: comment.value };
    if (!body.temp && !body.air && !body.light) return show('form.pick', true);

    sending = true;
    btn.disabled = true;
    btn.textContent = t('form.sending');
    show('');
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Server messages are English; in Chinese mode show the generic translated message.
        if (window.I18N.lang === 'en' && d.error) show('', true, d.error);
        else show('form.fail', true);
      } else {
        form.hidden = true;
        done.hidden = false;
      }
    } catch {
      show('form.fail', true);
    } finally {
      sending = false;
      btn.disabled = false;
      btn.textContent = t('form.send');
    }
  });

  document.getElementById('again').addEventListener('click', () => {
    form.reset();
    count.textContent = '0';
    submissionId = newId();
    show('');
    done.hidden = true;
    form.hidden = false;
  });

  window.I18N.onChange(() => {
    showRoom();
    if (msgKey) show(msgKey, msg.classList.contains('error'));
  });
})();
