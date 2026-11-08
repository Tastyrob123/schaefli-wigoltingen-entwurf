/* Das Besucherbuch (Le Registre) · Taverne zum Schäfli: Zählung auf der Website (Tasty Studios 21.10.2026). Quelle dieser Datei; auf der Website liegt sie
   als assets/js/messung.js, auf jeder Seite vor </body> als <script src="assets/js/messung.js?v=…" defer></script>, nach schaefli.js und funktionen.js.
   Den Einbau in bau.py und die Prüfung der Website macht der Chat «Website-Prüfung» des Schäfli (gemeldet 21.10.2026); hier nur die Quelle.
   Vorbild: messung.js der Wirtschaft am Schlössli (dort nach dem Berghotel Gasterntal, nur gelesen), Ereignisse des Schäfli.

   Je Seite geht eine Zeile an /api/registre (lokal der Server des Besucherbuchs, online die Funktion api/registre.py, gleiche Adresse):
       r1 <seitenaufruf> <datei> <sprache> <geraet> <sekunden> <ereignisse|-> <herkunft|->
   einmal beim Öffnen (0 Sekunden), bei jedem gezählten Klick und beim Verlassen (Sekunden, in denen die Seite sichtbar war).
   Ohne Cookies und ohne Kennung im Gerät: «seitenaufruf» ist eine Zufallsfolge, die nur in dieser Variablen lebt und mit der Seite endet.
   Dass die Seiten eines Besuchs zusammenfinden, Land und Ort bestimmt der Server aus der Verbindung (registre.py); die Adresse speichert er nicht.
   «herkunft» ist nur der Name der Website, von der der Gast kam (zum Beispiel guide.michelin.com), nie die ganze Adresse.
   «sprache» ist die Sprache des Browsers (die Website gibt es nur deutsch), sonst «xx».
   Nicht gezählt: automatische Browser (Prüfläufe), Seiten im Rahmen, die Werkzeuge und Beigaben des Hauses, Varianten- und Studienseiten und Geräte
   mit der Marke «schaefli-nicht-zaehlen» im localStorage (das Einzige, was je im Gerät steht).
   Die Fenster der Website (schaefli.js «Fenster für Anfragen», funktionen.js «Ihr Abend») bleiben unberührt: gezählt wird nur, dass etwas begonnen,
   geöffnet oder abgeschickt wurde, nie ein Inhalt.

   Ereignisse (Schlüssel wie in allen Häusern, Bedeutung im Schäfli):
     booking  «Tisch reservieren» gewählt (jeder Link zu zenchef, der Reservation des Hauses)
     fenster  auf «Ihr Abend» einen Abend begonnen (Knopf «Abend beginnen» oder die erste Wahl im Formular #abend-form)
     buchung  «Ihr Abend» als Tischkarte abgeschickt (erst wenn die Tischkarte «gesendet» zeigt, funktionen.js prüft vorher Datum, Name und Mail)
     tisch    Fenster «Ihre Feier» geöffnet (data-oeffne="anfrage" auf «Gruppen und Feiern»)
     anfrage  Feier, Gutschein oder Platz an einem Anlass abgeschickt (Fenster #anfrage, #gutschein-fenster, #vormerken zeigt sein «Danke»)
     anruf    Telefonnummer des Hauses angeklickt (+41 52 763 11 72)
     mail     «Nachricht schreiben» geöffnet (data-oeffne="kontakt-fenster"; die Mail-Adresse steht auf der Website nur als Text)
     chat     weiter zum Schwesterhaus Wirtschaft am Schlössli (Link zur Seite des Schlössli, zu seiner Reservation bei gastronovi oder seine Nummer);
              die Website hat keinen Gäste-Chat, der Schlüssel bleibt wie in den anderen Häusern
     route    Partnerhotel für die Nacht angesehen (Golfpanorama, Landgasthof Wartegg auf «Kontakt und Anreise») */
(function () {
  'use strict';
  var n = navigator, d = document, w = window;
  if (w.__registre || !n.sendBeacon || n.webdriver || w.self !== w.top) return;
  try { if (w.localStorage.getItem('schaefli-nicht-zaehlen') === '1') return; } catch (e) { /* privat: zählt normal */ }
  var teile = location.pathname.split('/'), datei = teile.pop() || 'index.html';
  if (teile.length > 2 || /^(studio|_werkzeuge|werkzeuge|werkbank|_werkbank|maison|marke|reception|registre|imprimerie|unterlagen|drucksachen|feed|material|bearbeitet|_varianten|_qa|_sicherung|weinwelt)$/.test(teile[1] || '')) return;   /* nur Seiten in der Wurzel der Website */
  if (!/^[a-z0-9-]{1,60}\.html$/.test(datei) || /varianten|^konzept|^bildauswahl|^vorschau|^404/.test(datei)) return;
  w.__registre = 1;
  var SPRACHEN = ' de en fr it nl es pt zh ja ko ar ';
  var sp = String(n.language || 'de').slice(0, 2).toLowerCase();
  if (SPRACHEN.indexOf(' ' + sp + ' ') < 0) sp = 'xx';
  var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
  var geraet = breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner';
  var her = '-';
  try { var r = d.referrer ? new URL(d.referrer).hostname.toLowerCase() : ''; if (r && r !== location.hostname && /^[a-z0-9.-]{3,60}$/.test(r)) her = r; } catch (e) {}
  var HAUS_TEL = /^tel:\+?(41527631172|0527631172)$/, SCHLOESSLI_TEL = /^tel:\+?(41716889092|0716889092)$/;
  var pv, war, liste, sichtbar, seit, gesendet;
  function neu() {
    pv = (Math.random().toString(36) + '000000').slice(2, 8);
    war = {}; liste = []; sichtbar = 0; gesendet = '';
    seit = d.visibilityState === 'hidden' ? 0 : Date.now();
    sende();
  }
  function sek() { return Math.min(1800, Math.round((sichtbar + (seit ? Date.now() - seit : 0)) / 1000)); }
  function sende() {
    var zeile = 'r1 ' + pv + ' ' + datei + ' ' + sp + ' ' + geraet + ' ' + sek() + ' ' + (liste.length ? liste.join(',') : '-') + ' ' + her;
    if (zeile === gesendet) return;
    gesendet = zeile;
    try { n.sendBeacon('/api/registre', zeile); } catch (e) {}   /* wartet auf keine Antwort */
  }
  function zaehle(was) {
    if (war[was]) return;
    war[was] = 1; liste.push(was);
    sende();
  }
  function weg() { if (seit) { sichtbar += Date.now() - seit; seit = 0; } sende(); }
  neu();
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') weg(); else if (!seit) seit = Date.now(); });
  w.addEventListener('pagehide', weg);
  w.addEventListener('pageshow', function (e) { if (e.persisted) neu(); });   /* zurück aus dem Seitenspeicher des Browsers: neuer Aufruf */

  /* «Ihr Abend»: begonnen mit «Abend beginnen» oder der ersten Wahl im Formular (Klick, Eingabe) */
  var abend = d.getElementById('abend-form');
  if (abend) {
    abend.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('button,input,select,textarea,label')) zaehle('fenster'); }, true);
    abend.addEventListener('input', function () { zaehle('fenster'); }, true);
  }

  d.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var o = t.closest('[data-oeffne]');
    if (o) { var id = o.getAttribute('data-oeffne'); if (id === 'anfrage') zaehle('tisch'); else if (id === 'kontakt-fenster') zaehle('mail'); return; }
    var a = t.closest('a[href]'); if (!a) return;
    var h = (a.getAttribute('href') || '').replace(/\s/g, ''), host = (a.hostname || '').toLowerCase();
    if (abend && h === '#wann') zaehle('fenster');
    else if (/(^|\.)zenchef\.com$/.test(host)) zaehle('booking');
    else if (/(^|\.)schloessli-bottighofen\.ch$|(^|\.)gastronovi\.com$/.test(host)) zaehle('chat');
    else if (/(^|\.)golfpanorama\.ch$|(^|\.)landgasthof-wartegg\.ch$/.test(host)) zaehle('route');
    else if (/^tel:/i.test(h)) { if (HAUS_TEL.test(h)) zaehle('anruf'); else if (SCHLOESSLI_TEL.test(h)) zaehle('chat'); }
    else if (/^mailto:/i.test(h)) zaehle('mail');
  }, true);

  /* Abgeschickt ist ein Formular erst, wenn es sein «Danke» zeigt (die Website prüft vorher die Felder). Nachgesehen wird kurz, höchstens 20 Sekunden;
     bleibt das Formular ohne «Danke» (Pflichtfeld leer), zählt nichts. Die Bewerbung (Jobs) zählt nicht, sie ist kein Gast. */
  function danach(pruef, was) {
    var bis = Date.now() + 20000;
    (function schau() { if (pruef()) { zaehle(was); return; } if (Date.now() < bis) setTimeout(schau, 250); })();
  }
  d.addEventListener('submit', function (e) {
    var fm = e.target; if (!fm || !fm.closest) return;
    if (fm.id === 'abend-form') {
      var tk = fm.querySelector('.tischkarte');
      if (tk) danach(function () { return tk.classList.contains('gesendet'); }, 'buchung');
      return;
    }
    var dlg = fm.closest('dialog'); if (!dlg || !/^(anfrage|gutschein-fenster|vormerken)$/.test(dlg.id)) return;
    var dk = fm.querySelector('.fd__danke');
    if (dk) danach(function () { return !dk.hidden; }, 'anfrage');
  }, true);
})();
