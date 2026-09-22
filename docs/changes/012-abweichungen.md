# Auftrag 012 – Abweichungsliste und Entscheidungen

Stand: 22.09.2026 · Branch `feature/suche` · alles andere im Auftrag ist wie beschrieben umgesetzt.

## 1. Die Phasenwahl wird behandelt wie der Kachel-Filter

Der Auftrag nennt nur den Kachel-Filter: „Eine Eingabe ersetzt einen aktiven Kachel-Filter … Leeren stellt den vorherigen Filter wieder her." Die Phasen-Chips sind aber genauso ein Filter – und sie werden **pro Gerät gemerkt**. Wer zuletzt Phase 3 offen hatte, hätte beim Suchen nach einer Aufgabe aus Phase 1 nichts gefunden, ohne dass etwas erklärt, warum.

Deshalb setzt eine Eingabe auch die Phase auf `alle` (der Chip „alle" ist dann sichtbar aktiv) und das Leeren stellt sie zusammen mit dem Filter wieder her. Die gemerkte Phase im Gerätespeicher wird dabei **nicht** überschrieben – ein Reload während einer Suche bringt die alte Phase zurück.

Tippt jemand *während* der Suche selbst auf eine Kachel oder einen Phasen-Chip, ist das eine eigene Entscheidung: dann gibt es nichts mehr zurückzustellen.

## 2. `/` ist nicht auf den Desktop beschränkt

Der Auftrag sagt „Am Desktop springt `/` ins Feld". Die Taste ist an eine Hardware-Tastatur gebunden, nicht an eine Bildschirmbreite: ein iPad mit Tastatur soll sie auch haben, ein schmales Desktop-Fenster sie nicht verlieren. Bedingung ist deshalb nur: Hauptansicht offen und kein Eingabefeld aktiv (`INPUT`, `TEXTAREA`, `SELECT`, `contenteditable`). Am Handy ohne Tastatur passiert schlicht nie etwas.

## 3. Die Markierung nach dem Sprung ist neutral, nicht gelb

Der Auftrag sagt „markiert sie kurz (Hintergrund 1 s)", ohne Farbe. Gelb ist im Design das Signal für *fristkritisch*, Rot für *überfällig* – eine gelbe Zeile hätte für eine Sekunde etwas Falsches behauptet. Die Markierung ist deshalb die neutrale Linienfarbe plus ein Balken in Textfarbe am linken Rand (dieselbe Sprache wie die ausgewählte Zeile am Desktop) und blendet über eine Sekunde aus.

`prefers-reduced-motion` ist berücksichtigt: ohne Bewegung entfällt das Ausblenden, die Markierung steht die Sekunde still und verschwindet dann.

## 4. Hervorgehoben wird auch im Titel

Der Auftrag beschreibt die Hervorhebung beim Teilschritt. Sie gilt genauso im Aufgabentitel – sonst sieht man bei einem Titel-Treffer nicht, woran es lag. Fett, keine Farbe, wie gefordert.

## 5. Am Desktop passt sich das Spaltengitter der Zahl der Bereiche an

Die drei Personen-Spalten liegen ab 1180 px in einem festen Dreier-Gitter. Verschwinden beim Suchen Bereiche ohne Treffer, blieb dort eine graue Lücke stehen. Das Gitter nimmt jetzt so viele Spalten, wie Bereiche da sind (`data-n` an `.cols`).

## 6. Nebenbei behoben: der Cursor sprang beim Tippen ans Ende

Die App zeichnet die Ansicht bei jeder Änderung neu und gibt danach den Fokus zurück – die **Cursorposition** aber nicht. Beim Suchfeld fällt das sofort auf (es zeichnet bei jedem Zeichen neu), es betraf aber auch den Titel in der Akte, wenn in dem Moment eine Änderung von Anna ankam: der Cursor sprang ans Ende des Feldes.

Die Fokus-Wiederherstellung merkt sich jetzt zusätzlich Anfang und Ende der Auswahl (`app/main.js`, `keyOf`/`restoreFocus`).

## 7. Umgesetzt mit Opus 5

Im Auftragskopf steht „Modell: Sonnet". Die Sitzung lief auf Opus 5; das Ergebnis ist davon unberührt, es ist nur hier vermerkt, damit der Auftragskopf nicht falsch gelesen wird.

## 8. Was geprüft wurde – und was nicht

Geprüft im Kopflosen Chrome (380 px und 1280 px), **ohne Login und ohne eine einzige Datenbank-Abfrage**: jeder Supabase-Aufruf war für die Dauer des Laufs durch einen Rekorder ersetzt, der Lauf endet mit dem Nachweis, dass der Rekorder leer geblieben ist. Die Suche schreibt nichts und liest nichts nach – ein Test am echten Nutzerkonto war dafür nicht nötig (Regel in `CLAUDE.md`).

30 von 30 Prüfungen grün, keine Konsolenfehler. Enthalten: alle acht Akzeptanzkriterien, dazu Feldbreite und Tap-Ziel bei 380 px, das automatische Aufklappen des blockierten Teils, das Verschwinden leerer Bereiche, die Zeile ohne Treffer (seit 013 A5: „Kein Treffer für … – auch nicht in den Teilschritten."), kein Feld in `#finanzen`, und dass die Markierung nach einer Sekunde wieder weg ist.

**Nicht geprüft:** das echte Gerät. Ob die Bildschirmtastatur von iOS-Safari beim Scrollen wirklich nichts verdeckt, sieht nur Sebastian am Handy – die Seite hat außer der Hinweiszeile („Toast") nichts fest Positioniertes, damit gibt es nichts, was mitscrollen und etwas verdecken könnte.

## 9. Offen aus früheren Aufträgen

- Der Schutz gegen bekannte Passwörter („Leaked Password Protection") ist in Supabase weiterhin aus (Hinweis aus dem Advisor, unverändert seit 008).
- Der Offline-/Flugmodus-Check vom Startbildschirm aus (009) steht am Gerät weiterhin aus.
