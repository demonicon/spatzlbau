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

### 3. Rot nur für Überfällig · **erfüllt, seit die Regel festgelegt ist**

Die Messung vom ersten Durchgang fand Rot an vier Stellen, zwei davon ohne Frist. Sebastian hat die Regel daraufhin festgelegt: **Rot = überfällig oder unwiderruflich.** Sie steht jetzt in `CLAUDE.md`.

Danach erneut gemessen – im gerenderten Stand tragen `--danger`/`--danger-bg` nur noch:

| Stelle | Bedeutung | erlaubt |
|---|---|---|
| `.btn.danger`, `.confirm` | „Aufgabe löschen", „Teilschritt löschen?", „Kommentar löschen?" | unwiderruflich |
| `.due.late`, `.tile.late`, `.fin-payments .late` | überfällig | überfällig (im Demo-Stand 0 überfällig, deshalb nicht im Scan) |
| `.status.err`, `.msg.err`, `.status.off` | „Speichern fehlgeschlagen", „Offline" | Fehlzustand, bewusst ausgenommen (in `CLAUDE.md` benannt) |

Entfernt wurde das Rot bei **„wartet auf dich"** – in der Aufgabenzeile, im Spaltenkopf „Wartet auf mich", im roten Band der Akte und (schon mit N2) im Besuchsblock. Überall steht jetzt dieselbe Sprache wie im Besuchsblock: fett, Umriss in Textfarbe, bei ganzen Zeilen ein Balken links. Beleg: `rot-regel-wartet-380.png`, `n2-chips-380.png`.

### 4. `--ink-3` gemessen · **erfüllt**

`--ink-3` (#68726b) trägt Text nur auf zwei Flächen – gemessen, nicht angenommen:

| Kombination | Kontrast | Grenze 4,5 : 1 |
|---|---|---|
| `--ink-3` auf `--paper` (#f4f6f2) | **4,59 : 1** | erfüllt |
| `--ink-3` auf `--card` (#fff) | **4,99 : 1** | erfüllt |
| *(`--ink-3` auf `--bg` #e9ebe6)* | *4,16 : 1* | *käme nicht hin – kommt im Stand aber nicht vor* |

Zum Vergleich aus demselben Lauf: `--ink` auf Paper 13,54 : 1, `--ink-2` auf Paper 6,55 : 1, `--danger` auf Paper 5,42 : 1, `--danger` auf `--danger-bg` 4,79 : 1.

Der Randfall ist bekannt und eingehalten: die Fläche außerhalb der Spalte (`--bg`) trägt keinen Text.

## Teil 2 – Die Findings #1–#21

Quelle: `docs/audit/2026-09-22/findings.md`. Status: **behoben** · **teilweise** · **offen** · **nicht in 013** (dort bewusst nicht einsortiert).

| # | Finding | Status | Beleg | Bei teilweise/offen: warum |
|---|---|---|---|---|
| 1 | Layout wächst nicht mit | behoben | `a2-1920x1080-nachher.png` | bei 1920: drei Spalten à 407 px, Panel 576 px, 3 % Rand je Seite |
| 2 | Kopf am Handy, leere Kachelzelle | behoben | `a1-380-falz-vorher.png` → `a1-380-falz-nachher.png` | erste Aufgabenzeile endet bei 669 px statt erst im zweiten Bildschirm; vier Kacheln plus Kosten-Zeile, keine leere Zelle |
| 3 | Fußzeile überladen | behoben | `a1-380-falz-nachher.png` | statt fünf Bedienelementen jetzt drei plus die Version als Text |
| 4 | Titel als Dauerfeld | behoben | `a4-akte-inline-380-nachher.png` | Titel ist Überschrift, der Stift öffnet das Feld |
| 5 | Kosten-Zustände ohne Erklärung | behoben | `a4-akte-inline-380-nachher.png` | einzeiliger Hinweis beim ersten Öffnen, danach nie wieder (Gerätespeicher) |
| 6 | Gate-Leiste ohne Legende, nicht antippbar | behoben (entschieden) | `a1-380-falz-nachher.png` | Sebastian hat am 22.09. entschieden: **keine Legende.** Antippen zeigt den Gate-Text der Phase und filtert sie – das ist die Erklärung, und sie kostet keine Kopfhöhe. Zähler und Phasenname bleiben zusätzlich in `title`/`aria-label` |
| 7 | Eigene Kommentare nicht editier-/löschbar | behoben | `b5-comments-380.png` | löschen immer, ändern zehn Minuten lang, beides nur die eigenen |
| 8 | Suchfeld kostet Kopfhöhe | **nicht in 013** | `a1-380-falz-nachher.png` | laut Audit Backlog nach zwei Wochen Nutzung. 013 hat es kompakter gemacht (kein Kasten, eine Linie), sichtbar bleibt es |
| 9 | Leere Zustände negativ | behoben | `rot-regel-wartet-380.png` | „Alles erledigt – nächste Fälligkeit am …"; bei aktivem Filter „Nichts in dieser Auswahl." |
| 10 | Tablet 600–899 px nicht betrachtet | **offen** | – | laut Audit Backlog (Tablet-Test 27.09.). 013 hat die Stufe nicht angefasst; die Änderungen an Kopf und Kacheln gelten dort mit, geprüft wurde sie nicht |
| 11 | Owner-Farben ohne Text | behoben | `b4-ndot-380.png`, `n2-chips-380.png` | die Punkte tragen S/A/C, auch die Chips im Besuchsblock |
| 12 | Ladezustand karg | behoben | `n3-laden-380.png`, `n3-laden-reduced-380.png` | Gate-Leiste füllt sich in 1,2 s; ohne Bewegung drei stehende Punkte |
| 13 | Browser-Zurück aus `#finanzen` | behoben | `b3-finanzen-380.png` | History-Eintrag beim Öffnen, Akte weiterhin ohne (006) |
| 14 | Fälligkeit nur absolut | behoben | `a1-380-falz-nachher.png` | „bis Do 15.10. (in 23 Tagen)" unter 60 Tagen |
| 15 | Person nur über Pille, „Ich" mehrdeutig | behoben | `a1-380-falz-nachher.png` | Avatar-Kürzel mit Namen im Tooltip, Bereich heißt „Ich (Sebastian)" |
| 16 | Changelog-Auto-Anzeige bei vielen Einträgen | **nicht in 013** | – | laut Audit Sache von 015 (Versionen 0.1–1.0) |
| 17 | Druckblatt | behoben | `b1-umzugstag-druck.pdf`, `b1-umzugstag-druck-vorschau.png` | Teilschritte mit Kästchen, 7 mm (Teilschritte 5 mm, `013-abweichungen.md` §9), Zählernummer/Stand/Uhrzeit, Kontakte oben |
| 18 | Akte wiederholt die Aufgabenzeile | behoben | `a4-akte-inline-380-nachher.png` | die Zeile ist der Kopf der Akte, Häkchen und Titel genau einmal |
| 19 | Teilschritt-× ohne Bestätigung | behoben | `b2-subtask-edit-380.png` | Löschen nur im Bearbeitungsmodus, mit Rückfrage |
| 20 | „Bei Claude · am Zug 1" kryptisch | behoben | `a1-380-falz-nachher.png` | Unterzeile entfernt |
| 21 | Rot auf „wartet auf dich" | behoben | `n2-chips-380.png`, `rot-regel-wartet-380.png` | erst im Besuchsblock (N2), dann überall: Zeile, Spaltenkopf und Band der Akte. Regel „Rot = überfällig oder unwiderruflich" steht in `CLAUDE.md` |

Dazu die zwei Nachträge aus dem Audit-Text:

| Punkt | Status | Beleg |
|---|---|---|
| 1024 × 768 zeigte ein leeres Panel über 43 % der Breite | behoben | `a3-1024x768-overlay-zu.png`, `-offen.png` |
| Tap-Ziele Suchfeld und Gate-Segmente unter 44 px | behoben | `a1-380-falz-nachher.png` (beide 44 px, sichtbar unverändert) |

**Bilanz:** 21 Findings – 18 behoben (#6 durch Sebastians Entscheidung vom 22.09.: keine Legende, Antippen zeigt den Gate-Text), 1 offen (#10 Tablet), 2 bewusst nicht in 013 (#8 Backlog, #16 in 015). Dazu beide Nachträge behoben.

## Teil 3 – Was aus 013 heraus offen bleibt

- **#10 Tablet 600–899 px** – die Stufe ist unverändert und ungeprüft; der Audit setzt den Test auf den 27.09.
- **#8 Suchfeld** – erst nach zwei Wochen Nutzung entscheiden, ob es Platz kostet oder Platz spart.
- **#16 Changelog** – gehört zur Versionierung in 015.
