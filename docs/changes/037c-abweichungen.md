# 037c – Abweichungen

Start: 2026-09-25T21:06:24Z

## Tests (real ausgeführt)

- **Test 1** (`Art: Feature` ohne „Klärung" → Schritt stoppt mit drei Fragen): Testauftrag `docs/changes/999-test-dor.md` angelegt (`Art: Feature`, kein Klärung-Abschnitt), Schritt 2 real durchgeführt: drei Fragen (Ziel/Kontext/Abgrenzung) per `AskUserQuestion` an Sebastian gestellt, beantwortet, Antworten als „Frage → Antwort → Konsequenz" in den Abschnitt „Klärung" geschrieben und committet (Commit `4f854f8`). Grün.
- **Test 2** (`Art: Feature` mit „Klärung"/3 Antworten → kein Stopp; `Art: Bugfix` ohne „Klärung" → kein Stopp): Feature-Fall durch den gefüllten Testauftrag aus Test 1 bestätigt (Bedingung „≥ 3 beantwortete Fragen" erfüllt, kein weiterer Stopp ausgelöst). Bugfix-Fall durch Textprüfung bestätigt: Schritt 2 gilt laut Skill-Text ausdrücklich „nur bei `Art: Feature`" – kein separater Testauftrag nötig, da die Bedingung rein am Kopf-Feld `Art` hängt. Grün.
- **Test 3** (Reviewer gegen Feature-Diff mit nicht umgesetzter Konsequenz → Lücke): Subagent `reviewer` isoliert gegen `docs/changes/999-test-dor.md` aufgerufen (Prüfpunkt e), dessen dritte Konsequenz absichtlich in keiner Änderung/keinem Test der Datei vorkommt. Reviewer meldet die Lücke korrekt (Zeile 10 der Testdatei, Konsequenz nicht umgesetzt). Grün.
- Testauftrag `999-test-dor.md` danach wieder entfernt (Commit `2e5a6af`), keine weiteren Nebenwirkungen (kein Schreibzugriff auf die Live-Datenbank, kein Nutzerstand betroffen).

## Weitere Abweichungen

- `CLAUDE.md` blieb bei 50 Zeilen: die redundante Sektion „Schreibtests an der Live-Datenbank" entfernt, deren Inhalt bereits vollständig und ausführlicher in `.claude/rules/tests.md` steht (dort per `@`-Import geladen) – keine Information verloren.
- Kein UI-/App-Code geändert (nur `CLAUDE.md`, `.claude/skills/auftrag/SKILL.md`, `.claude/agents/reviewer.md`, `docs/changes/_vorlage.md`), daher kein 380-px-Browsertest, kein Changelog-Eintrag (Auftrag verlangt explizit „Kein Changelog, kein Release").

