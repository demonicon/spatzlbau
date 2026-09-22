# Änderungsauftrag 008 – Härtung

Stand: 22.09.2026 · Status: deployt 22.09.2026 (Merge 7e67ad9, Pages-Lauf 20 – Lauf 19 scheiterte an einem GitHub-OIDC-Timeout, Re-Run per workflow_dispatch) · Branch: `feature/haertung`
Herkunft: Self-Test nach 006 (Punkte 1, 4, 5). Keine sichtbare Änderung, kein Changelog-Eintrag.

## Was sich ändert

1. **Supabase-JS-Version gepinnt.** `app/supabase.js` importiert `@supabase/supabase-js@2.116.0/+esm` statt des gleitenden `@2`. Updates künftig bewusst per PR (Version im Import hochziehen, Smoke-Test).
2. **RLS-Policy `allowlist_update_own`** wertet `auth.jwt()` einmal pro Anfrage aus (`(select …)`), nicht pro Zeile – Hinweis des Supabase-Performance-Advisors. Migration `004_allowlist_policy_initplan.sql`, `schema.sql` nachgezogen.
3. **Content-Security-Policy** als `<meta>` in `index.html` (GitHub Pages erlaubt keine Header): Skripte nur von der eigenen Origin und `cdn.jsdelivr.net`, Verbindungen nur zur eigenen Origin und zum Supabase-Projekt (https + wss), Bilder nur eigene und `data:`, keine Objekte/Frames/fremden Formularziele. Keine Inline-Skripte, keine Inline-Styles: der einzige `style`-Attributwert (Füllstand der Gate-Leiste) wird jetzt nach dem Rendern per CSSOM gesetzt.

## Akzeptanzkriterien

- [ ] App funktioniert unverändert: Login, Laden, Realtime, Schreiben, Panel, Changelog – keine CSP-Verstöße in der Konsole
- [ ] Gate-Leiste zeigt weiterhin den Füllstand
- [ ] `RLS`-Verhalten unverändert (eigene Zeile, nur `last_seen_version`)
- [ ] 380 px pixelidentisch
