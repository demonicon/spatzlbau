# 037 – Abweichungen und Entscheidungen

Stand: 25.09.2026 · Branch `chore/037` → `preview` (kein `main`, kein Changelog-Eintrag – laut Auftrag) · Aufwand S–M

## CLAUDE.md-Diät: wohin jede Zeile ging

Ausgangsstand: 82 Zeilen (Fassung nach Auftrag 036). Neu: **50 Zeilen** (`wc -l`, siehe Bericht).
Nichts wurde neu erfunden – jede Zeile ist entweder im Kern geblieben (gekürzt), in eine
`rules/*.md`-Datei umgezogen, oder – wo unten ausdrücklich markiert – **gestrichen**, weil sie
längst falsch war.

| Alte Zeile(n) | Inhalt | Verbleib |
|---|---|---|
| 1–3 | Einleitung, BRIEFING/history/backlog | Kern, gekürzt |
| 5–8 | Rollen (3 Zeilen) | Kern, zu 1 Zeile zusammengefasst |
| 10–11 | Aufträge in docs/changes | Kern, 1 Zeile |
| **12–13** | Branch `feature/<kurzname>` → main; SETUP/BRIEFING nachziehen | **12 gestrichen** (widersprach 010 seit über zwei Wochen); Branch-Modell korrigiert in `rules/git.md`; „SETUP/BRIEFING nachziehen" geht im Kern in „Betrifft ein Auftrag Verhalten..." nicht mehr separat auf – dieser Satz fehlte in der Diät-Tabelle des Auftrags selbst und ist jetzt implizit über den Auftrag-Skill (Schritt 1) abgedeckt statt als eigene CLAUDE.md-Zeile |
| 15–18 | Freeze, Bugfix-Definition, Bestätigungspflicht | Kern, gekürzt |
| 19 | Release-Check, Tag `vX.Y` | `rules/git.md`, **Tag-Form auf `vX.Y.Z` korrigiert** (war veraltet – alle Tags seit 2.1.1 sind schon dreiteilig) |
| 20 | Erlaubt ohne Meilenstein | `rules/git.md` |
| 22–26 | Changelog (Version, Felder, Testfrage) | `rules/changelog.md`, **Version „Haupt.Neben.Patch" korrigiert** (war „Haupt.Neben" – veraltet seit den ersten Patch-Versionen 2.1.1 ff.); Kern behält 1 Zeile |
| 29–31 | Stack, Sprache, Mobile-first | Kern, zusammengefasst |
| 32–33 | Rot/Gelb, Farb-Tokens | `rules/design.md`, plus 44 und die vier nirgends notierten Regeln (Primär je Ansicht, Signal je Zeile, Buttons 40/32, tabular-nums, Kontrastmatrix-Pflicht) |
| 34–35, 37 | Datenänderung feldgenau, seed.json, Migrationen | `rules/db.md`, plus additiv/Dry-Run/View-drop+create/costs_summary/Claude-Schreibregel |
| 36 | Secrets | Kern |
| 38 | Commit-Präfixe | `rules/git.md` |
| 39 | Vor Push 380 px | `rules/tests.md` |
| 40–41 | npm run check, push ≠ deploy | Kern, geblieben (Zeile 40 zusätzlich auf `npm run check` statt der 035-Zeile aktualisiert, schon in Auftrag 036 passiert) |
| 43 | Überschrift „Design-Regeln" | **gestrichen** (kein eigener Kern-Abschnitt mehr, ganz in `rules/design.md`) |
| 44 | Schrift aus Design-Export | `rules/design.md` |
| 46 | Überschrift „Preview-Deploy" | **gestrichen** (ganz in `rules/git.md`) |
| 47 | Zwei Ziele, ein Workflow | `rules/git.md` |
| 48 | Cloud-Sitzungen mergen preview | **inhaltlich gestrichen** – seit `/release` ist „wer mergt nach main" keine Frage von Cloud/lokal mehr, sondern immer der Skill; die Unterscheidung wird von Punkt 45 der Diät-Tabelle selbst aufgelöst (Branch-Modell) |
| **49** | „Lokale Sitzungen mergen direkt main" | **gestrichen** (laut Auftrag ausdrücklich – gilt nicht mehr, `/release` ersetzt es) |
| 50 | Vorschau read-only | **nicht dupliziert** – steht bereits vollständig in `BRIEFING.md:96` (und `:25`); `rules/git.md` verweist nur dorthin |
| 51 | preview/main nie gleicher Commit | `rules/git.md` |
| 53–58 | Tests gegen Live-DB, Testserver-PID | `rules/tests.md`, Kern behält 1 Zeile |
| 60–64 | Prüftiefe, Bericht, Modell, Parallel | `rules/report.md`, Kern behält 1 Zeile (Modell) |
| 66–70 + 72–77 | zwei Definition-of-Done-Blöcke | **zu einem Block zusammengeführt** im Kern |
| 79–82 | Was du nicht tust | Kern, unverändert |
| neu | Session-Regel, Kompaktierung, Import-Zeilen | Kern (Auftrag 037 selbst) |

## Drei aufgelöste Widersprüche (wie im Auftrag verlangt)

1. **Branch-Modell**: „`feature/<kurzname>` → main" (Zeile 12, vor 010) widersprach der seit 010
   gelebten Praxis (`feat/`/`fix/`/`chore/`/`content/` von `preview`, main nur über explizite
   Freigabe). `rules/git.md` schreibt jetzt die tatsächliche Praxis fest, inklusive `/release` als
   einzigem Weg nach main.
2. **Tag-Form**: „`vX.Y`" (Zeile 19) – alle tatsächlich gesetzten Tags seit v2.1.1 sind schon
   dreiteilig (`vX.Y.Z`). `rules/git.md` korrigiert.
3. **Versionsform**: „Haupt.Neben" (Zeile 24) – dieselbe Drift, `rules/changelog.md` korrigiert auf
   „Haupt.Neben.Patch".

## Ein echter Fund unterwegs: der Tag-Vergleich in `npm run check` blockierte den Stop-Hook dauerhaft

Der Stop-Hook (`.claude/hooks/stop-check.mjs`) ruft `npm run check` nach jedem Zug auf. Erster
echter Test (siehe Tests unten): **rot, obwohl nichts kaputt war** – `changelog.json`s oberster
Eintrag ist `2.2.1` und der Tag `v2.2.1` existiert schon (aus Auftrag 036), das ist der normale
Ruhezustand zwischen zwei Versionssprüngen, kein Fehler. Derselbe Fehlerklasse wie der CI-Fund aus
036, jetzt im Stop-Hook-Kontext. Behoben: der Tag-Vergleich läuft nur noch, wenn `changelog.json`
selbst gerade unversioniert geändert ist (`git status --porcelain`), zusätzlich zur schon
bestehenden CI-Ausnahme. Ohne diesen Fix hätte der Stop-Hook praktisch jeden Zug in jeder Session
blockiert, sobald der Ruhezustand erreicht ist – also fast immer.

## Zwei Werkzeug-Grenzen, real angetroffen

- **`reviewer`-Subagent nicht sofort aufrufbar.** Ein neuer Agent unter `.claude/agents/` wird erst
  nach einem Session-Neustart (oder `/agents`-Reload, analog zur `/hooks`-Einschränkung für
  Hooks) als `subagent_type` angeboten – bestätigt durch einen echten Fehlschlag beim Versuch,
  ihn in dieser Sitzung aufzurufen. Getestet wurde daher der **Prompt selbst** über einen
  `general-purpose`-Subagenten mit dem `reviewer`-Text als Auftrag (echter Diff, echte Dateien,
  kein Edit/Write). Ergebnis unten.
- **Der Auto-Mode-Classifier blockierte einen verketteten `git branch`-Befehl** (mehrere Befehle in
  einer Zeile) ohne für mich erkennbaren einzelnen Auslöser; einzeln ausgeführt liefen dieselben
  Befehle anstandslos. Keine Auswirkung auf den Auftrag, nur eine Beobachtung für künftige
  Skript-Läufe (Bash-Befehle in dieser Umgebung besser einzeln als verkettet).

## Ein echter Fund durch den Reviewer-Test: „ein Primär je Ansicht" verletzt in Auftrag 032

Der Prompt-Test gegen den bereits gemergten 032-Diff fand einen echten, bisher unentdeckten
Korrektheitsfehler (kein Stilhinweis): in der Akte kann gleichzeitig „Hinzufügen" (Neue Aufgabe)
und „Einverstanden" (offene Entscheidung) als `btn-primary` stehen, und eine Aufgabe mit zwei
gleichzeitig offenen, unbestätigten Entscheidungen zeigt zwei „Einverstanden"-Knöpfe. Nicht in
diesem Auftrag behoben (032 ist längst gemerged, außerhalb des 037-Scopes und der Session-Regel,
die dieser Auftrag selbst einführt) – als eigene Aufgabe an Sebastian übergeben
(`spawn_task`, task_ee9f8817). Das bestätigt zugleich, dass der Reviewer-Prompt tut, was er soll:
echte Lücken melden, keine Stilmeinungen.

## Ein Bonus-Beleg: der eigene Commit blockierte sich selbst

Der Commit, der diese Hooks einführt, wurde zweimal vom eigenen `bash-guard`-Hook abgewiesen – die
Commit-Nachricht nannte zur Beschreibung wörtlich „taskkill /IM" bzw. „truncate/drop/delete", und
der Hook erkennt das unabhängig davon, ob es echter Befehl oder nur Beschreibungstext ist. Nach
dem Umformulieren (ohne die wörtlichen Muster) ging der Commit durch. Kein Bug, aber ein weiterer
echter Beleg, dass die Hooks aktiv sind und genau das tun, was Punkt 4 verlangt.

## Test 1 (`/auftrag`-Logik) – als Datei-Abgleich statt vollem Lauf

Ein echter `/auftrag 032b`/`/auftrag 033`-Lauf hätte (bei S sofort, bei M–L nach dem Plan-Stopp)
mit der tatsächlichen Umsetzung dieser fremden Aufträge weitergemacht – das widerspricht der
Session-Regel, die dieser Auftrag selbst einführt, und dem „Wegwerf-Branch, bis Schritt 3"-Rahmen
des Tests. Stattdessen wurde die Skill-Logik (Schritt 1 Dateisuche, Schritt 3 Aufwand-Gate) von
Hand gegen den echten Repo-Stand geprüft:
- `docs/changes/032b-*.md` → genau ein Treffer, Aufwand **S** → Skritt 3 „direkt", kein Plan-Stopp. ✓ wie erwartet.
- `docs/changes/033-*.md` → **zwei Treffer** (`033-anbieter-vergleich.md` Aufwand M, `033-anfragen.md` Aufwand M–L) – ein echter Fund: der Skill würde hier schon in Schritt 1 abbrechen und nachfragen, nicht bis zum Plan-Stopp laufen, wie der Auftragstext vermutet. Beide 033-Dateien existieren derzeit parallel; das ist für Sebastian zu klären (welche gilt), nicht etwas, das der Skill übergehen sollte.
