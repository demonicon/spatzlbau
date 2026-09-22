# Änderungsauftrag 008b – Härtung, Teil 2: Kontrast, Backup, Aufräumen

Stand: 22.09.2026 · Status: offen · Branch: `feature/haertung-2` · Modell: Sonnet
Nach Merge von 008 (Pinnen, RLS, CSP) starten. Ein PR, keine sichtbare Änderung außer der Farbe, kein Changelog-Eintrag.

## 1. Kontrast

`--ink-3` → `#6b756e` (≈ 4,6:1 auf `--paper` und Weiß). Design-Freigabe liegt vor. Regel in `CLAUDE.md`: `--mark-deep` nie für Text; Tokens unter 4,5:1 nur für Rahmen und Flächen.

## 2. Tägliches Backup

Grund: Supabase Free hat keine automatischen Datenbank-Backups. Ein fehlerhafter Seed-Merge oder ein versehentliches Löschen wäre nicht rückholbar.

- `scripts/backup.mjs`: exportiert alle Tabellen (`allowlist` ohne E-Mails → nur `person` und `last_seen_version`; `settings`, `tasks`, `subtasks`, `comments`, später `costs`, `recurring`) als eine JSON-Datei `backup-<JJJJ-MM-TT>.json`. Nutzt `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` aus der Umgebung.
- `scripts/restore.mjs <datei> --dry`: vergleicht Dump mit Datenbank, meldet Abweichungen pro Tabelle, schreibt nichts. Ohne `--dry`: stellt tabellenweise wieder her, fragt vorher nach Bestätigung im Terminal. Für Notfälle, nicht für den Alltag.
- `.github/workflows/backup.yml`: täglich 03:00 UTC und manuell auslösbar (`workflow_dispatch`); führt `backup.mjs` aus und lädt die Datei als Workflow-Artefakt hoch, Aufbewahrung 30 Tage. Node 20, keine weiteren Abhängigkeiten außer `@supabase/supabase-js` in derselben Version wie das Frontend.
- `SETUP.md`: Abschnitt "Backup" mit den Schritten für Sebastian (unten) und der Wiederherstellung.

## 3. Aufräumen

Tote Exporte in `state.js` entfernen (`runSeedMerge`, `bySort`, `forPerson`).

## Was Sebastian tut (einmalig, ~3 Minuten)

1. GitHub → Repo `spatzlbau` → Settings → Secrets and variables → Actions → "New repository secret": Name `SUPABASE_SERVICE_ROLE_KEY`, Wert aus der lokalen `.env`. Zweites Secret `SUPABASE_URL`.
2. Nach dem Merge: Actions-Tab → Workflow "Backup" → "Run workflow". Nach ~1 Minute unter dem Lauf das Artefakt herunterladen und öffnen: alle Tabellen enthalten?
3. Ab dann läuft es täglich. Kontrolle einmal pro Woche: Actions-Tab, letzter Lauf grün.

## Akzeptanzkriterien

- [ ] Kontrast `--ink-3` ≥ 4,5:1 auf beiden Hintergründen; 380-px-Pixelvergleich zeigt nur die Farbänderung
- [ ] Manueller Backup-Lauf erfolgreich, Artefakt enthält alle Tabellen, keine E-Mail-Adressen im Dump
- [ ] `restore.mjs backup-<datum>.json --dry` gegen die Live-Datenbank: 0 Abweichungen direkt nach dem Backup
- [ ] `CLAUDE.md` (Token-Regel) und `SETUP.md` (Backup) ergänzt
- [ ] Keine Konsolenfehler, Realtime unverändert
