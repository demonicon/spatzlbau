# SETUP – Klickanleitung für Sebastian

Reihenfolge: Supabase → SQL → Auth → GitHub → Rückmeldung an Claude Code. Dauer ca. 15 Minuten.
Alles, was du eintippst oder kopierst, steht in Codeblöcken. Geheimnisse (Service-Role-Key, Export-Token) nur in die lokale `.env`, nie ins Repo.

---

## 1. Supabase-Projekt anlegen

1. https://supabase.com → einloggen/registrieren → **New project**.
2. Name: `umzug` (egal), **Region: EU (Frankfurt)**, Datenbank-Passwort generieren lassen und im Passwortmanager ablegen (brauchen wir sonst nicht).
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

Token später nochmal anzeigen:
```sql
select value #>> '{}' as export_token from settings where key = 'export_token';
```

---

## 3. Auth einstellen

### 3a. Provider
**Authentication → Sign In / Providers → Email**: eingeschaltet lassen. Nichts weiter nötig – Magic Link ist der Standardweg ohne Passwort.
„Allow new users to sign up“ **eingeschaltet lassen**: Der Login selbst ist offen, der Datenzugriff ist per Allowlist gesperrt (Fremde sehen nach dem Login nur den Hinweis „nicht freigeschaltet“).

### 3b. URL-Konfiguration
**Authentication → URL Configuration**:
- **Site URL**: die GitHub-Pages-URL `https://demonicon.github.io/spatzlbau/`.
- **Redirect URLs** (jeweils „Add URL“):
  ```
  https://demonicon.github.io/spatzlbau/**
  http://localhost:5500/**
  http://127.0.0.1:5500/**
  ```
  Die beiden `localhost`-Einträge sind für den lokalen Test mit Live Server.

### 3c. E-Mail-Vorlage mit Login-Code (empfohlen)
Grund: Wird die App auf dem iPhone „Zum Home-Bildschirm“ hinzugefügt, öffnet ein Magic Link im Safari-Tab, nicht in der App. Mit einem 6-stelligen Code, den man in der App eintippt, klappt der Login auch dort.

**Authentication → Emails → Templates → Magic Link**:
- Subject:
  ```
  Dein Login für den Umzugsplaner
  ```
- Body (Message):
  ```html
  <h2>Umzugsplaner</h2>
  <p><a href="{{ .ConfirmationURL }}">Jetzt einloggen</a></p>
  <p>Oder diesen Code in der App eingeben: <strong style="font-size:20px">{{ .Token }}</strong></p>
  <p>Link und Code sind eine Stunde gültig.</p>
  ```
- Speichern.

### 3d. Hinweis E-Mail-Limit
Der eingebaute Supabase-Mailversand ist für Tests gedacht und stark begrenzt (derzeit nur wenige Login-Mails pro Stunde, projektweit). Für den Smoke-Test heißt das: Logins zeitlich verteilen, nicht dreimal hintereinander anfordern. Wenn das nervt: **Project Settings → Authentication → SMTP Settings** → eigenen SMTP eintragen (z. B. Brevo, kostenloser Tarif reicht). Optional, kann später kommen.

---

## 4. GitHub-Repo und Pages

1. https://github.com/new → Name `spatzlbau`, **Public**, ohne README/.gitignore/Lizenz (das Repo kommt aus dem lokalen Ordner) → **Create repository**.
2. Die Repo-URL (`https://github.com/demonicon/spatzlbau.git`) an Claude Code geben – der Push kommt von dort.
3. Nach dem ersten Push: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**. Der Workflow `.github/workflows/pages.yml` liegt im Repo und veröffentlicht bei jedem Push auf `main`.
4. Die Pages-URL steht danach unter Settings → Pages (`https://demonicon.github.io/spatzlbau/`) → in Supabase als Site URL / Redirect eintragen (Schritt 3b).

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
zeigt, was ein Seed-Merge ändern würde; ohne `--dry` wird geschrieben (nie destruktiv). Dasselbe macht der Knopf „Seed aktualisieren“ in der App; beim ersten Öffnen bzw. wenn `seed.json` eine höhere `version` hat als die Datenbank, läuft der Merge automatisch.

```bash
node scripts/claude-result.mjs ergebnis.json
```
trägt Claude-Ergebnisse ein: `{"tasks":[{"id":"umzugsfirma","status":"rueckfragen","result":"…","comment":"…","sub_add":["…"]}]}` – Kommentare erscheinen als „Claude“.

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

VS Code mit Erweiterung „Live Server“ → Rechtsklick auf `index.html` → „Open with Live Server“ (Port 5500, passt zu den Redirect-URLs oben). Im Browser auf ~380 px Breite prüfen (DevTools → Gerätesymbol). Zwei Personen = zwei Browserprofile oder ein normales + ein privates Fenster.

---

## Anhang: Zugriffsregeln (RLS) in Klartext

Gilt für alle Zugriffe über die App (Anon-Key + Login). Der Service-Role-Key (nur lokal bei Claude Code) umgeht diese Regeln bewusst.

| Tabelle | Wer nicht eingeloggt ist | Eingeloggt, **nicht** auf der Allowlist | Eingeloggt und auf der Allowlist |
|---|---|---|---|
| `allowlist` | nichts | nichts | lesen (um die eigene Person S/A zu ermitteln); kein Schreiben |
| `settings` | nichts | nichts | lesen, anlegen, ändern – **außer** `export_token` (unsichtbar, nur per SQL) |
| `tasks` | nichts | nichts | lesen, anlegen, ändern; **kein** Löschen (nur `deleted_at` setzen) |
| `subtasks` | nichts | nichts | lesen, anlegen, ändern, löschen |
| `comments` | nichts | nichts | lesen, ändern, löschen; anlegen nur mit **eigenem** Autor-Kürzel |

- Allowlist-Prüfung: E-Mail aus dem Login-Token (klein geschrieben) muss in `allowlist` stehen.
- `export_state(token)`: ohne Login aufrufbar, liefert alles (ohne Token-Wert, ohne gelöschte Aufgaben) – aber nur bei richtigem Token, sonst 403.
- `rotate_export_token()`: nur per SQL Editor / Service Role.
- Realtime-Änderungsereignisse unterliegen denselben Leseregeln – Fremde bekommen keine Events.
