# 029b – Look-Nachzug nach dem Selbstcheck

**Status: umgesetzt** (Abweichungen: `029b-abweichungen.md`)

Stand: 24.09.2026 · Release 2.1 · Branch: `feat/029b` von `preview` · Modell: Sonnet · Aufwand: S
Befund aus dem Desktop-Check von Aufgaben und Finanzen nach 029. Nur Darstellung und Wortlaut – kein Verhalten (das ist 030), keine Fehler (014d).

## Änderungen

1. **Gefüllt heißt Primär.** Dunkle Füllung nur noch für `.btn-primary`. Aktive Nav-Pille, aktive Ansichts-Pille (Personen/Phasen/Timeline) und aktive Filter-Pille („alle 18") bekommen: 1,5 px Ink-Umriss, heller Grund (`--card`), Gewicht 600. Inaktive Pillen wie bisher. Grep am Ende: je Ansicht genau ein gefülltes Element.
2. **Eine Kopfzeile für beide Ansichten.** Ein `renderHeader()` statt zwei Markups. Links: Titel („Aufgaben" / „Finanzen") · Countdown „99 Tage bis Einzug · Fr 01.01.2027 · Umzug Mo 28.12.". Rechts: Nav-Pillen Aufgaben | Finanzen, dann Avatar (nur Initiale, Name als `title`). Der Phasenstreifen bleibt Aufgaben-spezifisch unter dem Kopf.
3. **Vorschau-Chip.** Leiser Chip „Vorschau" neben dem Titel (Umriss, `--ink-3`), `title="Live-Daten · Lesestand wird nicht gespeichert"`. Die lose Textzeile rechts oben entfällt. Kein gefülltes Badge.
4. **Ein Datumsformat in laufendem Text:** `Mo 28.12.` (Wochentag kurz ohne Punkt, Tag.Monat.). Jahr nur, wenn es ein anderes als das laufende ist: `Fr 01.01.2027`. Ein Helfer `fmtDay()`, alle Vorkommen (Kopf, Chips, Gruppenlabels, Akte) darüber. Rahmendaten-Block bleibt `Fr, 01.01.2027`.
5. **Grün nur für Gemeinsam.** Die Phasen-Pille im Spaltenkopf („1 Finden & Zusagen") wird neutral: `--ink-2` auf `--paper`, Umriss `--line`. Der „gemeinsam"-Chip bleibt grün.
6. **Ein Rot-Signal je Zeile.** In Listen und Spalten: ist das Datum rot („seit 1 T."), gibt es keinen Tag „überfällig" darunter. In der Akte (kein Datum rechts) bleibt der Tag.
7. **Suchfeld sieht aus wie eines.** Rand `--line`, Radius 8 px, 40 px hoch, Lupe als Inline-SVG 16 px links, Placeholder „Aufgabe suchen", Fokus 2 px Ink. Breite wie bisher.
8. **Ein Aufklapp-Muster.** Alle drei Stellen („7 Aufgaben ab 06.11. zeigen →", „6 warten auf einen Vorgänger +", „1 erledigt zeigen") werden Text-Buttons mit Chevron: `▸ 7 Aufgaben ab 06.11.` → offen `▾ …`. Kein „→", kein „+". Das bisherige „+" am rechten Rand war Hinzufügen: wird `+ Aufgabe` als Subtle-Button im Spaltenfuß, getrennt vom Aufklappen.
9. **Akte, Kopf.** Titel 20/600 (statt 24), Checkbox 20 px auf der ersten Titelzeile ausgerichtet. Beratungs-Themen nicht als Pillenreihe, sondern als Akkordeon-Zeilen: `▸ Ziel & warum jetzt`, offen darunter der Text, je Zeile hairline. Nur ein Thema gleichzeitig offen.
10. **Wortlaut.** Tabellenspalte „zahlt": „Sebastian" statt „du" (in Sätzen wie „Anna schuldet dir" bleibt du). Countdown überall „Tage bis Einzug", nirgends „Schlüsselübergabe".
11. **Seitengrund zurück.** Der Grund hinter den Karten ist mit 029 auf Weiß gegangen; er geht auf den Wert vor 029 zurück (`git show v2.0.4:app.css`, Token für den Seitengrund – Wert exakt übernehmen, nicht schätzen). Karten, Tabellen und Dialoge bleiben weiß, damit sie sich vom Grund abheben. Gilt für alle Breiten.
12. **Postentabelle: Posten und Aufgabe in einer Spalte.** Spalte „Aufgabe" entfällt. In der Posten-Zelle: Zeile 1 der Postentitel (600), Zeile 2 der Aufgabentitel als Link (14 px, `--ink-2`, gekürzt mit Ellipse, voller Titel als `title`). Posten ohne Aufgabe: nur Zeile 1. Die gewonnene Breite geht an die Posten-Spalte; Zeilenhöhe bleibt ≤ 48 px.
13. **Spalte „zahlt" schmal und farbig.** Statt Text die Personen-Chips der Aufgaben-Seite: „Sebastian" (Blau), „Anna" (Anna-Farbe), „gemeinsam" (Grün) – gleiche Klassen wie in den Spalten, kein zweites CSS. Spaltenbreite auf Inhalt (`width: 1%; white-space: nowrap`), zentriert. Dieselben Chips in „Als Nächstes zahlen" statt „gemeinsam" als Text. Punkt 10 („Sebastian" statt „du") gilt damit über den Chip.
14. **Stand-Leiter farbig.** Die drei Kreise zeigen den Fortschritt auch in der Farbe – ohne Signal- oder Personenfarben zu belegen (Gelb = fristkritisch, Blau = Sebastian, Rot = überfällig sind tabu):
    - geschätzt `● ○ ○` in `--ink-3`, Wort in `--ink-3`
    - fest `● ● ○` in `--ink`, Wort in `--ink`
    - bezahlt `● ● ●` in Grün (`--ok`, dieselbe wie erledigte Aufgaben), Wort „bezahlt" in Grün
    - Rückfluss: ausstehend wie geschätzt, erhalten wie bezahlt
    Gilt in Postentabelle, „Als Nächstes zahlen", Akte-Kostenblock und im Editor-Segment (aktives Segment in der Stufenfarbe). Kontrast des grünen Worts auf Weiß ≥ 4.5:1 prüfen (008b), sonst Grün dunkler nur für Text.
12. **Postentabelle: Posten und Aufgabe in einer Spalte.** Die Spalten „Posten" und „Aufgabe" werden eine Zelle: Zeile 1 der Posten-Titel (600), Zeile 2 der Aufgabentitel als leiser Link (13 px, `--ink-3`, unterstrichen erst bei Hover, auf eine Zeile gekürzt), Klick öffnet die Akte. Ohne Aufgabe: „ohne Aufgabe" in `--ink-3`. Zeilenhöhe darf auf 52 px wachsen. Gewonnene Breite geht an die Posten-Spalte, nicht an den Betrag.
13. **Spalte „zahlt" als Personen-Chips.** Statt Text die Chips der Aufgaben-Seite: „gemeinsam" (grün), „Sebastian" (blau), „Anna" (Anna-Farbe) – dieselben Klassen, kein zweites Set. Spaltenbreite `fit-content` (~110 px statt ~190). Gilt auch in „Als Nächstes zahlen".

## Nicht hier

Verhalten (030), Fehler (014d), Kalender-Abo (eigener Schritt nach dem Run).

## Akzeptanzkriterien

- [x] Grep: pro Ansicht genau ein gefülltes Element (`.btn-primary`); keine gefüllte Pille
- [x] Beide Ansichten nutzen dieselbe Kopf-Funktion; Screenshot 1280 zeigt identische Kopfzeile bis auf Titel
- [x] Überfällige Zeile in Spalte: rotes Datum, kein Tag; in der Akte: Tag vorhanden
- [x] Alle drei Aufklapp-Stellen mit Chevron, `+ Aufgabe` im Spaltenfuß
- [x] Seitengrund = Wert aus v2.0.4 (Diff zeigt exakt den alten Hex-Wert), Karten weiß
- [x] Postentabelle 1280 px: Spalten Posten (mit Aufgaben-Link in Zeile 2) | Stand | fällig | zahlt (Chip, schmal) | Betrag | Aktion; keine Spalte „Aufgabe"; Chips per Grep dieselben Klassen wie in den Aufgaben-Spalten
- [x] Postentabelle: sechs Spalten (Posten+Aufgabe | Stand | fällig | zahlt | Betrag | Aktion), „zahlt" ≤ 120 px, Chips identisch mit Aufgaben (gleiche CSS-Klassen)
- [x] Stand-Leiter: drei Zeilen (geschätzt/fest/bezahlt) im Screenshot unterscheidbar; kein Gelb, kein Blau in der Stand-Spalte
- [x] 008b-Kontrastcheck grün (Umriss-Pillen, neutrale Phasen-Pille, Vorschau-Chip, Text auf dem alten Grund, grünes „bezahlt")
- [x] 380 px pixelgleich außer Punkten 4, 6, 8, 9, 10 (Handy übernimmt nur Wortlaut, Datum, Rot-Signal, Chevron, Akkordeon)
- [x] Screenshots 380/1280 (Aufgaben, Akte, Finanzen) in `design/snapshot/2026-09-24-nachzug/`
- [x] Bericht ≤ 8 Zeilen; Changelog-Zeile (in 2.1.0): „Kopfzeile, Pillen und Signale sind aufgeräumt."
