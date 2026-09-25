# 033 v2 – Anfragen: Anbieter-Vergleich als eigene Seite (4z)

**Status: umgesetzt – Login-Tests offen** (Testkonten fehlen; Branch `feat/033` → `preview`, `main` folgt über `/release 2.2.4`; v1 liegt unter `archiv/`)

Stand: 24.09.2026 (v2 nach Skizze 8d, Entscheidung Sebastian: eigene Seite) · Meilenstein 2.2 · Ziel-Branch: `preview` · Modell: Opus · Aufwand: M–L
Setzt 024 (Delegation, Stundenlauf) und 032 (Entscheidungen) voraus.

## Ziel

Eine Seite „Anfragen", auf der ihr Vergleiche zentral bei Claude anfordert – Umzugsfirma, Internet, Strom/Gas, Versicherung – und die Ergebnisse in fester Struktur zurückkommen: Angebote nebeneinander, Empfehlung mit Begründung, Quellen. „Wählen" setzt den Posten fest, legt die Entscheidung an (032), die andere Person bestätigt. Was Claude liefern kann, steht ehrlich dabei: **Tarife aus dem Netz** (Internet, Strom, Gas, Versicherung) sind echt; **Umzugsfirmen** sind Richtwerte plus Firmenliste plus Anfragetext – echte Angebote tragt ihr ein oder legt sie als PDF ins Drive („03 Angebote"), Claude liest sie beim nächsten Lauf.

## Daten

Kein neues Schema. Eine Anfrage ist eine Aufgabe mit `type = 'anfrage'` (Spalte existiert), `owner = 'B'`, `phase` und Fälligkeit der verknüpften Aufgabe, **nicht** in den Aufgaben-Spalten/Timeline (Filter auf `type`). Verknüpfung über `brief.anfrage.task_id`. Status-Leiter wie 024: `briefing` (Entwurf) → `claude` (gesendet) → `ergebnis` → zusätzlich `entschieden` (neu, nur für `type = anfrage`; Migration `NNN_a033_status.sql` erweitert den Check).

```
brief.anfrage = { category: 'umzug'|'internet'|'energie'|'versicherung'|'sonstiges',
                  task_id, fields: { … je Kategorie, s. u. }, sent_at, requested_by }
brief.vergleich = { offers: [ { id, name, author: 'S'|'A'|'C', date, price, price_kind: 'fest'|'ab'|'monat',
                                service, term, valid_until, plus, minus, url, source } ],
                    recommendation, reason, sources: [url], request_text, updated_at,
                    chosen: id|null, chosen_by, chosen_at }
```
Standing-Regel 024 erweitert (CLAUDE.md, freigegeben): Claude schreibt `brief.vergleich` (alles außer `chosen*`), setzt `status` claude → ergebnis, kommentiert als C. Von Menschen angelegte oder geänderte Angebote (`author S|A`, oder `source = manual`) überschreibt Claude nie; er ergänzt und kommentiert.

Felder je Kategorie (Formular „Rahmen"): **umzug** Volumen m³, Adressen (aus Stammdaten vorbelegt), Etagen/Aufzug je Adresse, Termin (Umzugstag), Küchenmontage ja/nein, Halteverbot durch Firma ja/nein, Budget · **internet** Adresse neu, Bandbreite ab, Laufzeit max., Budget/Monat, Anschlussdatum · **energie** Strom/Gas, PLZ neu, Verbrauch kWh/Jahr (Schätzung aus Personen und m²), Ökostrom ja/nein, Beginn · **versicherung** Hausrat/Haftpflicht, Wohnfläche, Versicherungssumme, Selbstbeteiligung · **sonstiges** Freitext.

## Ansicht

- **Navigation:** dritte Pille „Anfragen" neben Aufgaben · Finanzen, mit Zähler-Badge = Ergebnisse ohne Entscheidung (Ink, kein Rot). Route `#anfragen`, `#anfragen=<id>`.
- **Layout ≥ 900 px:** links Liste (320 px), rechts Detail `1fr` – dasselbe Grid wie Aufgaben. **< 900 px:** Liste, Tipp öffnet Detail als Seite.
- **Liste:** je Anfrage: Titel („Umzugsfirma"), verknüpfte Aufgabe leise, Leiter `● ○ ○ ○` Entwurf · gesendet · Ergebnis · entschieden, Datum (gesendet/Ergebnis), bei Ergebnis der Chip „Ergebnis da" (Claude-Farbe). Kopf: „Anfragen · 4 · 1 Ergebnis" + „+ Anfrage" (Sekundär). Neue Anfrage: Kategorie wählen → Formular mit den Feldern, Aufgabe vorgeschlagen (umzugsfirma, internet, energie, versicherung).
- **Detail, Entwurf:** Formular „Rahmen" (Felder oben) + Freitext „Was noch wichtig ist" + **Primär „An Claude senden"** → `status = claude`, `sent_at`, Kommentar an der verknüpften Aufgabe „Anfrage gesendet ›", und der Lauf startet wie „Claude jetzt starten" (024). Danach Leiter auf gesendet, Satz „Claude arbeitet um 8, 12, 15, 18 und 22 Uhr – oder jetzt mit dem Button" (Laufzeiten seit 25.09.).
- **Detail, Ergebnis:** oben Empfehlungssatz in der Claude-Farbe („Claude empfiehlt: Firma B – Festpreis, Montage inklusive, einziger mit Termin 28.12."), darunter die **Tabelle in voller Breite**: Spalten = Angebote (bis 5; Name, „von Claude · 22.09." / „von Sebastian · 18.09."), Zeilen = Preis (günstigster **fett**, nicht farbig) · Art · Leistung · Termin · Gültig bis (abgelaufen: grauer Tag) · Plus/Minus · Quelle (Link). Fuß je Spalte: Sekundär „Wählen"; „ändern" öffnet das Angebot als Formular (gleiche Editor-Hülle); „+ Angebot" für eigene. Unter der Tabelle: „Begründung" (reason), „Quellen" (Links), bei umzug „Anfragetext kopieren" (request_text für Mails an Firmen). **< 900 px:** je Angebot eine Karte mit den sieben Zeilen, Empfehlung zuerst.
- **Wählen:** (1) `chosen*` setzen, Leiter auf entschieden; (2) Kommentar des Wählenden an der **verknüpften Aufgabe** „Entschieden: Firma B – 1.740 € Festpreis …" mit `decision = true` (032); (3) Geld: bei `price_kind = monat` (internet, energie, versicherung) Inline-Frage „29,99 €/Monat als neuen Wert in Laufend ab Januar übernehmen?" → Ja schreibt `recurring.amount_n` der passenden Kategorie (031 Teil B); sonst (umzug, Einmalpreise) Posten der Aufgabe: „1.740 € als fest übernehmen? (Firma B)" → Ja setzt `amount`, `status = fest`, `note` = Anbieter; kein Posten → „Posten anlegen ›" vorbelegt. „Wahl aufheben" als Subtle; Kommentar, Posten und Laufend-Wert bleiben.
- **Akte der verknüpften Aufgabe:** Block „Anfrage" mit Leiter und Link „Ergebnis ansehen ›" (bzw. „Anfrage stellen ›" wenn keine existiert).
- **Rückkanal:** Nachfragen an Claude als Kommentar an der Anfrage („@claude bitte auch Anbieter X"), Lauf ergänzt.

## Claude-Lauf (nach dem Merge, Claude selbst)

Prompt des Stundenlaufs: Anfragen mit `status = claude` lesen, je Kategorie recherchieren (Web; Drive-Ordner „03 Angebote" auf PDFs prüfen), `brief.vergleich` schreiben, Status auf ergebnis, Kommentar C an der Anfrage und der verknüpften Aufgabe. Bei umzug: `request_text` erzeugen. Standing-Regel entsprechend.

## Nicht im Umfang

Automatische Angebotsanfrage durch Claude an Firmen, Anhänge in der App, Mehrfachwahl.

## Tests

- Anfrage „umzug" anlegen, Rahmen ausfüllen, senden → `type = anfrage`, `status = claude`, `sent_at`, Kommentar an `umzugsfirma`; Aufgaben-Spalten zeigen die Anfrage nicht.
- Per Connector `brief.vergleich` mit 3 Angeboten + Empfehlung setzen, Status ergebnis → Badge „1", Tabelle bei 1280, Karten bei 380, günstigster Preis fett, abgelaufenes Angebot grau.
- „Wählen" auf B → entschieden, Entscheidungs-Kommentar an `umzugsfirma` (032), Frage nach Betrag → Ja → `costs.umzugsfirma-schaetzung` 1.740 € fest, Notiz „Firma B".
- Anfrage „internet", Wahl eines Tarifs 29,99 €/Monat → Frage → Ja → `recurring` Internet `amount_n = 29.99`, kein Posten angelegt.
- Angebot A manuell auf 1.390 € → `author`/`source` manual; simulierter Claude-Schreibzugriff lässt A unverändert.
- „Wahl aufheben" → `chosen` null, Kommentar und Posten bleiben.
- Akte `umzugsfirma` zeigt Block „Anfrage · Ergebnis da ›".

## Akzeptanzkriterien

- [x] Migration (Status- **und** Typ-Check) im Dry-Run, dann anwenden; Regel erweitert (Dry-Run ohne explizites `rollback`, siehe unten)
- [ ] Sechs Tests grün – **offen:** Tests 1, 3, 4, 6 in der App nicht getestet (Testkonten fehlen), 2 und 7 in der Darstellung nur simuliert. Erfüllt: Anfragen nie in Spalten, Timeline, Kalender-Abo oder Kennzahlen.
- [x] Ein Primär je Ansicht (Anfragen: „An Claude senden" nur im Entwurf; im Ergebnis keiner)
- [x] Tabelle bis 5 Angebote ohne horizontales Scrollen bei 1280; 380 px Karten
- [ ] Regression grün, Screenshots, Bericht ≤ 12 Zeilen – `npm run check` grün, Regression Aufgaben/Entscheidungen simuliert; Screenshot bei 1280 gemacht, bei 380 lief er in einen Timeout (Maße stattdessen gemessen)
- [x] Changelog 2.2.4: „Anfragen: Vergleiche zentral bei Claude anfordern – Ergebnis als Tabelle, ein Tipp entscheidet."

## Umsetzung 25.09.2026 – Tests, Entscheidungen, Abweichungen

### Tests (ehrlich getrennt: real · simuliert · nicht getestet)

| # | Test | Ergebnis |
|---|---|---|
| 1 | Anfrage anlegen, senden | DB-Seite **real**: Migration nimmt `type=anfrage`/`status=claude` an (Dry-Run + Test-Zeile). Anfragen nie in Spalten, Timeline, Kennzahlen, Gate, Druck: **simuliert** gerendert, kein Treffer; Kalender-Abo: `events()` lokal in Node geprüft (kein Termin, Gate unverändert), danach die Edge Function deployt (Version 3, Filter per Abruf der deployten Quelle bestätigt); die Wirkung im Live-Feed ist ohne Anfragen in der DB nicht beobachtbar. Anlegen/Senden in der App als Person: **nicht getestet – Testkonten fehlen**. |
| 2 | `brief.vergleich` per Connector, Badge, Tabelle 1280, Karten 380 | Schreiben **real** über `claude-result.mjs`. Darstellung **simuliert**: Badge 1, Tabelle 867 px im 943-px-Panel, 5 × 146 px, kein horizontales Scrollen; 380 px Karten, Empfehlung zuerst; günstigster fett, abgelaufen grau. |
| 3 | Wählen → Entscheidung, Betragsfrage, Posten fest | Rechenweg **real** (Node): Kommentar „Entschieden: Firma B – 1.740 € Festpreis …" an `umzugsfirma`, Frage „1.740 € als fest übernehmen? (Firma B)", Ziel `umzugsfirma-schaetzung` (nicht die Transportversicherung), `faellig` + Notiz. Darstellung **simuliert**. In der App: **nicht getestet – Testkonten fehlen**. |
| 4 | Internet-Tarif → `recurring.amount_n` | Rechenweg **real**: Ziel `recurring internet`, `amount_n 29.99`, kein Posten. In der App: **nicht getestet – Testkonten fehlen**. |
| 5 | Manuelles Angebot bleibt bei Claudes Lauf | **real, live**: A (1.390 €, S, manual) blieb, Claudes 1.600 € ignoriert; ein von Claude als „S" ausgegebenes Angebot verworfen; `chosen` blieb leer. (Lief vor dem Merge-Fix aus Reviewer-Runde 1; der geänderte Merge danach in Node erneut geprüft, der Schutzweg ist unverändert.) |
| 6 | Wahl aufheben | Rechenweg **real** (`unchoosePatch`); in der App: **nicht getestet – Testkonten fehlen**. |
| 7 | Akte `umzugsfirma` zeigt „Anfrage · Ergebnis da ›" | **simuliert** gerendert: „Anfrage Ergebnis da", Link „Ergebnis ansehen ›". |

Ein Primär je Ansicht (simuliert geprüft): Entwurf genau „An Claude senden", Gesendet/Ergebnis/Entschieden keiner, Aufgaben mit offener Akte genau einer.
Live-Schreibzugriffe: nur die Migration und die Test-Anfrage `test_033` (ohne Verknüpfung) samt Claude-Kommentar – danach gelöscht, Nachweis: 0 Zeilen in `tasks`, `comments`, `task_changes`, 0 Anfragen gesamt. Echte Posten, Laufend-Werte und Kommentare nicht angefasst.

### Entscheidungen und Abweichungen

- **Migration braucht zwei Checks:** Neben `tasks_status_check` (+`entschieden`) lehnte `tasks_type_check` `anfrage` ab – beides in `022_a033_status.sql`. Beim Dry-Run fehlte am Ende das `rollback`; per Abfrage bestätigt, dass nichts hängen blieb (Transaktion beim Verbindungsende verworfen).
- **Layout:** Liste 320 px + Anfrage `1fr` ab 900 px, wie im Auftrag beziffert. „Dasselbe Grid wie Aufgaben" als dasselbe *Muster* gelesen – das Aufgaben-Panel ist bei 1280 px nur 420 px breit, fünf Angebote wären dort nicht ohne Scrollen gegangen.
- **Monatspreise (Frage A, Empfehlung angenommen):** nur Internet hat eine Laufend-Zeile; bei Strom/Gas/Versicherung kein Geldschritt, stattdessen der Satz „Laufende Kosten dafür kommen mit den Verträgen." (031).
- **Welcher Posten:** der `…-schaetzung`-Posten der Aufgabe, sonst der einzige offene einmalige, sonst „als neuen Posten anlegen?". Ein `ab`-Preis wird als Schätzung übernommen, nicht als fest.
- **Stammdaten:** Wohnfläche, Personenzahl und PLZ gibt es dort nicht – Freifelder ohne Vorbelegung.
- **Rahmen speichert direkt** feldweise in `brief.anfrage.fields` (kein eigener Entwurfs-Slot nötig); der Entwurfspfad der Akte bleibt unberührt.
- **Kommentar nach dem Senden:** „Anfrage ‚…‘ an Claude gesendet – das Ergebnis erscheint unter Anfragen." statt „Anfrage gesendet ›" – Kommentare können keinen Link tragen; der Link steht im Akte-Block.
- **Der Satz „… – oder jetzt mit dem Button"** steht im Entwurf unter „An Claude senden" (dort gibt es den Button); nach dem Senden „Claude arbeitet um 8, 12, 15, 18 und 22 Uhr · nächster Lauf um hh:00".
- **`recommended`** (id des empfohlenen Angebots) als optionales Feld in `brief.vergleich` ergänzt – nötig für „Empfehlung zuerst" auf den Karten; in Regel und BRIEFING dokumentiert.
- **Leiter** in der Liste als die vierteilige „Stand"-Leiste, nicht als Punkte `● ○ ○ ○`.
- **Panel ohne Auswahl** zeigt die erste Anfrage (wie Entscheidungen seit 032c); jede Aktion im Detail heftet die Anfrage fest – sonst wäre das Panel nach „Wählen" (neue Sortierung) auf die nächste gesprungen, samt Preisfrage (beim Simulieren gefunden).
- **Sicherheit:** Links aus Claudes Daten oder Eingaben werden nur bei `http(s)` zu Links (`javascript:` bleibt Text).
- **Branch** `feat/033` statt `feat/033-anfragen` und v1 nach `archiv/` (Entscheidung Sebastian): der `migration-guard` fand bei zwei `033-*`-Dateien die falsche.
- **Nicht meins:** Den Prompt des Claude-Laufs passt Claude im Chat an (Schreibweg `claude-result.mjs` mit `vergleich` steht). Altfehler `costdel:`/`cost-del:` als eigene Aufgabe vorgeschlagen, nicht hier gefixt.
- **Doku außerhalb von 033:** In BRIEFING.md und `rules/db.md` auch die Laufzeiten aus 032b (stündlich → 8, 12, 15, 18, 22 Uhr) nachgezogen – für BRIEFING.md von Sebastian mit Frage B freigegeben, in der Regel dieselbe Tatsache. `brief.ergebnis` → `brief.result` in BRIEFING.md korrigiert: der Code schrieb immer `result`, die Doku war falsch.
- **Reviewer-Runde 1** fand drei echte Fehler, behoben: (a) `claude-result.mjs` hätte eine entschiedene Anfrage bei einem Folgelauf auf `ergebnis` zurückgesetzt – jetzt nur `claude → ergebnis`, sonst bleibt der Status (Angebote und Kommentar landen trotzdem); die App zeigt „Ergebnis da", Badge und „Wählen" zusätzlich nur ohne getroffene Wahl. (b) Ein Lauf ohne `offers` hätte Claudes Angebote gelöscht, eine neue Liste das gewählte – der Merge behält jetzt beide; die Tabelle zeigt Gewähltes und Eigenes immer unter den fünf Plätzen, „Wahl aufheben" findet das Angebot in der ganzen Liste. (c) Quellen-Links und der Aufgaben-Link im Kopf hatten unter 44 px Tipp-Fläche. Dazu: Kalender-Test ehrlich als lokal + deployt statt „real" beschrieben, Kästchen oben ehrlich gesetzt.
- **Lokal beobachtet:** Der Service Worker mischte beim ersten Laden gecachtes altes `state.js` mit der neuen Datei (lokal ändert sich die Build-Kennung nie). Auf der echten Seite wechselt sie je Deploy – kein Produktionsfehler.
