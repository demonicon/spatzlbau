-- Bugfix 2.0.3 (docs/changes/014b): a paid row could not be moved back to geschätzt/fest.
-- costs_before_write() set status := 'bezahlt' whenever paid_on was not null - on every update,
-- so a status change that left paid_on in place was overwritten. Now only a payment date that is
-- newly set settles the row; a status moved away from 'bezahlt' clears paid_on and paid_by, so no
-- row is ever "geschätzt with a payment date". Rückfluss uses the same columns ('bezahlt' reads
-- as erhalten), so it follows the same rule. The due_on default on insert is unchanged.
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
  -- a newly set payment date settles the row
  if new.paid_on is not null
     and (tg_op = 'INSERT' or new.paid_on is distinct from old.paid_on) then
    new.status := 'bezahlt';
  -- status moved away from bezahlt while the payment date stayed: the server tidies up
  elsif new.status is distinct from 'bezahlt' and new.paid_on is not null then
    new.paid_on := null;
    new.paid_by := null;
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
