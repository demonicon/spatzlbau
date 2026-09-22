# Tokens – Ist-Stand der Live-App

Quelle: `app.css` (Stand 22.09.2026, Build `b815103`). Die Werte stammen aus dem Handoff vom 13.09.;
`--ink-3` wurde in Auftrag 008b auf Kontrast ≥ 4,5:1 korrigiert.

Regeln, die über den reinen Wert hinaus gelten:

- Text nur mit Tokens, die auf `--paper` **und** Weiß mindestens 4,5:1 erreichen.
- **Highlighter-Gelb (`--mark`) ausschließlich für Fristkritisches**, Rot (`--danger`) ausschließlich für Überfälliges und Fehler. Ist eine Aufgabe beides, gewinnt Rot.
- Owner-Farben sind semantisch (Sebastian blau, Anna pflaume, gemeinsam grün, Claude ocker) und erscheinen nur als Chip- oder Kachelfläche, nie als farbiger Text auf farbigem Grund.
- Eckige Kanten überall außer den Ausnahmen bei `--r-tag` und `--r-pill`.

## Flächen & Linien

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--bg` | `#e9ebe6` | Seitenhintergrund außerhalb der Spalte (nur am Desktop sichtbar) | `html, body` |
| `--paper` | `#f4f6f2` | Hintergrund der App-Spalte und des Seitenpanels | `.wrap`, `.card input`, `.panel` |
| `--card` | `#ffffff` | Karten, Kacheln, Eingabefelder, markierte Zeile | `.card`, `.date-edit input[type=date]`, `.kpi-top`, `.tile`, `.task .check::before` … (13 gesamt) |
| `--line` | `#d9ded8` | alle Trennlinien und Rahmen, Rasterfugen der Kacheln, ungefüllter Gate-Balken | `.wrap`, `.card`, `.card input`, `.date-edit input[type=date]`, `.gate .bar` … (22 gesamt) |
| `--line-dash` | `#b8bfb9` | gestrichelter Rahmen „Neue Aufgabe“ | `.addbox` |

## Text

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--ink` | `#1e2b24` | Fließtext, Zahlen, aktiver Tab, Primärbutton, gefüllter Gate-Balken, Filter-Chip | `html, body`, `.status .up`, `.gate[aria-pressed=true]`, `.gate.current .lbl, .gate[aria-pressed=true] .lbl`, `.gate .bar i` … (17 gesamt) |
| `--ink-2` | `#4e5b54` | Beschriftungen, Meta-Zeile, inaktive Tabs, Gate-Text | `.hint`, `.link`, `.screen`, `.card label`, `.msg` … (19 gesamt) |
| `--ink-3` | `#68726b` | leise Zusätze: Zähler, Zeitstempel, Platzhalter, erledigte/blockierte Titel, Panel-Platzhalter | `.pct`, `.status`, `.gate .lbl`, `.gate .lbl span`, `.tile .l span` … (24 gesamt) |

## Personen

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--seb` | `#2e5a9c` | Sebastian: Text im Owner-Chip, Fokusring, „Neu“-Punkt | `:focus-visible`, `.who.S`, `.owner.S`, `.own.S`, `.foot .version .dot` |
| `--seb-bg` | `#e4ecf7` | Sebastian: Fläche von Chip, Kachel, Person-Pille | `.who.S`, `.owner.S`, `.own.S` |
| `--anna` | `#9a3d64` | Anna: Text im Owner-Chip | `.who.A`, `.owner.A`, `.own.A` |
| `--anna-bg` | `#f6e4ec` | Anna: Fläche von Chip und Kachel | `.who.A`, `.owner.A`, `.own.A` |
| `--both` | `#2f6f4e` | gemeinsam: Text im Owner-Chip | `.owner.B`, `.own.B`, `.check-label input` |
| `--both-bg` | `#e1efe6` | gemeinsam: Fläche von Chip und Kachel | `.owner.B`, `.own.B` |

## Claude

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--claude` | `#6b4e16` | Delegation: Überschrift, Labels, aktueller Zustandsbalken, Claude-Button | `.own.C`, `.tag.claude`, `.btn.claude`, `.brief label`, `.brief .turn` … (7 gesamt) |
| `--claude-bg` | `#f3e9d2` | Delegation: Briefing-Block, Claude-Tag, Kommentar von Claude | `.own.C`, `.tag.claude`, `.com.C`, `.brief`, `.confirm.block` |
| `--claude-past` | `#c9b98a` | Delegation: bereits durchlaufene Zustände im Balken | `.steps li.past i` |

## Signale

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--mark` | `#f7de4a` | Highlighter-Gelb, ausschließlich fristkritisch (Kachelzahl, Fälligkeit in der Zeile) | `.tile.critical:not(.zero) .n span`, `.due.crit` |
| `--mark-deep` | `#8a7300` | derzeit ungenutzt – seit 008b für Text gesperrt (3,4:1 auf Gelb) | – (ungenutzt) |
| `--danger` | `#b33a2e` | überfällig (Kachelzahl, Fälligkeit), Fehlermeldungen, Löschen | `.msg.err`, `.status.err`, `.tile.late:not(.zero) .n`, `.due.late`, `.btn.danger` |
| `--danger-bg` | `#f8e3e0` | Fläche der Inline-Bestätigung beim Löschen, „wartet auf“ in der Akte | `.confirm` |
| `--ok` | `#2f6f4e` | erledigt: Häkchenfläche, vollständige Phase im Gate-Balken | `.gate.complete .bar i`, `.task .check:checked::before`, `.sub input[type=checkbox]` |

## Schriftgrößen

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--fs-hero` | `60px` | Countdown-Zahl | `.hero .n` |
| `--fs-kpi` | `28px` | Zahl der Kachel „Offen“ (Handy/Tablet) | `.kpi-open .n` |
| `--fs-tile` | `24px` | Zahlen der übrigen Kacheln | `.tile .n`, `.kpi-open .n`, `.owner b` |
| `--fs-title` | `22px` | derzeit ungenutzt (war der Akte-Titel im Entwurf) | – (ungenutzt) |
| `--fs-body` | `16px` | Grundgröße, Aufgabentitel in der Liste | `html, body`, `.task .t` |
| `--fs-ui` | `15px` | Bedienelemente, Teilschritte, Kommentare, Beratungstexte | `.who .initial`, `.tabs [role=tab]`, `.empty`, `.detail textarea`, `.btn` … (12 gesamt) |
| `--fs-meta` | `14px` | Buttons, Fußzeile, Chips | `.link`, `.card label`, `.msg`, `.who`, `.btn.small` … (9 gesamt) |
| `--fs-small` | `13px` | Gate-Text, Filterzähler, Labels im Briefing | `.hint`, `.owner`, `.gate-text`, `.filter-chip`, `.filter-count` … (10 gesamt) |
| `--fs-micro` | `12px` | Kachel-Beschriftung, Tab-Zähler, Abschnittsüberschriften, Statuszeile | `.eyebrow`, `.pct`, `.status`, `.status .up`, `.gate .lbl` … (16 gesamt) |
| `--fs-nano` | `11px` | „Neu“-Punkt, Zustandsbalken der Delegation | `.steps li span`, `.foot .version .dot` |

## Maße & Form

| Token | Wert | Verwendung | Regeln in `app.css` |
|---|---|---|---|
| `--gutter` | `16px` | seitlicher Rand der Spalte und aller Abschnitte | `.top`, `.screen`, `.card`, `.dash-head`, `.gates` … (15 gesamt) |
| `--gap` | `8px` | Standardabstand zwischen Bedienelementen | `.card .pw`, `.eyebrow-row`, `.who-row`, `.who`, `.date-edit` … (10 gesamt) |
| `--tap` | `44px` | Mindesthöhe jedes Tap-Ziels | `.link`, `.card input`, `.eyebrow`, `.who`, `.date-edit input[type=date]` … (18 gesamt) |
| `--r-tag` | `4px` | Radius von Owner-Chip und Status-Tag – sonst sind alle Kanten eckig | `.owner`, `.own`, `.tag` |
| `--r-pill` | `999px` | Radius von Person-Pille, Filter-Chip, „Neu“-Punkt, Abhängigkeits-Chip | `.who`, `.who .initial`, `.filter-chip`, `.chip`, `.foot .version .dot` |
| `--col-max` | `440px` | Breite der Handy-Spalte (ab 600 px 760 px, ab 900 px 1280 px) | `.wrap` |
| `--font` | `"Instrument Sans", "Avenir Next", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | eine Familie für alles; Instrument Sans nur, falls lokal vorhanden, sonst Systemstack | `html, body` |

## Kontrast (gemessen)

| Vordergrund | auf `--paper` #f4f6f2 | auf `--card` #ffffff |
|---|---|---|
| `--ink` #1e2b24 | 13.54 | 14.72 |
| `--ink-2` #4e5b54 | 6.55 | 7.12 |
| `--ink-3` #68726b | 4.59 | 4.99 |
| `--danger` #b33a2e | 5.42 | 5.90 |

| Owner-Chip | Kontrast |
|---|---|
| `--seb` auf `--seb-bg` | 5.77 |
| `--anna` auf `--anna-bg` | 5.34 |
| `--both` auf `--both-bg` | 5.05 |
| `--claude` auf `--claude-bg` | 6.38 |
| `--ink` auf `--mark` (fristkritisch) | 10.87 |
| `--mark-deep` auf `--mark` | 3.42 – **unter 4,5, deshalb für Text gesperrt** |

## Breiten

| Bereich | Spalte | Layout |
|---|---|---|
| ≤ 599 px | 440 px | eine Spalte, Akte inline unter der Aufgabe, Kacheln 2-spaltig (Offen-Zeile mit Owner-Chips) |
| 600–899 px | 760 px | eine Spalte, Countdown + Gate-Leiste nebeneinander, Kacheln 3-spaltig, fünf Tabs ohne Scrollen |
| ≥ 900 px | 1280 px | Liste 1.4fr + Panel 340–440 px (immer sichtbar), Kacheln 5-spaltig in zwei Reihen, Beratung aufgeklappt |
