'use strict';
// Live setup checklist: each step reads the same /api/events state as the dashboard and
// marks itself done only from real evidence (port open, boot line seen, readings changing).
(function () {
  const t = (k, v) => window.I18N.t(k, v);
  const $ = (s, el = document) => el.querySelector(s);
  let state = null;
  let sseOk = false;
  let lightMin = null, lightMax = null; // range seen on THIS page, for the cover/torch test
  let feedbackAtStart = null;

  function set(step, status, liveText) {
    const li = $(`.step[data-step="${step}"]`);
    li.classList.toggle('done', status === 'done');
    li.classList.toggle('problem', status === 'problem');
    $('.state', li).textContent = t('su.st.' + status);
    $('.live', li).textContent = liveText || '';
  }

  const fresh = (iso) => iso && Date.now() - Date.parse(iso) < 10000;

  function render() {
    if (!state) return;
    const s = state.serial;
    const isTest = s.port && s.port.startsWith('stdin');
    const enabled = s.enabled || {};
    const problems = (s.lastProblems || []).map(window.I18N.problem);
    let done = 0;

    // 1 USB
    if (!sseOk) set('usb', 'problem', t('cn.offlineTip'));
    else if (state.mode.sensors === 'simulated') set('usb', 'off', t('su.simMode'));
    else if (s.state === 'connected' && !isTest) { set('usb', 'done', t('su.usb.ok', { port: s.port })); done++; }
    else if (isTest) set('usb', 'test', t('mode.testTip'));
    else set('usb', s.state === 'disconnected' ? 'problem' : 'waiting', window.I18N.serialError(s.lastError) || t('cn.searchingTip'));

    // 2 sketch
    const sketchOk = s.firmware && s.firmware.startsWith('c1-station') && fresh(s.lastSampleAt);
    if (sketchOk) { set('sketch', 'done', t('su.sketch.ok', { fw: s.firmware, n: s.malformed })); done++; }
    else if (isTest) set('sketch', 'test', s.firmware || '');
    else if (s.state === 'connected' && fresh(s.lastSampleAt)) set('sketch', 'problem', t('su.sketch.unknown'));
    else if (s.state === 'connected') set('sketch', 'waiting', t('su.sketch.wait'));
    else set('sketch', 'waiting', '');

    // 3 LDR: must be enabled, live, and have moved by >= 150 while this page was open
    const light = state.metrics.light_raw;
    const lightLive = light.value !== undefined && light.freshness === 'live' && light.source === 'serial';
    if (lightLive) {
      lightMin = lightMin === null ? light.value : Math.min(lightMin, light.value);
      lightMax = lightMax === null ? light.value : Math.max(lightMax, light.value);
      $('.meter-fill').style.width = (light.value / 1023) * 100 + '%';
      const r = $('.meter-range');
      r.style.left = (lightMin / 1023) * 100 + '%';
      r.style.width = ((lightMax - lightMin) / 1023) * 100 + '%';
    }
    const ldrProblem = problems.find((p) => /light|光照/i.test(p));
    if (enabled.ldr === false) set('ldr', 'off', t('su.offInSketch', { flag: 'ENABLE_LDR' }));
    else if (ldrProblem) set('ldr', 'problem', ldrProblem);
    else if (lightLive && lightMax - lightMin >= 150) { set('ldr', isTest ? 'test' : 'done', t('su.ldr.ok', { v: light.value, lo: lightMin, hi: lightMax })); if (!isTest) done++; }
    else if (lightLive) set('ldr', 'waiting', t('su.ldr.move', { v: light.value, lo: lightMin, hi: lightMax }));
    else set('ldr', 'waiting', '');

    // 4 LM35
    const lm = state.metrics.temperature_lm35_c;
    const lmProblem = problems.find((p) => /LM35/.test(p));
    if (enabled.lm35 === false) set('lm35', 'off', t('su.offInSketch', { flag: 'ENABLE_LM35' }));
    else if (lmProblem) set('lm35', 'problem', lmProblem);
    else if (lm.value !== undefined && lm.freshness === 'live' && lm.source === 'serial') { set('lm35', isTest ? 'test' : 'done', t('su.lm35.ok', { c: lm.value.toFixed(1) })); if (!isTest) done++; }
    else set('lm35', 'waiting', '');

    // 5 ENS160 + AHT21
    const aht = state.metrics.temperature_aht_c;
    const i2cProblem = problems.find((p) => /AHT|ENS/.test(p));
    if (!enabled.aht && !enabled.ens) set('i2c', 'off', t('su.i2c.off'));
    else if (i2cProblem) set('i2c', 'problem', i2cProblem);
    else if (aht.freshness === 'live' && aht.source === 'serial') {
      const ens = state.ens ? t('ens.' + state.ens.validity) : t('ens.none');
      set('i2c', isTest ? 'test' : 'done', t('su.i2c.ok', { t: aht.value.toFixed(1), rh: state.metrics.humidity_rh.value, ens }));
      if (!isTest) done++;
    } else set('i2c', 'waiting', '');

    // 6 phone: a new feedback response arrived while this page is open
    if (feedbackAtStart === null) feedbackAtStart = state.feedback.allTime;
    if (state.feedback.allTime > feedbackAtStart) { set('phone', 'done', t('su.phone.ok')); done++; }
    else set('phone', 'waiting', t('su.phone.wait'));

    const p = $('#progress');
    p.textContent = t('su.progress', { n: done, total: 6 });
    p.className = 'verdict ' + (done === 6 ? 'ok' : 'none');
  }

  function connect() {
    const es = new EventSource('/api/events');
    es.addEventListener('state', (e) => {
      sseOk = true;
      state = JSON.parse(e.data);
      render();
    });
    es.onerror = () => {
      sseOk = false;
      render();
    };
  }

  $('#themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('c1-theme', next); } catch { /* ignore */ }
  });
  window.I18N.onChange(render);
  connect();
})();
