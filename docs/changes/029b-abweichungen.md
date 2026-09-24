# 029b – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `feat/029b` → `preview` · Aufwand S. Tests: `scen029b` (13/14 grün,
1 Test-Falschmeldung s. u.), Regression 016–026 gegen die unveränderte `preview` verglichen (Baseline),
um echte von testbedingten Abweichungen zu trennen – siehe unten.

## Entscheidungen im Zweifel

1. **Suchfeld-Höhe (Regel 7): 44 px statt 40 px.** Der Auftrag nennt 40 px, CLAUDE.md verlangt
   „Tap-Ziele ≥ 44 px" ohne Ausnahme. Ein `<input>` hat – anders als die Buttons – keinen
   Polster-Trick (eine größere Trefferfläche über ein Pseudo-Element würde den Fokus nicht ans
   Feld weiterreichen). Entscheidung wie schon bei 029: Höhe bei 44 px belassen, Rand/Radius/Lupe/
   Fokus wie beauftragt umgesetzt. Deckt sich mit der offenen Rückfrage aus `029-abweichungen.md`.
2. **Punkt 12/13 doppelt im Auftrag** (zwei unterschiedliche Fassungen von „Posten+Aufgabe in
   einer Zelle" und „zahlt als Chip"). Übernommen: die zweite (spätere) Fassung – Aufgabentitel in
   Zeile 2 als leiser Link (13 px, `--ink-3`, Unterstrich erst bei Hover, öffnet die Akte),
   „ohne Aufgabe" als Fallback, Zeilenhöhe darf wachsen; „zahlt" als Personen-Chip, `fit-content`-
   Breite. Gilt nur für die Tabelle ab 900 px – am Handy gab es nie eine eigene Aufgabe-Spalte,
   „Als Nächstes zahlen" bekommt den Chip trotzdem auf beiden Breiten (der Auftrag nennt das dort
   ausdrücklich, unabhängig von der Breite).
3. **Punkt 8, „+" als Hinzufügen-Knopf im Spaltenfuß.** Im heutigen Code gibt es kein per-Spalten-
   „+" für neue Aufgaben (nur ein globales Formular unten in der Ansicht) – nichts zu verschieben.
   Die drei genannten Aufklapp-Stellen (Zeitgruppe, blockiert, erledigt) haben jetzt alle einen
   Chevron vor dem Text, kein „→", kein „+"/„−". „Weitere N zeigen →" (jenseits der CAP-Grenze,
   nicht in den drei Beispielen genannt) blieb unverändert.
4. **Punkt 6, „ein Rot-Signal je Zeile".** Umgesetzt nur in den Aufgabenzeilen (`task.js`): das
   rote Datum ersetzt den separaten „überfällig"-Chip. Die Timeline zeigt links kein „seit N T."-
   Datum, sondern ein Kalenderdatum – ihr `tl-sig`-Chip trägt als einzige Stelle die Tage-Anzahl
   und wiederholt „überfällig" nicht neben einem gleichlautenden roten Datum. Deshalb dort nicht
   angefasst.
5. **Punkt 9, Checkbox 20 px.** Gilt für beide Akte-Köpfe: den Panel-Kopf (`.akte-top`, Desktop)
   und die Inline-Akte am Handy (`.task.open` direktes Kind, unter 900 px) – dieselbe Klasse
   `akte-title-text` steht an beiden Stellen. Die Tipp-Fläche bleibt bei beiden 44 px (`.check`).
6. **Punkt 4, Datumsformat.** Auf „Kopf" (Countdown, jetzt in `renderHeader`), „Gruppenlabels"
   (`groups.js`, „bis/ab …") und „Akte" (`dueLabel`, „zuletzt geändert") angewendet. Bewusst nicht
   angefasst: kompakte Tabellenfelder (Fälligkeitsspalten, `dueShort`), die Timeline-Datumsspalte
   (eigene, zweizeilige Geometrie aus 019c) und der Rahmendaten-Block (Auftrag nennt „Fr, 01.01.2027"
   ausdrücklich als Ausnahme).
7. **Ein Nebeneffekt der geteilten Kopfzeile:** Finanzen hat jetzt denselben Einzugstermin-Editor
   wie Aufgaben (Klick aufs Datum öffnet das Eingabefeld) – ergibt sich zwingend aus „eine
   Funktion für beide Ansichten", war vorher nur auf Aufgaben. Kein neues Verhalten, nur an einer
   zweiten Stelle erreichbar.
8. **Statuszeile (`#status`) verschoben.** Zwei `#status`-Elemente gleichzeitig wären ungültiges
   HTML (Finanzen hatte schon eins im eigenen Footer). Die Kopfzeile bekommt keins; die normale
   Aufgaben-Fußzeile (vorher ohne Statustext) hat jetzt eins, damit „gespeichert HH:MM" auf beiden
   Bildschirmen sichtbar bleibt – nur an einer neuen Stelle (Fuß statt Kopf) für Aufgaben.

## Gefunden, nicht Teil des Auftrags, trotzdem behoben

- **„Schlüsselübergabe" in der Gate-Feier** (`app/ui/gate.js`, „Noch N Tage bis zur
  Schlüsselübergabe.") – Punkt 10 verlangt „nirgends 'Schlüsselübergabe'", diese Stelle stand
  nicht in der Liste, ist aber dieselbe Art Satz. Auf „bis zum Einzug" geändert.
- **Ein Absturz beim Aufklappen von „Seit du zuletzt da warst"**, selbst verursacht: beim
  Aufräumen der alten Kopfzeile wurde `fmtDayMonth` gelöscht, das `changeLine()` weiter unten für
  „11.12. → 04.12." noch braucht. Wiederhergestellt (eigener Fund, per Regression aufgefallen,
  siehe unten) – nicht sichtbar ohne Klick auf die Zeile, deshalb wichtig, dass die Regression es
  gefangen hat.
- **Zeilenhöhe der Postentabelle** auf 49 px statt der alten 44–48 px (016c) – die zweite Zeile
  (Aufgabentitel) braucht mehr Platz; passt in den vom Auftrag selbst erlaubten Rahmen
  ("kann auf 52 px wachsen").

## Kontrastcheck (008b), nach 029b

- Seitengrund `#f4f6f2` (zurück auf den Wert vor 029): `--ink-2` und `--ink-3` bleiben über 4,5:1
  (dunkler als `--card`, also noch etwas mehr Kontrast als vorher gemessen).
- `--ok` (#2f6f4e) als Text für „bezahlt" in der Stand-Leiter: **≈ 5,99:1 auf `--card`/`--paper`**
  (berechnet, WCAG-Formel) – über der 4,5:1-Grenze, keine dunklere Variante nötig.
- Vorschau-Chip (`--ink-3` auf `--card`), neutrale Phasen-Pille (`--ink-2` auf `--paper`), aktive
  Pillen (`--ink`-Umriss, `--card`-Grund, `--ink`-Text): alle drei nutzen bereits geprüfte Tokens.
- Kein neues Rot, kein neues Gelb eingeführt.

## Regression

016–026 gegen die unveränderte `preview` verglichen, um Test-Altlasten von echten Abweichungen zu
trennen:
- **Echte, erwartete Abweichungen** (Text/Format, die dieser Auftrag ändert): scen018 „zeigen"
  fehlt jetzt im Aufklapp-Text (Punkt 8), scen020 „überfällig"-Chip fehlt jetzt bei rotem Datum
  (Punkt 6), scen016c Zeilenhöhe 49 statt 44–48 (Punkt 12, s. o.).
- **Bereits vor 029b vorhanden** (auf der unveränderten `preview` gleich): scen016 AC1/AC3
  (bekannt, sh. frühere Sitzungen), scen019c Zeilenhöhen, scen014 „wartet auf" Abstand/Zeilenhöhe
  – beide hängen am Systemdatum (mehr Aufgaben sind seit 23.09. „überfällig" geworden, die
  Meta-Zeile der Timeline bricht dadurch öfter um) und schwanken unabhängig von jeder Codeänderung.
- Ein echter, selbst verursachter Fehler (fehlendes `fmtDayMonth`) wurde durch die Regression
  gefunden und behoben (s. o.).

## Screenshots

`design/snapshot/2026-09-24-nachzug/screens/` (gitignored): Aufgaben, Akte, Finanzen je 380/1280 px.
