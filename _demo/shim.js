/* Demo-Weiche für GitHub Pages (Umzug von Vercel, 08.11.2026; Vorlage: Walk on the Wild Side, 01.11.2026).
   Online gibt es keinen Server: jede Anfrage der Werkzeuge an den Server wird mit den aufgenommenen Beispielwerten beantwortet.
   Gespeichertes bleibt nur in diesem Browser (localStorage), nichts geht an einen Server, Veröffentlichen bleibt aus.
   WEGE biegt Umleitungen um, die Vercel auf dem Server gemacht hat (z. B. /_werkzeuge/carte/ → /werkzeuge/carte/). */
(function () {
  'use strict';
  var KARTE = window.__DEMO_KARTE || {}, WEGE = window.__DEMO_WEGE || [], WEGE_RE = (window.__DEMO_WEGE_RE || []).map(function (w) { return [new RegExp(w[0]), w[1]]; }), LS = null;
  try { LS = window.localStorage; } catch (e) {}
  var ORIGIN = location.origin, BASE = ORIGIN + '/';
  var FLUECHTIG = /^(t|_|cb|ts|zeit|nocache|r|rnd|stamp)$/;
  function sauber(search) {                                 // Zeitstempel-Parameter fallen weg, Rest sortiert
    if (!search || search === '?') return '';
    var p = new URLSearchParams(search), a = [];
    p.forEach(function (v, k) { if (!FLUECHTIG.test(k)) a.push([k, v]); });
    a.sort(function (x, y) { return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0; });
    return a.length ? '?' + a.map(function (x) { return encodeURIComponent(x[0]) + '=' + encodeURIComponent(x[1]); }).join('&') : '';
  }
  function umbiegen(pfad) {
    for (var j = 0; j < WEGE_RE.length; j++) { if (WEGE_RE[j][0].test(pfad)) return pfad.replace(WEGE_RE[j][0], WEGE_RE[j][1]); }
    for (var i = 0; i < WEGE.length; i++) { var w = WEGE[i]; if (pfad.indexOf(w[0]) === 0) return w[1] + pfad.slice(w[0].length); }
    return pfad;
  }
  function norm(p) {
    try {
      var u = new URL(p, document.baseURI || location.href);
      if (u.origin !== ORIGIN) return null;
      if (/^\/(besuch|verweil)\.js$/.test(u.pathname)) return null;
      var roh = u.pathname.replace(/^\//, '');
      var pfad = umbiegen(u.pathname).replace(/^\//, '');
      return { weg: roh + sauber(u.search), nur: roh, ziel: pfad, zweg: pfad + sauber(u.search), suche: u.search, hash: u.hash };
    } catch (e) { return null; }
  }
  function eintrag(n) {
    var d = function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } };
    return KARTE[n.weg] || KARTE[d(n.weg)] || KARTE[n.zweg] || KARTE[d(n.zweg)] || KARTE[n.nur] || KARTE[d(n.nur)] || KARTE[n.ziel] || null;
  }
  function ziel(p) {
    var n = norm(p); if (!n) return null;
    var f = eintrag(n);
    if (f) return BASE + f;
    return BASE + n.ziel + n.suche + n.hash;
  }
  window.__demoZiel = ziel;

  function antwort(text, typ, st) { return new Response(text, { status: st || 200, headers: { 'Content-Type': typ || 'application/json; charset=utf-8' } }); }
  var fetchOrig = window.fetch.bind(window);

  /* Gespeichertes im Browser: POST/PUT mit JSON auf denselben Weg, den die Seite danach wieder liest */
  function gemerkt(n) { if (!LS) return null; try { return LS.getItem('demo:' + location.host + ':' + n.weg); } catch (e) { return null; } }
  function merke(n, koerper, f) {
    if (!LS || typeof koerper !== 'string') return Promise.resolve();
    var b; try { b = JSON.parse(koerper); } catch (e) { return Promise.resolve(); }
    if (!b || typeof b !== 'object' || Array.isArray(b)) return Promise.resolve();
    var quelle = gemerkt(n);
    var hol = quelle ? Promise.resolve(quelle) : (f ? fetchOrig(BASE + f).then(function (r) { return r.text(); }) : Promise.resolve(null));
    return hol.then(function (alt) {
      var a; try { a = JSON.parse(alt); } catch (e) { return; }
      if (!a || typeof a !== 'object' || Array.isArray(a)) return;
      var ks = Object.keys(b), treffer = ks.filter(function (k) { return k in a; }).length;
      if (!ks.length || treffer / ks.length < 0.5) return;
      var neu = {}; Object.keys(a).forEach(function (k) { neu[k] = a[k]; }); ks.forEach(function (k) { neu[k] = b[k]; });
      try { LS.setItem('demo:' + location.host + ':' + n.weg, JSON.stringify(neu)); } catch (e) {}
    });
  }
  function postAntwort(m, url, koerper) {
    var n = norm(url) || { weg: '', nur: '' }, k = m + ' ' + n.nur, f = KARTE[k];
    var g = KARTE[n.weg] || KARTE[n.nur];
    return merke(n, koerper, g).then(function () {
      if (f) return fetchOrig(BASE + f).then(function (x) { return x.text(); }).then(function (t) { return antwort(t, /\.html$/.test(f) ? 'text/html; charset=utf-8' : null, 200); });
      return antwort(JSON.stringify({ ok: true, demo: true, hinweis: 'Demo: gespeichert nur in diesem Browser.' }));
    });
  }
  function istStatisch(n) { return !eintrag(n); }
  window.fetch = function (inp, init) {
    var url = typeof inp === 'string' ? inp : (inp && inp.url) || String(inp);
    var m = ((init && init.method) || (inp && inp.method) || 'GET').toUpperCase();
    var n = norm(url);
    if (!n) return fetchOrig(inp, init);
    if (m !== 'GET' && m !== 'HEAD') {
      var b = init && init.body;
      return postAntwort(m, url, typeof b === 'string' ? b : null);
    }
    var lokal = gemerkt(n);
    if (lokal != null) return Promise.resolve(antwort(lokal));
    var z = ziel(url);
    return fetchOrig(z, { method: m, cache: 'no-store' }).then(function (r) {
      if (r.ok) return r;
      if (/\/api\//.test(n.nur) || /^api\//.test(n.nur)) return antwort(JSON.stringify({ ok: true, demo: true, liste: [], eintraege: [] }));
      return r;
    }, function () { return antwort(JSON.stringify({ ok: true, demo: true })); });
  };

  var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, url) {
    var a = [].slice.call(arguments); this.__m = String(m).toUpperCase();
    var n = norm(url);
    if (n && this.__m === 'GET') a[1] = ziel(url);
    else if (n) { this.__demoPost = url; a[0] = 'GET'; a[1] = BASE + '_demo/ok.json'; }
    return XO.apply(this, a);
  };
  XMLHttpRequest.prototype.send = function (b) { return XS.call(this, this.__demoPost ? null : b); };
  if (navigator.sendBeacon) { var sbOrig = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function (u, d) { return /^https:\/\/tasty-besuche\.vercel\.app\//.test(String(u)) ? sbOrig(u, d) : true; }; }
  if (window.EventSource) window.EventSource = function () { this.close = function () {}; this.addEventListener = function () {}; };

  /* src/href beim Setzen umbiegen */
  function brauchts(v) {
    if (typeof v !== 'string' || v.charAt(0) === '#' || /^(data|blob|mailto|tel|javascript):/i.test(v)) return false;
    var n = norm(v); if (!n) return false;
    return !!eintrag(n) || n.ziel !== n.nur;
  }
  [['HTMLImageElement', 'src'], ['HTMLScriptElement', 'src'], ['HTMLLinkElement', 'href'], ['HTMLIFrameElement', 'src'], ['HTMLSourceElement', 'src'],
   ['HTMLVideoElement', 'src'], ['HTMLAudioElement', 'src'], ['HTMLAnchorElement', 'href'], ['HTMLVideoElement', 'poster'], ['HTMLFormElement', 'action']].forEach(function (z) {
    var K = window[z[0]]; if (!K) return;
    var d = Object.getOwnPropertyDescriptor(K.prototype, z[1]); if (!d || !d.set) return;
    Object.defineProperty(K.prototype, z[1], { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { d.set.call(this, brauchts(v) ? ziel(v) : v); } });
  });
  function satz(v) { return typeof v !== 'string' ? v : v.split(',').map(function (c) { var t = c.trim().split(/\s+/); return (brauchts(t[0]) ? ziel(t[0]) : t[0]) + (t[1] ? ' ' + t[1] : ''); }).join(', '); }
  var setA = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if ((n === 'src' || n === 'href' || n === 'poster') && brauchts(v)) v = ziel(v);
    if (n === 'srcset' || n === 'imagesrcset') v = satz(v);
    return setA.call(this, n, v);
  };
  [['HTMLImageElement', 'srcset'], ['HTMLSourceElement', 'srcset']].forEach(function (z) {
    var K = window[z[0]]; if (!K) return;
    var d = Object.getOwnPropertyDescriptor(K.prototype, z[1]); if (!d || !d.set) return;
    Object.defineProperty(K.prototype, z[1], { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { d.set.call(this, satz(v)); } });
  });
  var stP = CSSStyleDeclaration.prototype, setP = stP.setProperty;
  function bildUrl(v) { return typeof v !== 'string' ? v : v.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (g, q, u) { return brauchts(u) ? 'url(' + q + ziel(u) + q + ')' : g; }); }
  stP.setProperty = function (n, v, p) { return setP.call(this, n, bildUrl(v), p); };
  ['backgroundImage', 'background'].forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(stP, k); if (!d || !d.set) return;
    Object.defineProperty(stP, k, { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { d.set.call(this, bildUrl(v)); } });
  });
  var ATTR = ['src', 'href', 'poster', 'data-src'];
  function biege(el) {
    if (!el || el.nodeType !== 1) return;
    for (var i = 0; i < ATTR.length; i++) {
      var a = ATTR[i], v = el.getAttribute(a);
      if (!v || el.__demoGebogen === v) continue;
      if (brauchts(v)) { var z = ziel(v); el.__demoGebogen = z; setA.call(el, a, z); }
    }
    var st = el.getAttribute('style');
    if (st && /url\(/.test(st)) {
      var st2 = st.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (g, q, u) { return brauchts(u) ? 'url(' + q + ziel(u) + q + ')' : g; });
      if (st2 !== st) setA.call(el, 'style', st2);
    }
    var ss = el.getAttribute('srcset');
    if (ss) {
      var neu = ss.split(',').map(function (c) { var t = c.trim().split(/\s+/); return (brauchts(t[0]) ? ziel(t[0]) : t[0]) + (t[1] ? ' ' + t[1] : ''); }).join(', ');
      if (neu !== ss) setA.call(el, 'srcset', neu);
    }
  }
  function alle(root) { if (root.nodeType !== 1) return; biege(root); var l = root.querySelectorAll('[src],[href],[srcset],[poster],[data-src],[style]'); for (var i = 0; i < l.length; i++) biege(l[i]); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'attributes') biege(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) alle(m.addedNodes[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'srcset', 'poster', 'data-src', 'style'] });
  document.addEventListener('DOMContentLoaded', function () { alle(document.documentElement); });
  var asg = window.Location && Location.prototype.assign;
  if (asg) Location.prototype.assign = function (u) { return asg.call(this, brauchts(u) ? ziel(u) : u); };
  var rep = window.Location && Location.prototype.replace;
  if (rep) Location.prototype.replace = function (u) { return rep.call(this, brauchts(u) ? ziel(u) : u); };
  var wo = window.open; window.open = function (u) { var a = [].slice.call(arguments); if (u && brauchts(u)) a[0] = ziel(u); return wo.apply(window, a); };
})();
