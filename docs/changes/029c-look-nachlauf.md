# 029c – Look-Nachlauf: Kontrast, Hülle, Leiter, Tabelle

**Status: umgesetzt** (Abweichungen: `029c-abweichungen.md`, Kontrastmatrix: `029c-kontrast.md`)

Stand: 24.09.2026 · Release 2.1 · Branch: `feat/029c` von `preview` · Modell: Sonnet · Aufwand: S
Befund aus dem preview-Check nach dem Run 2.1 (drei Screens, 24.09. 10:06). Läuft vor 014e, weil 014e auf den Tokens aufsetzt.

## Änderungen

1. **Kontrast, vollständig.** Der 008b-Check hat nur die geänderten Tokens auf `--card` gemessen; Sekundärtext steht überwiegend auf `--paper`. Neu: Matrix **alle Text-Tokens × beide Gründe** (`--ink`, `--ink-2`, `--ink-3`, Personenfarben Sebastian/Anna/Gemeinsam/Claude, `--ok`, `--danger`, `--mark-ink` auf `--paper` und `--card`). Ziel ≥ 4.5:1 für Text ≤ 18 px, ≥ 3:1 für größeren. Fällt ein Paar durch, wird der **Text-Token** gedunkelt (nicht der Grund). Erwartet: `--ink-3` und die Personenfarben als Text. Die Matrix kommt als Tabelle in `docs/changes/029c-kontrast.md` (Token, Grund, Wert vorher, Wert nachher, Verhältnis).
2. **Personenfarben als Text oder Chip – eine Entscheidung.** Heute stehen sie überall als farbiger Text (Spaltenköpfe, Meta, Akte, „zahlt"). Soll: **Chip** (farbiger Grund aus der jeweiligen `-bg`, Text in der dunklen Personenfarbe, 20 px, Radius 4 px) in Spaltenköpfen, Akte-Meta und „zahlt"; **Text** nur in Meta-Zeilen der Listen (nach 014e dort nur noch in Phasen/Timeline). Beide aus denselben Klassen.
3. **Kopfzeile in die Hülle.** Der Header liegt im Grid der Content-Spalte (Aufgaben: Nav bei x ≈ 950 mit offenem Panel; Timeline: Nav bricht in Zeile 2 innerhalb der 720-px-Liste; Finanzen: rechts). Soll: Header als eigenes Element **über** dem Grid aus Liste + Panel, volle Breite bis `.wrap`, Nav und Avatar rechts – auf allen drei Ansichten identisch. Ein Screenshot-Overlay der drei Kopfzeilen bei 1800 px muss deckungsgleich sein.
4. **Phasenstreifen:** nur die laufende Phase trägt den Rahmen. Segment 3 hat heute einen zweiten (falls Hover: Hover-Stil entfernen, kein Rahmen bei Hover).
5. **Fristsignal einheitlich:** Datum gelb (Chip) in Spalten **und** Timeline; der Chip „kritisch" in der Timeline-Meta entfällt. Überfällig: Datum rot in beiden.
6. **Akte:** Akkordeon-Zeilen mit Chevron „▸/▾" statt „▪"; Kommentar-Autor „Claude" in der Claude-Farbe (Chip wie Punkt 2), Sebastian/Anna in ihrer Farbe; Erledigt-Block in Spalten als Aufklapper „▸ 2 erledigt" wie die anderen.
7. **Stand-Leiter sichtbar:** hohle Kreise mit 1 px Rand in `--ink-3` (heute unsichtbar, es bleibt „• geschätzt"). Leiter auch in „Als Nächstes zahlen" vor dem Wort (029b Punkt 14 war dort nicht umgesetzt).
8. **Postentabelle, Spaltenbreiten:** Posten `auto` (nimmt den Rest), Stand auf Inhalt (`width: 1%; white-space: nowrap`), fällig/zahlt auf Inhalt, Betrag rechtsbündig an der Tabellenkante. Die leere Aktionsspalte entfällt, wenn keine Zeile eine Aktion hat; sonst schmal ganz rechts.
9. **Δ-Spalte in „Laufend ab Januar":** Vorzeichen zeigen (`−225 €`), wie vor dem Run; „weniger/mehr" im Satz bleibt.
10. **Kacheln:** die vier Kennzahlen neben der Antwortzahl wieder als Karten (`--card`, Rand `--line`, Radius 8), Label in `--ink-2`. Kennzahl bleibt Filter.
11. **Timeline so breit wie die Aufgaben-Fläche.** Der 720-px-Deckel aus 019c entfällt. Die Timeline nutzt dasselbe Grid wie Personen/Phasen: Liste `1fr`, Panel rechts in derselben Breite und Position wie auf der Aufgaben-Seite. Damit gilt eine Grid-Definition für alle drei Ansichten; die Zeilen bleiben zweizeilig (Titel · Meta), nur die Titel werden seltener abgeschnitten. Datums-/Schienen-Spalte links behält ihre feste Breite.

## Akzeptanzkriterien

- [x] `029c-kontrast.md` mit vollständiger Matrix, kein Paar unter Ziel; `--paper` und Layout unverändert
- [x] Overlay der drei Kopfzeilen (1800 px) deckungsgleich; mit offenem Akte-Panel bleibt die Nav rechts
- [x] Grep: Personenfarbe als Text nur noch in Meta-Zeilen; Chips über eine Klasse
- [x] Stand-Leiter: drei Kreise in Tabelle, Als Nächstes, Akte; Screenshot 1280 zeigt ● ○ ○
- [x] Timeline: kein Chip „kritisch", Datum gelb; Spalten identisch
- [x] 1800 px: Timeline-Liste und Personen-Spaltenfläche haben dieselbe linke und rechte Kante, Panel deckungsgleich; Grep: eine Grid-Definition für die drei Ansichten
- [x] Screenshots 380/1280 (Aufgaben Personen, Timeline, Finanzen) in `design/snapshot/2026-09-24-nachlauf/`
- [x] Bericht ≤ 8 Zeilen, Changelog: Zeile im bestehenden Eintrag 2.1.0 ergänzen: „Lesbarer: dunklerer Nebentext, feste Kopfzeile."
