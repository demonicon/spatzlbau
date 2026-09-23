-- Auftrag 016 (docs/changes/016-finanzen.md): Finanzen beantwortet drei Fragen.
-- 1. Kostenzeilen dürfen die Art 'ausgleich' tragen: eine Überweisung zwischen Sebastian und
--    Anna. Sie verschiebt nur den Saldo und zählt in keiner anderen Summe mit.
-- 2. costs_summary bekommt double_rent (die berechnete Doppelmiete) und rechnet sie ins net.
-- Additiv und idempotent: die 1.1-App auf main läuft unverändert weiter, sie liest die neuen
-- Spalten schlicht nicht.

-- ---------------------------------------------------------------------
-- 1. Art 'ausgleich'
-- ---------------------------------------------------------------------
alter table public.costs drop constraint if exists costs_kind_check;
alter table public.costs add constraint costs_kind_check
  check (kind in ('einmalig', 'rueckfluss', 'ausgleich'));

-- ---------------------------------------------------------------------
-- 2. Doppelmiete in der View
--    Sie entsteht aus recurring (Kaltmiete + Nebenkosten je Altwohnung) und den drei Terminen
--    in settings: einzugstermin, move_out_s, move_out_a. Gezählt wird Monat für Monat vom
--    Einzug bis zum letzten Auszug - für jeden Monat, in dem eine Altwohnung noch läuft.
--    Fehlt einer der Termine, ist das Ergebnis null (die Ansicht fragt dann danach).
-- ---------------------------------------------------------------------
create or replace view public.costs_summary with (security_invoker = true) as
with counted as (
  select c.*
  from public.costs c
  where c.kind <> 'ausgleich' and (
        c.status in ('beauftragt', 'faellig', 'bezahlt')
     or (c.status = 'geschaetzt' and (
           c.task_id is null
           or not exists (select 1 from public.costs o
                          where o.task_id = c.task_id and o.status in ('beauftragt', 'faellig', 'bezahlt')))))
),
dates as (
  select
    nullif(value #>> '{}', '')::date as einzug,
    (select nullif(value #>> '{}', '')::date from public.settings where key = 'move_out_s') as out_s,
    (select nullif(value #>> '{}', '')::date from public.settings where key = 'move_out_a') as out_a
  from public.settings where key = 'einzugstermin'
),
rent as (
  select
    coalesce(sum(amount_s), 0) as rent_s,
    coalesce(sum(amount_a), 0) as rent_a
  from public.recurring
  where label ~* '(kaltmiete|nebenkosten)'
),
months as (
  select generate_series(
           date_trunc('month', d.einzug),
           date_trunc('month', greatest(d.out_s, d.out_a)),
           interval '1 month') as m,
         d.out_s, d.out_a
  from dates d
  where d.einzug is not null and d.out_s is not null and d.out_a is not null
),
double_rent_sum as (
  select coalesce(sum(
           case when date_trunc('month', m.out_s) >= m.m then (select rent_s from rent) else 0 end +
           case when date_trunc('month', m.out_a) >= m.m then (select rent_a from rent) else 0 end), 0) as v,
         count(*) as n
  from months m
)
select
  (select sum(amount) from counted where kind = 'einmalig')                          as planned_total,
  (select sum(amount) from counted where kind = 'einmalig' and status = 'bezahlt')   as paid,
  (select sum(amount) from counted where kind = 'rueckfluss')                        as refunds_expected,
  (select sum(amount) from counted where kind = 'einmalig' and task_id is null)      as buffer,
  (select case when n = 0 then null else v end from double_rent_sum)                 as double_rent,
  coalesce((select sum(amount) from counted where kind = 'einmalig'), 0)
    + coalesce((select case when n = 0 then null else v end from double_rent_sum), 0)
    - coalesce((select sum(amount) from counted where kind = 'rueckfluss'), 0)       as net;
