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
- Farb-Tokens: Text nur mit Tokens, die auf `--paper` und Weiß mindestens 4,5:1 erreichen (`--ink`, `--ink-2`, `--ink-3`, `--danger`, Owner-Farben auf ihren Flächen). `--mark-deep` nie für Text; Tokens unter 4,5:1 (`--line`, `--line-dash`, `--mark`, Hintergründe) nur für Rahmen und Flächen.
- Jede Datenänderung geht feldgenau über Supabase (`update` einzelner Spalten/Zeilen), nie den Gesamtstand überschreiben.
- `seed.json` ist die einzige Quelle für Stammaufgaben und Beratungstexte. Inhaltsänderungen = Seed ändern + `scripts/seed.mjs` ausführen (merge, nie destruktiv).
- Secrets: `.env` lokal (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), in `.gitignore`. Anon-Key darf ins Repo. Seit Auftrag 010 kein Export-Token mehr – Claude im Chat liest über den Supabase-Connector.
- Schema-Änderungen als neue Datei in `supabase/migrations/NNN_aXXX_<thema>.sql` (NNN fortlaufend, XXX = Nummer des Änderungsauftrags, z. B. `005_a004_costs.sql`); `schema.sql` bleibt der Gesamtstand für Neueinrichtung. Die Migrationen 001–004 stammen von vor dieser Regel und behalten ihre Namen.
- Commit-Messages: Präfix `feat:`, `fix:`, `content:`, `chore:`. Kleine Commits.
- Vor dem Push: `index.html` lokal öffnen (Live-Server) und auf ~380 px prüfen.

## Preview-Deploy (Auftrag 010)
- Zwei Ziele, ein Pages-Workflow, eine Datenbank: `main` → `/`, Branch `preview` → `/preview/`. Jeder Deploy baut beide neu (der jeweils andere Branch wird mitgecheckt, sonst würde ein Push den anderen Pfad löschen).
- Cloud-Sitzungen (ohne direkten Kontakt zu Sebastian) mergen ihre Branches nach `preview`, nicht nach `main`. Sebastian prüft `/preview/` am Handy (erkennbar am Hinweis „Vorschau“ in der Statuszeile) und merged danach selbst `preview` → `main`.
- Lokale Sitzungen mit Sebastian im Chat mergen wie gehabt direkt nach `main`, sobald er zustimmt.

## Tests gegen die Live-Datenbank
- Tests, die als echte Person (Sebastian oder Anna) eingeloggt laufen oder in die Live-Datenbank schreiben, werden **vorher angesagt** – nicht nebenbei erledigt. Lesende Abfragen und in Transaktionen zurückgerollte Migrationsprüfungen sind davon nicht betroffen.
- Testdaten werden danach entfernt und der Nachweis gezeigt (Abfrage mit Ergebnis, nicht nur die Behauptung). Das gilt auch für Nebenwirkungen: `last_seen_version`, `last_visit_at`, `seen_comments`, `done_by`, `status`, Briefing-Felder, `settings`-Schlüssel.
- Jede Änderung am Nutzerstand steht im Bericht – auch die, die bewusst stehen bleibt, mit Begründung.
- Sicherer Weg, wo möglich: Zustände im Browser simulieren (nur `state`/`ui` setzen, nichts schreiben) statt echte Zeilen anzufassen.

## Definition of Done pro Aufgabe
- Funktioniert eingeloggt als beide Personen (zwei Browserprofile)
- Realtime-Update sichtbar
- Keine Konsolenfehler
- `SETUP.md` / `BRIEFING.md` angepasst, falls Verhalten oder Setup sich ändern

## Was du nicht tust
- Konzept oder Datenmodell eigenmächtig umbauen – Rückfrage an Sebastian
- Service-Role-Key oder E-Mail-Adressen committen
- Offline-Sync bauen (bewusst außerhalb des Scopes)
