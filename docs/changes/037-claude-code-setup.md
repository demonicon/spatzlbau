# 037 – Claude-Code-Setup: Skills, Review-Subagent, Hooks, Allowlist, CLAUDE.md-Diät, Session-Regel

**Status: umgesetzt** (Branch `chore/037` → `preview`, kein `main`, kein Changelog-Eintrag –
Abweichungen: `037-abweichungen.md`)

Stand: 25.09.2026 · Release 2.2 · Branch: `chore/037` von `preview` · Modell: Sonnet · Aufwand: S–M
Anlass: Best-Practice-Abgleich 25.09. Entscheidung Sebastian: alle sieben Punkte. Läuft vor 032b und 033 – danach ist jeder Auftrag ein Zweizeiler. Punkt 5 (Diät) ist Zeile für Zeile gegen die CLAUDE.md vom 25.09. (83 Zeilen) zugeordnet.

## 1 · Skill `/auftrag NNN`

`.claude/skills/auftrag/SKILL.md`, `disable-model-invocation: true`, `$ARGUMENTS` = Nummer (z. B. `032b`). Ablauf, den der Skill erzwingt:

1. CLAUDE.md und `docs/changes/$ARGUMENTS-*.md` lesen (genau eine Datei; bei mehreren Treffern abbrechen und fragen).
2. Branch nach Kopfzeile des Auftrags anlegen (Typ/Name, Basis). Kein Branch, keine Arbeit.
3. **Aufwand M oder L:** Plan Mode – betroffene Dateien, Reihenfolge, Migrationen, offene Fragen als Liste; **Stopp**, bis Sebastian „Go" schreibt. Aufwand S: direkt.
4. Umsetzen. Migrationen immer zuerst als Dry-Run melden, dann anwenden (Regel aus CLAUDE.md).
5. Tests aus dem Auftrag real ausführen; Regression; `npm run check`.
6. **Review-Subagent** (Punkt 3) mit Diff + Auftrag aufrufen; gemeldete Lücken beheben, Review wiederholen, bis leer.
7. Merge nach `preview` (nie main – das ist `/release`), `gh run watch` bis grün, Live-Version des preview-Pfads per curl prüfen.
8. Bericht im Format aus `.claude/rules/report.md`: Commit, Tests n/n, Abweichungen, Run-Nummer, Live-Version, Review-Ergebnis. Ohne 7 kein Bericht.

## 2 · Skill `/release X.Y.Z`

`.claude/skills/release/SKILL.md`, `disable-model-invocation: true`. Ablauf: `npm run check` auf preview · Changelog: oberste Version = `$ARGUMENTS` · `git checkout main && git merge --no-ff preview` · Tag `v$ARGUMENTS` · Push mit Tags · `gh run watch` main · Smoke: `curl` beider `changelog.json`, Fußzeile beider Pfade = erwartete Versionen · zurück auf preview · Bericht: Run-Nummer, beide Live-Versionen. Bei rot: abbrechen, nichts zurückrollen, melden.

## 3 · Subagent `reviewer`

`.claude/agents/reviewer.md`: `model: opus`, `tools: Read, Grep, Glob, Bash` (kein Edit/Write). Prompt-Kern:
> Du siehst nur den Diff (`git diff preview...HEAD`) und den Auftrag `docs/changes/<NNN>`. Prüfe ausschließlich: (a) jedes Akzeptanzkriterium umgesetzt und getestet, (b) Regeln aus `.claude/rules/design.md` und `db.md` (Rot nur überfällig, Gelb nur fristkritisch ≤ 7 T, ein Primär je Ansicht, ein Signal je Zeile, tabular-nums, Tap-Ziele, keine Frontend-Summen, Migrationen additiv), (c) nichts außerhalb des Auftrags geändert. Melde nur Lücken, die Korrektheit oder Anforderungen betreffen, mit Datei und Zeile. Keine Stilmeinungen, keine Vorschläge für zusätzliche Abstraktionen. Leer, wenn nichts fehlt.

## 4 · Hooks (`.claude/settings.json`)

- **Stop-Hook:** `npm run check`; Exit ≠ 0 blockiert das Ende des Zugs mit der Ausgabe als Meldung.
- **PreToolUse (Bash):** blockiert `taskkill /IM`, `rm -rf`, `git push --force`, `git reset --hard`, `supabase db reset`, jeden `truncate`/`drop`/`delete from` in SQL-Aufrufen ohne `-- dry-run-ok`-Marker, und jedes Schreiben unter `design/handoff/` oder `design/snapshot/…/*.md`.
- **PreToolUse (Edit/Write):** blockiert `supabase/migrations/*.sql`, wenn im aktuellen Auftrag das Wort „Migration" nicht vorkommt (Grep auf die Auftragsdatei aus `$ARGUMENTS` bzw. Branch-Namen).
- **PostToolUse (Edit auf `changelog.json`):** `node -e "JSON.parse(...)"` sofort.
Hooks schreiben eine Zeile nach `.claude/hooks.log` (gitignored), damit Blockaden nachvollziehbar sind.

## 5 · CLAUDE.md-Diät + `.claude/rules/` (Zuordnung nach Sichtung der Fassung vom 25.09., 83 Zeilen)

Ziel: CLAUDE.md ≤ 50 Zeilen, ein Satz je Zeile, nur was Claude nicht erraten kann. Inhalte werden **verschoben, nicht neu erfunden**; Widersprüche werden aufgelöst (unten markiert). Jede gestrichene Zeile steht im Bericht.

| Heutige Zeilen | Ziel | Bemerkung |
|---|---|---|
| 1–3 Einleitung, BRIEFING/history/backlog | **Kern** | bleibt, 2 Zeilen |
| 5–8 Rollen | **Kern** | auf 2 Zeilen kürzen |
| 11 Aufträge in `docs/changes`, verbindliche Spezifikation | **Kern** | eine Zeile |
| 12–13 Branch `feature/<kurzname>` → main; SETUP/BRIEFING nachziehen | `rules/git.md` | **Widerspruch zu 48**: gilt seit 010 nicht mehr – Branch-Typen `feat/`, `fix/`, `chore/` von `preview`, Merge nach `preview`, `main` nur über `/release` |
| 15–18 Freeze, Bugfix-Definition, CLAUDE.md nur mit Bestätigung | **Kern** | 3 Zeilen, gekürzt |
| 19 Release-Check, Tag | `rules/git.md` | Tag dreiteilig `vX.Y.Z` (heute `vX.Y` – veraltet) |
| 20 Erlaubt ohne Meilenstein | `rules/git.md` | |
| 22–26 Changelog (Version, Felder, Anna-Testfrage) | `rules/changelog.md` | Version „Haupt.Neben.Patch" (heute „Haupt.Neben" – veraltet); Kern behält eine Zeile: „Sichtbare Änderung = Changelog-Eintrag, Regeln in rules/changelog.md" |
| 29–31 Stack, Sprache, Mobile-first | **Kern** | 3 Zeilen |
| 32–33 Rot/Gelb, Farb-Tokens | `rules/design.md` | plus 44 (Schrift aus Design-Export), plus die seit 020/029 geltenden Regeln, die nirgends stehen: ein Primär je Ansicht, ein Signal je Zeile, Buttons 40/32, tabular-nums, Kontrastmatrix-Pflicht bei Token-Änderung |
| 34–35, 37 Datenänderung feldgenau, seed.json, Migrationen | `rules/db.md` | plus: Migrationen additiv, Dry-Run vor Anwendung, View-Änderung drop+create, Summen nie im Frontend (`costs_summary`), Schreibregel Claude-Lauf (024) |
| 36 Secrets | **Kern** | |
| 38 Commit-Präfixe | `rules/git.md` | |
| 39 Vor Push index.html 380 px | `rules/tests.md` | |
| 40–41 `npm run check`, push ≠ deploy | **Kern** | bleiben |
| 46–49, 51 Preview-Deploy, zwei Ziele, nie gleicher Commit | `rules/git.md` | 49 („lokale Sitzungen mergen direkt nach main") streichen – gilt nicht mehr, `/release` ersetzt es |
| 50 Vorschau read-only für Nutzerstand | `BRIEFING.md` | ist App-Verhalten, keine Arbeitskonvention; in git.md ein Verweis |
| 53–58 Tests gegen Live-DB, Testserver PID | `rules/tests.md` | Kern behält eine Zeile: „Schreibtests an der Live-DB vorher ansagen, danach Nachweis" |
| 60–64 Prüftiefe, Bericht, Modell, Parallel | `rules/report.md` | Kern behält: „Modell: Sonnet; Opus bei L oder Layout-Umbau" |
| 66–70 + 72–77 zwei DoD-Blöcke | **Kern**, ein Block | zusammenführen: check grün · Run grün · Live-Version · beide Logins · Realtime · keine Konsolenfehler · SETUP/BRIEFING nachgezogen |
| 79–82 Was du nicht tust | **Kern** | |
| neu | **Kern** | Session-Regel (Punkt 6); Kompaktierung: „Beim Kompaktieren geänderte Dateien, Testbefehle und den Stand der Akzeptanzkriterien behalten."; Import-Zeilen `@.claude/rules/*.md` |

Ergebnis-Skelett (Ziel ~45 Zeilen): Einleitung · Rollen · Aufträge · Freeze · Stack/Sprache/Mobile · Secrets · check/push≠deploy · Modell · Schreibtests ansagen · Changelog-Pflicht · Session-Regel · Kompaktierung · Definition of Done (ein Block) · Was du nicht tust · Imports. Vier Regel-Dateien: `design.md`, `db.md`, `git.md`, `tests.md`, `report.md`, `changelog.md` (sechs, klein).

## 6 · Session-Regel (CLAUDE.md, Kern)

„Eine Session je Auftrag. Vor `/auftrag`: `/clear`, dann `/rename <NNN>`. Mehrere Aufträge = mehrere Sessions nacheinander, nie in einer."

## 7 · Allowlist (`.claude/settings.json`, `permissions.allow`)

`Bash(npm run check)`, `Bash(npm test*)`, `Bash(node scripts/*)`, `Bash(git *)` außer den in 4 blockierten, `Bash(gh run *)`, `Bash(gh pr *)`, `Bash(curl https://demonicon.github.io/*)`, `Bash(npx.cmd supabase functions deploy ics *)`, `Read`, `Edit`, `Write` im Repo. Alles andere fragt weiter – das sind dann nur noch die Fälle, die eine Entscheidung sind.

## Tests

- `/auftrag 032b` auf einem Wegwerf-Branch bis Schritt 3 laufen lassen (S → kein Plan-Stopp), Abbruch; `/auftrag 033` bis zum Plan-Stopp (M–L → Stopp mit Dateiliste).
- Stop-Hook: changelog.json absichtlich kaputt → Zug endet nicht, Meldung mit Zeile; repariert → endet.
- PreToolUse: `taskkill /IM node.exe` und ein `delete from costs` ohne Marker → blockiert, Log-Zeile vorhanden.
- Reviewer gegen den 032-Diff (bekannt, gemerged) → Ergebnis leer oder nur echte Lücken; gegen einen Diff mit absichtlich gefülltem zweitem Button → meldet „ein Primär je Ansicht".
- Allowlist: `npm run check` und `gh run watch` laufen ohne Prompt.
- `/release` als Trockenlauf auf einem Testbranch mit Tag `v0.0.0-test` (danach löschen).

## Akzeptanzkriterien

- [x] Beide Skills, Subagent, Hooks, Allowlist im Repo unter `.claude/` (committet; `hooks.log` gitignored)
- [x] CLAUDE.md ≤ 50 Zeilen, `wc -l` im Bericht; `.claude/rules/` mit sechs Dateien; Import-Zeilen in CLAUDE.md; die drei Widersprüche (Branch-Modell, Tag-Form, Versionsform) aufgelöst
- [x] Sechs Tests real durchgeführt; Testbranch/-Tag entfernt (siehe Abweichungen für Testmethodik bei Test 1 und 4)
- [x] Merge preview – **abweichend vom Auftragstext per Chat-Anweisung**: „kein main" für diesen Lauf, `/release` nur als Trockenlauf getestet (Test 6), nicht real gegen main ausgeführt
- [x] Bericht im neuen Format, mit Run-Nummer und Live-Version (preview)
