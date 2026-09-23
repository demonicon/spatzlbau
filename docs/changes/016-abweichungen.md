# 016 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/016-finanzen` → `preview` · Aufwand M (zwei Breiten)

## Entscheidungen im Zweifel

1. **„Angebot eintragen" hält die Zeile in der Liste.** Nach der Zählregel aus 007 ist ein Angebot
   Historie und zählt in keiner Summe. Für „Als Nächstes zahlen" wäre die Zeile damit nach dem
   ersten Schritt verschwunden – genau die Zeile, die als Nächstes eine Entscheidung braucht.
   `nextPayments()` fragt deshalb etwas anderes als `isCounted()`: eine Zeile bleibt in der Liste,
   solange sie nicht bezahlt ist und keine feste Zeile derselben Aufgabe sie abgelöst hat. Die
   Summen bleiben unberührt – die Zählregel selbst ist nicht angefasst.
2. **„Angebot eintragen" öffnet die Zeile.** Das Akzeptanzkriterium verlangt ein Betragsfeld. Der
   Schritt auf `angebot` setzt darum `ui.costEdit` und klappt die Kostenzeile (die Komponente aus
   der Akte) auf – auch in der Akte selbst, dort war bisher nur der Stand gewechselt.
3. **Doppelmiete zweimal, aber aus einer Regel.** `costs_summary` bekommt `double_rent`; die App
   rechnet dieselbe Definition in `doubleRentTotal()` nach, weil sie die View nirgends liest
   (sie ist Nachschlagewerk, keine Datenquelle der App). Beide zählen Monat für Monat vom Einzug
   bis zum jeweiligen Auszug, Kaltmiete + Nebenkosten je Altwohnung. Fehlt ein Termin: `null`,
   und die Ansicht fragt in der Zeile „Doppelmiete – Auszugstermine fehlen" danach.
4. **Herleitung: vier Zeilen statt drei.** Der Auftrag nennt Posten › Doppelmiete › Rückflüsse ›
   davon bezahlt. „davon bezahlt" ist keine Summand der Antwortzahl, sondern eine Teilmenge der
   Posten; die Zeile steht darum leise (graue Schrift, nicht fett) unter den drei Summanden. Die
   drei Summanden addieren sich exakt auf die Zahl – so geprüft.
5. **Filter „Doppelmiete" filtert die Postenliste nicht.** Zu dieser Kennzahl gibt es keine
   Kostenzeilen (sie entsteht aus `recurring` und den Terminen). Die Zeile lässt sich antippen und
   markiert sich, die Postenliste bleibt dann auf „alle" – ein leerer Filter wäre irreführender.
6. **Laufend als Leseansicht: vier Spalten statt fünf.** Der Auftrag nennt Posten / du / Anna /
   neu / Δ. In der Leseansicht sind „du" und „Anna" zu einer Spalte „heute" zusammengefasst,
   weil die Frage dort lautet: was kostet es zusammen jetzt, was danach. Die fünf Spalten stehen
   unverändert im Bearbeiten-Modus, wo die Beträge einzeln eingetragen werden.
7. **`ausgleich` erscheint in keiner Auswahl.** Die Art wird nur vom Knopf „Überweisung erfassen"
   gesetzt, nicht im Art-Auswahlfeld der Kostenzeile angeboten – sonst ließe sich jede Zeile aus
   den Summen herausdrehen.
8. **`.cost-actions .back` verliert seine Sondergröße.** Der Rücksprung-Knopf in der Kostenzeile
   stand mit 13 px / 44 px neben dem Knopfsystem aus 020 und fiel am Desktop (32 px) auf. Er ist
   jetzt ein gewöhnlicher `.btn-text`.

## Offene Punkte

- **Migration 010 ist nicht eingespielt.** Bis dahin lehnt die Datenbank die Art `ausgleich` ab:
  „Überweisung erfassen" meldet dann „Ausgleich braucht Migration 010 – noch nicht eingespielt"
  und schreibt nichts. Alles andere in der Ansicht funktioniert ohne die Migration, weil die App
  `costs_summary` nicht liest.
- **Rollback-Prüfung der Migration steht aus.** Sie braucht die Datenbank; nach Anweisung für 2.0
  wird keine Migration angewendet. Beim Einspielen zuerst in einer Transaktion prüfen.

## Was geprüft wurde (27 von 27 grün)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Antwortzahl = Posten + Doppelmiete − Rückflüsse | 5.708 € = 3.158 + 2.550 − 0 |
| 2 | Herleitungszeilen addieren sich auf die Zahl | 5.708 = 5.708 |
| 3 | Vier Herleitungszeilen, jede ein Filter | Posten, Doppelmiete, Rückflüsse, davon bezahlt |
| 4 | Kennzahl = Filter: Zeile filtert die Postenliste | Chip „Filter: Rückflüsse", Zeile gedrückt |
| 5 | Überweisung 300 € → Saldo 1.200 € → 900 € | genau −300 € |
| 6 | Keine andere Summe ändert sich | net/Posten/bezahlt/Rückflüsse/Doppelmiete gleich |
| 7 | Gespeichert wird `kind=ausgleich`, `bezahlt`, heute | `paid_by` gesetzt, `paid_on` = 23.09.2026 |
| 8 | Überfällige Zahlung steht oben und ist rot | Chip „überfällig", Kopf „· 1 überfällig" |
| 9 | Geschätzt → „Angebot eintragen" → Stand `angebot` | Betragsfeld offen, Wert 640 |
| 10 | Laufend ohne Tippen: keine Eingabefelder | 0 Felder, Knopf „Bearbeiten" |
| 11 | „Bearbeiten" → 9 Felder + „Fertig"; „Fertig" schließt | 9 → 0 |
| 12 | Vier Pillen mit Zählern, mobil erst „6 Posten zeigen" | alle 6 / offen 4 / bezahlt 2 / Rückfluss 0 |
| 13 | Monatstabelle 5 Spalten + teuerster Monat | „Sept. 2026 ist der teure Monat: 2.429 €." |
| 14 | Rahmendaten als Lesezeile, kein offenes Formular | 0 Eingabefelder |
| 15 | 380 px: genau ein Primär („Überweisung erfassen") | 1 |
| 16 | 380 px: alle Schaltflächen 40 px, 14 px / 600 | einheitlich |
| 17 | 380 px: kein waagrechtes Scrollen | – |
| 18 | Rot nur für Überfälliges | zwei Treffer, beide in der überfälligen Zeile |
| 19 | 1280 px: Herleitung als vier Kacheln neben der Zahl | rechts der Zahl |
| 20 | 1280 px: Schaltflächen 32 px, Postenliste offen | 32 px, 5 Zeilen |
| 21 | Keine Konsolenfehler, kein Datenbank-Lesezugriff | „errors: none" |

Nicht im Knopfsystem (bewusste Ausnahmen, wie in 020 festgehalten): die Herleitungszeilen
(`.fin-break-row`, ganze Zeile als Fläche), der Posten-Titel in „Als Nächstes zahlen"
(`.fin-task-title`, springt in die Akte) und das Info-Zeichen im Fuß.
