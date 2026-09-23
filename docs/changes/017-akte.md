# 017 – Akte: Ansehen und Bearbeiten getrennt

Status: umgesetzt (Branch `feat/017-akte` → `preview`, Abweichungen in `017-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: M
Quelle: Review v2 Teil C, Befund B6 und Mockup 2b (Ansehen 380 volle Aufgabe, Bearbeiten 380, Ansehen kleine Aufgabe). Setzt 020 voraus, ersetzt leichte/volle Akte aus 009.

## Ziel

Die Akte öffnet immer zum **Ansehen**: nur Text, leere Abschnitte verschwinden. Abhaken und Kommentieren bleiben erlaubt, weil sie den Stand melden und die Aufgabe nicht ändern. Alles andere liegt hinter **Bearbeiten**, einem eigenen Modus mit weißem Grund, Formularfeldern und klarem Ende: **Fertig** speichert, **Abbrechen** verwirft. Am Desktop wechselt das rechte Panel genauso.

## Ansehen

- Kopf: Kommentarfeld an die andere Person (immer oben, ein Feld), Titel groß, Zuständigkeits-Pille, Frist-Chip, Phase.
- Block "Stand" (nur bei Delegation): Fortschrittsbalken Briefing › bei Claude › Ergebnis, ein Satz, Text-Link "Briefing lesen ›".
- Teilschritte n/m mit Checkboxen, erledigte durchgestrichen. Ohne Teilschritte: kein Block.
- Zeilen "Kosten" (Betrag · Stand · fällig) und "Hängt ab von" (verlinkte Titel) nur wenn gefüllt.
- Beratung: Pillen für die gefüllten Themen (Ziel & warum jetzt, Ablauf, Was ihr braucht, Rechtslage, Stolperfallen), Tipp klappt den Text auf. Keine Pille für leere Themen.
- Kommentare chronologisch, neue seit letztem Besuch mit "neu".
- Kleine Aufgabe (nur Titel, Zuständigkeit, Frist): dieselbe Vorlage, übrig bleiben zwei Zeilen und das Kommentarfeld – keine eigene "leichte Akte" mehr.
- Fuß: "zuletzt geändert von Anna, 19.09.".
- Sekundär-Button **Bearbeiten** oben rechts.

## Bearbeiten

- Kopfleiste: Text "Abbrechen" links, Titel "Aufgabe bearbeiten", Primär **Fertig** rechts (invertiert auf dunklem Grund). Darunter Hinweiszeile "n ungespeicherte Änderungen · Anna sieht sie erst nach Fertig".
- Grunddaten: Titel, Zuständigkeit (Segment Sebastian / gemeinsam / Anna), Frist (Datum + "n Wochen vor Einzug/Umzug", Anker wählbar seit 1.1), Hängt ab von (Mehrfachauswahl).
- Teilschritte: Liste mit Ziehen-Griff, ×, "+ Teilschritt" als gestrichelte Zeile.
- Delegation an Claude: Stand-Segment, Ziel, Kontext & Rahmendaten, Ergebnis (nur lesen). "Briefing vollständig 2/2".
- Kosten: bestehende Zeilen (Betrag · Stand · fällig), "+ Bezeichnung und Betrag".
- Fuß: Text-Button rot "Aufgabe löschen" (einzige Rotstelle, Rot-Regel), Inline-Bestätigung.
- Geänderte Felder gelb hinterlegt ("geändert"), bis Fertig.
- Fertig schreibt alle Felder in einem Durchgang; Abbrechen ohne Änderungen schließt sofort, mit Änderungen Inline-Frage "Verwerfen?".

## Nicht in diesem Auftrag

Dashboard-Antworten-Knöpfe (→ 018), Belege (→ 025).

## Akzeptanzkriterien

- [x] Akte einer kleinen Aufgabe zeigt genau: Kommentarfeld, Titel, Pille, Frist, Bearbeiten – keine leeren Abschnitte
- [x] Ansehen: Teilschritt abhaken und Kommentar senden speichern sofort, Realtime beim anderen Gerät
- [x] Bearbeiten: Titel ändern, Abbrechen → Titel unverändert; Titel ändern, Fertig → ein Update-Request, Realtime
- [x] Hinweiszeile zählt Änderungen korrekt (Titel + Frist = 2)
- [x] Ein Primär-Button (Fertig) nur im Bearbeiten-Modus; Ansehen hat keinen
- [x] Desktop 1280: Panel wechselt beide Modi ohne Overlay
- [x] Zwei Breiten, Bericht ≤ 15 Zeilen, Changelog: "Die Akte hat zwei Modi: Ansehen und Bearbeiten – nichts wird mehr versehentlich geändert."
