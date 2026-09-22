-- docs/changes/009 – "Seit deinem letzten Besuch".
-- Three additive columns, no data is changed:
--   allowlist.last_visit_at  when this person last left the app (null = never been here)
--   allowlist.seen_comments  ids of the new comments this person has already opened
--   tasks.done_by            who ticked the task off – needed for "2 Aufgaben erledigt",
--                            which must not count what the person did themselves
-- Run in the Supabase SQL editor. Safe to run twice.

alter table public.allowlist add column if not exists last_visit_at timestamptz;
alter table public.allowlist add column if not exists seen_comments jsonb not null default '[]'::jsonb;

alter table public.tasks add column if not exists done_by text;
alter table public.tasks drop constraint if exists tasks_done_by_check;
alter table public.tasks add constraint tasks_done_by_check check (done_by in ('S', 'A'));

-- Each person writes exactly these three columns of exactly their own row.
-- The row policy (allowlist_update_own) stays as it is; only the column grant grows.
revoke update on table public.allowlist from authenticated;
grant update (last_seen_version, last_visit_at, seen_comments) on table public.allowlist to authenticated;

-- check: both people, no visit yet
-- select person, last_visit_at, seen_comments from public.allowlist order by person;
