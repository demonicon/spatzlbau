# 017 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/017-akte` → `preview` · Aufwand M (zwei Breiten) · **keine Migration**

## Entscheidungen im Zweifel

1. **Das Kommentarfeld steht unten, nicht oben.** Der Auftrag schreibt „Kommentarfeld … (immer
   oben, ein Feld)", das Mockup 2b zeigt es in beiden Akten unter den Kommentaren. Umgesetzt ist
   die Mockup-Fassung; „ein Feld" ist erfüllt (früher stand es bei delegierten Aufgaben zweimal
   in der Akte). Ein Eingabefeld über dem Verlauf hätte den neuesten Kommentar nach unten
   gedrängt, und genau der soll beim Öffnen sichtbar sein.
2. **„Geändert" ist ein Umriss in Textfarbe, kein gelber Grund.** Der Auftrag nennt Gelb; die
   Farbregel aus 015 (und der 2.0-Plan) hält Gelb ausschließlich für „fristkritisch" frei. Die
   Markierung folgt darum der Behandlung aus 020 für „wartet auf dich": ein Balken links am Feld
   und ein Wort im Umriss. Rot bleibt in der Akte an genau einer Stelle: „Aufgabe löschen".
3. **Teilschritte, Kosten und Kommentare speichern weiter sofort.** Der Entwurf sammelt nur
   Spalten der Aufgabe (Titel, Zuständigkeit, Frist, Anker, fristkritisch, Abhängigkeiten,
   Briefing, Delegationsstand). Teilschritte und Kostenzeilen sind eigene Datensätze mit eigenen
   Knöpfen; sie in denselben Entwurf zu nehmen hieße, Anlegen und Löschen zurückhalten zu müssen.
   Die Hinweiszeile zählt deshalb nur Felder – und genau die sieht die andere Person erst nach
   „Fertig".
4. **Statt Ziehen-Griff zwei Pfeile.** Das Mockup zeigt „≡". Ziehen braucht am Handy eine lange
   Berührung und streitet sich mit dem Scrollen; die Reihenfolge steht in keinem
   Akzeptanzkriterium. Jeder Teilschritt hat darum ↑ und ↓ (die die Sortierung tauschen). Echtes
   Ziehen steht als Wunsch in `docs/backlog.md`.
5. **Der Fuß nennt das Datum, nicht die Person.** „zuletzt geändert von Anna, 19.09." bräuchte
   eine Spalte `updated_by`. Eine Migration dafür dürfte die App erst benutzen, wenn sie
   eingespielt ist – sonst schlägt jede Änderung fehl. Die Zeile sagt darum „zuletzt geändert
   19.09." und bei abgehakten Aufgaben zusätzlich, wer abgehakt hat (`done_by`, gibt es schon).
   Die Spalte ist ein Vorschlag für einen späteren Meilenstein.
6. **Beratungstexte sind im Ansehen lesbar und sonst nirgends änderbar.** Der Bearbeiten-Modus
   listet Beratung nicht auf; nach der Regel in `CLAUDE.md` ist `seed.json` die einzige Quelle
   für Beratungstexte. Die Felder zum Nachtragen leerer Themen entfallen ersatzlos.
7. **Die geöffnete Zeile wiederholt sich nicht mehr.** Ist die Akte am Handy in der Zeile offen,
   lässt die Zeile ihr Signal und ihre leise Zeile weg: Teilschritte, Kommentare und Kosten
   stehen darunter vollständig. Vorher stand beides übereinander.
8. **Der Titel hat keinen Stift mehr.** Titel ändern ist Bearbeiten – damit entfallen
   `ui.titleEdit`, die Akte-Überschrift als Textfeld und der Knopf „+ Alle Felder anzeigen"
   (die leichte/volle Akte aus 009 ist durch die beiden Modi ersetzt).

## Offene Punkte

- Keine. Migration: keine.

## Was geprüft wurde (25 von 25 grün)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Kleine Aufgabe: keine leeren Abschnitte | nur „Kommentare", keine Wertzeilen |
| 2 | Kleine Aufgabe: Kommentarfeld und „Bearbeiten" da | beides |
| 3 | Ansehen hat keinen Primär-Button | 0 |
| 4 | Zuständigkeit und Frist stehen an der Aufgabe | „gemeinsam · bis Do 22.10. · Phase 2" |
| 5 | Volle Aufgabe: nur gefüllte Abschnitte, keine Felder | Teilschritte, Kommentare, Kosten, Hängt ab von |
| 6 | Fuß nennt das Änderungsdatum | „zuletzt geändert 01.09." |
| 7 | Teilschritt abhaken speichert sofort | `from:subtasks, update` |
| 8 | Kommentar senden speichert sofort | `from:comments, insert` |
| 9 | Bearbeiten ist ein eigener Modus mit Leiste | `akte-edit`, Abbrechen + Fertig |
| 10 | Genau ein Primär (Fertig) im Bearbeiten-Modus | 1 |
| 11 | Hinweiszeile startet bei „Noch nichts geändert" | – |
| 12 | Eine Änderung zählt als eine | „1 ungespeicherte Änderung" |
| 13 | Titel + Frist = 2 Änderungen | „2 ungespeicherte Änderungen" |
| 14 | Vor „Fertig" wird nichts geschrieben | Titel im Stand unverändert |
| 15 | Abbrechen mit Änderungen fragt nach | „2 Änderungen verwerfen?" |
| 16 | Nach Verwerfen: Titel unverändert, nichts geschrieben | kein `from:tasks` |
| 17 | Fertig speichert beide Felder in einem Durchgang | genau 1 Request |
| 18 | Nach Fertig steht die Akte wieder im Ansehen | `akte-view` |
| 19 | 380 px: Schaltflächen 40 px, 14 px / 600 | einheitlich |
| 20 | 380 px: kein waagrechtes Scrollen | – |
| 21 | Rot nur an „Aufgabe löschen" | eine Stelle |
| 22 | Desktop: Akte im Panel, kein Overlay | – |
| 23 | Desktop: Bearbeiten wechselt im selben Panel | – |
| 24 | 1280 px: Schaltflächen 32 px | – |
| 25 | Keine Konsolenfehler, kein Lesezugriff | „errors: none" |

Schaltflächen ohne Systemklasse in der Akte: keine.
