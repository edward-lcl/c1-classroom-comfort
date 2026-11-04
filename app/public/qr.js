'use strict';
(async function () {
  const t = (k, v) => window.I18N.t(k, v);
  const box = document.getElementById('codes');
  let urls = null;
  let error = null;

  function render() {
    box.textContent = '';
    if (error) return (box.textContent = t('qr.error', { msg: error }));
    if (!urls) return;
    if (!urls.length) return (box.textContent = t('qr.none'));
    for (const u of urls) {
      const fig = document.createElement('figure');
      fig.className = 'qr';
      // The SVG comes from our own server (qrcode library), not from user input.
      const img = document.createElement('img');
      img.alt = 'QR: ' + u.url;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(u.svg);
      const cap = document.createElement('figcaption');
      cap.textContent = `${u.url}  (${t('qr.adapter', { name: u.interface })})`;
      fig.append(img, cap);
      box.append(fig);
    }
  }

  window.I18N.onChange(render);
  try {
    const d = await (await fetch('/api/qr')).json();
    if (d.error) throw new Error(d.error);
    urls = d.urls;
  } catch (e) {
    error = e.message;
  }
  render();
})();
