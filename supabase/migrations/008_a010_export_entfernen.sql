-- docs/changes/010 point 5 - remove the anonymous export_state() RPC. Claude reads via the
-- Supabase MCP connector now (SETUP.md section 8), so an unauthenticated read-only door with a
-- token in the query string has no purpose anymore.
-- Run in the Supabase SQL editor. Safe to run twice.

drop function if exists public.export_state(text, text);
drop function if exists public.export_state(text); -- older single-argument signature, in case it lingers
drop function if exists public.rotate_export_token();
delete from public.settings where key = 'export_token';

-- the settings policies excluded the token key specifically; without the key, that exclusion
-- is dead weight, so the policies go back to the plain is_allowed() check like every other table
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

-- check: no export_state/rotate_export_token left, no export_token row, no anon grants remain
-- select proname from pg_proc where proname in ('export_state', 'rotate_export_token');
-- select count(*) from public.settings where key = 'export_token';
