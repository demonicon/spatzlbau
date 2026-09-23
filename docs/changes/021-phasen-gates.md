# 021 – Phasenstreifen und Gate-Moment

Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: M
Quelle: Funktionsideen Teil E, 4o und 4p (Mockups auf der Ideen-Seite). Setzt 020 und 019 voraus.

## Phasenstreifen (4o)

- Im Kopf unter dem Countdown: fünf beschriftete Segmente statt Prozentzahl. Breite ∝ Aufgabenzahl der Phase (Minimum 44 px), Füllung = Anteil erledigt, Kurzname aus `settings.phases[].short` (mobil nur Nummer + erste zwei Buchstaben, wenn < 60 px).
- Laufende Phase hervorgehoben (Tintenrand), abgeschlossene gefüllt, Gate-◆ am Segmentende.
- Tipp auf ein Segment = Phasenfilter (ersetzt die Phasen-Tabs); zweiter Tipp hebt auf. Timeline (019) nutzt denselben Filterzustand.
- Kein neuer Datenbedarf.

## Gate-Moment (4p)

- Beim letzten Häkchen einer Phase (alle Aufgaben der Phase erledigt, inkl. der des anderen): ganzseitige, ruhige Bestätigung – Phase, Gate-Text, drei Zahlen (Aufgaben, Tage, ggf. bezahlte Kosten), "Als Nächstes: Phase n+1 – erster Gate-Satz", Primär **Weiter**.
- Pro Person einmal: `allowlist.seen_gates jsonb default '[]'`. Löst nur beim eigenen Häkchen oder beim nächsten Öffnen aus, nie über Realtime mitten in einer Eingabe.
- Kein Konfetti, keine Animation über 200 ms, Farben nach Regel.

## Daten

Migration `NNN_a021_seen_gates.sql`: `allowlist.seen_gates`. Additiv.

## Akzeptanzkriterien

- [ ] Segmentbreiten summieren auf 100 %, keines unter 44 px auf 380 px
- [ ] Tipp auf Phase 3 filtert Liste und Timeline, Tipp erneut hebt auf
- [ ] Letztes Häkchen Phase 1 → Gate-Moment, Weiter → nie wieder für diese Person; andere Person sieht ihn beim nächsten Öffnen einmal
- [ ] Zwei Breiten, Bericht ≤ 15 Zeilen, Changelog: "Die Phasen stehen als Streifen im Kopf; ein Gate wird gefeiert, einmal."
