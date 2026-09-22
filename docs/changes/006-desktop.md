# Änderungsauftrag 006 – Desktop-Layout

Stand: 22.09.2026 · Status: Schritte 1–2 umgesetzt, wartet auf Review (Abweichungsliste + Screenshots liegen vor); Schritt 3 offen · Branch: `feature/desktop` · Modell: Opus (Layout-Umbau), Effort standard
Betrifft: `app.css`, `index.html`, `app/views/*`; **nicht** Datenschicht, **nicht** Verhalten

## Ausgangslage

Die App ist mobile-first (380 px) gebaut und wird am Desktop als schmale Spalte angezeigt. Sebastian arbeitet am Desktop, wenn er Inhalte pflegt, Kommentare schreibt oder Aufgaben delegiert; Anna nutzt überwiegend das Handy. Beide Geräte müssen gleichwertig funktionieren, das Verhalten bleibt identisch.

## Schritt 0 – Design zuerst (Sebastian, Claude Design)

Im bestehenden Claude-Design-Projekt "Spatzlbau" den Dashboard-Screen und die volle Akte für 1280 px entwerfen. Vorgaben an Claude Design:

- **Zweispaltig ab 900 px:** links Kennzahlen, Phasen und Aufgabenliste; rechts die Akte der gewählten Aufgabe als Seitenpanel, das offen bleibt, während man in der Liste weiterklickt. Am Handy bleibt die Akte unter der Aufgabe (wie heute).
- **Kopf:** Countdown und Gate-Leiste in einer Zeile, Kennzahl-Kacheln in einer Reihe (acht Kacheln, keine Umbrüche).
- **Phasen:** Tabs bleiben, aber ohne horizontales Scrollen; Gate-Text daneben statt darunter.
- **Akte im Panel:** Teilschritte, Briefing, Beratung, Kommentare untereinander, Beratungsfelder standardmäßig aufgeklappt (am Desktop ist Platz, am Handy bleiben sie zu).
- **Maximale Inhaltsbreite 1280 px**, zentriert; Schriftgrößen wie mobil, keine Verkleinerung.
- Gleiche Tokens, gleiche Owner-Farben, Highlighter-Gelb nur für Fristkritisches.

Export wie gehabt: Project HTML + PDF nach `design/handoff/<datum>-desktop/`.

## Schritt 1–3 – Umsetzung (Claude Code)

1. **Breakpoints:** ≤ 599 px mobil (unverändert), 600–899 px Tablet (einspaltig, breitere Kacheln, Akte inline), ≥ 900 px Desktop (zweispaltig nach Handoff). Kein separates Desktop-Stylesheet – Media Queries in `app.css`.
2. **Seitenpanel:** Beim Öffnen einer Aufgabe am Desktop erscheint die Akte rechts; die Liste bleibt scrollbar; ein Klick auf eine andere Aufgabe wechselt den Panel-Inhalt; Escape oder Schließen-Button leert das Panel. Am Handy unverändert. Die URL trägt die geöffnete Aufgabe (`#task=<id>`), damit ein Link zu einer Aufgabe geteilt werden kann – funktioniert auf beiden Geräten.
3. **Tastatur:** Tab-Reihenfolge Kopf → Kennzahlen → Phasen → Liste → Panel; `/` fokussiert die Suche, falls vorhanden; Escape schließt Panel. Sichtbarer Fokus überall.

## Abweichungsliste

Wie bei 002: `docs/changes/006-abweichungen.md` mit technisch nötigen Abweichungen, Design-Lücken (z. B. sehr lange Kommentare im Panel, leeres Panel, Tablet-Zustand, den das Design nicht zeigt) und bewusst Nichtumgesetztem. Screenshots bei 380, 768 und 1280 px.

## Akzeptanzkriterien

- [ ] 380 px: keine sichtbare Änderung gegenüber heute
- [ ] 1280 px: Liste und Akte nebeneinander, kein horizontales Scrollen, Inhalt zentriert
- [ ] Aufgabe öffnen/abhaken/kommentieren auf allen drei Breiten funktional identisch
- [ ] `#task=<id>` öffnet die Aufgabe auf Handy und Desktop
- [ ] Realtime-Update sichtbar, keine Konsolenfehler
- [ ] Changelog-Eintrag (005): "Am Computer siehst du Liste und Aufgabe jetzt nebeneinander."
