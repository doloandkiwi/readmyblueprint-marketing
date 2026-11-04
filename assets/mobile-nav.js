// Phone / tablet menu. Reads the page's existing desktop nav links (.nav-links or .links) and builds a
// button + panel from them, so the menu can never drift from the desktop nav. No dependencies.
(function () {
  var src = document.querySelector('nav .nav-links, nav .links');
  var nav = src && src.closest('nav');
  if (!nav || nav.querySelector('.mn-btn')) return;
  var es = /^es/i.test(document.documentElement.lang || '');
  var pos = getComputedStyle(nav).position;
  // pages whose own nav hides its links at 820px (homepage arms, service pages) get the button at 820px too
  var small = !!nav.querySelector('.links') || !nav.querySelector('.nav-row') || pos === 'fixed';
  var bp = small ? '(max-width:820px)' : '(max-width:1080px)';
  var n = 0;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function link(a, cls) {
    var c = a.cloneNode(true);
    c.removeAttribute('id'); c.removeAttribute('style'); c.className = cls || '';
    return c;
  }

  var panel = el('div', 'mn-panel');
  var pid = 'mn-panel-' + (++n);
  panel.id = pid;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', es ? 'Menú principal' : 'Main menu');

  Array.prototype.forEach.call(src.children, function (item) {
    if (item.tagName === 'A') { panel.appendChild(link(item, 'mn-top')); return; }
    var head = item.querySelector(':scope > a');
    if (!head) return;
    var inner = item.querySelector('.mega-panel-inner') || item.querySelector('.mega-panel');
    if (!inner) { panel.appendChild(link(head, 'mn-top')); return; }
    var gid = 'mn-sub-' + (++n);
    var group = el('div', 'mn-group');
    var h = el('div', 'mn-ghead');
    h.appendChild(link(head, 'mn-glink'));
    var tog = el('button', 'mn-tog');
    tog.type = 'button';
    tog.setAttribute('aria-expanded', 'false');
    tog.setAttribute('aria-controls', gid);
    tog.setAttribute('aria-label', head.textContent.trim());
    h.appendChild(tog);
    var sub = el('div', 'mn-sub'); sub.id = gid; sub.hidden = true;
    Array.prototype.forEach.call(inner.querySelectorAll('h4, a'), function (x) {
      if (x.tagName === 'H4') sub.appendChild(el('h4', '', x.textContent.trim()));
      else sub.appendChild(link(x, ''));
    });
    tog.addEventListener('click', function () {
      var open = tog.getAttribute('aria-expanded') === 'true';
      tog.setAttribute('aria-expanded', String(!open));
      sub.hidden = open;
    });
    group.appendChild(h); group.appendChild(sub);
    panel.appendChild(group);
  });

  var login = nav.querySelector('a[href*="app.readmyblueprint.com"]');
  if (login && /log\s*in|iniciar|entrar/i.test(login.textContent)) panel.appendChild(link(login, 'mn-login'));

  var btn = el('button', 'mn-btn');
  btn.type = 'button';
  btn.setAttribute('aria-label', es ? 'Menú' : 'Menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', pid);
  var bars = el('span', 'mn-bars');
  bars.setAttribute('aria-hidden', 'true');
  btn.appendChild(bars);

  if (small) { btn.className += ' mn-bp820'; panel.className += ' mn-bp820'; }
  var cta = nav.querySelector('.nav-cta');
  (cta || nav).appendChild(btn);
  nav.appendChild(panel);
  nav.classList.add('mn-nav');
  if (pos === 'static') nav.style.position = 'relative';
  var cs = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255];
  if (+cs[0] + +cs[1] + +cs[2] < 300) nav.classList.add('mn-dark');
  if (pos === 'fixed') nav.classList.add('mn-float');
  if (nav.classList.contains('nav')) nav.classList.add('mn-svc');

  function isOpen() { return nav.classList.contains('mn-open'); }
  function setOpen(o, focusBtn) {
    nav.classList.toggle('mn-open', o);
    btn.setAttribute('aria-expanded', String(o));
    if (o) { var f = panel.querySelector('a, button'); if (f) f.focus({ preventScroll: true }); }
    else if (focusBtn) btn.focus();
  }
  btn.addEventListener('click', function () { setOpen(!isOpen()); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setOpen(false, true);
  });
  document.addEventListener('click', function (e) { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
  panel.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setOpen(false); });
  nav.addEventListener('focusout', function (e) {
    if (isOpen() && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
  });
  var mq = window.matchMedia(bp);
  var onChange = function () { if (!mq.matches && isOpen()) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
})();
