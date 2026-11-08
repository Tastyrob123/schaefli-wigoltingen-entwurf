/* kleid/doldenhorn.js · Hauswerte für oberflaeche.js. Im <head> VOR allen Stilen laden (ohne defer), damit nie das falsche Kleid aufblitzt. */
window.WO_HAUS = { kurz: 'doldenhorn', name: 'Waldhotel Doldenhorn', voll: 'Waldhotel Doldenhorn Kandersteg', ort: 'Kandersteg', welt: 'grand', rahmen: 'buehne',
  foto: '/assets/img/haus-abend-l.webp', zeichen: '/assets/oberflaeche/kleid/doldenhorn-zeichen.svg', zeichenMass: 0.69,
  wege: { zentrale: '/_werkzeuge/maison/', website: '/studio/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
