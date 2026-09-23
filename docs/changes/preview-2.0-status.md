# Meilenstein 2.0 auf `preview` – Status

Reihenfolge wie beauftragt: 020 → 016 → 017 → 018 → 022 → 019 → 021.
`main` und die Live-App bleiben unangetastet; nichts hiervon ist gemerged.
Migrationen liegen nur als Dateien vor – **keine ist angewendet**. Die App lädt auf `/preview/`
auch ohne sie; was dann fehlt, steht je Zeile.

| Nr | Commit | Status | Offene Migrationen |
|---|---|---|---|
| 020 Tweaks | `95f6f72` | fertig | – |
| 016 Finanzen | `eb3e340` | fertig | `010_a016_finanzen.sql` – ohne sie wird „Überweisung erfassen“ abgelehnt (mit Hinweis), der Rest läuft |
| 017 Akte | `54cc36d` | fertig | keine |
| 018 Dashboard | `bcaaffb` | fertig | `011_a018_task_changes.sql` – ohne sie fehlen in „Seit du zuletzt da warst“ die verschobenen Fristen |
| 022 Kalender-Abo | `32e5475` | fertig | `012_a022_ics_token.sql` + Edge Function `ics` ausrollen (SETUP.md §11) – ohne beides bleibt die Zeile „Abo-Adressen erzeugen“ wirkungslos |
| 019 Timeline | `780def8` | fertig (3b) | keine |
| 021 Phasen/Gates | – | offen | – |
