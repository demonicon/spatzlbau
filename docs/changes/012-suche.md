# Änderungsauftrag 012 – Suche

Stand: 22.09.2026 · Status: umgesetzt (22.09.2026, in `preview` zum Prüfen am Handy) · Branch: `feature/suche` · Modell: Sonnet
Abweichungen und Entscheidungen: `docs/changes/012-abweichungen.md`
Betrifft: Kopf der Hauptansicht, Listenrendering; **nicht** Finanzansicht, **nicht** Datenschicht. Letzter Funktionsauftrag vor dem Feature-Freeze.

## Verhalten

- **Suchfeld** im Kopf der Hauptansicht, über den Kacheln, immer sichtbar (kein Lupen-Icon zum Aufklappen). Platzhalter "Aufgabe suchen". × zum Leeren, Escape leert und verlässt das Feld. Am Desktop springt `/` ins Feld, wenn kein anderes Eingabefeld fokussiert ist.
- **Treffer:** Teilstring im Aufgabentitel **oder** in einem Teilschritt-Titel; ohne Groß/Klein; Umlaute und ß tolerant (ä = ae, ß = ss, beide Richtungen). Ab dem ersten Zeichen, ohne Verzögerung.
- **Anzeige:** Die Bereichsstruktur (Ich / Wartet auf mich / Gemeinsam / Bei Anna) bleibt; Bereiche ohne Treffer verschwinden; die eingeklappten "N warten auf einen Vorgänger" werden bei Treffern automatisch aufgeklappt. Treffer im Teilschritt zeigen den Teilschritt als zweite Zeile unter dem Titel, Treffertext hervorgehoben (fett, keine Farbe). **Erledigte Treffer** erscheinen am Ende jedes Bereichs, ausgegraut.
- **Filter-Interaktion:** Eine Eingabe ersetzt einen aktiven Kachel-Filter; der Chip wird ausgeblendet. Leeren stellt den vorherigen Filter wieder her.
- **Springe zu:** Antippen eines Treffers leert die Suche, stellt den vorherigen Zustand wieder her, scrollt zur Aufgabe und markiert sie kurz (Hintergrund 1 s, respektiert `prefers-reduced-motion`). Am Desktop öffnet sich zusätzlich das Panel. Die Akte wird am Handy **nicht** automatisch geöffnet – die Person entscheidet mit dem nächsten Tipp.
- **Kein Treffer:** eine Zeile "Nichts gefunden zu ‚…'".
- Suche wirkt nur auf der Hauptansicht. In `#finanzen` kein Feld.
- Suchbegriff wird nicht gespeichert (kein localStorage, kein URL-Hash).

## Nicht Teil von 012

Suche in Kommentaren, Beratungstexten oder Kostenzeilen; Fuzzy-Matching; Suchverlauf.

## Akzeptanzkriterien

- [x] "einschreiben" findet "Wohnung Sebastian kündigen" über den Teilschritt, mit Teilschritt als zweiter Zeile
- [x] "kuendigen" und "kündigen" liefern dieselben Treffer
- [x] Erledigte Aufgaben erscheinen ausgegraut am Bereichsende
- [x] Treffer antippen: Suche leer, Liste an der Aufgabe, kurze Markierung; Desktop zusätzlich Panel offen
- [x] Aktiver Kachel-Filter wird ersetzt und nach dem Leeren wiederhergestellt (die Phasenwahl ebenso, siehe Abweichung 1)
- [x] `/` fokussiert das Feld nur, wenn kein Eingabefeld aktiv ist; Escape leert
- [x] 380 px: Feld volle Breite, Tap-Ziel ≥ 44 px – die Seite hat nichts fest Positioniertes, das beim Scrollen etwas verdecken könnte (am Gerät zu bestätigen)
- [x] Changelog: "Oben gibt es jetzt ein Suchfeld – tippe ein Wort, finde die Aufgabe, tippe drauf und du bist dort."

## Nachtrag vom 22.09.2026: die Vorschau ist read-only für den Nutzerstand

Beim Abnehmen der Vorschau ist aufgefallen, dass `/preview/` auf derselben Datenbank denselben **Lesestand** verbraucht wie die echte App: Wer dort „Was ist neu?" schließt, hat die Version gelesen – auch für `/`. Wer die Vorschau öffnet und wieder verlässt, setzt den Besuch zurück, gegen den „Seit deinem letzten Besuch" misst, und ein geöffnete Aufgabe nimmt dort ihren Punkt endgültig weg.

Behoben: `/preview/` schreibt nie in `allowlist`. Die drei Wege `last_visit_at`, `seen_comments` und `last_seen_version` hören an derselben Stelle auf (`ui.preview` in `app/state.js`, direkt bei den Schreibern). Angezeigt wird weiterhin der Live-Stand: der Besuchsblock steht, die Changelog-Automatik geht auf, die Punkte sind da – sie werden nur nicht verbraucht. Innerhalb der Sitzung verhält sich alles wie gewohnt (Punkt geht beim Öffnen weg, Hinweis bleibt zu), nach einem Neuladen ist der Live-Stand wieder da.

Die Statuszeile sagt es in jedem Zustand, auch offline: **„Vorschau – Lesestand wird nicht gespeichert"**. Sie bekommt in der Vorschau eine eigene Zeile unter der Personen-Pille, sonst müsste sie sich am Handy auf drei Zeilen quetschen. Die Regel steht in `CLAUDE.md` (Abschnitt Preview-Deploy) und in `BRIEFING.md` §5.

Geprüft: 14 von 14 Prüfungen grün, kopfloses Chrome, 380 px und 1280 px, wieder ohne Login und mit dem Rekorder statt der Datenbank. Beide Richtungen bewiesen – in der Vorschau bleibt der Rekorder leer, in der echten App verzeichnet er genau die drei erwarteten Schreibwege (`last_visit_at+seen_comments`, `seen_comments`, `last_seen_version`). Screenshots: `vorschau-statuszeile-380.png`, `vorschau-statuszeile-1280.png`.

Kein Changelog-Eintrag: die Änderung ist nur auf `/preview/` sichtbar, und dorthin geht nur Sebastian.

## Umsetzung

Die Regeln liegen in `app/search.js` (Falten von Umlauten mit Rückabbildung auf die Originalstelle, Treffersuche, Hervorhebung), die Ansicht in `app/views/dashboard.js` und `app/ui/task.js`, das Verhalten (Tippen, `/`, Escape, Sprung) in `app/main.js`. Geprüft im kopflosen Chrome bei 380 px und 1280 px, 30 von 30 Prüfungen grün, ohne Login und ohne eine einzige Datenbank-Abfrage – Nachweis in der Abweichungsliste, Abschnitt 8. Screenshots: `docs/changes/012-screenshots/`.
