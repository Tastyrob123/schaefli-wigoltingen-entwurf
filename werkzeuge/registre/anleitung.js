/* Anleitung Das Besucherbuch · Taverne zum Schäfli: Bild gross mit Klick, Esc schliesst; das Zeichen des Hauses (das Lamm, assets/zeichen/lamm.svg der Website)
   (eigene Datei: online laufen eingebettete Skripte ohne Prüfsumme nicht). */
(function () {
  var g = document.getElementById('gross'), im = g.querySelector('img');
  function zu() { g.hidden = true; }
  document.addEventListener('click', function (e) { var b = e.target.closest('.bild'); if (b) { im.src = b.querySelector('img').src; im.alt = b.querySelector('img').alt; g.hidden = false; } else if (e.target.closest('#gross')) zu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  fetch('/assets/zeichen/lamm.svg').then(function (r) { return r.text(); }).then(function (t) { var m = t.match(/<svg[^>]*>([\s\S]*)<\/svg>/); if (m) document.getElementById('zeichen').innerHTML = m[1]; }).catch(function () {});
})();
