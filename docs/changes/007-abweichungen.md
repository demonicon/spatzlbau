# Änderungsauftrag 007 – Abweichungsliste

Stand: 22.09.2026 · Branch `feature/finanzen` · Quelle: `docs/changes/007-finanzen.md`
Screenshots: `docs/changes/007-screenshots/` – Commit 1: `akte-kosten-380`, `akte-kosten-1280` (drei Zeilen in drei Zuständen), `akte-kosten-offen-380`, `akte-kosten-bezahlt-1280`. Commit 2: `finanzen-380`, `finanzen-1280`, `finanzen-doppelmiete-380` (mit Auszugsterminen), `dashboard-kachel-380`.

**Kein Schema, keine Migration** – 004 steht, `costs_summary` bleibt unverändert. Alle drei Commits sind gebaut.

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

## 4. Commit 2 – Finanzansicht (Nachtrag vom 22.09.)

| Stelle im Auftrag | Gebaut | Grund |
|---|---|---|
| „Fünfte Kachel … Antippen = Filter **und** Einblenden des Blocks" | Die Kachel **öffnet die Ansicht** `#finanzen` und filtert nichts mehr | Nachtrag vom 22.09.: der Block ist eine eigene Ansicht geworden. **Bewusste Ausnahme von „Kennzahl = Filter"** (002/009): die Ansicht *enthält* die gefilterte Liste – alle Aufgaben mit Kostenzeilen, dazu die fünf Zahlen, die ihrerseits filtern. Die Kachel führt also dorthin, statt die Aufgabenliste umzustellen (von Sebastian am 22.09. so bestätigt) |
| Vier Kacheln in einer Reihe (009) | Am Handy jetzt **3 + 2** in zwei Reihen, ab 600 px alle fünf in einer | Fünf Kacheln nebeneinander lassen bei 380 px 68 px je Kachel – „Fristkritisch" bricht dann mitten im Wort |
| „Jede Zahl antippbar → filtert auf bezahlt / Rückflüsse / offen" | geplant → alles Gezählte · bisher bezahlt → bezahlt · Rückflüsse → Rückflüsse · **netto → offen** | Die vierte Zahl braucht ein eigenes Ziel; „offen" ist das, was davon noch zu zahlen ist |
| Filter wirken „auf die Liste" | Sie filtern die **Kostenzeilen in der Finanzansicht**; Aufgaben ohne passende Zeile fallen weg | Die Aufgabenliste des Dashboards ist eine andere Ansicht geworden |
| Saldo „positiv = Anna schuldet Sebastian" | Gerechnet über **bezahlte** Zeilen: wer bezahlt hat, hat ausgelegt und schuldet nur den eigenen Anteil (`belongs_to`, `split_s`, sonst `split_default_s`). Ein Rückfluss mit Zahldatum zählt als negativer Vorschuss für den, der ihn bekommen hat. Wortlaut ausgeschrieben, kein Vorzeichen | Offene Zeilen sagen nichts darüber, wer am Ende auslegt |
| „Einstellungen = ein kleiner Bereich im Kopf" | Ein aufklappbarer Bereich **in der Finanzansicht** (Fußzeile „Einstellungen" und der Hinweis in der Cashflow-Tabelle führen hin) | Die fünf Werte sind Finanzwerte; im Dashboard-Kopf stünden sie neben Aufgaben, wo sie niemand sucht. Der Einzugstermin bleibt zusätzlich im Kopf des Dashboards, wo er seit 002 steht |
| Cashflow „Monat \| fällig \| davon bezahlt" | Übernommen, Zeitraum von diesem Monat bis zwei Monate nach Einzug. **Rückflüsse stehen nicht in der Spalte „fällig"** | Eine Spalte ohne Vorzeichen, die Aus- und Eingänge mischt, wäre falsch zu lesen; Rückflüsse stehen in den fünf Zahlen und bei ihrer Aufgabe |
| Doppelmiete | Monatsgenau: sobald die neue Wohnung läuft und die alte noch nicht gekündigt ausgelaufen ist, zählt deren Kaltmiete + Nebenkosten aus `recurring`. Keine Tagesanteile | Der Auftrag nennt Monatszeilen; Tagesanteile bräuchten Mietbeginn und -ende auf den Tag |
| „Doppelmiete als eigene, nicht editierbare Zeile" | Als eigene **Spalte** je Monat, grau, mit Fußnote „berechnet – nicht bearbeitbar" | Als Zeile je Monat hätte die Tabelle doppelt so viele Zeilen; die Spalte zeigt dasselbe |
| Puffer | Zeile mit Satz und Betrag; aufklappen erlaubt Betrag **oder** Satz zu ändern, dazu „Satz auf Summe anwenden". Fehlt die Zeile: „Puffer anlegen" mit Vorschlag | Der Auftrag lässt beides zu; der Knopf macht sichtbar, was der Satz gerade ergäbe |
| „Aufgabe antippen öffnet die Akte" | Springt ins Dashboard, deckt die Aufgabe auf (auch aus eingeklappten Bereichen) und öffnet die Akte, `#task=<id>` in der Adresszeile | – |
| Offline | Die Ansicht ist lesbar (Kosten und laufende Kosten liegen im Offline-Stand), Navigation und Filter funktionieren, jeder Schreibweg meldet „Ohne Netz kannst du nur lesen" | wie alle Schreibwege seit 009 |

**Geprüft für Commit 2:** die fünf Zahlen von Hand gegen die Daten nachgerechnet (geplant 6.030 = 1.740 + 500 + 270 + 180 + 2.400 + 940, netto 4.830, Saldo −950 = 250 ausgelegt von Sebastian gegen 1.200 von Anna); Doppelmiete Januar 1.760 € (beide Altwohnungen), Februar 790 € (nur Anna), März 0; `#finanzen` über die echte Adressleiste bei 380 und 1280 px; Zeile in der Finanzansicht ändern → Betrag in der Akte **und** im Schild der Aufgabenzeile sofort neu (1.880 €), ohne Reload; Rückweg über Fußzeile und Kachel.

## 5. Commit 3 – laufende Kosten

| Stelle im Auftrag | Gebaut | Grund |
|---|---|---|
| „Am Ende des Kosten-Blocks: Abschnitt ‚Laufende Kosten pro Monat'" | Zwischen Cashflow und Aufgabenliste, eigener Abschnitt `#fin-recurring` | Der Block ist mit dem Nachtrag zur Ansicht geworden; „am Ende des Blocks" heißt jetzt: vor den Aufgaben |
| Tabelle Posten \| alt S \| alt A \| neu \| Delta, Summenzeile | Übernommen; Delta je Zeile und in der Summe, Vorzeichen ausgeschrieben (`+` teurer, `−` günstiger) | – |
| „Beträge inline editierbar" | Drei Felder je Zeile, jedes schreibt für sich (`inputmode="decimal"`, leeres Feld = kein Wert) | Feldgenaue Schreibvorgänge wie überall sonst |
| Bei 380 px | Die Tabelle wird kleiner gesetzt und scrollt notfalls in sich – die Seite bricht nicht aus (geprüft: `scrollWidth == innerWidth`), Eingabefelder bleiben ≥ 44 px hoch | Fünf Spalten mit drei Eingabefeldern passen sonst nicht. Erste Fassung schnitt die Delta-Spalte ab – im Test gefunden |
| „Link ‚Laufende Kosten öffnen' in der Akte von ‚Kostenmodell klären'" | In der Akte der Aufgabe `kosten`; öffnet die Finanzansicht und scrollt zum Abschnitt | – |
| Zeilen „kommen aus dem Inhaltspaket (`recurring` mit `seed_key`)" | Bleibt so; zusätzlich „+ Posten" für eine Zeile von Hand (ohne `seed_key`, wird vom Seed-Merge nicht angefasst) | Der Auftrag verlangt „neue Zeile möglich" |

## 6. Noch offen

- Nichts aus dem Auftrag. Changelog-Eintrag (`2026.09.22.5`) und `BRIEFING.md` Abschnitt 5 sind mit diesem Commit nachgezogen.
- Nichts. Die Schreibwege sind am 22.09. gegen die Live-Datenbank geprüft (angesagt und freigegeben, 27 Prüfungen grün, alles wieder aufgeräumt).

## 7. Im Schreibtest gefunden und behoben (22.09.)

Der angesagte Schreibtest gegen die Live-Datenbank hat zwei echte Fehler zutage gefördert:

1. **Leeres Einstellungsfeld ließ sich nicht speichern.** `settings.value` ist `jsonb NOT NULL`; der neue Einstellungsbereich schickte beim Leeren eines Datums `null` und bekam einen 400er. Ein geleertes Feld speichert jetzt `''` – das liest die App überall als „nicht gesetzt".
2. **Nach „Hinzufügen" blieb die Zeile unsichtbar.** Die App überspringt das Neuzeichnen, solange der Fokus in einem Textfeld steht (damit nichts unter den Fingern wegspringt). Am Rechner nimmt der Klick dem Feld den Fokus, am iPhone aber nicht – Anna hätte getippt und nichts gesehen. Ein Knopfdruck beendet jetzt die Eingabe (Blur), speichert dabei das Getippte und gibt das Neuzeichnen frei. Betrifft nicht nur Kosten, sondern auch Teilschritte, Kommentare und neue Aufgaben.

## 8. Geprüft

- `app/costs.js` gegen das echte Modul im Browser, ausgeloggt und ohne Schreibzugriff: 12 Fälle (Betragsparsen deutsch/englisch, Formatierung, Zählregel mit und ohne feste Zeile, Angebot als Historie, Puffer, Summen, Schild mit und ohne „≈", Rückflüsse nicht im Schild, Überfälligkeit, Schrittgrenzen)
- Zählregel gegen die Datenbank-View in einer zurückgerollten Transaktion – identisch
- Darstellung bei 380 und 1280 px: drei Zeilen in drei Zuständen, Zeile aufgeklappt, „Bezahlt am …"; Tap-Ziele ≥ 44 px, keine Konsolenfehler
- **Schreibtest gegen die Live-Datenbank** (22.09., angesagt und freigegeben, 27 Prüfungen grün): anlegen mit zwei Feldern, Fälligkeit aus dem Trigger, Tausenderpunkt im Betrag, alle acht Felder feldgenau, Status vier Schritte vor und einen zurück, „Bezahlt am …" ohne Beleg abgelehnt und mit Beleg gesetzt, Rückweg aus `bezahlt` räumt Datum und Person ab, Bearbeiten in der Finanzansicht landet in der Datenbank, Puffer ändern und exakt zurücksetzen, laufende Kosten anlegen und drei Beträge einzeln speichern, Delta korrekt, Einstellungen speichern und Doppelmiete erscheint. **Die fünf Zahlen der App stimmen mit `costs_summary` überein** (8.845 / 4.660 / – / 645 / 8.845). Danach alles entfernt, Vorher/Nachher abgefragt
