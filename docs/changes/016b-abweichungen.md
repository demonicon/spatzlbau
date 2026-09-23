# 016b – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/016b-finanzen-einstieg` → `preview` · Aufwand M (zwei Breiten)
Migration `014_a016b_fin_setup.sql` – **nicht eingespielt**

## Entscheidungen im Zweifel

1. **Die vier Schritte einzeln aufrufbar: über die bestehenden Mechanismen, nicht über einen
   eigenen Wiedereinstieg.** „Rahmendaten über „ändern" (dieselben vier Schritte einzeln
   aufrufbar)" – Termine und Aufteilung stehen einzeln editierbar in der bestehenden
   Rahmendaten-„ändern"-Fläche (016 §8), Mieten in „Laufend" → „Bearbeiten" (016 §6), Kautionen
   als gewöhnliche Kostenzeilen über die neue Leiter. Kein zusätzlicher „Schritt n erneut öffnen"-
   Knopf, um nicht zwei Wege zum selben Feld zu bauen.
2. **„Haushaltskonto ja/nein" wird abgefragt, aber nicht gespeichert.** Die Tabelle in Teil 1
   nennt unter „Aufteilung … schreibt" nur `split_default_s`, `buffer_pct`,
   `fin_setup_done`. Haushaltskonto als dritter Zahler ist unabhängig davon **immer** unter
   „Wer hat bezahlt?" wählbar (Migration 014 gibt `costs.paid_by` den Wert `H`); die
   Ja/Nein-Frage im Assistenten ist reine Vorbereitung, keine Schalterzeile.
3. **Eingabefelder tragen keinen Tausenderpunkt.** „2.910" vorbelegt hieße einen Bruch mit jedem
   anderen Zahlenfeld der App (Kostenformular, Rahmendaten, Laufend) – die zeigen alle die
   rohe Zahl ohne Gruppierung. Die *Anzeige* (Antwortzahl, Zeilenbeträge) bleibt mit
   Tausenderpunkt über `eur`/`eurShort`.
4. **Vorbelegung „wo vorhanden" liest `state.recurring`/`state.costs` nach `seed_key`, nicht
   Literalwerte.** Die Zahlen aus dem Auftrag (1.150/700/200/150, 2.910/2.040) sind der
   Startwert nur, solange keine passende Zeile existiert; ist eine da, zeigt und aktualisiert der
   Assistent genau sie (kein zweiter, doppelter Datensatz).
5. **„Weiter" schreibt sofort, Schritt für Schritt.** Kein gesammelter Entwurf über alle vier
   Bildschirme – jeder Schritt speichert für sich, „Zurück" liest die (jetzt schon gespeicherten)
   Werte neu ein. Einfacher als ein Mehrschritt-Entwurf und mit derselben Nebenwirkung wie jedes
   andere Feld der App: einmal geschrieben, sofort sichtbar.
6. **Ersteinrichtung ersetzt die alte fünfstufige Kostenleiter komplett**, in der Akte genauso
   wie in Finanzen – `costFormHTML`/`costPayHTML`/der alte `costHTML` sind neu geschrieben
   (Bearbeiten-Modus im 017-Stil, geteilt zwischen Akte und Finanzen). Rückwärts geht nur über
   das Stand-Segment im Bearbeiten-Modus, nie über einen Zeilen-Button.
7. **„+ Posten" ist ein einziger Dialog, aus der Akte und aus Finanzen aufrufbar**, vorbelegt mit
   der Aufgabe, aus der er geöffnet wurde („keine Aufgabe" bleibt wählbar).
8. **Gefunden, nebenbei behoben (in Code, den dieser Auftrag ohnehin neu schreibt):** die alte
   `bal-save`/`cost-pay-save`-Fehlerbehandlung zeigte nach einem gescheiterten Schreibversuch
   kurz die passende Meldung und überschrieb sie sofort mit der allgemeinen „Nicht gespeichert" –
   ein erneutes `throw` nach dem eigenen Toast lief in denselben äußeren Catch. Die beiden neuen
   Stellen (`cost-pay-save`, `cost-done`) fangen jetzt lokal ab, ohne weiterzuwerfen. Die
   *alte* Stelle `bal-save` (016, außerhalb dieses Auftrags) hat denselben Fehler und bleibt
   unangetastet – als eigener Fund vermerkt (siehe unten).
9. **`.cost-quick`/Enter-Taste committen direkt, statt sich auf `blur()` zu verlassen.** Ein
   `blur()` löst nicht überall zuverlässig ein natives `change` aus, bevor der nächste Zustand
   gezeichnet wird; Enter ruft dieselbe Speicherfunktion jetzt selbst auf.
10. **`ui.costHint`/die „Geschätzt → Angebot → …"-Erklärzeile entfernt.** Sie beschrieb die alte
    fünfstufige Leiter, wurde seit der 017-Überarbeitung nirgends mehr gerendert und ist mit der
    neuen dreistufigen Leiter ohnehin falsch – toter Code neben dem Code, den dieser Auftrag
    ersetzt.

## Gefunden, nicht behoben (eigene Aufgabe vorgeschlagen)

- **`bal-save` (016) zeigt bei fehlender Migration die allgemeine Fehlermeldung statt der
  eigenen** – derselbe Musterfehler wie Punkt 8, aber außerhalb des 016b-Umfangs.
- **„Als Nächstes zahlen" und „Alle Posten" können dieselbe Kostenzeile gleichzeitig zeigen**
  (eine Zeile mit Fälligkeitsdatum landet in beiden Listen); ist bei einer der beiden Ansichten
  ein Formular offen, erscheint es einmal in jeder Kopie. Vor 016b unbemerkt, weil noch nichts
  automatisiert dagegen getestet hatte.

## Offene Punkte

- **Migration 014 ist nicht eingespielt.** Bis dahin lehnt die Datenbank `paid_by = 'H'`
  (Haushaltskonto) ab; „Bezahlt" mit Haushaltskonto meldet das freundlich („… braucht Migration
  014 – noch nicht eingespielt") und schreibt nichts. Alles andere – die Ersteinrichtung, die
  Leiter, Posten anlegen, Inline-Korrektur – läuft ohne die Migration.
- **Rollback-Prüfung der Migration steht aus** (braucht die Datenbank, siehe 016).

## Was geprüft wurde (31 von 31 grün, zwei Breiten)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Finanzen öffnet auf Schritt 1/4 (Termine), ein Primär, Text „Später" | – |
| 2 | Termine vorbelegt aus den Rahmendaten | 15.01.2027 |
| 3 | „Weiter" schreibt Schritt 1, zeigt Schritt 2 (Mieten), „Zurück" ab da da | – |
| 4 | Mieten vorbelegt aus vorhandenen `recurring`-Zeilen (kein Duplikat) | 780 / 150 |
| 5 | Schritt 3 (Kautionen) vorbelegt 2910 | – |
| 6 | Schritt 4 (Aufteilung), Primär heißt „Fertig" | – |
| 7 | Abschluss beendet den Assistenten, Antwortzahl steht | −2.181 € |
| 8 | „Später" zeigt die Ansicht mit Hinweiszeile, die zurückführt | – |
| 9 | Kein Stand-Dropdown in der App | 0 Treffer |
| 10 | Wörter faellig/angebot/beauftragt/einmalig in keinem Chip | 0 Treffer |
| 11 | „Betrag festlegen" öffnet Betrag + fällig am, speichert auf fest | – |
| 12 | „Bezahlt" fragt „Wer hat bezahlt?" (drei Optionen), Anna in zwei Tipps | – |
| 13 | „Erhalten" zeigt den erwarteten Betrag, Teilbetrag → Hinweis | „300 € einbehalten – prüfen" |
| 14 | Tipp auf die Zeile öffnet Bearbeiten-Modus (017-Stil) | 5 Felder, ein Primär |
| 15 | Stand als drei Segmente, auch rückwärts | geschätzt · fest · bezahlt |
| 16 | Geänderte Felder zählen in der Hinweiszeile | 1 ungespeicherte Änderung |
| 17 | Fertig speichert und aktualisiert die Zeile | 1.380 € |
| 18 | Betrag in der Zeile antippen öffnet ein Inline-Feld, Enter speichert | – |
| 19 | Ohne Migration 014: Haushaltskonto meldet sich freundlich, kein Absturz | – |
| 20 | „+ Posten" aus Finanzen: Was/Wieviel, legt geschätzte Zeile an | – |
| 21 | 380 px: kein waagrechtes Scrollen (auch im Bearbeiten-Modus) | – |
| 22 | 1280 px: Ersteinrichtung und Leiter gleich, kein Scrollen | – |

Regression: `016`, `017`, `018`, `019`, `020`, `021`, `022` erneut gelaufen – 124 von 125 Prüfungen
weiter grün; die eine erwartete Abweichung ist 016s alter Test auf „Angebot eintragen", den dieser
Auftrag genau ersetzt.
