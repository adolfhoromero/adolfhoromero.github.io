/* Tompkins-Cortland labor timeline. Data: timeline-data.js (window.LABOR_TIMELINE). */
(function () {
  'use strict';
  var D = window.LABOR_TIMELINE;
  if (!D) return;
  var EV = D.events, byId = {}, eraOf = {};
  EV.forEach(function (e, i) { e.i = i; byId[e.id] = e; });
  D.eras.forEach(function (e) { eraOf[e.key] = e; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'"); };

  var state = { q: '', themes: [], org: '' };
  var list = $('#tl-body'), rail = $('#tl-rail'), strip = $('#tl-strip-bar'), chips = $('#tl-themes');
  var qIn = $('#tl-q'), orgSel = $('#tl-org'), countEl = $('#tl-count'), resetBtn = $('#tl-reset'), empty = $('#tl-empty');

  // search text per event
  EV.forEach(function (e) {
    e.hay = norm([e.label, e.title, e.summary, e.body.join(' '), e.sources.map(function (s) { return s.label; }).join(' '),
      e.themes.map(function (t) { return D.themes[t]; }).join(' '), e.orgs.map(function (o) { return D.orgs[o]; }).join(' ')].join(' '));
    e.docs = e.sources.filter(function (s) { return s.k === 'archive'; }).length;
  });

  // ---------- build era rail
  rail.innerHTML = D.eras.map(function (er, n) {
    return '<li><a href="#era-' + er.key + '" data-era="' + er.key + '"><small>' + String(n + 1).padStart(2, '0') + ' · ' + esc(er.span) + '</small><b>' + esc(er.name) + '</b><i data-eracount="' + er.key + '"></i></a></li>';
  }).join('');

  // ---------- theme chips
  var themeCount = {};
  EV.forEach(function (e) { e.themes.forEach(function (t) { themeCount[t] = (themeCount[t] || 0) + 1; }); });
  chips.innerHTML = Object.keys(D.themes).map(function (t) {
    return '<button type="button" class="tl-chip" data-theme="' + t + '" aria-pressed="false">' + esc(D.themes[t]) + '<b>' + (themeCount[t] || 0) + '</b></button>';
  }).join('');

  // ---------- org select
  orgSel.innerHTML = '<option value="">All organizations</option>' + Object.keys(D.orgs).map(function (o) {
    return '<option value="' + o + '">' + esc(D.orgs[o]) + '</option>';
  }).join('');

  // ---------- timeline body
  var html = '';
  D.eras.forEach(function (er, n) {
    var evs = EV.filter(function (e) { return e.era === er.key; });
    html += '<section class="tl-era" id="era-' + er.key + '" data-era="' + er.key + '" aria-labelledby="h-' + er.key + '">' +
      '<header class="tl-era-h"><small>Part ' + (n + 1) + ' of ' + D.eras.length + '</small><h2 id="h-' + er.key + '">' + esc(er.name) + '</h2><span class="tl-span">' + esc(er.span) + '</span><p>' + esc(er.blurb) + '</p></header><ol class="tl-list">';
    evs.forEach(function (e) {
      var sub = e.label.replace(String(e.year), '').replace(/^[,\s–-]+|[,\s]+$/g, '');
      if (/^\d{4}[–-]\d{2,4}$/.test(e.label) || /\d{4}.*\d{4}/.test(e.label)) sub = e.label;
      html += '<li class="tl-item" data-id="' + e.id + '" id="ev-' + e.id + '"><div class="tl-when"><b data-y>' + e.year + '</b>' + (sub && sub !== String(e.year) ? esc(sub) : '') + '</div>' +
        '<button type="button" class="tl-card" data-open="' + e.id + '" aria-haspopup="dialog"><span><h3 data-f="title">' + esc(e.title) + (e.note ? '<span class="tl-flag" title="Sources differ or a detail is unresolved">Note</span>' : '') + '</h3>' +
        '<p data-f="summary">' + esc(e.summary) + '</p><span class="tl-tags">' + e.themes.map(function (t) { return '<span class="tl-tag">' + esc(D.themes[t]) + '</span>'; }).join('') + '</span>' +
        '<span class="tl-more">Read more <span aria-hidden="true">→</span>' + (e.docs ? '<span class="tl-docs">' + e.docs + ' archive document' + (e.docs > 1 ? 's' : '') + '</span>' : '') + '</span></span>' +
        (e.thumb ? '<span class="tl-thumb"><img src="' + esc(e.thumb) + '" alt="" loading="lazy" decoding="async"></span>' : '') + '</button></li>';
    });
    html += '</ol></section>';
  });
  list.innerHTML = html;

  // ---------- density strip
  var y0 = EV[0].year, y1 = EV[EV.length - 1].year + 1;
  var pos = function (e) { var p = e.sort.split('-'); return ((+p[0] + (+p[1] - 1) / 12 + (+p[2] - 1) / 365) - y0) / (y1 - y0) * 100; };
  var axis = '';
  for (var y = Math.ceil(y0 / 5) * 5; y < y1; y += 5) axis += '<span style="left:' + ((y - y0) / (y1 - y0) * 100) + '%">' + y + '</span>';
  strip.innerHTML = EV.map(function (e) {
    var h = 10 + Math.min(14, e.docs * 3);
    return '<button type="button" style="left:' + pos(e).toFixed(2) + '%;height:' + h + 'px" data-open="' + e.id + '" title="' + esc(e.label + ': ' + e.title) + '" aria-label="' + esc(e.label + ': ' + e.title) + '"></button>';
  }).join('') + '<div class="tl-strip-axis" aria-hidden="true">' + axis + '</div>';

  // ---------- filtering
  function matches(e) {
    if (state.themes.length && !state.themes.some(function (t) { return e.themes.indexOf(t) > -1; })) return false;
    if (state.org && e.orgs.indexOf(state.org) < 0) return false;
    if (state.q) { var terms = norm(state.q).split(/\s+/).filter(Boolean); for (var i = 0; i < terms.length; i++) if (e.hay.indexOf(terms[i]) < 0) return false; }
    return true;
  }
  function highlight(el, text) {
    if (!state.q) { el.innerHTML = esc(text); return; }
    var terms = norm(state.q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) { el.innerHTML = esc(text); return; }
    var n = norm(text), marks = [];
    terms.forEach(function (t) { var k = -1; while ((k = n.indexOf(t, k + 1)) > -1) marks.push([k, k + t.length]); });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', at = 0;
    marks.forEach(function (m) { if (m[0] < at) return; out += esc(text.slice(at, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; at = m[1]; });
    el.innerHTML = out + esc(text.slice(at));
  }
  var shown = EV.slice();
  function apply(push) {
    shown = [];
    var eraN = {};
    EV.forEach(function (e) {
      var ok = matches(e), li = document.getElementById('ev-' + e.id);
      li.hidden = !ok;
      if (ok) { shown.push(e); eraN[e.era] = (eraN[e.era] || 0) + 1; }
      var t = li.querySelector('[data-f="title"]'), s = li.querySelector('[data-f="summary"]');
      var flag = t.querySelector('.tl-flag'); highlight(t, e.title); if (flag) t.appendChild(flag);
      highlight(s, e.summary);
    });
    document.querySelectorAll('.tl-era').forEach(function (sec) {
      sec.hidden = !eraN[sec.dataset.era];
      var last = null;
      sec.querySelectorAll('.tl-item').forEach(function (li) {
        if (li.hidden) return;
        var y = byId[li.dataset.id].year, b = li.querySelector('[data-y]');
        b.hidden = y === last; last = y;
      });
    });
    document.querySelectorAll('[data-eracount]').forEach(function (i) { var n = eraN[i.dataset.eracount] || 0; i.textContent = n + (n === 1 ? ' event' : ' events'); });
    strip.querySelectorAll('button').forEach(function (b) { b.classList.toggle('dim', !matches(byId[b.dataset.open])); });
    var filtered = state.q || state.themes.length || state.org;
    countEl.textContent = filtered ? 'Showing ' + shown.length + ' of ' + EV.length + ' events' : EV.length + ' events';
    resetBtn.hidden = !filtered;
    empty.hidden = shown.length > 0;
    if (push !== false) writeHash();
  }

  // ---------- URL state: #q=..&theme=a,b&org=x&e=id
  function readHash() {
    var h = location.hash.replace(/^#/, ''), o = {};
    if (h.indexOf('=') < 0) return { era: h };
    h.split('&').forEach(function (kv) { var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return o;
  }
  var openId = null, writing = false;
  function writeHash() {
    var p = [];
    if (state.q) p.push('q=' + encodeURIComponent(state.q));
    if (state.themes.length) p.push('theme=' + state.themes.join(','));
    if (state.org) p.push('org=' + state.org);
    if (openId) p.push('e=' + openId);
    var h = p.length ? '#' + p.join('&') : '';
    if (h !== location.hash) { writing = true; history.replaceState(null, '', location.pathname + location.search + h); writing = false; }
  }
  function syncControls() {
    qIn.value = state.q; orgSel.value = state.org;
    chips.querySelectorAll('.tl-chip').forEach(function (c) { c.setAttribute('aria-pressed', state.themes.indexOf(c.dataset.theme) > -1 ? 'true' : 'false'); });
  }

  // ---------- drawer
  var dlg = $('#tl-dlg'), dBody = $('#tl-dlg-body'), dPrev = $('#tl-prev'), dNext = $('#tl-next'), dEra = $('#tl-dlg-era'), lastFocus = null;
  var KIND = { archive: ['Record', 'a'], paper: ['Newspaper', ''], web: ['News', ''], site: ['This site', ''], doc: ['Writing', ''] };
  function related(e) {
    var scored = EV.filter(function (x) { return x !== e; }).map(function (x) {
      var s = 0; x.themes.forEach(function (t) { if (e.themes.indexOf(t) > -1) s += 2; }); x.orgs.forEach(function (o) { if (e.orgs.indexOf(o) > -1) s += 1; });
      s -= Math.abs(x.year - e.year) / 6; return [s, x];
    }).sort(function (a, b) { return b[0] - a[0]; });
    return scored.slice(0, 4).map(function (p) { return p[1]; }).sort(function (a, b) { return a.i - b.i; });
  }
  function render(e) {
    var er = eraOf[e.era];
    dEra.textContent = er.name + ' · ' + er.span;
    var firstArchive = e.sources.filter(function (s) { return s.k === 'archive'; })[0];
    var fig = '';
    if (e.thumb) {
      var big = e.thumb.replace('/thumb/', firstArchive && e.thumb.indexOf('/tclc/') > -1 ? '/read/' : '/thumb/');
      var href = firstArchive && e.thumb.indexOf('/tclc/') > -1 ? firstArchive.href : '../../working-press/';
      var cap = firstArchive && e.thumb.indexOf('/tclc/') > -1 ? firstArchive.label : 'The Working Press, front page';
      fig = '<figure class="tl-fig"><a href="' + esc(href) + '"><img src="' + esc(big) + '" alt="" onerror="this.onerror=null;this.src=\'' + esc(e.thumb) + '\'"></a><figcaption>' + esc(cap) + '</figcaption></figure>';
    }
    dBody.innerHTML = '<p class="when">' + esc(e.label) + '</p><h2 id="tl-dlg-title">' + esc(e.title) + '</h2>' + fig +
      '<p class="lead">' + esc(e.summary) + '</p>' + e.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (e.note ? '<p class="tl-note"><strong>Note on the sources.</strong> ' + esc(e.note) + '</p>' : '') +
      '<h3>Sources</h3><ul class="tl-src">' + e.sources.map(function (s) {
        var k = KIND[s.k] || ['Source', ''];
        var title = '<span class="ic ' + k[1] + '">' + k[0] + '</span>' + esc(s.label);
        return '<li>' + (s.href ? '<a href="' + esc(s.href) + '"' + (/^http/.test(s.href) ? ' target="_blank" rel="noopener"' : '') + '>' + title + '</a>' : '<span class="t">' + title + '</span>') + (s.sub ? '<small>' + esc(s.sub) + '</small>' : '') + '</li>';
      }).join('') + '</ul>' +
      '<h3>Filed under</h3><div class="tl-dlg-tags">' + e.themes.map(function (t) { return '<button type="button" class="tl-tag" data-tag="' + t + '">' + esc(D.themes[t]) + '</button>'; }).join('') +
      e.orgs.map(function (o) { return '<button type="button" class="tl-tag" data-orgtag="' + o + '">' + esc(D.orgs[o]) + '</button>'; }).join('') + '</div>' +
      '<h3>Related</h3><div class="tl-rel">' + related(e).map(function (x) { return '<button type="button" data-go="' + x.id + '"><small>' + esc(x.label) + '</small>' + esc(x.title) + '</button>'; }).join('') + '</div>' +
      '<h3>Cite or share</h3><p style="font-size:.9rem;color:#555">“' + esc(e.title) + '.” Tompkins-Cortland Labor Timeline, Adolfho Romero, Labor Archive. <span id="tl-perma"></span></p>' +
      '<button type="button" class="tl-ib" id="tl-copy">Copy link</button><span class="tl-copied" id="tl-copied" aria-live="polite"></span>';
    var link = location.origin + location.pathname + '#e=' + e.id;
    $('#tl-perma').textContent = link;
    $('#tl-copy').addEventListener('click', function () {
      var done = function () { $('#tl-copied').textContent = 'Copied'; setTimeout(function () { var c = $('#tl-copied'); if (c) c.textContent = ''; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function () { prompt('Copy this link:', link); }); else prompt('Copy this link:', link);
    });
    var idx = shown.indexOf(e);
    dPrev.disabled = idx <= 0; dNext.disabled = idx < 0 || idx >= shown.length - 1;
    dBody.scrollTop = 0;
  }
  function open(id, keepFocus) {
    var e = byId[id]; if (!e) return;
    if (shown.indexOf(e) < 0) { state = { q: '', themes: [], org: '' }; syncControls(); apply(false); }
    openId = id; render(e);
    if (!dlg.open) { lastFocus = keepFocus ? null : document.activeElement; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    document.body.style.overflow = 'hidden';
    writeHash();
    var t = $('#tl-dlg-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  }
  function close() {
    if (!openId) return;
    var id = openId; openId = null;
    if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    document.body.style.overflow = '';
    writeHash();
    var card = document.querySelector('#ev-' + id + ' .tl-card');
    if (card) { card.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }); (lastFocus && document.contains(lastFocus) && lastFocus.closest('.tl-strip-bar') ? lastFocus : card).focus({ preventScroll: true }); }
  }
  function step(d) { var i = shown.indexOf(byId[openId]); var n = shown[i + d]; if (n) open(n.id, true); }

  dlg.addEventListener('close', function () { if (openId) { openId = null; document.body.style.overflow = ''; writeHash(); } });
  dlg.addEventListener('click', function (ev) {
    if (ev.target === dlg) { close(); return; }
    var go = ev.target.closest('[data-go]'); if (go) { open(go.dataset.go, true); return; }
    var tag = ev.target.closest('[data-tag]');
    if (tag) { state = { q: '', themes: [tag.dataset.tag], org: '' }; close(); syncControls(); apply(); $('#tl-ctl').scrollIntoView({ behavior: 'smooth' }); return; }
    var ot = ev.target.closest('[data-orgtag]');
    if (ot) { state = { q: '', themes: [], org: ot.dataset.orgtag }; close(); syncControls(); apply(); $('#tl-ctl').scrollIntoView({ behavior: 'smooth' }); }
  });
  $('#tl-close').addEventListener('click', close);
  dPrev.addEventListener('click', function () { step(-1); });
  dNext.addEventListener('click', function () { step(1); });
  dlg.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if ((ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !/INPUT|TEXTAREA/.test(ev.target.tagName)) { ev.preventDefault(); step(ev.key === 'ArrowRight' ? 1 : -1); }
  });

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-open]'); if (b && !dlg.contains(b)) { ev.preventDefault(); open(b.dataset.open); }
  });

  // ---------- controls
  var tq;
  qIn.addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { state.q = qIn.value.trim(); apply(); }, 140); });
  orgSel.addEventListener('change', function () { state.org = orgSel.value; apply(); });
  chips.addEventListener('click', function (ev) {
    var c = ev.target.closest('.tl-chip'); if (!c) return;
    var t = c.dataset.theme, k = state.themes.indexOf(t);
    if (k > -1) state.themes.splice(k, 1); else state.themes.push(t);
    syncControls(); apply();
  });
  resetBtn.addEventListener('click', function () { state = { q: '', themes: [], org: '' }; syncControls(); apply(); qIn.focus(); });
  document.querySelectorAll('[data-suggest]').forEach(function (b) {
    b.addEventListener('click', function () { state = { q: b.dataset.suggest, themes: [], org: '' }; syncControls(); apply(); $('#tl-ctl').scrollIntoView({ behavior: 'smooth' }); });
  });

  // era rail highlight on scroll
  if ('IntersectionObserver' in window) {
    var links = {}; rail.querySelectorAll('a').forEach(function (a) { links[a.dataset.era] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); }); links[en.target.dataset.era].setAttribute('aria-current', 'true'); } });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.tl-era').forEach(function (s) { io.observe(s); });
  }

  // ---------- init from URL
  function fromHash() {
    if (writing) return;
    var h = readHash();
    if (h.era !== undefined) { apply(false); return; }
    state = { q: h.q || '', themes: (h.theme || '').split(',').filter(function (t) { return D.themes[t]; }), org: D.orgs[h.org] ? h.org : '' };
    syncControls(); apply(false);
    if (h.e && byId[h.e]) open(h.e); else if (openId) close();
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
  $('#tl-total').textContent = EV.length;
})();
