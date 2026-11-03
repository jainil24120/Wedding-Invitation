/* ==========================================================================
   Chhaya & Kushal — site configuration and core setup
   ========================================================================== */

window.SITE = {
  // Background music. Add the client's file to assets/music/ and put its path here,
  // e.g. 'assets/music/wedding-theme.mp3'. Leave empty to hide the music control.
  musicSrc: '',
  musicVolume: 0.6,

  // Wednesday, December 2, 2026, 8:00 PM — Asia/Kolkata (UTC+05:30)
  countdownTarget: '2026-12-02T20:00:00+05:30',

  // Sharing. Leave shareUrl empty to share the address the page is opened from.
  shareTitle: 'Chhaya & Kushal',
  shareUrl: ''
};

(function () {
  const S = window.SITE;
  const root = document.documentElement;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = navigator.connection || {};
  const lowPower = !!(
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    conn.saveData
  );
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  root.classList.add('js', hasGSAP ? 'has-gsap' : 'no-gsap');
  if (reduced) root.classList.add('reduced');
  if (lowPower) root.classList.add('low-power');

  S.env = {
    reduced,
    lowPower,
    hasGSAP,
    isTouch: window.matchMedia('(hover: none)').matches
  };

  // Always start at the palace gates
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Smooth scrolling (Lenis driven by the GSAP ticker) ---------- */
  let lenis = null;
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !reduced) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
  }
  S.lenis = lenis;

  S.scrollTo = function (target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.8 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- Scroll lock while the gates are closed ---------- */
  const lockable = ['#main', '.rail', '#music-toggle', '.credit'];
  S.lockScroll = function () {
    document.body.classList.add('is-locked');
    lockable.forEach((sel) => { const el = document.querySelector(sel); if (el) el.inert = true; });
    if (lenis) lenis.stop();
  };
  S.toTop = function () {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  };
  window.addEventListener('load', () => { if (document.body.classList.contains('is-locked')) S.toTop(); });

  S.unlockScroll = function () {
    S.toTop();
    document.body.classList.remove('is-locked');
    lockable.forEach((sel) => { const el = document.querySelector(sel); if (el) el.inert = false; });
    if (lenis) lenis.start();
    if (hasGSAP) ScrollTrigger.refresh();
  };
  S.lockScroll();

  /* ---------- Image loading fallbacks ---------- */
  document.querySelectorAll('img').forEach((img) => {
    const fail = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
    else img.addEventListener('error', fail, { once: true });
  });

  /* ---------- Recalculate scroll positions once fonts settle ---------- */
  if (hasGSAP && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
