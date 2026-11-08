/* Taverne zum Schäfli · Gäste-Funktionen: Weinberater, Weinansicht, Ihr Abend, Gutschein, Vormerken.
   Vor dem Auftrag simuliert: nichts wird verschickt, gebucht oder bezahlt. Der Abend liegt nur im Tab des Gastes (sessionStorage). */
(function () {
  'use strict';
  var d = document, w = window;
  var SCHLUESSEL = 'schaefli-abend';
  function lies() { try { return JSON.parse(sessionStorage.getItem(SCHLUESSEL)) || { weine: [] }; } catch (e) { return { weine: [] }; } }
  function schreib(s) { try { sessionStorage.setItem(SCHLUESSEL, JSON.stringify(s)); } catch (e) {} chip(); }
  function chf(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’') + '.'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Auswahl im Hausstil: in jeder Gruppe ist eine Taste gedrückt (Weinberater: mehrere je Gruppe möglich) */
  d.addEventListener('click', function (ev) {
    var b = ev.target.closest('.pult__wahl button');
    if (!b || b.closest('.berater__pult') || b.hasAttribute('data-gang')) return;
    [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    b.parentNode.dispatchEvent(new CustomEvent('gewaehlt', { bubbles: true, detail: b }));
  });

  /* Kleiner Hinweis unten rechts: wie viele Flaschen für den Abend bereitliegen */
  function chip() {
    var c = d.querySelector('.abend-chip'); if (!c) return;
    var n = lies().weine.length; c.hidden = n === 0 || !!d.getElementById('abend-form');
    c.querySelector('[data-chip-zahl]').textContent = n === 1 ? '1 Flasche' : n + ' Flaschen';
  }
  chip();

  /* Weinberater und Weinansicht */
  var WEINE = null;
  function weine(cb) {
    if (WEINE) return cb(WEINE);
    fetch('assets/daten/wein.json').then(function (r) { return r.json(); }).then(function (j) { WEINE = j; cb(j); }).catch(function () { });   // abgebrochenes Laden: still, der nächste Klick lädt neu
  }
  var dlg = d.getElementById('wein-ansicht'), aktuell = null;
  function ansicht(id) {
    weine(function (W) {
      var v = W[id]; if (!v || !dlg) return; aktuell = v;
      dlg.querySelector('.wa__art').textContent = v.art + (v.reb.length ? ' · ' + v.reb.join(', ') : '');
      dlg.querySelector('.wa__name').textContent = v.name;
      dlg.querySelector('.wa__erzeuger').textContent = v.erzeuger || '';
      dlg.querySelector('[data-f="herkunft"]').textContent = [v.land, v.region].filter(Boolean).join(' · ') || v.art;
      dlg.querySelector('[data-f="jahr"]').textContent = v.jahr || 'ohne Jahrgang';
      dlg.querySelector('[data-f="groesse"]').textContent = v.groesse;
      dlg.querySelector('[data-f="preis"]').textContent = 'CHF ' + chf(v.preis);
      dlg.querySelector('.wa__zusatz').textContent = v.zusatz || '';
      var fl = dlg.querySelector('.wa__flasche'); fl.hidden = !v.bild;
      fl.innerHTML = v.bild ? '<img src="' + v.bild + '" alt="' + esc(v.jahr + ' ' + v.name) + '">' : '';
      var schon = lies().weine.some(function (x) { return x.id === v.id; });
      dlg.querySelector('.wa__gelegt').hidden = !schon;
      if (dlg.showModal && !dlg.open) dlg.showModal();
    });
  }
  if (dlg) {
    dlg.querySelector('.fd__zu').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
    [].forEach.call(dlg.querySelectorAll('[data-behandlung]'), function (b) {
      b.addEventListener('click', function () { [].forEach.call(dlg.querySelectorAll('[data-behandlung]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
    });
    dlg.querySelector('[data-zum-abend]').addEventListener('click', function () {
      if (!aktuell) return;
      var s = lies(), beh = dlg.querySelector('[data-behandlung][aria-pressed="true"]').dataset.behandlung;
      s.weine = s.weine.filter(function (x) { return x.id !== aktuell.id; });
      s.weine.push({ id: aktuell.id, name: aktuell.name, jahr: aktuell.jahr, erzeuger: aktuell.erzeuger, preis: aktuell.preis, groesse: aktuell.groesse, behandlung: beh });
      schreib(s); dlg.querySelector('.wa__gelegt').hidden = false;
    });
  }
  [].forEach.call(d.querySelectorAll('.wk-pos[data-wein]'), function (p) {
    p.addEventListener('click', function () { ansicht(+p.dataset.wein); });
    p.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ansicht(+p.dataset.wein); } });
  });

  var pult = d.querySelector('.berater__pult');
  if (pult) {
    var liste = d.querySelector('[data-berater-liste]'), zahl = d.querySelector('[data-berater-zahl]'), mehr = d.querySelector('[data-berater-mehr]'), zeigen = 12;
    var wahl = function (g) { return [].slice.call(pult.querySelectorAll('[data-wahl="' + g + '"][aria-pressed="true"]')).map(function (b) { return b.dataset.wert; }); };
    var karte = function (v) {
      return '<button type="button" class="wk-karte" data-id="' + v.id + '"><span class="mono wk-karte__art">' + esc(v.art + (v.land ? ' · ' + v.land : '')) + '</span>' +
        '<b class="wk-karte__name">' + esc(v.name) + '</b><span class="vers wk-karte__erz">' + esc(v.erzeuger || '') + '</span>' +
        '<span class="wk-karte__fuss"><span class="mono">' + esc((v.jahr || 'ohne Jahrgang') + ' · ' + v.groesse) + '</span><b class="mono">' + chf(v.preis) + '</b></span></button>';
    };
    var zeichne = function () {
      weine(function (W) {
        var art = wahl('art'), reb = wahl('reb'), land = wahl('land'), preis = wahl('preis');
        var t = W.filter(function (v) {
          if (art.length && art.indexOf(v.art) < 0) return false;
          if (reb.length && !v.reb.some(function (r) { return reb.indexOf(r) > -1; })) return false;
          if (land.length && land.indexOf(v.land) < 0) return false;
          if (preis.length && !preis.some(function (p) { var a = p.split('-'); return v.preis >= +a[0] && v.preis <= +a[1]; })) return false;
          return true;
        }).sort(function (a, b) { return a.preis - b.preis; });
        zahl.textContent = t.length;
        var h = liste.offsetHeight; liste.style.minHeight = h + 'px';
        liste.innerHTML = t.slice(0, zeigen).map(karte).join('') || '<p class="ab-leer">Diese Auswahl führt die Weinkarte nicht. Lösen Sie eine Wahl, dann erscheinen wieder Weine.</p>';
        mehr.hidden = t.length <= zeigen;
        requestAnimationFrame(function () { liste.style.minHeight = ''; });
      });
    };
    pult.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.classList.contains('pult__leeren')) [].forEach.call(pult.querySelectorAll('[aria-pressed="true"]'), function (x) { x.setAttribute('aria-pressed', 'false'); });
      else if (b.dataset.wahl) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      zeigen = 12; zeichne();
    });
    mehr.addEventListener('click', function () { zeigen += 12; zeichne(); });
    liste.addEventListener('click', function (ev) { var k = ev.target.closest('.wk-karte'); if (k) ansicht(+k.dataset.id); });
    zeichne();
  }

  /* Ihr Abend «Der Abend entsteht»: Tisch, Menü, Wein, Wünsche, Angaben; die Tischkarte füllt sich mit jeder Wahl */
  var form = d.getElementById('abend-form');
  if (form) {
    var st = lies(), personen = 2;
    var out = form.querySelector('output[name="personen"]');
    var WORT = ['', 'eine Person', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
    var gedrueckt = function (g) { var b = form.querySelector('[data-wahl="' + g + '"][aria-pressed="true"]'); return b ? b.dataset.wert : ''; };
    var menue = function () { return form.querySelector('.tm[aria-pressed="true"]'); };
    var satz = function (k, t) { var el = form.querySelector('[data-satz="' + k + '"]'); if (el && el.textContent !== t) el.textContent = t; };

    /* Die nächsten offenen Abende: Mittwoch bis Samstag, ohne Betriebsferien */
    var tage = form.querySelector('[data-tage]');
    if (tage) {
      var ferien = tage.dataset.ferien.split('|').map(function (f) { var x = f.split('–'); return [new Date(x[0] + 'T00:00'), new Date(x[1] + 'T23:59')]; });
      var WT = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], MO = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      var t = new Date(); t.setHours(12, 0, 0, 0); var html = '', n = 0;
      for (var i = 0; i < 160 && n < 14; i++) {
        var x = new Date(t.getTime() + i * 864e5), wd = x.getDay();
        if (wd < 3 || ferien.some(function (f) { return x >= f[0] && x <= f[1]; })) continue;
        n++;
        html += '<button type="button" class="ia-tag" data-datum="' + WT[wd] + ', ' + x.getDate() + '. ' + MO[x.getMonth()] + ' ' + x.getFullYear() + '" aria-pressed="false" style="--i:' + (n - 1) + '">' +
          '<span>' + WT[wd].slice(0, 2) + '</span><b>' + x.getDate() + '</b><span>' + MO[x.getMonth()].slice(0, 3) + (MO[x.getMonth()].length > 4 ? '.' : '') + '</span></button>';
      }
      tage.innerHTML = html;
    }

    /* Gedecke: für jeden Gast eines, bis zwölf */
    var gedecke = form.querySelector('[data-gedecke]');
    var deckeAuf = function () {
      var soll = Math.min(personen, 12), ist = gedecke.querySelectorAll('.ia-gedeck').length;
      for (; ist < soll; ist++) { var g = d.createElement('span'); g.className = 'ia-gedeck'; g.innerHTML = gedecke.dataset.svg; gedecke.insertBefore(g, gedecke.querySelector('.ia-mehr')); requestAnimationFrame(function (el) { return function () { requestAnimationFrame(function () { el.classList.add('da'); }); }; }(g)); }
      for (; ist > soll; ist--) { var l = gedecke.querySelectorAll('.ia-gedeck'); gedecke.removeChild(l[l.length - 1]); }
      var m = gedecke.querySelector('.ia-mehr'); if (personen > 12) { if (!m) { m = d.createElement('span'); m.className = 'ia-mehr'; gedecke.appendChild(m); } m.textContent = '+' + (personen - 12); } else if (m) gedecke.removeChild(m);
    };

    var flaschen = function () {
      var box = form.querySelector('[data-flaschen]'); st = lies();
      if (!st.weine.length) { box.innerHTML = '<p class="ia-notiz">Noch keine Flasche bereitgelegt. Im Keller wählen Sie aus der ganzen Weinkarte, wir legen die Flaschen bereit oder dekantieren sie.</p>'; return; }
      var zeichne = function (W) {
        box.innerHTML = st.weine.map(function (v, i) {
          var b = W && W[v.id] && W[v.id].bild;
          var wahl = function (k, t) { return '<button type="button" class="ia-chip" data-fl="' + i + '" data-b="' + k + '" aria-pressed="' + (v.behandlung === k) + '"><i class="ia-haken" aria-hidden="true"></i><span>' + t + '</span></button>'; };
          return '<div class="ia-flasche">' +
            (b ? '<div class="ia-flasche__bild"><img src="' + b + '" alt="' + esc((v.jahr ? v.jahr + ' ' : '') + v.name) + '"></div>' : '<div class="ia-flasche__bild ia-flasche__bild--jahr"><b>' + esc(v.jahr || 'ohne Jahrgang') + '</b></div>') +
            '<div class="ia-flasche__text"><b>' + esc((v.jahr ? v.jahr + ' ' : '') + v.name) + '</b>' + (v.erzeuger ? '<span>' + esc(v.erzeuger) + '</span>' : '') + '<span class="ia-flasche__preis">' + esc(v.groesse) + ' für CHF ' + chf(v.preis) + '</span></div>' +
            '<div class="ia-flasche__wahl">' + wahl('bereitlegen', 'Bereitlegen') + wahl('dekantieren', 'Dekantieren') + '<button type="button" class="ia-weg-link" data-weg="' + i + '">Entfernen</button></div></div>';
        }).join('');
      };
      zeichne(WEINE); if (!WEINE) weine(zeichne);
    };
    var gangwein = function () {
      var m = menue(), box = form.querySelector('[data-gangwein]'), ol = box.querySelector('ol');
      var gaenge = m ? m.dataset.gaenge.split('|').filter(Boolean) : [];
      box.hidden = !gaenge.length || !st.weine.length || gedrueckt('wein') !== 'Keller';
      if (box.hidden) return;
      var alt = {}; [].forEach.call(ol.querySelectorAll('[data-gang][aria-pressed="true"]'), function (b) { alt[b.dataset.gang] = b.dataset.wein; });
      ol.innerHTML = gaenge.map(function (g, gi) {
        var knopf = function (wert, t, an) { return '<button type="button" class="ia-chip" data-gang="' + gi + '" data-wein="' + wert + '" aria-pressed="' + an + '"><i class="ia-haken" aria-hidden="true"></i><span>' + t + '</span></button>'; };
        var opt = [knopf('', 'Der Sommelier wählt', !alt[gi])].concat(st.weine.map(function (v, i) { return knopf(i, esc((v.jahr ? v.jahr + ' ' : '') + v.name), alt[gi] === String(i)); }));
        return '<li><span class="ia-gang">' + esc(g) + '</span><div class="ia-gang__wahl">' + opt.join('') + '</div></li>';
      }).join('');
    };
    var keller = function () {
      var k = gedrueckt('wein') === 'Keller'; form.querySelector('[data-keller]').hidden = !k;
      var n = st.weine.length;
      satz('wein', !k ? 'Fabian Mennel wählt die Weine zu Ihrem Menü.' : (n ? (n === 1 ? 'Eine Flasche liegt' : (WORT[n] || n).replace(/^./, function (c) { return c.toUpperCase(); }) + ' Flaschen liegen') + ' für Sie bereit.' : 'Wählen Sie im Keller Ihre Flaschen, wir legen sie bereit.'));
    };

    /* Die Bühne: das gewählte Menü steigt von unten ins Bild, die Gänge bauen sich Zeile für Zeile auf */
    var buehne = form.querySelector('.ia-buehne');
    var hoehe = function () {
      if (w.innerWidth <= 760) { buehne.style.minHeight = ''; return; }
      var max = 0;
      [].forEach.call(buehne.querySelectorAll('.ia-teller'), function (t) { var h = t.hidden; t.hidden = false; t.classList.add('mess'); max = Math.max(max, t.offsetHeight); t.classList.remove('mess'); t.hidden = h; });
      buehne.style.minHeight = max + 'px';
    };
    var zeige = function (k) {
      var neu = buehne.querySelector('[data-teller="' + k + '"]'), alt = buehne.querySelector('.ia-teller:not([hidden]):not(.geht)');
      if (!neu || neu === alt) return;
      [].forEach.call(buehne.querySelectorAll('.geht'), function (x) { x.classList.remove('geht'); x.hidden = true; });
      if (alt) alt.classList.add('geht');
      neu.classList.remove('da'); neu.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { neu.classList.add('da'); }); });
      setTimeout(function () { if (alt && alt.classList.contains('geht')) { alt.classList.remove('geht', 'da'); alt.hidden = true; } }, 1100);
    };
    var waehle = function (b) {
      [].forEach.call(form.querySelectorAll('.tm'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      zeige(b.dataset.menue); gangwein();
    };
    var regeln = function () {
      var zeit = gedrueckt('zeit'), weg = false;
      [].forEach.call(form.querySelectorAll('.tm'), function (t) {
        var k = t.dataset.menue, aus = (personen >= 8 && k === 'karte') || (personen < 8 && /^g\d/.test(k)) || (zeit === 'Abend' && k === 'mittag');
        t.hidden = aus; t.disabled = aus; if (aus && t.getAttribute('aria-pressed') === 'true') { t.setAttribute('aria-pressed', 'false'); weg = true; }
      });
      if (weg || !menue()) waehle(form.querySelector('.tm:not([hidden])'));
      form.querySelector('[data-hinweis-gruppe]').hidden = personen < 8;
    };
    var weg = [].slice.call(form.querySelectorAll('[data-weg]')), besucht = {};
    var fertig = function (id) {
      if (id === 'wann') return !!form.datum.value.trim();
      if (id === 'menue-wahl') return !!menue() && !!besucht[id];
      if (id === 'anfrage') return !!form.name.value.trim() && /@/.test(form.mail.value);
      return !!besucht[id];
    };
    var wegZeichnen = function (aktiv) {
      weg.forEach(function (a) { var id = a.dataset.weg; a.classList.toggle('jetzt', id === aktiv); a.classList.toggle('fertig', fertig(id)); });
    };
    var aktiv = 'wann';
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (ein) {
        ein.forEach(function (x) { if (x.isIntersecting) { besucht[aktiv] = besucht[aktiv] || aktiv !== x.target.dataset.schritt; aktiv = x.target.dataset.schritt; wegZeichnen(aktiv); } });
      }, { rootMargin: '-45% 0px -50% 0px' });
      [].forEach.call(form.querySelectorAll('[data-schritt]'), function (s) { io.observe(s); });
    }

    var karte = function () {
      var m = menue(), datum = form.datum.value.trim(), zeit = gedrueckt('zeit') || 'Abend', anlass = gedrueckt('anlass');
      var tk = function (k, t) { var el = form.querySelector('[data-tk="' + k + '"]'); if (el.textContent === t) return; el.textContent = t; el.classList.remove('neu'); void el.offsetWidth; el.classList.add('neu'); };
      var name = form.name.value.trim();
      tk('fuer', name ? 'Für ' + name : 'Ihr Tisch');
      tk('tisch', personen + (personen === 1 ? ' Person' : ' Personen') + ' · ' + zeit + (anlass && anlass !== 'Einfach so' ? ' · ' + anlass : ''));
      tk('datum', datum || 'Datum folgt');
      tk('menue', m ? m.dataset.name : 'Menü noch offen');
      var kel = gedrueckt('wein') === 'Keller';
      tk('wein', kel && st.weine.length ? st.weine.map(function (v) { return (v.jahr ? v.jahr + ' ' : '') + v.name + ' (' + v.behandlung + ')'; }).join(' · ') : 'Wein: Sommelier wählt');
      var al = [].slice.call(form.querySelectorAll('input[name="allergie"]:checked')).map(function (x) { return x.value; });
      if (form.vegetarisch.checked) al.push('vegetarisch'); if (form.hund.checked) al.push('mit Hund');
      var wu = form.wuensche.value.trim();
      tk('wuensche', al.length || wu ? (al.join(', ') + (wu ? (al.length ? ' · ' : '') + wu : '')) : 'Keine Allergien angegeben');
      var p = m ? +m.dataset.preis : 0, wein = kel ? st.weine.reduce(function (a, v) { return a + v.preis; }, 0) : 0;
      tk('richt', 'Menü für ' + (personen === 1 ? 'eine Person' : personen + ' Personen') + ': ' + (p ? 'CHF ' + chf(p * personen) : (m && m.dataset.menue === 'karte' ? 'nach Karte' : 'nach Absprache')));
      tk('richtwein', 'Wein: ' + (!kel ? 'nach Wahl des Sommeliers' : (wein ? 'CHF ' + chf(wein) : 'noch keine Flasche')));
      var wer = personen === 1 ? 'eine Person' : (WORT[personen] || personen);
      var an = { 'Geburtstag': ', zum Geburtstag', 'Jahrestag': ', zum Jahrestag', 'Geschäftsessen': ', zum Geschäftsessen', 'Feier im Festsaal': ', im Festsaal' }[anlass] || '';
      satz('tisch', 'Ein Tisch für ' + wer + (datum ? ', am ' + datum.replace(/ \d{4}$/, '') : '') + (zeit === 'Mittag' ? ', über Mittag' : ', am Abend') + an + '.');
      wegZeichnen(aktiv);
    };

    form.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.personen) { personen = Math.max(1, Math.min(30, personen + +b.dataset.personen)); out.value = personen; deckeAuf(); regeln(); }
      else if (b.dataset.wahl) { [].forEach.call(form.querySelectorAll('[data-wahl="' + b.dataset.wahl + '"]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); if (b.dataset.wahl === 'zeit') regeln(); if (b.dataset.wahl === 'wein') { keller(); gangwein(); } }
      else if (b.classList.contains('ia-tag')) { [].forEach.call(form.querySelectorAll('.ia-tag'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); form.datum.value = b.dataset.datum; }
      else if (b.classList.contains('tm') && !b.disabled) waehle(b);
      else if (b.dataset.fl) { st = lies(); st.weine[+b.dataset.fl].behandlung = b.dataset.b; schreib(st); flaschen(); }
      else if (b.dataset.weg) { st = lies(); st.weine.splice(+b.dataset.weg, 1); schreib(st); flaschen(); gangwein(); keller(); }
      else if (b.dataset.gang) { [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }
      setTimeout(karte, 0);
    });
    form.datum.addEventListener('input', function () { [].forEach.call(form.querySelectorAll('.ia-tag'), function (x) { x.setAttribute('aria-pressed', x.dataset.datum === form.datum.value ? 'true' : 'false'); }); });
    form.addEventListener('input', karte); form.addEventListener('change', karte);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fehlt = [form.datum, form.name, form.mail].filter(function (f) { return !f.value.trim() || (f.type === 'email' && !/@/.test(f.value)); });
      [form.datum, form.name, form.mail].forEach(function (f) { f.toggleAttribute('aria-invalid', fehlt.indexOf(f) > -1); });
      if (fehlt.length) { fehlt[0].focus(); return; }
      form.querySelector('.fd__danke').hidden = false; form.querySelector('.tischkarte').classList.add('gesendet');
    });
    if (st.weine.length) { [].forEach.call(form.querySelectorAll('[data-wahl="wein"]'), function (x) { x.setAttribute('aria-pressed', x.dataset.wert === 'Keller' ? 'true' : 'false'); }); }
    deckeAuf(); flaschen(); regeln(); keller(); gangwein(); karte();
    buehne.querySelector('.ia-teller:not([hidden])').classList.add('da');
    hoehe(); w.addEventListener('resize', hoehe); if (d.fonts && d.fonts.ready) d.fonts.ready.then(hoehe);
  }

  /* Gutschein: die Karte entsteht beim Tippen, drucken über den Browser */
  var gk = d.getElementById('gk');
  if (gk) {
    var seite = gk.closest('.gutschein'), frei = seite.querySelector('[name="betrag-frei"]');
    var HAUS = { schaefli: ['Taverne zum Schäfli', 'Oberdorfstrasse 8 · 8556 Wigoltingen'], schloessli: ['Wirtschaft am Schlössli', 'Seestrasse 50 · 8598 Bottighofen'], beide: ['Taverne zum Schäfli · Wirtschaft am Schlössli', 'Wigoltingen · Bottighofen'] };
    var setze = function () {
      var b = seite.querySelector('[data-betrag][aria-pressed="true"]'), wert = b && b.dataset.betrag ? b.dataset.betrag : frei.value.replace(/\D/g, '');
      frei.hidden = !(b && !b.dataset.betrag);
      gk.querySelector('[data-gk="betrag"]').textContent = wert ? 'CHF ' + chf(+wert) : 'CHF ·';
      var fuer = seite.querySelector('[name="fuer"]').value.trim(), von = seite.querySelector('[name="von"]').value.trim();
      gk.querySelector('[data-gk="fuer"]').textContent = (fuer ? 'für ' + fuer : '') + (von ? (fuer ? ', ' : '') + 'von ' + von : '');
      gk.querySelector('[data-gk="gruss"]').textContent = seite.querySelector('[name="gruss"]').value.trim();
      var h = HAUS[(seite.querySelector('[data-einloesbar][aria-pressed="true"]') || {}).dataset ? seite.querySelector('[data-einloesbar][aria-pressed="true"]').dataset.einloesbar : 'schaefli'];
      gk.querySelector('[data-gk="haus"]').textContent = h[0]; gk.querySelector('[data-gk="ort"]').textContent = h[1];
    };
    seite.addEventListener('input', setze);
    seite.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-betrag],[data-einloesbar]');
      if (b) { [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }
      if (ev.target.closest('[data-drucken]')) w.print();
      setTimeout(setze, 0);
    });
    setze();
  }
})();
