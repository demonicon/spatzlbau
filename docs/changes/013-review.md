# 013 – Review gegen das UX-Audit vom 22.09.2026

Stand: 22.09.2026 · Branch `feature/audit-fixes` · geprüft am Bild und am gerenderten Stand, kein Umbau.
Belege: `docs/changes/013-screenshots/` · Messläufe: kopfloses Chrome bei 380 × 700, 1024 × 768, 1440 × 900, 1920 × 1080, ohne Login und ohne Datenbank.

## Teil 1 – Vier Token-Checks am Bild

Gemessen wurde am **gerenderten** Stand, nicht in der CSS-Datei: für jedes sichtbare Element auf fünf Bildschirmen (Handy-Liste, Handy mit offener Akte, Desktop mit Panel, Finanzansicht, Druckblatt) der berechnete Wert aus `getComputedStyle`. Kontraste nach WCAG-Formel im selben Lauf berechnet.

### 1. Eine Schriftfamilie · **erfüllt**

Über alle fünf Bildschirme hinweg gibt es genau **einen** Font-Stack:

```
"Instrument Sans", "Avenir Next", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

Kein zweiter Stack, keine Ausnahme in Formularen, im Druckblatt oder in den Zahlen. (Die erste Familie wird nicht geladen – wir liefern keine externen Schriften aus, siehe `002-abweichungen.md`; auf dem Gerät greift der Systemteil des Stacks.)

### 2. Gelb nur für Fristkritisch · **erfüllt**

`--mark` (#f7de4a) erscheint an genau drei Stellen, alle fristkritisch:

| Stelle | Beispiel |
|---|---|
| `.tile.critical .n span` | die Zahl auf der Kachel „Fristkritisch" |
| `.due.crit` | „bis Do 15.10. (in 23 Tagen)" in Liste und Akte |
| `.pcrit` (Druck) | das Wort „fristkritisch" auf dem Umzugstag-Blatt |

`--mark-deep` kommt als Text **nirgends** vor – richtig so, es erreicht auf Gelb nur 3,42 : 1 (Messwert aus demselben Lauf) und ist in `CLAUDE.md` für Text gesperrt.

### 3. Rot nur für Überfällig · **teilweise**

`--danger` / `--danger-bg` erscheinen an vier Stellen. Zwei davon sind nicht „überfällig":

| Stelle | Bedeutung | Beleg |
|---|---|---|
| `.due.late`, `.tile.late` | überfällig | (im Demo-Stand 0 überfällig, deshalb nicht im Scan) |
| `.tag.wait-me` in der Aufgabenzeile | „wartet auf dich" | `a1-380-falz-nachher.png` |
| `.own.wait` im Spaltenkopf | „Wartet auf mich" | `a1-380-falz-nachher.png` |
| `.btn.danger` | „Aufgabe löschen" | `a4-akte-inline-380-nachher.png` |

013b N2 hat das Rot aus dem **Besuchsblock** entfernt (Beleg `n2-chips-380.png`, `n2-zeilen-380.png`) – dort ist der Anspruch erfüllt. In der Liste selbst trägt „wartet auf dich" weiter Rot, und die Löschen-Knöpfe ebenfalls. N2 nennt ausdrücklich nur den Besuchsblock; alles andere zu entfärben wäre ein Umbau, und der ist hier ausgeschlossen. Als Punkt für einen eigenen Auftrag: entweder Rot überall auf „überfällig" beschränken (dann brauchen „wartet auf dich" und „löschen" eine andere Sprache), oder die Regel als „Rot = dringend oder unwiderruflich" formulieren.

### 4. `--ink-3` gemessen · **erfüllt**

`--ink-3` (#68726b) trägt Text nur auf zwei Flächen – gemessen, nicht angenommen:

| Kombination | Kontrast | Grenze 4,5 : 1 |
|---|---|---|
| `--ink-3` auf `--paper` (#f4f6f2) | **4,59 : 1** | erfüllt |
| `--ink-3` auf `--card` (#fff) | **4,99 : 1** | erfüllt |
| *(`--ink-3` auf `--bg` #e9ebe6)* | *4,16 : 1* | *käme nicht hin – kommt im Stand aber nicht vor* |

Zum Vergleich aus demselben Lauf: `--ink` auf Paper 13,54 : 1, `--ink-2` auf Paper 6,55 : 1, `--danger` auf Paper 5,42 : 1, `--danger` auf `--danger-bg` 4,79 : 1.

Der Randfall ist bekannt und eingehalten: die Fläche außerhalb der Spalte (`--bg`) trägt keinen Text.

## Teil 2 – Status je Punkt aus 013 und 013b

Jede Zeile mit dem Screenshot, der sie belegt.

| Punkt | Status | Beleg | Anmerkung |
|---|---|---|---|
| **A1** Kopf am Handy kürzer, erste Aufgabe über der Falz | behoben | `a1-380-falz-vorher.png` → `a1-380-falz-nachher.png` | erste Zeile endet bei 669 px (vorher außerhalb des ersten Bildschirms) |
| **A1** Kacheln ohne leere Zelle | behoben | `a1-kacheln-a-380.png`, `a1-kacheln-b-gewaehlt-380.png` | Variante B gewählt, Begründung in `013-abweichungen.md` §1 |
| **A2** Layout wächst mit | behoben | `a2-1920x1080-nachher.png` | 1920: Spalten 3 × 407 px, Panel 576 px, 3 % Rand |
| **A3** kein leeres Panel zwischen 900 und 1179 px | behoben | `a3-1024x768-overlay-zu.png`, `-offen.png` | Akte als Overlay, schließt per ×, Escape, Tippen daneben |
| **A4** Akte ohne Doppelung | behoben | `a4-akte-inline-380-nachher.png` | Häkchen und Titel einmal, Titel über den Stift |
| **A5** Kleinigkeiten (Kachel-Unterzeile, Bereichstitel, leere Zustände, relative Frist, Kostenhinweis, Gate-Segment) | behoben | `a1-380-falz-nachher.png`, `a4-akte-inline-380-nachher.png` | zwei Texte anders formuliert als vorgeschlagen, `013-abweichungen.md` §7 |
| **A6 / N1** Kopfzeile, Navigation, Fußzeile | behoben | `a1-380-falz-nachher.png`, `a2-1920x1080-nachher.png` | Zwei-Icon-Fassung, damit auch 013b N1 |
| **B1** Druckblatt | behoben | `b1-umzugstag-druck.pdf`, `b1-umzugstag-druck-vorschau.png` | Teilschritt-Kästchen 5 mm statt 7 mm, `013-abweichungen.md` §9 |
| **B2** Teilschritt-Löschen | behoben | `b2-subtask-edit-380.png` | nur im Bearbeitungsmodus, mit Rückfrage |
| **B3** Zurück aus `#finanzen` | behoben | `b3-finanzen-380.png` | History-Eintrag beim Öffnen |
| **B4** Autorenpunkte mit Initial | behoben | `b4-ndot-380.png` | S/A/C im Punkt |
| **B5** eigene Kommentare | behoben | `b5-comments-380.png` | löschen immer, ändern zehn Minuten lang |
| **N2** Besuchsblock ohne Rot | behoben | `n2-chips-380.png`, `n2-zeilen-380.png` | fett + Umriss + Autoren-Punkt statt roter Fläche |
| **N3** Lade-Animation | behoben | `n3-laden-380.png`, `n3-laden-reduced-380.png` | Gate-Leiste 1,2 s, bei reduzierter Bewegung drei Punkte |
| **Tap-Ziele** Suchfeld und Gate-Segmente | behoben | `a1-380-falz-nachher.png` | beide 44 px, sichtbar unverändert leicht |
| **Rot nur für Überfällig** (Token-Check 3) | teilweise | siehe oben | im Besuchsblock erfüllt, in Liste und Löschen-Knöpfen nicht – kein Umbau in 013 |

## Teil 3 – Die Nummerierung #1–#21 fehlt hier

Der Auftrag verlangt „jedes Audit-Finding #1–#21 mit Status". **Diese nummerierte Liste liegt nicht im Repo.** Im Repo steht nur `design/snapshot/2026-09-22/issues.md` – das sind die sechs bekannten Schwächen aus dem Design-Review 011, nicht das Audit vom 22.09. Das Audit selbst ist im Chat aus den Aufnahmen in `docs/audit/2026-09-22/` entstanden; die Nummern sind dort vergeben worden.

Ich trage keine Nummern ein, die ich mir zusammenreime. Sobald die Liste hier liegt – etwa als `docs/audit/2026-09-22/findings.md` oder in den Chat gestellt – ordne ich jedem Punkt #1 bis #21 den Status, den Beleg und bei „teilweise"/„offen" den Satz zu. Die Statusarbeit darüber ist gemacht: Teil 2 enthält für jeden in 013/013b behandelten Punkt Zustand und Beleg, Teil 1 die vier Token-Checks mit Messwerten.
