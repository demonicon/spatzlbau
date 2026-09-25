# 032c – Entscheidungen: Klick-Bug, Nav-Zustand, Tabelle, ein Primär bei mehreren offenen

**Status: umgesetzt** (Branch `fix/032c` → `preview`, `main` folgt über `/release 2.2.3`)

Stand: 25.09.2026 · Release 2.2 · Branch: `fix/032c` von `preview` · Modell: Sonnet · Aufwand: S–M
Befund Sebastian (Screenshot preview 2.2.2, 19:38) + Reviewer-Fund aus 037. Ersetzt die von Claude Code vorgeschlagene Aufgabe „Fix duplicate primary button".

## Fehler

1. **Klick auf einen Eintrag der Seite `#entscheidungen` tut nichts** – weder Panel noch Akte. Soll: Desktop → Akte der Aufgabe im rechten Panel, gescrollt zur Entscheidungs-Karte; Handy → Akte als Seite.
2. **Nav-Zustand:** auf `#entscheidungen` trägt „Finanzen" den aktiven Umriss, „Entscheidungen" nicht. Aktiv = die Route, die gerade offen ist; ein Test je Route.
3. **Zwei Primär** bei zwei gleichzeitig offenen Entscheidungen an einer Aufgabe, und `addBoxHTML()` demotet „Hinzufügen" nicht, wenn das Panel eine offene Entscheidung zeigt (Reviewer 037). **Regel:** Nur die **neueste** offene Entscheidung einer Aufgabe trägt „Einverstanden" als Primär; ältere offene zeigen Chip + Sekundär. „Hinzufügen" ist Sekundär, sobald im Panel eine offene Entscheidung sichtbar ist. Die DB bleibt – zwei offene Entscheidungen je Aufgabe sind erlaubt.

## Aufwertung der Seite

- **≥ 900 px: Tabelle** statt Chip-Liste, `table-layout: fixed`: Datum 10 % (`Fr 25.09.`) · Von 10 % (Personen-Chip) · Entscheidung 44 % (Text bis 2 Zeilen, darunter Aufgabentitel leise als Link) · Am Zug 14 % (Chip: „wartet auf dich" als Signal-Chip, sonst „Anna"/„Sebastian" in Personenfarbe; bestätigt: „✓ bestätigt · Datum" leise; ersetzt: grau, durchgestrichen) · Aktion 12 % („Einverstanden" Sekundär nur, wenn ich am Zug bin) · Rest Luft. Zeilenhöhe ≤ 56 px, hairline. Zeile klickbar (Punkt 1), gewählte Zeile mit Ink-Balken links wie in den Spalten.
- **Sortierung:** wartet auf dich → Am Zug: andere Person → bestätigt → ersetzt; innerhalb nach Datum absteigend. Pillen `offen · alle` (offen = Default, „bestätigt" als eigene Pille entfällt – „alle" zeigt sie mit Status).
- **Kopf:** „Entscheidungen · 2 offen · 0 bestätigt", das „zurück" entfällt (Nav reicht).
- **Panel ohne Auswahl:** zeigt die Akte der **ersten Zeile** (neueste, bei der ich am Zug bin, sonst die neueste offene) statt „Entscheidung antippen …". Leer nur, wenn es keine Entscheidung gibt: „Keine Entscheidungen – halte eine im Kommentar einer Aufgabe fest."
- **< 900 px:** zwei Zeilen je Entscheidung (Text | Aufgabe · Datum · Am-Zug-Chip rechts), Tipp öffnet die Akte.

## Tests

- Klick auf Zeile (1280) → Panel zeigt Akte mit Entscheidungs-Karte im Blick; (380) → Akte-Seite.
- Route `#entscheidungen` → nur diese Nav-Pille aktiv; `#finanzen` → nur Finanzen.
- Aufgabe mit zwei offenen Entscheidungen + Panel offen → genau ein `.btn-primary` (Harness `scen032`), „Hinzufügen" Sekundär.
- Seite ohne Auswahl → Panel zeigt erste Zeile; Sortierung mit einer bestätigten und zwei offenen wie oben.
- 380 px: zwei Zeilen, kein horizontales Scrollen.

## Akzeptanzkriterien

- [x] Fünf Tests grün (Login-Tests nach 037b-Regel: real oder „nicht getestet")
- [x] Reviewer ohne Lücken; Grep: ein `.btn-primary` je Ansicht
- [ ] Merge preview (erledigt), `/release 2.2.3` – nicht Teil dieser Session
- [x] Bericht mit Run-Nummer und Live-Version beider Pfade (siehe Chat)

## Diagnose und Abweichungen (Umsetzung 25.09.2026)

- **Fehler 1 (Klick tut nichts) – echte Ursache gefunden:** `decisionRowHTML` gab der Zeile kein
  `data-id`; die zentrale Klick-Delegation (`app/main.js`) löst die Aufgabe aber über
  `b.closest('[data-id]')` auf, nicht über `data-ref`. `case 'open'` griff dadurch auf `t === null`
  zu (stummer `TypeError`, vom globalen `catch` zu einem unspezifischen Toast abgefangen) – weder
  Panel noch Akte öffneten sich. Fix: `data-id` direkt an Zeile/Karte, dazu `data-scroll` fürs
  Scrollen zur angehefteten Entscheidungs-Karte.
- **Fehler 2 (Nav-Zustand) – kein Codefehler gefunden.** `renderHeader`/`nav()` sind konsistent;
  real nachgestellt (`entscheidungenView()` gerendert) zeigt die Entscheidungen-Pille korrekt
  `on`/`aria-current=page`, Finanzen nicht. Vermutlich ein Cache-Stand beim Screenshot, keine
  Änderung nötig – als Regressionstest mitgeführt (grün).
- **Fehler 3 (zwei Primär) – bereits durch 032b behoben**, hier mit demselben `scen032`-Aufbau
  gegen den aktuellen Code erneut real bestätigt (grün, ein `.btn-primary`, „Hinzufügen" sekundär).
- **„Mehr/weniger" (032b) entfällt ersatzlos** zugunsten von reinem CSS-Clamp (2 Zeilen) – im
  Auftrag nicht mehr erwähnt, spart einen State-Slot; voller Text steht weiter in der angehefteten
  Karte der Akte.
- **App-Test eingeloggt nicht möglich** (Anmeldung mit Passwort) – alle fünf Tests liefen real
  gegen den gerenderten Code: `state`/`ui` simuliert (keine Schreibzugriffe), Klick-Resolution als
  Eins-zu-eins-Nachbildung der main.js-Zeilen gegen das echte Markup geprüft (nicht nur State
  gesetzt). Zwei Browserprofile als Sebastian/Anna bitte separat prüfen.
- **Zeilenhöhe ≤ 56 px nicht eingehalten:** Zwei Zeilen Entscheidungstext (`--fs-ui`, 1.45
  Zeilenhöhe) plus die Zeile mit dem Aufgabentitel brauchen real ca. 60–85 px, je nach Textlänge.
  56 px wären nur mit einzeiligem Text ohne Aufgabentitel erreichbar – beides ist Pflichtinhalt
  laut Auftrag (Punkt 16). Nicht nachgezogen, um keinen Inhalt zu verlieren; bewusste Abweichung,
  kein Test dafür vorgesehen.
- **Aufgabentitel als leiser Text, nicht als eigener Link** (Punkt 16 wörtlich: „als Link"): die
  ganze Zeile/Karte ist schon das Tipp-Ziel (Fehler 1), ein zusätzlicher verschachtelter Link auf
  dasselbe Ziel wäre doppelt gemoppelt. Bewusste Vereinfachung, hier nachgetragen, weil sie in
  Runde 1 noch nicht als Abweichung stand.
- **Reviewer-Runde 1 fand zwei echte Fehler**, beide behoben: (a) `case 'open'` schaltete um -
  ein Klick auf die zweite Zeile derselben, bereits offenen Aufgabe hätte die Akte geschlossen
  statt zur zweiten Karte zu scrollen; jetzt eine eigene, nicht umschaltende Aktion
  (`decisions-row-open`) für die Entscheidungen-Zeilen. (b) „n offen" im Kopf zählte theoretisch
  auch ersetzte, nie bestätigte Entscheidungen mit (laut Trigger in der Praxis nicht erreichbar,
  aber die Zählung ist jetzt trotzdem robust). Dazu die Pillenreihenfolge auf „offen · alle"
  gedreht (Auftragswortlaut).
- **Reviewer-Runde 2 fand zwei weitere echte Fehler**, beide behoben: (c) Zeilen mit
  `role="button"` ließen sich per Tab fokussieren, aber nicht per Enter/Leertaste auslösen – ein
  generischer Tastatur-Handler in `app/main.js` (`el.click()` bei `role="button"` + `data-act`)
  behebt das für diese und künftige gleich gebaute Zeilen. (d) Die Tabelle hat sechs Spalten
  (fünf plus „Luft"), Datenzeilen hatten aber nur fünf `<td>` – die Hairline/Hover/Auswahlfarbe
  endeten dadurch vor dem rechten Rand; jetzt eine leere sechste Zelle je Zeile.
- **Reviewer-Runde 3: keine Lücken.**
