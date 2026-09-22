# SETUP – Spatzlbau: Klickanleitung für Sebastian

Reihenfolge: Supabase → SQL → Auth → GitHub → Rückmeldung an Claude Code. Dauer ca. 15 Minuten.
Alles, was du eintippst oder kopierst, steht in Codeblöcken. Geheimnisse (Service-Role-Key, Export-Token) nur in die lokale `.env`, nie ins Repo.

---

## 1. Supabase-Projekt anlegen

1. https://supabase.com → einloggen/registrieren → **New project**.
2. Name: `spatzlbau` (egal), **Region: EU (Frankfurt)**, Datenbank-Passwort generieren lassen und im Passwortmanager ablegen (brauchen wir sonst nicht).
3. Warten bis das Projekt „Active“ ist (1–2 Minuten).
4. **Project Settings → Data API**: die **Project URL** kopieren (`https://xxxx.supabase.co`).
5. **Project Settings → API Keys**: zwei Schlüssel kopieren.
   - Neuere Projekte zeigen **Publishable key** (`sb_publishable_…`) und **Secret key** (`sb_secret_…`, per „Reveal“).
   - Ältere Ansicht bzw. Tab „Legacy“: **anon public** und **service_role**.
   - Publishable/anon = darf ins Repo. Secret/service_role = nur in `.env`.

Notieren für Schritt 6: Project URL, Publishable/Anon-Key, Secret/Service-Role-Key.

---

## 2. Schema einspielen (SQL Editor)

1. `supabase/schema.sql` aus diesem Ordner in einem Editor öffnen.
2. Ganz oben im Block `>>> HIER ANPASSEN <<<` die zwei E-Mail-Adressen eintragen (die Adressen, mit denen ihr euch einloggen werdet – Groß-/Kleinschreibung egal):
   ```sql
   ('sebastian@example.com', 'S'),
   ('anna@example.com',      'A');
   ```
3. Supabase Dashboard → **SQL Editor** → **New query** → gesamten Dateiinhalt einfügen → **Run** (Strg+Enter).
4. Unten erscheint eine Ergebniszeile: `status = ok`, `allowlisted_people = 2`, `export_token = <48 Zeichen>`.
   **Token kopieren** und in die lokale `.env` (Schritt 6) – nicht ins Repo, nicht in den Chat.

Das Skript kann jederzeit erneut ausgeführt werden (z. B. nach Adressänderung); Daten und Token bleiben erhalten.

Spätere Schema-Änderungen kommen als einzelne Dateien in `supabase/migrations/` (`NNN_aXXX_thema.sql`, NNN aufsteigend). Sie werden im selben SQL-Editor in dieser Reihenfolge ausgeführt und sind mehrfach ausführbar; Claude Code sagt im Änderungsauftrag, welche dran ist. `schema.sql` enthält immer den Gesamtstand für eine Neueinrichtung.

Token später nochmal anzeigen:
```sql
select value #>> '{}' as export_token from settings where key = 'export_token';
```

---

## 3. Auth einstellen (Passwort-Login, Änderungsauftrag 001)

Login läuft mit E-Mail und Passwort. Es gibt keine Selbstregistrierung und keine „Passwort vergessen“-Mail – beide Konten legst du selbst an, Zurücksetzen passiert ebenfalls im Dashboard.

### 3a. Selbstregistrierung ausschalten
**Authentication → Sign In / Providers → Email**: Provider eingeschaltet lassen, **„Allow new users to sign up“ ausschalten**. Speichern.

### 3b. Die zwei Konten anlegen
**Authentication → Users → Add user → Create new user**, je einmal für Sebastian und Anna:
- E-Mail: exakt die Adresse aus der `allowlist` (Vergleich ist unabhängig von Groß-/Kleinschreibung, aber sonst zeichengenau).
- Passwort: lange Passphrase, im Passwortmanager ablegen. Anna bekommt ihre persönlich, nicht per E-Mail.
- **„Auto Confirm User“ aktivieren**, sonst wartet das Konto auf eine Bestätigungsmail.

### 3c. Passwort zurücksetzen
**Authentication → Users → Konto öffnen → Reset password / Update password**. Der Login-Screen weist darauf hin, dass Sebastian das erledigt.

### 3d. URL-Konfiguration (optional)
Für den Passwort-Login nicht mehr nötig. Site URL `https://demonicon.github.io/spatzlbau/` kann eingetragen bleiben.

### 3e. Test-Konto für den Smoke-Test
Für Punkt 4 des Smoke-Tests ein drittes Konto anlegen (beliebige Adresse, Auto Confirm), das **nicht** in der `allowlist` steht. Nach dem Login zeigt die App „Dieses Konto ist nicht freigeschaltet“ und keine Daten. Danach das Konto wieder löschen.

---

## 4. GitHub-Repo und Pages

1. https://github.com/new → Name `spatzlbau`, **Public**, ohne README/.gitignore/Lizenz (das Repo kommt aus dem lokalen Ordner) → **Create repository**.
2. Die Repo-URL (`https://github.com/demonicon/spatzlbau.git`) an Claude Code geben – der Push kommt von dort.
3. Nach dem ersten Push: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**. Der Workflow `.github/workflows/pages.yml` liegt im Repo und veröffentlicht bei jedem Push auf `main`.
4. Die Pages-URL steht danach unter Settings → Pages (`https://demonicon.github.io/spatzlbau/`).

---

## 5. Lokale Werkzeuge (auf dem PC)

Für die Skripte (`scripts/seed.mjs`, `scripts/claude-result.mjs`) braucht Claude Code **Node.js** (LTS). Stand 13.09.2026: Node 24 ist installiert, `gh` nicht (nicht nötig). Falls auf einem anderen PC:
```bash
winget install OpenJS.NodeJS.LTS
```
Optional GitHub CLI (dann kann Claude Code Repo und Pages-Einstellungen selbst anlegen):
```bash
winget install GitHub.cli
```
Danach Terminal neu öffnen und einmal `gh auth login` (Browser-Login).

---

## 6. Lokale `.env` anlegen

Datei `.env` im Projektordner (steht in `.gitignore`, wird nie committet), Vorlage: `.env.example`.
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_… oder eyJ…
SUPABASE_SERVICE_ROLE_KEY=sb_secret_… oder eyJ…
EXPORT_TOKEN=<Token aus Schritt 2>
BACKUP_KEY=<lange Passphrase, siehe Abschnitt 10>
```

---

## 7. Rückmeldung an Claude Code

Damit der Build starten kann, im Chat mit Claude Code angeben:
- Project URL und Publishable/Anon-Key (dürfen im Chat stehen, landen im Repo)
- Repo-URL auf GitHub und dein GitHub-Benutzername (für die Pages-URL)
- Ob `.env` liegt (Service-Role-Key und Token **nicht** in den Chat schreiben – Claude Code liest die Datei lokal)
- Ob Node (und ggf. `gh`) installiert sind

Danach: Claude Code baut, pusht, meldet die Pages-URL, spielt den Seed ein (`node scripts/seed.mjs`) und dokumentiert hier die Export-URL.

## 7a. Skripte (Claude Code, lokal)

```bash
node scripts/seed.mjs --dry
```
zeigt, was ein Seed-Merge ändern würde; ohne `--dry` wird geschrieben (nie destruktiv). Das ist der einzige Weg, den Seed einzuspielen – die App hat seit 006 keinen Seed-Knopf mehr.

```bash
node scripts/claude-result.mjs ergebnis.json
```
trägt Claude-Ergebnisse ein: `{"tasks":[{"id":"umzugsfirma","status":"ergebnis","result":"…","comment":"…","sub_add":["…"]}]}` – Kommentare erscheinen als „Claude“.

---

## 7b. Seed ohne PC (GitHub Action, Auftrag 010)

Ein Inhaltspaket einspielen, ohne dass jemand am Rechner sitzt: GitHub → Reiter **Actions** → Workflow **Seed** → **Run workflow**.

- **package** – Pfad im Repo, Standard `seed.json`. Für ein Inhaltspaket z. B. `content/beispiel-004.json`.
- **dry** – Häkchen setzen, um nur zu sehen, was sich ändern würde (nichts wird geschrieben).

Ergebnis im Lauf-Log (Schritt „Merge … into the database“): wie viele Aufgaben/Teilschritte neu angelegt bzw. aktualisiert wurden. Nutzt dieselben Secrets wie der Backup-Workflow (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), keine weitere Einrichtung nötig. Macht dasselbe wie `node scripts/seed.mjs` lokal (Abschnitt 7a) – die Merge-Regeln in `app/seed-merge.js` sind identisch, nie destruktiv.

---

## 8. Export-URL für Claude im Chat

Nur-Lese-Zugriff auf den Gesamtstand als JSON. Aufbau:
```
https://<projekt-ref>.supabase.co/rest/v1/rpc/export_state?token=<EXPORT_TOKEN>&apikey=<ANON_KEY>
```
Die fertige URL enthält das Token → **nicht** ins Repo, nur im Chat an Claude geben (Claude kann sie per GET abrufen). Falscher/fehlender Token → HTTP 401 und keine Daten.

Für dieses Projekt (Token aus `.env` einsetzen; Publishable-Key ist öffentlich und darf hier stehen):
```
https://rxhbwjbiwackxuswupuy.supabase.co/rest/v1/rpc/export_state?token=<EXPORT_TOKEN>&apikey=sb_publishable_sFPP1DbeeXoUBa0uWhI3-g_KjPQ0Qu3
```
Getestet am 13.09.2026: 200 + JSON mit richtigem Token, 401 mit falschem.

### Token rotieren
Wenn die URL irgendwo gelandet ist, wo sie nicht hingehört (oder als Übung im Smoke-Test): SQL Editor →
```sql
select rotate_export_token();
```
Das Ergebnis ist das neue Token → `.env` aktualisieren, neue URL an Claude im Chat geben. Die alte URL ist sofort ungültig.

---

## 9. Lokal testen

VS Code mit Erweiterung „Live Server“ → Rechtsklick auf `index.html` → „Open with Live Server“ (Port 5500). Im Browser auf ~380 px Breite prüfen (DevTools → Gerätesymbol). Zwei Personen = zwei Browserprofile oder ein normales + ein privates Fenster.

---

## 10. Backup (Auftrag 008b)

Supabase Free macht keine automatischen Datenbank-Backups. Deshalb sichert der Workflow „Backup“ täglich um 03:00 UTC alle Tabellen als verschlüsselte Datei und hebt sie 30 Tage als Workflow-Artefakt auf. Ohne E-Mail-Adressen (Allowlist nur Person + gelesene Version) und ohne Export-Token. Verschlüsselt, weil Artefakte eines öffentlichen Repos jeder mit GitHub-Konto herunterladen kann.

**Einmalig (~3 Minuten):**
1. Eine lange Passphrase erzeugen (Passwortmanager, ≥ 20 Zeichen) und als `BACKUP_KEY` in die lokale `.env` – ohne sie ist kein Backup lesbar.
2. GitHub → Repo `spatzlbau` → Settings → Secrets and variables → Actions → **New repository secret**, dreimal: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (beide aus `.env`), `BACKUP_KEY` (die Passphrase).
3. Actions-Tab → Workflow **Backup** → **Run workflow**. Nach ~1 Minute unter dem Lauf das Artefakt `backup-<lauf>` herunterladen (ZIP mit `backup-<datum>.json.enc`).
4. Prüfen, dass es vollständig und lesbar ist:
   ```bash
   node scripts/restore.mjs backup-2026-09-22.json.enc --dry
   ```
   Erwartet: alle sieben Tabellen mit Zeilenzahlen und „keine Abweichungen“.
5. Ab dann läuft es täglich. Kontrolle einmal pro Woche: Actions-Tab, letzter Backup-Lauf grün.

**Wiederherstellen (Notfall):** Datei aus dem Artefakt herunterladen, dann
```bash
node scripts/restore.mjs backup-<datum>.json.enc
```
Das Skript zeigt zuerst die Abweichungen je Tabelle und fragt im Terminal nach Bestätigung („ja“). Danach entspricht die Datenbank dem Backup: fehlende und geänderte Zeilen werden geschrieben, Zeilen, die nur in der Datenbank waren, gelöscht. Export-Token und E-Mail-Adressen bleiben unberührt.

**Lokales Backup ohne Workflow:** `node scripts/backup.mjs` schreibt `backup-<datum>.json.enc` (mit `BACKUP_KEY` in `.env`) bzw. unverschlüsselt ohne Key ins aktuelle Verzeichnis. Nicht ins Repo legen.

---

## Anhang: Zugriffsregeln (RLS) in Klartext

Gilt für alle Zugriffe über die App (Anon-Key + Login). Der Service-Role-Key (nur lokal bei Claude Code) umgeht diese Regeln bewusst.

| Tabelle | Wer nicht eingeloggt ist | Eingeloggt, **nicht** auf der Allowlist | Eingeloggt und auf der Allowlist |
|---|---|---|---|
| `allowlist` | nichts | nichts | lesen (um die eigene Person S/A zu ermitteln); schreiben nur `last_seen_version` der **eigenen** Zeile (Spaltenrecht + Zeilenregel) |
| `settings` | nichts | nichts | lesen, anlegen, ändern – **außer** `export_token` (unsichtbar, nur per SQL) |
| `tasks` | nichts | nichts | lesen, anlegen, ändern; **kein** Löschen (nur `deleted_at` setzen) |
| `subtasks` | nichts | nichts | lesen, anlegen, ändern, löschen |
| `comments` | nichts | nichts | lesen, ändern, löschen; anlegen nur mit **eigenem** Autor-Kürzel |

- Allowlist-Prüfung: E-Mail aus dem Login-Token (klein geschrieben) muss in `allowlist` stehen.
- `export_state(token)`: ohne Login aufrufbar, liefert alles (ohne Token-Wert, ohne gelöschte Aufgaben) – aber nur bei richtigem Token, sonst 403.
- `rotate_export_token()`: nur per SQL Editor / Service Role.
- Realtime-Änderungsereignisse unterliegen denselben Leseregeln – Fremde bekommen keine Events.
