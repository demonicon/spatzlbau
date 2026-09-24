# 014e – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `fix/014e` → `preview` · Aufwand S · Tests: `scen014e` (10/10 grün,
380/1280/1920 px). Regression 016–026 gegenüber dem Stand nach 029c verglichen.

## Ein echter Fund unterwegs: Zeitzonen-Fehler bei Datumsumrechnung

Bei Punkt 3 (Gate-Datum) lag die Ursache tiefer als ein zweiter Wert: `groups.js`s `fmt()` gab ein
`Date`-Objekt über `toISOString().slice(0, 10)` weiter – das rechnet auf UTC um und zeigt östlich
von UTC (Deutschland) an manchen Tagen den **Vortag**. `fmtDay()` selbst ist korrekt, bekam hier
nur die falsche Zeichenkette gereicht. Gefunden über den Test (Spalte „bis Sa 03.10.", Timeline
„04.10." – ein Tag Differenz), behoben durch dieselbe Umrechnung wie in `dashboard.js`s
`visitHTML()` (029b): die lokalen Kalenderfelder des Datums direkt zusammensetzen, nicht über UTC.

Zwei weitere Stellen mit demselben Muster gefunden und **mitbehoben**, weil sie derselbe Ursache
sind und aus dieser oder der letzten Sitzung stammen:
- `state.js` `dueLabel()` (029b) – das Fristdatum in der Akte selbst.
- `finanzen.js` `plausibilityHTML()` (030) – der „Kein Überlappungstag"-Vergleich.

**Nicht behoben, gefunden, außerhalb dieses Auftrags** (dasselbe Muster, aber älter als diese
Sitzung und in keinem der sechs Punkte genannt): `main.js` (Vorbelegung „bezahlt am"/„erhalten
am" mit heute), `app/ui/detail.js`s `today()` und `costSetHTML`s Fälligkeits-Vorbelegung,
`dashboard.js`s `changeLine()` (Frist-Änderungssatz in „Seit du zuletzt da warst"). Alle können in
Zeitzonen östlich von UTC nahe Mitternacht einen Tag zu früh zeigen – ein eigener kleiner Auftrag
wert.

## Entscheidungen im Zweifel

- **Punkt 6, „Panel zu".** Als „geschlossen" gilt: keine Aufgabe ausgewählt **und** nichts wartet
  zwischen den beiden („Zwischen euch ist nichts offen" – 030 #3). Timeline hat durch Punkt 5 fast
  immer eine Standardauswahl und ist von der Breitenrückgabe ausgenommen.
- **Punkt 5, ausgewählte Zeile nicht hervorgehoben.** Die Standardauswahl setzt `ui.expanded`
  bewusst nicht – sie öffnet das Panel, ohne eine Zeile in der Liste als „ausgewählt" zu markieren
  (kein Klick fand statt). Ein echter Klick markiert wie gewohnt.

## Regression

016–026 gegenüber dem Stand nach 029c verglichen. Alle neuen Abweichungen sind unmittelbare, so
beauftragte Folgen dieses Auftrags (kein „Später" mehr, altes Blockiert-Chip-Markup ersetzt,
Timeline-Vorauswahl) und treffen ältere Tests aus 014/018/019c/020/029c, die noch das alte
Verhalten voraussetzen – kein unbeabsichtigter Fund.
