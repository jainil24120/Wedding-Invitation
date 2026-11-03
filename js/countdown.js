/* ==========================================================================
   Live countdown — Wednesday, December 2, 2026, 8:00 PM (Asia/Kolkata)
   ========================================================================== */
(function () {
  const el = document.getElementById('countdown');
  if (!el) return;

  const target = Date.parse((window.SITE && window.SITE.countdownTarget) || '2026-12-02T20:00:00+05:30');
  const grid = el.querySelector('.countdown__grid');
  const done = el.querySelector('.countdown__done');
  const out = {};
  el.querySelectorAll('[data-unit]').forEach((node) => { out[node.dataset.unit] = node; });

  const pad = (n) => String(n).padStart(2, '0');
  let timer = null;

  function set(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function render() {
    const diff = target - Date.now();
    if (!(diff > 0)) {
      grid.hidden = true;
      done.hidden = false;
      el.setAttribute('aria-live', 'polite');
      if (timer) clearInterval(timer);
      timer = null;
      return;
    }
    const total = Math.floor(diff / 1000);
    set(out.days, pad(Math.floor(total / 86400)));
    set(out.hours, pad(Math.floor((total % 86400) / 3600)));
    set(out.minutes, pad(Math.floor((total % 3600) / 60)));
    set(out.seconds, pad(total % 60));
  }

  render();
  if (Date.now() < target) timer = setInterval(render, 1000);

  // Correct any drift after the tab was in the background
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
