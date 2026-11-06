/* CV page (2026): renders window.CV with category tabs, search, sort and expandable rows. */
(function () {
  'use strict';
  var D = (window.CV || []).slice(); if (!D.length) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var CATS = [['all', 'All'], ['education', 'Education & training'], ['research', 'Research'], ['grants', 'Grants'], ['talks', 'Talks'], ['teaching', 'Teaching'], ['publications', 'Publications'], ['honors', 'Honors & service'], ['fieldwork', 'Fieldwork']];
  var LABEL = {}; CATS.forEach(function (c) { LABEL[c[0]] = c[1]; });
  var st = { f: 'all', q: '', dir: -1 };
  var KEY = 'cv-v4';
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s.dir === 1) st.dir = 1; } catch (e) {}
  var money = function (n) { return '$' + n.toLocaleString('en-US'); };

  // stats
  var grants = D.filter(function (e) { return e.c === 'grants'; });
  var vals = { grants: grants.length, money: grants.reduce(function (s, e) { return s + e.amt; }, 0) / 1e6, fieldwork: D.filter(function (e) { return e.c === 'fieldwork'; }).length, interviews: 200 };
  document.querySelectorAll('[data-stat]').forEach(function (el) {
    var to = vals[el.dataset.stat] || 0, dec = +el.dataset.dec || 0, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var show = function (v) { el.textContent = pre + v.toFixed(dec) + suf; };
    var run = function () { var t0 = null; (function f(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 900); show(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(performance.now()); };
    if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .5 }); o.observe(el); } else show(to);
  });

  // tabs
  var tabs = $('cvTabs');
  tabs.innerHTML = CATS.map(function (c) {
    var n = c[0] === 'all' ? D.length : D.filter(function (e) { return e.c === c[0]; }).length;
    return '<button type="button" data-f="' + c[0] + '" class="' + (c[0] === 'all' ? 'on' : '') + '" aria-pressed="' + (c[0] === 'all') + '">' + esc(c[1]) + ' <i>' + n + '</i></button>';
  }).join('');

  var hay = D.map(function (e) { return (e.t + ' ' + e.o + ' ' + e.d + ' ' + (e.b || []).join(' ') + ' ' + LABEL[e.c]).toLowerCase(); });
  var list = $('cvList');

  function row(e, i) {
    var more = (e.b || []).length ? '<ul class="cv-more">' + e.b.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '';
    var link = e.u ? '<a class="cv-ext" href="' + esc(e.u) + '" target="_blank" rel="noopener noreferrer">Open the article ↗</a>' : '';
    var amt = e.amt ? '<span class="cv-amt">' + money(e.amt) + '</span>' : '';
    var has = more || link;
    return '<li class="cv-row" data-i="' + i + '" data-c="' + e.c + '">' +
      '<span class="cv-date">' + esc(e.d) + '</span>' +
      '<div class="cv-main"><span class="cv-tag">' + esc(LABEL[e.c]) + '</span>' +
      (has ? '<button type="button" class="cv-t" aria-expanded="false">' + esc(e.t) + '<b aria-hidden="true">+</b></button>' : '<h3 class="cv-t cv-t--flat">' + esc(e.t) + '</h3>') +
      '<p class="cv-org">' + esc(e.o) + '</p>' + (has ? '<div class="cv-det" hidden>' + more + link + '</div>' : '') + '</div>' + amt + '</li>';
  }
  var order = D.map(function (e, i) { return i; });
  function render() {
    order.sort(function (a, b) { return (D[b].y - D[a].y) * (-st.dir) || a - b; });
    list.innerHTML = order.map(function (i) { return row(D[i], i); }).join('');
    apply();
  }
  function apply() {
    var n = 0, q = st.q;
    list.querySelectorAll('.cv-row').forEach(function (r) {
      var i = +r.dataset.i, ok = (st.f === 'all' || D[i].c === st.f) && (!q || hay[i].indexOf(q) > -1);
      r.hidden = !ok; if (ok) n++;
    });
    $('cvCount').textContent = 'Showing ' + n + ' of ' + D.length + ' entries';
    $('cvEmpty').hidden = n > 0; list.hidden = n === 0;
    $('sortNew').setAttribute('aria-pressed', String(st.dir === -1)); $('sortOld').setAttribute('aria-pressed', String(st.dir === 1));
  }
  function toggle(r, open) {
    var b = r.querySelector('button.cv-t'); if (!b) return;
    var want = open == null ? b.getAttribute('aria-expanded') !== 'true' : open;
    b.setAttribute('aria-expanded', String(want)); r.querySelector('.cv-det').hidden = !want; r.classList.toggle('open', want); b.querySelector('b').textContent = want ? '–' : '+';
  }
  list.addEventListener('click', function (e) { var b = e.target.closest('button.cv-t'); if (b) toggle(b.closest('.cv-row')); });
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; st.f = b.dataset.f;
    tabs.querySelectorAll('button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    apply();
  });
  $('cvSearch').addEventListener('input', function (e) { st.q = e.target.value.trim().toLowerCase(); apply(); });
  $('cvClear').addEventListener('click', function () { st.q = ''; $('cvSearch').value = ''; apply(); });
  function sort(d) { st.dir = d; try { localStorage.setItem(KEY, JSON.stringify({ dir: d })); } catch (e) {} render(); }
  $('sortNew').addEventListener('click', function () { sort(-1); });
  $('sortOld').addEventListener('click', function () { sort(1); });
  $('cvExpand').addEventListener('click', function () { list.querySelectorAll('.cv-row:not([hidden])').forEach(function (r) { toggle(r, true); }); });
  $('cvCollapse').addEventListener('click', function () { list.querySelectorAll('.cv-row').forEach(function (r) { toggle(r, false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); $('cvSearch').focus(); }
  });

  // PDF preview (loads the file only when asked)
  var pb = $('previewToggle'), pv = $('pdfPreview');
  if (pb) pb.addEventListener('click', function () {
    var open = pb.getAttribute('aria-expanded') !== 'true';
    pb.setAttribute('aria-expanded', String(open)); pv.hidden = !open; pb.textContent = open ? 'Hide preview' : 'Preview here';
    var f = pv.querySelector('iframe'); if (open && !f.src) f.src = f.dataset.src;
  });
  render();
})();
