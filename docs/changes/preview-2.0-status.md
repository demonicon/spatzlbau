# Meilenstein 2.0 auf `preview` – Status

Reihenfolge wie beauftragt: 020 → 016 → 017 → 018 → 022 → 019 → 021.
`main` und die Live-App bleiben unangetastet; nichts hiervon ist gemerged.
Migrationen liegen nur als Dateien vor – **keine ist angewendet**. Die App lädt auf `/preview/`
auch ohne sie; was dann fehlt, steht je Zeile.

| Nr | Commit | Status | Offene Migrationen |
|---|---|---|---|
| 020 Tweaks | `95f6f72` | fertig | – |
| 016 Finanzen | `eb3e340` | fertig | `010_a016_finanzen.sql` – ohne sie wird „Überweisung erfassen“ abgelehnt (mit Hinweis), der Rest läuft |
| 017 Akte | – | offen | – |
| 018 Dashboard | – | offen | – |
| 022 Kalender-Abo | – | offen | – |
| 019 Timeline | – | offen | – |
| 021 Phasen/Gates | – | offen | – |
