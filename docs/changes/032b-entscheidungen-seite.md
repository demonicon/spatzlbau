# 032b – Entscheidungen: eigene Seite, Navigationslink, Hervorhebung im Kommentarblock

**Status: umgesetzt** (Branch `feat/032b` → `preview`, `main` folgt über `/release 2.2.2`)

Stand: 25.09.2026 · Release 2.2 · Branch: `feat/032b` von `preview` · Modell: Sonnet · Aufwand: S
Ergänzung Sebastian 25.09. zu 032 (live seit 2.2.0). Läuft nach 036.

## Änderungen

1. **Reviewer-Fund aus 037 (live in 2.2.1):** In der Akte mit offener Entscheidung stehen zwei gefüllte Buttons (Reviewer-Bericht 037 nennt die Stelle). „Einverstanden" ist der eine Primär; der andere wird Sekundär. Grep danach: je Ansicht genau ein `.btn-primary`.
2. **Navigation.** Dritte Pille „Entscheidungen" mit Icon (◆ als Inline-SVG, 16 px) zwischen Finanzen und Avatar – in derselben Kopfzeile, die 029c für alle Ansichten definiert; dieselbe Klasse wie Aufgaben/Finanzen, aktiv = Ink-Umriss. Zähler-Badge rechts oben an der Pille = Entscheidungen, bei denen das **eigene** Häkchen fehlt (Ink, kein Rot; 0 → kein Badge). **< 900 px:** alle Nav-Pillen zeigen nur das Icon (Aufgaben ⌂, Finanzen €, Entscheidungen ◆), Text als `title`/`aria-label`, Ziel ≥ 44 px – damit vier Pillen (033 kommt) in 380 px passen. Die Karte „Entscheidungen" in „Zwischen euch" bleibt und verlinkt auf die Seite.
3. **Seite `#entscheidungen`.** Kopf: Titel „Entscheidungen", Pillen „offen · alle" (offen = Default). Liste, eine Zeile je Entscheidung, sortiert: zuerst die, bei denen **ich** am Zug bin, dann die, bei denen die andere Person am Zug ist, dann nach Datum. Zeile: Datum + Autor (Personen-Chip) | Text (≤ 2 Zeilen, Tipp öffnet die Akte an der Karte) + Aufgabentitel leise | rechts **„Am Zug: Anna"** als Chip in der Personenfarbe – bzw. „wartet auf dich" als Signal-Chip, wenn ich es bin. Unter „alle" zusätzlich „✓ bestätigt · Datum" und „ersetzt" (durchgestrichen, grau). Leer: „Keine offenen Entscheidungen." Desktop: Liste links `1fr`, rechts das Akte-Panel der angetippten Entscheidung (gleiches Grid wie Aufgaben); Handy: Liste, Tipp öffnet die Akte als Seite. „Einverstanden" direkt in der Zeile für die, bei denen ich am Zug bin (Sekundär; der Primär bleibt in der Akte).
4. **Hervorhebung im Kommentarblock.** Entscheidungs-Kommentare bekommen eine eigene, sofort erkennbare Farbe – analog zu Claude-Kommentaren (Sand), aber **Violett**: Grund `--decision-bg: #EFE9F7`, Text/Rand/Balken `--decision: #5C2E91` (Kontrast auf dem Grund ≈ 8:1; Tokens in `:root`, auch für den Kontrastcheck eintragen). Karte: 3-px-Balken links in `--decision`, Kopfzeile „◆ ENTSCHEIDUNG · Autor · Datum" in `--decision` 600, Grund `--decision-bg`, Radius 8. Angeheftet bleibt oben; ersetzte Entscheidungen in der Chronologie ohne Grund, nur Balken grau + „ersetzt". Claude-Kommentare bleiben Sand, normale Kommentare ohne Grund. Kein Rot, kein Gelb, keine Personenfarbe als Fläche.
5. **Laufzeiten-Texte:** Der Claude-Lauf läuft seit 25.09. um 8, 12, 15, 18 und 22 Uhr statt stündlich. Alle Texte „stündlich"/„innerhalb einer Stunde" (Delegationskarte, Hinweis nach „Claude jetzt starten", Setup) per Grep auf „Claude arbeitet um 8, 12, 15, 18 und 22 Uhr – oder jetzt mit dem Button" ändern.
6. **Konsistenz:** Der Zeilen-Chip „wartet auf dich" an Aufgaben (Spalten, Timeline) bleibt wie in 032; die Kachel im Dashboard zählt weiter. Kein zweiter Signal-Typ.

## Tests

- Anna ist am Zug bei einer Entscheidung: Nav-Badge „1" bei Anna, keins bei Sebastian; Seite bei Anna zeigt die Zeile oben mit „wartet auf dich" und Sekundär „Einverstanden"; bei Sebastian mit „Am Zug: Anna".
- Einverstanden in der Zeile → Badge weg, Zeile unter „alle" mit „✓ bestätigt".
- Akte: Entscheidungs-Karte violett mit Balken und Kopfzeile, Claude-Kommentar daneben Sand, normaler Kommentar ohne Grund; Kontrastcheck für `--decision` auf `--decision-bg`, `--paper`, `--card`.
- 380 px: drei Icon-Pillen à ≥ 44 px, Badge sichtbar; Seite ohne horizontales Scrollen.

## Akzeptanzkriterien

- [x] Vier Tests grün; eine Kopfzeilen-Funktion für alle Ansichten (Grep: kein zweites Nav-Markup)
- [x] Neue Tokens `--decision`/`--decision-bg` in `029c-kontrast.md` nachgetragen
- [x] Ein Primär je Ansicht (Seite: keiner; Akte: Einverstanden)
- [ ] Merge preview (erledigt), `--no-ff` main, Tag v2.2.2 – das ist `/release 2.2.2`, nicht Teil dieser Session
- [x] Bericht ≤ 8 Zeilen mit Run-Nummer und Live-Version beider Pfade (siehe Chat)

## Abweichungen und Nachweis (Umsetzung 25.09.2026)

- **App-Test eingeloggt nicht möglich** (Anmeldung mit Passwort, wie schon in 014b) – die vier Tests
  aus dem Auftrag liefen stattdessen simuliert: `state`/`ui` per Browser-Konsole direkt mit
  Beispiel-Entscheidungen gefüllt (drei offene, eine bestätigte, eine ersetzte, zwei gleichzeitig
  offene auf einer Aufgabe), `entscheidungenView()`/`dashboardView()` gerendert, keine Zeile
  geschrieben. Alle vier Tests bestanden: Badge „3"/„0" je Person korrekt, „Am Zug"/„wartet auf
  dich" korrekt seitenverkehrt, violette Karte + grauer Balken bei „ersetzt" + Sand bei Claude,
  380 px ohne horizontales Scrollen, genau ein `.btn-primary` je Ansicht (auch im Zwei-Entscheidungen-
  Fall auf einer Aufgabe). Zwei echte Browserprofile als Sebastian/Anna bitte separat prüfen.
- **„Zwischen euch"-Karte und `entscheidungen-open`:** navigieren jetzt immer auf die neue Seite
  (`ui.decisionsOpen`/`decisionsPanelHTML` entfernt) statt wie bisher am Desktop nur die alte
  Liste ins Panel zu tauschen – so gilt „Ein Primär, ein Grid" auf allen Breiten gleich, wie der
  Auftrag es für die Seite vorsieht.
- **BRIEFING.md nicht geändert:** nennt weiterhin den stündlichen Takt (Abschnitt 4) – CLAUDE.md
  verlangt für BRIEFING.md-Änderungen ausdrückliche Bestätigung, die dieser Auftrag nicht enthält.
  Bitte bei Gelegenheit bestätigen oder in einem eigenen Auftrag nachziehen.
