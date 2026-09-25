# 038a – Inventar: Screenshots und Abweichungsmatrix aller Ansichten

Stand: 25.09.2026 · Status: umgesetzt · Meilenstein 2.3 · Branch: `chore/038a` von `preview` · Modell: Sonnet · Aufwand: S
Vorarbeit für den Systempass (Claude Design → 038 Seitensystem). Kein Code an der App, keine Änderung an Verhalten oder Look. Kein Changelog, kein Release.

## Ziel

Eine vollständige, nüchterne Bestandsaufnahme: Wie sieht jede Ansicht heute aus, und worin unterscheiden sich die Ansichten, obwohl sie dasselbe tun. Das ist der Input für Claude Design – ohne Bewertung, ohne Vorschläge.

## Screenshots (Playwright, ohne Login-Daten im Bild)

Ansichten: Aufgaben · Personen, Aufgaben · Phasen, Aufgaben · Timeline, Finanzen, Entscheidungen, Anfragen – je **380 px** und **1280 px**, jeweils mit **geöffnetem Panel/Akte** (eine Beispielaufgabe) und ohne. Zusätzlich je einmal: der Posten-Editor (Finanzen) und die Anfrage-Detailseite mit Ergebnis (Testdaten per `state`, nichts schreiben). Ablage `design/snapshot/2026-09-26-inventar/` (gitignored), Dateinamen `<ansicht>-<breite>-<panel|leer>.png`. Sind echte Kommentare im Bild, Testdaten simulieren oder den Bereich schwärzen – keine echten Kommentare im Snapshot.

## Matrix `docs/changes/038a-matrix.md` (committet)

Eine Tabelle, Zeilen = die sechs Ansichten, Spalten = je Merkmal der **Ist-Zustand als kurzer Fakt**, nicht als Urteil:

1. Kopfzeile: Titel? Countdown? Vorschau-Chip? Nav-Pillen Position? Avatar?
2. Sub-Navigation: Segment/Pillen? welche Werte? Position?
3. Listenform: Karten / Zeilen / Tabelle; Zeilenhöhe; Spalten
4. Panel (≥ 900): Breite; Verhalten ohne Auswahl (leer / erste Zeile / Text); Schließen
5. Handy (< 900): Liste → Seite? Zurück-Weg?
6. Filter: Pillen? Kacheln als Filter? Position?
7. Primäraktion: welche, wo
8. Anlegen-Aktion (+): wo, Stil
9. Editor: Hülle (Breite, Kopf, Fertig/Abbrechen), Ort (Dialog / inline / Seite)
10. Leerzustand: Text
11. Stand/Chips: welche Chips, welche Leiter
12. Datumsformat und Zahlformat in der Ansicht
Dazu eine zweite Tabelle **Komponenten-Vorkommen**: jede Komponente (Kopfzeile, Nav-Pille, Segment, Tabelle, Karte, Leiter, Chip, Editor-Hülle, Leerzustand, Filter-Pille, Kachel) → in welchen Dateien/Funktionen sie gerendert wird (`grep`), damit sichtbar wird, wo dieselbe Sache mehrfach existiert.

## Akzeptanzkriterien

- [x] 24 + 2 Screenshots vorhanden, keine echten Kommentare sichtbar (echte Kommentare per CSSOM geschwärzt, siehe `038a-abweichungen.md`)
- [x] Matrix mit 6 × 12 Fakten und Komponenten-Vorkommen mit Dateipfaden (`038a-matrix.md`)
- [x] Kein Diff außerhalb `docs/changes/038a-*`; `npm run check` grün
- [x] Bericht ≤ 8 Zeilen: Pfad der Screenshots, die drei größten Mehrfach-Implementierungen (Datei, Zeilen)
