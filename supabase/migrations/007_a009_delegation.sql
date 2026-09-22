-- docs/changes/009 – Delegation an Claude auf drei Zustände.
--   briefing → claude → ergebnis
-- Die bisherigen Zwischenzustände (go, recherche, rueckfragen, arbeit) werden zu 'claude';
-- Rückfragen und Antworten sind ab jetzt normale Kommentare.
-- Run in the Supabase SQL editor. Safe to run twice.

update public.tasks set status = 'claude'
 where status in ('go', 'recherche', 'rueckfragen', 'arbeit');

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('briefing', 'claude', 'ergebnis'));

-- check: only the three values are left
-- select status, count(*) from public.tasks where status is not null group by status order by status;
