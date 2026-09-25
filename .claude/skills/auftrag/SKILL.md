---
name: auftrag
description: Einen Änderungsauftrag aus docs/changes/ umsetzen, von CLAUDE.md lesen bis zum Merge nach preview. Aufruf "/auftrag NNN" mit der Auftragsnummer, z. B. "/auftrag 032b".
disable-model-invocation: true
---

# /auftrag $ARGUMENTS

Setzt den Änderungsauftrag `docs/changes/$ARGUMENTS-*.md` um, Schritt für Schritt, nie einen Schritt überspringen.

1. **Lesen.** `CLAUDE.md` und genau eine Datei `docs/changes/$ARGUMENTS-*.md`. Treffen mehrere Dateien auf das Muster zu, abbrechen und nachfragen, welche gemeint ist.
2. **Branch.** Anlegen nach Typ und Kurzname aus der Kopfzeile des Auftrags (`feat/`, `fix/`, `chore/`, `content/`), Basis `preview` (`rules/git.md`). Ohne Branch keine Arbeit.
3. **Plan Mode bei Aufwand M oder L.** Betroffene Dateien, Reihenfolge, Migrationen, offene Fragen als Liste – dann **Stopp**, bis Sebastian „Go" schreibt. Bei Aufwand S direkt weiter zu 4.
4. **Umsetzen.** Migrationen immer zuerst als Dry-Run melden (in einer Transaktion, zurückgerollt), dann anwenden (`rules/db.md`).
5. **Testen.** Die Tests aus dem Auftrag real ausführen, dazu Regression und `npm run check`.
6. **Review.** Den Subagenten `reviewer` mit dem Diff (`git diff preview...HEAD`) und dem Auftrag aufrufen. Gemeldete Lücken beheben, Review wiederholen, bis er leer ist.
7. **Merge.** Nach `preview` (nie nach `main` – das ist `/release`). `gh run watch` auf den eigenen Push, bis der Lauf grün ist. Live-Version des preview-Pfads per `curl` prüfen (`CLAUDE.md`, „Definition of Done").
8. **Bericht.** Im Format aus `.claude/rules/report.md`: Commit, Tests n/n, Abweichungen, Run-Nummer, Live-Version, Review-Ergebnis. Ohne Schritt 7 (grüner Lauf + geprüfte Live-Version) gibt es keinen Bericht – dann ist der Auftrag noch nicht fertig.
