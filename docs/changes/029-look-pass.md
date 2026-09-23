# 029 – Look-Pass „sauber" (aus Fluent übernommen, ohne Umbau)

Stand: 23.09.2026 · Ziel-Branch: `preview` · Status: umgesetzt · Aufwand: **S** (ein Commit für die Tokens, einer für die Regeln)
Ersetzt den bisherigen Entwurf „029 Fluent-Redesign". Die Aufträge 029a–e und der Spike 029s entfallen.
Vorlage: `design/handoff/2026-09-23-fluent/Fluent Look-Pass.html` (vorher/nachher, Bausteine)

## Ziel

Übernommen wird nur die Anmutung von Fluent 2: ruhige, neutrale Flächen, weiße Karten mit weichem Schatten, kleine Radien, feinere Linien und ein sichtbarer Fokus. Unverändert bleiben:

- Layout und Breakpoints (380 / 900 / 1100)
- Navigation
- Komponenten und Texte
- Personenfarben, Gelb für Fristen, die Rot-Regel
- Schrift (Instrument Sans) und Button-Höhen (40 / 32)

Keine neuen Ansichten, keine neuen Funktionen.

## Commit 1 – Token-Werte in `app.css` (Zeilen 39–56)

Die Namen bleiben, nur die Werte ändern sich. Neue Tokens kommen nur dazu, wo es heute keine gibt.

| Token | heute | neu | Wirkung |
|---|---|---|---|
| `--bg` | `#e9ebe6` | `#f3f3f3` | neutraler Fenstergrund statt Grüngrau |
| `--paper` | `#f4f6f2` | `#fafafa` | Arbeitsfläche |
| `--card` | `#ffffff` | `#ffffff` | unverändert |
| `--line` | `#d9ded8` | `#e0e0e0` | feinere Linien |
| `--line-dash` | `#b8bfb9` | `#c7c7c7` | |
| `--ink-2` | `#4e5b54` | `#4d5751` | minimal neutraler, Kontrast bleibt ≥ 7:1 |
| `--ink-3` | `#68726b` | `#616161` | Sekundärtext, ≥ 5.7:1 auf `#fafafa` |
| `--r-tag` | `4px` | `4px` | unverändert (Controls, Tags) |
| **neu** `--r-card` | – | `8px` | Karten, Panels, Menüs, Dialoge |
| **neu** `--sh-card` | – | `0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.14)` | Karten |
| **neu** `--sh-pop` | – | `0 0 8px rgba(0,0,0,.12), 0 16px 32px rgba(0,0,0,.14)` | Menüs, Overlay-Panel |
| **neu** `--divider` | – | `#f0f0f0` | Trennlinie innerhalb einer Karte |
| **neu** `--focus` | – | `var(--ink)` | Fokusring |

Unverändert bleiben `--ink`, alle Personenfarben, `--claude*`, `--mark`, `--danger*`, `--ok`, `--link` und die Schriftgrößen.

Vor dem Merge sind die Kontraste mit dem bestehenden 008b-Check nachzurechnen, vor allem `--ink-3` auf `--paper` und auf `--card`.

## Commit 2 – sechs Regeln

1. **Karten statt Flächen:**
   - Welche Container: Personenspalten (≥ 900), Akte-Panel und Overlay (017/019c), Finanzen-Kacheln und -Blöcke (016c), „Zwischen euch", Avatar-Menü.
   - Aussehen: `background: var(--card); border-radius: var(--r-card); box-shadow: var(--sh-card);` und kein Rahmen mehr.
   - Am Handy (< 900) bleiben Listen flach; nur Akte, Hinweisbänder und Kacheln werden Karten.
2. **Trennlinien innerhalb von Karten:** `var(--divider)` statt `var(--line)`. Abschnittsköpfe mit `1px solid var(--ink)` bleiben.
3. **Tags vereinheitlichen:** Betrifft `.tag`, `.sig-chip`, `.st-chip`, `.cost-badge`, `.own`, `.tl-sig`. Einheitlich `min-height: 20px`, `line-height: 18px`, `padding: 0 6px`, `border: 1px solid` (Randfarbe = Textfarbe bei 35 % Deckkraft über `color-mix`) und `border-radius: var(--r-tag)`. Die Farben bleiben, wie sie sind.
4. **Buttons:** Primär und Sekundär bekommen `border-radius: var(--r-tag)`, heute sind sie eckig. Sekundär: Rahmen `var(--line-dash)` statt `var(--ink)`, Text `var(--ink)`. Pillen (`.pill`, `.chip`) bleiben rund und nur für Auswahl. Text-Buttons bleiben unterstrichen.
5. **Eingabefelder** (Akte-Bearbeiten, Rahmendaten, Suche):
   - Grundform: `border: 1px solid var(--line); border-bottom-color: var(--ink-3); border-radius: var(--r-tag); background: var(--card)`.
   - Im Fokus: `border-bottom: 2px solid var(--focus)`.
   - Die Suche behält ihren Unterstrich, bekommt aber `var(--card)` als Grund und dieselbe Höhe wie die Buttons.
6. **Fokusring überall:** `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: var(--r-tag); }` auf Buttons, Zeilen, Karten, Segmenten und Tags. Heute ist er uneinheitlich.

Optional (nicht Teil der AK): `--sh-pop` für das Avatar-Menü (heute ist dort ein eigener Schatten in Zeile 799 fest eingetragen) und das Overlay-Panel 900–1179.

## Nicht im Umfang

Brand-Blau als Primärfarbe (die Primärfarbe bleibt `--ink`), die Fluent-Navigationsleiste, Dialoge statt Panels, die Bahnen-Timeline, Tag-Prioritäten (die Regel aus 020 gilt weiter), Einstellungen und Export.

## Akzeptanzkriterien

- [x] Commit 1 ändert nur die Zeilen 39–56 von `app.css` (Diff prüfen). Commit 2 fasst keine Datei außer `app.css` an.
- [x] Es gibt keine fest eingetragenen Farben, Radien oder Schatten außerhalb der Tokens (Grep auf `#[0-9a-f]{6}` und `rgba(` außerhalb von `:root`, bestehende Ausnahmen dokumentiert).
- [x] Kontraste nach dem 008b-Check bleiben bei mindestens 4.5:1 für allen Text, auch für Tag-Text auf Tag-Grund.
- [x] Vorher/nachher-Screenshots bei 380, 900 und 1280 von Aufgaben, Akte, Timeline und Finanzen – auf Ansage in `design/snapshot/2026-09-23-look/screens/` statt `docs/changes/029-screenshots/` (gitignored, echte Kommentare/Termine im Testdatensatz). Das Layout ist deckungsgleich, Abweichungen von mehr als 2 px werden begründet (029-abweichungen.md).
- [x] Jedes Bedienelement zeigt per Tastatur einen Fokusring.
- [x] Die Rot-Regel ist unverändert: Grep auf `--danger` ergibt nur die bisherigen Stellen.
