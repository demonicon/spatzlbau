# Änderungsauftrag 006 – Abweichungsliste

Stand: 22.09.2026 · Branch `feature/desktop` · Quelle: `design/handoff/2026-09-22-desktop/Umzug App.dc.html` + PDF
Screenshots (Vollseite): `docs/changes/006-screenshots/` – `380-dashboard`, `380-akte`, `768-dashboard`, `768-akte`, `1280-dashboard` (leeres Panel), `1280-akte`

**Erstes Akzeptanzkriterium, vor jedem Commit geprüft:** 380 px ist pixelidentisch mit dem Stand vor 006 (Dashboard und geöffnete Akte, headless Chrome, Pixelvergleich) – bis auf die Fußzeile: die neue Versionsnummer `2026.09.22.3` (Changelog laut Auftrag) und der entfernte Seed-Button (Review-Änderung 2), wodurch die Fußzeile einzeilig wird. Alles oberhalb der Fußzeile: identisch.

## 1. Technisch nötige Abweichungen vom Design

| Design-Element | Gebaut | Grund |
|---|---|---|
| Acht Kacheln in einer Reihe (Offen, 3 Owner, In Arbeit, Blockiert, Fristkritisch, Überfällig) | Zehn Kacheln in **zwei Reihen à fünf** ab 900 px: Offen, 3 Owner, Diese Woche / Bei Claude, Wartet, Blockiert, Fristkritisch, Überfällig | Das Design hat noch die 002-Vorstufe („In Arbeit“, kein „Diese Woche“). Entscheidung nach Review: die Listenspalte ist immer ~800 px breit (Panel steht dauerhaft), zehn Kacheln wären 76 px schmal – „Wartet auf jemanden“ bräche um, „Fristkritisch“ stieße an; zwei Reihen bleiben lesbar |
| Handoff: Kachelzeile „Offen + Owner-Chips“ bleibt unter 1180 px mit Panel (`cramped`) | Ab 900 px immer uniforme Kacheln (Owner-Kacheln in Owner-Farbe, Zahl über Label) | Ein Layout-Wechsel pro Breite genügt; die Owner-Chips-Zeile ist am Desktop nicht besser lesbar als Kacheln |
| Handoff: ohne gewählte Aufgabe eine Spalte (`boardCols` = 1fr), Tabs + Gate-Text nebeneinander | Zwei Spalten ab 900 px immer; leeres Panel zeigt still „Aufgabe wählen“ (`--ink-3`, mittig, ohne Rahmen/Icon); Gate-Text steht unter den Tabs | Review-Entscheidung: das Layout springt beim ersten Klick nicht |
| Tabs mit Panel < 1180 px: horizontal scrollbar (`tabsOverflow: auto`) | Nie scrollbar ab 600 px: fünf gleich breite Tabs, Nummer + Name in einer Zeile (Name darf umbrechen), Zähler darunter; Gate-Text unter den Tabs | Auftrag: „ohne horizontales Scrollen“ – gilt auch neben dem Panel |
| Tab-Beschriftung nur Name + Zähler | Zusätzlich die Phasennummer (wie seit 002) | Konsistent mit der Gate-Leiste; im Review zu 006 bestätigt |
| Akte im Panel als eigener Screen mit Titel-`h1`, Meta-Zeile, „Hängt ab von“ als Liste mit Kästchen, keine Editierfelder | Panel-Kopf (Phase, ×) plus die bestehende Akte unverändert (Titel als Feld, Owner/Typ/Wartet/Offset/fristkritisch editierbar, Abhängigkeiten als Chips) | 006: „nicht Verhalten“, Akte-Umbau kommt mit der UX-Runde „leichte Akte“; am Desktop dieselbe Akte wie am Handy |
| Untere Navigation (Phasen · Finanzen · Person) | Weiterhin keine; Fußzeile mit Version, Neu laden, Abmelden (Seed-Button entfernt – Seed läuft nur über `scripts/seed.mjs`) | Finanzen kommt mit 007 (004 ist nur das Kosten-Schema) |
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
| Leeres Panel (keine Aufgabe gewählt) am Desktop | Platzhalter „Aufgabe wählen“ in `--ink-3`, mittig, kein Rahmen, kein Icon; das Panel bleibt an Ort und Stelle |
| Sehr lange Kommentare / lange Beratungstexte im Panel | Panel scrollt intern (max. 100 vh, sticky), Liste scrollt unabhängig; Texte brechen um, nichts läuft über |
| Aufgabe im Panel wird gelöscht | Panel schließt, URL ohne `#task` |
| Filter oder Phase wechseln, während das Panel offen ist | Panel bleibt offen (Auftrag: „offen bleibt, während man in der Liste weiterklickt“); am Handy schließt die inline-Akte wie bisher |
| Fenster über 900 px ziehen oder darunter | Dieselbe Aufgabe wandert zwischen Panel und inline-Akte (`matchMedia`-Wechsel rendert neu); nichts geht verloren, weil Formularfelder beim Verlassen speichern |
| `#task=<id>` mit unbekannter id | Nichts passiert (Dashboard normal), Hash bleibt stehen |
| `#task=<id>` und aktiver Filter würde die Aufgabe ausblenden | Filter wird aufgehoben, Phase gewechselt, Aufgabe geöffnet (Handy: inline und angescrollt; Desktop: Panel) |
| Browser-Zurück nach dem Öffnen | Der Hash wird per `replaceState` gesetzt, kein History-Eintrag – Zurück verlässt die Seite, wie vorher (bestätigt im Review) |
| Escape | Schließt erst ein offenes „Was ist neu?“-Panel, sonst die Akte am Desktop (am Handy bleibt Escape ohne Wirkung, wie bisher) |
| Beratungsfelder | Am Desktop aufgeklappt, am Handy zu (Auftrag); beim Bearbeiten wie bisher |
| Kachel-Unterzeilen („· Sebastian“, „· am Zug 0“, „· auf mich 0“) | Nur im Zwei-Spalten-Raster (Handy/Tablet); in der Desktop-Reihe ausgeblendet, damit die Kacheln einzeilig bleiben |

## 3. Bewusst nicht umgesetzt

| Element | Status |
|---|---|
| `/` fokussiert die Suche | Es gibt keine Suche – nichts zu fokussieren; kommt, wenn eine Suche kommt |
| Pfeiltasten in der Tab-Leiste (ARIA-Tabs-Muster) | Nicht gebaut; die Tabs sind normale Buttons in Tab-Reihenfolge |
| Finanzen-Screen und -Navigation im Handoff | Auftrag 007 (004 ist ausschließlich das Kosten-Schema) |
| Akte als Vollbild-Screen mit „← Phasen“ am Handy (Handoff `narrow`) | Am Handy bleibt die Akte inline unter der Aufgabe (Auftrag: „wie heute“) |
| Design-Demo-Daten | Nicht übernommen |

## Prüfstand (Claude Code, headless Chrome)

- 380 px: pixelidentisch mit dem Stand vor 006 (Dashboard, geöffnete Akte).
- 768 und 1280 px: kein horizontales Scrollen (scrollWidth = clientWidth), Tabs ohne Overflow.
- 1280 px: leeres Panel „Aufgabe wählen“, Spalten 838 / 440 px; Aufgabe öffnen → Akte im Panel, Zeile markiert; andere Aufgabe → Panel wechselt; Escape → Platzhalter, Hash weg.
- Tastatur (1280): Tab-Reihenfolge Termin → Gate-Leiste → Kennzahlen → Phasen → Filter-Chip → Liste → Neue Aufgabe → Fußzeile; Enter auf einem Titel öffnet das Panel, Fokus bleibt mit sichtbarem Ring auf dem Titel; 12 Tabs später ist das Panel-× erreicht; Leertaste auf „fristkritisch“ im Panel schaltet um, Fokus bleibt nach dem Neu-Rendern im Feld; Escape aus dem Panel → Fokus zurück auf den Titel.
- `#task=halteverbot` bei 380 (inline) und 1280 (Panel) → Aufgabe offen, kein Auto-Changelog.
- Keine Konsolenfehler in allen Läufen. Realtime „Live“.
- Review 22.09.: Abweichungsliste freigegeben; bestätigt: Filter aufheben bei `#task`-Link, Escape-Hierarchie (Changelog vor Akte), Browser-Zurück ohne History-Eintrag, Phasennummer im Tab.

## Schritt 3 – Tastatur (nach dem Review)

- Tab-Reihenfolge Kopf (Termin, Gate-Leiste) → Kennzahlen → Phasen → Filter-Chip → Liste → Panel → Fußzeile: ergibt sich aus der DOM-Reihenfolge, keine `tabindex`-Tricks.
- Fokus überlebt das Neu-Rendern: vor jedem Render wird das fokussierte Element (Zeile/Panel + Attribute) gemerkt und danach wieder fokussiert. Vorher sprang der Fokus nach jedem Enter/Abhaken auf `body`.
- Escape schließt das Panel und gibt den Fokus an den Aufgabentitel in der Liste zurück; ein noch offenes Feld im Panel wird vorher verlassen (blur → speichern).
- Sichtbarer Fokus: globaler Ring (`:focus-visible`), in der scrollenden Tab-Leiste und im scrollenden Panel nach innen versetzt, damit ihn kein `overflow` abschneidet.
- `/`: keine Suche vorhanden (Abschnitt 3).
