/* kleid/carlton.js · Hauswerte für oberflaeche.js. Im <head> VOR allen Stilen laden (ohne defer), damit nie das falsche Kleid aufblitzt. */
window.WO_HAUS = { kurz: 'carlton', name: 'Carlton-Europe', voll: 'Carlton-Europe Interlaken', ort: 'Interlaken', welt: 'grand', rahmen: 'inseln',
  foto: '/assets/img/haus-tag2-l.webp', zeichen: '/assets/oberflaeche/kleid/carlton-zeichen.svg', zeichenMass: 1.63,
  wege: { zentrale: '/maison/', website: '/control/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
