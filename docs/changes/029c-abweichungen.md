# 029c – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `feat/029c` → `preview` · Aufwand S · Tests: `scen029c` (14/14 grün,
380/1280/1800 px), Kontrastmatrix in `029c-kontrast.md`. Regression 016–026 gegenüber dem Stand
nach 030 verglichen.

## Entscheidungen im Zweifel

1. **„--mark-ink" (Punkt 1).** Im Code heißt der Token weiter `--mark-deep` (CLAUDE.md nennt ihn
   so; eine Umbenennung war nicht freigegeben) – nur der Wert wurde gedunkelt. In der Matrix als
   „`--mark-deep` (im Auftragstext „--mark-ink" genannt)" geführt.
2. **Punkt 6, „▪" statt Chevron.** Im Code stand längst kein „▪" mehr (029b hat die Beratung schon
   auf `▸/▾` umgestellt) – nichts zu ändern, per Grep bestätigt. Die beiden anderen Teile
   (Kommentar-Autor als Chip, „▸ N erledigt" ohne „zeigen") sind umgesetzt.
3. **Punkt 9 (Δ-Vorzeichen)** war durch 014d schon korrekt („−170 €" etc., geprüft) – keine
   Änderung nötig, nur bestätigt.
4. **Ripple-Effekt von Punkt 11:** Der Wegfall des 720-px-Deckels lässt die Timeline-Liste breiter
   umbrechen; zwei ältere, breitenabhängige Prüfwerte aus 014/019c verschieben sich dadurch um 1–2 px
   („wartet auf"-Abstand 8→9 px, Zeilenhöhe 59→57 px). Kein neuer Fehler, sondern die unmittelbare,
   beabsichtigte Folge der breiteren Liste – in der Regression entsprechend eingeordnet.

## Regression

016–026 gegenüber dem Stand nach 030 verglichen: keine neue, unerklärte Abweichung. `scen019c`s
„Liste ≤ 720 px" schlägt jetzt bewusst fehl (858 px) – exakt das Ziel von Punkt 11.

## Nachtrag 24.09. 11:07 – Punkt 8 ersetzt

Die erste Fassung von Punkt 8 (`width: 1%` auf den schmalen Spalten) hat die Spalten „Stand",
„fällig" und „zahlt" im echten Fenster kollabieren lassen (Screenshot 11:07) – `width: 1%` ist nur
eine Mindestbreite, kein Zielwert, und `table-layout: fixed` verteilt den Rest anders als gedacht.
Ersetzt durch feste Prozente über ein `<colgroup>` (Posten 35 % · Stand 10 % · fällig 10 % ·
zahlt 15 % · Betrag 15 % · Aktion 15 %), die Aktionsspalte bleibt jetzt immer stehen (auch leer),
damit kein Spaltensprung mehr auftritt. Zwischen 900 und 1099 px zeigt die Stand-Leiter nur die
Kreise, das Wort steckt als `title`-Tooltip auf der Leiter selbst (`ladderHTML`, jetzt überall,
nicht nur in der Tabelle – harmlos, war vorher nirgends ein Tooltip). Eigener Test: `scen029d`
(6/6 grün), plus `scen029c` erneut komplett gegengeprüft (13/14 – die eine bekannte Abweichung ist
014e-bedingt, siehe oben).
