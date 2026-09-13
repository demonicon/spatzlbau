-- Applied 2026-09-13. Partial unique indexes cannot be targeted by PostgREST's on_conflict;
-- use a full one. NULL seed_key (user-created subtasks) never conflicts.
drop index if exists public.subtasks_task_seed_key_idx;
create unique index if not exists subtasks_task_seed_key_idx on public.subtasks (task_id, seed_key);
