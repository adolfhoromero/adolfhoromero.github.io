(function () {
  'use strict';
  // Reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // Carousel arrows (course texts, student quotes)
  document.querySelectorAll('.v4-arrows').forEach(function (box) {
    var track = document.getElementById(box.getAttribute('data-for'));
    if (!track) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      track.scrollBy({ left: Number(b.dataset.dir) * Math.max(260, track.clientWidth * .8), behavior: 'smooth' });
    });
  });

  // Certificate lightbox
  var lb = document.getElementById('v4-lightbox');
  if (lb && lb.showModal) {
    var img = document.getElementById('v4-lb-img'), cap = document.getElementById('v4-lb-cap'), dl = document.getElementById('v4-lb-dl');
    document.querySelectorAll('.v4-cert').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.dataset.src; img.alt = b.querySelector('img').alt;
        cap.innerHTML = b.dataset.cap; dl.href = b.dataset.dl; dl.setAttribute('download', '');
        lb.showModal();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  // Progress bar
  var bar = document.getElementById('progress-bar');
  if (bar) {
    var upd = function () {
      var d = document.documentElement, h = d.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }
})();
