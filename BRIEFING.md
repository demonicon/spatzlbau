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
| Daten | Supabase (Postgres) mit Realtime; ein Ereignis wird feldgenau in den lokalen Stand eingearbeitet, Voll-Reload nur nach Verbindungsabbruch (Auftrag 010) | Login, Allowlist, feldgenaue Updates |
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
- `tasks` – `id text pk` (Slug aus seed oder `c_<ts>`), `phase int`, `title`, `owner` (`S` Sebastian / `A` Anna / `B` gemeinsam), `offset_days int`, `critical bool`, `type` (`self` / `assist` / `claude` / `anfrage` – Letzteres seit 033, siehe Abschnitt 4), `done bool`, `wait_on` (`S`/`A`/`C`/null), `status` (bei type claude: `briefing` → `claude` → `ergebnis`, Auftrag 009; bei type anfrage zusätzlich `entschieden`), `done_by` (`S`/`A`, wer abgehakt hat – Grundlage für „Seit deinem letzten Besuch"), `blocked_by text[]`, `brief jsonb` (`goal`, `ctx`, `result`; bei Anfragen `anfrage` und `vergleich`), `advice jsonb` (Schlüssel `why`, `how`, `need`, `law`, `traps`), `sort int`, `seed_snapshot jsonb` (Seed-Werte, wie zuletzt eingespielt – nur für den Merge, nicht im Export), `deleted_at` (Soft-Delete; die App löscht nie hart), `created_at`
- `subtasks(id uuid pk, task_id fk, title, done, sort, seed_key text, created_at)` – `seed_key` ist bei Seed-Teilschritten gesetzt, damit der Merge nur fehlende ergänzt
- `comments(id uuid pk, task_id fk, author text ('S'/'A'/'C'), body text, created_at)`
- `costs` (Auftrag 004, Vorstufe Finanzmodul 007) – `id uuid pk`, `task_id fk → tasks` (null nur für den Puffer), `label`, `kind` (`einmalig`/`rueckfluss`), `apartment` (`S` alt Sebastian / `A` alt Anna / `N` neu / null), `status` (`geschaetzt` → `angebot` → `beauftragt` → `faellig` → `bezahlt`), `amount numeric(10,2)` (ein Betrag pro Zeile, der Status sagt, wie sicher er ist), `due_on` (Default beim Anlegen = Frist der Aufgabe, per Trigger), `paid_on` (gesetzt ⇒ `status = bezahlt`, per Trigger), `paid_by` (`S`/`A`), `belongs_to` (`S`/`A`/`B`; `B` = geteilt nach `split_s`), `split_s numeric(5,2)` (Anteil Sebastian in %, null = `settings.split_default_s`), `tax_relevant bool`, `receipt_url`, `note`, `seed_key`, `seed_snapshot`, `sort`, `created_at`
- `recurring` (Auftrag 004) – laufende Kosten alt vs. neu, alles monatlich: `id uuid pk`, `label`, `amount_s`, `amount_a`, `amount_n numeric(10,2) null`, `note`, `seed_key`, `seed_snapshot`, `sort`. Delta `amount_n − amount_s − amount_a` ist die Zahl für „Kostenmodell klären“ in Phase 1; Jahresbeträge teilt 007 beim Erfassen durch 12.
- `settings`, zusätzliche Schlüssel (004): `move_out_s`, `move_out_a` (Auszugstermine, Grundlage der **berechneten** Doppelmiete in 007 – keine Kostenzeilen dafür), `split_default_s` (Standardanteil Sebastian in %, Start 50), `buffer_pct` (Puffersatz, Start 20; das Inhaltspaket legt eine `costs`-Zeile „Puffer“ mit `task_id = null` an, deren Betrag 007 aus dem Satz vorschlägt)
- `settings`, zusätzliche Schlüssel (026): `setup_done` (bool), `setup_step` (int, Wiedereinstieg nach Abbruch), `stammdaten` (jsonb: `personen[]`, `wohnungen.{s,a,n}`) – der gemeinsame Start in acht Schritten (Auftrag 026), danach über „Stammdaten & Rahmendaten" im Avatar-Menü einzeln wieder aufrufbar. Vier der acht Schritte (Termine, Mieten, Kautionen, Aufteilung) sind 016bs Ersteinrichtung, unverändert wiederverwendet – `fin_setup_done` bleibt ein eigener Schlüssel dafür.
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
| briefing | Nutzer | Ziel und Kontext ausfüllen, im Bearbeiten-Modus „Claude jetzt starten" (Auftrag 024) |
| claude | Claude | Claude klärt Anforderungen, fragt nach, liefert – alles als Kommentare |
| ergebnis | Nutzer | Lesen, entscheiden, „Ergebnis übernommen" → done |

„Claude jetzt starten" (im Bearbeiten-Modus der Akte, aktiv sobald Ziel gefüllt ist) schreibt `status = claude`, `brief.requested_at`/`requested_by` und den Kommentar „<Name> hat Claude gestartet". Der Knopf startet keinen Lauf – der nächste Lauf (unten) holt die Aufgabe ab; die Stand-Zeile in Ansehen zeigt „bei Claude seit HH:MM · nächster Lauf um hh:00". **Rückfragen und Antworten sind normale Kommentare** (Autor `C` für Claude, `S`/`A` für die Nutzer) – dafür gibt es keinen eigenen Zustand mehr. „Zurück auf Briefing" ist jederzeit möglich. Der Filter „Bei Claude" gruppiert die delegierten Aufgaben nach genau diesen drei Zuständen statt nach Personen.

Ablauf technisch (Auftrag 024, Lösung B): ein Scheduled Task um 8, 12, 15, 18 und 22 Uhr (Europe/Berlin, seit 25.09.; vorher stündlich) liest Aufgaben im Zustand `claude` mit neuem `brief.requested_at`, arbeitet sie über Supabase-, Drive- und Gmail-Connector ab und schreibt Ergebnis direkt in `brief.result`, `status = ergebnis` und einen Kommentar mit Autor `C` – ohne Umweg über den Chat. `settings.claude_last_run` hält den Zeitpunkt des letzten Laufs. Schreibrecht ist auf `comments` (Autor `C`), `tasks.brief.result`, `tasks.status` (nur `claude → ergebnis`) und `settings.claude_last_run` begrenzt (Regel, keine technische Schranke; Schreibweg `scripts/claude-result.mjs`). Bis zum nächsten Lauf vergehen tagsüber höchstens vier Stunden, über Nacht zehn; die Läufe sind frische Sitzungen ohne den Chat-Verlauf.

**Anfragen** (Auftrag 033): eine Aufgabe mit `type = anfrage`, verknüpft über `brief.anfrage.task_id` mit einer echten Aufgabe (Phase und Frist von dort). Stufen `briefing` (Entwurf) → `claude` (gesendet) → `ergebnis` → `entschieden`. Die App hält Anfragen in einer eigenen Liste (`state.anfragen`), deshalb erscheinen sie nie in Spalten, Timeline, Kennzahlen, Gate, Druck oder Suche; das Kalender-Abo filtert sie in der Edge Function heraus. Der Lauf schreibt `brief.vergleich` (`offers[]` mit `name`, `price`, `price_kind` fest/ab/monat, optional `setup_fee` (Einmalbetrag neben dem laufenden Preis, 038c), `service`, `term`, `valid_until`, `plus`, `minus`, `url`, `source`, `author`, `date`; dazu `recommendation`, optional `recommended` = id des empfohlenen Angebots, `reason`, `sources[]`, `request_text`) über `claude-result.mjs` (Feld `vergleich`) und setzt `claude → ergebnis`. Nie `chosen*`, nie `entschieden`, nie das gewählte Angebot, nie ein Angebot mit `author` S/A oder `source = manual` – der Merge in `app/anfragen.js` erzwingt das; eine schon entschiedene Anfrage setzt der Lauf nicht zurück. „Wählen" in der App setzt `chosen`/`chosen_by`/`chosen_at`, `entschieden` und schreibt eine Entscheidung (032) an die verknüpfte Aufgabe; danach fragt die App, ob der Preis übernommen wird (Einmalpreis → Posten der Aufgabe, Monatspreis → `recurring`, vorerst nur Internet – Strom/Gas/Versicherung haben bis Auftrag 031 keine Laufend-Zeile; ein `setup_fee` legt zusätzlich einen Posten `fest` an, 038c).

## 5. Sichten und UI (Stand Änderungsauftrag 009, Design in design/handoff/2026-09-22-b)

Ein Dashboard-Screen, geordnet **nach Personen** statt nach Phasen (`docs/changes/009-personen-layout.md`, Variante B aus dem Design-Review 011):

1. **Kopf** (Shell seit 038) – `app/shell.js` rendert Kopf, Navigation, zweite Ebene, Fußzeile und Tab-Leiste **einmal**; der Router tauscht nur den Inhaltscontainer, die Kopfzeile bleibt dieselbe DOM-Node. Der Kopf ist sticky und bekommt beim Scrollen eine weiche Kante. Ab 900 px: Titel, Vorschau-Chip und Countdown links, rechts **Unterstrich-Tabs** (Icon 16 + Text 14, aktiv Tinte 600 mit 3-px-Balken an der Unterkante, ruhend `--ink-2`) in der festen Reihenfolge Aufgaben · Finanzen · Entscheidungen · Anfragen, dahinter der Avatar; das Zähler-Badge steht als Zahl hinter dem Label. Unter 900 px trägt der Kopf nur Titel, Chip, Avatar und darunter den Countdown (90 statt der früheren ~150 px), die vier Ziele liegen in der **Tab-Leiste unten** (56 px + Safe-Area, Icon 22, Label 12, Badge an der Icon-Ecke). Der Badge am Tab Aufgaben zählt seit 038c die Kommentare anderer Autoren seit dem letzten Besuch, die diese Person noch nicht geöffnet hat (dieselbe Zahl wie `newCommentsCount()`), und verschwindet Aufgabe für Aufgabe beim Öffnen – der Ersatz für den mit 038 entfallenen Block „Zwischen euch". Die zweite Ebene ist **ein Segment** für alle Seiten (Aufgaben: Personen · Phasen · Timeline, daneben die Suche; Entscheidungen: offen · alle; Finanzen und Anfragen: keins). Die fünfteilige **Gate-Leiste** steht weiterhin im Inhalt der Aufgabenliste.
2. **„Seit deinem letzten Besuch"** (seit 013 eine Zeile mit Chips, die sich beim Antippen zu vier Zeilen aufklappt; ohne Rot – was wartet, ist fett und umrissen, Kommentare tragen den Autoren-Punkt mit Initial) – erscheint nur, wenn etwas passiert ist, während die Person weg war: Kommentare je Autor, von jemand anderem erledigte Aufgaben, was auf die Person wartet. Jeder Teil ist ein Filter. Grundlage: `allowlist.last_visit_at`, gesetzt beim Verlassen der App. An der Aufgabenzeile steht ein Punkt in der Autorenfarbe, bis die Aufgabe geöffnet wurde (`allowlist.seen_comments`).
3. **Vier Kennzahlen als Filter** – Fristkritisch, Überfällig, Blockiert, Bei Claude, in einer Reihe. Jede Kachel ist ein Button (`aria-pressed`), genau ein Filter aktiv, erneutes Tippen hebt ihn auf; Warnfarbe nur bei Fristkritisch (Gelb) und Überfällig (Rot). Darunter eine eigene Zeile „Kosten · 3.129 € netto →", die in die Finanzansicht führt – sie ist ein Link, kein Filter, und sieht seit 013 auch so aus.
4. **Phasen als Chips** – `alle` plus fünf Phasen über der Liste, nicht mehr als Tabs; die Wahl wird pro Gerät gemerkt, Standard ist `alle`. Darunter der Gate-Text der gewählten Phase.
5. **Spalten statt einer Liste** – Handy: eine Spalte, umgeschaltet über die drei Personen-Pillen (Sebastian · Gemeinsam · Anna, seit 038 mit Namen statt „Du"), dahinter in derselben Reihe die Pille „neu" (038c: Aufgaben mit mindestens einem noch nicht geöffneten Kommentar), nur mit Zahl > 0. Ab 900 px stattdessen die Filter-Pillen alle · überfällig · fristkritisch · wartet auf dich · neu, ebenfalls eine Pille nur mit Zahl > 0. Ab 1180 px drei Spalten nebeneinander: ich / gemeinsam / der andere, daneben das Akte-Panel (400 px fest, seit 038). Jede Spalte zeigt acht Zeilen, dann „weitere n zeigen", darunter eingeklappt „n warten auf einen Vorgänger" (blockierte Aufgaben mit dem Grund als Link zur blockierenden Aufgabe) und „n erledigt zeigen". Der Filter „Bei Claude" gruppiert stattdessen nach den drei Delegationszuständen.
6. **Aufgabenzeile** – Häkchen, Titel, Owner-Chip (am Handy), Fälligkeit („überfällig seit n Tagen" rot, fristkritisch gelb, sonst „bis dd.mm."), Teilschritte, Kommentare, Punkt bei neuen Kommentaren, Claude-Zustand, „wartet auf dich" (rot), „blockiert: …" als Link.
7. **Fußzeile** – ⓘ (öffnet „Was ist neu?", trägt den Neu-Punkt) · Version als reiner Text · Umzugstag drucken · Abmelden. „Neu laden" erscheint nur als Leiste, wenn eine neue Version wartet. Regel seit 013: was wie ein Bedienelement aussieht, ist eins – und umgekehrt.

Breiten (Stand 038): bis 899 px Handy – die Akte ist **eine eigene Seite** mit „‹ Aufgaben" statt inline unter der Zeile; sie legt einen History-Eintrag an, Browser-Zurück landet wieder auf der Liste an derselben Scrollposition, die Tab-Leiste bleibt dabei stehen. **900–1179 px** Liste über die volle Breite und Akte als **Overlay von rechts** (440 px, abgedunkelt, schließt mit ×, Escape, Tippen daneben) – auf Entscheidungen und Anfragen stattdessen die eigene Seite. **Ab 1180 px** Liste und stilles Seitenpanel nebeneinander: das Panel ist **400 px fest** und zeigt ohne eigene Auswahl die erste Zeile, ein Schließen-Kreuz gibt es dort nicht mehr (nur im Overlay). Der Container wächst bis 1800 px, die Spalten halten mindestens 320 px (`auto-fit`). Die offene Aufgabe steht in der URL (`#task=<id>`) und lässt sich als Link teilen – auf allen Breiten; `#finanzen` legt einen History-Eintrag an, eine im Panel geöffnete Akte nicht.

**Vorschau** (010, präzisiert in 012): `/preview/` läuft auf derselben Datenbank wie die echte App, ist aber für den **Nutzerstand read-only** – `last_seen_version`, `last_visit_at` und `seen_comments` werden dort nie geschrieben. Der Besuchsblock und die automatische Changelog-Anzeige zeigen den Live-Stand, ohne ihn zu verbrauchen; die Statuszeile trägt den Zusatz „Vorschau – Lesestand wird nicht gespeichert". Inhalte (Aufgaben, Kosten, Einstellungen) schreibt die Vorschau normal.

**Suche** (012): Ein Feld im Kopf, immer sichtbar, über den Kacheln; am Desktop springt `/` hinein, Escape leert es und verlässt es. Gesucht wird im Aufgabentitel **und** in den Teilschritt-Titeln, ab dem ersten Zeichen, ohne Groß/Klein und tolerant gegenüber Umlauten und ß (`kuendigen` = `kündigen`, in beide Richtungen). Die Spaltenstruktur bleibt, Spalten ohne Treffer verschwinden, Eingeklapptes („n warten auf einen Vorgänger", „Bei <anderer>", erledigte) klappt für die Dauer der Suche auf; erledigte Treffer stehen ausgegraut am Ende ihres Bereichs. Ein Treffer im Teilschritt zeigt diesen als zweite Zeile unter dem Titel, der Treffertext fett. Eine Eingabe ersetzt Kachel-Filter und Phasenwahl, das Leeren stellt beides wieder her. Ein Treffer antippen heißt: Suche zu, Zustand zurück, Liste an der Aufgabe, eine Sekunde markiert – am Desktop zusätzlich das Panel offen, am Handy entscheidet der nächste Tipp. Der Suchbegriff wird bewusst nirgends gespeichert (kein `localStorage`, kein Hash). Die Regeln stehen genau einmal in `app/search.js`.

**Akte-Kopf** (013): Titel als Überschrift mit Stift daneben, kein dauerhaft offenes Textfeld. Inline ist die Aufgabenzeile selbst der Kopf – Häkchen und Titel stehen genau einmal. Teilschritte werden über eine eigene Bearbeitungszeile umbenannt und nur dort mit Rückfrage gelöscht; eigene Kommentare lassen sich löschen und zehn Minuten lang bearbeiten.

**Akte in zwei Gewichtsklassen** (009): standardmäßig leicht – Titel (editierbar), Owner, Frist, Teilschritte, Kommentare. „Alle Felder anzeigen" holt Abhängigkeiten, Beratung, Delegation und die Felder Zuständig/Typ/Wartet/Offset dazu; der Zustand wird pro Aufgabe gemerkt. Automatisch voll bei: an Claude delegiert, mindestens ein Beratungsfeld gefüllt, oder Abhängigkeiten vorhanden. Von den fünf Beratungsfeldern werden nur die gefüllten gezeigt, die leeren liegen hinter „Beratung ergänzen". Löschen mit Inline-Bestätigung.

**Kosten und Finanzen** (007): Jede Aufgabe kann Kostenzeilen tragen (Abschnitt „Kosten" in der Akte, eine Zeile je Betrag, Status `geschaetzt` → `angebot` → `beauftragt` → `faellig` → `bezahlt`, ein Schritt vor und einer zurück). Die Aufgabenzeile zeigt den gezählten Betrag als kleines Schild, „≈" solange alles geschätzt ist. Gezählt wird nach der Regel der View `costs_summary`; sie steht im Frontend genau einmal in `app/costs.js`. Eigene Ansicht **Finanzen** unter `#finanzen` (Fußzeile, am Desktop auch im Kopf, dazu die Kachel „Kosten"): oben die fünf Summen plus Saldo („wer schuldet wem"), Fälligkeiten, Puffer, Cashflow je Monat mit berechneter Doppelmiete und die laufenden Kosten alt/neu; darunter alle Aufgaben mit Kostenzeilen nach Phase, dort direkt bearbeitbar – dieselbe Komponente wie in der Akte. Die Auszugstermine, der Standardanteil und der Puffersatz liegen in einem aufklappbaren Einstellungsbereich derselben Ansicht.

**Anfragen** (033, Seitentyp seit 038): eigene Seite `#anfragen` (einzelne Anfrage `#anfragen=<id>`). Ab 900 px links die Liste (320 px – die festgelegte Ausnahme von Panel 400, weil die Vergleichstabelle die Breite braucht), rechts die Anfrage; ohne eigene Auswahl steht dort die erste Zeile. Die Liste ist eine klappbare Sektion mit Sektionskopf („Anfragen · 3 · 1 Ergebnis", „+ Anfrage", Chevron) und zweizeiligen Zeilen: Titel mit Chip „Ergebnis da" in Claude-Farbe, darunter die Segment-Leiter mit ihrer Stufe und die Aufgabe. Unter 900 px sind Liste und Anfrage eigene Seiten. Entwurf: Formular „Rahmen" je Kategorie (Umzug, Internet, Strom und Gas, Versicherung, Sonstiges; vorbelegt aus den Stammdaten, soweit es sie gibt) und als einziger Primär „An Claude senden". Ergebnis: Empfehlung in Claude-Farbe, Vergleichstabelle mit bis zu fünf Angeboten als Spalten (erste Spalte 104 px Zeilenlabel, günstigster Preis fett, abgelaufenes Angebot grau, die empfohlene Spalte sandfarben hinterlegt), „Wählen" in jeder Spaltenfußzeile – **Primär nur bei der Empfehlung, sonst Sekundär**. Unter 900 px ist der Vergleich transponiert: eine Zeile je Angebot mit Name und Preis, die angetippte klappt den Rest und „Wählen" auf. Dazu „ändern", „+ Angebot", Begründung, Quellen, bei Umzug „Anfragetext kopieren", darunter Kommentare als Rückkanal an Claude. Die Akte der verknüpften Aufgabe zeigt den Block „Anfrage" mit Leiter, der Kurzfassung „Claude empfiehlt …" und dem Link.

**Umzugstag** (009): Nach jedem erfolgreichen Laden legt die App den Datenstand lokal ab (`localStorage`). Ohne Verbindung zeigt sie diesen Stand **nur lesend** – Statuszeile „Offline – Stand von 09:41", Häkchen deaktiviert, Schreibversuche melden „Ohne Netz kannst du nur lesen". Kein Offline-Schreiben, kein Sync. Zurück im Netz lädt sie neu, ohne Seiten-Reload. „Umzugstag drucken" (Fußzeile) öffnet ein Blatt für Phase 4: Aufgaben nach Person mit Kästchen, Felder für Zählerstände (Strom/Gas/Wasser je Wohnung), Schlüsselliste und die Notfallkontakte aus `settings.umzugstag_kontakte` – reines `@media print`.

**Ladezustand** (013b): „Lade …" mit der leeren Gate-Leiste darunter, die sich in 1,2 s füllt und wieder leert, in Schleife – kein Spinner. Bei `prefers-reduced-motion` drei stehende Punkte.

Anforderungen an die Umsetzung: mobile-first (~380 px), Tap-Ziele ≥ 44 px, sichtbarer Fokus, `prefers-reduced-motion` respektieren, keine Dialoge (`confirm`/`prompt`) sondern Inline-Bestätigungen, Statuszeile mit Speicherzustand und Login-Identität. Autor von Kommentaren = eingeloggte Person (aus E-Mail → S/A gemappt, Mapping in `allowlist` als Spalte `person`).

Abweichungen vom Design und selbst entschiedene Zustände: `docs/changes/002-abweichungen.md`, `006-abweichungen.md`, `009-abweichungen.md`, `007-abweichungen.md`, `012-abweichungen.md`. Die Design-Tokens stammen aus dem Claude-Design-Handoff (`design/handoff/2026-09-13/`, Layout seit 009 aus `2026-09-22-b`).

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

## 7. Setup und erste Schritte

Setup-Reihenfolge, der ursprüngliche Smoke-Test und die Roadmap vom 13.09.2026 (beide erledigt) stehen in `docs/history.md`. Laufender Fahrplan seither: `docs/backlog.md` (Ideen, unsortiert) plus die Änderungsaufträge in `docs/changes/`.
