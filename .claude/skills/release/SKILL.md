---
name: release
description: preview nach main heben - Changelog-Version setzen, mergen, taggen, deployen, live pruefen. Aufruf "/release X.Y.Z" mit der neuen Version, z. B. "/release 2.2.1".
disable-model-invocation: true
---

# /release $ARGUMENTS

Hebt den aktuellen Stand von `preview` nach `main`. Bei Rot auf halbem Weg: **abbrechen, nichts zurückrollen, melden** – nicht selbst reparieren.

1. `npm run check` auf `preview`. Rot → abbrechen, melden.
2. `changelog.json` prüfen: oberster Eintrag hat `version` = `$ARGUMENTS`. Fehlt der Eintrag oder stimmt die Version nicht, abbrechen und nachfragen (kein eigenmächtiges Anlegen des Eintrags – der gehört zum jeweiligen Auftrag).
3. `git checkout main && git merge --no-ff preview`.
4. Tag `v$ARGUMENTS` auf den Merge-Commit (`rules/git.md`: dreiteilig).
5. Push mit Tags.
6. `gh run watch` auf den main-Lauf, bis grün.
7. Smoke: `curl` beider `changelog.json` (main und `/preview/`), Fußzeile beider Pfade = `$ARGUMENTS` bzw. die jeweils erwartete Version.
8. Zurück auf `preview` (`git checkout preview`).
9. Bericht: Run-Nummer, beide Live-Versionen.
