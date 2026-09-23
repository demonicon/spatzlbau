# Meilenstein 2.0 auf `preview` – Status

Reihenfolge wie beauftragt: 020 → 016 → 017 → 018 → 022 → 019 → 021. Session 2: 020b → 016b → 024. Session 3: 026, dann 016c → 019c.
Sebastian hat `preview` (bis 024) am 23.09.2026 nach `main` gemergt (`6528454`) – Meilenstein 2.0
ist damit eröffnet. Session 3 (026) baut auf `preview` weiter, noch **nicht** in `main`.
Migrationen liegen nur als Dateien vor – **keine ist angewendet**, weder auf `main` noch auf
`preview`. Die App lädt auch ohne sie; was dann fehlt, steht je Zeile.

| Nr | Commit | Status | Offene Migrationen |
|---|---|---|---|
| 020 Tweaks | `95f6f72` | fertig | – |
| 020b Typografie | `0e015bc` | fertig | keine |
| 016 Finanzen | `eb3e340` | fertig | `010_a016_finanzen.sql` – ohne sie wird „Überweisung erfassen“ abgelehnt (mit Hinweis), der Rest läuft |
| 016b Finanzen-Einstieg | `3cfa0ab` | fertig | `014_a016b_fin_setup.sql` – ohne sie wird „Bezahlt“ mit Haushaltskonto abgelehnt (mit Hinweis), der Rest läuft |
| 017 Akte | `54cc36d` | fertig | keine |
| 018 Dashboard | `bcaaffb` | fertig | `011_a018_task_changes.sql` – ohne sie fehlen in „Seit du zuletzt da warst“ die verschobenen Fristen |
| 022 Kalender-Abo | `32e5475` | fertig | `012_a022_ics_token.sql` + Edge Function `ics` ausrollen (SETUP.md §11) – ohne beides bleibt die Zeile „Abo-Adressen erzeugen“ wirkungslos |
| 019 Timeline | `780def8` | fertig (3b) | keine |
| 021 Phasen/Gates | `0bc839c` | fertig | `013_a021_seen_gates.sql` – ohne sie merkt sich die App den gesehenen Gate-Moment nur für die Sitzung |
| 024 Claude-Anbindung (Teil 2) | `068a22f` | Teil 2 fertig, Teil 1+3 offen (nicht Claude Code) | `015_a024_claude_run.sql` – ohne sie fehlt in der Stand-Zeile „zuletzt HH:MM", sonst läuft alles |
| 026 Gemeinsamer Start | `bd64950` | fertig | `016_a026_setup.sql` – ohne sie startet das Setup trotzdem (liest als leer/false), `stammdaten` existiert in der Live-DB schon |
| 016c Finanzen-Abgleich | `ef9eda9` | fertig | keine |

## Migrationen in dieser Reihenfolge einspielen

1. `010_a016_finanzen.sql` (016) – Art `ausgleich`, `costs_summary` mit `double_rent`
2. `011_a018_task_changes.sql` (018) – Änderungsprotokoll + Trigger + Realtime
3. `012_a022_ics_token.sql` (022) – Schlüssel `ics_token`
4. `013_a021_seen_gates.sql` (021) – `allowlist.seen_gates`
5. `014_a016b_fin_setup.sql` (016b) – `settings.fin_setup_done`, `costs.paid_by` + Haushaltskonto (`H`)
6. `015_a024_claude_run.sql` (024) – `settings.claude_last_run`
7. `016_a026_setup.sql` (026) – `settings.setup_done`, `setup_step`, `stammdaten` (Default, existiert meist schon)

Dazu einmal die Edge Function: `supabase functions deploy ics --no-verify-jwt --project-ref <ref>`
(SETUP.md §11). Die App lädt auf `/preview/` auch ohne all das – was dann fehlt, steht je Zeile
oben.

## 024 – zwei Teile außerhalb dieses Repos, noch offen

Teil 1 (Schreibrecht für Claude im Supabase-Connector abschalten) und Teil 3 (stündlicher
Scheduled Task) sind in `docs/changes/024-claude-anbindung.md` beschrieben, aber nicht Aufgabe von
Claude Code – siehe Rollenteilung in CLAUDE.md. Ohne beide schreibt „Claude jetzt starten" korrekt
in die Datenbank, aber niemand holt die Aufgabe ab.
