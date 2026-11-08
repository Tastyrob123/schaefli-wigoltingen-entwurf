/* La Maison · Taverne zum Schäfli (21.10.2026). Quelle für bau.py, nicht die Ausgabe. Vorlage: La Maison der Häuser.
   Gruss, Datum, Empfang «Die Riegelwand» (Vorschau statt Foto, M23), Auftritte, Leiste und der Stand je Werkzeug.
   Stand nur aus den Werkzeugen selbst (nichts geschätzt): Wege als Daten in der Seite (#maison-wege); ein Weg darf eine Liste sein
   (antwortet der erste nicht, gilt der nächste). Werte gehen nur als Zahl in die Seite. Antwortet ein Werkzeug nicht: Satz ohne Zahl. */
(function () {
  'use strict';
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ganz = function (x) { var n = parseInt(x, 10); return isFinite(n) && n > 0 ? n : 0; };
  var n = function (x) { return Number(x || 0).toLocaleString('de-CH'); };
  var setze = function (key, html) { $$('[data-stand="' + key + '"]').forEach(function (el) { el.innerHTML = html; }); };
  var zahl = function (key, wert) { $$('[data-zahl="' + key + '"]').forEach(function (el) { el.textContent = wert; }); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Gruss und Datum (M03); ?gruss=morgen|tag|abend für Standbilder */
  var h = new Date().getHours();
  var fest = { morgen: 8, tag: 13, abend: 20 }[(/[?&]gruss=(morgen|tag|abend)/.exec(location.search) || [])[1]]; if (fest) h = fest;
  $('#gruss').textContent = h >= 5 && h < 11 ? 'Guten Morgen.' : h >= 11 && h < 18 ? 'Guten Tag.' : 'Guten Abend.';
  $('#datum').textContent = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* Buchstaben rollen nur in den Namen der Leiste (M01) */
  $$('.rl').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (z, i) { return '<b style="--n:' + i + '">' + esc(z) + '</b>'; }).join('');
  });

  /* Leiste: die Namen der Werkzeuge stehen nur, wenn sie ganz Platz haben (Robert 19.10.2026 23:43) */
  var passt = function () {
    var o = $('.m-oben'), i = $('.m-insel'), w = $('.m-insel__wege'), r = $$('.m-oben__ecke'); if (!o || !i || !w) return;
    o.classList.remove('eng');
    var rechts = r.length ? r[r.length - 1].getBoundingClientRect().left : innerWidth;
    var links = r.length > 1 && getComputedStyle(r[0]).display !== 'none' ? r[0].getBoundingClientRect().right : 0;
    var b = i.getBoundingClientRect();
    if (i.scrollWidth > i.clientWidth + 1 || b.right > rechts - 12 || b.left < links + 12) o.classList.add('eng');
  };
  passt(); addEventListener('resize', passt); if (document.fonts && document.fonts.ready) document.fonts.ready.then(passt);
  /* Leiste: weg beim Hinunterscrollen, zurück beim Hochscrollen */
  var oben = $('.m-oben'), letzt = 0;
  addEventListener('scroll', function () {
    var y = scrollY; if (Math.abs(y - letzt) < 6) return;
    oben.classList.toggle('weg', y > letzt && y > 160); letzt = y;
  }, { passive: true });

  var rahmen = $('.hz-rahmen'), empfang = $('.m-empfang');

  /* Auftakt: der Empfang kommt herauf, wenn das Ruhebild dekodiert ist (höchstens 1,4 s), nie mit leerem Bildschirm */
  (function () {
    if (!empfang) return;
    var los = function () { empfang.classList.add('bereit'); };
    var uhr = setTimeout(los, 1400), r = $('.hz-bild--ruhe');
    (r && r.decode ? r.decode() : Promise.resolve()).catch(function () {}).then(function () { clearTimeout(uhr); requestAnimationFrame(los); });
  })();

  /* M23: in Ruhe das Haus unter dem Himmel; Zeiger oder Tastatur-Fokus auf einer Zeile zeigt links die echte Vorschau dieses Werkzeugs.
     Erst entpacken, dann zeigen (M16). Verlässt der Zeiger die Tafel, kommt die Ruhe-Ansicht zurück. Nichts bewegt sich, nur Deckkraft. */
  var Z = $$('.hz-z a'), B = $$('[data-vorschau]'), U = $$('.hz-unter span'), jetzt = 'ruhe', will = 'ruhe';
  var stueck = function (i) { return B.filter(function (b) { return b.getAttribute('data-vorschau') === String(i); })[0]; };
  var zeige = function (i) {
    will = i; if (i === jetzt) return;
    var el = stueck(i); if (!el) { el = stueck('ruhe'); i = 'ruhe'; }
    if (!el) { Z.forEach(function (z, j) { z.classList.toggle('an', j === will); }); jetzt = will; return; }   /* Fassung ohne Rahmen: nur die Zeile markieren */
    if (el.tagName === 'IMG' && el.loading === 'lazy') el.loading = 'eager';
    var fertig = function () {
      if (will !== i && !(i === 'ruhe' && will === 'ruhe')) return;
      B.forEach(function (b) { b.classList.toggle('an', b === el); });
      U.forEach(function (u) { u.classList.toggle('an', u.getAttribute('data-vorschau') === String(i)); });
      Z.forEach(function (z, j) { z.classList.toggle('an', j === i); });
      jetzt = i;
    };
    (el.tagName === 'IMG' && el.decode ? el.decode() : Promise.resolve()).then(fertig, fertig);
  };
  var tafel = $('.hz-tafel');
  if (tafel) tafel.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') zeige('ruhe'); });
  Z.forEach(function (z, i) {
    z.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') zeige(i); });
    z.addEventListener('focus', function () { zeige(i); });
    z.addEventListener('blur', function () { setTimeout(function () { if (!tafel.contains(document.activeElement)) zeige('ruhe'); }, 0); });
  });
  /* die Vorschauen laden still nach, sobald das Ruhebild da ist */
  setTimeout(function () { B.forEach(function (b) { if (b.tagName === 'IMG' && b.loading === 'lazy') { b.loading = 'eager'; b.addEventListener('load', function () { if (b.decode) b.decode().catch(function () {}); }, { once: true }); } }); }, 400);

  /* Taste 1 bis 6 öffnet das Werkzeug der Zeile (M12), still, solange der Rundgang offen ist */
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.rdg-karte')) return;
    var z = Z[+e.key - 1]; if (z) { zeige(+e.key - 1); z.classList.add('gedrueckt'); setTimeout(function () { location.href = z.href; }, 180); }
  });

  /* Auftritte: jedes Stück fährt los, wenn ein Fünftel davon im Bild ist; nach oben weit offen (wer springt, überspringt nichts) */
  var wecke = function (el) { (el.tagName === 'IMG' ? [el] : $$('img[loading="lazy"]', el)).forEach(function (i) { if (!i.complete || !i.naturalWidth) i.loading = 'eager'; }); };
  var fuenftel = function (e) { return e.isIntersecting && (e.intersectionRatio >= 0.2 || e.intersectionRect.height >= innerHeight * 0.2); };
  var alle = $$('[data-r]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (fuenftel(e)) { e.target.classList.add('da'); wecke(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '100000px 0px 0px 0px', threshold: [0, 0.05, 0.1, 0.15, 0.2] });
    alle.forEach(function (el) { io.observe(el); });
    var band = $('[data-laufband]');
    if (band) new IntersectionObserver(function (es) { band.classList.toggle('laeuft', es[0].isIntersecting && !ruhig); }).observe(band);
    var punkte = {};
    $$('.m-insel__p').forEach(function (a) { punkte[a.getAttribute('href').slice(1)] = a; });
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = punkte[e.target.id]; if (a) a.classList.toggle('an', e.isIntersecting); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    Object.keys(punkte).forEach(function (id) { var s = document.getElementById(id); if (s) sio.observe(s); });
  } else {
    alle.forEach(function (el) { el.classList.add('da'); });
  }

  /* ---------------- Stand je Werkzeug ---------------- */
  var WEGE = {}; try { WEGE = JSON.parse($('#maison-wege').textContent) || {}; } catch (e) {}
  var hole = function (k) {
    var w = [].concat(WEGE[k] || []).filter(Boolean);
    var weiter = function (i) {
      return i >= w.length ? Promise.reject(new Error('kein Weg')) : fetch(w[i], { cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
        .then(function (d) { return d && typeof d === 'object' ? d : Promise.reject(new Error('leer')); })
        .catch(function () { return weiter(i + 1); });
    };
    return weiter(0);
  };
  var tag = function (s) { var d = new Date(String(s).replace(' ', 'T')); return isNaN(d) ? '' : d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  /* Speicher des Stamms (_Werkzeuge/unterbau): {live, entwurf, kennung_live, kennung_entwurf, offen} */
  var stamm = function (d) { return d && ('kennung_live' in d || 'kennung_entwurf' in d) ? d : null; };
  var BSP = '<span class="bsp">Beispiel</span>';
  var BEISPIEL = []; try { BEISPIEL = JSON.parse($('#maison-beispiel').textContent) || []; } catch (e) {}   /* Werkzeuge, die in der Demo Beispieldaten zeigen (R20) */

  /* Le Bureau: {aenderungen, zuletzt:{zeit}, bereiche, seiten} oder Stand des Stamms */
  hole('bureau').then(function (u) {
    var s = stamm(u), a = s ? (s.offen ? ganz(s.offen) || 1 : 0) : ganz(u.aenderungen), zul = !s && u.zuletzt && u.zuletzt.zeit ? tag(u.zuletzt.zeit) : '';
    if (!s && Array.isArray(u.bereiche) && u.bereiche.length) zahl('bereiche', u.bereiche.length);
    if (!s && ganz(u.seiten)) zahl('seiten', ganz(u.seiten));
    setze('bureau-kurz', a ? '<b>' + a + ' im Entwurf</b>' : (zul ? 'Veröffentlicht ' + esc(zul) : 'Alles veröffentlicht'));
    setze('bureau', (a ? '<b>' + a + (a > 1 ? ' Änderungen' : ' Änderung') + ' im Entwurf.</b> ' : 'Nichts offen im Entwurf. ') + (zul ? 'Zuletzt veröffentlicht am ' + esc(zul) + '.' : ''));
  }).catch(function () { setze('bureau-kurz', 'Website des Hauses'); setze('bureau', 'Der Stand ist gerade nicht abrufbar.'); });

  /* La Carte: {karten:[{entwurf, pdf_zeit}]} oder Stand des Stamms */
  hole('carte').then(function (d) {
    var s = stamm(d);
    if (s) { var o = ganz(s.offen); setze('carte-kurz', o || s.offen === true ? '<b>Entwurf wartet</b>' : 'Alle Karten veröffentlicht'); return; }
    var k = Array.isArray(d.karten) ? d.karten : null; if (!k) throw new Error('ohne Karten');
    var e = k.filter(function (x) { return x && x.entwurf; }).length;
    zahl('karten', k.length); zahl('entwurf', e);
    setze('carte-kurz', e ? '<b>' + e + ' im Entwurf</b>' : k.length + (k.length === 1 ? ' Karte, veröffentlicht' : ' Karten, alle veröffentlicht'));
  }).catch(function () { setze('carte-kurz', 'Karten des Hauses'); });

  /* L’Imprimerie: Liste der Vorlagen [{art, zahl}] (M17) */
  hole('imprimerie').then(function (l) {
    var liste = Array.isArray(l) ? l : Array.isArray(l.vorlagen) ? l.vorlagen : null; if (!liste || !liste.length) throw new Error('leer');
    var z = 0, arten = {}; liste.forEach(function (x) { z += ganz(x && x.zahl) || 1; if (x && x.art) arten[String(x.art)] = 1; });
    var a = Object.keys(arten).length;
    setze('imprimerie-kurz', z + ' Vorlagen' + (a ? ' in ' + a + (a === 1 ? ' Art' : ' Arten') : ''));
  }).catch(function () { setze('imprimerie-kurz', 'Vorlagen, druckfertig'); });

  /* La Réception: {anfragen_neu, anfragen_offen, ohne_antwort, fragen_gesamt} */
  hole('reception').then(function (r) {
    var u = {}; ['anfragen_neu', 'anfragen_offen', 'ohne_antwort', 'fragen_gesamt'].forEach(function (k) { u[k] = ganz(r[k]); });
    var t = [];
    if (u.anfragen_neu) t.push('<b>' + u.anfragen_neu + (u.anfragen_neu === 1 ? ' neue Anfrage' : ' neue Anfragen') + '</b>');
    else if (u.anfragen_offen) t.push(u.anfragen_offen + (u.anfragen_offen === 1 ? ' Anfrage offen' : ' Anfragen offen'));
    if (u.ohne_antwort) t.push('<b>' + u.ohne_antwort + (u.ohne_antwort === 1 ? ' Frage ohne Antwort' : ' Fragen ohne Antwort') + '</b>');
    var kurz = t.length ? t.join(' · ') : 'Nichts offen';
    setze('reception-kurz', kurz + (r.beispiel || BEISPIEL.indexOf('reception') >= 0 ? '\u00a0· ' + BSP : ''));
    setze('reception', t.length ? kurz : 'Nichts offen · ' + u.fragen_gesamt + (u.fragen_gesamt === 1 ? ' Frage' : ' Fragen') + ' bisher');
  }).catch(function () { setze('reception-kurz', 'Chat auf der Website'); setze('reception', '&nbsp;'); });

  /* Le Livre: stand:{fotos, dateien, ki, ue} */
  hole('livre').then(function (d) {
    var s = d.stand || {}, f = ganz(s.fotos), da = ganz(s.dateien), ki = ganz(s.ki), ue = ganz(s.ue);
    if (!f && !da) throw new Error('leer');
    setze('livre-kurz', f + ' Fotos · ' + da + ' Dateien');
    var dazu = [ki ? ki + ' mit KI erzeugt' : '', ue ? ue + ' nachgeschärft' : ''].filter(Boolean);
    setze('livre', f + ' Fotos in fertigen Grössen' + (dazu.length ? ', davon ' + dazu.join(' und ') + ', alle gekennzeichnet' : '') + '. ' + da + ' Dateien für Agenturen und Druckereien.');
  }).catch(function () { setze('livre-kurz', 'Fotos, Dateien, Markenprüfung'); setze('livre', '&nbsp;'); });

  /* Le Registre: {summe:{heute, besuche, seiten, laender, buchung}, je_tag:[…], tage, beispiel, leer} */
  hole('registre').then(function (m) {
    var u = m.summe || {}, bs = ganz(u.besuche), jt = Array.isArray(m.je_tag) && m.je_tag.length ? m.je_tag[m.je_tag.length - 1] : null;
    var heute = jt && isFinite(Number(jt.besuche)) ? Number(jt.besuche) : (isFinite(Number(u.heute)) ? Number(u.heute) : null);
    var res = jt && isFinite(Number(jt.buchung)) ? Number(jt.buchung) : null;
    setze('registre-heute', heute == null ? '–' : n(heute));
    setze('registre-buchung', res == null ? '–' : n(res));
    if (m.beispiel) $$('.m-zeile').forEach(function (z) { z.classList.add('beispiel'); var b = $('.m-zeile__bsp', z); if (b) b.hidden = false; });
    setze('registre-kurz', m.leer || !bs ? 'Noch keine Besuche gezählt' : n(bs) + (bs === 1 ? ' Besuch' : ' Besuche') + ' in ' + n(ganz(m.tage)) + ' Tagen' + (m.beispiel ? '\u00a0· ' + BSP : ''));
    zahl('reg-besuche', bs ? n(bs) : '–'); zahl('reg-seiten', ganz(u.seiten) ? n(u.seiten) : '–'); zahl('reg-laender', ganz(u.laender) ? n(u.laender) : '–');
    /* Der Weg zum Tisch (Weg des Gastes, Robert 18.10.2026 Fassung C): Besuche → Fenster «Reservation» → Zenchef oder Anfrage ans Haus → reserviert */
    /* Demo-Check 21.10.2026: dieselbe Rechnung wie «Der Weg zum Tisch» im Besucherbuch (registre.js trichter): abbruch.von = «Ihr Abend» begonnen,
       davon ohne Abbruch = Tischkarte angefragt oder reserviert; wer gleich «Tisch reservieren» wählt (booking.zahl), geht an «Ihr Abend» vorbei */
    var w = m.werte || {}, ab = w.abbruch || {}, fen = ganz(ab.von), wei = Math.max(0, fen - ganz(ab.zahl)), bk = ganz((w.booking || {}).zahl);
    var ant = function (t, g) { return g ? Math.round(100 * t / g) + ' % davon' : ''; };
    $$('[data-wg]').forEach(function (el) {
      var k = el.getAttribute('data-wg');
      if (k === 'besuche') el.textContent = bs ? n(bs) : '–';
      if (k === 'fenster') el.textContent = fen ? n(fen) : '–';
      if (k === 'weiter') el.textContent = wei ? n(wei) : '–';
      if (k === 'besuche-satz') el.textContent = 'auf der Website, in ' + n(ganz(m.tage) || 30) + ' Tagen' + (m.beispiel ? ' · Beispiel' : '');
      if (k === 'fenster-satz') el.textContent = fen ? ant(fen, bs) : 'Noch nichts gezählt';
      if (k === 'weiter-satz') el.textContent = wei ? ant(wei, fen) + (bk ? ', dazu ' + (bk === 1 ? 'einmal' : n(bk) + ' Mal') + ' gleich «Tisch reservieren» bei Zenchef' : '') : 'Noch nichts gezählt';
    });
    setze('besuche', m.leer ? 'Noch keine Besuche gezählt.' : (m.beispiel ? 'Beispielwerte, bis die Website echte Besuche zählt · ' : '') + 'letzte ' + n(ganz(m.tage)) + ' Tage');
  }).catch(function () { setze('registre-kurz', 'Besuche ohne Namen'); setze('besuche', 'Die Zählung ist gerade nicht abrufbar.'); setze('registre-heute', '–'); setze('registre-buchung', '–'); });

  window.MAISON_BEREIT = true;   /* Startfehler-Tür (R04): ohne dieses Zeichen öffnet fehler.js die Tür */
})();
