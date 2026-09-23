-- Bugfix 2.0.2 (docs/changes/014 #5): log_task_change() is a trigger function with security definer
-- (Auftrag 018). Postgres grants EXECUTE to public by default, so the Supabase linter reports it
-- as callable via /rest/v1/rpc for anon and authenticated. Nobody has to call it: the trigger
-- tasks_log_change runs it as the owner, and EXECUTE is only checked when the trigger is created.
-- Nothing else changes; the trigger keeps writing task_changes.
revoke execute on function public.log_task_change() from public, anon, authenticated;
