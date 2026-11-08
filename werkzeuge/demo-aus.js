// Kuchler-Upload 21.10.2026: Kopie von Carlton-Europe _werkzeuge/online/_online/demo_aus.js, dazu ein Schild «Demo» (Auftrag Oberchef: «Demo» sichtbar).
// Demo-Fassung online (Robert 17.10.2026 ~22:50 zu Le Bureau: «dass wir das erstmal ausstellen für die Demo, weil da Fehleranfälligkeiten sind …
// man kann es dann da einmal anschauen, kurz in der Vorschau», ~23:05: «in allen»): In jedem Werkzeug ist «Veröffentlichen» online aus,
// ansehen und Vorschau gehen. Liegt nur im Online-Ordner (werkzeuge_online.py hängt es in jede Werkzeug-Seite), am Rechner bleibt alles, wie es ist.
// Die Weiche (middleware.js) lehnt Veröffentlichen zusätzlich auf dem Server ab.
(function () {
  var SATZ = 'In dieser Vorschau ist Veröffentlichen ausgeschaltet. Sie können alles ansehen und in der Vorschau ausprobieren, auf die Website geht nichts.';
  function istRaus(b) { return /^(jetzt\s+)?ver(ö|oe)ffentlichen\b/i.test((b.textContent || '').replace(/\s+/g, ' ').trim()); }
  function markiere() {
    document.querySelectorAll('button, a, [role="button"]').forEach(function (b) {
      if (!b.hasAttribute('data-demo-aus') && istRaus(b)) { b.setAttribute('data-demo-aus', ''); b.setAttribute('aria-disabled', 'true'); b.title = SATZ; }
    });
  }
  function hinweis() {
    var h = document.getElementById('demo-aus-h');
    if (!h) { h = document.createElement('div'); h.id = 'demo-aus-h'; h.setAttribute('role', 'status'); h.textContent = SATZ; document.body.appendChild(h); }
    h.classList.add('an'); clearTimeout(h._t); h._t = setTimeout(function () { h.classList.remove('an'); }, 5200);
  }
  if (!document.body) document.addEventListener('DOMContentLoaded', schild);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-demo-aus]');
    if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); hinweis();
  }, true);
  var st = document.createElement('style');
  st.textContent = '[data-demo-aus]{opacity:.5!important;cursor:not-allowed!important}'
    + '#demo-aus-h{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);width:max-content;max-width:min(92vw,540px);padding:14px 20px;border-radius:14px;'
    + 'background:#0b1f40;color:#fbf6ea;font-family:inherit;font-size:15px;line-height:1.45;text-align:center;box-shadow:0 18px 40px -12px rgba(0,0,0,.5);'
    + 'opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;z-index:2147483647}#demo-aus-h.an{opacity:1;transform:translate(-50%,0)}'
    + '#demo-schild{position:fixed;right:8px;bottom:6px;padding:3px 8px;border-radius:6px;background:#15161c;color:#f3eee4;font:500 11px/1.3 system-ui,-apple-system,sans-serif;letter-spacing:.06em;text-transform:uppercase;pointer-events:none;z-index:2147483646}'
    + '@media print{#demo-schild,#demo-aus-h{display:none}}';
  (document.head || document.documentElement).appendChild(st);
  function schild() {
    if (document.getElementById('demo-schild') || !document.body) return;
    var s = document.createElement('div'); s.id = 'demo-schild'; s.textContent = 'Demo'; s.title = 'Vorführung: nichts wird gespeichert oder veröffentlicht.';
    document.body.appendChild(s);
  }
  markiere(); schild();
  new MutationObserver(markiere).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
})();
