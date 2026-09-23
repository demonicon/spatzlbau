# 018 – Dashboard: eine Person zur Zeit, nach Zeit geordnet

Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Opus · Aufwand: L
Quelle: Review v2 Teil C, Befunde B1–B5, B7, Mockups 2a (380 interaktiv, 1280 Panel ohne Auswahl) und Funktionsidee 4t. Setzt 020, 017, 019 voraus. **Design-Entscheidung von Anna am 27.09. auf `/preview/` – bis dahin nicht nach `main`.**

## Ziel

Am Handy zeigt das Dashboard eine Person zur Zeit; innerhalb der Spalte sind Aufgaben nach Zeit gruppiert. Signale oben sind Filter über alle Personen. Jede Zeile trägt höchstens ein Signal (020).

## Änderungen

1. **Umschalter (B1):** Segment **Du · Gemeinsam · Anna** mit Zählern ("11 offen", "27 · 1 überfällig", "10 · 2 warten"). Eine Spalte zur Zeit am Handy; Desktop ≥ 900 px zeigt drei Spalten nebeneinander wie heute. Zuletzt gewählte Person pro Gerät merken.
2. **Zeitgruppen (B2):** "Diese Woche" (bis Sonntag), "Bis Gate n" (bis zum nächsten Gate-Datum = spätester Termin der laufenden Phase), "Später" eingeklappt mit "n Aufgaben ab dd.mm. zeigen" als Text-Zeile. Gruppenkopf klein, mit Datum. Gleiche Logik wie die Timeline-Gruppen (019) – eine Funktion, zwei Verwender.
3. **Signale (B3):** Kacheln "2 warten auf dich", "3 neue Kommentare", "1 du wartest" filtern über alle Personen und zeigen das Zitat mit **Antworten**-Sekundär-Button (öffnet die Akte mit Fokus im Kommentarfeld). Kennzahl = Filter bleibt.
4. **Zeile (B4, B5):** nach 020 – ein Signal-Chip, Frist rechts, leise Textzeile; blockiert gestrichelt mit "wartet auf:".
5. **Desktop-Panel ohne Auswahl (B7):** statt "Aufgabe wählen" der Block **Zwischen euch**: "n wartet auf dich" mit Zitat + Antworten, "n neue Kommentare" mit Zitat + Ansehen, "n du wartest auf Anna" mit Zitat + Erinnern (schreibt Kommentar "Erinnerung: …").
6. **Seit du zuletzt da warst (4t):** Über der Liste eine aufklappbare Zeile "Seit Fr 19.09.: 2 Fristen verschoben · 3 Kommentare · 1 erledigt". Verschobene Fristen zuerst ("Halteverbot: 11.12. → 04.12., Sebastian"). Leer = unsichtbar. Ersetzt den Besuchsblock aus 009, gleiche Datenquelle plus Änderungsprotokoll.
7. **Kopf:** Einzug + Umzugstag (1.1), Countdown, Pillen Aufgaben / Finanzen, Avatar. Phasenstreifen kommt mit 021, hier Platz lassen.

## Daten

Migration `NNN_a018_task_changes.sql`: Tabelle `task_changes` (id, task_id, field, old_value, new_value, changed_by, changed_at), Trigger auf `tasks` für `offset_days`, `anchor`, `owner`, `title`; RLS wie tasks; Realtime an. Additiv, 1.1 auf `main` unberührt. "Zuletzt da" = `allowlist.last_visit_at` (pro Person, bewusst nicht pro Gerät).

## Akzeptanzkriterien

- [ ] 380 px: Umschalter zeigt eine Spalte, Wechsel ohne Reload, Zähler stimmen mit Spalteninhalt überein
- [ ] Zeitgruppen: Aufgabe mit Frist Sonntag steht in "Diese Woche", Montag in "Bis Gate", nach dem Gate in "Später" (eingeklappt)
- [ ] Kachel "warten auf dich" filtert über beide Personen, zeigt Zitat, Antworten öffnet Akte mit Fokus
- [ ] Frist einer Aufgabe in Bearbeiten (017) ändern → Zeile in `task_changes`, "Seit du zuletzt da warst" beim anderen Gerät nennt sie zuerst
- [ ] Desktop 1280 ohne Auswahl: Panel zeigt "Zwischen euch", mit Auswahl die Akte
- [ ] Erinnern schreibt einen Kommentar mit Autor und Präfix "Erinnerung:"
- [ ] Volle Prüfung (L, drei Breiten), Bericht ≤ 20 Zeilen, Changelog: "Das Dashboard zeigt am Handy eine Person zur Zeit, sortiert nach Zeit, und sagt, was sich seit deinem letzten Besuch geändert hat."
