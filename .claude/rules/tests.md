# Tests

- Vor dem Push: `index.html` lokal öffnen (Live-Server) und auf ~380 px prüfen.
- Tests, die als echte Person (Sebastian oder Anna) eingeloggt laufen oder in die Live-Datenbank schreiben, werden **vorher angesagt** – nicht nebenbei erledigt. Lesende Abfragen und in Transaktionen zurückgerollte Migrationsprüfungen sind davon nicht betroffen.
- Testdaten werden danach entfernt und der Nachweis gezeigt (Abfrage mit Ergebnis, nicht nur die Behauptung). Das gilt auch für Nebenwirkungen: `last_seen_version`, `last_visit_at`, `seen_comments`, `done_by`, `status`, Briefing-Felder, `settings`-Schlüssel.
- Jede Änderung am Nutzerstand steht im Bericht – auch die, die bewusst stehen bleibt, mit Begründung.
- Sicherer Weg, wo möglich: Zustände im Browser simulieren (nur `state`/`ui` setzen, nichts schreiben) statt echte Zeilen anzufassen.
- Eigenen Testserver nur über seine PID beenden, nie prozessweit.
