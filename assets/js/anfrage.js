/* Anschluss der Formulare der Website an La Réception · Taverne zum Schäfli, Wigoltingen (21.10.2026, Master Werkzeug-Bau E12/E24/E33, Muster: Reservationsbuch
   des Schlössli). Die Website hat sechs Formulare: die Tischkarte «Ihr Abend» (#abend-form, abend.html, mit Allergien, vegetarisch und Hund), «Ihre Feier»
   (dialog#anfrage, feiern.html, dazu das gewählte Menü aus «Menüvorschläge»), «Ihr Gutschein» (dialog#gutschein-fenster, gutschein.html, dazu Betrag, Widmung und Haus
   von der Karte), «Einen Platz vormerken» (dialog#vormerken, anlaesse.html), «Ihre Nachricht» (dialog#kontakt-fenster, kontakt.html) und «Deine Bewerbung»
   (dialog#bewerbung, jobs.html). Bisher zeigten sie nur «Danke» (Studie, nichts ging weg).
   Mit diesem Baustein geht jede Anfrage in den Eingang von La Réception, mit allen Angaben; erst wenn La Réception sie angenommen hat, zeigt das Fenster «Danke».
   Geht etwas schief, steht im Fenster eine Meldung mit der Telefonnummer des Hauses, die Eingaben bleiben. Nie mailto, nie ein Mailprogramm.
   Eigene Fenster braucht es nicht: die Skripte der Website (schaefli.js, funktionen.js) bleiben unverändert. Der Baustein fängt das Abschicken im Fang-Durchlauf
   am Dokument ab, bevor die Website «Danke» setzt, und setzt es selbst, wenn die Anfrage angekommen ist.
   Einbinden (Werkbank/Website, über bau.py, nicht von Hand): <script src="assets/js/anfrage.js?v={V}" defer></script> nach schaefli.js und funktionen.js.
   Ziel: /_werkzeuge/reception/api/formular (anders mit <script … data-api="/pfad"> oder window.WS_ANFRAGE_API). */
(function () {
  'use strict';
  var D = document, skript = D.currentScript;
  var API = window.WS_ANFRAGE_API || (skript && skript.getAttribute('data-api')) || '/_werkzeuge/reception/api/formular';
  var TEL = '+41 52 763 11 72';
  var $ = function (s, c) { return (c || D).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || D).querySelectorAll(s)); };
  var wert = function (f, n) { var e = f.querySelector('[name="' + n + '"]'); return e ? String(e.value || '').trim() : ''; };
  var gedrueckt = function (c, sel) { var b = c.querySelector(sel + '[aria-pressed="true"]'); return b ? (b.getAttribute('data-wert') || b.textContent || '').trim() : ''; };
  var seiteName = function () { var t = (D.title || '').split(/ · | \| | — /)[0].trim(); return /^Taverne zum Sch/.test(t) ? 'Startseite' : t; };
  var kontakt = function (f) { return wert(f, 'mail') || wert(f, 'telefon'); };
  var mitTel = function (f, z) { if (wert(f, 'telefon')) z.push('Telefon: ' + wert(f, 'telefon')); return z; };

  /* Was jedes Fenster mitschickt: dieselben Felder, die der Gast ausgefüllt hat, in Zeilen für das Team */
  var FENSTER = {
    'anfrage': function (f) {      // feiern.html «Ihre Feier»
      var z = ['Wunschdatum: ' + (wert(f, 'datum') || 'nicht genannt'), 'Personen: ' + wert(f, 'personen')], mm = $('div[data-mm]');
      if (mm) {
        var reiter = mm.querySelector('[role=tab][aria-selected="true"]'), g = mm.querySelector('[data-mm-gaenge]'), p = mm.querySelector('[data-mm-preis]');
        if (reiter) z.push('Menü auf der Seite angesehen: ' + reiter.textContent.trim() + (g ? ', ' + g.textContent.trim() + ' Gänge' : '') + (p ? ', ' + p.textContent.trim() + ' je Person' : ''));
      }
      mitTel(f, z);
      if (wert(f, 'nachricht')) z.push('Ihr Anlass: ' + wert(f, 'nachricht'));
      return { art: 'bankett', formular: 'feier', anliegen: 'Ihre Feier' + (wert(f, 'personen') ? ', ' + wert(f, 'personen') + ' Personen' : ''), datum: wert(f, 'datum'),
        personen: wert(f, 'personen'), name: wert(f, 'name'), kontakt: kontakt(f), zeilen: z };
    },
    'gutschein-fenster': function (f) {   // gutschein.html «Ihr Gutschein»: Betrag, Widmung und Haus kommen von der Karte daneben
      var s = f.closest('.gutschein') || D, betrag = gedrueckt(s, '[data-betrag]'), b = s.querySelector('[data-betrag][aria-pressed="true"]');
      if (b) betrag = b.getAttribute('data-betrag') || wert(s, 'betrag-frei').replace(/\D/g, '');
      var haus = s.querySelector('[data-einloesbar][aria-pressed="true"]'), hausT = haus ? haus.textContent.trim() : '';
      var z = ['Name Käufer: ' + wert(f, 'name'), 'E-Mail: ' + wert(f, 'mail'), 'Adresse für den Versand: ' + wert(f, 'adresse'), 'Betrag in Franken: ' + (betrag || 'nicht gewählt')];
      if (hausT) z.push('Einlösbar: ' + hausT);
      if (wert(s, 'fuer')) z.push('Für: ' + wert(s, 'fuer'));
      if (wert(s, 'von')) z.push('Von: ' + wert(s, 'von'));
      if (wert(s, 'gruss')) z.push('Grussbotschaft: ' + wert(s, 'gruss'));
      return { art: 'gutschein', formular: 'gutschein', anliegen: 'Gutschein' + (betrag ? ' über ' + betrag + ' Franken' : ''), name: wert(f, 'name'), kontakt: wert(f, 'mail'), zeilen: z };
    },
    'vormerken': function (f) {    // anlaesse.html «Einen Platz vormerken»
      var anlass = gedrueckt(f, '[data-wahl="vormerken"]') || 'Anlass';
      var z = ['Anlass: ' + anlass, 'Plätze: ' + wert(f, 'personen')];
      if (wert(f, 'nachricht')) z.push('Ihre Nachricht: ' + wert(f, 'nachricht'));
      return { art: 'anlass', formular: 'vormerken', anliegen: 'Platz vormerken: ' + anlass, personen: wert(f, 'personen'), name: wert(f, 'name'), kontakt: kontakt(f), zeilen: z };
    },
    'kontakt-fenster': function (f) {   // kontakt.html «Ihre Nachricht»
      return { art: 'nachricht', formular: 'kontakt', anliegen: 'Nachricht über die Website', name: wert(f, 'name'), kontakt: kontakt(f),
        zeilen: ['Ihre Nachricht: ' + wert(f, 'nachricht')] };
    },
    'bewerbung': function (f) {    // jobs.html «Deine Bewerbung»
      var z = mitTel(f, ['Bereich: ' + wert(f, 'bereich')]);
      if (wert(f, 'nachricht')) z.push('Ein paar Worte: ' + wert(f, 'nachricht'));
      return { art: 'stelle', formular: 'bewerbung', anliegen: 'Bewerbung' + (wert(f, 'bereich') ? ': ' + wert(f, 'bereich') : ''), name: wert(f, 'name'), kontakt: kontakt(f), zeilen: z };
    }
  };
  /* «Ihr Abend» (abend.html): die Tischkarte. Eine Feier im Festsaal oder mehr als zwölf Gäste wird «Feier», sonst «Reservation». */
  function abend(f) {
    var zeit = gedrueckt(f, '[data-wahl="zeit"]'), anlass = gedrueckt(f, '[data-wahl="anlass"]'), menue = f.querySelector('.tm[aria-pressed="true"]'), wein = gedrueckt(f, '[data-wahl="wein"]');
    var out = f.querySelector('output[name="personen"]'), personen = out ? String(out.value || out.textContent || '').trim() : '';
    var al = $$('[name=allergie]:checked', f).map(function (c) { return c.value; }), veg = !!(f.querySelector('[name=vegetarisch]') || {}).checked, hund = !!(f.querySelector('[name=hund]') || {}).checked;
    if (veg) al.push('Vegetarisch');
    var z = ['Datum: ' + (wert(f, 'datum') || 'nicht gewählt'), 'Zeit: ' + (zeit || '-'), 'Personen: ' + (personen || '-'), 'Anlass: ' + (anlass || '-')];
    if (menue) z.push('Menü: ' + (menue.getAttribute('data-name') || menue.textContent.trim()));
    var ww = f.querySelector('[data-tk="wein"]'); z.push(ww ? ww.textContent.trim() : 'Wein: ' + (wein || '-'));
    z.push('Allergien: ' + (al.filter(function (x) { return x !== 'Vegetarisch'; }).join(', ') || 'keine angegeben'));
    if (veg) z.push('Vegetarisch: ja');
    if (hund) z.push('Hund: kommt mit');
    ['richt', 'richtwein'].forEach(function (k) { var e = f.querySelector('[data-tk="' + k + '"]'); if (e && e.textContent.trim()) z.push(e.textContent.trim().replace(/^([^:]+):/, 'Richtwert $1:')); });
    mitTel(f, z);
    if (wert(f, 'wuensche')) z.push('Wünsche: ' + wert(f, 'wuensche'));
    var festsaal = /festsaal/i.test(anlass), gross = festsaal || (+personen > 12);
    return { art: gross ? 'bankett' : 'tisch', formular: 'abend', anliegen: 'Tischkarte' + (anlass && anlass !== 'Einfach so' ? ': ' + anlass : ''), datum: wert(f, 'datum'), uhrzeit: zeit,
      personen: personen, platz: festsaal ? 'Festsaal' : '', allergene: al, hund: hund, name: wert(f, 'name'), kontakt: kontakt(f), zeilen: z };
  }

  /* Feld, das Menschen nicht sehen: nur Maschinen füllen es aus (La Réception nimmt solche Anfragen still an und legt nichts ab) */
  function falle(f) {
    if (f.querySelector('[name=website]')) return;
    var i = D.createElement('input'); i.type = 'text'; i.name = 'website'; i.tabIndex = -1; i.autocomplete = 'off'; i.setAttribute('aria-hidden', 'true');
    i.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(i);
  }
  function meldung(f, text) {
    var p = f.querySelector('.ws-anfrage-fehler');
    if (!p) {
      p = D.createElement('p'); p.className = 'fd__demo ws-anfrage-fehler'; p.setAttribute('role', 'alert');
      var knopf = f.querySelector('[type=submit]'); (knopf ? (knopf.closest('.ab-knoepfe') || knopf) : f).insertAdjacentElement('afterend', p);
    }
    p.textContent = text; p.hidden = !text;
  }
  function senden(f, d, knopf, fertig) {
    if (f.dataset.sendet) return;
    f.dataset.sendet = '1'; if (knopf) knopf.disabled = true; meldung(f, '');
    var koerper = { art: d.art, formular: d.formular, name: d.name, kontakt: d.kontakt, datum: d.datum || '', uhrzeit: d.uhrzeit || '', personen: d.personen || '',
      platz: d.platz || '', allergene: d.allergene || [], hund: !!d.hund, anliegen: d.anliegen, nachricht: d.zeilen.join('\n'), seite: location.pathname + location.search,
      seite_name: seiteName(), sprache: (D.documentElement.lang || 'de').slice(0, 2), website: wert(f, 'website') };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(String((x.j && x.j.fehler) || '').replace(/^[A-ZÄÖÜ-]+ · /, '') || 'Die Anfrage kam nicht an.');
        fertig();
      })
      .catch(function (e) { meldung(f, (e && e.message && !/fetch|network|load/i.test(e.message) ? e.message : 'Die Anfrage kam nicht an.') + ' Bitte noch einmal versuchen oder anrufen: ' + TEL + '.'); })
      .then(function () { delete f.dataset.sendet; if (knopf) knopf.disabled = false; });
  }

  D.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.id === 'abend-form') {   // die Tischkarte: Pflicht sind Datum, Name und E-Mail (wie funktionen.js), danach wie die Website «Danke»
      e.preventDefault(); e.stopImmediatePropagation();
      var fehlt = [f.datum, f.name, f.mail].filter(function (x) { return x && (!x.value.trim() || (x.type === 'email' && !/@/.test(x.value))); });
      [f.datum, f.name, f.mail].forEach(function (x) { if (x) x.toggleAttribute('aria-invalid', fehlt.indexOf(x) > -1); });
      if (fehlt.length) { fehlt[0].focus(); return; }
      senden(f, abend(f), f.querySelector('[type=submit]'), function () { var dk = f.querySelector('.fd__danke'); if (dk) dk.hidden = false; var tk = f.querySelector('.tischkarte'); if (tk) tk.classList.add('gesendet'); });
      return;
    }
    var dlg = f && f.closest && f.closest('dialog'), bau = dlg && FENSTER[dlg.id];
    if (!bau) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!f.reportValidity()) return;
    senden(f, bau(f), f.querySelector('[type=submit]'), function () { var dk = f.querySelector('.fd__danke'); if (dk) dk.hidden = false; });
  }, true);
  function bereit() { $$('dialog.fenster-dialog form').concat($$('#abend-form')).forEach(falle); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
