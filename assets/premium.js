// Premium layer: smooth momentum scroll (Lenis), cursor spotlight coordinates, scroll progress bar.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cursor position for card spotlights
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('.card,.step,.price-card,.faq-item,.post-card,.compare-card,.plan-card,.material-mock,.callout,.fv-card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // scroll progress bar
  var bar = document.createElement('div');
  bar.className = 'scroll-bar';
  document.body.appendChild(bar);
  function progress() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  }
  addEventListener('scroll', progress, { passive: true });
  progress();

  // smooth momentum scrolling (desktop pointers only)
  if (reduce || !window.matchMedia('(pointer: fine)').matches) return;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
  s.onload = function () {
    if (!window.Lenis) return;
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.querySelector(a.getAttribute('href'));
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); }
      });
    });
  };
  document.head.appendChild(s);
})();
