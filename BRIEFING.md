# Briefing: Spatzlbau – Umzugs-PWA für Sebastian & Anna

Du (Claude Code) baust „Spatzlbau“, eine kleine, gemeinsam genutzte Progressive Web App, mit der zwei Personen ihren Umzug steuern – zwei Wohnungen werden zu einer, beide Altverträge werden gekündigt. Das Konzept ist fertig durchdacht (mit Claude im Chat); deine Aufgabe ist die technische Umsetzung, das Deployment und danach die iterative Weiterentwicklung. Konzeptfragen klärt Sebastian mit Claude im Chat und bringt sie als Änderungsauftrag zu dir.

## 1. Was die App leisten muss

Ausgangslage: kein fester Einzugstermin. Alle Fristen sind **relativ zum Einzugstermin** (Offset in Tagen, negativ = davor). Sobald der Termin eingetragen ist, werden daraus echte Daten mit Überfälligkeits-Logik.

Vier Kernanforderungen der Nutzer:
1. Alle Aufgaben im Blick, nichts vergessen
2. Abhaken – Aufgaben und Teilschritte einzeln
3. Jederzeit einsehbar, auf dem Handy, von beiden
4. Wichtiges (fristkritisch, blockiert, wartet auf jemanden) immer sichtbar

Dazu die drei nicht verhandelbaren Rahmenbedingungen:
- **Fremde ausgeschlossen:** Login-Pflicht, Allowlist mit genau zwei E-Mail-Adressen
- **Anna öffnet nur eine URL:** kein App-Store; ein von Sebastian angelegtes Konto (E-Mail + Passwort), sonst nichts
- **Claude hat jederzeit Lesezugriff:** über eine nur-lesende Export-Funktion mit Token, damit die Delegations-Schleife (Abschnitt 4) ohne Copy-Paste läuft

## 2. Technische Entscheidungen (getroffen, nicht neu diskutieren)

| Thema | Entscheidung | Begründung |
|---|---|---|
| Frontend | Vanilla JS mit ES-Modulen, kein Framework, kein Build-Step; Supabase-JS per CDN-ESM mit gepinnter Version; Content-Security-Policy als `<meta>` in `index.html` (keine Inline-Skripte/-Styles, Skripte nur self + jsdelivr, Verbindungen nur Supabase) – Auftrag 008 | Deploy = git push; kleine App; leicht iterierbar |
| Hosting | GitHub Pages aus öffentlichem Repo (Fallback Cloudflare Pages bei privatem Repo) | kostenlos, kein Server |
| Daten | Supabase (Postgres) mit Realtime | Login, Allowlist, feldgenaue Updates, REST für Claude |
| Auth | Supabase Auth, E-Mail + Passwort (`signInWithPassword`); Konten legt Sebastian im Dashboard an, keine Selbstregistrierung, kein Passwort-Reset per Mail (Änderungsauftrag 001) | Magic Link scheiterte am Mail-Limit des Supabase-Standardversands; Passwort-Login braucht beim Anmelden keine Mail |
| Zugriffsschutz | Row Level Security: nur E-Mails aus `allowlist` lesen/schreiben | echter Ausschluss, nicht nur Obscurity |
| Claude-Lesezugriff | Postgres-Funktion `export_state(token text)` als RPC, `security definer`, gibt den Gesamtstand als JSON; Token in Tabelle `settings`, per SQL rotierbar | im Chat kann Claude nur GET-URLs abrufen, keine Header setzen → Token als Query-Parameter, `apikey` ebenfalls als Query-Parameter |
| Claude-Schreibzugriff | Nur über Claude Code mit Service-Role-Key aus lokaler `.env` – niemals im Repo | |
| PWA | `manifest.json`, minimaler Service Worker (App-Shell cachen, network-first); Cache-Version = Commit-SHA, vom Pages-Workflow in `sw.js`/`app/config.js` gestempelt; neue Builds übernehmen sofort (`skipWaiting`/`clients.claim`) und melden sich in der Statuszeile mit „Neue Version – neu laden“ (Auftrag 003) | Offline-Bearbeitung ist bewusst **nicht** im Scope |
| Sprache | UI komplett Deutsch, Code/Kommentare Englisch | |

Anon-Key und Projekt-URL dürfen im Repo stehen (per Design öffentlich, RLS schützt). Service-Role-Key und Export-Token niemals committen.

## 3. Datenmodell

Tabellen (alle mit `updated_at`, RLS aktiv):

- `allowlist(email pk, person text 'S'/'A', last_seen_version text)` – genau zwei Einträge, von Sebastian im SQL gesetzt; `person` ist das Mapping Login-E-Mail → Kürzel; `last_seen_version` = zuletzt gelesene Changelog-Version der Person (005b), das einzige Feld, das die App hier schreibt
- `settings(key pk, value jsonb)` – `einzugstermin`, `export_token`, `seed_version`, `phases` (Phasenliste aus `seed.json`, vom Seed-Skript geschrieben; Quelle bleibt `seed.json`)
- `tasks` – `id text pk` (Slug aus seed oder `c_<ts>`), `phase int`, `title`, `owner` (`S` Sebastian / `A` Anna / `B` gemeinsam), `offset_days int`, `critical bool`, `type` (`self` / `assist` / `claude`), `done bool`, `wait_on` (`S`/`A`/`C`/null), `status` (nur bei type claude: `briefing` → `go` → `recherche` → `rueckfragen` → `arbeit` → `ergebnis`), `blocked_by text[]`, `brief jsonb` (`goal`, `ctx`, `result`), `advice jsonb` (Schlüssel `why`, `how`, `need`, `law`, `traps`), `sort int`, `seed_snapshot jsonb` (Seed-Werte, wie zuletzt eingespielt – nur für den Merge, nicht im Export), `deleted_at` (Soft-Delete; die App löscht nie hart), `created_at`
- `subtasks(id uuid pk, task_id fk, title, done, sort, seed_key text, created_at)` – `seed_key` ist bei Seed-Teilschritten gesetzt, damit der Merge nur fehlende ergänzt
- `comments(id uuid pk, task_id fk, author text ('S'/'A'/'C'), body text, created_at)`

Alle Tabellen haben `updated_at` (Trigger). Vollständiger Stand: `supabase/schema.sql`.

Seed: `seed.json` in diesem Ordner enthält Phasen und 48 Aufgaben inkl. Abhängigkeiten, Teilschritten und zwei ausgefüllten Beispielen. Über `scripts/seed.mjs` (nur Claude Code, Service-Role-Key; seit 006 kein Knopf in der App mehr) werden Seed-Einträge **gemergt**: neue Tasks anlegen, bei bestehenden nur Felder überschreiben, die im Seed gesetzt sind und die Nutzer nicht geändert haben (`advice`, `subtasks` nur ergänzen). Häkchen, Kommentare, Briefings, eigene Tasks bleiben immer erhalten. Das ist der Migrationsmechanismus für spätere Inhaltslieferungen.

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

## 5. Sichten und UI (Stand Änderungsauftrag 002, Design in design/handoff/)

Ein Dashboard-Screen statt vier Sichten (`docs/changes/002-dashboard.md`):

1. **Kopf** – Countdown zum Einzugstermin („110 Tage bis zur Schlüsselübergabe“, ohne Termin „Termin offen“ mit Datumsfeld), Person-Chip, Statuszeile (gespeichert/Live), fünfteilige **Gate-Leiste**: pro Phase Nummer, erledigt/gesamt, Füllbalken (grün, wenn die Phase komplett ist). Tippen wählt die Phase.
2. **Kennzahlen als Filter** – Offen (alle) + Offen Sebastian / Anna / gemeinsam, dann Diese Woche, Bei Claude, Wartet auf jemanden, Blockiert, Fristkritisch, Überfällig. Jede Kachel ist ein Button (`aria-pressed`), genau ein Filter aktiv, erneutes Tippen hebt ihn auf; Warnfarbe nur bei Fristkritisch (Gelb) und Überfällig (Rot). Zahl auf der Kachel = Treffer über alle Phasen. Aktiver Filter erscheint als schließbarer Chip über der Liste und bleibt beim Phasenwechsel.
3. **Phasen-Tabs** – fünf Tabs (Nummer, Kurzname, Zähler: offen bzw. Treffer im Filter), darunter der Gate-Text. Der zuletzt aktive Tab wird pro Gerät gemerkt; beim Öffnen ist der Filter „Diese Woche“ aktiv (eigene und gemeinsame Aufgaben, offen, nicht blockiert, nicht gerade bei Claude, plus alles, was auf mich wartet).
4. **Aufgabenliste** der gewählten Phase nach Fälligkeit, Zeile: Häkchen, Titel, Owner-Chip, Fälligkeit („überfällig seit n Tagen“ rot, fristkritisch gelb, sonst „bis dd.mm.“), Teilschritte, Kommentare, Claude-Zustand, wartet-auf, blockiert-durch. Darunter „Neue Aufgabe in Phase n“ (bei Filter „Bei Claude“ als Claude-Aufgabe vorbelegt). Fußzeile: Version, Neu laden, Seed aktualisieren, Abmelden.

Breiten (Auftrag 006): bis 599 px Handy (Akte inline unter der Aufgabe), 600–899 px Tablet (eine Spalte bis 760 px, breitere Kacheln, Tabs ohne Scrollen), ab 900 px Desktop (bis 1280 px zentriert; Liste links, Akte rechts als Seitenpanel, das beim Klicken in der Liste offen bleibt; Escape/× schließt). Die offene Aufgabe steht in der URL (`#task=<id>`) und lässt sich als Link teilen – auf allen Breiten.

Die früheren Sichten „Diese Woche“, „Im Blick“, „Bei Claude“ sind vollständig in den Filtern aufgegangen. Abweichungen vom Design und selbst entschiedene Zustände: `docs/changes/002-abweichungen.md`.

Aufgaben-Detail ("Akte"): Titel/Owner/Typ/Wartet-auf/Offset editierbar, Abhängigkeiten, Teilschritte, Briefing (nur bei type claude), fünf klappbare Beratungsfelder (editierbar, Platzhaltertext wenn leer), Kommentare mit Autor und Zeit, Löschen mit Inline-Bestätigung.

Bekannte UX-Schuld aus v2, im ersten Build **noch nicht** lösen (kommt in der Konzeptrunde danach): Die Akte ist für kleine Aufgaben zu schwer – Beratung/Briefing sollten nur bei Bedarf sichtbar sein. Erst der Smoke-Test, dann UX/UI-Runde.

`reference/umzug-checkliste-v2.html` ist der funktionierende Prototyp aus dem Chat (Artifact, Speicher über `window.storage`). Er dient als **Referenz für Verhalten und Struktur**, nicht als Codebasis: neu aufbauen mit sauberer Modultrennung, gleiche Funktionen. Die Design-Tokens stammen seit 002 aus dem Claude-Design-Handoff (`design/handoff/2026-09-13/`).

Anforderungen an die Umsetzung: mobile-first (~380 px), Tap-Ziele ≥ 44 px, sichtbarer Fokus, `prefers-reduced-motion` respektieren, keine Dialoge (`confirm`/`prompt`) sondern Inline-Bestätigungen, Statuszeile mit Speicherzustand und Login-Identität. Autor von Kommentaren = eingeloggte Person (aus E-Mail → S/A gemappt, Mapping in `allowlist` als Spalte `person`).

## 6. Repo-Struktur

```
spatzlbau/
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
2. Authentication → Providers → Email: „Allow new users to sign up“ aus. Unter Users die zwei Konten mit Passwort anlegen (Auto Confirm).
3. SQL Editor → Inhalt von `supabase/schema.sql` einfügen und ausführen (enthält Platzhalter für die zwei E-Mails und erzeugt das Export-Token).
4. github.com → neues öffentliches Repo `spatzlbau` (oder du erledigst das per `gh`, wenn eingeloggt).

**Du, Claude Code:**
1. Repo-Gerüst anlegen, `schema.sql` schreiben, `SETUP.md` schreiben – **zuerst**, damit Sebastian parallel klicken kann.
2. App bauen, Seed-Skript, Result-Skript, PWA, Pages-Workflow.
3. Nach Push: Pages-URL an Sebastian melden (für Supabase Redirect), Seed einspielen, Export-URL zusammensetzen und in `SETUP.md` dokumentieren (Token nur lokal anzeigen, nicht committen).
4. Smoke-Test-Checkliste ausführen (Abschnitt 8).

Bevor du baust, frag Sebastian nach: Projekt-URL + Anon-Key, den zwei E-Mail-Adressen, ob `gh` und Node lokal verfügbar sind, Repo-Name.

## 8. Smoke-Test (mit Anna, ~10 Minuten)

1. Sebastian öffnet die URL, loggt sich mit E-Mail und Passwort ein, trägt einen Einzugstermin ein, hakt eine Aufgabe ab, schreibt einen Kommentar.
2. Anna öffnet dieselbe URL auf dem Handy, loggt sich ein, sieht Sebastians Stand, hakt eine andere Aufgabe ab, kommentiert, fügt "Zum Home-Bildschirm" hinzu.
3. Bei Sebastian erscheinen Annas Änderungen ohne Neuladen (Realtime).
4. Ein drittes Konto (Testadresse, im Dashboard angelegt, nicht in der Allowlist) loggt sich ein: App zeigt „nicht freigeschaltet“, keine Daten sichtbar. Eine Adresse ohne Konto kann sich gar nicht anmelden.
5. Sebastian gibt Claude im Chat die Export-URL; Claude liest den Stand und nennt die beiden Kommentare korrekt. Danach Token rotieren, um den Rotationsweg einmal geprobt zu haben.

Erfolgskriterium: alle fünf Punkte grün. Erst dann beginnt die Weiterentwicklung.

## 9. Mini-Roadmap

1. **Setup & Smoke-Test** – dieses Briefing
2. **Konzeptrunde 2 (Chat) + UX/UI-Runde (Claude Code):** leichte Akte für kleine Aufgaben, Review-Export für Claude (alles Kommentierte/Geänderte seit letztem Review), Onboarding-Screen für Anna, Diese-Woche-Sicht schärfen
3. **Inhalte Phase 1 + 2:** Beratungsfelder und Teilschritte für Vertrag/Kündigung, mit Rechtslage-Check, geliefert als Seed-Update
4. **Delegation live:** erste echte Aufgabe (z. B. Umzugsunternehmen) durch die Schleife; danach optional Scheduled Task, der die Export-URL täglich prüft und bei Go-Aufgaben proaktiv startet
5. **Inhalte Phase 3–5** und Betrieb bis zum Einzug
