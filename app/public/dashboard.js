'use strict';
/*
  C1 staff dashboard — one question: "Does this room need someone to check on it right now?"
  Built from dashboard-design (components.md) in plain DOM/SVG. Deviations, on purpose:
  - Provenance chips ("est.", "sim.") stay on the tiles even though the skill prefers fewer words:
    the project must never let an estimate or simulated value pass as a measurement.
  - The attention row exists because the review action has no other home on screen.
  - Measured tiles carry no chip; their tooltip names the sensor. Simulated sensor mode adds "sim." chips.
*/
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const t_ = (k, v) => window.I18N.t(k, v);
  const SVG = 'http://www.w3.org/2000/svg';
  let state = null;
  let history = {};
  let offset = 0; // client clock minus server clock
  let sseOk = false;
  let everConnected = false;
  let selected = 'temp';
  let rangeMin = 30;
  let autoSelected = false;

  // ---------- helpers ----------
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const sv = (tag, attrs = {}) => {
    const e = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const serverNow = () => Date.now() - offset;
  const hhmm = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hhmmss = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const age = (t) => {
    const s = Math.max(0, Math.round((serverNow() - Date.parse(t)) / 1000));
    return s < 60 ? t_('age.s', { n: s }) : s < 3600 ? t_('age.min', { n: Math.floor(s / 60) }) : t_('age.h', { n: Math.floor(s / 3600) });
  };
  const fmt = (v, d) => (v === undefined || v === null || Number.isNaN(v) ? '—' : Number(v).toFixed(d));

  // ---------- tiles ----------
  const TILES = [
    { id: 'temp', unit: '°C', dec: 1, rule: 'temperature' },
    { id: 'rh', key: 'humidity_rh', unit: '%RH', dec: 1 },
    { id: 'light', key: 'light_raw', unit: '%', dec: 0, map: (v) => (v / 1023) * 100 },
    { id: 'eco2', key: 'ens160_eco2_ppm_equivalent', unit: 'ppm', dec: 0 },
    { id: 'sim', key: 'simulated_co2_ppm', unit: 'ppm', dec: 0, rule: 'sim_co2' },
  ];
  for (const t of TILES) Object.defineProperty(t, 'name', { get: () => t_('tile.' + t.id) });
  const tileById = Object.fromEntries(TILES.map((t) => [t.id, t]));

  function primaryTempKey() {
    const m = state.metrics;
    const aht = m.temperature_aht_c, lm = m.temperature_lm35_c;
    if (aht.freshness === 'live') return 'temperature_aht_c';
    if (lm.freshness === 'live') return 'temperature_lm35_c';
    if (aht.at && (!lm.at || aht.at >= lm.at)) return 'temperature_aht_c';
    return lm.at ? 'temperature_lm35_c' : 'temperature_aht_c';
  }
  const keyOf = (t) => (t.id === 'temp' ? primaryTempKey() : t.key);
  const threshold = (t) => (t.rule === 'temperature' ? state.config.alerts.temperature.raise : t.rule === 'sim_co2' ? state.config.alerts.simCo2.raise : null);

  // Freshness double-checked in the browser, in case updates stop arriving.
  function metricView(t) {
    const m = { ...state.metrics[keyOf(t)] };
    if (m.value !== undefined && (!sseOk || serverNow() - Date.parse(m.at) > state.config.staleAfterMs)) m.freshness = 'stale';
    return m;
  }
  const activeRule = (rule) => state.alerts.active.find((a) => a.rule === rule);

  function tileBaseline(t, m) {
    if (t.id === 'temp') return `${keyOf(t) === 'temperature_aht_c' ? 'AHT20' : 'LM35'} · ≥ ${threshold(t)}`;
    if (t.id === 'rh') return 'AHT20';
    if (t.id === 'light') return m.value !== undefined ? `raw ${m.value}` : 'raw —';
    if (t.id === 'eco2') {
      const e = state.ens;
      if (!e) return t_('ens.none');
      return t_('ens.' + e.validity);
    }
    if (t.id === 'sim') return `≥ ${threshold(t)} · ${t_('sc.' + state.scenario.name)}`;
    return '';
  }

  function tileTip(t, m) {
    const parts = [];
    if (t.id === 'temp') parts.push(t_('tip.temp', { label: t_(keyOf(t) === 'temperature_aht_c' ? 'label.aht' : 'label.lm35'), thr: threshold(t), n: state.config.alerts.temperature.samples }));
    if (t.id === 'rh') parts.push(t_('tip.rh'));
    if (t.id === 'light') parts.push(t_('tip.light'));
    if (t.id === 'eco2') {
      parts.push(t_('tip.eco2'));
      if (state.ens) parts.push(t_('tip.ensStatus', { status: t_('ens.' + state.ens.validity), comp: t_(state.ens.compensated ? 'tip.compYes' : 'tip.compNo') }));
    }
    if (t.id === 'sim') parts.push(t_('tip.sim', { thr: threshold(t), clear: state.config.alerts.simCo2.clear }));
    if (m.kind === 'simulated' && t.id !== 'sim') parts.push(t_('tip.simMode'));
    if (m.at) parts.push(t_(m.freshness === 'stale' ? 'tip.lastStale' : 'tip.last', { time: hhmmss(m.at) }));
    return parts.join(' ');
  }

  function buildTiles() {
    const box = $('#kpis');
    box.textContent = '';
    for (const t of TILES) {
      const b = el('button', 'tile');
      b.type = 'button';
      b.dataset.id = t.id;
      b.innerHTML = '<div class="tile-in"><div class="tile-top"><span class="name"></span><span class="chips"></span></div><div class="tile-val"><span class="n">—</span><span class="u"></span></div><div class="tile-base"></div><svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"></svg></div>';
      $('.u', b).textContent = t.unit;
      b.addEventListener('click', () => {
        selected = t.id;
        renderTiles();
        drawChart();
      });
      box.append(b);
    }
  }

  function renderTiles() {
    for (const t of TILES) {
      const b = $(`.tile[data-id="${t.id}"]`);
      const m = metricView(t);
      const has = m.value !== undefined;
      const v = has ? (t.map ? t.map(m.value) : m.value) : undefined;
      b.setAttribute('aria-pressed', String(selected === t.id));
      $('.name', b).textContent = t.name;
      const flagged = t.rule && activeRule(t.rule) && m.freshness === 'live';
      b.classList.toggle('flag', !!flagged);
      b.classList.toggle('stale', has && m.freshness === 'stale');
      b.classList.toggle('notready', t.id === 'eco2' && !!state.ens && !state.ens.usable);
      $('.n', b).textContent = (flagged ? '▲ ' : '') + fmt(v, t.dec);
      const chips = $('.chips', b);
      chips.textContent = '';
      if (t.id === 'eco2') chips.append(el('span', 'chip est', t_('chip.est')));
      else if (m.kind === 'simulated' || t.id === 'sim') chips.append(el('span', 'chip sim', t_('chip.sim')));
      const base = $('.tile-base', b);
      base.textContent = '';
      if (!has) base.append(el('span', 'chip', t_('chip.nodata')));
      else if (m.freshness === 'stale') base.append(el('span', 'chip warn', t_('chip.stale', { age: age(m.at) })));
      base.append(el('span', '', tileBaseline(t, m)));
      b.dataset.tip = tileTip(t, m);
      b.setAttribute('aria-label', `${t.name} ${fmt(v, t.dec)} ${t.unit}${m.freshness === 'stale' ? t_('chart.stale') : ''}`);
      drawSpark($('.spark', b), t, m.kind);
      // The chart header repeats the selected tile's number, so update it from the same live value (never two answers).
      if (selected === t.id) $('#chartValue').textContent = fmt(v, t.dec);
    }
  }

  function seriesFor(t) {
    const raw = history[keyOf(t)] || [];
    const t0 = serverNow() - rangeMin * 60000;
    return raw.filter((p) => p[0] >= t0).map((p) => [p[0], t.map ? t.map(p[1]) : p[1]]);
  }

  function pathFor(series, x, y) {
    let d = '';
    let prev = null;
    for (const [t, v] of series) {
      d += (prev === null || t - prev > state.config.gapAfterMs ? 'M' : 'L') + x(t).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
      prev = t;
    }
    return d;
  }

  function drawSpark(svg, t, kind) {
    svg.textContent = '';
    const s = seriesFor(t);
    if (s.length < 2) return;
    const now = serverNow(), t0 = now - rangeMin * 60000;
    const vs = s.map((p) => p[1]);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const x = (tt) => ((tt - t0) / (now - t0)) * 100;
    const y = (v) => 30 - ((v - lo) / (hi - lo)) * 28;
    const cls = t.id === 'eco2' ? 'est' : kind === 'simulated' || t.id === 'sim' ? 'sim' : '';
    svg.append(sv('path', { d: pathFor(s, x, y), class: cls }));
  }

  // ---------- timeline ----------
  function niceTicks(lo, hi, n = 4) {
    const span = hi - lo || 1;
    const raw = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw);
    const start = Math.floor(lo / step) * step;
    const ticks = [];
    for (let v = start; v <= hi + step * 0.001; v += step) ticks.push(+v.toFixed(6));
    if (ticks[ticks.length - 1] < hi) ticks.push(+(ticks[ticks.length - 1] + step).toFixed(6));
    return ticks;
  }

  const FB_KEY = { hot: 'fb.hot', cold: 'fb.cold', stuffy: 'fb.stuffy' };
  function feedbackText(f) {
    const parts = [];
    if (f.temp) parts.push(t_({ cold: 'fb.cold', ok: 'fb.tempOk', hot: 'fb.hot' }[f.temp]));
    if (f.air) parts.push(t_({ ok: 'fb.airOk', stuffy: 'fb.stuffy', unsure: 'fb.unsure' }[f.air]));
    if (f.light) parts.push(t_({ dark: 'fb.dark', ok: 'fb.lightOk', bright: 'fb.bright' }[f.light]));
    return parts.join(' · ');
  }
  const isDiscomfort = (f) => f.temp === 'hot' || f.temp === 'cold' || f.air === 'stuffy';

  function renderLegend(t, kind, hasGaps) {
    const lg = $('#legend');
    lg.textContent = '';
    const item = (svgEl, label) => {
      const s = el('span');
      const g = sv('svg', { width: 18, height: 10 });
      g.append(svgEl);
      s.append(g, document.createTextNode(label));
      lg.append(s);
    };
    const lineCls = t.id === 'eco2' ? 'line est' : kind === 'simulated' || t.id === 'sim' ? 'line sim' : 'line';
    const wrap = (e) => { const g = sv('g', { class: 'chart-mini' }); g.append(e); return g; };
    item(wrap(sv('line', { x1: 0, y1: 5, x2: 18, y2: 5, class: lineCls })), t_(t.id === 'eco2' ? 'lg.estimate' : lineCls.includes('sim') ? 'lg.simulated' : 'lg.measured'));
    if (threshold(t) !== null) item(wrap(sv('line', { x1: 0, y1: 5, x2: 18, y2: 5, class: 'thr' })), t_('lg.level'));
    if (t.rule) item(wrap(sv('rect', { x: 2, y: 0, width: 14, height: 10, class: 'band' })), t_('lg.alert'));
    item(wrap(sv('path', { d: 'M9 1 L14 9 L4 9 Z', class: 'ev-bad' })), t_('lg.discomfort'));
    item(wrap(sv('circle', { cx: 9, cy: 5, r: 4, class: 'ev-ok' })), t_('lg.other'));
    item(wrap(sv('line', { x1: 9, y1: 0, x2: 9, y2: 10, class: 'rev' })), t_('lg.review'));
    if (hasGaps) item(wrap(sv('rect', { x: 2, y: 0, width: 14, height: 10, class: 'gap' })), t_('lg.gap'));
  }

  function drawChart() {
    if (!state) return;
    const t = tileById[selected];
    const m = metricView(t);
    const box = $('#chart');
    box.textContent = '';
    $('#chartLabel').textContent = t_('chart.label', { name: t.name + (t.id === 'eco2' ? t_('chart.estimate') : t.id === 'sim' ? t_('chart.simulated') : ''), n: rangeMin });
    $('#chartValue').textContent = fmt(m.value !== undefined ? (t.map ? t.map(m.value) : m.value) : undefined, t.dec);
    $('#chartUnit').textContent = t.unit + (m.freshness === 'stale' ? t_('chart.stale') : '');

    const s = seriesFor(t);
    let hasGaps = false;
    const W = box.clientWidth || 800, H = box.clientHeight || 260;
    const P = { l: 6, r: 48, t: 10, b: 50 }; // bottom: x labels + feedback strip
    const plotH = H - P.t - P.b;
    const now = serverNow(), t0 = now - rangeMin * 60000;
    if (!s.length) {
      const e = el('div', 'empty', t_(t.id === 'sim' ? 'chart.emptySim' : 'chart.empty'));
      box.append(e);
      renderLegend(t, m.kind, false);
      return;
    }
    const thr = threshold(t);
    const vs = s.map((p) => p[1]);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    if (thr !== null && thr <= hi * 1.25 && thr >= lo * 0.75) { lo = Math.min(lo, thr); hi = Math.max(hi, thr); }
    if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
    const ticks = niceTicks(lo, hi, 4);
    lo = ticks[0]; hi = ticks[ticks.length - 1];
    const x = (tt) => P.l + ((tt - t0) / (now - t0)) * (W - P.l - P.r);
    const y = (v) => P.t + plotH - ((v - lo) / (hi - lo)) * plotH;

    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-label': t_('chart.aria', { name: t.name, n: rangeMin }) });
    // grid + y labels (right side)
    for (const v of ticks) {
      svg.append(sv('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'grid' }));
      const lab = sv('text', { x: W - P.r + 8, y: y(v) + 4, class: 'axis' });
      lab.textContent = Math.abs(hi) >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(+v.toFixed(1));
      svg.append(lab);
    }
    // x labels
    const stepMin = rangeMin <= 15 ? 3 : rangeMin <= 30 ? 5 : 10;
    const first = Math.ceil(t0 / (stepMin * 60000)) * stepMin * 60000;
    for (let tt = first; tt <= now; tt += stepMin * 60000) {
      const lab = sv('text', { x: x(tt), y: P.t + plotH + 16, class: 'axis', 'text-anchor': 'middle' });
      lab.textContent = hhmm(tt);
      svg.append(lab);
    }
    // alert bands for this metric's rule
    if (t.rule) {
      for (const a of [...state.alerts.active, ...state.alerts.recent]) {
        if (a.rule !== t.rule) continue;
        const a0 = Math.max(t0, Date.parse(a.openedAt));
        const a1 = Math.min(now, a.resolvedAt ? Date.parse(a.resolvedAt) : now);
        if (a1 <= t0 || a1 <= a0) continue;
        const r = sv('rect', { x: x(a0), y: P.t, width: Math.max(2, x(a1) - x(a0)), height: plotH, class: 'band', 'data-tip': `${t_('al.title.' + a.rule)} · ${hhmm(a.openedAt)}–${a.resolvedAt ? hhmm(a.resolvedAt) : t_('chart.now')}` });
        svg.append(r, sv('line', { x1: x(a0), x2: x(a0), y1: P.t, y2: P.t + plotH, class: 'band-edge' }));
      }
    }
    // "No data" periods: shaded and labelled, so a break in the line reads as missing data, not a glitch.
    const minGap = Math.max(state.config.gapAfterMs, 30000);
    const gaps = [];
    if (s[0][0] - t0 > minGap) gaps.push([t0, s[0][0]]);
    for (let i = 1; i < s.length; i++) if (s[i][0] - s[i - 1][0] > minGap) gaps.push([s[i - 1][0], s[i][0]]);
    if (now - s[s.length - 1][0] > Math.max(minGap, state.config.staleAfterMs)) gaps.push([s[s.length - 1][0], now]);
    for (const [g0, g1] of gaps) {
      svg.append(sv('rect', { x: x(g0), y: P.t, width: Math.max(1, x(g1) - x(g0)), height: plotH, class: 'gap', 'data-tip': t_('chart.gap', { from: hhmm(g0), to: hhmm(g1) }) }));
    }
    hasGaps = gaps.length > 0;
    // threshold
    if (thr !== null && thr >= lo && thr <= hi) {
      svg.append(sv('line', { x1: P.l, x2: W - P.r, y1: y(thr), y2: y(thr), class: 'thr' }));
      const tl = sv('text', { x: P.l + 4, y: y(thr) - 5, class: 'thr-label' });
      tl.textContent = t_('chart.thr', { thr });
      svg.append(tl);
    }
    // line (+ faint area for measured)
    const lineCls = t.id === 'eco2' ? 'line est' : m.kind === 'simulated' || t.id === 'sim' ? 'line sim' : 'line';
    svg.append(sv('path', { d: pathFor(s, x, y), class: lineCls }));
    // review markers
    for (const a of state.actions) {
      const at = Date.parse(a.at);
      if (at < t0) continue;
      svg.append(sv('line', { x1: x(at), x2: x(at), y1: P.t, y2: P.t + plotH, class: 'rev' }));
      const mk = sv('text', { x: x(at), y: P.t + 2, class: 'rev-mark', 'text-anchor': 'middle', 'data-tip': `${hhmm(at)} · ${t_('rv.' + a.action)}${a.note ? ' — ' + a.note : ''}` });
      mk.textContent = '✓';
      svg.append(mk);
    }
    // feedback strip
    const ey = H - 12;
    svg.append(sv('line', { x1: P.l, x2: W - P.r, y1: ey, y2: ey, class: 'ev-track' }));
    for (const f of state.feedback.events) {
      const at = Date.parse(f.at);
      if (at < t0) continue;
      const tip = `${hhmm(at)} · ${feedbackText(f)}`;
      if (isDiscomfort(f)) svg.append(sv('path', { d: `M${x(at)} ${ey - 6} L${x(at) + 6} ${ey + 5} L${x(at) - 6} ${ey + 5} Z`, class: 'ev-bad', 'data-tip': tip }));
      else svg.append(sv('circle', { cx: x(at), cy: ey, r: 5, class: 'ev-ok', 'data-tip': tip }));
    }
    // hover crosshair
    const cross = sv('line', { y1: P.t, y2: P.t + plotH, class: 'cross', visibility: 'hidden' });
    const dot = sv('circle', { r: 4.5, class: 'hover-dot', visibility: 'hidden' });
    svg.append(cross, dot);
    svg.addEventListener('mousemove', (e) => {
      if (e.target.closest('[data-tip]')) return;
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const tt = t0 + ((px - P.l) / (W - P.l - P.r)) * (now - t0);
      let best = null;
      for (const p of s) if (!best || Math.abs(p[0] - tt) < Math.abs(best[0] - tt)) best = p;
      if (!best || Math.abs(best[0] - tt) > state.config.gapAfterMs * 2) return hideHover();
      cross.setAttribute('x1', x(best[0])); cross.setAttribute('x2', x(best[0]));
      dot.setAttribute('cx', x(best[0])); dot.setAttribute('cy', y(best[1]));
      cross.setAttribute('visibility', 'visible'); dot.setAttribute('visibility', 'visible');
      showTip(r.left + (x(best[0]) / W) * r.width, r.top + (y(best[1]) / H) * r.height, `${fmt(best[1], t.dec)} ${t.unit}`, `${hhmmss(best[0])}${t.id === 'eco2' ? t_('chart.hEst') : lineCls.includes('sim') ? t_('chart.hSim') : ''}`);
    });
    const hideHover = () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); hideTip(); };
    svg.addEventListener('mouseleave', hideHover);
    box.append(svg);
    renderLegend(t, m.kind, hasGaps);
  }

  // ---------- attention ----------
  let alertsKey = '';
  function alertNoun(a) {
    if (a.rule === 'sim_co2') return [t_('al.sim'), `${a.triggerValue} ppm`, `≥ ${state.config.alerts.simCo2.raise}`];
    if (a.rule === 'temperature') return [t_('al.temp'), `${a.triggerValue} °C`, `≥ ${state.config.alerts.temperature.raise}`];
    return [FB_KEY[a.category] ? t_(FB_KEY[a.category]) : t_('al.fb'), `×${a.triggerValue}`, t_('al.min', { n: state.config.alerts.feedback.windowMin })];
  }
  function renderAttention() {
    const box = $('#attention');
    const active = state.alerts.active;
    const key = window.I18N.lang + JSON.stringify(active.map((a) => [a.id, a.status, a.reviewedAt]));
    if (key === alertsKey) return; // keep a half-filled review form intact
    alertsKey = key;
    box.textContent = '';
    for (const a of active) {
      const row = el('div', 'alert' + (a.status === 'reviewed' ? ' reviewed' : ''));
      const [noun, num, base] = alertNoun(a);
      const what = el('div', 'alert-what');
      const actionText = a.review ? t_('rv.' + a.review.action) + (a.review.note ? ' — ' + a.review.note : '') : '';
      what.dataset.tip = `${t_('al.title.' + a.rule)}: ${noun} ${num} (${base}). ${t_('al.ruleTip')}${a.review ? ' ' + t_('al.reviewedTip', { t: hhmm(a.reviewedAt), action: actionText }) : ''}`;
      what.append(el('span', 'tri', a.status === 'reviewed' ? '✓' : '▲'), el('b', '', noun), el('span', 'alert-num', num), el('span', 'muted', `${base} · ${t_('al.since', { t: hhmm(a.openedAt) })}`));
      if (a.review) what.append(el('span', 'muted', `· ${t_('rv.' + a.review.action)} ${hhmm(a.reviewedAt)}`));
      row.append(what);
      if (a.status === 'open') {
        const f = el('form', 'review');
        const sel0 = el('select');
        sel0.name = 'action';
        sel0.required = true;
        sel0.setAttribute('aria-label', t_('rv.what'));
        for (const [v, k] of [['', 'rv.what'], ['thermostat', 'rv.thermostat'], ['teacher', 'rv.teacher'], ['hvac', 'rv.hvac'], ['ventilated', 'rv.ventilated'], ['no_change', 'rv.no_change'], ['other', 'rv.other']]) {
          const o = el('option', '', t_(k));
          o.value = v;
          sel0.append(o);
        }
        const note0 = el('input');
        note0.name = 'note';
        note0.maxLength = 200;
        note0.placeholder = t_('rv.note');
        note0.setAttribute('aria-label', t_('rv.note'));
        const btn0 = el('button', '', t_('rv.log'));
        btn0.type = 'submit';
        btn0.disabled = true;
        f.append(sel0, note0, btn0);
        const sel = $('select', f), btn = $('button', f);
        sel.addEventListener('change', () => (btn.disabled = !sel.value));
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          btn.disabled = true;
          const fd = new FormData(f);
          await fetch(`/api/alerts/${a.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: fd.get('action'), note: fd.get('note') }) });
        });
        row.append(f);
      }
      box.append(row);
    }
    // First time an alert is seen, show its metric on the timeline.
    if (!autoSelected && active.length) {
      const r = active.find((a) => a.rule !== 'feedback');
      if (r) selected = r.rule === 'sim_co2' ? 'sim' : 'temp';
      autoSelected = true;
    }
  }

  // ---------- header ----------
  function renderConn() {
    const c = $('#conn');
    const label = $('span', c);
    let text, cls, tip;
    const s = state && state.serial;
    if (!sseOk) [text, cls, tip] = [t_('cn.offline'), 'bad', t_('cn.offlineTip')];
    else if (state.mode.sensors === 'simulated') [text, cls, tip] = [t_('cn.simulated'), '', t_('cn.simulatedTip')];
    else if (s.state === 'connected') {
      const fresh = s.lastSampleAt && serverNow() - Date.parse(s.lastSampleAt) <= state.config.staleAfterMs;
      const src = t_(s.port && s.port.startsWith('stdin') ? 'cn.test' : 'cn.arduino');
      [text, cls] = fresh ? [`${src} · ${age(s.lastSampleAt)}`, 'live'] : [`${src} · ${t_('cn.nodata')}${s.lastSampleAt ? ' ' + age(s.lastSampleAt) : ''}`, 'bad'];
      tip = t_('cn.lastTip', { port: s.port, time: s.lastSampleAt ? hhmmss(s.lastSampleAt) : t_('cn.none') });
    } else if (s.state === 'searching') [text, cls, tip] = [t_('cn.searching'), 'bad', t_('cn.searchingTip')];
    else if (s.state === 'disconnected') [text, cls, tip] = [t_('cn.disconnected'), 'bad', window.I18N.serialError(s.lastError) || t_('cn.disconnectedTip')];
    else [text, cls, tip] = [t_('cn.off'), '', t_('cn.offTip')];
    label.textContent = text;
    c.className = 'pill ' + cls;
    c.dataset.tip = tip;

    const note = $('#netNote');
    note.hidden = sseOk || !everConnected;
    note.textContent = t_('dash.offlineNote');

    const mc = $('#modeChip');
    const testInput = s && s.port && s.port.startsWith('stdin');
    mc.hidden = !(state && (state.mode.sensors === 'simulated' || testInput || state.mode.profile !== 'demo'));
    if (state) {
      mc.textContent = state.mode.sensors === 'simulated' ? t_('mode.sim') : testInput ? t_('mode.test') : t_('mode.profile', { p: state.mode.profile });
      mc.dataset.tip = t_(state.mode.sensors === 'simulated' ? 'mode.simTip' : testInput ? 'mode.testTip' : 'mode.profileTip');
    }
  }

  let scenariosBuilt = false;
  async function renderScenarios() {
    const box = $('#scenarios');
    if (!scenariosBuilt) {
      scenariosBuilt = true;
      const list = await (await fetch('/api/scenarios')).json();
      for (const [name, s] of Object.entries(list)) {
        const b = el('button', '', s.label);
        b.type = 'button';
        b.dataset.name = name;
        b.addEventListener('click', () => fetch('/api/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }));
        box.append(b);
      }
    }
    for (const b of box.querySelectorAll('button')) {
      b.textContent = t_('sc.' + b.dataset.name);
      b.dataset.tip = t_('sc.tip.' + b.dataset.name);
      const on = b.dataset.name === state.scenario.name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }

  // ---------- panels ----------
  function renderFeedback() {
    const f = state.feedback.lastHour;
    $('#fbTotal').textContent = t_('fb.total', { n: f.total });
    const box = $('#fbList');
    box.textContent = '';
    const active = activeRule('feedback');
    const rows = [
      [t_('fb.hot'), f.temp.hot, 'hot'], [t_('fb.cold'), f.temp.cold, 'cold'], [t_('fb.tempOk'), f.temp.ok],
      [t_('fb.stuffy'), f.air.stuffy, 'stuffy'], [t_('fb.airOk'), f.air.ok], [t_('fb.unsure'), f.air.unsure],
      [t_('fb.dark'), f.light.dark], [t_('fb.bright'), f.light.bright], [t_('fb.lightOk'), f.light.ok],
    ].filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!rows.length) {
      const e = el('div', 'empty');
      e.append(document.createTextNode(t_('fb.empty') + ' '));
      const a = el('a', '', t_('fb.openQr'));
      a.href = '/qr';
      a.target = '_blank';
      e.append(a);
      box.append(e);
    }
    for (const [name, n, cat] of rows) {
      const r = el('div', 'rank-row' + (active && active.category === cat ? ' flag' : ''));
      const share = f.total ? n / f.total : 0;
      r.append(el('span', 'n', name), el('span', 'v', String(n)), el('span', 's', f.total >= 5 ? `${Math.round(share * 100)}%` : ''));
      const bar = el('span', 'bar');
      const fill = el('i');
      fill.style.width = share * 100 + '%';
      bar.append(fill);
      r.append(bar);
      r.dataset.tip = t_('fb.rowTip', { n, total: f.total, name });
      box.append(r);
    }
    const ul = $('#comments');
    ul.textContent = '';
    const withText = state.feedback.recent.filter((x) => x.comment);
    if (!withText.length) ul.append(el('li', 'empty-row', t_('cm.empty')));
    for (const c of withText) {
      const li = el('li');
      li.append(el('time', '', hhmm(c.at)), el('span', 't', c.comment)); // textContent: never parsed as HTML
      ul.append(li);
    }
  }

  function renderLogs() {
    const ul = $('#actions');
    ul.textContent = '';
    if (!state.actions.length) ul.append(el('li', 'empty-row', t_('rv.empty')));
    for (const a of state.actions) {
      const li = el('li');
      const t = el('span', 't', t_('rv.' + a.action));
      if (a.note) t.append(el('small', '', a.note));
      li.append(el('time', '', hhmm(a.at)), t);
      ul.append(li);
    }
    const past = $('#pastAlerts');
    past.textContent = '';
    if (!state.alerts.recent.length) past.append(el('li', 'empty-row', t_('ea.empty')));
    for (const a of state.alerts.recent.slice(0, 5)) {
      const li = el('li');
      const t = el('span', 't', t_('al.title.' + a.rule));
      t.append(el('small', '', `${hhmm(a.openedAt)}–${hhmm(a.resolvedAt)} · ${t_(a.review ? 'ea.reviewed' : 'ea.cleared')}`));
      li.append(el('time', '', hhmm(a.openedAt)), t);
      past.append(li);
    }
  }

  function renderDevice() {
    const s = state.serial;
    $('#fw').textContent = s.firmware || '';
    const dl = $('#device');
    dl.textContent = '';
    const add = (k, v, warn, tip) => {
      const dt = el('dt', '', k), dd = el('dd', warn ? 'warn' : '', v);
      if (tip) dd.dataset.tip = tip;
      dl.append(dt, dd);
    };
    add(t_('dv.serial'), t_('st.' + s.state), s.state !== 'connected' && s.state !== 'disabled', s.port || window.I18N.serialError(s.lastError) || '');
    add(t_('dv.last'), s.lastSampleAt ? t_('age.ago', { age: age(s.lastSampleAt) }) : '—', s.lastSampleAt && serverNow() - Date.parse(s.lastSampleAt) > state.config.staleAfterMs);
    if (s.enabled) add(t_('dv.sensors'), Object.entries(s.enabled).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(' · ') || t_('dv.none'));
    add(t_('dv.bad'), String(s.malformed), s.malformed > 0, s.lastMalformed ? t_('dv.badLast', { reason: window.I18N.reason(s.lastMalformed.reason), time: hhmmss(s.lastMalformed.at) }) : t_('dv.badTip'));
    if (s.lastProblems && s.lastProblems.length) add(t_('dv.problems'), s.lastProblems.map(window.I18N.problem).join('; '), true);
    if (s.lastDeviceMessage) add(t_('dv.boardMsg'), s.lastDeviceMessage, false);
    add(t_('dv.restarts'), String(s.restarts || 0));
    add(t_('dv.mode'), t_(state.mode.sensors === 'simulated' ? 'md.simulated' : 'md.serial'));
  }

  // ---------- tooltip system (one for the whole screen) ----------
  const tip = $('#tip');
  function showTip(x, y, big, small) {
    tip.textContent = '';
    if (small !== undefined) { tip.append(el('b', '', big), el('span', '', small)); } else tip.textContent = big;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2)) + 'px';
    tip.style.top = Math.max(8, y - r.height - 10) + 'px';
  }
  function hideTip() { tip.hidden = true; }
  const tipFor = (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t || !t.dataset.tip) return;
    const r = t.getBoundingClientRect();
    showTip(r.left + r.width / 2, r.top, t.dataset.tip);
  };
  document.addEventListener('mouseover', tipFor);
  document.addEventListener('focusin', tipFor);
  document.addEventListener('mouseout', (e) => { if (e.target.closest && e.target.closest('[data-tip]')) hideTip(); });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('scroll', hideTip, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });

  // ---------- "How it works" flow diagram (themed SVG, re-drawn on language change) ----------
  function renderFlow() {
    const box = $('#flow');
    box.textContent = '';
    const W = 1000, H = 300, NW = 150, NH = 62, Y = 78;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'flow-svg', role: 'img', 'aria-label': t_('how.title') });
    const defs = sv('defs');
    const mk = sv('marker', { id: 'flowArrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    mk.append(sv('path', { d: 'M0 0 L10 5 L0 10 z', class: 'fl-head' }));
    defs.append(mk);
    svg.append(defs);
    const label = (x, y, str, cls, anchor = 'middle') => {
      const e = sv('text', { x, y, class: cls, 'text-anchor': anchor });
      e.textContent = str;
      svg.append(e);
    };
    const xs = [20, 225, 430, 635, 840];
    // layer headings (module terms, Ch1 p.24): sensing = sensors + UNO; networking = the USB / Wi-Fi links;
    // data analysis = laptop app; application = dashboard + the person who acts.
    label((xs[0] + xs[1] + NW) / 2, 30, t_('fl.l1'), 'fl-layer');
    label((xs[1] + NW + xs[2]) / 2, 30, t_('fl.l2'), 'fl-layer');
    label(xs[2] + NW / 2 + 40, 30, t_('fl.l3'), 'fl-layer');
    label((xs[3] + xs[4] + NW) / 2, 30, t_('fl.l4'), 'fl-layer');
    const node = (x, y, k, cls = '') => {
      svg.append(sv('rect', { x, y, width: NW, height: NH, rx: 12, class: 'fl-node ' + cls }));
      label(x + NW / 2, y + 26, t_(k), 'fl-title');
      label(x + NW / 2, y + 45, t_(k + 'D'), 'fl-sub');
    };
    const arrow = (x1, y1, x2, y2, k, ly) => {
      svg.append(sv('line', { x1, y1, x2, y2, class: 'fl-line', 'marker-end': 'url(#flowArrow)' }));
      if (k) label((x1 + x2) / 2, ly ?? Y - 12, t_(k), 'fl-data');
    };
    ['fl.sensors', 'fl.uno', 'fl.app', 'fl.dash', 'fl.person'].forEach((k, i) => node(xs[i], Y, k, k === 'fl.app' ? 'hub' : k === 'fl.person' ? 'human' : ''));
    const mid = Y + NH / 2;
    arrow(xs[0] + NW, mid, xs[1] - 2, mid, 'fl.a1');
    arrow(xs[1] + NW, mid, xs[2] - 2, mid, 'fl.a2');
    arrow(xs[2] + NW, mid, xs[3] - 2, mid, 'fl.a3');
    arrow(xs[3] + NW, mid, xs[4] - 2, mid, 'fl.a4');
    // student phone feeds the app from below
    node(xs[1], 175, 'fl.phone');
    svg.append(sv('polyline', { points: `${xs[1] + NW},${175 + NH / 2} ${xs[2] + NW / 2},${175 + NH / 2} ${xs[2] + NW / 2},${Y + NH + 2}`, class: 'fl-line', 'marker-end': 'url(#flowArrow)' }));
    label(xs[2] + NW / 2 + 8, 175 + NH / 2 - 8, t_('fl.a5'), 'fl-data', 'start');
    // feedback loop: the person's action changes the room, which the sensors and students pick up again
    const ly = 270;
    svg.append(sv('polyline', { points: `${xs[4] + NW / 2},${Y + NH} ${xs[4] + NW / 2},${ly} ${xs[0] + NW / 2},${ly} ${xs[0] + NW / 2},${Y + NH + 2}`, class: 'fl-line loop', 'marker-end': 'url(#flowArrow)' }));
    label((xs[0] + xs[4] + NW) / 2, ly - 8, t_('fl.loop'), 'fl-data loop-label');
    box.append(svg);
  }
  $('#how').addEventListener('toggle', () => { if ($('#how').open) renderFlow(); });

  // ---------- QR pop-up ----------
  let qrCache = null;
  async function openQr() {
    const dlg = $('#qrDialog');
    const box = $('#qrCodes');
    dlg.showModal();
    if (!qrCache) {
      box.textContent = t_('qr.loading');
      try {
        const d = await (await fetch('/api/qr')).json();
        if (d.error) throw new Error(d.error);
        qrCache = d.urls;
      } catch (e) {
        box.textContent = t_('qr.error', { msg: e.message });
        return;
      }
    }
    box.textContent = '';
    if (!qrCache.length) box.textContent = t_('qr.none');
    for (const u of qrCache) {
      const fig = el('figure', 'qr-fig');
      const img = el('img');
      img.alt = 'QR: ' + u.url;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(u.svg);
      fig.append(img, el('figcaption', '', u.url));
      box.append(fig);
    }
  }
  $('#qrBtn').addEventListener('click', openQr);
  $('#qrClose').addEventListener('click', () => $('#qrDialog').close());
  $('#qrDialog').addEventListener('click', (e) => { if (e.target.id === 'qrDialog') e.target.close(); }); // click outside closes

  // ---------- controls ----------
  for (const b of document.querySelectorAll('#ranges button')) {
    b.addEventListener('click', () => {
      rangeMin = Number(b.dataset.min);
      for (const o of document.querySelectorAll('#ranges button')) {
        o.classList.toggle('on', o === b);
        o.setAttribute('aria-pressed', String(o === b));
      }
      renderTiles();
      drawChart();
    });
  }
  $('#themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('c1-theme', next); } catch { /* ignore */ }
  });
  document.addEventListener('click', (e) => {
    for (const d of document.querySelectorAll('details.menu[open]')) if (!d.contains(e.target)) d.removeAttribute('open');
  });

  // ---------- data ----------
  let firstRender = true;
  function render() {
    if (!state) return;
    $('#page').setAttribute('aria-busy', 'false');
    renderVerdict();
    $('#roomName').textContent = t_('room.' + state.room.id) !== 'room.' + state.room.id ? t_('room.' + state.room.id) : state.room.name;
    renderConn();
    renderAttention();
    renderTiles();
    renderFeedback();
    renderLogs();
    renderDevice();
    renderScenarios();
    if (firstRender) {
      firstRender = false;
      drawChart(); // draw immediately; do not wait for the next history refresh
    }
  }

  // One answer to the screen's question: does this room need checking right now?
  function renderVerdict() {
    const v = $('#verdict');
    const open = state.alerts.active.filter((a) => a.status === 'open').length;
    const anyLive = TILES.some((t) => metricView(t).freshness === 'live' && t.id !== 'sim') || state.mode.sensors === 'simulated';
    let key, cls, n;
    if (!sseOk) [key, cls] = ['vd.nodata', 'none'];
    else if (open) [key, cls, n] = ['vd.review', 'bad', open];
    else if (state.alerts.active.length) [key, cls] = ['vd.watching', 'watch'];
    else if (anyLive) [key, cls] = ['vd.ok', 'ok'];
    else [key, cls] = ['vd.nodata', 'none'];
    v.className = 'verdict ' + cls;
    v.textContent = t_(key, { n });
    v.dataset.tip = t_(key + 'Tip', { n });
  }

  function connect() {
    const es = new EventSource('/api/events');
    es.addEventListener('state', (e) => {
      sseOk = true;
      everConnected = true;
      state = JSON.parse(e.data);
      offset = Date.now() - Date.parse(state.now);
      render();
    });
    es.onerror = () => {
      sseOk = false;
      if (state) render();
      else renderConn();
    };
  }

  async function loadHistory() {
    try {
      history = (await (await fetch('/api/history')).json()).history;
      if (state) { renderTiles(); drawChart(); }
    } catch {
      /* the connection pill and note already show the problem */
    }
  }

  buildTiles();
  // #how opens the flow diagram, #qr opens the QR pop-up (handy for links and screenshots).
  if (location.hash === '#how') { $('#how').open = true; renderFlow(); setTimeout(() => $('#how').scrollIntoView(), 600); }
  if (location.hash === '#qr') setTimeout(openQr, 300);
  window.I18N.onChange(() => {
    hideTip();
    if ($('#how').open) renderFlow();
    alertsKey = '';
    if (state) { render(); drawChart(); }
  });
  connect();
  loadHistory();
  setInterval(loadHistory, 4000);
  setInterval(() => { if (state) { renderConn(); renderTiles(); renderDevice(); } }, 1000);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawChart, 150); });
})();
