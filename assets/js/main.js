/* AXON PRO — Direction A "Clean corporate"
   Vanilla JS: header shadow, dropdowns, mobile menu, hero tabs, TOC highlight, reveal.
   No dependencies, no build step. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var desktopMQ = window.matchMedia('(min-width: 1241px)');
  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  root.classList.remove('no-js');
  root.classList.add('js');

  /* ---------------- Header shadow on scroll ---------------- */
  var header = doc.querySelector('[data-header]');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Dropdowns ---------------- */
  var toggles = Array.prototype.slice.call(doc.querySelectorAll('[data-dd-toggle]'));
  var closeTimer = null;

  function setOpen(btn, open) {
    var item = btn.parentElement;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('is-open', open);
  }
  function closeAll(except) {
    toggles.forEach(function (b) { if (b !== except) setOpen(b, false); });
  }

  toggles.forEach(function (btn) {
    var item = btn.parentElement;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      // On desktop only one dropdown at a time; on mobile accordions may stack.
      if (desktopMQ.matches) closeAll(btn);
      setOpen(btn, open);
    });

    // Hover intent for mouse users on desktop
    item.addEventListener('mouseenter', function () {
      if (!desktopMQ.matches || !finePointer.matches) return;
      clearTimeout(closeTimer);
      closeAll(btn);
      setOpen(btn, true);
    });
    item.addEventListener('mouseleave', function () {
      if (!desktopMQ.matches || !finePointer.matches) return;
      closeTimer = setTimeout(function () { setOpen(btn, false); }, 160);
    });

    // Close when focus leaves the item (desktop)
    item.addEventListener('focusout', function (ev) {
      if (!desktopMQ.matches) return;
      if (!item.contains(ev.relatedTarget)) setOpen(btn, false);
    });

    // Arrow-down on the group link (next to the chevron) also opens the submenu
    var groupLink = item.querySelector('.nav-link');
    if (groupLink) groupLink.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setOpen(btn, true);
        var first = item.querySelector('.dropdown a');
        if (first) first.focus();
      }
    });

    // Arrow-down from trigger moves into the menu
    btn.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setOpen(btn, true);
        var first = item.querySelector('.dropdown a');
        if (first) first.focus();
      }
    });
    item.querySelector('.dropdown').addEventListener('keydown', function (ev) {
      var links = Array.prototype.slice.call(item.querySelectorAll('.dropdown a'));
      var i = links.indexOf(doc.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); links[(i + 1) % links.length].focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); if (i <= 0) btn.focus(); else links[i - 1].focus(); }
    });
  });

  doc.addEventListener('click', function (ev) {
    if (!desktopMQ.matches) return;
    if (!ev.target.closest('.nav-item')) closeAll();
  });

  /* ---------------- Mobile menu ---------------- */
  var navToggle = doc.querySelector('[data-nav-toggle]');
  var nav = doc.querySelector('[data-nav]');

  function menuOpen() { return navToggle && navToggle.getAttribute('aria-expanded') === 'true'; }
  function setMenu(open, opts) {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? (navToggle.getAttribute('data-label-close') || 'Close menu') : (navToggle.getAttribute('data-label-open') || 'Menu'));
    nav.classList.toggle('is-open', open);
    doc.body.classList.toggle('nav-open', open);
    if (open) {
      var first = nav.querySelector('button, a');
      if (first) first.focus({ preventScroll: true });
    } else {
      closeAll();
      if (!opts || opts.returnFocus !== false) navToggle.focus({ preventScroll: true });
    }
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () { setMenu(!menuOpen()); });

    // Focus trap inside open mobile menu (toggle + panel)
    doc.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (menuOpen()) { setMenu(false); return; }
        var openBtn = toggles.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
        if (openBtn) { setOpen(openBtn, false); openBtn.focus(); }
        return;
      }
      if (ev.key !== 'Tab' || !menuOpen()) return;
      var focusables = [navToggle].concat(Array.prototype.slice.call(
        nav.querySelectorAll('a[href], button:not([disabled])')
      ).filter(function (el) { return el.offsetParent !== null; }));
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (ev.shiftKey && doc.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && doc.activeElement === last) { ev.preventDefault(); first.focus(); }
    });

    var onBreakpoint = function () { if (desktopMQ.matches && menuOpen()) setMenu(false, { returnFocus: false }); closeAll(); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onBreakpoint);
    else desktopMQ.addListener(onBreakpoint);
  }

  /* ---------------- Hero (tabs + optional autoplay) ---------------- */
  var hero = doc.querySelector('[data-hero]');
  if (hero) initHero(hero);

  function initHero(hero) {
    var tabsWrap = hero.querySelector('[data-hero-tabs]');
    var tablist = hero.querySelector('[data-hero-tablist]');
    var tabs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-tab]'));
    var panels = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-panel]'));
    var frames = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-media]'));
    var toggle = hero.querySelector('[data-hero-toggle]');
    var chipLabel = hero.querySelector('[data-hero-chip-label]');
    var chipCount = hero.querySelector('[data-hero-chip-count]');
    var INTERVAL = 8000;
    var current = 0;
    var timer = null;
    var userPaused = reducedMQ.matches;   // no autoplay for reduced-motion users
    var hoverPaused = false;

    hero.style.setProperty('--hero-interval', INTERVAL + 'ms');

    // Upgrade markup to an ARIA tabs widget
    tabsWrap.hidden = false;
    tablist.setAttribute('role', 'tablist');
    tabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.addEventListener('click', function () { select(i, true); restart(); });
      tab.addEventListener('keydown', onKey);
    });
    panels.forEach(function (p, i) {
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', tabs[i].id);
      p.tabIndex = -1;
    });

    // Lazy-load the remaining hero images once the page is idle
    var loadRest = function () {
      frames.forEach(function (f) {
        var img = f.querySelector('img[data-src]');
        if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
      });
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadRest, { timeout: 3000 });
    else window.addEventListener('load', function () { setTimeout(loadRest, 600); });

    function select(i, focusTab) {
      if (i === current) { if (focusTab) tabs[i].focus(); return; }
      var prev = current;
      current = i;
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels[prev].hidden = true;
      panels[i].hidden = false;
      panels[i].classList.remove('is-entering');
      void panels[i].offsetWidth; // restart animation
      panels[i].classList.add('is-entering');
      frames.forEach(function (f, n) {
        var img = f.querySelector('img[data-src]');
        if (n === i && img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
        f.classList.toggle('is-active', n === i);
      });
      if (chipLabel) chipLabel.textContent = tabs[i].textContent.trim();
      if (chipCount) chipCount.textContent = pad(i + 1) + ' / ' + pad(tabs.length);
      if (focusTab) tabs[i].focus();
    }

    function onKey(ev) {
      var i = tabs.indexOf(ev.currentTarget);
      var next = null;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (ev.key === 'Home') next = 0;
      else if (ev.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      ev.preventDefault();
      select(next, true);
      restart();
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function playing() { return !userPaused && !hoverPaused && !doc.hidden; }
    function stop() { clearTimeout(timer); timer = null; }
    function restart() {
      stop();
      // retrigger CSS progress bar
      hero.classList.remove('is-playing');
      void hero.offsetWidth;
      update();
    }
    function update() {
      hero.classList.toggle('is-playing', !userPaused);
      hero.classList.toggle('is-paused', !playing());
      stop();
      if (playing()) {
        timer = setTimeout(function () { select((current + 1) % tabs.length, false); restart(); }, remaining());
      }
    }
    // Keep it simple: on resume start a fresh interval.
    function remaining() { return INTERVAL; }

    toggle.addEventListener('click', function () {
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      toggle.setAttribute('aria-label', userPaused ? toggle.getAttribute('data-label-play') : toggle.getAttribute('data-label-pause'));
      restart();
    });
    if (userPaused) {
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('aria-label', toggle.getAttribute('data-label-play'));
    }

    // Pause while the user is hovering or interacting with the hero
    hero.addEventListener('mouseenter', function () { hoverPaused = true; restart(); });
    hero.addEventListener('mouseleave', function () { hoverPaused = false; restart(); });
    hero.addEventListener('focusin', function () { hoverPaused = true; restart(); });
    hero.addEventListener('focusout', function (ev) { if (!hero.contains(ev.relatedTarget)) { hoverPaused = false; restart(); } });
    doc.addEventListener('visibilitychange', restart);

    update();
  }

  /* ---------------- Article TOC highlight ---------------- */
  var toc = doc.querySelector('[data-toc]');
  if (toc && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    var map = {};
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var el = doc.getElementById(id);
      if (el) map[id] = a;
    });
    var tocObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { tocObs.observe(doc.getElementById(id)); });
  }


  /* ---------------- Homepage: highlight the section in view in the top menu ---------------- */
  var spyMap = { 'ai': 'ai', 'bezpecnost': 'security', 'sluzby': 'service', 'softver': 'software', 'projekty': 'project', 'o-nas': 'about', 'kontakt': 'contact' };
  var spySections = Object.keys(spyMap).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
  if (spySections.length) {
    var siteHeader = doc.querySelector('.site-header');
    var progress = doc.createElement('span');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    if (siteHeader) siteHeader.appendChild(progress);
    var spyItems = doc.querySelectorAll('[data-section]');
    var lastSpy;
    var updateSpy = function () {
      var line = window.innerHeight * 0.45, cur = null;
      var best = -Infinity;
      spySections.forEach(function (s) { var top = s.getBoundingClientRect().top; if (top <= line && top > best) { best = top; cur = spyMap[s.id]; } });
      if (cur !== lastSpy) {
        lastSpy = cur;
        Array.prototype.forEach.call(spyItems, function (el) {
          el.classList.toggle('is-spy', el.getAttribute('data-section') === cur);
        });
      }
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', updateSpy, { passive: true });
    window.addEventListener('resize', updateSpy);
    updateSpy();
  }

  /* ---------------- Reveal on scroll ---------------- */
  var reveals = doc.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reducedMQ.matches) {
    root.classList.add('reveal-on');
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(reveals, function (el) { revObs.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  }
})();
