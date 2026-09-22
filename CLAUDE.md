# CLAUDE.md – Spatzlbau (Umzugs-PWA)

Lies zuerst `BRIEFING.md`. Es enthält Konzept, Datenmodell, technische Entscheidungen und die Setup-Reihenfolge. Diese Datei enthält nur Arbeitskonventionen.

## Rollen
- **Claude im Chat:** Konzept, Inhalte (Seed), Reviews, Delegations-Schleife mit den Nutzern. Änderungen kommen von dort als klarer Auftrag.
- **Du (Claude Code):** Umsetzung, Deployment, Datenbank-Skripte, Bugfixes, UX/UI-Iterationen.
- **Sebastian:** Product Owner, klickt Supabase/GitHub-Setup, testet mit Anna.

## Änderungsaufträge
- Änderungsaufträge liegen in `docs/changes/NNN-kurzname.md` (fortlaufend nummeriert, Vorlage: Warum / Was sich ändert / Was Sebastian tut / Akzeptanzkriterien / Handy-Check). Sie kommen aus dem Chat und sind die verbindliche Spezifikation.
- Umsetzung auf einem Branch `feature/<kurzname>`; nach Abnahme Merge in `main`. Beim Abschluss den Status im Auftrag auf „umgesetzt“ setzen und offene Punkte dort notieren.
- Betrifft ein Auftrag Verhalten oder Setup, werden `SETUP.md` / `BRIEFING.md` im selben Branch nachgezogen.

## Changelog (`changelog.json`)
- Jeder PR, der etwas Sichtbares ändert, ergänzt `changelog.json` um einen Eintrag oder erweitert den Eintrag des Tages. Ein PR mit sichtbarer Änderung ohne Changelog-Eintrag gilt als unvollständig.
- `version` = Deploy-Datum `JJJJ.MM.TT`, zweiter Deploy am selben Tag `.2`, dritter `.3`. Der erste Eintrag ist die Version, die die App im Footer zeigt (einzige Quelle; der Commit-SHA ist nur Tooltip/Untertitel). Neueste Version zuerst.
- Felder `title` (ein Satz, was die Version für die Nutzer bedeutet), `new` / `improved` / `fixed` (je 0–5 kurze Sätze; leere Listen bleiben leer).
- Testfrage für jeden Satz: *Versteht Anna, was sich für sie beim Benutzen ändert?* Keine Technikbegriffe (kein „Service Worker“, „Refactoring“, „RLS“, „Branch“). Statt „Filter-State wird persistiert“ → „Die App merkt sich, welche Phase du zuletzt offen hattest.“ Rein technische Änderungen ohne sichtbare Wirkung bekommen keinen Eintrag.

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
