/* Labor Archive item page: deep-zoom dialog and copy-to-clipboard helpers.
   Without JavaScript, the "Zoom" links open the large image directly. */
(function () {
  'use strict';
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page[data-zoom]'));
  var dlg = document.getElementById('zoom');
  var viewer = null, cur = 0, opener = null;

  function setStatus(el, msg) { if (el) { el.textContent = msg; setTimeout(function () { if (el.textContent === msg) el.textContent = ''; }, 6000); } }

  // ---------- copy helpers ----------
  function copyText(text, statusEl, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      setStatus(statusEl, ok ? okMsg : 'Copying was blocked by the browser. Select the text and copy it manually.');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { setStatus(statusEl, okMsg); }, fallback);
    } else { fallback(); }
  }
  var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  Array.prototype.forEach.call(document.querySelectorAll('.accessed'), function (s) { s.textContent = ' Accessed ' + today + '.'; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.hidden = false;
    b.addEventListener('click', function () {
      var src = document.querySelector(b.getAttribute('data-copy'));
      var text = src.getAttribute('data-text') || src.textContent.replace(/\s+/g, ' ').trim();
      copyText(text, document.getElementById(b.getAttribute('data-status')), b.getAttribute('data-ok') || 'Copied.');
    });
  });

  // ---------- zoom dialog ----------
  if (!dlg || !pages.length || typeof dlg.showModal !== 'function') return;
  var title = document.getElementById('z-title'), sub = document.getElementById('z-sub');
  var prev = document.getElementById('z-prev'), next = document.getElementById('z-next');
  var full = document.getElementById('z-full');
  var hasCopies = pages.some(function (p) { return /^Copy/.test(p.getAttribute('data-label')); });

  function show(i) {
    cur = Math.max(0, Math.min(pages.length - 1, i));
    var p = pages[cur];
    sub.textContent = p.getAttribute('data-label') + (hasCopies ? ' (image ' + (cur + 1) + ' of ' + pages.length + ')' : '');
    prev.disabled = cur === 0; next.disabled = cur === pages.length - 1;
    full.href = p.getAttribute('data-zoom');
    var src = { type: 'image', url: p.getAttribute('data-zoom'), buildPyramid: true };
    if (window.OpenSeadragon) {
      if (!viewer) {
        viewer = OpenSeadragon({
          element: document.getElementById('osd'),
          prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
          showNavigationControl: false, showNavigator: true, navigatorPosition: 'BOTTOM_RIGHT',
          navigatorHeight: 110, navigatorWidth: 84, minZoomLevel: 0.5, maxZoomPixelRatio: 3,
          visibilityRatio: 0.8, animationTime: 0.45, springStiffness: 7,
          gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
          gestureSettingsTouch: { pinchRotate: false },
          tileSources: src
        });
        var cv = document.querySelector('#osd .openseadragon-canvas');
        if (cv) { cv.setAttribute('tabindex', '0'); cv.setAttribute('aria-label', 'Zoomable page image. Use plus and minus to zoom and arrow keys to move.'); }
      } else { viewer.open(src); }
      viewer.addOnceHandler('open-failed', function () {
        document.getElementById('osd').innerHTML = '<p style="padding:24px">This image could not be loaded. <a style="color:#9cc3ff" href="' + p.getAttribute('data-zoom') + '">Open the image file directly</a>.</p>';
        viewer = null;
      });
    } else {
      document.getElementById('osd').innerHTML = '<div style="height:100%;overflow:auto"><img class="zfallback" src="' + p.getAttribute('data-zoom') + '" alt="' + p.querySelector('img').alt.replace(/"/g, '&quot;') + '"></div>';
    }
  }
  function open(i, from) {
    opener = from || null;
    dlg.showModal();
    show(i);
    document.getElementById('z-close').focus();
  }
  dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  pages.forEach(function (p, i) {
    Array.prototype.forEach.call(p.querySelectorAll('[data-open-zoom]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(i, a); });
    });
  });
  prev.addEventListener('click', function () { show(cur - 1); });
  next.addEventListener('click', function () { show(cur + 1); });
  document.getElementById('z-in').addEventListener('click', function () { if (viewer) { viewer.viewport.zoomBy(1.5); viewer.viewport.applyConstraints(); } });
  document.getElementById('z-out').addEventListener('click', function () { if (viewer) { viewer.viewport.zoomBy(0.67); viewer.viewport.applyConstraints(); } });
  document.getElementById('z-rot').addEventListener('click', function () { if (viewer) viewer.viewport.setRotation((viewer.viewport.getRotation() + 90) % 360); });
  document.getElementById('z-fit').addEventListener('click', function () { if (viewer) { viewer.viewport.setRotation(0); viewer.viewport.goHome(); } });
  document.getElementById('z-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'PageDown' || (e.key === ']')) { e.preventDefault(); show(cur + 1); }
    if (e.key === 'PageUp' || (e.key === '[')) { e.preventDefault(); show(cur - 1); }
  });
})();
