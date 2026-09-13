# Änderungsauftrag 002 – Dashboard nach Claude-Design-Vorlage

Stand: 13.09.2026 · Status: deployt 13.09.2026 (Merge dfded96, Pages-Lauf 9) · Branch: `feature/dashboard` · Modell: Opus, Effort extra
Betrifft: `app.css` (Tokens), `index.html`, `app/views/*`, `app/main.js`; **nicht** die Datenschicht, **nicht** die Akte

## Quelle

`design/handoff/2026-09-13/` – Export "Project HTML" aus Claude Design, dazu das PDF. Das ist eine **Design-Spezifikation, keine Codebasis**: Stack bleibt Vanilla JS mit ES-Modulen, kein Build-Step, kein Tailwind, kein React. `supabase.js` und `state.js` bleiben unverändert.

## Was gebaut wird – nur der Dashboard-Screen

**1. Tokens.** Farben, Schriftgrößen, Abstände, Radien aus dem Handoff als CSS-Variablen in `app.css` übernehmen; bestehende Variablen ersetzen, nicht ergänzen. Owner-Farben (Sebastian Blau, Anna Pflaume, gemeinsam Grün, Claude Ocker) und Highlighter-Gelb als einzige Signalfarbe für Fristkritisches bleiben semantisch erhalten, auch wenn die Werte aus dem Design kommen.

**2. Kopf.** Countdown zum Einzugstermin ("noch 47 Tage" / "Termin offen"), darunter die fünfteilige Gate-Leiste: ein Segment pro Phase, Füllstand = erledigte/gesamte Aufgaben der Phase, Gate-Punkt gefüllt, wenn alle Aufgaben der Phase erledigt sind.

**3. Kennzahlen als Filter.** Kacheln: Offen Sebastian / Offen Anna / Offen gemeinsam / Bei Claude / Wartet auf jemanden / Blockiert / Fristkritisch / Überfällig. Jede Kachel ist ein Button (`aria-pressed`), Antippen setzt genau einen aktiven Filter, erneutes Antippen hebt ihn auf. Warnfarbe ausschließlich bei Fristkritisch und Überfällig. Der aktive Filter erscheint als schließbarer Chip über der Aufgabenliste und wirkt über alle Phasen-Tabs hinweg.

**4. Phasen-Tabs.** Fünf Tabs, horizontal scrollbar bei 380 px, je Tab: Nummer, Name, Zähler erledigt/gesamt; darunter eine Zeile Gate-Text. Der aktive Tab bleibt beim Filterwechsel erhalten; der zuletzt aktive Tab wird pro Gerät gemerkt.

**5. Standardzustand beim Öffnen.** Filter "Diese Woche" aktiv: Aufgaben der eingeloggten Person (plus gemeinsam), nicht erledigt, nicht blockiert, nach Fälligkeit. Dieser Filter ist eine eigene Kachel oder ein Chip – Entscheidung aus dem Design übernehmen.

**6. Konsolidierung der Sichten.** Die bisherigen Views "Diese Woche", "Im Blick", "Bei Claude" entfallen als Navigation; ihre Funktion ist vollständig durch die Filter abgedeckt. Vor dem Entfernen prüfen und in der Abweichungsliste bestätigen: (a) "Neue Claude-Aufgabe" ist weiterhin erreichbar (z. B. im Filter "Bei Claude" oder in der Phase), (b) "Wartet auf mich" als Teilmenge von "Wartet auf jemanden" ist über den Standardfilter abgedeckt, (c) der gelbe Im-Blick-Block existiert im Design nicht mehr als Kasten, sondern als Kachel "Fristkritisch" – falls das Design ihn doch vorsieht, Design gewinnt.

## Was unverändert bleibt

Akte (leicht/voll), Aufgabe hinzufügen, Abhaken, Teilschritte, Kommentare, Abhängigkeiten, Delegations-Zustände, Login, Statuszeile, Backup-Export. Wenn eine dieser Funktionen durch die Konsolidierung ihren bisherigen Ort verliert, bekommt sie einen neuen – sie fällt nicht weg.

## Abweichungsliste (Pflicht, vor dem Review liefern)

Nach Schritt 6 stoppen und eine Datei `docs/changes/002-abweichungen.md` schreiben mit drei Abschnitten:

1. **Technisch nötige Abweichungen vom Design** – je Zeile: Design-Element, was stattdessen gebaut wurde, Grund (z. B. "Schrift X nicht ohne externen Request ladbar → Systemschrift-Stack"). Keine stillschweigenden Abweichungen.
2. **Design-Lücken** – Zustände, die das Design nicht zeigt und die du selbst entschieden hast: leerer Filter, kein Einzugstermin, alle Aufgaben erledigt, sehr langer Aufgabentitel, Ladezustand, Offline/Fehler beim Speichern. Je Zeile: Zustand, deine Lösung.
3. **Bewusst nicht umgesetzt** – alles aus dem Handoff, das über den Dashboard-Screen hinausgeht (Akte, Finanzen), mit Verweis auf den späteren Auftrag.

Dazu Screenshots bei 380 px: Standardzustand, ein aktiver Filter, Phase 2 geöffnet, ohne Einzugstermin.

## Akzeptanzkriterien

- [ ] Jede Kennzahl-Kachel filtert die Liste; Zahl auf der Kachel = Anzahl der gefilterten Aufgaben
- [ ] Nur Fristkritisch und Überfällig tragen Warnfarbe
- [ ] Fünf Phasen-Tabs bei 380 px bedienbar, Tap-Ziele ≥ 44 px, sichtbarer Fokus
- [ ] Countdown zeigt "Termin offen" ohne Einzugstermin, sonst Tage bis Einzug
- [ ] Alle bisherigen Funktionen erreichbar (Checkliste oben "unverändert")
- [ ] Keine Konsolenfehler, Realtime-Update sichtbar, Login unverändert
- [ ] `docs/changes/002-abweichungen.md` liegt vor, `BRIEFING.md` Abschnitt 5 (Sichten) angepasst

## Handy-Check durch Sebastian

Reihenfolge: Login → Kachel antippen filtert → Chip schließen → Tab wechseln → Aufgabe öffnen, abhaken, kommentieren → Countdown ohne Termin. Was nicht gefällt, geht als Kommentar zurück, nicht als eigene Code-Änderung.
