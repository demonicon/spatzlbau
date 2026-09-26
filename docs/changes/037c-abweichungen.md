# 037c – Abweichungen

Start: 2026-09-25T21:06:24Z

## Tests

- **Test 1** (`Art: Feature` ohne „Klärung" → Schritt stoppt mit drei Fragen) – **real ausgeführt, grün.** Testauftrag `docs/changes/999-test-dor.md` angelegt (`Art: Feature`, kein Klärung-Abschnitt), Schritt real durchgeführt: drei Fragen (Ziel/Kontext/Abgrenzung) per `AskUserQuestion` an Sebastian gestellt, beantwortet, Antworten als „Frage → Antwort → Konsequenz" in den Abschnitt „Klärung" geschrieben und committet (Commit `4f854f8`).
- **Test 2** (`Art: Feature` mit „Klärung"/3 Antworten → kein Stopp; `Art: Bugfix` ohne „Klärung" → kein Stopp) – **real ausgeführt, grün.** Feature-Teil am gefüllten Testauftrag aus Test 1 bestätigt (Bedingung „≥ 3 beantwortete Fragen" erfüllt, kein weiterer Stopp ausgelöst). Bugfix-Teil mit zweitem Testauftrag `docs/changes/999b-test-dor-bugfix.md` (`Art: Bugfix`, kein Klärung-Abschnitt) durchgeführt (Commit `1a9cd8c`): Schritt 3 greift laut Skill-Text nur bei `Art: Feature`, entsprechend wurde kein `AskUserQuestion` ausgelöst, direkt weiter.
- **Test 3** (Reviewer gegen Feature-Diff mit nicht umgesetzter Konsequenz → Lücke) – **real ausgeführt, grün.** Subagent `reviewer` isoliert gegen `docs/changes/999-test-dor.md` aufgerufen (Prüfpunkt e), dessen dritte Konsequenz absichtlich in keiner Änderung/keinem Test der Datei vorkommt. Reviewer meldet die Lücke korrekt (Zeile 10 der Testdatei, Konsequenz nicht umgesetzt).
- Testaufträge `999-test-dor.md` (Commit `2e5a6af`) und `999b-test-dor-bugfix.md` (Commit `84e1585`) danach wieder entfernt, keine weiteren Nebenwirkungen (kein Schreibzugriff auf die Live-Datenbank, kein Nutzerstand betroffen).

## Weitere Abweichungen

- `CLAUDE.md` blieb bei 50 Zeilen: die redundante Sektion „Schreibtests an der Live-Datenbank" entfernt, deren Inhalt bereits vollständig und ausführlicher in `.claude/rules/tests.md` steht (dort per `@`-Import geladen) – keine Information verloren.
- **Reihenfolge Schritt 2/3 vertauscht gegenüber Auftragstext.** Auftrag verlangt „neuer Schritt 0 (vor dem Branch)". Umgesetzt als: Schritt 2 Branch, Schritt 3 Definition of Ready (statt umgekehrt). Grund: Die Klärungs-Antworten werden committet; ohne vorher angelegten Feature-/Bugfix-/Chore-Branch würde dieser Commit auf dem gerade ausgecheckten Branch landen (im Zweifel `preview`), was `rules/git.md` widerspricht (Arbeit nur auf `feat/`/`fix/`/`chore/`/`content/`, `main`/`preview` nie direkt). Die vom Reviewer gefundene Reihenfolge-Lücke wurde damit behoben; Sebastian kann das im Bericht gegenprüfen.
- **Standardwert bei fehlendem `Art`-Feld** („gilt `Feature`") ergänzt in `SKILL.md` Schritt 3, `reviewer.md` Punkt (e) und `_vorlage.md` – fehlte in der ersten Fassung, vom Reviewer gefunden.
- Kein UI-/App-Code geändert (nur `CLAUDE.md`, `.claude/skills/auftrag/SKILL.md`, `.claude/agents/reviewer.md`, `docs/changes/_vorlage.md`), daher kein 380-px-Browsertest, kein Changelog-Eintrag (Auftrag verlangt explizit „Kein Changelog, kein Release").

