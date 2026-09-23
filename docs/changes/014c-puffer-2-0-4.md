# 014c – Bugfix 2.0.4: Puffer hat zwei Quellen, die sich überschreiben

Stand: 23.09.2026 · **Status: umgesetzt** · Version 2.0.3 → 2.0.4 · Branch: `fix/014c` von `preview` · Modell: Sonnet · Aufwand: S–M
Gefunden von Sebastian in Finanzen (Desktop, Screenshot 18:25).

## Befund (per Connector geprüft)

1. **Zwei Quellen.** `settings.buffer_pct = 20` **und** eine Kostenzeile `label = 'Puffer'` (einmalig, 2.500 €, geschätzt, `task_id` null, `seed_key` null, angelegt 23.09. 08:34 durch das Finanzen-Setup, id `fb8306ef-…`).
2. **Die View rechnet keinen Satz.** `costs_summary.buffer` = Summe aller einmaligen Posten **ohne Aufgabe** (`task_id is null`). Das ist heute die Puffer-Zeile – aber jeder frei angelegte Posten ohne Aufgabe („Sofa") würde ebenfalls als Puffer gezählt. Der Puffer steckt in `planned_total` und `net`.
3. **Der Satz existiert nur im Button.** „Satz auf Summe anwenden (1.687 €)" = 20 % × (10.935 − 2.500) und schreibt das Ergebnis als `amount` in die Zeile. Sonst wird `buffer_pct` nirgends verrechnet.
4. **Folgen:** Die Rahmendaten zeigen „Puffer 20 % · 2.500 €" – beides zugleich, obwohl 20 % von 8.435 € = 1.687 € sind; die Anzeige ist falsch, sobald Zeile und Satz auseinanderlaufen. „Betrag festlegen" an der Zeile ändert den Betrag, die Anzeige behauptet weiter 20 %. „Puffer in %" ändern bewirkt nichts, bis der Button gedrückt wird; der Button überschreibt einen festgelegten Betrag ohne Hinweis. Und der Puffer ist als Posten bezahlbar, hat „fällig —" und „zahlt gemeinsam" – ein Puffer wird nicht bezahlt.

## Regel (neu)

**Der Puffer ist kein Posten, sondern eine Einstellung.** Eine Quelle, zwei Formen:

- `settings.buffer_pct` (Default 20) – gilt, solange kein fester Betrag gesetzt ist.
- `settings.buffer_fixed` (numeric, Default null) – wenn gesetzt, gilt dieser Betrag; der Satz bleibt gespeichert, wird aber nur als Vergleich gezeigt.
- Puffer = `coalesce(buffer_fixed, round(buffer_pct / 100 × Summe einmaliger Posten))`. Bezahlte Posten bleiben in der Summe (der Puffer ist auf den Plan bezogen, nicht auf den Rest).

## Änderung

1. **Migration `019_b014c_buffer.sql`:**
   - `insert into settings (key, value) values ('buffer_fixed', 'null')` (jsonb null), falls nicht vorhanden.
   - Die Zeile `fb8306ef-35db-4318-944d-5af949e11b5e` löschen – genau diese id, kein Muster auf `label`. *(Übernahme des heutigen Werts: siehe Entscheidung unten.)*
   - View `costs_summary` drop + create (Regel aus 010: kein `create or replace` bei Spaltenänderung): `planned_total` = einmalige Posten ohne Sonderfall; `buffer` aus den Settings nach obiger Formel; `net` = planned_total + buffer + double_rent − refunds; neue Spalte `buffer_mode` (`'pct'` | `'fixed'`), damit die App nicht selbst rechnen muss. Freie Posten ohne Aufgabe sind normale Posten.
2. **Finanzen, Rahmendaten (Lesen):** „Puffer 20 % · 1.687 €" bzw. „Puffer 2.500 € fest · 20 % wären 1.687 €". Formatierung wie überall: `1.687 €`, nicht `2.500,00 €`.
3. **Finanzen, Rahmendaten (ändern):** Puffer als Segment **Satz | Betrag**. Satz → Feld „Puffer in %"; Betrag → Feld „Puffer in €" (schreibt `buffer_fixed`; Wechsel zurück auf Satz setzt `buffer_fixed = null`). Der Button „Satz auf Summe anwenden" entfällt. Speichern wie die übrigen Rahmendaten.
4. **Posten-Tabelle:** keine Puffer-Zeile. Unter der Tabelle eine leise Fußzeile: „+ Puffer 20 % · 1.687 €" (bzw. „fest"), damit die Summe der Kachel „Posten inkl. Puffer" nachvollziehbar bleibt. Kachel, Herleitung (380) und „Monat für Monat" lesen `buffer` aus der View; der Puffer erscheint dort in keinem Monat, sondern nur in der Summe.
5. **Setup (016b/026, Schritt Puffer):** fragt nur den Satz (Default 20), legt keine Kostenzeile mehr an. Bestandsschutz: läuft das Setup erneut, bleibt ein gesetzter `buffer_fixed` erhalten.
6. **Posten anlegen:** ein Posten ohne Aufgabe bleibt ein Posten (Guard aus Punkt 1 der View); kein Sonderfall im Formular nötig.

## Entscheidung Sebastian (vor dem Start)

- [ ] Heutige 2.500 € als **fester Betrag** übernehmen (`buffer_fixed = 2500`), oder
- [ ] auf **Satz** zurück (`buffer_fixed = null` → 1.687 €). *Empfehlung: Satz – 2.500 stammt aus dem Setup-Default, nicht aus einer Schätzung.*

## Tests

- Satz 20 %, kein Festbetrag → Rahmendaten „20 % · 1.687 €", Kachel „Posten inkl. Puffer" = planned_total + 1.687, Tabelle ohne Puffer-Zeile, Fußzeile vorhanden.
- Betrag 3.000 € setzen → „3.000 € fest · 20 % wären 1.687 €", View `buffer_mode = fixed`; zurück auf Satz → wieder 1.687, `buffer_fixed` null.
- Posten „Test ohne Aufgabe" 100 € anlegen → zählt in planned_total, **nicht** in buffer; danach löschen.
- Satz auf 10 % → Puffer 844 €, ohne weiteren Klick.
- Setup erneut durchlaufen → keine neue Puffer-Zeile in `costs`.

## Akzeptanzkriterien

- [x] Migration im Dry-Run (Claude per Connector), dann anwenden; `select * from costs_summary` zeigt `buffer_mode`
- [x] `select count(*) from costs where label = 'Puffer'` = 0
- [x] Grep: kein Aufruf mehr, der eine Kostenzeile „Puffer" anlegt oder liest; kein „Satz auf Summe anwenden"
- [x] Die fünf Tests grün, per Connector nachvollziehbar
- [x] Regression grün, Bericht ≤ 8 Zeilen, Changelog 2.0.4 (release "2.0"): „Der Puffer ist jetzt eine Einstellung: Satz oder fester Betrag – nicht mehr beides."
- [x] Merge preview → main (--no-ff), Tag v2.0.4

## Abweichungen und Nachweis (Umsetzung 23.09.2026)

- Entscheidung (Chat, vor dem Start): Satz übernehmen, nicht der Festbetrag aus dem Setup-Default – `buffer_fixed` bleibt `null`.
- `ownerOf()` in Finanzen zeigte bei einem Posten ohne Aufgabe bisher „Puffer“ (fiel automatisch aus der alten Puffer-Zeile ab) – heißt jetzt „ohne Aufgabe“, seit ein Posten ohne Aufgabe ein normaler Posten ist.
- Die alte Kachel „Posten inkl. Puffer“ blieb wörtlich erhalten: ihr Wert ist jetzt `planned_total + buffer` (vorher lag der Puffer als Zeile schon in `planned_total`). Die Fußzeile unter der Tabelle macht die Differenz zur Tabellensumme nachvollziehbar.
- Dry-Run in zurückgerollter Transaktion (inkl. aller fünf Tests über ein Temp-Table), danach Migration `019_b014c_buffer` angewendet; `schema.sql` nachgezogen (drop + create wie in 010 vorgeschrieben).
- Fünf Tests, per Connector:
  1. Satz 20 %, kein Festbetrag → `buffer 1687.04`, `buffer_mode pct`
  2. Betrag 3000 € gesetzt → `buffer 3000`, `buffer_mode fixed`; zurück auf Satz → wieder `1687.04`, `buffer_fixed` null
  3. Posten „Test ohne Aufgabe“ 100 € → zählt in `planned_total` (8435.21 → 8535.21), nicht zusätzlich im Puffer-Satz selbst (der Satz wächst nur, weil die Basis wächst) – Zeile danach gelöscht
  4. Satz 10 % → `buffer 843.52`, ohne weiteren Klick
  5. `select count(*) from costs where label = 'Puffer'` = 0
- Endzustand `costs_summary` (Live-Stand nach der Migration, unverändert gelassen): `planned_total 8435.21 · paid 86.41 · refunds_expected 4950.00 · buffer 1687.04 · buffer_mode pct · double_rent 1350.00 · net 6522.25`. `settings.buffer_pct = 20`, `settings.buffer_fixed = null`.
- App-Test eingeloggt nicht möglich (Anmeldung mit Passwort) – Rahmendaten, Segment, Fußzeile und Posten-Summe im Browser mit simuliertem State geprüft (nur Rendern, keine Schreibzugriffe), keine Konsolenfehler.
