/* ==========================================================================
   Animations — GSAP timelines, ScrollTrigger scenes, ember canvas.
   Everything degrades gracefully: without GSAP the CSS fallbacks in
   animations.css take over, with reduced motion only simple fades remain.
   ========================================================================== */
(function () {
  const S = window.SITE;
  const env = S.env;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const motion = env.hasGSAP && !env.reduced;

  /* ---------- Split display names into characters ---------- */
  $$('[data-split="chars"]').forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = '';
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      el.appendChild(span);
    }
  });

  /* ---------- Curtains inside arch frames (architectural mask reveal) ---------- */
  if (motion) {
    $$('[data-reveal-img] .arch-frame__clip').forEach((clip) => {
      const c = document.createElement('div');
      c.className = 'arch-frame__curtain';
      clip.appendChild(c);
    });
  }

  /* ======================================================================
     EMBERS — a few warm motes of lantern light (canvas, paused off-screen)
     ====================================================================== */
  function Embers(canvas, count) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, running = false, parts = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, initial) {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 10;
      p.r = 0.6 + Math.random() * 1.8;
      p.vy = 0.12 + Math.random() * 0.38;
      p.phase = Math.random() * Math.PI * 2;
      p.a = 0.25 + Math.random() * 0.55;
      return p;
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.phase += 0.012;
        p.x += Math.sin(p.phase) * 0.25;
        if (p.y < -10) spawn(p, false);
        const a = p.a * (0.65 + 0.35 * Math.sin(p.phase * 2.3));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 186, 110,' + (a * 0.22).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 222, 170,' + a.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    this.start = () => {
      if (running) return;
      running = true;
      resize();
      if (!parts.length) parts = Array.from({ length: count }, () => spawn({}, true));
      raf = requestAnimationFrame(tick);
    };
    this.stop = () => { running = false; cancelAnimationFrame(raf); };
    window.addEventListener('resize', () => { if (running) resize(); });
  }

  const embers = {};
  if (!env.reduced) {
    const n = env.lowPower ? 14 : (window.innerWidth < 700 ? 22 : 40);
    $$('canvas[data-embers]').forEach((cv) => {
      const e = new Embers(cv, n);
      embers[cv.dataset.embers] = e;
      if ('IntersectionObserver' in window && cv.dataset.embers !== 'opening') {
        new IntersectionObserver((entries) => {
          entries.forEach((en) => (en.isIntersecting && !document.hidden ? e.start() : e.stop()));
        }).observe(cv);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Object.values(embers).forEach((e) => e.stop());
    });
  }

  /* ======================================================================
     OPENING — reveal the gates, then open them on interaction
     ====================================================================== */
  const opening = $('#opening');
  const seal = $('#open-invitation');
  const heroChars = $$('.prelude__names .char');
  let opened = false;

  if (embers.opening) embers.opening.start();

  if (motion) {
    gsap.set('.opening__doors', { scale: 1.12, transformOrigin: '50% 50%' });
    gsap.set('.opening__cta', { autoAlpha: 0, y: 14 });
    gsap.set('.opening__seam', { opacity: 0, scaleY: 0.2 });
    // Hero waits behind the gates
    gsap.set(heroChars, { yPercent: 55, opacity: 0 });
    gsap.set(['.prelude__names .amp', '.prelude__orn', '.prelude__date', '.scroll-cue'], { opacity: 0, y: 18 });
    gsap.set('.prelude__bg img', { scale: 1.12 });

    gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: () => seal && seal.focus({ preventScroll: true }) })
      .to('.opening__veil', { autoAlpha: 0, duration: 2.4, ease: 'power1.inOut' })
      .to('.opening__doors', { scale: 1, duration: 3.6, ease: 'power3.out' }, 0)
      .to('.opening__seam', { opacity: 0.6, scaleY: 1, duration: 1.8, ease: 'power2.inOut' }, 1.1)
      .to('.opening__cta', { autoAlpha: 1, y: 0, duration: 1.2 }, 2.1);
  } else if (env.hasGSAP) {
    gsap.set('.opening__veil', { autoAlpha: 0 });
    if (seal) seal.focus({ preventScroll: true });
  } else if (seal) {
    setTimeout(() => seal.focus({ preventScroll: true }), 1800);
  }

  function heroIn() {
    if (!motion) return;
    gsap.to('.prelude__bg img', { scale: 1, duration: 3.2, ease: 'power2.out' });
    gsap.to(heroChars, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.055, ease: 'power3.out', delay: 0.15 });
    gsap.to('.prelude__names .amp', { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out', delay: 0.5 });
    gsap.to(['.prelude__orn', '.prelude__date', '.scroll-cue'], { opacity: 1, y: 0, duration: 1.1, stagger: 0.15, ease: 'power2.out', delay: 0.9 });
  }

  function finishOpening() {
    opening.classList.add('is-done');
    opening.setAttribute('aria-hidden', 'true');
    if (embers.opening) embers.opening.stop();
    S.unlockScroll();
    const main = $('#main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
  }

  S.openGates = function () {
    if (opened || !opening) return;
    opened = true;
    opening.classList.add('is-opening');

    if (!env.hasGSAP) {
      setTimeout(finishOpening, env.reduced ? 700 : 3500);
      return;
    }
    if (env.reduced) {
      gsap.to(opening, { autoAlpha: 0, duration: 0.6, onComplete: finishOpening });
      return;
    }

    gsap.timeline({ onComplete: finishOpening })
      .to('.opening__cta', { autoAlpha: 0, scale: 1.08, duration: 0.6, ease: 'power2.in' })
      .to('.opening__seam', { opacity: 1, scaleX: 5, duration: 0.5, ease: 'power2.in' }, 0.2)
      .to('.opening__glow', { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.5)
      .to('.door--left', { rotateY: 92, duration: 2.6, ease: 'power3.inOut' }, 0.55)
      .to('.door--right', { rotateY: -92, duration: 2.6, ease: 'power3.inOut' }, 0.55)
      .to('.door__shade', { opacity: 0.8, duration: 2.2, ease: 'power2.in' }, 0.55)
      .to('.opening__seam', { opacity: 0, duration: 0.6 }, 0.9)
      // the camera walks through the gateway into the courtyard
      .to('.opening__doors', { scale: 1.45, duration: 2.8, ease: 'power2.in' }, 0.9)
      .fromTo('.opening__courtyard', { scale: 1 }, { scale: 1.12, duration: 3.4, ease: 'power2.inOut' }, 0.55)
      .to('.opening__glow', { opacity: 0, duration: 1.2 }, 2.6)
      .call(heroIn, null, 3.2)
      .to(opening, { autoAlpha: 0, duration: 1, ease: 'power1.inOut' }, 3.3);
  };

  if (!motion) return;

  /* ======================================================================
     SCROLL SCENES
     ====================================================================== */
  const vh = () => window.innerHeight;

  // Prelude drifts away
  gsap.to('.prelude__bg', {
    yPercent: 16, ease: 'none',
    scrollTrigger: { trigger: '.prelude', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.prelude__content', {
    y: -90, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.prelude', start: 'top top', end: '60% top', scrub: true }
  });

  // Chapters — the backdrop opens through a palace arch as you enter
  const mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 900px)',
    mobile: '(max-width: 899px)'
  }, (c) => {
    const archFrom = c.conditions.desktop
      ? 'inset(15% 34% 0% 34% round 40vw 40vw 0vw 0vw)'
      : 'inset(13% 13% 0% 13% round 50vw 50vw 0vw 0vw)';
    const archTo = 'inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)';

    $$('.chapter').forEach((ch) => {
      const win = $('.chapter__window', ch);
      const img = $('.chapter__window img', ch);
      const scrim = $('.chapter__scrim', ch);
      const intro = $('.chapter__intro', ch);
      const range = { trigger: ch, start: 'top top', end: () => '+=' + vh() * 0.95, scrub: true };

      if (!env.lowPower) {
        gsap.fromTo(win, { clipPath: archFrom }, { clipPath: archTo, ease: 'none', scrollTrigger: range });
      }
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: range });
      gsap.fromTo(scrim, { opacity: 0.45 }, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: ch, start: () => 'top top-=' + vh() * 0.3, end: () => 'top top-=' + vh() * 0.95, scrub: true }
      });

      // Intro titles arrive, then lift away as the arch opens
      gsap.from(intro.children, {
        y: 40, opacity: 0, duration: 1.3, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: ch, start: 'top 55%', once: true }
      });
      gsap.to(intro, {
        y: () => -vh() * 0.2, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: ch, start: () => 'top top-=' + vh() * 0.35, end: () => 'top top-=' + vh() * 0.9, scrub: true }
      });

      // Slow drift of the backdrop for the rest of the chapter
      gsap.to(img, {
        yPercent: -4, ease: 'none',
        scrollTrigger: { trigger: ch, start: () => 'top top-=' + vh(), end: 'bottom bottom', scrub: true }
      });
    });
  });

  // Text reveals
  gsap.set('[data-reveal]', { opacity: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.15, stagger: 0.12, ease: 'power3.out', overwrite: true })
  });

  // Arch image / video reveals
  $$('[data-reveal-img]').forEach((frame) => {
    const curtain = $('.arch-frame__curtain', frame);
    const media = $('.arch-frame__clip img, .arch-frame__clip video:not(.graded-video--top)', frame);
    const line = $('.arch-frame__line', frame);
    const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 82%', once: true } });
    tl.from(frame, { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out' })
      .to(curtain, { yPercent: -101, duration: 1.6, ease: 'power3.inOut' }, 0.15)
      .from(media, { scale: 1.3, duration: 2.2, ease: 'power3.out' }, 0.15)
      .from(line, { opacity: 0, duration: 1.4 }, 0.8);

    const img = $('.arch-frame__clip img', frame);
    if (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  // Grand names — letters rise in sequence
  $$('.names-grand, .closing__names').forEach((block) => {
    const chars = $$('.char', block);
    const amp = $('.names-grand__amp, .amp', block);
    const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: 'top 80%', once: true } });
    tl.from(chars, { yPercent: 60, opacity: 0, duration: 1.4, stagger: 0.05, ease: 'power3.out' })
      .from(amp, { opacity: 0, scale: 0.6, duration: 1.4, ease: 'power2.out' }, 0.35);
  });

  // Om — a soft glow arrives
  gsap.from('.om img', {
    scale: 0.85, filter: 'drop-shadow(0 0 0px rgba(216,150,60,0))', duration: 2, ease: 'power2.out',
    scrollTrigger: { trigger: '.om', start: 'top 85%', once: true }
  });

  // Timeline — spine draws, markers ignite, events slide in
  gsap.fromTo('.timeline__spine span', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true }
  });
  $$('.event').forEach((ev, i) => {
    const fromRight = window.innerWidth >= 900 && i % 2 === 1;
    ScrollTrigger.create({
      trigger: ev, start: 'top 70%',
      onEnter: () => ev.classList.add('is-active'),
      onLeaveBack: () => ev.classList.remove('is-active')
    });
    const tl = gsap.timeline({ scrollTrigger: { trigger: ev, start: 'top 82%', once: true } });
    tl.from($('.event__day', ev), { opacity: 0, x: fromRight ? 50 : -50, duration: 1.4, ease: 'power3.out' })
      .from($('.event__month', ev), { opacity: 0, duration: 1 }, 0.4)
      .from($$('.event__info > *', ev), { opacity: 0, y: 24, duration: 1, stagger: 0.09, ease: 'power3.out' }, 0.2);
  });

  // Plaque & stars
  gsap.from('.plaque__names li', {
    opacity: 0, y: 12, duration: 0.9, stagger: 0.07, ease: 'power2.out',
    scrollTrigger: { trigger: '.plaque__names', start: 'top 85%', once: true }
  });
  gsap.from('.stars__sep svg', {
    opacity: 0, scale: 0, rotate: -90, duration: 1.1, stagger: 0.15, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.stars__names', start: 'top 85%', once: true }
  });

  // Lanterns — gentle parallax depth
  $$('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0;
    gsap.fromTo(el, { yPercent: 0 }, {
      yPercent: speed * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Closing — the camera pulls back to reveal the palace at night
  gsap.fromTo('.closing__bg img', { scale: 1.3 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom bottom', scrub: true }
  });
  gsap.from(['.closing__lotus', '.closing__content .orn--divider', '.closing__date', '.share'], {
    opacity: 0, y: 24, duration: 1.2, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.closing__content', start: 'top 85%', once: true }
  });
})();
