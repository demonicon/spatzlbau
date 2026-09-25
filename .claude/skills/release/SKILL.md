---
name: release
description: preview nach main heben - Changelog-Version setzen, mergen, taggen, deployen, live pruefen. Aufruf "/release X.Y.Z" mit der neuen Version, z. B. "/release 2.2.1".
disable-model-invocation: true
---

# /release $ARGUMENTS

Hebt den aktuellen Stand von `preview` nach `main`. Bei Rot auf halbem Weg: **abbrechen, nichts zurückrollen, melden** – nicht selbst reparieren.

1. Startzeit merken (`Start: <ISO-Zeit>`) – Grundlage für die Ist-Laufzeit in Schritt 10. Kein eigenes `docs/changes/<NNN>-*.md` (ein Release kann mehrere Aufträge bündeln); die Zeit lebt nur für diesen Lauf, bis Schritt 10 sie im Bericht verrechnet.
2. `npm run check` auf `preview`. Rot → abbrechen, melden.
3. `changelog.json` prüfen: oberster Eintrag hat `version` = `$ARGUMENTS`. Fehlt der Eintrag oder stimmt die Version nicht, abbrechen und nachfragen (kein eigenmächtiges Anlegen des Eintrags – der gehört zum jeweiligen Auftrag).
4. `git checkout main && git merge --no-ff preview`.
5. Tag `v$ARGUMENTS` auf den Merge-Commit (`rules/git.md`: dreiteilig).
6. Push mit Tags.
7. `gh run watch` auf den main-Lauf, bis grün.
8. Smoke: `curl` beider `changelog.json` (main und `/preview/`), Fußzeile beider Pfade = `$ARGUMENTS` bzw. die jeweils erwartete Version.
9. Zurück auf `preview` (`git checkout preview`).
10. Bericht: Run-Nummer, beide Live-Versionen, die aus der Startzeit berechnete Ist-Laufzeit.
