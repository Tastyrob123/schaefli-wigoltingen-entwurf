/* Taverne zum Schäfli · ein Skript für Laden, Auftritte, Leiste und die Momente der Seite.
   Nur transform, nativer Scroll, keine Bibliothek (Regel 55). */
(function () {
  'use strict';
  var d = document, w = window, html = d.documentElement;
  clearTimeout(w.__auftrittNotfall);
  var leise = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* Bilder laden mit Reihenfolge: erster Schirm sofort, dann drei Bildschirmhöhen voraus, nach «load» der Rest der Reihe nach */
  var offen = [].slice.call(d.querySelectorAll('img[data-srcset]'));
  function lade(img) {
    if (!img.dataset.srcset) return;
    img.sizes = img.dataset.sizes || '100vw';
    img.srcset = img.dataset.srcset;
    img.removeAttribute('data-srcset');
    var src = img.closest('picture');
    if (src) [].forEach.call(src.querySelectorAll('source[data-srcset]'), function (s) { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
  }
  if ('IntersectionObserver' in w) {
    var vor = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { lade(e.target); vor.unobserve(e.target); } });
    }, { rootMargin: '400% 0px 400% 0px' });
    offen.forEach(function (i) { vor.observe(i); });
    w.addEventListener('load', function () {
      var rest = [].slice.call(d.querySelectorAll('img[data-srcset]')), n = 0;
      (function weiter() { if (n < rest.length) { lade(rest[n++]); setTimeout(weiter, 60); } })();
    });
  } else offen.forEach(lade);

  /* Bricht ein Bild unterwegs ab (schwache Leitung), lädt es bis zu dreimal von selbst neu */
  function frisch(t, k) {
    return t.split(',').map(function (teil) {
      var p = teil.trim().split(/\s+/);
      if (p[0]) p[0] = p[0].replace(/([?&])n=\d+/, '') + (p[0].indexOf('?') < 0 ? '?' : '&') + 'n=' + k;
      return p.join(' ');
    }).join(', ');
  }
  function nochmal(img) {
    var k = +(img.dataset.versuch || 0);
    if (k >= 3) return;
    img.dataset.versuch = k + 1;
    setTimeout(function () {
      var pic = img.closest('picture');
      if (pic) [].forEach.call(pic.querySelectorAll('source[srcset]'), function (s) { s.srcset = frisch(s.getAttribute('srcset'), k + 1); });
      if (img.getAttribute('srcset')) img.srcset = frisch(img.getAttribute('srcset'), k + 1);
      if (img.getAttribute('src')) img.src = frisch(img.getAttribute('src'), k + 1);
    }, 700 * (k + 1));
  }
  d.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') nochmal(e.target); }, true);
  w.addEventListener('load', function () {
    [].forEach.call(d.images, function (img) { if (img.complete && !img.naturalWidth && (img.getAttribute('src') || img.getAttribute('srcset')) && img.decode) img.decode().catch(function () { nochmal(img); }); });
  });

  /* Überschriften in Zeilen nach dem echten Umbruch zerlegen, damit jede Zeile aus ihrem Schlitz steigt */
  function zeilen(h) {
    if (h.dataset.zt == null) h.dataset.zt = h.innerHTML;
    h.innerHTML = h.dataset.zt;
    var teile = [];
    (function lauf(knoten, huelle) {
      [].slice.call(knoten.childNodes).forEach(function (k) {
        if (k.nodeType === 3) {
          k.textContent.split(/(\s+)/).forEach(function (t) { if (t) teile.push({ t: t, h: huelle }); });
        } else if (k.nodeName === 'BR') teile.push({ br: 1 });
        else lauf(k, k.cloneNode(false));
      });
    })(h, null);
    h.innerHTML = '';
    var spans = teile.map(function (o) {
      if (o.br) { var b = d.createElement('br'); h.appendChild(b); return { br: b }; }
      var s = d.createElement('span'); s.textContent = o.t;
      if (o.h) { var hh = o.h.cloneNode(false); hh.appendChild(s); h.appendChild(hh); return { el: hh, ws: /^\s+$/.test(o.t) }; }
      h.appendChild(s); return { el: s, ws: /^\s+$/.test(o.t) };
    });
    var reihen = [], top = null, akt = null;
    spans.forEach(function (o) {
      if (o.br) { top = null; return; }
      var y = o.el.offsetTop;
      if (top === null || Math.abs(y - top) > 4) { akt = []; reihen.push(akt); top = y; }
      akt.push(o);
    });
    h.innerHTML = '';
    reihen.forEach(function (r, j) {
      var zl = d.createElement('span'); zl.className = 'zl';
      var inn = d.createElement('span'); inn.style.setProperty('--j', j);
      while (r.length && r[r.length - 1].ws) r.pop();
      while (r.length && r[0].ws) r.shift();
      r.forEach(function (o) { inn.appendChild(o.el); });
      zl.appendChild(inn); h.appendChild(zl);
    });
  }
  var titel = [].slice.call(d.querySelectorAll('[data-z]'));
  function alleZeilen() { titel.forEach(function (h) { if (!h.classList.contains('da')) zeilen(h); }); }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(alleZeilen); else alleZeilen();
  var bw = w.innerWidth;
  w.addEventListener('resize', function () { if (Math.abs(w.innerWidth - bw) > 40) { bw = w.innerWidth; titel.forEach(function (h) { var da = h.classList.contains('da'); zeilen(h); if (da) h.classList.add('zf'); }); } });

  /* Auftritte: sobald ein Stück am unteren Rand auftaucht, kommt es nach der Uhr an seinen Platz (nichts wartet, nichts hängt am Scrolltempo) */
  /* Robert 20.10.2026: Zoom bei allen Bildern der Seite. Fotos ohne eigenen Auftritt bekommen ihn hier (nicht im Kopf, im Fenster, im Fuss, in Laufbändern, Dialogen) */
  [].forEach.call(d.querySelectorAll('main .rb'), function (r) {
    if (r.closest('[data-a],.gbl,.wst,.auftakt,.fenster,.fuss__nachtbild,.fuss__vorne,.festband__lauf,dialog,[hidden],[data-kein-auftritt]')) return;
    if (!r.querySelector('img')) return;
    for (var q = r.parentElement; q && q !== d.body; q = q.parentElement) { var ox = getComputedStyle(q).overflowX; if ((ox === 'auto' || ox === 'scroll') && q.scrollWidth > q.clientWidth + 2) return; }
    r.setAttribute('data-a', '');
  });
  var stuecke = [].slice.call(d.querySelectorAll('[data-a]:not(.auftakt [data-a]):not(.wst [data-a]):not(.gbl [data-a]),[data-z]:not(.auftakt [data-z]):not(.wst [data-z]):not(.gbl [data-z]):not(.fenster [data-z]):not(.fuss__nachtbild [data-z])'));
  function zeig(el) { el.classList.add('da'); if (el.dataset.moment && momente[el.dataset.moment]) momente[el.dataset.moment](el); }
  var momente = {};
  w.__schaefli = { momente: momente };
  if ('IntersectionObserver' in w && !leise) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { zeig(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 10% 0px' });
    stuecke.forEach(function (el) { for (var q = el.parentElement; q && q !== d.body; q = q.parentElement) { var ox = getComputedStyle(q).overflowX; if ((ox === 'auto' || ox === 'scroll') && q.scrollWidth > q.clientWidth + 2) { zeig(el); return; } } io.observe(el); });
    /* Prüfung 21.10.2026: Kacheln im Laufband (Kopf «Ihr Abend») starten gemeinsam, sobald das Band im Bild ist.
       Vorher stieg jede Kachel erst hoch, wenn sie seitlich hereinlief, und ragte bis dahin unten aus dem Band. */
    [].forEach.call(d.querySelectorAll('.kp-lauf__band'), function (band) {
      var t = [].slice.call(band.querySelectorAll('[data-a]'));
      if (!t.length) return;
      t.forEach(function (el) { io.unobserve(el); });
      var io3 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { t.forEach(zeig); io3.disconnect(); } }, { rootMargin: '0px 0px 10% 0px' });
      io3.observe(band);
    });
  } else stuecke.forEach(zeig);

  /* Momente, die erst losgehen, wenn ein gutes Stück im Bild ist: Fenster-Satz (ein Drittel frei), Stube ins Fenster */
  var spaet = [].slice.call(d.querySelectorAll('.fenster, .abschied__buehne, .fuss__nachtbild'));
  if ('IntersectionObserver' in w && !leise) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.classList.contains('fenster') || el.classList.contains('fuss__nachtbild')) [].forEach.call(el.querySelectorAll('[data-z]'), function (z) { z.classList.add('da'); });
        else el.classList.add('da');
        io2.unobserve(el);
      });
    }, { threshold: [0.34] });
    spaet.forEach(function (el) { io2.observe(el); });
  } else spaet.forEach(function (el) { el.classList.add('da'); [].forEach.call(el.querySelectorAll('[data-z]'), function (z) { z.classList.add('da'); }); });

  /* Auftakt: die Kamera fährt los, sobald das Foto entpackt ist (höchstens 1,2 s warten) */
  var auftakt = d.querySelector('.auftakt, .wst, .gbl');
  if (auftakt) {
    var bild = auftakt.querySelector('.auftakt__bild img, .wst__f--m img, .gbl__bild img'), gestartet = false;
    [].forEach.call(auftakt.querySelectorAll('img'), lade);
    var los = function () { if (gestartet) return; gestartet = true; requestAnimationFrame(function () { requestAnimationFrame(function () { auftakt.classList.add('los'); [].forEach.call(auftakt.querySelectorAll('.wst [data-a],.wst [data-z],.gbl [data-a],.gbl [data-z]'), function (x) { x.classList.add('da'); }); }); }); };
    if (leise) los();
    else {
      lade(bild);
      if (bild.complete && bild.naturalWidth) (bild.decode ? bild.decode().then(los, los) : los());
      else { bild.addEventListener('load', function () { (bild.decode ? bild.decode().then(los, los) : los()); }); bild.addEventListener('error', los); }
      setTimeout(los, 1200);
    }
  }

  /* Auftakt «Giebel»: Bildausschnitt so legen, dass die Dachspitze (48,4 % / 11,8 % des Fotos) unter dem Lamm der Menüleiste sitzt */
  var gbl = d.querySelector('.gbl');
  if (gbl && !gbl.classList.contains('gbl--himmel')) {
    var gImg = gbl.querySelector('.gbl__bild img'), gNav = gbl.querySelector('.gbl__nav'), GV = 2528 / 1696, SX = .484, SY = .118, ZIEL = 90;
    var giebel = function () {
      var W = gbl.clientWidth, Hh = gbl.clientHeight, iw = Math.max(W, Hh * GV), ih = iw / GV, p = .5;
      if (ih > Hh + 1) p = Math.min(1, Math.max(0, (ZIEL - SY * ih) / (Hh - ih)));
      gImg.style.objectPosition = '50% ' + (p * 100).toFixed(2) + '%';
      gbl.querySelector('.gbl__bild').style.backgroundPosition = '50% ' + (p * 100).toFixed(2) + '%';
      var gy = (Hh - ih) * p + SY * ih, gx = W / 2 + (SX - .5) * iw;
      gNav.style.setProperty('--gx', gx.toFixed(1) + 'px');
      gNav.style.setProperty('--gy', Math.max(8, gy - 61).toFixed(1) + 'px');
    };
    giebel(); w.addEventListener('resize', giebel);
  }

  /* Leiste: weicht beim Hinunterscrollen (spätestens am Ende des Auftakts), kommt beim Hinaufscrollen zurück */
  var leiste = d.querySelector('.leiste'), letzte = w.scrollY, tick = false;
  if (leiste && gbl && w.innerWidth > 1100 && w.scrollY < gbl.offsetHeight * .7) leiste.classList.add('ueber');
  function leisteStand() {
    tick = false;
    var y = w.scrollY, ende = auftakt ? auftakt.offsetHeight * .55 : 120;
    if (gbl) leiste.classList.toggle('ueber', w.innerWidth > 1100 && y < gbl.offsetHeight * .7);
    if (y < 40) leiste.classList.remove('weg');
    else if (y > letzte + 2 && y > Math.min(ende, 260)) leiste.classList.add('weg');
    else if (y < letzte - 2) leiste.classList.remove('weg');
    if (y > (auftakt ? auftakt.offsetHeight : 400) && y > letzte) leiste.classList.add('weg');
    letzte = y;
  }
  if (leiste) w.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(leisteStand); } }, { passive: true });

  /* Menü am Handy */
  var menue = d.querySelector('.menue'), knopf = d.querySelector('.leiste__menue');
  if (menue && knopf) {
    var zu = menue.querySelector('.menue__zu');
    knopf.addEventListener('click', function () { menue.classList.add('offen'); knopf.setAttribute('aria-expanded', 'true'); d.body.style.overflow = 'hidden'; });
    zu.addEventListener('click', function () { menue.classList.remove('offen'); knopf.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; });
  }

  /* Menü: die Strebe liegt genau unter dem Anfang der Gänge, vom ersten bis zum letzten */
  function strebe() {
    [].forEach.call(d.querySelectorAll('.strebe__feld'), function (f) {
      var g0 = f.querySelector('.gaenge:not([hidden])'), li = g0 ? g0.querySelectorAll('li') : [], bk = f.querySelector('.strebe__balken');
      if (!li.length || !bk) return;
      var g = g0, a = li[0], z = li[li.length - 1];
      var xa = g.offsetLeft + a.offsetLeft, ya = g.offsetTop + a.offsetTop, xz = g.offsetLeft + z.offsetLeft, yz = g.offsetTop + z.offsetTop;
      var h = 0; [].forEach.call(li, function (l) { h = Math.max(h, l.offsetHeight); });
      var k = (yz > ya) ? (xz - xa) / (yz - ya) : 0, off = k * h + 16;
      var x1 = xa - off, y1 = ya, x2 = xz - off + k * h, y2 = yz + h;
      var len = Math.hypot(x2 - x1, y2 - y1), wi = Math.atan2(y2 - y1, x2 - x1);
      bk.style.width = len + 'px'; bk.style.transform = 'translate(' + x1 + 'px,' + y1 + 'px) rotate(' + wi + 'rad)';
    });
  }
  strebe(); w.addEventListener('resize', strebe); if (d.fonts && d.fonts.ready) d.fonts.ready.then(strebe);

  /* Goldener Faden (Robert 20.10.2026, Wahl 5): die Linie läuft vom Knopf der Begrüssung genau bis an die Kante der Stube */
  function faden() {
    var fd = d.querySelector('.trp__faden'), ec = d.querySelector('.trp__ec'), ft = d.querySelector('.platte__foto');
    if (!fd || !ec || !ft) return;
    function oben(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    var h = oben(ft) - (oben(ec) + ec.offsetHeight + 18);
    fd.style.height = Math.max(0, h) + 'px';
  }
  faden(); w.addEventListener('resize', faden); w.addEventListener('load', faden); if (d.fonts && d.fonts.ready) d.fonts.ready.then(faden);

  /* Feiern: die Tafel wird ausgezogen. Aussen wird der Rahmen breiter, innen hält ein Gegenmassstab das Bild unverzerrt;
     dichte Stützpunkte, damit beide Bewegungen auf dem Compositor genau zusammenpassen */
  momente.ausziehen = function (el) {
    var a = el.querySelector('.tafel__aussen'), i = el.querySelector('.tafel__innen');
    var s0 = parseFloat(getComputedStyle(el).getPropertyValue('--ts')) || .44;
    if (leise || !a.animate) { el.classList.add('fertig'); return; }
    var ka = [], ki = [], n = 40;
    for (var k = 0; k <= n; k++) {
      var t = k / n, e = 1 - Math.pow(1 - t, 3.2), sx = s0 + (1 - s0) * e;
      ka.push({ transform: 'scaleX(' + sx.toFixed(5) + ')', offset: t });
      ki.push({ transform: 'scaleX(' + (1 / sx).toFixed(5) + ')', offset: t });
    }
    var o = { duration: 1500, delay: 250, easing: 'linear', fill: 'both' };
    a.animate(ka, o); var an = i.animate(ki, o);
    an.onfinish = function () { el.classList.add('fertig'); };
  };
  [].forEach.call(d.querySelectorAll('[data-zahl]'), function (z) { if (!leise && z.dataset.von) z.textContent = z.dataset.von; });

  /* Fenster für Anfragen: öffnen, schliessen, Demo-Absenden (in der Studie wird nichts verschickt) */
  [].forEach.call(d.querySelectorAll('[data-oeffne]'), function (k) {
    k.addEventListener('click', function () { var dl = d.getElementById(k.dataset.oeffne); if (dl && dl.showModal) dl.showModal(); });
  });
  [].forEach.call(d.querySelectorAll('dialog.fenster-dialog:not(.wein-dialog)'), function (dl) {
    dl.querySelector('.fd__zu').addEventListener('click', function () { dl.close(); });
    dl.addEventListener('click', function (ev) { if (ev.target === dl) dl.close(); });
    var f = dl.querySelector('form'); if (!f) return;
    f.addEventListener('submit', function (ev) { ev.preventDefault(); f.querySelector('.fd__danke').hidden = false; });
  });

  /* Karte: Deutsch oder Englisch, nur der Inhalt wird getauscht, die Höhe bleibt */
  [].forEach.call(d.querySelectorAll('.sprachwahl'), function (sw) {
    sw.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var y = w.scrollY;
      [].forEach.call(sw.querySelectorAll('button'), function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      [].forEach.call(d.querySelectorAll('[data-sprache-inhalt]'), function (el) { el.hidden = el.dataset.spracheInhalt !== b.dataset.sprache; el.classList.add('da'); [].forEach.call(el.querySelectorAll('[data-a]'), function (x) { x.classList.add('da'); }); });
      strebe(); w.scrollTo(0, y);
    });
  });

  /* Weinkarte: Reiter je Weinart und Suche über alle; die Fläche schrumpft nicht unter ihre Höhe */
  var wk = d.querySelector('.wk-tafeln');
  if (wk) {
    var tafeln = [].slice.call(wk.querySelectorAll('.wk-tafel')), reiter = [].slice.call(d.querySelectorAll('.wk-reiter button')), suche = d.querySelector('.wk-suche input'), leer = wk.querySelector('.wk-leer');
    var zeige = function (n) {
      var y = w.scrollY; wk.style.minHeight = wk.offsetHeight + 'px';
      reiter.forEach(function (r) { r.setAttribute('aria-selected', r.dataset.art === n ? 'true' : 'false'); });
      tafeln.forEach(function (t) { t.hidden = t.dataset.art !== n; });
      w.scrollTo(0, y);
    };
    reiter.forEach(function (r) { r.addEventListener('click', function () { if (suche) suche.value = ''; [].forEach.call(wk.querySelectorAll('.wk-pos'), function (p) { p.hidden = false; }); leer.hidden = true; zeige(r.dataset.art); }); });
    if (suche) suche.addEventListener('input', function () {
      var q = suche.value.trim().toLowerCase(), treffer = 0;
      if (!q) { leer.hidden = true; [].forEach.call(wk.querySelectorAll('.wk-pos'), function (p) { p.hidden = false; }); var akt = reiter.filter(function (r) { return r.getAttribute('aria-selected') === 'true'; })[0]; zeige(akt ? akt.dataset.art : '0'); return; }
      tafeln.forEach(function (t) { t.hidden = false; });
      [].forEach.call(wk.querySelectorAll('.wk-pos'), function (p) { var ja = p.dataset.such.indexOf(q) > -1; p.hidden = !ja; if (ja) treffer++; });
      leer.hidden = treffer > 0;
    });
  }

  /* Zahlen zählen einmal hoch, wenn ihr Abschnitt erscheint */
  momente.zaehlen = function (el) {
    [].forEach.call(el.querySelectorAll('[data-zahl]'), function (z) {
      var von = +z.dataset.von || 0, bis = +z.dataset.zahl, t0 = null, dauer = +z.dataset.dauer || 1400;
      if (leise) { z.textContent = bis; return; }
      (function schritt(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3);
        z.textContent = Math.round(von + (bis - von) * e);
        if (p < 1) requestAnimationFrame(schritt);
      })(performance.now());
    });
  };
  /* Degustation: sechs, fünf oder vier Gänge (Robert 20.10.2026: nichts durchstreichen, das Menü baut sich neu auf, wie es dann ist).
     Die Liste blendet kurz aus, zeigt nur die Gänge des gewählten Umfangs und steigt Gang für Gang wieder auf; Preis und Kopf folgen. */
  [].forEach.call(d.querySelectorAll('.deg__karte'), function (k) {
    var preise = k.dataset.preise.split('|'), texte = k.dataset.umfangText.split('|'), trenner = k.dataset.ohne || ' ohne ';
    var ol = k.querySelector('.deg__gaenge'), li = [].slice.call(ol.querySelectorAll('li')), knoepfe = [].slice.call(k.querySelectorAll('[data-umfang]'));
    var pr = k.querySelector('[data-deg-preis]'), um = k.querySelector('[data-deg-umfang]'), kopf = k.querySelector('.deg__kopf'), aktiv = 0, uhr;
    var en = /^Six courses/.test(kopf.textContent), zahl = en ? ['Six courses', 'Five courses', 'Four courses'] : ['Sechs Gänge', 'Fünf Gänge', 'Vier Gänge'];
    var kopfRest = kopf.textContent.replace(/^[^·]*·\s*/, '');
    function baue(i) {
      var ohne = ((texte[i].split(trenner)[1]) || '').split(/\s*&\s*/).filter(Boolean), n = 0;
      li.forEach(function (l) {
        var g = l.dataset.gang.toLowerCase(), weg = ohne.some(function (o) { return g.indexOf(o.toLowerCase()) > -1; });
        l.classList.toggle('aus', weg); if (!weg) l.style.setProperty('--n', n++);
      });
      pr.textContent = preise[i]; um.textContent = texte[i].split(trenner)[0] + ' · ' + (k.dataset.einheit || 'Franken je Person');
      kopf.textContent = zahl[i] + ' · ' + kopfRest;
    }
    function setze(i) {
      if (i === aktiv) return; aktiv = i;
      knoepfe.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      if (leise) { baue(i); return; }
      clearTimeout(uhr); ol.classList.remove('auf'); k.classList.add('zu');
      uhr = setTimeout(function () { baue(i); void ol.offsetWidth; k.classList.remove('zu'); ol.classList.add('auf'); }, 320);
    }
    baue(0);
    knoepfe.forEach(function (b, i) { b.addEventListener('click', function () { setze(i); }); });
  });

  /* Rundgang: ein Klick auf ein kleines Bild holt es gross nach vorn, das grosse geht an seinen Platz */
  [].forEach.call(d.querySelectorAll('.rund'), function (r) {
    var gross = r.querySelector('.rund__gross'), zeile = r.querySelector('.rund__buehne figcaption');
    [].forEach.call(r.querySelectorAll('.rund__k'), function (k) {
      k.addEventListener('click', function () {
        var a = gross.querySelector('img'), b = k.querySelector('img');
        lade(a); lade(b);
        var tausch = ['src', 'srcset', 'alt'];
        var alt = {}; tausch.forEach(function (t) { alt[t] = a.getAttribute(t); });
        tausch.forEach(function (t) { var v = b.getAttribute(t); if (v != null) a.setAttribute(t, v); });
        tausch.forEach(function (t) { if (alt[t] != null) b.setAttribute(t, alt[t]); });
        var ga = gross.style.backgroundImage; gross.style.backgroundImage = k.querySelector('.rb').style.backgroundImage; k.querySelector('.rb').style.backgroundImage = ga;
        var tx = k.dataset.text; k.dataset.text = zeile.textContent; zeile.textContent = tx;
        k.setAttribute('aria-label', k.dataset.text + ' zeigen');
        gross.classList.remove('neu'); void gross.offsetWidth; if (!leise) gross.classList.add('neu');
      });
    });
  });

  /* Feiern: Gäste schieben, die Tafel wird breiter (aussen scaleX, innen der Gegenmassstab), der Richtwert rechnet Gäste mal Menü */
  [].forEach.call(d.querySelectorAll('[data-tafel]'), function (p) {
    var sek = p.closest('section'), r = sek.querySelector('.tw2__rahmen'), i = sek.querySelector('.tw2__innen');
    var ein = p.querySelector('input[type=range]'), zg = p.querySelector('[data-tw-gaeste]'), su = p.querySelector('[data-tw-summe]');
    var wahl = [].slice.call(p.querySelectorAll('[data-tm]')), preis = +wahl[0].dataset.preis;
    var lo = +ein.min, hi = +ein.max;
    function chf(n) { return 'CHF ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.'; }
    function rechne() {
      var g = +ein.value, s = .84 + .16 * (g - lo) / (hi - lo);
      r.style.transform = 'scaleX(' + s.toFixed(4) + ')'; i.style.transform = 'scaleX(' + (1 / s).toFixed(4) + ')';
      zg.textContent = g; su.textContent = chf(g * preis);
    }
    ein.addEventListener('input', rechne);
    wahl.forEach(function (b) { b.addEventListener('click', function () { preis = +b.dataset.preis; wahl.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); rechne(); }); });
    r.style.transition = i.style.transition = leise ? 'none' : 'transform .7s cubic-bezier(.22,1,.36,1)';
    rechne();
  });
  /* Feiern «Der Tischläufer»: Gäste mal Menü gleich Richtwert */
  [].forEach.call(d.querySelectorAll('[data-laeufer]'), function (p) {
    var ein = p.querySelector('input[type=range]'), zg = p.querySelector('[data-tl-gaeste]'), su = p.querySelector('[data-tl-summe]');
    var wahl = [].slice.call(p.querySelectorAll('[data-tm]')), preis = +wahl[0].dataset.preis;
    function chf(n) { return 'CHF ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.'; }
    function rechne() { zg.textContent = ein.value; su.textContent = chf(+ein.value * preis); }
    ein.addEventListener('input', rechne);
    wahl.forEach(function (b) { b.addEventListener('click', function () { preis = +b.dataset.preis; wahl.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); rechne(); }); });
    rechne();
  });
  /* Menü nach Mass (Feiern): Gänge an- und abwählen, mindestens vier; Preis = Summe der Gangpreise der Karte, mal Gäste */
  [].forEach.call(d.querySelectorAll('div[data-mm]'), function (mm) {
    var reiter = [].slice.call(mm.querySelectorAll('[data-mm]')).filter(function (b) { return b.tagName === 'BUTTON'; });
    var felder = [].slice.call(mm.querySelectorAll('[data-mm-feld]')), akt = 0;
    var ein = mm.querySelector('input[type=range]');
    function chf(n) { return 'CHF ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.-'; }
    function rechne() {
      var f = felder[akt], an = [].slice.call(f.querySelectorAll('input[type=checkbox]:checked'));
      var zus = [].slice.call(mm.querySelectorAll('[data-zusatz]:checked'));
      var n = an.length + zus.length, p = an.concat(zus).reduce(function (a, x) { return a + +x.dataset.preis; }, 0);
      [].forEach.call(f.querySelectorAll('input[type=checkbox]'), function (x) { x.disabled = x.checked && an.length + zus.length <= 4; });
      [].forEach.call(mm.querySelectorAll('[data-zusatz]'), function (x) { x.disabled = x.checked && n <= 4; });
      mm.querySelector('[data-mm-gaenge]').textContent = n;
      mm.querySelector('[data-mm-preis]').textContent = chf(p);
      mm.querySelector('[data-mm-gaeste]').textContent = ein.value;
      mm.querySelector('[data-mm-total]').textContent = chf(p * +ein.value);
    }
    reiter.forEach(function (b, i) {
      b.addEventListener('click', function () {
        akt = i; reiter.forEach(function (x, j) { x.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
        felder.forEach(function (x, j) { x.hidden = j !== i; }); rechne();
      });
    });
    mm.addEventListener('change', rechne);
    ein.addEventListener('input', rechne);
    [].forEach.call(mm.querySelectorAll('[data-dessert]'), function (b) {
      b.addEventListener('click', function () {
        [].forEach.call(b.parentNode.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var li = b.closest('.mm__dessert'), cb = li.querySelector('[data-ist-dessert]');
        cb.dataset.preis = b.dataset.dessert; li.querySelector('[data-dessert-preis]').textContent = b.dataset.dessert + '.-'; rechne();
      });
    });
    rechne();
  });
})();

/* Laufband Kitchen Party: läuft nur, solange der Abschnitt im Blick ist; die Bilder der Spur laden gemeinsam, bevor er kommt */
(function () {
  var d = document, f = d.querySelector('.festband');
  if (!f || !('IntersectionObserver' in window)) return;
  f.classList.add('still');
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      f.classList.toggle('still', !e.isIntersecting);
      if (e.isIntersecting) [].forEach.call(f.querySelectorAll('img[data-srcset]'), function (img) { img.sizes = img.dataset.sizes || '30vw'; img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); });
    });
  }, { rootMargin: '150px 0px' }).observe(f);
})();

/* Zwei Häuser «Zwei Karten»: sobald die Karten in den Blick kommen, schweben sie von unten herein (.da, die zweite etwas später);
   ist der Auftritt fertig, pulsieren sie im Wechsel, nur solange sie im Blick sind */
(function () {
  var w = window, b = document.querySelector('[data-boden]');
  if (!b) return;
  var karten = [].slice.call(b.querySelectorAll('.zk__karte')), still = w.matchMedia('(prefers-reduced-motion: reduce)').matches, fertig = false;
  function zeig() {
    karten.forEach(function (k) { k.classList.add('da'); });
    if (!fertig) setTimeout(function () { fertig = true; puls(true); }, still ? 0 : 1900);
  }
  function puls(an) { if (!still) karten.forEach(function (k) { k.classList.toggle('puls', an && fertig); }); }
  if (!('IntersectionObserver' in w)) { zeig(); return; }
  new IntersectionObserver(function (es) {
    var an = es[0].isIntersecting;
    if (an) zeig();
    puls(an);
  }, { rootMargin: '0px 0px -12% 0px' }).observe(b);
})();

/* Kontakt (Robert 20.10.2026): Pfeile am Band «Fragen und Antworten» */
(function () {
  var b = document.querySelector('.kon-frage__band');
  if (!b) return;
  [].forEach.call(document.querySelectorAll('.kon-frage__pf button'), function (x) {
    x.addEventListener('click', function () { var k = b.querySelector('.kon-frage__k'); b.scrollBy({ left: (+x.dataset.r) * (k.offsetWidth + 20), behavior: 'smooth' }); });
  });
})();

/* Klassiker-Karten kippen beim Überfahren zur Maus, Licht wandert mit (wie die Vorlagen im Druckcenter, Robert 20.10.2026) */
(function () {
  var liste = document.querySelector('.kl5__liste'); if (!liste || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var akt = null, raf = 0, xy = null;
  function loese(k) { k.classList.remove('kipp'); ['--rx', '--ry', '--gx', '--gy'].forEach(function (v) { k.style.removeProperty(v); }); }
  liste.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return; xy = e; if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0; var k = xy.target.closest('.kl5__g');
      if (akt && akt !== k) loese(akt); akt = k; if (!k) return;
      var r = k.getBoundingClientRect(), x = (xy.clientX - r.left) / r.width - .5, y = (xy.clientY - r.top) / r.height - .5;
      k.classList.add('kipp');
      k.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); k.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      k.style.setProperty('--gx', (x * 70).toFixed(1) + '%'); k.style.setProperty('--gy', (y * 70).toFixed(1) + '%');
    });
  });
  liste.addEventListener('pointerleave', function () { if (akt) loese(akt); akt = null; });
})();

/* Bar: Laufband (20.10.2026) – läuft nur, solange es im Bild ist (Regel 55: was nicht sichtbar ist, rechnet nicht) */
(function () {
  var b = document.querySelectorAll('.barband[data-laufband]');
  if (!b.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('laeuft', e.isIntersecting); }); }, { rootMargin: '80px 0px' });
  [].forEach.call(b, function (x) { io.observe(x); });
})();

/* Feiern · Menü nach Mass: Karte so hoch wie das längste Menü, damit beim Wechsel nichts springt (Robert 20.10.2026 23:30) */
(function () {
  var karte = document.querySelector('.mx7 .mm__karte'); if (!karte) return;
  var felder = [].slice.call(karte.querySelectorAll('[data-mm-feld]'));
  function miss() {
    karte.style.minHeight = '';
    var an = felder.map(function (f) { return f.hidden; }), max = 0;
    felder.forEach(function (f, i) { felder.forEach(function (g, j) { g.hidden = j !== i; }); max = Math.max(max, karte.offsetHeight); });
    felder.forEach(function (f, i) { f.hidden = an[i]; });
    karte.style.minHeight = max + 'px';
  }
  miss(); var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(miss, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(miss);
})();

/* Robert 21.10.2026 (Weinseite: «Zoom-Effekte und Schwebe-Reinflug-Effekte viel zu schwach»): Teile, die erst nach dem Laden gebaut werden
   (Wein zum Menü, die ganze Karte), bekamen keinen Auftritt. Was unterhalb des Bildschirms neu entsteht, schwebt und zoomt jetzt wie der Rest;
   was beim Bedienen im Blick neu gebaut wird, steht sofort (nichts springt beim Umschalten). */
(function (d, w) {
  var main = d.querySelector('main');
  if (!main || !('IntersectionObserver' in w) || !('MutationObserver' in w)) return;
  if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.pl7-gang > *, .gk__gut, .gk__land, .gk__art, .pl-k5__liste > *, .kb-treffer > *';
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px 45% 0px' });
  function nimm(el, i) {
    if (el.hasAttribute('data-a') || el.closest('.auftakt,.wst,.gbl,.fenster,dialog,[data-kein-auftritt]')) return;
    var r = el.getBoundingClientRect();
    if (r.top < innerHeight * 1.05) return;               // schon im Blick: steht sofort
    el.setAttribute('data-a', ''); if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 3);
    io.observe(el);
  }
  var offen = false;
  function lauf() { offen = false; [].forEach.call(main.querySelectorAll(SEL), nimm); }
  new MutationObserver(function () { if (!offen) { offen = true; requestAnimationFrame(lauf); } }).observe(main, { childList: true, subtree: true });
  lauf();
})(document, window);

/* Auftakt: Sprachknopf klappt die Sprachen auf und wieder zu (Klick ausserhalb oder Escape schliesst) */
(function () {
  var k = document.querySelector('.gbl__sprache'); if (!k) return;
  var b = k.querySelector('button'), l = k.querySelector('ul');
  function zu() { l.hidden = true; b.setAttribute('aria-expanded', 'false'); }
  b.addEventListener('click', function (e) { e.stopPropagation(); var auf = l.hidden; l.hidden = !auf; b.setAttribute('aria-expanded', auf ? 'true' : 'false'); });
  document.addEventListener('click', function (e) { if (!k.contains(e.target)) zu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
})();
