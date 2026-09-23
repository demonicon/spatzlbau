-- =====================================================================
--  Spatzlbau – Supabase schema (full state for a fresh project)
--
--  How to use (Sebastian):
--    1. Replace the two e-mail addresses in the block marked ">>> HIER ANPASSEN <<<".
--    2. Supabase Dashboard -> SQL Editor -> New query -> paste everything -> Run.
--    3. The last statement prints the export token. Keep it locally (.env),
--       never in the repo.
--
--  The script is idempotent: running it again is safe (tables/policies are
--  created or replaced, existing data and the export token are kept).
--  Later schema changes go into supabase/migrations/NNN_*.sql AND are merged
--  into this file, so this file always represents the complete state.
-- =====================================================================

-- ---------------------------------------------------------------------
--  >>> HIER ANPASSEN <<<   (the only place you need to edit)
-- ---------------------------------------------------------------------
-- Login e-mail addresses of the two people, mapped to their person code.
-- Only these two addresses can read or write anything (see RLS below).
-- Case does not matter; comparison is case-insensitive.
create table if not exists public.allowlist (
  email             text primary key,
  person            text not null check (person in ('S', 'A')),
  last_seen_version text,                                -- changelog.json version last read by this person (005b)
  last_visit_at     timestamptz,                         -- when this person last left the app (009)
  seen_comments     jsonb not null default '[]'::jsonb,  -- new comments this person already opened (009)
  updated_at        timestamptz not null default now()
);
alter table public.allowlist add column if not exists last_seen_version text;
alter table public.allowlist add column if not exists last_visit_at timestamptz;
alter table public.allowlist add column if not exists seen_comments jsonb not null default '[]'::jsonb;
alter table public.allowlist enable row level security;

insert into public.allowlist (email, person) values
  ('sebastian@example.com', 'S'),   -- <- Sebastians Login-Adresse
  ('anna@example.com',      'A')    -- <- Annas Login-Adresse
on conflict (email) do update set person = excluded.person;
-- ---------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------

-- allowlist: exactly two rows, created in the block at the top of this file.

-- Key/value store: einzugstermin, umzugstag, seed_version, phases, umzugstag_kontakte.
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id            text primary key,                       -- seed slug or c_<timestamp>
  phase         int  not null check (phase between 1 and 5),
  title         text not null,
  owner         text not null default 'B' check (owner in ('S', 'A', 'B')),
  offset_days   int  not null default 0,                -- relative to the anchor date, negative = before
  anchor        text not null default 'einzug' check (anchor in ('einzug', 'umzugstag')), -- b1.1
  critical      boolean not null default false,
  type          text not null default 'self' check (type in ('self', 'assist', 'claude')),
  done          boolean not null default false,
  done_by       text check (done_by in ('S', 'A')),      -- who ticked it off (009, "Seit deinem letzten Besuch")
  wait_on       text check (wait_on in ('S', 'A', 'C')),
  status        text check (status in ('briefing', 'claude', 'ergebnis')),   -- delegation, three states (009)
  blocked_by    text[] not null default '{}',           -- task ids
  brief         jsonb not null default '{}'::jsonb,     -- {goal, ctx, result}
  advice        jsonb not null default '{}'::jsonb,     -- {why, how, need, law, traps}
  sort          int  not null default 0,
  seed_snapshot jsonb,                                  -- seed values as last applied; lets the seed merge detect user edits
  deleted_at    timestamptz,                            -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.subtasks (
  id         uuid primary key default gen_random_uuid(),
  task_id    text not null references public.tasks (id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  sort       int  not null default 0,
  seed_key   text,                                      -- set for seeded subtasks so the merge only adds missing ones
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    text not null references public.tasks (id) on delete cascade,
  author     text not null check (author in ('S', 'A', 'C')),
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists done_by text;
alter table public.tasks add column if not exists anchor text not null default 'einzug'
  check (anchor in ('einzug', 'umzugstag'));                                          -- b1.1
update public.tasks set status = 'claude' where status in ('go', 'recherche', 'rueckfragen', 'arbeit');
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check (status in ('briefing', 'claude', 'ergebnis'));
alter table public.tasks drop constraint if exists tasks_done_by_check;
alter table public.tasks add constraint tasks_done_by_check check (done_by in ('S', 'A'));

create index if not exists tasks_phase_idx   on public.tasks (phase, sort);
create index if not exists subtasks_task_idx on public.subtasks (task_id, sort);
create index if not exists comments_task_idx on public.comments (task_id, created_at);
-- costs: one amount per row, attached to a task; task_id null only for the buffer row (docs/changes/004)
create table if not exists public.costs (
  id            uuid primary key default gen_random_uuid(),
  task_id       text references public.tasks (id) on delete cascade,
  label         text not null,
  kind          text not null default 'einmalig' check (kind in ('einmalig', 'rueckfluss', 'ausgleich')),  -- a016
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
alter table public.costs drop constraint if exists costs_kind_check;
alter table public.costs add constraint costs_kind_check
  check (kind in ('einmalig', 'rueckfluss', 'ausgleich'));                            -- a016

create index if not exists costs_task_idx on public.costs (task_id);
create index if not exists costs_due_idx  on public.costs (due_on);
create unique index if not exists costs_seed_key_idx on public.costs (seed_key);   -- NULLs never conflict

-- recurring: monthly running costs, old apartments vs. new one (docs/changes/004)
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


-- Seeded subtasks are identified by (task_id, seed_key); makes the seed merge idempotent and
-- race-safe (upsert on_conflict). Not partial: PostgREST cannot target partial indexes; NULLs never conflict.
create unique index if not exists subtasks_task_seed_key_idx on public.subtasks (task_id, seed_key);

-- ---------------------------------------------------------------------
--  updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- task_changes (a018): Aenderungsprotokoll fuer Frist, Stichtag, Zustaendigkeit und Titel.
-- Gelesen wird es von "Seit du zuletzt da warst"; geschrieben ausschliesslich vom Trigger.
create table if not exists public.task_changes (
  id          bigint generated always as identity primary key,
  task_id     text not null references public.tasks(id) on delete cascade,
  field       text not null check (field in ('offset_days', 'anchor', 'owner', 'title')),
  old_value   text,
  new_value   text,
  changed_by  text check (changed_by in ('S', 'A')),
  changed_at  timestamptz not null default now()
);
create index if not exists task_changes_at_idx on public.task_changes (changed_at desc);
create index if not exists task_changes_task_idx on public.task_changes (task_id);

do $$
declare t text;
begin
  foreach t in array array['allowlist', 'settings', 'tasks', 'subtasks', 'comments', 'costs', 'recurring'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

create or replace function public.log_task_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := public.current_person();
begin
  if new.offset_days is distinct from old.offset_days then
    insert into public.task_changes (task_id, field, old_value, new_value, changed_by)
    values (new.id, 'offset_days', old.offset_days::text, new.offset_days::text, who);
  end if;
  if new.anchor is distinct from old.anchor then
    insert into public.task_changes (task_id, field, old_value, new_value, changed_by)
    values (new.id, 'anchor', old.anchor, new.anchor, who);
  end if;
  if new.owner is distinct from old.owner then
    insert into public.task_changes (task_id, field, old_value, new_value, changed_by)
    values (new.id, 'owner', old.owner, new.owner, who);
  end if;
  if new.title is distinct from old.title then
    insert into public.task_changes (task_id, field, old_value, new_value, changed_by)
    values (new.id, 'title', old.title, new.title, who);
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_log_change on public.tasks;
create trigger tasks_log_change after update on public.tasks
  for each row execute function public.log_task_change();

-- costs: paid_on settles the row; due_on defaults to the task deadline on insert (docs/changes/004),
-- now via the task's own anchor date instead of always einzugstermin (bugfix 1.1)
create or replace function public.costs_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base text;
  off  int;
  anc  text;
begin
  -- a payment date settles the row
  if new.paid_on is not null then
    new.status := 'bezahlt';
  end if;
  -- default due date = deadline of the task (anchor date + offset_days), only when both are known
  if tg_op = 'INSERT' and new.due_on is null and new.task_id is not null then
    select offset_days, anchor into off, anc from public.tasks where id = new.task_id;
    if anc = 'umzugstag' then
      select value #>> '{}' into base from public.settings where key = 'umzugstag';
    end if;
    if base is null or base !~ '^\d{4}-\d{2}-\d{2}$' then
      select value #>> '{}' into base from public.settings where key = 'einzugstermin';
    end if;
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
--  Auth helpers (security definer = run as table owner, bypass RLS)
-- ---------------------------------------------------------------------

-- True if the logged-in user's e-mail is on the allowlist.
create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Person code ('S' / 'A') of the logged-in user, null if not allowed.
create or replace function public.current_person()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select person from public.allowlist
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

revoke execute on function public.is_allowed()      from public, anon;
revoke execute on function public.current_person() from public, anon;
grant  execute on function public.is_allowed()      to authenticated;
grant  execute on function public.current_person() to authenticated;

-- ---------------------------------------------------------------------
--  Row Level Security
--  Rule of thumb: only allowlisted, logged-in users see or change anything.
-- ---------------------------------------------------------------------
alter table public.allowlist enable row level security;
alter table public.settings  enable row level security;
alter table public.tasks     enable row level security;
alter table public.subtasks  enable row level security;
alter table public.comments  enable row level security;

-- allowlist: readable for allowed users (so the app can map e-mail -> person). The only writes from
-- the app: each person updates their own row's last_seen_version (005b) and, since 009,
-- last_visit_at / seen_comments (column grant + row policy).
drop policy if exists allowlist_select on public.allowlist;
create policy allowlist_select on public.allowlist
  for select to authenticated using (public.is_allowed());

-- task_changes (a018): lesen ja, schreiben nur der Trigger.
alter table public.task_changes enable row level security;
drop policy if exists task_changes_select on public.task_changes;
create policy task_changes_select on public.task_changes for select using (public.is_allowed());
revoke insert, update, delete on table public.task_changes from authenticated;
grant select on table public.task_changes to authenticated;

revoke update on table public.allowlist from authenticated;
grant update (last_seen_version, last_visit_at, seen_comments) on table public.allowlist to authenticated;

drop policy if exists allowlist_update_own on public.allowlist;
create policy allowlist_update_own on public.allowlist
  for update to authenticated
  using (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')))      -- (select …): once per statement
  with check (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')));

-- settings: allowed users read/write everything.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings
  for select to authenticated using (public.is_allowed());

drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings
  for insert to authenticated with check (public.is_allowed());

drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings
  for update to authenticated
  using (public.is_allowed())
  with check (public.is_allowed());

-- tasks: read/insert/update for allowed users. No hard delete from the app (soft delete via deleted_at).
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select to authenticated using (public.is_allowed());

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert to authenticated with check (public.is_allowed());

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update to authenticated using (public.is_allowed()) with check (public.is_allowed());

-- subtasks: full access for allowed users.
drop policy if exists subtasks_select on public.subtasks;
create policy subtasks_select on public.subtasks
  for select to authenticated using (public.is_allowed());

drop policy if exists subtasks_insert on public.subtasks;
create policy subtasks_insert on public.subtasks
  for insert to authenticated with check (public.is_allowed());

drop policy if exists subtasks_update on public.subtasks;
create policy subtasks_update on public.subtasks
  for update to authenticated using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists subtasks_delete on public.subtasks;
create policy subtasks_delete on public.subtasks
  for delete to authenticated using (public.is_allowed());

-- comments: allowed users read all; a new comment must carry the author's own person code
-- ('C' comments are only written by Claude Code via service role, which bypasses RLS).
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select to authenticated using (public.is_allowed());

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert to authenticated with check (public.is_allowed() and author = public.current_person());

drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments
  for update to authenticated using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete to authenticated using (public.is_allowed());

-- costs / recurring: like subtasks (docs/changes/004)
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
--  costs_summary: the one counting rule for 007 and for Claude (export)
--  counts: status beauftragt/faellig/bezahlt; geschaetzt only while no row of the same task is
--  beauftragt or further (buffer rows, task_id null, always count); angebot never counts (history).
--  planned_total = counted einmalig · paid = counted einmalig & bezahlt · refunds_expected = counted
--  rueckfluss · buffer = counted einmalig with task_id null · double_rent = the calculated double
--  rent (a016) · net = planned_total + double_rent - refunds_expected. kind 'ausgleich' (a payment
--  between the two people) never counts here - it only moves the balance.
--  security_invoker: the view runs with the caller's rights, so RLS on costs applies.
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

-- ---------------------------------------------------------------------
--  Realtime: broadcast changes of these tables to logged-in clients
--  (RLS is applied to the change events, so only allowed users receive them)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings', 'tasks', 'subtasks', 'comments', 'costs', 'recurring'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Delete events then carry the full old row (task_id), not only the id.
alter table public.subtasks  replica identity full;
alter table public.comments  replica identity full;
alter table public.costs     replica identity full;
alter table public.recurring replica identity full;

-- task_changes (a018) is append-only: realtime carries the new row, nothing else changes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_changes'
  ) then
    alter publication supabase_realtime add table public.task_changes;
  end if;
end $$;

-- ---------------------------------------------------------------------
--  Initial data
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
  ('einzugstermin',   'null'::jsonb),
  ('umzugstag',       'null'::jsonb),   -- b1.1: eigenes Datum, faellt zurueck auf einzugstermin solange leer
  ('seed_version',    '0'::jsonb),
  ('phases',          '[]'::jsonb),
  ('move_out_s',      'null'::jsonb),   -- Auszug Sebastian (date), Grundlage der berechneten Doppelmiete in 007
  ('move_out_a',      'null'::jsonb),   -- Auszug Anna
  ('split_default_s', '50'::jsonb),     -- Standardanteil Sebastian in % bei belongs_to = B
  ('buffer_pct',      '20'::jsonb)      -- Puffersatz in %
on conflict (key) do nothing;

-- Show the result of this run.
select 'ok' as status,
       (select count(*) from public.allowlist) as allowlisted_people;
