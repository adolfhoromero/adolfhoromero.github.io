/* Teaching page redesign (2026): behavior for body.teach-v3. Decorative only; the page works without it. */
(function () {
  var body = document.body;
  if (!body || !body.classList.contains('teach-v3')) return;
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  root.classList.add('js-tv3');
  root.classList.remove('dark'); // the old dark theme is retired; "soft" mode replaces it
  try {
    new MutationObserver(function () { if (root.classList.contains('dark')) root.classList.remove('dark'); })
      .observe(root, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {}

  /* Soft mode: a gentle, low-glare version of the light design for dark-mode devices. Never black. */
  var mq = null; try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch (e) {}
  function stored() { try { return localStorage.getItem('tv3-mode'); } catch (e) { return null; } }
  function wantSoft() { return stored() === 'soft'; } // bright/white by default; soft only when chosen
  function applyMode() { root.classList.toggle('soft', wantSoft()); }
  applyMode();
  if (mq && mq.addEventListener) mq.addEventListener('change', applyMode);
  var mode = document.createElement('button');
  mode.type = 'button'; mode.className = 'tv3-mode';
  mode.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg><span class="tv3-mode__tip"></span>';
  function syncMode() {
    var soft = root.classList.contains('soft');
    mode.setAttribute('aria-pressed', String(soft));
    mode.setAttribute('aria-label', soft ? 'Soft colors are on. Switch to bright colors' : 'Bright colors are on. Switch to soft, low-glare colors');
    mode.querySelector('.tv3-mode__tip').textContent = soft ? 'Soft colors' : 'Bright colors';
  }
  mode.addEventListener('click', function () {
    var next = root.classList.contains('soft') ? 'light' : 'soft';
    try { localStorage.setItem('tv3-mode', next); } catch (e) {}
    applyMode(); syncMode();
  });
  document.body.appendChild(mode); syncMode();
  if (mq && mq.addEventListener) mq.addEventListener('change', syncMode);

  /* Merge the header and the nav into one sticky bar */
  var header = document.querySelector('body > header.site-header');
  var nav = document.querySelector('body > nav.site-nav');
  if (header && nav) {
    var bar = document.createElement('div');
    bar.className = 'tv3-top';
    header.parentNode.insertBefore(bar, header);
    bar.appendChild(header);
    bar.appendChild(nav);
    floatingBar(bar, nav);
  }

  /* Floating ribbon bar: sit over the hero photo, slim down on scroll, glide the ribbon */
  function floatingBar(bar, nav) {
    var next = bar.nextElementSibling;
    if (next && next.classList.contains('page-story')) bar.classList.add('over-hero');

    var waiting = false;
    function compact() {
      waiting = false;
      var y = window.pageYOffset || root.scrollTop;
      if (y > 60) bar.classList.add('compact');
      else if (y < 20) bar.classList.remove('compact');
    }
    window.addEventListener('scroll', function () { if (!waiting) { waiting = true; requestAnimationFrame(compact); } }, { passive: true });
    compact();

    /* The ribbon starts on the tab you came from and slides to the page you are on */
    var tabs = [].slice.call(nav.querySelectorAll('a:not(.cv-link)'));
    var now = -1;
    tabs.forEach(function (a, i) { if (a.getAttribute('aria-current') === 'page') now = i; });
    var last = -1;
    try {
      var saved = sessionStorage.getItem('nav-tab');
      if (saved !== null) last = Number(saved);
      sessionStorage.setItem('nav-tab', String(now));
    } catch (e) {}
    var from = tabs[last], to = tabs[now];
    if (reduce || !from || !to || from === to || !to.offsetWidth) return;
    to.style.setProperty('--gl', (from.offsetLeft - to.offsetLeft) + 'px');
    to.style.setProperty('--gr', (to.offsetLeft + to.offsetWidth - from.offsetLeft - from.offsetWidth) + 'px');
    to.classList.add(last < now ? 'glide-right' : 'glide-left');
    void to.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        to.classList.add('gliding');
        to.style.setProperty('--gl', '0px');
        to.style.setProperty('--gr', '0px');
      });
    });
  }

  /* Split text into animated letters */
  function split(el) {
    var n = 0, lastWord = null;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            for (var k = 0; k < p.length; k++) {
              var ch = document.createElement('span');
              ch.className = 'ch';
              ch.setAttribute('aria-hidden', 'true');
              ch.style.setProperty('--i', n++);
              ch.textContent = p.charAt(k);
              w.appendChild(ch);
            }
            lastWord = w;
            f.appendChild(w);
          });
          node.replaceChild(f, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    if (lastWord) lastWord.classList.add('tv3-last');
    return n;
  }
  function reveal(el, delay) {
    var n = el.querySelectorAll('.ch').length;
    setTimeout(function () {
      el.classList.add('shown');
      setTimeout(function () { el.classList.add('done'); }, n * 55 + 1000);
    }, delay);
  }
  /* Header name: first name white, last name peach, no animation */
  var brand = document.querySelector('.site-title a');
  if (brand) {
    brand.setAttribute('aria-label', 'Adolfho Romero, home');
    brand.innerHTML = 'Adolfho <span class="nav-last">Romero</span>';
  }

  /* Hero: emphasized phrase, parallax, marquee */
  var hero = document.querySelector('.page-story');
  if (hero) {
    var h1 = hero.querySelector('h1');
    var shim = hero.getAttribute('data-shim') || 'imagine changing it.';
    if (h1 && h1.textContent.indexOf(shim) > -1) {
      h1.innerHTML = h1.innerHTML.replace(shim, '<span class="tv3-shim">' + shim + '</span>');
    }
    var sweep = document.createElement('div'); sweep.className = 'sweep'; sweep.setAttribute('aria-hidden', 'true');
    var sparks = document.createElement('div'); sparks.className = 'sparks'; sparks.setAttribute('aria-hidden', 'true');
    hero.insertBefore(sparks, hero.firstChild);
    hero.insertBefore(sweep, hero.firstChild);
    var words = ['Care', 'Dignity', 'Historical imagination', 'Critical dialogue', 'Oral history', 'Labor history', 'Community-based learning'];
    var custom = hero.getAttribute('data-marquee');
    if (custom) words = custom.split('|');
    var marq = document.createElement('div');
    marq.className = 'tv3-marq'; marq.setAttribute('aria-hidden', 'true');
    var track = '<div class="track">';
    for (var r = 0; r < 2; r++) words.forEach(function (w) { track += '<span>' + w + '</span>'; });
    marq.innerHTML = track + '</div>';
    hero.parentNode.insertBefore(marq, hero.nextSibling);
  }

  /* Footer wordmark + back to top */
  var fb = document.getElementById('tv3-fbig');
  if (fb) {
    split(fb);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { reveal(fb, 0); io.disconnect(); } });
      }, { threshold: .25 });
      io.observe(fb);
    } else reveal(fb, 0);
  }
  var top = document.getElementById('tv3-totop');
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* Floating back-to-top with a scroll-progress ring */
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'tv3-fab'; fab.setAttribute('aria-label', 'Back to top');
  fab.innerHTML = '<svg viewBox="0 0 56 56" aria-hidden="true"><circle class="bg" cx="28" cy="28" r="24"/><circle class="fg" cx="28" cy="28" r="24"/></svg><svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  document.body.appendChild(fab);
  var fg = fab.querySelector('.fg');
  fab.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  var ft = false;
  function fabFrame() {
    ft = false;
    var h = Math.max(1, root.scrollHeight - window.innerHeight), y = window.pageYOffset || root.scrollTop;
    var fo = document.querySelector('.tv3-foot'), inFoot = fo && fo.getBoundingClientRect().top < window.innerHeight - 80;
    fab.classList.toggle('show', y > 700 && !inFoot);
    fg.style.strokeDashoffset = (150.8 * (1 - Math.min(1, y / h))).toFixed(1);
  }
  window.addEventListener('scroll', function () { if (!ft) { ft = true; requestAnimationFrame(fabFrame); } }, { passive: true });
  fabFrame();

  /* Photo parallax: images drift gently inside their frames as you scroll */
  var pimgs = [].slice.call(document.querySelectorAll('main :is(.v4-trio, .v4-art, .convening-gallery, .activity-media, .archive-card, .about-image, .mt-fig, .v4-cert) img'));
  pimgs.forEach(function (im) {
    var w = document.createElement('span'); w.className = 'par-wrap';
    im.parentNode.insertBefore(w, im); w.appendChild(im); im.classList.add('par-img');
  });
  var pt = false;
  function parFrame() {
    pt = false;
    if (reduce) return;
    var vh = window.innerHeight;
    pimgs.forEach(function (im) {
      var r = im.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var d = ((r.top + r.height / 2) - vh / 2) / vh;
      im.style.setProperty('--pp', Math.max(-1, Math.min(1, d)) * -22 + 'px');
    });
  }
  if (pimgs.length && !reduce) {
    window.addEventListener('scroll', function () { if (!pt) { pt = true; requestAnimationFrame(parFrame); } }, { passive: true });
    window.addEventListener('resize', parFrame);
    parFrame();
  }

  /* Parallax for the hero photo */
  var media = hero && hero.querySelector('.page-story__media');
  var ticking = false;
  function frame() {
    ticking = false;
    if (reduce || !media) return;
    var y = window.pageYOffset || root.scrollTop;
    if (y < window.innerHeight * 1.6) media.style.setProperty('--py', (y * .45).toFixed(1) + 'px');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
})();
