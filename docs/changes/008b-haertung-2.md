# Änderungsauftrag 008b – Härtung, Teil 2: Kontrast, Backup, Aufräumen

Stand: 22.09.2026 · Status: deployt 22.09.2026 (Merge 51ff56f, Pages-Lauf 22); erster Backup-Lauf 1 grün, Artefakt per `restore --dry` geprüft: keine Abweichungen · Branch: `feature/haertung-2` · Modell: Sonnet (umgesetzt mit Opus)
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

## Ergänzungen (Sebastian, 22.09.)

- (a) Pages-Workflow: Artefaktname `github-pages-<run_id>-<run_attempt>` in Upload und Deploy – `run_attempt` ist nötig, weil ein Re-Run dieselbe `run_id` behält und genau daran Lauf 19 scheiterte.
- (b) `CLAUDE.md`: Migrationsdateien heißen `NNN_aXXX_<thema>.sql` (XXX = Auftragsnummer); 001–004 behalten ihre Namen.

## Umsetzungsnotizen (Claude Code, 22.09.2026)

- **Kontrast:** `#6b756e` erreicht auf `--paper` (#f4f6f2) nur 4,39:1 (auf Weiß 4,78:1) – unter dem Akzeptanzkriterium. Gewählt: **`#68726b`** (4,59:1 auf Papier, 4,99:1 auf Weiß), die nächstliegende Stufe, die auf beiden Hintergründen ≥ 4,5:1 liegt. 380-px-Vergleich: mit altem Token pixelidentisch zum Stand davor, mit neuem Token nur die Farbpixel verschieden. Auf dem Seitenhintergrund `--bg` (#e9ebe6, nur außerhalb der Spalte) 4,16:1 – dort steht kein Text.
- **Backup-Datei ist verschlüsselt (AES-256-GCM, Schlüssel aus `BACKUP_KEY` per scrypt):** Artefakte eines öffentlichen Repos kann jeder mit GitHub-Konto herunterladen; ein Klartext-Dump mit Aufgaben, Briefings und Kommentaren wäre öffentlich. Ohne `BACKUP_KEY`-Secret bricht der Workflow ab, statt unverschlüsselt hochzuladen. Lokal ohne Key: Klartext-JSON (nicht ins Repo).
- Keine Abhängigkeit installiert: die Skripte nutzen die bestehende PostgREST-Hilfe (`scripts/lib.mjs`, jetzt mit Umgebungs-Fallback für Secrets, Paginierung und Delete); `@supabase/supabase-js` ist damit im Workflow nicht nötig.
- `restore.mjs`: Vergleich ignoriert `updated_at` (Trigger-Zeitstempel); Wiederherstellung = Upsert fehlender/geänderter Zeilen, Löschen der nur-in-DB-Zeilen (Kommentare, Teilschritte, Aufgaben, Settings), Allowlist nur `last_seen_version`, Export-Token unberührt.
- Geprüft lokal: Backup 5 Tabellen (2/3/49/19/4), keine E-Mails, kein Token im Dump; `restore --dry` direkt danach: keine Abweichungen; verschlüsselt + richtiger Key: lesbar, falscher Key: Abbruch, fehlender Key: Abbruch; eine absichtliche Änderung wird als „geändert 1“ gemeldet (zurückgesetzt). App: keine Konsolenfehler, Realtime „Live“.
- Aufräumen: `runSeedMerge`, `bySort`, `forPerson` und der `seed-merge`-Import aus `state.js` entfernt; `app/seed-merge.js` bleibt für `scripts/seed.mjs`, ist aus dem App-Shell-Cache raus.
- Manueller Backup-Lauf 1 (workflow_dispatch, 19 s): Artefakt `backup-35717767949-1` (48 KB, `backup-2026-09-22.json.enc`, Ablauf 22.10.), im Artefakt kein Klartext; `restore --dry` mit lokalem `BACKUP_KEY` gegen die Live-DB: 2/3/49/19/4 Zeilen, keine Abweichungen. Akzeptanzkriterien 1–5 erfüllt.
