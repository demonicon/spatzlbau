# 019c – Abweichungsliste Timeline gegen Export „3b · Handy 380"

Stand: 23.09.2026 · Branch `feat/019c-timeline-abgleich` → `preview` · Maßstab: `design/handoff/2026-09-23-timeline/Timeline.dc.html`, Telefon „Oben nach unten · Phasen als Schienen · Handy 380" (Scroll-Box zum Messen aufgeklappt)
Methode: Export und App headless gerendert, Zeilen, Datumsspalte, Schienen (Linien, Punkte, Rauten) und Meta-Zeile vermessen, Ausschnitte nebeneinander. Demo-Daten mit Einzug 01.01.2027 (heute = T−100 wie im Export). Keine Migration.

| # | Export sagt | App zeigte | Stand |
|---|---|---|---|
| 1 | Aufgabe = Titel + eine Meta-Zeile (zweizeiliger Titel: 83 px) | vier Zeilen: Titel · Pille · „wartet auf: …" · Meta | behoben – 84 px |
| 2 | „Phase 2 · wartet auf 2" in der Meta-Zeile | volle Zeile „wartet auf: Neuen Mietvertrag unterschreiben" mit Link | behoben – „wartet auf 2 ›", Tooltip nennt die Titel, Tipp klappt sie als Links auf; Checkbox gestrichelt (020) |
| 3 | fünf Spuren im 12-px-Raster, 2-px-Linie durch jede Zeile: Tinte, solange die Phase läuft, sonst hell | 9-px-Raster, 1-px-Linie nur für laufende Phasen – wirkte wie eine Linie | behoben (Export statt Auftragstext „8 px") |
| 4 | Punkt 10 px in der Farbe der Zuständigkeit mit Tintenring, auf Höhe der ersten Titelzeile | 7 px, immer Tinte | behoben (Export statt Auftragstext „8 px in --ink") |
| 5 | Gate als eigene Zeile: ◆ in der Spur der Phase, dort endet ihre Linie; „GATE PHASE 1 · FINDEN & ZUSAGEN" + Satz; nach allen Aufgaben desselben Tages | Textzeile mit ◆ davor, Raute in der letzten Aufgabenzeile | behoben; das „Gate:"-Präfix aus dem Seed wird weggelassen |
| 6 | Datum „05.10." 13 px fett, darunter „Mo · T−88" 11 px, rechtsbündig | dreizeilig „05.10. / Mo / T−88" | behoben; Umzugstag-Anker „Sa · Umzug · T−41" einzeilig |
| 7 | Einzugstag als „Tag 0" | „T±0" | behoben |
| 8 | Meta: Zuständigkeits-Pille · ein Signal („seit 20 T. überfällig", „heute", „kritisch") · „Phase n" | Pille in eigener Zeile, Meta „Phase 2 · Verträge lösen · Claude unterstützt · 0/4 Teilschritte · 1 Kommentar" | behoben; Phasenname und Delegationsart raus; bis zu zwei leise Angaben (Teilschritte, Kommentare) und Betrag nach Auftrag §5 – der Export zeigt keine |
| 9 | fristkritische Titel fett | nie fett | behoben |
| 10 | überfällige Zeile hellrot hinterlegt, Datum rot | nur Datum rot | behoben |
| 11 | „Heute": Pille und gestrichelte Linie über die Liste – im Export rot | Textzeile „HEUTE 23.09." ohne Linie | behoben, **aber Tinte statt Rot** – CLAUDE.md: Rot nur für überfällig und Unwiderrufliches |
| 12 | Monatskopf nur über der Inhaltsspalte, Schienen laufen durch; „Heute" unter dem Kopf seines Monats | Kopf über die ganze Breite, „Heute" vor dem ersten Monatskopf | behoben |
| 13 | Einzug als eigene Zeile: weiß, dicke Linien, „Einzug" 20 px, „Fr, 01.01.2027 · Tag 0" | fehlte | behoben |
| 14 | Filter: Phasen-Knöpfe 1–5 und „Heute" | zwei Pillenreihen (Ansicht; Personen + „Heute"), dazu der Phasenstreifen | nach Auftrag #9: Ansichts-Pillen, Personenfilter, „↓ Heute" als Text-Knopf rechts; Phasen nur über den Streifen (021) |
| 15 | – | Hinweiszeile „Umzug am 02.01.." | behoben (Tippfehler) |
| 16 | 3b ist das Telefon; am Desktop „verdichtet, nicht breitgezogen" (Auftrag) | Liste über die volle Breite, 900–1179 px ohne Panel, Akte zusätzlich inline | behoben – Liste max. 720 px, Panel ab 900 px (auch 900–1179), ohne Auswahl „Zwischen euch", Akte nur im Panel |
| 17 | – | am Desktop mehrzeilige Titel | Titel ab 900 px einzeilig mit Tooltip – so bleibt jede Zeile 56 px (Auftrag „≤ 56 px je Zeile") |
| 18 | Sprung zu „Heute" beim Öffnen | nur beim Wechsel in die Timeline | behoben – auch beim App-Start direkt in der Timeline |
| 19 | keine Checkbox | Checkbox links vom Titel | bleibt (019: abhaken in der Zeile), steht jetzt rechts, damit Titel und Meta-Zeile an der Export-Position beginnen |
| 20 | Kopf „EINZUG · FR, 1. JAN 2027 / 100 Tage", Ansichten als verbundenes Segment | Dashboard-Kopf aus 018/021 | bleibt – gemeinsamer Kopf aller Ansichten, nicht Teil dieses Auftrags |

## Prüfung

- 380 px gegen Export: Datumskante 60 (59), Spuren 72/84/96/108/120 (gleich), Punkt x68 / +14 / 10 px (gleich), Titel und Meta x131 (gleich), Meta 5 px unter dem Titel (gleich), zweizeilige Zeile 84 (83), Monat 40 (40), Heute 47 (48) – alles ≤ 2 px. Kein waagrechtes Scrollen.
- 1280 px: Liste 720 px, Panel „Zwischen euch", angetippte Aufgabe im Panel und nicht inline; 20 Aufgaben je 56 px = 1.120 px (mit Monats-, Heute- und Gate-Zeilen dazwischen 1.259 px).
- 1000 px: Panel statt Overlay, Liste 638 px.
- Fünf Schienen je Zeile, Punkt in der Spur der eigenen Phase, fünf Gate-Rauten, laufende Spur Tinte, ruhende hell.
- Regression 016–026: 222 von 223 grün (die eine: 016s alter Test auf „Angebot eintragen", seit 016b ersetzt). Alte 019/021-Tests an die neuen Zeilentypen angepasst (Monats-, Heute-, Gate- und Einzug-Zeilen haben keine Aufgaben-ID).
- Screenshots: `design/snapshot/2026-09-23-timeline/timeline-380.png`, `timeline-1280.png` (Demo-Daten).
