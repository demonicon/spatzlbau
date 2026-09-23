-- Auftrag 024 (docs/changes/024-claude-anbindung.md): Takt-Anzeige für die Delegation an Claude.
-- settings.claude_last_run haelt den Zeitpunkt des letzten stuendlichen Laufs (der stuendliche
-- Task selbst schreibt ihn, ausserhalb dieses Repos). Der Schluessel kann schon existieren, wenn
-- Claude ihn ueber den Supabase-Connector vor dieser Migration gesetzt hat - "do nothing" laesst
-- diesen Wert dann unangetastet.
-- Additiv: die 1.1-App auf main kennt den Schluessel nicht und liest ihn nie ab.
-- brief.requested_at/requested_by liegen im bestehenden jsonb `tasks.brief` - keine Spaltenaenderung.

insert into public.settings (key, value) values ('claude_last_run', 'null'::jsonb)
on conflict (key) do nothing;
