/* Discussion Hub (2026): renders COURSE_DATA with search, focus filters, progress tracking, timeline view and deep links. */
(function () {
  'use strict';
  var DATA = (window.COURSE_DATA || []).slice();
  if (!DATA.length) return;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'hub-v4';
  var st = { q: '', f: 'all', max: DATA.length, view: 'cards', done: [] };
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s && typeof s === 'object') { st.done = Array.isArray(s.done) ? s.done : []; st.view = s.view === 'timeline' ? 'timeline' : 'cards'; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ done: st.done, view: st.view })); } catch (e) {} }

  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var grid = $('hubGrid'), tl = $('hubTimeline'), empty = $('hubEmpty'), count = $('hubCount');
  var hay = DATA.map(function (w) { return JSON.stringify(w).toLowerCase(); });
  var total = DATA.length;

  // Stats from the data itself
  var sums = { weeks: total, activities: 0, readings: 0, links: 0 };
  DATA.forEach(function (w) { sums.activities += (w.activities || []).length; sums.readings += (w.readings || []).length; sums.links += (w.links || []).length; });
  document.querySelectorAll('[data-stat]').forEach(function (el) {
    var to = sums[el.dataset.stat] || 0, cur = 0, step = Math.max(1, Math.ceil(to / 30));
    var run = function () { var id = setInterval(function () { cur = Math.min(to, cur + step); el.textContent = cur; if (cur >= to) clearInterval(id); }, 24); };
    if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .5 }); o.observe(el); } else { el.textContent = to; }
  });
  $('hubTotal').textContent = total;
  var range = $('hubRange'); range.max = total; range.value = total; $('rangeOut').textContent = total;

  // Cards
  function chips(a, cls) { return (a || []).map(function (x) { return '<li class="' + cls + '">' + esc(x) + '</li>'; }).join(''); }
  function card(w, i) {
    var pos = ((i * 23) % 100) + '% ' + ((i * 37) % 100) + '%';
    var links = (w.links || []).map(function (l) { return '<a class="hub-link" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.title || l.url) + '<span aria-hidden="true"> ↗</span></a>'; }).join('');
    var more = '';
    if ((w.concepts || []).length) more += '<div class="hub-blk"><h4>Key concepts</h4><ul class="hub-tags">' + chips(w.concepts, 'c') + '</ul></div>';
    if ((w.readings || []).length) more += '<div class="hub-blk"><h4>Readings &amp; materials</h4><ul class="hub-list">' + chips(w.readings, '') + '</ul></div>';
    if (links) more += '<div class="hub-blk"><h4>Resources &amp; links</h4><div class="hub-links">' + links + '</div></div>';
    var done = st.done.indexOf(w.week) > -1;
    return '<article class="wk' + (done ? ' is-done' : '') + '" id="week-' + w.week + '" data-week="' + w.week + '">' +
      '<div class="wk-art" style="--pos:' + pos + '"><span class="wk-num">Week ' + w.week + '</span><span class="wk-date">' + esc(w.date || '') + '</span></div>' +
      '<div class="wk-body">' +
        '<h3>' + esc(w.title) + '</h3>' +
        '<ul class="wk-acts" aria-label="Activities">' + chips(w.activities, 'a') + '</ul>' +
        '<p class="wk-desc">' + esc(w.description || '') + '</p>' +
        (w.innovation ? '<p class="wk-inno"><strong>Teaching innovation</strong>' + esc(w.innovation) + '</p>' : '') +
        '<button type="button" class="wk-toggle" aria-expanded="false" aria-controls="more-' + w.week + '"><span>See concepts, readings &amp; links</span><b aria-hidden="true">+</b></button>' +
        '<div class="wk-more" id="more-' + w.week + '" hidden>' + more + '</div>' +
        '<div class="wk-foot">' +
          '<label class="wk-done"><input type="checkbox"' + (done ? ' checked' : '') + '> <span>Reviewed</span></label>' +
          '<button type="button" class="wk-copy" data-week="' + w.week + '">Copy link</button>' +
        '</div>' +
      '</div></article>';
  }
  grid.innerHTML = DATA.map(card).join('');
  tl.innerHTML = DATA.map(function (w) {
    return '<li class="tli" data-week="' + w.week + '"><span class="tli-dot" aria-hidden="true"></span><div><small>' + esc(w.date || '') + ' · Week ' + w.week + '</small><button type="button" class="tli-open" data-week="' + w.week + '">' + esc(w.title) + '</button><p>' + esc((w.activities || []).slice(0, 3).join(' · ')) + '</p></div><span class="tli-check" aria-hidden="true">✓</span></li>';
  }).join('');

  // Filtering
  function matches(w, i) {
    if (w.week > st.max) return false;
    if (st.q && hay[i].indexOf(st.q) < 0) return false;
    var d = st.done.indexOf(w.week) > -1;
    switch (st.f) {
      case 'innovation': return !!w.innovation;
      case 'readings': return (w.readings || []).length > 0;
      case 'links': return (w.links || []).length > 0;
      case 'todo': return !d;
      case 'done': return d;
    }
    return true;
  }
  function apply() {
    var n = 0;
    DATA.forEach(function (w, i) {
      var ok = matches(w, i), c = grid.children[i], t = tl.children[i];
      c.hidden = !ok; t.hidden = !ok; if (ok) n++;
    });
    count.textContent = 'Showing ' + n + ' of ' + total + ' weeks';
    empty.hidden = n > 0;
    var showTl = st.view === 'timeline';
    grid.hidden = showTl || n === 0; tl.hidden = !showTl || n === 0;
    $('viewCards').setAttribute('aria-pressed', String(!showTl)); $('viewTimeline').setAttribute('aria-pressed', String(showTl));
    var d = st.done.length;
    $('hubDone').textContent = d; $('hubFill').style.width = (d / total * 100) + '%';
    DATA.forEach(function (w, i) { tl.children[i].classList.toggle('is-done', st.done.indexOf(w.week) > -1); });
  }

  // Events
  $('hubSearch').addEventListener('input', function (e) { st.q = e.target.value.trim().toLowerCase(); apply(); });
  $('hubFilters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    st.f = b.dataset.f;
    this.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    apply();
  });
  range.addEventListener('input', function () { st.max = +range.value; $('rangeOut').textContent = st.max; apply(); });
  function setView(v) { st.view = v; save(); apply(); }
  $('viewCards').addEventListener('click', function () { setView('cards'); });
  $('viewTimeline').addEventListener('click', function () { setView('timeline'); });
  document.querySelectorAll('[data-view="timeline"]').forEach(function (a) { a.addEventListener('click', function () { setView('timeline'); }); });

  function toggle(card, open) {
    var b = card.querySelector('.wk-toggle'), m = card.querySelector('.wk-more');
    var want = open == null ? b.getAttribute('aria-expanded') !== 'true' : open;
    b.setAttribute('aria-expanded', String(want)); m.hidden = !want; card.classList.toggle('open', want);
    b.querySelector('b').textContent = want ? '–' : '+';
  }
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.wk'); if (!card) return;
    if (e.target.closest('.wk-toggle')) toggle(card);
    var cp = e.target.closest('.wk-copy');
    if (cp) {
      var url = location.href.split('#')[0] + '#week-' + cp.dataset.week;
      var ok = function () { cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy link'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { prompt('Copy this link', url); }); else prompt('Copy this link', url);
    }
  });
  grid.addEventListener('change', function (e) {
    if (!e.target.matches('.wk-done input')) return;
    var w = +e.target.closest('.wk').dataset.week, i = st.done.indexOf(w);
    if (e.target.checked && i < 0) st.done.push(w); if (!e.target.checked && i > -1) st.done.splice(i, 1);
    e.target.closest('.wk').classList.toggle('is-done', e.target.checked);
    save(); apply();
  });
  function goTo(week, open) {
    if (st.view !== 'cards') { st.view = 'cards'; save(); }
    var c = $('week-' + week); if (!c) return;
    if (c.hidden) { st.q = ''; st.f = 'all'; st.max = total; $('hubSearch').value = ''; range.value = total; $('rangeOut').textContent = total; $('hubFilters').querySelectorAll('button').forEach(function (x) { var on = x.dataset.f === 'all'; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); }
    apply();
    toggle(c, open !== false);
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    c.classList.add('flash'); setTimeout(function () { c.classList.remove('flash'); }, 1600);
  }
  tl.addEventListener('click', function (e) { var b = e.target.closest('.tli-open'); if (b) goTo(+b.dataset.week); });
  $('expandAll').addEventListener('click', function () { grid.querySelectorAll('.wk').forEach(function (c) { if (!c.hidden) toggle(c, true); }); });
  $('collapseAll').addEventListener('click', function () { grid.querySelectorAll('.wk').forEach(function (c) { toggle(c, false); }); });
  $('randomWeek').addEventListener('click', function () {
    var pool = DATA.filter(function (w, i) { return matches(w, i); }); if (!pool.length) return;
    goTo(pool[Math.floor(Math.random() * pool.length)].week);
  });
  $('hubReset').addEventListener('click', function () { st.done = []; grid.querySelectorAll('.wk').forEach(function (c) { c.classList.remove('is-done'); c.querySelector('.wk-done input').checked = false; }); save(); apply(); });
  $('hubClear').addEventListener('click', function () {
    st.q = ''; st.f = 'all'; st.max = total; $('hubSearch').value = ''; range.value = total; $('rangeOut').textContent = total;
    $('hubFilters').querySelectorAll('button').forEach(function (x) { var on = x.dataset.f === 'all'; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    apply();
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === '/') { e.preventDefault(); $('hubSearch').focus(); }
    else if (k === 'e') $('expandAll').click();
    else if (k === 'c') $('collapseAll').click();
  });

  apply();
  var m = /^#week-(\d+)$/.exec(location.hash);
  if (m) setTimeout(function () { goTo(+m[1]); }, 400);
})();
