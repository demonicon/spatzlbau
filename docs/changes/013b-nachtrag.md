# Änderungsauftrag 013b – Nachtrag zu 013

Stand: 22.09.2026 · Status: offen · Branch: `feature/audit-fixes` (derselbe wie 013), als eigene Commits nach dem 013-Stopp
Grund: 013 lief bereits, als diese Punkte dazukamen. Wo ein Punkt schon in der laufenden Fassung von 013 steht, gilt er als erledigt – in der Abweichungsliste vermerken, welche Fassung gebaut wurde.

## Nachträge

**N1 · Kopfzeile und Navigation (ersetzt A6, falls A6 nicht oder in der Drei-Icon-Fassung gebaut wurde)**
- Personen-Pille → Avatar-Kürzel: Kreis mit "S" bzw. "A" in Owner-Farbe, Name als Tooltip/aria-label und im Bereichstitel "Ich (Sebastian)".
- Rechts neben dem Avatar **zwei** Navigations-Icons: Haus (= Aufgaben = Hauptansicht ohne Filter, Phase "alle") und Münze/Kasse (= Finanzen, `#finanzen`). Aktiv: gefüllter Hintergrund `--ink`, Icon invertiert; inaktiv Umriss. 44 px, Inline-SVG, aria-label + Tooltip. Desktop darf Labels zeigen. "Finanzen" verschwindet aus der Fußzeile.
- Versionsnummer in der Fußzeile: reiner Text, nicht wie ein Button gestaltet. Changelog öffnet über ein Info-Icon ⓘ daneben, das den "Neu"-Punkt trägt.
- "Neu laden" ist kein Dauerknopf mehr; erscheint nur als Hinweisleiste, wenn ein Update wartet.
- Fußzeile danach: ⓘ + Version · Umzugstag drucken · Abmelden.

**N2 · Besuchsblock ohne Rot.** "wartet auf dich" bekommt kein rotes Feld (Rot ist für Überfällig reserviert). Hervorhebung durch Fettung und Autoren-Punkt.

**N3 · Lade-Animation.** "Lade …" bleibt; die leere Gate-Leiste füllt sich in 1,2 s von links nach rechts und leert sich wieder, in Schleife bis Daten da sind. Kein Spinner. Unter `prefers-reduced-motion` statisch mit drei Punkten.

## Akzeptanzkriterien (zusätzlich zu 013)

- [ ] Avatar zeigt nur das Kürzel; Name per Tooltip und im Bereichstitel
- [ ] Zwei Icons, aktiver Zustand sichtbar; Haus setzt Filter und Phase zurück
- [ ] Version als Text, ⓘ öffnet Changelog und trägt den Neu-Punkt; kein Dauerknopf "Neu laden"; Fußzeile ohne "Finanzen"
- [ ] Besuchsblock ohne rotes Feld
- [ ] Ladezustand mit Gate-Leisten-Animation, statisch bei reduzierter Bewegung
- [ ] Changelog-Eintrag von 013 um einen Satz ergänzt: "Oben rechts findest du jetzt Aufgaben und Finanzen als Symbole."
