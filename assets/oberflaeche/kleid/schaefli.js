/* kleid/schaefli.js · Hauswerte für oberflaeche.js (Taverne zum Schäfli, Wigoltingen TG, 21.10.2026). Im <head> VOR allen Stilen laden (ohne defer).
   Welt «land» aus marke.json (Station 5), Rahmen «Die Bühne» wie das Schwesterhaus Wirtschaft am Schlössli (Wechsel = eine Zeile hier).
   Liegt unter _werkzeuge/oberflaeche/ und wird von den Werkzeug-Servern unter /assets/oberflaeche/ ausgeliefert (einziger Schreiber: Chat «Zentrale»).
   Fotos und Schriften kommen aus der Website des Hauses (/assets/img/, /assets/schrift/), das Lamm aus /assets/zeichen/lamm.svg. */
window.WO_HAUS = { kurz: 'schaefli', name: 'Taverne zum Schäfli', voll: 'Taverne zum Schäfli Wigoltingen', ort: 'Wigoltingen', welt: 'land', rahmen: 'buehne',
  foto: '/assets/img/haus-tag-1200.webp', zeichen: '/assets/oberflaeche/kleid/schaefli-zeichen.svg', zeichenMass: 0.788,
  /* Namen der sieben Werkzeuge im Schäfli (Robert 21.10.2026, nach drei abgelehnten eigenen Runden: «Ja, dann ist hier auch so die Stube und der Schreibtisch
     und so» = die Landhaus-Namen wie Ruedihus und Gasterntal): die EINE Stelle. Dateien, Schlüssel und Adressen bleiben. */
  namen: { zentrale: 'Die Stube', website: 'Der Schreibtisch', karten: 'Die Tafel', gaeste: 'Der Gastgeber', marke: 'Das Hausbuch', besuche: 'Das Besucherbuch', druck: 'Die Werkstatt' },
  wege: { zentrale: '/_werkzeuge/maison/', website: '/_werkzeuge/bureau/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
