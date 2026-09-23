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

})();
