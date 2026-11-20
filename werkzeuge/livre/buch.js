/* Markenbuch · «Als PDF sichern» öffnet das Druckfenster des Browsers (je Kapitel eine A4-Seite quer, buch.css @media print).
   Fotos laden zuerst nur im Blick (lazy); kurz nach dem Laden und vor jedem Druck werden alle geholt, damit im PDF keines fehlt. */
'use strict';
(function () {
  const alle = () => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }); }));   /* addEventListener statt onload: ein zweiter Aufruf überschrieb sonst den ersten, der Druck kam nie (Demo-Check Schlössli 21.10.2026) */
  const b = document.getElementById('bu-pdf');
  if (b) b.addEventListener('click', () => alle().then(() => window.print()));
  addEventListener('beforeprint', () => { [...document.images].forEach(i => { i.loading = 'eager'; }); });
  addEventListener('load', () => setTimeout(alle, 1200));
})();

/* Robert 09.11.2026: keine Leerfläche unter der kürzeren Tafel. Die Logofläche wächst mit dem Foto daneben, die Schriftangaben verteilen sich über die Höhe des Musters */
(function () {
  const st = document.createElement('style');
  st.textContent = '@media screen and (min-width:761px){.wm figure{display:flex;flex-direction:column}.wm figure .alt{flex:1;align-items:center}.muster{align-items:stretch}.muster>dl{display:flex;flex-direction:column;justify-content:space-between}}';
  document.head.appendChild(st);
})();

/* Auftritte im Markenbuch aus der Marken-Station (Robert 09.11.2026: «Bei Markenbuch … fehlen mir auch diese ganzen Animationen und Effekte zum Hochscrollen … dieses luxuriöse, edle, überall»).
   Das Buch hat seit 21.10.2026 die Bausteine der Marken-Station (fz, blatt, figure …); die Auftritte oben suchen die alten (bu-…) und fanden nichts mehr.
   Die Blöcke schweben schon über [data-a] (Skript im Buch). Dazu hier, sobald ein Block ankommt: Fotos und Logos zoomen in ihren Rahmen,
   Farbfeld und abgeleitete Töne füllen sich von links. Nur transform und clip-path, einmal, kein Rücksprung. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !document.querySelector('[data-a]')) return;
  const e = 'cubic-bezier(.16,1,.3,1)', st = document.createElement('style');
  st.textContent = '@media screen{'
    + `html.bu5 .fz__b,html.bu5 .bild{overflow:hidden}html.bu5 [data-a] img{transform:scale(1.08);transition:transform 1.7s ${e} .12s}html.bu5 [data-a].da img{transform:none}`
    + `html.bu5 .fz__f{clip-path:inset(0 100% 0 0);transition:clip-path 1s ${e} .35s}html.bu5 .fz.da .fz__f{clip-path:inset(0)}`
    + `html.bu5 .fz__s span{clip-path:inset(0 100% 0 0);transition:clip-path .8s ${e};transition-delay:calc(.55s + var(--i,0) * 90ms)}html.bu5 .fz.da .fz__s span{clip-path:inset(0)}`
    + '}@media print{html.bu5 [data-a] img,html.bu5 .fz__f,html.bu5 .fz__s span{transform:none!important;clip-path:none!important}}';
  document.head.appendChild(st);
  document.querySelectorAll('.fz__s').forEach(g => [...g.children].forEach((s, i) => s.style.setProperty('--i', i)));
  document.documentElement.classList.add('bu5');
})();
