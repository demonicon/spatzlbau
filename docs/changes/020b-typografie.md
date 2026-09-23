# 020b – Typografie: Instrument Sans wirklich laden

Status: umgesetzt (Branch `feat/020b-typografie` → `preview`, Abweichungen in `020b-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: S
Ergänzung zu 020 (wird nicht angefasst). Einreihen direkt nach 020.

## Befund

`app.css` nennt `--font: "Instrument Sans", …`, lädt die Schrift aber nicht. Sie erscheint nur auf Geräten, auf denen sie installiert ist – auf Annas Handy nie, dort läuft der Systemstack. Alle Claude-Design-Vorlagen (Review v2, Tweaks, Timeline, Upgrades) sind in Instrument Sans gesetzt; Maße und Zeilenumbrüche der Mockups stimmen nur mit dieser Schrift.

## Änderung

- Instrument Sans (SIL Open Font License) **selbst hosten**: `fonts/instrument-sans-{400,500,600,700}.woff2` + Italic 400, `@font-face` in `app.css` mit `font-display: swap`, `unicode-range` latin. Keine Google-Fonts-Anfrage – CSP `font-src 'self'` bleibt, Offline-Modus bleibt.
- Service Worker: die Font-Dateien in die Precache-Liste, versioniert wie alles andere.
- Gewichte nach den Vorlagen: Fließtext 400, Labels/Buttons/Kacheln 600, Antwortzahl und Countdown 700. 500 nur, wenn der Handoff-Export es nennt – sonst weglassen.
- `font-variant-numeric: tabular-nums` auf allen Zahlen (Beträge, Daten, Zähler, Countdown).
- Schriftgrößen-Token (`--fs-*`) gegen den Project-HTML-Export aus `design/handoff/2026-09-23-tweaks/` abgleichen; Abweichungen in der Abweichungsliste, nicht stillschweigend angleichen.
- Fallback-Stack bleibt für den Sekundenbruchteil vor dem Laden.

## Regel für alle folgenden Aufträge (in CLAUDE.md aufnehmen)

> Schrift, Gewichte und Größen kommen aus dem Claude-Design-Export des jeweiligen Auftrags, nicht aus dem Bestand. Keine neue Familie, kein neues Gewicht ohne Vorlage.

## Akzeptanzkriterien

- [x] Frisches Gerät ohne installierte Schrift (Chromium-Profil ohne Systemfont): App rendert Instrument Sans, kein Request an fonts.googleapis.com/gstatic (Netzwerk-Log)
- [x] Offline nach erstem Laden: Schrift bleibt (SW-Cache)
- [x] Lighthouse/Console: keine CSP-Verletzung
- [x] 380 px Hauptansicht gegen Mockup 2a: Zeilenumbrüche der Titel identisch bei gleichem Text
- [x] Bericht ≤ 10 Zeilen, Changelog: „Die App lädt ihre Schrift jetzt selbst – sieht überall gleich aus."
