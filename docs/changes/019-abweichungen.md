# 019 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/019-timeline` → `preview` · Aufwand M (zwei Breiten) · **keine Migration**

## Entscheidungen im Zweifel

1. **Nur 3b, wie im Auftrag vorgeschlagen.** Die Bahnen-Ansicht 3a bleibt draußen (019b).
2. **Die dritte Pille braucht eine zweite Ansicht.** Der Auftrag nennt „Pillen Personen · Phasen ·
   Timeline"; eine Phasen-Ansicht gab es noch nicht – die Phasenpillen waren ein Filter. „Phasen"
   ist darum dieselbe Spaltenliste wie „Personen", nur nach Phase geschnitten statt nach Person.
   Das kostet fünf Zeilen Code und macht die Pillenreihe wahr, statt eine Pille ins Leere zeigen
   zu lassen.
3. **Die Reihenfolge der Aufträge ist die beauftragte, nicht die im Auftragsfuß vorgeschlagene.**
   018 lief vor 019; die gemeinsame Zeitgruppen-Funktion steht deshalb in `app/groups.js` (018)
   und nicht hier. Die Timeline braucht sie nicht: sie gruppiert nach Monaten, nicht nach
   „Diese Woche / Bis Gate / Später" – das ist die Gliederung der Spaltenansicht.
4. **Die Zeitachse ist die Liste, nicht ein Maßstab.** Zwischen zwei Terminen mit vier Wochen
   Abstand ist derselbe Zeilenabstand wie zwischen zweien am selben Tag. Ein echter Maßstab
   hieße leere Flächen am Handy; die Schienen zeigen die Parallelität, der Monatskopf den
   Sprung.
5. **Das Gate steht als eigene Zeile unter der letzten Aufgabe seiner Phase**, mit dem Gate-Text
   aus `settings.phases` im Klartext. Ein Tooltip allein wäre am Handy unerreichbar (dieselbe
   Entscheidung wie bei den Phasenbalken in 015, Punkt 6).
6. **Die T-Angabe bezieht sich immer auf den Einzug**, auch bei Aufgaben mit Umzugstag-Anker –
   so verlangt es der Auftrag. Damit die Zeile trotzdem erklärt, warum ihr Datum abweicht, steht
   bei ihnen „Sa · Umzug" statt nur „Sa".
7. **Die Zeile trägt die Zuständigkeits-Pille und daneben die leise Zeile ohne Namen.**
   `quietHTML` aus 020 nennt sonst den Namen als erstes; in der Timeline stünde er zweimal.
   Die Funktion hat dafür einen Schalter bekommen, die Aufgabenliste ändert sich nicht.
8. **Erledigte Aufgaben sind eine Liste am Ende, kein Filter.** „n erledigte zeigen" klappt sie
   auf und wieder zu; sie behalten Datum und Titel, aber keine Schienen – sie sind vorbei.
9. **Keine eigene Desktop-Variante** (Auftrag). Die Liste wird breiter, das rechte Panel aus
   006/009 bleibt, wie in der Personen-Ansicht.

## Offene Punkte

- Keine. Migration: keine. 3a (Bahnen) bleibt für 019b offen.

## Was geprüft wurde (25 von 25 grün, zwei Breiten)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Drei Ansichten als Pillen, Timeline aktiv | Personen \| Phasen \| Timeline* |
| 2 | Die Liste hat eine Heute-Marke | – |
| 3 | Überfälliges steht darüber und ist rot | `rgb(179,58,46)` |
| 4 | Titel ungekürzt | „Wohnung Sebastian kündigen – Zugang bis Mo 5.10." |
| 5 | Monatsköpfe als Trenner | SEPTEMBER 2026 \| OKTOBER 2026 \| … |
| 6 | Ein Gate je Phase mit dem Gate-Text | „◆ Gate Phase 1 · Gate: Mietvertrag unterschrieben …" |
| 7 | Zuständigkeits-Pille an jeder Zeile | Sebastian \| gemeinsam \| Anna |
| 8 | Erledigte ausgeblendet, hinter einer Textzeile | „2 erledigte zeigen" |
| 9 | `packen` (Umzugstag-Anker) am 05.12., T−41 | – |
| 10 | `halteverbot` (Einzug-Anker) am 04.12., T−42 | – |
| 11 | Reihenfolge nach Kalenderdatum, nicht nach Offset | 04.12. vor 05.12. |
| 12 | Die Umzugstag-Zeile sagt „Umzug" | „Sa · Umzug" |
| 13 | Phasenfilter 3 zeigt nur Phase-3-Aufgaben | 24 Zeilen, alle Phase 3 |
| 14 | Schiene 3 durchgezogen, die anderen weg | r1=0, r2=0, r3=24 |
| 15 | Personenfilter zeigt nur die eigene Spalte | Sebastian |
| 16 | Abhaken in der Zeile: die Aufgabe verschwindet | 66 → 65 |
| 17 | Der Zähler im Text-Knopf steigt | 2 → 3 |
| 18 | Die Änderung geht in die Datenbank (Realtime-Quelle) | `from:tasks, update` |
| 19 | Erledigte zeigen und wieder ausblenden | – |
| 20 | Antippen öffnet die Akte in der Zeile (Ansehen, 017) | – |
| 21 | 380 px: Schaltflächen 40 px, kein Primär | – |
| 22 | 380 px: kein waagrechtes Scrollen | – |
| 23 | Rot nur an überfälligen Zeilen | beide Treffer in der überfälligen Zeile |
| 24 | 1280 px: dieselbe Liste mit rechtem Panel | 66 Zeilen |
| 25 | 1280 px: Schaltflächen 32 px, kein Scrollen | – |

Schaltflächen ohne Systemklasse in der Timeline: nur der Aufgabentitel (wie in der Aufgabenliste).
