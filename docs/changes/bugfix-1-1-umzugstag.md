# Bugfix 1.1 – Umzugstag getrennt vom Einzug

Stand: 23.09.2026 · Version 1.0 → 1.1 · Branch: `fix/umzugstag` · Modell: Sonnet · Aufwand: S
Vorbedingung für das Inhaltspaket I-2.
Status: umgesetzt (23.09.2026), PR gegen `main`, nicht gemerged. Abweichungen und Prüfergebnisse: `docs/changes/bugfix-1-1-abweichungen.md`. Migration `supabase/migrations/009_b11_umzugstag.sql` liegt bereit – **nicht** angewendet, wie angesagt.

## Fehler

Die App kennt nur `settings.einzugstermin` (01.01.2027). Alle Phase-4-Aufgaben rechnen ab diesem Datum. Der 1. Januar ist ein Feiertag – kein Halteverbot, Feiertagsruhe, Firmen mit Aufschlag. Der tatsächliche Umzugstag (2.1. oder 4.1., Entscheidung am 27.09.) liegt danach; heute fallen alle Umzugstag-Fristen auf einen Tag, an dem nicht umgezogen wird.

## Änderung

- `settings.umzugstag` (date, null). Rahmendaten-Bereich zeigt beide Felder: "Einzug (Schlüssel)" und "Umzugstag".
- `tasks` bekommt `anchor text default 'einzug'` mit Werten `einzug` | `umzugstag`. Fälligkeit = Anker + `offset_days`. Seed und Inhaltspakete dürfen `anchor` setzen; bestehende Aufgaben bleiben auf `einzug`.
- Alle Phase-4-Aufgaben und die Umzugstag-nahen aus Phase 3 (Halteverbot, Kühlschrank, Lampen, Waschmaschine entleeren, Erstversorgungskiste, Dokumente, Umzugstag-Ablauf) werden per Inhaltspaket auf `anchor = umzugstag` gesetzt – **nicht** in diesem Bugfix, nur die Möglichkeit.
- Ist `umzugstag` leer, gilt der Einzugstermin als Umzugstag (Fallback, kein Fehler).
- Countdown: "101 Tage bis Einzug · Umzug Sa 2.1." (zweiter Teil nur, wenn gesetzt und ≠ Einzug). Umzugstag-Druckblatt trägt das Umzugstag-Datum.
- Cashflow (007): Doppelmiete rechnet weiter mit Auszugsterminen und Einzug – unverändert.
- Trigger `due_on` für Kostenzeilen: nutzt den Anker der Aufgabe.
- Seed: `anchor` in `SEED_FIELDS` (`scripts/seed-merge.js`) aufnehmen, Insert-Default `einzug`, `seed_snapshot` trägt das Feld mit. Ohne das ignoriert der Merge das Feld stumm.

## Akzeptanzkriterien

- [x] Migration nach Namensregel (`009_b11_umzugstag.sql`, Begründung der Namenswahl in der Abweichungsliste), `schema.sql` nachgezogen
- [x] Ohne `umzugstag`: App verhält sich exakt wie 1.0 (380-px-Pixelvergleich Hauptansicht, `pngdiff.py`: identisch)
- [x] Mit `umzugstag = 02.01.2027` und einer Testaufgabe `anchor = umzugstag, offset 0`: Fälligkeit 02.01., Countdown zeigt beide Daten, Druckblatt zeigt 02.01.
- [x] Seed-Workflow-Logik `--dry` mit einem Paket, das `anchor` setzt: Feld wird erkannt, 0 Fehler (isoliert gegen `planSeedMerge` geprüft, ohne Datenbank)
- [x] Changelog 1.1: "Einzug und Umzugstag sind jetzt zwei Daten – der 1. Januar ist ein Feiertag, umgezogen wird danach."
