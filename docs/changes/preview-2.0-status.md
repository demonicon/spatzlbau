# Meilenstein 2.0 auf `preview` – Status

Reihenfolge wie beauftragt: 020 → 016 → 017 → 018 → 022 → 019 → 021. Session 2: 020b → 016b → 024.
`main` und die Live-App bleiben unangetastet; nichts hiervon ist gemerged.
Migrationen liegen nur als Dateien vor – **keine ist angewendet**. Die App lädt auf `/preview/`
auch ohne sie; was dann fehlt, steht je Zeile.

| Nr | Commit | Status | Offene Migrationen |
|---|---|---|---|
| 020 Tweaks | `95f6f72` | fertig | – |
| 020b Typografie | `0e015bc` | fertig | keine |
| 016 Finanzen | `eb3e340` | fertig | `010_a016_finanzen.sql` – ohne sie wird „Überweisung erfassen“ abgelehnt (mit Hinweis), der Rest läuft |
| 017 Akte | `54cc36d` | fertig | keine |
| 018 Dashboard | `bcaaffb` | fertig | `011_a018_task_changes.sql` – ohne sie fehlen in „Seit du zuletzt da warst“ die verschobenen Fristen |
| 022 Kalender-Abo | `32e5475` | fertig | `012_a022_ics_token.sql` + Edge Function `ics` ausrollen (SETUP.md §11) – ohne beides bleibt die Zeile „Abo-Adressen erzeugen“ wirkungslos |
| 019 Timeline | `780def8` | fertig (3b) | keine |
| 021 Phasen/Gates | `0bc839c` | fertig | `013_a021_seen_gates.sql` – ohne sie merkt sich die App den gesehenen Gate-Moment nur für die Sitzung |

## Migrationen in dieser Reihenfolge einspielen

1. `010_a016_finanzen.sql` (016) – Art `ausgleich`, `costs_summary` mit `double_rent`
2. `011_a018_task_changes.sql` (018) – Änderungsprotokoll + Trigger + Realtime
3. `012_a022_ics_token.sql` (022) – Schlüssel `ics_token`
4. `013_a021_seen_gates.sql` (021) – `allowlist.seen_gates`

Dazu einmal die Edge Function: `supabase functions deploy ics --no-verify-jwt --project-ref <ref>`
(SETUP.md §11). Die App lädt auf `/preview/` auch ohne all das – was dann fehlt, steht je Zeile
oben.
