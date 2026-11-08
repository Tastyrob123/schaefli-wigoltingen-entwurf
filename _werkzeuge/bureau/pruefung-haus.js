/* pruefung-haus.js · Prüfseite im Rahmen des Schäfli (21.10.2026): Name des Werkzeugs aus der einen Stelle, «Zum Werkzeug» führt in dieses Werkzeug, nicht in den Stamm. */
(function () {
  var z = document.getElementById('wsp-zurueck'); if (z) z.href = '/_werkzeuge/bureau/';
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen.website;
  if (n) { document.querySelectorAll('[data-werkzeug]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }
})();
