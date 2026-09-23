# CLAUDE.md – Spatzlbau (Umzugs-PWA)

Lies zuerst `BRIEFING.md`. Es enthält Konzept, Datenmodell, technische Entscheidungen und Sichten. Diese Datei enthält nur Arbeitskonventionen. Erledigtes (Setup, ursprünglicher Smoke-Test, alte Roadmap) steht in `docs/history.md`; laufende Ideen ohne Auftrag in `docs/backlog.md`.

## Rollen
- **Claude im Chat:** Konzept, Inhalte (Seed), Reviews, Delegations-Schleife mit den Nutzern. Änderungen kommen von dort als klarer Auftrag.
- **Du (Claude Code):** Umsetzung, Deployment, Datenbank-Skripte, Bugfixes, UX/UI-Iterationen.
- **Sebastian:** Product Owner, klickt Supabase/GitHub-Setup, testet mit Anna.

## Änderungsaufträge
- Änderungsaufträge liegen in `docs/changes/NNN-kurzname.md` (fortlaufend nummeriert, Vorlage: Warum / Was sich ändert / Was Sebastian tut / Akzeptanzkriterien / Handy-Check). Sie kommen aus dem Chat und sind die verbindliche Spezifikation.
- Umsetzung auf einem Branch `feature/<kurzname>`; nach Abnahme Merge in `main`. Beim Abschluss den Status im Auftrag auf „umgesetzt“ setzen und offene Punkte dort notieren.
- Betrifft ein Auftrag Verhalten oder Setup, werden `SETUP.md` / `BRIEFING.md` im selben Branch nachgezogen.

## Freeze und Meilensteine (seit Auftrag 015)
- Ein Freeze ist ein **stabiler Meilenstein**, keine Pause. Nach 1.0 nur noch Nebenversionen (1.1, 1.2 …) für Bugfixes. Einen neuen Meilenstein (2.0 …) eröffnet **nur Sebastian**; bei einem Feature-Wunsch daran erinnern und explizit nachfragen, nicht einfach bauen.
- **Bugfix:** etwas, das vorher funktioniert hat und jetzt nicht mehr – oder ein Verhalten, das Daten falsch speichert oder anzeigt. Alles andere ist ein Feature und geht in `docs/backlog.md`.
- `CLAUDE.md` / `BRIEFING.md` nur nach ausdrücklicher Bestätigung durch Sebastian ändern; Auftragsstatus und Abweichungslisten nachführen ist davon ausgenommen.
- Vor jedem Meilenstein: `docs/release-check.md` (Vorlage) kopiert nach `docs/release-check-<Version>.md` und ausgefüllt. Rot bei Sicherheit oder Daten blockiert den Meilenstein, Rot anderswo wird der erste Bugfix der Nebenversion. Git-Tag `vX.Y` auf den Merge-Commit.
- Weiter erlaubt ohne Meilenstein-Eröffnung: Inhaltspakete über den Seed-Workflow, Migrationen nur für Inhalte, tägliches Backup, wöchentliche Kontrolle; keine Abhängigkeits-Updates ohne Bugfix-Grund.

## Changelog (`changelog.json`)
- Jeder PR, der etwas Sichtbares ändert, ergänzt `changelog.json` um einen Eintrag oder erweitert den Eintrag des Tages. Ein PR mit sichtbarer Änderung ohne Changelog-Eintrag gilt als unvollständig.
- `version`: bis Auftrag 015 das Deploy-Datum (`JJJJ.MM.TT`, weitere Deploys am selben Tag `.2`, `.3` …). Seit Meilenstein 1.0 eine Release-Nummer `Haupt.Neben` – ein Bugfix-PR erhöht die Nebenversion, ein neuer Meilenstein die Hauptversion (siehe oben). `compareVersions` (`app/changelog.js`) behandelt jede drei- oder vierteilige Version, deren erster Teil eine Jahreszahl `20xx` ist, als Datums-Version und jede andere als Release-Nummer; eine Release-Nummer gilt dabei immer als neuer als jede Datums-Version. Jeder Eintrag trägt zusätzlich `release` (Meilenstein-Gruppe fürs Changelog-Panel) und der neueste Eintrag `date` (für den Footer-Tooltip). Der erste Eintrag ist die Version, die die App im Footer zeigt (einzige Quelle; Datum/Commit-SHA nur Tooltip). Neueste Version zuerst.
- Felder `title` (ein Satz, was die Version für die Nutzer bedeutet), `new` / `improved` / `fixed` (je 0–5 kurze Sätze; leere Listen bleiben leer).
- Testfrage für jeden Satz: *Versteht Anna, was sich für sie beim Benutzen ändert?* Keine Technikbegriffe (kein „Service Worker“, „Refactoring“, „RLS“, „Branch“). Statt „Filter-State wird persistiert“ → „Die App merkt sich, welche Phase du zuletzt offen hattest.“ Rein technische Änderungen ohne sichtbare Wirkung bekommen keinen Eintrag.

## Konventionen
- Vanilla JS, ES-Module, kein Build-Step, kein Framework. Keine neuen Abhängigkeiten ohne Rückfrage; Supabase-JS per CDN-ESM-Import.
- UI-Texte Deutsch, Code und Kommentare Englisch. Kein Denglisch in Buttons.
- Mobile-first, Tap-Ziele ≥ 44 px, keine `confirm`/`prompt`/`alert`.
- **Rot = überfällig oder unwiderruflich.** `--danger`/`--danger-bg` tragen nur zwei Dinge: eine verstrichene Frist (überfällig) und einen Schritt, der sich nicht zurücknehmen lässt (Löschen-Knöpfe, Löschen-Rückfragen – die Konvention kennt jeder). Alles andere Dringliche, allen voran „wartet auf dich", wird über Fettung und einen Umriss in Textfarbe hervorgehoben, nicht über Farbe. Gelb (`--mark`) gehört genauso ausschließlich zu „fristkritisch". Fehler- und Offline-Hinweise bleiben rot: sie melden einen Fehlzustand, keine Dringlichkeit. (Festgelegt am 22.09.2026, Auftrag 015.)
- Farb-Tokens: Text nur mit Tokens, die auf `--paper` und Weiß mindestens 4,5:1 erreichen (`--ink`, `--ink-2`, `--ink-3`, `--danger`, Owner-Farben auf ihren Flächen). `--mark-deep` nie für Text; Tokens unter 4,5:1 (`--line`, `--line-dash`, `--mark`, Hintergründe) nur für Rahmen und Flächen.
- Jede Datenänderung geht feldgenau über Supabase (`update` einzelner Spalten/Zeilen), nie den Gesamtstand überschreiben.
- `seed.json` ist die einzige Quelle für Stammaufgaben und Beratungstexte. Inhaltsänderungen = Seed ändern + `scripts/seed.mjs` ausführen (merge, nie destruktiv).
- Secrets: `.env` lokal (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), in `.gitignore`. Anon-Key darf ins Repo. Seit Auftrag 010 kein Export-Token mehr – Claude im Chat liest über den Supabase-Connector.
- Schema-Änderungen als neue Datei in `supabase/migrations/NNN_aXXX_<thema>.sql` (NNN fortlaufend, XXX = Nummer des Änderungsauftrags, z. B. `005_a004_costs.sql`); `schema.sql` bleibt der Gesamtstand für Neueinrichtung. Die Migrationen 001–004 stammen von vor dieser Regel und behalten ihre Namen.
- Commit-Messages: Präfix `feat:`, `fix:`, `content:`, `chore:`. Kleine Commits.
- Vor dem Push: `index.html` lokal öffnen (Live-Server) und auf ~380 px prüfen.

## Design-Regeln
- Schrift, Gewichte und Größen kommen aus dem Claude-Design-Export des jeweiligen Auftrags, nicht aus dem Bestand. Keine neue Familie, kein neues Gewicht ohne Vorlage. (Festgelegt am 23.09.2026, Auftrag 020b.)

## Preview-Deploy (Auftrag 010)
- Zwei Ziele, ein Pages-Workflow, eine Datenbank: `main` → `/`, Branch `preview` → `/preview/`. Jeder Deploy baut beide neu (der jeweils andere Branch wird mitgecheckt, sonst würde ein Push den anderen Pfad löschen).
- Cloud-Sitzungen (ohne direkten Kontakt zu Sebastian) mergen ihre Branches nach `preview`, nicht nach `main`. Sebastian prüft `/preview/` am Handy (erkennbar am Hinweis „Vorschau“ in der Statuszeile) und merged danach selbst `preview` → `main`.
- Lokale Sitzungen mit Sebastian im Chat mergen wie gehabt direkt nach `main`, sobald er zustimmt.
- **Die Vorschau ist für den Nutzerstand read-only.** `/preview/` schreibt nie in `allowlist`: `last_seen_version`, `last_visit_at` und `seen_comments` bleiben unberührt (`ui.preview` in `app/state.js` stoppt genau die drei Schreibwege). Changelog-Automatik und „Seit deinem letzten Besuch" zeigen dort den Live-Stand, ohne ihn zu verändern – was in der Vorschau weggeklickt wird, kommt in der echten App wieder. Die Statuszeile sagt es in jedem Zustand: „Vorschau – Lesestand wird nicht gespeichert". Aufgaben, Teilschritte, Kommentare, Kosten und Einstellungen schreibt die Vorschau weiterhin in dieselbe Datenbank – sie ist eine Vorschau der App, keine zweite Welt.
- **`preview` und `main` nie auf denselben Commit setzen.** GitHub Pages erkennt Deploys am Commit der auslösenden Branch; steht derselbe Commit schon einmal deployt, wird der Lauf still übersprungen und die Seite behält den alten Inhalt. Der Workflow prüft nach jedem Deploy, was tatsächlich ausgeliefert wird, und schlägt in dem Fall fehl (statt grün zu lügen). `preview` nach einer Übernahme also nicht per Fast-Forward auf `main` ziehen, sondern mit dem nächsten echten Commit weiterarbeiten.

## Tests gegen die Live-Datenbank
- Tests, die als echte Person (Sebastian oder Anna) eingeloggt laufen oder in die Live-Datenbank schreiben, werden **vorher angesagt** – nicht nebenbei erledigt. Lesende Abfragen und in Transaktionen zurückgerollte Migrationsprüfungen sind davon nicht betroffen.
- Testdaten werden danach entfernt und der Nachweis gezeigt (Abfrage mit Ergebnis, nicht nur die Behauptung). Das gilt auch für Nebenwirkungen: `last_seen_version`, `last_visit_at`, `seen_comments`, `done_by`, `status`, Briefing-Felder, `settings`-Schlüssel.
- Jede Änderung am Nutzerstand steht im Bericht – auch die, die bewusst stehen bleibt, mit Begründung.
- Sicherer Weg, wo möglich: Zustände im Browser simulieren (nur `state`/`ui` setzen, nichts schreiben) statt echte Zeilen anzufassen.
- Eigenen Testserver nur über seine PID beenden, nie prozessweit.

## Prüftiefe, Bericht, Modell (seit Auftrag 015)
- **Aufwand im Auftragskopf (S/M/L) steuert die Prüftiefe:** S = Akzeptanzkriterien, eine Breite (380 px), kein Pixelvergleich, Bericht ≤ 10 Zeilen. M = zwei Breiten, Pixelvergleich nur bei Layout-Änderung, Bericht ≤ 20 Zeilen. L = volle Prüfung. Die Ansage-Pflicht für Schreibtests und die Rollback-Prüfung von Migrationen gelten immer, unabhängig vom Aufwand.
- **Bericht = Abweichungen, Entscheidungen, was Sebastian tun muss.** Was funktioniert, steht in der Abweichungsliste im Auftrag, nicht im Chat-Bericht. Letzte Zeile jedes Berichts: die Ist-Laufzeit.
- **Modell und Effort:** Sonnet, Effort standard als Default. Opus nur bei Aufwand L oder einem Layout-Umbau; eine höhere Reasoning-Stufe nur auf Ansage.
- **Parallel:** Zwei Aufträge ohne gemeinsame Dateien dürfen in zwei Cloud-Sitzungen auf getrennten Branches laufen; beide mergen nach `preview`, Reihenfolge nach Fertigstellung.

## Definition of Done pro Aufgabe
- Funktioniert eingeloggt als beide Personen (zwei Browserprofile)
- Realtime-Update sichtbar
- Keine Konsolenfehler
- `SETUP.md` / `BRIEFING.md` angepasst, falls Verhalten oder Setup sich ändern

## Was du nicht tust
- Konzept oder Datenmodell eigenmächtig umbauen – Rückfrage an Sebastian
- Service-Role-Key oder E-Mail-Adressen committen
- Offline-Sync bauen (bewusst außerhalb des Scopes)
