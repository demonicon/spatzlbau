# 014d – Bugfix-Bündel 2.1

**Status: umgesetzt** (Abweichungen: `014d-abweichungen.md`)

Stand: 24.09.2026 · Release 2.1 · Branch: `fix/014d` von `preview` (nach 029b) · Modell: Sonnet · Aufwand: S
Vier Fehler aus dem Desktop-Check 24.09. Kein neues Verhalten.

## Punkte

1. **Laufend ab Januar rechnet mit null als 0.** `recurring.internet.amount_n` ist null, die Tabelle zeigt „0 €" und die Δ-Spalte „−67 €"; „332 € weniger als heute" ist um 67 € zu hoch (die Summe 1.935 € lässt null korrekt weg, die Differenz nicht). Soll: null → „–" in Spalte „neu", Δ leer, Satz unter der Summe: „1 Wert fehlt ›" (Link auf Bearbeiten). Gesamt-Δ nur aus vollständigen Zeilen: „265 € weniger (Internet offen)".
2. **Monat für Monat endet falsch.** Zeigt Feb 2027 leer, aber nicht Apr 2027 mit −4.950 € Rückfluss. Soll: Zeitraum vom laufenden Monat bis zum Monat des letzten Postens mit Datum, Rückflüsse eingeschlossen. Rückfluss als negative Zahl in Spalte „Posten" und „gesamt". Leere Monate innerhalb bleiben mit „–", nach dem letzten Posten keine Zeile.
3. **Spalten 3–5 ohne Zeitgruppen.** Spalten 1 und 2 gruppieren („Diese Woche", „Bis Gate 1"), Spalte 3 ist eine flache Liste. Eine Gruppierung für alle fünf: „Diese Woche" → danach Monatsgruppen („Oktober", „November"). „Bis Gate n" nur, wenn Gate n das Ende der eigenen Phase ist – in Spalte 2 steht dann „Oktober" statt „Bis Gate 1".
4. **Puffer-Fußzeile (014c) sicherstellen.** Unter der Postentabelle: „+ Puffer 20 % · 1.687 €" bzw. „+ Puffer 2.500 € fest". Bei 0 %: „Kein Puffer eingeplant ›" (Link Rahmendaten ändern). Falls die Zeile fehlt oder unter der Tabelle abgeschnitten ist: beheben.

## Tests

- Internet neu leer → „–", Δ leer, Hinweis „1 Wert fehlt ›", Gesamtsatz mit „(Internet offen)"; Wert 45 € eintragen → Δ −22 €, Hinweis weg.
- Monat für Monat endet Apr 2027 mit −4.950; Feb/Mär 2027 als „–"-Zeilen dazwischen.
- Spalte 3 mit Umzugstag 28.12.: Gruppen „Oktober" (23.10., 30.10.), „November" (06.11., 20.11. ×3).
- Puffer 0 % → Fußzeile „Kein Puffer eingeplant ›"; 20 % → „+ Puffer 20 % · 1.687 €".

## Akzeptanzkriterien

- [x] Vier Tests grün, per Connector nachvollziehbar (recurring.internet, costs_summary)
- [x] Keine Frontend-Summe neu eingeführt – Δ und Summe lesen aus derselben Quelle wie bisher
- [x] Regression grün, Bericht ≤ 8 Zeilen; Changelog-Zeile (in 2.1.0): „Laufende Kosten, Monatsübersicht und Spalten-Gruppen stimmen."
