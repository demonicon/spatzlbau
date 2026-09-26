# 038 – Seitensystem: Navigation + zwei Seitentypen (Teil 1 von 2)

Stand: 25.09.2026 · Meilenstein 2.3 · Branch: `feat/038` von `preview` · Modell: Opus · Aufwand: L · Art: Feature · Klärung: Chat, 25.09.
Grundlage: `038a-matrix.md` (Ist), 26 Screenshots (lokal), Claude-Design-Export „Seitensystem" (25.09., liegt vor), `.claude/rules/design.md`. Teil 2 = `038b` Komponenten-Konsolidierung (eigener Auftrag, eigenes Release).
**Status: bereit (v2, Export-Stand 26.09. 00:56).** Abweichungsliste am 25.09. 23:47 von Sebastian abgehakt („folge allen Empfehlungen, genaue Umsetzung"); Export danach von Sebastian überarbeitet → Zeilen 0, 1, 21–23 neu, Ergänzungen E5–E12; E5 und E12 am 26.09. 01:02 entschieden – **keine offenen Punkte, bereit für `/auftrag 038`.** Die Liste ist verbindlich – Claude Code setzt exakt die Spalte „Export-Soll" um, korrigiert um die Spalte „Empfehlung", ohne eigene Interpretation. Export im Repo: `design/handoff/2026-09-25-seitensystem/Seitensystem.dc.html` + `Seitensystem.pdf` (Stand 26.09. 00:56 – **die ältere Fassung vom 25.09. 23:36 ist ungültig**).

## Klärung (Sebastian, 25.09. 23:06–23:09)

1. **Woran erkennst du, dass es gelungen ist?** → *Anna findet sich ohne Erklärung zurecht* **und** *Performance- & Stabilitätsgewinn*.
   → Konsequenz: zwei Abnahmen. (a) Nutzertest mit Anna am Wochencheck nach Release: vier Ziele ansteuern, aus jeder Akte zurück, ohne Nachfrage. (b) Messbar im Bericht: eine Render-Funktion je Seitentyp statt je Seite; Route-Wechsel ohne Neuaufbau des Kopfes; keine Layout-Sprünge (CLS) beim Laden; Realtime-Update tauscht nur die betroffene Zeile; Konsole ohne Fehler auf allen Routen; `app/**/*.js` gesamt nicht größer als heute. Vorher/Nachher-Werte (Zeilen je Datei, Anzahl `innerHTML =` je Route, Ladezeit `#finanzen` und `#aufgaben` mit Playwright-Trace) stehen im Bericht.
2. **Wer nutzt es zuerst, wo?** → *Desktop* (Sebastian).
   → Konsequenz: Liste + Panel und Sub-Nav-Segment werden in voller Tiefe spezifiziert und zuerst gebaut; die Handy-Tab-Leiste kommt im selben Auftrag, aber als zweiter Block – Reihenfolge im Plan Mode entsprechend; Tests 1280 vor 380.
3. **Wie verbindlich ist der Claude-Design-Export?** → *Sebastian entscheidet je Punkt.*
   → Konsequenz: Nach dem Export erstellt Claude (Chat) die Abweichungsliste unten (Export-Punkt · heute · Vorschlag · Empfehlung ✓/✗/anders); Sebastian hakt ab; nur abgehakte Punkte werden Änderungen. Claude Code bekommt keinen Interpretationsspielraum gegenüber der Liste; fehlt ein Punkt, fragt es in Schritt 0 nach, statt zu raten.
4. **Schnitt?** → *Zwei Teile.*
   → Konsequenz: 038 = Navigation + beide Seitentypen (jede Seite zieht auf ihren Typ um, Komponenten werden dabei nur *benutzt*, nicht konsolidiert). 038b = Komponenten-Konsolidierung (9 Tabellen → 1, 13 Leertexte → 1, 2 Editor-Hüllen → 1) mit eigenem Release. 038 darf Duplikate stehen lassen, wenn sie hinter der neuen Seitenstruktur liegen; es darf keine neuen anlegen.

## Ziel

Sechs Ansichten folgen einem Modell: eine Navigation, zwei Seitentypen. Look, Tokens, Signalregeln unverändert (kein Redesign). Keine neuen Funktionen; die Release-2.2-Skizzen (8a–8d) werden nur insoweit berücksichtigt, dass die Seitentypen ihre Muster (Erinnerungen-Block, klappbare Sektion mit Kopf, angeheftete Karte, Angebote-Tabelle) aufnehmen können – gebaut werden sie in 031/025.

## Änderungen (Rahmen; Details aus der Abweichungsliste)

1. **Router und Shell.** Eine Shell (`app/shell.js`): Kopfzeile (sticky, Scrollkante), Nav, Sub-Nav-Segment, Inhaltscontainer, Panel-Container. Schrift Geist lokal (Zeile 0), Typo-Tokens (E10), Fläche `--bg` (E7). Der Router tauscht nur den Inhaltscontainer; Kopf und Nav werden einmal gerendert und per Zustand aktualisiert (aktive Route, Badges). Heute baut jede Seite ihren Kopf selbst (Matrix Zeile 1).
2. **Navigation.** ≥ 900 px: Unterstrich-Tabs statt Pillen (Zeile 1), aktiv = Route (032c). < 900 px: Tab-Leiste unten, vier Ziele + Badge-Platz, 56 px + Safe-Area; Kopfzeile verliert die Pillen, behält Titel · Countdown · Avatar. Zweite Ebene als ein Segment-Element für alle Seiten (Aufgaben: Personen · Phasen · Timeline; Entscheidungen: offen · alle; Finanzen, Anfragen: keins).
3. **Seitentyp Liste + Panel** (`app/pages/listPanel.js`): Konfiguration je Seite (Kopf, Filter, Zeilen-Renderer oder Tabellen-Spalten, Leerzustand, Anlegen-Aktion, Primär). Desktop `1fr` + festes Panel; ohne Auswahl erste Zeile; Handy: Liste → Detailseite mit Zurück (Browser-History). Aufgaben (drei Unteransichten), Entscheidungen, Anfragen ziehen um.
4. **Seitentyp Dashboard** (`app/pages/dashboard.js`): Antwortzahl, Kacheln als Filter, rechte Leiste, klappbare Sektionen mit Sektionskopf (Zahl · Fortschritt · Anlegen · Chevron). Finanzen zieht um; Posten/Verträge-Sektionen (031) finden hier ihren Platz, werden aber nicht gebaut.
5. **Performance/Stabilität** (aus Klärung 1): Shell rendert einmal; Seiten rendern in ihren Container; Realtime patcht Zeilen per `data-id`; keine Doppel-Listener (heute: Matrix, Editor-Hülle); Fehlerfall je Route abgefangen mit Leerzustand statt weißer Seite.
6. **Regeländerung `rules/design.md`:** Dashboard: ein Primär je Sektionskopf („+ Posten", „+ Vertrag"); Ausgleich ohne Primär. Liste+Panel: Primär lebt im Panel, zustandsabhängig, nie in der Liste (020 unverändert).
7. **Abgrenzung:** keine Komponenten-Konsolidierung (038b), keine neuen Farben, keine Datenmodell-Änderung, keine 031/025-Funktionen.

## Abweichungsliste (Export „Seitensystem" 25.09. · Sebastian entscheidet je Punkt)

Empfehlung: ✓ übernehmen · ✗ nicht übernehmen · ≈ anders (Vorschlag in der Zelle). Spalte „Auftrag" sagt, wo es gebaut wird. Nummern = Export-Tabelle „Abweichungen je Ansicht".

| # | Ansicht | Heute (038a) | Export-Soll | Empfehlung | Auftrag | Sebastian |
|---|---|---|---|---|---|---|
| 0 | Alle | Instrument Sans 400/600/700, lokal (020b) | **Geist** 400/600/700, lokal als woff2; Größen/Gewichte/Tokens unverändert; `design.md` nennt die neue Familie | ✓ (Änderung Sebastian 26.09.). Bedingungen: OFL-Lizenzdatei ins Repo, nur drei Schnitte als woff2 (≈ 3 × 30–60 kB), `font-display: swap`, Kontrastmatrix 029c bleibt gültig (gleiche Farben) | 038 | ✓ 26.09. |
| 1 | Alle | jede Seite ruft `renderHeader()`; Nav-Pillen; Reihenfolge Aufgaben · Finanzen · Anfragen · Entscheidungen | Shell rendert Kopf einmal, **sticky** mit Scrollkante (Schatten ab Scroll > 0); Nav als **Unterstrich-Tabs** (Icon 16 + Text 14, aktiv Tinte 600 + Balken 3 an der Kopf-Unterkante, ruhend `--ink-2`), keine Pillen mehr; Kopf-Linie 1 `--line` unten; Reihenfolge Aufgaben · Finanzen · Entscheidungen · Anfragen; Badge 18 als Zahl hinter dem Label | ✓ – Desktop-Tabs und Handy-Tab-Leiste sind damit dieselbe Komponente in zwei Maßen | 038 | ✓ 26.09. |
| 2 | Alle (380) | Icon-Reihe im Kopf, ~150 hoch | Tab-Leiste unten 56 + Safe-Area; Kopf 90 (Titel · Vorschau · Avatar / Countdown); Avatar bleibt oben | ✓ | 038 | ✓ 25.09. |
| 3 | Alle | vier Datumsformatierer | `dueShort` in Listen/Tabellen, `fmtDay` in Kopf/Panel, MMM JJJJ nur Monat für Monat; lokale `fmtDay` in timeline.js entfällt | ✓ | 038 | ✓ 25.09. |
| 4 | Personen | Segment als drei lose Pillen unter der Suche | Segment als verbundene Kontrolle direkt unter dem Kopf, Suche daneben in einer Zeile | ✓ | 038 | ✓ 25.09. |
| 5 | Personen | Signal-Kacheln über der Liste; 380: Kacheln Du/Gemeinsam/Anna | 1280: Filter-Pillen alle · überfällig · fristkritisch · wartet auf dich; 380: Pillen je Person | **≈ entschieden (Sebastian 25.09.):** Pillen ja, Beschriftung „Sebastian · Gemeinsam · Anna" (kein „Du", 029b); Pille nur mit Zahl > 0 (030) | 038 | ✓ 25.09. |
| 6 | Personen | Zeilen bis vier Zeilen | min 56 / max 78, Titel ≤ 2 Zeilen, Meta einzeilig, „wartet auf dich" vorn in der Meta, rechts nur Datum | ✓ | 038 | ✓ 25.09. |
| 7 | Personen/Phasen/Timeline | ohne Auswahl kein Panel; ✕ schließt | Panel 400 immer, zeigt erste Zeile; ✕ entfällt ≥ 900 | ✓ (wie 032c auf Entscheidungen) | 038 | ✓ 25.09. |
| 8 | Personen/Phasen/Timeline | Handy: Akte klappt inline auf | Detailseite „‹ Aufgaben", Browser-Zurück, Scrollposition bleibt | ✓ – das ist der Backlog-Punkt „Akte am Handy als Vollbild", Annas Urteil kommt über den Nutzertest nach Release | 038 | ✓ 25.09. |
| 9 | Phasen | fünf Kanban-Spalten | eine Liste nach Phase gruppiert, Phasenleiste filtert | **✗ entschieden (Sebastian 25.09.):** Phasen behält fünf Spalten im Listenbereich (Spaltenform wie Personen mit drei); Zeile, Panel, Detailseite, Leerzustand und Filter-Pillen ziehen auf den Typ um; keine Phasenleiste als Filter | 038 | ✓ 25.09. |
| 10 | Phasen | drei Leertexte | ein Leerzustand: Satz + Grund + eine Richtung | ✓ Komponente | 038b | ✓ 25.09. |
| 11 | Timeline | Owner-Chips mit eigener Klasse | gemeinsame Filter-Pille; Rail und Heute-Trenner bleiben | ✓ | 038 | ✓ 25.09. |
| 12 | Finanzen | Kacheln nur Anzeige, Aufschlüsselungs-Zeilen filtern | Kachel = Filter, aktiver Filter als Pille im Sektionskopf; `fin-break-row` und Posten-Pillen entfallen | ✓ (030: leere Kachel bleibt weg) | 038 | ✓ 25.09. |
| 13 | Finanzen | „Alle Posten" Überschrift + Pillen, „+ Posten" als Textzeile | Sektion Posten mit Kopf: Zahl · Fortschritt · + Posten (Sekundär) · Chevron | **≈ entschieden (Sebastian 25.09.):** Sektionskopf ja; „Überweisung erfassen" verliert den Primär (wird Subtle-Link „Überweisung erfassen ›" in der Ausgleich-Karte, Funktion bleibt); **„+ Posten" und „+ Vertrag" sind Primär** im jeweiligen Sektionskopf. Regel für Dashboard in `rules/design.md`: *ein Primär je Sektion*, nicht je Ansicht – 020 bleibt für Liste+Panel unverändert. 031 v2 wird entsprechend angepasst | 038 (Kopf + Regel), 031 (Verträge) | ✓ 25.09. |
| 14 | Finanzen | Monat für Monat immer offen neben Als Nächstes | klappbare Sektion, eingeklappt | ✓ | 038 | ✓ 25.09. |
| 15 | Finanzen | Posten-Editor als dunkler Balken inline | Editor-Hülle: Dialog ≤ 720 (1280), eigene Seite (380) | ✓ Komponente | 038b | ✓ 25.09. |
| 16 | Finanzen | rechte Leiste ~380; Kalender-Abo eigener Block | Leiste 400; Kalender-Abo + Erinnerungen (Chips 3 T · 1 T · am Tag aus 022c) als Zeilen der Rahmendaten; 380: Ausgleich nach oben, Rest klappbar ans Ende | ✓ | 038 | ✓ 25.09. |
| 17 | Finanzen | fällig über `fmtDay` | `dueShort` wie Aufgaben | ✓ (Teil von 3) | 038 | ✓ 25.09. |
| 18 | Entscheidungen | Pillen alle/offen | Segment „offen · alle", offen Standard | ✓ | 038 | ✓ 25.09. |
| 19 | Entscheidungen | `dt-table` eigene Breiten (032c: 10/10/44/14/12) | colgroup Datum 12 · Von 12 · Entscheidung 48 · Am Zug 14 · Aktion 14 | ✓ Export-Werte (Summe 100, Rest-Luft entfällt) | 038 | ✓ 25.09. |
| 20 | Entscheidungen | Handy-Seitenwechsel, Panel wie Personen | bleibt; Panel zeigt erste Zeile | ✓ bereits Soll | – | ✓ 25.09. |
| 21 | Anfragen | Liste ~320 links, Detail breit | **bleibt so**: Liste 320 links als klappbare Sektion (Sektionskopf: „Anfragen · 3 · 1 Ergebnis" · „+" · Chevron), Detail 1fr rechts – festgelegte **Ausnahme von Panel 400** wegen der Vergleichstabelle; erste Zeile vorgewählt | ✓ (Revision Sebastian 26.09.; ersetzt v1) | 038 | ✓ 26.09. |
| 22 | Anfragen | Kartenliste `af-row` mit Balken-Leiter | zweizeilige Listenzeilen (Titel + Chip „Ergebnis da" / Segment-Leiter · Stufe · Aufgabe) in der klappbaren Sektion; keine Tabelle | ✓ (Revision) | 038 | ✓ 26.09. |
| 23 | Anfragen | Angebote als Spalten je Anbieter, volle Breite | **Spalten je Anbieter bleiben** (Tabellen-Komponente, erste Spalte Zeilenlabel 104 px): Kopf Anbieter + Quelle („Claude empfiehlt" sand hinterlegt), Zeilen Preis (günstigster fett) · Laufzeit · Leistung · Einmalig, Fußzeile „Wählen" je Spalte – **Primär nur bei der Empfehlung, sonst Sekundär**; Handy: Detailseite mit transponierten Zeilen (Name · Preis, aufklappbar, Wählen 40 in der offenen Zeile); Akte (Panel 400): nur Kurzfassung „Claude empfiehlt …" + Link zur Anfrage | ✓ (Revision) – 033b entfällt damit bis auf den Kurzfassungs-Link | 038 | ✓ 26.09. |
| 24 | Anfragen | „+ Anfrage" Sekundär oben rechts | bleibt; Anlegen-Position für alle Liste+Panel-Seiten | ✓ | – | ✓ 25.09. |

**Skizzen Release 2.2 (8a–8d) im System**

| Skizze | Befund Export | Empfehlung | Auftrag | Sebastian |
|---|---|---|---|---|
| 8a Erinnerungen | als Zeilen Kalender-Abo + Erinnerungen in Rahmendaten, Chips 28 | ✓ – 022c hat die Stufen schon, nur Darstellung wandert | 038 | ✓ 25.09. |
| 8b Verträge | Kopf → Sektionskopf (Pillen entfallen), Stand-Segment → Leiter ●○○ mit Tipp, 7 → 6 Spalten mit Prozent | ✓ – 031 v2 wird entsprechend angepasst (v3), Kern bleibt | 031 | ✓ 25.09. |
| 8c Entscheidungen | Karte violett = Komponente, Liste = Liste+Panel Tabellenform, Panel 400 statt 540 | ✓ bereits so gebaut | – | ✓ 25.09. |
| 8d Angebote | Vergleich bleibt spaltenweise im breiten Anfrage-Detail (Ausnahme von Panel 400); Akte zeigt Kurzfassung + Link; Handy transponiert | ✓ (Revision 26.09.) | 038 | ✓ 26.09. |

**Nicht im Export, von mir ergänzt**

| # | Punkt | Empfehlung | Auftrag | Sebastian |
|---|---|---|---|---|
| E1 | Mockup-Daten zeigen Umzugstag Mo 21.12. – ist Platzhalter, keine Vorgabe; Rahmendaten bleiben Datenquelle | zur Kenntnis | – | ✓ 25.09. |
| E2 | Nav-Pille aktiv = Umriss (nicht gefüllt): stimmt mit 029b „gefüllt = Primär" überein | ✓ | 038 | ✓ 25.09. |
| E3 | Segment 40 hoch am Handy, Filter-Pillen 40 waagerecht scrollend: Tap-Ziele ≥ 44 laut 014 – Export nimmt 40 + 4 Innenabstand | ≈ 44 Tap-Fläche, 40 sichtbar | 038 | ✓ 25.09. |
| E4 | Export legt Tabelle/Leerzustand/Editor-Hülle als „je einmal" fest → Grenze 038/038b: 038 baut Shell, Nav, Seitentypen und *benutzt* heutige Tabellen/Editoren; 038b ersetzt sie | ✓ (Klärung 4) | 038 / 038b | ✓ 25.09. |
| E5 | **Leiter als CSS-Segmente** (14 × 4, Abstand 2, r 1; erreicht Tinte, offen `--line`; 3 Stufen = 46 px, 4 = 62 px; Stufe als Wort 13 `--ink-3` daneben) statt Glyphen ●○○, für Posten, Verträge, Anfragen, Als Nächstes zahlen. **Export: „keine Farbe"** – das nimmt 029b P14 zurück (heute grau → Tinte → Grün). | **✓ entschieden (Sebastian 26.09. 01:02): Export folgen, keine Farbe.** 029b P14 ist damit zurückgenommen; `design.md`: Leiter = Segmente Tinte/`--line`, Stufe als Wort | 038 | ✓ 26.09. |
| E6 | **Tabelle: Textspalte flexibel, Datenspalten feste Pixel** (Stand 128 · Datum 64 · Chip 112 · Betrag 100 · Aktion 100, rechts gebündelt) statt Prozentbreiten (029c P8). Export ist hier uneinheitlich: #19 Entscheidungen nennt noch Prozent. | ✓ Pixel überall, `table-layout: fixed` bleibt; Entscheidungen: Datum 64 · Von 112 · Entscheidung flexibel · Am Zug 112 · Aktion 100 (ersetzt die %-Werte in #19) | 038 | ✓ 26.09. |
| E7 | **Neue Fläche `--bg` #F3F3F3** (kühles Grau) für Sektionsköpfe, „Als Nächstes zahlen"-Kopf, gewählte Zeile, Segment-Hülle; Fortschritts-Spur darauf weiß | ✓ als Token in `tokens`/`design.md`; Kontrast Text 13 `--ink-2` auf #F3F3F3 prüfen (029c-Matrix erweitern) | 038 | ✓ 26.09. |
| E8 | **Kachel v2**: min 88, Label 13 oben, Wert 24/600, Zusatz 12 (Anzahl bzw. „✓ filtert Posten"); **Wertfarbe: Gutschrift `--ok` grün** (Rückflüsse), Kosten Tinte; Rot bleibt überfällig; Kacheln als volle Reihe 4 × 1fr unter der Antwortzahl | ✓ – erste Verwendung von Grün für Geld; Regelzeile in `design.md`: Grün = Gutschrift/erreicht, nie Warnung | 038 | ✓ 26.09. |
| E9 | **Antwortzahl-Zeile**: Label 12 caps · 60/600 · **Rechenweg 14** darunter („10.122 € Posten inkl. Puffer − 4.950 € Rückflüsse + 0 € Doppelmiete"); rechts daneben **Mini-Balken „Monat für Monat"** (Karte, 8 Monate, bezahlt Tinte / geplant `--line` / Rückfluss grün, Klick öffnet die Sektion) | ✓ – die Mini-Balken sind eine **neue Komponente** (nur hier); SVG/CSS ohne Bibliothek, Höhe 60 + 44 | 038 | ✓ 26.09. |
| E10 | **Typo-Skala als Tokens**: `--fs-hero` 60/600 −3 % · `--fs-kpi` 28/600 · `--fs-tile` 24/600 · `--fs-title` 22/600 · Sektionskopf 18/600 · `--fs-body` 16/400 · `--fs-ui` 15 · `--fs-meta` 14 · `--fs-small` 13 · `--fs-micro` 12/600 caps +6 % · `--fs-nano` 11/700; Zahlen `tabular-nums` in Listen/Tabellen | ✓ in `app.css` als Tokens, bestehende px-Werte darauf umziehen (Grep im Bericht: keine nackten `font-size` außerhalb der Tokens in neuen Dateien) | 038 | ✓ 26.09. |
| E11 | Dashboard-Frames B/C des Exports (Verträge ausgeklappt mit 6 Spalten; Monat für Monat ausgeklappt als Tabelle Monat · Posten · bezahlt · Doppelmiete · gesamt, aktueller Monat fett/`--bg`, Rückflüsse grün) | ✓ Monat-für-Monat-Tabelle in 038; Verträge-Tabelle (Vertrag · Wohnung · Aktion · Stand · Ende · Aufgabe) in 031 v3 | 038 / 031 | ✓ 26.09. |
| E12 | Export-Komponentenblatt sagt weiter „Primär höchstens einmal je Ansicht" und zeigt „+ Posten/+ Vertrag" Sekundär, Ausgleich Primär – **Sebastians Entscheidung #13 (23:47) ist im Export nicht nachgezogen** | **✓ bestätigt (Sebastian 26.09. 01:02): #13 bleibt.** Sektionsköpfe „+ Posten/+ Vertrag" Primär, Ausgleich Subtle-Link – der Export ist an dieser Stelle nicht maßgeblich | 038 | ✓ 26.09. |

## Tests (Desktop zuerst)

- 1280: jede Route → Kopf bleibt im DOM (gleiche Node-Referenz), nur Inhalt wechselt; Nav-Pille aktiv = Route; Segment zeigt je Seite die richtigen Werte.
- 1280: Liste + Panel auf Aufgaben/Entscheidungen/Anfragen – ohne Auswahl erste Zeile, Klick wechselt Panel, Panel-Breite identisch auf allen dreien.
- 1280: Finanzen als Dashboard – Kacheln filtern, Sektionen klappen, Deep-Link klappt auf.
- 380: Tab-Leiste unten auf allen Routen, Badge Entscheidungen, Detailseite mit Zurück (Browser-Back landet auf der Liste, Scrollposition bleibt).
- Realtime: Kommentar von A in Kontext S → nur die Zeile/Karte ändert sich (Mutation-Count ≤ 3), kein Flackern des Kopfes.
- Messung im Bericht: Vorher/Nachher `wc -l app/**/*.js`, `innerHTML =` je Route, Playwright-Trace Ladezeit `#aufgaben`/`#finanzen`, Konsole leer auf sechs Routen.
- Login-Tests mit den Testkonten (037b), zwei Kontexte.

## Akzeptanzkriterien

- [x] Abweichungsliste vollständig (26.09. 01:02) – Klärungsschritt in `/auftrag` entfällt, sofern keine neue Unklarheit aus der Erkundung
- [ ] Test 8: Finanzen 1280 zeigt genau zwei `.btn-primary` (Sektionsköpfe Posten, Verträge – Verträge erst ab 031, bis dahin einer), Ausgleich keinen; Liste+Panel-Seiten genau einen (im Panel)
- [ ] Acht Tests grün; Reviewer ohne Lücken; Messwerte im Bericht, keiner schlechter als vorher
- [ ] Merge preview, `/release 2.3.0`; Changelog: „Eine Navigation, zwei Seitentypen – alle Ansichten folgen demselben Aufbau; am Handy Tab-Leiste unten."
- [ ] Nutzertest mit Anna am nächsten Wochencheck, Ergebnis als Kommentar in `038-abweichungen.md`
- [ ] Bericht mit Run-Nummer, Live-Version beider Pfade, Ist-Laufzeit

## 038b – Komponenten-Konsolidierung (Teil 2, eigener Auftrag)

Nach 038 live: eine Tabellen-Funktion (Spaltenkonfiguration, `colgroup`-Prozente, Leiter, Chips) ersetzt neun; ein Leerzustand (Text + Richtung) ersetzt dreizehn; eine Editor-Hülle (≤ 720, Kopf Abbrechen/Fertig, Segmente, Fußzeile Löschen) ersetzt zwei. Aufwand M, Release 2.3.1, eigene DoR-Fragen vor dem Schreiben.
