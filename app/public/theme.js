'use strict';
// Dark by default; remembers the presenter's choice on this laptop. Runs before first paint.
try {
  const fromUrl = new URLSearchParams(location.search).get('theme'); // e.g. ?theme=light for screenshots
  if (fromUrl === 'light' || fromUrl === 'dark') localStorage.setItem('c1-theme', fromUrl);
  const t = localStorage.getItem('c1-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch {
  /* storage blocked: stay dark */
}
