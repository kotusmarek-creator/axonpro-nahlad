/*
  AXON PRO – efekty k fotkám
  v1.1 (2026-11-20)
    - parallax bannerov zmenšený na ±8 px
  v1.0 (2026-11-20)
    - zapne triedu .fx, doplní svetelný prelet do hero dlaždíc a kariet s fotkou
    - stagger: karty v jednej mriežke sa objavujú postupne
    - bannery: 3D náklon za myšou (len jemné myši, nie dotyk), odlesk, parallax pri skrolovaní
    - pri prefers-reduced-motion sa pohyb nespúšťa
*/
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('fx');

  function sheen(el) {
    if (el.querySelector('.fx-sheen')) return;
    var s = doc.createElement('span');
    s.className = 'fx-sheen';
    s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  }
  doc.querySelectorAll('.te-tile, .card__media--photo').forEach(sheen);

  // stagger – poradie v rámci mriežky
  doc.querySelectorAll('.bento').forEach(function (grid) {
    grid.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--fx-d', (Math.min(i, 6) * 0.09).toFixed(2) + 's');
    });
  });

  if (reduced) return;

  var medias = doc.querySelectorAll('.feature__media');
  medias.forEach(function (m) {
    var g = doc.createElement('span');
    g.className = 'fx-glare';
    g.setAttribute('aria-hidden', 'true');
    m.appendChild(g);
  });

  // náklon – len pre presné ukazovadlo (myš)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    medias.forEach(function (m) {
      var raf = 0;
      m.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = m.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          m.classList.add('is-tilt');
          m.style.transform = 'perspective(1200px) rotateX(' + ((0.5 - y) * 5).toFixed(2) +
            'deg) rotateY(' + ((x - 0.5) * 7).toFixed(2) + 'deg) translateZ(0)';
          m.style.setProperty('--fx-gx', (x * 100).toFixed(1) + '%');
          m.style.setProperty('--fx-gy', (y * 100).toFixed(1) + '%');
        });
      });
      m.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        m.classList.remove('is-tilt');
        m.style.transform = '';
      });
    });
  }

  // parallax fotky v banneri – len keď je banner na obrazovke
  var visible = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
      tick();
    });
    medias.forEach(function (m) { io.observe(m); });
  }
  var pending = false;
  function tick() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var vh = window.innerHeight;
      visible.forEach(function (m) {
        var r = m.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
        m.style.setProperty('--fx-py', (p * -8).toFixed(1) + 'px');
      });
    });
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
})();
