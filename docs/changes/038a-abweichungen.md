# 038a – Abweichungen

Start: 2026-09-25T22:18:43+02:00

## Schreib-/Login-Test (Ansage, `rules/tests.md`)

Vorher angesagt und von Sebastian bestätigt: ein echter Login als Person S (Playwright,
`TEST_EMAIL_S`/`TEST_PW_S` aus `.env`, Werte nie ausgegeben) gegen `https://demonicon.github.io/spatzlbau/preview/`.
Bewusst `/preview/`, nicht die Live-App: dort werden `last_seen_version`, `last_visit_at` und
`seen_comments` nie geschrieben (`ui.preview`-Guards in `app/state.js:299,318,341` – zwei der 26
Screenshots zeigen den „Vorschau"-Chip, der das bestätigt). Während des ganzen Laufs fand **keine**
Supabase-Schreiboperation statt; geöffnet wurden nur rein lokale UI-Zustände (`ui.expanded` über
`data-act="open"`, `ui.costEdit`/`ui.finPostAdd` über `cost-open`/`fin-post-add`) – keiner davon
speichert, bevor „Fertig" geklickt wird, was nie geschah.

**Blocker unterwegs:** `TEST_EMAIL_S` meldete sich an, die App zeigte aber „Dieses Konto ist nicht
freigeschaltet" (25.09., ~22:30) – das Konto stand nicht in der Supabase-Allowlist für Person S.
Sebastian hat das Konto danach in Supabase freigeschaltet (eine Änderung an der Live-Datenbank,
außerhalb dieses Auftrags, von ihm selbst vorgenommen); danach lief der Login durch.

## Entscheidungen im Zweifel

1. **Playwright läuft nur via `npx`/lokalem Scratch-`node_modules`, nicht als Projekt-Abhängigkeit.**
   `package.json` bleibt unverändert (keine neue Abhängigkeit ohne Rückfrage, `CLAUDE.md`); das
   Screenshot-Skript liegt außerhalb des Repos im Scratchpad.
2. **„gitignored" (Auftrag) vs. „Kein Diff außerhalb docs/changes/038a-*" (Akzeptanzkriterium)
   widersprechen sich.** Ein neuer `.gitignore`-Eintrag für `design/snapshot/2026-09-26-inventar/`
   wäre selbst ein Diff außerhalb `docs/changes/038a-*`. Entscheidung: `.gitignore` bleibt
   unverändert, die 26 PNGs bleiben lokal und **ungetrackt** (`git status` zeigt sie als `??`,
   `git check-ignore` findet aber keine Regel – „gitignored" im wörtlichen Sinn ist damit nicht
   erfüllt). Offener Punkt für Sebastian: entweder künftig eine Regel wie `design/snapshot/**/*.png`
   ergänzen (eigener kleiner Auftrag) oder „ungetrackt, nicht committet" als ausreichend bestätigen.
3. **Anfrage-Detailseite mit Ergebnis:** Es gibt bereits eine echte Anfrage („Internet", Status
   `ergebnis`, 5 Angebote) – dafür verwendet, keine simulierten Daten nötig. Echte Kommentare werden
   trotzdem per CSSOM geschwärzt (`.com`-Karten, schwarzer Hintergrund + transparente Schrift auf
   Element und allen Kindern – `page.style`-Zuweisung wie `app/main.js`'s einziger dynamischer Style,
   docs/changes/008, da CSP `style-src 'self'` kein `<style>`/`style="…"` erlaubt), nicht nur bei
   dieser Seite, sondern vor jedem Screenshot erneut.
