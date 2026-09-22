-- Änderungsauftrag 004 (v2) – Kosten-Schema. Vorstufe für das Finanzmodul (007), keine UI.
-- Idempotent: kann mehrfach ausgeführt werden. Einspielen: SQL Editor -> Run.

-- ---------------------------------------------------------------------
--  costs: one amount per row, attached to a task; task_id null only for the buffer row
-- ---------------------------------------------------------------------
create table if not exists public.costs (
  id            uuid primary key default gen_random_uuid(),
  task_id       text references public.tasks (id) on delete cascade,
  label         text not null,
  kind          text not null default 'einmalig' check (kind in ('einmalig', 'rueckfluss')),
  apartment     text check (apartment in ('S', 'A', 'N')),                          -- S alt Sebastian / A alt Anna / N neu
  status        text not null default 'geschaetzt'
                check (status in ('geschaetzt', 'angebot', 'beauftragt', 'faellig', 'bezahlt')),
  amount        numeric(10,2) not null default 0,
  due_on        date,                                                                -- default on insert: task deadline (trigger)
  paid_on       date,                                                                -- set => status bezahlt (trigger)
  paid_by       text check (paid_by in ('S', 'A')),
  belongs_to    text not null default 'B' check (belongs_to in ('S', 'A', 'B')),     -- B = shared by split_s
  split_s       numeric(5,2) check (split_s between 0 and 100),                      -- Sebastian's share in %, null = settings.split_default_s
  tax_relevant  boolean not null default false,
  receipt_url   text,
  note          text,
  seed_key      text,                                                                -- set by content packages (seed merge)
  seed_snapshot jsonb,                                                               -- seed values as last applied
  sort          int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists costs_task_idx on public.costs (task_id);
create index if not exists costs_due_idx  on public.costs (due_on);
create unique index if not exists costs_seed_key_idx on public.costs (seed_key);   -- NULLs never conflict

-- ---------------------------------------------------------------------
--  recurring: monthly running costs, old apartments vs. new one
-- ---------------------------------------------------------------------
create table if not exists public.recurring (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  amount_s      numeric(10,2),   -- per month, Sebastian's apartment today
  amount_a      numeric(10,2),   -- per month, Anna's apartment today
  amount_n      numeric(10,2),   -- per month, new apartment
  note          text,
  seed_key      text,
  seed_snapshot jsonb,
  sort          int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists recurring_seed_key_idx on public.recurring (seed_key);

-- ---------------------------------------------------------------------
--  triggers: updated_at; paid_on => bezahlt; due_on defaults to the task deadline on insert
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['costs', 'recurring'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

create or replace function public.costs_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base text;
  off  int;
begin
  -- a payment date settles the row
  if new.paid_on is not null then
    new.status := 'bezahlt';
  end if;
  -- default due date = deadline of the task (einzugstermin + offset_days), only when both are known
  if tg_op = 'INSERT' and new.due_on is null and new.task_id is not null then
    select value #>> '{}' into base from public.settings where key = 'einzugstermin';
    select offset_days into off from public.tasks where id = new.task_id;
    if base ~ '^\d{4}-\d{2}-\d{2}$' and off is not null then
      new.due_on := base::date + off;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists costs_before_write on public.costs;
create trigger costs_before_write before insert or update on public.costs
  for each row execute function public.costs_before_write();

-- ---------------------------------------------------------------------
--  RLS like subtasks: allowed people read/insert/update/delete, nobody else sees a row
-- ---------------------------------------------------------------------
alter table public.costs     enable row level security;
alter table public.recurring enable row level security;

do $$
declare t text; op text;
begin
  foreach t in array array['costs', 'recurring'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_allowed())', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_allowed())', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_allowed()) with check (public.is_allowed())', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_allowed())', t || '_delete', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
--  realtime
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['costs', 'recurring'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
alter table public.costs     replica identity full;
alter table public.recurring replica identity full;

-- ---------------------------------------------------------------------
--  settings: new keys (existing values are kept)
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
  ('move_out_s',      'null'::jsonb),   -- Auszug Sebastian (date), Grundlage der berechneten Doppelmiete in 007
  ('move_out_a',      'null'::jsonb),   -- Auszug Anna
  ('split_default_s', '50'::jsonb),     -- Standardanteil Sebastian in % bei belongs_to = B
  ('buffer_pct',      '20'::jsonb)      -- Puffersatz in %
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
--  costs_summary: the one counting rule for 007 and for Claude (export)
--  counts: status beauftragt/faellig/bezahlt; geschaetzt only while no row of the same task is
--  beauftragt or further (buffer rows, task_id null, always count); angebot never counts (history).
--  planned_total = counted einmalig · paid = counted einmalig & bezahlt · refunds_expected = counted
--  rueckfluss · buffer = counted einmalig with task_id null · net = planned_total - refunds_expected
--  security_invoker: the view runs with the caller's rights, so RLS on costs applies.
-- ---------------------------------------------------------------------
create or replace view public.costs_summary with (security_invoker = true) as
with counted as (
  select c.*
  from public.costs c
  where c.status in ('beauftragt', 'faellig', 'bezahlt')
     or (c.status = 'geschaetzt' and (
           c.task_id is null
           or not exists (select 1 from public.costs o
                          where o.task_id = c.task_id and o.status in ('beauftragt', 'faellig', 'bezahlt'))))
)
select
  (select sum(amount) from counted where kind = 'einmalig')                          as planned_total,
  (select sum(amount) from counted where kind = 'einmalig' and status = 'bezahlt')   as paid,
  (select sum(amount) from counted where kind = 'rueckfluss')                        as refunds_expected,
  (select sum(amount) from counted where kind = 'einmalig' and task_id is null)      as buffer,
  (select sum(amount) from counted where kind = 'einmalig')
    - coalesce((select sum(amount) from counted where kind = 'rueckfluss'), 0)       as net;

-- ---------------------------------------------------------------------
--  export for Claude: costs, recurring and the summary travel with the state
-- ---------------------------------------------------------------------
create or replace function public.export_state(token text, apikey text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select value #>> '{}' into expected from public.settings where key = 'export_token';
  if expected is null or token is null or token <> expected then
    raise exception 'invalid export token' using errcode = '42501';  -- -> HTTP 403
  end if;

  return jsonb_build_object(
    'exported_at',   now(),
    'einzugstermin', (select value from public.settings where key = 'einzugstermin'),
    'seed_version',  (select value from public.settings where key = 'seed_version'),
    'phases',        coalesce((select value from public.settings where key = 'phases'), '[]'::jsonb),
    'settings',      (select jsonb_object_agg(key, value) from public.settings
                      where key in ('move_out_s', 'move_out_a', 'split_default_s', 'buffer_pct')),
    'tasks', coalesce((
      select jsonb_agg(
        (to_jsonb(t) - 'seed_snapshot' - 'deleted_at')
        || jsonb_build_object(
          'subtasks', coalesce((
            select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'done', s.done, 'sort', s.sort)
                             order by s.sort, s.created_at)
            from public.subtasks s where s.task_id = t.id
          ), '[]'::jsonb),
          'comments', coalesce((
            select jsonb_agg(jsonb_build_object('id', c.id, 'author', c.author, 'body', c.body, 'created_at', c.created_at)
                             order by c.created_at)
            from public.comments c where c.task_id = t.id
          ), '[]'::jsonb)
        )
        order by t.phase, t.sort, t.offset_days, t.id
      )
      from public.tasks t
      where t.deleted_at is null
    ), '[]'::jsonb),
    'costs', coalesce((
      select jsonb_agg(to_jsonb(c) - 'seed_snapshot' order by c.sort, c.due_on nulls last, c.created_at)
      from public.costs c
    ), '[]'::jsonb),
    'recurring', coalesce((
      select jsonb_agg(to_jsonb(r) - 'seed_snapshot' order by r.sort, r.created_at)
      from public.recurring r
    ), '[]'::jsonb),
    'costs_summary', (select to_jsonb(s) from public.costs_summary s)
  );
end;
$$;

-- Show the result of this run.
select 'ok' as status,
       (select count(*) from public.costs) as costs_rows,
       (select count(*) from public.recurring) as recurring_rows,
       (select count(*) from public.settings where key in ('move_out_s', 'move_out_a', 'split_default_s', 'buffer_pct')) as new_settings,
       (select row_to_json(s) from public.costs_summary s) as costs_summary;
