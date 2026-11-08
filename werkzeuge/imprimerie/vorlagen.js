/* Drucksachen-Studio · Vorlagen: elf Grundaufbauten im Hausstil. Jede Vorlage bekommt Format, Ton und Inhalt
   und setzt daraus frei verschiebbare Elemente. Alle Grössen wachsen mit dem Format, damit dieselbe Drucksache
   als A6-Karte und als A3-Plakat stimmt. Elemente tragen ihren «slot», damit Textänderungen beim Umsetzen bleiben. */
(function () {
  const DS = window.DS;
  let zaehler = 0;
  const neueId = () => 'e' + (Date.now() % 1e7).toString(36) + (zaehler++).toString(36);
  DS.neueId = neueId;

  const STIL = {
    titel: { zeile: 1.06, sperr: 0 },
    mono: { zeile: 1.6, sperr: .08, gross: true },
    kapitale: { zeile: 1.3, sperr: .08, gross: true },
    text: { zeile: 1.5, sperr: 0 },
    kursiv: { zeile: 1.5, sperr: 0 },
  };
  DS.STIL = STIL;

  /* stil (Vorlagen-Bibliothek, Robert 12.10.2026): rahmen 'ohne'|'einfach'|'doppelt', ausr 'c'|'l', titel 0.8–1.25, zeichen 0.6–1.5, bild 0.38–0.66 (Bildanteil) */
  function ctx(M, fmt, ton, stil) {
    const w = fmt.b, h = fmt.h, s = Math.sqrt(w * h / (105 * 148)), s8 = Math.pow(s, .8);
    const T = M.toene[ton] || M.toene.dunkel;
    const m = Math.max(7, 8 * s8);
    return { M, w, h, s, s8, T, m, ton, el: [], quer: w > h * 1.15, stil: stil || {}, rahmenZahl: 0 };
  }

  function tx(c, rolle, text, w, gr, farbe, o = {}) {
    const el = Object.assign({ id: neueId(), typ: 'text', rolle, text: String(text), x: o.x ?? (c.w - w) / 2, y: 0, w, gr: +gr.toFixed(2), farbe, ausr: 'c', deck: 1 }, STIL[rolle], o);
    el.h = DS.mess(el).h;
    return el;
  }
  const linie = (c, L, o = {}) => Object.assign({ id: neueId(), typ: 'linie', x: (c.w - L) / 2, y: 0, w: L, h: 0, staerke: .3, farbe: c.T.linie, deck: 1 }, o);
  const zeichen = (c, zw, o = {}) => { zw *= Math.min(1.6, Math.max(.5, c.stil.zeichen || 1)); return Object.assign({ id: neueId(), typ: 'zeichen', x: (c.w - zw) / 2, y: 0, w: zw, farbe: c.T.zeichen, deck: 1 }, o); };
  const hoehe = (c, el) => el.typ === 'zeichen' ? el.w * DS.zz(c.M, el).verh : el.typ === 'linie' ? el.staerke : el.h;

  /* Stapel: [element | zahl(abstand)] von oben nach unten setzen */
  function stapelHoehe(c, items) {
    let y = 0;
    for (const it of items) y += typeof it === 'number' ? it : hoehe(c, it);
    return y;
  }
  function stapel(c, items, y) {
    let lastGap = 0;
    for (const it of items) {
      if (typeof it === 'number') { y += it; lastGap = it; continue; }
      it.y = +y.toFixed(2); y += hoehe(c, it); c.el.push(it);
    }
    return y;
  }
  function stapelMitte(c, items, y0, y1) {
    let H = stapelHoehe(c, items);
    // Zu wenig Platz: Schrift und Abstände gemeinsam verkleinern, bis der Stapel passt (höchstens auf 60 %)
    for (let n = 0; n < 6 && H > (y1 - y0) + .05; n++) {
      const f = Math.max(.82, (y1 - y0) / H);
      items = items.map(it => {
        if (typeof it === 'number') return it * f;
        if (it.typ === 'text' && it.gr * f >= (it._gr0 || it.gr) * .6) { it._gr0 = it._gr0 || it.gr; it.gr = +(it.gr * f).toFixed(2); it.h = DS.mess(it).h; }
        return it;
      });
      H = stapelHoehe(c, items);
    }
    items.forEach(it => { if (it && it._gr0) delete it._gr0; });
    return stapel(c, items, Math.max(y0, y0 + (y1 - y0 - H) / 2));
  }
  /* Leere Felder und ihre Abstände aus einem Stapel entfernen */
  function sauber(items) {
    const out = [];
    for (const it of items) {
      if (it == null || it === false || it === '') { if (typeof out[out.length - 1] === 'number') out.pop(); continue; }
      out.push(it);
    }
    while (typeof out[0] === 'number') out.shift();
    while (typeof out[out.length - 1] === 'number') out.pop();
    return out;
  }

  function grund(c, seite, farbe, tapete) {
    seite.grund = farbe || c.T.grund;
    seite.tapete = tapete === undefined ? c.T.tapete : tapete;
  }
  function rahmen(c, inset, staerke = .25, deck = .75) {
    const r = inset ?? Math.max(4.5, 5 * c.s8);
    c.rahmenZahl++;
    if (c.stil.rahmen === 'ohne') return r;
    const ecke = c.stil.ecke ?? 2.2;
    c.el.push({ id: neueId(), typ: 'rahmen', x: r, y: r, w: c.w - 2 * r, h: c.h - 2 * r, staerke, r: ecke * c.s8, farbe: c.T.linie, deck });
    if (c.stil.rahmen === 'doppelt' && c.rahmenZahl === 1) { const r2 = r + 1.3 * c.s8; c.el.push({ id: neueId(), typ: 'rahmen', x: r2, y: r2, w: c.w - 2 * r2, h: c.h - 2 * r2, staerke: .15, r: Math.max(0, ecke - 1) * c.s8, farbe: c.T.linie, deck: deck * .8 }); }
    return r;
  }
  function foto(c, key, x, y, w, h, o = {}) {
    const el = Object.assign({ id: neueId(), typ: 'bild', bild: key, x, y, w, h, fx: .5, fy: .5, zoom: 1, slot: 'bild' }, o);
    c.el.push(el); return el;
  }
  function fuss(c, i, farbe, y1) {
    const t = i.fuss === undefined || i.fuss === null ? `${c.M.adr} · ${c.M.tel}` : i.fuss;
    if (!t) return y1 ?? c.h;
    const el = tx(c, 'mono', t, c.w - 2 * c.m - 6, 1.5 * c.s8, farbe || c.T.mono, { slot: 'fuss', deck: .85, sperr: .08 });
    el.y = +((y1 ?? c.h - c.m - 1.5 * c.s8) - el.h).toFixed(2);
    c.el.push(el);
    return el.y;
  }
  const titelGr = (c, t, faktor = 1, breite) => {
    let g = Math.min(9.4 * c.s * faktor * (c.stil.titel || 1), (breite || c.w) / 9.2 * Math.min(1.08, c.stil.titel || 1));
    const L = Math.max(...String(t || '').split('\n').map(z => z.length));
    if (L > 18) g *= .86; if (L > 26) g *= .86;
    return g;
  };

  /* ---------- die Vorlagen ---------- */
  const V = {};

  V.deckel = {
    name: 'Titelblatt', wofuer: 'Deckblatt, Einladung zum Anlass, Karte mit einem starken Titel',
    slots: ['ueber', 'titel*', 'unter', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const bw = c.w - 2 * (r + 6 * c.s8);
      const zh = Math.min(c.w * .3, 30 * c.s, c.h * .2);
      const items = sauber([
        zeichen(c, zh), 8 * c.s8,
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 3 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel), c.T.titel, { slot: 'titel' }), 5.5 * c.s8,
        linie(c, 14 * c.s8), 5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 2.05 * c.s8, c.T.mono, { slot: 'unter' }), 6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 80 * c.s8), 2.8 * c.s8, c.T.text, { slot: 'text' }),
      ]);
      const yF = fuss(c, i, null, c.h - r - 6 * c.s8);
      stapelMitte(c, items, r + 8 * c.s8, yF - 6 * c.s8);
    },
  };

  V.buehne = {
    name: 'Bild oben', wofuer: 'Flyer und Aushang mit grossem Foto oben, Text darunter; das Zeichen sitzt auf der Naht',
    slots: ['bild*', 'ueber', 'titel*', 'text', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const ph = c.h * Math.min(.66, Math.max(.38, c.stil.bild || (c.quer ? .5 : .54))), B = DS.B;
      foto(c, i.bild, -B, -B, c.w + 2 * B, ph + B);
      const d = 15 * c.s8;
      c.el.push({ id: neueId(), typ: 'flaeche', x: (c.w - d) / 2, y: ph - d / 2, w: d, h: d, r: d / 2, farbe: seite.grund, tapete: seite.tapete, deck: 1 });
      const zw = d * .6, z = zeichen(c, zw); z.y = ph - zw * c.M.zeichen.verh / 2; c.el.push(z);
      const bw = c.w - 2 * c.m - 6;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .82), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 12 * c.s8), 4.5 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 86 * c.s8), 2.75 * c.s8, c.T.text, { slot: 'text' }), i.text && 4.5 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 2 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const yF = fuss(c, i);
      stapelMitte(c, items, ph + d / 2 + 4 * c.s8, yF - 5 * c.s8);
    },
  };

  V.ansicht = {
    name: 'Ansichtskarte', wofuer: 'Postkarte: Foto randlos, kleines Schild mit dem Ort. Nur Haus von aussen oder Landschaft',
    slots: ['bild*', 'titel*', 'unter'],
    bau(c, i, seite) {
      grund(c, seite, 'navy', null);
      const B = DS.B;
      foto(c, i.bild, -B, -B, c.w + 2 * B, c.h + 2 * B);
      const dunkel = c.ton !== 'hell';
      const schild = dunkel ? 'papier' : 'navy', tf = dunkel ? 'navy' : 'papier', mf = dunkel ? 'taupe' : 'gold';
      const pad = 4.6 * c.s8, max = c.w * .62;
      const t = tx(c, 'titel', i.titel, max, Math.min(6.4 * c.s8, c.w / 15), tf, { ausr: 'l', slot: 'titel', x: pad });
      const u = i.unter ? tx(c, 'mono', i.unter, max, 1.55 * c.s8, mf, { ausr: 'l', slot: 'unter', x: pad }) : null;
      const bw = Math.max(DS.mess(t).bw, u ? DS.mess(u).bw : 0);
      const sh = pad * 2 + t.h + (u ? u.h + 1.2 * c.s8 : 0), R = 3 * c.s8;
      c.el.push({ id: neueId(), typ: 'flaeche', x: -B - R, y: c.h - sh, w: bw + 2 * pad + B + R + 1, h: sh + B + R, r: R, farbe: schild, tapete: dunkel ? null : 'dunkel', deck: 1 });
      t.w = u ? Math.max(bw + 1, 10) : bw + 1; if (u) u.w = t.w;
      stapel(c, sauber([t, u && 1.2 * c.s8, u]), c.h - sh + pad);
    },
  };

  V.karte = {
    name: 'Karte mit Liste', wofuer: 'Speise-, Getränke-, Behandlungs- oder Preiskarte: Einträge mit Name, Beschreibung, Preis',
    slots: ['ueber', 'titel*', 'text', 'liste*', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const x0 = r + 6 * c.s8, cw = c.w - 2 * x0;
      const kopf = sauber([
        zeichen(c, 10 * c.s8), 5 * c.s8,
        i.ueber && tx(c, 'mono', i.ueber, cw, 1.85 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.4 * c.s8,
        tx(c, 'titel', i.titel, cw, titelGr(c, i.titel, .74), c.T.titel, { slot: 'titel' }), 3.6 * c.s8,
        i.text && tx(c, 'kursiv', i.text, Math.min(cw, 80 * c.s8), 2.5 * c.s8, c.T.text, { slot: 'text', deck: .85 }),
      ]);
      const yK = stapel(c, kopf, r + 7 * c.s8) + 5 * c.s8;
      const yF = fuss(c, i, null, c.h - r - 5 * c.s8);
      const liste = (i.liste || []).filter(e => e && (e.name || e.preis));
      const verf = yF - 5 * c.s8 - yK;
      const sp = c.w / c.h > 1.6 && liste.length >= 3 ? 2 : 1, sg = 8 * c.s8, sw = (cw - (sp - 1) * sg) / sp;
      const baueListe = (k, luft) => {
        const els = []; let H = 0;
        const pw = Math.max(0, ...liste.map(e => e.preis ? DS.mess({ typ: 'text', rolle: 'mono', text: e.preis, w: 200, gr: 1.95 * c.s8 * k, ...STIL.mono, sperr: .08 }).bw : 0));
        const proSpalte = Math.ceil(liste.length / sp);
        for (let s0 = 0; s0 < sp; s0++) {
          const xs = x0 + s0 * (sw + sg), teil = liste.slice(s0 * proSpalte, (s0 + 1) * proSpalte);
          let y = 0;
          teil.forEach((e, j) => {
            const n = s0 * proSpalte + j, row = [];
            const nw = sw - (pw ? pw + 4 * c.s8 : 0);
            const nm = tx(c, 'titel', e.name || '', nw, 4.05 * c.s8 * k, c.T.titel, { ausr: 'l', x: xs, slot: `liste.${n}.name`, zeile: 1.12 });
            nm.y = y; row.push(nm);
            if (e.preis) {
              const p = tx(c, 'mono', e.preis, pw + 1, 1.95 * c.s8 * k, c.T.mono, { ausr: 'r', x: xs + sw - pw - 1, slot: `liste.${n}.preis`, sperr: .08 });
              p.y = y + (nm.gr * 1.12 - p.gr * 1.6) / 2 + .15 * c.s8 * k; row.push(p);
            }
            let yy = y + nm.h;
            if (e.detail) {
              const dt = tx(c, 'text', e.detail, nw, 2.3 * c.s8 * k, c.T.text, { ausr: 'l', x: xs, slot: `liste.${n}.detail`, deck: .78, zeile: 1.42 });
              dt.y = yy + .7 * c.s8 * k; row.push(dt); yy = dt.y + dt.h;
            }
            yy += 2.4 * c.s8 * k * luft;
            if (j < teil.length - 1) { row.push(linie(c, sw, { x: xs, y: yy, staerke: .15, deck: .4 })); yy += 2.4 * c.s8 * k * luft; }
            els.push(...row); y = yy;
          });
          H = Math.max(H, y);
        }
        return { els, H };
      };
      let k = 1, L = baueListe(k, 1);
      for (let n = 0; n < 8 && L.H > verf; n++) { k *= Math.max(.6, Math.sqrt(verf / L.H)) * .99; L = baueListe(k, 1); }
      if (L.H < verf * .7) { k = Math.min(1.35, Math.sqrt(verf * .8 / L.H)); L = baueListe(k, 1); if (L.H > verf) { k *= Math.sqrt(verf / L.H) * .98; L = baueListe(k, 1); } }
      if (L.H < verf * .85 && liste.length > sp) { const luft = Math.min(2.2, 1 + (verf * .92 - L.H) / (Math.ceil(liste.length / sp) * 4.8 * c.s8 * k)); L = baueListe(k, luft); }
      const dy = yK + Math.max(0, (verf - L.H) / 2) * .6;
      L.els.forEach(e => { e.y = +(e.y + dy).toFixed(2); c.el.push(e); });
    },
  };

  V.einladung = {
    name: 'Einladung', wofuer: 'Einladung zu Fest, Dinner, Hochzeit, Anlass: wann, wo, Bitte um Antwort',
    slots: ['ueber', 'titel*', 'wann', 'wo', 'text', 'aktion'],
    bau(c, i, seite) {
      grund(c, seite);
      const r = rahmen(c, null, .35, .85); rahmen(c, r + 1.4 * c.s8, .15, .6);
      const bw = c.w - 2 * (r + 8 * c.s8);
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 5 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .95), c.T.titel, { slot: 'titel' }), 6 * c.s8,
        linie(c, 14 * c.s8), 6 * c.s8,
        i.wann && tx(c, 'mono', i.wann, bw, 2.45 * c.s8, c.T.titel, { slot: 'wann', sperr: .08 }), i.wann && 2 * c.s8,
        i.wo && tx(c, 'kursiv', i.wo, bw, 2.6 * c.s8, c.T.text, { slot: 'wo' }), 6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 78 * c.s8), 2.7 * c.s8, c.T.text, { slot: 'text' }), i.text && 6 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 1.75 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const z = zeichen(c, 9 * c.s8); z.y = c.h - r - 7 * c.s8 - hoehe(c, z); c.el.push(z);
      stapelMitte(c, items, r + 9 * c.s8, z.y - 6 * c.s8);
    },
  };

  V.programm = {
    name: 'Programm', wofuer: 'Termine, Veranstaltungen, Tagesablauf, Jahresprogramm: Datum, Titel, Ort',
    slots: ['ueber', 'titel*', 'termine*', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const x0 = r + 7 * c.s8, cw = c.w - 2 * x0;
      const kopf = sauber([
        i.ueber && tx(c, 'mono', i.ueber, cw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', ausr: 'l', x: x0 }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, cw, titelGr(c, i.titel, .8), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 4.4 * c.s8,
        linie(c, 14 * c.s8, { x: x0 }),
      ]);
      const yK = stapel(c, kopf, r + 9 * c.s8) + 7 * c.s8;
      const z = zeichen(c, 8 * c.s8, { x: c.w - x0 - 8 * c.s8 });
      const yF = fuss(c, Object.assign({}, i, {}), null, c.h - r - 5 * c.s8);
      const verf = yF - 6 * c.s8 - yK;
      const ter = (i.termine || []).filter(t => t && (t.was || t.wann));
      const sp = c.w / c.h > 1.6 && ter.length >= 3 ? 2 : 1, sg = 8 * c.s8, sw = (cw - (sp - 1) * sg) / sp, proSpalte = Math.ceil(ter.length / sp);
      const baue = (k, luft) => {
        const els = []; let H = 0;
        for (let s0 = 0; s0 < sp; s0++) {
          const xs = x0 + s0 * (sw + sg); let y = 0;
          ter.slice(s0 * proSpalte, (s0 + 1) * proSpalte).forEach((t, j) => {
            const n = s0 * proSpalte + j;
            if (t.wann) { const a = tx(c, 'mono', t.wann, sw, 1.8 * c.s8 * k, c.T.mono, { ausr: 'l', x: xs, slot: `termine.${n}.wann` }); a.y = y; els.push(a); y += a.h + .6 * c.s8 * k; }
            if (t.was) { const b = tx(c, 'titel', t.was, sw, 4.3 * c.s8 * k, c.T.titel, { ausr: 'l', x: xs, slot: `termine.${n}.was`, zeile: 1.12 }); b.y = y; els.push(b); y += b.h; }
            if (t.wo) { const d = tx(c, 'text', t.wo, sw, 2.3 * c.s8 * k, c.T.text, { ausr: 'l', x: xs, slot: `termine.${n}.wo`, deck: .75 }); d.y = y + .5 * c.s8 * k; els.push(d); y = d.y + d.h; }
            y += 4.6 * c.s8 * k * luft;
          });
          H = Math.max(H, y - 4.6 * c.s8 * k * luft);
        }
        return { els, H };
      };
      let k = 1, L = baue(k, 1);
      for (let n = 0; n < 8 && L.H > verf; n++) { k *= Math.max(.6, Math.sqrt(verf / L.H)) * .99; L = baue(k, 1); }
      if (L.H < verf * .7) { k = Math.min(1.35, Math.sqrt(verf * .8 / L.H)); L = baue(k, 1); if (L.H > verf) { k *= Math.sqrt(verf / L.H) * .98; L = baue(k, 1); } }
      if (L.H < verf * .85 && ter.length > sp) L = baue(k, Math.min(2, 1 + (verf * .92 - L.H) / (proSpalte * 4.6 * c.s8 * k)));
      L.els.forEach(e => { e.y = +(e.y + yK).toFixed(2); c.el.push(e); });
      void z;
    },
  };

  V.fenster = {
    name: 'Bild im Rahmen', wofuer: 'Foto mit Passepartout auf der Fläche, darunter Titel und Text; ruhig und edel',
    slots: ['bild*', 'ueber', 'titel*', 'unter', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const m = c.m + 1;
      if (c.quer) {
        const pw = c.w * .5 - m, ph = c.h - 2 * m;
        foto(c, i.bild, m, m, pw, ph);
        c.el.push({ id: neueId(), typ: 'rahmen', x: m - 1.6 * c.s8, y: m - 1.6 * c.s8, w: pw + 3.2 * c.s8, h: ph + 3.2 * c.s8, staerke: .25, r: 0, farbe: c.T.linie, deck: .8 });
        const x0 = c.w * .5 + 6 * c.s8, bw = c.w - x0 - m;
        const items = sauber([
          i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', x: x0 }), i.ueber && 2.6 * c.s8,
          tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .75, bw * 2), c.T.titel, { slot: 'titel', x: x0 }), 4.4 * c.s8,
          linie(c, 12 * c.s8, { x: x0 + (bw - 12 * c.s8) / 2 }), 4.4 * c.s8,
          i.unter && tx(c, 'mono', i.unter, bw, 1.9 * c.s8, c.T.mono, { slot: 'unter', x: x0 }), i.unter && 4 * c.s8,
          i.text && tx(c, 'text', i.text, bw, 2.6 * c.s8, c.T.text, { slot: 'text', x: x0 }),
        ]);
        stapelMitte(c, items, m, c.h - m);
        return;
      }
      const ph = c.h * Math.min(.56, Math.max(.36, (c.stil.bild || .54) * .87));
      foto(c, i.bild, m, m, c.w - 2 * m, ph);
      c.el.push({ id: neueId(), typ: 'rahmen', x: m - 1.6 * c.s8, y: m - 1.6 * c.s8, w: c.w - 2 * m + 3.2 * c.s8, h: ph + 3.2 * c.s8, staerke: .25, r: 0, farbe: c.T.linie, deck: .8 });
      const bw = c.w - 2 * m - 6;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 2.6 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .85), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 12 * c.s8), 4.5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 1.95 * c.s8, c.T.mono, { slot: 'unter' }), i.unter && 4 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 84 * c.s8), 2.7 * c.s8, c.T.text, { slot: 'text' }),
      ]);
      const yF = fuss(c, i);
      stapelMitte(c, items, m + ph + 8 * c.s8, yF - 5 * c.s8);
    },
  };

  V.geteilt = {
    name: 'Bild und Text geteilt', wofuer: 'Halb Foto, halb Text; quer nebeneinander, hoch übereinander. Für Restaurant, Wellness, Angebot',
    slots: ['bild*', 'ueber', 'titel*', 'text', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite);
      const B = DS.B;
      if (c.quer) {
        foto(c, i.bild, -B, -B, c.w * .5 + B, c.h + 2 * B);
        const x0 = c.w * .5 + c.m, bw = c.w - x0 - c.m;
        const items = sauber([
          zeichen(c, 9 * c.s8, { x: x0 + (bw - 9 * c.s8) / 2 }), 5 * c.s8,
          i.ueber && tx(c, 'mono', i.ueber, bw, 1.8 * c.s8, c.T.mono, { slot: 'ueber', x: x0 }), i.ueber && 2.6 * c.s8,
          tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .72, bw * 2), c.T.titel, { slot: 'titel', x: x0 }), 4.2 * c.s8,
          linie(c, 12 * c.s8, { x: x0 + (bw - 12 * c.s8) / 2 }), 4.2 * c.s8,
          i.text && tx(c, 'text', i.text, bw, 2.55 * c.s8, c.T.text, { slot: 'text', x: x0 }), i.text && 4 * c.s8,
          i.aktion && tx(c, 'mono', i.aktion, bw, 1.8 * c.s8, c.T.mono, { slot: 'aktion', x: x0 }),
        ]);
        stapelMitte(c, items, c.m, c.h - c.m);
        return;
      }
      const ph = c.h * Math.min(.62, Math.max(.4, c.stil.bild || .5));
      foto(c, i.bild, -B, c.h - ph, c.w + 2 * B, ph + B);
      const x0 = c.m + 2, bw = c.w - 2 * x0;
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.85 * c.s8, c.T.mono, { slot: 'ueber', ausr: 'l', x: x0 }), i.ueber && 2.8 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .9), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 4.6 * c.s8,
        linie(c, 14 * c.s8, { x: x0 }), 4.6 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 90 * c.s8), 2.75 * c.s8, c.T.text, { slot: 'text', ausr: 'l', x: x0 }), i.text && 4.4 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 1.95 * c.s8, c.T.mono, { slot: 'aktion', ausr: 'l', x: x0 }),
      ]);
      stapelMitte(c, items, c.m, c.h - ph - c.m);
    },
  };

  V.gutschein = {
    name: 'Gutschein', wofuer: 'Gutschein oder Geschenkkarte mit Wert und Feldern für Für, Von und Nummer',
    slots: ['titel', 'unter', 'wert', 'text', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const titel = i.titel || 'Gutschein';
      const feld = (x, y, w, name, n) => {
        const l = tx(c, 'mono', name, 30, 1.55 * c.s8, c.T.mono, { ausr: 'l', x, slot: null }); l.y = y; c.el.push(l);
        c.el.push(linie(c, w - 12 * c.s8, { x: x + 12 * c.s8, y: y + l.h * .78, staerke: .15, deck: .6 }));
        void n;
      };
      if (c.quer) {
        const zw = Math.min(c.h * .42, c.w * .2);
        const z = zeichen(c, zw, { x: c.w * .17 - zw / 2 }); z.y = (c.h - hoehe(c, z)) / 2; c.el.push(z);
        c.el.push(linie(c, 0, { x: c.w * .33, y: r + 8 * c.s8, w: 0, h: c.h - 2 * r - 16 * c.s8, staerke: .2, deck: .7 }));
        const x0 = c.w * .38, bw = c.w - x0 - r - 8 * c.s8;
        const felder = 3 * 5.4 * c.s8;
        const items = sauber([
          tx(c, 'titel', titel, bw, Math.min(12 * c.s8, c.h / 6.5), c.T.titel, { slot: 'titel', ausr: 'l', x: x0 }), 3.5 * c.s8,
          i.unter && tx(c, 'mono', i.unter, bw, 1.9 * c.s8, c.T.mono, { slot: 'unter', ausr: 'l', x: x0 }), i.unter && 4 * c.s8,
          i.wert && tx(c, 'titel', i.wert, bw, Math.min(7 * c.s8, c.h / 11), c.ton === 'dunkel' ? 'gold' : c.T.titel, { slot: 'wert', ausr: 'l', x: x0 }), i.wert && 3 * c.s8,
          i.text && tx(c, 'text', i.text, bw * .9, 2.3 * c.s8, c.T.text, { slot: 'text', ausr: 'l', x: x0, deck: .85 }),
        ]);
        const yEnd = stapelMitte(c, items, r + 7 * c.s8, c.h - r - 8 * c.s8 - felder - 4 * c.s8);
        let y = Math.max(yEnd + 5 * c.s8, c.h - r - 7 * c.s8 - felder);
        for (const f of ['Für', 'Von', 'Nr.']) { feld(x0, y, bw, f); y += 5.4 * c.s8; }
        return;
      }
      const bw = c.w - 2 * (r + 7 * c.s8), x0 = r + 7 * c.s8;
      const items = sauber([
        zeichen(c, Math.min(26 * c.s8, c.w * .26)), 7 * c.s8,
        tx(c, 'titel', titel, bw, titelGr(c, titel, 1.05), c.T.titel, { slot: 'titel' }), 4.5 * c.s8,
        linie(c, 14 * c.s8), 4.5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 1.95 * c.s8, c.T.mono, { slot: 'unter' }), i.unter && 5 * c.s8,
        i.wert && tx(c, 'titel', i.wert, bw, 7 * c.s8, c.ton === 'dunkel' ? 'gold' : c.T.titel, { slot: 'wert' }), i.wert && 4 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 70 * c.s8), 2.5 * c.s8, c.T.text, { slot: 'text', deck: .85 }),
      ]);
      const felder = 3 * 6 * c.s8;
      stapelMitte(c, items, r + 8 * c.s8, c.h - r - 10 * c.s8 - felder);
      let y = c.h - r - 8 * c.s8 - felder;
      for (const f of ['Für', 'Von', 'Nr.']) { feld(x0, y, bw, f); y += 6 * c.s8; }
    },
  };

  V.aushang = {
    name: 'Aushang', wofuer: 'Hinweis, Schild, Tischaufsteller, Info für Gäste: Titel und gut lesbarer Text',
    slots: ['ueber', 'titel*', 'text*', 'aktion', 'fuss'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const bw = c.w - 2 * (r + 7 * c.s8);
      const z = zeichen(c, Math.min(15 * c.s8, c.w * .16)); z.y = r + 8 * c.s8; c.el.push(z);
      const items = sauber([
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.95 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 3 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, .9), c.T.titel, { slot: 'titel' }), 5 * c.s8,
        linie(c, 14 * c.s8), 5.5 * c.s8,
        i.text && tx(c, 'text', i.text, Math.min(bw, 96 * c.s8), 3.15 * c.s8, c.T.text, { slot: 'text', zeile: 1.55 }), i.text && 6 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 2.1 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      const yF = fuss(c, i, null, c.h - r - 5 * c.s8);
      stapelMitte(c, items, z.y + hoehe(c, z) + 7 * c.s8, yF - 7 * c.s8);
    },
  };

  /* Türhänger (12.10.2026): oben das Loch für die Klinke als Schnittlinie, darunter Zeichen, grosser Titel, Zeile in zweiter Sprache, kurzer Text */
  V.tuer = {
    name: 'Türhänger', wofuer: 'Türhänger mit Loch für die Klinke: grosser Titel, Zeile in zweiter Sprache, kurzer Text',
    slots: ['ueber', 'titel*', 'unter', 'text', 'aktion'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const d = Math.min(36, c.w * .42), ly = r + 9;
      c.el.push({ id: neueId(), typ: 'rahmen', x: +((c.w - d) / 2).toFixed(2), y: ly, w: d, h: d, staerke: .25, r: d / 2, farbe: c.T.linie, deck: .9 });
      const bw = c.w - 2 * (r + 5 * c.s8);
      const items = sauber([
        zeichen(c, Math.min(17 * c.s8, c.w * .2)), 7 * c.s8,
        i.ueber && tx(c, 'mono', i.ueber, bw, 1.9 * c.s8, c.T.mono, { slot: 'ueber' }), i.ueber && 3.5 * c.s8,
        tx(c, 'titel', i.titel, bw, titelGr(c, i.titel, 1.15, c.w * 1.25), c.T.titel, { slot: 'titel' }), 5.5 * c.s8,
        linie(c, 14 * c.s8), 5 * c.s8,
        i.unter && tx(c, 'mono', i.unter, bw, 2.05 * c.s8, c.T.mono, { slot: 'unter' }), i.unter && 6 * c.s8,
        i.text && tx(c, 'text', i.text, bw, 3 * c.s8, c.T.text, { slot: 'text', zeile: 1.55 }), i.text && 6 * c.s8,
        i.aktion && tx(c, 'mono', i.aktion, bw, 1.95 * c.s8, c.T.mono, { slot: 'aktion' }),
      ]);
      stapelMitte(c, items, ly + d + 10, c.h - r - 9 * c.s8);
    },
  };

  V.rueckseite = {
    name: 'Rückseite mit Adresse', wofuer: 'Rückseite eines Flyers oder einer Karte: Zeichen, Name, Adresse, Kontakt',
    slots: ['text'],
    bau(c, i, seite) {
      grund(c, seite); const r = rahmen(c);
      const M = c.M, bw = c.w - 2 * (r + 7 * c.s8);
      const items = sauber([
        zeichen(c, Math.min(19 * c.s8, c.w * .2)), 6 * c.s8,
        tx(c, 'kapitale', M.name, bw, 3.1 * c.s8, c.T.titel, { sperr: .08 }), 2 * c.s8,
        tx(c, 'mono', M.zeile, bw, 1.6 * c.s8, c.T.mono), 5 * c.s8,
        linie(c, 12 * c.s8), 5 * c.s8,
        i.text && tx(c, 'kursiv', i.text, Math.min(bw, 74 * c.s8), 2.55 * c.s8, c.T.text, { slot: 'text', deck: .9 }), i.text && 5 * c.s8,
        tx(c, 'text', [M.adr.replace(' · ', '\n'), M.tel, M.mail, M.web].join('\n'), bw, 2.45 * c.s8, c.T.text, { zeile: 1.75, deck: .9 }),
      ]);
      stapelMitte(c, items, r + 8 * c.s8, c.h - r - 8 * c.s8);
    },
  };

  V.kartengruss = {
    name: 'Postkarten-Rückseite', wofuer: 'Rückseite einer Ansichtskarte: links Platz für den Gruss, rechts Markenfeld und Adresszeilen',
    slots: ['titel', 'text'],
    bau(c, i, seite) {
      grund(c, seite, c.ton === 'dunkel' ? 'papier' : c.T.grund, null);
      const T = c.M.toene.hell, m = Math.max(7, 7 * c.s8), mx = c.w / 2;
      c.el.push(linie(c, 0, { x: mx, y: m + 4, w: 0, h: c.h - 2 * m - 8, staerke: .2, farbe: T.linie, deck: .7 }));
      const lw = mx - m - 6 * c.s8;
      const z = zeichen(c, 9 * c.s8, { x: m, farbe: T.zeichen }); z.y = m; c.el.push(z);
      const kopf = sauber([
        tx(c, 'kapitale', c.M.name, lw, 2.1 * c.s8, T.titel, { ausr: 'l', x: m, sperr: .08 }), 1.2 * c.s8,
        tx(c, 'mono', i.titel || c.M.zeile, lw, 1.45 * c.s8, T.mono, { ausr: 'l', x: m, slot: 'titel' }),
        i.text && 4 * c.s8, i.text && tx(c, 'kursiv', i.text, lw, 2.25 * c.s8, T.text, { ausr: 'l', x: m, slot: 'text', deck: .85 }),
      ]);
      stapel(c, kopf, m + hoehe(c, z) + 4 * c.s8);
      const f = tx(c, 'mono', `${c.M.adr} · ${c.M.web}`, lw, 1.25 * c.s8, T.mono, { ausr: 'l', x: m, deck: .8, sperr: .08 }); f.y = c.h - m - f.h; c.el.push(f);
      const mb = 19 * c.s8, mh = 23 * c.s8;
      c.el.push({ id: neueId(), typ: 'rahmen', x: c.w - m - mb, y: m, w: mb, h: mh, staerke: .2, r: 0, farbe: T.linie, deck: .8 });
      const mz = zeichen(c, mb * .42, { x: c.w - m - mb / 2 - mb * .21, farbe: T.zeichen, deck: .35 }); mz.y = m + (mh - hoehe(c, mz)) / 2; c.el.push(mz);
      const ax = mx + 6 * c.s8, aw = c.w - m - ax, top = m + mh + 10 * c.s8, gap = Math.min(9 * c.s8, (c.h - m - 4 - top) / 4);
      for (let n = 0; n < 4; n++) c.el.push(linie(c, aw, { x: ax, y: top + gap * (n + 1) - 2, staerke: .15, farbe: T.linie, deck: .6 }));
    },
  };


  /* Gutschein für beide Häuser der Familie Kuchler (Taverne zum Schäfli, 21.10.2026; Runde 1 nach Roberts «Was ist das für ein hässliches Bild?»):
     eine Gestaltung aus einem Guss im Stil der Website (Kalk, Ochsenblut, Schildgold, das goldene «&» aus dem Fuss «Die Häuser der Familie Kuchler»),
     beide Häuser über ihre Zeichen erkennbar (das Lamm, die Zeiger der Wirtschaft am Schlössli in ihrem Blau, M.zeichen2, el.z = 2).
     i.form wählt die Fassung (1–10); Robert wählt eine Nummer, nur diese bleibt. Ohne zweites Zeichen fällt der Aufbau auf «gutschein» zurück. */
  V.zwei = {
    name: 'Gutschein für beide Häuser', wofuer: 'Gutschein, einlösbar in beiden Häusern der Familie: beide Zeichen, ein Blatt',
    slots: ['titel', 'unter', 'wert', 'text', 'haus1', 'ort1', 'haus2', 'ort2'],
    bau(c, i, seite) {
      const Z2 = c.M.zeichen2, B = DS.B, s = c.s8, W = c.w, H = c.h;
      if (!Z2) return V.gutschein.bau(c, i, seite);
      const blau = Z2.farben.grund, himmel = Z2.farben.zeichen, form = +(i.form || 1);
      const zei = (w, cx, y, farbe, zwei) => { const e = { id: neueId(), typ: 'zeichen', x: cx - w / 2, y, w, farbe, deck: 1 }; if (zwei) e.z = 2; c.el.push(e); return w * (zwei ? Z2.verh : c.M.zeichen.verh); };
      const zh = (w, zwei) => w * (zwei ? Z2.verh : c.M.zeichen.verh);
      const T = (rolle, text, w, gr, farbe, o = {}) => tx(c, rolle, text, w, gr, farbe, o);
      const setz = (el, y) => { el.y = +y.toFixed(2); c.el.push(el); return el.y + el.h; };
      const fl = (x, y, w, h, farbe, tapete = null, r = 0, deck = 1) => c.el.push({ id: neueId(), typ: 'flaeche', x, y, w, h, r, farbe, tapete, deck });
      const ra = (x, y, w, h, farbe, st = .3, r = .6, deck = 1) => c.el.push({ id: neueId(), typ: 'rahmen', x, y, w, h, staerke: st, r, farbe, deck });
      const li = (x, y, w, farbe, st = .25, deck = 1) => c.el.push(linie(c, w, { x, y, staerke: st, farbe, deck }));
      const titel = i.titel || 'Gutschein', wert = i.wert || '', unter = i.unter || '', text = i.text || '';
      const h1 = i.haus1 || '', o1 = i.ort1 || '', h2 = i.haus2 || '', o2 = i.ort2 || '';
      const felder = (x0, y, bw, farbe, linienfarbe) => { for (const f of ['Für', 'Von']) { const l = T('mono', f, 14, 1.9 * s, farbe, { ausr: 'l', x: x0, slot: null }); setz(l, y); li(x0 + 13 * s, y + l.h * .82, bw - 13 * s, linienfarbe, .2, .7); y += 7 * s; } return y; };
      /* Paar der Zeichen mit goldenem «&» dazwischen */
      const paar = (cy, w, farbe1, farbe2, und, abstand = 13) => {
        const a = zh(w, false), b = zh(w * .92, true), hmax = Math.max(a, b);
        zei(w, W / 2 - abstand * s, cy - a / 2, farbe1, false);
        zei(w * .92, W / 2 + abstand * s, cy - b / 2, farbe2, true);
        const u = T('titel', '&', 12 * s, 7.4 * s, und, { slot: null }); u.y = +(cy - u.h * .56).toFixed(2); c.el.push(u);
        return hmax;
      };
      /* Zwei Häuser als Spalten mit «&» in der Mitte (wie der Fuss der Website) */
      const spalten = (y, farbeName, farbeOrt, und, breite = W * .34) => {
        const n1 = T('titel', h1, breite, 3.4 * s, farbeName, { slot: 'haus1', x: W / 2 - 6 * s - breite, ausr: 'r' });
        const n2 = T('titel', h2, breite, 3.4 * s, farbeName, { slot: 'haus2', x: W / 2 + 6 * s, ausr: 'l' });
        setz(n1, y); setz(n2, y);
        const u = T('titel', '&', 10 * s, 5.2 * s, und, { slot: null }); setz(u, y - 1.2 * s);
        const y2 = y + Math.max(n1.h, n2.h) + 1.4 * s;
        setz(T('mono', o1, breite, 2 * s, farbeOrt, { slot: 'ort1', x: W / 2 - 6 * s - breite, ausr: 'r' }), y2);
        return setz(T('mono', o2, breite, 2 * s, farbeOrt, { slot: 'ort2', x: W / 2 + 6 * s, ausr: 'l' }), y2);
      };
      const hell = () => grund(c, seite, 'weiss', null), dunkel = () => grund(c, seite, 'navy', 'dunkel');

      if (form === 1) {   /* Kalk, Rahmen in Ochsenblut doppelt, oben die beiden Zeichen mit «&», unten die Häuser als Spalten */
        hell(); const r = 5 * s; ra(r, r, W - 2 * r, H - 2 * r, 'navy', .7, .4); ra(r + 1.6 * s, r + 1.6 * s, W - 2 * r - 3.2 * s, H - 2 * r - 3.2 * s, 'messing', .2, .3, .8);
        let y = r + 9 * s; y += paar(y + 7 * s, 11 * s, 'navy', blau, 'messing') + 3 * s;
        y = setz(T('kapitale', titel.toUpperCase(), W * .7, 6.4 * s, 'tanne', { slot: 'titel', sperr: .08 }), y + 2 * s) + 2.6 * s;
        if (wert) y = setz(T('titel', wert, W * .7, 6 * s, 'navy', { slot: 'wert' }), y) + 2.2 * s;
        if (text) y = setz(T('text', text, W * .62, 2.5 * s, 'tinte', { slot: 'text', deck: .85 }), y) + 4 * s;
        spalten(H - r - 15 * s, 'tanne', 'taupe', 'messing');
        return;
      }
      if (form === 2) {   /* Ochsenblut mit den Rauten, alles in Schildgold, die Zeiger in ihrem hellen Blau als einziger Farbpunkt */
        dunkel(); const r = 5 * s; ra(r, r, W - 2 * r, H - 2 * r, 'gold', .35, .4, .8);
        let y = r + 8 * s; y += paar(y + 7 * s, 11 * s, 'gold', himmel, 'gold') + 4 * s;
        y = setz(T('kapitale', titel.toUpperCase(), W * .7, 6.4 * s, 'weiss', { slot: 'titel', sperr: .08 }), y + 1.5 * s) + 2.4 * s;
        if (wert) y = setz(T('titel', wert, W * .7, 6 * s, 'gold', { slot: 'wert' }), y) + 2.2 * s;
        if (text) setz(T('text', text, W * .62, 2.5 * s, 'papier', { slot: 'text', deck: .9 }), y);
        spalten(H - r - 14 * s, 'weiss', 'gold', 'gold');
        return;
      }
      if (form === 3) {   /* Die Karte der Website (Robert 21.10.2026: Nummer 3): breiter Rahmen, innen das Blatt, das Lamm, «GUTSCHEIN», Wert, die Häuser mit «&».
                             hell: Rahmen Ochsenblut, Blatt Kalk · dunkel: Rahmen dunkles Holz, Blatt Ochsenblut mit den Rauten, Schrift Kalk und Schildgold */
        const d = c.ton === 'dunkel', r = 7 * s;
        grund(c, seite, d ? 'nacht' : 'navy', null); fl(r, r, W - 2 * r, H - 2 * r, d ? 'navy' : 'weiss', d ? 'dunkel' : null);
        ra(r + 2 * s, r + 2 * s, W - 2 * r - 4 * s, H - 2 * r - 4 * s, d ? 'gold' : 'messing', .25, 0, .8);
        let y = r + 7 * s; y += zei(13 * s, W / 2, y, d ? 'gold' : 'messing', false) + 3.2 * s;
        y = setz(T('kapitale', titel.toUpperCase(), W * .7, 5.6 * s, d ? 'weiss' : 'tanne', { slot: 'titel', sperr: .08 }), y) + 2.4 * s;
        if (wert) y = setz(T('titel', wert, W * .7, 6.2 * s, d ? 'gold' : 'tanne', { slot: 'wert' }), y) + 2 * s;
        if (text) y = setz(T('text', text, W * .6, 2.4 * s, d ? 'papier' : 'tinte', { slot: 'text', deck: .88 }), y) + 3 * s;
        spalten(H - r - 14 * s, d ? 'weiss' : 'tanne', d ? 'gold' : 'taupe', d ? 'gold' : 'messing');
        return;
      }
      if (form === 4) {   /* Riegelhaus links als Foto, rechts Kalk: beide Zeichen, Titel, Wert, Häuser */
        hell(); const fw = W * .4; foto(c, i.bild || 'haus-tag', -B, -B, fw + B, H + 2 * B);
        const x0 = fw + 9 * s, bw = W - x0 - 8 * s, cx = x0 + bw / 2;
        let y = (H - 50 * s) / 2;
        zei(9 * s, cx - 9 * s, y, 'navy', false); zei(8.4 * s, cx + 9 * s, y + .4 * s, blau, true);
        const u = T('titel', '&', 10 * s, 6 * s, 'messing', { slot: null, x: cx - 5 * s }); setz(u, y + 2.6 * s);
        y += 15 * s;
        y = setz(T('kapitale', titel.toUpperCase(), bw, 5.4 * s, 'tanne', { slot: 'titel', sperr: .08, x: x0 }), y) + 2.4 * s;
        if (wert) y = setz(T('titel', wert, bw, 5.6 * s, 'navy', { slot: 'wert', x: x0 }), y) + 2 * s;
        if (text) y = setz(T('text', text, bw * .95, 2.3 * s, 'tinte', { slot: 'text', x: x0, deck: .85 }), y) + 3 * s;
        li(x0 + bw / 2 - 8 * s, y, 16 * s, 'messing', .3);
        setz(T('titel', h1 + ' & ' + h2, bw, 3 * s, 'tanne', { slot: null, x: x0 }), y + 3 * s);
        return;
      }
      if (form === 5) {   /* Gefach: Balken in Ochsenblut teilen das Blatt wie die Riegelwand; im grossen Gefach der Text, in den kleinen die Zeichen */
        grund(c, seite, 'navy', null); const b = 3.2 * s, sp = W * .22;
        fl(b, b, sp - 1.5 * b, H - 2 * b, 'papier', 'hell'); fl(W - sp + .5 * b, b, sp - 1.5 * b, H - 2 * b, 'papier', 'hell'); fl(sp, b, W - 2 * sp, H - 2 * b, 'weiss');
        zei(12 * s, sp / 2, H / 2 - zh(12 * s) / 2 - 3 * s, 'navy', false); zei(11 * s, W - sp / 2, H / 2 - zh(11 * s, true) / 2 - 3 * s, blau, true);
        setz(T('mono', o1, sp - 4 * s, 1.9 * s, 'tanne', { slot: 'ort1', x: 2 * s }), H / 2 + 6 * s);
        setz(T('mono', o2, sp - 4 * s, 1.9 * s, blau, { slot: 'ort2', x: W - sp + 2 * s }), H / 2 + 6 * s);
        let y = (H - 44 * s) / 2;
        y = setz(T('kapitale', titel.toUpperCase(), W - 2 * sp - 8 * s, 6 * s, 'tanne', { slot: 'titel', sperr: .08 }), y) + 2.6 * s;
        li(W / 2 - 7 * s, y, 14 * s, 'messing', .3); y += 4 * s;
        if (wert) y = setz(T('titel', wert, W - 2 * sp - 8 * s, 6 * s, 'navy', { slot: 'wert' }), y) + 2.2 * s;
        if (text) y = setz(T('text', text, W - 2 * sp - 14 * s, 2.4 * s, 'tinte', { slot: 'text', deck: .85 }), y) + 3 * s;
        setz(T('titel', h1 + ' & ' + h2, W - 2 * sp - 8 * s, 2.9 * s, 'tanne', { slot: null }), y + 2 * s);
        return;
      }
      if (form === 6) {   /* Siegel: in der Mitte ein Kreis in Ochsenblut mit dem Lamm, daneben klein die Zeiger; Text links, Felder rechts */
        hell(); const r = 5 * s; ra(r, r, W - 2 * r, H - 2 * r, 'messing', .3, .4, .8);
        const d = 34 * s, cx = W * .29, cy = H / 2;
        fl(cx - d / 2, cy - d / 2, d, d, 'navy', 'dunkel', d / 2); ra(cx - d / 2 + 1.6 * s, cy - d / 2 + 1.6 * s, d - 3.2 * s, d - 3.2 * s, 'gold', .25, d / 2, .8);
        zei(15 * s, cx, cy - zh(15 * s) / 2 - 1 * s, 'gold', false);
        const d2 = 14 * s, cx2 = cx + d / 2 - 1 * s, cy2 = cy + d / 2 - 5 * s; fl(cx2 - d2 / 2, cy2 - d2 / 2, d2, d2, blau, null, d2 / 2); zei(6.5 * s, cx2, cy2 - zh(6.5 * s, true) / 2, himmel, true);
        const x0 = W * .52, bw = W * .42;
        let y = (H - r - 17 * s - 30 * s) / 2 + 2 * s;
        y = setz(T('kapitale', titel.toUpperCase(), bw, 5.6 * s, 'tanne', { slot: 'titel', sperr: .08, ausr: 'l', x: x0 }), y) + 2.4 * s;
        if (wert) y = setz(T('titel', wert, bw, 5.8 * s, 'navy', { slot: 'wert', ausr: 'l', x: x0 }), y) + 2 * s;
        if (text) y = setz(T('text', text, bw, 2.3 * s, 'tinte', { slot: 'text', ausr: 'l', x: x0, deck: .85 }), y) + 3 * s;
        setz(T('titel', h1 + ' & ' + h2, bw, 2.8 * s, 'tanne', { slot: null, ausr: 'l', x: x0 }), y);
        felder(x0, H - r - 17 * s, bw, 'taupe', 'messing');
        return;
      }
      if (form === 7) {   /* Kalk mit den Rauten, links das Lamm, rechts die Zeiger, beide gross und leise; dazwischen die Schrift */
        grund(c, seite, 'papier', 'hell'); const r = 5 * s; fl(r + 26 * s, r, W - 2 * r - 52 * s, H - 2 * r, 'weiss', null, 0, .92);
        zei(22 * s, r + 13 * s, H / 2 - zh(22 * s) / 2, 'navy', false); zei(20 * s, W - r - 13 * s, H / 2 - zh(20 * s, true) / 2, blau, true);
        let y = 15 * s;
        y = setz(T('kapitale', titel.toUpperCase(), W * .5, 6.2 * s, 'tanne', { slot: 'titel', sperr: .08 }), y) + 2.4 * s;
        if (unter) y = setz(T('mono', unter, W * .5, 2.1 * s, 'taupe', { slot: 'unter' }), y) + 3 * s;
        if (wert) y = setz(T('titel', wert, W * .5, 6 * s, 'navy', { slot: 'wert' }), y) + 2.2 * s;
        if (text) y = setz(T('text', text, W * .44, 2.4 * s, 'tinte', { slot: 'text', deck: .85 }), y) + 3 * s;
        spalten(H - r - 14 * s, 'tanne', 'taupe', 'messing', W * .22);
        return;
      }
      if (form === 8) {   /* Band: oben ein schmales Band in Ochsenblut mit beiden Zeichen und «&», darunter Kalk mit Titel, Wert und Feldern */
        hell(); const bh = 22 * s; fl(-B, -B, W + 2 * B, bh + B, 'navy', 'dunkel');
        paar(bh / 2, 9 * s, 'gold', himmel, 'gold', 11);
        li(0, bh, W, 'messing', .5);
        let y = bh + 9 * s;
        y = setz(T('kapitale', titel.toUpperCase(), W * .7, 6 * s, 'tanne', { slot: 'titel', sperr: .08 }), y) + 2.4 * s;
        if (wert) y = setz(T('titel', wert, W * .7, 5.8 * s, 'navy', { slot: 'wert' }), y) + 2 * s;
        if (text) y = setz(T('text', text, W * .6, 2.4 * s, 'tinte', { slot: 'text', deck: .85 }), y) + 3 * s;
        spalten(H - 14 * s, 'tanne', 'taupe', 'messing');
        return;
      }
      if (form === 9) {   /* Ruhig: nur Schrift auf Kalk, die Häuser gross in Petrona mit dem «&», die Zeichen klein vor den Namen */
        hell(); const r = 5 * s; ra(r, r, W - 2 * r, H - 2 * r, 'navy', .5, .4);
        let y = (H - 46 * s) / 2;
        y = setz(T('mono', titel.toUpperCase(), W * .6, 2.4 * s, 'taupe', { slot: 'titel', sperr: .08 }), y) + 5 * s;
        const n1 = T('titel', h1, W * .7, 6.4 * s, 'tanne', { slot: 'haus1' }); y = setz(n1, y);
        const u = T('titel', '&', 12 * s, 6 * s, 'messing', { slot: null }); y = setz(u, y + .6 * s);
        const n2 = T('titel', h2, W * .7, 6.4 * s, blau, { slot: 'haus2' }); y = setz(n2, y + .6 * s) + 4 * s;
        zei(5 * s, W / 2 - 40 * s, n1.y + .4 * s, 'navy', false); zei(4.8 * s, W / 2 - 40 * s, n2.y + .4 * s, blau, true);
        if (wert) y = setz(T('titel', wert, W * .6, 4.6 * s, 'navy', { slot: 'wert' }), y) + 1.6 * s;
        if (text) setz(T('text', text, W * .6, 2.2 * s, 'tinte', { slot: 'text', deck: .85 }), y);
        return;
      }
      /* 10: Zwei Gefache nebeneinander auf einem Blatt, verbunden durch das goldene «&»: links Kalk mit Lamm, rechts Kalk mit den Zeigern, Titel darüber */
      grund(c, seite, 'navy', 'dunkel'); const r = 5 * s, gw = (W - 2 * r - 14 * s) / 2, gy = 30 * s, gh = H - gy - r;
      setz(T('kapitale', titel.toUpperCase(), W * .7, 6 * s, 'weiss', { slot: 'titel', sperr: .08 }), 8 * s);
      if (wert) setz(T('titel', wert, W * .7, 4.8 * s, 'gold', { slot: 'wert' }), 17.5 * s);
      for (const [k, x, zwei] of [[1, r, false], [2, W - r - gw, true]]) {
        fl(x, gy, gw, gh, 'weiss'); ra(x + 1.4 * s, gy + 1.4 * s, gw - 2.8 * s, gh - 2.8 * s, zwei ? blau : 'messing', .25, 0, .7);
        const cx = x + gw / 2; let y = gy + (gh - 22 * s) / 2; y += zei(zwei ? 10 * s : 11 * s, cx, y, zwei ? blau : 'navy', zwei) + 3 * s;
        y = setz(T('titel', k === 1 ? h1 : h2, gw - 6 * s, 3.4 * s, zwei ? blau : 'tanne', { slot: 'haus' + k, x: x + 3 * s }), y) + 1.2 * s;
        setz(T('mono', k === 1 ? o1 : o2, gw - 6 * s, 1.9 * s, 'taupe', { slot: 'ort' + k, x: x + 3 * s }), y);
      }
      const u = T('titel', '&', 12 * s, 9 * s, 'gold', { slot: null }); setz(u, gy + gh / 2 - u.h / 2);
    },
  };
  DS.VORLAGEN = V;

  /* Eine Seite aus Vorlage + Inhalt setzen */
  DS.setze = function (M, formatKey, vorlage, ton, inhalt, stil) {
    const fmt = DS.FORMATE[formatKey];
    const c = ctx(M, fmt, ton, stil);
    const seite = { grund: 'navy', tapete: null, el: [], quelle: { vorlage, ton, inhalt: JSON.parse(JSON.stringify(inhalt || {})) } };
    if (stil && Object.keys(stil).length) seite.quelle.stil = Object.assign({}, stil);
    (V[vorlage] || V.deckel).bau(c, inhalt || {}, seite);
    if (c.stil.ausr === 'l' && LINKS_MOEGLICH.includes(vorlage) && !(vorlage === 'gutschein' && c.quer)) linksbuendig(c);
    seite.el = c.el;
    return seite;
  };
  /* Linksbündige Fassung: alles, was mittig auf der Achse steht, an den linken Satzrand (Fotos, Flächen, Rahmen bleiben) */
  const LINKS_MOEGLICH = ['deckel', 'buehne', 'fenster', 'aushang', 'einladung', 'gutschein'];
  function linksbuendig(c) {
    const rand = c.el.some(e => e.typ === 'rahmen') ? Math.max(4.5, 5 * c.s8) : 0;
    const L = Math.max(c.m + 2, rand + 7 * c.s8);
    const scheibe = c.el.find(e => e.typ === 'flaeche' && e.r && Math.abs(e.w - e.h) < .5);   // Zeichen auf der Naht (Bild oben) bleibt mittig
    const mittig = e => Math.abs(e.x + e.w / 2 - c.w / 2) < .8;
    for (const e of c.el) {
      if (e.typ === 'text' && e.ausr === 'c' && mittig(e) && !(e.slot === 'fuss')) { e.ausr = 'l'; e.w = Math.min(e.w, c.w - L - rand - 4 * c.s8); e.x = L; e.h = DS.mess(e).h; }
      else if (e.typ === 'linie' && mittig(e) && e.w < c.w * .5) e.x = L;
      else if (e.typ === 'zeichen' && mittig(e) && !scheibe) e.x = L;
    }
  }

  /* Ein ganzes Dokument aus einem Entwurf (der KI oder einer Vorlage) */
  DS.dokument = function (M, entwurf) {
    const fk = DS.FORMATE[entwurf.format] ? entwurf.format : 'a5h';
    return {
      id: 'd' + Date.now().toString(36),
      name: entwurf.name || 'Neue Drucksache',
      formatKey: fk, format: { b: DS.FORMATE[fk].b, h: DS.FORMATE[fk].h },
      seiten: entwurf.seiten.map(s => DS.setze(M, fk, s.vorlage, s.ton || 'dunkel', s.inhalt || {}, s.stil)),
      hinweise: entwurf.hinweise || [], auftrag: entwurf.auftrag || '', geaendert: Date.now(),
    };
  };

  /* Beispielinhalte im Wortlaut der Taverne zum Schäfli (geprüft in _qa/vorlagen_schaefli.py, eingesetzt von _qa/schaefli_anpassen.py) */
  DS.BEISPIEL = {"deckel": {"ueber": "Taverne zum Schäfli", "titel": "Die Karte", "unter": "Mittwoch bis Samstag · 11:30 – 14:30 Uhr", "text": "Kochen und dabei Lebensmittel zu veredeln, wird in der «Taverne zum Schäfli» zelebriert."}, "buehne": {"bild": "stube-gast", "ueber": "Wigoltingen", "titel": "Haus der Gastlichkeit", "text": "Es gibt kaum etwas Schöneres, als den Gästen die Wünsche von den Augen abzulesen.", "aktion": "Reservation · +41 52 763 11 72"}, "ansicht": {"bild": "haus-tag", "titel": "Wigoltingen", "unter": "Taverne zum Schäfli"}, "karte": {"ueber": "Taverne zum Schäfli", "titel": "Menu Degustation", "text": "6 Gänge · 5 Gänge ohne Ocean · 4 Gänge ohne Ocean & Spätzle", "liste": [{"name": "Prolog", "detail": "", "preis": ""}, {"name": "Ocean 2026", "detail": "Balfego Thunfisch, Auster, Seeigel, Oscietra Kaviar", "preis": ""}, {"name": "Bretonischer Hummer", "detail": "Zitrus, Maltaise", "preis": ""}, {"name": "Handgeschabte Spätzle", "detail": "weisser Trüffel, Comté", "preis": ""}, {"name": "Wagyu A5", "detail": "Zunge, Backe, Filet", "preis": ""}, {"name": "Ormalinger Jungschwein", "detail": "Szegediner Gulasch, Sauerkraut", "preis": ""}, {"name": "Caramel 3", "detail": "", "preis": ""}], "fuss": "Christian Kuchler · Chef de cuisine"}, "einladung": {"ueber": "Taverne zum Schäfli", "titel": "Kitchen Party", "wann": "Samstag, 14. November 2026 · 19 Uhr", "wo": "Taverne zum Schäfli, Wigoltingen", "text": "Laurent Perrier · verschiedene Weine · Cocktails · musikalische Begleitung von Daddy Cool Project", "aktion": "Reservation · +41 52 763 11 72"}, "programm": {"ueber": "Taverne zum Schäfli", "titel": "Öffnungszeiten", "termine": [{"wann": "Restaurant", "was": "Mittwoch bis Samstag", "wo": "11:30 – 14:30 Uhr · 18:00 – 23:00 Uhr"}, {"wann": "Bar", "was": "Mittwoch bis Samstag", "wo": "17:00 – 01:00 Uhr"}, {"wann": "Ruhetage", "was": "Sonntag bis Dienstag geschlossen", "wo": ""}], "fuss": "+41 52 763 11 72"}, "fenster": {"bild": "stube-gast", "ueber": "Taverne zum Schäfli", "titel": "Wie zu Hause", "unter": "Wigoltingen", "text": "Fühlen Sie sich wie zu Hause. Durch die einzelnen Räume, die das Restaurant teilen, wird eine wohnliche und gemütliche Atmosphäre geschaffen."}, "geteilt": {"bild": "tafel", "ueber": "Gruppen und Feiern", "titel": "Der Festsaal", "text": "Gruppen von 12 bis 30 Personen finden in unserem wunderschönen Festsaal Platz.", "aktion": "Anfrage · kontakt@schaefli-wigoltingen.ch"}, "gutschein": {"titel": "Gutschein", "unter": "Taverne zum Schäfli · Wigoltingen", "wert": "Ein Abend für zwei", "text": "Für einen Abend am elterlichen Herd."}, "aushang": {"ueber": "Öffnungszeiten", "titel": "Mittwoch bis Samstag", "text": "Restaurant\n11:30 – 14:30 Uhr\n18:00 – 23:00 Uhr\n\nBar\n17:00 – 01:00 Uhr", "aktion": "Sonntag bis Dienstag geschlossen"}, "tuer": {"ueber": "Taverne zum Schäfli", "titel": "Reserviert", "unter": "Anna Keller · 18:30 Uhr", "text": "Wigoltingen"}, "rueckseite": {"text": "Es gibt kaum etwas Schöneres, als den Gästen die Wünsche von den Augen abzulesen."}, "kartengruss": {"titel": "Wigoltingen", "text": "Grüsse aus dem Thurgau."}, "zwei": {"titel": "Gutschein", "unter": "In beiden Häusern", "wert": "Ein Abend für zwei", "form": 3, "text": "Ein Gutschein kann für eines der beiden Häuser oder für beide gelten.", "haus1": "Taverne zum Schäfli", "ort1": "Wigoltingen", "haus2": "Wirtschaft am Schlössli", "ort2": "Bottighofen"}};
})();
