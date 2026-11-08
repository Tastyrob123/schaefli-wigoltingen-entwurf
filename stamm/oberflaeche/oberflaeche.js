/* oberflaeche.js · Werkzeug-Oberfläche der Häuser (Stamm, 17.10.2026). Baut die Teile, die jedes Werkzeug gleich hat, als HTML-Text:
   Kopf, Startbild, Rand, Leiste, Knöpfe, Zeichen. Die Werkzeuge rufen das in ihren bestehenden Zeichen-Funktionen auf und behalten
   ihre Ids, data-Attribute und Klick-Handler (Funktionen, Wege und Daten bleiben unverändert). Vorher lädt das Werkzeug kleid/<haus>.js
   (setzt window.WO_HAUS und die Attribute am <html>). Keine Bewegung ausser transform/opacity, nichts hält das Scrollen fest.

   WO.kopf({werkzeug:'website', unter:'Website', titel:'Übersicht', stand:'Wie gebaut', pruefung:'…', anleitung:'…', website:'/', marke:'data-gehe="start"'})
   WO.startbild({werkzeug:'website', h1:'Guten Tag. <em>Was ändern wir heute?</em>', satz:'…', knoepfe:WO.knopf('Anleitung','buch','gold',{href:'…'}), art:'voll'|'buehne', zier:'HTML, schon maskiert', foto:'…'})
   WO.rand([{titel:'', eintraege:[{text:'Übersicht', zahl:0, an:true, attr:'data-gehe="start"'}]}], {website:'/', anleitung:'…', pruefung:'…'})
   WO.leiste({titel:'Alles ist veröffentlicht', satz:'…', entwurf:false, knoepfe:'…'})
   WO.knopf(text, zeichen, art('gold'|'hell'|'dunkel'|'glas'), {href, id, klein, disabled, attr})
   WO.gruss()  → 'Guten Morgen.' | 'Guten Tag.' | 'Guten Abend.'   WO.name('karten') → 'La Carte' | 'Die Tafel' */
(function () {
  var H = window.WO_HAUS || {};
  var NAMEN = {
    zentrale: ['La Maison', 'Die Stube', 'haus'], website: ['Le Bureau', 'Der Schreibtisch', 'welt'], karten: ['La Carte', 'Die Tafel', 'karte'],
    gaeste: ['La Réception', 'Der Gastgeber', 'chat'], marke: ['Le Livre', 'Das Hausbuch', 'siegel'], besuche: ['Le Registre', 'Das Besucherbuch', 'balken'],
    druck: ['L’Imprimerie', 'Die Werkstatt', 'druck']
  };
  var REIHE = ['website', 'karten', 'gaeste', 'marke', 'besuche', 'druck'];   // La Maison bleibt je Haus eigen (Robert 17.10.2026)
  var I = {
    stift: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4', welt: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
    karte: 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4', uhr: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2',
    aus: 'M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3 3.6M6.6 7.6C4.3 9.2 3 12 3 12s4 6 9 6c1.3 0 2.5-.3 3.6-.8',
    foto: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM21 16l-5-5-9 8M9 8.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6z',
    glocke: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0', person: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21c1-4 4-6 8-6s7 2 8 6',
    tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z', mail: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 7l9 6 9-6',
    haus: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6', schild: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    buch: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z', pfeil: 'M7 17L17 7M8 7h9v9',
    rechts: 'M5 12h14M13 6l6 6-6 6', links: 'M19 12H5M11 6l-6 6 6 6', plus: 'M12 5v14M5 12h14', suche: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
    chat: 'M4 5h16v11H9l-5 4z', pdf: 'M6 3h9l3 3v15H6zM9 13h6M9 17h6M14 3v4h4', zurueck: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', haken: 'M5 12l5 5 9-10',
    x: 'M6 6l12 12M18 6L6 18', menue: 'M4 7h16M4 12h16M4 17h16', siegel: 'M12 3a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM9 14.5L8 21l4-2 4 2-1-6.5',
    balken: 'M5 20v-9M12 20V5M19 20v-6M3 20h18', druck: 'M7 8V3h10v5M6 17H4v-7h16v7h-2M7 14h10v7H7z', blatt: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14zM5 19l7-7',
    auge: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z', hoch: 'M12 19V5M6 11l6-6 6 6',
    kopie: 'M8 8h11v13H8zM5 16V3h11', verlauf: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2', ziehen: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(n, k) { return '<svg class="wo-ic' + (k ? ' ' + k : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (I[n] || I.pfeil) + '"/></svg>'; }
  function name(k) { var n = NAMEN[k]; return n ? n[H.welt === 'land' ? 1 : 0] : k; }
  function zeichen() {
    return '<span class="wo-zeichen" aria-hidden="true" style="aspect-ratio:' + (H.zeichenMass || 1) + ';background:currentColor;-webkit-mask:url(' + H.zeichen + ') center/contain no-repeat;mask:url(' + H.zeichen + ') center/contain no-repeat"></span>';
  }
  function gruss() { var h = new Date().getHours(); return h >= 5 && h < 11 ? 'Guten Morgen.' : h >= 11 && h < 18 ? 'Guten Tag.' : 'Guten Abend.'; }
  function knopf(text, z, art, o) {
    o = o || {};
    var k = 'wo-kn wo-kn--' + (art || 'gold') + (o.klein ? ' wo-kn--klein' : '') + (o.voll ? ' wo-kn--voll' : '') + (o.klasse ? ' ' + o.klasse : '');
    var a = (o.id ? ' id="' + o.id + '"' : '') + (o.attr ? ' ' + o.attr : '') + (o.titel ? ' title="' + esc(o.titel) + '"' : '');
    var innen = '<span>' + text + '</span><i>' + ic(z || 'pfeil') + '</i>';
    return o.href ? '<a class="' + k + '" href="' + o.href + '"' + (o.neu ? ' target="_blank" rel="noopener"' : '') + a + '>' + innen + '</a>'
      : '<button class="' + k + '" type="button"' + a + (o.disabled ? ' disabled' : '') + '>' + innen + '</button>';
  }
  function rund(href, z, titel, neu) { return '<a class="wo-kn wo-kn--rund" href="' + href + '"' + (neu ? ' target="_blank" rel="noopener"' : '') + ' title="' + esc(titel) + '" aria-label="' + esc(titel) + '">' + ic(z) + '</a>'; }
  function kopf(o) {
    var w = H.wege || {};
    var wz = REIHE.map(function (k) {
      var an = k === o.werkzeug;
      return '<a class="wo-wz' + (an ? ' wo-an' : '') + '" href="' + (w[k] || '#') + '"' + (an ? ' aria-current="page"' : '') + '>' + esc(name(k)) + '</a>';
    }).join('');
    return '<a class="wo-marke-w" href="' + (o.markeHref || '#') + '"' + (o.marke ? ' ' + o.marke : '') + '>' + zeichen() + '<span><b>' + esc(name(o.werkzeug)) + '</b><small>' + esc(o.unter || '') + ' · ' + esc(H.name) + '</small></span></a>'
      + '<nav class="wo-kopf__wz" aria-label="Werkzeuge">' + wz + '</nav>'
      + '<div class="wo-kopf__mitte"><b>' + esc(o.titel || '') + '</b><small>' + esc(o.stand || '') + '</small></div>'
      + '<div class="wo-kopf__r">' + rund(w.zentrale || '#', 'haus', name('zentrale'))
      + (o.pruefung ? rund(o.pruefung, 'schild', 'Prüfung', true) : '') + (o.anleitung ? rund(o.anleitung, 'buch', 'Anleitung', true) : '')
      + '<span class="wo-trenn"></span>' + knopf('Website ansehen', 'welt', 'gold', { href: o.website || '/', neu: true, klein: true }) + '</div>'
      + '<button class="wo-kopf__ber" type="button" aria-expanded="false" data-wo-rand-knopf>' + ic('menue') + '<span>Bereiche</span></button>';
  }
  function startbild(o) {
    var art = o.art || 'voll';
    return '<section class="wo-sb wo-sb--' + art + '" aria-label="Startbild">'
      + '<figure class="wo-sb__foto"><img src="' + (o.foto || H.foto) + '" alt="Das ' + esc(H.name) + ' von aussen" decoding="async"><figcaption>' + zeichen() + '<span><b>' + esc(H.name) + '</b>' + esc(H.ort || '') + '</span></figcaption></figure>'
      + '<div class="wo-sb__text"><p class="wo-sb__zier">' + zeichen() + '<span>' + (o.zier || esc(name(o.werkzeug) + ' · ' + (H.voll || H.name))) + '</span><i></i></p>'
      + '<h1 class="wo-sb__h">' + o.h1 + '</h1>' + (o.satz ? '<p class="wo-sb__satz">' + o.satz + '</p>' : '')
      + (o.knoepfe ? '<div class="wo-sb__kn">' + o.knoepfe + '</div>' : '') + '</div></section>';
  }
  function rand(gruppen, wege) {
    var s = '';
    (gruppen || []).forEach(function (g) {
      s += '<div class="wo-rand__g">' + (g.titel ? '<p class="wo-mk">' + esc(g.titel) + '</p>' : '') + '<ul>';
      (g.eintraege || []).forEach(function (e) {
        var tag = e.href ? 'a href="' + e.href + '"' : 'button type="button"', ende = e.href ? 'a' : 'button';
        s += '<li><' + tag + ' class="wo-re' + (e.an ? ' wo-an' : '') + '"' + (e.an ? ' aria-current="true"' : '') + (e.attr ? ' ' + e.attr : '') + '><span>' + esc(e.text) + '</span>'
          + (e.zahl ? '<b class="wo-zahl">' + e.zahl + '</b>' : '') + (e.extra || '') + '</' + ende + '></li>';
      });
      s += '</ul></div>';
    });
    if (wege) {
      s += '<div class="wo-rand__wege">';
      [['website', 'Website ansehen'], ['anleitung', 'Anleitung'], ['pruefung', 'Prüfung']].forEach(function (x) {
        if (wege[x[0]]) s += '<a href="' + wege[x[0]] + '" target="_blank" rel="noopener">' + x[1] + ic('pfeil') + '</a>';
      });
      s += '</div>';
    }
    return s;
  }
  function leiste(o) {
    return '<div class="wo-leiste__t">' + (o.entwurf ? '<em class="wo-marke">Entwurf</em>' : '') + '<span><b>' + esc(o.titel) + '</b><small>' + esc(o.satz || '') + '</small></span></div>'
      + '<div class="wo-leiste__kn">' + (o.knoepfe || '') + '</div>';
  }
  function bereit() {
    document.querySelectorAll('[data-wo-gruss]').forEach(function (e) { e.textContent = gruss(); });
  }
  /* Bereiche am Handy: Knopf im Kopf klappt den Rand auf, eine Wahl klappt ihn zu (R07) */
  /* in der Fangphase, weil viele Werkzeuge den Rand beim Klick sofort neu zeichnen (der Knopf ist danach nicht mehr im Dokument) */
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('[data-wo-rand-knopf]');
    if (k) { var auf = !document.documentElement.classList.contains('wo-rand-auf'); document.documentElement.classList.toggle('wo-rand-auf', auf); k.setAttribute('aria-expanded', auf); return; }
    if (e.target.closest && e.target.closest('.wo-rand a, .wo-rand button')) document.documentElement.classList.remove('wo-rand-auf');
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.documentElement.classList.remove('wo-rand-auf'); });
  window.WO = { haus: H, namen: NAMEN, reihe: REIHE, esc: esc, ic: ic, name: name, zeichen: zeichen, gruss: gruss, knopf: knopf, kopf: kopf, startbild: startbild, rand: rand, leiste: leiste, bereit: bereit };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
