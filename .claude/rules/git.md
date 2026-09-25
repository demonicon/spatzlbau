# Git, Branches, Tags, Deploy

- Branch-Typen `feat/`, `fix/`, `chore/`, `content/` von `preview`; Merge nach `preview`. `main` nur über `/release` (Skill) – nie direkt. (Löst den Widerspruch zur alten Regel „Branch `feature/<kurzname>` → main"; die galt vor Auftrag 010.)
- Commit-Messages: Präfix `feat:`, `fix:`, `content:`, `chore:`. Kleine Commits.
- Vor jedem Meilenstein: `docs/release-check.md` (Vorlage) kopiert nach `docs/release-check-<Version>.md` und ausgefüllt. Rot bei Sicherheit oder Daten blockiert den Meilenstein, Rot anderswo wird der erste Bugfix der Nebenversion. Git-Tag dreiteilig `vX.Y.Z` auf den Merge-Commit (nicht mehr `vX.Y` – das war vor der Patch-Version).
- Weiter erlaubt ohne Meilenstein-Eröffnung: Inhaltspakete über den Seed-Workflow, Migrationen nur für Inhalte, tägliches Backup, wöchentliche Kontrolle; keine Abhängigkeits-Updates ohne Bugfix-Grund.
- Zwei Ziele, ein Pages-Workflow, eine Datenbank: `main` → `/`, Branch `preview` → `/preview/`. Jeder Deploy baut beide neu (der jeweils andere Branch wird mitgecheckt, sonst würde ein Push den anderen Pfad löschen).
- `preview` und `main` nie auf denselben Commit setzen. GitHub Pages erkennt Deploys am Commit der auslösenden Branch; steht derselbe Commit schon einmal deployt, wird der Lauf still übersprungen und die Seite behält den alten Inhalt. `preview` nach einer Übernahme also nicht per Fast-Forward auf `main` ziehen, sondern mit dem nächsten echten Commit weiterarbeiten.
- Die Vorschau (`/preview/`) ist für den Nutzerstand read-only – Verhalten der App, siehe `BRIEFING.md`.
