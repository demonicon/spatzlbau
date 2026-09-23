# 024 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/024-claude-anbindung` → `preview` · Aufwand S (eine Breite, 380 px)
Migration `015_a024_claude_run.sql` – **nicht eingespielt**

## Umfang dieser Sitzung

Nur Teil 2 (PWA: Auslöser und Rückmeldung) ist Aufgabe von Claude Code. Teil 1 (Schreibrecht im
Supabase-Connector abschalten) ist Sebastians Klick; Teil 3 (stündlicher Scheduled Task) legt
„Claude" (die Chat-Rolle) an, nicht Claude Code – siehe Auftragskopf und CLAUDE.md-Rollenteilung.
Beides bleibt offen, siehe unten.

## Entscheidungen im Zweifel

1. **Der alte Ansehen-Button „An Claude geben" (009/017) ist ersetzt, nicht ergänzt.** Der Auftrag
   verlangt den Start-Button ausdrücklich im „017 Bearbeitungsmodus" – dort und nur dort lässt sich
   das Ziel auch bearbeiten, und „aktiv sobald Ziel gefüllt ist" lässt sich nur dort prüfen. Zwei
   Buttons mit unterschiedlicher Wirkung (der alte schrieb nur `status`, ohne `requested_at`/Autor)
   wären ein Widerspruch im selben Bildschirm. Ansehen zeigt jetzt nur noch die Stand-Zeile, keinen
   Auslöser mehr – passt zu 017s eigener Regel, dass Datenänderungen hinter „Bearbeiten" liegen.
2. **„Claude jetzt starten" speichert den offenen Entwurf mit, nicht nur den Klick.** Wer gerade am
   Ziel tippt und dann startet, ohne vorher „Fertig" zu drücken, würde sonst ein Briefing losschicken,
   das die Datenbank noch gar nicht kennt. Der Klick baut deshalb denselben Patch wie „Fertig"
   (`taskPatch`) und hängt `status`/`brief.requested_at`/`requested_by` an – ein Schreibzugriff,
   danach schließt der Bearbeiten-Modus.
3. **Kommentare von Claude (`author = 'C'`) brauchten keine Änderung.** Die Farbe (`.com.C` in
   `app.css`) und die Aufnahme in „Seit du zuletzt da warst" (`sinceVisit()` in `app/views/dashboard.js`
   zählt jeden Kommentar, der nicht von der eigenen Person ist) waren beide schon da – geprüft, nicht
   gebaut (siehe Testtabelle).
4. **„nächster Lauf" rundet auf die volle Stunde der echten Uhrzeit, nicht auf den Takt des Tasks.**
   Der Auftrag gibt die Regel direkt vor (07–22 Uhr → nächste volle Stunde, sonst „ab 07:00"); ohne
   den Scheduled Task lässt sich der tatsächliche nächste Lauf nicht genauer bestimmen.

## Offene Punkte

- **Migration 015 ist nicht eingespielt.** Ohne sie liest `state.settings.claude_last_run` als
  `undefined` – die Stand-Zeile zeigt dann „Claude prüft stündlich" ohne „zuletzt HH:MM"; kein
  Absturz. `brief.requested_at`/`requested_by` brauchen keine Migration (bestehendes `jsonb`).
- **Teil 1 und Teil 3 stehen aus** (siehe Umfang oben) – ohne sie schreibt der Button zwar korrekt,
  aber niemand holt die Aufgabe ab. Die beiden Testläufe der Akzeptanzkriterien sind deshalb
  **nicht geprüft**.
- **Rollback-Prüfung der Migration steht aus** (braucht die Datenbank).

## Was geprüft wurde (14 von 14 grün, 380 px)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Stand-Zeile (briefing, vor dem Start) zeigt `claude_last_run` | „Claude prüft stündlich · zuletzt 11:02" |
| 2 | Alter Button „An Claude geben" ist weg | – |
| 3 | Bearbeiten: Button ohne Ziel deaktiviert | – |
| 4 | Ziel eingetragen → Button aktiv | – |
| 5 | Klick: `status = claude`, `requested_by = S` | – |
| 6 | Ziel-Entwurf wird im selben Zug gespeichert | – |
| 7 | Kommentar „Sebastian hat Claude gestartet", Autor S | – |
| 8 | Bearbeiten-Modus schließt nach dem Start | – |
| 9 | Genau ein Schreibzugriff auf `tasks`, einer auf `comments` | `from:tasks,update,eq,from:comments,insert` |
| 10 | Stand-Zeile (bei Claude) zeigt „seit HH:MM · nächster Lauf …" | „bei Claude seit 12:36 · nächster Lauf bis 13:00" |
| 11 | Kein zweiter Klick: Button fehlt, solange `status = claude` | – |
| 12 | Kommentar von Claude erscheint in „Seit du zuletzt da warst" | – |
| 13 | Kommentar von Claude trägt die bestehende Claude-Farbe | Klasse `com C` |
| 14 | 380 px: kein waagrechtes Scrollen | – |

Regression: `017`, `018`, `019`, `020`, `021`, `022` erneut gelaufen – 124 von 124 weiter grün.
