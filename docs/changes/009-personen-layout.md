# Änderungsauftrag 009 – Konzepterweiterung: Personen-Layout

Stand: 22.09.2026 · Status: umgesetzt, PR offen (vier Commits, Review-Stopp nach Commit 2 erledigt) · Branch: `feature/personen-layout` · Modell: Opus, Effort extra
Abweichungen und Prüfungen: `docs/changes/009-abweichungen.md`. Migrationen: `006_a009_letzter_besuch.sql` (eingespielt), `007_a009_delegation.sql` (vor dem Merge einspielen).
Betrifft: Dashboard, Akte, Delegation, Service Worker, `allowlist`, `app.css`; **nicht** `costs`/`recurring` (007)
Quelle: `design/handoff/2026-09-22-b/` – Variante B "Personen zuerst" aus dem Design Review (011). Es gilt nur diese Variante, auch wenn der Export mehrere enthält. Design-Spezifikation, keine Codebasis: Vanilla JS, Datenschicht bleibt, Tokens aus dem Snapshot (`--ink-3 = #68726b`).

Ein PR, aber in vier Commits mit Stopp nach dem zweiten (Screenshots + Abweichungsliste), damit das Layout freigegeben ist, bevor die Akte umgebaut wird.

## 1. Layout "Personen zuerst"

- **Handy (≤ 599 px):** Zwei Bereiche untereinander, die eingeloggte Person zuerst: "Ich" (eigene + gemeinsame Aufgaben, nicht blockiert, nach Fälligkeit), dann "Wartet auf mich", dann "Bei {anderer Name}" als eingeklappter Block mit Zähler. Kennzahlen über den Bereichen reduziert auf: Fristkritisch, Überfällig, Blockiert, Bei Claude – vier Kacheln, eine Reihe. Phasen als Filter-Chips über der Liste, nicht als Tabs.
- **Desktop (≥ 900 px):** Drei Spalten: Ich | Gemeinsam | Anna/Sebastian (der andere). Panel rechts wie bisher, schiebt die dritte Spalte zusammen. Phasen-Chips über allen Spalten, wirken auf alle.
- **Kopf:** Countdown bleibt; Gate-Leiste bleibt, kompakter. Die Phasen sind damit weiterhin sichtbar, nur nicht mehr das Ordnungsprinzip.
- **Abhängigkeiten:** Blockierte Aufgaben erscheinen in der Spalte der Person mit dem Grund; der Grund ist ein Link zur blockierenden Aufgabe (öffnet sie im Panel bzw. inline). Das ist die Stelle, an der Personen-Layouts den Abhängigkeitsgraphen verlieren – hier nicht.
- Alle Kennzahlen bleiben Filter (`aria-pressed`), Warnfarbe nur bei Fristkritisch/Überfällig.

## 2. "Seit deinem letzten Besuch"

- `allowlist.last_visit_at timestamptz null`. Gesetzt beim Verlassen der App (`visibilitychange` → hidden, `pagehide`) und beim Login. RLS: nur eigene Zeile schreibbar (Policy existiert für `last_seen_version`, erweitern).
- Beim Öffnen: Block im Kopf, unter dem Countdown: "Seit deinem letzten Besuch: 3 Kommentare von Anna · 1 von Claude · 2 Aufgaben erledigt · 1 wartet auf dich". Jeder Teil ist antippbar und setzt einen Filter. Block verschwindet, wenn nichts neu ist.
- An der Aufgabenzeile: Punkt in der Autorenfarbe (pflaume Anna, blau Sebastian, ocker Claude), wenn sie seit `last_visit_at` einen neuen Kommentar hat. Öffnen der Aufgabe entfernt den Punkt (pro Aufgabe gemerkt, damit nicht alle Punkte gleichzeitig verschwinden – Umsetzung: `allowlist.seen_comments jsonb` mit Kommentar-IDs, oder ein `comment_reads(person, comment_id)`; Claude Code entscheidet, dokumentiert in der Abweichungsliste).
- "Aufgaben erledigt": `tasks.done` und `updated_at > last_visit_at`, nicht von der eigenen Person.
- Keine Push-Benachrichtigung. Vormerkung: erst, wenn der Block nachweislich nicht reicht.

## 3. Akte in zwei Gewichtsklassen

- **Leicht** (Standard): Titel, Owner-Chip, Frist, Teilschritte, Kommentare, Kommentarfeld. Abschnitte "Hängt ab von", Beratung, Delegation, Felder Typ/Wartet/Offset sind hinter einem Link "Mehr" (aufklappen), der Zustand wird pro Aufgabe gemerkt.
- **Voll** automatisch, wenn: `type = claude`, oder mindestens ein Beratungsfeld gefüllt, oder Abhängigkeiten vorhanden, oder Kostenzeilen vorhanden (ab 007). Dann sind die Abschnitte aufgeklappt.
- Beratungsfelder: nur gefüllte anzeigen; leere hinter "Beratung ergänzen" (ein Link, nicht fünf leere Kästen).

## 4. Delegation auf drei Zustände

`status`: `briefing` → `claude` → `ergebnis`. Migration wandelt bestehende Werte: `go`, `recherche`, `rueckfragen`, `arbeit` → `claude`. Buttons: "An Claude geben" (setzt `claude`, schreibt Kommentar "An Claude übergeben"), "Ergebnis übernommen" (setzt `ergebnis` + `done`). Rückfragen und Antworten sind Kommentare; Claude liest sie über den Connector. Ansicht "Bei Claude" gruppiert nach den drei Zuständen. `BRIEFING.md` Abschnitt 4 ersetzen.

## 5. Umzugstag-Modus

- Service Worker cacht zusätzlich den letzten geladenen Datenstand (JSON im Cache, nach jedem erfolgreichen Laden). Ohne Verbindung: App zeigt diesen Stand **nur lesend**, Statuszeile "Offline – Stand von 09:41", Häkchen deaktiviert mit Hinweis. Kein Offline-Schreiben, kein Sync – bewusst.
- Phase 4 als Druckansicht: Menüpunkt "Umzugstag drucken" (Fußzeile) öffnet eine druckoptimierte Seite: alle Phase-4-Aufgaben mit Teilschritten als Kästchen, Felder für Zählerstände (Strom, Gas, Wasser je Wohnung), Schlüsselliste, Notfallkontakte aus einem `settings`-Eintrag `umzugstag_kontakte` (Text). `@media print`, kein separates PDF-Tool.

## Abweichungsliste

`docs/changes/009-abweichungen.md` wie gehabt: technische Abweichungen vom Design; Design-Lücken (insbesondere: drei Spalten bei 900–1100 px mit offenem Panel; sehr viele "Neu"-Punkte; Person, die noch nie eingeloggt war → `last_visit_at` null); bewusst nicht Umgesetztes. Screenshots 380/1280 nach Commit 2: Ich-Ansicht, "Seit deinem letzten Besuch" mit Inhalt, Akte leicht, Akte voll.

## Akzeptanzkriterien

- [ ] Handy: eigene Aufgaben zuerst, "Wartet auf mich" sichtbar, "Bei Anna" einklappbar; Desktop: drei Spalten + Panel
- [ ] Blockierte Aufgaben zeigen Grund als Link zur blockierenden Aufgabe
- [ ] "Seit deinem letzten Besuch" erscheint nur mit Inhalt, jeder Teil filtert; Punkte an Aufgaben verschwinden beim Öffnen; zweites Gerät derselben Person zeigt denselben Stand
- [ ] Kleine Aufgabe zeigt die leichte Akte; Claude-Aufgabe die volle; Zustand "Mehr" pro Aufgabe gemerkt
- [ ] Delegation: nur drei Zustände sichtbar, Migration hat bestehende Werte umgesetzt
- [ ] Flugmodus nach dem Laden: App zeigt letzten Stand lesend mit Offline-Hinweis; wieder online → Live ohne Reload
- [ ] "Umzugstag drucken" ergibt bei A4 eine lesbare Liste mit Kästchen und Feldern
- [ ] Kennzahl = Filter, Warnfarben-Disziplin, 44 px, 4,5:1, sichtbarer Fokus, keine Dialoge
- [ ] Changelog-Einträge in Alltagssprache: "Du siehst jetzt zuerst, was bei dir liegt – und was Anna oder Claude seit deinem letzten Besuch geschrieben haben." / "Am Umzugstag funktioniert die Liste auch ohne Netz, und du kannst sie ausdrucken."
- [ ] `BRIEFING.md` Abschnitte 4 und 5 ersetzt
