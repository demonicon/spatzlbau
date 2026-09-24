# 014d – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `fix/014d` → `preview` · Aufwand S · Tests: `scen014d` (11/11 grün, 380 px),
Live-Datenbank nur lesend geprüft (Connector).

| # | Punkt | Umsetzung | Nachweis |
|---|---|---|---|
| 1 | Laufend, null als „–" | `hasN()`/`rowDelta`/`recurringTotals` in `costs.js`: eine fehlende `amount_n` liefert `null` statt `0`, zählt nicht in Δ, taucht als `missing` auf | Live-DB: `recurring` hat genau eine Zeile mit `amount_n is null` (Label „Internet", `amount_s` 32, `amount_a` 35) – die Zeile aus dem Auftrag ist echt |
| 2 | Monat für Monat, Zeitraum | `cashflowMonths()` reicht jetzt bis zum spätesten gezählten Posten (jede Art, Rückfluss inklusive), nicht mehr nur bis Auszug + 1 Monat | Live-DB: `costs` hat zwei Rückfluss-Zeilen „Kaution zurück – Sebastian/Anna", `due_on` 01.04.2027, zusammen 4.950 € – genau der Fall aus dem Auftrag |
| 3 | Spalten 3–5 Zeitgruppen | `timeGroups()` bekommt optional die eigene Phase; „Bis Gate n" nur, wenn `n` zur Spalte gehört, sonst Monatsgruppen statt einer gefalteten „Später"-Zeile | `scen014d` #3: alle fünf Phasenspalten zeigen jetzt Gruppen, keine zeigt „Bis Gate" für eine fremde Phase |
| 4 | Puffer-Fußzeile | `bufferFootHTML()`: 0 % → „Kein Puffer eingeplant ›" (Link Rahmendaten); Zeile war strukturell schon vorhanden und nicht abgeschnitten – kein CSS-Fund, nur der 0-%-Fall fehlte | `scen014d` #4 |

## Entscheidung im Zweifel

- **Δ-Zahlen im Auftragstext** („−67 €", „332 € zu hoch", „265 € weniger") sind Beispielwerte aus
  dem Desktop-Check, nicht exakt nachrechenbar ohne die genauen Live-Beträge aller Zeilen –
  getestet wurde die **Formel** (Δ nur aus vollständigen Zeilen), nicht die konkreten Zahlen.

## Regression

016–026 unverändert gegenüber dem Stand nach 029b (222 von 223 minus die bekannten, datumsabhängigen
Abweichungen aus früheren Sitzungen – keine neue Abweichung durch 014d).
