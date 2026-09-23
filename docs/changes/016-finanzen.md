# 016 – Upgrade Finanzen: drei Fragen statt fünf Zahlen

Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: M
Quelle: Review v2 Teil C, Befunde F1–F5 und Mockup 2c (380 + 1280). Setzt 020 voraus.

## Ziel

Die Finanzansicht beantwortet: **Was kostet uns der Umzug? Was ist als Nächstes zu zahlen? Wer schuldet wem?** Keine Diagramme, keine neuen Geldfarben. Gelb bleibt Frist, Rot bleibt überfällig.

## Änderungen

1. **Antwortzahl (F1):** Kopf "Der Umzug kostet euch **7.380 €** netto". Darunter Herleitung als antippbare Zeilen: Posten inkl. Puffer › Doppelmiete berechnet › Rückflüsse › davon bezahlt (%). Jede Zeile filtert die Postenliste (Kennzahl = Filter). Die fünf Kacheln aus 007 entfallen; Desktop zeigt die Herleitung als vier Kacheln rechts neben der Zahl.
2. **Doppelmiete im Netto (F2):** `costs_summary` bekommt Spalte `double_rent` (aus `recurring` × Monate zwischen Auszug alt und Einzug, je Wohnung) und `net` rechnet sie ein. Summen nie im Frontend – Regel aus 007 bleibt.
3. **Ausgleich (F3):** Karte "Du schuldest Anna 510 €" mit Rechenweg (Anna hat X ausgelegt, du Y, Aufteilung `split_default_s`). Text-Button "Wie gerechnet?" klappt die Zeilen auf. Primär-Button **"Überweisung erfassen"** legt eine Kostenzeile `kind = 'ausgleich'` an (Betrag, `paid_by`, `paid_on` = heute, `status = bezahlt`), die den Saldo ausgleicht und in keiner Summe außer dem Saldo zählt. Migration: Check-Constraint auf `kind` um `ausgleich` erweitern, `costs_summary` ignoriert `ausgleich` in `planned_total`/`paid`.
4. **Als Nächstes zahlen (F5):** Liste nach `due_on`, nächste drei offen, mit Datum groß links, Stand-Chip, Zuständigkeit, Betrag rechts und je Zeile höchstens ein Sekundär-Button für den nächsten Schritt: geschätzt → "Angebot eintragen", angebot → "Beauftragen", beauftragt → "Fällig setzen", faellig → "Bezahlt". Überfällig oben in Rot, sonst "nichts überfällig".
5. **Monat für Monat:** Tabelle Monat / Posten / davon bezahlt / Doppelmiete / gesamt, aus der View (Cashflow aus 007 umgebaut, nicht neu). Ein Satz darunter benennt den teuersten Monat.
6. **Laufend als Leseansicht (F4):** "1.785 € im Monat für die neue Wohnung · 50 € weniger als eure beiden Wohnungen heute" plus Tabelle Posten / du / Anna / neu / Δ. Felder erst hinter Sekundär-Button "Bearbeiten" (Modus wie 017: Fertig/Abbrechen).
7. **Alle Posten:** Pillen alle / offen / bezahlt / Rückfluss mit Zählern, sortiert nach Fälligkeit; mobil zuerst "n offene Posten zeigen" als Text-Zeile.
8. **Rahmendaten** (Einzug, Umzugstag, Auszüge, Aufteilung, Puffer) als Leseblock am Fuß mit Text-Button "ändern" – nicht mehr als offenes Formular.

## Daten

Migration `NNN_a016_finanzen.sql`: Kind `ausgleich`, View `costs_summary` + `double_rent`, `net` neu, Ausschluss von `ausgleich` aus Summen. Additiv – die 1.1-App auf `main` läuft unverändert weiter.

## Akzeptanzkriterien

- [ ] Mit Teil-B-Daten: Antwortzahl = planned_total + double_rent − refunds_expected, Herleitungszeilen addieren sich auf die Zahl
- [ ] "Überweisung erfassen" 300 € → Saldo sinkt um 300 €, keine andere Summe ändert sich
- [ ] Als-Nächstes-Zeile geschätzt → "Angebot eintragen" öffnet Betragsfeld, Stand wird angebot
- [ ] Laufend: ohne Tippen keine Eingabefelder sichtbar; "Bearbeiten" → Felder, "Abbrechen" verwirft
- [ ] 380 px: ein Primär-Button in der Ansicht (Überweisung erfassen), alle Buttons nach 020
- [ ] Zwei Breiten, Bericht ≤ 15 Zeilen, Changelog: "Finanzen beantwortet drei Fragen: was kostet es, was ist als Nächstes zu zahlen, wer schuldet wem."
