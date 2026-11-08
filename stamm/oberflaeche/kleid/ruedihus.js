/* kleid/ruedihus.js · Hauswerte für oberflaeche.js. Im <head> VOR allen Stilen laden (ohne defer), damit nie das falsche Kleid aufblitzt. */
window.WO_HAUS = { kurz: 'ruedihus', name: 'Landgasthof Ruedihus', voll: 'Landgasthof Ruedihus Kandersteg', ort: 'Kandersteg', welt: 'land', rahmen: 'buehne',
  foto: '/assets/img/haus-daemmerung-l.webp', zeichen: '/assets/oberflaeche/kleid/ruedihus-zeichen.svg', zeichenMass: 0.75,
  wege: { zentrale: '/_werkzeuge/maison/', website: '/studio/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
