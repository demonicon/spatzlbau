# 016b – Finanzen: drei Stände, Posten anlegen, Ersteinrichtung

Status: umgesetzt (Branch `feat/016b-finanzen-einstieg` → `preview`, Abweichungen in `016b-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: M
Ergänzung zu 016 (läuft im Batch, wird nicht angefasst). Reihenfolge im Auftrag: Teil 2 (Stand) zuerst, dann 2b, dann 1. Einreihen nach 016, vor 017 – oder als nächster Auftrag der laufenden Session, sobald 016 gemerged ist. Setzt 020 voraus.

## Befund

1. Die Finanzansicht ist ohne Rahmendaten leer und ohne Startposten sinnlos. Heute muss man wissen, dass es Rahmendaten gibt, wo sie liegen und welche Zeilen man selbst anlegen soll.
2. Ein Posten anlegen heißt heute: ein Formular mit Bezeichnung, Art (einmalig/Rückfluss), Wohnung (S/A/N), Stand (fünf Werte), Betrag, fällig, bezahlt am, bezahlt von, gehört zu, Anteil, steuerrelevant, Beleg. Zwölf Felder für „Kartons 180 €". Das Datenmodell aus 004 ist richtig; es darf nur nicht als Formular erscheinen.

## 1. Ersteinrichtung – „Vier Fragen"

Beim ersten Öffnen von Finanzen (kein `settings.fin_setup_done`) statt der leeren Ansicht ein Ablauf über vier Schritte, je Schritt ein Bildschirm, Primär **Weiter**, Text **Später** (dann bleibt die Ansicht leer mit Hinweiszeile „Einrichtung abschließen ›"):

| Schritt | Fragen | Schreibt |
|---|---|---|
| **Termine** | Einzug (vorbelegt), Umzugstag, Auszug Sebastian, Auszug Anna | `settings.einzugstermin`, `umzugstag`, `move_out_s`, `move_out_a` |
| **Mieten** | Kaltmiete + Nebenkosten alt S (vorbelegt 1.150/200 aus Vertrag), alt A (700/150), neu (aus neuem Vertrag) | `recurring` Kaltmiete, Nebenkosten (Spalten S/A/N) |
| **Kautionen** | alt S (2.910), alt A (2.040), neu (Betrag, Frist) | `costs`: zwei Rückfluss-Zeilen `kaution-alt-s/a`, eine Einmalzeile `kaution-neu` (Stand fällig, `due_on` aus Vertrag) |
| **Aufteilung** | 50/50 oder anderer Schlüssel; Puffer 20 % (vorbelegt); Haushaltskonto ja/nein | `settings.split_default_s`, `buffer_pct`, `fin_setup_done = true` |

- Vorbelegungen kommen aus dem Seed/Teil B, wo vorhanden – die Einrichtung bestätigt, sie tippt nicht ab.
- Jeder Wert bleibt danach editierbar: Rahmendaten über „ändern" (016 §8, dieselben vier Schritte einzeln aufrufbar), Mieten über „Bearbeiten" in Laufend (016 §6), Kautionen als normale Rückfluss-Zeilen.
- Nach Abschluss: Ansicht aus 016 mit gefüllter Antwortzahl. Die Rahmendaten bleiben über „ändern" (016 §8) erreichbar; die vier Schritte sind dieselben Felder, nur einmal geführt.
- Ergebnis für die Antwortzahl sofort: Doppelmiete berechnet, Kautionen als Rückfluss, Puffer als Zeile. Damit steht am Tag der Einrichtung eine Zahl, die stimmt.

## 2. Der Stand eines Postens – drei statt fünf (Kern dieses Auftrags, zuerst bauen)

**Befund:** `geschätzt → angebot → beauftragt → faellig → bezahlt` verlangt bei jedem Posten eine Einordnung, die nur bei der Umzugsfirma je eine Rolle spielt. Für Kartons, Halteverbot, Bidet, Elektriker gibt es nur: Zahl unsicher, Zahl steht, bezahlt. „Fällig" ist ein Datum, kein Zustand.

**Neu – drei Stände, die je genau eine Frage beantworten:**

| Stand | Bedeutet | Zeile zeigt | Button (einer) | fragt |
|---|---|---|---|---|
| **geschätzt** | Zahl unsicher | „≈ 1.500 €" | **Betrag festlegen** | Betrag · fällig am (vorbelegt: Aufgabenfrist) · optional Angebot/Link |
| **fest** | Zahl und Termin stehen | „1.420 € · fällig 15.12." (Gelb ab 7 Tage, Rot überfällig) | **Bezahlt** | **Wer hat bezahlt?** du / Anna / Haushaltskonto · Datum (heute) |
| **bezahlt** | Geld ist weg | „1.420 € · 12.12. · Anna" | – | Text „ändern" |

- Überfällig ist abgeleitet (fest + Datum vorbei), kein eigener Stand.
- **Ändern ist immer da:** Tipp auf die Zeile (nicht auf den Button) öffnet den Posten im Bearbeiten-Modus nach 017 – Bezeichnung, Betrag, fällig am, wer bezahlt hat, Datum, Aufgabe, und der Stand als drei Segmente (geschätzt · fest · bezahlt), auch rückwärts. Fertig speichert, Abbrechen verwirft. Betrag und Datum zusätzlich direkt in der Zeile antippbar (Inline-Feld, Enter speichert) – für die häufigste Korrektur ohne Moduswechsel.
- Rückwärts also nicht verboten, nur nicht über einen Button in der Zeile. Kein Dropdown, nirgends.
- **Wer hat bezahlt** ist die einzige Frage beim Bezahlen; daraus rechnet 016 §3 den Ausgleich. Haushaltskonto = kein Ausgleich.
- Umzugsfirma und andere Angebotsfälle: „Betrag festlegen" hat ein optionales Feld „Angebot von …" – das reicht. Ob beauftragt, sagt die Aufgabe (Teilschritt „Entscheiden und buchen"), nicht die Kostenzeile.
- **Rückfluss** (Kautionen, Erstattungen) hat eigene zwei Stände: **ausstehend** → **erhalten** (Betrag, Datum; Teilbetrag erlaubt → Hinweis „300 € einbehalten – prüfen"). Button: **Erhalten**.
- Die Leiter steht in der Zeile als drei Punkte ● ● ○ mit dem aktuellen Wort – man sieht, wo man ist, ohne es zu lernen.

**Ersetzt 016 §4:** Die dortige Buttonfolge „Angebot eintragen → Beauftragen → Fällig setzen → Bezahlt" entfällt zugunsten von „Betrag festlegen → Bezahlt". Ist 016 bereits gebaut, wird diese Stelle in 016b umgebaut – kein Rückbau von 016 nötig, die Zeilenlogik bleibt.

**Datenbank:** Statuswerte bleiben (`angebot`, `beauftragt`, `faellig` existieren weiter, damit Seed-Merge und Trigger unverändert laufen). Die App liest `angebot | beauftragt | faellig` als **fest** und schreibt ab jetzt nur noch `geschaetzt | faellig | bezahlt`. Die View `costs_summary` ändert sich nicht. Kein Migrationsbedarf für die Leiter.

**Wortwahl:** In der Oberfläche nur „geschätzt · fest · bezahlt" und „ausstehend · erhalten". Kein „faellig" als Stand, kein „einmalig" sichtbar.

## 2b. Posten anlegen – zwei Felder, der Rest folgt

- Ein Bildschirm (aus Finanzen und aus der Akte): **Was?** (Bezeichnung), **Wieviel?** (Betrag; `1.800`, `1800`, `1.800,00`, `1800,5` werden gleich gelesen), **Gehört zu** (Aufgabe suchen, vorbelegt aus der Akte; „keine Aufgabe" erlaubt). Primär **Anlegen** → Zeile im Stand geschätzt.
- Abgeleitet, nicht gefragt: Wohnung aus der Aufgabe (sonst N), gehört zu `B`, Anteil aus `split_default_s`, fällig aus der Aufgabenfrist (Trigger), nicht steuerrelevant.
- Text-Link **„mehr"**: Wohnung, gehört zu, Anteil, steuerrelevant, Art Rückfluss. Wer das nie braucht, sieht es nie.

## 3. Nicht in diesem Auftrag

Belege als Datei (→ 025), Import aus Kontoauszug, Wiederkehrende Kosten neu (016 §6 Leseansicht reicht).

## Daten

`settings.fin_setup_done` (bool). Keine weiteren Schemaänderungen; Statuswerte bleiben, nur Labels. Migration `NNN_a016b_fin_setup.sql`, additiv.

## Akzeptanzkriterien

- [x] Leere Datenbank (nach Clean Cut) → Finanzen öffnet die vier Schritte; „Später" → leere Ansicht mit Hinweiszeile; Abschluss → Antwortzahl > 0 (Doppelmiete + Kautionen + Puffer)
- [x] Vorbelegte Werte aus recurring/costs werden übernommen, nicht dupliziert (seed_key bleibt)
- [x] „+ Posten" aus der Akte `material`: Bezeichnung „Kartons", 180 → Zeile geschätzt, Wohnung N, fällig = Frist von `material`, gehört zu B, kein weiteres Feld sichtbar
- [x] Betragseingabe: `1.800`, `1800`, `1.800,00`, `1800,5` → 1800 / 1800 / 1800 / 1800,50
- [x] Zeile geschätzt → Betrag festlegen → Bezahlt (Anna) in zwei Tipps; Saldo in der Ausgleich-Karte ändert sich danach
- [x] Bezahlte Zeile antippen → Bearbeiten: Stand auf „fest" zurück, Betrag 1.420 → 1.380, Fertig → Zeile und Antwortzahl aktualisiert, Realtime beim anderen Gerät
- [x] Betrag in der Zeile antippen → Inline-Feld, Enter speichert, Esc verwirft
- [x] Bestandszeilen mit `angebot`/`beauftragt` erscheinen als „fest", nichts geht verloren (geprüft) · Seed-Merge `--dry` mit Teil-B-Paket: **nicht geprüft** – kein Teil-B-Paket im Repo, siehe `016b-abweichungen.md`
- [x] Kein Stand-Dropdown mehr in der App (grep); in der Oberfläche kommen die Wörter „faellig", „angebot", „beauftragt", „einmalig" nicht vor
- [x] Kaution alt: ausstehend → Erhalten 2.610 von 2.910 → Hinweis „300 € einbehalten – prüfen"
- [x] 380 px + 1280 px, Bericht ≤ 15 Zeilen, Changelog: „Ein Posten hat drei Stände: geschätzt, fest, bezahlt. Finanzen fragt beim ersten Öffnen vier Dinge und rechnet dann selbst."
