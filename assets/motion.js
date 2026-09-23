// Scroll-reveal for sections/cards and count-up for stats. No-op with reduced motion.
// Uses a scroll check (not IntersectionObserver alone) so content can never stay hidden.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var targets = Array.prototype.slice.call(document.querySelectorAll(
    'section .section-head, section .wrap > *:not(.section-head), .fv-card, .trust-stat, .step, .price-card'));
  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
  });

  function show(el) {
    el.classList.add('in');
    var n = el.querySelector('.t-stat');
    if (n) countUp(n);
  }
  function check() {
    var limit = window.innerHeight * 0.92;
    targets = targets.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) { show(el); return false; }
      return true;
    });
    if (!targets.length) window.removeEventListener('scroll', onScroll);
  }
  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; check(); }, 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();

  function countUp(el) {
    var m = el.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    var end = +m[1], suffix = m[2], t0 = Date.now();
    (function tick() {
      var p = Math.min(1, (Date.now() - t0) / 1200);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) setTimeout(tick, 16);
    })();
  }
})();
