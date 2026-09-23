// Loads background videos only when they're near the screen, picking a small file on phones / slow
// connections. Videos carry data-video="name" and a poster; the poster shows until the clip is ready.
(function () {
  var conn = navigator.connection || {};
  var small = window.matchMedia('(max-width: 800px)').matches || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vids = Array.prototype.slice.call(document.querySelectorAll('video[data-video]'));
  if (reduce) return; // posters only

  function load(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    v.src = '/assets/video/' + v.dataset.video + (small ? '-m' : '') + '.mp4';
    v.muted = true;
    v.addEventListener('canplay', function () { var q = v.play(); if (q && q.catch) q.catch(function () {}); }, { once: true });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function check() {
    var h = window.innerHeight;
    vids.forEach(function (v) {
      var r = v.getBoundingClientRect();
      var near = r.top < h * 1.5 && r.bottom > -h * 0.5;
      if (near) { load(v); if (v.paused && v.dataset.loaded) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
      else if (v.dataset.loaded && !v.paused) v.pause();
    });
  }
  var queued = false;
  function onScroll() { if (queued) return; queued = true; setTimeout(function () { queued = false; check(); }, 120); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
})();
