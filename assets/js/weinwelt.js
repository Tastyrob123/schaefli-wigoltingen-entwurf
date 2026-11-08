/* Taverne zum Schäfli · Weinkarte «Der Keller»: zwei Arten zu lesen, Suche, Berater nach Geschmack und die Welt eines Weins.
   Daten: assets/daten/wein.json (Wortlaut der Karte) und assets/daten/wein-welt.json (Belegtes je Wein). Nichts wird verschickt. */
(function () {
  'use strict';
  var d = document, w = window;
  var leise = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCHLUESSEL = 'schaefli-abend';
  function lies() { try { return JSON.parse(sessionStorage.getItem(SCHLUESSEL)) || { weine: [] }; } catch (e) { return { weine: [] }; } }
  function schreib(s) { try { sessionStorage.setItem(SCHLUESSEL, JSON.stringify(s)); } catch (e) {} var c = d.querySelector('.abend-chip'), z = d.querySelector('[data-chip-zahl]'); if (c && z) { z.textContent = s.weine.length; c.hidden = !s.weine.length; } }
  function chf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.'; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }

  var WEINE = null, WELT = null, warte = [];
  function daten(cb) {
    if (WEINE) return cb();
    warte.push(cb); if (warte.length > 1) return;
    Promise.all([fetch('assets/daten/wein.json').then(function (r) { return r.json(); }), fetch('assets/daten/wein-welt.json').then(function (r) { return r.json(); })])
      .then(function (a) { WEINE = a[0]; WELT = a[1]; warte.forEach(function (f) { f(); }); warte = []; })
      .catch(function () { warte = []; });   // abgebrochenes Laden (Seite verlassen, Leitung weg): still, der nächste Aufruf lädt neu
  }
  function kurz(v) { return v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[1] : v.name; }
  function haus(v) {
    var g = (WELT.w[v.id] || {}).g; if (g) return g;
    if (v.erzeuger) return v.erzeuger.toLowerCase().replace(/(^|[\s\-&])([a-zäöüéèâ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    return v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[0] : '';
  }

  /* Umschalter: wie auf der Karte oder nach Geschmack */
  var schalter = d.querySelector('.kb-schalter');
  function ansichtWahl(a, rollen) {
    if (!schalter) return;
    schalter.dataset.stand = a;
    $$('[data-ansicht]', schalter).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.ansicht === a ? 'true' : 'false'); });
    $$('[data-ansicht-teil]').forEach(function (s) { s.hidden = s.dataset.ansichtTeil !== a; });
    if (a === 'geschmack') zeichne();
    if (rollen) d.getElementById('lesen').scrollIntoView({ behavior: leise ? 'auto' : 'smooth' });
  }
  if (schalter) $$('[data-ansicht]', schalter).forEach(function (b) { b.addEventListener('click', function () { ansichtWahl(b.dataset.ansicht); }); });

  /* Gefache im Kopf: ein Land öffnet den Berater mit dieser Herkunft */
  $$('.kb-gefach').forEach(function (g) {
    g.addEventListener('click', function () {
      if (!d.querySelector('.kb-pult')) {  // ohne Geschmacksangaben: das Land in der Karte suchen
        if (such) { such.value = g.dataset.land.toLowerCase(); filtern(); }
        d.getElementById('karte').scrollIntoView({ behavior: leise ? 'auto' : 'smooth' }); return;
      }
      $$('.kb-pult [aria-pressed="true"]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      var b = d.querySelector('.kb-pult [data-g="land"][data-wert="' + g.dataset.land + '"]'); if (b) b.setAttribute('aria-pressed', 'true');
      zeigen = 18; ansichtWahl('geschmack', true);
    });
  });

  /* Reiter und Suche (wie auf der Karte) */
  var reiter = $$('.kb-reiter [data-art]'), tafeln = $$('.kb-tafel'), such = d.querySelector('.kb-suche input'), leer = d.querySelector('.kb-leer'), art = 0;
  function zeigeArt(n) {
    art = n;
    reiter.forEach(function (b, i) { b.setAttribute('aria-selected', i === n ? 'true' : 'false'); });
    filtern();
  }
  function filtern() {
    var q = (such && such.value || '').trim().toLowerCase(), treffer = 0;
    var box = d.querySelector('.kb-tafeln'), h = box ? box.offsetHeight : 0; if (box) box.style.minHeight = h + 'px';
    tafeln.forEach(function (t, i) {
      var sichtbar = q ? true : i === art;
      t.hidden = !sichtbar;
      if (!sichtbar) return;
      $$('[data-such]', t).forEach(function (p) { var ok = !q || p.dataset.such.indexOf(q) > -1; p.hidden = !ok; if (ok) treffer++; });
      $$('.kb-gut', t).forEach(function (g) { g.hidden = !g.querySelector('[data-such]:not([hidden])'); });
      $$('.kb-regal, .kb-liste', t).forEach(function (g) { g.hidden = !g.querySelector('[data-such]:not([hidden])'); });
      // Land- und Regionsköpfe nur, wenn darunter etwas steht
      var kinder = [].slice.call(t.children);
      kinder.forEach(function (k, j) {
        if (!k.classList.contains('kb-land') && !k.classList.contains('kb-region')) return;
        var stufe = k.classList.contains('kb-land') ? 0 : 1, da = false;
        for (var m = j + 1; m < kinder.length; m++) {
          var n = kinder[m];
          if (n.classList.contains('kb-land') || (stufe === 1 && n.classList.contains('kb-region'))) break;
          if (n.classList.contains('kb-gut') && !n.hidden) { da = true; break; }
        }
        k.hidden = !da;
      });
    });
    if (leer) leer.hidden = treffer > 0;
    requestAnimationFrame(function () { if (box) box.style.minHeight = ''; });
  }
  reiter.forEach(function (b, i) { b.addEventListener('click', function () { if (such) such.value = ''; zeigeArt(i); }); });
  if (such) such.addEventListener('input', filtern);
  d.addEventListener('click', function (ev) { var p = ev.target.closest('.kb-fl[data-w], .kb-z[data-w], .kb-tk[data-w]'); if (p) oeffne(+p.dataset.w); });

  /* Nach Geschmack */
  var pult = d.querySelector('.kb-pult'), liste = d.querySelector('[data-kb-liste]'), zahl = d.querySelector('[data-kb-zahl]'), mehr = d.querySelector('[data-kb-mehr]'), zeigen = 18;
  function gewaehlt(g) { return $$('[data-g="' + g + '"][aria-pressed="true"]', pult).map(function (b) { return b.dataset.wert; }); }
  function stufe(k) { return k < 2.8 ? 'leicht' : k <= 3.8 ? 'mittel' : 'kraeftig'; }
  function kachel(v) {
    var x = WELT.w[v.id] || {};
    var t = '<span class="kb-fl__t"><span class="mono">' + esc(v.jahr || 'ohne Jahrgang') + '</span><b>' + esc(kurz(v)) + '</b><span class="mono">' + esc(haus(v)) + '</span><span class="mono">' + esc(v.groesse) + ' · ' + chf(v.preis) + '</span></span>';
    if (x.f) return '<button type="button" class="kb-fl" data-w="' + v.id + '"><span class="kb-fl__b"><img src="' + x.f.replace('.webp', '-s.webp') + '" alt="" loading="lazy" decoding="async"></span>' + t + '</button>';
    return '<button type="button" class="kb-tk" data-w="' + v.id + '"><span class="kb-tk__karte"><span>' + esc(kurz(v)) + '</span></span>' + t + '</button>';
  }
  function zeichne() {
    if (!pult) return;
    daten(function () {
      var A = gewaehlt('art'), K = gewaehlt('koerper'), S = gewaehlt('saeure'), R = gewaehlt('aroma'), E = gewaehlt('speise'), L = gewaehlt('land'), P = gewaehlt('preis');
      var t = WEINE.filter(function (v) {
        var x = WELT.w[v.id] || {}, s = x.s || {};
        if (A.length && A.indexOf(v.art) < 0) return false;
        if (L.length && L.indexOf(v.land) < 0) return false;
        if (P.length && !P.some(function (p) { var a = p.split('-'); return v.preis >= +a[0] && v.preis <= +a[1]; })) return false;
        if (K.length && !(s.k && K.indexOf(stufe(s.k)) > -1)) return false;
        if (S.length && !(s.sa && S.some(function (q) { return q === 'mild' ? s.sa <= 3 : s.sa >= 3.6; }))) return false;
        if (R.length && !(x.a && x.a.some(function (a) { return R.indexOf(a[0]) > -1; }))) return false;
        if (E.length && !(x.sp && x.sp.some(function (f) { return E.indexOf(f) > -1; }))) return false;
        return true;
      }).sort(function (a, b) { var fa = (WELT.w[a.id] || {}).f ? 0 : 1, fb = (WELT.w[b.id] || {}).f ? 0 : 1; return fa - fb || a.preis - b.preis; });
      zahl.textContent = t.length;
      var h = liste.offsetHeight; liste.style.minHeight = h + 'px';
      liste.innerHTML = t.slice(0, zeigen).map(kachel).join('') || '<p class="kb-leer">Diese Auswahl führt die Karte nicht. Lösen Sie eine Wahl, dann erscheinen wieder Weine.</p>';
      mehr.parentNode.hidden = t.length <= zeigen;
      requestAnimationFrame(function () { liste.style.minHeight = ''; });
    });
  }
  if (pult) {
    pult.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-kb-leeren')) $$('[aria-pressed="true"]', pult).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      else if (b.dataset.g) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      zeigen = 18; zeichne();
    });
    mehr.addEventListener('click', function () { zeigen += 18; zeichne(); });
  }

  /* Die Welt eines Weins */
  var dlg = d.getElementById('wein-welt'), aktuell = null;
  function f(k) { return dlg.querySelector('[data-kbw="' + k + '"]'); }
  function teil(k, an) { dlg.querySelector('[data-kbw-teil="' + k + '"]').hidden = !an; }
  var SKALA = [['k', 'Körper', 'leicht', 'voll'], ['t', 'Tannin', 'weich', 'kräftig'], ['su', 'Süsse', 'trocken', 'süss'], ['sa', 'Säure', 'mild', 'frisch'], ['p', 'Perlage', 'zart', 'kräftig']];
  function oeffne(id) {
    if (!dlg) return;
    daten(function () {
      var v = WEINE[id]; if (!v) return; aktuell = v;
      var x = WELT.w[id] || {}, bild = WELT.bild || {};
      var bu = dlg.querySelector('.kbw__bühne');
      f('land').src = x.r || ''; f('land').hidden = !x.r;
      f('flasche').src = x.f || ''; f('flasche').alt = x.f ? 'Flasche ' + kurz(v) : '';
      bu.classList.toggle('ohne', !x.f);
      var FL = {}; try { FL = JSON.parse(d.getElementById('kb-flaggen').textContent); } catch (e) {}
      f('art').innerHTML = (FL[v.land] || '') + esc([v.art, v.land, v.region ? v.region.toLowerCase().replace(/(^|[\s\-–\/.(])([a-zäöüéèâ])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/ (De|Du|Del|Des) /g, function (m) { return m.toLowerCase(); }).replace('Mclaren', 'McLaren') : ''].filter(Boolean).join(' · '));
      f('name').textContent = kurz(v);
      f('gut').textContent = haus(v);
      var dl = [['Jahrgang', v.jahr || 'ohne Jahrgang'], ['Flasche', v.groesse], ['Preis', 'CHF ' + chf(v.preis)]];
      if (x.rb && x.rb.length) dl.push(['Reben', x.rb.join(', ')]);
      if (x.al) dl.push(['Alkohol', String(x.al).replace('.', ',') + ' %']);
      if (x.vs) dl.push(['Verschluss', x.vs]);
      if (v.zusatz) dl.push(['Auf der Karte', v.zusatz]);
      f('daten').innerHTML = dl.map(function (z) { return '<div><dt class="mono">' + esc(z[0]) + '</dt><dd>' + esc(z[1]) + '</dd></div>'; }).join('');
      var s = x.s || {};
      f('skalen').innerHTML = SKALA.filter(function (q) { return s[q[0]]; }).map(function (q) {
        var p = Math.max(11, Math.min(89, (s[q[0]] - 1) / 4 * 100));
        return '<div class="kbw__sk"><span>' + q[2] + '</span><i role="img" aria-label="' + q[1] + ' ' + String(s[q[0]]).replace('.', ',') + ' von 5"><b style="left:' + p + '%"></b></i><span>' + q[3] + '</span></div>';
      }).join('');
      teil('glas', !!x.s);
      f('duft').innerHTML = (x.a || []).map(function (a) {
        var src = (bild.gruppe || {})[a[0]];
        return '<span class="kbw__bild">' + (src ? '<img src="' + src + '" alt="" loading="lazy">' : '') + esc(WELT.gruppen[a[0]] || a[0]) + '<small>' + esc(a[2].join(', ')) + '</small></span>';
      }).join('');
      teil('duft', !!(x.a && x.a.length));
      f('essen').innerHTML = (x.sp || []).map(function (sp) { var src = (bild.speise || {})[sp]; return '<span class="kbw__bild">' + (src ? '<img src="' + src + '" alt="" loading="lazy">' : '') + esc(sp.replace(/ß/g, 'ss')) + '</span>'; }).join('');
      teil('essen', !!(x.sp && x.sp.length));
      var hk = x.hk ? WELT.hk[x.hk] : (WELT.land || {})[v.land];
      f('herkunft').textContent = hk || ''; teil('herkunft', !!hk);
      var g = x.g ? WELT.g[x.g] : null;
      f('logo').innerHTML = g && g.l ? '<img src="' + g.l + '" alt="' + esc(x.g) + '">' : '';
      f('weingut').innerHTML = g && g.t ? esc(g.t) + ' <a class="mono" href="' + esc(g.q) + '" target="_blank" rel="noopener">Quelle</a>' : '';
      teil('weingut', !!(g && g.t));
      // Vom selben Weingut: die anderen Flaschen dieses Hauses (nur mit Foto), ein Klick öffnet ihre Welt
      var hs = haus(v), gs = WEINE.filter(function (y) { return y.id !== v.id && haus(y) === hs && (WELT.w[y.id] || {}).f; }).slice(0, 8);
      f('geschwister').innerHTML = gs.map(function (y) { var yx = WELT.w[y.id]; return '<button type="button" class="kb-mini" data-w="' + y.id + '"><img src="' + yx.f.replace('.webp', '-s.webp') + '" alt="" loading="lazy"><span class="mono">' + esc(y.jahr || '') + '</span><b>' + esc(kurz(y)) + '</b></button>'; }).join('');
      teil('geschwister', gs.length > 0);
      f('still').hidden = !!x.s;
      f('quelle').textContent = (x.f || x.s ? 'Flaschenfoto und Geschmack: Vivino · ' : '') + (x.r ? 'Landschaft: ' + (x.r.indexOf('/r-ch-') > -1 ? 'Wikimedia Commons' : 'Vivino') + ' · ' : '') + 'nur zur Anschauung';
      $$('[data-behandlung]', dlg).forEach(function (b, i) { b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
      dlg.querySelector('.kbw__gelegt').hidden = !lies().weine.some(function (y) { return y.id === v.id; });
      if (dlg.showModal && !dlg.open) dlg.showModal();
      dlg.scrollTop = 0;
      if (history.replaceState) history.replaceState(null, '', '#wein-' + v.id);
    });
  }
  if (dlg) {
    dlg.querySelector('.kbw__zu').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); var m = ev.target.closest('.kb-mini'); if (m) oeffne(+m.dataset.w); });
    dlg.addEventListener('close', function () { if (history.replaceState) history.replaceState(null, '', location.pathname); });
    $$('[data-behandlung]', dlg).forEach(function (b) { b.addEventListener('click', function () { $$('[data-behandlung]', dlg).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
    dlg.querySelector('[data-kbw-abend]').addEventListener('click', function () {
      if (!aktuell) return;
      var s = lies(), beh = dlg.querySelector('[data-behandlung][aria-pressed="true"]').dataset.behandlung;
      s.weine = s.weine.filter(function (y) { return y.id !== aktuell.id; });
      s.weine.push({ id: aktuell.id, name: aktuell.name, jahr: aktuell.jahr, erzeuger: aktuell.erzeuger, preis: aktuell.preis, groesse: aktuell.groesse, behandlung: beh });
      schreib(s); dlg.querySelector('.kbw__gelegt').hidden = false;
    });
    var m = /^#wein-(\d+)$/.exec(location.hash);
    if (m) {
      var id = +m[1], el = d.getElementById('wein-' + id);
      if (el) { var t = el.closest('.kb-tafel'); if (t) zeigeArt(tafeln.indexOf(t)); }
      oeffne(id);
    }
  }
})();
