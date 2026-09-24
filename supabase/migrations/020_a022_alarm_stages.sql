-- Auftrag 022 (docs/changes/022-kalender-abo.md, Ergänzung 24.09. – Fristen-Wecker): je Person
-- eigene Erinnerungsstufen für den Kalender-Abo (3 Tage / 1 Tag / am Tag vorher). Die Function
-- "ics" liest die Stufen der angefragten Person; das Default entspricht dem bisherigen,
-- fest verdrahteten Verhalten (Sebastian alle drei, Anna zwei) - additiv, ändert nichts am
-- Verhalten, bis jemand die Segmente in den Rahmendaten anfasst.

insert into public.settings (key, value) values ('alarm_stages', '{"S":[3,1,0],"A":[1,0]}'::jsonb)
on conflict (key) do nothing;
