# 029 – Abweichungen (Umsetzung 23.09.2026)

Vorlage: `docs/changes/029-look-pass.md` · Vorlage sagt / App zeigt / Entscheidung

- **Puffer, Sekundär-Rahmen (Regel 4).** Vorlage: „Primär und Sekundär bekommen border-radius: var(--r-tag), heute sind sie eckig." App zeigt: `.btn-primary, .btn-secondary, .btn-text, .pill` hatten `border-radius: var(--r-tag)` schon als gemeinsame Regel (seit 020) – sie waren nie eckig. Entscheidung: nichts geändert außer dem Sekundär-Rahmen (`--line-dash` statt `--ink`), wie im zweiten Satz der Regel gefordert.
- **Suche, Höhe (Regel 5).** Vorlage: „dieselbe Höhe wie die Buttons" (40/32 px). App zeigt: `.search-row` hat kein Zusatz-Padding, das den Tap-Ziel-Verlust unter 44 px auf dem Handy auffangen würde – CLAUDE.md verlangt „Tap-Ziele ≥ 44 px" ohne Ausnahme. Entscheidung: Höhe bei `var(--tap)` (44 px) belassen, nur `background: var(--card)` und die Fokusfarbe umgestellt. Rückfrage an Sebastian, falls die Button-Höhe hier doch gewünscht ist (bräuchte zusätzliches Padding in der Zeile, also eine echte Layout-Änderung).
- **Finanzen-Blöcke (Regel 1).** Vorlage nennt „Finanzen-Kacheln und -Blöcke" pauschal. App zeigt: Kacheln = die vier Kennzahlen-Zellen (`.fin-break-row`, ≥ 900 px) – wurden Karten, wie die Dashboard-Kacheln (`.tile`). „Block" mit eigener Fläche gab es vorher nur bei `.fin-balance` (Ausgleich) – wurde Karte. Die übrigen Abschnitte (Als Nächstes zahlen, Monat für Monat, Laufende Kosten, Alle Posten, Rahmendaten) sitzen ohne eigenen Kartenrahmen im Grid; sie einzeln zu Karten zu machen hätte ihr Innenabstands- und Grid-Gap-Maß neu ausbalancieren müssen – mehr als der Look-Anteil dieses Aufwands (S–M) trägt. Entscheidung: bei `.fin-balance` und den beiden Kachel-Gittern belassen, Rest unverändert.
- **"Zwischen euch" (Regel 1).** Die Karte bekam zusätzlich `margin-top: 6px` (an `.detail`s eigenen Abstand zum Panel-Kopf angeglichen) – im Auftrag nicht einzeln benannt, aber nötig, damit die Karte nicht am Kopf der Spalte klebt.
- **Kacheln-/Personenspalten-Abstand.** Die alte Technik (1 px Spalt, Linienfarbe als „Rahmen") ist mit Karten nicht mehr möglich – Karten brauchen echten Abstand für den Schatten. `--gap`-Wert an drei Stellen erhöht: `.kpis` 1→6 px, `.fin-break` (≥ 900 px) 1→6 px, `.cols` (≥ 900 px) 1→16 px. Screenshots bei 900/1280 zeigen: Spaltenbreiten und Zeilenumbrüche bleiben gleich, nur der Zwischenraum ist sichtbar größer – dokumentiert, weil > 2 px.
- **`.task.selected` (nicht in der Vorlage, beim Testen gefunden).** Die Markierung eines ausgewählten Postens nutzte `background: var(--card)` gegen den alten `--paper`-Spaltengrund. Seit `.col` selbst `--card` ist, wäre sie unsichtbar geworden. Umgestellt auf `background: var(--paper)` – sichtbar wie vorher, kein AK betroffen.
- **`ownerOf`-Fallback „Puffer"/„ohne Aufgabe" in Finanzen** – aus Auftrag 014c, nicht 029, hier nicht angefasst.

## Bestehende Ausnahmen (AK2-Grep, vor 029 schon da, nicht Teil der sechs Regeln)

`#16211b` (`.btn-primary:hover`, dunklerer Ton), vier `rgba(...)`: `.on-ink .btn-secondary:hover`, `.pseg[aria-pressed] .s`, `.steps li i` (Fortschrittspunkte im Setup), `.overlay`-Abdunkelung. Keine davon von den sechs Regeln berührt; das Avatar-Menü ist die einzige Stelle, die 029 selbst bereinigt hat (`--sh-pop` statt der alten `rgba(0,0,0,.12)`-Zeile).

## Akzeptanzkriterien

1. [x] Commit 1 ändert nur die Zeilen 39–56 (`git show <sha1> -- app.css`), Commit 2 nur `app.css` (`git diff --stat`)
2. [x] Grep auf `#[0-9a-f]{6}` und `rgba(` außerhalb `:root`: fünf bestehende Ausnahmen (oben dokumentiert), keine neuen
3. [x] Kontraste ≥ 4,5:1 (008b-Check nach Commit 1: `--ink-2` 7,19–7,51:1, `--ink-3` 5,93–6,19:1 auf Papier/Karte; Tag-Text unverändert, da nur der Rand neu ist)
4. [x] Vorher/nachher-Screenshots bei 380/900/1280 für Aufgaben, Akte, Timeline, Finanzen – `design/snapshot/2026-09-23-look/screens/` (gitignored). Layout deckungsgleich bis auf die dokumentierten Gap-Änderungen
5. [x] Fokusring: `:focus-visible` global auf `--focus` (= `--ink`) umgestellt, mit Radius
6. [x] Grep `--danger`: dieselben Stellen wie vor 029, keine neuen
