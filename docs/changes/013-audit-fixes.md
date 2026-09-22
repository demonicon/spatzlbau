# Änderungsauftrag 013 – Audit-Fixes vor 1.0

Stand: 22.09.2026 · Status: umgesetzt (22.09.2026, in `preview` zum Prüfen am Handy) · Branch: `feature/audit-fixes` · Modell: Opus (Teil A), Sonnet (Teil B)
Abweichungen, Entscheidungen und Messwerte: `docs/changes/013-abweichungen.md` · Screenshots: `docs/changes/013-screenshots/`
Quelle: UX-Audit 22.09. (Heuristik + Screenshots `docs/audit/2026-09-22/`). Zwei Teile: **A** Layout-Findings für den Meilenstein, **B** Bugfixes. Nach `preview`, Handy-Check durch Sebastian, dann `main`. Letzter Auftrag vor 015.

## Teil A – Layout (Meilenstein)

**A1 · Kopf am Handy (≤ 599 px) – Ziel: erste Aufgabe innerhalb des ersten Bildschirms bei 380×700.**
- Countdown: Zahl von Schaugröße auf 28 px, in einer Zeile mit "Tage bis zur Schlüsselübergabe" und dem Einzugsdatum; Personen-Pille und "gespeichert · Live" in dieselbe Kopfzeile wie der Einzug.
- Gate-Leiste: bleibt, aber ohne Zähler-Zeile darüber (Zähler als Tooltip/aria-label), Höhe halbiert.
- Besuchsblock: **eine Zeile** mit Chips ("1 Anna · 1 Claude · 1 erledigt · 1 wartet auf dich"), Warnfarbe nur beim letzten. Vier volle Zeilen nur, wenn ein Chip angetippt wird (Aufklappen).
- Kacheln: fünf in **einer Reihe** (Zahl oben, Label darunter, Label darf zweizeilig sein, 12 px) – keine leere Zelle. Alternative, falls fünf bei 380 px nicht lesbar sind: "Kosten" als schmale Zeile unter den vier Kacheln ("Kosten · 3.129 € netto →"). Entscheidung in der Abweichungsliste mit Screenshot beider Varianten.
- Suchfeld: bleibt sichtbar (012), aber kompakt (40 px) und optisch leichter (kein Kasten, nur Linie unten).
- Phasen-Chips: eine Zeile, horizontal scrollbar, "alle" vorausgewählt.
- Messung: Screenshot 380×700 mit Falzlinie, erste Aufgabenzeile muss über der Linie liegen.

**A2 · Layout wächst mit (≥ 1180 px).** Kein Maximum bei 1280: Container bis 1800 px, darüber zentriert. Spalten `minmax(320px, 1fr)`, Panel `clamp(420px, 30vw, 600px)`. Bei 1920 sollen die drei Spalten je ≥ 380 px haben. Zeilenlänge im Panel begrenzen (max. ~75 Zeichen), damit Kommentare lesbar bleiben.

**A3 · 900–1179 px: kein leeres Panel.** In dieser Stufe ist die Liste eine oder zwei Spalten in voller Breite; die Akte erscheint als **Overlay von rechts** (Breite 440 px, dahinter abgedunkelt, Escape/×/Tippen außerhalb schließt). Das feste, stille Panel gibt es erst ab 1180. Entscheidung aus 006 ("stilles Panel") gilt damit nur noch ab 1180 – in `006-abweichungen.md` nachtragen.

**A4 · Akte ohne Doppelung.** Beim Öffnen inline wird die Aufgabenzeile zum Kopf der Akte: Checkbox und Titel erscheinen einmal. Titel als Text, Bearbeiten über Stift-Icon (öffnet das Feld); kein dauerhaft editierbares Textfeld. Gleiches Verhalten im Panel und Overlay.

**A5 · Kleinigkeiten.** Kachel "Bei Claude" ohne "am Zug N". Bereichstitel "Ich (Sebastian)". Leere Zustände positiv: "Alles erledigt – nächste Fälligkeit am {Datum}" statt "Nichts fällig"; "Kein Treffer für ‚…' – vielleicht in einem Teilschritt?" statt "Nichts gefunden". Fälligkeit unter 60 Tagen zusätzlich relativ: "bis Fr 6.11. (in 45 Tagen)". Kostenabschnitt: beim ersten Öffnen ein einzeiliger Hinweis "Geschätzt → Angebot → beauftragt → fällig → bezahlt – ein Schritt vor, einer zurück", danach nie wieder (Gerätespeicher reicht). Gate-Segment antippen zeigt den Gate-Text und filtert auf die Phase.

**A6 · Kopfzeile und Navigation.**
- Personen-Pille wird zum **Avatar-Kürzel**: Kreis mit "S" bzw. "A" in Owner-Farbe, ohne ausgeschriebenen Namen; der Name erscheint als Tooltip/aria-label und im Bereichstitel "Ich (Sebastian)".
- Rechts neben dem Avatar eine **Icon-Navigation** mit zwei Zielen: Haus (Aufgaben = Home = Hauptansicht ohne Filter, Phase "alle") und Münze/Kasse (Finanzen = `#finanzen`). Aktiver Zustand deutlich (gefüllter Hintergrund in `--ink`, Icon invertiert), inaktiv als Umriss; Tap-Ziele 44 px; Icons als Inline-SVG, Beschriftung als `aria-label` und Tooltip, keine externen Icon-Fonts. "Finanzen" verschwindet dafür aus der Fußzeile.
- **Versionsnummer** in der Fußzeile ist reiner Text, nicht mehr wie ein Button gestaltet. Das Changelog öffnet über ein eigenes Info-Icon (ⓘ) daneben, das denselben "Neu"-Punkt trägt wie bisher die Version. Regel für die Fußzeile: nur Elemente, die wie Bedienelemente aussehen, sind bedienbar – und umgekehrt.
- Fußzeile danach: ⓘ + Version · Umzugstag drucken · Abmelden; "Neu laden" nur, wenn ein Update wartet (dann als Hinweisleiste, nicht als Dauerknopf).
- Desktop: gleiche Kopfzeile, die zwei Icons dürfen dort zusätzlich ihr Label zeigen.

## Teil B – Bugfixes

**B1 · Druckblatt Umzugstag.** Teilschritte als Kästchen unter der Aufgabe (wie in 009 gefordert). Kästchen 7 mm. Zählerstände je Wohnung mit Feldern "Zählernummer", "Stand", "Uhrzeit". Notfallkontakte nach oben unter den Titel. Seitenumbruch nie innerhalb einer Aufgabe mit Teilschritten.

**B2 · Teilschritt-Löschen.** Kein × in der Zeile; Löschen nur im Bearbeitungsmodus des Teilschritts mit Inline-Bestätigung (wie Aufgaben).

**B3 · Zurück aus `#finanzen`.** History-Eintrag beim Öffnen der Finanzansicht, damit Browser-Zurück zur Liste führt; die 006-Entscheidung (kein Eintrag beim Öffnen einer Akte) bleibt.

**B4 · Autorenpunkte mit Initial.** Punkte in Autorenfarbe tragen S/A/C als Text, damit sie ohne Farbe unterscheidbar sind.

**B5 · Eigene Kommentare** löschen (und binnen 10 Minuten bearbeiten) – nur eigene, Inline-Bestätigung. Falls bereits vorhanden: Punkt entfällt, in der Abweichungsliste vermerken.

## Abweichungsliste

`docs/changes/013-abweichungen.md` wie gehabt. Screenshots: 380×700 mit Falzlinie (vorher/nachher), 1024×768 mit Overlay offen/zu, 1920 mit drei Spalten und Panel, Akte inline nachher, Druck-PDF.

## Akzeptanzkriterien

- [x] 380×700: erste Aufgabenzeile über der Falz (endet bei 652 px); keine leere Kachelzelle
- [x] 1920: Spalten 3 × 407 px, Panel 576 px, Leerraum 3 % je Seite
- [x] 1024×768: keine leere Panelfläche; Overlay öffnet/schließt per ×, Escape, Tippen außerhalb
- [x] Akte inline: Titel und Checkbox erscheinen einmal; Titel nur über Stift editierbar
- [x] Druck-PDF enthält Teilschritte, 7-mm-Kästchen (Teilschritte 5 mm, siehe Abweichung 9), Zählernummer-Felder, Kontakte oben
- [x] Teilschritt lässt sich nicht mit einem einzelnen Tipp löschen
- [x] Zurück aus `#finanzen` landet auf der Liste
- [x] Kopfzeile: Avatar-Kürzel, zwei Navigations-Icons (Aufgaben/Home, Finanzen) mit sichtbarem aktivem Zustand, Version als Text, Changelog über ⓘ; Fußzeile ohne "Finanzen" und ohne Dauerknopf "Neu laden"
- [x] Kontrast-, Tap-Ziel- und Fokus-Kriterien unverändert – mit zwei benannten Ausnahmen (Suchfeld 40 px laut Auftrag, Gate-Segmente 30 px), beide in der Abweichungsliste
- [x] Changelog: "Die Startseite ist am Handy deutlich kürzer – die erste Aufgabe steht jetzt gleich oben. Am großen Bildschirm nutzt die App die ganze Breite. Das Umzugstag-Blatt hat jetzt alle Teilschritte und größere Kästchen."
