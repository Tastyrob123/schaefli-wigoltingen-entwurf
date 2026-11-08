/* La Carte · Taverne zum Schäfli Wigoltingen — Satz der Karte (21.10.2026, Kopie aus der Tafel der Wirtschaft am Schlössli, dort aus Gasterntal,
   Ruedihus und Doldenhorn). Eine Datei für drei Stellen: die Vorschau im Werkzeug, die Druckseite (PDF) und die Prüfung im Rundlauf (node).
   Die Karte liegt als Baum aus dem Satz vor, den satz_bau.py aus den Daten des Hauses setzt (einlesen.py): Seiten, Elemente mit ihren Merkmalen,
   Texte und feste Teile (Lamm, Flaggen). Aus denselben Daten entsteht hier Zeichen für Zeichen dasselbe HTML wie in satz/u-<karte>.html
   (geprüft mit pruefe.py rund). Gestalten (Fortgeschritten) legt sich als Stil über ein Element, ohne den Satz zu ändern.
   Mittagsmenü (C08) in der Form des Hauses: Prolog und vier Gänge, ein Preis, je Woche (Teil MITTAG unten). Ohne Bibliothek. */
(function (G) {
  'use strict';
  var A = '', Z = '', M0 = '', M1 = '', M2 = '';
  var ZEICHEN = { ZEICHEN: '', WORTMARKE: '' };
  var LEER_TAG = { img: 1, br: 1, hr: 1, meta: 1, link: 1, input: 1, wbr: 1, col: 1, source: 1 };
  var BLOCK = { p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, li: 1, div: 1, section: 1 };

  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }   // html.escape()
  function wahr(x) { return !(x === null || x === undefined || x === false || x === '' || x === 0 || (Array.isArray(x) && !x.length)); }

  /* ---------------------------------------------------------------- Gestalten (Fortgeschritten), wie La Carte des Grand Beau-Rivage und des Carlton:
     lage = { x, y (mm), s (Faktor) · f Schrift · t Schriftgrösse (Faktor) · a Textart · c Farbe · al Ausrichtung · z Zeilenabstand · mt, mb (mm) · aus ·
     lin {x, y, b, d, c, aus} } an einem Element. Verschoben per transform (Ursprung oben links), der Satz bleibt. Ohne lage ist das HTML das alte. */
  function zahl(x) { return String(Math.round((+x || 0) * 100) / 100); }
  var SCHRIFT = { titel: "Petrona,Georgia,serif", instrument: "'Instrument Sans',Arial,sans-serif", mono: "'DM Mono',Menlo,monospace" };
  // Farben des Hauses (website/assets/css/schaefli.css :root): Tinte, Titel, Ochsenblut, Gold, Kalk
  var FARBE = { tinte: '#2A292B', titel: '#64362E', riegel: '#7D433A', tief: '#301916', dunkel: '#452520', gold: '#B38346', goldh: '#D3B794', goldt: '#815E32', kalk: '#F5F3EF', papier: '#FBF8F2', weiss: '#ffffff' };
  var ALIGN = { links: ['left', 'flex-start'], mitte: ['center', 'center'], rechts: ['right', 'flex-end'] };
  function lageStil(l) {
    if (!l) return '';
    var x = +l.x || 0, y = +l.y || 0, sk = +l.s || 1;
    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05 && Math.abs(sk - 1) < 0.005) return '';
    return 'transform:translate(' + x.toFixed(2) + 'mm,' + y.toFixed(2) + 'mm)' + (Math.abs(sk - 1) >= 0.005 ? ' scale(' + sk.toFixed(3) + ')' : '') + ';transform-origin:0 0';
  }
  function gestalt(l) {
    var st = [], at = '';
    if (!l || typeof l !== 'object') return ['', ''];
    var tr = lageStil(l); if (tr) st.push(tr);
    if (l.aus) st.push('visibility:hidden');
    if (SCHRIFT[l.f]) { st.push('--gf:' + SCHRIFT[l.f]); at += ' data-gf=""'; }
    if (FARBE[l.c]) { st.push('--gc:' + FARBE[l.c]); at += ' data-gc=""'; }
    if (/^(normal|kursiv|versal|medium)$/.test(l.a || '')) at += ' data-ga="' + l.a + '"';
    if (ALIGN[l.al]) { st.push('--gal:' + ALIGN[l.al][0] + ';--gai:' + ALIGN[l.al][1]); at += ' data-gal=""'; }
    if (+l.z) { st.push('--gz:' + zahl(+l.z)); at += ' data-gz=""'; }
    if (+l.t && Math.abs(+l.t - 1) > 0.004) at += ' data-gt="' + zahl(+l.t) + '"';
    if (l.mt != null && l.mt !== '') st.push('margin-top:' + zahl(+l.mt) + 'mm');
    if (l.mb != null && l.mb !== '') st.push('margin-bottom:' + zahl(+l.mb) + 'mm');
    if (l.lin && typeof l.lin === 'object') at += ' data-lin-l="' + [zahl(l.lin.x), zahl(l.lin.y), zahl(l.lin.b), zahl(l.lin.d), FARBE[l.lin.c] || '', l.lin.aus ? 1 : 0].join(',') + '"';
    return [st.join(';').replace(/"/g, "'"), at];
  }
  function oeffne(tag, at, data, stil, mehr) {   // öffnendes Tag, um data-n, Stil und Merkmale ergänzt
    var innen = '<' + tag + at;
    if (stil) { if (/ style="/.test(innen)) innen = innen.replace(/ style="([^"]*)"/, function (m, a) { return ' style="' + a + (a && !/;$/.test(a) ? ';' : '') + stil + '"'; }); else innen += ' style="' + stil + '"'; }
    if (data) innen += ' data-n="' + data + '"';
    if (mehr) innen += mehr;
    return innen + '>';
  }

  /* ---------------------------------------------------------------- Was ein Element auf der Karte ist (für die Liste im Modus «Einfach»)
     eintrag: ein Gericht, Wein, eine Behandlung, ein Menu, eine Zeile mit Preis · rubrik: Überschrift einer Gruppe · zwischen: Zwischentitel ·
     titel: Titel einer Seite · text: Absatz · null: Behälter (die Liste geht hinein) · fest: gehört zum Rahmen der Seite (Fusszeile, Bild) */
  /* Gasterntal (Satz _werkbank/satz_daten.py): re Getränk mit Preisspalten · po Gericht mit Übersetzung und Preisen · rubrik Rubrik ·
     zw Zwischentitel (Weisse, Rote, Rosé) · h3 im Kasten Jugendschutz Zwischentitel · Absätze des Deckels, der Rubriken und des Kastens Text */
  var EINHEIT = /(^| )(sb-g|sb-m|sb-wein|sb-person)( |$)/;   // Schäfli 21.10.2026: Bausteine des Satzes (satz_bau.py): Gericht, Gang, Wein, Person
  var KIND_EINHEIT = /(^| )(nie-vorhanden)( |$)/;   // Kinder dieser Behälter sind je ein Eintrag (im Schäfli keine)
  var RUBRIK = /(^| )(sb-h|sb-band|sb-wart)( |$)/;
  var ZWISCHEN = /(^| )(sb-gut|sb-land|sb-region)( |$)/;
  var FEST = /(^| )(ts-kopf|ts-weiter|sb-orn|sb-luft|sb-zeichen|sb-gang|sb-chf)( |$)/;   // Rahmen der Seite: Name des Hauses, Lamm, Goldstriche, laufender Kopf
  function klasse(n) { var m = /\sclass="([^"]*)"/.exec(n.a[1] || ''); return m ? m[1] : ''; }
  function art(n, eltern) {
    if (!n || typeof n !== 'object' || n.fn !== 'el') return null;
    var tag = n.a[0], kl = klasse(n), ek = eltern ? klasse(eltern) : '';
    if (tag === 'footer' || tag === 'img' || tag === 'svg' || FEST.test(kl)) return 'fest';
    if (EINHEIT.test(kl) || (eltern && eltern.fn === 'el' && KIND_EINHEIT.test(ek) && tag === 'div')) return 'eintrag';
    if (RUBRIK.test(kl)) return 'rubrik';
    if (ZWISCHEN.test(kl) || (tag === 'h3' && !kl)) return 'zwischen';
    if (/^h[12]$/.test(tag)) return 'titel';
    if (/^(p|h3|h4|li)$/.test(tag) && textVon(n).trim() && !/(^| )stern( |$)/.test(kl)) return 'text';
    if (tag === 'ul') return 'text';
    return null;
  }
  function textVon(x) {
    if (typeof x === 'string') return x;
    if (x && x.fn === 'el') return x.a.slice(2).map(textVon).join('');
    if (x && x.fn === 'seite') return x.a.slice(1).map(textVon).join('');
    return '';
  }
  /* Die Texte eines Eintrags mit Namen (für das Fenster «bearbeiten»): [{pfad (relativ zum Eintrag), name, wert, preis}] */
  var LEISE = /^[\s·*|–\-]*$/;
  function feldName(tag, kl, kette, i, art0) {
    var in_ = function (re) { return kette.some(function (k) { return re.test(k); }); };
    var preisSpalte = /^(span|b) .*\b(rk|pz)\b|^span (rk|pz)$/;
    if (tag === 'h1') return 'Titel';
    // Schäfli 21.10.2026: Felder der Bausteine (satz_bau.py)
    if (/(^| )sb-pn( |$)/.test(kl)) return 'Name';
    if (/(^| )sb-pr( |$)/.test(kl)) return 'Rolle';
    if (/(^| )sb-rn( |$)/.test(kl)) return 'Nummer';
    if (/(^| )sb-hinweis( |$)/.test(kl)) return 'Hinweis';
    if (tag === 'span' && in_(/^h3 sb-land/)) return 'Land';
    if (tag === 'small' && in_(/^p sb-p/)) return 'Währung';
    if (tag === 'p' && /(^| )sb-n( |$)/.test(kl)) return 'Name';
    if (tag === 'p' && /(^| )(sb-gruss|sb-satz|sb-unter|sb-zeiten)( |$)/.test(kl)) return 'Text';
    if (/(^| )sb-mp( |$)/.test(kl)) return 'Preis';                            // Lästermeile: Preis am Namen
    if (tag === 'b' && in_(/^p sb-menupreis/)) return 'Preis';                // Bankett: Menüpreis
    if (tag === 'em' && in_(/^p sb-p/)) return 'Angabe';                      // «Hauptgang» vor dem zweiten Preis
    if (tag === 'b' && in_(/^p sb-p/)) return 'Preis';
    if (/(^| )sb-w( |$)/.test(kl)) return 'Hinweis';                          // «(20 MIN. WARTEZEIT)»
    if (tag === 'p' && /(^| )sb-t( |$)/.test(kl)) return 'Beschreibung';
    if (tag === 'span' && in_(/^div sb-wein/)) return { j: 'Jahrgang', n: 'Name', f: 'Angabe', p: 'Preis', d: 'Beschreibung' }[kl] || 'Text';
    if (tag === 'em' && in_(/^span (rk|pz)$/)) return 'Angabe';             // 33cl, Cüpli, Flasche, Portion, pro Person, Kinder
    if (tag === 'b' && in_(/^h2/)) return 'Spaltenkopf';                     // 3dl 5dl 1,5 Liter über der Rubrik
    if (tag === 'b' && in_(/^span (rk|pz)$/)) return 'Preis';
    if (tag === 'small' && /(^| )jg( |$)/.test(kl)) return 'Jahrgang';                // Schlössli: Jahrgang der Weine
    if (tag === 'small' && in_(/^h2/)) return 'Zusatz';                      // Gäng guet «ab 2 Personen»
    if (tag === 'span' && in_(/^h2/) || tag === 'h2') return art0 === 'rubrik' ? 'Rubrik' : 'Überschrift';
    if (tag === 'small') return 'Zusatz';                                    // «mit und ohne», «A. Mathier», Glacesorten
    if (tag === 'span' && /(^| )re__n( |$)/.test(kl)) return 'Name';
    if (tag === 'h4') return 'Name';
    if (tag === 'p' && /(^| )fr( |$)/.test(kl)) return 'Übersetzung';        // englische Zeile
    if (tag === 'h3') return 'Zwischentitel';
    if (tag === 'b') return 'Hervorgehoben';
    if (tag === 'p' && in_(/^div po__t/)) return 'Beschreibung';             // deutsche Zeile unter dem Namen
    return 'Text';
  }
  /* ---- Schlössli 20.10.2026: Kapitälchen und Kürzel wie website/_werkbank/satz_daten.py (_kk, kuerzel) ---- */
  function istKl(y) { return y && y.fn === 'el' && y.a[0] === 'span' && klasse(y) === 'kl'; }
  function istKap(x) { return false; }   // Schäfli: keine Kapitälchen im Satz (Namen stehen als ganzer Text, Versalien wie auf der Karte des Hauses)
  function kapText(x) { return x.a.slice(2).map(function (y) { return typeof y === 'string' ? y : istKl(y) ? y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('') : ''; }).join('').replace(/\s+/g, ' ').trim(); }
  function kapBau(t, nurErstes) {   // _kk(): erster Buchstabe gross, Rest des Worts in span.kl; bei Namen nur das erste Wort, danach jedes Wort ganz in span.kl
    var aus = [], erstes = true;
    t.split(' ').forEach(function (w) {
      if (!w) return;
      var i = -1; for (var k = 0; k < w.length; k++) if (/\p{L}/u.test(w[k])) { i = k; break; }
      if (aus.length) aus.push(' ');
      if (i < 0) aus.push(w);
      else if (nurErstes && !erstes) aus.push({ fn: 'el', a: ['span', ' class="kl"', w.toUpperCase()] });
      else { aus.push(w.slice(0, i + 1).toUpperCase()); if (w.slice(i + 1)) aus.push({ fn: 'el', a: ['span', ' class="kl"', w.slice(i + 1).toUpperCase()] }); }
      erstes = false;
    });
    var z = []; aus.forEach(function (y) { if (typeof y === 'string' && typeof z[z.length - 1] === 'string') z[z.length - 1] += y; else z.push(y); });   // Texte zusammen wie im HTML
    return z;
  }
  var KUERZEL_ROH = {}, KUERZEL_TRENN = null;   // Vorlagen aus dem Satz selbst: Blatt-Zeichen von VEG/OVEG und das Trennzeichen, wie die Werkbank sie gerade setzt
  function istKuerzel(x) { return x && x.fn === 'el' && /^(p|span|sup)$/.test(x.a[0]) && /(^| )(sb-k|sb-kz)( |$)/.test(klasse(x)); }
  function istVeg(y) { return y && y.fn === 'el' && /(^| )sb-veg( |$)/.test(klasse(y)); }
  function istTrenn(y) { return y && y.fn === 'el' && y.a[0] === 'i'; }
  function merkKuerzel(x) {
    x.a.slice(2).forEach(function (y) {
      if (istTrenn(y) && !KUERZEL_TRENN) KUERZEL_TRENN = JSON.parse(JSON.stringify(y));
      if (istVeg(y)) { var r = y.a.slice(2).filter(function (z) { return z && z.fn === 'roh'; })[0], t = y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join(''); if (r && t) KUERZEL_ROH[t] = { tag: y.a[0], at: y.a[1], roh: r }; }
    });
  }
  function kuerzelText(x) {
    var aus = [];
    for (var i = 2; i < x.a.length; i++) { var y = x.a[i]; if (y && y.fn === 'el' && y.a[0] === 'br') break; if (typeof y === 'string') aus.push(y); else if (istVeg(y)) aus.push(y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('')); }
    return aus.join('/');
  }
  function kuerzelBau(t) {
    var aus = [];
    t.split('/').map(function (w) { return w.trim(); }).filter(Boolean).forEach(function (w, i) {
      if (i) aus.push(KUERZEL_TRENN ? JSON.parse(JSON.stringify(KUERZEL_TRENN)) : { fn: 'el', a: ['i', ' class="sb-ab"', ' '] });
      var v = KUERZEL_ROH[w];
      aus.push(v ? { fn: 'el', a: [v.tag, v.at, JSON.parse(JSON.stringify(v.roh)), w] } : w);
    });
    return aus;
  }
  function istNb(x) { return x && x.fn === 'el' && x.a[0] === 'span' && /(^| )dh-nb( |$)/.test(klasse(x)); }
  function istZ(x) { return x && x.fn === 'el' && x.a[0] === 'span' && /(^| )z( |$)/.test(klasse(x)); }
  function istBild(x) { return x && x.fn === 'el' && x.a[0] === 'img'; }
  function felder(n, art0) {
    var aus = [], zahl0 = {};
    var nimm = function (f) { zahl0[f.name] = (zahl0[f.name] || 0) + 1; aus.push(f); };
    (function geh(x, pfad, kette) {
      if (typeof x === 'string') {
        if (LEISE.test(x) && x !== '') return;
        var e = kette[kette.length - 1] || {};
        nimm({ pfad: pfad, name: feldName(e.tag, e.kl, kette.map(function (k) { return k.tag + ' ' + k.kl; }), aus.length, art0), wert: x });
        return;
      }
      if (!x || x.fn !== 'el') return;
      // Schlössli 20.10.2026: Name oder Rubrik in Kapitälchen (Buchstaben verteilt auf Text und span.kl): ein Feld für den ganzen Wortlaut
      if (istKap(x)) {
        nimm({ pfad: pfad, name: /(^| )sb-n( |$)/.test(klasse(x)) ? 'Name' : 'Rubrik', wert: kapText(x), kap: /(^| )sb-n( |$)/.test(klasse(x)) ? 1 : 2 });
        x.a.slice(2).forEach(function (y, i) { if (y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y))) geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), kette.concat([{ tag: x.a[0], kl: klasse(x) }])); });
        return;
      }
      // Kürzel des Hauses (VEG/G/L …), gesetzt mit Punkten und Blatt-Zeichen: ein Feld, geschrieben mit «/» wie auf der Karte des Hauses
      if (istKuerzel(x)) {
        merkKuerzel(x);
        nimm({ pfad: pfad, name: 'Allergene', wert: kuerzelText(x), kuerzel: true });
        x.a.slice(2).forEach(function (y, i) { if (y && y.fn === 'el' && /(^| )sb-w( |$)/.test(klasse(y))) geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), kette.concat([{ tag: x.a[0], kl: klasse(x) }])); });
        return;
      }
      // Name eines Gerichts mit den Zeichen des Hauses am letzten Wort (satz_daten.py name_mit_zeichen): ein Feld für den ganzen Namen
      if (x.a[0] === 'h4' && x.a.slice(2).some(istNb)) {
        nimm({ pfad: pfad, name: 'Name', wert: x.a.slice(2).map(function (y) { return istNb(y) ? y.a.slice(2).filter(function (z) { return typeof z === 'string'; }).join('') : typeof y === 'string' ? y : ''; }).join(''), nb: true });
        return;
      }
      var k2 = kette.concat([{ tag: x.a[0], kl: klasse(x) }]);
      x.a.slice(2).forEach(function (y, i) { geh(y, (pfad ? pfad + '.' : '') + 'a.' + (i + 2), k2); });
    })(n, '', []);
    Object.keys(zahl0).forEach(function (nm) { if (zahl0[nm] < 2) return; var j = 0; aus.forEach(function (f) { if (f.name === nm) f.name = nm + ' ' + (++j); }); });
    aus.forEach(function (f) { f.preis = /^Preis/.test(f.name); });
    return aus.filter(function (f) { return f.wert !== '' || /Preis|Jahrgang|Punkte|Dauer|Spaltenkopf/.test(f.name); });
  }
  function lies(o, pfad) { return pfad ? pfad.split('.').reduce(function (x, k) { return x == null ? x : x[/^\d+$/.test(k) ? +k : k]; }, o) : o; }
  function vaterVon(o, pfad) { var k = pfad.split('.'), i = +k.pop(); return { arr: lies(o, k.join('.')), idx: i }; }
  /* Ein Feld eines Eintrags setzen (n wird verändert). Leer: ein Absatz oder eine Zeile fällt weg (leer: true), sonst bleibt das Element leer. */
  function setzeFeld(n, f, wert) {
    if (f.kap) { var e0 = lies(n, f.pfad); e0.a = [e0.a[0], e0.a[1]].concat(kapBau(String(wert), f.kap === 1)).concat(e0.a.slice(2).filter(function (y) { return y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y)); })); return; }
    if (f.kuerzel) { var e1 = lies(n, f.pfad), rest = e1.a.slice(2), j0 = rest.findIndex(function (y) { return y && y.fn === 'el' && y.a[0] === 'br'; }); e1.a = [e1.a[0], e1.a[1]].concat(kuerzelBau(String(wert))).concat(j0 >= 0 ? rest.slice(j0) : []); return; }
    if (f.nb) {
      var h4 = lies(n, f.pfad), nb = h4.a.slice(2).filter(istNb)[0], bilder = nb.a.slice(2).filter(function (z) { return typeof z !== 'string'; });
      var t = String(wert).replace(/\s+$/, ''), j = t.lastIndexOf(' '), vorn = j >= 0 ? t.slice(0, j + 1) : '', letzt = j >= 0 ? t.slice(j + 1) : t;
      h4.a = [h4.a[0], h4.a[1]].concat(vorn ? [vorn] : []).concat([{ fn: 'el', a: [nb.a[0], nb.a[1], letzt].concat(bilder) }]);
      return;
    }
    var v = vaterVon(n, f.pfad);
    if (typeof v.arr[v.idx] === 'string' && / $/.test(v.arr[v.idx]) && wert && !/ $/.test(wert) && istKuerzel(v.arr[v.idx + 1])) wert += ' ';   // Schlössli: Abstand vor den hochgestellten Kürzeln bleibt
    v.arr[v.idx] = wert;
    // Ruedihus 17.10.2026: eine Zeile besteht oft aus zwei Texten (Vorspann der Übersetzung in <span class="ld"> und Rest). Leer ist eine Zeile,
    // wenn in ihr kein Text mehr steht: jeder Block zwischen dem Eintrag und dem Text (p, dann die Zeile div.gz) fällt dann weg; der Eintrag selbst nie.
    var k = f.pfad.split('.'), kette = [];
    for (var x = k.length - 2; x >= 2; x -= 2) { var e = lies(n, k.slice(0, x).join('.')); if (e && e.fn === 'el') kette.push(e); }
    kette.forEach(function (e) { if (!BLOCK[e.a[0]]) return; if (!textVon(e).trim() && !hatFest(e)) e.leer = true; else delete e.leer; });
  }
  function hatFest(x) { return !!x && typeof x === 'object' && (x.fn === 'roh' || (x.fn === 'el' && (x.a[0] === 'img' || x.a.slice(2).some(hatFest)))); }
  /* Zeichen des Hauses an einem Eintrag (vegetarisch, vegan …): Nummern der festen Teile der Bilder, in der Reihenfolge des Satzes */
  function zeichenOrt(n) {
    var ort = null;
    (function geh(x) { if (ort || !x || x.fn !== 'el') return; if (istNb(x) || istZ(x)) { ort = x; return; } x.a.slice(2).forEach(geh); })(n);
    return ort;
  }
  function zeichenVon(n) {
    var o = zeichenOrt(n); if (!o) return [];
    return o.a.slice(2).filter(istBild).map(function (b) { var m = new RegExp(A + '(\\d+)' + Z).exec(b.a[1]); return m ? +m[1] : -1; });
  }
  function hatZeichenOrt(n) {   // Gericht mit Namen (h4) oder Zeile mit Zeichen-Spalte
    if (zeichenOrt(n)) return true;
    var h4 = null; (function geh(x) { if (h4 || !x || x.fn !== 'el') return; if (x.a[0] === 'h4') { h4 = x; return; } x.a.slice(2).forEach(geh); })(n);
    return !!h4;
  }
  /* Zeichen setzen: bild(teil) = Merkmale des Bildes, nb = Merkmale des Behälters am letzten Wort (beide aus dem Satz der Karte) */
  function setzeZeichen(n, teile, bildAt, nbAt) {
    var o = zeichenOrt(n), imgs = teile.map(function (t) { return { fn: 'el', a: ['img', bildAt(t)] }; });
    if (o) { o.a = [o.a[0], o.a[1]].concat(o.a.slice(2).filter(function (y) { return !istBild(y); })).concat(imgs); return; }
    if (!teile.length) return;
    var h4 = null; (function geh(x) { if (h4 || !x || x.fn !== 'el') return; if (x.a[0] === 'h4') { h4 = x; return; } x.a.slice(2).forEach(geh); })(n);
    if (!h4) return;
    var t = h4.a.slice(2).filter(function (y) { return typeof y === 'string'; }).join(''), j = t.lastIndexOf(' ');
    h4.a = [h4.a[0], h4.a[1]].concat(j >= 0 ? [t.slice(0, j + 1)] : []).concat([{ fn: 'el', a: ['span', nbAt, j >= 0 ? t.slice(j + 1) : t].concat(imgs) }]);
  }

  /* ---------------------------------------------------------------- Setzen */
  function Satz(d, opt) { this.d = d; this.mk = !!(opt && opt.marken); }
  Satz.prototype.kind = function (x, pfad, eltern, inE) {
    if (typeof x === 'string') return this.mk && x.trim() ? M0 + pfad + M1 + esc(x) + M2 : esc(x);
    if (!x || typeof x !== 'object') return '';
    if (x.fn === 'roh') return x.a[0];
    if (x.fn === 'el') return this.el(x, pfad, eltern, inE);
    return '';
  };
  Satz.prototype.el = function (n, pfad, eltern, inE) {
    if (n.aus) return '';
    var tag = n.a[0], at = n.a[1] || '', me = this, a = art(n, eltern);
    if (n.leer && !textVon(n).trim() && !hatFest(n)) return '';
    var waehlbar = !inE && (a && a !== 'fest' || tag === 'header' || tag === 'footer' || tag === 'img');
    var data = (this.mk && waehlbar) || n.lage ? pfad : '';
    var g = gestalt(n.lage), offen = (data || g[0] || g[1]) ? oeffne(tag, at, data, g[0], g[1]) : '<' + tag + at + '>';
    if (LEER_TAG[tag]) return offen;
    var drin = inE || a === 'eintrag';
    /* Schlössli 20.10.2026, 01:24 (Bild: im Modus Fortgeschritten war bei «Ossobucchi» nur «O» gewählt, geschrieben wurde nur in «SSOBUCCHI»): ein Name oder
       eine Rubrik in Kapitälchen ist in der Karte EIN Text (data-k «<pfad>~kap1|2»), wie das Feld im Modus «Einfach». */
    if (this.mk && istKap(n)) {
      var kp = pfad + '~kap' + (/(^| )sb-n( |$)/.test(klasse(n)) ? 1 : 2), auf = false, html = '';
      n.a.slice(2).forEach(function (y, i) {
        var mp = y && y.fn === 'el' && /(^| )sb-mp( |$)/.test(klasse(y));
        if (mp) { if (auf) { html += M2; auf = false; } html += me.kind(y, pfad + '.a.' + (i + 2), n, drin); return; }
        if (!auf) { html += M0 + kp + M1; auf = true; }
        me.mk = false; html += me.kind(y, pfad + '.a.' + (i + 2), n, drin); me.mk = true;
      });
      if (auf) html += M2;
      return offen + html + '</' + tag + '>';
    }
    return offen + n.a.slice(2).map(function (y, i) { return me.kind(y, pfad + '.a.' + (i + 2), n, drin); }).join('') + '</' + tag + '>';
  };
  Satz.prototype.seite = function (n, i, nr) {
    var me = this, at = n.a[0] || '', mehr = '';
    if (this.mk) mehr = ' data-seite="' + i + '" data-nr="' + nr + '"';
    var b = /data-b="(\d+)"/.exec(at);
    return '<section' + at + mehr + '>' + n.a.slice(1).map(function (y, j) { return me.kind(y, 'seiten.' + i + '.a.' + (j + 1), n, false); }).join('') + '</section>';
  };
  function teileLos(h, teile) { return h.replace(new RegExp(A + '(\\d+)' + Z, 'g'), function (m, n) { return (teile || [])[+n] || ''; }); }
  function marken(h) { return h.replace(new RegExp(M0 + '([^' + M1 + ']*)' + M1, 'g'), function (m, p) { return '<k-t data-k="' + p + '">'; }).split(M2).join('</k-t>'); }

  function seiten(d, opt) {
    var dd = d.art === 'mittag' ? mittagAnwenden(JSON.parse(JSON.stringify(d))) : d, sz = new Satz(dd, opt), aus = [];
    (dd.seiten || []).forEach(function (n, i) {
      if (n.aus) return;
      var h = teileLos(sz.seite(n, i, aus.length + 1), dd.teile);
      aus.push(opt && opt.marken ? marken(h) : h);
    });
    return aus;
  }
  /* Ganze Datei wie _werkbank/satz/u-<karte>.html (für den Rundlauf) */
  function dokument(d) { return d.kopf + seiten(d, {}).join('') + d.fuss; }
  function kopfCss(d) {
    var f = d.format || [210, 297];
    return '@page{size:' + f[0] + 'mm ' + f[1] + 'mm;margin:0}' + (d.art === 'mittag' ? MT_CSS : '');
  }

  /* ---------------------------------------------------------------- Mittagsmenü (C08) · Taverne zum Schäfli (21.10.2026)
     Das Haus hat kein Tagesmenü mit Salat, Vegi, Fleisch, Fisch, sondern ein Mittagsmenü mit Prolog und vier Gängen und einem Preis (Original
     _quelle/website/pdf/Mittagsmenu-2101.pdf, A4 quer, mittig gesetzt). Deshalb je Woche EIN Menü (woche.tage hat ein Element), Gang = Gericht +
     Zeile darunter; das Blatt ist gebaut wie das Trüffelmenü (satz_bau.py trueffel), mittig: oben Lamm, Haus, Titel, dann die Gänge, unten der Preis.
     Felder: woche = { ab, titel, gruss, zeiten, preis, zusatz, spruch, fuss, beispiel, tage: [{ zu, hinweis, prolog, prolog_z, vorspeise, vorspeise_z,
     zwischen, zwischen_z, haupt, haupt_z, dessert, dessert_z }] } */
  var TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var GAENGE = [['prolog', 'Prolog', 'Prolog'], ['vorspeise', 'Erster Gang', 'Erster Gang'], ['zwischen', 'Zweiter Gang', 'Zweiter Gang'], ['haupt', 'Hauptgang', 'Hauptgang'], ['dessert', 'Dessert', 'Dessert']];
  function datum(ab, plus) { var x = String(ab || '').split('-').map(Number); return new Date(x[0], (x[1] || 1) - 1, (x[2] || 1) + (plus || 0), 12); }
  function iso(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function montag(ab) { var dt = datum(ab); dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); return iso(dt); }
  function tagName(ab, i) { var dt = datum(ab, i); return TAGE[(i % 7)] + ', ' + dt.getDate() + '. ' + MONATE[dt.getMonth()]; }
  function spanne(ab, n) {
    var a = datum(ab), b = datum(ab, (n || 7) - 1);
    if (a.getFullYear() !== b.getFullYear()) return a.getDate() + '. ' + MONATE[a.getMonth()] + ' ' + a.getFullYear() + ' – ' + b.getDate() + '. ' + MONATE[b.getMonth()] + ' ' + b.getFullYear();
    if (a.getMonth() !== b.getMonth()) return a.getDate() + '. ' + MONATE[a.getMonth()] + ' – ' + b.getDate() + '. ' + MONATE[b.getMonth()] + ' ' + b.getFullYear();
    return a.getDate() + '. – ' + b.getDate() + '. ' + MONATE[b.getMonth()] + ' ' + b.getFullYear();
  }
  var leer = function (x) { return !String(x || '').trim(); };
  function tagLeer(tg) { return !tg.zu && GAENGE.every(function (g) { return leer(tg[g[0]]) && leer(tg[g[0] + '_z']); }); }
  function leererTag() { var tg = { zu: false, hinweis: '' }; GAENGE.forEach(function (g) { tg[g[0]] = ''; tg[g[0] + '_z'] = ''; }); return tg; }
  var MT_CSS = '';   // das Blatt trägt die Klassen des Satzes (satz/satz.css), keine eigenen Stile
  var SEITE_AT = ' data-max="1.15" class="blatt ts ts--quer" data-b="297" data-h="210" style="width:297mm;height:210mm"';
  function el(tag, kl, kinder, mehr) { var n = { fn: 'el', a: [tag, kl ? ' class="' + kl + '"' : ''].concat(kinder || []) }; if (mehr) Object.keys(mehr).forEach(function (k) { n[k] = mehr[k]; }); return n; }
  function preisMarke(t) {   // «Mittagsmenü 158.» als Marke: Angabe klein, Zahl gross; der Wortlaut bleibt
    var m = /^(.*?)\s*(\d+\.(?:-)?)$/.exec(t), kinder = m && m[1] ? [el('em', '', [m[1]]), el('b', '', [m[2]])] : [el('b', '', [t])];
    return el('div', 'sb-lunchpreis', [el('p', 'sb-p', [el('span', '', kinder)])], { w: 'preis' });
  }
  function mittagSeiten(w) {
    var aus = [];
    var P = function (text, kl, feld) { return el('p', kl, [text], feld ? { w: feld } : null); };
    (w.tage || []).slice(0, 1).forEach(function (tg, i) {
      var links = [el('span', 'uz sb-zeichen', [{ fn: 'roh', a: [ZEICHEN.ZEICHEN] }]), el('p', 'ts-haus', [ZEICHEN.HAUS || 'Taverne zum Schäfli']),
        el('h2', 'sb-band', [leer(w.titel) ? 'Mittagsmenü' : w.titel.trim()], leer(w.titel) ? null : { w: 'titel' })];
      var unten = [];
      if (!tg.zu && !leer(w.preis)) unten.push(preisMarke(w.preis.trim()));
      if (!leer(w.zusatz)) unten.push(P(w.zusatz.trim(), 'sb-zusatz', 'zusatz'));
      if (!leer(w.zeiten)) unten.push(P(w.zeiten.trim(), 'sb-hinweis', 'zeiten'));
      if (!leer(w.gruss)) unten.push(P(w.gruss.trim(), 'sb-hinweis', 'gruss'));
      var mitte = [];
      if (tg.zu) mitte.push(el('div', 'sb-m', [P(leer(tg.hinweis) ? 'Diese Woche gibt es kein Mittagsmenü.' : tg.hinweis.trim(), 'sb-n sb-n--gross', leer(tg.hinweis) ? null : 'tage.' + i + '.hinweis')]));
      else {
        var erst = true;
        GAENGE.forEach(function (g) {
          if (leer(tg[g[0]]) && leer(tg[g[0] + '_z'])) return;
          if (!erst) mitte.push(el('div', 'sb-gang', [{ fn: 'roh', a: [ZEICHEN.BLATT || '<i></i>'] }]));
          erst = false;
          var m = [];
          if (!leer(tg[g[0]])) m.push(P(tg[g[0]].trim(), 'sb-n sb-n--gross', 'tage.' + i + '.' + g[0]));
          if (!leer(tg[g[0] + '_z'])) m.push(P(tg[g[0] + '_z'].trim(), 'sb-t', 'tage.' + i + '.' + g[0] + '_z'));
          mitte.push(el('div', 'sb-m', m));
        });
        if (erst) mitte.push(el('div', 'sb-m', [P('Die Gerichte dieser Woche folgen.', 'sb-t')]));
      }
      if (!leer(w.spruch)) unten.push(P(w.spruch.trim(), 'sb-hinweis', 'spruch'));
      if (w.beispiel) mitte.push(P('Beispiel · bitte die Gerichte der Woche eintragen', 'sb-t'));
      var linksEl = el('div', 'sb-oben', links), menue = el('div', 'sb-menue', mitte), untenEl = el('div', 'sb-unten', unten);
      var fuss = leer(w.fuss) ? el('footer', 'ufuss2', [ZEICHEN.FUSS || 'Taverne zum Schäfli']) : el('footer', 'ufuss2', [w.fuss.trim()], { w: 'fuss' });
      var zaehl = {}, WL = w.lage || {};
      var alle = [linksEl, menue, untenEl, fuss].concat(links, mitte, unten);
      alle.forEach(function (x) {
        var k = x.w ? x.w.replace(/^tage\.\d+\./, '') : /sb-gang/.test(x.a[1]) ? 'blatt' : /sb-zeichen/.test(x.a[1]) ? 'zeichen' : /sb-oben/.test(x.a[1]) ? 'oben' : /sb-unten/.test(x.a[1]) ? 'unten' : /sb-menue/.test(x.a[1]) ? 'menue' : x.a[0] === 'footer' ? 'fuss' : 'text';
        zaehl[k] = (zaehl[k] || 0) + 1; x.lk = 't0.' + k + (zaehl[k] > 1 ? zaehl[k] : '');
        if (WL[x.lk]) x.lage = JSON.parse(JSON.stringify(WL[x.lk]));
      });
      aus.push({ fn: 'seite', a: [SEITE_AT, el('div', 'inhalt', [el('div', 'sb-quer', [linksEl, menue, untenEl])]), fuss] });
    });
    if (!aus.length) aus.push({ fn: 'seite', a: [SEITE_AT, el('div', 'inhalt', [el('div', 'sb-quer', [el('div', 'sb-oben', [el('h2', 'sb-band', [w.titel || 'Mittagsmenü'])]), el('div', 'sb-menue', [P('Die Gerichte dieser Woche folgen.', 'sb-t')])])])] });
    return aus;
  }
  function mittagAnwenden(d) { d.seiten = mittagSeiten(d.woche); d.teile = []; return d; }

  G.SATZ = {
    zeichen: function (z) { ZEICHEN = z; }, seiten: seiten, dokument: dokument, kopfCss: kopfCss, lageStil: lageStil, gestalt: gestalt, SCHRIFT: SCHRIFT, FARBE: FARBE,
    art: art, felder: felder, setzeFeld: setzeFeld, kapBau: kapBau, zeichenVon: zeichenVon, setzeZeichen: setzeZeichen, hatZeichenOrt: hatZeichenOrt, textVon: textVon, klasse: klasse, esc: esc, wahr: wahr, lies: lies,
    MITTAG: { TAGE: TAGE, MONATE: MONATE, GAENGE: GAENGE, datum: datum, iso: iso, montag: montag, tagName: tagName, spanne: spanne, leererTag: leererTag, tagLeer: tagLeer, seiten: mittagSeiten, anwenden: mittagAnwenden, CSS: MT_CSS },
  };
  if (typeof module !== 'undefined') module.exports = G.SATZ;
})(typeof window !== 'undefined' ? window : globalThis);
