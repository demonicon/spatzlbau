# 014e – Bugfix-Nachlauf 2.1: Gruppen, Gate-Datum, Blockiert, Timeline-Panel

**Status: umgesetzt** (Abweichungen: `014e-abweichungen.md`)

Stand: 24.09.2026 · Release 2.1 · Branch: `fix/014e` von `preview` (nach 029c) · Modell: Sonnet · Aufwand: S
Aus dem preview-Check 24.09. Verhalten, das über Ansichten hinweg auseinanderläuft.

## Punkte

1. **Zuständigkeit in der Personen-Ansicht ist redundant.** In Sebastians Spalte steht unter jeder Zeile „Sebastian", in Annas „Anna", in Gemeinsam „gemeinsam". Soll: in der Personen-Ansicht keine Zuständigkeit in der Meta-Zeile; in Phasen und Timeline bleibt sie (dort ist sie die Information).
2. **Eine Gruppierung für alle Spalten und beide Ansichten.** Heute: Gemeinsam-Spalte mit „Diese Woche · Bis Gate 1 · Später ab 22.10.", Sebastian/Anna flach; Phasen-Spalten nach 014d mit Monaten. Soll: **eine** Funktion `groupByTime()` für Personen- und Phasen-Spalten: „Diese Woche" → „Bis Gate n" nur, wenn das Gate der eigenen Phase innerhalb der nächsten 14 Tage liegt → danach Monatsnamen („Oktober", „November"). Kein „Später".
3. **Gate-Datum widerspricht sich:** Spaltenlabel „Bis Gate 1 · bis Mi 07.10.", Timeline „08.10. ◆ Gate Phase 1". Eine Quelle (`settings.phases`/Gate-Datum), ein Format; das Label sagt „bis Do 08.10.".
4. **Blockierte Aufgaben in Spalten** zeigen noch die volle Zeile „wartet auf: Neuen Mietvertrag unterschreiben". Soll wie Timeline/020: gestrichelte Checkbox, in der Meta-Zeile „wartet auf 1 ›", Tipp/Hover nennt die Titel. Der Aufklapper „▸ 2 warten auf einen Vorgänger" bleibt.
5. **Timeline am Desktop ohne Auswahl:** die rechte Hälfte zeigt nur „Nichts hängt gerade zwischen euch." Soll: ohne Auswahl wird die **erste Zeile nach Heute** vorausgewählt und im Panel gezeigt; Klick auf eine andere Zeile wechselt. Hat die Timeline keine offene Aufgabe, bleibt der Text. Gilt nur ≥ 900 px.
6. **Spalten-Container bei ~1.220 px** (Rest aus 030): bei geschlossenem Panel darf der Container auf `.wrap`-Breite wachsen; mit Panel bleibt der Rest. 1920 px ohne Panel: fünf Spalten ohne Scrollen.

## Tests

- Personen-Ansicht: keine Zeile in Sebastians Spalte enthält „Sebastian" in der Meta; Phasen-Ansicht: enthält.
- Sebastian-, Anna- und Gemeinsam-Spalte zeigen dieselbe Gruppenfolge; Spaltenlabel und Timeline-Gate zeigen 08.10.
- Anna-Spalte, „Wohnung Anna kündigen": gestrichelte Checkbox, „wartet auf 1 ›", Hover „Neuen Mietvertrag unterschreiben".
- Timeline 1280 px öffnen → Panel zeigt „Neuen Mietvertrag prüfen" (28.09.) ohne Klick.
- 1920 px, Phasen, Panel zu → kein horizontales Scrollen.

## Akzeptanzkriterien

- [x] Fünf Tests grün; Grep: eine Gruppierungsfunktion, keine zweite Gate-Datumsquelle
- [x] 380 px: Punkte 1–4 wirken, 5–6 nicht
- [x] Regression grün, Bericht ≤ 8 Zeilen; Changelog: Zeile im Eintrag 2.1.0 ergänzen: „Spalten und Timeline sprechen dieselbe Sprache."
