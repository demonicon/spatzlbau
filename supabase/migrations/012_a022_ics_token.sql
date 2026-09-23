-- Auftrag 022 (docs/changes/022-kalender-abo.md): Kalender-Abo.
-- Ein einziger Schlüssel: settings.ics_token. Er ist das ganze Geheimnis hinter der Abo-Adresse;
-- die Edge Function "ics" liest ihn mit der Service-Role und vergleicht ihn mit dem Token aus der
-- URL. Erzeugt wird er von der App, wenn die Rahmendaten das erste Mal geöffnet werden.
-- Additiv: die 1.1-App auf main liest den Schlüssel nicht und merkt nichts davon.

insert into public.settings (key, value) values ('ics_token', 'null'::jsonb)
on conflict (key) do nothing;
