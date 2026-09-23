# 016c – Finanzen: Abgleich gegen Mockup 2c

Status: umgesetzt (Branch `feat/016c-finanzen-abgleich` → `preview`, Abweichungsliste in `016c-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Opus (Layout) · Aufwand: M
Befund Sebastian nach dem Merge: Die Finanzansicht entspricht nicht dem Design, besonders nicht am Desktop. Läuft nach 026 (gleiche Dateien).

## Maßstab

Der Project-HTML-Export in `design/handoff/2026-09-23-tweaks/` (Ansichten „Finanzen · 380" und „Finanzen · 1280") ist die Referenz – nicht das PDF, nicht der Auftragstext 016. Vorgehen: Export und App bei 380 px und 1280 px nebeneinander (Screenshot-Overlay oder Pixelvergleich), **jede** Abweichung in Reihenfolge, Abstand, Schrift, Ausrichtung als Zeile in der Abweichungsliste, dann beheben. Was im Export steht, gilt; Ausnahmen nur bei Verstoß gegen CLAUDE.md-Regeln (Rot/Gelb, Tap-Flächen) – dann begründet.

## Sollstruktur 1280 (aus dem Mockup, zur Orientierung)

```
Kopf:   „Finanzen · 101 Tage bis Einzug"                     Pillen Aufgaben | Finanzen · Avatar
Zeile 1: [ Antwortzahl 7.380 € netto ]  [ Posten inkl. Puffer ] [ + Doppelmiete ] [ − Rückflüsse ] [ davon bezahlt 19 % ]
         (Hero links, vier Kacheln rechts in einer Reihe, gleiche Höhe, Kachelwerte antippbar = Filter)
Zeile 2: Spalte A (~40 %)            Spalte B (~35 %)              Spalte C (~25 %, rechte Leiste)
         Als Nächstes zahlen         Monat für Monat               Ausgleich (Karte, Primär-Button)
         (3 Zeilen, Datum groß)      (Tabelle, Jan fett)           Laufend ab Januar (Leseansicht + Bearbeiten)
                                                                    Rahmendaten (Leseblock + ändern)
Zeile 3: Alle Posten · nach Fälligkeit · Pillen alle/offen/bezahlt/Rückfluss rechts
         Tabelle volle Breite: Posten | Aufgabe (Link) | Stand | fällig | zahlt | Betrag
```

## Sollstruktur 380 (gestapelt, in dieser Reihenfolge)

Kopf · Antwortzahl · Herleitung als vier Zeilen mit › · Ausgleich-Karte · Als Nächstes zahlen · Monat für Monat · Laufend ab Januar · Alle Posten (Pillen, dann „n offene Posten zeigen →") · Rahmendaten als eine Zeile mit „ändern".

## Posten-Zeile (Screenshot 23.09., Desktop)

Heute: jeder Posten ist eine dreizeilige Karte – Titel + Betrag, darunter Meta-Zeile mit Punkten, Stand, Frist, zwei Chips, darunter eine eigene Zeile nur für den Button. Bei 1.500 px Breite ~150 px Höhe je Posten, 18 Posten = drei Bildschirme Scroll für eine Liste, die im Mockup auf einen passt.

Soll:
- **≥ 900 px: eine Tabellenzeile je Posten**, Spalten wie im Mockup: Posten | Aufgabe (Link) | Stand (● ● ○ + Wort) | fällig | zahlt | Betrag (rechtsbündig, tabular) | Aktion. Die Aktion („Betrag festlegen", „Bezahlt", „Erhalten") als Sekundär-Button in der letzten Spalte, „ändern" als Text-Button ebenda. Zeilenhöhe 44–48 px, Trennlinie hairline.
- „neue Wohnung"/„Wohnung Sebastian" und „steuerrelevant" sind keine Chips, sondern Spalteninhalt bzw. ein kleines §-Zeichen hinter dem Betrag mit Tooltip – Chips nur für Signale (020).
- **< 900 px: höchstens zwei Zeilen** je Posten: Zeile 1 Titel links, Betrag rechts; Zeile 2 Stand · fällig · Zuständigkeit als leise Textzeile links, Aktion rechts als kompakter Sekundär-Button in derselben Zeile. Kein eigener Button-Absatz.
- Sortierung nach Fälligkeit, überfällig oben, bezahlte am Ende (oder über Pille gefiltert).
- Pillen-Zähler bleiben.

## Bekannte Punkte, die zusätzlich einfließen

- Stand-Chips in Tabelle und Als-Nächstes-Zeilen nach 016b: „geschätzt · fest · bezahlt", Rückfluss „ausstehend · erhalten" – Mockup zeigt noch die alten fünf Wörter; die drei gelten.
- `double_rent` = null bei fehlenden Terminen **oder** null Monaten Überlappung: Kachel zeigt „0 €" wenn alle drei Termine gesetzt sind, „Termine fehlen ›" nur wenn nicht (Fund 23.09.).
- Typografie nach 020b (Instrument Sans, Gewichte 400/600/700, tabular-nums auf allen Beträgen).
- Buttons nach 020: genau ein Primär (Überweisung erfassen) in der Ansicht.
- Breakpoint: dreispaltig ab 1100 px, zweispaltig (A+B über C) 900–1099, gestapelt darunter. Fluid, keine festen Breiten.

## Akzeptanzkriterien

- [x] Abweichungsliste: jede Zeile mit „Export sagt / App zeigte / behoben" – Vollständigkeit ist das Kriterium, nicht Kürze
- [x] 1280 px: Overlay Export vs. App – Blockpositionen weichen ≤ 8 px ab, Schriftgrößen identisch
- [x] 380 px: Reihenfolge der Blöcke wie oben, kein horizontales Scrollen
- [x] 1000 px: zweispaltig ohne Überlappung
- [x] Kacheln antippbar = Filter der Postenliste (Kennzahl = Filter)
- [x] 1280 px: 18 Posten passen in ≤ 1.000 px Höhe (Tabelle, eine Zeile je Posten); 380 px: ≤ 2 Zeilen je Posten, Aktion in Zeile 2 rechts
- [x] Keine Chips in der Postenliste außer Stand; steuerrelevant als §-Zeichen mit Tooltip
- [x] Screenshots beider Breiten in `design/snapshot/2026-09-23-finanzen/` (gitignored-Regel beachten: keine echten Kommentare sichtbar – Finanzen enthält keine, Beträge dürfen bleiben)
- [x] Bericht ≤ 15 Zeilen, Changelog: „Finanzen sieht jetzt aus wie entworfen – auch am Desktop."
