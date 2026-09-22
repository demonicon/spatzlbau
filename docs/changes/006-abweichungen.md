# Änderungsauftrag 006 – Abweichungsliste (nach Schritt 2)

Stand: 22.09.2026 · Branch `feature/desktop` · Quelle: `design/handoff/2026-09-22-desktop/Umzug App.dc.html` + PDF
Screenshots (Vollseite): `docs/changes/006-screenshots/` – `380-dashboard`, `380-akte`, `768-dashboard`, `768-akte`, `1280-dashboard`, `1280-akte`

**Erstes Akzeptanzkriterium, vor jedem Commit geprüft:** 380 px ist pixelidentisch mit dem Stand vor 006 (Dashboard und geöffnete Akte, headless Chrome, Pixelvergleich). Einzige Abweichung im echten Build ist die neue Versionsnummer `2026.09.22.3` in der Fußzeile (Changelog-Eintrag laut Auftrag).

## 1. Technisch nötige Abweichungen vom Design

| Design-Element | Gebaut | Grund |
|---|---|---|
| Acht Kacheln in einer Reihe (Offen, 3 Owner, In Arbeit, Blockiert, Fristkritisch, Überfällig) | Zehn Kacheln in einer Reihe ab 1100 px ohne Panel: Offen, 3 Owner, Diese Woche, Bei Claude, Wartet, Blockiert, Fristkritisch, Überfällig. Mit offenem Panel oder 900–1099 px: zwei Reihen à fünf | Das Design hat noch die 002-Vorstufe („In Arbeit“, kein „Diese Woche“); die zehn Filter aus 002 bleiben – bei ~800 px Listenspalte wären zehn Kacheln 80 px schmal |
| Handoff: Kachelzeile „Offen + Owner-Chips“ bleibt unter 1180 px mit Panel (`cramped`) | Ab 900 px immer uniforme Kacheln (Owner-Kacheln in Owner-Farbe, Zahl über Label), nur die Spaltenzahl wechselt | Ein Layout-Wechsel pro Breite genügt; die Owner-Chips-Zeile ist am Desktop nicht besser lesbar als Kacheln |
| Tabs mit Panel < 1180 px: horizontal scrollbar (`tabsOverflow: auto`) | Nie scrollbar ab 600 px: fünf gleich breite Tabs, Nummer + Name in einer Zeile (Name darf umbrechen), Zähler darunter; mit offenem Panel rutscht der Gate-Text unter die Tabs | Auftrag: „ohne horizontales Scrollen“ – gilt bei mir auch mit Panel |
| Tab-Beschriftung nur Name + Zähler | Zusätzlich die Phasennummer (wie seit 002) | Konsistent mit der Gate-Leiste; Review-Entscheidung aus 002 steht noch aus |
| Akte im Panel als eigener Screen mit Titel-`h1`, Meta-Zeile, „Hängt ab von“ als Liste mit Kästchen, keine Editierfelder | Panel-Kopf (Phase, ×) plus die bestehende Akte unverändert (Titel als Feld, Owner/Typ/Wartet/Offset/fristkritisch editierbar, Abhängigkeiten als Chips) | 006: „nicht Verhalten“, Akte-Umbau kommt mit der UX-Runde „leichte Akte“; am Desktop dieselbe Akte wie am Handy |
| Untere Navigation (Phasen · Finanzen · Person) | Weiterhin keine; Fußzeile mit Version, Neu laden, Seed, Abmelden | Finanzen kommt mit 004 |
| Person-Chip als Schalter, „wechseln zu Anna“ | Chip nicht klickbar, Statuszeile rechts | Person = Login (wie seit 002) |
| Schrift Instrument Sans per Google Fonts | Systemschrift-Stack | Kein externer Request (wie seit 002) |
| Panelbreite `minmax(340px, 440px)`, Liste `1.4fr`, Panel `position: sticky; max-height: 100vh; overflow: auto` | Übernommen | – |
| Kopf: Countdown + Gate-Leiste in einer Zeile ab 900 px | Übernommen, zusätzlich schon ab 600 px (Tablet) | Passt ab 600 px, Design zeigt kein Tablet |
| Inhaltsbreite 1280 px zentriert, Rand links/rechts | Übernommen | – |
| Selektierte Zeile: 3 px Balken links + weißer Hintergrund | Übernommen (nur ab 900 px) | – |

## 2. Design-Lücken (selbst entschieden)

| Zustand | Lösung |
|---|---|
| Tablet 600–899 px (Design zeigt nur 380 und 1280) | Eine Spalte mit max. 760 px; Countdown + Gate-Leiste nebeneinander; Kacheln in drei Spalten (Offen-Zeile mit Chips wie mobil); fünf Tabs gleich breit ohne Scrollen; Akte inline wie am Handy |
| Leeres Panel (keine Aufgabe gewählt) am Desktop | Kein leeres Panel – die Liste nimmt die volle Breite (eine Spalte), zehn Kacheln in einer Reihe; das Panel erscheint erst mit einer Aufgabe |
| Sehr lange Kommentare / lange Beratungstexte im Panel | Panel scrollt intern (max. 100 vh, sticky), Liste scrollt unabhängig; Texte brechen um, nichts läuft über |
| Aufgabe im Panel wird gelöscht | Panel schließt, URL ohne `#task` |
| Filter oder Phase wechseln, während das Panel offen ist | Panel bleibt offen (Auftrag: „offen bleibt, während man in der Liste weiterklickt“); am Handy schließt die inline-Akte wie bisher |
| Fenster über 900 px ziehen oder darunter | Dieselbe Aufgabe wandert zwischen Panel und inline-Akte (`matchMedia`-Wechsel rendert neu); nichts geht verloren, weil Formularfelder beim Verlassen speichern |
| `#task=<id>` mit unbekannter id | Nichts passiert (Dashboard normal), Hash bleibt stehen |
| `#task=<id>` und aktiver Filter würde die Aufgabe ausblenden | Filter wird aufgehoben, Phase gewechselt, Aufgabe geöffnet (Handy: inline und angescrollt; Desktop: Panel) |
| Browser-Zurück nach dem Öffnen | Der Hash wird per `replaceState` gesetzt, kein History-Eintrag – Zurück verlässt die Seite, wie vorher. Wer Zurück-schließt-Panel will: Entscheidung fürs Review |
| Escape | Schließt erst ein offenes „Was ist neu?“-Panel, sonst die Akte am Desktop (am Handy bleibt Escape ohne Wirkung, wie bisher) |
| Beratungsfelder | Am Desktop aufgeklappt, am Handy zu (Auftrag); beim Bearbeiten wie bisher |
| Kachel-Unterzeilen („· Sebastian“, „· am Zug 0“, „· auf mich 0“) | Nur im Zwei-Spalten-Raster (Handy/Tablet); in der Desktop-Reihe ausgeblendet, damit die Kacheln einzeilig bleiben |

## 3. Bewusst nicht umgesetzt

| Element | Status |
|---|---|
| Schritt 3 Tastatur (Tab-Reihenfolge, `/`, Fokus-Audit) | Nach dem Review; Escape ist als Teil von Schritt 2 drin |
| Finanzen-Screen und -Navigation im Handoff | Auftrag 004 |
| Akte als Vollbild-Screen mit „← Phasen“ am Handy (Handoff `narrow`) | Am Handy bleibt die Akte inline unter der Aufgabe (Auftrag: „wie heute“) |
| Design-Demo-Daten | Nicht übernommen |

## Prüfstand (Claude Code, headless Chrome)

- 380 px: pixelidentisch mit dem Stand vor 006 (Dashboard, geöffnete Akte).
- 768 und 1280 px: kein horizontales Scrollen (scrollWidth = clientWidth), Tabs ohne Overflow.
- 1280 px: Aufgabe öffnen → Panel rechts, Zeile markiert; andere Aufgabe → Panel wechselt; Escape → Panel leer, Hash weg.
- `#task=halteverbot` bei 380 (inline) und 1280 (Panel) → Aufgabe offen, kein Auto-Changelog.
- Keine Konsolenfehler in allen Läufen. Realtime „Live“.
- Offen (Sebastian): Handy-Check; Entscheidung zu Browser-Zurück (Abschnitt 2) und Tab-Nummer (Abschnitt 1).
