-- Applied 2026-09-13. Seeded subtasks are identified by (task_id, seed_key); the unique
-- index makes the seed merge idempotent and race-safe (upsert with ignore-duplicates).
create unique index if not exists subtasks_task_seed_key_idx
  on public.subtasks (task_id, seed_key) where seed_key is not null;
