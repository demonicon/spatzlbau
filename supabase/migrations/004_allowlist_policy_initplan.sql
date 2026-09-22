-- Applied 2026-09-22 (docs/changes/008). Evaluate auth.jwt() once per statement instead of once
-- per row (Supabase advisor lint auth_rls_initplan).
drop policy if exists allowlist_update_own on public.allowlist;
create policy allowlist_update_own on public.allowlist
  for update to authenticated
  using (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')))
  with check (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')));
