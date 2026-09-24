-- Auftrag 032 (docs/changes/032-entscheidungen.md): ein Kommentar wird zur Entscheidung, die
-- andere Person bestaetigt mit ihrem eigenen Haekchen. Additiv auf comments.

alter table public.comments add column if not exists decision boolean not null default false;
alter table public.comments add column if not exists ack_s timestamptz;
alter table public.comments add column if not exists ack_a timestamptz;
alter table public.comments add column if not exists superseded_by uuid references public.comments(id);
create index if not exists comments_decision_idx on public.comments (task_id) where decision;

-- Haekchen und "ersetzt" sind serverseitig abgeleitet, nie von Hand gesetzt (siehe Auftrag,
-- "Nicht im Umfang"): decision -> true setzt das Haekchen des Autors (S/A; C markiert nie),
-- decision -> false nullt beide; sind beide Haekchen gesetzt, ersetzt diese Zeile alle aelteren
-- bestaetigten Entscheidungen derselben Aufgabe. Wer sein eigenes Haekchen setzt oder zurueck-
-- nimmt, schreibt ack_s/ack_a direkt - das bleibt unangetastet (Client-Regel, kein Autor-Zwang).
create or replace function public.comments_before_write() returns trigger as $$
begin
  if new.author = 'C' then
    new.decision := false; -- Claude markiert nie (Auftrag 032)
  end if;

  if tg_op = 'INSERT' then
    if new.decision then
      if new.author = 'S' then new.ack_s := coalesce(new.ack_s, now()); end if;
      if new.author = 'A' then new.ack_a := coalesce(new.ack_a, now()); end if;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.decision and old.decision is distinct from true then
      if new.author = 'S' then new.ack_s := coalesce(new.ack_s, now()); end if;
      if new.author = 'A' then new.ack_a := coalesce(new.ack_a, now()); end if;
    end if;
  end if;

  if not new.decision then
    new.ack_s := null;
    new.ack_a := null;
    new.superseded_by := null;
  end if;

  if new.decision and new.ack_s is not null and new.ack_a is not null then
    update public.comments
      set superseded_by = new.id
      where task_id = new.task_id and decision and ack_s is not null and ack_a is not null
        and superseded_by is null and id <> new.id and created_at < new.created_at;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists comments_before_write on public.comments;
create trigger comments_before_write
  before insert or update on public.comments
  for each row execute function public.comments_before_write();
