/* Teaching page redesign (2026): behavior for body.teach-v3. Decorative only; the page works without it. */
(function () {
  var body = document.body;
  if (!body || !body.classList.contains('teach-v3')) return;
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  root.classList.add('js-tv3');
  root.classList.remove('dark'); // this page is always light
  try {
    new MutationObserver(function () { if (root.classList.contains('dark')) root.classList.remove('dark'); })
      .observe(root, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {}

  /* Merge the header and the nav into one sticky bar */
  var header = document.querySelector('body > header.site-header');
  var nav = document.querySelector('body > nav.site-nav');
  if (header && nav) {
    var bar = document.createElement('div');
    bar.className = 'tv3-top';
    header.parentNode.insertBefore(bar, header);
    bar.appendChild(header);
    bar.appendChild(nav);
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
  var title = document.querySelector('.site-title');
  if (title) {
    title.classList.add('nm');
    var a = title.querySelector('a');
    if (a) a.setAttribute('aria-label', 'Go to Home');
    split(title);
    reveal(title, 150);
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

  /* Parallax for the hero photo */
  var media = hero && hero.querySelector('.page-story__media');
  var ticking = false;
  function frame() {
    ticking = false;
    if (reduce || !media) return;
    var y = window.pageYOffset || root.scrollTop;
    if (y < window.innerHeight * 1.6) media.style.setProperty('--py', (y * .28).toFixed(1) + 'px');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
})();
