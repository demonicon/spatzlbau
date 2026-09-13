# Briefing: Umzugs-PWA für Sebastian & Anna

Du (Claude Code) baust eine kleine, gemeinsam genutzte Progressive Web App, mit der zwei Personen ihren Umzug steuern – zwei Wohnungen werden zu einer, beide Altverträge werden gekündigt. Das Konzept ist fertig durchdacht (mit Claude im Chat); deine Aufgabe ist die technische Umsetzung, das Deployment und danach die iterative Weiterentwicklung. Konzeptfragen klärt Sebastian mit Claude im Chat und bringt sie als Änderungsauftrag zu dir.

## 1. Was die App leisten muss

Ausgangslage: kein fester Einzugstermin. Alle Fristen sind **relativ zum Einzugstermin** (Offset in Tagen, negativ = davor). Sobald der Termin eingetragen ist, werden daraus echte Daten mit Überfälligkeits-Logik.

Vier Kernanforderungen der Nutzer:
1. Alle Aufgaben im Blick, nichts vergessen
2. Abhaken – Aufgaben und Teilschritte einzeln
3. Jederzeit einsehbar, auf dem Handy, von beiden
4. Wichtiges (fristkritisch, blockiert, wartet auf jemanden) immer sichtbar

Dazu die drei nicht verhandelbaren Rahmenbedingungen:
- **Fremde ausgeschlossen:** Login-Pflicht, Allowlist mit genau zwei E-Mail-Adressen
- **Anna öffnet nur eine URL:** kein App-Store, kein Konto außer Magic-Link-Login
- **Claude hat jederzeit Lesezugriff:** über eine nur-lesende Export-Funktion mit Token, damit die Delegations-Schleife (Abschnitt 4) ohne Copy-Paste läuft

## 2. Technische Entscheidungen (getroffen, nicht neu diskutieren)

| Thema | Entscheidung | Begründung |
|---|---|---|
| Frontend | Vanilla JS mit ES-Modulen, kein Framework, kein Build-Step | Deploy = git push; kleine App; leicht iterierbar |
| Hosting | GitHub Pages aus öffentlichem Repo (Fallback Cloudflare Pages bei privatem Repo) | kostenlos, kein Server |
| Daten | Supabase (Postgres) mit Realtime | Login, Allowlist, feldgenaue Updates, REST für Claude |
| Auth | Supabase Auth, Magic Link per E-Mail; dieselbe Mail enthält zusätzlich einen 6-stelligen Code, der in der App eingetippt werden kann | kein Passwort, ein Klick für Anna; der Code deckt den Fall ab, dass die Home-Bildschirm-App (iOS) den Link im Safari-Tab statt in der App öffnet |
| Zugriffsschutz | Row Level Security: nur E-Mails aus `allowlist` lesen/schreiben | echter Ausschluss, nicht nur Obscurity |
| Claude-Lesezugriff | Postgres-Funktion `export_state(token text)` als RPC, `security definer`, gibt den Gesamtstand als JSON; Token in Tabelle `settings`, per SQL rotierbar | im Chat kann Claude nur GET-URLs abrufen, keine Header setzen → Token als Query-Parameter, `apikey` ebenfalls als Query-Parameter |
| Claude-Schreibzugriff | Nur über Claude Code mit Service-Role-Key aus lokaler `.env` – niemals im Repo | |
| PWA | `manifest.json`, minimaler Service Worker (App-Shell cachen), "Zum Home-Bildschirm" | Offline-Bearbeitung ist bewusst **nicht** im Scope |
| Sprache | UI komplett Deutsch, Code/Kommentare Englisch | |

Anon-Key und Projekt-URL dürfen im Repo stehen (per Design öffentlich, RLS schützt). Service-Role-Key und Export-Token niemals committen.

## 3. Datenmodell

Tabellen (alle mit `updated_at`, RLS aktiv):

- `allowlist(email pk, person text 'S'/'A')` – genau zwei Einträge, von Sebastian im SQL gesetzt; `person` ist das Mapping Login-E-Mail → Kürzel
- `settings(key pk, value jsonb)` – `einzugstermin`, `export_token`, `seed_version`, `phases` (Phasenliste aus `seed.json`, vom Seed-Skript geschrieben; Quelle bleibt `seed.json`)
- `tasks` – `id text pk` (Slug aus seed oder `c_<ts>`), `phase int`, `title`, `owner` (`S` Sebastian / `A` Anna / `B` gemeinsam), `offset_days int`, `critical bool`, `type` (`self` / `assist` / `claude`), `done bool`, `wait_on` (`S`/`A`/`C`/null), `status` (nur bei type claude: `briefing` → `go` → `recherche` → `rueckfragen` → `arbeit` → `ergebnis`), `blocked_by text[]`, `brief jsonb` (`goal`, `ctx`, `result`), `advice jsonb` (Schlüssel `why`, `how`, `need`, `law`, `traps`), `sort int`, `seed_snapshot jsonb` (Seed-Werte, wie zuletzt eingespielt – nur für den Merge, nicht im Export), `deleted_at` (Soft-Delete; die App löscht nie hart), `created_at`
- `subtasks(id uuid pk, task_id fk, title, done, sort, seed_key text, created_at)` – `seed_key` ist bei Seed-Teilschritten gesetzt, damit der Merge nur fehlende ergänzt
- `comments(id uuid pk, task_id fk, author text ('S'/'A'/'C'), body text, created_at)`

Alle Tabellen haben `updated_at` (Trigger). Vollständiger Stand: `supabase/schema.sql`.

Seed: `seed.json` in diesem Ordner enthält Phasen und 48 Aufgaben inkl. Abhängigkeiten, Teilschritten und zwei ausgefüllten Beispielen. Beim ersten Start (oder per Admin-Knopf "Seed aktualisieren") werden Seed-Einträge **gemergt**: neue Tasks anlegen, bei bestehenden nur Felder überschreiben, die im Seed gesetzt sind und die Nutzer nicht geändert haben (`advice`, `subtasks` nur ergänzen). Häkchen, Kommentare, Briefings, eigene Tasks bleiben immer erhalten. Das ist der Migrationsmechanismus für spätere Inhaltslieferungen.

Merge-Mechanik: Ein Feld gilt als "vom Nutzer geändert", wenn sein aktueller Wert vom `seed_snapshot` abweicht. Nur Felder, die noch dem Snapshot entsprechen, werden auf den neuen Seed-Wert gesetzt; danach wird der Snapshot aktualisiert. Teilschritte werden über `seed_key` (= Seed-Titel) abgeglichen und nur ergänzt, nie gelöscht oder umbenannt.

Abgeleitete Logik (Frontend):
- `blocked` = mindestens ein Task in `blocked_by` ist nicht `done`
- `due` = einzugstermin + offset_days; `late` wenn vergangen und nicht done; `soon` wenn ≤ 7 Tage
- Ein Task mit Subtasks gilt als done, sobald alle Subtasks done sind (automatisch, mit Hinweis)
- `wait_on` wird manuell gesetzt; ein Kommentar kann es setzen

## 4. Die Delegations-Schleife an Claude

Jede Aufgabe kann auf `type = claude` gestellt werden – dynamisch, keine feste Liste. Dann erscheint ein Briefing (Ziel, Kontext, Ergebnis) und ein Zustandsautomat. **Claude startet nie ohne explizites Go.**

| Zustand | Am Zug | Bedeutung |
|---|---|---|
| briefing | Nutzer | Ziel und Kontext ausfüllen |
| go | – | Nutzer hat "Go erteilen" geklickt; Claude darf starten |
| recherche | Claude | Claude klärt Anforderungen, stellt max. 5 Rückfragen, nennt Annahmen |
| rueckfragen | Nutzer | Rückfragen im Kommentarfeld beantworten, "Beantwortet" klicken |
| arbeit | Claude | Claude liefert Ergebnis (Shortlist, Vorlage, Ablauf, Anfragetexte) |
| ergebnis | Nutzer | Entscheiden, "Ergebnis übernommen" → done |

Ablauf technisch: Claude im Chat ruft `export_state` ab, sieht Go-Aufgaben samt Briefing und Kommentaren, antwortet im Chat. Ergebnisse tragen die Nutzer ein oder Claude Code schreibt sie per Skript (`scripts/claude-result.mjs`, Eingabe: JSON `{tasks:[{id,status,result,comment,sub_add[]}]}`) in die Datenbank – Kommentare mit `author = 'C'`. Das Skript bitte im ersten Build mitliefern.

## 5. Sichten und UI (Stand Konzept v2, siehe reference/)

1. **Diese Woche** – pro Person: jetzt möglich (nicht blockiert, nach Fälligkeit), wartet auf mich, blockiert (mit Grund)
2. **Im Blick** – fristkritisch und offen (visuell hervorgehoben, gelber Block), überfällig, wartet auf jemanden
3. **Bei Claude** – delegierte Aufgaben nach Zustand gruppiert, "Neue Claude-Aufgabe"
4. **Phasen** – fünf Phasen mit Gate-Beschreibung, Filter (Alle / Sebastian / Anna / Gemeinsam / Nur offene), Aufgabe hinzufügen pro Phase

Aufgaben-Detail ("Akte"): Titel/Owner/Typ/Wartet-auf/Offset editierbar, Abhängigkeiten, Teilschritte, Briefing (nur bei type claude), fünf klappbare Beratungsfelder (editierbar, Platzhaltertext wenn leer), Kommentare mit Autor und Zeit, Löschen mit Inline-Bestätigung.

Bekannte UX-Schuld aus v2, im ersten Build **noch nicht** lösen (kommt in der Konzeptrunde danach): Die Akte ist für kleine Aufgaben zu schwer – Beratung/Briefing sollten nur bei Bedarf sichtbar sein. Erst der Smoke-Test, dann UX/UI-Runde.

`reference/umzug-checkliste-v2.html` ist der funktionierende Prototyp aus dem Chat (Artifact, Speicher über `window.storage`). Er dient als **Referenz für Verhalten und Struktur**, nicht als Codebasis: neu aufbauen mit sauberer Modultrennung, gleiche Funktionen. Design-Tokens dürfen übernommen werden (Farben, Owner-Chips, Highlighter-Gelb für "Im Blick").

Anforderungen an die Umsetzung: mobile-first (~380 px), Tap-Ziele ≥ 44 px, sichtbarer Fokus, `prefers-reduced-motion` respektieren, keine Dialoge (`confirm`/`prompt`) sondern Inline-Bestätigungen, Statuszeile mit Speicherzustand und Login-Identität. Autor von Kommentaren = eingeloggte Person (aus E-Mail → S/A gemappt, Mapping in `allowlist` als Spalte `person`).

## 6. Repo-Struktur

```
umzug/
├── index.html
├── app/            main.js, state.js, views/*.js, ui/*.js, supabase.js
├── app.css
├── manifest.json, sw.js, icons/
├── supabase/schema.sql      Tabellen, RLS, allowlist, export_state, Realtime
├── seed.json
├── scripts/claude-result.mjs, scripts/seed.mjs   (Node, nutzen .env mit SERVICE_ROLE_KEY)
├── reference/               v2-Prototyp
├── BRIEFING.md              diese Datei
├── CLAUDE.md                Konventionen für dich
├── SETUP.md                 Klickanleitung für Sebastian (Supabase, GitHub Pages)
└── .github/workflows/pages.yml
```

## 7. Setup-Reihenfolge (was Sebastian tut, was du tust)

**Sebastian, im Browser (~15 Minuten):**
1. supabase.com → Konto → neues Projekt (Region EU, Frankfurt). Projekt-URL, Anon-Key und Service-Role-Key notieren.
2. Authentication → Providers → Email: Magic Link aktiv lassen. Unter URL Configuration die spätere GitHub-Pages-URL als Site URL und Redirect eintragen (du sagst ihm die URL, sobald das Repo steht).
3. SQL Editor → Inhalt von `supabase/schema.sql` einfügen und ausführen (enthält Platzhalter für die zwei E-Mails und erzeugt das Export-Token).
4. github.com → neues öffentliches Repo `umzug` (oder du erledigst das per `gh`, wenn eingeloggt).

**Du, Claude Code:**
1. Repo-Gerüst anlegen, `schema.sql` schreiben, `SETUP.md` schreiben – **zuerst**, damit Sebastian parallel klicken kann.
2. App bauen, Seed-Skript, Result-Skript, PWA, Pages-Workflow.
3. Nach Push: Pages-URL an Sebastian melden (für Supabase Redirect), Seed einspielen, Export-URL zusammensetzen und in `SETUP.md` dokumentieren (Token nur lokal anzeigen, nicht committen).
4. Smoke-Test-Checkliste ausführen (Abschnitt 8).

Bevor du baust, frag Sebastian nach: Projekt-URL + Anon-Key, den zwei E-Mail-Adressen, ob `gh` und Node lokal verfügbar sind, Repo-Name.

## 8. Smoke-Test (mit Anna, ~10 Minuten)

1. Sebastian öffnet die URL, loggt sich per Magic Link ein, trägt einen Einzugstermin ein, hakt eine Aufgabe ab, schreibt einen Kommentar.
2. Anna öffnet dieselbe URL auf dem Handy, loggt sich ein, sieht Sebastians Stand, hakt eine andere Aufgabe ab, kommentiert, fügt "Zum Home-Bildschirm" hinzu.
3. Bei Sebastian erscheinen Annas Änderungen ohne Neuladen (Realtime).
4. Eine dritte E-Mail (Testadresse) versucht den Login: Magic Link kommt an, App zeigt leere Liste / Hinweis "nicht freigeschaltet", keine Daten sichtbar.
5. Sebastian gibt Claude im Chat die Export-URL; Claude liest den Stand und nennt die beiden Kommentare korrekt. Danach Token rotieren, um den Rotationsweg einmal geprobt zu haben.

Erfolgskriterium: alle fünf Punkte grün. Erst dann beginnt die Weiterentwicklung.

## 9. Mini-Roadmap

1. **Setup & Smoke-Test** – dieses Briefing
2. **Konzeptrunde 2 (Chat) + UX/UI-Runde (Claude Code):** leichte Akte für kleine Aufgaben, Review-Export für Claude (alles Kommentierte/Geänderte seit letztem Review), Onboarding-Screen für Anna, Diese-Woche-Sicht schärfen
3. **Inhalte Phase 1 + 2:** Beratungsfelder und Teilschritte für Vertrag/Kündigung, mit Rechtslage-Check, geliefert als Seed-Update
4. **Delegation live:** erste echte Aufgabe (z. B. Umzugsunternehmen) durch die Schleife; danach optional Scheduled Task, der die Export-URL täglich prüft und bei Go-Aufgaben proaktiv startet
5. **Inhalte Phase 3–5** und Betrieb bis zum Einzug
