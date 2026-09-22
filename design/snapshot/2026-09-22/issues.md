# Bekannte Schwächen

Aus dem Konzept und den bisherigen Reviews (Aufträge 002, 006, 011) – **nicht** aus dem Code
abgeleitet. Jede Variante in Teil B soll sagen, welche dieser Punkte sie löst.

---

## 1. Die Akte ist für kleine Aufgaben zu schwer

Jede Aufgabe bekommt dieselbe Akte: Titelfeld, Zuständig, Typ, Wartet-auf, Offset, fristkritisch,
Abhängigkeiten, Teilschritte, fünf Beratungsfelder, Kommentare, Löschen. Für „Kartons besorgen“ ist
das ein Formular, in dem die eine relevante Handlung (abhaken oder kurz kommentieren) untergeht.
Bekannt seit dem Konzept v2 (BRIEFING §5, „bekannte UX-Schuld“), bis heute offen.

*Screenshots:* `akte-leicht-380.png` gegen `akte-voll-claude-briefing-380.png` – beide sind gleich
lang aufgebaut, obwohl die eine Aufgabe nichts zu delegieren hat.

## 2. Keine Benachrichtigung bei neuen Kommentaren

Schreibt Anna einen Kommentar, erfährt Sebastian es nur, wenn er die Aufgabe zufällig öffnet. In der
Liste steht lediglich „2 Kommentare“ – ohne Hinweis, ob davon etwas neu ist. Die Delegations-Schleife
lebt aber von Kommentaren (Rückfragen, Antworten, Ergebnisse). Auch „wartet auf mich“ ist nur eine
Zahl auf einer Kachel, kein Signal.

## 3. Kachel-Unterzeilen sind am Desktop ausgeblendet

Am Handy tragen die Kacheln Zusatzangaben („· Sebastian“, „· am Zug 0“, „· auf mich 0“). Ab 900 px
werden genau diese Zusätze per CSS versteckt, damit die Kacheln einzeilig bleiben. Auf dem größeren
Bildschirm steht also **weniger** Information – genau umgekehrt zur Erwartung.

*Vergleich:* `dashboard-standard-380.png` gegen `dashboard-standard-1280.png`.

## 4. Zwei Kachelreihen

Zehn Kacheln in zwei Reihen à fünf sind eine große, gleichförmige Fläche über der Liste. Sie
konkurrieren visuell mit dem Countdown und der eigentlichen Aufgabenliste, und nicht jede Kachel
löst eine Entscheidung aus – „Offen 48“ und die drei Owner-Zahlen sind eher Statistik als Werkzeug.
Der Design-Handoff sah acht Kacheln in **einer** Reihe vor; mit zehn Filtern und der dauerhaft
sichtbaren Akte-Spalte war das bei ~840 px Listenbreite nicht lesbar (Entscheidung in
`docs/changes/006-abweichungen.md`).

## 5. Gate-Text steht unter den Tabs

Der Gate-Satz („Gate: beide Kündigungen zugestellt und bestätigt“) sollte laut Handoff neben den
Tabs stehen. Weil die Listenspalte neben dem Panel schmaler ist, rutscht er darunter und schiebt die
Liste eine Zeile nach unten. Er wirkt dadurch wie eine Beschriftung der Liste statt wie das Ziel der
Phase.

---

## Nicht vergessen bei neuen Entwürfen

Diese Eigenschaften der laufenden App sind Anforderungen, keine Schwächen – sie müssen jede Variante
überleben:

- **Kennzahl = Filter.** Jede Zahl ist antippbar und filtert die Liste; sonst ist sie nur Deko.
- **Warnfarben-Disziplin.** Gelb ausschließlich fristkritisch, Rot ausschließlich überfällig/Fehler.
- **Abhängigkeiten sichtbar.** „blockiert: …“ in der Zeile und die Chips in der Akte sind der einzige
  Ort, an dem der Abhängigkeitsgraph auftaucht.
- **Delegation nachvollziehbar.** Der sechsteilige Zustandsbalken und „Jetzt dran: ihr/Claude“ zeigen,
  wer am Zug ist.
- **Zwei Personen, ein Stand.** Owner-Chips, „wartet auf“, Realtime – beide sehen dasselbe.
- **Keine Dialoge.** Bestätigungen passieren inline (Löschen), Meldungen als Toast oder Statuszeile.
- **Tap-Ziele ≥ 44 px, Kontrast ≥ 4,5:1, sichtbarer Fokus, Tastatur bedienbar.**
