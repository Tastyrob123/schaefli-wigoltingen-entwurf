/* La Réception (Team hinter dem Gäste-Chat) · Taverne zum Schäfli, Wigoltingen (21.10.2026, Kopie aus dem Reservationsbuch des Schlössli). Ein Restaurant ohne Zimmer.
   Eingang: Anfragen aus den Formularen der Website (Tischkarte «Ihr Abend», Feier, Gutschein, Platz vormerken, Nachricht, Bewerbung) und aus dem Chat, mit Allergien
   und Hinweisen (geschlossen Sonntag bis Dienstag, Ferien, Gruppe, Festsaal, vegan, Hund) und einem Antwortentwurf im Ton des Hauses.
   Das wurde gefragt: jede Frage an den Chat, nach Themen; wo der Chat keine Antwort hatte, trägt das Team sie einmal nach, ab dann antwortet er damit.
   Server-Teil: _gast/rezeption.py über serve.py (/reception/api/…). Hier wird nichts verschickt. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const ZEICHEN = '<img src="zeichen-haus.svg" width="828" height="1051" alt="">';   // das Lamm aus dem Wirtshausschild (website/assets/zeichen/lamm.svg)
const STUBE = /\/_werkzeuge\//.test(location.pathname) ? '../maison/' : '/maison/';   // Die Stube: lokal _werkzeuge/maison/, online /maison/ (Falle Doldenhorn 17.10.2026)
const SYM = {
  buch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.2c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v9.6c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6z"/><path d="M8 3.8v9.6"/></svg>',
  haus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.2 8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z"/><path d="M6.5 13.5v-4h3v4"/></svg>',
  chat: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 13.5 4v5.5A1.5 1.5 0 0 1 12 11H7l-3 2.5V11a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
  korb: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  kopie: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1 1 0 0 0 10 2.5H3.5a1 1 0 0 0-1 1V10a1 1 0 0 0 1 1H5"/></svg>',
  post: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  haken: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  pruef: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13 3.8v3.7c0 3-2.1 5.4-5 6.7-2.9-1.3-5-3.7-5-6.7V3.8z"/><path d="m5.6 8 1.7 1.7 3.2-3.4"/></svg>' };
const ART = { tisch: 'Reservation', bankett: 'Feier', anlass: 'Anlass', gutschein: 'Gutschein', nachricht: 'Nachricht', stelle: 'Bewerbung' };
const SPRACHE = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', zh: 'Chinesisch', ko: 'Koreanisch', ar: 'Arabisch' };
/* Das Schäfli hat eine Adresse (kontakt@) für alles; im Eingang ordnet die Art der Arbeit: Reservationen, Feiern und Anlässe, Gutscheine, Bewerbungen */
const ABTEILUNGEN = [['Reservation', 'Tische im Restaurant und Tischkarten mit Wünschen, Nachrichten'], ['Feier', 'Feiern und Gruppen, im Restaurant bis 12, im Festsaal 12 bis 30, Plätze für Anlässe'], ['Gutschein', 'Gutscheine'], ['Bewerbung', 'Bewerbungen für Küche, Service und Bar']];
const FORMULAR = { abend: 'Ihr Abend (Tischkarte)', feier: 'Ihre Feier', gutschein: 'Gutschein', vormerken: 'Einen Platz vormerken', kontakt: 'Ihre Nachricht', bewerbung: 'Bewerbung', allgemein: 'Anfrage-Fenster' };
const abt = a => a.abteilung || ({ bankett: 'Feier', anlass: 'Feier', gutschein: 'Gutschein', stelle: 'Bewerbung' }[a.art] || 'Reservation');
const S0 = (() => { try { return sessionStorage.getItem('re-ws-abt') || 'alle'; } catch (e) { return 'alle'; } })();
const S = { ue: null, ansicht: 'start', anfragen: null, fragen: null, nachgetragen: null, wahl: '', filter: 'alle', abt: S0, schreibt: {}, bearbeiten: '', wissen: null, wissenDa: false, such: '', offen: {}, verlauf: {} };
const ART_LANG = { tisch: 'Reservation', bankett: 'Feiern & Gruppen', anlass: 'Anlässe & Events', gutschein: 'Gutscheine', nachricht: 'Nachrichten', stelle: 'Bewerbungen' };
/* Je Art ein Foto des Hauses (Robert 15.10.2026: lieber Fotos als Zeichen): Tisch vor dem Kachelofen, die lange Tafel, die Kitchen Party, Champagner, das Wirtshausschild, die Küche */
const ARTBILD = { tisch: 'stube-ofen-480', bankett: 'tafel-480', anlass: 'party-480', gutschein: 'champagner-480', nachricht: 'schild-480', stelle: 'team-kueche-480' };
/* Kein Foto zweimal untereinander in der Liste (Fehlerbuch 10a «kein Foto zweimal auf einem Bildschirm»): je Art mehrere Fotos des Hauses, je Anfrage fest eines (aus ihrer Kennung) */
const ARTBILDER = { tisch: ['stube-ofen-480', 'stube-gast-480', 'stube-weiss-480', 'stube-holz-480', 'stube-gelb-480'], bankett: ['tafel-480', 'hof-480', 'a-tafel-lang-480'],
  anlass: ['party-480', 'kopf-anlaesse-480'], gutschein: ['champagner-480', 'einschenken-480'], nachricht: ['schild-480', 'fassade-480'], stelle: ['team-kueche-480', 'team-service-480', 'team-empfang-480'] };
const artBild = (art, id) => { const l = ARTBILDER[art] || [ARTBILD[art] || ARTBILD.tisch]; let h = 0; for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return l[h % l.length]; };
const bild = (art, kl, id) => `<span class="${kl}" aria-hidden="true"><img src="../../assets/img/${artBild(art, id)}.webp" alt="" width="900" height="675" decoding="async"></span>`;
const uhr = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };

/* ---------- Server ---------- */
async function api(was, daten) {
  if (was === 'anfrage' && daten && (typeof daten.entwurf_text === 'string' || daten.gestalt) && !daten.__kette) {   // Fassung mitschicken, nacheinander (Carlton E21)
    const a = (S.anfragen || []).find(x => x.id === daten.id);
    const lauf = async () => { const d = await api(was, { ...daten, __kette: 1, fassung: a && a.entwurf ? (a.entwurf.fassung || 0) : undefined }); if (a && a.entwurf && typeof d.fassung === 'number') a.entwurf.fassung = d.fassung; return d; };
    const k = (S.kette || Promise.resolve()).catch(() => {}).then(lauf); S.kette = k; return k;
  }
  if (daten && daten.__kette) { daten = { ...daten }; delete daten.__kette; }
  let r;
  try {
    r = await fetch('api/' + was, daten === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) });
  } catch (e) { throw new Error('VERBINDUNG · Keine Verbindung. Ihre Eingabe ist noch da, bitte gleich noch einmal versuchen.'); }
  let d = {};
  try { d = await r.json(); } catch (e) { throw new Error('SERVER · Antwort nicht lesbar (' + r.status + ').'); }
  if (!r.ok) throw new Error(d.fehler || ('SERVER · Fehler ' + r.status));
  return d;
}
function fehler(e) {
  const m = String((e && e.message) || e), st = (m.match(/^([A-ZÄÖÜ-]+) · /) || [])[1] || '';
  quit(m.replace(/^[A-ZÄÖÜ-]+ · /, ''), st ? 'Stichwort ' + st : '', [['Was tun?', () => window.open('pruefung.html#' + (st || 'SERVER'), '_blank', 'noopener')]], true, 12000);
}
function quit(titel, text, knoepfe = [], fehl = false, dauer = 7000) {
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
  knoepfe.forEach(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { f(); q.remove(); }; q.appendChild(b); });
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Schliessen'); x.textContent = '×'; x.onclick = () => q.remove(); q.appendChild(x);
  $('#meldung').appendChild(q);
  while ($('#meldung').children.length > 3) $('#meldung').firstChild.remove();
  if (dauer) setTimeout(() => q.remove(), dauer);
}
const datum = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
const zeit = iso => { const d = new Date(iso); return isNaN(d) ? '' : datum(iso) + ', ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;

/* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
const TITEL = { start: 'Übersicht', eingang: 'Eingang', gefragt: 'Das wurde gefragt', nachgetragen: 'Vom Team nachgetragen', wissen: 'Das weiss der Chat' };
/* Werkzeug-Oberfläche «Die Bühne» (oberflaeche.py) */
/* Kopf, Rand, Leiste und Startbild aus dem Paket der Werkzeuge des Hauses (assets/oberflaeche, Rahmen «Die Bühne», kleid/schaefli.*):
   gleich wie in den anderen Werkzeugen des Schäfli. Ids, data-gehe und Handler bleiben (UMSTELLUNG.md). */
const WEGE = { anleitung: 'anleitung.html', pruefung: 'pruefung.html' };
const SB_FOTO = { eingang: 'stube-gast', gefragt: 'einschenken', nachgetragen: 'stube-holz', wissen: 'schild' };   // Bühne je Ansicht, Fotos des Hauses
/* Knöpfe in Startbild und Bühne im Stil des Pakets (gleiche Ids und data-Attribute) */
const woKn = h => String(h || '').replace(/class="kn kn--(gold|linie)( glanz-kn)?"/g, (m, a) => `class="wo-kn wo-kn--${a === 'gold' ? 'gold' : 'hell'}"`)
  .replace(/class="kn"/g, 'class="wo-kn wo-kn--hell"').replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>)([^<]+)<i>/g, '$1<span>$2</span><i>')
  .replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>(?:(?!<\/(?:a|button)>).)*?<i>)<svg (?![^>]*class=)/g, '$1<svg class="wo-ic" ');   // Pfeil im Knauf wie «Anleitung» (15 px), nicht 36 px gross (Fund 21.10.2026, Schäfli)
function kopfLeiste() {
  const u = S.ue;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: 'gaeste', unter: 'Gäste', titel: TITEL[S.ansicht] || WO.name('gaeste'),
    stand: u.anfragen_neu ? mal(u.anfragen_neu, 'Eine neue Anfrage', 'neue Anfragen') : 'Keine neuen Anfragen',
    pruefung: WEGE.pruefung, anleitung: WEGE.anleitung, website: '../../index.html', marke: 'data-gehe="start"' });
  const r = $('#kopf .wo-kopf__r');
  if (r) r.insertAdjacentHTML('afterbegin', WO.knopf('Chat ausprobieren', 'chat', 'hell', { id: 'k-probe', klein: true }) + '<span class="wo-trenn"></span>');
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
  const kp = $('#k-probe'); if (kp) kp.onclick = probe;
}
function rand() {
  const u = S.ue, an = S.ansicht;
  const e = (key, text, zahl = 0) => ({ text, zahl, an: an === key, attr: `data-gehe="${key}"` });
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('start', 'Übersicht')] },
    { titel: 'Für das Team', eintraege: [e('eingang', 'Eingang', u.anfragen_neu), e('gefragt', 'Das wurde gefragt', u.ohne_antwort), e('nachgetragen', 'Vom Team nachgetragen')]
      .concat(S.wissenDa ? [e('wissen', 'Das weiss der Chat', S.wissenNeu || 0)] : []) }], WEGE);
  const w = $('#rand .wo-rand__wege'), pf = WO.ic('pfeil');
  if (w) {   // Wege: die Formulare der Website (Ihr Abend, Feier), Anleitung, Prüfung, La Maison; dazu «Chat ausprobieren» fürs Handy
    w.insertAdjacentHTML('afterbegin', `<a href="../../abend.html" target="_blank" rel="noopener">Tischkarte auf der Website${pf}</a><a href="../../feiern.html" target="_blank" rel="noopener">Feier auf der Website${pf}</a>`);
    w.insertAdjacentHTML('beforeend', `<a href="${STUBE}">${esc(WO.name('zentrale'))}${pf}</a><button class="wo-rand__probe" type="button" data-probe>Chat ausprobieren${WO.ic('chat')}</button>`);
  }
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  $$('#rand [data-probe]').forEach(b => b.onclick = probe);
  kopfLeiste();
}
function leiste() {
  const u = S.ue;
  $('#leiste').innerHTML = WO.leiste({
    titel: u.anfragen_neu ? mal(u.anfragen_neu, 'Eine neue Anfrage', 'neue Anfragen') + ' im Eingang' : u.anfragen_offen ? mal(u.anfragen_offen, 'Eine Anfrage', 'Anfragen') + ' noch offen' : 'Der Eingang ist leer',
    satz: (u.ohne_antwort ? mal(u.ohne_antwort, 'Eine Frage', 'Fragen') + ' ohne Antwort. Einmal nachtragen, dann antwortet der Chat selbst.' : 'Jede Frage an den Chat hatte eine Antwort.') + (u.letzte_frage ? ' Letzte Frage ' + zeit(u.letzte_frage) + '.' : ''),
    knoepfe: WO.knopf('Neu laden', 'verlauf', 'glas', { id: 'l-neu', klein: true }) + WO.knopf('Zum Eingang', 'rechts', u.anfragen_neu ? 'gold' : 'hell', { id: 'l-eingang', klein: true }) });
  $('#l-neu').onclick = () => frisch(true);
  $('#l-eingang').onclick = () => gehe('eingang');
}
function kopf(mono, titel, satz, knoepfe = '', foto = '') {   // Bühne jeder Ansicht = Startbild «buehne» des Pakets mit dem Foto der Ansicht
  return WO.startbild({ werkzeug: 'gaeste', art: 'buehne', zier: esc(WO.name('gaeste') + ' · ' + mono), h1: titel, satz, knoepfe: woKn(knoepfe),
    foto: '/assets/img/' + (foto || SB_FOTO[S.ansicht] || 'haus') + '-1200.webp' });
}
function gehe(ziel, wahl = '') {
  wartendesSichern();   // was im Brief noch wartet, vor dem Wechsel sichern (Abnahme 17.10.2026)
  const gs = $('#gs-seite'); if (gs) gs.hidden = true; document.body.classList.remove('gs-seite-offen');
  if (ziel === 'eingang' && S.ansicht === 'eingang' && wahl && $('#detail')) {   // im Eingang nur den Brief wechseln, die Liste bleibt stehen
    const a = S.anfragen.find(x => x.id === wahl);
    if (a) {
      S.wahl = wahl; S.bearbeiten = '';
      $$('.re-a.aktiv').forEach(k => k.classList.remove('aktiv'));
      const k = $(`.re-a[data-wahl="${CSS.escape(wahl)}"]`); if (k) k.classList.add('aktiv');
      ruhigTauschen($('#detail'), detail(a)); verbindeEingang();
      if (innerWidth <= 1180) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  S.ansicht = ziel; S.wahl = wahl;
  try { localStorage.setItem('reception-ansicht', ziel); } catch (e) { /* privat */ }
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', '#' + ziel);
  rand(); zeichne(); window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
async function frisch(neu = false) {
  try {
    S.ue = await api('ueberblick');
    if (neu) { S.anfragen = null; S.fragen = null; }
    rand(); leiste(); await zeichne();
    if (neu) quit('Neu geladen', '', [], false, 2500);
  } catch (e) { fehler(e); }
}

/* ---------- Ansichten ---------- */
async function zeichne() {
  const el = $('#ansicht');
  try {
    if (S.ansicht === 'start') { await ladeAlles(); el.innerHTML = start(); }
    else if (S.ansicht === 'eingang') { await ladeAlles(); el.innerHTML = eingang(); verbindeEingang(); }
    else if (S.ansicht === 'gefragt') { await ladeAlles(); el.innerHTML = gefragt(); verbindeGefragt(); }
    else if (S.ansicht === 'nachgetragen') { await ladeAlles(); el.innerHTML = nachgetragenS(); verbindeNachgetragen(); }
    else if (S.ansicht === 'wissen') { await ladeWissen(); el.innerHTML = wissenS(); verbindeWissen(); }
    $$('#ansicht [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || ''));
    $$('#ansicht .re-n').forEach((x, i) => { x.classList.add('re-auf'); x.style.setProperty('--i', Math.min(i, 12)); });
  } catch (e) { fehler(e); }
}
async function ladeAlles() {
  if (!S.anfragen) { const d = await api('anfragen'); S.anfragen = d.anfragen; }
  if (!S.fragen) { const d = await api('fragen'); S.fragen = d.fragen; S.nachgetragen = d.nachgetragen; }
}

function start() {
  const u = S.ue, gruss = WO.gruss();
  const neueste = S.anfragen.slice(0, 4), fragen = S.fragen.slice(0, 5);
  return WO.startbild({ werkzeug: 'gaeste', art: 'voll', h1: `${gruss} <em>Wer hat geschrieben?</em>`,
    satz: 'Hier landet, was Gäste über die Website schreiben: Tischkarten, Feiern, Gutscheine, Plätze für Anlässe, Nachrichten. Jede Anfrage liegt im Eingang, mit den Allergien des Gastes, den Hinweisen des Hauses und einem Brief als Entwurf für Ihre Antwort. Verschickt wird nur, was Sie selbst schicken. Solange dies ein Entwurf ist, sind alle Anfragen hier Beispiele und Proben.',
    knoepfe: WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) }) +
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('mail')}</i><span class="wo-mk">Eingang</span><b>${u.anfragen_neu ? mal(u.anfragen_neu, 'Eine neue Anfrage', 'neue Anfragen') : u.anfragen_offen ? mal(u.anfragen_offen, 'Eine offen', 'offen') : 'Nichts Neues'}</b><p>${u.anfragen_gesamt ? mal(u.anfragen_gesamt, 'Eine Anfrage', 'Anfragen') + ' aus Chat und Website bisher.' : 'Sobald ein Gast über die Website oder im Chat etwas anfragt, steht es hier.'}</p><button class="wo-lk" type="button" data-gehe="eingang">Zum Eingang</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('chat')}</i><span class="wo-mk">Ohne Antwort</span><b>${u.ohne_antwort ? mal(u.ohne_antwort, 'Eine Frage', 'Fragen') : 'Keine Lücke'}</b><p>${u.ohne_antwort ? 'Dazu stand nichts auf der Website. Einmal nachtragen genügt.' : 'Jede Frage hatte eine Antwort.'}</p><button class="wo-lk" type="button" data-gehe="gefragt" data-wahl="luecke">Fragen ansehen</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('suche')}</i><span class="wo-mk">Gefragt</span><b>${mal(u.fragen_gesamt, 'Eine Frage', 'Fragen')}</b><p>${u.letzte_frage ? 'Zuletzt am ' + zeit(u.letzte_frage) + '.' : 'Noch keine Frage an den Chat.'}${u.nachgetragen_gesamt ? ' ' + mal(u.nachgetragen_gesamt, 'Eine Antwort', 'Antworten') + ' vom Team nachgetragen.' : ''}</p><button class="wo-lk" type="button" data-gehe="gefragt">Alle Fragen</button></div>
    </div>
    ${S.anfragen.length ? arten() : ''}
    <div class="re-start">
      <section class="re-start__sp"><h2 class="wo-zw">Zuletzt <em>angefragt</em></h2>
        ${neueste.length ? `<div class="re-liste">${neueste.map((a, i) => karteAnfrage(a, i + 1)).join('')}</div><button class="link re-mehr" type="button" data-gehe="eingang">Alle ${S.anfragen.length} Anfragen im Eingang</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Der Eingang ist leer.</b><p>Schickt ein Gast eine Tischkarte, fragt eine Feier an oder bestellt einen Gutschein, liegt die Anfrage hier.</p></div>`}
      </section>
      <section class="re-start__sp"><h2 class="wo-zw">Zuletzt <em>gefragt</em></h2>
        ${fragen.length ? `<div class="re-liste re-qliste">${fragen.slice(0, 4).map(frageKarte).join('')}</div><button class="link re-mehr" type="button" data-gehe="gefragt">Alle ${S.fragen.length} Fragen ansehen</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Noch keine Frage.</b><p>Sobald Gäste den Chat fragen, steht es hier.</p></div>`}
      </section>
    </div>`;
}
/* «Zuletzt gefragt» als Karten wie die Anfragen (Robert 15.10.2026: «übersichtlicher … schöner»): Foto des Themas, Sprache als Goldmarke,
   Frage gross, Antwort des Chats in einer Zeile, Stand rechts */
const THEMABILD = { 'Allergien & Unverträglichkeiten': 'teller-gruen-480', 'Feiern & Gruppen': 'tafel-480', 'Anlässe & Events': 'party-480', 'Gutscheine': 'champagner-480',
  'Hund': 'hof-480', 'Reservation & Zeiten': 'stube-ofen-480', 'Bar & Lounge': 'bar-480', 'Karte & Wein': 'weinwand-480', 'Übernachten & Shuttle': 'nacht-480',
  'Anreise & Parkplatz': 'strasse-480', 'Stellen': 'team-kueche-480', 'Weitere Fragen': 'stube-gast-480' };
/* Bilder in jeder Liste (Robert 19.10.2026: «in allen Tools Bilder dazu»): jedes Thema, jede Angabe, jeder Nachtrag mit einem Foto des Hauses (website/assets/img) */
const IMG = (n, kl) => `<span class="${kl}" aria-hidden="true"><img src="../../assets/img/${n}.webp" alt="" width="480" height="360" loading="lazy" decoding="async"></span>`;
const THEMA_RE = [['Allergien & Unverträglichkeiten', /allerg|gluten|laktose|zöliak|unverträg|nuss|nüss|senf|krusten|sellerie|vegan|vegetar|celiac|nuts/i], ['Feiern & Gruppen', /feier|fest\b|festsaal|geburtstag|hochzeit|firmen|gruppe|bankett|catering|birthday|wedding|group/i],
  ['Anlässe & Events', /anlass|event|kitchen ?party|privée|privee|donatsch|vorarlberg|gastk[oö]ch/i], ['Gutscheine', /gutschein|geschenk|voucher|gift/i], ['Hund', /hund|dog|chien/i],
  ['Reservation & Zeiten', /reserv|tisch|ruhetag|offen|geöffnet|geschlossen|ferien|sonntag|montag|dienstag|uhr\b|dresscode|table|open/i], ['Bar & Lounge', /bar\b|lounge|zigarr|cigar|smok|digestif|aperitif|drink/i],
  ['Karte & Wein', /karte|menü|menu|degustation|trüffel|mittag|gericht|wein|wine|essen/i], ['Übernachten & Shuttle', /übernacht|hotel|zimmer|shuttle|taxi|wartegg|lipperswil|room|wheelchair|rollstuhl/i], ['Anreise & Parkplatz', /park|anreise|bahnhof|zug|auto|train/i]];
const themaVon = t => (THEMA_RE.find(([, re]) => re.test(t || '')) || ['Weitere Fragen'])[0];
/* Angaben im Wissen: je Zeile ein passendes Foto (Personen mit ihrem Porträt), sonst das Foto des Bereichs */
const ZEILENBILD = [[/^Chef de cuisine/, 'christian-480'], [/^Eltern/, 'vater-480'], [/Sous Chef|Entremetier|Patissier/, 'hand-480'],
  [/^Adresse|^Tage$/, 'fassade-480'], [/Telefon|^Online/, 'schild-480'], [/Auszeichnungen/, 'urkunden-480'], [/^Küche/, 'hand-480'], [/Dresscode/, 'stube-weiss-480'], [/^Hunde/, 'hof-480'],
  [/^Restaurant|Ruhetage/, 'stube-ofen-480'], [/^Im Restaurant/, 'stube-gast-480'], [/^Bar$|Barkarte/, 'bar-480'], [/Ferien/, 'nacht-480'], [/Ab 8 Personen|Festsaal/, 'tafel-480'], [/Gruppen \(AGB\)|Teilnehmerzahl|Anzahlung/, 'bogen-480'],
  [/Vegetarisch|Menü 4/, 'teller-gruen-480'], [/Degustationsmenü/, 'k-kaviar-480'], [/^Gänge|Auswahl/, 'k-drei-480'], [/Stand der Karte|Englische Karte/, 'kopf-karte-480'],
  [/Mittagsmenü/, 'pass-schnitzel-480'], [/Trüffelmenü/, 'trueffel-480'], [/^Wofür/, 'aschenbecher-480'], [/Kleiner Hunger/, 'barhocker-480'], [/^Catering/, 'stube-abend-480'],
  [/Menü 1/, 'teller-muschel-480'], [/Menü 2/, 'pass-scampi-480'], [/Menü 3/, 'teller-ente-480'], [/^Formular|^Versand/, 'champagner-480'], [/Parkieren/, 'strasse-480'],
  [/Shuttle|Partnerhotels/, 'nacht-480'], [/Wirtschaft am Schlössli/, 'schloessli-haus-480']];
const zeilenBild = p => (ZEILENBILD.find(([re]) => re.test(p.was || '')) || [, BER_BILD[p.bereich] || 'haus-480'])[1];
/* Antworten des Chats lesbar setzen (Robert 20.10.2026: «Die Antwortfelder des Chats bitte schöner gestalten»): Zeilen mit «- » werden eine Liste, der Rest Absätze */
function antwortHTML(t) {
  const z = String(t || '').split('\n'); let h = '', liste = [];
  const fertig = () => { if (liste.length) { h += '<ul>' + liste.map(x => { const m = x.match(/^([^:]{2,40}):\s*(.+)$/); return '<li>' + (m ? `<b>${esc(m[1])}</b> ${esc(m[2])}` : esc(x)) + '</li>'; }).join('') + '</ul>'; liste = []; } };
  z.forEach(x => { const m = x.match(/^\s*[-•]\s+(.*)$/); if (m) liste.push(m[1]); else { fertig(); if (x.trim()) h += `<p>${esc(x)}</p>`; } }); fertig(); return h;
}
function frageKarte(f) {
  const offen = !f.belegt && !f.erledigt, d = new Date(f.zeit);
  const wann = isNaN(d) ? '' : d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  return `<button class="re-a re-q${offen ? ' re-q--offen' : ''}" type="button" data-gehe="gefragt"${offen ? ' data-wahl="luecke"' : ''}>
    <span class="re-a__bild" aria-hidden="true"><img src="../../assets/img/${THEMABILD[f.gruppe] || 'schild-480'}.webp" alt="" width="900" height="675" decoding="async"></span>
    <span class="re-a__n"><span class="re-a__k"><i class="re-q__sp">${esc((f.sprache || '').toUpperCase())}</i>${esc(f.gruppe || 'Weitere Fragen')}${f.beispiel ? ' · Beispiel' : ''}</span><b dir="auto">${esc(f.frage)}</b><small dir="auto">${offen ? 'Dazu stand nichts auf der Website. Einmal nachtragen, dann antwortet der Chat selbst.' : esc(String(f.antwort || '').replace(/\s+/g, ' '))}</small></span>
    <span class="re-a__st">${offen ? 'Ohne Antwort' : 'Beantwortet'}<small>${esc(wann)}</small></span></button>`;
}
function arten() {   // die Arten als Kacheln mit Foto (wo-aufg des Pakets), wie viele Anfragen je Art im Eingang liegen
  const Z = { tisch: 'blatt', bankett: 'siegel', anlass: 'uhr', gutschein: 'karte', nachricht: 'mail', stelle: 'haus' };
  return `<h2 class="wo-zw">Nach <em>Art</em></h2><div class="wo-aufg">${Object.keys(ART).map(k => { const l = S.anfragen.filter(a => a.art === k), o = l.filter(a => a.status !== 'erledigt').length;
    return `<button class="wo-ag" type="button" data-gehe="eingang"><span class="wo-ag__b"><img src="../../assets/img/${ARTBILD[k] || ARTBILD.tisch}.webp" alt="" width="900" height="675" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(Z[k] || 'mail')}</i><b>${ART_LANG[k]}</b><span>${l.length ? mal(l.length, 'eine Anfrage', 'Anfragen') + (o ? ' · ' + o + ' offen' : '') : 'noch keine'}</span></span></button>`; }).join('')}</div>`;
}
/* ---------- Eingang ---------- */
function karteAnfrage(a, i = 0) {
  const st = a.status === 'neu' ? 'Neu' : a.status === 'erledigt' ? 'Erledigt' : a.entwurf ? 'Brief bereit' : 'Gelesen';
  return `<button class="re-a${a.status === 'neu' ? ' neu' : ''}${a.status === 'erledigt' ? ' erledigt' : ''}${S.wahl === a.id && S.ansicht === 'eingang' ? ' aktiv' : ''}" style="--i:${i}" type="button" data-gehe="eingang" data-wahl="${esc(a.id)}">
    ${bild(a.art, 're-a__bild', a.id)}
    <span class="re-a__n"><span class="re-a__k">${esc(ART[a.art] || a.art)}${abt(a) !== ART[a.art] ? ' · ' + esc(abt(a)) : ''} · ${esc(uhr(a.zeit).replace(' Uhr', ''))}${a.web ? ' · Website' : ''}${a.beispiel ? ' · Beispiel' : a.probe ? ' · Probe' : ''}</span><b><bdi>${esc(a.name || 'Ohne Namen')}</bdi></b><small>${[a.datum, a.personen ? a.personen + ' Personen' : '', SPRACHE[a.sprache] || a.sprache].filter(Boolean).map(x => `<bdi>${esc(x)}</bdi>`).join(' · ')}</small>${hinwKurz(a).length ? `<em class="re-a__hinw">${hinwKurz(a).map(esc).join(' · ')}</em>` : ''}</span>
    <span class="re-a__st">${st}</span></button>`;
}
function tagVon(iso) {   // Heute, Gestern, Wochentag, sonst Datum
  const d = new Date(iso), h = new Date(); h.setHours(0, 0, 0, 0);
  const t = Math.round((h - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return t <= 0 ? 'Heute' : t === 1 ? 'Gestern' : t < 7 ? d.toLocaleDateString('de-CH', { weekday: 'long' }) : 'Früher';
}
function eingang() {
  const jede = S.anfragen, f = S.filter, alle = S.abt === 'alle' ? jede : jede.filter(a => abt(a) === S.abt);
  const l = f === 'neu' ? alle.filter(a => a.status === 'neu') : f === 'offen' ? alle.filter(a => a.status !== 'erledigt') : f === 'erledigt' ? alle.filter(a => a.status === 'erledigt') : alle;
  if ((!S.wahl || !l.some(a => a.id === S.wahl)) && l.length) S.wahl = (l.find(a => a.status === 'neu') || l[0]).id;
  const a = alle.find(x => x.id === S.wahl);
  const tage = []; l.forEach(x => { const t = tagVon(x.zeit); const g = tage.find(y => y.t === t); g ? g.l.push(x) : tage.push({ t, l: [x] }); });
  let n = 0;
  const zahl = k => k === 'neu' ? alle.filter(a => a.status === 'neu').length : k === 'offen' ? alle.filter(a => a.status !== 'erledigt').length : k === 'erledigt' ? alle.filter(a => a.status === 'erledigt').length : alle.length;
  const offenIn = n => jede.filter(a => a.status !== 'erledigt' && (n === 'alle' || abt(a) === n)).length;
  return kopf('Eingang', 'Anfragen <em>aus Chat und Website.</em>',
    'Tischkarten mit Wünschen, Feiern und Gruppen, Plätze für Anlässe, Gutscheine, Nachrichten und Bewerbungen, die Gäste in einem Formular der Website oder im Chat geschickt haben. Allergien und Hinweise zu Ruhetagen, Ferien, Gruppen und Festsaal stehen bei jeder Anfrage. Zu jeder schreibt der Assistent einen Brief im Ton des Hauses, auf Grundlage dessen, was Ihr Haus selbst schreibt. Sie lesen, ändern und schicken selbst.' + (alle.some(x => x.beispiel) ? ' Die Anfragen mit dem Wort «Beispiel» sind erfunden und zeigen, wie der Eingang arbeitet.' : '')) +
    (jede.length ? `<div class="re-eingang"><div class="re-spalte">
        <div class="re-abt" role="group" aria-label="Abteilung">${[['alle', 'Alle', 'Jede Abteilung']].concat(ABTEILUNGEN.map(([k, s]) => [k, k, s])).map(([k, n, s]) => `<button type="button" data-abt="${k}" aria-pressed="${S.abt === k}" title="${esc(s)}"><span>${esc(n)}</span><i${offenIn(k) ? ' class="da"' : ''}>${offenIn(k)}</i></button>`).join('')}</div>
        <div class="wahl2 re-filter" role="group" aria-label="Auswahl">${[['alle', 'Alle'], ['neu', 'Neu'], ['offen', 'Offen'], ['erledigt', 'Erledigt']].map(([k, t]) => `<button type="button" data-filter="${k}" aria-pressed="${f === k}">${t}<i>${zahl(k)}</i></button>`).join('')}</div>
        <div class="re-liste">${tage.map(g => `<p class="re-tag"><span>${esc(g.t)}</span></p>${g.l.map(x => karteAnfrage(x, n++)).join('')}`).join('') || '<p class="re-tag"><span>Nichts in dieser Auswahl</span></p>'}</div></div>
        <div class="re-detail" id="detail">${a ? detail(a) : ''}</div></div>`
      : `<div class="re-leer platte">${ZEICHEN}<b>Der Eingang ist leer.</b><p>Sobald ein Gast im Chat etwas anfragt und Name und Kontakt nennt, oder ein Formular der Website abschickt, steht die Anfrage hier.</p></div>`);
}
function kontaktLink(k) {
  const t = String(k || '').trim();
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(t)) return `<span class="re-mail">${esc(t)}</span>`;   // kein mailto, Adresse zum Kopieren (17.10.2026)
  if (/^[+\d][\d\s/().-]{6,}$/.test(t)) return `<span class="re-mail">${esc(t)}</span>`;   // kein tel:-Link, öffnet sonst ein Programm (Demo-Check 21.10.2026)
  return esc(t);
}
const KLAMMER = /\[[^\]\n]+\]/g;
function briefText(t) {   // Absätze, Zeilen, und die Stellen in [Klammern] als offene Felder
  return esc(t).split(/\n{2,}/).map(abs => `<p>${abs.replace(/\[([^\]\n]+)\]/g, '<mark class="offen-feld">$1</mark>').replace(/\n/g, '<br>')}</p>`).join('');
}
function textBrief(a, e, rtl) {   // «Als Text»: Betreff und Text als Felder (auch für die Prüfläufe)
  return `<article class="brief brief--bearb">
          <header class="brief__kopf">${ZEICHEN}<b>Taverne zum Schäfli</b><span>Haus der Gastlichkeit · Wigoltingen</span></header>
          <dl class="brief__an">
            <div><dt>An</dt><dd><bdi>${esc(a.name || '')}</bdi><small>${esc(a.kontakt || '')}</small></dd></div>
            <div><dt>Von</dt><dd title="Mail-Vorlage: ${esc(e.vorlage)}">${esc(e.absender)}</dd></div>
            <div class="brief__betreff"><dt>Betreff</dt><dd><textarea id="e-betreff" rows="1" dir="auto" spellcheck="true">${esc(e.betreff)}</textarea></dd></div>
          </dl>
          <div class="brief__text"${rtl}><textarea id="e-text"${rtl} dir="auto" spellcheck="true">${esc(e.text)}</textarea></div>
          <div class="brief__siegel" aria-hidden="true">${ZEICHEN}</div>
          <footer class="brief__fuss">Oberdorfstrasse 8 · 8556 Wigoltingen<br>+41 52 763 11 72 · kontakt@schaefli-wigoltingen.ch</footer>
        </article>`;
}

/* ---------- Der Brief als Gestaltungsfläche (Robert 15.10.2026: «wie in so einem Canva bearbeiten … Überschriften, Texte bearbeiten, durch die Gegend ziehen,
   vergrössern, verkleinern, direkt in dem Feld drin»). Jeder Teil des Briefs ist ein Baustein (data-b): einmal klicken wählt ihn (Rahmen mit Ecken und Leiste),
   ziehen verschiebt, Ecken skalieren die Schrift, Seiten ändern die Breite, Doppelklick oder zweiter Klick schreibt hinein. Anordnung je Brief in entwurf.gestalt,
   Text in entwurf.text/betreff; gesichert wird von selbst. Verschoben wird nur über transform. */
const GKOPF = { haus: 'Taverne zum Schäfli', zeile: 'Haus der Gastlichkeit · Wigoltingen', fuss: 'Oberdorfstrasse 8 · 8556 Wigoltingen\n+41 52 763 11 72 · kontakt@schaefli-wigoltingen.ch' };   // Adresse und Telefon: Kontaktseite des Hauses (GaultMillau-Schreibweise wie website/inhalt/haus.py); Zeile: Startseite «Herzlich willkommen im Haus der Gastlichkeit.»
/* Fotos des Hauses zum Einfügen in den Brief (assets/img/<k>-480|800|1200.webp der Website) */
const BRIEFBILDER = [['fassade', 'Das Riegelhaus'], ['schild', 'Das Wirtshausschild'], ['stube-ofen', 'Am Kachelofen'], ['stube-gast', 'Die Gaststube'],
  ['stube-abend', 'Die Stube am Abend'], ['tafel', 'Die lange Tafel'], ['hof', 'Die Tafel im Hof'], ['terrasse', 'Auf der Terrasse'],
  ['einschenken', 'Ein Glas zum Auftakt'], ['champagner', 'Champagner'], ['trueffel', 'Weisse Trüffel'], ['k-kaviar', 'Ein Gang der Küche'], ['teller-muschel', 'Jakobsmuschel'],
  ['pass-dessert', 'Dessert'], ['bar', 'Die Bar'], ['nacht', 'Das Haus am Abend']];
const SCHRIFT = { serif: 'font-family:var(--serif)', sans: 'font-family:var(--sans)', mono: 'font-family:var(--mono)', cinzel: 'font-family:var(--caps)', versal: 'font-family:var(--caps);letter-spacing:.16em;text-transform:uppercase' };
const TEXTART = { normal: 'font-style:normal;font-weight:400;text-transform:none;letter-spacing:0', kursiv: 'font-style:italic', versal: 'text-transform:uppercase;letter-spacing:.16em', medium: 'font-weight:500' };
/* Hauspalette, gleich in La Carte, La Réception und L’Imprimerie (Absprache 16.10.2026) */
const HFARBE = { navy: '#301916', blau: '#452520', tinte: '#2A292B', papier: '#F0EAE1', creme: '#E6DDD0', weiss: '#F5F3EF', sand: '#B38346', gold: '#D3B794', messing: '#7D433A', taupe: '#6a5a55', rot: '#D23A2A' };
const HNAME = { navy: 'Ochsenblut tief', blau: 'Ochsenblut', tinte: 'Schmiedeeisen', papier: 'Kalk', creme: 'Kalk tief', weiss: 'Blatt', sand: 'Schildgold', gold: 'Schildgold hell', messing: 'Riegel', taupe: 'Leise', rot: 'Wappenrot' };
/* Hauspalette des Schäfli (Farbwelt A «Riegel und Kalk», marke.json Station 5, Werte wie _werkzeuge/oberflaeche/kleid/schaefli.css): abgeschrieben, weil La Réception das Markenbuch nicht lädt */
const LFARBE = { taupe: 'rgba(179,131,70,.55)', gold: '#B38346', navy: '#452520' };
const GNAME = { linie1: 'Linie unter dem Kopf', linie2: 'Linie über dem Betreff', linie3: 'Linie über der Fusszeile', zeichen: 'Zeichen', haus: 'Hausname', zeile: 'Unterzeile', an: 'Empfänger', von: 'Absender', betreff: 'Betreff', fuss: 'Fusszeile' };
const gName = k => GNAME[k] || (/^p\d+$/.test(k) ? 'Absatz ' + (+k.slice(1) + 1) : 'Foto');
function gStil(g, bild = false) {
  if (!g) return '';
  const l = [];
  if (bild && g.al) l.push(`margin-left:${g.al === 'left' ? 0 : 'auto'}`, `margin-right:${g.al === 'right' ? 0 : 'auto'}`);
  if (g.dx || g.dy) l.push(`--dx:${g.dx || 0}px`, `--dy:${g.dy || 0}px`);
  if (g.s && g.s !== 1) l.push(`--s:${g.s}`);
  if (g.w) l.push(`width:${g.w}px`, 'max-width:none');
  if (g.al) l.push(`text-align:${g.al}`);
  if (g.mb) l.push(`--mb:${g.mb}px`);
  if (g.f && SCHRIFT[g.f]) l.push(SCHRIFT[g.f]);
  if (g.st) l.push(`--lst:${g.st}px`);
  if (g.fb && (LFARBE[g.fb] || HFARBE[g.fb])) l.push(`--lfb:${LFARBE[g.fb] || HFARBE[g.fb]}`);
  if (g.ta && TEXTART[g.ta]) l.push(TEXTART[g.ta]);
  if (g.c && HFARBE[g.c]) l.push(`color:${HFARBE[g.c]}`);
  if (g.lh) l.push(`line-height:${g.lh}`);
  if (g.ls != null) l.push(`letter-spacing:${g.ls}em`);
  if (g.op != null && g.op < 1) l.push(`opacity:${g.op}`);
  if (g.z) l.push(`z-index:${g.z + 2}`);
  if (g.mt) l.push(`--mt:${g.mt}px`);
  if (g.ar) l.push(`--ar:${g.ar}`);
  if (g.ox != null || g.oy != null) l.push(`--ox:${g.ox == null ? 50 : g.ox}%`, `--oy:${g.oy == null ? 50 : g.oy}%`);
  return l.length ? ` style="${l.join(';')}"` : '';
}
function feldHTML(t) {   // Text mit Zeilen und offenen Stellen, bearbeitbar
  return esc(t).replace(/\[([^\]\n]+)\]/g, '<mark class="offen-feld">$1</mark>').replace(/\n/g, '<br>');
}
function gestaltBrief(a, e, rtl) {
  const G = e.gestalt || {}, ab = e.text.split(/\n{2,}/), bilder = G._bilder || [];
  const bk = (k, cls, inhalt, schreib = true, extra = '') => `<div class="gs ${cls}" data-b="${k}"${schreib ? ' data-schreib' : ''}${extra}${gStil(G[k], cls === 'gs--bild' || cls === 'gs--linie')}>${inhalt}</div>`;
  const linie = k => (G[k] && G[k].aus) ? '' : bk(k, 'gs--linie', '<i></i>', false);
  const kt = k => feldHTML((G[k] && typeof G[k].t === 'string') ? G[k].t : GKOPF[k]);
  const fotos = nach => bilder.filter(b => b.nach === nach).map(b => bk(b.id, 'gs--bild', `<img src="../../assets/img/${esc(b.k)}-800.webp" alt="${esc(b.n || '')}" draggable="false">`, false)).join('');
  return `<div class="gs-flaeche"><div class="gs-werk" role="toolbar" aria-label="Brief gestalten">
          <div class="gs-werk__grp"><button class="gs-werk__k" type="button" data-w="zurueck" aria-label="Rückgängig" data-tip="Rückgängig (⌘Z)"><svg viewBox="0 0 16 16"><path d="M5.5 4 2.5 7l3 3M2.8 7H10a3.5 3.5 0 0 1 0 7H8"/></svg></button><button class="gs-werk__k" type="button" data-w="vor" aria-label="Wiederholen" data-tip="Wiederholen (⇧⌘Z)"><svg viewBox="0 0 16 16"><path d="M10.5 4l3 3-3 3M13.2 7H6a3.5 3.5 0 0 0 0 7h2"/></svg></button></div>
          <div class="gs-werk__grp gs-werk__schrift" role="group" aria-label="Schrift"><button class="gs-werk__k gs-sel" type="button" data-g="f-serif" data-tip="Schrift Antiqua"><b style="font-family:var(--serif);font-size:17px">Aa</b></button><button class="gs-werk__k gs-sel" type="button" data-g="f-cinzel" data-tip="Schrift Versalien"><b style="font-family:var(--caps);font-size:13px">Aa</b></button><button class="gs-werk__k gs-sel" type="button" data-g="f-sans" data-tip="Schrift Grotesk"><b style="font-family:var(--sans);font-size:14px">Aa</b></button></div>
          <div class="gs-werk__grp"><button class="gs-werk__k gs-sel" type="button" data-g="kleiner" aria-label="Kleiner" data-tip="Kleiner"><svg viewBox="0 0 16 16"><path d="M3.5 8h9"/></svg></button><span class="gs-werk__wert" id="gs-gr">–</span><button class="gs-werk__k gs-sel" type="button" data-g="groesser" aria-label="Grösser" data-tip="Grösser"><svg viewBox="0 0 16 16"><path d="M3.5 8h9M8 3.5v9"/></svg></button></div>
          <div class="gs-werk__grp"><button class="gs-werk__k gs-sel" type="button" data-g="left" aria-label="Linksbündig" data-tip="Linksbündig"><svg viewBox="0 0 16 16"><path d="M3 4h10M3 8h6M3 12h8"/></svg></button><button class="gs-werk__k gs-sel" type="button" data-g="center" aria-label="Zentriert" data-tip="Zentriert"><svg viewBox="0 0 16 16"><path d="M3 4h10M5 8h6M4 12h8"/></svg></button><button class="gs-werk__k gs-sel" type="button" data-g="right" aria-label="Rechtsbündig" data-tip="Rechtsbündig"><svg viewBox="0 0 16 16"><path d="M3 4h10M7 8h6M5 12h8"/></svg></button></div>
          <div class="gs-werk__grp gs-werk__farbe" role="group" aria-label="Linienfarbe"><button class="gs-werk__k gs-sel" type="button" data-g="fb-taupe" data-tip="Linie Taupe"><i style="background:rgba(177,158,134,.6)"></i></button><button class="gs-werk__k gs-sel" type="button" data-g="fb-gold" data-tip="Linie Gold"><i style="background:#ac895c"></i></button><button class="gs-werk__k gs-sel" type="button" data-g="fb-navy" data-tip="Linie Blau"><i style="background:#2c1916"></i></button></div>
          <div class="gs-werk__grp"><button class="gs-werk__k gs-sel" type="button" data-g="enger" aria-label="Weniger Abstand darunter" data-tip="Abstand kleiner"><svg viewBox="0 0 16 16"><path d="M3 3h10M3 13h10M8 5.5v5M6 8.5l2 2 2-2"/></svg></button><button class="gs-werk__k gs-sel" type="button" data-g="weiter" aria-label="Mehr Abstand darunter" data-tip="Abstand grösser"><svg viewBox="0 0 16 16"><path d="M3 3h10M3 13h10M8 5.5v5M6 7.5l2-2 2 2"/></svg></button></div>
          <div class="gs-werk__grp"><button class="gs-werk__k gs-sel" type="button" data-g="schreiben" aria-label="Text ändern" data-tip="Text ändern"><svg viewBox="0 0 16 16"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg></button><button class="gs-werk__k gs-sel" type="button" data-g="zurueck" aria-label="Diesen Teil zurücksetzen" data-tip="Teil zurücksetzen"><svg viewBox="0 0 16 16"><path d="M4 8a4 4 0 1 0 1.2-2.9M4 3v2.6h2.6"/></svg></button><button class="gs-werk__k gs-sel" type="button" data-g="weg" aria-label="Foto entfernen" data-tip="Foto entfernen"><svg viewBox="0 0 16 16"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg></button></div>
          <span class="gs-werk__t"></span>
          <div class="gs-werk__grp"><button class="gs-werk__k gs-werk__k--text" type="button" data-w="foto"><svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="m2.5 11 3.5-3.5 3 3 2-2 2.5 2.5"/><circle cx="10.5" cy="6" r="1"/></svg>Foto</button><button class="gs-werk__k gs-werk__k--text" type="button" data-w="vorlage"><svg viewBox="0 0 16 16"><path d="M4 8a4 4 0 1 0 1.2-2.9M4 3v2.6h2.6"/></svg>Vorlage</button></div>
        </div>
        <p class="gs-hinweis"><span id="gs-name">Klicken Sie im Brief auf einen Teil, um ihn zu gestalten.</span><span class="gs-werk__stand" id="gs-stand">Gesichert</span></p>
        <article class="brief brief--gestalt" id="brief" data-id="${esc(a.id)}">
          ${bk('zeichen', 'gs--zeichen', ZEICHEN, false)}
          ${bk('haus', 'gs--haus', kt('haus'))}
          ${bk('zeile', 'gs--zeile', kt('zeile'))}
          ${linie('linie1')}
          <div class="brief__an">
            ${bk('an', 'gs--an', `<dt>An</dt><dd><bdi>${esc(a.name || '')}</bdi><small>${esc(a.kontakt || '')}</small></dd>`, false)}
            ${bk('von', 'gs--an', `<dt>Von</dt><dd title="Mail-Vorlage: ${esc(e.vorlage)}">${esc(e.absender)}</dd>`, false)}
          </div>
          ${linie('linie2')}
          <div class="brief__betreff"><span class="gs-mono">Betreff</span>${bk('betreff', 'gs--betreff', feldHTML(e.betreff), true, ' dir="auto"')}</div>
          ${fotos('kopf')}
          <div class="brief__text"${rtl}>${ab.map((x, n) => bk('p' + n, 'gs--p' + (ab.length > 2 && n === ab.length - 1 ? ' gs--sign' : ''), feldHTML(x), true, ' dir="auto"') + fotos('p' + n)).join('')}</div>
          <div class="brief__siegel" aria-hidden="true">${ZEICHEN}</div>
          ${linie('linie3')}
          ${bk('fuss', 'gs--fuss', kt('fuss'))}
          <div class="gw" id="gw" hidden>
            <i class="gw__e" data-h="nw"></i><i class="gw__e" data-h="ne"></i><i class="gw__e" data-h="sw"></i><i class="gw__e" data-h="se"></i>
            <i class="gw__s" data-h="w"></i><i class="gw__s" data-h="e"></i>
            <span class="gw__name" id="gw-name"></span>
          </div>
        </article></div>`;
}
function textAus(el) {   // Baustein → Text: <br> und Zeilen werden \n, offene Felder wieder [Klammern]
  let t = '';
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) t += n.nodeValue;
    else if (n.nodeName === 'BR') t += '\n';
    else if (n.nodeName === 'MARK') { const x = n.textContent.trim(); if (x) t += '[' + x + ']'; }
    else if (n.nodeName === 'DIV' || n.nodeName === 'P') t += (t && !t.endsWith('\n') ? '\n' : '') + textAus(n);
    else t += n.textContent;
  });
  return t.replace(/ /g, ' ');
}
/* Der Brief als Mail: dieselben Grössen, Bündigkeit, Abstände und Fotos, mit Tabellen und Inline-Stilen, damit Mailprogramme ihn so zeigen.
   Freie Verschiebungen kennt eine Mail nicht: nach unten wird Abstand, nach rechts Einzug. Genau gleich ist nur die PDF. */
function briefMail(a, e) {
  const G = e.gestalt || {}, bilder = G._bilder || [], basis = location.origin + location.pathname.replace(/_?werkzeuge\/reception\/.*$/, ''), wz = location.origin + location.pathname.replace(/[^/]*$/, '');
  const st = (k, fs, extra = '') => { const g = G[k] || {}; const l = [`font-size:${Math.round(fs * (g.s || 1) * 10) / 10}px`, extra];
    if (g.al) l.push(`text-align:${g.al}`); if (g.f === 'versal') l.push("font-family:Petrona,Georgia,serif;letter-spacing:.16em;text-transform:uppercase"); if (g.f === 'sans') l.push("font-family:'Instrument Sans',Helvetica,Arial,sans-serif"); if (g.f === 'serif') l.push("font-family:Petrona,Georgia,serif"); if (g.f === 'cinzel') l.push('font-family:Petrona,Georgia,serif'); if (g.f === 'mono') l.push("font-family:'DM Mono',Menlo,monospace"); if (g.ta && TEXTART[g.ta]) l.push(TEXTART[g.ta]); if (g.c && HFARBE[g.c]) l.push(`color:${HFARBE[g.c]}`); if (g.lh) l.push(`line-height:${g.lh}`); if (g.ls != null) l.push(`letter-spacing:${g.ls}em`); const oben = Math.max(0, (g.dy || 0) + (g.mt || 0)), unten = (g.mb || 0); if (oben) l.push(`padding-top:${oben}px`); if (unten > 0) l.push(`padding-bottom:${unten}px`);
    if ((g.dx || 0) > 0) l.push(`padding-left:${g.dx}px`); return l.filter(Boolean).join(';'); };
  const t = x => esc(x).replace(/\n/g, '<br>');
  const kt = k => t((G[k] && typeof G[k].t === 'string') ? G[k].t : GKOPF[k]);
  const fotos = nach => bilder.filter(b => b.nach === nach).map(b => { const g = G[b.id] || {}; const w = Math.round(Math.min(560, (g.w || 560) * (g.s || 1)));
    return `<tr><td style="padding:6px 0 18px;${g.al ? 'text-align:' + g.al : 'text-align:center'}"><img src="${basis}assets/img/${b.k}-800.webp" width="${w}" alt="${esc(b.n || '')}" style="display:inline-block;width:${w}px;max-width:100%;height:auto;border:0"></td></tr>`; }).join('');
  const mLinie = (k, pad) => { const g = G[k] || {}; if (g.aus) return ''; const w = g.w ? Math.min(504, g.w) + 'px' : '100%', al = g.al || 'center', farbe = { taupe: '#ded2c3', gold: '#ac895c', navy: '#2c1916' }[g.fb || 'taupe'] || HFARBE[g.fb];
    return `<tr><td style="padding:${pad};text-align:${al}"><div style="display:inline-block;width:${w};height:${g.st || 1}px;background:${farbe};line-height:1px;font-size:1px">&nbsp;</div></td></tr>`; };
  const serif = "font-family:Petrona,Georgia,serif;color:#251513";
  const ab = e.text.split(/\n{2,}/);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeeae4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#f6f3ef;border-radius:22px;overflow:hidden">
<tr><td style="padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#2c1916;text-align:center;padding:34px 20px 4px"><img src="${wz}zeichen-haus.png" width="${Math.round(46 * ((G.zeichen || {}).s || 1))}" alt="" style="height:auto;border:0"></td></tr>
<tr><td style="background:#2c1916;${st('haus', 15, "text-align:center;letter-spacing:.2em;text-transform:uppercase;font-weight:700;font-family:Petrona,Georgia,'Times New Roman',serif;color:#f6f3ef;padding-top:12px")}">${kt('haus')}</td></tr>
<tr><td style="background:#2c1916;${st('zeile', 10.5, "text-align:center;letter-spacing:.24em;text-transform:uppercase;font-family:'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif;color:#bb8d52;padding:8px 20px 30px")}">${kt('zeile')}</td></tr>
<tr><td style="padding:34px 40px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${mLinie('linie1', '22px 0 24px')}
${mLinie('linie2', '0 0 14px')}
<tr><td style="font-family:'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#81483f">Betreff</td></tr>
<tr><td style="${st('betreff', 22, serif + ';font-weight:700;color:#251513;padding:6px 0 22px;line-height:1.2')}">${t(e.betreff)}</td></tr>
${fotos('kopf')}
${ab.map((x, n) => `<tr><td dir="auto" style="${st('p' + n, 16, "font-family:'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif;color:#3a211d;line-height:1.62;padding-bottom:" + (14 + Math.max(0, (G['p' + n] || {}).mb || 0)) + 'px' + (ab.length > 2 && n === ab.length - 1 ? ';padding-top:8px' : ''))}">${t(x)}</td></tr>${fotos('p' + n)}`).join('\n')}
<tr><td style="text-align:center;padding:22px 0 0"><img src="${wz}zeichen-haus.png" width="22" alt="" style="height:auto;border:0"></td></tr>
${mLinie('linie3', '16px 0 0')}
<tr><td style="${st('fuss', 13, "text-align:center;font-family:'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif;color:#5e352f;line-height:1.6;padding-top:14px")}">${kt('fuss')}</td></tr>
</table></td></tr></table></td></tr></table></td></tr></table>`;
}
async function briefPDF(a) {   // Der Server setzt den Brief als A4-PDF (Chromium); die Datei wird direkt geladen
  if (!a) return;
  quit('Das PDF wird gesetzt', 'Das dauert einen Moment.', [], false, 15000);
  let r;
  try { r = await fetch('api/brief_pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id }) }); }
  catch (e) { return fehler(new Error('VERBINDUNG · Keine Verbindung. Bitte gleich noch einmal versuchen.')); }
  if (!r.ok) { let d = {}; try { d = await r.json(); } catch (e) { /* */ }
    if (/^DRUCK · /.test(d.fehler || '')) { quit('Druckfenster', 'Dort «Als PDF sichern» wählen. Der Brief steht auf A4 wie im Werkzeug.', [], false, 8000); setTimeout(() => window.print(), 300); return; }
    return fehler(new Error(d.fehler || ('SERVER · Fehler ' + r.status))); }
  const m = /filename\*=UTF-8''([^;]+)/.exec(r.headers.get('Content-Disposition') || ''), name = m ? decodeURIComponent(m[1]) : 'Brief.pdf';
  const url = URL.createObjectURL(await r.blob()), l = document.createElement('a'); l.href = url; l.download = name; document.body.appendChild(l); l.click(); l.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  quit('PDF gesichert', name, [], false, 6000);
}
function verbindeBrief(a) {
  const br = $('#brief'); if (!br) return;
  const e = a.entwurf; e.gestalt = e.gestalt || {};
  let G = e.gestalt;
  S.gesichert = S.gesichert || {};
  G._orig = e.original ? { text: e.original.text, betreff: e.original.betreff } : (G._orig || { text: e.text, betreff: e.betreff });
  if (S.offenNach === a.id) delete S.offenNach; else S.gesichert[a.id] = JSON.stringify([e.betreff, e.text, G]);   // so wie geladen bzw. zuletzt gesichert   // für «Zurück auf die Vorlage»
  const gw = $('#gw', br), stand = $('#gs-stand');
  const V = S.verlauf[a.id] = S.verlauf[a.id] || { hist: [], zukunft: [] };
  let wahl = null, uhr = null, vorher = null;
  const schnapp = () => JSON.stringify({ text: e.text, betreff: e.betreff, gestalt: G });
  const merke = alt => { if (alt && alt !== schnapp()) { V.hist.push(alt); if (V.hist.length > 80) V.hist.shift(); V.zukunft = []; knoepfe(); } };
  const knoepfe = () => { const z = $('.gs-werk [data-w="zurueck"]'), v = $('.gs-werk [data-w="vor"]'); if (z) z.disabled = !V.hist.length; if (v) v.disabled = !V.zukunft.length; };
  const lies = () => {   // DOM → Text des Briefs
    const ab = $$('.gs--p', br).map(textAus).map(x => x.replace(/\n{3,}/g, '\n\n').trim()).filter(Boolean);
    e.text = ab.join('\n\n'); e.betreff = textAus($('.gs--betreff', br)).replace(/\s*\n\s*/g, ' ').trim();
    ['haus', 'zeile', 'fuss'].forEach(k => { const el = $(`[data-b="${k}"]`, br); const t = textAus(el).trim(); if (t !== GKOPF[k]) (G[k] = G[k] || {}).t = t; else if (G[k]) delete G[k].t; });
  };
  const sichern = (sofort = false) => {
    clearTimeout(uhr); if (stand) { stand.textContent = 'Wird gesichert …'; stand.classList.add('laeuft'); }
    const los = async () => {
      const vorText = e.betreff + '\n' + e.text;
      if (br.isConnected) lies();
      if (vorText !== e.betreff + '\n' + e.text && S.de && S.de[a.id] && e.deutsch && !(S.deAlt && S.deAlt[a.id])) {   // Lesefassung ist jetzt veraltet
        S.deAlt = S.deAlt || {}; S.deAlt[a.id] = true;
        const k = $('.re-de__kopf');
        if (k) { k.insertAdjacentHTML('afterend', '<p class="re-de__hinweis">Der Brief wurde seit der Übersetzung geändert. <button class="link" type="button">Neu übersetzen</button></p>'); k.nextElementSibling.querySelector('button').onclick = () => deutschHolen(a); }
      }
      const jetzt = JSON.stringify([e.betreff, e.text, G]);
      if (jetzt === S.gesichert[a.id]) { if (stand) { stand.textContent = 'Gesichert'; stand.classList.remove('laeuft'); } return; }   // nichts Neues: kein Nachsenden, das eine spätere Änderung überschreiben könnte
      try { await api('anfrage', { id: a.id, betreff: e.betreff, entwurf_text: e.text, gestalt: G }); S.gesichert[a.id] = jetzt; S.nachSichern = 0; if (stand) { stand.textContent = 'Gesichert'; stand.classList.remove('laeuft'); } }
      catch (x) { if (stand) stand.textContent = 'Nicht gesichert'; S.nachSichern = (S.nachSichern || 0) + 1; if (/^KONFLIKT/.test(x.message)) { S.nachSichern = 0; return quit('Anderes Fenster war schneller', 'Dieser Brief wurde inzwischen in einem anderen Fenster geändert. Ihre Eingabe ist noch hier.', [['Neu laden', () => frisch(true)]], true, 0); } if (S.nachSichern === 1) fehler(x); if (S.nachSichern <= 5) setTimeout(() => { if (br.isConnected) sichern(true); }, 1500 * S.nachSichern); }
    };
    if (sofort) return los();
    uhr = setTimeout(los, 700);
  };
  S.briefSichern = () => sichern(true);
  const neu = offen => { e.gestalt = G; if (offen) S.offenNach = a.id; neuDetail(a); if (offen && S.briefSichern) S.briefSichern(); };
  const lade = j => { const d = JSON.parse(j); e.text = d.text; e.betreff = d.betreff; G = e.gestalt = d.gestalt; neu(); api('anfrage', { id: a.id, betreff: e.betreff, entwurf_text: e.text, gestalt: G }).catch(fehler); };
  S.briefZurueck = () => { if (!V.hist.length) return; V.zukunft.push(schnapp()); lade(V.hist.pop()); };
  S.briefVor = () => { if (!V.zukunft.length) return; V.hist.push(schnapp()); lade(V.zukunft.pop()); };
  const setze = (el, k) => { const st = gStil(G[k] || {}, el.classList.contains('gs--bild') || el.classList.contains('gs--linie')); el.setAttribute('style', st ? st.slice(8, -1) : ''); };
  const rahmen = () => {
    if (!wahl) { gw.hidden = true; werk(); return; }
    const r = wahl.getBoundingClientRect(), b = br.getBoundingClientRect();
    gw.hidden = false;
    gw.style.transform = `translate(${r.left - b.left - 6}px,${r.top - b.top - 6}px)`;
    gw.style.width = r.width + 12 + 'px'; gw.style.height = r.height + 12 + 'px';
    gw.classList.toggle('gw--unten', r.top - b.top < 70);
    werk();
  };
  const werk = () => {   // feste Leiste oben: was geht mit dem gewählten Teil
    const k = wahl && wahl.dataset.b, g = (k && G[k]) || {}, bild = !!wahl && wahl.classList.contains('gs--bild'), lin = !!wahl && wahl.classList.contains('gs--linie');
    $$('.gs-werk .gs-sel').forEach(b => { const z = b.dataset.g; b.disabled = !wahl || (z === 'schreiben' && !wahl.hasAttribute('data-schreib')) || (z === 'weg' && !bild && !lin) || (bild && /^f-|kleiner|groesser/.test(z)) || (lin && /^f-|schreiben/.test(z)) || (!lin && /^fb-/.test(z)) || (k === 'zeichen' && /^f-/.test(z));
      b.setAttribute('aria-pressed', !!wahl && ((z === 'f-' + (g.f || '')) || z === g.al || (lin && z === 'fb-' + (g.fb || 'taupe')))); });
    const gr = $('#gs-gr'); if (gr) gr.textContent = lin ? (g.st || 1) + ' px' : wahl && !bild ? Math.round((g.s || 1) * 100) + ' %' : '–';
    const n = $('#gs-name'); if (n) n.textContent = wahl ? gName(k) + (wahl.hasAttribute('data-schreib') ? ' · Doppelklick zum Schreiben, ziehen zum Verschieben, Ecken für die Grösse' : ' · ziehen zum Verschieben, Ecken für die Grösse') : 'Klicken Sie im Brief auf einen Teil, um ihn zu gestalten.';
    const gn = $('#gw-name'); if (gn) gn.textContent = wahl ? gName(k) : '';
    seite();
  };
  const waehle = el => { if (el && el !== wahl) S.seiteZu = ''; if (wahl && wahl !== el) { wahl.classList.remove('gs--wahl'); schluss(); } wahl = el; if (el) el.classList.add('gs--wahl'); rahmen(); };
  const schreib = el => {
    if (!el.hasAttribute('data-schreib')) return;
    vorher = vorher || schnapp();
    el.contentEditable = 'true'; el.classList.add('gs--schreib'); el.focus();
    const sel = getSelection(); if (sel && !el.contains(sel.anchorNode)) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
  };
  const schluss = () => { $$('.gs--schreib', br).forEach(x => { x.contentEditable = 'false'; x.classList.remove('gs--schreib'); }); if (vorher) { lies(); merke(vorher); vorher = null; } };
  /* Hilfslinien und Einrasten (wie L’Imprimerie: Kanten und Mitten von Papier und anderen Teilen, 7 px; Alt hält das Einrasten aus) */
  const linien = l => { $$('.hl', br).forEach(n => n.remove()); const b = br.getBoundingClientRect();
    l.forEach(x => { const n = document.createElement('i'); n.className = 'hl ' + (x.x != null ? 'hl--x' : 'hl--y'); n.style.transform = x.x != null ? `translateX(${x.x - b.left}px)` : `translateY(${x.y - b.top}px)`; br.appendChild(n); }); };
  const fang = (el, r) => {
    const b = br.getBoundingClientRect(), cs = getComputedStyle(br), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
    const gx = [b.left + pl, b.left + b.width / 2, b.right - pr], gy = [];
    $$('.gs', br).forEach(o => { if (o === el) return; const q = o.getBoundingClientRect(); gx.push(q.left, q.left + q.width / 2, q.right); gy.push(q.top, q.top + q.height / 2, q.bottom); });
    const best = (werte, kand) => { let bd = 7, bv = null, bk = null; for (const w of werte) for (const k of kand) { const d = Math.abs(w - k); if (d < bd) { bd = d; bv = k - w; bk = k; } } return bv === null ? null : { d: bv, k: bk }; };
    const sx = best([r.left, r.left + r.width / 2, r.right], gx), sy = best([r.top, r.top + r.height / 2, r.bottom], gy);
    return { dx: sx ? sx.d : 0, dy: sy ? sy.d : 0, l: [...(sx ? [{ x: sx.k }] : []), ...(sy ? [{ y: sy.k }] : [])] };
  };
  $$('.gs', br).forEach(el => {
    el.addEventListener('input', () => { rahmen(); sichern(); });
    el.addEventListener('blur', () => { if (el.isContentEditable) setTimeout(() => { if (document.activeElement !== el) { schluss(); rahmen(); } }, 0); });
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { el.blur(); schluss(); waehle(null); }
      if (ev.key === 'Enter' && !ev.shiftKey && el.dataset.b === 'betreff') ev.preventDefault();
      if (ev.key === 'Enter' && !ev.shiftKey && el.classList.contains('gs--p')) { ev.preventDefault(); document.execCommand('insertLineBreak'); }
    });
    el.addEventListener('paste', ev => { ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain')); });
    el.addEventListener('dblclick', () => { waehle(el); schreib(el); rahmen(); });
    el.addEventListener('pointerdown', ev => {
      if (el.isContentEditable || ev.button !== 0) return;
      ev.preventDefault();
      const k = el.dataset.b, g = G[k] = G[k] || {}, x0 = ev.clientX, y0 = ev.clientY, dx0 = g.dx || 0, dy0 = g.dy || 0, alt = schnapp();
      const b = br.getBoundingClientRect(), r = el.getBoundingClientRect();
      let zog = false;
      const zug = mv => {
        let dx = mv.clientX - x0, dy = mv.clientY - y0;
        if (!zog && Math.hypot(dx, dy) < 4) return;
        if (!zog) { zog = true; waehle(el); br.classList.add('zieht'); }
        let f = { dx: 0, dy: 0, l: [] };
        if (!mv.altKey) f = fang(el, { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy, width: r.width, height: r.height });
        dx += f.dx; dy += f.dy;
        g.dx = Math.round(Math.max(b.left - r.left + dx0 + 8, Math.min(b.right - r.right + dx0 - 8, dx0 + dx)));
        g.dy = Math.round(Math.max(b.top - r.top + dy0 + 8, Math.min(b.bottom - r.bottom + dy0 - 8, dy0 + dy)));
        el.style.setProperty('--dx', g.dx + 'px'); el.style.setProperty('--dy', g.dy + 'px'); rahmen(); linien(f.l);
      };
      const los = () => {
        removeEventListener('pointermove', zug); removeEventListener('pointerup', los); br.classList.remove('zieht'); linien([]);
        if (zog) { merke(alt); return sichern(); }
        if (wahl === el) { schreib(el); rahmen(); } else waehle(el);
      };
      addEventListener('pointermove', zug); addEventListener('pointerup', los);
    });
  });
  // Ecken: Grösse (Schrift bzw. Foto) · Seiten: Breite; rastet an Kanten und Mitten ein
  $$('[data-h]', gw).forEach(h => h.addEventListener('pointerdown', ev => {
    if (!wahl) return; ev.preventDefault(); ev.stopPropagation();
    const el = wahl, k = el.dataset.b, g = G[k] = G[k] || {}, x0 = ev.clientX, s0 = g.s || 1, r = el.getBoundingClientRect(), w0 = r.width, art = h.dataset.h, alt = schnapp();
    const links = art === 'w' || art === 'nw' || art === 'sw';
    const zug = mv => {
      let d = (mv.clientX - x0) * (links ? -1 : 1), l = [];
      if (!mv.altKey) { const kante = links ? r.left - d : r.right + d; const f = fang(el, { left: kante, right: kante, top: -1e5, bottom: -1e5, width: 0, height: 0 }); if (f.dx) { d += links ? -f.dx : f.dx; l = f.l.filter(x => x.x != null); } }
      if (art === 'w' || art === 'e' || el.classList.contains('gs--bild') || el.classList.contains('gs--linie')) { g.w = Math.round(Math.max(60, Math.min(br.clientWidth - 40, w0 + d))); }
      else { g.s = Math.round(Math.max(.3, Math.min(3.2, s0 * (w0 + d) / w0)) * 100) / 100; }
      setze(el, k); rahmen(); linien(l);
    };
    const los = () => { removeEventListener('pointermove', zug); removeEventListener('pointerup', los); linien([]); merke(alt); sichern(); };
    addEventListener('pointermove', zug); addEventListener('pointerup', los);
  }));
  $$('.gs-werk [data-g]').forEach(b => { b.onpointerdown = ev => ev.stopPropagation(); b.onclick = () => {
    if (!wahl) return; const k = wahl.dataset.b, g = G[k] = G[k] || {}, z = b.dataset.g, alt = schnapp();
    if (z === 'schreiben') return schreib(wahl);
    if (wahl.classList.contains('gs--linie') && (z === 'groesser' || z === 'kleiner')) { g.st = Math.max(1, Math.min(8, (g.st || 1) + (z === 'groesser' ? 1 : -1))); setze(wahl, k); rahmen(); merke(alt); return sichern(); }
    if (z.startsWith('fb-')) g.fb = z.slice(3);
    if (z === 'weg' && wahl.classList.contains('gs--linie')) { g.aus = true; merke(alt); return neu(true); }
    if (z === 'groesser') g.s = Math.min(3.2, Math.round((g.s || 1) * 1.1 * 100) / 100);
    if (z === 'kleiner') g.s = Math.max(.3, Math.round((g.s || 1) / 1.1 * 100) / 100);
    if (z === 'left' || z === 'center' || z === 'right') g.al = z;
    if (z.startsWith('f-')) g.f = z.slice(2);
    if (z === 'weiter') g.mb = Math.min(160, (g.mb || 0) + 8);
    if (z === 'enger') g.mb = Math.max(-40, (g.mb || 0) - 8);
    if (z === 'zurueck') { const t = g.t; G[k] = typeof t === 'string' ? { t } : {}; }
    if (z === 'weg') { G._bilder = (G._bilder || []).filter(x => x.id !== k); delete G[k]; merke(alt); return neu(true); }
    setze(wahl, k); rahmen(); merke(alt); sichern();
  }; });
  // Leiste über dem Brief
  $$('.gs-werk [data-w]').forEach(b => b.onclick = () => {
    const w = b.dataset.w;
    if (w === 'zurueck') return S.briefZurueck();
    if (w === 'vor') return S.briefVor();
    if (w === 'vorlage') return fenster(`<h2>Zurück auf <em>die Vorlage?</em></h2><p>Text, Anordnung und eingefügte Fotos werden wieder so, wie der Assistent den Brief geschrieben hat. Mit «Rückgängig» holen Sie Ihre Fassung zurück.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Zurück auf die Vorlage<i>${SYM.haken}</i></button></div>`, true, () => {
        fensterZu(); const alt = schnapp(), o = G._orig; e.text = o.text; e.betreff = o.betreff; G = e.gestalt = { _orig: o }; merke(alt); neu(true); quit('Zurück auf der Vorlage', '', [], false, 3000); });
    if (w === 'foto') {
      return fenster(`<h2>Foto <em>einfügen.</em></h2><p>Ein Foto des Hauses für diesen Brief. Es kommt unter ${wahl && /^p\d+$/.test(wahl.dataset.b) ? 'den gewählten Absatz' : 'den Text vor dem Gruss'}; danach können Sie es verschieben und an den Ecken grösser oder kleiner ziehen.</p>
        <div class="gs-fotos">${BRIEFBILDER.map(([k, n]) => `<button type="button" data-foto="${k}"><img src="../../assets/img/${k}-480.webp" alt="" loading="lazy"><span>${esc(n)}</span></button>`).join('')}</div>`, false);
    }
  });
  document.addEventListener('click', S.fotoKlick || (S.fotoKlick = ev => {
    const f = ev.target.closest && ev.target.closest('.gs-fotos [data-foto]'); if (!f || !S.fotoZiel) return; S.fotoZiel(f.dataset.foto, f.querySelector('span').textContent);
  }));
  S.fotoZiel = (k, n) => {
    const nach = wahl && /^p\d+$/.test(wahl.dataset.b) ? wahl.dataset.b : wahl && wahl.dataset.b === 'betreff' ? 'kopf' : 'p' + Math.max(0, $$('.gs--p', br).length - 2);
    const alt = schnapp(), id = 'bild' + Date.now().toString(36);
    G._bilder = (G._bilder || []).concat([{ id, k, n, nach }]); G[id] = { w: Math.round(br.clientWidth * .62), al: 'center' };
    fensterZu(); merke(alt); neu(true);
    requestAnimationFrame(() => { const el = $(`[data-b="${id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  };
  br.addEventListener('pointerdown', ev => { if (!ev.target.closest('.gs') && !ev.target.closest('#gw')) { schluss(); waehle(null); } });
  if (S.briefAussen) document.removeEventListener('pointerdown', S.briefAussen);
  document.addEventListener('pointerdown', S.briefAussen = ev => { if (!br.isConnected) return; if (!wahl && !br.querySelector('[contenteditable="true"]')) return; if (!br.contains(ev.target) && !ev.target.closest('#fenster') && !ev.target.closest('.gs-werk') && !ev.target.closest('#gs-seite')) { schluss(); waehle(null); } });
  if (S.briefTasten) document.removeEventListener('keydown', S.briefTasten);
  document.addEventListener('keydown', S.briefTasten = ev => {
    if (!br.isConnected || !$('#fenster').hidden) return;
    const inFeld = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    const cmd = ev.metaKey || ev.ctrlKey;
    if (cmd && ev.key.toLowerCase() === 'z' && !inFeld) { ev.preventDefault(); return ev.shiftKey ? S.briefVor() : S.briefZurueck(); }
    if (ev.key === 'Escape' && wahl && !inFeld && $('#gs-seite') && !$('#gs-seite').hidden) { S.seiteZu = wahl.dataset.b; return seite(); }
    if (inFeld || !wahl) return;
    const k = wahl.dataset.b, g = G[k] = G[k] || {};
    const sch = ev.shiftKey ? 10 : 1, p = { ArrowLeft: [-sch, 0], ArrowRight: [sch, 0], ArrowUp: [0, -sch], ArrowDown: [0, sch] }[ev.key];
    if (p) { ev.preventDefault(); const alt = schnapp(); g.dx = (g.dx || 0) + p[0]; g.dy = (g.dy || 0) + p[1]; setze(wahl, k); rahmen(); merke(alt); sichern(); }
    if ((ev.key === 'Backspace' || ev.key === 'Delete') && (wahl.classList.contains('gs--bild') || wahl.classList.contains('gs--linie'))) { ev.preventDefault(); $('.gs-werk [data-g="weg"]').click(); }
    if (ev.key === 'Enter' && wahl.hasAttribute('data-schreib')) { ev.preventDefault(); schreib(wahl); }
  });
  /* Seitenleiste «Gestalten» rechts (Robert 16.10.2026: «so ein kleines Side-Menü … was sich öffnet»; gleich in La Carte und L’Imprimerie):
     öffnet sich beim Wählen, schliesst mit × oder Esc, das Dokument rückt nach links. Detail-Einstellungen hier, die Leiste oben bleibt. */
  let altS = null;
  const seite = () => {
    let p = $('#gs-seite');
    if (!wahl || !br.isConnected || S.seiteZu === wahl.dataset.b) { if (p) p.hidden = true; document.body.classList.remove('gs-seite-offen'); return; }
    if (!p) { p = document.createElement('aside'); p.id = 'gs-seite'; p.className = 'gs-seite'; p.setAttribute('aria-label', 'Gestalten'); document.body.appendChild(p); }
    p.hidden = false; document.body.classList.add('gs-seite-offen');
    const el = wahl; if (innerWidth <= 1100) requestAnimationFrame(() => {   // zwischen die Werkzeugleiste oben (klebt) und das Blatt unten; ist der Teil höher als die Lücke, zählt sein oberer Rand
      if (!el || !el.isConnected || p.hidden) return;
      const r = el.getBoundingClientRect(), oben = p.getBoundingClientRect().top - 14, w = $('.gs-werk'), u = Math.max(w ? w.getBoundingClientRect().bottom : 0, 70) + 14;
      let d = r.bottom > oben ? r.bottom - oben : 0; if (r.top - d < u) d = r.top - u; if (Math.abs(d) > 2) scrollBy({ top: d, behavior: 'instant' }); });
    const sp = $('.re-spalte'); if (sp && innerWidth > 1180) { const rr = sp.getBoundingClientRect(); p.style.left = Math.round(rr.left) + 'px'; p.style.width = Math.round(Math.max(300, rr.width)) + 'px'; p.style.right = 'auto'; } else { p.style.left = ''; p.style.width = ''; p.style.right = ''; }
    const k = wahl.dataset.b, g = G[k] || {}, bild = wahl.classList.contains('gs--bild'), lin = wahl.classList.contains('gs--linie'), text = !bild && !lin && k !== 'zeichen';
    const schreibbar = wahl.hasAttribute('data-schreib');
    const cs = getComputedStyle(wahl), fs = parseFloat(cs.fontSize) || 16, lh = g.lh || Math.round((parseFloat(cs.lineHeight) / fs || 1.4) * 20) / 20;
    const pt = Math.round(fs * .75 * 2) / 2, ls = g.ls != null ? g.ls : Math.round((parseFloat(cs.letterSpacing) || 0) / fs * 100) / 100, op = g.op != null ? g.op : 1;
    const r = wahl.getBoundingClientRect();
    /* Aufbau wie die Gestalten-Platte in L’Imprimerie (studio.js zeichneEigenschaften): Titel = Art, Gruppen mit Mono-Label, Segmente, runde Marine-Knöpfe, Regler mit Wert */
    const an = x => x ? ' an' : '';
    const kn = (z, v, inhalt, aktiv, tip = '', aus = false) => `<button type="button" class="${aktiv ? 'an' : ''}" data-s="${z}" data-v="${v}" aria-pressed="${!!aktiv}"${tip ? ` title="${tip}" aria-label="${tip}"` : ''}${aus ? ' disabled' : ''}>${inhalt}</button>`;
    const gruppe = (t, inhalt) => `<div class="gs-gruppe"><span class="gs-gruppe__t">${t}</span>${inhalt}</div>`;
    const regler = (z, wert, min, max, schritt, anzeige) => `<div class="gs-regler"><input type="range" data-s="${z}" min="${min}" max="${max}" step="${schritt}" value="${wert}"><output>${anzeige}</output></div>`;
    const groesse = (z, wert, min, max, schritt, einheit) => `<div class="gs-groesse">${kn(z, -schritt, '−', false, 'Kleiner')}<input type="number" data-s="${z}" min="${min}" max="${max}" step="${schritt}" value="${wert}"><span>${einheit}</span>${kn(z, schritt, '+', false, 'Grösser')}</div>`;
    const farben = (z, wert, std) => `<div class="gs-farben">${Object.entries(HFARBE).map(([v, c]) => `<button type="button" class="${(wert || std) === v ? 'an' : ''}" data-s="${z}" data-v="${v}" style="background:${c}" title="${HNAME[v] || v}" aria-label="${HNAME[v] || v}"></button>`).join('')}</div>`;
    const seg = (inhalt, extra = '') => `<div class="gs-seg${extra}">${inhalt}</div>`;
    const ausr = () => seg([['left', 'Links'], ['center', 'Mitte'], ['right', 'Rechts']].map(([v, t]) => kn('al', v, t, (g.al || (k === 'haus' || k === 'zeile' || k === 'fuss' ? 'center' : 'left')) === v)).join(''));
    const lage = (breite) => `<div class="gs-lage"><label><span>Links</span><input type="number" data-s="dx" step="1" value="${g.dx || 0}"></label><label><span>Oben</span><input type="number" data-s="dy" step="1" value="${g.dy || 0}"></label><label><span>${breite}</span><input type="number" data-s="wl" min="40" step="2" value="${Math.round(r.width)}"></label><em>px</em></div>`;
    const anordnen = (weg) => `<div class="gs-anordnen">${kn('mitte', '', 'Waagrecht mittig')}${kn('vorn', '', 'Nach vorn')}${kn('hinten', '', 'Nach hinten')}</div>`;
    const ART = bild ? 'Foto' : lin ? 'Linie' : k === 'zeichen' ? 'Zeichen' : 'Text';
    let h = `<header><span class="gs-gruppe__t">Gestalten</span><h2>${esc(gName(k))}</h2><button class="gs-seite__zu" type="button" data-s="zu" data-v="" aria-label="Schliessen">${ZU}</button></header><div class="gs-seite__inhalt">`;
    if (text) {
      const fam = g.f === 'versal' ? 'cinzel' : (g.f || (k === 'haus' ? 'cinzel' : k === 'zeile' || k === 'fuss' ? 'mono' : 'serif'));
      h += gruppe('Schriftart', seg([['serif', 'Petrona', 'var(--serif)'], ['cinzel', 'Versalien', 'var(--caps)'], ['sans', 'Instrument Sans', 'var(--sans)'], ['mono', 'DM Mono', 'var(--mono)']].map(([v, n, f]) => kn('f', v, `<span style="font-family:${f}">${n}</span>`, fam === v)).join(''), ' gs-seg--schrift'));
      const ta = g.ta || (g.f === 'versal' || /uppercase/.test(cs.textTransform) ? 'versal' : 'normal');
      h += gruppe('Schriftgrösse', groesse('pt', pt, 4, 72, .5, 'pt') + regler('pt', pt, 4, 72, .5, pt.toString().replace('.', ',') + ' pt'));
      h += gruppe('Textart', seg([['normal', 'Normal'], ['kursiv', 'Kursiv'], ['versal', 'Versalien gesperrt']].map(([v, n]) => kn('ta', v, n, ta === v, '', v === 'kursiv' && fam !== 'sans')).join('')));
      h += gruppe('Farbe', farben('c', g.c, ''));
      h += gruppe('Ausrichtung', ausr());
      h += gruppe('Abstände', `<div class="gs-lage gs-lage--zwei"><label><span>Davor</span><input type="number" data-s="mt" min="-60" max="200" step="2" value="${g.mt || 0}"></label><label><span>Danach</span><input type="number" data-s="mb" min="-60" max="200" step="2" value="${g.mb || 0}"></label><em>px</em></div>`);
      if (schreibbar) h += gruppe('Inhalt', `<textarea class="gs-inhalt" data-s="inhalt" rows="${Math.min(8, Math.max(2, Math.ceil(textAus(wahl).length / 34)))}" dir="auto">${esc(textAus(wahl))}</textarea>`);
      h += gruppe('Feinheiten', regler('ls', ls, 0, .5, .01, 'Sperrung ' + ls.toFixed(2).replace('.', ',')) + regler('lh', lh, 1, 2.4, .05, 'Zeile ' + lh.toFixed(2).replace('.', ',')) + regler('op', op, .1, 1, .05, 'Deckkraft ' + Math.round(op * 100) + ' %'));
      h += gruppe('Lage', lage('Breite'));
      h += gruppe('Anordnen', anordnen(false));
    }
    if (k === 'zeichen') {
      h += gruppe('Grösse', groesse('pz', Math.round((g.s || 1) * 100), 30, 320, 10, '%'));
      h += gruppe('Feinheiten', regler('op', op, .1, 1, .05, 'Deckkraft ' + Math.round(op * 100) + ' %'));
      h += gruppe('Lage', lage('Breite'));
      h += gruppe('Anordnen', anordnen(false));
    }
    if (lin) {
      const st = g.st || 1;
      h += gruppe('Stärke', groesse('stp', st * .75, .75, 6, .75, 'pt'));
      h += gruppe('Länge', lage('Länge'));
      h += gruppe('Farbe', farben('fb', g.fb, 'taupe'));
      h += gruppe('Feinheiten', regler('op', op, .1, 1, .05, 'Deckkraft ' + Math.round(op * 100) + ' %'));
      h += gruppe('Ausrichtung', ausr());
      h += gruppe('Anordnen', anordnen(false));
    }
    if (bild) {
      h += gruppe('Grösse', regler('wl', Math.round(r.width), 80, br.clientWidth - 40, 2, Math.round(r.width) + ' px'));
      h += gruppe('Ausschnitt', seg([['', 'Ganz'], ['4/3', '4:3'], ['1/1', '1:1'], ['16/9', '16:9'], ['3/4', '3:4']].map(([v, n]) => kn('ar', v, n, (g.ar || '') === v)).join(''))
        + (g.ar ? regler('ox', g.ox == null ? 50 : g.ox, 0, 100, 1, 'waagrecht') + regler('oy', g.oy == null ? 50 : g.oy, 0, 100, 1, 'senkrecht') : ''));
      h += gruppe('Feinheiten', regler('op', op, .1, 1, .05, 'Deckkraft ' + Math.round(op * 100) + ' %'));
      h += gruppe('Lage', lage('Breite'));
      h += gruppe('Ausrichtung', ausr());
      h += gruppe('Anordnen', anordnen(false));
    }
    h += `</div><footer>${kn('zurueck', '', 'Teil zurücksetzen')}${bild || lin ? kn('weg', '', 'Entfernen').replace('class=""', 'class="rot"') : ''}</footer>`;
    p.innerHTML = h;
    const fertig = () => { setze(wahl, k); rahmen(); };
    p.onpointerdown = () => { altS = schnapp(); };
    p.onfocusin = () => { if (!altS) altS = schnapp(); };
    p.onclick = ev => {
      const b = ev.target.closest('button[data-s]'); if (!b || b.disabled) return;
      const z = b.dataset.s, v = b.dataset.v, alt = altS || schnapp(); altS = null;
      const gg = G[k] = G[k] || {};
      if (z === 'zu') { S.seiteZu = k; return seite(); }
      if (z === 'weg') return $('.gs-werk [data-g="weg"]').click();
      if (z === 'zurueck') { const t = gg.t; G[k] = typeof t === 'string' ? { t } : {}; }
      if (z === 'f') { gg.f = v; if (v !== 'sans' && gg.ta === 'kursiv') delete gg.ta; }
      if (z === 'ta') gg.ta = v;
      if (z === 'c') gg.c = v;
      if (z === 'fb') gg.fb = v;
      if (z === 'al') gg.al = v;
      if (z === 'ar') { if (v) gg.ar = v; else { delete gg.ar; delete gg.ox; delete gg.oy; } }
      if (z === 'pt') { const neu = Math.max(4, pt + +v) / .75; gg.s = Math.round(neu / (fs / (g.s || 1)) * 1000) / 1000; }
      if (z === 'pz') gg.s = Math.max(.3, Math.min(3.2, Math.round(((gg.s || 1) * 100 + +v)) / 100));
      if (z === 'stp') gg.st = Math.max(1, Math.min(8, Math.round(((gg.st || 1) * .75 + +v) / .75)));
      if (z === 'mitte') { gg.dx = 0; gg.al = 'center'; }
      if (z === 'vorn') gg.z = (gg.z || 0) + 1;
      if (z === 'hinten') gg.z = (gg.z || 0) - 1;
      fertig(); merke(alt); sichern(); seite();
    };
    p.oninput = ev => {
      const el = ev.target, z = el.dataset.s; if (!z) return;
      const gg = G[k] = G[k] || {};
      if (z === 'inhalt') { wahl.innerHTML = feldHTML(el.value); rahmen(); return sichern(); }
      const v = parseFloat(el.value); if (isNaN(v)) return;
      const out = el.parentElement.querySelector('output');
      if (z === 'pt') { gg.s = Math.round(Math.max(4, v) / .75 / (fs / (g.s || 1)) * 1000) / 1000; $$('[data-s="pt"]', p).forEach(x => { if (x !== el && x.tagName === 'INPUT') x.value = v; }); const o = $('.gs-regler output', p); if (o && el.type === 'range') o.textContent = String(v).replace('.', ',') + ' pt'; }
      if (z === 'pz') gg.s = Math.max(.3, Math.min(3.2, v / 100));
      if (z === 'stp') gg.st = Math.max(1, Math.min(8, Math.round(v / .75)));
      if (z === 'ls') { gg.ls = v; if (out) out.textContent = 'Sperrung ' + v.toFixed(2).replace('.', ','); }
      if (z === 'lh') { gg.lh = v; if (out) out.textContent = 'Zeile ' + v.toFixed(2).replace('.', ','); }
      if (z === 'op') { gg.op = v; if (out) out.textContent = 'Deckkraft ' + Math.round(v * 100) + ' %'; }
      if (z === 'wl') { gg.w = Math.max(40, Math.round(v)); if (out) out.textContent = Math.round(v) + ' px'; }
      if (z === 'ox' || z === 'oy') gg[z] = v;
      if (z === 'dx' || z === 'dy' || z === 'mt' || z === 'mb') gg[z] = Math.round(v);
      fertig();
    };
    p.onchange = ev => { if (ev.target.dataset.s === 'inhalt') { lies(); } merke(altS); altS = null; sichern(); };
  };
  knoepfe(); werk();
  addEventListener('resize', rahmen);
}
/* Auf Deutsch lesen (Robert 16.10.2026, zum arabischen Brief: «der Mitarbeiter … hat ja gar keine Ahnung, was da jetzt steht … zumindest sehen,
   wie das übersetzt aussieht, bevor er es abschickt»). Lesefassung unter dem Brief, ändert ihn nicht; Gespräch ebenfalls auf Deutsch.
   Beispiele bringen ihre Fassung mit, sonst übersetzt der Assistent (rezeption.uebersetzen, gespeichert bis der Brief geändert wird). */
function deutschBlatt(a) {
  const e = a.entwurf, d = e && e.deutsch, sp = SPRACHE[a.sprache] || a.sprache;
  if (S.deLaedt && S.deLaedt[a.id]) return `<div class="re-de"><div class="lade"><div class="lade__r"></div><b>Wird übersetzt …</b><span class="leise">Der Assistent übersetzt Brief und Gespräch ins Deutsche. Das dauert einen Moment.</span></div></div>`;
  if (!d) return `<div class="re-de"><p class="re-de__hinweis">Noch keine Übersetzung. <button class="link" type="button" data-akt="deutsch-neu">Jetzt übersetzen</button></p></div>`;
  const vd = a.verlauf_de || [];
  return `<div class="re-de">
      <div class="re-de__band"><b>Lesefassung auf Deutsch</b><span>Nur zum Mitlesen. Verschickt wird der Brief auf ${esc(sp)}. Zum Bearbeiten «Deutsch ausblenden».</span></div>
      <div class="re-de__kopf"><span class="mono">Betreff</span></div>
      ${S.deAlt && S.deAlt[a.id] ? `<p class="re-de__hinweis">Der Brief wurde seit der Übersetzung geändert. <button class="link" type="button" data-akt="deutsch-neu">Neu übersetzen</button></p>` : ''}
      <b class="re-de__betreff">${esc(d.betreff)}</b>
      <div class="re-de__text">${briefText(d.text)}</div>
      ${vd.length ? `<details class="re-de__gespraech"><summary>${a.web ? 'Die Nachricht auf Deutsch' : 'Das Gespräch im Chat auf Deutsch'}</summary>${(a.verlauf || []).map((v, i) => vd[i] ? `<p class="${v.rolle === 'user' ? 'gast' : 'haus'}"><small>${v.rolle === 'user' ? 'Gast' : 'Chat des Hauses'}</small>${esc(vd[i])}</p>` : '').join('')}</details>` : ''}
    </div>`;
}
async function deutschHolen(a) {
  S.deLaedt = S.deLaedt || {}; S.deAlt = S.deAlt || {};
  S.deLaedt[a.id] = true; neuDetail(a);
  try {
    const q = (a.entwurf.deutsch || {}).quelle;
    const d = await api('uebersetzen', { id: a.id });
    a.entwurf.deutsch = d.deutsch; a.verlauf_de = d.verlauf_de;
    S.deAlt[a.id] = false; void q;
  } catch (x) { fehler(x); }
  delete S.deLaedt[a.id];
  if (S.ansicht === 'eingang' && S.wahl === a.id) neuDetail(a);
}
/* Hinweise fürs Team (Server: reception.hinweise): geschlossen, Ferien, Gruppe und Festsaal, Allergien, vegan, Hund. Nur aus Angaben des Hauses gerechnet. */
const HINW_ZEICHEN = { ruhetag: 'uhr', ferien: 'uhr', gruppe: 'haus', allergie: 'blatt', vegan: 'blatt', hund: 'haus' };
function hinweise(a) {
  const h = a.hinweise || [];
  return h.length ? `<ul class="re-hinw" aria-label="Hinweise">${h.map(x => `<li class="re-hinw__p re-hinw--${esc(x.art)}">${WO.ic(HINW_ZEICHEN[x.art] || 'mail')}<span>${esc(x.text)}</span></li>`).join('')}</ul>` : '';
}
const hinwKurz = a => (a.hinweise || []).map(x => ({ ruhetag: 'Geschlossen', ferien: 'Ferien', gruppe: 'Gruppe', allergie: 'Allergien', vegan: 'Vegan', hund: 'Hund' }[x.art])).filter(Boolean);
function detail(a) {
  const e = a.entwurf, laeuft = S.schreibt[a.id], bearb = S.bearbeiten === a.id, offen = e ? (e.text.match(KLAMMER) || []).length : 0;
  /* Robert 20.10.2026: «super unübersichtlich … nicht richtig formatiert»: drei ruhige Gruppen statt einer Wand aus Feldern (Wann und wie viele · Gast · Woher) */
  const datumKurz = String(a.datum || '').replace(/,?\s*\d{1,2}:\d{2}\s*Uhr$/, '');
  const angaben = { wann: [['Datum', esc(datumKurz || 'nicht genannt')], ['Zeit', esc(a.uhrzeit || ((String(a.datum || '').match(/\d{1,2}:\d{2}/) || [''])[0] ? (String(a.datum).match(/\d{1,2}:\d{2}/)[0] + ' Uhr') : 'nicht genannt'))], ['Personen', esc(a.personen || 'nicht genannt')]].concat(a.platz ? [['Platz', esc(a.platz)]] : []),   // Schäfli: Platz nur, wenn der Gast ihn gewählt hat (Festsaal)
    gast: [['Kontakt', kontaktLink(a.kontakt)], ['Sprache', esc(SPRACHE[a.sprache] || a.sprache)], ['Für die Küche', (a.allergene_lang || []).length ? esc(a.allergene_lang.join(', ')) : 'keine angegeben']],
    woher: (a.web ? esc(FORMULAR[a.formular] || 'Formular') + ' · Website' + (a.seite_name ? ', Seite ' + esc(a.seite_name) : '') : 'Chat der Website') + ' · bei ' + esc(abt(a)) };
  /* Was der Gast selbst geschrieben hat (Wünsche), statt des Sammeltitels als Zitat; Formular-Felder als saubere Liste statt als Rohtext */
  const felder = a.web ? String(a.nachricht || '').split('\n').map(z => z.match(/^([^:]{2,40}):\s*(.*)$/)).filter(Boolean).map(m => [m[1].trim(), m[2].trim()]) : [];
  const eigen = felder.filter(([k]) => /wünsche|ihr anlass|ihre nachricht|ein paar worte|grussbotschaft/i.test(k)).map(([, v]) => v).filter(Boolean).join(' ');
  const zitat = a.web ? eigen : a.anliegen;
  const rtl = a.sprache === 'ar' ? ' dir="rtl"' : '';
  const team = e && e.team ? e.team.split('\n').map(x => x.trim()).filter(Boolean) : [];
  const fremd = !!a.sprache && a.sprache !== 'de', de = !!(S.de && S.de[a.id]);
  return `<section class="re-d re-auf" style="--i:0">
      <div class="re-d__kopf">${bild(a.art, 're-d__bild', a.id)}
        <div class="re-d__n"><span class="re-d__k">${esc(ART_LANG[a.art] || a.art)}${abt(a) !== ART[a.art] ? ' · ' + esc(abt(a)) : ''} · ${esc(zeit(a.zeit))}${a.beispiel ? ' · Beispiel' : a.probe ? ' · Probe' : ''}</span><h2><bdi>${esc(a.name || 'Ohne Namen')}</bdi></h2></div>
        <div class="re-d__kn"><button class="rund" type="button" data-akt="weg" data-tip="Löschen" aria-label="Anfrage löschen">${SYM.korb}</button>
        <button class="kn kn--klein${a.status === 'erledigt' ? ' kn--linie' : ' kn--gold'}" type="button" data-akt="${a.status === 'erledigt' ? 'offen' : 'erledigt'}">${a.status === 'erledigt' ? 'Wieder offen' : 'Erledigt'}<i>${SYM.haken}</i></button></div></div>
      <p class="re-woher mono">${angaben.woher}</p>
      <dl class="re-angaben re-angaben--wann${angaben.wann.length === 3 ? ' re-angaben--drei' : ''}">${angaben.wann.map(([k, v]) => `<div><dt>${k}</dt><dd dir="auto">${v}</dd></div>`).join('')}</dl>
      <dl class="re-angaben re-angaben--gast">${angaben.gast.map(([k, v]) => `<div><dt>${k}</dt><dd dir="auto">${v}</dd></div>`).join('')}</dl>
      ${hinweise(a)}
      ${zitat ? `<blockquote class="re-anliegen" dir="auto">${esc(zitat)}</blockquote>` : ''}
      <details class="re-gespraech"><summary><span>${a.web ? 'Die Nachricht über die Website' : 'Das Gespräch im Chat'}</span><i>${a.web && felder.length ? felder.length + ' Angaben' : mal((a.verlauf || []).length, 'eine Nachricht', 'Nachrichten')}</i></summary><div class="re-gespraech__l">${a.web && felder.length ? `<div class="re-formular"><p class="re-formular__k mono">${esc(FORMULAR[a.formular] || 'Formular')}${a.seite_name ? ' · Seite ' + esc(a.seite_name) : ''}</p><dl>${felder.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd dir="auto">${esc(v) || '–'}</dd></div>`).join('')}</dl></div>` : ''}${(a.web && felder.length ? [] : a.verlauf || []).map(v => `<p class="${v.rolle === 'user' ? 'gast' : 'haus'}" dir="auto"><small>${v.rolle === 'user' ? 'Gast' : 'Chat des Hauses'}</small>${esc(v.text).replace(/\n/g, '<br>')}</p>`).join('')}</div></details>
    </section>
    <section class="re-post re-auf" style="--i:1">
      <div class="re-post__kopf"><div><span class="mono">Antwort an den Gast</span><h2>Der <em>Brief</em></h2></div>
        ${e && !laeuft && fremd ? `<button class="kn kn--klein ${de ? 'kn--gold' : 'kn--linie'} re-de-kn" type="button" data-akt="deutsch">${de ? 'Deutsch ausblenden' : 'Auf Deutsch lesen'}<i>${SYM.buch}</i></button>` : ''}
        ${e && !laeuft ? `<div class="wahl2 re-modus" role="group" aria-label="Ansicht"><button type="button" data-akt="lesen" aria-pressed="${!bearb}">Gestalten</button><button type="button" data-akt="bearbeiten" aria-pressed="${bearb}">Nur Text</button></div>` : ''}</div>
      ${laeuft ? `<div class="brief brief--lade"><div class="lade"><div class="lade__r"></div><b>Der Brief wird geschrieben.</b><span class="leise">Der Assistent liest die Anfrage, die Fragen aus Ihren Mail-Links und die Karten des Hauses. Das dauert einen Moment.</span></div></div>`
      : e ? `${bearb ? textBrief(a, e, rtl) : fremd && de ? deutschBlatt(a) : gestaltBrief(a, e, rtl)}
        <div class="re-post__unten">
          <aside class="re-notiz">
            <span class="mono">Vor dem Senden</span>
            <b>${offen ? mal(offen, 'Eine Stelle', 'Stellen') + ' im Brief ' + (offen === 1 ? 'ist' : 'sind') + ' offen' : 'Der Brief ist vollständig'}</b>
            <p>${offen ? 'Die gold markierten Felder füllt Ihr Team aus, zum Beispiel Preise, Zeiten oder ob ein Raum frei ist.' : 'Lesen Sie ihn einmal durch. Danach als PDF speichern oder den Text kopieren.'}</p>
            ${team.length ? `<ul>${team.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          </aside>
          <div class="re-post__kn">
            <button class="kn kn--gold" type="button" data-akt="pdf">Als PDF speichern<i>${SYM.post}</i></button>
            <button class="kn" type="button" data-akt="kopieren">Text kopieren<i>${SYM.kopie}</i></button>
            ${bearb ? `<button class="kn kn--linie" type="button" data-akt="sichern">Änderung sichern<i>${SYM.haken}</i></button>` : ''}
            <button class="link" type="button" data-akt="neu">Neu schreiben lassen</button>
            <p class="re-hinweis">${bearb ? '' : 'Im Brief direkt arbeiten wie in Canva: anklicken wählt, ziehen verschiebt (rastet an Kanten und Mitten ein, Alt hält es aus), Ecken ändern die Grösse, Doppelklick schreibt, ⌘Z macht rückgängig. Alles wird von selbst gesichert. «Als PDF speichern» setzt ihn als fertige A4-Seite (bei langem Text mit sauberem Umbruch), «Text kopieren» legt Betreff und Brief als Text in die Zwischenablage. '}Verschickt wird hier nichts, und es öffnet sich kein Mailprogramm. Der Brief bleibt hier bei der Anfrage.</p>
          </div>
        </div>`
      : `<div class="brief brief--leer"><header class="brief__kopf">${ZEICHEN}<b>Taverne zum Schäfli</b><span>Haus der Gastlichkeit · Wigoltingen</span></header>
        <p>Noch kein Brief. Der Assistent schreibt ihn aus der Anfrage, der passenden Mail-Vorlage des Hauses und den Unterlagen.</p>
        <label class="feld"><span>Hinweis für den Brief (freiwillig)</span><input id="e-hinweis" placeholder="Zum Beispiel: Festsaal ist frei, Apéro in der Bar anbieten"></label>
        <button class="kn kn--gold" type="button" data-akt="schreiben">Brief schreiben<i>${PF}</i></button></div>`}
    </section>`;
}
function verbindeEingang() {
  $$('.re-filter [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; zeichne(); });
  $$('.re-abt [data-abt]').forEach(b => b.onclick = () => { S.abt = b.dataset.abt; try { sessionStorage.setItem('re-rh-abt', S.abt); } catch (e) { /* */ } zeichne(); });
  const a = S.anfragen.find(x => x.id === S.wahl);
  if (!a) return;
  if (a.status === 'neu') {   // geöffnet heisst gelesen
    api('anfrage', { id: a.id, status: 'gelesen' }).then(d => { a.status = 'gelesen'; S.ue = { ...S.ue, ...d }; rand(); leiste(); const zn = $('.re-filter [data-filter="neu"] i'); if (zn) zn.textContent = (S.abt === 'alle' ? S.anfragen : S.anfragen.filter(x => abt(x) === S.abt)).filter(x => x.status === 'neu').length; const k = $(`.re-a[data-wahl="${CSS.escape(a.id)}"]`); if (k) { const c = k.className; k.outerHTML = karteAnfrage(a); const n = $(`.re-a[data-wahl="${CSS.escape(a.id)}"]`); if (n && /sw-da/.test(c)) n.classList.add('sw-da'); } $$('#ansicht [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || '')); }).catch(() => {});
    if (!a.entwurf && !S.schreibt[a.id]) return schreiben(a, '');
  }
  $$('#detail [data-akt]').forEach(b => b.onclick = () => aktion(a, b.dataset.akt));
  kopfFest();
  if (a.entwurf && $('#brief')) verbindeBrief(a);
  const t = $('#e-text');
  if (t) { const hoch = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 4 + 'px'; }; t.oninput = hoch; hoch(); }
  const be = $('#e-betreff');   // Betreff bricht um wie in «Gestalten» (Robert 20.10.2026), Enter macht keine neue Zeile
  if (be) { const hoch = () => { be.style.height = 'auto'; be.style.height = be.scrollHeight + 'px'; }; be.oninput = () => { if (/\n/.test(be.value)) be.value = be.value.replace(/\n/g, ' '); hoch(); }; be.onkeydown = ev => { if (ev.key === 'Enter') ev.preventDefault(); }; hoch(); }
}
/* Ruhig tauschen (Robert 16.10.2026: «jedes Mal, wenn ich die Spalte wechsle, rastet der Bildschirm neu ein … von jetzt auf gleich die Höhe und die Perspektive»):
   Scrollstand bleibt, die Fläche schrumpft nicht unter die alte Höhe, nichts blendet neu ein. Designstandard, siehe Website-Bau Master 2.11. */
function ruhigTauschen(el, html) {
  const y = scrollY, h = el.offsetHeight;
  el.style.minHeight = h + 'px';
  el.innerHTML = html;
  $$('.re-auf', el).forEach(x => x.classList.add('still'));
  if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' });
  requestAnimationFrame(() => { if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' }); setTimeout(() => { el.style.minHeight = ''; }, 400); });
}
/* Anfrage-Karte über dem Brief immer gleich hoch: einmal je Breite am höchsten Eintrag ausgemessen, damit der Brief beim Wechseln nicht springt */
function kopfFest() {
  const d = $('#detail'), k = $('#detail .re-d'); if (!d || !k) return;
  const w = d.clientWidth;
  if (S.kopfW !== w || S.kopfN !== S.anfragen.length) {
    const t = document.createElement('div'); t.setAttribute('aria-hidden', 'true'); t.style.cssText = `position:absolute;left:-99999px;top:0;width:${w}px;visibility:hidden;pointer-events:none`;
    document.body.appendChild(t); let m = 0;
    S.anfragen.forEach(x => { t.innerHTML = detail(x).split('<section class="re-post')[0]; const s = t.querySelector('.re-d'); if (s) m = Math.max(m, s.offsetHeight); });
    t.remove(); S.kopfH = m; S.kopfW = w; S.kopfN = S.anfragen.length;
  }
  /* Robert 20.10.2026 am Schlössli (Fehlerbuch 10a, «so viel Leerraum»): die Karte wird nicht mehr auf die Höhe der längsten Anfrage gestreckt; das Gespräch ist zugeklappt,
     die Karten sind dadurch fast gleich hoch. */
  k.style.minHeight = '';
}
addEventListener('resize', () => { S.kopfW = 0; if ($('#detail .re-d')) kopfFest(); });
if (document.fonts) document.fonts.ready.then(() => { S.kopfW = 0; if ($('#detail .re-d')) kopfFest(); });
function neuDetail(a) { ruhigTauschen($("#detail"), detail(a)); verbindeEingang(); deAusrichten(); deAusrichten(); }
function deAusrichten() {
  const d = $('#detail .re-de'), k = $('.re-post__kopf'); if (!d || !k || S.deOff == null) return;
  const ist = d.getBoundingClientRect().top - k.getBoundingClientRect().bottom;
  d.style.marginTop = Math.max(0, (parseFloat(d.style.marginTop) || 0) + S.deOff - ist) + 'px';
}
async function schreiben(a, hinweis) {
  S.schreibt[a.id] = true; S.bearbeiten = ''; $('#detail').innerHTML = detail(a);
  try {
    const d = await api('entwurf', { id: a.id, hinweis });
    a.entwurf = d.entwurf; if (a.status === 'neu') a.status = 'gelesen';
    S.ue = { ...S.ue, ...d };
  } catch (e) { fehler(e); }
  delete S.schreibt[a.id];
  if (S.ansicht === 'eingang' && S.wahl === a.id) { $('#detail').innerHTML = detail(a); verbindeEingang(); rand(); leiste(); }
}
async function aktion(a, akt) {
  try {
    if (akt === 'schreiben') return schreiben(a, ($('#e-hinweis') || {}).value || '');
    if (akt === 'neu') return fenster(`<h2>Neu <em>schreiben lassen.</em></h2><p>Der jetzige Entwurf wird ersetzt. Möchten Sie dem Assistenten etwas mitgeben?</p>
      <label class="feld"><span>Hinweis (freiwillig)</span><input id="f-hinweis" placeholder="Zum Beispiel: kürzer, mit dem Richtpreis des Menüs"></label>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Neu schreiben<i>${PF}</i></button></div>`, true, () => { const h = $('#f-hinweis').value; fensterZu(); schreiben(a, h); });
    if ($('#brief') && S.briefSichern && ['kopieren', 'mail', 'neu', 'erledigt', 'offen', 'pdf', 'deutsch', 'deutsch-neu'].includes(akt)) await S.briefSichern();
    if ($('#brief') && S.briefSichern && akt === 'bearbeiten') S.briefSichern();   // Umschalten sofort, Sichern läuft weiter (online dauert es manchmal über 10 s)
    if (akt === 'deutsch') {
      const k = $('.re-post__kopf'), br = $('#brief'); if (k && br) S.deOff = br.getBoundingClientRect().top - k.getBoundingClientRect().bottom;   // Lesefassung genau dort, wo der Brief steht
      S.de = S.de || {}; S.de[a.id] = !S.de[a.id]; if (S.de[a.id]) return deutschHolen(a); return neuDetail(a);
    }
    if (akt === 'deutsch-neu') return deutschHolen(a);
    if (akt === 'pdf') {
      if ($('#e-text')) { const b = $('#e-betreff').value, x = $('#e-text').value; if (b !== a.entwurf.betreff || x !== a.entwurf.text) { await api('anfrage', { id: a.id, betreff: b, entwurf_text: x }); a.entwurf.betreff = b; a.entwurf.text = x; } }
      return briefPDF(a);
    }
    if (akt === 'gestalt-weg') { a.entwurf.gestalt = {}; await api('anfrage', { id: a.id, gestalt: {} }); neuDetail(a); return quit('Zurückgesetzt', 'Der Brief steht wieder in der ursprünglichen Anordnung.', [], false, 3500); }
    if (akt === 'lesen' || akt === 'bearbeiten') {
      if (akt === 'lesen' && $('#e-text')) { const b = $('#e-betreff').value, t = $('#e-text').value; if (b !== a.entwurf.betreff || t !== a.entwurf.text) { await api('anfrage', { id: a.id, betreff: b, entwurf_text: t }); a.entwurf.betreff = b; a.entwurf.text = t; } }
      S.bearbeiten = akt === 'bearbeiten' ? a.id : ''; neuDetail(a);
      if (akt === 'bearbeiten') { const t = $('#e-text'); if (t) t.focus({ preventScroll: true }); }
      return;
    }
    if (akt === 'kopieren' || akt === 'sichern') {
      const betreff = $('#e-betreff') ? $('#e-betreff').value : a.entwurf.betreff, text = $('#e-text') ? $('#e-text').value : a.entwurf.text;
      if (betreff !== a.entwurf.betreff || text !== a.entwurf.text) { await api('anfrage', { id: a.id, betreff, entwurf_text: text }); a.entwurf.betreff = betreff; a.entwurf.text = text; }
      if (akt === 'kopieren') { try { await navigator.clipboard.writeText('Betreff: ' + betreff + '\n\n' + text); } catch (e) { return quit('Nicht kopiert', 'Der Browser hat die Zwischenablage nicht freigegeben. Markieren Sie den Text und kopieren Sie ihn von Hand.', [], true); } return quit('Kopiert', 'Betreff und Brief liegen als Text in der Zwischenablage.', [], false, 5000); }
      S.bearbeiten = ''; neuDetail(a);
      return quit('Gesichert', 'Ihre Änderung am Brief ist gespeichert.', [], false, 4000);
    }
    if (akt === 'erledigt' || akt === 'offen') {
      const d = await api('anfrage', { id: a.id, status: akt === 'erledigt' ? 'erledigt' : 'gelesen' });
      a.status = akt === 'erledigt' ? 'erledigt' : 'gelesen'; S.ue = { ...S.ue, ...d }; rand(); leiste(); zeichne();
      return quit(akt === 'erledigt' ? 'Erledigt' : 'Wieder offen', '', [], false, 3000);
    }
    if (akt === 'weg') return fenster(`<h2>Anfrage <em>löschen?</em></h2><p>Die Anfrage von ${esc(a.name || 'diesem Gast')} mit Entwurf und Gespräch wird endgültig gelöscht. Das ist richtig, wenn der Gast es wünscht oder alles erledigt ist.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Endgültig löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try { const d = await api('weg', { id: a.id }); S.anfragen = S.anfragen.filter(x => x.id !== a.id); S.wahl = ''; S.ue = { ...S.ue, ...d }; rand(); leiste(); zeichne(); quit('Gelöscht', '', [], false, 3000); } catch (e) { fehler(e); }
      });
  } catch (e) { fehler(e); }
}

/* ---------- Das wurde gefragt ---------- */
function gefragt() {
  const alle = S.fragen, luecken = alle.filter(f => !f.belegt && !f.erledigt);
  const liste = S.wahl === 'luecke' ? luecken : alle;
  const gruppen = {};
  liste.forEach(f => { (gruppen[f.gruppe] = gruppen[f.gruppe] || []).push(f); });
  const reihe = Object.keys(gruppen).sort((x, y) => gruppen[y].filter(f => !f.belegt && !f.erledigt).length - gruppen[x].filter(f => !f.belegt && !f.erledigt).length || gruppen[y].length - gruppen[x].length);
  const frage = f => `<div class="re-f${!f.belegt && !f.erledigt ? ' luecke' : ''}${f.erledigt ? ' erledigt' : ''}" data-id="${esc(f.id)}">${IMG(THEMABILD[f.gruppe] || 'schild-480', 're-f__bild')}
      <div class="re-f__k"><span class="mono">${esc(zeit(f.zeit))} · ${esc(SPRACHE[f.sprache] || f.sprache)}${f.anfrage ? ' · wurde zur Anfrage' : ''}${f.buchung ? ' · mit Buchungsmaske' : ''}${f.beispiel ? ' · Beispiel' : ''}</span>
        ${!f.belegt ? `<em>${f.erledigt ? 'nachgetragen' : 'ohne Antwort'}${f.thema ? ' · ' + esc(f.thema) : ''}</em>` : ''}</div>
      <p class="re-f__q" dir="auto">${esc(f.frage)}</p>
      <details class="re-f__antw"><summary>Antwort des Chats</summary><div class="re-chat-antwort" dir="auto"><span class="re-chat-antwort__k mono">${ZEICHEN}Chat des Hauses</span>${antwortHTML(f.antwort)}</div></details>
      ${!f.belegt && !f.erledigt ? `<div class="re-f__kn"><button class="kn kn--klein kn--gold" type="button" data-akt="nachtragen">Antwort nachtragen<i>${PF}</i></button><button class="link" type="button" data-akt="erledigt">Ohne Antwort abhaken</button></div>` : ''}
    </div>`;
  return kopf('Das wurde gefragt', 'Was Gäste <em>wissen wollen.</em>',
    `Jede Frage an den Chat, nach Themen. ${luecken.length ? `<b>${mal(luecken.length, 'Eine Frage hatte', 'Fragen hatten')} keine Antwort,</b> weil dazu nichts auf der Website und in den Unterlagen steht. Tragen Sie die Antwort einmal nach, ab dann antwortet der Chat selbst.` : 'Jede Frage hatte eine Antwort.'}`) +
    `<div class="re-zahlen platte"><div><b>${alle.length}</b><span>Fragen gesamt</span></div><div><b>${luecken.length}</b><span>ohne Antwort</span></div><div><b>${S.nachgetragen.length}</b><span>vom Team nachgetragen</span></div><div><b>${alle.filter(f => f.anfrage).length}</b><span>wurden zur Anfrage</span></div></div>
    <div class="filter"><div class="wahl2" role="group" aria-label="Auswahl"><button type="button" data-gehe="gefragt" aria-pressed="${S.wahl !== 'luecke'}">Alle Fragen</button><button type="button" data-gehe="gefragt" data-wahl="luecke" aria-pressed="${S.wahl === 'luecke'}">Ohne Antwort${luecken.length ? ' · ' + luecken.length : ''}</button></div></div>
    ${reihe.length ? reihe.map(g => `<details class="gr re-gr" open><summary><b>${esc(g)}</b><small>${mal(gruppen[g].length, 'eine Frage', 'Fragen')}${gruppen[g].filter(f => !f.belegt && !f.erledigt).length ? ' · ' + gruppen[g].filter(f => !f.belegt && !f.erledigt).length + ' ohne Antwort' : ''}</small></summary>${gruppen[g].map(frage).join('')}</details>`).join('')
      : `<div class="re-leer platte">${ZEICHEN}<b>${S.wahl === 'luecke' ? 'Keine Lücke.' : 'Noch keine Frage.'}</b><p>${S.wahl === 'luecke' ? 'Jede Frage der Gäste liess sich beantworten.' : 'Sobald Gäste den Chat fragen, steht es hier.'}</p></div>`}`;
}
function verbindeGefragt() {
  $$('.re-f [data-akt]').forEach(b => b.onclick = async () => {
    const f = S.fragen.find(x => x.id === b.closest('.re-f').dataset.id);
    if (b.dataset.akt === 'nachtragen') return nachtragenFenster({ frage: f.thema ? f.thema.charAt(0).toUpperCase() + f.thema.slice(1) + ': ' + f.frage : f.frage, antwort: '', quelle: f.id });
    try { const d = await api('frage', { id: f.id, erledigt: true }); f.erledigt = true; S.ue = { ...S.ue, ...d }; rand(); leiste(); zeichne(); quit('Abgehakt', 'Die Frage bleibt im Protokoll, ohne Markierung.', [], false, 3500); } catch (e) { fehler(e); }
  });
}
function nachtragenFenster(x) {
  fenster(`<h2>Antwort <em>nachtragen.</em></h2><p>So, wie das Team es einem Gast sagen würde. Ab der nächsten Frage antwortet der Chat damit, in jeder Sprache.</p>
    <label class="feld"><span>Frage</span><input id="f-frage" value="${esc(x.frage)}"></label>
    <label class="feld"><span>Antwort des Hauses</span><textarea id="f-antwort" rows="5" placeholder="In ganzen Sätzen, so wie Sie es einem Gast am Telefon sagen würden.">${esc(x.antwort)}</textarea></label>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Nachtragen<i>${SYM.haken}</i></button></div>`, true, async () => {
    try {
      const d = await api('nachtragen', { nid: x.nid, frage: $('#f-frage').value, antwort: $('#f-antwort').value, quelle: x.quelle || '' });
      fensterZu(); S.fragen = null; S.wissen = null; S.ue = { ...S.ue, ...d }; rand(); leiste(); if (S.ansicht === 'wissen') await zeichneHalten(); else await zeichne();
      quit('Nachgetragen', 'Der Chat antwortet ab der nächsten Frage damit.', [['Ansehen', () => gehe('nachgetragen')]], false, 6000);
    } catch (e) { fehler(e); }
  });
  setTimeout(() => { const t = $('#f-antwort'); if (t) t.focus(); }, 60);
}

/* ---------- Vom Team nachgetragen ---------- */
function nachgetragenS() {
  const l = S.nachgetragen;
  return kopf('Vom Team nachgetragen', 'Was der Chat <em>von Ihnen weiss.</em>',
    'Antworten, die Ihr Team auf Fragen ohne Antwort geschrieben hat. Der Chat nutzt sie wie die Website. Ändern oder entfernen Sie sie hier, wenn sich etwas ändert.' + (S.nachgetragen.some(x => x.beispiel) ? ' Die Einträge mit dem Wort «Beispiel» sind erfunden, der Chat kennt sie nicht.' : ''),
    `<button class="kn kn--linie" type="button" id="n-neu">Antwort ohne Frage anlegen<i>${PF}</i></button>`) +
    (l.length ? `<div class="re-nliste">${l.slice().reverse().map(x => { const d = new Date(x.zeit), tag = isNaN(d) ? '' : d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<article class="re-n" data-nid="${esc(x.nid)}">${IMG(THEMABILD[themaVon(x.frage)] || 'schild-480', 're-n__bild')}
        <header class="re-n__kopf"><span>Nachgetragen am ${esc(tag)}</span>${x.beispiel ? '<em>Beispiel</em>' : ''}</header>
        <span class="re-n__l">Frage der Gäste</span>
        <h3 class="re-n__q" dir="auto">${esc(x.frage)}</h3>
        <div class="re-n__zier" aria-hidden="true"><i></i>${ZEICHEN}<i></i></div>
        <span class="re-n__l">Antwort des Hauses</span>
        <p class="re-n__a" dir="auto">${esc(x.antwort).replace(/\n/g, '<br>')}</p>
        <footer class="re-n__kn"><button class="re-n__k" type="button" data-akt="aendern"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg>Ändern</button><button class="re-n__k re-n__k--weg" type="button" data-akt="weg"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>Entfernen</button></footer>
      </article>`; }).join('')}</div>`
      /* M27 (Robert 18.10.2026): nie leer, die Beispiele stehen gleich da (wie Gasterntal). Erfunden ist nur die Frage, die Antwort bleibt die Leerstelle des Teams */
      : `<div class="re-nliste re-nliste--bsp">${['Haben Sie einen Kinderstuhl?', 'Gibt es in Wigoltingen eine Ladestation fürs Elektroauto?', 'Is the restaurant wheelchair accessible?'].map(q => `<article class="re-n re-n--beispiel">${IMG(THEMABILD[themaVon(q)] || 'schild-480', 're-n__bild')}
        <header class="re-n__kopf"><span>So sähe ein Nachtrag aus</span><em>Beispiel</em></header>
        <span class="re-n__l">Frage der Gäste</span>
        <h3 class="re-n__q" dir="auto">${esc(q)}</h3>
        <div class="re-n__zier" aria-hidden="true"><i></i>${ZEICHEN}<i></i></div>
        <span class="re-n__l">Antwort des Hauses</span>
        <p class="re-n__a">[Hier steht die Antwort Ihres Teams, so wie Sie sie einem Gast am Telefon sagen würden.]</p>
      </article>`).join('')}</div><p class="leise re-nliste__bsp">Beispiele, der Chat kennt sie nicht. Hatte der Chat auf eine Frage keine Antwort, steht sie unter «Das wurde gefragt» mit dem Knopf «Antwort nachtragen». Danach steht sie hier als Karte.</p>`);
}
function verbindeNachgetragen() {
  $('#n-neu').onclick = () => nachtragenFenster({ frage: '', antwort: '' });
  if ($('#n-beispiel')) $('#n-beispiel').onclick = () => fenster(`<span class="mono">Beispiel · so sähe ein Nachtrag aus</span><h2>Eine <em>Karteikarte.</em></h2>
    <article class="re-n re-n--beispiel">${IMG(THEMABILD['Anreise & Parkplatz'], 're-n__bild')}<header class="re-n__kopf"><span>Nachgetragen am …</span><em>Beispiel</em></header><span class="re-n__l">Frage der Gäste</span><h3 class="re-n__q">Gibt es in Wigoltingen eine Ladestation fürs Elektroauto?</h3>
    <div class="re-n__zier" aria-hidden="true"><i></i>${ZEICHEN}<i></i></div><span class="re-n__l">Antwort des Hauses</span><p class="re-n__a">[Hier steht die Antwort Ihres Teams, so wie Sie sie einem Gast am Telefon sagen würden.]</p></article>
    <p class="leise">So eine Frage stellen Gäste, und die Seiten des Hauses sagen dazu nichts (ob es im Dorf eine Ladestation gibt, steht nirgends). Tragen Sie eine Antwort ein, steht sie hier als Karte, und der Chat antwortet ab der nächsten Frage damit. Erfunden ist hier nur die Leerstelle, nicht die Antwort.</p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Schliessen</button><button class="kn kn--gold" type="button" id="f-los">Jetzt eine Antwort anlegen<i>${PF}</i></button></div>`, false, () => { fensterZu(); nachtragenFenster({ frage: 'Gibt es in Wigoltingen eine Ladestation fürs Elektroauto?', antwort: '' }); });
  $$('.re-n [data-akt]').forEach(b => b.onclick = async () => {
    const x = S.nachgetragen.find(y => y.nid === b.closest('.re-n').dataset.nid);
    if (b.dataset.akt === 'aendern') return nachtragenFenster(x);
    fenster(`<h2>Antwort <em>entfernen?</em></h2><p>Der Chat weiss das dann nicht mehr und verweist bei dieser Frage wieder an das Team.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Entfernen<i>${SYM.korb}</i></button></div>`, true, async () => {
      fensterZu();
      try { const d = await api('nachtragen_weg', { nid: x.nid }); S.fragen = null; S.ue = { ...S.ue, ...d }; rand(); leiste(); await zeichne(); quit('Entfernt', '', [], false, 3000); } catch (e) { fehler(e); }
    });
  });
}

/* ---------- Das weiss der Chat (Robert 16.10.2026: «so eine Art Gehirn, was man sich anschauen kann») ----------
   Alles, was der Chat über das Haus und die Umgebung weiss, nach Bereichen: die Abschnitte der Website und der Unterlagen,
   das Wissen über die Region, was das Team ergänzt hat (selbst geschrieben oder aus einem Link eingelesen) und die nachgetragenen Antworten.
   Ändern wirkt ab der nächsten Frage an den Chat; die Website selbst bleibt, wie sie ist. Server-Teil: _gast/gedaechtnis.py. */
const BER_BILD = { 'Das Haus': 'fassade-480', 'Öffnungszeiten & Reservation': 'stube-ofen-480', 'Karte & Menüs': 'kopf-karte-480', 'Bar & Smokers Lounge': 'bar-480',
  'Feiern & Gruppen': 'tafel-480', 'Anlässe & Events': 'party-480', 'Gutschein': 'champagner-480', 'Hausregeln (AGB)': 'bogen-480', 'Anreise & Übernachten': 'strasse-480',
  'Veranstaltungen': 'party-480', 'Fragen & Antworten': 'stube-gast-480' };
const W_ART = { neu: 'Neu angelegt', geaendert: 'Geändert', aus: 'Ausgeblendet', an: 'Wieder eingeblendet', zurueck: 'Wieder wie auf der Website', link: 'Aus Link übernommen', entfernt: 'Entfernt', nachgetragen: 'Antwort nachgetragen' };
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>';
const vorTagen = (iso, n) => { const d = new Date(iso); return !isNaN(d) && (Date.now() - d) < n * 864e5; };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const leseText = t => esc(String(t || '').replace(/^## /gm, '').replace(/^\s+/gm, '').trim()).replace(/\n/g, '<br>');
let wachUhr = 0;

async function ladeWissen(neu = false) {
  if (!S.wissen || neu) S.wissen = await api('wissen');
  if (!S.fragen) { const d = await api('fragen'); S.fragen = d.fragen; S.nachgetragen = d.nachgetragen; }
  S.wissenNeu = wissenPosten().filter(x => x.neu).length;
}
/* Steckbrief statt Website-Schnipsel (Robert 16.10.2026: «übersichtlich, so dass man auf einen Blick hat, was Sache ist», nicht «tausend kleine Sachen»):
   je Bereich eine Tafel, je Fakt eine Zeile «Stichwort — Angabe». Darunter, was das Team ergänzt oder aus Links eingelesen hat, und die nachgetragenen Antworten.
   Ein Klick auf eine Zeile zeigt, wo es auf der Website steht, und lässt sie ändern oder abschalten. */
function wissenZeilen() {   // alle Zeilen flach, für Suche, Zähler und Fenster
  const W = S.wissen, l = [];
  (W.steckbrief || []).forEach(b => b.gruppen.forEach(g => g.zeilen.forEach(z => {
    const t = z.team || null;
    l.push({ id: 'f:' + z.fid, typ: 'fakt', z, bereich: b.bereich, gruppe: g.gruppe, was: z.was, angabe: t && t.angabe ? t.angabe : z.angabe, orig: z.angabe,
      geaendert: !!(t && t.angabe), aus: !!(t && t.aus), neu: !!t && vorTagen(t.zeit, 7), zeit: t ? t.zeit : '', von: t ? t.von || '' : '',
      quelle: t ? (t.von ? t.von + ' · ' : '') + datum(t.zeit) : '' });
  })));
  W.eintraege.forEach(e => { const q = e.quelle || {}, link = q.art === 'link';
    l.push({ id: 'e:' + e.wid, typ: 'eintrag', e, bereich: e.bereich, gruppe: link ? 'Aus Links eingelesen' : 'Vom Team ergänzt', was: e.titel, angabe: e.text,
      quelle: (e.von ? e.von + ' · ' : '') + (link ? host(q.url) + ' · ' + datum(q.gelesen) : datum(e.geaendert || e.zeit)), aus: !!e.aus || e.abgelaufen, abgelaufen: e.abgelaufen,
      neu: vorTagen(e.geaendert || e.zeit, 7), zeit: e.geaendert || e.zeit, lang: true }); });
  (S.nachgetragen || []).forEach(x => l.push({ id: 'n:' + x.nid, typ: 'antwort', x, bereich: 'Fragen & Antworten', gruppe: x.beispiel ? 'Beispiele (der Chat kennt sie nicht)' : 'Vom Team nachgetragen',
    was: x.frage, angabe: x.antwort, quelle: datum(x.zeit), beispiel: !!x.beispiel, neu: !x.beispiel && vorTagen(x.zeit, 7), zeit: x.zeit, lang: true }));
  return l;
}
function wissenPosten() { return wissenZeilen(); }
/* Keine Namensabfrage (Robert 20.10.2026: «Entfernen diese, wer arbeitet hier? Abfrage», Fehlerbuch 10a): im Protokoll steht ein fester Eintrag,
   die Anmeldung mit Namen kommt erst bei der Auslieferung an das Haus (Master 5.3). */
const WER = 'Team Schäfli';
const meinName = () => WER;
const nameFeld = () => '';
function nameAus() { return WER; }
function frageName() { return Promise.resolve(WER); }
function wissenS() {
  const W = S.wissen, alle = wissenZeilen(), q = S.such.trim().toLowerCase();
  const passt = p => !q || (p.was + ' ' + p.angabe + ' ' + p.gruppe + ' ' + p.bereich).toLowerCase().includes(q);
  const liste = alle.filter(passt);
  const team = alle.filter(p => (p.typ === 'fakt' && (p.geaendert || p.aus)) || p.typ === 'eintrag' || (p.typ === 'antwort' && !p.beispiel)).length;
  const zeile = p => {
    const marke = p.aus ? (p.abgelaufen ? 'abgelaufen' : 'abgeschaltet') : p.geaendert ? 'geändert' : p.typ === 'eintrag' && p.e.gueltig_bis ? 'bis ' + datum(p.e.gueltig_bis) : '';
    return `<button class="sb-z${p.aus ? ' aus' : ''}${p.geaendert || p.typ !== 'fakt' ? ' team' : ''}${p.lang ? ' lang' : ''}" type="button" data-id="${esc(p.id)}">${IMG(zeilenBild(p), 'sb-z__bild')}
      <span class="sb-z__was" dir="auto">${esc(p.was)}</span><span class="sb-z__angabe" dir="auto">${esc(p.angabe)}${p.quelle ? `<small>${esc(p.quelle)}</small>` : ''}</span>
      ${marke ? `<em>${esc(marke)}</em>` : ''}</button>`;
  };
  const tafel = b => {
    const l = liste.filter(p => p.bereich === b);
    if (!l.length && (q || !['Veranstaltungen', 'Fragen & Antworten'].includes(b))) return '';
    const gruppen = []; l.forEach(p => { let g = gruppen.find(x => x.n === p.gruppe); if (!g) gruppen.push(g = { n: p.gruppe, l: [] }); g.l.push(p); });
    const leer = b === 'Veranstaltungen' ? 'Noch keine. Fügen Sie oben den Link einer Veranstaltung ein, dann kennt der Chat sie.' : 'Noch keine Antwort des Teams. Fragen ohne Antwort stehen unter «Das wurde gefragt».';
    const n = l.filter(p => !p.beispiel).length;
    return `<section class="platte sb-t" data-bereich="${esc(b)}">
      <header class="sb-t__k">${BER_BILD[b] ? `<span class="sb-t__bild" aria-hidden="true"><img src="../../assets/img/${BER_BILD[b]}.webp" alt="" width="900" height="675" loading="lazy" decoding="async"></span>` : ''}
        <h2>${esc(b)}</h2><small>${n ? mal(n, 'eine Angabe', 'Angaben') : 'noch leer'}</small>
        <button class="rund sb-t__neu" type="button" data-neu="${esc(b)}" data-tip="Hinzufügen" aria-label="Zu ${esc(b)} hinzufügen"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg></button></header>
      ${gruppen.length ? gruppen.map(g => `<div class="sb-g"><p class="sb-g__n mono">${esc(g.n)}</p>${g.l.map(zeile).join('')}</div>`).join('') : `<p class="wi__leer">${leer}</p>`}
    </section>`;
  };
  const verlauf = W.verlauf.map(v => ({ zeit: v.zeit, art: v.art, titel: v.titel, bereich: v.bereich, wer: v.wer && v.wer !== 'Team' && v.wer !== 'Link' ? v.wer : '' }))
    .concat((S.nachgetragen || []).filter(x => !x.beispiel).map(x => ({ zeit: x.zeit, art: 'nachgetragen', titel: x.frage, bereich: 'Fragen & Antworten' })))
    .sort((x, y) => String(y.zeit).localeCompare(String(x.zeit)));
  const links = W.links.slice(0, 4);
  const sb = W.steckbrief || [], bereiche = sb.map(b => b.bereich).concat(['Veranstaltungen', 'Fragen & Antworten']);
  W.eintraege.forEach(e => { if (!bereiche.includes(e.bereich)) bereiche.splice(bereiche.length - 2, 0, e.bereich); });
  return kopf('Das weiss der Chat', 'Alles, was der Chat <em>über Ihr Haus weiss.</em>',
    `Der Chat antwortet nur mit dem, was auf der Website, in den Karten des Hauses und hier steht. Stimmt eine Angabe nicht mehr, tippen Sie sie an und ändern Sie sie. Der Chat antwortet ab der nächsten Frage damit, die Website selbst bleibt, wie sie ist.${team ? ` <b>${mal(team, 'Eine Angabe stammt', team + ' Angaben stammen')} von Ihrem Team.</b>` : ''}`,
    `<button class="kn kn--gold glanz-kn" type="button" id="w-link-auf">Neues Wissen<i>${PF}</i></button><button class="kn kn--linie" type="button" id="w-neu">Angabe hinzufügen<i>${PF}</i></button>`, 'schild') +
    `<div class="wi-oben">
      <section class="platte wi-neu" id="w-ein">
        <span class="mono">Neues Wissen</span>
        <h2>Was soll der Chat <em>noch wissen?</em></h2>
        <p>Schreiben Sie es hinein, fügen Sie einen Link ein oder legen Sie eine Datei dazu: die neue Karte als PDF, ein Foto vom Aushang, das Programm einer Veranstaltung. Der Chat übernimmt nur, was dort steht, mit Datum.</p>
        <div class="wi-neu__feld" id="w-feld">
          <textarea id="w-text" rows="3" placeholder="Zum Beispiel: Ab [Datum] ist der Festsaal belegt. Oder einfach einen Link einfügen.">${esc(S.entwurf || '')}</textarea>
          <div class="wi-neu__dateien" id="w-dateien">${dateienS()}</div>
          <div class="wi-neu__leiste">
            <button class="rund" type="button" id="w-doc" data-tip="Dokument dazulegen" aria-label="Dokument dazulegen">${DOK}</button>
            <button class="rund" type="button" id="w-bild" data-tip="Foto dazulegen" aria-label="Foto dazulegen">${FOTO}</button>
            <input type="file" id="w-datei-doc" accept=".pdf,.docx,.txt,.md,.csv,application/pdf" multiple hidden>
            <input type="file" id="w-datei-bild" accept="image/*" multiple hidden>
            <select class="sel wi-neu__ber" id="w-ber" aria-label="Bereich"><option value="">Bereich: automatisch</option>${(S.wissen.bereiche || []).filter(b => b !== 'Fragen & Antworten').map(b => `<option value="${esc(b)}"${S.entwurfBer === b ? ' selected' : ''}>Bereich: ${esc(b)}</option>`).join('')}</select>
            <span></span>
            <button class="kn kn--gold" type="button" id="w-los">Übernehmen<i>${PF}</i></button>
          </div>
          <div class="wi-neu__ziehen" aria-hidden="true">Datei hier ablegen</div>
        </div>
        <p class="wi-neu__hinweis">PDF, Word, Text und Fotos bis 20 MB. Eigener Text mit gewähltem Bereich steht sofort im Wissen; Links, Dokumente und Fotos werden im Hintergrund gelesen.</p>
        ${links.length ? `<div class="wi-links">${links.map(x => `<div class="wi-l wi-l--${x.status}" data-lid="${esc(x.lid)}">${IMG(BER_BILD[x.bereich] || 'stube-gast-480', 'wi-l__bild')}<span class="wi-l__z" aria-hidden="true"></span>
          <div><b>${esc(x.titel || host(x.url) || 'Eigener Text')}</b><small>${x.von ? esc(x.von) + ' · ' : ''}${x.status === 'liest' ? 'Wird gelesen …' : x.status === 'fertig' ? mal(x.wids.length, 'Eine Angabe', 'Angaben') + ' übernommen · ' + zeit(x.fertig) : x.status === 'leer' ? 'Nichts für Gäste gefunden' + (x.meldung ? ': ' + esc(x.meldung) : '') : esc(x.meldung || 'Liess sich nicht lesen.')}</small></div>
          ${x.status === 'liest' ? '' : `<span class="wi-l__kn"><button class="link" type="button" data-akt="neu">Neu einlesen</button><button class="link rot" type="button" data-akt="weg">Entfernen</button></span>`}</div>`).join('')}</div>` : ''}
      </section>
      <section class="platte wi-probe">
        <span class="mono">Chat prüfen</span>
        <h2>Fragen Sie, <em>wie ein Gast.</em></h2>
        <p>Die Antwort kommt aus dem Wissen, so wie es jetzt hier steht. Diese Frage landet nicht im Protokoll.</p>
        <form class="wi-ein__f" id="w-probe-f" autocomplete="off"><label class="suche wi-ein__feld">${SYM.chat.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.4"')}<input type="text" id="w-probe" placeholder="Zum Beispiel: Gibt es Parkplätze?"></label>
          <button class="kn kn--linie" type="submit">Fragen<i>${SYM.chat}</i></button></form>
        <div class="wi-antwort" id="w-antwort" hidden></div>
      </section>
    </div>
    ${verlauf.length ? `<section class="platte sb-verlauf"><span class="mono">Zuletzt geändert</span><ol>${verlauf.slice(0, 6).map(v => `<li>${IMG(BER_BILD[v.bereich] || THEMABILD[themaVon(v.titel)] || 'haus-480', 'sb-verlauf__bild')}<span class="mono">${esc(datum(v.zeit))}</span><b>${esc(W_ART[v.art] || v.art)}${v.wer ? ' · ' + esc(v.wer) : ''}</b><p dir="auto">${esc(v.titel)}</p></li>`).join('')}</ol></section>` : ''}
    <label class="suche wi-such">${LUPE}<input type="search" id="w-such" placeholder="Suchen, zum Beispiel Trüffel, Festsaal, Hund" value="${esc(S.such)}" autocomplete="off"></label>
    <div id="w-ergebnis"${q ? ' class="sucht"' : ''}>${q && !liste.length ? fehltS(S.such.trim()) : !q && (W.offen || []).length ? offenS(W.offen) : ''}
    ${q && !liste.length ? '' : (() => {   /* Geordnet statt versetzt (Robert 16.10.2026: «schräg immer versetzt … unstrukturiert»): links die Bereiche als Inhaltsverzeichnis, rechts der gewählte Bereich in voller Breite. Beim Suchen stehen rechts alle Treffer untereinander. */
      const da = bereiche.filter(b => liste.some(p => p.bereich === b) || (!q && ['Veranstaltungen', 'Fragen & Antworten'].includes(b)));
      if (!da.includes(S.bereich)) S.bereich = da[0] || '';
      const idx = da.map(b => { const n = liste.filter(p => p.bereich === b && !p.beispiel).length, t = liste.filter(p => p.bereich === b && (p.geaendert || p.aus || p.typ === 'eintrag' || (p.typ === 'antwort' && !p.beispiel))).length;
        return `<button class="sb-i" type="button" data-bereich="${esc(b)}"${!q && S.bereich === b ? ' aria-current="true"' : ''}>${BER_BILD[b] ? `<span class="sb-i__bild" aria-hidden="true"><img src="../../assets/img/${BER_BILD[b]}.webp" alt="" width="900" height="675" decoding="async"></span>` : ''}
          <span class="sb-i__n"><b>${esc(b)}</b><small>${n ? mal(n, 'eine Angabe', 'Angaben') : 'noch leer'}${t ? ' · ' + t + ' vom Team' : ''}</small></span></button>`; }).join('');
      return `<div class="sb"><nav class="platte sb-idx" aria-label="Bereiche des Wissens">${idx}</nav><div class="sb-rechts">${q ? da.map(tafel).join('') : tafel(S.bereich)}</div></div>`;
    })()}</div>`;
}
/* Steht zu einem Suchwort nichts im Wissen: nicht abweisen, sondern zur Antwort führen (Robert 16.10.2026: «lösungsorientiert … eine Anfrage an die verantwortliche Abteilung»).
   Selbst eintragen, oder die zuständige Abteilung fragen: die Frage bleibt im Werkzeug unter «Offen bei Ihrem Team» (Thema, Abteilung, wer gefragt hat)
   und wird dort beantwortet. Kein Mailprogramm (Robert 17.10.2026: keine Mails, sondern Formulare). */
const ABTEILUNG = [['Küche (Christian Kuchler)', 'kontakt@schaefli-wigoltingen.ch'], ['Service und Bar', 'kontakt@schaefli-wigoltingen.ch'], ['Feiern und Anlässe', 'kontakt@schaefli-wigoltingen.ch']];   // Namen und Rollen: Seite «Über uns» und Speisekarte des Hauses
function fehltS(wort) {
  const thema = wort.charAt(0).toUpperCase() + wort.slice(1), ber = S.wissen.bereiche.filter(b => b !== 'Fragen & Antworten');
  return `<section class="platte sb-fehlt" data-thema="${esc(thema)}">
    <span class="mono">Noch nicht im Wissen</span>
    <h2>Zu «${esc(thema)}» steht noch nichts. <em>Was soll der Chat sagen?</em></h2>
    <p>Fragt ein Gast danach, gibt der Chat bis dahin die Nummer des Hauses weiter. Tragen Sie die Antwort selbst ein, oder fragen Sie die Abteilung, die es weiss.</p>
    <div class="sb-fehlt__name">${nameFeld('fe-von')}</div>
    <div class="sb-fehlt__wege">
      <div class="sb-fehlt__w"><b>Selbst eintragen</b>
        <label class="feld"><span>Bereich</span><select class="sel" id="fe-ber">${ber.map(b => `<option>${esc(b)}</option>`).join('')}</select></label>
        <label class="feld"><span>Was der Chat zu «${esc(thema)}» sagen soll</span><textarea id="fe-text" rows="4" placeholder="In ganzen Sätzen, so wie Sie es einem Gast sagen würden."></textarea></label>
        <button class="kn kn--gold" type="button" id="fe-los">Ins Wissen übernehmen<i>${SYM.haken}</i></button></div>
      <div class="sb-fehlt__w"><b>Abteilung fragen</b>
        <p>«${esc(thema)}» kommt oben unter «Offen bei Ihrem Team», mit der Abteilung. Wer die Antwort weiss, trägt sie dort ein, ab dann antwortet der Chat damit.</p>
        <label class="feld"><span>Wer weiss es?</span><select class="sel" id="fe-an">${ABTEILUNG.map(([n], i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select></label>
        <button class="kn kn--linie" type="button" id="fe-frag">Bei der Abteilung als offen vermerken<i>${PF}</i></button></div>
    </div></section>`;
}
function offenS(l) {
  return `<section class="platte sb-offen"><span class="mono">Offen bei Ihrem Team</span>
    ${l.map(x => `<div class="sb-offen__z" data-oid="${esc(x.oid)}">${IMG(THEMABILD[themaVon(x.thema)] || 'schild-480', 'sb-offen__bild')}<div><b>${esc(x.thema)}</b><small>${x.an ? esc(x.an) + ' gefragt' : 'offen'}${x.von ? ' von ' + esc(x.von) : ''} · ${esc(datum(x.zeit))}</small></div>
      <button class="kn kn--klein kn--gold" type="button" data-akt="antwort">Antwort eintragen<i>${PF}</i></button><button class="link" type="button" data-akt="weg">Nicht mehr nötig</button></div>`).join('')}</section>`;
}
function verbindeFehlt() {
  const f = $('.sb-fehlt');
  if (f) {
    const thema = f.dataset.thema;
    $('#fe-los').onclick = async () => {
      const text = $('#fe-text').value.trim(); if (text.length < 3) return $('#fe-text').focus();
      const von = nameAus('fe-von'); if (!von) return;
      try { const b = $('#fe-ber').value; await api('wissen_eintrag', { bereich: b, titel: thema, text, gueltig_bis: null, von });
        S.such = ''; S.bereich = b; await wissenNeu(); quit('Übernommen', `Der Chat antwortet ab der nächsten Frage zu «${thema}» damit.`, [], false, 4500); } catch (e) { fehler(e); }
    };
    $('#fe-frag').onclick = async () => {
      const [an] = ABTEILUNG[+$('#fe-an').value];
      const von = nameAus('fe-von'); if (!von) return;
      try { await api('wissen_offen', { thema, an, von }); } catch (e) { return fehler(e); }
      S.such = ''; await wissenNeu(); quit('Als offen vermerkt', `«${thema}» steht oben unter «Offen bei Ihrem Team» (${an}), bis die Antwort eingetragen ist.`, [], false, 5000);
    };
  }
  $$('.sb-offen__z [data-akt]').forEach(b => b.onclick = async () => {
    const x = (S.wissen.offen || []).find(y => y.oid === b.closest('.sb-offen__z').dataset.oid);
    if (b.dataset.akt === 'antwort') return eintragFenster({ titel: x.thema, oid: x.oid });
    try { await api('wissen_offen_weg', { oid: x.oid }); await wissenNeu(); } catch (e) { fehler(e); }
  });
}
function nurErgebnis() {   // beim Suchen nur die Treffer neu setzen: Suchfeld und Seite bleiben stehen
  const tmp = document.createElement('div'); tmp.innerHTML = wissenS();
  $('#w-ergebnis').replaceWith(tmp.querySelector('#w-ergebnis')); verbindeWissen();
}
/* Neues Wissen: ein Feld für Text, Links, Dokumente und Fotos (Robert 16.10.2026: «dass man Dokumente hochladen kann, Bilder hochladen kann»).
   Entwurf und Dateien bleiben im Speicher, bis übernommen; Fotos werden vor dem Hochladen auf 2000 px verkleinert. */
const DOK = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3h3M6 8.5h4M6 11h4"/></svg>';
const FOTO = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.8" y="3" width="12.4" height="10" rx="1.5"/><circle cx="5.6" cy="6.6" r="1.2"/><path d="m2.5 12 4-4 3 3 2-2 2.5 2.5"/></svg>';
const groesse = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function dateienS() {
  return (S.dateien || []).map((f, i) => `<span class="wi-d">${f.vorschau ? `<img src="${f.vorschau}" alt="" width="40" height="40">` : `<i>${DOK}</i>`}<span><b>${esc(f.name)}</b><small>${groesse(f.groesse)}</small></span><button type="button" data-weg="${i}" aria-label="${esc(f.name)} entfernen">${ZU}</button></span>`).join('');
}
function zeigeDateien() { $('#w-dateien').innerHTML = dateienS(); $$('#w-dateien [data-weg]').forEach(b => b.onclick = () => { S.dateien.splice(+b.dataset.weg, 1); zeigeDateien(); }); }
function verkleinere(datei) {   // Foto → JPEG, längste Seite 2000 px
  return new Promise((ok, nein) => { const u = URL.createObjectURL(datei), im = new Image();
    im.onload = () => { const m = Math.min(1, 2000 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * m); c.height = Math.round(im.height * m); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      const d = c.toDataURL('image/jpeg', 0.86); ok({ daten: d, typ: 'image/jpeg', groesse: Math.round(d.length * 0.75), vorschau: d }); };
    im.onerror = () => nein(new Error('DATEI · ' + datei.name + ' lässt sich nicht als Foto öffnen.')); im.src = u; });
}
function alsDaten(datei) { return new Promise((ok, nein) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => nein(new Error('DATEI · ' + datei.name + ' liess sich nicht lesen.')); r.readAsDataURL(datei); }); }
async function legeDazu(liste) {
  S.dateien = S.dateien || [];
  for (const d of [...liste]) {
    if (S.dateien.length >= 10) { quit('Höchstens zehn Dateien auf einmal', '', [], true, 3500); break; }
    try {
      if (/^image\//.test(d.type) && d.type !== 'image/gif') { const v = await verkleinere(d); S.dateien.push({ name: d.name.replace(/\.\w+$/, '') + '.jpg', ...v }); }
      else if (/\.(pdf|docx|txt|md|csv)$/i.test(d.name) || d.type === 'image/gif') {
        if (d.size > 20 * 1048576) { quit(d.name + ' ist grösser als 20 MB', '', [], true, 4000); continue; }
        S.dateien.push({ name: d.name, typ: d.type || (/\.pdf$/i.test(d.name) ? 'application/pdf' : ''), groesse: d.size, daten: await alsDaten(d), vorschau: d.type === 'image/gif' ? await alsDaten(d) : '' });
      } else quit(d.name + ' lässt sich nicht lesen', 'PDF, Word, Text oder Fotos.', [], true, 4000);
    } catch (e) { fehler(e); }
  }
  zeigeDateien();
}
function verbindeNeu() {
  const feld = $('#w-feld'), t = $('#w-text');
  const hoehe = () => { t.style.height = 'auto'; t.style.height = Math.min(Math.max(t.scrollHeight, 96), 320) + 'px'; };
  t.oninput = () => { S.entwurf = t.value; hoehe(); }; hoehe();
  t.onpaste = e => { const f = e.clipboardData && e.clipboardData.files; if (f && f.length) { e.preventDefault(); legeDazu(f); } };
  $('#w-ber').onchange = e => { S.entwurfBer = e.target.value; };
  $('#w-doc').onclick = () => $('#w-datei-doc').click(); $('#w-bild').onclick = () => $('#w-datei-bild').click();
  $('#w-datei-doc').onchange = e => { legeDazu(e.target.files); e.target.value = ''; };
  $('#w-datei-bild').onchange = e => { legeDazu(e.target.files); e.target.value = ''; };
  feld.ondragover = e => { e.preventDefault(); feld.classList.add('zieht'); };
  feld.ondragleave = e => { if (!feld.contains(e.relatedTarget)) feld.classList.remove('zieht'); };
  feld.ondrop = e => { e.preventDefault(); feld.classList.remove('zieht'); if (e.dataTransfer.files.length) legeDazu(e.dataTransfer.files); };
  $$('#w-dateien [data-weg]').forEach(b => b.onclick = () => { S.dateien.splice(+b.dataset.weg, 1); zeigeDateien(); });
  $('#w-los').onclick = async () => {
    const text = t.value.trim(), dateien = S.dateien || [];
    if (!text && !dateien.length) { t.focus(); return quit('Bitte etwas schreiben oder eine Datei dazulegen', '', [], true, 3500); }
    await einlesen({ text, bereich: $('#w-ber').value, dateien: dateien.map(f => ({ name: f.name, typ: f.typ, daten: f.daten })) });
  };
}
async function einlesen(d) {
  const von = await frageName(); if (!von) return;
  const k = $('#w-los'); if (k) k.disabled = true;
  try { const r = await api('wissen_einlesen', { ...d, von });
    if (!d.lid) { S.entwurf = ''; S.dateien = []; }
    if (r.direkt) { S.bereich = r.direkt.bereich; await wissenNeu(); quit('Übernommen', `Steht jetzt unter «${r.direkt.bereich}». Der Chat antwortet ab der nächsten Frage damit.`, [], false, 5000); }
    else { await wissenNeu(); quit('Wird gelesen', 'Das dauert meist eine halbe Minute. Sie können weiterarbeiten.', [], false, 4500); wachen(); }
  } catch (e) { fehler(e); } finally { if (k && document.body.contains(k)) k.disabled = false; }
}
function wissenNeu(d) { if (d) S.ue = { ...S.ue, ...d }; S.wissen = null; return zeichneHalten(); }
async function zeichneHalten() {   // neu zeichnen und an derselben Stelle bleiben
  const y = scrollY;
  await ladeWissen(); $('#ansicht').innerHTML = wissenS(); verbindeWissen(); rand(); window.scrollTo(0, y);
}
function posten(id) { return wissenZeilen().find(p => p.id === id); }
function verbindeWissen() {
  $('#w-neu').onclick = () => eintragFenster({});
  $$('[data-neu]').forEach(b => b.onclick = () => b.dataset.neu === 'Fragen & Antworten' ? nachtragenFenster({ frage: '', antwort: '' }) : eintragFenster({ bereich: b.dataset.neu }));
  $('#w-link-auf').onclick = () => { $('#w-ein').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#w-text').focus(), 350); };
  verbindeNeu();
  $('#w-probe-f').onsubmit = async e => {
    e.preventDefault(); const f = $('#w-probe').value.trim(); if (!f) return $('#w-probe').focus();
    const a = $('#w-antwort'); a.hidden = false; a.className = 'wi-antwort lade'; a.innerHTML = '<span class="mono">Der Chat antwortet …</span>';
    try { const d = await api('wissen_probe', { frage: f });
      a.className = 'wi-antwort' + (d.belegt ? '' : ' luecke');
      a.innerHTML = `<span class="mono">${d.belegt ? 'Antwort des Chats' : 'Dazu weiss der Chat nichts'}</span><p dir="auto">${esc(d.text).replace(/\n/g, '<br>')}</p>${d.belegt ? '' : `<button class="kn kn--klein kn--gold" type="button" id="w-probe-luecke">Antwort nachtragen<i>${PF}</i></button>`}`;
      if (!d.belegt) $('#w-probe-luecke').onclick = () => nachtragenFenster({ frage: f, antwort: '' });
    } catch (err) { a.hidden = true; fehler(err); }
  };
  let t = 0;
  $('#w-such').oninput = e => { clearTimeout(t); t = setTimeout(() => { S.such = e.target.value; nurErgebnis(); }, 200); };
  verbindeFehlt();
  $$('.sb-z').forEach(b => b.onclick = () => zeileFenster(posten(b.dataset.id)));
  $$('.sb-i').forEach(b => b.onclick = () => { S.bereich = b.dataset.bereich; if (S.such) S.such = '';
    $('#ansicht').innerHTML = wissenS(); verbindeWissen(); const r = $('.sb').getBoundingClientRect().top; if (r < 120) window.scrollTo(0, scrollY + r - 120); });
  $$('.wi-l [data-akt]').forEach(b => b.onclick = async () => {
    const x = S.wissen.links.find(y => y.lid === b.closest('.wi-l').dataset.lid);
    if (b.dataset.akt === 'neu') return einlesen({ lid: x.lid });
    fenster(`<h2>Link <em>entfernen?</em></h2><p>${x.wids.length ? mal(x.wids.length, 'Die Angabe', 'Die ' + x.wids.length + ' Angaben') + ' aus diesem Link verschwinden mit, der Chat weiss das dann nicht mehr.' : 'Aus diesem Link steht nichts im Wissen.'}</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Entfernen<i>${SYM.korb}</i></button></div>`, true, async () => {
      fensterZu(); try { await api('wissen_link_weg', { lid: x.lid }); await wissenNeu(); quit('Entfernt', '', [], false, 3000); } catch (e) { fehler(e); } });
  });
}
/* Eine Zeile öffnen: lesen, ändern, abschalten */
function zeileFenster(p) {
  if (p.typ === 'antwort') {
    /* 17.10.2026: vorher kehrte die Funktion beim Beispiel vor dem Verdrahten von «Entfernen» zurück (Knopf tot) und lief bei echten Antworten
       auf ein fehlendes #f-weg (Skriptfehler, Fenster blieb zu) */
    if (p.beispiel) {
      fenster(`<span class="mono">Beispiel</span><h2 dir="auto">${esc(p.was)}</h2><p dir="auto">${esc(p.angabe)}</p><p>Dieses Beispiel ist erfunden und zeigt nur, wie nachgetragene Antworten aussehen. Der Chat kennt es nicht.</p>
        <div class="fenster__kn"><button class="link rot" type="button" id="f-weg">Entfernen</button><button class="kn kn--linie" type="button" data-zu>Schliessen<i>${ZU}</i></button></div>`, true);
      $('#f-weg').onclick = async () => { try { const d = await api('nachtragen_weg', { nid: p.x.nid }); fensterZu(); S.fragen = null; await wissenNeu(d); quit('Entfernt', '', [], false, 3000); } catch (e) { fehler(e); } };
      return;
    }
    return nachtragenFenster(p.x);
  }
  if (p.typ === 'eintrag') return eintragFenster(p.e);
  const f = p.z, beleg = f.beleg;
  fenster(`<span class="mono">${esc(p.bereich)} · ${esc(p.gruppe)}</span><h2>${esc(p.was)}</h2>
    <label class="feld"><span>Das sagt der Chat</span><textarea id="f-angabe" rows="3">${esc(p.aus ? p.orig : p.angabe)}</textarea></label>
    <div class="sb-beleg"><span class="mono">So steht es ${f.datei === 'gast_tal.txt' ? 'bei den Anbietern' : 'auf der Website'}</span><p>«${esc(beleg)}»</p>${(f.mehr || []).map(m => `<p>«${esc(m)}»</p>`).join('')}</div>
    ${p.geaendert ? `<p class="sb-hinweis">Geändert${p.von ? ' von ' + esc(p.von) : ''} am ${esc(datum(p.zeit))}. Bisher: «${esc(p.orig)}»</p>` : ''}${p.aus ? `<p class="sb-hinweis">Abgeschaltet${p.von ? ' von ' + esc(p.von) : ''} am ${esc(datum(p.zeit))}: der Chat nennt das nicht mehr.</p>` : ''}
    ${nameFeld()}
    <div class="fenster__kn sb-kn">${p.geaendert || p.aus ? '<button class="link" type="button" id="f-zurueck">Wie auf der Website</button>' : ''}${p.aus ? '' : '<button class="link rot" type="button" id="f-aus">Nicht mehr nennen</button>'}
      <span></span><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Übernehmen<i>${SYM.haken}</i></button></div>`, true, async () => fakt({ angabe: $('#f-angabe').value }, 'Geändert'));
  const z = $('#f-zurueck'); if (z) z.onclick = () => fakt({ zurueck: true }, 'Wie auf der Website');
  const a = $('#f-aus'); if (a) a.onclick = () => fakt({ aus: true }, 'Abgeschaltet');
  async function fakt(d, titel) {
    const von = nameAus(); if (!von) return;
    try { await api('wissen_fakt', { fid: f.fid, ...d, von }); fensterZu(); await wissenNeu(); quit(titel, 'Der Chat antwortet ab der nächsten Frage damit.', [], false, 4000); } catch (e) { fehler(e); }
  }
  setTimeout(() => { const t = $('#f-angabe'); if (t) t.focus(); }, 60);
}
function eintragFenster(e) {
  const bereiche = S.wissen.bereiche.filter(b => b !== 'Fragen & Antworten');
  fenster(`<h2>${e.wid ? 'Eintrag <em>ändern.</em>' : 'Eintrag <em>hinzufügen.</em>'}</h2>
    <p>Was der Chat über Ihr Haus oder die Umgebung wissen soll: eine neue Öffnungszeit, ein Angebot, eine Veranstaltung. ${e.quelle && e.quelle.art === 'link' ? 'Aus dem Link übernommen; Ihre Änderung bleibt, bis der Link neu eingelesen wird.' : 'Ab der nächsten Frage antwortet der Chat damit.'}</p>
    <div class="wi-fz"><label class="feld"><span>Bereich</span><select class="sel" id="f-ber">${bereiche.map(b => `<option${(e.bereich || 'Das Haus') === b ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
      <label class="feld"><span>Gilt bis (leer = ohne Ende)</span><input type="date" id="f-bis" value="${esc(e.gueltig_bis || '')}"></label></div>
    <label class="feld"><span>Titel</span><input id="f-titel" value="${esc(e.titel || '')}" placeholder="So, wie ein Gast danach fragen würde"></label>
    <label class="feld"><span>Was der Chat wissen soll</span><textarea id="f-text" rows="7" placeholder="In ganzen Sätzen, mit Datum, Uhrzeit, Ort und Preis, soweit bekannt.">${esc(e.text || '')}</textarea></label>
    ${e.von ? `<p class="sb-hinweis">Zuletzt eingetragen von ${esc(e.von)} am ${esc(datum(e.geaendert || e.zeit))}.</p>` : ''}${nameFeld()}
    <div class="fenster__kn sb-kn">${e.wid ? '<button class="link rot" type="button" id="f-weg">Entfernen</button><span></span>' : ''}<button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">${e.wid ? 'Übernehmen' : 'Hinzufügen'}<i>${SYM.haken}</i></button></div>`, true, async () => {
    const von = nameAus(); if (!von) return;
    try { const b = $('#f-ber').value;
      await api('wissen_eintrag', { wid: e.wid || '', bereich: b, titel: $('#f-titel').value, text: $('#f-text').value, gueltig_bis: $('#f-bis').value || null, von });
      if (e.oid) await api('wissen_offen_weg', { oid: e.oid }).catch(() => {});
      fensterZu(); S.offen[b] = true; S.bereich = b; await wissenNeu(); quit(e.wid ? 'Geändert' : 'Hinzugefügt', 'Der Chat antwortet ab der nächsten Frage damit.', [], false, 4500); } catch (err) { fehler(err); }
  });
  const w = $('#f-weg'); if (w) w.onclick = async () => { const von = nameAus(); if (!von) return;
    try { await api('wissen_eintrag_weg', { wid: e.wid, von }); fensterZu(); await wissenNeu(); quit('Entfernt', 'Der Chat weiss das ab der nächsten Frage nicht mehr.', [], false, 3500); } catch (err) { fehler(err); } };
  setTimeout(() => { const t = $(e.wid ? '#f-text' : '#f-titel'); if (t) t.focus(); }, 60);
}
function wachen() {   // solange ein Link gelesen wird, alle drei Sekunden nachsehen
  clearInterval(wachUhr);
  wachUhr = setInterval(async () => {
    try { const d = await api('wissen_links'), offen = d.links.filter(x => x.status === 'liest');
      const fertig = (S.wissen ? S.wissen.links : []).filter(x => x.status === 'liest').map(x => d.links.find(y => y.lid === x.lid)).filter(x => x && x.status !== 'liest');
      if (fertig.length || !offen.length) {
        if (!offen.length) clearInterval(wachUhr);
        if (S.ansicht === 'wissen' && !$('#fenster').innerHTML) await wissenNeu(); else S.wissen = null;
        fertig.forEach(x => x.status === 'fertig'
          ? quit(mal(x.wids.length, 'Ein Eintrag', x.wids.length + ' Einträge') + ' übernommen', (x.titel || host(x.url)) + '. Der Chat kennt sie ab jetzt.', [['Ansehen', () => { S.such = ''; gehe('wissen'); }]], false, 8000)
          : quit(x.status === 'leer' ? 'Nichts für Gäste gefunden' : 'Liess sich nicht lesen', x.meldung || '', [], true, 9000));
      }
    } catch (e) { /* still */ }
  }, 3000);
}

/* ---------- Chat ausprobieren (Robert 16.10.2026: «landet auf der Website und hat keine Ahnung, was man machen soll») ----------
   Schäfli (21.10.2026, wie Schlössli 19.10.2026): Die Website des Hauses hat noch keinen Chat. Rechts steht deshalb das Chatfenster selbst, wie ein Gast es auf dem Handy sähe,
   und fragt denselben Weg wie später die Website (/api/gast). Ohne RECEPTION_KI=1 antwortet es mit Probe-Antworten, beschriftet.
   Anfragen und Fragen aus der Probe markiert der Server als Beispiel (Kopfzeile X-Reception-Probe). */
const PROBEFRAGEN = ['Habt ihr am Montag offen?', 'Was kostet das Trüffelmenü?', 'Wie viele Personen passen in den Festsaal?', 'Darf mein Hund mitkommen?'];
function probe() {
  let o = $('#probe');
  if (!o) { o = document.createElement('div'); o.id = 'probe'; o.className = 'probe'; document.body.appendChild(o); }
  const verlauf = [];
  o.innerHTML = `<div class="probe__k" role="dialog" aria-modal="true" aria-label="Chat ausprobieren">
      <aside class="probe__links">
        <button class="rund probe__zu" type="button" aria-label="Schliessen">${ZU}</button>
        <span class="mono">Chat ausprobieren</span>
        <h2>So fragt <em>ein Gast.</em></h2>
        <p>Hier sehen Sie den Chat so, wie Gäste ihn auf dem Handy sehen würden. Tippen Sie eine Frage an oder schreiben Sie selbst ins Feld. Auf der Website des Schäfli steht der Chat noch nicht.</p>
        <div class="probe__fragen">${PROBEFRAGEN.map(f => `<button type="button" data-frage="${esc(f)}"><i>${SYM.chat}</i><span>${esc(f)}</span></button>`).join('')}</div>
        <p class="probe__klein">Möchte der Gast reservieren oder eine Feier anfragen, fragt der Chat nach Name und Kontakt. Nennen Sie beides, liegt die Anfrage danach im Eingang, als Beispiel markiert.</p>
        <div class="probe__kn"><button class="kn kn--gold" type="button" id="probe-eingang">Zurück zum Eingang<i>${PF}</i></button></div>
      </aside>
      <div class="probe__rechts"><div class="ws-handy" aria-label="Chat der Taverne zum Schäfli">
        <header class="ws-handy__kopf">${ZEICHEN}<div><b>Taverne zum Schäfli</b><small>Fragen an das Haus</small></div></header>
        <div class="ws-handy__l" id="probe-l" aria-live="polite"><p class="ws-bl ws-bl--haus">Grüezi. Was möchten Sie über die Taverne zum Schäfli wissen?</p></div>
        <form class="ws-handy__feld" id="probe-form"><textarea id="probe-t" rows="1" maxlength="600" placeholder="Ihre Frage" aria-label="Ihre Frage"></textarea><button class="rund" type="submit" aria-label="Senden">${PF}</button></form>
      </div></div>
    </div>`;
  o.hidden = false; document.documentElement.classList.add('probe-offen');
  const liste = $('#probe-l', o), feld = $('#probe-t', o);
  const blase = (text, wer) => { const p = document.createElement('p'); p.className = 'ws-bl ws-bl--' + wer; p.setAttribute('dir', 'auto'); p.textContent = text; liste.appendChild(p); liste.scrollTop = liste.scrollHeight; return p; };
  const frage = async t => {
    t = String(t || '').trim(); if (!t || o.dataset.laeuft) return;
    o.dataset.laeuft = '1'; blase(t, 'gast'); verlauf.push({ role: 'user', content: t }); feld.value = '';
    const w = blase('…', 'haus'); w.classList.add('ws-bl--wartet');
    try {
      const r = await fetch('/api/gast', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Reception-Probe': '1' }, body: JSON.stringify({ messages: verlauf, sprache: 'de' }) });
      const d = await r.json().catch(() => ({}));
      const text = r.ok ? (d.text || '') : 'Der Chat antwortet gerade nicht (' + (d.fehler || r.status) + ').';
      w.textContent = text; w.classList.remove('ws-bl--wartet'); verlauf.push({ role: 'assistant', content: text });
      if (d.maske) { const k = document.createElement('a'); k.className = 'ws-bl ws-bl--weg'; k.href = 'https://bookings.zenchef.com/results?rid=378685&pid=1001'; k.target = '_blank'; k.rel = 'noopener'; k.textContent = 'Zur Reservation online'; liste.appendChild(k); }
      S.anfragen = null; S.fragen = null;
    } catch (e) { w.textContent = 'Keine Verbindung zum Chat.'; w.classList.remove('ws-bl--wartet'); }
    delete o.dataset.laeuft; liste.scrollTop = liste.scrollHeight;
  };
  $('#probe-form', o).onsubmit = e => { e.preventDefault(); frage(feld.value); };
  feld.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); frage(feld.value); } };
  $$('.probe__fragen [data-frage]', o).forEach(b => b.onclick = () => frage(b.dataset.frage));
  const zu = () => { o.hidden = true; o.innerHTML = ''; document.documentElement.classList.remove('probe-offen'); document.removeEventListener('keydown', taste); };
  const taste = e => { if (e.key === 'Escape' && !o.hidden && !(e.target && e.target.id === 'probe-t')) zu(); };
  $('.probe__zu', o).onclick = zu;
  o.onclick = e => { if (e.target === o) zu(); };
  $('#probe-eingang').onclick = () => { zu(); S.anfragen = null; S.fragen = null; frisch(); gehe('eingang'); };
  document.addEventListener('keydown', taste);
  setTimeout(() => feld.focus({ preventScroll: true }), 300);
}

/* ---------- Fenster ---------- */
function fenster(html, schmal = false, los = null) {
  const f = $('#fenster');
  f.innerHTML = `<div class="fenster__k${schmal ? ' schmal' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false;
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  if (los && $('#f-los')) $('#f-los').onclick = los;
}
function fensterZu() { $('#fenster').hidden = true; $('#fenster').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu(); });

/* ---------- Start ---------- */
(async function () {
  try { S.ue = await Promise.race([api('ueberblick'), new Promise((_, nein) => setTimeout(() => nein(new Error('SERVER · Der Server-Teil antwortet nicht.')), 12000))]); }
  catch (e) { $('#tuer').hidden = false; $('#tuer-t').textContent = /^VERBINDUNG · /.test(e.message || '') ? 'Keine Verbindung zum Server-Teil. Bitte gleich neu laden.' : String(e.message || e).replace(/^[A-ZÄÖÜ]+ · /, ''); return; }
  const h = location.hash.slice(1);
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) try { const l = await api('wissen_links'); S.wissenDa = true; S.wissenNeu = 0; if (l.links.some(x => x.status === 'liest')) wachen(); } catch (e) { S.wissenDa = false; }   // «Das weiss der Chat» gibt es bisher nur lokal (serve.py); online wird gar nicht erst gefragt, sonst steht ein 400 in der Konsole
  try { S.ansicht = ['start', 'eingang', 'gefragt', 'nachgetragen', 'wissen'].includes(h) ? h : ((/\/maison\/?(index\.html)?([?#].*)?$/.test(document.referrer) && ((performance.getEntriesByType('navigation')[0] || {}).type !== 'reload')) ? (localStorage.removeItem('reception-ansicht'), 'start') : localStorage.getItem('reception-ansicht') || 'start'); }   /* Aus La Maison geöffnet: immer auf der Übersicht anfangen (Robert 16.10.2026), beim Neuladen bleibt die letzte Ansicht */ catch (e) { S.ansicht = 'start'; }
  if (!TITEL[S.ansicht] || (S.ansicht === 'wissen' && !S.wissenDa)) S.ansicht = 'start';
  rand(); leiste(); await zeichne();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
  setInterval(async () => {   // alle zwei Minuten nachsehen, ob etwas Neues da ist (ohne die Ansicht zu stören)
    try { const u = await api('ueberblick'); if (u.anfragen_gesamt !== S.ue.anfragen_gesamt || u.fragen_gesamt !== S.ue.fragen_gesamt || u.anfragen_neu !== S.ue.anfragen_neu) { S.ue = u; S.anfragen = null; S.fragen = null; rand(); leiste(); if (S.ansicht !== 'eingang' || !$('#e-text')) zeichne(); } } catch (e) { /* still */ }
  }, 120000);
})();

/* Abnahme 17.10.2026 (_bau/abnahme.py): nichts geht beim Wechseln oder Verlassen still verloren. */
function nurTextOffen() {
  const tx = $('#e-text'), be = $('#e-betreff'), a = S.anfragen && S.anfragen.find(x => x.id === S.wahl);
  return tx && be && a && a.entwurf && (tx.value !== a.entwurf.text || be.value !== a.entwurf.betreff) ? { a, betreff: be.value, text: tx.value } : null;
}
function wartendesSichern() {
  if ($('#brief') && S.briefSichern) Promise.resolve(S.briefSichern()).catch(() => {});
  const o = nurTextOffen();
  if (o) { o.a.entwurf.betreff = o.betreff; o.a.entwurf.text = o.text; api('anfrage', { id: o.a.id, betreff: o.betreff, entwurf_text: o.text }).then(() => quit('Gesichert', 'Ihre Änderung am Brief ist gespeichert.', [], false, 3000)).catch(fehler); }
}
addEventListener('beforeunload', ev => {
  const offen = nurTextOffen() || $('#gs-stand.laeuft') || $$('#fenster:not([hidden]) textarea, #fenster:not([hidden]) input[type=text], #w-text').some(x => x.value.trim() && x.value !== x.defaultValue);
  if ($('#gs-stand.laeuft') && S.briefSichern) S.briefSichern();   // sofort sichern; bleibt man auf der Seite, ist es danach gesichert
  if (offen) { ev.preventDefault(); ev.returnValue = ''; }
});
