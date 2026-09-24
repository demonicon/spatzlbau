# 032 – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `feat/032` → `preview` · Aufwand S–M
Migration `021_a032_decisions.sql` – **eingespielt** (Dry-Run vorher, Trigger-Regeln per Connector
nachvollzogen). Tests: fünf Live-Tests aus dem Auftrag mit zwei echten Logins (Sebastian, Anna,
zweiter Tab für Realtime) – angesagt, alle Testkommentare danach gelöscht, Nachweis unten. Dazu
ein Test ohne Datenbank (9/9, Screenshots 380/1280 in `design/snapshot/2026-09-24-032/`) und
Regression (`scen014e` 10/10, `scen030` 14/14).

## Entscheidungen im Zweifel

1. **`tg_op` gehört groß geschrieben.** Der erste Trigger-Entwurf verglich `tg_op = 'insert'`
   (klein) – Postgres liefert `TG_OP` immer als `'INSERT'`/`'UPDATE'`, der Vergleich griff nie, das
   Autor-Häkchen blieb leer. Beim Dry-Run gefunden (Test 1 zeigte `ack_s: null` statt gesetzt),
   `costs_before_write()` in `schema.sql` bestätigt die Großschreibung als bestehende Konvention.
2. **Die Reihenfolge zählt beim Ersetzen.** „Bekommen alle älteren bestätigten Entscheidungen …
   `superseded_by`" – der Trigger vergleicht zusätzlich `created_at < new.created_at`, nicht nur
   „ein anderer Datensatz ist schon bestätigt". Ohne das würde eine früh angelegte, aber spät
   bestätigte Entscheidung eine bereits bestätigte *neuere* fälschlich ersetzen.
3. **`wartet auf dich` bekommt die Entscheidung dazu, ohne `waitsOnMe()`s Claude-Sonderfall
   anzufassen.** `waitsOnMe()` (filters.js) zählte für die Dashboard-Kachel schon immer auch
   „Claude hat geliefert" mit – die Zeilen-Chips in `task.js`/`timeline.js` prüften bisher aber nur
   `wait_on` direkt, nicht `waitsOnMe()`. Ein einfaches Umstellen auf `waitsOnMe()` hätte dort
   still ein zweites, bisher nicht gezeigtes Signal (Claude-Ergebnis) eingeführt – das war nicht
   beauftragt. Die Chips prüfen darum `wait_on` und die offene Entscheidung direkt, nicht über
   `waitsOnMe()`.
4. **Wartet-auf-den-anderen ist eine leise Zeile, kein eigener Chip.** Der Auftrag nennt für die
   angeheftete Karte nur zwei Zustände (Chip+Einverstanden vs. zwei Kreise) – für die dritte,
   unbenannte Lage (das eigene Häkchen ist schon gesetzt, das andere noch nicht) zeigt die Karte
   still „wartet auf [Name]", damit der Autor nicht denkt, nichts sei passiert. Dieselbe Ergänzung
   in der Liste (Status-Spalte) statt „wartet auf dich" bei fremdem Ausstehen.
5. **Liste, Filter „bestätigt".** Zählt jede Entscheidung mit beiden Häkchen, auch eine inzwischen
   ersetzte – die war tatsächlich bestätigt, ihr Status-Chip zeigt trotzdem „ersetzt" statt „✓
   bestätigt". „Offen" ist damit automatisch die Ergänzungsmenge (fehlt mindestens ein Häkchen).
6. **Desktop und Handy sind zwei echte Wege, kein Kompromiss.** `ui.decisionsOpen` tauscht auf dem
   Panel (≥ 1180 px) nur den rechten Inhalt, die Spalten bleiben stehen; unter 1180 px navigiert
   `#entscheidungen` wie `#finanzen` weg von der Liste. Beide rufen dieselbe
   `decisionsListHTML()`.
7. **Kein gemeinsames Modul über Edge-Function/Frontend hinweg** (wie schon in 022c/034): `ics.js`
   und `finanzen.js`/`state.js` haben je eigene kleine Kopien der immer gleichen Prüfungen.
8. **Claude-Schutz zusätzlich im Trigger**, nicht nur im Client: `author = 'C'` setzt `decision`
   serverseitig auf `false`, egal was die Zeile sonst sagt – „darf nicht markieren" gilt damit auch
   für einen künftigen Schreibweg, der nicht durch die App läuft (z. B. `scripts/claude-result.mjs`,
   das ohnehin nie `decision` mitschickt).

## Live-Test (zwei echte Logins, Aufgabe `umzugsfirma`, danach entfernt)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Sebastian: „Entschieden: …" hakt die Checkbox live vor | ja |
| 2 | Kommentar gespeichert, `decision`/`ack_s` gesetzt, Karte angeheftet | ja |
| 3 | Anna (zweiter Tab, kein Reload): Karte, Chip „wartet auf dich", ein Primär „Einverstanden" | ja |
| 4 | Anna tippt Einverstanden → zwei Kreise, Chip weg, „bestätigt · Do 24.09." | ja |
| 5 | Sebastian (kein Reload): sieht dieselben zwei Kreise über Realtime | ja |
| 6 | Zweite Entscheidung an derselben Aufgabe, beide bestätigen → erste zeigt „ersetzt", durchgestrichen (Realtime) | ja |
| 7 | Text ohne „Entschieden:" hakt die Checkbox nicht vor | ja |
| 8 | Claude-Kommentar (Service-Role, wie `claude-result.mjs`): `decision=false` trotz keines Versuchs, kein Umschalter im UI | ja |
| 9 | Keine Konsolenfehler in beiden Tabs | ja |

Aufräumen: vier Testkommentare angelegt (drei über die UI, einer per Service-Role als
Claude-Kommentar), alle vier per `id` gelöscht. Ein Rest aus einem ersten, fehlgeschlagenen
Testlauf (Namensfehler im Test selbst, nicht im Code) blieb einmal stehen und wurde von Hand
nachgeräumt; `select … where task_id = 'umzugsfirma'` zeigt danach 0 Zeilen.

## Ein echter Fund unterwegs: `changelog.json` war seit 2.1.2 kein gültiges JSON mehr

Beim Ergänzen des 2.2.0-Eintrags fiel auf: `JSON.parse(changelog.json)` schlägt fehl – der
2.1.2-Eintrag (aus dieser Sitzung, Auftrag 034) hatte gerade Anführungszeichen mitten in einer
„…"-Zeichenkette (`„bezahlt am", …`), was die Zeichenkette vorzeitig beendet. `loadChangelog()`
fängt den Fehler ab und zeigt dann `entries: []` – die Folge: die Kachel „Was ist neu?" ist leer,
und `hasUnread()` löst nie mehr aus (`newestVersion()` liefert `null`), das Panel öffnet sich also
nie mehr automatisch nach dem Login. **Das steht bereits so auf `main`** (seit dem 034-Merge).
Mit diesem Auftrag behoben (durchgehend „…“ mit typografischen Anführungszeichen statt gerader),
lokal mit `node -e "JSON.parse(...)"` geprüft. Läuft über `preview` mit; **`main` bleibt kaputt,
bis jemand `preview` → `main` merged** – das ist außerhalb dieses Auftrags (Sebastians
Entscheidung, wann main angefasst wird), aber dringend genug für einen eigenen Hinweis im Bericht.

## Nicht geprüft

- Das echte Push/Benachrichtigungsverhalten auf einem iPhone – außerhalb des Scopes (kein Push in
  dieser App).
- Die seltene Verschränkung „zwei offene Entscheidungen an derselben Aufgabe, in umgekehrter
  Bestätigungsreihenfolge" (Punkt 2 oben) – vom Auftrag nicht verlangt, im Trigger bewusst einfach
  gehalten.
