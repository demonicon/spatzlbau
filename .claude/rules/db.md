# Datenbank, Migrationen, Seed

- Jede Datenänderung geht feldgenau über Supabase (`update` einzelner Spalten/Zeilen), nie den Gesamtstand überschreiben.
- `seed.json` ist die einzige Quelle für Stammaufgaben und Beratungstexte. Inhaltsänderungen = Seed ändern + `scripts/seed.mjs` ausführen (merge, nie destruktiv).
- Schema-Änderungen als neue Datei in `supabase/migrations/NNN_aXXX_<thema>.sql` (NNN fortlaufend, XXX = Nummer des Änderungsauftrags, z. B. `005_a004_costs.sql`); `schema.sql` bleibt der Gesamtstand für Neueinrichtung. Die Migrationen 001–004 stammen von vor dieser Regel und behalten ihre Namen.
- Migrationen sind immer additiv (neue Spalte/Tabelle/Trigger, nie ein bestehendes Feld umbauen oder löschen); erst Dry-Run (in einer Transaktion, zurückgerollt) melden, dann anwenden.
- Eine geänderte View: droppen und neu anlegen, nicht `alter view` versuchen.
- Summen (Beträge, Salden) nie im Frontend berechnen – `costs_summary` (SQL-View) ist die einzige Quelle.
- Der stündliche Claude-Lauf schreibt nur über seinen eigenen, feldgenauen Weg (`scripts/claude-result.mjs`, Autor `C`); er markiert nie selbst eine Entscheidung (Auftrag 032) und ändert nie fremde Felder.
