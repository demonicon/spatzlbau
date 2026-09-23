# 019 – Timeline

Stand: 23.09.2026 · Meilenstein 2.0 · Branch: `feat/019-timeline` · Modell: Sonnet (3b) / Opus (3a) · Aufwand: M (3b) · +L (3a)
Quelle: Skizze "Alle Aufgaben, vom Einzug rückwärts" (`design/handoff/2026-09-23/Timeline.pdf`, lokal). Setzt 020 (Pillen, Signal-Chip) voraus.

## Entscheidung (Vorschlag, offen für Sebastian)

**Erst 3b, 3a später.** 3b (Liste mit Phasen-Schienen) lässt sich lesen und abarbeiten, funktioniert auf jeder Breite und trägt 68 Aufgaben ohne Kürzung. 3a (Bahnen, Desktop ≥ 1100 px) zeigt Dichte und Parallelität, ist aber reine Ansicht mit gekürzten Titeln – wertvoll für den Überblick, nicht für den Alltag mit Anna am Handy. 3a als 019b nach zwei Wochen Nutzung, wenn die Frage "wo häuft es sich?" real auftaucht.

Kein Ziehen von Karten. Fristen ändern sich nur in "Bearbeiten" (017) – Ansehen und Bearbeiten bleiben getrennt, wie die Skizze empfiehlt.

## Was gebaut wird (3b)

- Dritte Ansicht unter "Aufgaben": Pillen **Personen · Phasen · Timeline** (Klassen aus 020). Zuletzt gewählte Ansicht pro Gerät merken (localStorage, wie andere UI-Zustände).
- Liste aller offenen und überfälligen Aufgaben in Fälligkeitsreihenfolge, volle Titel, eine Zeile je Aufgabe mit Zuständigkeits-Pille, Signal-Chip nach 020, "Phase n" als leise Textzeile, Abhaken direkt in der Zeile, Tap öffnet die Akte.
- Links: Datum + Wochentag + T-Angabe (`T−92`), Nullpunkt = Einzug. Ist der Umzugstag gesetzt (1.1), erscheint er als zweite Marke ("Umzug Sa 02.01.") – Aufgaben mit Umzugstag-Anker zeigen ihr echtes Datum, die T-Angabe bleibt auf den Einzug bezogen.
- Fünf Phasen-Schienen: Linie vom ersten bis zum letzten Fälligkeitstag der Phase, Punkt an jeder Zeile in der Spalte ihrer Phase. Gate ◆ am Ende jeder Schiene mit dem Gate-Text aus `settings.phases` als Tooltip/Textzeile.
- Monatsköpfe ("OKTOBER 2026") als Trenner.
- **Heute-Marke** als eigene Zeile; beim Öffnen springt die Liste dorthin, Überfälliges steht direkt darüber. Pille "Heute" springt zurück.
- Filter oben: Phase 1–5 einzeln (eine Phase allein), Personenfilter aus dem Dashboard übernommen (Alle/Du/Anna/Gemeinsam). Kennzahl = Filter gilt weiter.
- Erledigte Aufgaben ausgeblendet, Text-Button "n erledigte zeigen" (020 Text-Art) am Ende.
- Desktop: gleiche Liste, breiter, mit rechtem Panel wie in 006/009 – keine eigene Desktop-Variante.
- Blockierte Aufgabe: nach 020 (gestrichelt, "wartet auf: …").

## Nicht in diesem Auftrag

3a Bahnen-Ansicht (→ 019b) · Ziehen von Fristen · Teilschritte in der Timeline · Kostenzeilen auf der Achse.

## Daten

Keine Schemaänderung. Fälligkeit aus `anchor + offset_days` (1.1), Phasen und Gates aus `settings.phases`, Umzugstag aus `settings.umzugstag`.

## Akzeptanzkriterien

- [ ] 380 px: Liste öffnet auf "Heute", eine überfällige Testaufgabe steht darüber in Rot, Titel ungekürzt
- [ ] Phasenfilter 3 zeigt nur Phase-3-Aufgaben, Schiene 3 bleibt durchgezogen, andere Schienen verschwinden
- [ ] Mit `umzugstag = 02.01.2027`: `packen` steht am 05.12. mit `T−27`, `halteverbot` (Einzug-Anker) am 04.12. mit `T−28` – Reihenfolge nach Kalenderdatum, nicht nach Offset
- [ ] Abhaken in der Zeile: Aufgabe verschwindet, Zähler im Text-Button steigt, Realtime beim anderen Gerät
- [ ] Gate-◆ an fünf Schienen, Tooltip-Text = Gate aus settings
- [ ] Zwei Breiten, Bericht ≤ 15 Zeilen, Changelog: "Neue Ansicht Timeline: alle Aufgaben in Reihenfolge, Phasen als Schienen, Sprung zu Heute."

## Reihenfolge 2.0 (Vorschlag)

020 Tweaks → 016 Finanzen → 019 Timeline → 017 Akte → 018 Dashboard (nach Annas Urteil 27.09.). 019 vor 017/018, weil es keine Design-Entscheidung von Anna braucht und 018 die Zeitgruppen-Logik aus 019 wiederverwenden kann.
