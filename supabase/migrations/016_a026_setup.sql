-- Auftrag 026 (docs/changes/026-start-setup.md): der gemeinsame Start-Ablauf in acht Schritten.
-- setup_done/setup_step sind eigene Schlüssel, unabhängig von fin_setup_done (016b) - die vier
-- Finanzen-Schritte werden nur wiederverwendet, nicht ihr Fertig-Zustand.
-- stammdaten existiert in der Live-Datenbank teils schon (von Hand befuellt); der Default hier
-- greift nur bei einer wirklich leeren Datenbank (Clean Cut) - on conflict do nothing lässt eine
-- vorhandene, reichhaltigere Struktur unangetastet.
-- Additiv: die 1.1-App auf main kennt keinen der drei Schlüssel und fragt sie nie ab.

insert into public.settings (key, value) values
  ('setup_done', 'false'::jsonb),
  ('setup_step', '0'::jsonb),
  ('stammdaten', '{"personen":[],"wohnungen":{}}'::jsonb)
on conflict (key) do nothing;
