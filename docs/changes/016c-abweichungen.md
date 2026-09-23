# 016c – Abweichungsliste Finanzen gegen Export „Variante B v2 – Review"

Stand: 23.09.2026 · Branch `feat/016c-finanzen-abgleich` → `preview` · Maßstab: `design/handoff/2026-09-23-tweaks/Variante B v2 - Review.dc.html`, Rahmen „Finanzen · 380" und „Finanzen · 1280"
Methode: Export und App mit denselben Daten (acht Posten, drei laufende Kosten, Einzug 01.01.2027) headless gerendert, jede Textzeile und jeder Block mit Position, Schriftgröße und -gewicht vermessen, dazu Screenshots nebeneinander. Keine Migration.

„behoben" = App zeigt jetzt, was der Export sagt. „bleibt" = bewusst nicht übernommen, mit Grund.

## 380 px

| # | Export sagt | App zeigte | Stand |
|---|---|---|---|
| 1 | Kopf: „Finanzen" 22 px/600 links, Text-Pillen „Aufgaben"/„Finanzen" (13 px, 40 px hoch), Avatar-Kreis 40 px rechts | Avatar links, Symbol-Pillen ohne Text, Statuszeile im Kopf | behoben – eigener Finanzen-Kopf (Aufgaben-Ansicht unverändert) |
| 2 | Statuszeile „gespeichert … · Live" in der Fußzeile rechts | im Kopf | behoben |
| 3 | Fußzeile: Version + ⓘ links, Status rechts – kein „Umzugstag drucken", kein „Abmelden" | ⓘ, Version, „Umzugstag drucken", „Abmelden" | behoben; „Abmelden" steht jetzt im Avatar-Menü (überall erreichbar) |
| 4 | Oberzeilen „Der Umzug kostet euch", „Ausgleich" 12 px/400 | 12 px/600 | behoben |
| 5 | Herleitungszeilen: Werte 15 px/400 | 600 | behoben |
| 6 | „davon bezahlt": Wert in Textfarbe | grau (Klassenname kollidierte mit der globalen Hilfsklasse `.quiet`) | behoben |
| 7 | „davon bezahlt 19 %" = Anteil an der Antwortzahl | Anteil an den Posten (23 %) | behoben |
| 8 | Herleitungszeilen 40 px hoch | 44 px | bleibt – CLAUDE.md: Tap-Ziele ≥ 44 px |
| 9 | negative Beträge mit Minuszeichen „− 1.200 €" | Bindestrich „-1.200 €" | behoben |
| 10 | Ausgleich-Karte: Rahmen 1 px, Überschrift „Du schuldest Anna 510 €" ohne Cent | Rahmen 1,5 px, „… 1.200,00 €" | behoben – Cent nur, wenn es welche gibt |
| 11 | Satz aus Sicht der Person: „Anna hat … ausgelegt, du …" | feste Namen „Anna hat …, Sebastian …" | behoben |
| 12 | – (Export zeigt nur Sebastians Sicht) | **Anna sah „Anna schuldet dir …"** – Überschrift war nicht personenbezogen | **behoben (Bugfix: falsche Anzeige)** |
| 13 | Als Nächstes: Titel 15 px/400 auf Höhe des Datums | 16 px, der 44-px-Knopf schob den Titel nach unten | behoben – Trefferfläche bleibt 44 px (unsichtbar vergrößert) |
| 14 | Stand-Chip farbig (beige = beauftragt, umrandet = geschätzt, grün = bezahlt) | grauer Einheitschip | behoben mit den Exportfarben; Wörter nach 016b („fest" statt „beauftragt") |
| 15 | Zuständigkeit „du"/„gemeinsam" | Namen | behoben |
| 16 | Monat unter dem Datum „Nov" | „Nov." | behoben |
| 17 | dritte Zeile (beauftragt) ohne Knopf | „Bezahlt" | bleibt – 016b: „fest" hat immer genau einen Knopf „Bezahlt" |
| 18 | geschätzte Beträge ohne „≈" | „≈ 270 €" | bleibt – 016b-Regel „≈ 1.500 €" für geschätzt |
| 19 | Kopfzusatz „· nichts überfällig" in Versalien | Kleinschrift | behoben |
| 20 | Monat für Monat: vier Spalten (ohne „davon bezahlt") | fünf, Monatsnamen zweizeilig | behoben – „davon bezahlt" ab 900 px |
| 21 | Monatsnamen „Sep 2026" | „Sept. 2026" | behoben |
| 22 | Tabellenwerte ohne € („1.380", „−1.200", „–") | mit € | behoben |
| 23 | Tabellenkopf 12 px/400 grau | 12 px/600 dunkler | behoben |
| 24 | Zeilen 39 px, Haarlinie oben | 33 px, Linie unten | behoben |
| 25 | teuerster Monat fett – auch der Monatsname | nur die Zahlen fett | behoben |
| 26 | Zeitraum bis ein Monat nach dem letzten Auszug (Mär) | zwei Monate (Apr) | behoben |
| 27 | Laufend: zweite Zeile in `ink-2` | `ink-3` | behoben |
| 28 | Laufend-Tabelle ohne Kopfzeile, 13 px, Zeilen 34 px | mit Kopf, 14 px | behoben |
| 29 | Differenzen „+50 €", „−70 €" ohne Leerzeichen | „− 170 €" | behoben |
| 30 | „ALLE POSTEN 8", rechts „nach Fälligkeit" | „ALLE POSTEN · nach Fälligkeit" | behoben |
| 31 | Filterpillen 13 px/400, eine Reihe | 14 px/600, zweizeilig | behoben – Ausnahme von 020s „14/600 durchgehend", nur hier, weil der Export gilt |
| 32 | „5 offene Posten zeigen →" als Zeile mit Linie | „4 Posten zeigen →" als Textlink | behoben; öffnet die fünf offenen (Filter „offen") |
| 33 | Rahmendaten-Zeile „Auszug du …, Anna …", „ändern" als blauer Link | Namen, fetter Textknopf | behoben – neues Token `--link` (6,6 : 1 auf Papier) |
| 34 | kein „+ Posten", kein Kalender-Abo | beides vorhanden | bleibt – 016b und 022 kamen nach dem Export |

## 1280 px

| # | Export sagt | App zeigte | Stand |
|---|---|---|---|
| 35 | Kopfleiste 64 px mit Haarlinie: „Finanzen · 101 Tage bis Einzug", rechts Pillen und Avatar-Pille „S Sebastian" | Avatar links, Pillen, Status | behoben |
| 36 | Antwort links, vier gleich hohe Kacheln in einer Reihe (Wert 20 px/600 oben, Bezeichnung 12 px darunter) | 2×2-Raster, Wert rechts | behoben |
| 37 | Antwortzahl 56 px, „netto" 15 px | 44 px / 14 px | behoben |
| 38 | drei Spalten ab 1100 px: A Als Nächstes · B Monat für Monat · C Leiste (Ausgleich, Laufend, Rahmendaten); Alle Posten über A+B | eine Spalte, 2.331 px hoch | behoben – 1.073 px inkl. Fußzeile (Export-Rahmen 971 ohne Fuß) |
| 39 | Als Nächstes: Knopf in Zeile 2 neben Chip und Zuständigkeit, 32 px | eigene Zeile | behoben |
| 40 | Monat für Monat mit „davon bezahlt", ohne Satz darunter | Satz darunter | behoben |
| 41 | Alle Posten: Pillen rechts in der Kopfzeile, Tabelle Posten · Aufgabe (Link) · Stand · fällig · zahlt · Betrag | dreizeilige Karten, ~150 px je Posten | behoben – eine Zeile je Posten, 44 px; 18 Posten = 827 px |
| 42 | – (keine Aktionsspalte) | – | Aktion als letzte Spalte nach Auftrag §Posten-Zeile („Betrag festlegen"/„Bezahlt"/„Erhalten", sonst „ändern") |
| 43 | Stand als Chip mit alten Wörtern | – | Leiter ●●○ + Wort nach Auftrag und 016b |
| 44 | Aufgabe als blauer Link | kein Link in der Liste | behoben – führt in die Akte |
| 45 | bezahlte Zeilen grau | gleich dunkel | behoben |
| 46 | Sortierung nur nach Datum (bezahlte stehen oben) | nach Datum | Auftrag: überfällig oben, bezahlte am Ende |
| 47 | keine Chips für Wohnung/steuerrelevant | Chips „neue Wohnung", „steuerrelevant" | behoben – § hinter dem Betrag mit Tooltip; Wohnung nur im Bearbeiten-Modus |
| 48 | Ausgleich-Karte listet die Zahlungen („Anna: Anzahlung Küche · 1.200 € · du 600 €"), kein „Wie gerechnet?" | Satz + „Wie gerechnet?" | behoben (ab 1100 px) |
| 49 | Laufend: „1.785 € / Monat", „50 € weniger als heute zusammen", Tabelle Posten · du · Anna · neu · Δ | heute · neu · Δ | behoben |
| 50 | Rahmendaten als Leseblock: „Fr, 01.01.2027", „Aufteilung 50 / 50", „Puffer 20 % · 940 €" | eine Zeile | behoben; Umzugstag-Zeile zusätzlich (1.1) |
| 51 | – | – | 900–1099 px: A+B nebeneinander, Leiste darunter zweispaltig, dann Alle Posten |

## Nebenbei gefunden und behoben

- **Überweisung als Puffer:** `bufferRow()` nahm die erste Kostenzeile ohne Aufgabe – eine erfasste Überweisung (Art `ausgleich`) hat auch keine Aufgabe und konnte als „Puffer" erscheinen. Jetzt ausgenommen.
- **Überweisungen in „Alle Posten":** tauchten als Posten auf. Jetzt nicht mehr – sie verschieben nur den Saldo.
- **Doppelmiete „0 €" ohne Einzugstermin** (bekannter Punkt 23.09.): „Termine fehlen" jetzt, solange einer der drei Termine fehlt; mit allen drei ist fehlende Überlappung echte 0 €.

## Gefunden, nicht behoben

- Aus 016b bekannt: steht eine Zeile in „Als Nächstes zahlen" **und** in „Alle Posten", erscheint ein geöffnetes Formular in beiden. Am Desktop jetzt gut sichtbar nebeneinander – eigener kleiner Auftrag sinnvoll.

## Prüfung

- 1280 px, 28 Anker (Kopf, Antwortzahl, Kacheln, Abschnittsköpfe, erste Zeilen, Leiste): alle ≤ 8 px, Schriftgröße und -gewicht identisch.
- 380 px: Reihenfolge der sieben Blöcke wie Soll, kein waagrechtes Scrollen; Versatz nur durch #8 und #17 (erklärt).
- 1000 px: zweispaltig, keine Überlappung. Kacheln filtern die Postenliste. 18 Posten: 827 px. 380 px offene Liste: 87 px je Posten, Aktion Zeile 2 rechts. Genau ein Primär.
- Regression 016–026: 186 von 187 grün (die eine: 016s alter Test auf „Angebot eintragen", seit 016b ersetzt).
- Screenshots: `design/snapshot/2026-09-23-finanzen/finanzen-380.png`, `finanzen-1280.png` (Demo-Daten, keine echten Kommentare).
