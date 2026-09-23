# 018 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/018-dashboard` → `preview` · Aufwand L (drei Breiten)
Migration `011_a018_task_changes.sql` – **nicht eingespielt**

## Entscheidungen im Zweifel

1. **Reihenfolge: 018 vor 019.** Der Auftrag nennt 019 als Voraussetzung, die beauftragte
   Reihenfolge stellt 018 davor. Die gemeinsame Zeitgruppen-Funktion entsteht deshalb hier, in
   `app/groups.js` („eine Funktion, zwei Verwender"); die Timeline übernimmt sie in 019,
   statt sie mitzubringen.
2. **Die drei Signale ersetzen die vier Kacheln aus 009 – die Filter bleiben.** Mockup 2a zeigt
   oben nur die drei Signale. Damit „fristkritisch / überfällig / blockiert / bei Claude" nicht
   unerreichbar werden, stehen sie als eine leise Pillenzeile darunter, und zwar nur die, die
   gerade etwas zählen. Die Geldzeile entfällt: Finanzen steht als Pille im Kopf.
3. **Die Phasenpillen bleiben vorerst.** §7 hält Platz für den Phasenstreifen aus 021; bis dahin
   wäre die Phasenauswahl sonst weg. Sie verschwinden mit 021.
4. **Der Umschalter ist der Spaltenkopf.** Am Handy stünde sonst zweimal dasselbe („Du · 14
   offen" und darunter „Ich (Sebastian) · 14 offen"). Der Kopf kommt zurück, sobald gesucht oder
   gefiltert wird – dann zeigt die Liste wieder alle drei Spalten.
5. **Beim Öffnen einer Aufgabe folgt der Umschalter.** Ein Signal, ein Link (`#task=…`) oder ein
   Suchtreffer kann in eine andere Spalte zeigen. `setExpanded` stellt darum die Spalte um, in
   der die Aufgabe liegt – sonst öffnete sich eine Akte, die man nicht sieht.
6. **Innerhalb einer Zeitgruppe gibt es keine „weitere n zeigen"-Grenze mehr.** Die acht Zeilen
   aus 013 waren die Bremse für eine sehr lange Spalte; jetzt bremst die Zeit: „Diese Woche" und
   „Bis Gate" sind von sich aus kurz, „Später" ist eingeklappt. Bei Suche oder Filter (eine
   flache Liste ohne Gruppen) gilt die Acht weiter.
7. **„Diese Woche" schließt Überfälliges ein.** Eine verstrichene Frist ist das Dringendste, was
   es gibt; eine eigene Gruppe „Überfällig" wäre eine vierte Überschrift für etwas, das die
   Zeile schon rot sagt.
8. **Die Umschalter-Segmente sind 52 px hoch, nicht 40.** Sie tragen zwei Zeilen (Name und
   Zähler) und sind Navigation, keine Aktion – wie die Zeilenknöpfe aus 020, die auch
   44 px hoch sein dürfen. Der 020-Test nimmt `.pseg` deshalb ausdrücklich aus.
9. **„Seit du zuletzt da warst" ist ohne Migration nicht leer, nur kürzer.** Kommentare und
   Erledigtes stehen schon heute im Datenbestand; nur die verschobenen Fristen brauchen
   `task_changes`. Ohne Migration 011 fehlen genau diese Zeilen, der Rest steht.
10. **Der Trigger schreibt als Eigentümer.** `log_task_change()` ist `security definer`, weil die
    beiden Personen nur lesen dürfen. Wer geändert hat, kommt aus `public.current_person()` –
    der Funktion, die schon für die RLS da ist.

## Offene Punkte

- **Migration 011 ist nicht eingespielt.** Bis dahin fehlen die Zeilen „Frist verschoben" in
  „Seit du zuletzt da warst"; alles andere auf dem Dashboard ist vollständig. Die App fragt die
  Tabelle einzeln ab und verträgt die Fehlermeldung.
- **Rollback-Prüfung der Migration steht aus** (braucht die Datenbank, siehe 016).
- **Anna entscheidet am 27.09. auf `/preview/`** – der Auftrag verbietet den Weg nach `main` bis
  dahin ausdrücklich.

## Was geprüft wurde (26 von 26 grün, drei Breiten)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | 380 px zeigt genau eine Spalte | „me" |
| 2 | Drei Segmente, genau eines aktiv | Du / Gemeinsam / Anna |
| 3 | Der Umschalter ersetzt den Spaltenkopf | 0 Köpfe |
| 4 | Wechsel ohne Reload | Spalte „you" |
| 5 | Zähler stimmt mit dem Spalteninhalt überein | gleich |
| 6 | Frist Sonntag → „Diese Woche" | – |
| 7 | Frist Montag → „Bis Gate 1" | – |
| 8 | Nach dem Gate → eingeklappt | „9 Aufgaben ab 01.12. zeigen" |
| 9 | Aufklappen zeigt die Gruppe „Später" | – |
| 10 | Signal ersetzt die Spalten durch eine Liste über alle Personen | „über alle Personen" |
| 11 | Zitat und „Antworten" an der Zeile | – |
| 12 | „Antworten" öffnet die Akte, Fokus im Kommentarfeld | `focus: com` |
| 13 | Die Zeile fasst zusammen, was passiert ist | „2 Fristen verschoben · 2 Kommentare" |
| 14 | Verschobene Fristen zuerst, altes → neues Datum | „25.12. → 18.12., Anna" |
| 15 | Kommentare und Erledigtes darunter | 4 Einträge |
| 16 | Ohne Migration 011: keine Fristzeilen, sonst alles da | 0 Fristzeilen, 3 Signale |
| 17 | 380 px: Schaltflächen 40 px | – |
| 18 | 380 px: höchstens ein Primär | „Hinzufügen" (Neue Aufgabe) |
| 19 | 380 px: kein waagrechtes Scrollen | – |
| 20 | Rot nur an überfälligen Zeilen | kein Rot außerhalb |
| 21 | 600 px: eine Spalte mit Umschalter, kein Scrollen | – |
| 22 | 1280 px: drei Spalten, kein Umschalter | me / B / you |
| 23 | 1280 px: Panel ohne Auswahl zeigt „Zwischen euch" | drei Blöcke |
| 24 | 1280 px: Schaltflächen 32 px | – |
| 25 | Mit Auswahl zeigt das Panel die Akte | – |
| 26 | „Erinnern" schreibt „Erinnerung: …" mit Autor | `author: S` |

Schaltflächen ohne Systemklasse (bewusste Ausnahmen): Phasenbalken, die Zusammenfassungszeile,
die Signal-Kacheln, der Aufgabentitel in der Zeile und das Info-Zeichen im Fuß.
