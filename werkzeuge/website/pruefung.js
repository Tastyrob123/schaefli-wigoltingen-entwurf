/* pruefung.js · die Kontrollinstanz des Werkzeugs «website». Eigenständig: ohne website.js, ohne Bibliothek.
   Sie prüft (1) diesen Browser und die Dateien des Werkzeugs, (2) fragt den Server nach seiner eigenen Prüfung
   (/api/x/website/pruefung/<haus>), (3) bietet begrenzte Reparaturen an und (4) kennt im Lexikon jede bekannte Fehlerquelle.
   Jede Fehlermeldung des Werkzeugs trägt ein Stichwort und führt mit «Was tun?» zum Eintrag #lex-<stichwort>.
   Steht ein Stichwort hier nicht, ist das ein Fehler im Lexikon (pruef.js vergleicht die Stichworte von api.py mit dieser Liste). */
(() => {
'use strict';
const HAUS = new URLSearchParams(location.search).get('haus') || '';
/* Anrede (29.10.2026): Häuser, die ihr Team duzen (Culinarium, Robert). Alle anderen behalten «Sie», Wort für Wort wie bisher. */ const DU = ['culinarium'].includes(HAUS); const A = (sie, du) => DU ? du : sie;
const $ = s => document.querySelector(s);
const HAKEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>';
const KREUZ = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
function el(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) { if (v === false || v == null) continue; if (k === 'html') e.innerHTML = v; else if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); }
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

// ---------------------------------------------------------------- Lexikon: jede bekannte Fehlerquelle, in Alltagssprache
// Felder: id (Stichwort) · titel · sehen (was Sie sehen) · grund (woran es liegt) · tun (was Sie tun) · worte (Suchbegriffe)
const LEX = [
  { id: 'keine-verbindung', titel: 'Das Werkzeug antwortet nicht',
    sehen: 'Die Seite bleibt leer oder meldet «Der Server des Werkzeugs antwortet nicht». Nichts lässt sich speichern.',
    grund: A('Ihr Gerät hat kein Netz, oder das Programm, das die Werkzeuge ausliefert (serve.py), läuft nicht mehr.', 'Dein Gerät hat kein Netz, oder das Programm, das die Werkzeuge ausliefert (serve.py), läuft nicht mehr.'),
    tun: A('Erst eine andere Website öffnen: geht die, liegt es am Werkzeug. Dann diese Prüfung neu laden. Antwortet der Server weiter nicht, Ihrem Ansprechpartner Bescheid geben: er startet ihn neu. Ihr Entwurf liegt auf dem Server und geht dabei nicht verloren.', 'Erst eine andere Website öffnen: geht die, liegt es am Werkzeug. Dann diese Prüfung neu laden. Antwortet der Server weiter nicht, deinem Ansprechpartner Bescheid geben: er startet ihn neu. Dein Entwurf liegt auf dem Server und geht dabei nicht verloren.'),
    worte: 'verbindung offline leer antwortet nicht server netz laden' },
  { id: 'haus-unbekannt', titel: 'Das Haus fehlt in der Adresse oder ist unbekannt',
    sehen: '«In der Adresse fehlt das Haus» oder «Für dieses Haus liegt keine Beschreibung vor».',
    grund: 'Das Werkzeug ist für jedes Haus dasselbe. Welches Haus gemeint ist, steht in der Adresse hinter ?haus=. Fehlt das oder ist es falsch geschrieben, weiss das Werkzeug nicht, welche Website es zeigen soll.',
    tun: A('Die Adresse aus Ihrem Lesezeichen oder aus der Zentrale nehmen. Sie endet auf ?haus= und die Kennung Ihres Hauses.', 'Die Adresse aus deinem Lesezeichen oder aus der Zentrale nehmen. Sie endet auf ?haus= und die Kennung deines Hauses.'),
    worte: 'haus adresse kennung unbekannt beschreibung fehlt' },
  { id: 'beschreibung', titel: 'Die Beschreibung des Hauses ist nicht lesbar',
    sehen: 'Das Werkzeug startet nicht und nennt die Beschreibung des Hauses.',
    grund: A('In der Beschreibung steht, welche Seiten, Sprachen und Bereiche Ihr Haus hat. Die Datei ist beschädigt oder wurde fehlerhaft geändert.', 'In der Beschreibung steht, welche Seiten, Sprachen und Bereiche dein Haus hat. Die Datei ist beschädigt oder wurde fehlerhaft geändert.'),
    tun: A('Ihrem Ansprechpartner Bescheid geben. An Ihren Inhalten ist nichts verloren, sie liegen getrennt davon.', 'Deinem Ansprechpartner Bescheid geben. An deinen Inhalten ist nichts verloren, sie liegen getrennt davon.'),
    worte: 'beschreibung haus datei lesbar start' },
  { id: 'probe-fehlt', titel: 'Die Kopie der Seiten fehlt',
    sehen: '«Die Kopie der Seiten fehlt.» Vorschau und Listen bleiben leer.',
    grund: 'Das Werkzeug arbeitet auf einer Kopie der gebauten Website. Diese Kopie ist auf dem Server nicht vorhanden.',
    tun: A('Ihrem Ansprechpartner Bescheid geben: er legt die Kopie neu an (probe.py). Ihr Entwurf und der veröffentlichte Stand bleiben erhalten und werden danach wieder über die Seiten gelegt.', 'Deinem Ansprechpartner Bescheid geben: er legt die Kopie neu an (probe.py). Dein Entwurf und der veröffentlichte Stand bleiben erhalten und werden danach wieder über die Seiten gelegt.'),
    worte: 'kopie probe seiten fehlen vorschau leer' },
  { id: 'seite-fehlt', titel: 'Eine Seite fehlt in der Kopie oder in einer Sprache',
    sehen: '«Die Seite fehlt in der Kopie» oder «Diese Seite gibt es in dieser Sprache nicht».',
    grund: 'Die Beschreibung nennt eine Seite, die in der Kopie nicht liegt. Oder: eine Seite ist in dieser Sprache nie gebaut worden.',
    tun: A('Für die Sprache: die Vorschau auf DE stellen. Fehlt die deutsche Seite: Ihrem Ansprechpartner Bescheid geben.', 'Für die Sprache: die Vorschau auf DE stellen. Fehlt die deutsche Seite: deinem Ansprechpartner Bescheid geben.'),
    worte: 'seite fehlt sprache kopie' },
  { id: 'seite-unbekannt', titel: 'Diese Seite gehört nicht zur Website',
    sehen: '«… ist keine Seite dieser Website.»',
    grund: A('Die Adresse nennt eine Seite, die das Werkzeug für Ihr Haus nicht kennt, zum Beispiel aus einem alten Lesezeichen.', 'Die Adresse nennt eine Seite, die das Werkzeug für dein Haus nicht kennt, zum Beispiel aus einem alten Lesezeichen.'),
    tun: 'Oben in der Auswahl «Seite» eine Seite wählen.',
    worte: 'seite unbekannt lesezeichen' },
  { id: 'sprache-unbekannt', titel: A('Diese Sprache hat Ihr Haus nicht', 'Diese Sprache hat dein Haus nicht'),
    sehen: '«Die Sprache … hat dieses Haus nicht.»',
    grund: A('Die Anfrage nennt eine Sprache, in der Ihre Website nicht gebaut ist.', 'Die Anfrage nennt eine Sprache, in der deine Website nicht gebaut ist.'),
    tun: 'Eine der Sprachen wählen, die über der Vorschau stehen.',
    worte: 'sprache unbekannt' },
  { id: 'stelle-fehlt', titel: 'Eine Änderung findet ihre Stelle nicht mehr',
    sehen: '«Diese Stelle gibt es auf der Seite nicht mehr» oder beim Veröffentlichen: «… Änderungen finden ihre Stelle nicht mehr. Nichts wurde veröffentlicht.»',
    grund: 'Jede Änderung hängt an einem bestimmten Text oder Foto der gebauten Seite. Wurde die Website neu gebaut und steht dort jetzt ein anderer Text, gibt es die Stelle nicht mehr. Das Werkzeug rät dann nicht, wohin die Änderung gehört, und veröffentlicht nichts.',
    tun: 'Die Seite neu laden und die Stelle noch einmal anklicken. Bleibt die Meldung beim Veröffentlichen: unten «Änderungen ohne Platz entfernen» drücken und die Angabe an der neuen Stelle noch einmal eintragen.',
    worte: 'stelle fehlt platz veröffentlichen neu gebaut' },
  { id: 'gesperrt', titel: 'Diese Stelle pflegt ein anderes Werkzeug',
    sehen: 'In der Vorschau ist ein Abschnitt gepunktet umrandet, rechts steht «Gesperrt».',
    grund: 'Karten mit Gerichten, Getränken und Preisen haben eine einzige Quelle: das Werkzeug für Karten. Könnte man sie auch hier ändern, stünden Website und PDF bald verschieden da.',
    tun: A('Den Knopf zum Karten-Werkzeug nehmen und dort ändern. Texte rund um die Karte (Überschrift, Einleitung) ändern Sie weiter hier.', 'Den Knopf zum Karten-Werkzeug nehmen und dort ändern. Texte rund um die Karte (Überschrift, Einleitung) änderst du weiter hier.'),
    worte: 'gesperrt karte speisekarte gepunktet anderes werkzeug' },
  { id: 'leer', titel: 'Ein leerer Text wird nicht gespeichert',
    sehen: '«Ein leerer Text bleibt als Lücke stehen.» oder «Ein Hinweis ohne Text bleibt unsichtbar.»',
    grund: 'Ein leeres Feld liesse auf der Website eine Lücke im Aufbau zurück.',
    tun: 'Soll etwas ganz verschwinden: «Abschnitt ausblenden» nehmen. Sonst einen Text eintragen.',
    worte: 'leer text lücke ausblenden' },
  { id: 'zu-lang', titel: 'Der Text ist zu lang für eine Stelle',
    sehen: '«Dieser Text ist zu lang für eine Stelle.»',
    grund: 'Eine einzelne Stelle fasst höchstens 6000 Zeichen. Mehr deutet auf einen versehentlich eingefügten ganzen Text.',
    tun: 'Den Text kürzen oder auf die Stellen verteilen, die es auf der Seite gibt.',
    worte: 'lang text zeichen' },
  { id: 'foto-unbekannt', titel: 'Dieses Foto gibt es auf der Website nicht',
    sehen: '«Dieses Foto gibt es auf der Website nicht.»',
    grund: 'Tauschen lässt sich ein Foto nur gegen eines, das auf der Website schon vorkommt. Nur davon kennt das Werkzeug alle Grössen.',
    tun: A('Ein Foto aus der Auswahl nehmen. Neue Fotos bringt Ihr Ansprechpartner ein.', 'Ein Foto aus der Auswahl nehmen. Neue Fotos bringt dein Ansprechpartner ein.'),
    worte: 'foto bild unbekannt tauschen' },
  { id: 'link', titel: 'Die Adresse eines Links ist nicht gültig',
    sehen: '«Eine Adresse beginnt mit https://, mailto: oder tel: …»',
    grund: 'Ein Link, der nirgends hinführt, wäre auf der Website ein toter Knopf.',
    tun: 'Die ganze Adresse eintragen, mit https:// am Anfang. Für eine eigene Seite den Dateinamen, zum Beispiel zimmer.html. Für eine E-Mail mailto: und die Adresse.',
    worte: 'link adresse https mailto tel ungültig' },
  { id: 'datum', titel: 'Ein Datum ist nicht lesbar',
    sehen: A('«Ein Datum schreiben Sie so: 24.12.2026», «Dieses Datum gibt es nicht» oder «Bis liegt vor Von».', '«Ein Datum schreibst du so: 24.12.2026», «Dieses Datum gibt es nicht» oder «Bis liegt vor Von».'),
    grund: 'Der Hinweis für Gäste erscheint und verschwindet nach Datum. Dafür muss das Datum eindeutig sein.',
    tun: 'Tag, Monat und Jahr mit Punkten schreiben: 24.12.2026. «Bis» muss nach «Von» liegen. Leer heisst: ohne Grenze.',
    worte: 'datum hinweis von bis' },
  { id: 'bereich-aus', titel: A('Diesen Bereich hat Ihr Haus nicht', 'Diesen Bereich hat dein Haus nicht'),
    sehen: '«Diesen Bereich hat das Haus nicht.»',
    grund: A('Welche Bereiche es gibt (Zimmer, Säle, Packages …), steht in der Beschreibung Ihres Hauses. Ein Haus ohne Säle sieht keine Säle.', 'Welche Bereiche es gibt (Zimmer, Säle, Packages …), steht in der Beschreibung deines Hauses. Ein Haus ohne Säle sieht keine Säle.'),
    tun: A('Links einen der gezeigten Bereiche wählen. Fehlt einer, den Ihr Haus braucht: Ihrem Ansprechpartner Bescheid geben.', 'Links einen der gezeigten Bereiche wählen. Fehlt einer, den dein Haus braucht: deinem Ansprechpartner Bescheid geben.'),
    worte: 'bereich säle fehlt ausgeschaltet' },
  { id: 'bereich-feld', titel: 'Ein Bereich findet seine Felder auf den Seiten nicht',
    sehen: 'In einem Bereich steht «Nicht jedes Feld liess sich auf den Seiten finden». Die Prüfung meldet es beim Punkt «Bereiche».',
    grund: 'Die Felder eines Bereichs werden aus den gebauten Seiten gelesen. Wurde die Website umgebaut, stehen manche Angaben an anderer Stelle, und die Beschreibung des Hauses zeigt noch auf die alte.',
    tun: A('Die Angabe über «Seiten» direkt in der Vorschau ändern, das geht immer. Ihrem Ansprechpartner Bescheid geben, damit er die Beschreibung nachzieht.', 'Die Angabe über «Seiten» direkt in der Vorschau ändern, das geht immer. Deinem Ansprechpartner Bescheid geben, damit er die Beschreibung nachzieht.'),
    worte: 'bereich feld nicht gefunden zimmer säle' },
  { id: 'zahlen-leer', titel: '«Zeiten und Preise» ist leer',
    sehen: 'Die Liste zeigt keine Angaben.',
    grund: 'Auf den Seiten wurde keine Zeit, kein Preis und kein Mass erkannt. Das Muster dafür steht in der Beschreibung des Hauses.',
    tun: A('Zahlen über «Seiten» direkt in der Vorschau ändern. Ihrem Ansprechpartner Bescheid geben.', 'Zahlen über «Seiten» direkt in der Vorschau ändern. Deinem Ansprechpartner Bescheid geben.'),
    worte: 'zeiten preise leer liste' },
  { id: 'nicht-gespeichert', titel: 'Geändert, aber noch nicht gespeichert',
    sehen: 'Der Knopf «Speichern» oben ist dunkel, daneben steht «Eingabe noch nicht gespeichert». Beim Weitergehen fragt das Werkzeug nach.',
    grund: 'Eine Eingabe wird erst mit «Speichern» in den Entwurf übernommen. Was nur im Feld steht, ginge beim Wechsel der Ansicht verloren.',
    tun: 'Oben auf «Speichern» drücken. Danach erscheint eine Quittung mit «Vorher, nachher» und «Rückgängig».',
    worte: 'speichern dunkel eingabe verloren' },
  { id: 'nicht-veroeffentlicht', titel: 'Gespeichert, aber nicht auf der Website',
    sehen: 'Im Werkzeug steht die Änderung, auf der Website nicht. Unten steht die rote Marke «Entwurf».',
    grund: 'Das Werkzeug arbeitet in zwei Stufen. Gespeichert heisst: im Entwurf. Erst «Veröffentlichen» bringt es auf die Website.',
    tun: 'Unten «Vorher, nachher» ansehen, dann «Veröffentlichen».',
    worte: 'veröffentlichen entwurf website nicht sichtbar' },
  { id: 'nichts-offen', titel: 'Nichts geändert, nichts veröffentlicht',
    sehen: '«Nichts geändert, nichts veröffentlicht.»',
    grund: 'Im Entwurf liegt nichts, das von der veröffentlichten Website abweicht. Vielleicht hat jemand anderes inzwischen veröffentlicht oder den Entwurf verworfen.',
    tun: 'Die Seite neu laden. Im Verlauf steht, wer zuletzt veröffentlicht hat.',
    worte: 'nichts geändert veröffentlicht leer' },
  { id: 'konflikt', titel: 'Zwei haben gleichzeitig geändert',
    sehen: 'Beim Speichern erscheint «Zwei haben gleichzeitig geändert». Oder beim Veröffentlichen: «Der Entwurf wurde inzwischen von anderer Seite geändert».',
    grund: A('Zwischen Ihrem Öffnen und Ihrem Speichern hat jemand anderes gespeichert. Das Werkzeug überschreibt dessen Arbeit nie still.', 'Zwischen deinem Öffnen und deinem Speichern hat jemand anderes gespeichert. Das Werkzeug überschreibt dessen Arbeit nie still.'),
    tun: A('Im Fenster lesen, was neu von anderer Seite kam. «Meine Eingabe speichern» legt Ihre Eingabe auf den neuen Stand; betrifft sie dieselbe Stelle, steht das ausdrücklich da. Vor dem Veröffentlichen «Vorher, nachher» noch einmal ansehen.', 'Im Fenster lesen, was neu von anderer Seite kam. «Meine Eingabe speichern» legt deine Eingabe auf den neuen Stand; betrifft sie dieselbe Stelle, steht das ausdrücklich da. Vor dem Veröffentlichen «Vorher, nachher» noch einmal ansehen.'),
    worte: 'konflikt gleichzeitig zwei überschreiben 409' },
  { id: 'uebersetzung-fehlt', titel: 'Eine Übersetzung fehlt',
    sehen: 'Unten steht «… Übersetzungen fehlen», bei einer Änderung die Marke «fehlt».',
    grund: 'Der deutsche Text wurde geändert, die Fassung in einer anderen Sprache nicht. Damit dort keine alte Angabe stehen bleibt (eine alte Zeit, ein alter Preis), setzt das Werkzeug in dieser Sprache den neuen deutschen Text ein.',
    tun: 'Links «Sprachen» öffnen, bei der Änderung «Übersetzen» drücken und die Fassung eintragen. Hat sich im Deutschen nur eine Zahl geändert, schlägt das Werkzeug die Übersetzung mit der neuen Zahl vor.',
    worte: 'übersetzung fehlt sprache englisch deutsch steht' },
  { id: 'sprache-zuordnung', titel: 'Stellen einer Sprache lassen sich nicht zuordnen',
    sehen: 'Die Prüfung meldet bei «Zuordnung» weniger Gegenstücke als deutsche Stellen. Bei einer Stelle steht «kein Gegenstück».',
    grund: 'Das Werkzeug findet die Stelle einer anderen Sprache über ihren Platz im Aufbau der Seite. Ist eine Seite in einer Sprache anders aufgebaut (zum Beispiel für Schrift von rechts nach links), gibt es für einzelne Stellen kein Gegenstück. Dort ändert das Werkzeug nichts, statt zu raten.',
    tun: A('Nichts, solange die betroffenen Stellen nicht geändert werden sollen. Sonst Ihrem Ansprechpartner Bescheid geben: die Stelle wird im Bau der Website nachgezogen.', 'Nichts, solange die betroffenen Stellen nicht geändert werden sollen. Sonst deinem Ansprechpartner Bescheid geben: die Stelle wird im Bau der Website nachgezogen.'),
    worte: 'zuordnung gegenstück sprache arabisch aufbau' },
  { id: 'unveraendert', titel: 'Eine unveränderte Seite kommt nicht gleich zurück',
    sehen: 'Die Prüfung meldet beim Punkt «Byte für Byte gleich» eine Abweichung.',
    grund: 'Ohne Änderung muss das Werkzeug jede Seite genau so ausgeben, wie sie gebaut wurde. Tut es das nicht, liest es eine Seite falsch.',
    tun: A('Nichts veröffentlichen. Ihrem Ansprechpartner Bescheid geben und die genannte Seite nennen.', 'Nichts veröffentlichen. Deinem Ansprechpartner Bescheid geben und die genannte Seite nennen.'),
    worte: 'byte gleich unverändert abweichung' },
  { id: 'ausgabe', titel: 'Die Seiten online passen nicht zum veröffentlichten Stand',
    sehen: 'Nach dem Veröffentlichen: «… nicht jede Seite liess sich schreiben». Oder die Prüfung meldet abweichende Dateien.',
    grund: 'Der Stand ist veröffentlicht, aber beim Schreiben der Seiten ging etwas schief (voller Speicher, fehlendes Schreibrecht), oder eine Seite wurde von Hand geändert.',
    tun: 'Unten «Seiten neu ausgeben» drücken. Das schreibt jede Seite noch einmal aus der gebauten Seite und dem veröffentlichten Stand.',
    worte: 'ausgabe seiten schreiben online abweichung' },
  { id: 'beschaedigt', titel: 'Eine gespeicherte Datei ist beschädigt',
    sehen: '«… ist nicht lesbar, keine Sicherung» oder «… und ihre Sicherung sind nicht lesbar».',
    grund: 'Die Datei mit dem Stand oder dem Entwurf lässt sich nicht lesen und es gibt keine Sicherung davon. Das Werkzeug liest dann nie still einen leeren Stand, sondern bricht ab.',
    tun: A('Nichts weiter ändern. Ihrem Ansprechpartner Bescheid geben: der Verlauf enthält jeden veröffentlichten Stand, daraus wird der letzte wiederhergestellt.', 'Nichts weiter ändern. Deinem Ansprechpartner Bescheid geben: der Verlauf enthält jeden veröffentlichten Stand, daraus wird der letzte wiederhergestellt.'),
    worte: 'beschädigt datei sicherung lesbar' },
  { id: 'aus-sicherung', titel: 'Ein Stand kam aus der Sicherung zurück',
    sehen: 'Im Protokoll steht «Stand aus der Sicherung geholt».',
    grund: 'Eine Datei war beschädigt. Das Werkzeug hat die Sicherung genommen: das ist der Stand vor der letzten Änderung. Die letzte Änderung fehlt also.',
    tun: 'Im Verlauf und im Entwurf nachsehen, welche Änderung fehlt, und sie noch einmal eintragen.',
    worte: 'sicherung zurück protokoll letzte änderung fehlt' },
  { id: 'alte-fassung', titel: 'Der Browser zeigt eine ältere Fassung des Werkzeugs',
    sehen: 'Knöpfe fehlen oder tun etwas anderes als beschrieben. Die Prüfung meldet, dass die Fassung der Seite nicht zur Fassung des Servers passt.',
    grund: 'Der Browser hat Dateien des Werkzeugs aus seinem Zwischenspeicher genommen, obwohl auf dem Server neuere liegen.',
    tun: 'Die Seite des Werkzeugs mit gedrückter Umschalttaste neu laden. Hilft das nicht: den Zwischenspeicher des Browsers leeren.',
    worte: 'alt fassung version zwischenspeicher neu laden' },
  { id: 'datei-fehlt', titel: 'Eine Datei des Werkzeugs fehlt',
    sehen: 'Die Prüfung meldet beim Punkt «Dateien des Werkzeugs» eine fehlende Datei. Das Werkzeug sieht ungestaltet aus oder reagiert nicht.',
    grund: 'Eine der Dateien, aus denen das Werkzeug besteht, wird vom Server nicht geliefert.',
    tun: A('Ihrem Ansprechpartner Bescheid geben und die genannte Datei nennen.', 'Deinem Ansprechpartner Bescheid geben und die genannte Datei nennen.'),
    worte: 'datei fehlt ungestaltet reagiert nicht' },
  { id: 'browser-speicher', titel: 'Der Browser merkt sich nichts',
    sehen: A('Ihr Name im Protokoll ist nach dem Neuladen weg, die gewählte Welt springt zurück.', 'Dein Name im Protokoll ist nach dem Neuladen weg, die gewählte Welt springt zurück.'),
    grund: A('Der Speicher des Browsers für diese Adresse ist abgeschaltet oder voll (privates Fenster, strenge Einstellungen). Ihre Inhalte betrifft das nicht, die liegen auf dem Server.', 'Der Speicher des Browsers für diese Adresse ist abgeschaltet oder voll (privates Fenster, strenge Einstellungen). Deine Inhalte betrifft das nicht, die liegen auf dem Server.'),
    tun: 'Ein normales Fenster statt eines privaten nehmen oder den Speicher für diese Adresse erlauben.',
    worte: 'browser speicher merkt name welt privat' },
  { id: 'anfrage', titel: 'Die Anfrage war unvollständig',
    sehen: '«Es fehlt, was geändert werden soll», «Diese Art von Änderung kennt das Werkzeug nicht», «Die Anfrage ist kein gültiges JSON» oder «Es fehlt daten».',
    grund: 'Das Werkzeug hat dem Server etwas geschickt, das er nicht versteht. Das kommt vor, wenn der Browser eine ältere Fassung des Werkzeugs zeigt als der Server.',
    tun: A('Die Seite mit gedrückter Umschalttaste neu laden und die Eingabe wiederholen. Bleibt es: Ihrem Ansprechpartner Bescheid geben.', 'Die Seite mit gedrückter Umschalttaste neu laden und die Eingabe wiederholen. Bleibt es: deinem Ansprechpartner Bescheid geben.'),
    worte: 'anfrage unvollständig json fehlt daten unlesbar' },
  { id: 'zu-gross', titel: 'Die Anfrage ist zu gross',
    sehen: '«Zu gross».',
    grund: 'Eine einzelne Anfrage darf höchstens 20 MB haben.',
    tun: 'Die Änderung in kleineren Schritten speichern.',
    worte: 'gross anfrage 413' },
  { id: 'weg-unbekannt', titel: 'Diesen Weg kennt der Server nicht',
    sehen: '«Weg unbekannt», «Nicht gefunden», «Nicht erlaubt» oder «Fassung unbekannt».',
    grund: 'Das Werkzeug fragt nach etwas, das es auf dem Server nicht gibt: meist zeigt der Browser eine andere Fassung des Werkzeugs als der Server, oder eine Fassung im Verlauf wurde entfernt.',
    tun: A('Die Seite mit gedrückter Umschalttaste neu laden. Bleibt es: Ihrem Ansprechpartner Bescheid geben.', 'Die Seite mit gedrückter Umschalttaste neu laden. Bleibt es: deinem Ansprechpartner Bescheid geben.'),
    worte: 'weg unbekannt nicht gefunden 404 405 fassung' },
  { id: 'angabe-unbekannt', titel: 'Diese Angabe kennt das Werkzeug nicht',
    sehen: '«Diese Angabe kennt das Werkzeug nicht.»',
    grund: 'Unter «Angaben des Hauses» stehen nur die Angaben, die in der Beschreibung des Hauses eingetragen sind. Der Browser zeigt vermutlich eine ältere Fassung.',
    tun: A('Die Seite neu laden. Bleibt es: Ihrem Ansprechpartner Bescheid geben.', 'Die Seite neu laden. Bleibt es: deinem Ansprechpartner Bescheid geben.'),
    worte: 'angabe unbekannt telefon adresse' },
  { id: 'angabe-telefon', titel: 'Die Telefonnummer hat eine ungültige Form',
    sehen: '«Eine Telefonnummer besteht nur aus Ziffern und Leerzeichen, vorne höchstens ein «+».»',
    grund: 'Aus der Nummer entsteht auch der Link zum Anrufen auf dem Handy. Buchstaben, Klammern oder Schrägstriche machen ihn unbrauchbar.',
    tun: 'Die Nummer so schreiben, wie sie auf der Website stehen soll, zum Beispiel «+41 52 763 11 72», und noch einmal speichern.',
    worte: 'telefon nummer ziffern anrufen' },
  { id: 'angabe-mail', titel: 'Die E-Mail-Adresse hat eine ungültige Form',
    sehen: '«Eine E-Mail-Adresse sieht so aus: name@haus.ch»',
    grund: 'Die Adresse braucht genau ein @ und eine Endung wie .ch.',
    tun: 'Die Adresse prüfen (keine Leerzeichen, ein @) und noch einmal speichern.',
    worte: 'mail e-mail adresse @' },
  { id: 'bild-kaputt', titel: 'Das Foto kam nicht vollständig an',
    sehen: '«Die Datei kam nicht vollständig an» oder «Die Datei liess sich nicht lesen».',
    grund: 'Die Verbindung brach beim Hochladen ab, oder die Datei ist beschädigt.',
    tun: 'Das Foto noch einmal wählen. Geht es wieder nicht: das Foto am Rechner öffnen und neu sichern, dann diese Fassung hochladen.',
    worte: 'foto hochladen kaputt abgebrochen' },
  { id: 'bild-gross', titel: 'Das Foto ist zu gross',
    sehen: '«Das Foto ist grösser als 25 MB.»',
    grund: 'Fotos über 25 MB nimmt das Werkzeug nicht an. Für die Website reicht weit weniger, das Werkzeug setzt jedes Foto ohnehin neu in vier Grössen.',
    tun: 'Eine kleinere Fassung wählen, zum Beispiel in der Fotos-App über «Exportieren» mit mittlerer Grösse, und diese hochladen.',
    worte: 'foto gross 25 mb hochladen 413' },
  { id: 'bild-art', titel: 'Diese Datei ist kein Foto',
    sehen: '«Diese Datei ist kein Foto.»',
    grund: 'Möglich sind JPG, PNG und WebP. Ein PDF, ein Text oder ein Video lässt sich nicht als Foto auf die Website setzen.',
    tun: 'Ein Foto im Format JPG, PNG oder WebP wählen. Fotos vom iPhone (HEIC) zuerst als JPG exportieren.',
    worte: 'foto art pdf heic jpg png datei' },
  { id: 'bild-klein', titel: 'Das Foto ist zu klein',
    sehen: '«Das Foto ist nur … Pixel breit.»',
    grund: 'Ein Foto unter 900 Pixel Breite wirkt auf der Website unscharf, vor allem auf grossen Bildschirmen.',
    tun: 'Das Original wählen, nicht eine verkleinerte Fassung aus einer Mail oder einem Chat.',
    worte: 'foto klein pixel unscharf' },
  { id: 'unerwartet', titel: 'Ein unerwarteter Fehler',
    sehen: '«Unerwarteter Fehler: …» oder «Unerwartete Antwort des Servers».',
    grund: 'Etwas ist geschehen, das im Werkzeug nicht vorgesehen ist. Der Server schreibt den Fehler in seine Ausgabe, das Werkzeug merkt ihn sich in diesem Browser (oben unter «Was das Werkzeug gemerkt hat»).',
    tun: A('Die Seite neu laden und es noch einmal versuchen. Kommt der Fehler wieder: den Wortlaut von oben Ihrem Ansprechpartner schicken. Gespeichertes ist nicht verloren.', 'Die Seite neu laden und es noch einmal versuchen. Kommt der Fehler wieder: den Wortlaut von oben deinem Ansprechpartner schicken. Gespeichertes ist nicht verloren.'),
    worte: 'unerwartet fehler 500' },
];
const LEX_GLEICH = { 'anfrage-unlesbar': 'anfrage', 'anfrage-unvollstaendig': 'anfrage', 'nicht-erlaubt': 'weg-unbekannt', 'nicht-gefunden': 'weg-unbekannt', unbekannt: 'weg-unbekannt' };
window.WS_LEXIKON = LEX.map(l => l.id).concat(Object.keys(LEX_GLEICH));
const lexId = s => LEX_GLEICH[s] || (LEX.some(l => l.id === s) ? s : 'unerwartet');

function lexikon(filter) {
  const ort = $('#wsp-lexikon'), f = (filter || '').toLowerCase().trim();
  ort.textContent = '';
  let n = 0;
  LEX.forEach(l => {
    if (f && !(l.titel + ' ' + l.sehen + ' ' + l.grund + ' ' + l.tun + ' ' + l.worte).toLowerCase().includes(f)) return;
    n++;
    ort.append(el('details', { class: 'platte wsp-lex', id: 'lex-' + l.id },
      el('summary', {}, l.titel),
      el('dl', {}, el('dt', { class: 'angabe' }, 'Sehen'), el('dd', {}, l.sehen), el('dt', { class: 'angabe' }, 'Grund'), el('dd', {}, l.grund), el('dt', { class: 'angabe' }, 'Tun'), el('dd', {}, l.tun))));
  });
  if (!n) ort.append(el('p', { class: 'kuhle', style: 'padding:22px' }, A('Dazu steht nichts im Lexikon. Den Wortlaut der Meldung Ihrem Ansprechpartner schicken.', 'Dazu steht nichts im Lexikon. Den Wortlaut der Meldung deinem Ansprechpartner schicken.')));
}
function oeffne(id) {
  $('#wsp-such').value = '';
  lexikon('');
  const e = document.getElementById('lex-' + lexId(id));
  if (e) { e.open = true; e.scrollIntoView({ block: 'start' }); }
}

// ---------------------------------------------------------------- Punkte
function punkt(ort, p) {
  ort.append(el('div', { class: 'wsp-punkt', 'data-gut': p.gut ? 'ja' : 'nein', 'data-punkt': p.id },
    el('span', { class: 'wsp-punkt__z', html: p.gut ? HAKEN : KREUZ, role: 'img', 'aria-label': p.gut ? 'In Ordnung' : 'Nicht in Ordnung' }),
    el('span', { class: 'wsp-punkt__t' }, p.titel),
    el('span', { class: 'wsp-punkt__x' }, p.text + ' ', !p.gut && p.lex ? el('a', { href: '#lex-' + lexId(p.lex), onclick: ev => { ev.preventDefault(); oeffne(p.lex); history.replaceState(null, '', '#lex-' + lexId(p.lex)); } }, 'Was tun?') : null)));
}
async function hole(weg, opt) {
  let r;
  try { r = await fetch(weg, Object.assign({ cache: 'no-store' }, opt || {})); } catch (e) { throw { stichwort: 'keine-verbindung', fehler: 'Der Server antwortet nicht.' }; }
  let j = null;
  try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  if (!r.ok || j == null) throw Object.assign({ stichwort: 'unerwartet', fehler: 'Unerwartete Antwort (' + r.status + ').' }, j || {});
  return j;
}

async function browser() {
  const ort = $('#wsp-browser'), punkte = [];
  let speicherGeht = true;
  try { localStorage.setItem('wsp-probe', '1'); localStorage.removeItem('wsp-probe'); } catch (e) { speicherGeht = false; }
  punkte.push({ id: 'browser-speicher', titel: 'Speicher dieses Browsers', gut: speicherGeht, text: speicherGeht ? A('Der Browser merkt sich Ihren Namen und die gewählte Welt.', 'Der Browser merkt sich deinen Namen und die gewählte Welt.') : 'Der Browser merkt sich für diese Adresse nichts.', lex: 'browser-speicher' });
  const fehlen = [];
  let seiteV = '';
  for (const d of ['index.html', 'website.js', 'website.css', '/stamm/welt.css', '/stamm/welt.js']) {
    try {
      const r = await fetch(d, { cache: 'no-store' });
      if (!r.ok) fehlen.push(d);
      else if (d === 'index.html') seiteV = (/website\.js\?v=([\w.\-]+)/.exec(await r.text()) || [])[1] || '';
    } catch (e) { fehlen.push(d); }
  }
  punkte.push({ id: 'dateien', titel: 'Dateien des Werkzeugs', gut: !fehlen.length, text: fehlen.length ? 'Nicht geliefert: ' + fehlen.join(', ') + '.' : 'Seite, Skript, Gestaltung und die zwei Welten werden geliefert.', lex: fehlen.length === 5 ? 'keine-verbindung' : 'datei-fehlt' });
  let gemerkt = [];
  try { gemerkt = JSON.parse(localStorage.getItem('ws-fehler') || '[]').filter(f => !HAUS || !f.haus || f.haus === HAUS); } catch (e) { gemerkt = []; }
  const letzte = gemerkt.slice(-3).reverse();
  punkte.push({ id: 'gemerkt', titel: 'Was das Werkzeug gemerkt hat', gut: !gemerkt.length,
    text: gemerkt.length ? gemerkt.length + ' Meldung(en) in diesem Browser, zuletzt: ' + letzte.map(f => '«' + f.text + '» (' + (f.zeit || '').slice(0, 16).replace('T', ' ') + ')').join(' · ') : 'Keine Fehlermeldung gemerkt.',
    lex: letzte.length ? letzte[0].stichwort || 'unerwartet' : '' });
  ort.textContent = '';
  punkte.forEach(p => punkt(ort, p));
  return seiteV;
}

async function server(seiteV) {
  const ort = $('#wsp-server');
  ort.textContent = '';
  if (!HAUS) { punkt(ort, { id: 'haus', titel: 'Welches Haus?', gut: false, text: 'In der Adresse fehlt das Haus (?haus=…). Geprüft wurde nur dieser Browser.', lex: 'haus-unbekannt' }); return; }
  let d;
  try {
    const h = await hole('/api/haus/' + encodeURIComponent(HAUS));
    $('#wsp-haus').textContent = h.name || HAUS;
    punkt(ort, { id: 'verbindung', titel: 'Der Server antwortet', gut: true, text: 'Verbindung steht.' });
  } catch (e) {
    punkt(ort, { id: 'verbindung', titel: 'Der Server antwortet', gut: false, text: e.fehler || 'Keine Antwort.', lex: e.stichwort });
    if (e.stichwort === 'keine-verbindung') return;
  }
  try { d = await hole('/api/x/website/pruefung/' + encodeURIComponent(HAUS)); } catch (e) {
    punkt(ort, { id: 'pruefung', titel: 'Prüfung auf dem Server', gut: false, text: e.fehler || 'Die Prüfung liess sich nicht ausführen.', lex: e.stichwort });
    return;
  }
  punkt(ort, { id: 'fassung', titel: 'Fassung des Werkzeugs', gut: !seiteV || seiteV === d.version, text: 'Server ' + d.version + (seiteV ? ', Seite ' + seiteV : '') + '.', lex: 'alte-fassung' });
  d.punkte.forEach(p => punkt(ort, p));
  ort.setAttribute('data-fertig', d.punkte.filter(p => !p.gut).length);
}

// ---------------------------------------------------------------- Reparaturen: erster Druck sagt, was geschieht, der zweite führt aus
const REPARATUREN = [
  { id: 'ausgeben', titel: 'Seiten neu ausgeben', satz: 'Schreibt jede Seite online noch einmal aus der gebauten Seite und dem veröffentlichten Stand. Am Inhalt ändert das nichts.',
    tun: () => hole('/api/x/website/reparieren/' + HAUS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ was: 'ausgeben', wer: 'pruefung' }) }) },
  { id: 'ohne-platz', titel: 'Änderungen ohne Platz entfernen', satz: 'Nimmt aus dem Entwurf, was seine Stelle auf der Website nicht mehr findet. Der veröffentlichte Stand bleibt unberührt.',
    tun: () => hole('/api/x/website/reparieren/' + HAUS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ was: 'ohne-platz', wer: 'pruefung' }) }) },
  { id: 'entwurf', titel: 'Entwurf verwerfen', satz: 'Löscht alles, was gespeichert, aber noch nicht veröffentlicht ist. Die Website bleibt, wie sie ist.',
    tun: async () => { await hole('/api/entwurf/' + HAUS + '/website', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wer: 'pruefung' }) }); return { meldung: 'Der Entwurf ist verworfen.' }; } },
  { id: 'notizen', titel: 'Gemerkte Fehler dieses Browsers leeren', satz: 'Löscht die Liste oben unter «Was das Werkzeug gemerkt hat». Auf dem Server ändert sich nichts.',
    tun: async () => { try { localStorage.removeItem('ws-fehler'); } catch (e) { /* nichts zu leeren */ } return { meldung: 'Die Liste ist leer.' }; } },
];
function reparaturen() {
  const ort = $('#wsp-reparaturen');
  ort.textContent = '';
  REPARATUREN.forEach(r => {
    if (!HAUS && r.id !== 'notizen') return;
    const b = el('button', { class: 'wsp-taste', type: 'button', 'data-reparatur': r.id }, r.titel);
    let scharf = 0;
    b.addEventListener('click', async () => {
      if (!scharf) {
        scharf = setTimeout(() => { scharf = 0; b.removeAttribute('data-scharf'); b.textContent = r.titel; }, 6000);
        b.setAttribute('data-scharf', '1'); b.textContent = 'Zum Bestätigen noch einmal drücken';
        return;
      }
      clearTimeout(scharf); scharf = 0; b.removeAttribute('data-scharf'); b.textContent = r.titel;
      const m = $('#wsp-meldung');
      m.hidden = false;
      try { const a = await r.tun(); m.textContent = a.meldung || 'Erledigt.'; m.setAttribute('data-ergebnis', 'gut'); } catch (e) {
        m.textContent = (e.fehler || 'Das hat nicht geklappt.') + ' '; m.setAttribute('data-ergebnis', 'fehler');
        m.append(el('a', { href: '#lex-' + lexId(e.stichwort), onclick: () => oeffne(e.stichwort) }, 'Was tun?'));
      }
      lauf();
    });
    ort.append(el('div', { class: 'platte wsp-rep' }, el('p', { class: 't-zwischen' }, r.titel), el('p', {}, r.satz), b));
  });
}

async function lauf() {
  let v = '';
  try { v = await browser(); } catch (e) { $('#wsp-browser').textContent = 'Die Prüfung des Browsers ist gescheitert: ' + (e.message || e); }
  try { await server(v); } catch (e) { $('#wsp-server').textContent = 'Die Prüfung des Servers ist gescheitert: ' + (e.message || e); }
  document.body.setAttribute('data-wsp-fertig', '1');
}

if (DU) document.querySelectorAll('[data-du]').forEach(e => e.textContent = e.dataset.du);
if (HAUS) $('#wsp-zurueck').href = './?haus=' + encodeURIComponent(HAUS);
$('#wsp-such').addEventListener('input', ev => lexikon(ev.target.value));
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#lex-')) oeffne(location.hash.slice(5)); });
lexikon('');
reparaturen();
if (location.hash.startsWith('#lex-')) oeffne(location.hash.slice(5));
lauf();
})();
