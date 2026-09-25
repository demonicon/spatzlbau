---
name: auftrag
description: Einen Änderungsauftrag aus docs/changes/ umsetzen, von CLAUDE.md lesen bis zum Merge nach preview. Aufruf "/auftrag NNN" mit der Auftragsnummer, z. B. "/auftrag 032b".
disable-model-invocation: true
---

# /auftrag $ARGUMENTS

Setzt den Änderungsauftrag `docs/changes/$ARGUMENTS-*.md` um, Schritt für Schritt, nie einen Schritt überspringen.

1. **Lesen.** `CLAUDE.md` und genau eine Datei `docs/changes/$ARGUMENTS-*.md`. Treffen mehrere Dateien auf das Muster zu, abbrechen und nachfragen, welche gemeint ist. Danach Startzeitstempel `Start: <ISO-Zeit>` in `docs/changes/$ARGUMENTS-abweichungen.md` festhalten (Datei bei Bedarf neu anlegen) – Grundlage für die Ist-Laufzeit in Schritt 8.
2. **Definition of Ready, nur bei `Art: Feature`.** Fehlt im Auftrag der Abschnitt „Klärung" oder hat er weniger als drei beantwortete Fragen → mindestens drei Fragen per AskUserQuestion an Sebastian stellen: Ziel („Woran erkennst du, dass es gelungen ist?"), Kontext („Wer nutzt das zuerst, auf welchem Gerät, in welcher Situation?"), Abgrenzung („Was gehört ausdrücklich nicht dazu?"), dazu auftragsspezifische Unklarheiten aus dem Text – Fragen, deren Antwort schon im Auftrag steht, werden nicht gestellt. Antworten als „Frage → Antwort → Konsequenz" in den Abschnitt „Klärung" schreiben und committen, dann weiter. Bei Aufwand M/L zusätzlich im Plan-Stopp (Schritt 4) die offenen Fragen aus der Erkundung stellen. Bei `Art: Bugfix` oder `Art: Chore` entfällt dieser Schritt.
3. **Branch.** Anlegen nach Typ und Kurzname aus der Kopfzeile des Auftrags (`feat/`, `fix/`, `chore/`, `content/`), Basis `preview` (`rules/git.md`). Ohne Branch keine Arbeit.
4. **Plan Mode bei Aufwand M oder L.** Betroffene Dateien, Reihenfolge, Migrationen, offene Fragen als Liste – dann **Stopp**, bis Sebastian „Go" schreibt. Bei Aufwand S direkt weiter zu 5.
5. **Umsetzen.** Migrationen immer zuerst als Dry-Run melden (in einer Transaktion, zurückgerollt), dann anwenden (`rules/db.md`).
6. **Testen.** Die Tests aus dem Auftrag real ausführen, dazu Regression und `npm run check`. Tests, die einen Login verlangen, laufen mit den Konten aus `.env` (`TEST_EMAIL_S`/`TEST_PW_S`/`TEST_EMAIL_A`/`TEST_PW_A`, Playwright, zwei Kontexte = zwei Personen). Fehlen die Variablen: den Test im Bericht als **„nicht getestet – Testkonten fehlen"** markieren – nie als grün, nie als „simuliert" ohne dieses Wort. Schreibtests weiterhin vorher ansagen und danach mit Nachweis aufräumen (`rules/tests.md`).
7. **Review.** Den Subagenten `reviewer` mit dem Diff (`git diff preview...HEAD`) und dem Auftrag aufrufen. Gemeldete Lücken beheben, Review wiederholen, bis er leer ist.
8. **Merge.** Nach `preview` (nie nach `main` – das ist `/release`). `gh run watch` auf den eigenen Push, bis der Lauf grün ist. Live-Version des preview-Pfads per `curl` prüfen (`CLAUDE.md`, „Definition of Done").
9. **Bericht.** Im Format aus `.claude/rules/report.md`: Commit, Tests n/n, Abweichungen, Run-Nummer, Live-Version, Review-Ergebnis, Ist-Laufzeit (berechnet aus dem Startzeitstempel aus Schritt 1). Ohne Schritt 8 (grüner Lauf + geprüfte Live-Version) gibt es keinen Bericht – dann ist der Auftrag noch nicht fertig.
