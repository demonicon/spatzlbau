# Änderungsauftrag 007 – Finanzmodul (Oberfläche)

Stand: 22.09.2026 (Review-Fassung) · Status: offen · Branch: `feature/finanzen` · Modell: Opus, Effort standard
Betrifft: Akte (Abschnitt Kosten), Kachelreihe, neuer Kosten-Block, `recurring`-Tabelle; **kein** Schema (004 steht), **keine** neue Migration außer ggf. View-Anpassung
Reihenfolge: nach 010. Drei Commits mit Stopp nach dem ersten (Akte), damit die Zeilendarstellung freigegeben ist, bevor der Block darauf aufbaut.

## Grundsätze

- Kosten hängen an Aufgaben. Es gibt keinen eigenen Finanz-Screen.
- Summen kommen aus der View `costs_summary` (004), nie aus dem Frontend nachgerechnet.
- Design-Tokens und Komponenten aus dem Snapshot; kein neues Grün/Rot für Geld. Warnfarbe nur bei überfälligen Zahlungen.

## 1. Kostenzeilen in der Akte (Commit 1)

- Abschnitt "Kosten" in der Akte. Ohne Zeilen liegt er hinter "Alle Felder anzeigen" als Link "Kosten erfassen"; mit Zeilen ist er sichtbar und zählt als Auslöser für die volle Akte (009 §3).
- Zeile: Bezeichnung · Betrag (EUR, zwei Stellen, Tausenderpunkt) · Status-Chip · Fälligkeit · Chips für `apartment` (S/A/N) und `tax_relevant`. Bearbeiten inline: Antippen der Zeile klappt die Felder auf (Bezeichnung, Betrag, Art einmalig/Rückfluss, Wohnung, Fälligkeit, steuerrelevant, Notiz, Beleg-Link). Kein Overlay, kein Dialog.
- **Status-Übergänge als Buttons**, immer nur der nächste Schritt sichtbar: `geschaetzt` → "Angebot eintragen" → `angebot` → "Beauftragen" → `beauftragt` → "Fällig" → `faellig` → "Bezahlt am …" → `bezahlt`. Ein "Zurück" nur um genau einen Schritt. Mehrere `angebot`-Zeilen an einer Aufgabe sind normal; "Beauftragen" an einer setzt die anderen Angebote nicht um, sie bleiben als Historie ausgegraut.
- **"Bezahlt am …"** fragt in einer Zeile: Datum (Default heute), bezahlt von (Default eingeloggte Person, Auswahl S/A), Beleg-Link (Pflichtfeld nur bei `tax_relevant`, sonst optional). Speichern setzt `paid_on`, `paid_by`, `receipt_url`; der Trigger aus 004 setzt den Status.
- "Neue Kostenzeile": Bezeichnung + Betrag reichen; Rest Defaults (einmalig, geschätzt, Fälligkeit = Aufgabenfrist per Trigger, `belongs_to = B`).
- Aufgabenzeile in der Liste zeigt bei Kosten ein kleines Betragsschild ("≈ 1.800 €" bei geschätzt, "1.740 €" ab beauftragt).

## 2. Kachel "Kosten" und Kosten-Block (Commit 2)

- Fünfte Kachel neben den vier aus 009: "Kosten" mit der Netto-Summe als Zahl. Antippen = Filter auf Aufgaben mit Kostenzeilen **und** Einblenden des Kosten-Blocks über der Liste.
- **Kosten-Block**, oben fünf Zahlen aus `costs_summary`: geplant inkl. Puffer · bisher bezahlt · Rückflüsse erwartet · netto · Saldo (positiv = Anna schuldet Sebastian, negativ umgekehrt; Wortlaut ausschreiben, kein Vorzeichen). Jede Zahl antippbar → filtert die Liste auf die zugehörigen Zeilen (bezahlt / Rückflüsse / offen).
- **Zahlungen:** Zeile "Fällig in 7 Tagen: N · Überfällig: N" unter den fünf Zahlen, Warnfarbe nur bei Überfällig > 0, antippbar. Keine sechste Kachel.
- **Cashflow nach Monat:** Tabelle Monat | fällig | davon bezahlt, von jetzt bis zwei Monate nach Einzug. Doppelmiete als eigene, nicht editierbare Zeile "Doppelmiete (berechnet)" je Monat, aus `settings.move_out_s`, `move_out_a`, Einzugstermin und den Kaltmieten aus `recurring` (Zeilen `Kaltmiete` + `Nebenkosten` alt S/alt A). Fehlen die Auszugstermine: Hinweiszeile "Auszugstermine fehlen – in den Einstellungen setzen" mit Link; Einstellungen = ein kleiner Bereich im Kopf (Einzugstermin gibt es schon, `move_out_s`, `move_out_a`, `split_default_s`, `buffer_pct` kommen daneben).
- **Puffer:** Zeile "Puffer (20 %)" im Block, Betrag aus `costs` (Zeile mit `task_id = null`); antippen erlaubt Betrag oder Prozentsatz zu ändern. Fehlt die Zeile: Block bietet "Puffer anlegen" an.
- Keine Grafik. Tabellen und Zahlen.

### Nachtrag vom 22.09.2026 (nach Freigabe von Commit 1)

Der Kosten-Block wird **eine eigene Ansicht „Finanzen"** statt eines Einschubs über der Liste:

- URL `#finanzen`, erreichbar über die Fußzeile, am Desktop zusätzlich im Kopf, und über die Kachel „Kosten" (die Kachel filtert also nicht mehr, sie öffnet die Ansicht).
- Inhalt: der Block oben, darunter **alle Aufgaben mit Kostenzeilen, nach Phase gruppiert**. Die Kostenzeilen sind dort aufklappbar und bearbeitbar – **dieselbe Komponente wie in der Akte**, nicht dupliziert. Antippen der Aufgabe öffnet ihre Akte.
- Der Offline-Lesestand deckt die Ansicht mit ab.
- Zusätzliches Akzeptanzkriterium: `#finanzen` funktioniert am Handy und am Desktop; eine Zeile in der Finanzansicht bearbeiten → die Änderung ist in der Akte sichtbar, ohne Reload.

## 3. Laufende Kosten (Commit 3)

- Am Ende des Kosten-Blocks: Abschnitt "Laufende Kosten pro Monat", Tabelle Posten | alt Sebastian | alt Anna | neu | Delta, plus Summenzeile; Delta = neu − (alt S + alt A). Beträge inline editierbar, Zeilen kommen aus dem Inhaltspaket (`recurring` mit `seed_key`), neue Zeile möglich.
- Die Aufgabe "Kostenmodell klären" (Phase 1) bekommt in ihrer Akte einen Link "Laufende Kosten öffnen" (öffnet Kosten-Filter und scrollt zum Abschnitt).

## Nicht Teil von 007

- Sortierung von Kostenzeilen per Hand (`sort` bleibt im Schema ohne UI)
- Währungen, Export, Steuerauswertung – steuerrelevante Zeilen liest Claude bei Bedarf über den Connector
- Push-Erinnerungen an Fälligkeiten

## Abweichungsliste

`docs/changes/007-abweichungen.md`: technische Abweichungen; Lücken (sehr viele Zeilen an einer Aufgabe; Beträge > 99.999; Rückfluss mit `paid_on`, d. h. "erhalten am"; Saldo bei fehlendem `split_s`; Zeile ohne Aufgabe außer Puffer); bewusst Nichtumgesetztes. Screenshots 380/1280 nach Commit 1 (Akte mit drei Zeilen in drei Zuständen) und nach Commit 3 (Kosten-Block mit Cashflow).

## Akzeptanzkriterien

- [ ] Kostenzeile anlegen mit zwei Feldern; Fälligkeit wird automatisch gesetzt
- [ ] Status nur schrittweise vorwärts, ein Schritt zurück; "Bezahlt am …" setzt Datum, Person, Beleg; Beleg-Pflicht greift nur bei steuerrelevant
- [ ] Akte wird "voll", sobald eine Kostenzeile existiert
- [ ] Kachel "Kosten" zeigt netto; die fünf Zahlen im Block stimmen mit `select * from costs_summary` überein (Claude im Chat prüft über den Connector)
- [ ] `#finanzen` funktioniert am Handy und am Desktop; eine Zeile dort bearbeiten → Änderung in der Akte sichtbar ohne Reload
- [ ] Cashflow: Doppelmiete erscheint berechnet, sobald Auszugstermine gesetzt sind; vorher Hinweis mit Link
- [ ] Laufende Kosten: Delta und Summe korrekt, Eingabe am Handy bedienbar (numerische Tastatur)
- [ ] Realtime: Annas Kostenänderung erscheint bei Sebastian ohne Reload
- [ ] 380 px: Kosten-Block scrollt, Tabellen brechen nicht aus; Tap-Ziele ≥ 44 px; Warnfarbe nur bei Überfällig
- [ ] Changelog: "Zu jeder Aufgabe kannst du jetzt Kosten eintragen – geschätzt, angeboten, beauftragt, bezahlt. Die Kachel 'Kosten' zeigt, was der Umzug insgesamt kostet und was zurückkommt."
- [ ] `BRIEFING.md` Abschnitt 5 um Kosten ergänzt
