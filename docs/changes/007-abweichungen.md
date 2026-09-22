# Änderungsauftrag 007 – Abweichungsliste (Stand nach Commit 1)

Stand: 22.09.2026 · Branch `feature/finanzen` · Quelle: `docs/changes/007-finanzen.md`
Screenshots: `docs/changes/007-screenshots/` – `akte-kosten-380`, `akte-kosten-1280` (drei Zeilen in drei Zuständen), `akte-kosten-offen-380` (Zeile aufgeklappt), `akte-kosten-bezahlt-1280` („Bezahlt am …")

**Kein Schema, keine Migration** – 004 steht, `costs_summary` bleibt unverändert. Commit 2 (Kachel + Kosten-Block) und Commit 3 (laufende Kosten) folgen nach deiner Freigabe.

**Zu den Screenshots:** synthetische Daten, direkt in die Ansicht gerendert – ohne Login, ohne Schreibzugriff auf die Datenbank. Damit lassen sich die drei Zustände nebeneinander zeigen, ohne echte Kostenzeilen anzulegen.

---

## 1. Auslegungen des Auftrags

| Stelle im Auftrag | Gebaut | Grund |
|---|---|---|
| „Abschnitt Kosten … ohne Zeilen hinter ‚Alle Felder anzeigen' als Link ‚Kosten erfassen'" | So gebaut; mit Zeilen steht der Abschnitt immer in der Akte, auch wenn „Alle Felder" zu ist | Wer Kosten hat, soll sie sehen, ohne erst aufzuklappen |
| Position des Abschnitts | Nach **Teilschritte**, vor **Beratung** | Der Auftrag sagt nichts dazu. Kosten gehören zur laufenden Arbeit an der Aufgabe, Beratung ist Nachschlagewerk |
| „Zeile: Bezeichnung · Betrag · Status-Chip · Fälligkeit · Chips für `apartment` und `tax_relevant`" | Übernommen, dazu bei bezahlten Zeilen das Zahldatum und ein Owner-Chip, wer bezahlt hat | `paid_by` ist sonst unsichtbar, obwohl es in den Saldo (Commit 2) eingeht |
| Überschrift „Kosten" mit Summe | Die Summe ist die **gezählte** (Historie raus), identisch mit dem Schild in der Aufgabenzeile | Zwei verschiedene Summen an einer Aufgabe wären ein Fehler-Magnet. Erste Fassung zeigte die Rohsumme (4.190 € statt 2.240 €) – im Test gefunden und korrigiert |
| Reihenfolge der Zeilen | Anlagereihenfolge (`sort`, dann `created_at`) | Sortieren von Hand ist laut Auftrag nicht Teil von 007. Eine frühere Fassung sortierte nach Fälligkeit, dann standen Zeilen ohne Datum vorn – unverständlich |
| „Status-Übergänge als Buttons, immer nur der nächste Schritt" | Ein Button vorwärts, ein Link „zurück auf …" – der Rückweg nennt immer das Ziel | „Zurück" allein sagt nicht, wohin |
| „Zurück" von `bezahlt` | Löscht `paid_on` und `paid_by` mit | Sonst setzt der Trigger aus 004 die Zeile sofort wieder auf `bezahlt` – der Schritt zurück wäre wirkungslos |
| „Beleg-Link (Pflichtfeld nur bei `tax_relevant`)" | Prüfung beim Speichern von „Bezahlt am …"; ohne Beleg Hinweis „Beleg-Link fehlt – die Zeile ist steuerrelevant" | – |
| Betrag eingeben | Freitextfeld mit `inputmode="decimal"`, akzeptiert `1800`, `1800.50`, `1.800,50`, `1.800 €` | `<input type="number">` verweigert in deutscher Eingabe das Komma. Im Test gefunden: `1.800` wurde zu 1,80 € – die Tausenderpunkte werden jetzt erkannt |
| Betragsschild in der Aufgabenzeile | Nur `einmalig`-Zeilen, gezählt wie `costs_summary`; „≈" solange alles nur geschätzt ist | Rückflüsse im selben Schild würden die Zahl unlesbar machen; sie kommen in Commit 2 im Block |

## 2. Entscheidungen zur Zählregel

Die Regel aus der View `costs_summary` steht im Frontend an genau einer Stelle (`app/costs.js`) und wird von Schild, Akte und (ab Commit 2) Block gemeinsam benutzt. **Gegengeprüft:** dieselben sechs Zeilen einmal durch `app/costs.js` und einmal durch die View in einer zurückgerollten Transaktion – beide ergeben `planned_total 150 · paid 50 · refunds_expected 30 · buffer 20 · net 120`.

Angebote, die gegen eine beauftragte Zeile derselben Aufgabe verloren haben, bleiben sichtbar, stehen aber grau und mit durchgestrichenem Betrag da. „Beauftragen" an einem zweiten Angebot bleibt möglich – der Auftrag verlangt das ausdrücklich.

## 3. Design-Lücken (selbst entschieden)

| Zustand | Lösung |
|---|---|
| Zeile ohne Fälligkeit | Kein Datum in der Zeile; der Trigger setzt `due_on` beim Anlegen nur, wenn die Aufgabe eine Frist hat |
| Bezahlte Zeile ohne `due_on` | Zeigt das Zahldatum statt der Frist (vorher fiel beides weg – im Test gefunden) |
| Warnfarbe | Nur bei überfälliger Zahlung (`due_on` vorbei und nicht bezahlt). Kein Grün für „bezahlt", wie im Auftrag verlangt |
| Ohne Netz | Kostenzeilen sind lesbar (sie liegen im Offline-Stand), jeder Schreibversuch meldet „Ohne Netz kannst du nur lesen" – wie alle anderen Schreibwege seit 009 |
| Realtime | `costs` hängt jetzt mit an der Realtime-Verbindung und wird wie die anderen Tabellen feldgenau eingearbeitet (010 Punkt 2), kein Voll-Reload |
| Sehr viele Zeilen an einer Aufgabe | Bleiben alle stehen; eine Begrenzung wäre Sortierung durch die Hintertür (nicht Teil von 007) |
| Beträge über 99.999 € | `numeric(10,2)` trägt bis 99.999.999,99 €; die Spalte bricht nicht, das Schild in der Zeile wird nur breiter |

## 4. Noch offen (Commits 2 und 3)

- Kachel „Kosten", Kosten-Block mit den fünf Zahlen, Zahlungen-Zeile, Cashflow nach Monat, Puffer
- Laufende Kosten (`recurring`) samt Link aus „Kostenmodell klären"
- Changelog-Eintrag und `BRIEFING.md` Abschnitt 5 – kommen mit dem letzten Commit, damit sie den fertigen Stand beschreiben

## 5. Geprüft

- `app/costs.js` gegen das echte Modul im Browser, ausgeloggt und ohne Schreibzugriff: 12 Fälle (Betragsparsen deutsch/englisch, Formatierung, Zählregel mit und ohne feste Zeile, Angebot als Historie, Puffer, Summen, Schild mit und ohne „≈", Rückflüsse nicht im Schild, Überfälligkeit, Schrittgrenzen)
- Zählregel gegen die Datenbank-View in einer zurückgerollten Transaktion – identisch
- Darstellung bei 380 und 1280 px: drei Zeilen in drei Zuständen, Zeile aufgeklappt, „Bezahlt am …"; Tap-Ziele ≥ 44 px, keine Konsolenfehler
- **Nicht geprüft:** Anlegen, Bearbeiten, Statuswechsel und Löschen gegen die echte Datenbank – dafür braucht es eine eingeloggte Sitzung mit Schreibzugriff, die nach der Regel in `CLAUDE.md` vorher angesagt wird
