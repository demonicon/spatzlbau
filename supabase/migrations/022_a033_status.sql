-- Auftrag 033 (docs/changes/033-anfragen.md): eine Anfrage ist eine Aufgabe mit type 'anfrage'
-- und einer vierten Stufe 'entschieden'. Beide Checks werden nur erweitert - jeder bisher
-- erlaubte Wert bleibt erlaubt, keine Zeile muss angepasst werden.

alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check
  check (type in ('self', 'assist', 'claude', 'anfrage'));

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('briefing', 'claude', 'ergebnis', 'entschieden'));
