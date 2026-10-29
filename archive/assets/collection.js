/* Labor Archive collection browser: search, topic/type/year filters, sorting.
   Cards are rendered in the HTML, so the page works without JavaScript; this script filters them. */
(function () {
  'use strict';
  var root = document.querySelector('[data-collection]');
  if (!root) return;
  var grid = document.getElementById('grid');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var form = document.getElementById('finder');
  var q = document.getElementById('q');
  var typeSel = document.getElementById('type');
  var sortSel = document.getElementById('sort');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var searchNote = document.getElementById('search-note');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-topic]'));
  var years = Array.prototype.slice.call(document.querySelectorAll('.years button[data-year]'));
  var resetBtns = Array.prototype.slice.call(document.querySelectorAll('[data-reset]'));
  var total = cards.length;
  var index = null, indexState = 'idle'; // idle | loading | ready | failed
  var state = { q: '', topic: '', type: '', year: '', sort: 'date' };

  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tokens(s) { return (s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) || []).filter(function (t) { return t.length > 1 || /\d/.test(t); }); }
  function norm(s) { return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); }

  function readURL() {
    var p = new URLSearchParams(location.search);
    state.q = p.get('q') || ''; state.topic = p.get('topic') || ''; state.type = p.get('type') || '';
    state.year = p.get('year') || ''; state.sort = p.get('sort') || (state.q ? 'match' : 'date');
  }
  function writeURL() {
    var p = new URLSearchParams();
    ['q', 'topic', 'type', 'year'].forEach(function (k) { if (state[k]) p.set(k, state[k]); });
    if (state.sort && state.sort !== 'date' && !(state.q && state.sort === 'match')) p.set('sort', state.sort);
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  function loadIndex() {
    if (indexState !== 'idle') return;
    indexState = 'loading';
    searchNote.textContent = 'Loading the text of every page…';
    fetch(root.getAttribute('data-search'))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        index = {};
        d.items.forEach(function (it) { index[it.id] = { text: it.text, lc: norm(it.text) }; });
        indexState = 'ready';
        searchNote.textContent = 'Searching titles, descriptions, and machine-read page text. Page text contains errors, so try different spellings.';
        apply();
      })
      .catch(function () {
        indexState = 'failed';
        searchNote.textContent = 'The page text could not be loaded, so search is limited to titles and descriptions. Reload the page to try again.';
        apply();
      });
  }

  function snippet(text, toks) {
    var lc = norm(text), at = -1, tok = '';
    for (var i = 0; i < toks.length; i++) { var k = lc.indexOf(toks[i]); if (k >= 0 && (at < 0 || k < at)) { at = k; tok = toks[i]; } }
    if (at < 0) return '';
    var s = Math.max(0, at - 70), e = Math.min(text.length, at + 150);
    var out = esc((s > 0 ? '…' : '') + text.slice(s, e).replace(/\s+/g, ' ') + (e < text.length ? '…' : ''));
    toks.forEach(function (t) { out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
    return out;
  }

  function apply() {
    var toks = tokens(state.q);
    if (toks.length) loadIndex();
    var shown = [];
    cards.forEach(function (c) {
      var ok = true, score = 0, snip = '';
      if (state.topic && (' ' + c.dataset.topics + ' ').indexOf(' ' + state.topic + ' ') < 0) ok = false;
      if (ok && state.type && c.dataset.type !== state.type) ok = false;
      if (ok && state.year && c.dataset.year !== state.year) ok = false;
      if (ok && toks.length) {
        var meta = c.dataset.meta, body = index && index[c.dataset.id] ? index[c.dataset.id].lc : '';
        for (var i = 0; i < toks.length; i++) {
          var inMeta = meta.indexOf(toks[i]) >= 0, inBody = body.indexOf(toks[i]) >= 0;
          if (!inMeta && !inBody) { ok = false; break; }
          score += (inMeta ? 10 : 0) + (inBody ? Math.min(8, body.split(toks[i]).length - 1) : 0);
        }
        if (ok && index && index[c.dataset.id] && !toks.every(function (t) { return meta.indexOf(t) >= 0; })) snip = snippet(index[c.dataset.id].text, toks);
      }
      c.hidden = !ok;
      var sn = c.querySelector('.snip');
      if (sn) { sn.innerHTML = snip; sn.hidden = !snip; }
      if (ok) shown.push({ c: c, score: score });
    });
    var key = state.sort === 'match' && toks.length ? 'match' : state.sort;
    shown.sort(function (a, b) {
      if (key === 'match') return b.score - a.score || a.c.dataset.order - b.c.dataset.order;
      if (key === 'newest') return (b.c.dataset.date || '').localeCompare(a.c.dataset.date || '') || a.c.dataset.order - b.c.dataset.order;
      if (key === 'box') return a.c.dataset.order - b.c.dataset.order;
      return (a.c.dataset.date || '9999').localeCompare(b.c.dataset.date || '9999') || a.c.dataset.order - b.c.dataset.order;
    });
    shown.forEach(function (s) { grid.appendChild(s.c); });
    var n = shown.length;
    var bits = [];
    if (state.q) bits.push('matching “' + state.q + '”');
    if (state.topic) bits.push('in ' + document.querySelector('.chip[data-topic="' + state.topic + '"] .nm').textContent);
    if (state.type) bits.push('of type ' + state.type.toLowerCase());
    if (state.year) bits.push('from ' + state.year);
    count.textContent = (n === total && !bits.length) ? 'Showing all ' + total + ' items' : 'Showing ' + n + ' of ' + total + ' items' + (bits.length ? ' ' + bits.join(', ') : '');
    empty.hidden = n !== 0;
    chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.topic === state.topic)); });
    years.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.year === state.year)); });
    typeSel.value = state.type; sortSel.value = (state.sort === 'match' && !toks.length) ? 'date' : state.sort;
    resetBtns.forEach(function (b) { b.hidden = !(state.q || state.topic || state.type || state.year); });
    writeURL();
  }

  var timer;
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { state.q = q.value.trim(); if (state.q && state.sort === 'date') state.sort = 'match'; apply(); }, 250); });
  form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); state.q = q.value.trim(); if (state.q && state.sort === 'date') state.sort = 'match'; apply(); });
  typeSel.addEventListener('change', function () { state.type = typeSel.value; apply(); });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(); });
  chips.forEach(function (b) { b.addEventListener('click', function () { state.topic = state.topic === b.dataset.topic ? '' : b.dataset.topic; apply(); }); });
  years.forEach(function (b) { b.addEventListener('click', function () { state.year = state.year === b.dataset.year ? '' : b.dataset.year; apply(); }); });
  resetBtns.forEach(function (b) { b.addEventListener('click', function () { state = { q: '', topic: '', type: '', year: '', sort: 'date' }; q.value = ''; apply(); q.focus(); }); });

  readURL();
  q.value = state.q;
  root.classList.add('js');
  apply();
})();
