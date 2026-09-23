-- Auftrag 021 (docs/changes/021-phasen-gates.md): der Gate-Moment.
-- Eine Phase ist geschafft, wenn jede ihrer Aufgaben abgehakt ist. Der Moment dazu gehört jeder
-- Person einmal - auch der, die gerade nicht das letzte Häkchen gesetzt hat. Was sie schon
-- gesehen hat, steht hier.
-- Additiv und idempotent: ohne diese Spalte zeigt die App den Moment einmal pro Sitzung und
-- schreibt nichts (die 1.1-App auf main kennt die Spalte nicht und läuft unverändert weiter).

alter table public.allowlist add column if not exists seen_gates jsonb not null default '[]'::jsonb;

-- Die beiden dürfen ihre eigene Zeile in genau diesen Spalten fortschreiben.
grant update (last_seen_version, last_visit_at, seen_comments, seen_gates) on table public.allowlist to authenticated;
