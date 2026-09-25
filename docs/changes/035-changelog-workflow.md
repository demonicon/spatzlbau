# 035 – Bugfix: Pages-Deploy schlug seit 034 fehl (ungültiges changelog.json)

**Status: umgesetzt** (Branch `fix/035` → `preview` → `main`, Abweichungen unten)

Stand: 25.09.2026 · Release 2.1/2.2 · Branch `fix/035` von `preview` · Modell: Sonnet · dringend

## Ursache

`changelog.json` hatte seit dem 034-Merge (Auftrag 034, Commit f191b2d) einen Satz mit geraden
statt typografischen Anführungszeichen mitten in einer „…"-Zeichenkette
(`„bezahlt am", …`) – gültiges JSON wurde daraus nicht mehr. Der Pages-Workflow baut bei jedem
Deploy `main` **und** `preview` zusammen und validiert beide `changelog.json`; seither schlug
jeder Lauf am Validate-Schritt fehl, unabhängig davon, welcher Branch gepusht hatte (Runs #106,
#109, #110). Auf `preview` bereits mit dem 032-Merge korrigiert (andere Zeile, da dort seither ein weiterer
Eintrag davorsteht), `main` hatte den Fehler noch.

## Fix

- `changelog.json` auf `main` korrigiert (kommt mit dem preview→main-Merge automatisch mit).
- Workflow-Schritt „Validate changelog.json" → „Validate JSON": parst jetzt jede `*.json` im
  Checkout (main und preview je einmal), bricht beim ersten Fehler mit Datei und Zeile ab
  (`::error file=…,line=…`), danach weiterhin die semantische Prüfung (erster Eintrag braucht
  `version`/`title`).
- CLAUDE.md ergänzt (freigegeben): „Vor jedem Commit: `node -e …`; der Workflow prüft es
  ebenfalls."

## Entscheidungen im Zweifel

Der Auftrag geht davon aus, dass der preview-Push allein grün werden kann, bevor main angefasst
wird. Das war nicht möglich: der Workflow baut und validiert bei **jedem** Lauf main und preview
zusammen, unabhängig vom auslösenden Branch – ein preview-Push allein kann also nie grün werden,
solange main kaputt ist. Der preview-Lauf (#111, Commit 4ac4291) wurde trotzdem gepusht und
beobachtet: er schlägt wie erwartet an „Validate JSON (main)" fehl (nicht an „… (preview)"), was
bestätigt, dass preview selbst sauber ist. Direkt danach main gemerged – das ist der einzige Weg,
beide Seiten tatsächlich grün zu bekommen, und deckt sich mit dem eigentlichen Ziel des Auftrags.

## Akzeptanzkriterien

- [x] `gh run view --log-failed` für #106/#109/#110 gelesen, Fehler benannt
- [x] Fix lokal reproduziert (derselbe Python-Befehl wie der Workflow, exit 0)
- [x] preview gepusht, Lauf beobachtet (schlägt wie erwartet an „Validate JSON (main)" fehl –
      main war zu dem Zeitpunkt noch nicht korrigiert, siehe Abweichungen)
- [x] main gemerged, Tag v2.2.0, Lauf grün, „Check that the site really serves this build"
      bestätigt main auf `4f210ef` und preview auf `4ac4291`
- [x] Vorbeugung (Validate-Schritt, CLAUDE.md-Zeile) im selben Commit
