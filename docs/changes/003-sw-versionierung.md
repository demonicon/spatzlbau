# Änderungsauftrag 003 – Service Worker mit Versionierung über Commit-SHA

Stand: 22.09.2026 · Status: deployt 22.09.2026 (Merge d45b10a, Pages-Lauf 11, Build d45b10a live) · Branch: `feature/sw-versionierung`
Betrifft: `sw.js`, `app/main.js`, `app/config.js`, `.github/workflows/pages.yml`, `app/views/dashboard.js`, BRIEFING §2

## Warum

Die Cache-Version des Service Workers war eine Hand-Konstante (`spatzlbau-v0.2.0`). Wird sie beim Deploy vergessen, laufen die Handys mit altem Shell-Cache weiter. Außerdem erfahren die Nutzer nicht, dass eine neue Version bereitliegt.

## Was sich ändert

- **Version = Commit-SHA.** `sw.js` und `app/config.js` enthalten den Platzhalter `__BUILD__`; der Pages-Workflow ersetzt ihn vor dem Upload durch die ersten sieben Zeichen von `GITHUB_SHA`. Jeder Deploy erzeugt so automatisch einen neuen Cache-Namen, alte Caches werden beim Aktivieren gelöscht. Lokal bleibt der Platzhalter stehen (ein fester Dev-Cache).
- **skipWaiting / clients.claim** bleiben: der neue Service Worker übernimmt sofort, ohne dass alle Tabs geschlossen werden müssen.
- **Update-Hinweis in der Statuszeile.** Übernimmt ein neuer Service Worker die Seite (`controllerchange`), zeigt die Statuszeile „Neue Version – neu laden“ als Button (≥ 44 px). Kein automatisches Neuladen, damit nichts verloren geht, was gerade getippt wird. Update-Prüfung beim Öffnen, bei jeder Rückkehr in den Tab und alle 30 Minuten (`updateViaCache: 'none'`, damit der Browser `sw.js` nicht aus dem HTTP-Cache nimmt).
- **Frische Dateien garantiert:** App-Shell-Dateien werden mit `cache: 'reload'` in den Cache geladen und im Betrieb mit `cache: 'no-cache'` (Revalidierung per ETag) geholt – GitHub Pages liefert sonst bis zu 10 Minuten alte Dateien aus dem HTTP-Cache.
- Fußzeile zeigt `v0.2.1 · Build abc1234`.

## Akzeptanzkriterien

- [ ] Nach einem Deploy zeigt die Fußzeile den neuen Build; in den DevTools existiert genau ein Cache `spatzlbau-<sha>`
- [ ] Ist die App beim Deploy offen, erscheint innerhalb der nächsten Update-Prüfung „Neue Version – neu laden“ in der Statuszeile; Tippen lädt die neue Version
- [ ] Keine Konsolenfehler, Login/Realtime unverändert

## Handy-Check durch Sebastian

App offen lassen, einen Deploy abwarten (oder Tab wechseln und zurück), Hinweis antippen.
