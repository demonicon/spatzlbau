-- Applied 2026-09-22 (docs/changes/005b). The version of changelog.json a person has last read,
-- per person, not per device.
alter table public.allowlist add column if not exists last_seen_version text;

-- Each person may update exactly one column of exactly their own row.
revoke update on table public.allowlist from authenticated;
grant update (last_seen_version) on table public.allowlist to authenticated;

drop policy if exists allowlist_update_own on public.allowlist;
create policy allowlist_update_own on public.allowlist
  for update to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
