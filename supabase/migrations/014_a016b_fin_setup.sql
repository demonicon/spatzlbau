-- Auftrag 016b (docs/changes/016b-finanzen-einstieg.md): Ersteinrichtung und Haushaltskonto.
-- 1. settings.fin_setup_done markiert, ob die "vier Fragen" schon beantwortet sind. Ihr Fehlen
--    wirkt wie false - die Migration seed nur den Ausgangswert, damit jeder Schlüssel eine Zeile
--    hat (wie die übrigen settings in schema.sql).
-- 2. costs.paid_by bekommt einen dritten Wert 'H' (Haushaltskonto): eine Zahlung von dort
--    schuldet niemandem etwas (app/costs.js balance()/balanceParts() lassen sie aus).
-- Additiv: die 1.1-App auf main kennt beides nicht und läuft unverändert weiter - sie schreibt
-- nie 'H' und fragt fin_setup_done nie ab. Kein Migrationsbedarf für die Stand-Leiter selbst
-- (geschätzt/fest/bezahlt): die Statuswerte der Datenbank bleiben, nur die App liest sie neu.

insert into public.settings (key, value) values ('fin_setup_done', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.costs drop constraint if exists costs_paid_by_check;
alter table public.costs add constraint costs_paid_by_check
  check (paid_by in ('S', 'A', 'H'));
