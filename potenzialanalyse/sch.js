/* Potentialanalyse Taverne zum Schäfli: Stellen umschalten, Linie von der Stelle im Gerät zur Lupe. Nativer Scroll, nur Klassen und transform. */
(function () {
  'use strict';
  var $$ = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  function linie(v) {
    var svg = v.querySelector('.bue__linie'), img = v.querySelector('.gr img'), lp = v.querySelector('.lp');
    if (!svg || !img || !lp || !img.dataset.mark) return;
    var b = v.getBoundingClientRect(), g = img.getBoundingClientRect(), l = lp.getBoundingClientRect();
    if (!g.width || !l.width) return;
    var m = img.dataset.mark.split(',').map(Number);
    var x0 = g.left - b.left + g.width * m[0] / 100, y0 = g.top - b.top + g.height * m[1] / 100, w = g.width * m[2] / 100, h = g.height * m[3] / 100;
    var neben = l.left >= g.right - 4 || l.right <= g.left + 4, d;
    if (neben) {
      var rechts = l.left >= g.right - 4, sx = rechts ? x0 + w : x0, sy = y0 + h / 2, ex = rechts ? l.left - b.left : l.right - b.left, ey = Math.min(Math.max(sy, l.top - b.top + 24), l.bottom - b.top - 24);
      d = 'M' + sx + ',' + sy + ' C' + (sx + (ex - sx) * .5) + ',' + sy + ' ' + (sx + (ex - sx) * .5) + ',' + ey + ' ' + ex + ',' + ey;
    } else {
      var sx2 = x0 + w / 2, sy2 = y0 + h, ex2 = Math.min(Math.max(sx2, l.left - b.left + 30), l.right - b.left - 30), ey2 = l.top - b.top;
      d = 'M' + sx2 + ',' + sy2 + ' C' + sx2 + ',' + (sy2 + (ey2 - sy2) * .55) + ' ' + ex2 + ',' + (sy2 + (ey2 - sy2) * .45) + ' ' + ex2 + ',' + ey2;
    }
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height); svg.setAttribute('width', b.width); svg.setAttribute('height', b.height);
    svg.querySelector('path').setAttribute('d', d);
    var r = svg.querySelector('rect'); r.setAttribute('x', x0); r.setAttribute('y', y0); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('rx', 4);
  }
  function alle() { $$('.bue__v.an').forEach(linie); }
  $$('.bue').forEach(function (bue) {
    var v = $$('.bue__v', bue), k = $$('.bue__k button', bue);
    k.forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i;
        v.forEach(function (x, j) { x.classList.toggle('an', j === i); if (j === i) x.removeAttribute('aria-hidden'); else x.setAttribute('aria-hidden', 'true'); });
        k.forEach(function (x, j) { x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        linie(v[i]);
      });
    });
  });
  $$('.bue img').forEach(function (im) { if (!im.complete) im.addEventListener('load', function () { var v = im.closest('.bue__v'); if (v && v.classList.contains('an')) linie(v); }); });
  var t = 0; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(alle, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alle);
  alle(); setTimeout(alle, 1600);
})();
