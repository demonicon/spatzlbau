# 034 – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `fix/034-zeitzone-nachlauf` → `preview` · Aufwand S
Tests: `test034_today.mjs` (4/4 grün, reines Node, Europe/Berlin) und `test034.mjs` (4/4 grün,
Browser ohne Datenbank). Regression `scen014e.mjs` erneut gegen den neuen Stand gelaufen (10/10
grün).

## Ursprung

`014e-abweichungen.md` fand den Fehler zuerst (Gate-Datum in `groups.js`) und behob ihn dort
sowie in `state.js`/`finanzen.js`, listete aber vier weitere Fundstellen mit demselben Muster als
„außerhalb dieses Auftrags". Dieser Auftrag behebt genau diese vier Stellen – plus zwei weitere im
selben main.js-Aufruf (Ausgleichszahlung, Erhalten-Dialog), die dasselbe Muster tragen und beim
Durchsuchen auffielen.

## Entscheidungen im Zweifel

1. **Kein gemeinsamer Helfer über Dateigrenzen.** `groups.js`, `state.js`, `dashboard.js` und
   `finanzen.js` haben aus 014e bereits je einen eigenen kleinen `localISO`/Inline-Ausdruck – kein
   Modul exportiert das bisher. Diese Änderung folgt derselben Konvention (ein kleiner Ausdruck je
   Stelle) statt eine neue gemeinsame Utility einzuführen, die nichts an diesem Auftrag hängt.
2. **`main.js` bekommt einen lokalen `todayISO()`-Helfer**, weil dort vier Stellen exakt dasselbe
   `new Date().toISOString().slice(0, 10)` für „heute" verwendeten – hier lohnt sich der eine
   Helfer innerhalb der Datei.
3. **Zwei Prüfarten, weil die zwei betroffenen Fehlerformen unterschiedlich sind:** Eine
   Konstruktion bei lokaler Mitternacht (`new Date(base + 'T00:00:00')`, `dueInfo().sort`) ist
   *immer* falsch – unabhängig von der echten Uhrzeit beim Testlauf –, deshalb genügt dafür ein
   Test mit festen Beispieldaten (`test034.mjs`). „Heute" über `new Date()` ohne Argument ist nur
   nahe Mitternacht sichtbar falsch; dafür prüft `test034_today.mjs` die exakte Formel aus
   `main.js`/`detail.js` gegen einen konstruierten Zeitpunkt kurz nach lokaler Mitternacht, statt
   auf eine zufällig passende Testlaufzeit zu hoffen.
4. **Keine Migration, kein Sebastian-Schritt.** Reine Frontend-Berechnung, keine Datenbank
   beteiligt.

## Was geprüft wurde

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Grep: kein `toISOString().slice(0, 10)` mehr in `app/` | 0 Treffer |
| 2 | `todayISO()`/`today()`: alte Formel bei 01:30 lokal zeigt Vortag (Kontrolle) | 2026-09-25 |
| 3 | `todayISO()`/`today()`: neue Formel zeigt den richtigen Tag | 2026-09-26 |
| 4 | Lokale Mitternacht (`dueInfo`/`changeLine`-Konstruktion): neue Formel richtig | 2026-10-12 |
| 5 | `costSetHTML` Fällig-am: Umzugsfirma (Offset −77 auf 15.01.2027) | 2026-10-30 (nicht 10-29) |
| 6 | `changeLine`: Halteverbot −20 → −27 auf 15.01.2027 | „26.12. → 19.12." (nicht 25./18.12.) |
| 7 | `costAdvanceHTML` am-Datum: heutiges lokales Datum | 2026-09-24 |
| 8 | Keine Konsolenfehler, keine Datenbank-Aufrufe | – |
| 9 | Regression `scen014e.mjs` (Dashboard/Detail, 380/1280/1920 px) | 10/10 grün |
