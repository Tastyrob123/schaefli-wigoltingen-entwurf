/* Drucksachen-Studio · Druck: eine Seite in Zeichenbefehle zerlegen (Masse in mm, Text Zeichen für Zeichen an
   der Stelle, an der der Browser ihn gesetzt hat), daraus PDF für die Druckerei oder ein Bild. Dazu die Druckprüfung. */
(function () {
  const DS = window.DS;
  const MM = 72 / 25.4;
  const S = 8;   // Messauflösung: 8 px je mm

  const hex = f => { const h = f.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
  const bildCache = {};
  DS.ladeBild = function (url) {
    if (!bildCache[url]) bildCache[url] = new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = nein; i.src = url; });
    return bildCache[url];
  };

  /* Grundlinien-Lage je Schrift: Abstand Oberkante Zeichenkasten → Grundlinie, als Anteil der Schriftgrösse */
  const grund = {};
  function grundlinie(rolle) {
    if (grund[rolle]) return grund[rolle];
    const w = document.createElement('div');
    w.style.cssText = `position:absolute;left:-99999px;top:0;font-family:'DS-${rolle}';font-size:100px;line-height:normal;white-space:nowrap`;
    w.innerHTML = 'H<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
    document.body.appendChild(w);
    const r = document.createRange(); r.setStart(w.firstChild, 0); r.setEnd(w.firstChild, 1);
    const top = r.getBoundingClientRect().top, base = w.lastChild.getBoundingClientRect().top;
    document.body.removeChild(w);
    return (grund[rolle] = (base - top) / 100);
  }

  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    const k = r * .5523;
    return `M${x + r} ${y}H${x + w - r}C${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}V${y + h - r}C${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h}` +
      `H${x + r}C${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r}V${y + r}C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`;
  }
  DS.rr = rr;

  /* Fläche mit Tapete als Pixelbild (Rapport an der Ecke des Endformats verankert, wie am Bildschirm) */
  async function tapetenBild(M, art, farbe, x, y, w, h, r, dpi) {
    const k = dpi / 25.4, cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    if (r) { g.beginPath(); g.roundRect(0, 0, cw, ch, r * k); g.clip(); }
    g.fillStyle = farbe; g.fillRect(0, 0, cw, ch);
    const kachel = await DS.ladeBild(M.basis + M.tapete[art]);
    const rw = M.tapete.rapport_mm * k, rh = rw * kachel.height / kachel.width;
    const ox = ((-x * k) % rw + rw) % rw - rw, oy = ((-y * k) % rh + rh) % rh - rh;
    for (let yy = oy; yy < ch; yy += rh) for (let xx = ox; xx < cw; xx += rw) g.drawImage(kachel, xx, yy, rw, rh);
    return { cv, png: !!r };
  }

  async function fotoBild(M, el, dpi) {
    const b = M.bildIndex[el.bild];
    let img;
    try { img = await DS.ladeBild(b && b.druck ? b.druck.url : DS.bildUrl(M, el.bild)); }
    catch (e) {   // Druckfassung nicht erreichbar (online in einem anderen Ordner, Netz): mit dem Foto der Website weiter, die Druckprüfung rechnet dann mit dessen Grösse
      if (!(b && b.druck)) throw e;
      b.druck = null; img = await DS.ladeBild(DS.bildUrl(M, el.bild));
    }
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const a = DS.ausschnitt(el, iw, ih);
    const s = iw / a.bw;                       // Quellpixel je mm
    const sx = -a.x * s, sy = -a.y * s, sw = el.w * s, sh = el.h * s;
    const cw = Math.max(1, Math.round(Math.min(sw, el.w / 25.4 * dpi))), ch = Math.max(1, Math.round(cw * el.h / el.w));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
    if (el.r) { g.beginPath(); g.roundRect(0, 0, cw, ch, el.r * cw / el.w); g.clip(); }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    void b;
    return { cv, png: !!el.r || !!(b && b.datei), dpi: sw / (el.w / 25.4) };
  }

  /* ---------- Zerlegen ---------- */
  DS.druckplan = async function (M, doc, i, o = {}) {
    const B = DS.B, s = doc.seiten[i], f = doc.format, dpi = o.dpi || 300;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;transform:translateX(-200000px);pointer-events:none';
    document.body.appendChild(host);
    const blatt = DS.seiteDom(M, doc, i, S, {});
    host.appendChild(blatt);
    await document.fonts.ready;
    const ur = blatt.getBoundingClientRect();
    const ox = ur.left + B * S, oy = ur.top + B * S;
    const ops = [];
    // Grund über den ganzen Beschnitt
    if (s.tapete) ops.push({ art: 'raster', x: -B, y: -B, w: f.b + 2 * B, h: f.h + 2 * B, ...(await tapetenBild(M, s.tapete, DS.farbe(M, s.grund), -B, -B, f.b + 2 * B, f.h + 2 * B, 0, 240)) });
    else ops.push({ art: 'pfad', d: rr(-B, -B, f.b + 2 * B, f.h + 2 * B, 0), fill: DS.farbe(M, s.grund), deck: 1 });
    const kinder = [...blatt.children];
    for (let n = 0; n < s.el.length; n++) {
      const el = s.el[n], d = kinder[n];
      const deck = el.deck ?? 1;
      if (el.typ === 'text') {
        const gl = DS.glyphen(d, S, ox, oy), a = grundlinie(el.rolle);
        ops.push({ art: 'text', rolle: el.rolle, gr: el.gr, farbe: DS.farbe(M, el.farbe), deck, gross: el.gross,
          glyphen: gl.map(g => ({ ch: el.gross ? g.ch.toUpperCase() : g.ch, x: g.x, base: g.top + a * el.gr })) });
      } else if (el.typ === 'bild') {
        if (!M.bildIndex[el.bild]) continue;
        ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, deck, ...(await fotoBild(M, el, dpi)) });
      } else if (el.typ === 'flaeche') {
        if (el.tapete) ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, deck, ...(await tapetenBild(M, el.tapete, DS.farbe(M, el.farbe), el.x, el.y, el.w, el.h, el.r, 240)) });
        else ops.push({ art: 'pfad', d: rr(el.x, el.y, el.w, el.h, el.r), fill: DS.farbe(M, el.farbe), deck });
      } else if (el.typ === 'linie') {
        const senk = el.h > el.w;
        ops.push({ art: 'pfad', d: rr(el.x, el.y, senk ? el.staerke : el.w, senk ? el.h : el.staerke, 0), fill: DS.farbe(M, el.farbe), deck });
      } else if (el.typ === 'rahmen') {
        const t = el.staerke;
        ops.push({ art: 'pfad', d: rr(el.x + t / 2, el.y + t / 2, el.w - t, el.h - t, Math.max(0, (el.r || 0) - t / 2)), stroke: DS.farbe(M, el.farbe), breite: t, deck });
      } else if (el.typ === 'zeichen') {
        const k = el.w / DS.zz(M, el).vb[2];
        ops.push({ art: 'zeichen', x: el.x, y: el.y, k, z: el.z, farbe: DS.farbe(M, el.farbe), deck });
      }
    }
    document.body.removeChild(host);
    return ops;
  };

  /* ---------- PDF ---------- */
  const schriftCache = {};
  async function schriftBytes(M, rolle) {
    const url = M.basis + 'schriften/' + M.schriften[rolle].datei;
    if (!schriftCache[url]) schriftCache[url] = fetch(url).then(r => r.arrayBuffer());
    return schriftCache[url];
  }

  DS.pdf = async function (M, doc, o = {}) {
    const { PDFDocument, rgb, cmyk } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    pdf.setTitle(doc.name); pdf.setAuthor(M.name); pdf.setCreator('Die Werkstatt · Tasty Studios'); pdf.setProducer('Die Werkstatt');
    const B = DS.B, R = o.marken ? 10 : 0, f = doc.format;
    const fonts = {}, zeichensatz = {};
    const font = async rolle => {
      if (!fonts[rolle]) {
        fonts[rolle] = await pdf.embedFont(await schriftBytes(M, rolle), { subset: true });
        zeichensatz[rolle] = new Set(fonts[rolle].getCharacterSet());
      }
      return fonts[rolle];
    };
    const fehlend = new Set();
    for (let i = 0; i < doc.seiten.length; i++) {
      if (o.melde) o.melde(`Seite ${i + 1} von ${doc.seiten.length} wird gesetzt …`);
      const ops = await DS.druckplan(M, doc, i, o);
      const PW = (f.b + 2 * B + 2 * R) * MM, PH = (f.h + 2 * B + 2 * R) * MM;
      const page = pdf.addPage([PW, PH]);
      const X = x => (x + B + R) * MM, Y = y => PH - (y + B + R) * MM;
      page.setBleedBox(R * MM, R * MM, (f.b + 2 * B) * MM, (f.h + 2 * B) * MM);
      page.setTrimBox((R + B) * MM, (R + B) * MM, f.b * MM, f.h * MM);
      for (const op of ops) {
        if (op.art === 'pfad') {
          const opt = { x: X(0), y: Y(0), scale: MM };
          if (op.fill) Object.assign(opt, { color: rgb(...hex(op.fill)), opacity: op.deck });
          if (op.stroke) Object.assign(opt, { borderColor: rgb(...hex(op.stroke)), borderWidth: op.breite, borderOpacity: op.deck });
          page.drawSvgPath(op.d, opt);
        } else if (op.art === 'raster') {
          const daten = op.png ? op.cv.toDataURL('image/png') : op.cv.toDataURL('image/jpeg', .92);
          const bild = op.png ? await pdf.embedPng(daten) : await pdf.embedJpg(daten);
          page.drawImage(bild, { x: X(op.x), y: Y(op.y + op.h), width: op.w * MM, height: op.h * MM, opacity: op.deck ?? 1 });
        } else if (op.art === 'zeichen') {
          for (const d of DS.zz(M, op).pfade) page.drawSvgPath(d, { x: X(op.x), y: Y(op.y), scale: op.k * MM, color: rgb(...hex(op.farbe)), opacity: op.deck });
        } else if (op.art === 'text') {
          const fo = await font(op.rolle);
          for (const g of op.glyphen) {
            let fx = fo;
            if (!zeichensatz[op.rolle].has(g.ch.codePointAt(0))) {
              const alt = await font('text');
              if (zeichensatz.text.has(g.ch.codePointAt(0))) fx = alt; else { fehlend.add(g.ch); continue; }
            }
            page.drawText(g.ch, { x: X(g.x), y: Y(g.base), size: op.gr * MM, font: fx, color: rgb(...hex(op.farbe)), opacity: op.deck });
          }
        }
      }
      if (o.marken) {
        const reg = cmyk(1, 1, 1, 1), t = .25, L = 5 * MM, gap = (B + 1) * MM;
        const x0 = (R + B) * MM, x1 = x0 + f.b * MM, y0 = (R + B) * MM, y1 = y0 + f.h * MM;
        for (const [x, sx] of [[x0, -1], [x1, 1]]) for (const [y, sy] of [[y0, -1], [y1, 1]]) {
          page.drawLine({ start: { x: x + sx * gap, y }, end: { x: x + sx * (gap + L), y }, thickness: t, color: reg });
          page.drawLine({ start: { x, y: y + sy * gap }, end: { x, y: y + sy * (gap + L) }, thickness: t, color: reg });
        }
        const fo = await font('mono');
        page.drawText(`${doc.name} · ${DS.FORMATE[doc.formatKey].name} (${f.b} × ${f.h} mm) · Seite ${i + 1} · 3 mm Beschnitt`, { x: x0 + 10 * MM, y: 3.5 * MM, size: 5.5, font: fo, color: reg });
      }
    }
    return { bytes: await pdf.save(), fehlend: [...fehlend] };
  };

  /* ---------- Bild (PNG) ---------- */
  DS.png = async function (M, doc, i, pxBreite) {
    const f = doc.format, ops = await DS.druckplan(M, doc, i, { dpi: 220 });
    const k = pxBreite / f.b, cv = document.createElement('canvas');
    cv.width = Math.round(f.b * k); cv.height = Math.round(f.h * k);
    const g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    for (const op of ops) {
      g.save(); g.globalAlpha = op.deck ?? 1;
      if (op.art === 'pfad') {
        const p = new Path2D(op.d);
        if (op.fill) { g.fillStyle = op.fill; g.fill(p); }
        if (op.stroke) { g.strokeStyle = op.stroke; g.lineWidth = op.breite; g.stroke(p); }
      } else if (op.art === 'raster') g.drawImage(op.cv, op.x, op.y, op.w, op.h);
      else if (op.art === 'zeichen') {
        g.translate(op.x, op.y); g.scale(op.k, op.k); g.fillStyle = op.farbe;
        for (const d of DS.zz(M, op).pfade) g.fill(new Path2D(d));
      } else if (op.art === 'text') {
        g.fillStyle = op.farbe; g.font = `${op.gr}px 'DS-${op.rolle}'`; g.textBaseline = 'alphabetic';
        for (const gl of op.glyphen) g.fillText(gl.ch, gl.x, gl.base);
      }
      g.restore();
    }
    return new Promise(ok => cv.toBlob(ok, 'image/png'));
  };

  /* ---------- Druckprüfung ---------- */
  DS.pruefe = function (M, doc) {
    const out = [], f = doc.format, B = DS.B, Sx = DS.SICHER, digital = DS.FORMATE[doc.formatKey]?.digital;
    doc.seiten.forEach((s, i) => {
      const seite = doc.seiten.length > 1 ? `Seite ${i + 1}: ` : '';
      for (const el of s.el) {
        const h = DS.elHoehe(M, el), kurz = el.typ === 'text' ? `«${el.text.replace(/\s+/g, ' ').slice(0, 34)}${el.text.length > 34 ? '…' : ''}»` : { bild: 'Foto', flaeche: 'Fläche', linie: 'Linie', rahmen: 'Rahmen', zeichen: 'Zeichen' }[el.typ];
        if (el.typ === 'bild' && M.bildIndex[el.bild]) {   // Kennzeichnung wie in Le Livre
          const bi = M.bildIndex[el.bild];
          if (bi.ki) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto mit KI erzeugt («${bi.alt}»): zeigt kein echtes Gericht oder Getränk des Hauses. Für Werbung nur mit Hinweis oder nach einem echten Foto.` });
          else if (bi.herkunft === 'frei') out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto frei lizenziert (${bi.quelle}): Urheber und Lizenz beim Foto oder im Impressum nennen.` });
        }
        if (el.typ === 'text') {
          const ph = el.text.match(/\[[^\]]*\]/g);
          if (ph) out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Platzhalter ${ph.join(', ')} noch ausfüllen` });
          if (!el.text.trim()) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}leeres Textfeld` });
          if (!digital && (el.x < Sx - .01 || el.y < Sx - .01 || el.x + el.w > f.b - Sx + .01 || el.y + h > f.h - Sx + .01))
            out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} liegt näher als ${Sx} mm am Rand und kann beim Schneiden angeschnitten werden` });
        }
        if ((el.typ === 'bild' || el.typ === 'flaeche') && !digital) {
          const zuKurz = (a, b) => a > -B + .05 && a < .6 && b > 0;   // berührt den Rand, reicht aber nicht in den Beschnitt
          if (zuKurz(el.x, el.w) || zuKurz(el.y, h) || zuKurz(f.b - (el.x + el.w), el.w) || zuKurz(f.h - (el.y + h), h))
            out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} endet am Rand, ohne 3 mm in den Beschnitt zu reichen (weisser Blitzer möglich)` });
        }
        if (el.typ === 'bild') {
          const b = M.bildIndex[el.bild];
          if (!b) { out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Foto fehlt` }); continue; }
          const px = b.druck || b, a = DS.ausschnitt(el, px.w, px.h), dpi = (px.w / a.bw) * 25.4;
          const plakat = Math.min(f.b, f.h) >= 297;   // ab A3: Plakat, wird aus Abstand gesehen, 150 dpi genügen (so sagt es der gelbe Hinweis selbst)
          if (dpi < 150) out.push({ stufe: 'rot', id: el.id, seite: i, text: `${seite}Foto «${b.key}» hat im Druck nur ${Math.round(dpi)} dpi und wird unscharf (kleiner ziehen oder weniger vergrössern)` });
          else if (dpi < 220 && !digital && !plakat) out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}Foto «${b.key}» hat ${Math.round(dpi)} dpi: für Plakate aus Abstand gut, für Karten aus der Nähe knapp` });
        }
        if (el.x > f.b + B || el.y > f.h + B || el.x + el.w < -B || el.y + h < -B)
          out.push({ stufe: 'gelb', id: el.id, seite: i, text: `${seite}${kurz} liegt ausserhalb der Seite` });
      }
    });
    return out;
  };
})();
