# 034 – Bugfix: Zeitzonen-Fehler bei Datumsumrechnung (Nachlauf 014e)

**Status: umgesetzt** (Branch `fix/034-zeitzone-nachlauf` → `preview`, Abweichungen: `034-abweichungen.md`)

Stand: 24.09.2026 · Branch `fix/034-zeitzone-nachlauf` von `preview` · Modell: Sonnet · Aufwand: S

## Warum

`014e-abweichungen.md` fand den Fehler in `groups.js`, `state.js` und `finanzen.js` und behob ihn dort, listete aber vier weitere Fundstellen mit demselben Muster außerhalb des damaligen Auftrags: `new Date(...).toISOString().slice(0, 10)` rechnet auf UTC um. Östlich von UTC (Deutschland, UTC+1/+2) zeigt das nahe Mitternacht den **Vortag** statt des heutigen oder berechneten Tages. Das ist kein neues Verhalten, sondern eines, das vorher schon falsch war – ein Bugfix, keine Rückfrage nötig.

## Was sich ändert

Dieselbe Umrechnung wie in 014e (die lokalen Kalenderfelder des `Date`-Objekts direkt zusammensetzen, nicht über `toISOString()`), an allen vier gefundenen Stellen plus den zwei zusätzlichen im selben Aufruf:

- `app/main.js`: Vorbelegung „bezahlt am"/„erhalten am" mit heute (vier Stellen – Statuswechsel auf „bezahlt", Ausgleichszahlung, Zahl-Dialog, Erhalten-Dialog), neu über einen lokalen `todayISO()`-Helfer.
- `app/ui/detail.js`: der `today()`-Helfer (Kommentar-Datum) und `costSetHTML`s Vorbelegung „fällig am" (rechnete über `dueInfo(t).sort`, ein Zeitstempel bei lokaler Mitternacht).
- `app/views/dashboard.js`: `changeLine()`s `at()`-Closure – der Alt→Neu-Datumssatz in „Seit du zuletzt da warst" bei einer geänderten Frist.

Keine Datenbank-Änderung, keine Migration – reine Frontend-Berechnung.

## Was Sebastian tut

Nichts. Reiner Code-Fix ohne Setup-Schritt.

## Akzeptanzkriterien

- [x] Kein Vorkommen von `toISOString().slice(0, 10)` mehr in `app/` (Grep)
- [x] Test ohne Datenbank: alle sechs Stellen mit einer festen Systemzeit kurz nach Mitternacht in einer Zeitzone östlich von UTC geprüft – zeigen den korrekten Tag, nicht den Vortag
- [x] 380 px: Bezahlt-Dialog, Fällig-am-Vorbelegung, „Seit du zuletzt da warst" öffnen sich ohne Konsolenfehler
- [x] Bericht ≤ 10 Zeilen; Changelog-Eintrag als Nebenversion (Bugfix)

## Handy-Check

Auf `/preview/` bei Sebastian oder Anna: einen Posten auf „Bezahlt" setzen (Datum stimmt), eine Frist ändern und „Seit du zuletzt da warst" ansehen (Datum stimmt), bei einer Aufgabe „Betrag festlegen" öffnen (Fällig-Vorbelegung stimmt).
