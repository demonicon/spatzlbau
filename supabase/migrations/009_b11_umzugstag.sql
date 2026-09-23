-- Bugfix 1.1 (docs/changes/bugfix-1-1-umzugstag.md): Umzugstag getrennt vom Einzug.
-- 1. Januar (aktueller einzugstermin) ist ein Feiertag - kein Halteverbot, Feiertagsruhe, Firmen
-- mit Aufschlag. Der tatsächliche Umzugstag ist ein zweites, unabhängiges Datum; Aufgaben rechnen
-- ab dem einen oder dem anderen (tasks.anchor), nie mehr pauschal ab einzugstermin.
-- Idempotent, wie das ganze Schema: mehrfaches Ausführen ist sicher.

-- tasks.anchor: welches Datum die Fälligkeit dieser Aufgabe verankert. Default 'einzug' - jede
-- bestehende Aufgabe bleibt unverändert am Einzugstermin, bis ein Inhaltspaket sie umhängt.
alter table public.tasks add column if not exists anchor text not null default 'einzug'
  check (anchor in ('einzug', 'umzugstag'));

-- settings-Schlüssel für das zweite Datum, leer bis Sebastian es einträgt (Fallback: einzugstermin).
insert into public.settings (key, value) values
  ('umzugstag', 'null'::jsonb)
on conflict (key) do nothing;

-- Kostenzeilen: due_on defaultet beim Anlegen weiterhin auf die Fälligkeit der Aufgabe - jetzt
-- nach deren Anker statt immer nach einzugstermin. Ist der Anker 'umzugstag', aber umzugstag noch
-- leer, greift derselbe Fallback wie in der App: einzugstermin gilt dann als Umzugstag.
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
