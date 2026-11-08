/* Weinkarte · Wein zum Menü und die ganze Karte (Chat Wein, 20.10.2026; gebaut aus _varianten/wein-planer.js, Fassung 7). Jede Fassung baut eine eigene Oberfläche; gewählt wird über die
   Knöpfe des heutigen Pults (unsichtbar), damit Filter, Zahl und Treffer dieselben bleiben wie auf der Seite. ?v=0 = heute. */
(function () {
  'use strict';
  var d = document, w = window;
  var NAMEN = [
    ['Heute', 'Der heutige Stand der Seite.'],
    ['Vier Fragen', 'Eine Frage nach der anderen, grosse Bilder, unten immer die Zahl der passenden Weine.'],
    ['Ein Satz', 'Der Gast vervollständigt einen Satz: jedes goldene Wort öffnet seine Auswahl.'],
    ['Leiste', 'Sechs ruhige Knöpfe in einer Leiste, die Auswahl öffnet sich als Fenster, die Weine stehen gleich darunter.'],
    ['Startpunkte', 'Sechs Anlässe zum Einstieg (Apéro, Fisch, Fleisch, Wild, Käse, Dessert), danach fein einstellen.'],
    ['Konfigurator', 'Links die Fragen untereinander, rechts in Ochsenblut die Zahl und die eigene Wahl.'],
    ['Bühne', 'Wie «Vier Fragen», aber auf dunklem Grund mit Gold.'],
    ['Wein zum Menü', 'Oben die Empfehlung, darunter das Menü Gang für Gang mit seinem Wein, dazu ein Hinweis für das Haus.']
  ];
  var V = 7;
  d.documentElement.dataset.pv = V;

  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var leise = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var schalter = d.querySelector('[data-ansicht="geschmack"]'); if (schalter) schalter.click();
  // Ohne Geschmacksangaben (Auslieferung ohne fremde Bildrechte) gibt es keinen Berater: dann nur die ganze Karte
  var NUR_KARTE = !d.querySelector('.kb-pult');
  if (NUR_KARTE) { var hp = d.createElement('div'); hp.hidden = true; hp.innerHTML = '<div class="kb-pult"><b data-kb-zahl>0</b><button data-kb-leeren></button></div><div data-kb-liste></div>'; d.body.appendChild(hp); }
  var pult = d.querySelector('.kb-pult'), zahlEl = d.querySelector('[data-kb-zahl]'), liste = d.querySelector('[data-kb-liste]');
  var HINWEIS = (pult.querySelector('.kb-pult__hinweis') || {}).textContent || '';
  var GESAMT = +zahlEl.textContent;

  /* Wahlmöglichkeiten aus dem heutigen Pult */
  function orig(g, wert) { return pult.querySelector('[data-g="' + g + '"][data-wert="' + wert + '"]'); }
  function an(g, wert) { var b = orig(g, wert); return b && b.getAttribute('aria-pressed') === 'true'; }
  function opts(g) { return $$('[data-g="' + g + '"]', pult).map(function (b) { var i = b.querySelector('img'); return { g: g, wert: b.dataset.wert, img: i ? i.getAttribute('src') : '', text: b.textContent.trim() }; }); }
  var ARTZAHL = {}; $$('.kb-reiter [data-art]').forEach(function (b) { var s = b.querySelector('span'); ARTZAHL[b.firstChild.textContent.trim()] = s ? s.textContent : ''; });
  var LANDBILD = {}, LANDZAHL = {}; $$('.kb-gefach').forEach(function (g) { var b = g.querySelector('.kb-gefach__bild'); if (b) LANDBILD[g.dataset.land] = b.style.backgroundImage; var z = g.querySelector('.mono'); LANDZAHL[g.dataset.land] = z ? z.textContent : ''; });
  var FLAGGE = {}; $$('[data-g="land"]', pult).forEach(function (b) { var s = b.querySelector('svg'); FLAGGE[b.dataset.wert] = s ? s.outerHTML : ''; });
  if (!Object.keys(FLAGGE).length) { try { FLAGGE = JSON.parse(d.getElementById('kb-flaggen').textContent); } catch (e) {} }

  var ART_SATZ = { 'Champagner': 'Aus der Champagne, fein perlend', 'Schaumwein': 'Prickelnd, aus anderen Gegenden', 'Weisswein': 'Von frisch bis cremig', 'Rosé': 'Hell, leicht, sommerlich', 'Rotwein': 'Von zart bis kräftig', 'Süsswein': 'Zum Dessert und zum Käse' };
  var KOERPER = { leicht: ['Leicht', 'Zart und frisch, zum Apéro und zu Fisch', 1], mittel: ['Mittelkräftig', 'Ausgewogen, passt zu fast allem', 2], kraeftig: ['Voll und dicht', 'Kräftig, zu Fleisch und Wild', 3] };
  var SAEURE = { mild: ['Milde Säure', 'Rund und weich am Gaumen'], frisch: ['Frische Säure', 'Lebendig und saftig'] };
  var PREIS = { '0-100': ['bis 100', 'Franken'], '101-200': ['100 bis 200', 'Franken'], '201-400': ['200 bis 400', 'Franken'], '401-99999': ['über 400', 'Franken'] };
  function teile(t) { var m = /^(.*?)\s*\((.*)\)$/.exec(t); return m ? [m[1], m[2].replace(/\s*etc\.?$/, '')] : [t.replace('Käsesorten und ', 'Käse und ')]; }

  /* Flaschen je Art: das erste echte Foto dieser Art aus der Karte */
  var ARTFL = {};
  $$('.kb-tafel').forEach(function (t, i) { var b = $$('.kb-reiter [data-art]')[i]; var img = t.querySelector('.kb-fl__b img'); if (b && img) ARTFL[b.firstChild.textContent.trim()] = img.getAttribute('src'); });

  var TEUERFL = '', tp = 0;
  $$('.kb-tafel .kb-fl').forEach(function (b) { var m = /·\s*([\d’]+)\./.exec(b.textContent); var p = m ? +m[1].replace(/’/g, '') : 0; if (p > 400 && p < 1200 && p > tp) { tp = p; TEUERFL = b.querySelector('img').getAttribute('src'); } });
  var HAKEN = '<i class="pl-haken" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.4l3 3 6-6.6"/></svg></i>';
  function knopf(g, wert, inhalt, cls) { return '<button type="button" class="pl-k ' + (cls || '') + '" data-pg="' + g + '" data-pw="' + esc(wert) + '" aria-pressed="' + an(g, wert) + '">' + inhalt + HAKEN + '</button>'; }
  function kBild(o) { var t = teile(o.text); return knopf(o.g, o.wert, '<span class="pl-k__bild"><img src="' + esc(o.img) + '" alt="" loading="lazy"></span><span class="pl-k__t">' + esc(t[0]) + (t[1] ? '<small>' + esc(t[1]) + '</small>' : '') + '</span>', 'pl-k--bild'); }
  function kArt(o) { return knopf('art', o.wert, '<span class="pl-k__fl">' + (ARTFL[o.wert] ? '<img src="' + esc(ARTFL[o.wert]) + '" alt="" loading="lazy">' : '') + '</span><span class="pl-k__t">' + esc(o.wert) + '<small>' + esc(ART_SATZ[o.wert] || '') + '</small><em class="mono">' + esc(ARTZAHL[o.wert] || '') + ' auf der Karte</em></span>', 'pl-k--art'); }
  function kWort(g, wert, a) { var p = a[2] ? '<span class="pl-punkte">' + [1, 2, 3].map(function (n) { return '<i' + (n <= a[2] ? ' class="voll"' : '') + '></i>'; }).join('') + '</span>' : ''; return knopf(g, wert, p + '<span class="pl-k__t">' + esc(a[0]) + '<small>' + esc(a[1]) + '</small></span>', 'pl-k--wort'); }
  function kLand(o) { return knopf('land', o.wert, '<span class="pl-k__land" style="background-image:' + (LANDBILD[o.wert] || 'none') + '"></span><span class="pl-k__t">' + (FLAGGE[o.wert] || '') + esc(o.wert) + '<small class="mono">' + esc(LANDZAHL[o.wert]) + '</small></span>', 'pl-k--land'); }
  function kPreis(wert) { var p = PREIS[wert]; return knopf('preis', wert, '<span class="pl-k__t"><b>' + p[0] + '</b><small>' + p[1] + '</small></span>', 'pl-k--preis'); }

  function raster(html, cls) { return '<div class="pl-raster ' + (cls || '') + '">' + html + '</div>'; }
  function mehrRaster(list, fn, n, cls) {
    var a = list.slice(0, n).map(fn).join(''), b = list.slice(n).map(fn).join('');
    return raster(a + (b ? '<div class="pl-rest" hidden>' + b + '</div>' : ''), cls) + (b ? '<button type="button" class="pl-mehr" data-pl-mehr>Alle ' + list.length + ' zeigen</button>' : '');
  }
  var BLOCK = {
    speise: function () { return mehrRaster(opts('speise'), kBild, 8, 'pl-raster--bild'); },
    aroma: function () { return mehrRaster(opts('aroma'), kBild, 8, 'pl-raster--bild'); },
    art: function () { return raster(opts('art').map(kArt).join(''), 'pl-raster--art'); },
    glas: function () { return '<h4 class="pl-unter">Wie kräftig?</h4>' + raster(Object.keys(KOERPER).map(function (k) { return kWort('koerper', k, KOERPER[k]); }).join(''), 'pl-raster--wort') + '<h4 class="pl-unter">Wie viel Frische?</h4>' + raster(Object.keys(SAEURE).map(function (k) { return kWort('saeure', k, SAEURE[k]); }).join(''), 'pl-raster--wort pl-raster--zwei'); },
    land: function () { return raster(opts('land').map(kLand).join(''), 'pl-raster--land'); },
    preis: function () { return raster(Object.keys(PREIS).map(kPreis).join(''), 'pl-raster--preis'); }
  };
  var THEMEN = [
    { k: 'speise', g: ['speise'], titel: 'Was essen Sie?', satz: 'Wählen Sie ein oder mehrere Gerichte. Wir zeigen die Weine, die Weintrinker dazu empfehlen.', kurz: 'Zum Essen' },
    { k: 'art', g: ['art'], titel: 'Welcher Wein soll es sein?', satz: 'Champagner zum Anstossen, Weiss oder Rot zum Essen, Süsswein zum Schluss.', kurz: 'Art' },
    { k: 'glas', g: ['koerper', 'saeure'], titel: 'Wie soll er sich anfühlen?', satz: 'Leicht oder kräftig, mild oder frisch. Lassen Sie es offen, wenn Sie unsicher sind.', kurz: 'Im Glas' },
    { k: 'aroma', g: ['aroma'], titel: 'Was mögen Sie im Duft?', satz: 'Die Aromen, die Weintrinker in diesen Weinen am häufigsten finden.', kurz: 'Duft' },
    { k: 'land', g: ['land'], titel: 'Woher soll er kommen?', satz: 'Acht Länder stehen auf der Karte, die Schweiz mit 136 Weinen.', kurz: 'Herkunft' },
    { k: 'preis', g: ['preis'], titel: 'Zu welchem Preis?', satz: 'Preis je Flasche, wie auf der Karte.', kurz: 'Preis' }
  ];
  function thema(k) { return THEMEN.filter(function (t) { return t.k === k; })[0]; }
  function wahlText(t) {
    var r = [];
    t.g.forEach(function (g) { $$('[data-g="' + g + '"][aria-pressed="true"]', pult).forEach(function (b) {
      var x = g === 'koerper' ? KOERPER[b.dataset.wert][0] : g === 'saeure' ? SAEURE[b.dataset.wert][0] : g === 'preis' ? PREIS[b.dataset.wert][0] + ' Franken' : teile(b.textContent.trim())[0];
      r.push(x);
    }); });
    return r;
  }

  /* Zahl rollt zum neuen Wert */
  var zahlen = [];
  function rolle(el, von, bis) {
    if (leise || von === bis) { el.textContent = bis; return; }
    var t0 = performance.now(), dau = 520;
    (function f(t) { var p = Math.min(1, (t - t0) / dau), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(von + (bis - von) * e); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  var alt = GESAMT;
  function sync() {
    $$('[data-pg]').forEach(function (b) { b.setAttribute('aria-pressed', an(b.dataset.pg, b.dataset.pw) ? 'true' : 'false'); });
    var neu = +zahlEl.textContent; if (neu !== alt) { zahlen.forEach(function (el) { rolle(el, alt, neu); }); alt = neu; }
    $$('[data-pl-zahlwort]').forEach(function (el) { el.textContent = neu === 1 ? 'Wein passt' : 'Weine passen'; });
    if (oberflaeche.nachSync) oberflaeche.nachSync();
    if (lst) { MAX = 12; zeichneListe(); }
  }
  new MutationObserver(sync).observe(pult, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
  new MutationObserver(sync).observe(zahlEl, { childList: true, characterData: true, subtree: true });

  /* Treffer: kommen gestaffelt von unten an ihren Platz */
  new MutationObserver(function () {
    if (leise) return;
    $$(':scope > button', liste).slice(0, 18).forEach(function (k, i) { k.style.setProperty('--i', i); k.classList.remove('pl-neu'); void k.offsetWidth; k.classList.add('pl-neu'); });
  }).observe(liste, { childList: true });

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pg]');
    if (b) { var o = orig(b.dataset.pg, b.dataset.pw); if (o) o.click(); return; }
    var m = e.target.closest('[data-pl-mehr]');
    if (m) { var r = m.previousElementSibling.querySelector('.pl-rest'); r.hidden = !r.hidden; m.textContent = r.hidden ? 'Alle zeigen' : 'Weniger zeigen'; return; }
    if (e.target.closest('[data-pl-leeren]')) { pult.querySelector('[data-kb-leeren]').click(); return; }
    if (e.target.closest('[data-pl-ansehen]')) { var y = liste.getBoundingClientRect().top + w.scrollY - 120; w.scrollTo({ top: y, behavior: leise ? 'auto' : 'smooth' }); }
  });


  /* Treffer als ruhige Liste statt einer Wand aus Flaschen (Robert 20.10.2026: «… diese ganzen Flaschen … überfordert einen») */
  var WEINE = null, WELT = null, MAX = 12;
  var lst = d.createElement('div'); lst.className = 'pl-liste'; liste.parentNode.insertBefore(lst, liste);
  Promise.all([fetch('assets/daten/wein.json').then(function (r) { return r.json(); }), fetch('assets/daten/wein-welt.json').then(function (r) { return r.json(); })]).then(function (a) { WEINE = a[0]; WELT = a[1]; zeichneListe(); if (oberflaeche.daten) oberflaeche.daten(); }).catch(function () { });   // abgebrochenes Laden (Seite verlassen): still
  var ARTEN = ['Champagner', 'Schaumwein', 'Weisswein', 'Rosé', 'Rotwein', 'Süsswein'];
  function gew(g) { return $$('[data-g="' + g + '"][aria-pressed="true"]', pult).map(function (b) { return b.dataset.wert; }); }
  function stufe(k) { return k < 2.8 ? 'leicht' : k <= 3.8 ? 'mittel' : 'kraeftig'; }
  function gross(t) { return String(t || '').toLowerCase().replace(/(^|[\s\-–\/.(])([a-zäöüéèâ])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/ (De|Du|Del|Des) /g, function (m) { return m.toLowerCase(); }).replace('Mclaren', 'McLaren'); }
  function chf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.'; }
  function treffer() {
    var A = gew('art'), K = gew('koerper'), S = gew('saeure'), R = gew('aroma'), E = gew('speise'), L = gew('land'), P = gew('preis');
    return WEINE.filter(function (v) {
      var x = WELT.w[v.id] || {}, st = x.s || {};
      if (A.length && A.indexOf(v.art) < 0) return false;
      if (L.length && L.indexOf(v.land) < 0) return false;
      if (P.length && !P.some(function (p) { var q = p.split('-'); return v.preis >= +q[0] && v.preis <= +q[1]; })) return false;
      if (K.length && !(st.k && K.indexOf(stufe(st.k)) > -1)) return false;
      if (S.length && !(st.sa && S.some(function (q) { return q === 'mild' ? st.sa <= 3 : st.sa >= 3.6; }))) return false;
      if (R.length && !(x.a && x.a.some(function (y) { return R.indexOf(y[0]) > -1; }))) return false;
      if (E.length && !(x.sp && x.sp.some(function (f) { return E.indexOf(f) > -1; }))) return false;
      return true;
    });
  }
  function zeile(v) {
    var x = WELT.w[v.id] || {}, gut = x.g || gross(v.erzeuger) || (v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[0] : '');
    var name = v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[1] : v.name;
    return '<button type="button" class="kb-z pl-zeile" data-w="' + v.id + '"><span class="pl-zeile__fl">' + (x.f ? '<img src="' + x.f.replace('.webp', '-s.webp') + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="pl-zeile__n"><b>' + esc(name) + '</b><small>' + esc([gut, gross(v.region), v.land].filter(Boolean).join(' · ')) + '</small></span>' +
      '<span class="pl-zeile__j">' + esc(v.jahr || 'ohne Jahrgang') + '</span><span class="pl-zeile__g">' + esc(v.groesse) + '</span><span class="pl-zeile__p">' + chf(v.preis) + '</span></button>';
  }
  function zeichneListe() {
    if (!WEINE) return;
    var t = treffer().sort(function (a, b) { return ARTEN.indexOf(a.art) - ARTEN.indexOf(b.art) || a.preis - b.preis; });
    var html = '', n = 0, art = null, je = {};
    t.forEach(function (v) { je[v.art] = (je[v.art] || 0) + 1; });
    t.slice(0, MAX).forEach(function (v) {
      if (v.art !== art) { if (art) html += '</div>'; art = v.art; html += '<div class="pl-gruppe"><h3 class="pl-gruppe__kopf"><span>' + esc(art) + '</span><span class="mono">' + je[art] + (je[art] === 1 ? ' Wein' : ' Weine') + '</span></h3>'; }
      html += zeile(v); n++;
    });
    if (art) html += '</div>';
    if (!t.length) html = '<p class="pl-leer">Diese Auswahl führt die Karte nicht. Lösen Sie eine Wahl, dann erscheinen wieder Weine.</p>';
    var rest = t.length - n;
    html += rest > 0 ? '<div class="pl-liste__fuss"><span>' + n + ' von ' + t.length + ', nach Preis geordnet</span><button type="button" class="kn kn--hell" data-pl-weiter><span>' + Math.min(12, rest) + ' weitere zeigen</span>' + PF + '</button></div>' : '';
    var h = lst.offsetHeight; lst.style.minHeight = h + 'px'; lst.innerHTML = html; requestAnimationFrame(function () { lst.style.minHeight = ''; });
    if (!leise) $$('.pl-zeile', lst).slice(-12).forEach(function (z, i) { z.style.setProperty('--i', i); z.classList.add('pl-neu'); });
  }
  lst.addEventListener('click', function (e) { if (e.target.closest('[data-pl-weiter]')) { MAX += 12; zeichneListe(); } });

  var PF = '<svg viewBox="0 0 26 10"><path d="M0 5h24M20 1l4 4-4 4"/></svg>';
  function zahlBlock(cls) { return '<p class="pl-zahl ' + (cls || '') + '"><b data-pl-zahl>' + zahlEl.textContent + '</b> <span data-pl-zahlwort>Weine passen</span></p>'; }
  function fuss() { return '<p class="pl-quelle">' + esc(HINWEIS) + '</p>'; }

  var box = d.createElement('div'); box.className = 'pl pl--' + V;
  pult.parentNode.insertBefore(box, pult);
  var oberflaeche = {};

  /* ---------- 1 und 6: Vier Fragen, eine nach der anderen ---------- */
  function fragen() {
    var S = [
      { titel: 'Was essen Sie?', satz: thema('speise').satz, inhalt: BLOCK.speise(), kurz: 'Essen' },
      { titel: 'Welcher Wein soll es sein?', satz: 'Wählen Sie die Art und, wenn Sie mögen, wie er sich im Glas anfühlt.', inhalt: '<h4 class="pl-unter">Die Art</h4>' + BLOCK.art() + BLOCK.glas(), kurz: 'Wein' },
      { titel: 'Was mögen Sie im Duft?', satz: thema('aroma').satz, inhalt: BLOCK.aroma(), kurz: 'Duft' },
      { titel: 'Woher, und zu welchem Preis?', satz: 'Acht Länder stehen auf der Karte. Der Preis gilt je Flasche.', inhalt: BLOCK.land() + '<h4 class="pl-unter">Preis je Flasche</h4>' + BLOCK.preis(), kurz: 'Herkunft, Preis' }
    ];
    box.innerHTML = '<div class="pl-kopf"><div><p class="mono pl-ueber">Nach Geschmack</p><h2 class="titel pl-h">Welcher Wein passt zu Ihrem Abend?</h2></div>' +
      '<nav class="pl-schritte" aria-label="Fragen">' + S.map(function (s, i) { return '<button type="button" data-schritt="' + i + '"><span class="mono">' + (i + 1) + '</span>' + s.kurz + '<small data-schritt-wahl="' + i + '"></small></button>'; }).join('') + '<i class="pl-strich"></i></nav></div>' +
      '<div class="pl-buehne">' + S.map(function (s, i) { return '<section class="pl-schritt" data-teil="' + i + '"' + (i ? ' hidden' : '') + '><h3 class="pl-frage">' + s.titel + '</h3><p class="pl-satz">' + s.satz + '</p>' + s.inhalt + '</section>'; }).join('') + '</div>' +
      '<div class="pl-leiste">' + zahlBlock() + '<button type="button" class="pl-leeren mono" data-pl-leeren>Auswahl leeren</button><span class="pl-weg"><button type="button" class="kn kn--hell kn--klein" data-zurueck><span>Zurück</span></button><button type="button" class="kn kn--klein" data-weiter><span>Weiter</span>' + PF + '</button></span></div>' + fuss();
    var jetzt = 0, nav = box.querySelector('.pl-schritte'), strich = nav.querySelector('.pl-strich');
    var gruppen = [['speise'], ['art', 'koerper', 'saeure'], ['aroma'], ['land', 'preis']];
    function strichSetzen() { var b = nav.querySelector('[data-schritt="' + jetzt + '"]'); strich.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / 100) + ')'; }
    function zeige(n) {
      if (n < 0 || n >= S.length) return;
      var richtung = n > jetzt ? 1 : -1; jetzt = n;
      $$('.pl-schritt', box).forEach(function (s, i) { s.hidden = i !== n; if (i === n && !leise) { s.style.setProperty('--r', richtung); s.classList.remove('pl-rein'); void s.offsetWidth; s.classList.add('pl-rein'); } });
      $$('[data-schritt]', nav).forEach(function (b, i) { b.setAttribute('aria-current', i === n ? 'step' : 'false'); });
      strichSetzen();
      var z = box.querySelector('[data-zurueck]'), wt = box.querySelector('[data-weiter]');
      z.style.visibility = n ? 'visible' : 'hidden';
      wt.querySelector('span').textContent = n === S.length - 1 ? 'Weine ansehen' : 'Weiter';
      wt.toggleAttribute('data-pl-ansehen', n === S.length - 1);
    }
    nav.addEventListener('click', function (e) { var b = e.target.closest('[data-schritt]'); if (b) zeige(+b.dataset.schritt); });
    box.querySelector('[data-zurueck]').onclick = function () { zeige(jetzt - 1); };
    box.querySelector('[data-weiter]').onclick = function () { if (jetzt < S.length - 1) { zeige(jetzt + 1); var y = box.getBoundingClientRect().top + w.scrollY - 30; if (box.getBoundingClientRect().top < 0) w.scrollTo({ top: y, behavior: leise ? 'auto' : 'smooth' }); } };
    oberflaeche.nachSync = function () {
      gruppen.forEach(function (gs, i) { var n = gs.reduce(function (a, g) { return a + $$('[data-g="' + g + '"][aria-pressed="true"]', pult).length; }, 0); var el = box.querySelector('[data-schritt-wahl="' + i + '"]'); el.textContent = n ? n + ' gewählt' : ''; });
    };
    w.addEventListener('resize', strichSetzen);
    zeige(0); requestAnimationFrame(strichSetzen);
  }

  /* ---------- 2: Ein Satz ---------- */
  var DUFT = { 'Erde und Mineral': 'nach Erde und Mineral', 'Holz': 'nach Holz', 'Dunkle Früchte': 'nach dunklen Früchten', 'Rote Früchte': 'nach roten Früchten', 'Gewürze': 'nach Gewürzen', 'Kern- und Steinobst': 'nach Kern- und Steinobst', 'Zitrusfrüchte': 'nach Zitrusfrüchten', 'Tropische Früchte': 'nach tropischen Früchten', 'Hefe, Brot und Butter': 'nach Hefe, Brot und Butter', 'Reife': 'nach Reife', 'Kräuter und Grünes': 'nach Kräutern', 'Blüten': 'nach Blüten', 'Trockenfrüchte': 'nach Trockenfrüchten' };
  var ZU = { 'Geflügel': 'Geflügel', 'Rindfleisch': 'Rindfleisch', 'Wild': 'Wild', 'Lamm': 'Lamm', 'Geräucherte Fleischprodukte': 'Geräuchertem', 'Kalbfleisch': 'Kalbfleisch', 'Schalentiere': 'Schalentieren', 'Schweinefleisch': 'Schweinefleisch', 'Pasta': 'Pasta', 'Scharfe Gerichte': 'scharfen Gerichten', 'Fetthaltiger Fisch': 'fettem Fisch', 'Milde Käse und Weichkäse': 'mildem Käse', 'Vegetarische Gerichte': 'Vegetarischem', 'Magerer Fisch': 'magerem Fisch', 'Ziegenkäse': 'Ziegenkäse', 'Reife Käse und Hartkäse': 'reifem Käse', 'Vorspeisen und Snacks': 'Vorspeisen', 'Pilze': 'Pilzen', 'Blauschimmelkäse': 'Blauschimmelkäse', 'Süße Desserts': 'süssen Desserts', 'Süsse Desserts': 'süssen Desserts', 'Fruchtige Desserts': 'fruchtigen Desserts' };
  function und(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' oder ' + a[a.length - 1]; }
  function satz() {
    var W = [
      { k: 'art', leer: 'einen Wein', f: function (a) { return 'einen ' + und(a); }, inhalt: BLOCK.art },
      { k: 'speise', leer: 'zu jedem Gericht', f: function (a) { return 'zu ' + und(a.map(function (x) { return ZU[x] || x; })); }, inhalt: BLOCK.speise },
      { k: 'glas', leer: 'leicht oder kräftig', f: function (a) { return a.join(', ').toLowerCase(); }, inhalt: BLOCK.glas },
      { k: 'aroma', leer: 'mit jedem Duft', f: function (a) { return 'mit Duft ' + und(a.map(function (x) { return DUFT[x] || x; })); }, inhalt: BLOCK.aroma },
      { k: 'land', leer: 'aus allen acht Ländern', f: function (a) { return 'aus ' + und(a.map(function (x) { return x === 'USA' ? 'den USA' : x === 'Schweiz' ? 'der Schweiz' : x; })); }, inhalt: BLOCK.land },
      { k: 'preis', leer: 'zu jedem Preis', f: function (a) { return und(a); }, inhalt: BLOCK.preis }
    ];
    function wort(i) { return '<button type="button" class="pl-wort" data-wort="' + i + '"></button>'; }
    box.innerHTML = '<p class="mono pl-ueber">Nach Geschmack</p><p class="pl-satzbau">Ich suche ' + wort(0) + ' ' + wort(1) + ', ' + wort(2) + ', ' + wort(3) + ', ' + wort(4) + ' und ' + wort(5) + '.</p>' +
      '<p class="pl-tipp">Tippen Sie auf ein goldenes Wort.</p><div class="pl-fenster" hidden><div class="pl-fenster__kopf"><h3 class="pl-frage"></h3><button type="button" class="kn kn--klein" data-fenster-zu><span>Fertig</span></button></div><div class="pl-fenster__inhalt"></div></div>' +
      '<div class="pl-leiste pl-leiste--mitte">' + zahlBlock() + '<button type="button" class="pl-leeren mono" data-pl-leeren>Auswahl leeren</button><button type="button" class="kn" data-pl-ansehen><span>Weine ansehen</span>' + PF + '</button></div>' + fuss();
    var fen = box.querySelector('.pl-fenster'), offen = -1;
    function zu() { fen.hidden = true; offen = -1; $$('.pl-wort', box).forEach(function (b) { b.classList.remove('offen'); }); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.pl-wort');
      if (b) { var i = +b.dataset.wort; if (i === offen) return zu(); offen = i; $$('.pl-wort', box).forEach(function (x) { x.classList.toggle('offen', x === b); });
        fen.querySelector('.pl-frage').textContent = thema(W[i].k).titel; fen.querySelector('.pl-fenster__inhalt').innerHTML = W[i].inhalt(); fen.hidden = false;
        if (!leise) { fen.classList.remove('pl-auf'); void fen.offsetWidth; fen.classList.add('pl-auf'); } sync(); }
      if (e.target.closest('[data-fenster-zu]')) zu();
    });
    oberflaeche.nachSync = function () { W.forEach(function (x, i) { var a = wahlText(thema(x.k)), b = box.querySelector('[data-wort="' + i + '"]'); b.textContent = a.length ? x.f(a) : x.leer; b.classList.toggle('gesetzt', !!a.length); }); };
  }

  /* ---------- 3 und 4: Leiste mit Fenstern (4 mit Startpunkten davor) ---------- */
  function leiste(mitStart) {
    // Startpunkte nur aus der Karte selbst (Art, Land, Preis), nie aus den lückenhaften Speise-Angaben (Robert 20.10.2026: «12 Weine zum Käse?»)
    var START = [
      { t: 'Zum Apéro', s: 'Champagner, Schaumwein und Rosé', fl: 'Champagner', w: [['art', 'Champagner'], ['art', 'Schaumwein'], ['art', 'Rosé']] },
      { t: 'Zu Fisch', s: 'Die Weissweine der Karte', bild: 'Magerer Fisch', w: [['art', 'Weisswein']] },
      { t: 'Zu Fleisch und Wild', s: 'Die Rotweine der Karte', bild: 'Rindfleisch', w: [['art', 'Rotwein']] },
      { t: 'Zu Käse und Dessert', s: 'Die Süssweine der Karte', bild: 'Reife Käsesorten und Hartkäse', w: [['art', 'Süsswein']] },
      { t: 'Aus der Schweiz', s: 'Von Bündner Herrschaft bis Wallis', land: 'Schweiz', w: [['land', 'Schweiz']] },
      { t: 'Für besondere Abende', s: 'Flaschen über 400 Franken', fl: 'teuer', w: [['preis', '401-99999']] }
    ];
    var SP = {}; opts('speise').forEach(function (o) { SP[o.wert] = o.img; });
    var start = mitStart ? '<div class="pl-start"><div class="pl-start__kopf"><p class="mono pl-ueber">Nach Geschmack</p><h2 class="titel pl-h">Womit beginnt Ihr Abend?</h2><p class="pl-satz">Wählen Sie einen Anlass. Danach können Sie in der Leiste darunter alles fein einstellen.</p></div><div class="pl-start__raster">' +
      START.map(function (s, i) { var bi = s.land ? '<span class="pl-st__land" style="background-image:' + (LANDBILD[s.land] || 'none') + '"></span>' : '<img src="' + esc(s.fl === 'teuer' ? TEUERFL : s.fl ? ARTFL[s.fl] : SP[s.bild] || '') + '" alt="" loading="lazy"' + (s.fl ? ' class="pl-st__fl"' : '') + '>'; return '<button type="button" class="pl-st" data-start="' + i + '"><span class="pl-st__bild">' + bi + '</span><span class="pl-st__t"><b>' + s.t + '</b><small>' + s.s + '</small></span>' + HAKEN + '</button>'; }).join('') + '</div></div>' : '<div class="pl-start__kopf pl-start__kopf--klein"><p class="mono pl-ueber">Nach Geschmack</p><h2 class="titel pl-h">Welcher Wein passt zu Ihrem Abend?</h2></div>';
    box.innerHTML = start + '<div class="pl-bar"><div class="pl-bar__knoepfe">' + THEMEN.map(function (t) { return '<button type="button" class="pl-bk" data-thema="' + t.k + '"><span>' + t.kurz + '</span><small data-thema-wahl="' + t.k + '"></small><svg viewBox="0 0 12 8"><path d="M1 1.5l5 5 5-5"/></svg></button>'; }).join('') + '</div>' +
      '<div class="pl-bar__rechts">' + zahlBlock('pl-zahl--klein') + '</div>' +
      '<div class="pl-pop" hidden><div class="pl-pop__kopf"><div><h3 class="pl-frage"></h3><p class="pl-satz"></p></div><button type="button" class="kn kn--klein" data-pop-zu><span>Fertig</span></button></div><div class="pl-pop__inhalt"></div></div></div>' +
      '<div class="pl-chips"></div>' + fuss();
    var pop = box.querySelector('.pl-pop'), offen = null, aktivStart = -1;
    function zu() { pop.hidden = true; offen = null; $$('.pl-bk', box).forEach(function (b) { b.classList.remove('offen'); }); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.pl-bk');
      if (b) { var k = b.dataset.thema; if (k === offen) return zu(); offen = k; var t = thema(k);
        $$('.pl-bk', box).forEach(function (x) { x.classList.toggle('offen', x === b); });
        pop.querySelector('.pl-frage').textContent = t.titel; pop.querySelector('.pl-satz').textContent = t.satz; pop.querySelector('.pl-pop__inhalt').innerHTML = BLOCK[k]();
        var bar = box.querySelector('.pl-bar').getBoundingClientRect(), r = b.getBoundingClientRect();
        pop.style.setProperty('--x', w.innerWidth < 760 ? '0px' : Math.max(0, Math.min(r.left - bar.left, bar.width - Math.min(bar.width, 860))) + 'px');
        pop.hidden = false; if (!leise) { pop.classList.remove('pl-auf'); void pop.offsetWidth; pop.classList.add('pl-auf'); } sync(); return; }
      if (e.target.closest('[data-pop-zu]')) return zu();
      var st = e.target.closest('[data-start]');
      if (st) { var i = +st.dataset.start; pult.querySelector('[data-kb-leeren]').click(); if (i !== aktivStart) { START[i].w.forEach(function (p) { var o = orig(p[0], p[1]); if (o) o.click(); }); aktivStart = i; } else aktivStart = -1;
        $$('[data-start]', box).forEach(function (x, j) { x.setAttribute('aria-pressed', j === aktivStart ? 'true' : 'false'); }); return; }
      var c = e.target.closest('[data-chip]'); if (c) { var o2 = pult.querySelector('[data-g="' + c.dataset.g + '"][data-wert="' + c.dataset.chip + '"]'); if (o2) o2.click(); }
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
    d.addEventListener('click', function (e) { if (offen && !e.target.closest('.pl-bar') && !e.target.closest('.kb-pult')) zu(); });
    oberflaeche.nachSync = function () {
      THEMEN.forEach(function (t) { var a = wahlText(t), el = box.querySelector('[data-thema-wahl="' + t.k + '"]'); el.textContent = a.length ? (a.length > 1 ? a.length : '') : ''; el.closest('.pl-bk').classList.toggle('gesetzt', !!a.length); });
      var html = ''; $$('[aria-pressed="true"][data-g]', pult).forEach(function (b) { var g = b.dataset.g, t = g === 'koerper' ? KOERPER[b.dataset.wert][0] : g === 'saeure' ? SAEURE[b.dataset.wert][0] : g === 'preis' ? PREIS[b.dataset.wert][0] + ' Franken' : teile(b.textContent.trim())[0];
        html += '<button type="button" class="pl-chip" data-g="' + g + '" data-chip="' + esc(b.dataset.wert) + '">' + esc(t) + '<svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6"/></svg></button>'; });
      box.querySelector('.pl-chips').innerHTML = html ? html + '<button type="button" class="pl-leeren mono" data-pl-leeren>Alles leeren</button>' : '';
    };
  }

  /* ---------- 5: Konfigurator ---------- */
  function konfig() {
    box.innerHTML = '<div class="pl-k5"><div class="pl-k5__links"><p class="mono pl-ueber">Nach Geschmack</p><h2 class="titel pl-h">Ihr Wein, Schritt für Schritt.</h2>' +
      THEMEN.map(function (t, i) { return '<section class="pl-ak' + (i ? '' : ' offen') + '" data-ak="' + t.k + '"><button type="button" class="pl-ak__kopf"><span class="pl-ak__titel">' + t.titel + '</span><span class="pl-ak__wahl" data-ak-wahl="' + t.k + '">Noch offen</span><svg viewBox="0 0 12 8"><path d="M1 1.5l5 5 5-5"/></svg></button><div class="pl-ak__inhalt"' + (i ? ' hidden' : '') + '><p class="pl-satz">' + t.satz + '</p>' + BLOCK[t.k]() + '</div></section>'; }).join('') +
      '</div><aside class="pl-k5__rechts"><div class="pl-k5__karte"><p class="mono">Ihre Wahl</p>' + zahlBlock('pl-zahl--gross') + '<ul class="pl-k5__liste"></ul><button type="button" class="kn kn--hell" data-pl-ansehen><span>Weine ansehen</span>' + PF + '</button><button type="button" class="pl-leeren mono" data-pl-leeren>Auswahl leeren</button></div></aside></div>' + fuss();
    box.addEventListener('click', function (e) {
      var k = e.target.closest('.pl-ak__kopf'); if (!k) return;
      var s = k.parentNode, war = s.classList.contains('offen');
      $$('.pl-ak', box).forEach(function (x) { x.classList.remove('offen'); x.querySelector('.pl-ak__inhalt').hidden = true; });
      if (!war) { s.classList.add('offen'); var inh = s.querySelector('.pl-ak__inhalt'); inh.hidden = false; if (!leise) { inh.classList.remove('pl-auf'); void inh.offsetWidth; inh.classList.add('pl-auf'); }
        if (s.getBoundingClientRect().top < 80) w.scrollTo({ top: s.getBoundingClientRect().top + w.scrollY - 90, behavior: leise ? 'auto' : 'smooth' }); }
    });
    oberflaeche.nachSync = function () {
      var li = '';
      THEMEN.forEach(function (t) { var a = wahlText(t); box.querySelector('[data-ak-wahl="' + t.k + '"]').textContent = a.length ? a.join(', ') : 'Noch offen'; box.querySelector('[data-ak="' + t.k + '"]').classList.toggle('gesetzt', !!a.length);
        li += '<li' + (a.length ? '' : ' class="leer"') + '><span class="mono">' + t.kurz + '</span>' + esc(a.length ? a.join(', ') : 'offen') + '</li>'; });
      box.querySelector('.pl-k5__liste').innerHTML = li;
    };
  }



  /* Auftritte wie auf der Startseite (schaefli.css «Auftritte»): jedes Stück kommt von unten an seinen Platz, Bilder setzen sich mit leisem Zoom;
     schaefli.js hat seine Stücke schon gesammelt, darum beobachtet der Planer seine eigenen */
  var aio = ('IntersectionObserver' in w && !leise) ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); aio.unobserve(e.target); } }); }, { rootMargin: '0px 0px 30% 0px' }) : null;
  function auftritt(el, art, i) { if (!el) return; el.setAttribute('data-a', art || ''); if (i != null) el.style.setProperty('--i', i); if (aio) aio.observe(el); else el.classList.add('da'); }
  /* ---------- 7: Menü oder à la carte (Runde 3, 20.10.2026) ----------
     Robert: edler, Bilder der Küche, sanfte Wechsel; weitere Weine und Suche je Gang; man trinkt nicht je Gang eine Flasche,
     eher ein, zwei Flaschen und dazu Gläser; Umschalter weg, dafür ein Fenster; darunter der Überblick über die ganze Karte.
     Speisekarte vom 07.10.2026 (_quelle/website/pdf-text/Menu-07102026.txt). Fotos aus der Küche des Hauses als Stimmung je Gang.
     Weine nach klassischen Regeln (Art und Rebsorte der Karte, Körper wo belegt); ein Vorschlag, am Tisch berät Fabian Mennel.
     Glaspreise führt die Karte nicht: darum keine Zahl fürs Glas, nur der Hinweis auf den Sommelier. */
  var R = {
    champ: { art: ['Champagner'], f: 'w', warum: 'Feine Perlage zu Meer, Salz und Kaviar.' },
    chard: { art: ['Weisswein'], reb: ['Chardonnay'], k: 'voll', f: 'w', warum: 'Ein Chardonnay mit Fülle trägt Butter, Sauce und Trüffel.' },
    ries: { art: ['Weisswein'], reb: ['Riesling'], f: 'w', warum: 'Riesling mit Säure und Frucht hält Schärfe und Zitrus stand.' },
    frisch: { art: ['Weisswein'], reb: ['Sauvignon', 'Grüner Veltliner', 'Riesling'], f: 'w', warum: 'Ein frischer Weisser zu Zitrone, Kapern und Kräutern.' },
    pinot: { art: ['Rotwein'], reb: ['Pinot Noir', 'Spätburgunder', 'Blauburgunder', 'Blaufränkisch'], f: 'r', warum: 'Ein Pinot Noir, fein genug für Schwein und Kraut.' },
    wild: { art: ['Rotwein'], reb: ['Pinot Noir', 'Syrah', 'Nebbiolo', 'Spätburgunder'], k: 'voll', f: 'r', warum: 'Ein Roter mit Tiefe zu Reh, Pilzen und Maroni.' },
    kraeftig: { art: ['Rotwein'], reb: ['Syrah', 'Cabernet', 'Grenache', 'Nebbiolo', 'Merlot'], k: 'voll', f: 'r', warum: 'Ein kräftiger Roter zum fetten, dichten Wagyu.' },
    suess: { art: ['Süsswein'], f: 's', warum: 'Süsse zur Süsse, oder als Gegenpol zu Leber und Käse.' }
  };
  function foto(k, b) { return k ? 'assets/img/' + k + '-' + (b || 800) + '.webp' : ''; }
  var MENUE = [
    { n: 'Ocean 2026', z: 'Balfego Thunfisch, Auster, Seeigel, Oscietra Kaviar', r: 'champ', nicht: [5, 4] },
    { n: 'Bretonischer Hummer', z: 'Zitrus, Maltaise', r: 'chard', },
    { n: 'Handgeschabte Spätzle', z: 'weisser Trüffel, Comté', r: 'chard', nicht: [4] },
    { n: 'Wagyu A5', z: 'Zunge, Backe, Filet', r: 'kraeftig', },
    { n: 'Ormalinger Jungschwein', z: 'Szegediner Gulasch, Sauerkraut', r: 'pinot', },
    { n: 'Caramel 3', z: '', r: 'suess', }
  ];
  var KARTE = [
    ['Vorspeise', [['Sashimi vom Balfego Tuna', 'Wasabi-Marinade, Soja', '45.', 'champ'], ['Vitello tonnato', 'Risina Bohnen, Toskanisches Olivenöl', '45.', 'frisch'], ['Entenleber', 'Orange, Assam-Pfeffer', '68.', 'suess']]],
    ['Zwischengericht', [['Scampi 3/6', 'Thai-Curry-Nage, Avocado, Papaya', '68.', 'ries'], ['Froschschenkel aus Vallorbe', 'Knoblauch, Petersilie, Beurre Noisette', '58.', 'chard'], ['Norwegische Jakobsmuschel', 'Meerrettich, Rande, Apfel', '48.', 'ries']]],
    ['Hauptgericht', [['Bretonischer Steinbutt', 'Babyspinat, Artischocke, Eierschwämmli, Vin Jaune Sauce', '98.', 'chard'], ['Rochenflügel von der Algarve', 'Zitrone, Kapern, Petersilie', '79.', 'frisch'], ['Rehrücken', 'Steinpilze, Feigenrotkraut, Maroni, handgeschabte Spätzle', '79.', 'wild']]],
    ['Dessert', [['Schwarzwälder Kirsch', '', '36.', 'suess'], ['Auswahl von Rohmilchkäse', '', '39.', 'suess'], ['Soufflé von der Kaffir Limette', 'Ananas, Tom Kha Gai Eiscreme', '46.', 'suess']]]
  ];
  var STUFEN = ['Günstiger', 'Vorschlag', 'Besonders'];
  function bewertet(r) {
    var q = R[r];
    return WEINE.filter(function (v) { return q.art.indexOf(v.art) > -1; }).map(function (v) {
      var x = WELT.w[v.id] || {}, reb = (v.reb || []).concat(x.rb || []).join(' '), p = 0;
      if (q.reb) q.reb.forEach(function (rb, i) { if (reb.indexOf(rb) > -1) p = Math.max(p, 4 - i * 0.3); });
      if (q.reb && !p) p = -5;
      if (q.k === 'voll' && x.s && x.s.k) p += x.s.k >= 3.6 ? 1 : -1;
      if (x.f) p += 0.6;
      if (v.groesse !== '75 cl' && v.art !== 'Süsswein') p -= 3;
      return { v: v, p: p };
    });
  }
  // die passenden Weine eines Gangs, nach Preis: daraus Günstiger, Vorschlag, Besonders und «Weitere Weine»
  function passende(r) {
    var k = bewertet(r).sort(function (a, b) { return b.p - a.p; }), best = k.length ? k[0].p : 0;
    var pool = k.filter(function (c) { return c.p >= best - 1.2 && c.v.preis <= 600; });
    if (pool.length < 6) pool = k.filter(function (c) { return c.p >= best - 3 && c.v.preis <= 600; });
    return pool.sort(function (a, b) { return a.v.preis - b.v.preis || b.p - a.p; });
  }
  function drei(r, schon) {
    var pool = passende(r);
    var frei = pool.filter(function (c) { return schon.indexOf(c.v.id) < 0; }); if (frei.length >= 3) pool = frei;
    if (!pool.length) return [null, null, null];
    var mitFoto = function (lst) { return lst.filter(function (c) { return (WELT.w[c.v.id] || {}).f; })[0] || lst[0]; };
    var n = pool.length, g = mitFoto(pool.slice(0, Math.max(1, Math.ceil(n / 4)))), b = mitFoto(pool.slice(Math.floor(n * 0.75)).reverse());
    var mitte = pool.slice(Math.floor(n * 0.25), Math.ceil(n * 0.5) + 1).filter(function (c) { return c !== g && c !== b; });
    var m = mitte.sort(function (a, c) { return ((WELT.w[c.v.id] || {}).f ? 1 : 0) - ((WELT.w[a.v.id] || {}).f ? 1 : 0) || c.p - a.p; })[0];
    return [g, m || g, b].map(function (c) { return c ? c.v : null; });
  }
  function kurzname(v) { return v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[1] : v.name; }
  function gutname(v) { var x = WELT.w[v.id] || {}; return x.g || gross(v.erzeuger) || (v.name.indexOf(' – ') > -1 ? v.name.split(' – ')[0] : ''); }
  function weinInhalt(v) {
    var x = WELT.w[v.id] || {}, name = kurzname(v);
    return '<button type="button" class="kb-z pl7-wein" data-w="' + v.id + '"><span class="pl7-wein__fl">' + (x.f ? '<img src="' + x.f.replace('.webp', '-s.webp') + '" alt="Flasche ' + esc(name) + '">' : '<b class="pl7-jahr">' + esc(v.jahr || 'NV') + '</b>') + '</span>' +
      '<span class="pl7-wein__t"><span class="mono">' + esc([v.art, v.jahr].filter(Boolean).join(' · ')) + '</span><b>' + esc(name) + '</b><small>' + esc(gutname(v)) + '</small><small>' + esc([gross(v.region), v.land].filter(Boolean).join(', ')) + '</small><span class="pl7-wein__p">' + esc(v.groesse) + '<i></i>CHF ' + chf(v.preis) + '</span><span class="pl7-mehr mono">Mehr zu diesem Wein</span></span></button>';
  }
  var wahl = {}, vorrat = {}, eigen = {}, laufend = [];
  function gewaehlt(id) { var st = wahl[id] != null ? wahl[id] : 1; return st === 3 ? eigen[id] : (vorrat[id][st] || vorrat[id][1] || vorrat[id][0]); }
  // Landschaft je Gang: die des Weins, sonst eine andere seiner Region oder seines Landes; nie zweimal dasselbe Bild auf der Wand
  var REGBILD = null, belegt = {};
  function landschaft(v, id) {
    if (!v) return '';
    if (!REGBILD) { REGBILD = {}; WEINE.forEach(function (y) { var r = (WELT.w[y.id] || {}).r; if (!r) return; var k = y.region || y.land || y.art; (REGBILD[k] = REGBILD[k] || []); if (REGBILD[k].indexOf(r) < 0) REGBILD[k].push(r); (REGBILD['#' + (y.land || y.art)] = REGBILD['#' + (y.land || y.art)] || []); if (REGBILD['#' + (y.land || y.art)].indexOf(r) < 0) REGBILD['#' + (y.land || y.art)].push(r); }); }
    var x = WELT.w[v.id] || {}, kand = [];
    if (x.r) kand.push(x.r);
    kand = kand.concat(REGBILD[v.region || v.land || v.art] || [], REGBILD['#' + (v.land || v.art)] || []);
    var m = /url\(["']?([^"')]+)/.exec(LANDBILD[v.land || (v.art === 'Champagner' ? 'Frankreich' : '')] || ''); if (m) kand.push(m[1].replace(/-640\.webp$/, '.webp'));
    var andere = Object.keys(belegt).filter(function (k) { return k !== id; }).map(function (k) { return belegt[k]; });
    var wahl_ = kand.filter(function (r) { return andere.indexOf(r) < 0; })[0] || kand[0] || '';
    if (id) belegt[id] = wahl_;
    return wahl_ ? wahl_.replace(/(-640)?\.webp$/, '-640.webp') : '';
  }
  function ort(v) { return v ? (v.art === 'Champagner' && !v.land ? 'Champagne · Frankreich' : [gross(v.region), v.land].filter(Boolean).join(' · ')) : ''; }
  function gangHtml(e, i) {
    var st = wahl[e.id] != null ? wahl[e.id] : 1, d3 = vorrat[e.id], v = gewaehlt(e.id), l = landschaft(v, e.id);
    return '<article class="pl7-gang' + (i % 2 ? ' pl7-gang--rechts' : '') + '" data-gang="' + esc(e.id) + '" style="--i:' + i + '">' +
      '<div class="pl7-gang__bild rb">' + (l ? '<img src="' + l + '" alt="" loading="lazy" decoding="async">' : '') + '<span class="pl7-gang__ort mono">' + esc(ort(v)) + '</span></div>' +
      '<div class="pl7-gang__speise"><h4>' + esc(e.n) + '</h4>' + (e.z ? '<p>' + esc(e.z) + '</p>' : '') + '<i class="pl7-linie"></i><p class="pl7-warum">' + esc(R[e.r].warum) + '</p></div>' +
      '<div class="pl7-gang__wein"><div class="pl7-buehne">' + (v ? weinInhalt(v) : '<p class="pl7-warum">Dazu berät Sie Fabian Mennel am Tisch.</p>') + '</div>' +
      '<div class="pl7-stufen" role="group" aria-label="Preis">' + STUFEN.map(function (s, k) { return '<button type="button" data-stufe="' + k + '" aria-pressed="' + (k === st) + '"' + (d3[k] && (k === 1 || d3[k] !== d3[1]) ? '' : ' disabled') + '>' + s + '</button>'; }).join('') +
      '<button type="button" class="pl7-andere" data-andere>Weitere Weine</button><i class="pl7-stufen__strich"></i></div></div></article>';
  }
  function strich(gang) { var s = gang.querySelector('.pl7-stufen'), b = s.querySelector('[data-stufe][aria-pressed="true"]'), t = s.querySelector('.pl7-stufen__strich'); if (b) { t.style.opacity = 1; t.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / 100) + ')'; } else { var a = s.querySelector('[data-andere]'); t.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + (a.offsetWidth / 100) + ')'; } }
  function tausche(gang, v) {
    var bi = gang.querySelector('.pl7-gang__bild'), l = landschaft(v, gang.dataset.gang), alt0 = bi.querySelector('img');
    bi.querySelector('.pl7-gang__ort').textContent = ort(v);
    if (l && (!alt0 || alt0.getAttribute('src') !== l)) { var ni = new Image(); ni.alt = ''; ni.className = 'pl7-neu-bild'; ni.onload = function () { bi.insertBefore(ni, bi.querySelector('.pl7-gang__ort')); setTimeout(function () { if (alt0 && alt0.parentNode) alt0.parentNode.removeChild(alt0); ni.classList.remove('pl7-neu-bild'); }, 900); }; ni.src = l; }
    // alle bisherigen Kinder gehen (auch die eines noch laufenden Wechsels), sonst stapeln sich bei schnellen Klicks mehrere Weine in der Bühne (21.10.2026)
    var bu = gang.querySelector('.pl7-buehne'), alte = [].slice.call(bu.children);
    var tmp = d.createElement('div'); tmp.innerHTML = weinInhalt(v); var neu = tmp.firstElementChild;
    if (leise || !alte.length) { bu.innerHTML = ''; bu.appendChild(neu); return; }
    alte.forEach(function (a) { a.classList.add('pl7-geht'); }); neu.classList.add('pl7-kommt'); bu.appendChild(neu);
    setTimeout(function () { alte.forEach(function (a) { if (a.parentNode) a.parentNode.removeChild(a); }); }, 340); setTimeout(function () { neu.classList.remove('pl7-kommt'); }, 1300);
  }

  /* Der Abend in Flaschen: eine Flasche trägt alle Gänge ihrer Farbe, ein einzelner Gang bekommt ein Glas */
  var FARBE = { w: 'Weisswein', r: 'Rotwein', s: 'Süsswein' };
  function abendPlan(eintraege) {
    var gr = { w: [], r: [], s: [] };
    eintraege.forEach(function (e) { gr[R[e.r].f].push(e); });
    // Champagner zum Auftakt bleibt ein Glas, wenn die Weissweinflasche sonst mindestens zwei Gänge trägt
    var still = gr.w.filter(function (e) { return e.r !== 'champ'; });
    var champ = gr.w.filter(function (e) { return e.r === 'champ'; });
    if (still.length >= 2 && champ.length) { gr.w = still; champ.forEach(function (e) { gr.c = (gr.c || []).concat(e); }); }
    var fl = [], glas = (gr.c || []).slice();
    ['w', 'r', 's'].forEach(function (f) {
      var es = gr[f]; if (!es.length) return;
      if (es.length === 1) { glas.push(es[0]); return; }
      var zahl = {}; es.forEach(function (e) { zahl[e.r] = (zahl[e.r] || 0) + 1; });
      var haupt = es.filter(function (e) { return e.r !== 'champ'; }).sort(function (a, b) { return zahl[b.r] - zahl[a.r]; })[0] || es[0];
      fl.push({ v: gewaehlt(haupt.id), fuer: es });
    });
    return { fl: fl, glas: glas };
  }
  function abendHtml(eintraege, wo) {
    if (eintraege.length < 2) return '';
    var p = abendPlan(eintraege);
    var flaschen = p.fl.filter(function (x) { return x.v; });
    var kopf = flaschen.length ? (flaschen.length === 1 ? 'Eine Flasche trägt den Abend' : (flaschen.length === 2 ? 'Zwei Flaschen' : flaschen.length === 3 ? 'Drei Flaschen' : flaschen.length + ' Flaschen') + ' tragen den Abend') : 'Ein Glas zu jedem Gang';
    return '<div class="pl7-abend"><div class="pl7-abend__kopf"><p class="mono">Unsere Idee für Ihren Abend</p><h3>' + kopf + (p.glas.length && flaschen.length ? ', dazu ' + (p.glas.length === 1 ? 'ein Glas.' : (['', '', 'zwei', 'drei', 'vier'][p.glas.length] || p.glas.length) + ' Gläser.') : '.') + '</h3>' +
      '<p>Kaum jemand trinkt zu jedem Gang eine eigene Flasche. Eine Flasche begleitet mehrere Gänge, zu den übrigen passt ein Glas. Was offen ausgeschenkt wird, sagt Ihnen Fabian Mennel am Tisch.</p></div>' +
      '<div class="pl7-abend__reihe">' + flaschen.map(function (x) {
        return '<div class="pl7-abend__fl">' + weinInhalt(x.v) + '<p class="pl7-abend__fuer"><span class="mono">Eine Flasche ' + FARBE[R[x.fuer[0].r].f] + ' zu</span>' + x.fuer.map(function (e) { return esc(e.n); }).join(' · ') + '</p></div>';
      }).join('') + (p.glas.length ? '<div class="pl7-abend__glaeser">' : '') + p.glas.map(function (e) {
        var v = gewaehlt(e.id);
        return '<div class="pl7-abend__glas"><span class="mono">Ein Glas zu</span><b>' + esc(e.n) + '</b>' + (v ? '<small>zum Beispiel ' + esc(kurzname(v)) + ', ' + esc(gutname(v)) + '</small>' : '') + '</div>';
      }).join('') + (p.glas.length ? '</div>' : '') + '</div><p class="pl7-abend__unten mono">Darunter jeder Gang einzeln, mit seinem Wein</p></div>';
  }
  function wieMarke(eintraege, el) {
    var p = abendPlan(eintraege), map = {};
    p.fl.forEach(function (x) { x.fuer.forEach(function (e) { map[e.id] = 'Aus der Flasche ' + FARBE[R[e.r].f]; }); });
    p.glas.forEach(function (e) { map[e.id] = 'Ein Glas'; });
    $$('.pl7-gang', el).forEach(function (g) { var t = g.querySelector('[data-wie]'); if (t) t.textContent = eintraege.length > 1 ? (map[g.dataset.gang] || '') : ''; });
  }

  /* Weitere Weine und Suche für einen Gang, im Fenster */
  var wf = d.createElement('dialog'); wf.className = 'pl7-dlg'; wf.setAttribute('aria-label', 'Weitere Weine');
  wf.innerHTML = '<div class="pl7-dlg__kopf"><div><p class="mono" data-wf-art></p><h3 data-wf-titel></h3><p class="pl7-dlg__satz" data-wf-satz></p></div><button type="button" class="pl7-dlg__zu" aria-label="Schliessen"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button></div>' +
    '<label class="pl7-suche"><svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg><span class="vh">In der ganzen Weinkarte suchen</span><input type="search" placeholder="Name, Weingut, Region oder Jahrgang" autocomplete="off"></label>' +
    '<p class="pl7-dlg__zwischen mono" data-wf-zw></p><div class="pl7-dlg__liste" data-wf-liste></div>';
  d.body.appendChild(wf);
  var wfGang = null, wfR = null;
  function wfZeile(v) {
    var x = WELT.w[v.id] || {};
    return '<button type="button" class="pl7-wz" data-waehle="' + v.id + '"><span class="pl7-wz__fl">' + (x.f ? '<img src="' + x.f.replace('.webp', '-s.webp') + '" alt="" loading="lazy">' : '') + '</span><span class="pl7-wz__t"><b>' + esc(kurzname(v)) + '</b><small>' + esc([v.jahr, gutname(v), v.land].filter(Boolean).join(' · ')) + '</small></span><span class="pl7-wz__p">' + esc(v.groesse) + '<b>' + chf(v.preis) + '</b></span><span class="pl7-wz__w mono">Wählen</span></button>';
  }
  function wfZeichne() {
    var q = wf.querySelector('input').value.trim().toLowerCase(), l = wf.querySelector('[data-wf-liste]'), zw = wf.querySelector('[data-wf-zw]');
    if (!q) { var p = passende(wfR); zw.textContent = p.length + ' Weine der Karte passen zu diesem Gang, nach Preis'; l.innerHTML = p.map(function (c) { return wfZeile(c.v); }).join(''); return; }
    var t = WEINE.filter(function (v) { return [v.name, v.erzeuger, v.region, v.land, v.jahr, v.art, (WELT.w[v.id] || {}).g || ''].join(' ').toLowerCase().indexOf(q) > -1; });
    zw.textContent = t.length ? t.length + (t.length === 1 ? ' Wein' : ' Weine') + ' in der ganzen Karte' : 'Diesen Wein führt die Karte nicht.';
    l.innerHTML = t.slice(0, 60).map(wfZeile).join('');
  }
  wf.querySelector('input').addEventListener('input', wfZeichne);
  wf.querySelector('.pl7-dlg__zu').onclick = function () { wf.close(); };
  wf.addEventListener('click', function (e) {
    if (e.target === wf) return wf.close();
    var b = e.target.closest('[data-waehle]'); if (!b || !wfGang) return;
    var v = WEINE.filter(function (y) { return y.id === +b.dataset.waehle; })[0], id = wfGang.dataset.gang;
    eigen[id] = v; wahl[id] = 3;
    $$('[data-stufe]', wfGang).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); strich(wfGang);
    wf.close(); tausche(wfGang, v);
  });
  function wfOeffne(gang) {
    wfGang = gang; var e = laufend.filter(function (x) { return x.id === gang.dataset.gang; })[0]; if (!e) return;
    wfR = e.r; wf.querySelector('[data-wf-art]').textContent = 'Wein zu'; wf.querySelector('[data-wf-titel]').textContent = e.n; wf.querySelector('[data-wf-satz]').textContent = R[e.r].warum + ' Oder suchen Sie in der ganzen Karte.';
    wf.querySelector('input').value = ''; wfZeichne(); wf.showModal(); wf.querySelector('[data-wf-liste]').scrollTop = 0;
  }
  var neuAbend = function () {};

  // Runde 4 (Robert 20.10.2026): keine Wahl zwischen Menü und à la carte, kein Feld «zwei Flaschen». Oben die Empfehlung,
  // darunter das Menü Gang für Gang mit seinem Wein, dazu ein Hinweis für das Haus: eine Idee, abhängig vom offenen Ausschank.
  function menuKarte() {
    box.innerHTML = '<div class="pl7-kopf"><p class="mono pl-ueber">Wein zum Menü</p><h2 class="titel pl-h">Zum Essen empfehlen wir <em>den Wein.</em></h2><p class="pl-satz">Das Degustationsmenü von Christian Kuchler, und zu jedem Gang ein Wein aus unserem Keller.</p>' +
      '<div class="pl7-preise">' + [['6', 'das ganze Menü', '295.'], ['5', 'ohne Ocean', '275.'], ['4', 'ohne Ocean und Spätzle', '255.']].map(function (g) { return '<div class="pl7-preis"><b>' + g[0] + '</b><span class="pl7-preis__t"><em>Gänge</em><small>' + esc(g[1]) + '</small></span><span class="pl7-preis__p">CHF ' + g[2] + '</span></div>'; }).join('') + '</div></div>' +
      '<aside class="pl7-idee" aria-label="Hinweis"><span class="pl7-idee__marke mono">Idee</span><p><b>Eine Idee für Sie, nicht für Ihre Gäste.</b> Zu jedem Gang steht hier ein Wein aus Ihrer Karte, gewählt nach klassischen Regeln. Ob es diese Weine glasweise im offenen Ausschank gibt, bestimmen Sie: Was nicht offen ausgeschenkt wird, tauschen wir gegen Ihre Weine im Glas, oder der Gang zeigt die Flasche als Empfehlung.</p></aside>' +
      '<div class="pl7-wand" data-folge></div>' +
      '<p class="pl-quelle">Speisekarte vom 07.10.2026, Weine und Preise aus der Weinkarte September 2026. Die Bilder zeigen, woher der Wein kommt (Vivino, Schweiz: Wikimedia Commons). Welcher Wein zu Ihrem Abend passt, bespricht Fabian Mennel mit Ihnen am Tisch.</p>';
    [].forEach.call(box.querySelectorAll('.pl7-kopf > *'), function (c, j) { auftritt(c, 't', j); }); auftritt(box.querySelector('.pl7-idee'), '', 0);
    function zeichne() {
      if (!WEINE) return;
      laufend = MENUE.map(function (g) { return { id: 'm-' + g.n, n: g.n, z: g.z, r: g.r }; });
      var schon = [];
      laufend.forEach(function (e) { if (!vorrat[e.id]) vorrat[e.id] = drei(e.r, schon); var v = gewaehlt(e.id); if (v) schon.push(v.id); });
      var el = box.querySelector('[data-folge]');
      el.innerHTML = laufend.map(gangHtml).join('');
      $$('.pl7-gang', el).forEach(function (g) { strich(g); [].forEach.call(g.children, function (c, j) { auftritt(c, '', j); }); });
      requestAnimationFrame(function () { requestAnimationFrame(fensterNah); });
    }
    box.addEventListener('click', function (e) {
      var an = e.target.closest('[data-andere]'); if (an) { wfOeffne(an.closest('[data-gang]')); return; }
      var st = e.target.closest('[data-stufe]');
      if (st && !st.disabled) { var gang = st.closest('[data-gang]'), id = gang.dataset.gang, k = +st.dataset.stufe, v = vorrat[id][k]; if (!v || wahl[id] === k) return;
        wahl[id] = k; $$('[data-stufe]', gang).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.stufe === k); }); strich(gang); tausche(gang, v); }
    });
    w.addEventListener('resize', function () { $$('.pl7-gang', box).forEach(strich); });
    oberflaeche.daten = function () { zeichne(); ganzeKarte(); }; zeichne();
    umbau();
  }

  /* Umschalter weg, nach dem Berater ein Fenster, darunter die ganze Karte als Überblick (wie beim Schlössli, in der Form des Hauses) */
  var fensterNah = function () {};
  function umbau() {
    var mitte = d.querySelector('.kb-mitte'); if (mitte) mitte.hidden = true;
    var alt = d.querySelector('.kb-karte'); if (alt) alt.hidden = true;
    var gs = d.getElementById('geschmack') || d.getElementById('lesen'); if (gs.id === 'geschmack') { gs.hidden = false; gs.removeAttribute('data-ansicht-teil'); }
    var fe = d.querySelector('.fenster--keller'), gk = d.getElementById('ganze-karte');
    if (!fe) { fe = d.createElement('section'); fe.className = 'fenster fenster--glas fenster--keller'; fe.setAttribute('aria-label', 'Die ganze Karte');
    fe.innerHTML = '<div class="fenster__huelle"><div class="fenster__steh"><div class="rb fenster__bild"><img src="assets/img/wein/r-ch-ottenberg.webp" alt="Weinberge am Ottenberg bei Weinfelden im Thurgau" style="object-position:50% 60%" loading="lazy" decoding="async"></div><p class="fenster__satz" data-a="t" data-spaet>Die ganze Karte.<br>Vom Ottenberg bis Napa.</p></div></div>';
    gs.parentNode.insertBefore(fe, gs.nextSibling); }
    // Der Satz im Fenster kommt, wenn ein Drittel des Fensters im Bild ist (wie auf der Startseite)
    // Die Hülle des Fensters reicht 100svh nach oben: sie erscheint erst, wenn das Fenster nahe ist, sonst zählt jedes Nachladen darüber als Sprung
    fensterNah = function () { if (fensterNah.an) return; fensterNah.an = true; if ('IntersectionObserver' in w) { var nio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { d.body.classList.add('wp-bereit'); nio.disconnect(); } }, { rootMargin: '120% 0px 120% 0px' }); nio.observe(fe); } else d.body.classList.add('wp-bereit'); };
    if (NUR_KARTE || laufend.length) requestAnimationFrame(function () { requestAnimationFrame(fensterNah); });
    var fs_ = fe.querySelector('[data-spaet]');
    if ('IntersectionObserver' in w && !leise) { var fio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fs_.classList.add('da'); fio.disconnect(); } }); }, { threshold: [0.34] }); fio.observe(fe); } else fs_.classList.add('da');
    if (!gk) { gk = d.createElement('section'); gk.className = 'gk f-kalk'; gk.id = 'ganze-karte'; gk.setAttribute('aria-label', 'Die ganze Weinkarte');
    fe.parentNode.insertBefore(gk, fe.nextSibling); }
    // Ein Gefach im Kopf öffnet sein Land in der ganzen Karte
    $$('.kb-gefach').forEach(function (g) { g.addEventListener('click', function (e) { e.stopImmediatePropagation(); gkLand = g.dataset.land; gkArt = ''; ganzeKarte(); gk.scrollIntoView({ behavior: leise ? 'auto' : 'smooth' }); }, true); });
    ganzeKarte();
  }
  var gkArt = '', gkLand = '', gkQ = '', gkZeit = 0;
  var GK_ARTEN = ['Champagner', 'Schaumwein', 'Weisswein', 'Rosé', 'Rotwein', 'Süsswein'];
  var GK_LAENDER = ['Schweiz', 'Frankreich', 'Italien', 'Deutschland', 'Österreich', 'Spanien', 'USA', 'Australien'];
  // Säulen nach echter Höhe ausgleichen: grösste Karte zuerst in die kürzere Säule; die linke Säule reicht immer bis unten, freie Fläche nur rechts (Robert 20.10.2026).
  // Läuft erneut, wenn Logos oder Schriften nachladen, weil sich die Höhen dann ändern.
  function ausgleichen(gl) {
    if (w.innerWidth <= 760) return;
    $$('.gk__guete', gl).forEach(function (g) {
      var sa = $$('.gk__saeule', g); if (sa.length < 2) return;
      var fuge = parseFloat(getComputedStyle(sa[0]).rowGap) || 0;
      var k = $$('.gk__gut', g).map(function (x) { return [x, x.offsetHeight + fuge]; }).sort(function (a, b) { return b[1] - a[1]; }), h = [0, 0], spalte = [[], []];
      k.forEach(function (x) { var i = h[0] <= h[1] ? 0 : 1; spalte[i].push(x[0]); h[i] += x[1]; });
      if (h[1] > h[0] || (h[1] === h[0] && spalte[1].length > spalte[0].length)) spalte.reverse();
      spalte.forEach(function (sp, i) { sp.forEach(function (x) { if (x.parentNode !== sa[i] || true) sa[i].appendChild(x); }); });
    });
  }
  // Fenster zwischen den Weinarten (Robert 21.10.2026: «zwischen allen Kategorien … ein Fenster … mit einem Bild, was … zu der kommenden Kategorie passt»).
  // Bild: die häufigste Landschaft dieser Art, die nicht schon im Kopf oder in einem Länder-Feld steht; sonst eine aus ihren Ländern, sonst irgendeine noch freie.
  function fensterArt(art, t) {
    if (!t.some(function (y) { return y.art !== art; })) return '';
    var belegt = {}; Object.keys(LANDBILD).forEach(function (l) { var m = /url\(["']?([^"')]+)/.exec(LANDBILD[l] || ''); if (m) belegt[m[1].replace(/-640\.webp$/, '.webp')] = 1; });
    belegt['assets/img/wein/r-ch-ottenberg.webp'] = 1; (fensterArt.schon || []).forEach(function (r) { belegt[r] = 1; });
    var zahl = {}, quelle = {};
    function nimm(liste) { liste.forEach(function (y) { var r = (WELT.w[y.id] || {}).r; if (!r || belegt[r]) return; zahl[r] = (zahl[r] || 0) + 1; if (!quelle[r]) quelle[r] = y; }); }
    var dieser = WEINE.filter(function (y) { return y.art === art; });
    nimm(dieser);
    if (!Object.keys(zahl).length) { var laender = {}; dieser.forEach(function (y) { if (y.land) laender[y.land] = 1; }); nimm(WEINE.filter(function (y) { return laender[y.land]; })); }
    if (!Object.keys(zahl).length) nimm(WEINE.filter(function (y) { return y.land === 'Schweiz'; }));
    var r = Object.keys(zahl).sort(function (a, b) { return zahl[b] - zahl[a]; })[0]; if (!r) return '';
    (fensterArt.schon = fensterArt.schon || []).push(r);
    var q = quelle[r], ort = [gross(q.region), q.land].filter(Boolean).join(' · '), n = dieser.length;
    return '<section class="fenster fenster--glas fenster--art" aria-label="' + esc(art) + '"><div class="fenster__huelle"><div class="fenster__steh"><div class="rb fenster__bild"><img src="' + r + '" alt="" decoding="async"></div>' +
      '<p class="fenster__satz" data-spaet>' + esc(art) + '.<br><span class="fenster__zahl">' + n + (n === 1 ? ' Wein' : ' Weine') + '</span></p></div></div></section>';
  }
  function ganzeKarte() {
    var gk = d.getElementById('ganze-karte'); if (!gk || !WEINE) return;
    if (!gk.firstChild) {
      var je = {}; WEINE.forEach(function (v) { je[v.art] = (je[v.art] || 0) + 1; });
      gk.innerHTML = '<div class="wrap"><header class="gk__kopf"><p class="mono">Weinkarte September 2026</p><h2 class="titel">Die ganze <em>Karte.</em></h2><p>Alle ' + WEINE.length + ' Weine des Hauses, nach Art, Land oder Namen. Ein Klick auf einen Wein zeigt seine Herkunft und seinen Geschmack.</p></header>' +
        '<div class="gk__filter"><div class="gk__wahl" role="group" aria-label="Art"><button type="button" data-gk-art="" aria-pressed="true">Alle<small>' + WEINE.length + '</small></button>' + GK_ARTEN.map(function (a) { return '<button type="button" data-gk-art="' + a + '" aria-pressed="false">' + a + '<small>' + (je[a] || 0) + '</small></button>'; }).join('') + '</div>' +
        '<label class="pl7-suche gk__suche"><svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg><span class="vh">In der Weinkarte suchen</span><input type="search" placeholder="Weingut, Wein oder Jahrgang" autocomplete="off"></label>' +
        '<div class="gk__wahl gk__wahl--land" role="group" aria-label="Land"><button type="button" data-gk-land="" aria-pressed="true">Alle Länder</button>' + GK_LAENDER.map(function (l) { return '<button type="button" data-gk-land="' + l + '" aria-pressed="false">' + (FLAGGE[l] || '') + l + '</button>'; }).join('') + '</div><p class="gk__zahl mono" data-gk-zahl></p></div>' +
        '<div class="gk__liste" data-gk-liste></div></div>';
      [].forEach.call(gk.querySelectorAll('.gk__kopf > *'), function (c, j) { auftritt(c, 't', j); }); auftritt(gk.querySelector('.gk__filter'), '', 2);
      gk.addEventListener('click', function (e) {
        var a = e.target.closest('[data-gk-art]'); if (a) { gkArt = a.dataset.gkArt; ganzeKarte(); return; }
        var l = e.target.closest('[data-gk-land]'); if (l) { gkLand = l.dataset.gkLand; ganzeKarte(); }
      });
      gk.querySelector('input').addEventListener('input', function (e) { gkQ = e.target.value.trim().toLowerCase(); clearTimeout(gkZeit); gkZeit = setTimeout(ganzeKarte, 120); });
    }
    $$('[data-gk-art]', gk).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.gkArt === gkArt); });
    $$('[data-gk-land]', gk).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.gkLand === gkLand); });
    var t = WEINE.filter(function (v) {
      if (gkArt && v.art !== gkArt) return false;
      if (gkLand && v.land !== gkLand) return false;
      if (gkQ && [v.name, v.erzeuger, v.region, v.land, v.jahr, (WELT.w[v.id] || {}).g || ''].join(' ').toLowerCase().indexOf(gkQ) < 0) return false;
      return true;
    });
    gk.querySelector('[data-gk-zahl]').textContent = t.length === WEINE.length ? WEINE.length + ' Weine' : t.length + ' von ' + WEINE.length + ' Weinen';
    // Art → Land → Weingut, in der Reihenfolge der Karte
    var html = '', art = null, land = null, karten = [], gut = null; fensterArt.schon = [];
    // zwei Spalten ohne CSS-Spalten (WebKit stürzte damit ab): Karten nach Zeilenzahl auf zwei Säulen verteilen
    function landZu() { if (!karten.length) return; karten[karten.length - 1] += '</div></article>'; var sp = [[], []], hoehe = [0, 0];
      // Weingüter mit vielen Weinen laufen über die ganze Breite, ihre Zeilen in zwei Spalten; der Rest verteilt sich auf zwei Säulen
      var breit = karten.filter(function (k) { return (k.match(/gk__z/g) || []).length > 14; });
      karten = karten.filter(function (k) { return breit.indexOf(k) < 0; });
      breit.forEach(function (k) { html += k.replace('<article class="gk__gut">', '<article class="gk__gut gk__gut--breit">'); });
      karten.forEach(function (k) { var n = 3 + (k.match(/gk__z/g) || []).length, i = hoehe[0] <= hoehe[1] ? 0 : 1; sp[i].push(k); hoehe[i] += n; });
      if (!karten.length) { karten = []; return; }
      html += '<div class="gk__guete">' + sp.map(function (s) { return '<div class="gk__saeule">' + s.join('') + '</div>'; }).join('') + '</div>'; karten = []; }
    t.forEach(function (v) {
      var ohneGut = !gutname(v) && v.art !== 'Champagner', erz = gutname(v) || (v.art === 'Champagner' ? v.name.split(' ')[0] : kurzname(v)), l = v.land || (v.art === 'Champagner' ? 'Frankreich' : '');
      if (v.art !== art) { landZu(); if (art) html += '</div></div>' + fensterArt(v.art, t); art = v.art; land = null; gut = null; html += '<div class="gk__kat"><h3 class="gk__art"><span>' + esc(art) + '</span></h3><div class="gk__wand">'; }
      if (l !== land) { landZu(); land = l; gut = null; var n = t.filter(function (y) { return y.art === art && (y.land || (y.art === 'Champagner' ? 'Frankreich' : '')) === l; }).length;
        if (l) html += '<div class="gk__land' + (LANDBILD[l] ? '' : ' gk__land--ohne') + '">' + (LANDBILD[l] ? '<span class="gk__land__bild rb"><img src="' + (/url\(["']?([^"')]+)/.exec(LANDBILD[l]) || [])[1] + '" alt="" decoding="async"></span>' : '') + '<div class="gk__land__schild">' + (FLAGGE[l] || '') + '<h4>' + esc(l || 'Ohne Land') + '</h4><span class="mono">' + n + (n === 1 ? ' Wein' : ' Weine') + '</span></div></div>'; }
      if (erz !== gut || !karten.length) {
        if (karten.length) karten[karten.length - 1] += '</div></article>';
        gut = erz; var g = WELT.g[(WELT.w[v.id] || {}).g || ''] || {};
        karten.push('<article class="gk__gut"><header>' + (g.l ? '<span class="gk__logo"><img src="' + esc(g.l) + '" alt="' + esc(erz) + '" decoding="async"></span>' : '<span class="gk__mono">' + esc(erz.replace(/^(Weingut|Domaine|Château|Champagne|Tenuta|Bodega)\s+/i, '').split(/[\s\-&]+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '·') + '</span>') +
          '<h5>' + esc(erz || art) + '</h5><p class="mono">' + esc([gross(v.region), l].filter(Boolean).join(' · ')) + '</p></header><div class="gk__zeilen">');
      }
      karten[karten.length - 1] += '<button type="button" class="kb-z gk__z" data-w="' + v.id + '"><span class="gk__j mono">' + esc(v.jahr) + '</span><span class="gk__n">' + esc(ohneGut ? (v.groesse === '75 cl' ? 'Flasche' : v.groesse === '150 cl' ? 'Magnum' : /^37[.,]5/.test(v.groesse) ? 'Halbe Flasche' : 'Grossflasche') : kurzname(v)) + (v.zusatz ? '<small>' + esc(v.zusatz) + '</small>' : '') + '</span><span class="gk__g mono">' + esc(v.groesse) + '</span><span class="gk__p">' + chf(v.preis) + '</span></button>';
    });
    landZu(); if (art) html += '</div></div>';
    var gl = gk.querySelector('[data-gk-liste]'); gl.innerHTML = html || '<p class="pl-leer">Diesen Wein führt die Karte nicht. Fabian Mennel hilft am Tisch weiter.</p>';
    ausgleichen(gl);
    if (!gl.__lauscht) { gl.__lauscht = true; if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ausgleichen(gl); }); }
    $$('.gk__art, .gk__land', gl).forEach(function (x) { auftritt(x, 't', 0); });
    $$('.fenster--art', gl).forEach(function (fe) { var sz = fe.querySelector('[data-spaet]'); if (!('IntersectionObserver' in w) || leise) { sz.classList.add('da'); return; }
      var fio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sz.classList.add('da'); fio.disconnect(); } }, { threshold: [0.34] }); fio.observe(fe); });
    $$('.gk__gut', gl).forEach(function (g) { auftritt(g, 'gk', 0); });
  }

  if (NUR_KARTE) { oberflaeche.daten = function () { ganzeKarte(); }; umbau(); }
  else if (V === 7) menuKarte();
  else if (V === 1 || V === 6) fragen();
  else if (V === 2) satz();
  else if (V === 3) leiste(false);
  else if (V === 4) leiste(true);
  else if (V === 5) konfig();
  zahlen = $$('[data-pl-zahl]', box);
  sync();
})();
