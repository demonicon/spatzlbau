# 019c – Timeline: Abgleich gegen Skizze 3b, Desktop-Verdichtung

Status: umgesetzt (Branch `feat/019c-timeline-abgleich` → `preview`, Abweichungsliste in `019c-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Opus (Layout) · Aufwand: M
Befund Sebastian (Screenshot Desktop 1.200 px): Die Timeline sieht nicht aus wie entworfen. Läuft mit 016c in einer Session, nach 026.

## Maßstab

Project-HTML-Export in `design/handoff/2026-09-23-timeline/`, Ansicht „3b · Handy 380". Für den Desktop gibt es in der Skizze nur 3a (Bahnen, → 019b, später); bis dahin gilt: **3b verdichtet, nicht breitgezogen.**

## Abweichungen (aus dem Screenshot, zusätzlich zum Overlay-Vergleich)

1. **Zeilenhöhe.** Jede Aufgabe belegt vier Zeilen (Titel · Zuständigkeits-Pille · „wartet auf: …" · Meta). Mockup: Titel, darunter eine Zeile mit Zuständigkeit · Signal · Phase. Zwei Zeilen, ~56 px.
2. **„wartet auf: Neuen Mietvertrag unterschreiben"** als volle Zeile mit Link in jeder blockierten Aufgabe. Mockup: „Phase 2 · wartet auf 2" in der Meta-Zeile. Soll: nach 020 – Checkbox gestrichelt, in der Meta-Zeile „wartet auf 2 ›" (Zahl), Tipp/Hover zeigt die Titel. Nur bei Blockade.
3. **Schienen.** Fünf Phasen-Spuren mit je einer durchgehenden Linie, solange die Phase läuft, und einem Punkt in der Spur der eigenen Phase – im Screenshot zwei dünne Linien und alle Punkte auf derselben x-Position. Soll: fünf Spuren à 8 px Abstand, Linie in `--line`, Punkt 8 px in `--ink`, laufende Phase kräftiger, Gate ◆ am Spurende in der Spur.
4. **Datum-Spalte:** „05.10. / Mo / T−88" dreizeilig. Mockup: „05.10." fett, darunter „Mo · T−88" in einer Zeile. Umzugstag-Anker: „Sa · Umzug · T−27" bleibt, aber einzeilig.
5. **Meta-Zeile** zu lang: „Phase 2 · Verträge lösen · Claude unterstützt · 0/4 Teilschritte · 1 Kommentar". Soll: Zuständigkeits-Pille · ein Signal-Chip (020) · „Phase 2" · dann höchstens zwei leise Angaben (Teilschritte n/m, Kommentare n). Betrag nur, wenn eine Kostenzeile existiert.
6. **Breite am Desktop.** Liste läuft über 1.200 px. Soll ab 900 px: Liste links, max. 720 px, rechts das Panel aus 006/009 (Akte der gewählten Aufgabe, ohne Auswahl „Zwischen euch" aus 018) – so wie das Dashboard am Desktop. Damit ist die Timeline am Desktop bedienbar, nicht nur lesbar.
7. **Heute-Marke** als Zeile „HEUTE 23.09." ohne Linie. Mockup: Pille „Heute" mit gestrichelter Linie über die Listenbreite, Überfälliges direkt darüber in Rot.
8. **Tippfehler** „Umzug am 02.01.." (doppelter Punkt) in der Hinweiszeile.
9. **Filterzeile:** zwei Pillenreihen (Personen/Phasen/Timeline und alle/Du/Gemeinsam/Anna/Heute) plus Phasenstreifen im Kopf – drei Filterebenen übereinander. Soll: Ansichts-Pillen bleiben, Personenfilter bleibt, „Heute" wird Text-Button rechts in der Zeile („↓ Heute"), Phasenfilter nur über den Streifen (021).

## Nicht in diesem Auftrag

3a Bahnen-Ansicht (019b). Zeitgruppen-Logik (018) bleibt.

## Akzeptanzkriterien

- [x] 380 px: Overlay gegen Export 3b – Zeilenhöhe, Datumsspalte, Schienen, Meta-Zeile innerhalb 8 px
- [x] 1280 px: Liste ≤ 720 px breit, Panel rechts zeigt die angetippte Aufgabe; ohne Auswahl „Zwischen euch"
- [x] 20 Aufgaben passen bei 1280 px auf ~1.100 px Höhe (≤ 56 px je Zeile)
- [x] Blockierte Aufgabe: gestrichelte Checkbox, „wartet auf 2 ›" in der Meta-Zeile, Hover/Tipp nennt beide Titel
- [x] Fünf Schienen sichtbar, Punkt in der richtigen Spur, Gate-◆ je Phase, laufende Phase kräftiger
- [x] Heute-Pille mit gestrichelter Linie, Sprung beim Öffnen
- [x] Bericht ≤ 15 Zeilen, Changelog gemeinsam mit 016c: „Finanzen und Timeline sehen jetzt aus wie entworfen."
