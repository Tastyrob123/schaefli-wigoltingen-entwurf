/* Das Hausbuch (Le Livre) · Taverne zum Schäfli, Wigoltingen. Die Marke des Hauses zum Arbeiten (Nachbau von Le Livre der Wirtschaft am Schlössli, dahinter
   Grand Beau-Rivage, dort nur gelesen): Bildarchiv mit fertigen Grössen, Dateien (Lamm, Wappen, Wortmarke, Name, Tapete, Auszeichnungen, Farben, Schriften), Markenprüfung, Markenbuch (buch.html).
   Namen der Welt Landhaus (_Werkzeuge/stamm/welt.js): Das Hausbuch, Die Stube, Die Werkstatt.
   Daten: livre.json (gebaut von bau.py), Downloads und Prüfung über den Server-Teil (server.py lokal, online/livre_online.py). Gespeichert wird nichts,
   ausser «Ergebnis sichern» legt auf Wunsch eine Datei auf diesem Rechner ab. Fehlermelder, Ladezeichen und Startfehler laufen vorher in start.js. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const PU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v9M3.8 7 8 11.2 12.2 7M3 14h10"/></svg>';
const PO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12V3M3.8 7 8 2.8 12.2 7M3 14h10"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>';
const KOPIE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.6"/><path d="M3 10.5V3.8A1.3 1.3 0 0 1 4.3 2.5H10.5"/></svg>';
const BUCH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.2c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v9.6c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6z"/><path d="M8 3.8v9.6"/></svg>';
const HAUS = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.2 8 2.8l5.5 4.4V13.5h-11z"/><path d="M6.4 13.5V9.6h3.2v3.9"/></svg>';
const PFEIL = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';
const S_ = 'taverne-zum-schaefli';
const ZEICHEN = `<img src="dateien/${S_}-lamm-gold.svg" alt="" width="32" height="40" decoding="async">`;
const ZEICHEN_N = `<img src="dateien/${S_}-lamm-riegel.svg" alt="" width="32" height="40" decoding="async">`;
const MARKE = 'buch.html', DAT = 'dateien/', ORIG = 'original/';
const MAISON = /\/_werkzeuge\//.test(location.pathname) ? '../maison/' : '/maison/';   // lokal _werkzeuge/maison/, online /maison/ (nach Adresse, nie fest; Notiz La Maison 17.10.2026)
const WEBSITE = '/';
const IMPRIMERIE = '../imprimerie/';      // immer relativ, nie nach Port (F18): lokal _werkzeuge/imprimerie/, online werkzeuge/imprimerie/
const okey = k => k.replace(/\//g, '-');

/* ---------------------------------------------------------------- Sprachen der Oberfläche
   Freigeschaltet ist Deutsch. Ein Sprachplan des Hauses ist noch nicht entschieden (Station 03: sprachen.json, «Nichts entschieden», Station 15a). Übersetzt wird erst auf
   Roberts Wort; dann kommt je Sprache nur ein Eintrag in SPRACHEN und ein Block in T dazu (fehlende Schlüssel fallen auf Deutsch zurück, keine Sprache
   von rechts nach links). Mit ?sprachen=probe erscheint eine Probe-Sprache, die jeden Text in ‹ › setzt: so lässt sich der Wechsel prüfen. */
const SPRACHPLAN = [['de', 'DE', 'Deutsch']];
const SPRACHEN = SPRACHPLAN.filter(([k]) => k === 'de');   // freigeschaltet; später: SPRACHPLAN.filter(([k]) => T[k])
const T = {
de: {
  name: '{marke}', unter: 'Marke · Taverne zum Schäfli', start: 'Übersicht', arbeiten: 'Arbeiten', nachschlagen: 'Nachschlagen', bilder: 'Fotos', dateien: 'Logo & Dateien', pruefung: 'Markenprüfung', buch: 'Markenbuch',
  anleitung: 'Anleitung', maison: '{zentrale}', website: 'Website ansehen', sprache: 'Sprache', rundgang: 'Kurzer Rundgang', bereiche: 'Bereiche',
  morgen: 'Guten Morgen.', tag: 'Guten Tag.', abend: 'Guten Abend.', frage: 'Was brauchen Sie heute?',
  start_satz: '{marke} ist die Marke des Hauses zum Arbeiten: alle Fotos in fertigen Grössen für Instagram, Website und Druck, das Lamm, das Wappen, die Wortmarke, die Tapete, die Auszeichnungen und die Farben als Dateien, und eine Prüfung für Entwürfe von Agenturen und aus dem Haus.',
  k_bilder: 'Alle Fotos der Website, nach Bereich, Saison und Format. Jedes Foto als Beitrag, Story, für die Website oder den Druck.',
  k_dateien: 'Das Lamm, das Wappen, die Wortmarke und der Name für helle und dunkle Flächen, die Rauten-Tapete, die Auszeichnungen und die Farbwerte zum Kopieren.',
  k_pruefung: 'Ein Entwurf als Bild oder PDF. {marke} sagt, was zum Haus passt und was nicht, Punkt für Punkt.',
  k_buch: 'Das Lamm, die Wortmarke, Schriften, Farben und ihre Herkunft am Haus, die Auszeichnungen und der Ton, nach denen alles gestaltet ist.',
  oeffnen: 'Öffnen', lesen: 'Lesen',
  ue_kurz: 'nachgeschärft', z_haus: 'Fotos des Hauses', z_frei: 'frei lizenziert', z_ki: 'mit KI verändert', z_fremd: 'mit fremden Rechten', z_ue: 'nachgeschärft, mit Vorher', z_dateien: 'Dateien', formate: 'Formate',
  stand: '{0} Fotos · {1} Dateien',
  recht_t: 'Bildrechte', recht: 'Die Fotos gehören der Taverne zum Schäfli und den jeweiligen Fotografen. Frei lizenzierte Fotos nur mit dem genannten Namen und der Lizenz. Fotos mit fremden Rechten nur mit Erlaubnis der Rechteinhaber.',
  alles_zip: 'Alle Dateien (ZIP)',
  b_titel: 'Alle Fotos', b_satz: 'Ein Klick auf ein Foto öffnet es. Dort laden Sie es in der Grösse, die Sie brauchen, und wählen bei Beitrag und Story den Ausschnitt.',
  suchen: 'Suchen, zum Beispiel «Stube» oder «Kaviar»', bereich: 'Bereich', saison: 'Saison', format: 'Format', herkunft: 'Herkunft', alle: 'Alle',
  b_haus: 'Haus & Fassade', b_stuben: 'Stuben & Säle', b_teller: 'Teller', b_kueche: 'In der Küche', b_team: 'Familie & Team', b_bar: 'Bar & Smokers Lounge', b_wein: 'Wein & Champagner', b_feste: 'Anlässe & Feste', b_dorf: 'Dorf & Thurtal', b_geschichte: 'Geschichte', b_familie: 'Schwesterhaus',
  s_sommer: 'Sommer', s_winter: 'Winter', s_jahr: 'Ganzjährig', f_hoch: 'Hochformat', f_quer: 'Querformat', f_quadrat: 'Quadrat',
  h_haus: 'Fotos des Hauses', h_frei: 'Frei lizenziert', h_ki: 'Mit KI verändert', h_fremd: 'Fremde Rechte',
  im_titel: 'In {druck_in} gestalten', im_beitrag: 'Als Instagram-Beitrag', im_story: 'Als Story', im_satz: 'Öffnet {druck} mit diesem Foto und Ihrem Ausschnitt.',
  treffer: '{0} von {1} Fotos', keine: 'Kein Foto passt. Ein Filter weniger hilft.', mehr: 'Mehr zeigen', zuruecksetzen: 'Filter zurücksetzen',
  ki: 'KI', fremd: 'Rechte', fremd_lang: 'Fremde Rechte', fremd_satz: 'Die Rechte an diesem Bild sind nicht belegt. Es steht auf der Website nur für die Demo. Für Werbung, Druck oder Beiträge erst nach Rückfrage beim Haus oder den Rechteinhabern, sonst durch ein Foto des Hauses ersetzen.', ki_lang: 'Mit KI verändert', ki_satz: 'Ein Foto des Hauses, mit KI verändert (Dinge entfernt oder Himmel ergänzt). Es steht als Platzhalter auf der Website, bis das Haus ein eigenes Foto in dieser Art hat. Für Werbung nur mit diesem Hinweis. «Vorher» zeigt das Foto, aus dem es entstanden ist.',
  frei_satz: 'Frei lizenziert: verwenden nur mit dem Namen des Fotografen und der Lizenz, wie unter «Quelle» genannt.',
  ue_satz: 'Licht und Schärfe sind mit KI überarbeitet, der Inhalt ist das echte Foto.', archiv: 'Aus dem Archiv, gemeinfrei. Nicht einfärben, nicht überarbeiten.',
  quelle: 'Quelle', quelle_link: 'Quelle ansehen', original: 'Grösste Fassung', laden: 'Laden', grossen: 'Grössen', ausschnitt: 'Ausschnitt: das Feld im Bild ziehen.',
  g_instagram: 'Instagram-Beitrag', g_story: 'Story', g_web: 'Website', g_druck: 'Druck',
  i_instagram: '1080 × 1350, JPG', i_story: '1080 × 1920, JPG', i_web: 'längste Seite 2000 px, JPG', i_druck: 'volle Auflösung, {0} × {1}, JPG', i_druck_web: 'in Website-Grösse (Original nicht hinterlegt), JPG',
  ohne_server: 'Fertige Grössen brauchen den Server-Teil. Ohne ihn lädt der Knopf das Foto in Website-Grösse.',
  vn_vorher: 'Vorher', vn_nachher: 'Nachher', vn_schieber: 'Schieber', vn_t_vorher: 'Vorher · so geliefert', vn_t_nachher: 'Nachher · nachgeschärft', vn_t_vorher_ki: 'Vorher · das Foto', vn_t_nachher_ki: 'Nachher · mit KI verändert', vn_t_schieber: 'Vorher links · nachher rechts',
  vn_hilfe: 'Mit «Vorher» sehen Sie das Foto, wie das Haus es geliefert hat.', vn_orig: 'Vorher laden',
  d_titel: 'Logo & Dateien', d_satz: 'Alles, was eine Agentur oder eine Druckerei braucht. SVG bleibt in jeder Grösse scharf, PNG hat einen durchsichtigen Grund.',
  d_logo: 'Wortmarke', d_logo_s: 'Die Wortmarke des Hauses von 2016, Pixel für Pixel das Original: das Wappen mit dem Lamm, darunter TAVERNE ZUM SCHÄFLI, auch mit WIGOLTINGEN. Nur als Bild vorhanden, nicht als Vektor. Nie umfärben: das Wappen trägt seine Farben. Einfarbig gibt es das Wappen und den Namen einzeln.',
  d_zeichen: 'Das Lamm', d_zeichen_s: 'Das Lamm mit der Kreuzfahne aus dem Wappen, nachgezeichnet: das einzige Zeichen der Website, für Siegel, Stempel und Profilbild. In Ochsenblut tief, Riegelrot, Schildgold oder Weiss.', d_zeiger: 'Das Wappen', d_zeiger_s: 'Das Wappen des Hauses: farbig, wie das Haus es zeigt, und einfarbig in Ochsenblut tief, Schildgold oder Weiss. Bleibt in jeder Grösse scharf.',
  d_name: 'Name', d_name_s: 'Der Name in Versalien in Petrona, der Schrift aus der Wortmarke, gesperrt: lang und kurz.',
  d_website: 'Die heutige Website', d_website_s: 'Das Wappen, wie die heutige Website des Hauses es beim Teilen zeigt (2024). Unverändert, zum Nachschlagen.',
  d_ehre: 'Die Auszeichnungen', d_ehre_s: 'Die Logos in ihren Originalfarben, wie im Fuss der Website. Nie umfärben, nie verzerren, mit Luft rundherum, auf Kalk oder Weiss.',
  d_tapete: 'Tapete', d_tapete_s: 'Die Rauten der Fachwerk-Brüstung als feines Gitter, das Lamm in jeder zweiten Raute, Ton in Ton, so wie die Website es zeigt: auf Ochsenblut und auf Kalk.',
  d_farben: 'Farben', d_farben_s: 'Ein Klick kopiert den Wert. Schildgold zeichnet und schreibt nie den Lesetext. Wappengrün nur als Punkt.', d_schriften: 'Schriften',
  d_schriften_s: 'Drei Schriften, frei lizenziert. Für die Website als WOFF2, für Druck und Programme als ZIP mit TTF und Hinweis.',
  hell: 'für helle Flächen', dunkel: 'für dunkle Flächen', kopiert: 'Kopiert', regeln: 'Regeln im Markenbuch',
  v_tief: 'Ochsenblut tief', v_riegel: 'Riegelrot', v_gold: 'Schildgold', v_weiss: 'Weiss', v_farbig: 'Farbig', v_original: 'Original · auf Hell', 'v_original-hell': 'Original · auf Dunkel', 'v_mit-ort': 'Mit Wigoltingen', v_heute: 'Heutige Website', v_alle: 'Alle',
  'v_kurz-tief': 'Kurz · Ochsenblut tief', 'v_kurz-weiss': 'Kurz · Weiss', 'v_kurz-gold': 'Kurz · Schildgold', v_dunkel: 'Auf Ochsenblut', v_hell: 'Auf Kalk', v_t_dunkel: 'Auf Ochsenblut',
  p_titel: 'Markenprüfung', p_satz: 'Laden Sie einen Entwurf hoch, etwa ein Plakat, einen Beitrag oder den Flyer einer Agentur. Die Farben werden gemessen, Bild, Schrift, Zeichen und Ton beurteilt Claude.',
  p_feld: 'Entwurf hierher ziehen', p_feld2: 'oder wählen · Bild oder PDF, bis 30 MB', p_waehlen: 'Datei wählen', p_pruefen: 'Prüfen', p_beispiel: 'Beispiel ansehen',
  p_beispiel_h: 'Dieser Entwurf ist eigens gezeichnet, so wie ihn eine Agentur schicken könnte. Die Farben sind gemessen; die Urteile zu Schrift, Zeichen, Bild und Ton sind ein Beispiel, so wie die Prüfung antwortet.',
  p_probe: 'Probe-Antwort ohne Claude: Die Farben sind wirklich gemessen. Schrift, Zeichen, Bild und Ton sind nicht beurteilt; die echte Prüfung antwortet im selben Aufbau, sobald sie eingeschaltet ist.',
  p_privat: 'Nichts wird gespeichert. Der Entwurf geht nur für die Prüfung an den Server und ist danach weg.',
  p_schritt1: 'Farben messen', p_schritt2: 'Entwurf ansehen', p_schritt3: 'Rückmeldung schreiben', p_dauer: 'Das dauert meist eine halbe Minute.',
  p_gesamt: 'Insgesamt', p_punkte: 'Punkt für Punkt', p_farben: 'Gemessene Farben', p_farben_s: 'Ohne KI gemessen, gegen die Palette des Hauses. Fotos im Entwurf zählen mit.',
  p_rahmen: '{0} % der Fläche in den Farben des Hauses', p_ton: 'Im Ton des Hauses', p_neu: 'Neuen Entwurf prüfen', p_sichern: 'Ergebnis sichern', p_kopie: 'Als Text kopieren',
  p_gleich: 'gleich', p_nah: 'nah', p_fremd: 'fremd', p_naechste: 'nächste Hausfarbe', p_schwarz: 'Reines Schwarz auf {0} % der Fläche. Geschrieben wird in Tinte #2A292B.',
  u_passt: 'passt', u_achten: 'achten', u_passt_nicht: 'passt nicht',
  ber: { farben: 'Farben', schrift: 'Schrift', zeichen: 'Zeichen', abstand: 'Abstand', bild: 'Bild', ton: 'Ton' },
  p_ki_fehler: 'Die Beurteilung durch Claude war gerade nicht möglich ({0}). Die Messung der Farben steht links.', p_fehler: 'Die Prüfung ging nicht durch',
  p_seiten: '{0} Seiten, geprüft die ersten {1}', p_text: 'Gelesener Text', fehler_verb: 'Der Server-Teil antwortet nicht.',
  schliessen: 'Schliessen', fehler_json: 'Die Daten (livre.json) fehlen.',
  p_typ: 'Diese Datei ist kein Bild und keine PDF. Erlaubt sind JPG, PNG, WebP und PDF.', p_gross: 'Die Datei ist grösser als 30 MB.', p_pdf_online: 'Online geht eine PDF bis 3 MB. Bitte kleiner speichern oder die erste Seite als Bild prüfen.', p_offline: 'Keine Verbindung. Der Entwurf bleibt gewählt, bitte noch einmal prüfen, sobald das Netz wieder da ist.', fehler_code: 'Der Server antwortete mit Fehler {0}.',
  tuer_t: '{marke} startet nicht.', tuer_neu: 'Neu laden', tuer_hilfe: 'Hilft das nicht: die Anleitung öffnen oder Tasty Studios Bescheid geben.'
}
};
if (/[?&]sprachen=probe\b/.test(location.search)) {   // nur für die Prüfung des Sprachwechsels: jeder Text in ‹ ›
  SPRACHEN.push(['pr', 'PR', 'Probe (nur Prüfung)']);
  const um = x => typeof x === 'string' ? '‹' + x + '›' : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, um(v)])) : x;
  T.pr = um(T.de);
}
let SP = (() => { try { const q = new URLSearchParams(location.search).get('sprache'); if (q && T[q]) return q; const m = localStorage.getItem('sf-livre-sprache'); return m && T[m] ? m : 'de'; } catch (e) { return 'de'; } })();
/* Namen der Werkzeuge des Schäfli: eine Stelle, WO_HAUS.namen im gemeinsamen Kleid (livre.json trägt eine Kopie vom Bau, falls das Kleid fehlt) */
let NAMEN = Object.assign({}, (window.WO_HAUS && WO_HAUS.namen) || {});   // sofort aus dem Kleid, damit auch die Startfehler-Tür den Namen trägt (nie «{marke}»)
const inDat = n => n.replace(/^Das /, 'dem ').replace(/^Die /, 'der ').replace(/^Der /, 'dem ');
const mitNamen = s => s.replace(/\{(zentrale|website|karten|gaeste|marke|besuche|druck)(_in)?\}/g, (m, k, d) => NAMEN[k] ? (d ? inDat(NAMEN[k]) : NAMEN[k]) : m);
/* Kopf, Rand und Startbild baut das Paket mit den Landhaus-Namen (welt.js): hier gegen die Namen des Hauses getauscht */
const umbenannt = html => { if (!window.WO || !WO.namen) return html; let h = html; for (const k in WO.namen) if (NAMEN[k]) h = h.split(WO.namen[k][1]).join(NAMEN[k]); return h; };
const t = (k, ...a) => { let s = (T[SP] && T[SP][k] != null ? T[SP][k] : T.de[k]); if (typeof s === 'string') { a.forEach((x, i) => { s = s.split('{' + i + '}').join(x); }); s = mitNamen(s); } return s; };
const zahl = n => Number(n).toLocaleString('de-CH');

/* ---------------------------------------------------------------- Zustand */
const S = { d: null, server: null, ansicht: 'start', f: { q: '', b: 'alle', s: 'alle', f: 'alle', h: 'alle' }, n: 48, datei: null, ergebnis: null };
const ANSICHTEN = ['start', 'bilder', 'dateien', 'pruefung'];
const FORMATE = { instagram: [1080, 1350], story: [1080, 1920] };

/* ---------------------------------------------------------------- Grundgerüst */
/* Werkzeug-Oberfläche «Die Bühne» (oberflaeche.py) */
/* Kopf, Rand und Leiste aus dem Paket der Werkzeuge des Hauses (assets/oberflaeche, Rahmen «Die Bühne», kleid/schaefli.*), gleich wie in den anderen Werkzeugen */
const UNTER = () => String(t('unter')).split(' · ')[0];   // «Marke»; den Namen des Hauses setzt das Paket dazu
function kopf() {
  const titel = { start: t('start'), bilder: t('bilder'), dateien: t('dateien'), pruefung: t('pruefung') }[S.ansicht];
  const st = S.d ? t('stand', zahl(S.d.stand.fotos), zahl(S.d.stand.dateien)) : '';
  $('#kopf').innerHTML = umbenannt(WO.kopf({ werkzeug: 'marke', unter: UNTER(), titel, stand: st, anleitung: 'anleitung.html', website: WEBSITE, marke: 'data-gehe="start"', markeHref: '#start' }));
  if (SPRACHEN.length > 1) {
    const akt = SPRACHEN.find(x => x[0] === SP) || SPRACHEN[0];
    $('#kopf .wo-kopf__r').insertAdjacentHTML('afterbegin', `<div class="li-sp"><button class="li-sp__k" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(t('sprache'))}">${esc(akt[1])}<i>${PFEIL}</i></button>
      <ul role="listbox">${SPRACHEN.map(([k, kurz, name]) => `<li><button type="button" role="option" data-sp="${k}" ${k === SP ? 'aria-selected="true"' : ''}><span>${esc(name)}</span><small>${esc(kurz)}</small></button></li>`).join('')}</ul></div>`);
    const sp = $('.li-sp'), k = $('.li-sp__k');
    k.onclick = e => { e.stopPropagation(); const o = sp.classList.toggle('offen'); k.setAttribute('aria-expanded', o); };
    $$('[data-sp]', sp).forEach(b => b.onclick = () => wechsle(b.dataset.sp));
  }
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
}
document.addEventListener('click', () => { const sp = $('.li-sp'); if (sp) { sp.classList.remove('offen'); $('.li-sp__k').setAttribute('aria-expanded', false); } });

function rand() {
  const e = (key, text, z = '') => ({ text, zahl: z, an: S.ansicht === key, attr: `data-gehe="${key}"` });
  $('#rand').innerHTML = WO.rand([
    { eintraege: [e('start', t('start'))] },
    { titel: t('arbeiten'), eintraege: [e('bilder', t('bilder'), S.d ? zahl(S.d.stand.fotos) : ''), e('dateien', t('dateien'), S.d ? zahl(S.d.stand.dateien) : ''), e('pruefung', t('pruefung'))] },
    { titel: t('nachschlagen'), eintraege: [{ text: t('buch'), href: MARKE, extra: `<em class="wo-rand__z">${esc(t('lesen'))}</em>` }] }
  ], { website: WEBSITE, anleitung: 'anleitung.html' });
  $('#rand').innerHTML = umbenannt($('#rand').innerHTML);
  $('#rand .wo-rand__wege').insertAdjacentHTML('afterbegin', `<a href="${MAISON}">${esc(t('maison'))}${WO.ic('haus')}</a>`);
  /* Sprache am Handy: der Kopf zeigt dort nur Marke und «Bereiche», darum steht die Wahl auch im Rand (nur unter 900 px sichtbar, livre.css) */
  if (SPRACHEN.length > 1) $('#rand .wo-rand__wege').insertAdjacentHTML('beforeend', `<div class="li-sp-r" role="group" aria-label="${esc(t('sprache'))}">${SPRACHEN.map(([k, kurz, name]) => `<button type="button" data-sp="${k}" aria-pressed="${k === SP}" title="${esc(name)}">${esc(kurz)}</button>`).join('')}</div>`);
  $$('#rand [data-sp]').forEach(b => b.onclick = () => wechsle(b.dataset.sp));
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
}
function zuklappen() { /* das Paket klappt den Rand am Handy nach der Wahl selbst zu */ }

function leiste() {
  $('#leiste').innerHTML = WO.leiste({ titel: t('recht_t'), satz: t('recht'), knoepfe: WO.knopf(esc(t('alles_zip')), 'hoch', 'gold', { href: `${DAT}${S_}-marke.zip`, attr: 'download', klein: true }) });
}

function gehe(a) {
  S.ansicht = a;
  try { localStorage.setItem('sf-livre-ansicht', a); } catch (e) { /* privat */ }
  history.replaceState(null, '', location.pathname + location.search + '#' + a);
  kopf(); rand(); zeichne();
  scrollTo({ top: 0 });
}
function wechsle(sp) {
  SP = sp;
  try { localStorage.setItem('sf-livre-sprache', sp); } catch (e) { /* privat */ }
  document.documentElement.lang = sp === 'de' ? 'de-CH' : sp;
  kopf(); rand(); leiste(); zeichne(true);
}

/* Startbild einer Ansicht: WO.startbild als Bühne mit dem Foto der Ansicht (dieselben Fotos wie bisher, unbearbeitet), Zahlen darunter als wo-lage */
const SB_FOTO = { bilder: 'stube-gast', dateien: 'urkunden', pruefung: 'hand' };
/* Foto der Bühne in 1200 Breite (Robert 18.10.: «Wieso ist da links nichts? Das lädt zu lange.»), sonst die grösste Fassung */
const grossVon = k => { const f = (S.d && S.d.fotos.find(x => x.k === k)) || {}; return f.fm || f.fl || ''; };
const buehneVon = a => grossVon(SB_FOTO[a] || 'nacht').replace(/^(\.\.\/)+/, '/');
function titel(ansicht, h1, satz, kn = '', stats = []) {
  const z = h1.length > 1 ? `${esc(h1.slice(0, -1).join(' '))} <em>${esc(h1[h1.length - 1])}</em>` : esc(h1[0]);
  return umbenannt(WO.startbild({ werkzeug: 'marke', art: 'buehne', foto: buehneVon(ansicht), h1: z, satz: esc(satz), knoepfe: woKn(kn) }))
    + (stats.length ? `<div class="wo-lage li-lage" data-r>${stats.map(([a, b]) => `<div class="wo-lg"><span class="wo-mk">${esc(b)}</span><b>${esc(a)}</b></div>`).join('')}</div>` : '');
}
/* Knöpfe in den Startbildern im Stil des Pakets (gleiche Ziele und Attribute) */
const woKn = h => String(h || '').replace(/class="kn kn--(gold|linie)( kn--hell)?"/g, (m, a) => `class="wo-kn wo-kn--${a === 'gold' ? 'gold' : 'hell'}"`)
  .replace(/class="kn"/g, 'class="wo-kn wo-kn--hell"').replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>)([^<]+)<i>/g, '$1<span>$2</span><i>')
  .replace(/<i><svg viewBox/g, '<i><svg class="wo-ic" viewBox');   /* Zeichen im Knopf wie im Paket (nur Linie, nie gefüllt) */

function teile(s) { const i = s.lastIndexOf(' '); return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s]; }

function zeichne(still = false) {
  const el = $('#ansicht');
  const a = S.ansicht;
  el.innerHTML = a === 'bilder' ? bilder() : a === 'dateien' ? dateien() : a === 'pruefung' ? pruefung() : start();
  if (a === 'bilder') bilderLeben(); else if (a === 'dateien') dateienLeben(); else if (a === 'pruefung') pruefungLeben(); else startLeben();
  auftritte(el, still);
}

/* Auftritte (R17): federnd hereinschweben, sobald im Bild, nur transform; deckend ab dem ersten Bild (kein Aufblenden aus 0), höchstens 22 je Wechsel */
let IO = null, IO2 = null;
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function auftritte(r, still) {
  /* R17 (Robert 14./15.10.: «nicht von meiner Geschwindigkeit abhängig … nicht erst warten»): beim Ansichtswechsel federt nur, was im ersten Bild steht,
     der Reihe nach, höchstens 22; alles darunter und alles, was beim Scrollen nachkommt, steht sofort. Nur transform, deckend ab dem ersten Bild. */
  const alle = $$('[data-r]', r).filter(x => !x.classList.contains('da'));
  if (still || RUHIG()) { alle.forEach(x => x.classList.add('da', 'steht')); return; }
  const H = innerHeight; let n = 0;
  alle.forEach(x => { const b = x.getBoundingClientRect(); if (b.top < H && b.bottom > 0 && n < 22) { x.style.setProperty('--i', Math.min(n++, 6)); requestAnimationFrame(() => requestAnimationFrame(() => x.classList.add('da'))); } else x.classList.add('da', 'steht'); });
}

/* ---------------------------------------------------------------- Übersicht */
function start() {
  const gruss = WO.gruss() === 'Guten Morgen.' ? t('morgen') : WO.gruss() === 'Guten Tag.' ? t('tag') : t('abend');
  const st = S.d.stand;
  const foto = k => (S.d.fotos.find(f => f.k === k) || {}).fs || '';
  // Robert 18.10.2026 22:09 (Ladezeiten): kleine Karten der Übersicht aus den Vorschaubildern (400 px, 17–64 kB statt 78–311 kB), sonst das grosse Bild
  const klein = k => esc(foto(k));
  const lg = (ic, mk, b, p, ziel) => `<div class="wo-lg"><i class="wo-lg__z">${WO.ic(ic)}</i><span class="wo-mk">${esc(mk)}</span><b>${b}</b><p>${esc(p)}</p><a class="wo-lk" href="#${ziel}" data-gehe="${ziel}">${esc(t('oeffnen'))}</a></div>`;
  const ag = (ziel, img, ic, name, satz, i, href) => `<${href ? `a href="${href}"` : `button type="button" data-gehe="${ziel}"`} class="wo-ag" data-r style="--i:${i}">
      <span class="wo-ag__b">${img}</span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(ic)}</i><b>${esc(name)}</b><span>${esc(satz)}</span></span></${href ? 'a' : 'button'}>`;
  return `${umbenannt(WO.startbild({ werkzeug: 'marke', art: 'voll', h1: `${esc(gruss)} <em>${esc(t('frage'))}</em>`, satz: esc(t('start_satz')),
      knoepfe: WO.knopf(esc(t('anleitung')), 'buch', 'gold', { href: 'anleitung.html', neu: true }) + WO.knopf(esc(t('buch')), 'pfeil', 'glas', { href: MARKE }) }))}
    <div class="wo-lage" data-r>
      ${lg('foto', t('bilder'), zahl(st.fotos), `${zahl(st.haus)} ${t('z_haus')} · ${zahl(st.frei)} ${t('z_frei')} · ${zahl(st.fremd)} ${t('z_fremd')}`, 'bilder')}
      ${lg('kopie', t('z_dateien'), zahl(st.dateien), t('k_dateien'), 'dateien')}
      ${lg('auge', t('pruefung'), 'ΔE 2000', t('k_pruefung'), 'pruefung')}
    </div>
    <h2 class="wo-zw">${esc(t('arbeiten'))}</h2>
    <div class="wo-aufg li-aufg">
      ${ag('bilder', `<span class="li-stapel"><img src="${klein('stube-gast')}" alt="" decoding="async"><img src="${klein('teller-muschel')}" alt="" decoding="async"><img src="${klein('nacht')}" alt="" decoding="async"></span>`, 'foto', t('bilder'), t('k_bilder'), 0)}
      ${ag('dateien', `<span class="li-logo li-tapete-d"><img src="${DAT}${S_}-lamm-gold.png" alt="" decoding="async"></span>`, 'kopie', t('dateien'), t('k_dateien'), 1)}
      ${ag('pruefung', `<span class="li-pr-bild"><span class="li-pr-f">${S.d.farben.filter(x => x.g !== 'druck').slice(0, 9).map(x => `<i style="background:${x.h}"></i>`).join('')}</span><span class="li-pr-de"><b>ΔE</b><small>2000</small></span></span>`, 'auge', t('pruefung'), t('k_pruefung'), 2)}
      ${ag('', `<img src="${klein('fassade')}" alt="" loading="lazy" decoding="async">`, 'buch', t('buch'), t('k_buch'), 3, MARKE)}
    </div>`;
}
function startLeben() { $$('#ansicht [data-gehe]').forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe); }); }

/* ---------------------------------------------------------------- Bildarchiv */
function titelVon(f) { return (f.t && (f.t[SP] || f.t.de)) || f.k; }
function gefiltert() {
  const F = S.f, q = F.q.trim().toLowerCase();
  return S.d.fotos.filter(f => (F.b === 'alle' || f.b === F.b) && (F.s === 'alle' || f.s === F.s) && (F.f === 'alle' || f.f === F.f || (F.f === 'quer' && f.f === 'quadrat'))
    && (F.h === 'alle' || f.art === F.h) && (!q || Object.values(f.t).join(' ').toLowerCase().includes(q) || f.k.includes(q) || String(t('b_' + f.b)).toLowerCase().includes(q)));
}
function wahl(key, werte) {
  return `<div class="li-wahl"><span class="mono">${esc(t(key === 'b' ? 'bereich' : key === 's' ? 'saison' : key === 'f' ? 'format' : 'herkunft'))}</span><div class="wahl2" role="group">
    ${[['alle', t('alle')], ...werte].map(([w, n]) => `<button type="button" data-f="${key}" data-w="${w}" aria-pressed="${S.f[key] === w}">${esc(n)}</button>`).join('')}</div></div>`;
}
function bilder() {
  return `${titel('bilder', teile(t('b_titel')), t('b_satz'), '', [[zahl(S.d.stand.fotos), t('bilder')], [zahl(S.d.stand.ue), t('ue_kurz')], [zahl(S.d.bereiche.length), t('bereiche')]])}
    <div class="platte li-filter" data-r>
      <label class="suche li-suche">${LUPE}<input type="search" id="li-q" value="${esc(S.f.q)}" placeholder="${esc(t('suchen'))}" autocomplete="off" maxlength="200"></label>
      ${wahl('b', S.d.bereiche.map(b => [b, t('b_' + b)]))}
      <div class="li-wahl-reihe">${wahl('s', [['sommer', t('s_sommer')], ['winter', t('s_winter')], ['jahr', t('s_jahr')]].filter(([w]) => S.d.fotos.some(f => f.s === w)))}${wahl('f', [['hoch', t('f_hoch')], ['quer', t('f_quer')]])}</div>
      ${wahl('h', [['haus', t('h_haus')], ['frei', t('h_frei')], ['ki', t('h_ki')], ['fremd', t('h_fremd')]].filter(([w]) => S.d.fotos.some(f => f.art === w)))}
      <p class="li-treffer"><span id="li-n"></span><button class="link" type="button" id="li-reset">${esc(t('zuruecksetzen'))}</button></p>
    </div>
    <div class="li-raster" id="li-raster"></div>
    <div class="li-mehr" id="li-mehr"></div>`;
}
function kachel(f, i) {
  return `<button class="li-f li-f--${f.f}" type="button" data-k="${esc(f.k)}" data-r style="--i:${i % 6}" aria-label="${esc(titelVon(f))}">
    <img src="${esc(f.fs)}" alt="" loading="lazy" decoding="async" draggable="false">
    ${f.art === 'ki' ? `<span class="li-ki" title="${esc(t('ki_lang'))}">${esc(t('ki'))}</span>` : f.art === 'fremd' ? `<span class="li-ki li-ki--fremd" title="${esc(t('fremd_lang'))}">${esc(t('fremd'))}</span>` : ''}
    <span class="li-f__n">${esc(titelVon(f))}</span></button>`;
}
function raster(neu = false, mehr = false) {
  const L = gefiltert();
  if (neu) S.n = 48;
  $('#li-n').textContent = t('treffer', zahl(L.length), zahl(S.d.fotos.length));
  const r = $('#li-raster');
  const vor = mehr && !r.querySelector('.li-leer') ? r.children.length : 0;
  if (vor) r.insertAdjacentHTML('beforeend', L.slice(vor, S.n).map((f, i) => kachel(f, vor + i)).join(''));
  else r.innerHTML = L.length ? L.slice(0, S.n).map(kachel).join('') : `<p class="li-leer">${esc(t('keine'))}</p>`;
  $('#li-mehr').innerHTML = L.length > S.n ? `<button class="kn kn--linie" type="button" id="li-mehr-k">${esc(t('mehr'))}<i>${PU}</i></button>` : '';
  if ($('#li-mehr-k')) $('#li-mehr-k').onclick = () => { S.n += 48; raster(false, true); };
  [].slice.call(r.children, vor).forEach(b => { if (b.dataset.k) b.onclick = () => detail(b.dataset.k); });
  auftritte(r);
  if (S.mehrIO) S.mehrIO.disconnect();
  if ($('#li-mehr-k') && 'IntersectionObserver' in window) { S.mehrIO = new IntersectionObserver(es => { if (es[0].isIntersecting) { S.n += 48; raster(false, true); } }, { rootMargin: '600px' }); S.mehrIO.observe($('#li-mehr-k')); }
}
function bilderLeben() {
  raster(true);
  let uhr;
  $('#li-q').oninput = e => { clearTimeout(uhr); uhr = setTimeout(() => { S.f.q = e.target.value; raster(true); }, 160); };
  $$('[data-f]').forEach(b => b.onclick = () => {
    S.f[b.dataset.f] = b.dataset.w;
    $$(`[data-f="${b.dataset.f}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    raster(true);
  });
  $('#li-reset').onclick = () => { S.f = { q: '', b: 'alle', s: 'alle', f: 'alle', h: 'alle' }; zeichne(true); };
}

/* Detail: grosses Bild, Herkunft, Grössen, Ausschnitt für Beitrag und Story, bei nachgeschärften Fotos Vorher/Nachher (L09) */
function detail(k) {
  const f = S.d.fotos.find(x => x.k === k); if (!f) return;
  const fx = { instagram: { x: .5, y: .5 }, story: { x: .5, y: .5 } };
  let aktiv = 'instagram';
  const imp = g => `${IMPRIMERIE}?haus=schaefli&foto=${encodeURIComponent(k)}&art=${g === 'story' ? 'story' : 'insta'}&x=${fx[g].x.toFixed(3)}&y=${fx[g].y.toFixed(3)}`;
  const link = g => S.server ? `api/bild?k=${encodeURIComponent(k)}&f=${g}${fx[g] ? `&x=${fx[g].x.toFixed(3)}&y=${fx[g].y.toFixed(3)}` : ''}` : f.fl;
  const nurWeb = S.nurWeb === true || (S.nurWeb && S.nurWeb.has(k));
  const zeile = g => `<li class="li-gr" data-g="${g}"><span><b>${esc(t('g_' + g))}</b><small>${esc(g === 'druck' ? (nurWeb ? t('i_druck_web') : t('i_druck', zahl(f.w), zahl(f.h))) : t('i_' + g))}</small></span>
    <a class="kn kn--klein" href="${esc(link(g))}" download data-laden="${g}">${esc(t('laden'))}<i>${PU}</i></a></li>`;
  const art = f.art === 'ki' ? `<p class="li-hinweis li-hinweis--ki"><b>${esc(t('ki_lang'))}</b>${esc(t('ki_satz'))}</p>` : f.art === 'fremd' ? `<p class="li-hinweis li-hinweis--ki"><b>${esc(t('fremd_lang'))}</b>${esc(t('fremd_satz'))}</p>${f.ue ? `<p class="li-hinweis li-hinweis--leise">${esc(t('ue_satz'))}${f.vn ? ' ' + esc(t('vn_hilfe')) : ''}</p>` : ''}` : f.alt ? `<p class="li-hinweis">${esc(t('archiv'))}</p>` : f.art === 'frei' ? `<p class="li-hinweis">${esc(t('frei_satz'))}</p>` : f.ue ? `<p class="li-hinweis li-hinweis--leise">${esc(t('ue_satz'))}${f.vn ? ' ' + esc(t('vn_hilfe')) : ''}</p>` : '';
  const vn = f.vn ? `<img class="li-vn__v" src="${ORIG}${esc(okey(k))}.webp" alt="" decoding="async" draggable="false"><span class="li-vn__gr"><i><svg viewBox="0 0 20 12" width="20" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 1 1 6l5 5M14 1l5 5-5 5"/></svg></i></span><span class="li-vn__t" id="li-vnt">${esc(t(f.art === 'ki' ? 'vn_t_nachher_ki' : 'vn_t_nachher'))}</span>
      <div class="li-vn__bar" role="group" aria-label="${esc(t('vn_vorher') + ' / ' + t('vn_nachher'))}"><button type="button" data-vn="vorher" aria-pressed="false">${esc(t('vn_vorher'))}</button><button type="button" data-vn="nachher" aria-pressed="true">${esc(t('vn_nachher'))}</button><button type="button" data-vn="schieber" aria-pressed="false">${esc(t('vn_schieber'))}</button></div>` : '';
  fenster(`<div class="li-det">
    <div class="li-det__b"><div class="li-det__bild" id="li-bild" data-m="nachher"${f.art === 'ki' ? ' data-ki="1"' : ''} tabindex="-1"><img src="${esc(f.fl)}" alt="${esc(titelVon(f))}" decoding="async" draggable="false"><span class="li-rahmen" id="li-rahmen" hidden></span>${vn}</div>
      <p class="leise li-det__hilfe">${esc(t('ausschnitt'))}</p></div>
    <div class="li-det__t">
      <p class="mono">${esc(t('b_' + f.b))} · ${esc(t('s_' + f.s))} · ${esc(t('f_' + f.f))}</p>
      <h2>${esc(titelVon(f))}</h2>
      ${art}
      <dl class="li-meta"><dt>${esc(t('quelle'))}</dt><dd>${esc(f.q)}${f.u ? ` <a class="link" href="${esc(f.u)}" target="_blank" rel="noopener noreferrer">${esc(t('quelle_link'))}</a>` : ''}</dd><dt>${esc(t('original'))}</dt><dd>${zahl(f.w)} × ${zahl(f.h)} px</dd></dl>
      <p class="mono li-det__gr">${esc(t('grossen'))}</p>
      <ul class="li-grl">${['instagram', 'story', 'web', 'druck'].map(zeile).join('')}</ul>
      ${f.vn ? `<p class="li-orig"><a class="kn kn--klein kn--linie" href="${ORIG}${esc(okey(k))}.webp" download="${S_}-${esc(okey(k))}-vorher.webp">${esc(t('vn_orig'))}<i>${PU}</i></a></p>` : ''}
      ${S.server ? '' : `<p class="leise">${esc(t('ohne_server'))}</p>`}
      <div class="li-imp"><p class="mono li-det__gr">${esc(t('im_titel'))}</p>
        <div class="li-imp__k"><a class="kn kn--klein" data-imp="instagram" href="${esc(imp('instagram'))}" target="_blank" rel="noopener">${esc(t('im_beitrag'))}<i>${PF}</i></a><a class="kn kn--klein kn--linie" data-imp="story" href="${esc(imp('story'))}" target="_blank" rel="noopener">${esc(t('im_story'))}<i>${PF}</i></a></div>
        <p class="leise">${esc(t('im_satz'))}</p></div>
    </div></div>`);
  const bildEl = $('#li-bild'), rahmen = $('#li-rahmen'), img = $('img', bildEl);
  function setze() {
    const g = FORMATE[aktiv];
    if (!img.naturalWidth || !document.body.contains(bildEl)) { rahmen.hidden = true; return; }
    const W = bildEl.clientWidth, H = bildEl.clientHeight, ziel = g ? g[0] / g[1] : W / H;
    let w = W, h = H;
    if (W / H > ziel) w = H * ziel; else h = W / ziel;
    const p = fx[aktiv] || { x: .5, y: .5 };
    rahmen.classList.toggle('li-rahmen--ganz', !g);
    rahmen.style.transform = `translate(${(W - w) * p.x}px,${(H - h) * p.y}px)`;
    const sk = Math.min(1, 2000 / Math.max(f.w, f.h)), masse = g ? `${g[0]} × ${g[1]}` : aktiv === 'web' ? `${Math.round(f.w * sk)} × ${Math.round(f.h * sk)}` : `${zahl(f.w)} × ${zahl(f.h)}`;
    if (w > W - 6 && h > H - 6) { w -= 12; h -= 12; rahmen.style.transform = 'translate(6px,6px)'; }
    rahmen.style.width = w + 'px'; rahmen.style.height = h + 'px';
    rahmen.dataset.g = t('g_' + aktiv) + ' · ' + masse + ' px';
    rahmen.classList.remove('blitz'); void rahmen.offsetWidth; rahmen.classList.add('blitz');
    rahmen.hidden = false;
    $$('[data-laden]').forEach(a => a.href = link(a.dataset.laden));
    $$('[data-imp]').forEach(a => a.href = imp(a.dataset.imp));
  }
  img.complete ? setze() : img.addEventListener('load', setze);
  $$('.li-gr').forEach(li => {
    const an = () => { aktiv = li.dataset.g; $$('.li-gr').forEach(x => x.classList.toggle('an', x === li)); setze(); };
    li.addEventListener('mouseenter', an); li.addEventListener('focusin', an); li.addEventListener('touchstart', an, { passive: true });
  });
  $('.li-gr').classList.add('an');
  let zug = null;   // Rahmen ziehen (F32: kein Bild-Ziehen, preventDefault im pointerdown)
  rahmen.addEventListener('pointerdown', e => { e.preventDefault(); zug = { x: e.clientX, y: e.clientY, p: { ...(fx[aktiv] || { x: .5, y: .5 }) } }; rahmen.setPointerCapture(e.pointerId); rahmen.classList.add('zieht'); });
  rahmen.addEventListener('pointermove', e => {
    if (!zug || !fx[aktiv]) return;
    const W = bildEl.clientWidth, H = bildEl.clientHeight, w = rahmen.offsetWidth, h = rahmen.offsetHeight;
    fx[aktiv] = { x: W - w > 1 ? Math.min(1, Math.max(0, zug.p.x + (e.clientX - zug.x) / (W - w))) : .5, y: H - h > 1 ? Math.min(1, Math.max(0, zug.p.y + (e.clientY - zug.y) / (H - h))) : .5 };
    setze();
  });
  const los = () => { zug = null; rahmen.classList.remove('zieht'); };
  rahmen.addEventListener('pointerup', los); rahmen.addEventListener('pointercancel', los);
  bildEl.addEventListener('dragstart', e => e.preventDefault());
  addEventListener('resize', setze);
  S.fensterZu = () => removeEventListener('resize', setze);
  if (f.vn) vorherNachher(bildEl, setze);
}
/* Vorher / Nachher: Knöpfe unten im Bild, Schieber zieht eine Kante über das Bild (folgt Maus und Finger, auch in Firefox, F32) */
function vorherNachher(v, setze) {
  function modus(m) {
    v.setAttribute('data-m', m); $('#li-vnt').textContent = t('vn_t_' + m + (v.dataset.ki && m !== 'schieber' ? '_ki' : ''));
    $$('[data-vn]', v).forEach(b => b.setAttribute('aria-pressed', b.dataset.vn === m ? 'true' : 'false'));
    if (m === 'schieber') v.style.setProperty('--p', '50%');
    if (m === 'nachher') setze();
  }
  $$('[data-vn]', v).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); modus(b.dataset.vn); }));
  let zieht = false;
  const hin = e => { const r = v.getBoundingClientRect(); v.style.setProperty('--p', Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)).toFixed(1) + '%'); };
  v.addEventListener('pointerdown', e => { if (v.dataset.m !== 'schieber' || e.target.closest('.li-vn__bar')) return; e.preventDefault(); zieht = true; v.setPointerCapture(e.pointerId); hin(e); });
  v.addEventListener('pointermove', e => { if (zieht) hin(e); });
  v.addEventListener('pointerup', () => { zieht = false; });
  v.addEventListener('pointercancel', () => { zieht = false; });
  v.addEventListener('keydown', e => { if (e.key === 'v' || e.key === 'V') modus(v.dataset.m === 'vorher' ? 'nachher' : 'vorher'); });
}

/* ---------------------------------------------------------------- Dateien */
function dateien() {
  const D = Object.fromEntries(S.d.dateien.map(x => [x.k, x]));
  const gr = n => { const b = S.d.groessen[n]; return b ? (b > 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB') : ''; };
  const knoepfe = liste => liste.filter(n => !n.endsWith('.webp') || liste.length === 1).map(n => `<a class="kn kn--klein ${/\.(png|json|ase|css)$/.test(n) ? 'kn--linie' : ''}" href="${DAT}${esc(n)}" download title="${esc(n)} · ${gr(n)}">${esc(n.split('.').pop().toUpperCase())}<i>${PU}</i></a>`).join('');
  const block = (k, titel, satz, inhalt, i) => `<section class="li-d" id="d-${k}" data-r style="--i:${i % 2}"><header><h2 class="li-d__t">${zwei(titel)}</h2><p class="leise">${esc(satz)}</p></header>${inhalt}</section>`;
  const vname = (g, v) => g === 'ehre' ? `${v.titel} · ${v.wert}` : g === 'tapete' && v.k === 'dunkel' ? t('v_t_dunkel') : t('v_' + v.k);
  const tafeln = (g, breit) => `<div class="li-tafeln ${breit ? 'li-tafeln--breit' : ''}">${D[g].var.map(v => `<figure class="li-tafel li-tafel--${v.grund}">
      <div class="li-tafel__f"><img src="${DAT}${esc(v.dateien.find(x => x.endsWith('.svg')) || v.dateien[0])}" alt="" loading="lazy" decoding="async"></div>
      <figcaption><span><b>${esc(vname(g, v))}</b><small>${v.px ? zahl(v.px[0]) + ' × ' + zahl(v.px[1]) + ' px' : ''}</small></span><span class="li-kn">${knoepfe(v.dateien)}</span></figcaption></figure>`).join('')}</div>`;
  const gruppen = S.d.gruppen.map(g => {
    const fs = S.d.farben.filter(f => f.g === g.k); if (!fs.length) return '';
    return `<div class="li-fg${g.k === 'druck' ? ' li-fg--druck' : ''}${g.bild ? ' li-fg--bild' : ''}">${g.bild ? `<figure class="li-fg__b${/^listen\//.test(g.bild) ? ' li-fg__b--text' : ''}"><img src="${esc(g.bild)}" alt="" loading="lazy" decoding="async"><figcaption>${esc(g.bild_t || '')}</figcaption></figure>` : ''}<div class="li-fg__t"><h3>${esc(g.n)}</h3><p class="leise">${esc(g.s)}</p><div class="li-farben">${fs.map((f, i) => `<button class="li-farbe" type="button" data-kopie="${f.h}" style="--c:${f.h};--i:${i % 6}">
      <span class="li-farbe__f"><span class="li-farbe__ok">${esc(t('kopiert'))}</span></span>
      <span class="li-farbe__n"><b>${esc(f.n)}</b><small>${esc(f.r)}</small></span>
      <span class="li-farbe__w"><span data-kopie-w="${f.h}">${f.h}</span><span data-kopie-w="rgb(${f.rgb.join(', ')})">RGB ${f.rgb.join(' · ')}</span></span></button>`).join('')}</div></div></div>`;
  }).join('');
  const schriften = S.d.schriften.map(s => `<li class="li-schrift">${s.bild ? `<span class="li-schrift__b"><img src="${esc(s.bild)}" alt="${esc(s.n)} auf der Website" loading="lazy" decoding="async"></span>` : ''}<span class="li-schrift__p f-${esc(s.k)}">${esc(s.p)}</span><span><b>${esc(s.n)}</b><small>${esc(s.r)} · ${esc(s.e)}</small></span>
      <a class="kn kn--klein kn--linie" href="../../assets/schrift/${esc(s.d)}" download>${esc(s.d.split('.').pop().toUpperCase())}<i>${PU}</i></a></li>`).join('');
  const n_dat = S.d.dateien.filter(g => ['logo', 'zeichen', 'zeiger', 'name', 'website', 'tapete', 'ehre'].includes(g.k)).reduce((n, g) => n + g.var.length, 0);
  return `${titel('dateien', teile(t('d_titel')), t('d_satz'), `<a class="kn kn--gold" href="${DAT}${S_}-marke.zip" download>${esc(t('alles_zip'))}<i>${PU}</i></a><a class="kn kn--linie kn--hell" href="${MARKE}#zeichen">${esc(t('regeln'))}<i>${PF}</i></a>`, [[zahl(S.d.stand.dateien), t('z_dateien')], ['SVG · PNG', t('formate')]])}
    ${block('zeichen', t('d_zeichen'), t('d_zeichen_s'), tafeln('zeichen'), 0)}
    ${block('zeiger', t('d_zeiger'), t('d_zeiger_s'), tafeln('zeiger'), 1)}
    ${block('logo', t('d_logo'), t('d_logo_s'), tafeln('logo'), 0)}
    ${block('name', t('d_name'), t('d_name_s'), tafeln('name', true), 1)}
    ${block('tapete', t('d_tapete'), t('d_tapete_s'), `<div class="li-tafeln">${D.tapete.var.map(v => `<figure class="li-tafel li-tafel--${v.grund}"><div class="li-tafel__f li-tapete" style="background-image:url(${DAT}${esc(v.dateien.find(x => x.endsWith('.webp')))})"></div>
      <figcaption><span><b>${esc(vname('tapete', v))}</b><small>${v.px[0]} × ${v.px[1]} px</small></span><span class="li-kn">${knoepfe(v.dateien.filter(x => !x.endsWith('.webp')))}</span></figcaption></figure>`).join('')}</div>`, 1)}
    ${block('farben', t('d_farben'), t('d_farben_s'), `${gruppen}<div class="li-kn li-kn--mitte">${knoepfe(D.farben.var[0].dateien)}</div>`, 0)}
    ${block('schriften', t('d_schriften'), t('d_schriften_s'), `<ul class="li-schriften">${schriften}</ul><div class="li-kn li-kn--mitte">${knoepfe(D.schriften.var[0].dateien)}</div>`, 1)}
    ${block('ehre', t('d_ehre'), t('d_ehre_s'), tafeln('ehre'), 0)}
    ${block('website', t('d_website'), t('d_website_s'), tafeln('website'), 1)}`;
}
function zwei(s) { const i = s.lastIndexOf(' '); return i > 0 ? `${esc(s.slice(0, i))} <em>${esc(s.slice(i + 1))}</em>` : esc(s); }
function kopiere(w, el) {
  const ok = () => { if (el) { el.classList.add('kopiert'); setTimeout(() => el.classList.remove('kopiert'), 1400); } melde(t('kopiert') + ' · ' + w); };
  if (navigator.clipboard && isSecureContext) navigator.clipboard.writeText(w).then(ok, () => alt());
  else alt();
  function alt() { const x = document.createElement('textarea'); x.value = w; x.setAttribute('readonly', ''); x.style.position = 'fixed'; x.style.opacity = '0'; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* nichts */ } x.remove(); }
}
function dateienLeben() {
  $$('[data-kopie]').forEach(b => b.onclick = e => { const w = e.target.closest('[data-kopie-w]'); kopiere(w ? w.dataset.kopieW : b.dataset.kopie, b); });
}

/* ---------------------------------------------------------------- Markenprüfung */
function pruefung() {
  return `${titel('pruefung', teile(t('p_titel')), t('p_satz'), '', [['ΔE 2000', t('p_farben')], ['Claude', t('ber').bild + ' · ' + t('ber').ton]])}<div id="li-pr"></div><div id="li-bsp-erg"></div>`;
}
function pruefungLeben() { S.ergebnis ? ergebnis(S.ergebnis) : feld(); if (!S.ergebnis && /[?&]beispiel=1/.test(location.search)) beispielPruefung(); }
/* Beispiel: ein eigens gezeichneter Entwurf (beispiel/entwurf.png), geprüft mit der Prüfung selbst (ohne Claude), Antwort unverändert, als Beispiel beschriftet */
async function beispielPruefung() {
  try {
    const r = await fetch('beispiel/pruefung.json', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
    const j = await r.json(); j.beispiel = true;
    S.ergebnis = j; if (S.ansicht === 'pruefung') ergebnis(j);
  } catch (e) { melde(t('p_fehler'), true); }
}
function feld() {
  const d = S.datei;
  $('#li-pr').innerHTML = `<div class="platte li-feld" id="li-feld" data-r>
      <input type="file" id="li-datei" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
      <div class="li-feld__in">
        ${d ? `<div class="li-feld__vor">${d.bild ? `<img src="${d.bild}" alt="">` : `<span class="li-pdf">PDF</span>`}</div><p class="li-feld__name"><b>${esc(d.name)}</b><small>${(d.groesse / 1e6).toFixed(1).replace('.', ',')} MB</small></p>`
          : `<span class="li-feld__z">${ZEICHEN_N}</span><p class="li-feld__t">${esc(t('p_feld'))}</p><p class="leise">${esc(t('p_feld2'))}</p>`}
        <div class="li-feld__kn"><button class="kn ${d ? 'kn--linie' : ''}" type="button" id="li-waehle">${esc(t('p_waehlen'))}<i>${PO}</i></button>${d ? `<button class="kn kn--gold" type="button" id="li-los">${esc(t('p_pruefen'))}<i>${PF}</i></button>` : ''}</div>
        ${d ? '' : `<p class="li-bsp"><button class="link" type="button" id="li-bsp">${esc(t('p_beispiel'))}</button></p>`}
      </div>
      <p class="li-privat">${esc(t('p_privat'))}</p>
    </div>`;
  const inp = $('#li-datei'), fl = $('#li-feld');
  $('#li-waehle').onclick = () => inp.click();
  inp.onchange = () => inp.files[0] && nimm(inp.files[0]);
  ['dragenter', 'dragover'].forEach(n => fl.addEventListener(n, e => { e.preventDefault(); fl.classList.add('ueber'); }));
  ['dragleave', 'drop'].forEach(n => fl.addEventListener(n, e => { e.preventDefault(); fl.classList.remove('ueber'); }));
  fl.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) nimm(f); });
  if ($('#li-los')) $('#li-los').onclick = pruefe;
  if ($('#li-bsp')) $('#li-bsp').onclick = () => { const u = $('#li-bsp-erg'); if (u && u.firstChild) u.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'start' }); else beispielPruefung(); };
  auftritte($('#li-pr'), true);
  beispielUnten(!d);
}
/* R20: unter dem leeren Feld steht immer eine fertige Beispiel-Prüfung, deutlich als Beispiel beschriftet */
async function beispielUnten(an) {
  const u = $('#li-bsp-erg'); if (!u) return;
  if (!an) { u.innerHTML = ''; return; }
  try {
    if (!S.bspJ) { const r = await fetch('beispiel/pruefung.json'); if (!r.ok) throw new Error(r.status); S.bspJ = await r.json(); S.bspJ.beispiel = true; }
    if (S.datei || S.ergebnis || S.ansicht !== 'pruefung' || !$('#li-bsp-erg')) return;
    $('#li-bsp-erg').innerHTML = '<div class="li-bsp-unten"></div>'; ergebnis(S.bspJ, $('#li-bsp-erg .li-bsp-unten'));
  } catch (e) { /* ohne Beispiel bleibt das Feld */ }
}
function nimm(f) {
  if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type)) { melde(t('p_typ'), true); return; }
  if (f.size > 30 * 1024 * 1024) { melde(t('p_gross'), true); return; }
  if (f.type === 'application/pdf' && f.size > PDF_ONLINE && !LOKAL) { melde(t('p_pdf_online'), true); return; }
  const r = new FileReader();
  r.onload = () => { S.datei = { name: f.name, typ: f.type, groesse: f.size, daten: r.result, bild: f.type === 'application/pdf' ? '' : r.result }; feld(); };
  r.readAsDataURL(f);
}
/* L10: grosse Bilder vor dem Senden auf 2400 px verkleinern (online nimmt eine Funktion höchstens 4,5 MB). PDFs gehen unverändert. */
const PDF_ONLINE = 3 * 1024 * 1024, LOKAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
function verkleinert(d) {
  return new Promise(ok => {
    if (!/^image\//.test(d.typ)) return ok(d.daten);
    const i = new Image();
    i.onload = () => {
      const m = Math.max(i.naturalWidth, i.naturalHeight), f = Math.min(1, 2400 / m);
      if (f === 1 && d.groesse < 2.5 * 1024 * 1024) return ok(d.daten);
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.naturalWidth * f)); c.height = Math.max(1, Math.round(i.naturalHeight * f));
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height);
      try { ok(c.toDataURL('image/jpeg', .92)); } catch (e) { ok(d.daten); }
    };
    i.onerror = () => ok(d.daten);
    i.src = d.daten;
  });
}
async function pruefe() {
  const d = S.datei; if (!d) return;
  const schritte = [t('p_schritt1'), t('p_schritt2'), t('p_schritt3')];
  $('#li-pr').innerHTML = `<div class="platte li-lauf" data-r><div class="li-lauf__b">${d.bild ? `<img src="${d.bild}" alt="">` : `<span class="li-pdf">PDF</span>`}<span class="li-scan"></span></div>
    <div><ol class="li-schritte">${schritte.map((s, i) => `<li data-i="${i}"><i></i><span>${esc(s)}</span></li>`).join('')}</ol><p class="leise">${esc(t('p_dauer'))}</p></div></div>`;
  auftritte($('#li-pr'), true);
  const li = $$('.li-schritte li');
  let n = 0; li[0].classList.add('an');
  const uhr = setInterval(() => { if (n < 2) { li[n].classList.replace('an', 'fertig'); n++; li[n].classList.add('an'); } }, 1600);
  try {
    const daten = await verkleinert(d);
    const r = await fetch('api/pruefen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: d.name, typ: daten === d.daten ? d.typ : 'image/jpeg', daten, sprache: SP === 'pr' ? 'de' : SP }) });
    let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
    if (!r.ok) throw new Error(String(j.fehler || r.status).replace(/^[A-ZÄÖÜ-]+ · /, ''));
    clearInterval(uhr); li.forEach(x => { x.classList.remove('an'); x.classList.add('fertig'); });
    S.ergebnis = j;
    setTimeout(() => ergebnis(j), 380);
  } catch (e) {
    clearInterval(uhr);
    melde(t('p_fehler') + ': ' + (/Failed to fetch|NetworkError|Load failed/.test(e.message) ? (navigator.onLine === false ? t('p_offline') : t('fehler_verb')) : /^\d+$/.test(e.message) ? t('fehler_code', e.message) : e.message), true);
    feld();
  }
}
function ergebnis(j, ziel) {
  const Z = ziel || $('#li-pr');
  const m = j.messung, k = j.ki || {};
  const pr = x => Math.round(x * 100);
  /* Oberchef L04 (18.10.2026): ein Farbband mit den Anteilen, ein Satz zum Anteil der Hausfarben, darunter ein ruhiges Raster (Feld, Anteil, Hex, nächste Hausfarbe, Urteil) */
  const URT = { gleich: 'Passt', nah: 'Nah', fremd: 'Fremd' };
  const band = `<p class="li-fband" aria-hidden="true">${m.toene.map(x => `<i style="flex:${Math.max(.004, x.anteil)};background:${x.hex}" title="${x.hex.toUpperCase()} · ${x.anteil < .01 ? '&lt;1' : pr(x.anteil)} %"></i>`).join('')}</p>`;
  /* Ruedihus 18.10.2026 (übernommen): die acht grössten Töne einzeln, der Rest in einer Zeile, damit die Spalte nicht höher wird als die Punkte daneben */
  const HAUPT = m.toene.slice(0, 8), REST = m.toene.slice(8), rmax = Math.max(0, ...REST.map(x => x.anteil));
  const rest = REST.length ? `<tr class="li-ft--rest"><td><i class="li-ft__f" style="background:linear-gradient(135deg,${REST.slice(0, 4).map((x, i) => `${x.hex} ${i * 25}% ${(i + 1) * 25}%`).join(',')})"></i></td><td class="li-ft__a">${pr(REST.reduce((a, x) => a + x.anteil, 0))} %</td><td class="li-ft__n" colspan="3">${REST.length} weitere Töne, je ${rmax < .01 ? 'unter 1' : 'höchstens ' + pr(rmax)} %</td></tr>` : '';
  const toene = `<table class="li-ft"><thead><tr><th><span class="vh">Feld</span></th><th>Anteil</th><th>Hex</th><th>${esc(t('p_naechste'))}</th><th></th></tr></thead><tbody>${HAUPT.map(x => `<tr class="li-ft--${x.urteil}">
      <td><i class="li-ft__f" style="background:${x.hex}"></i></td><td class="li-ft__a">${x.anteil < .01 ? '&lt;1' : pr(x.anteil)} %</td><td class="li-ft__h">${x.hex.toUpperCase()}</td>
      <td class="li-ft__n"><i style="background:${esc(x.palette)}"></i>${esc(x.name)}</td><td class="li-ft__u" title="ΔE ${String(x.de).replace('.', ',')}">${URT[x.urteil] || esc(t('p_' + x.urteil))}</td></tr>`).join('')}${rest}</tbody></table>`;
  const sonder = [m.schwarz > .01 ? t('p_schwarz', pr(m.schwarz)) : ''].filter(Boolean);
  const reihe = { passt_nicht: 0, achten: 1, passt: 2 };
  const punkte = (k.punkte || []).slice().sort((a, b) => (reihe[a.urteil] ?? 1) - (reihe[b.urteil] ?? 1)).map((p, i) => `<li class="li-pk li-pk--${esc(p.urteil)}" data-r style="--i:${i}">
      <span class="li-pk__m"><em>${esc(t('u_' + p.urteil) || p.urteil)}</em><small>${esc((t('ber')[p.bereich]) || p.bereich)}</small></span>
      <span class="li-pk__t"><b>${esc(p.titel)}</b><span>${esc(p.text)}</span></span></li>`).join('');
  const ton = (k.ton || []).filter(x => x.stelle && x.vorschlag).map(x => `<li><s>${esc(x.stelle)}</s><span>${esc(x.vorschlag)}</span></li>`).join('');
  if (!ziel) { const u = $('#li-bsp-erg'); if (u) u.innerHTML = ''; }
  Z.innerHTML = `<div class="li-erg">
    <aside class="li-erg__l">
      <figure class="platte li-erg__bild" data-r><img src="${j.vorschau}" alt="${esc(j.name)}"><figcaption><b>${esc(j.name)}</b>${j.seiten > 1 ? `<small>${esc(t('p_seiten', j.seiten, Math.min(j.seiten, 3)))}</small>` : ''}</figcaption></figure>
      <section class="platte li-erg__farben" data-r><h3>${esc(t('p_farben'))}</h3><p class="leise">${esc(t('p_farben_s'))}</p>
        ${band}<p class="li-rahmen-s">${esc(t('p_rahmen', pr(m.im_rahmen)))}.</p>
        ${toene}${sonder.length ? `<ul class="li-sonder">${sonder.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}</section>
    </aside>
    <div class="li-erg__r">
      ${j.beispiel ? `<p class="platte li-hinweis li-hinweis--bsp" data-r><b>Beispiel</b>${esc(t('p_beispiel_h'))}</p>` : ''}
      ${j.probe && !j.beispiel ? `<p class="platte li-hinweis li-hinweis--probe" data-r><b>Probe</b>${esc(t('p_probe'))}</p>` : ''}
      ${j.ki_fehler ? `<p class="platte li-hinweis li-hinweis--ki" data-r>${esc(t('p_ki_fehler', String(j.ki_fehler).replace(/^[A-ZÄÖÜ-]+ · /, '')))}</p>` : `
      <section class="platte li-gesamt" data-r><p class="mono">${esc(t('p_gesamt'))}${k.art ? ' · ' + esc(k.art) : ''}</p><p class="li-gesamt__s">${esc(k.gesamt || '')}</p></section>
      <h3 class="li-erg__h">${esc(t('p_punkte'))}</h3><ol class="li-punkte">${punkte}</ol>
      ${ton ? `<section class="platte li-tonvor" data-r><h3>${esc(t('p_ton'))}</h3><ul>${ton}</ul></section>` : ''}
      ${k.text ? `<details class="li-gelesen"><summary class="mono">${esc(t('p_text'))}</summary><p>${esc(k.text)}</p></details>` : ''}`}
      <div class="li-erg__kn"><button class="kn" type="button" data-neu>${esc(t('p_neu'))}<i>${PO}</i></button><button class="kn kn--linie" type="button" data-kopie-erg>${esc(t('p_kopie'))}<i>${KOPIE}</i></button><button class="kn kn--linie" type="button" data-sichern>${esc(t('p_sichern'))}<i>${PU}</i></button></div>
    </div></div>`;
  auftritte(Z);
  const kn = x => Z.querySelector(x);
  kn('[data-neu]').onclick = () => { S.ergebnis = null; S.datei = null; feld(); scrollTo({ top: 0, behavior: RUHIG() ? 'auto' : 'smooth' }); };
  kn('[data-kopie-erg]').onclick = () => kopiere(alsText(j));
  kn('[data-sichern]').onclick = () => sichere(j);
}
function alsText(j) {
  const m = j.messung, k = j.ki || {};
  const z = [`${t('name')} · ${t('pruefung')} · ${j.name}`, ''];
  if (j.beispiel) z.push(t('p_beispiel_h'), '');
  if (j.probe) z.push(t('p_probe'), '');
  if (k.gesamt) z.push(k.gesamt, '');
  (k.punkte || []).forEach(p => z.push(`· ${(t('ber')[p.bereich]) || p.bereich} – ${t('u_' + p.urteil) || p.urteil}: ${p.titel}. ${p.text}`));
  z.push('', t('p_farben') + ':');
  m.toene.forEach(x => z.push(`  ${x.hex.toUpperCase()} ${Math.round(x.anteil * 100)} % → ${x.name} ${x.palette.toUpperCase()}, ΔE ${x.de} (${t('p_' + x.urteil)})`));
  (k.ton || []).forEach(x => z.push('', `«${x.stelle}» → «${x.vorschlag}»`));
  return z.join('\n');
}
function sichere(j) {
  // nur auf ausdrücklichen Wunsch: eine Datei auf diesem Rechner, nichts auf dem Server
  const html = `<!doctype html><meta charset="utf-8"><title>${esc(t('name'))} · ${esc(j.name)}</title><body style="font:15px/1.6 system-ui;max-width:820px;margin:40px auto;color:#2a292b;background:#f0eae1;padding:0 20px">
    <h1 style="font:460 28px/1.2 Petrona,Georgia,serif;color:#64362e">${esc(t('pruefung'))}: ${esc(j.name)}</h1><img src="${j.vorschau}" style="max-width:360px;border-radius:12px"><pre style="white-space:pre-wrap;font:14px/1.6 system-ui">${esc(alsText(j))}</pre>
    <p style="color:#815e32;font-size:12px">${esc(t('name'))} · Taverne zum Schäfli, Wigoltingen · ${new Date().toLocaleString('de-CH')}</p></body>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'markenpruefung-schaefli-' + (j.name.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9äöü_-]+/gi, '-').toLowerCase().slice(0, 60) || 'entwurf') + '.html';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------------------------------------------------------------- Fenster, Meldung */
let VORHER_FOKUS = null;
function fenster(html) {
  const f = $('#fenster');
  VORHER_FOKUS = document.activeElement;
  f.innerHTML = `<div class="fenster__k li-fk" role="dialog" aria-modal="true" aria-label="${esc(t('bilder'))}"><button class="rund fenster__zu" type="button" data-zu aria-label="${esc(t('schliessen'))}">${ZU}</button>${html}</div>`;
  f.hidden = false; document.body.classList.add('li-zu');
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  const zu = $('[data-zu]', f); if (zu) zu.focus({ preventScroll: true });
}
function fensterZu() {
  if (S.fensterZu) { S.fensterZu(); S.fensterZu = null; }
  $('#fenster').hidden = true; $('#fenster').innerHTML = ''; document.body.classList.remove('li-zu');
  if (VORHER_FOKUS && VORHER_FOKUS.focus) VORHER_FOKUS.focus({ preventScroll: true });
}
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu(); });
function melde(text, fehl = false) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(text)}</b></div><button type="button" aria-label="${esc(t('schliessen'))}">${ZU}</button>`;
  q.querySelector('button').onclick = () => q.remove();
  m.appendChild(q);
  setTimeout(() => q.remove(), fehl ? 9000 : 2600);
}

/* ---------------------------------------------------------------- Start */
/* Startfehler-Tür (R04): statt einer leeren Fläche sagt das Hausbuch, dass und warum es nicht startet */
function startfehler(grund) {
  window.LIVRE_BEREIT = true; clearTimeout(window.LIVRE_LADE);
  $('#ansicht').innerHTML = `<div class="platte li-tuer" role="alert"><span class="li-tuer__z">${ZEICHEN_N}</span><h1>${esc(t('tuer_t'))}</h1>
    <p class="li-tuer__g">${esc(grund)}</p><p>${esc(t('tuer_hilfe'))}</p>
    <div class="titel__kn"><button class="kn" type="button" data-neu>${esc(t('tuer_neu'))}<i>${PF}</i></button><a class="kn kn--linie" href="anleitung.html" target="_blank" rel="noopener">${esc(t('anleitung'))}<i>${PF}</i></a></div></div>`;
  const b = $('#ansicht [data-neu]'); if (b) b.onclick = () => location.reload();
}
/* Beigaben wie in den anderen Werkzeugen: «Zur Werkbank» (R19, nur aus der Werkbank geöffnet) und der kurze Rundgang (R18), Fassung wie livre.js (F08) */
function beigabe(src, daten) {
  const s = document.createElement('script'); s.src = src + '?v=' + ((($('script[src*="livre.js"]') || {}).src || '').split('v=')[1] || 1); s.defer = true;
  Object.entries(daten || {}).forEach(([k, v]) => s.setAttribute('data-' + k, v));
  document.body.appendChild(s);
}
/* Auftakt (R02): ruhig warten, bis Schriften und das Foto der ersten Bühne da sind, höchstens 2,5 s, dann alles auf einmal */
function bereit(ansicht) {
  const bild = new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = ansicht === 'start' ? ((window.WO_HAUS && WO_HAUS.foto) || 'hero-start.webp') : buehneVon(ansicht); if (i.decode) i.decode().then(r, r); });
  return Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, bild]), new Promise(r => setTimeout(r, 2500))]);
}
(async function () {
  document.documentElement.lang = SP === 'de' ? 'de-CH' : SP;
  try {
    const vorgeladen = $('link[rel="preload"][as="fetch"]');
    try {
      const r = await fetch(vorgeladen ? vorgeladen.getAttribute('href') : 'livre.json', vorgeladen ? {} : { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      S.d = await r.json();
      if (!S.d || !Array.isArray(S.d.fotos) || !S.d.stand || !Array.isArray(S.d.farben)) throw new Error('Form');
      NAMEN = Object.assign({}, S.d.namen || {}, (window.WO_HAUS && WO_HAUS.namen) || {});
      window.LIVRE_NAMEN = NAMEN;
      document.title = `${NAMEN.marke || 'Das Hausbuch'} · Taverne zum Schäfli`;
    } catch (e) { return startfehler(t('fehler_json') + ' (' + (/Failed to fetch|Load failed|NetworkError/.test(e.message) ? 'offline' : e.message) + ')'); }
    const h = location.hash.slice(1);
    try {
      const ausMaison = /\/maison\/?(index\.html)?([?#].*)?$/.test(document.referrer) && ((performance.getEntriesByType('navigation')[0] || {}).type !== 'reload');
      S.ansicht = ANSICHTEN.includes(h) ? h : ausMaison ? (localStorage.removeItem('sf-livre-ansicht'), 'start') : (ANSICHTEN.includes(localStorage.getItem('sf-livre-ansicht')) ? localStorage.getItem('sf-livre-ansicht') : 'start');
    } catch (e) { S.ansicht = 'start'; }
    await bereit(S.ansicht);
    clearTimeout(window.LIVRE_LADE);
    kopf(); rand(); leiste(); zeichne();
    document.body.classList.add('li-bereit'); window.LIVRE_BEREIT = true;
  } catch (e) { return startfehler(String(e && e.message || e).slice(0, 200)); }
  addEventListener('hashchange', () => { const a = location.hash.slice(1); if (ANSICHTEN.includes(a) && a !== S.ansicht) gehe(a); });
  fetch('api/stand', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(j => { S.server = true; S.nurWeb = new Set(j.ohne_original || []); }).catch(() => { S.server = false; });
  beigabe('zur-werkbank.js', { zw: '', neben: '#rand', ueber: '#leiste' });
  beigabe('rundgang.js', { werkzeug: 'livre' });
})();
