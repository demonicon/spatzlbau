-- Bugfix 2.0.4 (docs/changes/014c): der Puffer hatte zwei Quellen, die sich überschrieben -
-- settings.buffer_pct und eine Kostenzeile "Puffer". Ab jetzt ist der Puffer eine Einstellung:
-- buffer_pct (Satz, Default 20) oder buffer_fixed (fester Betrag, überschreibt den Satz, wenn
-- gesetzt). Entscheidung Sebastian: Satz übernehmen, kein Festbetrag (buffer_fixed bleibt null).

-- 1. buffer_fixed anlegen, falls noch nicht vorhanden
insert into public.settings (key, value)
select 'buffer_fixed', 'null'::jsonb
where not exists (select 1 from public.settings where key = 'buffer_fixed');

-- 2. die alte Puffer-Kostenzeile entfernen - genau diese id, kein Muster auf label
delete from public.costs where id = 'fb8306ef-35db-4318-944d-5af949e11b5e';

-- 3. costs_summary: buffer aus den Settings statt aus einer Kostenzeile, neue Spalte buffer_mode.
--    drop + create (Regel aus 010: kein create or replace bei Spaltenänderung).
drop view if exists public.costs_summary;
create view public.costs_summary with (security_invoker = true) as
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
),
totals as (
  select (select sum(amount) from counted where kind = 'einmalig') as planned_total
),
buffer_settings as (
  select
    coalesce((select nullif(value #>> '{}', '')::numeric from public.settings where key = 'buffer_pct'), 20) as pct,
    (select nullif(value #>> '{}', '')::numeric from public.settings where key = 'buffer_fixed') as fixed
),
buffer_calc as (
  select
    case when bs.fixed is not null then bs.fixed
         else round(coalesce(t.planned_total, 0) * bs.pct / 100, 2) end as buffer,
    case when bs.fixed is not null then 'fixed' else 'pct' end          as buffer_mode
  from buffer_settings bs, totals t
)
select
  t.planned_total                                                                    as planned_total,
  (select sum(amount) from counted where kind = 'einmalig' and status = 'bezahlt')   as paid,
  (select sum(amount) from counted where kind = 'rueckfluss')                        as refunds_expected,
  bc.buffer                                                                          as buffer,
  bc.buffer_mode                                                                     as buffer_mode,
  (select case when n = 0 then null else v end from double_rent_sum)                 as double_rent,
  coalesce(t.planned_total, 0) + coalesce(bc.buffer, 0)
    + coalesce((select case when n = 0 then null else v end from double_rent_sum), 0)
    - coalesce((select sum(amount) from counted where kind = 'rueckfluss'), 0)       as net
from totals t, buffer_calc bc;
