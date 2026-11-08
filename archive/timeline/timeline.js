/* Tompkins-Cortland labor timeline.
   Data: timeline-data.js (window.LABOR_TIMELINE), page images: timeline-media.js (window.LABOR_TIMELINE_MEDIA). */
(function () {
  'use strict';
  var D = window.LABOR_TIMELINE, M = window.LABOR_TIMELINE_MEDIA || {};
  if (!D) return;
  var EV = D.events, byId = {}, eraOf = {}, eraIdx = {};
  var THEMES = D.themes, ORGS = D.orgs, ERAS = D.eras;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'"); };
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  var icon = function (t, cls) { return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + t + '"/></svg>'; };

  /* ---------------------------------------------------------------- curation */
  var MILESTONES = ['cornell-service-union', 'first-labor-day', 'cargill-strike-begins', 'working-press-launch', 'cargill-solidarity-committee',
    'ithaca-compact', 'smith-corona-layoffs', 'constitution-adopted', 'charter-approved', 'living-wage-coalition', 'hotline-opens', 'name-change',
    'afl-cio-affiliation', 'county-contractors', 'countywide-min-wage', 'gimme', 'excluded-workers', 'just-cause-advance', 'min-wage-study'];
  var TICK = {
    'cornell-service-union': 'UAW Local 2300 comes to Cornell', 'first-labor-day': 'First Labor Day rally at Stewart Park',
    'cargill-strike-begins': 'Cargill salt miners strike in Lansing', 'working-press-launch': 'The Working Press, issue one',
    'smith-corona-layoffs': 'Smith Corona lays off 350 without warning', 'charter-approved': 'The Midstate Central Labor Council is chartered',
    'hotline-opens': 'The Workers’ Rights Hotline opens', 'name-change': 'The Tompkins County Workers’ Center takes its name',
    'county-contractors': 'A living wage for county contract workers', 'gimme': 'Gimme! Coffee baristas vote for a union',
    'excluded-workers': 'The Excluded Workers Fund', 'just-cause-advance': 'Common Council advances just cause, 8 to 0',
    'min-wage-study': 'The Tompkins County Minimum Wage Study'
  };
  /* Photographs and later newsletter pages already published on this site */
  var PHOTOS = {
    'min-wage-study': [
      { src: 'img/minwage-convening.webp', w: 768, h: 768, alt: 'Final public convening of the Tompkins County Minimum Wage Study at the Tompkins County Public Library', cap: 'The study’s final public convening, Tompkins County Public Library, August 27, 2026.' },
      { src: 'img/minwage-team.webp', w: 665, h: 520, alt: 'Adolfho Romero with members of the ILR Co-Lab minimum wage research team at the Tompkins County Public Library', cap: 'The ILR Ithaca Co-Lab minimum wage research team.' }],
    'workers-edge-launch': [
      { src: 'img/workers-edge-2019.webp', w: 600, h: 776, paper: 1, alt: 'Front page of The Workers’ Edge, Summer 2019, headlined We’re Stronger Together, with a photo of a crowded meeting', cap: 'A later issue: The Workers’ Edge, Summer 2019.' }],
    'share-the-wealth-1987': [
      { src: 'img/union-town.webp', w: 560, h: 995, paper: 1, alt: 'Front page of The Working Press, November 1987, headlined Ithaca Is a Union Town', cap: 'The issue that covered it: The Working Press, Vol. 2 No. 6, November 1987, front page.' }]
  };
  var HERO = [
    { src: '../tclc/media/read/b1-138.webp', ev: 'cargill-solidarity-committee', label: '“Support the Cargill Workers” rally flyer, 1986' },
    { src: 'img/union-town.webp', ev: 'share-the-wealth-1987', label: 'The Working Press, November 1987' },
    { src: '../tclc/media/read/b36-105.webp', ev: 'labor-day-1985', label: 'Labor Day rally flyer, 1985' },
    { src: 'img/workers-edge-2019.webp', ev: 'workers-edge-launch', label: 'The Workers’ Edge, 2019' },
    { src: 'img/minwage-convening.webp', ev: 'min-wage-study', label: 'Minimum wage study convening, 2026' }
  ];
  var ERA_ART = {
    center: { poster: 'Caregivers Deserve Better!', ev: 'lakeside-2008', cap: 'Slogan of the Lakeside nursing home campaign, winter 2008–09' },
    community: { poster: 'We Are the 99%', ev: 'labor-day-2012', cap: 'Theme of the 29th Labor Day picnic, September 3, 2012' },
    county: { photo: PHOTOS['workers-edge-launch'][0], ev: 'workers-edge-launch', cap: 'The Workers’ Edge, the Workers’ Center newsletter, Summer 2019' },
    now: { photo: PHOTOS['min-wage-study'][0], ev: 'min-wage-study', cap: 'Final convening of the county minimum wage study, August 27, 2026' }
  };
  /* Working Press issues digitized on this site, and which page ids belong to each */
  var WP = [['v1n1', '0004a', '0015a', 1, 1], ['v1n2', '0015b', '0022a', 1, 2], ['v1n3', '0022b', '0026a', 1, 3], ['v2n1', '0026b', '0029b', 2, 1], ['v2n2', '0030a', '0037a', 2, 2], ['v2n3', '0037b', '0040b', 2, 3]];
  function wpIssueOfPage(p) { for (var i = 0; i < WP.length; i++) if (p >= WP[i][1] && p <= WP[i][2]) return WP[i][0]; return null; }
  function wpIssueOfLabel(l) { var m = /Working Press, Vol\. (\d+) No\. (\d+)/.exec(l); if (!m) return null; for (var i = 0; i < WP.length; i++) if (WP[i][3] === +m[1] && WP[i][4] === +m[2]) return WP[i][0]; return null; }

  /* ---------------------------------------------------------------- prepare */
  var docSeen = {};
  ERAS.forEach(function (er, n) { eraOf[er.key] = er; eraIdx[er.key] = n; });
  EV.forEach(function (e, i) {
    e.i = i; byId[e.id] = e;
    e.mile = MILESTONES.indexOf(e.id) > -1;
    e.docs = e.sources.filter(function (s) { return s.k === 'archive' && M[s.id]; }).map(function (s) { var m = M[s.id]; return { id: s.id, href: s.href, label: s.label, sub: s.sub, t: m.t, d: m.d, n: m.n, th: m.th, rd: m.rd, alt: m.alt, pg: m.pg || [] }; });
    e.docs.forEach(function (d) { docSeen[d.id] = 1; });
    e.photos = PHOTOS[e.id] || [];
    var wpPage = e.thumb && /working-press\/thumb\/p(\d{4}[ab])\.jpg/.exec(e.thumb);
    e.wpPage = wpPage ? 'p' + wpPage[1] : null;
    e.img = e.photos.length ? e.photos[0].src : (e.thumb || (e.docs[0] && e.docs[0].th) || '');
    e.imgKind = e.photos.length ? (e.photos[0].paper ? 'doc' : 'photo') : (e.img ? 'doc' : 'tile');
    e.t0 = e.themes[0] || 'founding';
    e.sources.forEach(function (s) {
      if (s.k === 'paper') {
        var key = wpIssueOfLabel(s.label);
        if (key) s.href = '../../working-press/' + (e.wpPage && wpIssueOfPage(e.wpPage.slice(1)) === key ? '#page=' + e.wpPage : '#issue=' + key);
      }
    });
    var sub = e.label.replace(String(e.year), '').replace(/^[,\s–-]+|[,\s]+$/g, '');
    if (/\d{4}.*\d{2,4}/.test(e.label)) sub = e.label.replace(/^\d{4}$/, '');
    e.sub = sub && sub !== String(e.year) ? sub : '';
    e.hay = norm([e.label, e.title, e.summary, e.body.join(' '), e.sources.map(function (s) { return s.label; }).join(' '),
      e.themes.map(function (t) { return THEMES[t]; }).join(' '), e.orgs.map(function (o) { return ORGS[o]; }).join(' ')].join(' '));
    var sp = e.sort.split('-'); e.t = (+sp[0]) + ((+sp[1]) - 1) / 12 + ((+sp[2]) - 1) / 365;
  });
  var docTotal = Object.keys(docSeen).length;
  /* avoid the same picture on two neighbouring cards */
  EV.forEach(function (e, i) {
    var prev = EV[i - 1];
    if (prev && e.img && e.img === prev.img && !e.photos.length) {
      var alt = e.docs.filter(function (d) { return d.th !== prev.img; })[0];
      if (alt) e.img = alt.th;
    }
  });
  var Y0 = 1981, Y1 = 2026;

  var state = { q: '', themes: [], org: '', year: 0 };
  var view = 'story';
  try { var sv = localStorage.getItem('tl-view'); if (/^(story|grid|list)$/.test(sv)) view = sv; } catch (x) {}

  var main = $('#main'), list = $('#tl-body'), rail = $('#tl-rail'), chipBox = $('#tl-chips');
  var qIn = $('#tl-q'), orgSel = $('#tl-org'), countEl = $('#tl-count'), resetBtn = $('#tl-reset'), empty = $('#tl-empty'), pills = $('#tl-pills');

  /* ---------------------------------------------------------------- hero */
  (function hero() {
    var box = $('#tlx-collage');
    box.insertAdjacentHTML('afterbegin', HERO.map(function (h, n) {
      return '<button type="button" class="tlx-piece p' + (n + 1) + '" data-open="' + h.ev + '" style="--d:' + (n * 90) + 'ms">' +
        '<span class="tlx-piece-img"><img src="' + esc(h.src) + '" alt="" decoding="async"' + (n > 2 ? ' loading="lazy"' : '') + '></span>' +
        '<span class="tlx-piece-cap"><span class="visually-hidden">Open the moment: </span>' + esc(h.label) + '</span></button>';
    }).join(''));
    var pieces = $$('.tlx-piece', box);
    if (reduce) return;
    var mx = 0, my = 0, sy = 0, raf = 0;
    function frame() {
      raf = 0;
      pieces.forEach(function (p, n) {
        var k = [0.06, -0.04, 0.09, -0.07, 0.05][n] || 0.05;
        p.style.setProperty('--py', (sy * k).toFixed(1) + 'px');
        p.style.setProperty('--mx', (mx * (n % 2 ? -8 : 10)).toFixed(1) + 'px');
        p.style.setProperty('--my', (my * (n % 2 ? 6 : -8)).toFixed(1) + 'px');
      });
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    window.addEventListener('scroll', function () { sy = Math.min(window.pageYOffset, 900); kick(); }, { passive: true });
    box.addEventListener('pointermove', function (ev) { var r = box.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - 0.5; my = (ev.clientY - r.top) / r.height - 0.5; kick(); });
    box.addEventListener('pointerleave', function () { mx = my = 0; kick(); });
  })();

  /* count-up numbers */
  $('#st-docs').dataset.n = docTotal; $('#st-docs').textContent = docTotal;
  $('#st-ev').dataset.n = EV.length; $('#st-ev').textContent = EV.length;
  $('#tl-total').textContent = EV.length;
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, t = +el.dataset.n, t0 = null; cio.unobserve(el);
        (function st(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100); el.textContent = Math.round(t * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); })(performance.now());
      });
    }, { threshold: 0.6 });
    $$('.tlx-stats [data-n]').forEach(function (n) { cio.observe(n); });
  }

  /* ---------------------------------------------------------------- ticker */
  (function ticker() {
    var track = $('#tlx-ticker-track'), btn = $('#tlx-ticker-btn'), wrap = $('#tlx-ticker');
    var items = MILESTONES.filter(function (id) { return TICK[id]; }).map(function (id) { var e = byId[id]; return '<span><b>' + e.year + '</b>' + esc(TICK[id]) + '</span>'; }).join('');
    track.innerHTML = '<div class="tlx-ticker-run">' + items + '</div><div class="tlx-ticker-run">' + items + '</div>';
    function set(p) { wrap.classList.toggle('paused', p); btn.setAttribute('aria-pressed', String(p)); btn.textContent = p ? 'Play' : 'Pause'; btn.setAttribute('aria-label', p ? 'Play the scrolling headlines' : 'Pause the scrolling headlines'); }
    set(reduce);
    btn.addEventListener('click', function () { set(!wrap.classList.contains('paused')); });
  })();

  /* ---------------------------------------------------------------- controls */
  var themeCount = {};
  EV.forEach(function (e) { e.themes.forEach(function (t) { themeCount[t] = (themeCount[t] || 0) + 1; }); });
  chipBox.innerHTML = Object.keys(THEMES).map(function (t) {
    return '<button type="button" class="tl-chip" data-theme="' + t + '" aria-pressed="false">' + icon(t) + '<span>' + esc(THEMES[t]) + '</span><b><span class="visually-hidden">, </span>' + (themeCount[t] || 0) + '<span class="visually-hidden"> moments</span></b></button>';
  }).join('');
  orgSel.innerHTML = '<option value="">All organizations</option>' + Object.keys(ORGS).map(function (o) { return '<option value="' + o + '">' + esc(ORGS[o]) + '</option>'; }).join('');

  /* ---------------------------------------------------------------- era rail */
  rail.innerHTML = ERAS.map(function (er, n) {
    return '<li><a href="#era-' + er.key + '" data-era="' + er.key + '"><i class="bar" aria-hidden="true"><i></i></i><small>' + String(n + 1).padStart(2, '0') + ' · ' + esc(er.span) + '</small><b>' + esc(er.name) + '</b><em data-eracount="' + er.key + '"></em></a></li>';
  }).join('');

  /* ---------------------------------------------------------------- body */
  function media(e, big) {
    if (e.imgKind === 'tile') {
      return '<div class="tl-media is-tile" aria-hidden="true">' + icon(e.t0, 'tile-ic') + '<span class="tile-y">' + e.year + '</span></div>';
    }
    var badge = e.imgKind === 'photo' ? '<span class="tl-badge">Photo</span>' : '';
    return '<div class="tl-media is-' + e.imgKind + '"><img src="' + esc(e.img) + '" alt="" loading="lazy" decoding="async">' + badge + '</div>';
  }
  function itemHTML(e) {
    var others = e.sources.filter(function (s) { return s.k !== 'archive'; }).length;
    var foot = [];
    if (e.docs.length) foot.push(plural(e.docs.length, 'archive document'));
    if (others) foot.push(plural(others, 'other source'));
    return '<li class="tl-item' + (e.mile ? ' is-mile' : '') + '" data-id="' + e.id + '" id="ev-' + e.id + '">' +
      '<div class="tl-when" aria-hidden="true"><b data-y>' + e.year + '</b>' + (e.sub ? '<span>' + esc(e.sub) + '</span>' : '') + '</div>' +
      '<article class="tl-card" aria-labelledby="t-' + e.id + '">' + media(e) +
      '<div class="tl-body">' +
      '<p class="tl-meta"><span class="tl-date">' + esc(e.label) + '</span><span class="tl-theme">' + icon(e.t0) + esc(THEMES[e.t0]) + '</span>' +
      (e.mile ? '<span class="tl-mile">' + icon('star') + 'Milestone</span>' : '') +
      (e.note ? '<span class="tl-flag" title="Sources differ or a detail is unresolved">Note on sources</span>' : '') + '</p>' +
      '<h3 id="t-' + e.id + '"><button type="button" class="tl-open" data-open="' + e.id + '" aria-haspopup="dialog"><span data-f="title">' + esc(e.title) + '</span></button></h3>' +
      '<p class="tl-sum" data-f="summary">' + esc(e.summary) + '</p>' +
      '<p class="tl-foot"><span class="tl-more" aria-hidden="true">Read the story <span>→</span></span>' + (foot.length ? '<span class="tl-src-n">' + foot.join(' · ') + '</span>' : '') + '</p>' +
      '</div></article></li>';
  }
  function eraStats(er) {
    var evs = EV.filter(function (e) { return e.era === er.key; });
    var docs = evs.reduce(function (a, e) { return a + e.docs.length; }, 0);
    var tc = {}; evs.forEach(function (e) { e.themes.forEach(function (t) { tc[t] = (tc[t] || 0) + 1; }); });
    var top = Object.keys(tc).sort(function (a, b) { return tc[b] - tc[a] || a.localeCompare(b); }).slice(0, 3);
    return { evs: evs, docs: docs, top: top.map(function (t) { return [t, tc[t]]; }) };
  }
  function coverArt(er, st) {
    var a = ERA_ART[er.key];
    if (a && a.poster) {
      return '<button type="button" class="tlx-poster" data-open="' + a.ev + '"><span class="q">“' + esc(a.poster) + '”</span><span class="c">' + esc(a.cap) + '<span class="visually-hidden">. Open this moment.</span></span></button>';
    }
    if (a && a.photo) {
      return '<button type="button" class="tlx-cover-photo' + (a.photo.paper ? ' is-paper' : '') + '" data-open="' + a.ev + '"><span class="ph"><img src="' + esc(a.photo.src) + '" alt="" loading="lazy" decoding="async"></span><span class="c">' + esc(a.cap) + '<span class="visually-hidden">. Open this moment.</span></span></button>';
    }
    var seen = {}, picks = [];
    st.evs.filter(function (e) { return e.mile; }).concat(st.evs).forEach(function (e) {
      var src = (e.docs[0] && e.docs[0].rd) || e.img;
      if (!src || seen[src] || picks.length >= 4) return; seen[src] = 1; picks.push([e, src]);
    });
    return '<div class="tlx-papers n' + picks.length + '">' + picks.map(function (p, n) {
      return '<button type="button" class="tlx-paper" data-open="' + p[0].id + '" style="--r:' + [-6, 4, -2, 7][n] + 'deg"><img src="' + esc(p[1]) + '" alt="" loading="lazy" decoding="async"><span class="visually-hidden">Open: ' + esc(p[0].title) + '</span></button>';
    }).join('') + '</div>';
  }
  var html = '';
  ERAS.forEach(function (er, n) {
    var st = eraStats(er);
    var kind = ERA_ART[er.key] ? (ERA_ART[er.key].poster ? 'poster' : 'photo') : 'docs';
    html += '<section class="tl-era" id="era-' + er.key + '" data-era="' + er.key + '" aria-labelledby="h-' + er.key + '">' +
      '<header class="tlx-cover is-' + kind + '"><div class="tlx-cover-copy">' +
      '<p class="tlx-cover-k"><span class="tlx-cover-n" aria-hidden="true">' + String(n + 1).padStart(2, '0') + '</span><span>Part ' + (n + 1) + ' of ' + ERAS.length + ' · ' + esc(er.span) + '</span></p>' +
      '<h2 id="h-' + er.key + '">' + esc(er.name) + '</h2><p class="tlx-cover-blurb">' + esc(er.blurb) + '</p>' +
      '<div class="tlx-cover-facts"><p><b data-era-n="' + er.key + '">' + st.evs.length + '</b> moments</p>' + (st.docs ? '<p><b>' + st.docs + '</b> documents</p>' : '') + '</div>' +
      '<div class="tlx-cover-themes"><p>Most frequent themes</p><ul>' + st.top.map(function (t) {
        return '<li><button type="button" data-theme-jump="' + t[0] + '" data-era-jump="' + er.key + '">' + icon(t[0]) + '<span>' + esc(THEMES[t[0]]) + '</span><i style="--w:' + Math.round(t[1] / st.evs.length * 100) + '%" aria-hidden="true"></i><b>' + t[1] + '<span class="visually-hidden"> of ' + st.evs.length + ' moments</span></b></button></li>';
      }).join('') + '</ul></div></div>' +
      '<div class="tlx-cover-art">' + coverArt(er, st) + '</div></header>' +
      '<ol class="tl-list">' + st.evs.map(itemHTML).join('') + '</ol></section>';
  });
  list.innerHTML = html;
  var items = EV.map(function (e) { return document.getElementById('ev-' + e.id); });

  /* ---------------------------------------------------------------- tooltip */
  var tip = $('#tlx-tip'), tipFor = null;
  function showTip(el, head, val, lines) {
    tip.textContent = '';
    var h = document.createElement('b'); h.textContent = val; tip.appendChild(h);
    var s = document.createElement('span'); s.className = 'h'; s.textContent = head; tip.appendChild(s);
    (lines || []).forEach(function (l) { var p = document.createElement('span'); p.className = 'l'; p.textContent = l; tip.appendChild(p); });
    tip.hidden = false; tipFor = el;
    var r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
    var y = r.top - th - 10; if (y < 70) y = r.bottom + 10;
    tip.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  function hideTip(el) { if (!el || el === tipFor) { tip.hidden = true; tipFor = null; } }
  window.addEventListener('scroll', function () { if (!tip.hidden) hideTip(); }, { passive: true });

  /* roving focus for a set of buttons, with a key handler */
  function rove(buttons, start) {
    buttons.forEach(function (b, n) { b.tabIndex = n === start ? 0 : -1; });
  }
  function focusIn(set, b) { set.forEach(function (x) { x.tabIndex = -1; }); b.tabIndex = 0; b.focus(); }

  /* ---------------------------------------------------------------- chart: by year */
  var yearCols = [];
  (function yearChart() {
    var box = $('#chart-year'), cnt = {}, max = 0;
    EV.forEach(function (e) { cnt[e.year] = (cnt[e.year] || 0) + 1; });
    for (var y = Y0; y <= Y1; y++) max = Math.max(max, cnt[y] || 0);
    var top = Math.ceil(max / 5) * 5, span = Y1 - Y0 + 1;
    var bands = ERAS.map(function (er, n) {
      var a = +er.span.slice(0, 4), b = +er.span.slice(-4); a = Math.max(a, Y0);
      return '<div aria-hidden="true" class="ych-band' + (n % 2 ? ' alt' : '') + '" style="left:' + ((a - Y0) / span * 100) + '%;width:' + ((b - a + 1) / span * 100) + '%"><span>' + String(n + 1).padStart(2, '0') + '</span></div>';
    }).join('');
    var grid = ''; for (var g = 0; g <= top; g += 5) grid += '<div class="ych-g" style="bottom:' + (g / top * 100) + '%"><span>' + g + '</span></div>';
    var cols = '';
    for (var yy = Y0; yy <= Y1; yy++) {
      var c = cnt[yy] || 0;
      cols += '<button type="button" class="ych-col' + (c ? '' : ' zero') + '" data-y="' + yy + '"' + (c ? ' aria-pressed="false"' : ' disabled') + ' aria-label="' + yy + ': ' + plural(c, 'moment') + '" style="--h:' + (c / top * 100) + '%">' +
        '<span class="ych-bar"><i class="all"></i><i class="hit"></i></span><span class="ych-x' + (yy % 5 === 0 ? ' on' : '') + '" aria-hidden="true">' + yy + '</span></button>';
    }
    box.innerHTML = '<div class="ych-scroll"><div class="ych" role="group" aria-label="Moments per year, ' + Y0 + ' to ' + Y1 + '. Arrow keys move between years."><div class="ych-plot">' + bands + '<div class="ych-area"><div class="ych-grid" aria-hidden="true">' + grid + '</div><div class="ych-cols">' + cols + '</div></div></div></div></div>' +
      '<div class="tlx-legend" aria-hidden="true"><span><i class="sw all"></i><span class="lab-all">Moments</span></span><span class="when-f"><i class="sw hit"></i>Matching your search or filters</span></div>';
    yearCols = $$('.ych-col:not(.zero)', box);
    rove(yearCols, 0);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.ych-col'); if (!b || b.disabled) return;
      var y = +b.dataset.y; state.year = state.year === y ? 0 : y; syncControls(); apply();
      if (state.year) scrollToList();
    });
    box.addEventListener('keydown', function (ev) {
      var b = ev.target.closest('.ych-col'); if (!b) return;
      var i = yearCols.indexOf(b), n = i;
      if (ev.key === 'ArrowRight') n = Math.min(yearCols.length - 1, i + 1); else if (ev.key === 'ArrowLeft') n = Math.max(0, i - 1);
      else if (ev.key === 'Home') n = 0; else if (ev.key === 'End') n = yearCols.length - 1; else return;
      ev.preventDefault(); focusIn(yearCols, yearCols[n]);
    });
    function tipYear(b) {
      var y = +b.dataset.y, evs = EV.filter(function (e) { return e.year === y; }), hit = evs.filter(matchesNoYear);
      var lines = evs.slice(0, 3).map(function (e) { return '· ' + e.title; }); if (evs.length > 3) lines.push('and ' + (evs.length - 3) + ' more');
      var filtered = state.q || state.themes.length || state.org;
      showTip(b, String(y), filtered ? hit.length + ' of ' + plural(evs.length, 'moment') + ' match' : plural(evs.length, 'moment'), lines);
    }
    box.addEventListener('pointerover', function (ev) { var b = ev.target.closest('.ych-col:not(.zero)'); if (b) tipYear(b); });
    box.addEventListener('pointerout', function (ev) { var b = ev.target.closest('.ych-col'); if (b && !b.contains(ev.relatedTarget)) hideTip(b); });
    box.addEventListener('focusin', function (ev) { var b = ev.target.closest('.ych-col'); if (b) tipYear(b); });
    box.addEventListener('focusout', function (ev) { hideTip(ev.target.closest('.ych-col')); });
  })();

  /* ---------------------------------------------------------------- chart: by organization */
  var orgDots = [];
  (function orgChart() {
    var box = $('#chart-org'), span = Y1 + 1 - Y0, pos = function (t) { return ((t - Y0) / span * 100).toFixed(2); };
    /* stagger dots that would sit on top of each other: rows at 0, -10 and +10 px */
    function dodge(evs) {
      var rows = [0, -10, 10], last = { '0': -9, '-10': -9, '10': -9 }, gap = 0.75 * span / 46;
      return evs.map(function (e) {
        var r = rows.filter(function (y) { return e.t - last[y] >= gap; })[0];
        if (r === undefined) r = rows.reduce(function (a, y) { return last[y] < last[a] ? y : a; }, 0);
        last[r] = e.t; return [e, r];
      });
    }
    var axis = ''; for (var y = 1985; y <= Y1; y += 5) axis += '<span style="left:' + pos(y) + '%">' + y + '</span>';
    var lanes = Object.keys(ORGS).map(function (o, li) {
      var evs = EV.filter(function (e) { return e.orgs.indexOf(o) > -1; });
      var a = evs[0].t, b = evs[evs.length - 1].t;
      return '<div class="och-lane" data-org="' + o + '"><div class="och-lab"><b>' + esc(ORGS[o]) + '</b><small>' + plural(evs.length, 'moment') + ' · ' + evs[0].year + (evs[evs.length - 1].year !== evs[0].year ? '–' + evs[evs.length - 1].year : '') + '</small></div>' +
        '<div class="och-track"><i class="och-range" style="left:' + pos(a) + '%;width:' + Math.max(0.6, pos(b) - pos(a)) + '%"></i>' +
        dodge(evs).map(function (p) { var e = p[0]; return '<button type="button" class="och-dot' + (e.mile ? ' mile' : '') + '" data-open="' + e.id + '" data-lane="' + li + '" style="left:' + pos(e.t) + '%;--dy:' + p[1] + 'px" aria-label="' + esc(e.label + ': ' + e.title) + '"><i></i></button>'; }).join('') +
        '</div></div>';
    }).join('');
    box.innerHTML = '<div class="och-scroll"><div class="och" role="group" aria-label="Moments by organization. Arrow keys move along and between lines; Enter opens a moment.">' + lanes +
      '<div class="och-axis" aria-hidden="true"><div></div><div class="och-ticks">' + axis + '</div></div></div></div>' +
      '<div class="tlx-legend" aria-hidden="true"><span><i class="sw dot"></i>A moment</span><span><i class="sw dot mile"></i>A milestone</span><span><i class="sw range"></i>First to last moment</span><span class="when-f"><i class="sw dot dim"></i>Not matching your filters</span></div>';
    orgDots = $$('.och-dot', box);
    rove(orgDots, 0);
    var lanesDots = Object.keys(ORGS).map(function (o, li) { return orgDots.filter(function (d) { return +d.dataset.lane === li; }); });
    box.addEventListener('keydown', function (ev) {
      var d = ev.target.closest('.och-dot'); if (!d) return;
      var li = +d.dataset.lane, lane = lanesDots[li], i = lane.indexOf(d), nx = null;
      if (ev.key === 'ArrowRight') nx = lane[Math.min(lane.length - 1, i + 1)];
      else if (ev.key === 'ArrowLeft') nx = lane[Math.max(0, i - 1)];
      else if (ev.key === 'Home') nx = lane[0]; else if (ev.key === 'End') nx = lane[lane.length - 1];
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        var to = lanesDots[li + (ev.key === 'ArrowDown' ? 1 : -1)]; if (!to) return;
        var x = parseFloat(d.style.left); nx = to.reduce(function (best, c) { return Math.abs(parseFloat(c.style.left) - x) < Math.abs(parseFloat(best.style.left) - x) ? c : best; }, to[0]);
      } else return;
      ev.preventDefault(); focusIn(orgDots, nx);
    });
    function tipOrg(d) { var e = byId[d.dataset.open]; showTip(d, ORGS[Object.keys(ORGS)[+d.dataset.lane]], e.title, [e.label]); }
    box.addEventListener('pointerover', function (ev) { var d = ev.target.closest('.och-dot'); if (d) tipOrg(d); });
    box.addEventListener('pointerout', function (ev) { var d = ev.target.closest('.och-dot'); if (d && !d.contains(ev.relatedTarget)) hideTip(d); });
    box.addEventListener('focusin', function (ev) { var d = ev.target.closest('.och-dot'); if (d) tipOrg(d); });
    box.addEventListener('focusout', function (ev) { hideTip(ev.target.closest('.och-dot')); });
  })();

  /* ---------------------------------------------------------------- chart: by theme */
  var heatCells = [];
  var RAMP = ['#f4cfc8', '#e69a8e', '#d0645a', '#b31b1b', '#7a1111'];
  function bin(n) { return n <= 0 ? -1 : n === 1 ? 0 : n === 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4; }
  (function themeChart() {
    var box = $('#chart-theme'), tk = Object.keys(THEMES);
    var head = '<div class="hch-c hch-corner" role="columnheader"><span class="visually-hidden">Theme</span></div>' + ERAS.map(function (er, n) {
      return '<div class="hch-c hch-h" role="columnheader"><b>' + String(n + 1).padStart(2, '0') + '</b><span>' + esc(er.span) + '</span><span class="visually-hidden">: ' + esc(er.name) + '</span></div>';
    }).join('') + '<div class="hch-c hch-h hch-tot" role="columnheader"><b>All</b><span>years</span></div>';
    var rows = tk.map(function (t, ri) {
      return '<div class="hch-row" role="row" data-theme="' + t + '"><div class="hch-c hch-lab" role="rowheader">' + icon(t) + '<span>' + esc(THEMES[t]) + '</span></div>' +
        ERAS.map(function (er, ci) { return '<div class="hch-c" role="gridcell"><button type="button" class="hch-cell" data-theme="' + t + '" data-era="' + er.key + '" data-r="' + ri + '" data-c="' + ci + '"><i></i><span class="visually-hidden"></span></button></div>'; }).join('') +
        '<div class="hch-c hch-tot" role="gridcell"><b data-tot="' + t + '"></b></div></div>';
    }).join('');
    box.innerHTML = '<div class="hch-scroll"><div class="hch" role="grid" aria-label="Moments by theme and era. Arrow keys move between squares; Enter filters by that theme and jumps to that era."><div class="hch-row hch-head" role="row">' + head + '</div>' + rows + '</div></div>' +
      '<div class="tlx-legend tlx-ramp" aria-hidden="true"><span>Fewer</span>' + RAMP.map(function (c, i) { return '<i class="sw" style="background:' + c + '" title="' + ['1', '2', '3–4', '5–6', '7 or more'][i] + '"></i>'; }).join('') + '<span>More</span><span class="rng">1 · 2 · 3–4 · 5–6 · 7+ moments</span><span><i class="sw zero"></i>None</span></div>';
    heatCells = $$('.hch-cell', box);
    rove(heatCells, 0);
    box.addEventListener('click', function (ev) {
      var c = ev.target.closest('.hch-cell'); if (!c) return;
      state.themes = [c.dataset.theme]; state.year = 0; syncControls(); apply();
      var sec = document.getElementById('era-' + c.dataset.era); if (sec && !sec.hidden) jump(sec); else scrollToList();
    });
    box.addEventListener('keydown', function (ev) {
      var c = ev.target.closest('.hch-cell'); if (!c) return;
      var r = +c.dataset.r, k = +c.dataset.c, R = tk.length, C = ERAS.length;
      if (ev.key === 'ArrowRight') k = Math.min(C - 1, k + 1); else if (ev.key === 'ArrowLeft') k = Math.max(0, k - 1);
      else if (ev.key === 'ArrowDown') r = Math.min(R - 1, r + 1); else if (ev.key === 'ArrowUp') r = Math.max(0, r - 1);
      else if (ev.key === 'Home') k = 0; else if (ev.key === 'End') k = C - 1; else return;
      ev.preventDefault(); focusIn(heatCells, heatCells[r * C + k]);
    });
    function tipHeat(c) { showTip(c, THEMES[c.dataset.theme] + ' · ' + eraOf[c.dataset.era].span, plural(+c.dataset.n || 0, 'moment'), [eraOf[c.dataset.era].name]); }
    box.addEventListener('pointerover', function (ev) { var c = ev.target.closest('.hch-cell'); if (c) tipHeat(c); });
    box.addEventListener('pointerout', function (ev) { var c = ev.target.closest('.hch-cell'); if (c && !c.contains(ev.relatedTarget)) hideTip(c); });
    box.addEventListener('focusin', function (ev) { var c = ev.target.closest('.hch-cell'); if (c) tipHeat(c); });
    box.addEventListener('focusout', function (ev) { hideTip(ev.target.closest('.hch-cell')); });
  })();

  /* tabs */
  (function tabs() {
    var tabs = $$('[role="tab"]');
    function sel(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      if (focus) t.focus(); hideTip();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (ev) {
        var n = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : null;
        if (n === null) return; ev.preventDefault(); sel(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
  })();

  /* ---------------------------------------------------------------- filtering */
  function termsOf(q) { return norm(q).split(/\s+/).filter(Boolean); }
  function matchesNoYear(e) {
    if (state.themes.length && !state.themes.some(function (t) { return e.themes.indexOf(t) > -1; })) return false;
    if (state.org && e.orgs.indexOf(state.org) < 0) return false;
    if (state.q) { var t = termsOf(state.q); for (var i = 0; i < t.length; i++) if (e.hay.indexOf(t[i]) < 0) return false; }
    return true;
  }
  function matches(e) { return (!state.year || e.year === state.year) && matchesNoYear(e); }
  function matchesForHeat(e) {
    if (state.org && e.orgs.indexOf(state.org) < 0) return false;
    if (state.year && e.year !== state.year) return false;
    if (state.q) { var t = termsOf(state.q); for (var i = 0; i < t.length; i++) if (e.hay.indexOf(t[i]) < 0) return false; }
    return true;
  }
  function highlight(el, text) {
    var terms = state.q ? termsOf(state.q).filter(function (t) { return t.length > 1; }) : [];
    if (!terms.length) { el.innerHTML = esc(text); return; }
    var n = norm(text), marks = [];
    terms.forEach(function (t) { var k = -1; while ((k = n.indexOf(t, k + 1)) > -1) marks.push([k, k + t.length]); });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', at = 0;
    marks.forEach(function (m) { if (m[0] < at) return; out += esc(text.slice(at, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; at = m[1]; });
    el.innerHTML = out + esc(text.slice(at));
  }
  var shown = EV.slice();
  function isFiltered() { return !!(state.q || state.themes.length || state.org || state.year); }
  function apply(push) {
    shown = []; var eraN = {};
    EV.forEach(function (e, i) {
      var ok = matches(e), li = items[i];
      li.hidden = !ok;
      if (ok) { shown.push(e); eraN[e.era] = (eraN[e.era] || 0) + 1; }
      highlight(li.querySelector('[data-f="title"]'), e.title);
      highlight(li.querySelector('[data-f="summary"]'), e.summary);
    });
    $$('.tl-era').forEach(function (sec) {
      var k = sec.dataset.era; sec.hidden = !eraN[k];
      var last = null;
      $$('.tl-item', sec).forEach(function (li) { if (li.hidden) return; var y = byId[li.dataset.id].year, b = li.querySelector('[data-y]'); b.hidden = y === last; last = y; });
    });
    $$('[data-eracount]').forEach(function (el) { var n = eraN[el.dataset.eracount] || 0; el.textContent = plural(n, 'moment'); el.closest('li').classList.toggle('none', !n); });
    $$('[data-era-n]').forEach(function (el) { var n = eraN[el.dataset.eraN] || 0, tot = EV.filter(function (e) { return e.era === el.dataset.eraN; }).length; el.textContent = isFiltered() ? n + ' of ' + tot : tot; });
    var f = isFiltered();
    countEl.textContent = f ? 'Showing ' + shown.length + ' of ' + plural(EV.length, 'moment') : plural(EV.length, 'moment') + ', 1981–2026';
    resetBtn.hidden = !f; empty.hidden = shown.length > 0;
    document.body.classList.toggle('tl-filtered', f);
    renderPills();
    updateCharts();
    if (push !== false) writeHash();
    measure();
  }
  function updateCharts() {
    var f = state.q || state.themes.length || state.org;
    yearCols.forEach(function (b) {
      var y = +b.dataset.y, all = 0, hit = 0;
      EV.forEach(function (e) { if (e.year === y) { all++; if (matchesNoYear(e)) hit++; } });
      b.style.setProperty('--hit', (f ? hit / all : 1).toFixed(3));
      b.setAttribute('aria-pressed', String(state.year === y));
      b.setAttribute('aria-label', y + ': ' + (f ? hit + ' of ' + plural(all, 'moment') + ' match' : plural(all, 'moment')) + (state.year === y ? '. Showing only this year' : ''));
      b.classList.toggle('none', f && !hit);
    });
    orgDots.forEach(function (d) { d.classList.toggle('dim', !matches(byId[d.dataset.open])); });
    heatCells.forEach(function (c) {
      var n = EV.filter(function (e) { return e.era === c.dataset.era && e.themes.indexOf(c.dataset.theme) > -1 && matchesForHeat(e); }).length;
      c.dataset.n = n; var k = bin(n);
      c.style.setProperty('--f', k < 0 ? 'transparent' : RAMP[k]);
      c.classList.toggle('zero', !n); c.classList.toggle('dark', k >= 3);
      c.querySelector('.visually-hidden').textContent = THEMES[c.dataset.theme] + ', ' + eraOf[c.dataset.era].span + ': ' + plural(n, 'moment');
    });
    $$('[data-tot]').forEach(function (b) { b.textContent = EV.filter(function (e) { return e.themes.indexOf(b.dataset.tot) > -1 && matchesForHeat(e); }).length; });
    $$('.hch-row[data-theme]').forEach(function (r) { r.classList.toggle('on', state.themes.indexOf(r.dataset.theme) > -1); });
    document.querySelector('.tlx-explore').classList.toggle('is-f', !!f);
    var la = $('.lab-all'); if (la) la.textContent = f ? 'All moments' : 'Moments';
  }
  function renderPills() {
    var p = [];
    if (state.q) p.push(['q', 'Search: “' + state.q + '”']);
    if (state.year) p.push(['year', 'Year: ' + state.year]);
    if (state.org) p.push(['org', ORGS[state.org]]);
    state.themes.forEach(function (t) { p.push(['theme:' + t, THEMES[t]]); });
    pills.innerHTML = p.map(function (x) { return '<button type="button" class="tlx-pill" data-pill="' + esc(x[0]) + '"><span>' + esc(x[1]) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg><span class="visually-hidden">, remove this filter</span></button>'; }).join('');
    var n = state.themes.length, tb = $('#tl-themes-n'); tb.hidden = !n; tb.innerHTML = '<span class="visually-hidden">, </span>' + n + '<span class="visually-hidden"> selected</span>';
  }
  pills.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-pill]'); if (!b) return;
    var k = b.dataset.pill;
    if (k === 'q') state.q = ''; else if (k === 'year') state.year = 0; else if (k === 'org') state.org = '';
    else if (k.indexOf('theme:') === 0) state.themes = state.themes.filter(function (t) { return t !== k.slice(6); });
    syncControls(); apply();
    var nxt = pills.querySelector('.tlx-pill') || qIn; nxt.focus();
  });

  /* ---------------------------------------------------------------- URL state */
  function readHash() {
    var h = location.hash.replace(/^#/, ''), o = {};
    if (h.indexOf('=') < 0) return { anchor: h };
    h.split('&').forEach(function (kv) { var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return o;
  }
  var openId = null, writing = false;
  function writeHash() {
    var p = [];
    if (state.q) p.push('q=' + encodeURIComponent(state.q));
    if (state.themes.length) p.push('theme=' + state.themes.join(','));
    if (state.org) p.push('org=' + state.org);
    if (state.year) p.push('y=' + state.year);
    if (view !== 'story') p.push('v=' + view);
    if (openId) p.push('e=' + openId);
    var h = p.length ? '#' + p.join('&') : '';
    if (h !== location.hash && !(h === '' && /^#(era-|main|explore|about)/.test(location.hash))) { writing = true; history.replaceState(null, '', location.pathname + location.search + (h || '')); writing = false; }
  }
  function syncControls() {
    qIn.value = state.q; orgSel.value = state.org;
    $$('.tl-chip', chipBox).forEach(function (c) { c.setAttribute('aria-pressed', state.themes.indexOf(c.dataset.theme) > -1 ? 'true' : 'false'); });
  }

  /* ---------------------------------------------------------------- views */
  function setView(v, push) {
    view = v; main.dataset.view = v;
    $$('.tlx-views button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); });
    try { localStorage.setItem('tl-view', v); } catch (x) {}
    if (push !== false) writeHash();
    measure();
  }
  $$('.tlx-views button').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });

  /* ---------------------------------------------------------------- scrolling helpers */
  var rootEl = document.documentElement;
  function offset() { return (parseFloat(getComputedStyle(rootEl).getPropertyValue('--hdr')) || 0) + (window.innerWidth > 820 ? $('#tl-ctl').offsetHeight : 0) + 12; }
  function jump(el) { var y = el.getBoundingClientRect().top + window.pageYOffset - offset(); window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' }); }
  function scrollToList() { var first = items.filter(function (li) { return !li.hidden; })[0]; jump(first ? first.closest('.tl-era') : main); }

  /* ---------------------------------------------------------------- reader drawer */
  var dlg = $('#tl-dlg'), dBody = $('#tl-dlg-body'), dPrev = $('#tl-prev'), dNext = $('#tl-next'), dEra = $('#tl-dlg-era'), dPos = $('#tl-dlg-pos'), lastFocus = null;
  var KIND = { archive: ['Record', 'a', 'doc'], paper: ['Newspaper', 'p', 'press'], web: ['News', 'w', 'solidarity'], site: ['This site', 's', 'founding'], doc: ['Writing', 'd', 'contracts'] };
  function related(e) {
    return EV.filter(function (x) { return x !== e; }).map(function (x) {
      var s = 0; x.themes.forEach(function (t) { if (e.themes.indexOf(t) > -1) s += 2; }); x.orgs.forEach(function (o) { if (e.orgs.indexOf(o) > -1) s += 1; });
      s -= Math.abs(x.t - e.t) / 6; return [s, x];
    }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 4).map(function (p) { return p[1]; }).sort(function (a, b) { return a.i - b.i; });
  }
  function cite(e) { return '“' + e.title + ".” In Adolfho Romero, Tompkins-Cortland Labor Timeline, Labor Archive. " + location.origin + location.pathname + '#e=' + e.id; }
  var LB = [], LBstart = [];
  function render(e) {
    var er = eraOf[e.era];
    dEra.textContent = String(eraIdx[e.era] + 1).padStart(2, '0') + ' · ' + er.name;
    var idx = shown.indexOf(e);
    dPos.textContent = idx > -1 ? (idx + 1) + ' of ' + shown.length : '';
    LB = []; LBstart = [];
    e.docs.forEach(function (d) {
      LBstart.push(LB.length);
      var pages = d.pg.length ? d.pg : [[d.rd.split('/').pop(), '']];
      pages.forEach(function (pg, k) {
        LB.push({ src: '../tclc/media/read/' + pg[0], alt: k === 0 ? d.alt : 'Page ' + (k + 1) + ' of ' + d.label, title: d.label,
          sub: d.t + ' · ' + d.d + (pages.length > 1 ? ' · page ' + (k + 1) + ' of ' + pages.length : ' · 1 page'), href: d.href });
      });
    });
    var fig = '';
    if (e.photos.length) {
      var ph = e.photos;
      fig = '<div class="tl-hero' + (ph[0].paper ? ' is-paper' : '') + '"><figure><img src="' + esc(ph[0].src) + '" alt="' + esc(ph[0].alt) + '" width="' + ph[0].w + '" height="' + ph[0].h + '"><figcaption>' + esc(ph[0].cap) + '</figcaption></figure>' +
        (ph.length > 1 ? ph.slice(1).map(function (p) { return '<figure class="sm"><img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" loading="lazy" width="' + p.w + '" height="' + p.h + '"><figcaption>' + esc(p.cap) + '</figcaption></figure>'; }).join('') : '') + '</div>';
    } else if (e.docs.length) {
      var d0 = e.docs[0];
      fig = '<div class="tl-hero is-doc"><button type="button" class="tl-hero-btn" data-lb="0"><img src="' + esc(d0.rd) + '" alt="' + esc(d0.alt) + '"><span class="zoom">' + icon('doc') + (e.docs.length > 1 ? 'View the ' + e.docs.length + ' documents' : 'View the document')  + '</span></button></div>';
    } else if (e.wpPage) {
      fig = '<div class="tl-hero is-doc"><a class="tl-hero-btn" href="../../working-press/#page=' + e.wpPage + '"><img src="' + esc(e.thumb) + '" alt="A page of The Working Press"><span class="zoom">' + icon('press') + 'Read this page in The Working Press</span></a></div>';
    }
    var others = e.sources.filter(function (s) { return s.k !== 'archive'; });
    var docsHTML = e.docs.length ? '<h3>' + icon('doc') + 'In the archive <span>' + e.docs.length + '</span></h3><ul class="tl-docs">' + e.docs.map(function (d, n) {
      return '<li><button type="button" class="tl-doc-img" data-lb="' + n + '" aria-label="View: ' + esc(d.label) + '"><img src="' + esc(d.th) + '" alt="" loading="lazy"></button>' +
        '<div><span class="tl-doc-t">' + esc(d.t) + '</span><a href="' + esc(d.href) + '">' + esc(d.label) + '</a><small>' + esc(d.d) + ' · ' + plural(d.n, 'page') + '</small></div></li>';
    }).join('') + '</ul>' : '';
    var srcHTML = others.length ? '<h3>' + icon('press') + (e.docs.length ? 'Other sources' : 'Sources') + ' <span>' + others.length + '</span></h3><ul class="tl-src">' + others.map(function (s) {
      var k = KIND[s.k] || ['Source', '', 'doc'];
      var inner = '<span class="ic ' + k[1] + '">' + k[0] + '</span><span class="lbl">' + esc(s.label) + '</span>' + (s.sub ? '<small>' + esc(s.sub) + '</small>' : '');
      if (s.href) { var ext = /^http/.test(s.href); var host = ext ? s.href.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : ''; return '<li><a href="' + esc(s.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + inner + (ext ? '<small class="host">' + esc(host) + ' ↗<span class="visually-hidden"> (opens in a new tab)</span></small>' : '') + '</a></li>'; }
      return '<li><span class="t">' + inner + '</span></li>';
    }).join('') + '</ul>' : '';
    var rel = related(e);
    dBody.innerHTML = '<p class="when">' + esc(e.label) + (e.mile ? '<span class="tl-mile">' + icon('star') + 'Milestone</span>' : '') + '</p>' +
      '<h2 id="tl-dlg-title" tabindex="-1">' + esc(e.title) + '</h2>' + fig +
      '<p class="lead">' + esc(e.summary) + '</p>' + e.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (e.note ? '<p class="tl-note"><strong>Note on the sources.</strong> ' + esc(e.note) + '</p>' : '') +
      docsHTML + srcHTML +
      '<h3>Filed under</h3><div class="tl-dlg-tags">' + e.themes.map(function (t) { return '<button type="button" class="tl-tag" data-tag="' + t + '">' + icon(t) + esc(THEMES[t]) + '<span class="visually-hidden">: show all moments with this theme</span></button>'; }).join('') +
      e.orgs.map(function (o) { return '<button type="button" class="tl-tag o" data-orgtag="' + o + '">' + esc(ORGS[o]) + '<span class="visually-hidden">: show all moments with this organization</span></button>'; }).join('') + '</div>' +
      '<h3>Related moments</h3><div class="tl-rel">' + rel.map(function (x) {
        return '<button type="button" data-go="' + x.id + '">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '<span class="ri">' + icon(x.t0) + '</span>') + '<span><small>' + esc(x.label) + '</small>' + esc(x.title) + '</span></button>';
      }).join('') + '</div>' +
      '<h3>Cite or share</h3><p class="tl-cite" id="tl-cite"></p><div class="tl-share"><button type="button" class="tl-ib" data-copy="link">Copy link</button><button type="button" class="tl-ib" data-copy="cite">Copy citation</button>' +
      (navigator.share ? '<button type="button" class="tl-ib" data-copy="share">Share…</button>' : '') + '<span class="tl-copied" id="tl-copied" role="status"></span></div>';
    $('#tl-cite').textContent = cite(e);
    var p = shown[idx - 1], n = shown[idx + 1];
    dPrev.disabled = !p; dNext.disabled = !n;
    dPrev.setAttribute('aria-label', p ? 'Previous moment: ' + p.title : 'No previous moment');
    dNext.setAttribute('aria-label', n ? 'Next moment: ' + n.title : 'No next moment');
    dPrev.title = p ? p.title : ''; dNext.title = n ? n.title : '';
    dBody.scrollTop = 0;
  }
  function open(id, keepFocus) {
    var e = byId[id]; if (!e) return;
    if (shown.indexOf(e) < 0) { state = { q: '', themes: [], org: '', year: 0 }; syncControls(); apply(false); }
    openId = id; render(e);
    if (!dlg.open) { lastFocus = keepFocus ? lastFocus : document.activeElement; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    document.body.classList.add('tl-locked');
    writeHash(); hideTip();
    var t = $('#tl-dlg-title'); if (t) t.focus({ preventScroll: true });
  }
  function close() {
    if (!openId) return;
    var id = openId; openId = null;
    if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    document.body.classList.remove('tl-locked');
    writeHash();
    var li = document.getElementById('ev-' + id), btn = li && li.querySelector('.tl-open');
    var back = lastFocus && document.contains(lastFocus) && !dlg.contains(lastFocus) && lastFocus !== document.body ? lastFocus : btn;
    if (back === btn && li) { var r = li.getBoundingClientRect(); if (r.top < offset() || r.bottom > window.innerHeight) li.scrollIntoView({ block: 'center' }); }
    if (back) back.focus({ preventScroll: back !== btn });
    lastFocus = null;
  }
  function step(d) { var i = shown.indexOf(byId[openId]); var nx = shown[i + d]; if (nx) open(nx.id, true); }
  dlg.addEventListener('close', function () { if (openId) { openId = null; document.body.classList.remove('tl-locked'); writeHash(); } });
  dlg.addEventListener('click', function (ev) {
    if (ev.target === dlg) { close(); return; }
    var go = ev.target.closest('[data-go]'); if (go) { open(go.dataset.go, true); return; }
    var lb = ev.target.closest('[data-lb]'); if (lb) { openLB(LBstart[+lb.dataset.lb] || 0, lb); return; }
    var tag = ev.target.closest('[data-tag]');
    if (tag) { state = { q: '', themes: [tag.dataset.tag], org: '', year: 0 }; lastFocus = null; close(); syncControls(); apply(); scrollToList(); return; }
    var ot = ev.target.closest('[data-orgtag]');
    if (ot) { state = { q: '', themes: [], org: ot.dataset.orgtag, year: 0 }; lastFocus = null; close(); syncControls(); apply(); scrollToList(); return; }
    var cp = ev.target.closest('[data-copy]');
    if (cp) {
      var e = byId[openId], link = location.origin + location.pathname + '#e=' + e.id, msg = $('#tl-copied');
      var done = function (m) { msg.textContent = m; setTimeout(function () { if (msg) msg.textContent = ''; }, 2200); };
      if (cp.dataset.copy === 'share') { navigator.share({ title: e.title, text: e.summary, url: link }).catch(function () {}); return; }
      var txt = cp.dataset.copy === 'cite' ? cite(e) : link;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { done(cp.dataset.copy === 'cite' ? 'Citation copied' : 'Link copied'); }, function () { done('Select the text above to copy it'); });
      else done('Select the text above to copy it');
    }
  });
  $('#tl-close').addEventListener('click', close);
  dPrev.addEventListener('click', function () { step(-1); });
  dNext.addEventListener('click', function () { step(1); });
  dlg.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    else if ((ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) { ev.preventDefault(); step(ev.key === 'ArrowRight' ? 1 : -1); }
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-open]'); if (b && !dlg.contains(b)) { ev.preventDefault(); open(b.dataset.open); }
  });

  /* ---------------------------------------------------------------- document viewer */
  var lb = $('#tlx-lb'), lbI = 0, lbFrom = null;
  function lbShow() {
    var d = LB[lbI]; if (!d) return;
    var img = $('#tlx-lb-img'); img.src = d.src; img.alt = d.alt;
    $('#tlx-lb-title').textContent = d.title;
    $('#tlx-lb-n').textContent = LB.length > 1 ? 'Image ' + (lbI + 1) + ' of ' + LB.length : '';
    $('#tlx-lb-foot').innerHTML = '<span>' + esc(d.sub) + '</span><a class="arc-btn" href="' + esc(d.href) + '">Open the full record <span aria-hidden="true">→</span></a>';
    $('#tlx-lb-prev').disabled = lbI <= 0; $('#tlx-lb-next').disabled = lbI >= LB.length - 1;
    $('#tlx-lb-prev').hidden = $('#tlx-lb-next').hidden = LB.length < 2;
  }
  function openLB(i, from) { if (!LB.length || !lb.showModal) { var d = LB[i]; if (d) location.href = d.href; return; } lbI = i; lbFrom = from; lbShow(); lb.showModal(); $('#tlx-lb-close').focus(); }
  function closeLB() { if (lb.open) lb.close(); }
  lb.addEventListener('close', function () { if (lbFrom && document.contains(lbFrom)) lbFrom.focus(); });
  $('#tlx-lb-close').addEventListener('click', closeLB);
  $('#tlx-lb-prev').addEventListener('click', function () { if (lbI > 0) { lbI--; lbShow(); } });
  $('#tlx-lb-next').addEventListener('click', function () { if (lbI < LB.length - 1) { lbI++; lbShow(); } });
  lb.addEventListener('click', function (ev) { if (ev.target === lb || ev.target.classList.contains('tlx-lb-stage')) closeLB(); });
  lb.addEventListener('keydown', function (ev) {
    ev.stopPropagation();
    if (ev.key === 'ArrowRight' && lbI < LB.length - 1) { lbI++; lbShow(); }
    else if (ev.key === 'ArrowLeft' && lbI > 0) { lbI--; lbShow(); }
  });

  /* ---------------------------------------------------------------- controls wiring */
  var tq;
  qIn.addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { state.q = qIn.value.trim(); apply(); }, 160); });
  qIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(tq); state.q = qIn.value.trim(); apply(); if (shown.length) scrollToList(); } });
  orgSel.addEventListener('change', function () { state.org = orgSel.value; apply(); });
  chipBox.addEventListener('click', function (ev) {
    var c = ev.target.closest('.tl-chip'); if (!c) return;
    var t = c.dataset.theme, k = state.themes.indexOf(t);
    if (k > -1) state.themes.splice(k, 1); else state.themes.push(t);
    syncControls(); apply();
  });
  /* themes popover */
  var tBtn = $('#tl-themes-btn'), tPanel = $('#tl-themes');
  function setPop(on, focus) {
    tPanel.hidden = !on; tBtn.setAttribute('aria-expanded', String(on));
    if (on && focus) { var f = chipBox.querySelector('.tl-chip'); if (f) f.focus(); }
  }
  tBtn.addEventListener('click', function () { setPop(tPanel.hidden, true); });
  tPanel.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.stopPropagation(); setPop(false); tBtn.focus(); } });
  document.addEventListener('click', function (ev) { if (!tPanel.hidden && !ev.target.closest('.tlx-pop')) setPop(false); });
  document.addEventListener('focusin', function (ev) { if (!tPanel.hidden && !ev.target.closest('.tlx-pop')) setPop(false); });

  function resetAll() { state = { q: '', themes: [], org: '', year: 0 }; syncControls(); apply(); }
  resetBtn.addEventListener('click', function () { resetAll(); qIn.focus(); });
  $('#tl-empty-reset').addEventListener('click', function () { resetAll(); qIn.focus(); });
  $$('[data-suggest]').forEach(function (b) {
    b.addEventListener('click', function () { state = { q: b.dataset.suggest, themes: [], org: '', year: 0 }; syncControls(); apply(); scrollToList(); });
  });
  list.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-theme-jump]'); if (!t) return;
    state = { q: '', themes: [t.dataset.themeJump], org: '', year: 0 }; syncControls(); apply();
    var sec = document.getElementById('era-' + t.dataset.eraJump); if (sec) jump(sec);
  });
  rail.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-era]'); if (!a) return;
    var sec = document.getElementById('era-' + a.dataset.era);
    ev.preventDefault();
    if (sec.hidden) { resetAll(); sec = document.getElementById('era-' + a.dataset.era); }
    jump(sec); var h = sec.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName) || ev.target.isContentEditable || dlg.open || lb.open) return;
    ev.preventDefault(); qIn.focus(); qIn.select();
  });

  /* ---------------------------------------------------------------- sticky offsets, progress, current year */
  var pos = [], secs = [], ticking = false, curId = null;
  function setHdr() {
    var top = document.querySelector('.tv3-top');
    var h = top && getComputedStyle(top).position === 'sticky' ? top.offsetHeight : 0;
    rootEl.style.setProperty('--hdr', h + 'px');
    rootEl.style.setProperty('--ctl', (window.innerWidth > 820 ? $('#tl-ctl').offsetHeight : 0) + 'px');
  }
  function measure() {
    var y = window.pageYOffset;
    pos = items.filter(function (li) { return !li.hidden; }).map(function (li) { return [li.getBoundingClientRect().top + y, li]; });
    secs = $$('.tl-era').filter(function (s) { return !s.hidden; }).map(function (s) { var r = s.getBoundingClientRect(), l = s.querySelector('.tl-list').getBoundingClientRect(); return [s, r.top + y, r.height, l.top + y, l.height]; });
    frame();
  }
  var nowY = $('#tlx-now-y'), nowEra = $('#tlx-now-era'), prog = $('#tlx-prog'), railLinks = {};
  $$('a[data-era]', rail).forEach(function (a) { railLinks[a.dataset.era] = a; });
  function frame() {
    ticking = false;
    var y = window.pageYOffset, line = y + offset() + window.innerHeight * 0.18;
    var cur = null;
    for (var i = 0; i < pos.length; i++) { if (pos[i][0] <= line) cur = pos[i][1]; else break; }
    if (!cur && pos.length) cur = pos[0][1];
    /* once an era's cover reaches the reading line, show that era even before its first card */
    for (var k = secs.length - 1; k >= 0; k--) {
      if (secs[k][1] <= line) {
        if (cur && byId[cur.dataset.id].era !== secs[k][0].dataset.era) { var f0 = secs[k][0].querySelector('.tl-item:not([hidden])'); if (f0) cur = f0; }
        break;
      }
    }
    if (cur && cur.dataset.id !== curId) {
      curId = cur.dataset.id; var e = byId[curId];
      nowY.textContent = e.year; nowEra.textContent = eraOf[e.era].name;
      Object.keys(railLinks).forEach(function (k) { if (k === e.era) railLinks[k].setAttribute('aria-current', 'true'); else railLinks[k].removeAttribute('aria-current'); });
    }
    secs.forEach(function (s) {
      var p = Math.max(0, Math.min(1, (line - s[1]) / Math.max(1, s[2])));
      var a = railLinks[s[0].dataset.era]; if (a) a.style.setProperty('--p', p.toFixed(3));
      var lp = Math.max(0, Math.min(1, (line - s[3]) / Math.max(1, s[4])));
      s[0].querySelector('.tl-list').style.setProperty('--fill', lp.toFixed(3));
    });
    if (secs.length) {
      var a0 = secs[0][1], a1 = secs[secs.length - 1][1] + secs[secs.length - 1][2];
      prog.style.transform = 'scaleX(' + Math.max(0, Math.min(1, (line - a0) / (a1 - a0))).toFixed(4) + ')';
    }
    $('#tl-ctl').classList.toggle('stuck', $('#tl-ctl').getBoundingClientRect().top <= (parseFloat(getComputedStyle(rootEl).getPropertyValue('--hdr')) || 0) + 1);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setHdr(); measure(); }, 120); });
  window.addEventListener('load', function () { setHdr(); measure(); });
  document.addEventListener('DOMContentLoaded', function () {
    setHdr(); measure();
    var top = document.querySelector('.tv3-top');
    if (top && 'ResizeObserver' in window) new ResizeObserver(function () { setHdr(); }).observe(top);
  });

  /* reveal on scroll */
  if ('IntersectionObserver' in window && !reduce) {
    rootEl.classList.add('tl-rv');
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (li) { rio.observe(li); });
    $$('.tlx-cover').forEach(function (c) { rio.observe(c); });
    window.addEventListener('beforeprint', function () { $$('.tl-item, .tlx-cover').forEach(function (n) { n.classList.add('in'); }); });
  }

  /* ---------------------------------------------------------------- init from URL */
  function fromHash() {
    if (writing) return;
    var h = readHash();
    if (h.anchor !== undefined) {
      apply(false);
      var m = /^era-(\w+)$/.exec(h.anchor); if (m && document.getElementById(h.anchor)) setTimeout(function () { jump(document.getElementById(h.anchor)); }, 60);
      return;
    }
    state = { q: h.q || '', themes: (h.theme || '').split(',').filter(function (t) { return THEMES[t]; }), org: ORGS[h.org] ? h.org : '', year: +h.y || 0 };
    if (h.v && /^(story|grid|list)$/.test(h.v)) setView(h.v, false);
    syncControls(); apply(false);
    if (h.e && byId[h.e]) open(h.e); else if (openId) close();
  }
  window.addEventListener('hashchange', fromHash);
  setView(view, false);
  fromHash();
})();
