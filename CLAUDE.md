# CLAUDE.md – Umzugs-PWA

Lies zuerst `BRIEFING.md`. Es enthält Konzept, Datenmodell, technische Entscheidungen und die Setup-Reihenfolge. Diese Datei enthält nur Arbeitskonventionen.

## Rollen
- **Claude im Chat:** Konzept, Inhalte (Seed), Reviews, Delegations-Schleife mit den Nutzern. Änderungen kommen von dort als klarer Auftrag.
- **Du (Claude Code):** Umsetzung, Deployment, Datenbank-Skripte, Bugfixes, UX/UI-Iterationen.
- **Sebastian:** Product Owner, klickt Supabase/GitHub-Setup, testet mit Anna.

## Konventionen
- Vanilla JS, ES-Module, kein Build-Step, kein Framework. Keine neuen Abhängigkeiten ohne Rückfrage; Supabase-JS per CDN-ESM-Import.
- UI-Texte Deutsch, Code und Kommentare Englisch. Kein Denglisch in Buttons.
- Mobile-first, Tap-Ziele ≥ 44 px, keine `confirm`/`prompt`/`alert`.
- Jede Datenänderung geht feldgenau über Supabase (`update` einzelner Spalten/Zeilen), nie den Gesamtstand überschreiben.
- `seed.json` ist die einzige Quelle für Stammaufgaben und Beratungstexte. Inhaltsänderungen = Seed ändern + `scripts/seed.mjs` ausführen (merge, nie destruktiv).
- Secrets: `.env` lokal (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPORT_TOKEN`), in `.gitignore`. Anon-Key darf ins Repo.
- Schema-Änderungen als neue Datei in `supabase/migrations/NNN_*.sql`, `schema.sql` bleibt der Gesamtstand für Neueinrichtung.
- Commit-Messages: Präfix `feat:`, `fix:`, `content:`, `chore:`. Kleine Commits.
- Vor dem Push: `index.html` lokal öffnen (Live-Server) und auf ~380 px prüfen.

## Definition of Done pro Aufgabe
- Funktioniert eingeloggt als beide Personen (zwei Browserprofile)
- Realtime-Update sichtbar
- Keine Konsolenfehler
- `SETUP.md` / `BRIEFING.md` angepasst, falls Verhalten oder Setup sich ändern

## Was du nicht tust
- Konzept oder Datenmodell eigenmächtig umbauen – Rückfrage an Sebastian
- Export-Token, Service-Role-Key oder E-Mail-Adressen committen
- Offline-Sync bauen (bewusst außerhalb des Scopes)
