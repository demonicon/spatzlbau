# CLAUDE.md – Spatzlbau (Umzugs-PWA)

Lies zuerst `BRIEFING.md` (Konzept, Datenmodell, Sichten). Erledigtes steht in `docs/history.md`, offene Ideen ohne Auftrag in `docs/backlog.md`.

## Rollen
Claude im Chat: Konzept, Inhalte, Reviews – Änderungen kommen von dort als Auftrag. Du (Claude Code): Umsetzung, Deployment, Bugfixes. Sebastian: Product Owner, testet mit Anna.

## Aufträge
`docs/changes/NNN-kurzname.md` ist die verbindliche Spezifikation; Status beim Abschluss auf „umgesetzt" setzen, offene Punkte dort notieren.

## Freeze und Meilensteine (seit Auftrag 015)
Nach 1.0 nur noch Neben-/Patch-Versionen für Bugfixes; einen neuen Meilenstein eröffnet nur Sebastian. Bugfix = etwas, das vorher funktionierte und jetzt nicht mehr, oder falsch gespeicherte/gezeigte Daten – alles andere ist ein Feature (`docs/backlog.md`). `CLAUDE.md`/`BRIEFING.md` nur mit ausdrücklicher Bestätigung ändern.

## Konventionen
Vanilla JS, ES-Module, kein Build-Step, kein Framework, keine neuen Abhängigkeiten ohne Rückfrage; Supabase-JS per CDN-ESM-Import. UI-Texte Deutsch, Code/Kommentare Englisch, kein Denglisch in Buttons. Mobile-first, Tap-Ziele ≥ 44 px, keine `confirm`/`prompt`/`alert`.

## Secrets
`.env` lokal (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), in `.gitignore`; Anon-Key darf ins Repo.

## Vor jedem Commit
`npm run check` (`scripts/check.mjs`); der Bericht nennt das Ergebnis. `git push` ist kein Deploy – nach jedem Push auf `preview` oder `main`: Run abwarten, Live-Version prüfen.

## Modell
Sonnet, Effort standard als Default. Opus nur bei Aufwand L oder einem Layout-Umbau.

## Schreibtests an der Live-Datenbank
Vorher ansagen, nicht nebenbei erledigen; danach Testdaten entfernen und Nachweis zeigen. Details in `rules/tests.md`.

## Changelog
Sichtbare Änderung = `changelog.json`-Eintrag, sonst gilt der PR als unvollständig. Regeln in `rules/changelog.md`.

## Session-Regel (seit Auftrag 037)
Eine Session je Auftrag. Vor `/auftrag`: `/clear`, dann `/rename <NNN>`. Mehrere Aufträge = mehrere Sessions nacheinander, nie in einer.

## Kompaktierung
Beim Kompaktieren geänderte Dateien, Testbefehle und den Stand der Akzeptanzkriterien behalten.

## Definition of Done
`npm run check` grün · Workflow-Lauf grün · Live-Version per `curl` geprüft · funktioniert eingeloggt als beide Personen (zwei Browserprofile) · Realtime-Update sichtbar · keine Konsolenfehler · `SETUP.md`/`BRIEFING.md` nachgezogen, falls Verhalten oder Setup sich ändern.

## Was du nicht tust
Konzept oder Datenmodell eigenmächtig umbauen – Rückfrage an Sebastian. Service-Role-Key oder E-Mail-Adressen committen. Offline-Sync bauen (bewusst außerhalb des Scopes).

## Regeln
@.claude/rules/design.md
@.claude/rules/db.md
@.claude/rules/git.md
@.claude/rules/tests.md
@.claude/rules/report.md
@.claude/rules/changelog.md
