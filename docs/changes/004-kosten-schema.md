# Änderungsauftrag 004 – Kosten-Schema (Vorstufe Finanzmodul) · v2

Stand: 22.09.2026 (Review-Fassung) · Status: umgesetzt, PR offen (Migration von Sebastian eingespielt) · Branch: `feature/costs-schema` · Modell: Sonnet (umgesetzt mit Opus)
Betrifft: `supabase/migrations/`, `supabase/schema.sql`, `scripts/seed.mjs`, `BRIEFING.md` Abschnitt 3 · **keine UI**

## Ziel

Datenstruktur für Kosten, bevor Live-Daten wachsen. Die Oberfläche folgt in 007. Inhaltspakete (Phase 2) dürfen bereits Kostenschätzungen mitliefern.

## Tabelle `costs`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | uuid pk | |
| `task_id` | text fk → tasks, **null erlaubt** | Kosten hängen an einer Aufgabe; `null` nur für den Puffer |
| `label` | text | z. B. "Angebot Firma A", "Kaution neue Wohnung", "Puffer" |
| `kind` | text | `einmalig` / `rueckfluss` |
| `apartment` | text null | `S` alt Sebastian / `A` alt Anna / `N` neu |
| `status` | text | `geschaetzt` → `angebot` → `beauftragt` → `faellig` → `bezahlt`. In Summen zählen nur `beauftragt`, `faellig`, `bezahlt`; `geschaetzt` zählt, solange keine Zeile derselben Aufgabe `beauftragt` oder weiter ist; `angebot` zählt nie (Historie) |
| `amount` | numeric(10,2) | ein Betrag pro Zeile; der Status sagt, wie sicher er ist |
| `due_on` | date null | Fälligkeit; Default beim Anlegen = Frist der Aufgabe; Inhaltspakete setzen sie explizit |
| `paid_on` | date null | gesetzt ⇒ Status `bezahlt` (Trigger oder App-Logik, Claude Code entscheidet) |
| `paid_by` | text null | `S` / `A` – wer überwiesen hat |
| `belongs_to` | text | `S` / `A` / `B` – wem der Betrag wirtschaftlich zuzurechnen ist; `B` = geteilt nach `split_s` |
| `split_s` | numeric(5,2) null | Anteil Sebastian in Prozent bei `belongs_to = B`; `null` = Standard aus `settings.split_default_s` |
| `tax_relevant` | bool default false | haushaltsnahe Dienstleistung / Handwerkerleistung |
| `receipt_url` | text null | Link zum Beleg im Drive; 007 fordert ihn bei `tax_relevant` beim Setzen von `paid_on` ein |
| `note` | text null | |
| `seed_key` | text null | Merge aus Inhaltspaketen |
| `sort` | int default 0 | manuelle Reihenfolge, für 007 Finanz-Dashboard |
| `created_at`, `updated_at` | timestamptz | |

RLS wie `subtasks`, Realtime an, Index auf `task_id` und `due_on`.

## Tabelle `recurring` (laufende Kosten alt vs. neu)

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | uuid pk | |
| `label` | text | Kaltmiete, Nebenkosten, Strom, Gas, Internet, Hausrat, Haftpflicht, Rundfunk, Stellplatz … |
| `amount_s` | numeric(10,2) null | monatlich, Wohnung Sebastian heute |
| `amount_a` | numeric(10,2) null | monatlich, Wohnung Anna heute |
| `amount_n` | numeric(10,2) null | monatlich, neue Wohnung |
| `note` | text null | |
| `seed_key` | text null | |
| `sort` | int default 0 | |

Ohne Intervall: alles auf Monatsbasis; Jahresbeträge teilt die App durch 12 beim Erfassen (007). Das Delta (`amount_n − amount_s − amount_a`) ist die Zahl für "Kostenmodell klären" in Phase 1.

## `settings` – neue Schlüssel

- `move_out_s`, `move_out_a` (date null): Auszugstermine; Grundlage für die **berechnete** Doppelmiete-Anzeige in 007 (keine Kostenzeilen dafür)
- `split_default_s` (numeric, z. B. 55): Standardanteil Sebastian bei geteilten Beträgen
- `buffer_pct` (numeric, default 20): Puffersatz; das Inhaltspaket legt zusätzlich eine `costs`-Zeile "Puffer" mit `task_id = null`, `status = geschaetzt` an, deren `amount` 007 aus dem Satz vorschlägt und die ihr überschreiben könnt

## Seed-Merge

- `costs` und `recurring` mit `seed_key` werden ergänzt, nie überschrieben, sobald eine Zeile `status` ≥ `angebot`, `paid_on`, oder einen von Hand geänderten Betrag hat (Vergleich über `seed_snapshot` wie bei `tasks`).

## Akzeptanzkriterien

- [ ] Migration in `supabase/migrations/`, `schema.sql` als Gesamtstand
- [ ] RLS-Test: dritte Adresse sieht keine `costs`/`recurring`-Zeilen
- [ ] `seed.mjs` verarbeitet ein Beispiel-Inhaltspaket: zwei `costs`-Zeilen an `umzugsfirma` (eine `geschaetzt`, eine `angebot`), Puffer-Zeile, drei `recurring`-Zeilen
- [ ] Summenregel aus der `status`-Spalte als SQL-View `costs_summary` (geplant gesamt, bezahlt, Rückflüsse erwartet, Puffer, netto) – damit 007 und Claude im Chat dieselbe Rechnung sehen
- [ ] `BRIEFING.md` Abschnitt 3 ergänzt; Vormerkung für 007 dort notiert: Kennzahl "Zahlungen in 7 Tagen", Sortierfunktion im Finanz-Dashboard, Beleg-Pflicht bei `tax_relevant`
- [ ] Kein Changelog-Eintrag (nichts sichtbar)

## Umsetzungsnotizen (Claude Code, 22.09.2026)

- Migration `supabase/migrations/005_a004_costs.sql` nach der Namensregel aus 008b (`NNN_aXXX_<thema>`), von Sebastian per SQL-Editor eingespielt; vorher in einer zurückgerollten Transaktion gegen die Live-DB validiert. `schema.sql` als Gesamtstand nachgezogen.
- **Entscheidungen, die der Auftrag offenließ:**
  - `paid_on` ⇒ `status = bezahlt` als **Trigger** (nicht App-Logik), damit die Regel auch für Skripte und SQL gilt.
  - `due_on`-Default ebenfalls im Trigger: beim Anlegen einer Zeile mit `task_id` wird `einzugstermin + offset_days` gesetzt, sofern beides bekannt ist.
  - `split_default_s` startet mit **50** (der Auftrag nennt 55 nur als Beispiel) – über `settings` jederzeit änderbar.
  - `costs_summary` als `security_invoker`-View: die RLS von `costs` gilt; Fremde bekommen eine Zeile mit lauter `null`, keine Zahlen.
  - Export (`export_state`) liefert jetzt zusätzlich `costs`, `recurring`, `costs_summary` und die vier neuen `settings` – damit sieht Claude im Chat dieselbe Rechnung.
- **Inhaltspakete:** `node scripts/seed.mjs --file <paket.json> [--dry]` mergt `costs`/`recurring` über `seed_key`; Beispiel: `docs/changes/004-beispiel-inhaltspaket.json`. Fehlende Blöcke sind erlaubt, `phases`/`seed_version` werden bei Paketen nicht angefasst.
- **Zwei Fehler beim Testen gefunden und behoben:**
  1. Der Planer schrieb fehlende Felder als `null`; `kind`, `amount`, `belongs_to`, `tax_relevant` sind aber `not null` → Spalten-Defaults im Planer ergänzt.
  2. `same()` verglich Snapshots per `JSON.stringify`; Postgres gibt `jsonb` mit eigener Schlüsselreihenfolge zurück → jeder Lauf meldete Scheinänderungen. Vergleich jetzt kanonisch (sortierte Schlüssel). Das betraf auch die bestehende Aufgaben-Logik, die bei jedem Seed-Lauf still 48 Snapshots neu schrieb.
- **Geprüft gegen die Live-DB:** Paket einspielen (3 costs, 3 recurring), zweiter Lauf 0 Änderungen; Paket v2 mit neuen Beträgen → `geschaetzt`-Zeile und `recurring` aktualisiert, `angebot`-Zeile gesperrt; Betrag von Hand geändert → Zeile ebenfalls gesperrt; `paid_on` gesetzt → Status `bezahlt`; RLS mit drittem Konto: `costs`, `recurring`, `tasks` je 0 Zeilen, `INSERT` 403, `costs_summary` nur `null`-Werte; Backup/Restore mit beiden Tabellen, `restore --dry` ohne Abweichungen. Alle Testzeilen danach entfernt (`costs` 0, `recurring` 0).
- Backup (`scripts/backup.mjs`/`restore.mjs`) um `costs` und `recurring` erweitert – das tägliche Artefakt enthält sie ab jetzt.
