/* ==========================================================================
   Interactions — opening, music, calendar, maps, sharing, chapter rail, video
   ========================================================================== */
(function () {
  const S = window.SITE;
  const env = S.env;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ======================================================================
     MUSIC — one audio element, starts only after the visitor opens the gates
     ====================================================================== */
  const Music = (function () {
    const btn = $('#music-toggle');
    if (!S.musicSrc || !btn) return { start() {} };

    const audio = new Audio();
    audio.src = S.musicSrc;
    audio.loop = true;
    audio.preload = 'auto';

    let ctx = null, gain = null;
    let playing = false;
    let userPaused = false;       // set only by a manual pause
    let resumeOnVisible = false;  // set when the tab hid while playing
    let available = true;
    let pauseTimer = null;

    btn.hidden = false;

    audio.addEventListener('error', () => {
      available = false;
      btn.hidden = true;
      console.warn('[music] Audio file could not be loaded:', S.musicSrc);
    });

    function graph() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC();
        const node = ctx.createMediaElementSource(audio);
        gain = ctx.createGain();
        gain.gain.value = 0;
        node.connect(gain).connect(ctx.destination);
      } catch (e) { ctx = null; gain = null; }
    }

    function fade(to, seconds) {
      if (gain) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(to, t + seconds);
        return;
      }
      const from = audio.volume, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / (seconds * 1000));
        audio.volume = from + (to - from) * k;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function setState(isPlaying) {
      playing = isPlaying;
      btn.classList.toggle('is-playing', isPlaying);
      btn.setAttribute('aria-pressed', String(isPlaying));
      btn.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    }

    async function play(seconds) {
      if (!available) return;
      clearTimeout(pauseTimer);
      graph();
      try {
        if (ctx && ctx.state === 'suspended') await ctx.resume();
        if (!gain) audio.volume = 0;
        await audio.play();
      } catch (e) {
        setState(false);
        return;
      }
      setState(true);
      fade(S.musicVolume, seconds);
    }

    function pause(seconds) {
      fade(0, seconds);
      setState(false);
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => { if (!playing) audio.pause(); }, seconds * 1000 + 50);
    }

    btn.addEventListener('click', () => {
      if (playing) { userPaused = true; pause(0.6); }
      else { userPaused = false; play(1.2); }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey &&
          !document.body.classList.contains('is-locked') &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        btn.click();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (playing) { resumeOnVisible = true; pause(0.2); }
      } else if (resumeOnVisible && !userPaused) {
        resumeOnVisible = false;
        play(1.5);
      } else {
        resumeOnVisible = false;
      }
    });

    return { start() { if (!userPaused) play(2.8); } };
  })();

  /* ======================================================================
     OPENING — tap / click / keyboard on the seal
     ====================================================================== */
  const seal = $('#open-invitation');
  if (seal) {
    seal.addEventListener('click', () => {
      Music.start();
      if (typeof S.openGates === 'function') S.openGates();
    }, { once: true });
  }

  /* ======================================================================
     MAPS — links are built from the supplied address (also present in HTML)
     ====================================================================== */
  $$('[data-maps]').forEach((a) => {
    a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a.dataset.maps);
  });

  /* ======================================================================
     CALENDAR — .ics download and Google Calendar, exact supplied times only
     ====================================================================== */
  const TZ = 'Asia/Kolkata';

  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }

  // Fold lines at 75 octets (RFC 5545)
  function fold(line) {
    const enc = new TextEncoder();
    const parts = [];
    let current = '', bytes = 0, limit = 75;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (bytes + n > limit) {
        parts.push(current);
        current = ''; bytes = 0; limit = 74;
      }
      current += ch; bytes += n;
    }
    parts.push(current);
    return parts.join('\r\n ');
  }

  const toStamp = (local) => local.replace(/[-:]/g, '') + '00';   // 2026-11-30T10:00 -> 20261130T100000

  function buildICS(ev) {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chhaya and Kushal//Wedding//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE',
      'TZID:' + TZ,
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0530',
      'TZOFFSETTO:+0530',
      'TZNAME:IST',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      'UID:' + ev.id + '-2026@chhaya-kushal',
      'DTSTAMP:' + now,
      'DTSTART;TZID=' + TZ + ':' + toStamp(ev.start),
      'SUMMARY:' + icsEscape(ev.title),
      'LOCATION:' + icsEscape(ev.location),
      'DESCRIPTION:' + icsEscape(ev.details),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function googleUrl(ev) {
    const stamp = toStamp(ev.start);
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.title,
      dates: stamp + '/' + stamp,
      ctz: TZ,
      location: ev.location,
      details: ev.details
    });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }

  function downloadICS(ev) {
    const blob = new Blob([buildICS(ev)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ev.id + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  let openMenu = null;
  function closeMenu(returnFocus) {
    if (!openMenu) return;
    const { menu, toggle } = openMenu;
    menu.remove();
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
    openMenu = null;
  }

  $$('.cal__toggle').forEach((toggle, i) => {
    const host = toggle.closest('[data-cal-start]');
    if (!host) return;
    const ev = {
      id: host.dataset.calId || 'event-' + i,
      title: host.dataset.calTitle,
      start: host.dataset.calStart,
      location: host.dataset.calLocation || '',
      details: host.dataset.calDetails || ''
    };
    const menuId = 'cal-menu-' + i;
    toggle.setAttribute('aria-controls', menuId);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = openMenu && openMenu.toggle === toggle;
      closeMenu(false);
      if (wasOpen) return;

      const menu = document.createElement('div');
      menu.className = 'cal__menu';
      menu.id = menuId;

      const g = document.createElement('a');
      g.className = 'cal__item';
      g.href = googleUrl(ev);
      g.target = '_blank';
      g.rel = 'noopener';
      g.textContent = 'Google Calendar';

      const f = document.createElement('button');
      f.type = 'button';
      f.className = 'cal__item';
      f.textContent = 'Apple / Outlook (.ics)';
      f.addEventListener('click', () => { downloadICS(ev); closeMenu(true); });

      g.addEventListener('click', () => closeMenu(false));
      menu.append(g, f);
      toggle.parentElement.appendChild(menu);
      toggle.setAttribute('aria-expanded', 'true');
      openMenu = { menu, toggle };
      g.focus({ preventScroll: true });
    });
  });

  document.addEventListener('click', (e) => {
    if (openMenu && !openMenu.menu.contains(e.target)) closeMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu(true);
  });

  /* ======================================================================
     SHARING
     ====================================================================== */
  const shareUrl = () => S.shareUrl || window.location.href.split('#')[0];
  const status = $('.share__status');
  const say = (msg) => {
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say.t);
    say.t = setTimeout(() => { status.textContent = ''; }, 3000);
  };

  const nativeBtn = $('[data-share="native"]');
  if (nativeBtn && navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener('click', () => {
      navigator.share({ title: S.shareTitle, url: shareUrl() }).catch(() => {});
    });
  }

  const wa = $('[data-share="whatsapp"]');
  if (wa) {
    const update = () => { wa.href = 'https://wa.me/?text=' + encodeURIComponent(S.shareTitle + ' ' + shareUrl()); };
    update();
    wa.addEventListener('focus', update);
    wa.addEventListener('pointerdown', update);
  }

  const copyBtn = $('[data-share="copy"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const url = shareUrl();
      try {
        await navigator.clipboard.writeText(url);
        say('Link copied');
      } catch (e) {
        const t = document.createElement('textarea');
        t.value = url;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        t.remove();
        say(ok ? 'Link copied' : url);
      }
    });
  }

  /* ======================================================================
     CHAPTER RAIL
     ====================================================================== */
  const railLinks = $$('[data-chapter-link]');
  railLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      S.scrollTo(a.getAttribute('href'));
    });
  });

  if ('IntersectionObserver' in window && railLinks.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const n = entry.target.dataset.chapter;
        railLinks.forEach((a) => {
          const active = a.dataset.chapterLink === n;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('[data-chapter]').forEach((ch) => io.observe(ch));
  }

  /* ======================================================================
     VIDEO — load near the viewport, play only while visible
     ====================================================================== */
  const videos = $$('video[data-src]');
  function loadVideo(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    v.preload = env.reduced ? 'metadata' : 'auto';
    v.src = v.dataset.src + (env.reduced ? '#t=0.1' : '');
    v.addEventListener('error', () => { v.hidden = true; }, { once: true });
  }
  function playVideo(v) {
    if (env.reduced || document.hidden) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { loadVideo(e.target); near.unobserve(e.target); } });
    }, { rootMargin: '600px 0px' });
    const visible = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.dataset.visible = e.isIntersecting ? '1' : '';
        if (e.isIntersecting) { loadVideo(e.target); playVideo(e.target); }
        else e.target.pause();
      });
    }, { threshold: 0.15 });
    videos.forEach((v) => { near.observe(v); visible.observe(v); });
  } else {
    videos.forEach((v) => { loadVideo(v); playVideo(v); });
  }

  document.addEventListener('visibilitychange', () => {
    videos.forEach((v) => {
      if (document.hidden) v.pause();
      else if (v.dataset.visible) playVideo(v);
    });
  });
})();
