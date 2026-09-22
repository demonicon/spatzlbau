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
- **Claude hat jederzeit Lesezugriff:** direkt über den Supabase-Connector (MCP) im Chat, damit die Delegations-Schleife (Abschnitt 4) ohne Copy-Paste läuft (bis Auftrag 010: nur-lesende Export-Funktion mit Token)

## 2. Technische Entscheidungen (getroffen, nicht neu diskutieren)

| Thema | Entscheidung | Begründung |
|---|---|---|
| Frontend | Vanilla JS mit ES-Modulen, kein Framework, kein Build-Step; Supabase-JS per CDN-ESM mit gepinnter Version; Content-Security-Policy als `<meta>` in `index.html` (keine Inline-Skripte/-Styles, Skripte nur self + jsdelivr, Verbindungen nur Supabase) – Auftrag 008 | Deploy = git push; kleine App; leicht iterierbar |
| Hosting | GitHub Pages aus öffentlichem Repo (Fallback Cloudflare Pages bei privatem Repo); zusätzlich `preview` → `/preview/`, gleiche Datenbank, Hinweis „Vorschau“ in der App (Auftrag 010) | kostenlos, kein Server; Cloud-Sitzungen testen ohne die Live-App zu berühren |
| Daten | Supabase (Postgres) mit Realtime | Login, Allowlist, feldgenaue Updates, REST für Claude |
| Auth | Supabase Auth, E-Mail + Passwort (`signInWithPassword`); Konten legt Sebastian im Dashboard an, keine Selbstregistrierung, kein Passwort-Reset per Mail (Änderungsauftrag 001) | Magic Link scheiterte am Mail-Limit des Supabase-Standardversands; Passwort-Login braucht beim Anmelden keine Mail |
| Zugriffsschutz | Row Level Security: nur E-Mails aus `allowlist` lesen/schreiben | echter Ausschluss, nicht nur Obscurity |
| Claude-Lesezugriff | Supabase-Connector (MCP) in Claude Desktop/Code, liest mit den eigenen Zugriffsrechten (Auftrag 010) | eine unauthentifizierte Export-Funktion mit Token in der Query-String war eine offene Tür ohne Nutzen, sobald der Connector direkten Zugriff gibt |
| Claude-Schreibzugriff | Nur über Claude Code mit Service-Role-Key aus lokaler `.env` – niemals im Repo | |
| PWA | `manifest.json`, minimaler Service Worker (App-Shell cachen, network-first); Cache-Version = Commit-SHA, vom Pages-Workflow in `sw.js`/`app/config.js` gestempelt; neue Builds übernehmen sofort (`skipWaiting`/`clients.claim`) und melden sich in der Statuszeile mit „Neue Version – neu laden“ (Auftrag 003) | Offline-Bearbeitung ist bewusst **nicht** im Scope |
| Backup | GitHub-Workflow „Backup“ täglich 03:00 UTC: `scripts/backup.mjs` sichert alle Tabellen (ohne E-Mails) AES-verschlüsselt als Artefakt, 30 Tage; `scripts/restore.mjs` vergleicht (`--dry`) oder stellt wieder her (Auftrag 008b) | Supabase Free hat keine automatischen Backups |
| Sprache | UI komplett Deutsch, Code/Kommentare Englisch | |

Anon-Key und Projekt-URL dürfen im Repo stehen (per Design öffentlich, RLS schützt). Service-Role-Key niemals committen.

## 3. Datenmodell

Tabellen (alle mit `updated_at`, RLS aktiv):

- `allowlist(email pk, person text 'S'/'A', last_seen_version text, last_visit_at timestamptz, seen_comments jsonb)` – genau zwei Einträge, von Sebastian im SQL gesetzt; `person` ist das Mapping Login-E-Mail → Kürzel. Die App schreibt hier nur drei Spalten der eigenen Zeile: `last_seen_version` (zuletzt gelesene Changelog-Version, 005b), `last_visit_at` (wann die Person die App zuletzt verlassen hat, 009) und `seen_comments` (IDs der neuen Kommentare, die sie schon geöffnet hat, 009)
- `settings(key pk, value jsonb)` – `einzugstermin`, `export_token`, `seed_version`, `phases`, `umzugstag_kontakte` (Notfallkontakte für das Druckblatt, 009) (Phasenliste aus `seed.json`, vom Seed-Skript geschrieben; Quelle bleibt `seed.json`)
- `tasks` – `id text pk` (Slug aus seed oder `c_<ts>`), `phase int`, `title`, `owner` (`S` Sebastian / `A` Anna / `B` gemeinsam), `offset_days int`, `critical bool`, `type` (`self` / `assist` / `claude`), `done bool`, `wait_on` (`S`/`A`/`C`/null), `status` (nur bei type claude: `briefing` → `claude` → `ergebnis`, Auftrag 009), `done_by` (`S`/`A`, wer abgehakt hat – Grundlage für „Seit deinem letzten Besuch"), `blocked_by text[]`, `brief jsonb` (`goal`, `ctx`, `result`), `advice jsonb` (Schlüssel `why`, `how`, `need`, `law`, `traps`), `sort int`, `seed_snapshot jsonb` (Seed-Werte, wie zuletzt eingespielt – nur für den Merge, nicht im Export), `deleted_at` (Soft-Delete; die App löscht nie hart), `created_at`
- `subtasks(id uuid pk, task_id fk, title, done, sort, seed_key text, created_at)` – `seed_key` ist bei Seed-Teilschritten gesetzt, damit der Merge nur fehlende ergänzt
- `comments(id uuid pk, task_id fk, author text ('S'/'A'/'C'), body text, created_at)`
- `costs` (Auftrag 004, Vorstufe Finanzmodul 007) – `id uuid pk`, `task_id fk → tasks` (null nur für den Puffer), `label`, `kind` (`einmalig`/`rueckfluss`), `apartment` (`S` alt Sebastian / `A` alt Anna / `N` neu / null), `status` (`geschaetzt` → `angebot` → `beauftragt` → `faellig` → `bezahlt`), `amount numeric(10,2)` (ein Betrag pro Zeile, der Status sagt, wie sicher er ist), `due_on` (Default beim Anlegen = Frist der Aufgabe, per Trigger), `paid_on` (gesetzt ⇒ `status = bezahlt`, per Trigger), `paid_by` (`S`/`A`), `belongs_to` (`S`/`A`/`B`; `B` = geteilt nach `split_s`), `split_s numeric(5,2)` (Anteil Sebastian in %, null = `settings.split_default_s`), `tax_relevant bool`, `receipt_url`, `note`, `seed_key`, `seed_snapshot`, `sort`, `created_at`
- `recurring` (Auftrag 004) – laufende Kosten alt vs. neu, alles monatlich: `id uuid pk`, `label`, `amount_s`, `amount_a`, `amount_n numeric(10,2) null`, `note`, `seed_key`, `seed_snapshot`, `sort`. Delta `amount_n − amount_s − amount_a` ist die Zahl für „Kostenmodell klären“ in Phase 1; Jahresbeträge teilt 007 beim Erfassen durch 12.
- `settings`, zusätzliche Schlüssel (004): `move_out_s`, `move_out_a` (Auszugstermine, Grundlage der **berechneten** Doppelmiete in 007 – keine Kostenzeilen dafür), `split_default_s` (Standardanteil Sebastian in %, Start 50), `buffer_pct` (Puffersatz, Start 20; das Inhaltspaket legt eine `costs`-Zeile „Puffer“ mit `task_id = null` an, deren Betrag 007 aus dem Satz vorschlägt)
- View `costs_summary` (004) – **die eine Summenregel** für 007 und für Claude (im Export enthalten): Zeilen mit `beauftragt`/`faellig`/`bezahlt` zählen; `geschaetzt` zählt nur, solange keine Zeile derselben Aufgabe `beauftragt` oder weiter ist (Puffer zählt immer); `angebot` zählt nie (Historie). Spalten: `planned_total` (gezählte `einmalig`), `paid` (davon `bezahlt`), `refunds_expected` (gezählte `rueckfluss`), `buffer` (gezählte `einmalig` ohne Aufgabe), `net` = `planned_total − refunds_expected`. Ohne Zeilen alles `null`. RLS gilt (`security_invoker`).

Alle Tabellen haben `updated_at` (Trigger). Vollständiger Stand: `supabase/schema.sql`. `costs`/`recurring`: RLS wie `subtasks`, Realtime an, im täglichen Backup enthalten.

Seed: `seed.json` in diesem Ordner enthält Phasen und 48 Aufgaben inkl. Abhängigkeiten, Teilschritten und zwei ausgefüllten Beispielen. Über `scripts/seed.mjs` (nur Claude Code, Service-Role-Key; seit 006 kein Knopf in der App mehr) werden Seed-Einträge **gemergt**: neue Tasks anlegen, bei bestehenden nur Felder überschreiben, die im Seed gesetzt sind und die Nutzer nicht geändert haben (`advice`, `subtasks` nur ergänzen). Häkchen, Kommentare, Briefings, eigene Tasks bleiben immer erhalten. Das ist der Migrationsmechanismus für spätere Inhaltslieferungen.

Merge-Mechanik: Ein Feld gilt als "vom Nutzer geändert", wenn sein aktueller Wert vom `seed_snapshot` abweicht. Nur Felder, die noch dem Snapshot entsprechen, werden auf den neuen Seed-Wert gesetzt; danach wird der Snapshot aktualisiert. Teilschritte werden über `seed_key` (= Seed-Titel) abgeglichen und nur ergänzt, nie gelöscht oder umbenannt.

Inhaltspakete (004): `seed.json` (oder ein Paket im selben Format per `node scripts/seed.mjs --file <paket.json>`, alle Blöcke optional) darf `costs` und `recurring` mitliefern, jede Zeile mit `seed_key`. Ergänzt wird per `seed_key`; bestehende Zeilen werden feldweise wie Aufgaben aktualisiert, eine `costs`-Zeile aber nie mehr angefasst, sobald sie über `geschaetzt` hinaus ist, ein `paid_on` hat oder ihr Betrag von Hand geändert wurde. Formatbeispiel: `content/beispiel-004.json`, Kurzanleitung: `content/README.md`.

Vormerkung für 007 (Finanz-Dashboard): Kennzahl „Zahlungen in 7 Tagen“ (aus `due_on`), Sortierfunktion über `sort`, Beleg-Pflicht: bei `tax_relevant` wird `receipt_url` beim Setzen von `paid_on` eingefordert, Jahresbeträge in `recurring` beim Erfassen durch 12 teilen, Puffer-Betrag aus `buffer_pct` vorschlagen, Doppelmiete aus `move_out_s`/`move_out_a` berechnen.

Abgeleitete Logik (Frontend):
- `blocked` = mindestens ein Task in `blocked_by` ist nicht `done`
- `due` = einzugstermin + offset_days; `late` wenn vergangen und nicht done; `soon` wenn ≤ 7 Tage
- Ein Task mit Subtasks gilt als done, sobald alle Subtasks done sind (automatisch, mit Hinweis)
- `wait_on` wird manuell gesetzt; ein Kommentar kann es setzen

## 4. Die Delegations-Schleife an Claude

Jede Aufgabe kann auf `type = claude` gestellt werden – dynamisch, keine feste Liste. Dann erscheint ein Briefing (Ziel, Kontext, Ergebnis) und ein dreiteiliger Zustandsbalken (Auftrag 009). **Claude startet nie ohne explizite Übergabe.**

| Zustand | Am Zug | Bedeutung |
|---|---|---|
| briefing | Nutzer | Ziel und Kontext ausfüllen, dann „An Claude geben" |
| claude | Claude | Claude klärt Anforderungen, fragt nach, liefert – alles als Kommentare |
| ergebnis | Nutzer | Lesen, entscheiden, „Ergebnis übernommen" → done |

„An Claude geben" schreibt zusätzlich den Kommentar „An Claude übergeben.". **Rückfragen und Antworten sind normale Kommentare** (Autor `C` für Claude, `S`/`A` für die Nutzer) – dafür gibt es keinen eigenen Zustand mehr. „Zurück auf Briefing" ist jederzeit möglich. Der Filter „Bei Claude" gruppiert die delegierten Aufgaben nach genau diesen drei Zuständen statt nach Personen.

Ablauf technisch: Claude im Chat liest über den Supabase-Connector die Aufgaben im Zustand `claude` samt Briefing und Kommentaren, antwortet im Chat. Ergebnisse tragen die Nutzer ein oder Claude Code schreibt sie per Skript (`scripts/claude-result.mjs`, Eingabe: JSON `{tasks:[{id,status,result,comment,sub_add[]}]}`) in die Datenbank – Kommentare mit `author = 'C'`.

## 5. Sichten und UI (Stand Änderungsauftrag 009, Design in design/handoff/2026-09-22-b)

Ein Dashboard-Screen, geordnet **nach Personen** statt nach Phasen (`docs/changes/009-personen-layout.md`, Variante B aus dem Design-Review 011):

1. **Kopf** – Countdown zum Einzugstermin („101 Tage bis zur Schlüsselübergabe", ohne Termin „Termin offen" mit Datumsfeld), Person-Pille, Statuszeile (gespeichert/Live/Offline), fünfteilige **Gate-Leiste**: pro Phase Nummer, erledigt/gesamt, Füllbalken (grün, wenn die Phase komplett ist).
2. **„Seit deinem letzten Besuch"** – erscheint nur, wenn etwas passiert ist, während die Person weg war: Kommentare je Autor, von jemand anderem erledigte Aufgaben, was auf die Person wartet. Jeder Teil ist ein Filter. Grundlage: `allowlist.last_visit_at`, gesetzt beim Verlassen der App. An der Aufgabenzeile steht ein Punkt in der Autorenfarbe, bis die Aufgabe geöffnet wurde (`allowlist.seen_comments`).
3. **Vier Kennzahlen als Filter** – Fristkritisch, Überfällig, Blockiert, Bei Claude. Jede Kachel ist ein Button (`aria-pressed`), genau ein Filter aktiv, erneutes Tippen hebt ihn auf; Warnfarbe nur bei Fristkritisch (Gelb) und Überfällig (Rot). Die Owner-Zahlen von früher sind die Spaltenköpfe, „Diese Woche" ist die Spalte „Ich".
4. **Phasen als Chips** – `alle` plus fünf Phasen über der Liste, nicht mehr als Tabs; die Wahl wird pro Gerät gemerkt, Standard ist `alle`. Darunter der Gate-Text der gewählten Phase.
5. **Spalten statt einer Liste** – Handy: `Ich` (nur eigene, nicht blockiert), `Wartet auf mich`, `Gemeinsam`, `Bei <anderer>` (eingeklappt). Ab 1180 px drei Spalten nebeneinander: ich / gemeinsam / der andere, daneben das Akte-Panel. Jede Spalte zeigt acht Zeilen, dann „weitere n zeigen", darunter eingeklappt „n warten auf einen Vorgänger" (blockierte Aufgaben mit dem Grund als Link zur blockierenden Aufgabe) und „n erledigt zeigen". Der Filter „Bei Claude" gruppiert stattdessen nach den drei Delegationszuständen.
6. **Aufgabenzeile** – Häkchen, Titel, Owner-Chip (am Handy), Fälligkeit („überfällig seit n Tagen" rot, fristkritisch gelb, sonst „bis dd.mm."), Teilschritte, Kommentare, Punkt bei neuen Kommentaren, Claude-Zustand, „wartet auf dich" (rot), „blockiert: …" als Link.
7. **Fußzeile** – Version (öffnet „Was ist neu?"), Neu laden, Umzugstag drucken, Abmelden.

Breiten: bis 599 px Handy (Akte inline unter der Aufgabe), 600–899 px Tablet (eine Spalte bis 760 px), ab 900 px Akte als Seitenpanel, ab 1180 px zusätzlich die drei Personen-Spalten nebeneinander. Die offene Aufgabe steht in der URL (`#task=<id>`) und lässt sich als Link teilen – auf allen Breiten.

**Akte in zwei Gewichtsklassen** (009): standardmäßig leicht – Titel (editierbar), Owner, Frist, Teilschritte, Kommentare. „Alle Felder anzeigen" holt Abhängigkeiten, Beratung, Delegation und die Felder Zuständig/Typ/Wartet/Offset dazu; der Zustand wird pro Aufgabe gemerkt. Automatisch voll bei: an Claude delegiert, mindestens ein Beratungsfeld gefüllt, oder Abhängigkeiten vorhanden. Von den fünf Beratungsfeldern werden nur die gefüllten gezeigt, die leeren liegen hinter „Beratung ergänzen". Löschen mit Inline-Bestätigung.

**Umzugstag** (009): Nach jedem erfolgreichen Laden legt die App den Datenstand lokal ab (`localStorage`). Ohne Verbindung zeigt sie diesen Stand **nur lesend** – Statuszeile „Offline – Stand von 09:41", Häkchen deaktiviert, Schreibversuche melden „Ohne Netz kannst du nur lesen". Kein Offline-Schreiben, kein Sync. Zurück im Netz lädt sie neu, ohne Seiten-Reload. „Umzugstag drucken" (Fußzeile) öffnet ein Blatt für Phase 4: Aufgaben nach Person mit Kästchen, Felder für Zählerstände (Strom/Gas/Wasser je Wohnung), Schlüsselliste und die Notfallkontakte aus `settings.umzugstag_kontakte` – reines `@media print`.

Anforderungen an die Umsetzung: mobile-first (~380 px), Tap-Ziele ≥ 44 px, sichtbarer Fokus, `prefers-reduced-motion` respektieren, keine Dialoge (`confirm`/`prompt`) sondern Inline-Bestätigungen, Statuszeile mit Speicherzustand und Login-Identität. Autor von Kommentaren = eingeloggte Person (aus E-Mail → S/A gemappt, Mapping in `allowlist` als Spalte `person`).

Abweichungen vom Design und selbst entschiedene Zustände: `docs/changes/002-abweichungen.md`, `006-abweichungen.md`, `009-abweichungen.md`. Die Design-Tokens stammen aus dem Claude-Design-Handoff (`design/handoff/2026-09-13/`, Layout seit 009 aus `2026-09-22-b`).

## 6. Repo-Struktur

```
spatzlbau/
├── index.html
├── app/            main.js, state.js, views/*.js, ui/*.js, supabase.js
├── app.css
├── manifest.json, sw.js, icons/
├── supabase/schema.sql      Tabellen, RLS, allowlist, Realtime
├── seed.json
├── content/               Inhaltspakete für den Seed-Merge (004)
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
3. SQL Editor → Inhalt von `supabase/schema.sql` einfügen und ausführen (enthält Platzhalter für die zwei E-Mails).
4. github.com → neues öffentliches Repo `spatzlbau` (oder du erledigst das per `gh`, wenn eingeloggt).

**Du, Claude Code:**
1. Repo-Gerüst anlegen, `schema.sql` schreiben, `SETUP.md` schreiben – **zuerst**, damit Sebastian parallel klicken kann.
2. App bauen, Seed-Skript, Result-Skript, PWA, Pages-Workflow.
3. Nach Push: Pages-URL an Sebastian melden (für Supabase Redirect), Seed einspielen.
4. Smoke-Test-Checkliste ausführen (Abschnitt 8).

Bevor du baust, frag Sebastian nach: Projekt-URL + Anon-Key, den zwei E-Mail-Adressen, ob `gh` und Node lokal verfügbar sind, Repo-Name.

## 8. Smoke-Test (mit Anna, ~10 Minuten)

1. Sebastian öffnet die URL, loggt sich mit E-Mail und Passwort ein, trägt einen Einzugstermin ein, hakt eine Aufgabe ab, schreibt einen Kommentar.
2. Anna öffnet dieselbe URL auf dem Handy, loggt sich ein, sieht Sebastians Stand, hakt eine andere Aufgabe ab, kommentiert, fügt "Zum Home-Bildschirm" hinzu.
3. Bei Sebastian erscheinen Annas Änderungen ohne Neuladen (Realtime).
4. Ein drittes Konto (Testadresse, im Dashboard angelegt, nicht in der Allowlist) loggt sich ein: App zeigt „nicht freigeschaltet“, keine Daten sichtbar. Eine Adresse ohne Konto kann sich gar nicht anmelden.
5. Sebastian fragt Claude im Chat nach dem Stand (Supabase-Connector); Claude liest ihn und nennt die beiden Kommentare korrekt.

Erfolgskriterium: alle fünf Punkte grün. Erst dann beginnt die Weiterentwicklung.

## 9. Mini-Roadmap

1. **Setup & Smoke-Test** – dieses Briefing
2. **Konzeptrunde 2 (Chat) + UX/UI-Runde (Claude Code):** leichte Akte für kleine Aufgaben, Review-Export für Claude (alles Kommentierte/Geänderte seit letztem Review), Onboarding-Screen für Anna, Diese-Woche-Sicht schärfen
3. **Inhalte Phase 1 + 2:** Beratungsfelder und Teilschritte für Vertrag/Kündigung, mit Rechtslage-Check, geliefert als Seed-Update
4. **Delegation live:** erste echte Aufgabe (z. B. Umzugsunternehmen) durch die Schleife; danach optional Scheduled Task, der über den Connector täglich prüft und bei delegierten Aufgaben proaktiv startet
5. **Inhalte Phase 3–5** und Betrieb bis zum Einzug
