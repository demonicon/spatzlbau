# 021 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/021-phasen` → `preview` · Aufwand M (zwei Breiten)
Migration `013_a021_seen_gates.sql` – **nicht eingespielt**

## Entscheidungen im Zweifel

1. **Der Streifen ersetzt die Prozentzahl und die Phasenpillen.** Beides stand vorher im Kopf und
   sagte dasselbe zweimal. Übrig bleibt eine Zeile aus fünf Segmenten; der Gate-Satz der
   gewählten Phase steht als eine Zeile darunter, damit er nicht verloren geht.
2. **Schmale Segmente kürzen mit „…", nicht auf zwei Buchstaben.** Der Auftrag schlägt „Nummer +
   erste zwei Buchstaben unter 60 px" vor. Die Breite steht erst im Browser fest; eine
   Auslassung ist ehrlicher als ein abgeschnittenes Wort, das aussieht wie ein Wort („1 Fin…"
   statt „1 Fi"). Ab 600 px ist jedes Segment mindestens so breit wie sein Name.
3. **Breiten kommen über CSSOM, nicht über `style=`.** Die Inhaltssicherheitsregel aus 008
   verbietet Stilattribute; `render()` setzt `flex-grow` je Segment, genau wie bisher die
   Füllung der Balken.
4. **Der Timeline-Phasenfilter entfällt zugunsten des Streifens.** 019 hatte eigene
   Phasenpillen; der Auftrag verlangt einen gemeinsamen Filterzustand. Der Personenfilter der
   Timeline bleibt, er hat im Streifen keine Entsprechung.
5. **Der Gate-Moment kommt aus zwei Anlässen, nie aus Realtime.** Nach dem eigenen Häkchen
   (sofort) und beim nächsten Öffnen der App (für die andere Person). Ein Realtime-Ereignis
   öffnet ihn nie – es könnte mitten in einer Eingabe kommen.
6. **Die dritte Zahl fällt weg, wenn es sie nicht gibt.** Aufgaben immer, Tage nur mit Terminen,
   bezahlte Kosten nur, wenn in der Phase wirklich etwas bezahlt wurde. Eine Kachel „0 €" wäre
   eine Aussage, die niemand gemacht hat.
7. **„Tage" ist die Spanne der Phase, nicht ihre Dauer.** Vom frühesten bis zum spätesten
   Termin der Phase, mindestens 1 – die einzige Zahl, die ohne ein Startdatum je Phase
   überhaupt ehrlich ist.
8. **Ohne Migration 013 erscheint der Moment einmal pro Sitzung.** Die Spalte fehlt, also wird
   nichts geschrieben (`state.gatesReady`); nach einem Neuladen käme er wieder. Das ist der
   harmloseste Ausfall und verhindert, dass ein fehlgeschlagener Schreibversuch die App stört.

## Offene Punkte

- **Migration 013 ist nicht eingespielt.** Bis dahin merkt sich die App den gesehenen
  Gate-Moment nur für die laufende Sitzung. Alles andere am Streifen funktioniert ohne sie.
- **Rollback-Prüfung der Migration steht aus** (braucht die Datenbank, siehe 016).

## Was geprüft wurde (20 von 20 grün, zwei Breiten)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Fünf Segmente, Breiten summieren auf die volle Zeile | 346 von 346 |
| 2 | Keines unter 44 px auf 380 px | min 48 px |
| 3 | Breite nach Aufgabenzahl, Füllung nach Fortschritt | 48/68/107/56/52 |
| 4 | Kurznamen statt Prozentzahl | „1 Finden & Zusagen" … |
| 5 | Phasen-Tabs weg, laufende Phase hervorgehoben | 0 Tabs, 1 current |
| 6 | Tipp auf Phase 3 filtert die Liste | nur Phase-3-Aufgaben |
| 7 | Der Gate-Satz der Phase steht darunter | „Gate: Firma gebucht, Halteverbot …" |
| 8 | Die Timeline nutzt denselben Filter | 24 Zeilen, alle Phase 3, keine eigenen Pillen |
| 9 | Zweiter Tipp hebt den Filter auf | – |
| 10 | Das letzte Häkchen bringt den Gate-Moment | „Phase 1 geschafft" |
| 11 | Gate-Text, drei Zahlen, „Als Nächstes" | 9 Aufgaben · 16 Tage · 2.400 € |
| 12 | Genau ein Primär („Weiter"), keine Animation > 200 ms, kein Rot | – |
| 13 | „Weiter" schließt und schreibt `seen_gates` | `from:allowlist, update` |
| 14 | Derselben Person wird er nicht wieder gezeigt | – |
| 15 | Die andere Person sieht ihn beim nächsten Öffnen einmal | – |
| 16 | Ohne Migration 013: kein Schreibversuch, kein Fehler | – |
| 17 | 020: Schaltflächen 40 px | – |
| 18 | Streifensegmente ≥ 44 px hoch (Tipp-Fläche) | 44 px |
| 19 | 380 px: kein waagrechtes Scrollen | – |
| 20 | 1280 px: alle fünf Kurznamen ungekürzt | – |
