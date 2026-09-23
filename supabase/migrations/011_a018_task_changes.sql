-- Auftrag 018 (docs/changes/018-dashboard.md): "Seit du zuletzt da warst".
-- Ein Änderungsprotokoll für die vier Felder, die die andere Person wirklich betreffen:
-- Frist (offset_days), Stichtag (anchor), Zuständigkeit (owner) und Titel. Ein Trigger schreibt
-- je geändertem Feld eine Zeile mit altem und neuem Wert.
-- Additiv und idempotent: die 1.1-App auf main kennt die Tabelle nicht und läuft unverändert
-- weiter. Die 2.0-App fragt sie einzeln ab, verträgt die Fehlermeldung und lässt den Block weg,
-- solange diese Migration nicht eingespielt ist.

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

-- Der Trigger schreibt als Eigentümer (security definer): die beiden dürfen die Tabelle lesen,
-- schreiben tut ausschließlich er. public.current_person() steht schon in schema.sql.
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

-- RLS wie überall: nur die beiden Eingeloggten lesen, niemand schreibt von Hand.
alter table public.task_changes enable row level security;
drop policy if exists task_changes_select on public.task_changes;
create policy task_changes_select on public.task_changes for select using (public.is_allowed());
revoke insert, update, delete on table public.task_changes from authenticated;
grant select on table public.task_changes to authenticated;

-- Realtime an, damit das andere Gerät die Zeile sofort sieht.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_changes'
  ) then
    alter publication supabase_realtime add table public.task_changes;
  end if;
end $$;
