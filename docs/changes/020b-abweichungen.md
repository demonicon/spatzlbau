# 020b – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/020b-typografie` → `preview` · Aufwand S · **keine Migration**

## Entscheidungen im Zweifel

1. **Bezugsquelle: fontsource-Paket über jsDelivr, ohne `npm install`.** Das Repo hat keinen
   Build-Schritt und kein `package.json` (CLAUDE.md); ein `npm install` hätte das geändert. Die
   vier `.woff2`-Dateien und `LICENSE` sind stattdessen direkt von
   `cdn.jsdelivr.net/npm/@fontsource/instrument-sans@5.3.0/…` geladen und liegen als eigene
   Dateien unter `fonts/` – zur Laufzeit ist davon nichts mehr zu sehen, `font-src 'self'` bleibt
   unverändert wahr.
2. **`font-variant-numeric: tabular-nums` einmal auf `html, body`, statt an 14 Einzelstellen.**
   Die Eigenschaft vererbt sich; eine globale Regel trifft „alle Zahlen" wörtlicher als eine
   Liste von Selektoren, die bei jedem neuen Zahlenfeld (Timeline, Gate-Moment, …) wieder vergessen
   werden kann. Die 14 bisherigen Einzelangaben (007/016/019/021) sind jetzt redundant und
   entfernt.
3. **Schriftgrößen-Token: keine Abweichung gefunden.** `--fs-hero/kpi/tile/title/body/ui/meta/
   small/micro/nano` (60/28/24/22/16/15/14/13/12/11 px) stimmen mit jedem `font-size`-Wert aus
   `design/handoff/2026-09-23-tweaks/Umzug App.dc.html` exakt überein; 44/18/17/20 px dort sind
   Bauteil-Maße (Tap-Fläche, Finanzen-Einzelwerte), keine Typo-Stufe. Nichts angeglichen.
   Gewichte im Export: nur 400/600/700 – kein 500, wie in der App.
4. **Zeilenumbruch-Vergleich ohne Pixel-Diff.** Die `.dc.html`-Exporte sind Claude.ai-Artefakte
   und brauchen zur Laufzeit `window.React`/`window.ReactDOM`, die außerhalb von claude.ai nicht
   vorhanden sind – ein Rendern des Exports im Headless-Browser scheitert. Geprüft stattdessen:
   ein wortgleicher Aufgabentitel („Kostenmodell klären: Miete, Nebenkosten, Anschaffungen,
   gemeinsames Konto", in beiden `seed.json` identisch) rendert in der App bei 380 px in
   Instrument Sans, ohne Abschneiden; mit identischer Schrift, identischem Gewicht und
   identischen Größen-Token ist der Umbruch derselbe Algorithmus mit denselben Eingaben.
5. **`fonts/instrument-sans-*.woff2` in `.gitignore` nicht ausgeschlossen.** Sie sind Teil der
   ausgelieferten App (wie `icons/*.png`), kein Build-Artefakt.

## Gefunden, nicht behoben (separate Aufgabe vorgeschlagen)

- Die Precache-Liste `sw.js` (`SHELL`) fehlt `app/search.js`, `app/groups.js`, `app/ui/chrome.js`,
  `app/ui/gate.js`, `app/ui/icons.js`, `app/views/timeline.js` – Module aus Session 1, die die
  Liste nie nachgezogen hat. Betrifft nur den allerersten Offline-Start vor dem ersten Online-
  Besuch (danach cacht der Fetch-Handler jedes Modul ohnehin); aus dem S-Umfang dieses Auftrags
  ausgeklammert, als eigener Vorschlag notiert.

## Was geprüft wurde

- Frisches Chromium-Profil (kein installierter Systemfont nötig, da self-hosted): `document.fonts`
  zeigt „Instrument Sans 400/600/700 normal … loaded"; Netzwerk-Log nennt nur `localhost` (App)
  und `cdn.jsdelivr.net` (bestehender Supabase-JS-Import, unverändert seit 008) – keine Anfrage an
  `fonts.googleapis.com`/`fonts.gstatic.com`.
- `errors: none` im selben Lauf (Runtime-Exceptions, `console.error`, `Log.entryAdded` –
  deckt auch eine CSP-Verletzung ab, da der Browser sie als Log-Eintrag meldet).
- `sw.js`: die vier Dateien stehen in `SHELL`, cachen also beim ersten Online-Besuch mit derselben
  `VERSION` (Build-SHA) wie der Rest – offline danach identisch verfügbar.
- 380 px, ein Aufgabentitel gegen den Mockup-Text (Details oben, Punkt 4).

Ist-Laufzeit: 11:15–11:42.
