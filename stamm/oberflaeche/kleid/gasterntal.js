/* kleid/gasterntal.js · Hauswerte für oberflaeche.js. Im <head> VOR allen Stilen laden (ohne defer), damit nie das falsche Kleid aufblitzt. */
window.WO_HAUS = { kurz: 'gasterntal', name: 'Berghotel Gasterntal', voll: 'Berghotel Gasterntal Kandersteg', ort: 'Gasterntal', welt: 'land', rahmen: 'buehne',
  foto: '/assets/img/haus-profil-l.webp', zeichen: '/assets/oberflaeche/kleid/gasterntal-zeichen.svg', zeichenMass: 1.6,
  wege: { zentrale: '/_werkzeuge/maison/', website: '/studio/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
/* Jede Seite öffnet oben, auch nach Neuladen und Zurück (Robert 18.10.2026 18:30: «… dass … die Links oben die Seite zeigen») */
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
