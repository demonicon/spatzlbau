-- =====================================================================
--  Umzugs-PWA – Supabase schema (full state for a fresh project)
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
  email      text primary key,
  person     text not null check (person in ('S', 'A')),
  updated_at timestamptz not null default now()
);
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

-- Key/value store: einzugstermin, export_token, seed_version, phases.
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
  offset_days   int  not null default 0,                -- relative to einzugstermin, negative = before
  critical      boolean not null default false,
  type          text not null default 'self' check (type in ('self', 'assist', 'claude')),
  done          boolean not null default false,
  wait_on       text check (wait_on in ('S', 'A', 'C')),
  status        text check (status in ('briefing', 'go', 'recherche', 'rueckfragen', 'arbeit', 'ergebnis')),
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

create index if not exists tasks_phase_idx   on public.tasks (phase, sort);
create index if not exists subtasks_task_idx on public.subtasks (task_id, sort);
create index if not exists comments_task_idx on public.comments (task_id, created_at);
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

do $$
declare t text;
begin
  foreach t in array array['allowlist', 'settings', 'tasks', 'subtasks', 'comments'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

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
--  Anonymous requests get nothing (except the export_state RPC below).
-- ---------------------------------------------------------------------
alter table public.allowlist enable row level security;
alter table public.settings  enable row level security;
alter table public.tasks     enable row level security;
alter table public.subtasks  enable row level security;
alter table public.comments  enable row level security;

-- allowlist: read-only for allowed users (so the app can map e-mail -> person). No writes from the app.
drop policy if exists allowlist_select on public.allowlist;
create policy allowlist_select on public.allowlist
  for select to authenticated using (public.is_allowed());

-- settings: allowed users read/write everything EXCEPT the export token.
-- The token is only reachable via SQL (service role / SQL editor) and rotate_export_token().
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings
  for select to authenticated using (public.is_allowed() and key <> 'export_token');

drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings
  for insert to authenticated with check (public.is_allowed() and key <> 'export_token');

drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings
  for update to authenticated
  using (public.is_allowed() and key <> 'export_token')
  with check (public.is_allowed() and key <> 'export_token');

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

-- ---------------------------------------------------------------------
--  Export for Claude (read-only, token in query string)
--  GET https://<ref>.supabase.co/rest/v1/rpc/export_state?token=<TOKEN>&apikey=<ANON_KEY>
--  (`apikey` is accepted as an optional, ignored parameter in case the API
--   gateway forwards the query string as-is.)
-- ---------------------------------------------------------------------
drop function if exists public.export_state(text);  -- older single-argument signature
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
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_state(text, text) from public;
grant  execute on function public.export_state(text, text) to anon, authenticated;

-- Rotate the export token. Only callable from SQL (service role / SQL editor):
--   select rotate_export_token();
create or replace function public.rotate_export_token()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  t text := encode(gen_random_bytes(24), 'hex');
begin
  insert into public.settings (key, value) values ('export_token', to_jsonb(t))
  on conflict (key) do update set value = excluded.value;
  return t;
end;
$$;

revoke execute on function public.rotate_export_token() from public, anon, authenticated;

-- ---------------------------------------------------------------------
--  Realtime: broadcast changes of these tables to logged-in clients
--  (RLS is applied to the change events, so only allowed users receive them)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings', 'tasks', 'subtasks', 'comments'] loop
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
alter table public.subtasks replica identity full;
alter table public.comments replica identity full;

-- ---------------------------------------------------------------------
--  Initial data
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
  ('einzugstermin', 'null'::jsonb),
  ('seed_version',  '0'::jsonb),
  ('phases',        '[]'::jsonb)
on conflict (key) do nothing;

-- Create the export token once; re-running the script keeps the existing one.
do $$
begin
  if not exists (select 1 from public.settings where key = 'export_token') then
    perform public.rotate_export_token();
  end if;
end;
$$;

-- Show the result of this run.
select 'ok' as status,
       (select count(*) from public.allowlist) as allowlisted_people,
       (select value #>> '{}' from public.settings where key = 'export_token') as export_token;
