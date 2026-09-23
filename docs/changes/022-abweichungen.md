# 022 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/022-kalender` → `preview` · Aufwand S
Migration `012_a022_ics_token.sql` – **nicht eingespielt** · Edge Function `ics` – **nicht ausgerollt**

## Entscheidungen im Zweifel

1. **Die Entscheidungen der Function liegen in `ics.js`, nicht in `index.ts`.** Der Auftrag bietet
   „Node-Test der Handler-Funktion" als Nachweis an. Damit das ohne Deno geht, steckt alles –
   Token-Prüfung, Statuscodes, Header, Kalenderbau – in einer gewöhnlichen `.js`-Datei, die Deno
   und Node gleichermaßen laden. `index.ts` ist nur noch die Verdrahtung mit `Deno.serve` und dem
   Supabase-Client. Eine Abhängigkeit kommt nicht dazu.
2. **401 sagt nichts.** Fehlender Token, falscher Token, falsche Länge, unbekannte Person,
   fehlender Schlüssel in den Einstellungen: immer derselbe Text „Unauthorized". Nur wenn die
   Datenbank nicht antwortet, gibt es 503 – das ist keine Auskunft über das Geheimnis.
3. **Der Vergleich bricht nicht beim ersten Byte ab.** Erst die Länge, dann ein XOR über alle
   Zeichen. Bei einem 64-Zeichen-Hex über HTTPS ist das Vorsicht, keine Notwendigkeit.
4. **Alles ganztägig.** Eine Frist ist ein Tag, keine Uhrzeit. `DTSTART;VALUE=DATE` plus
   `DTEND` am Folgetag – so lesen es iOS, Google und Outlook gleich. `TRANSP:TRANSPARENT`, damit
   der Tag nicht als „beschäftigt" gilt.
5. **Zeilen falten nach Oktetten, nicht nach Zeichen.** „Übergabetermin" hat Umlaute; nach
   Zeichen gezählt wären Zeilen bis 77 Byte lang geworden und damit formal falsch. Kein Zeichen
   wird in der Mitte getrennt.
6. **Das Gate ist der späteste Termin seiner Phase** – dieselbe Regel wie in `app/groups.js`
   (018). Phasen ohne offene Aufgabe bekommen keinen Termin.
7. **Die Rahmendaten zeigen zwei Knöpfe zum Kopieren, keine sichtbare Adresse.** Eine Adresse mit
   Token im Klartext auf dem Bildschirm ist über die Schulter mitlesbar. Erst wenn das Kopieren
   scheitert (keine Zwischenablage-Erlaubnis, kein HTTPS), erscheint sie als Textfeld.
8. **Den Token erzeugt die App, nicht die Migration.** Die Migration legt den Schlüssel leer an;
   `crypto.getRandomValues` im Browser füllt ihn beim ersten Tippen auf „Abo-Adressen erzeugen".
   So steht kein Geheimnis in einer Datei im Repo.
9. **Der Auftrag nennt „`settings.ics_token`"** – `settings` ist eine Schlüssel-Wert-Tabelle, also
   ist es die Zeile mit `key = 'ics_token'`, keine neue Spalte.

## Offene Punkte – was Sebastian tun muss

1. Migration `012_a022_ics_token.sql` einspielen.
2. Function ausrollen: `supabase functions deploy ics --no-verify-jwt --project-ref <ref>`
   (der Schalter ist entscheidend: eine Kalender-App schickt keinen Authorization-Header).
   Optional `supabase secrets set APP_URL=…`. **Claude Code rollt nicht aus** (Auftrag).
3. In der App die Abo-Adressen erzeugen und die zwei `curl`-Zeilen aus `SETUP.md` §11 prüfen
   (200 mit Token, 401 ohne).

Die Prüfung gegen die ausgerollte Function (echtes HTTP) steht damit aus; geprüft ist der
Handler mit denselben Eingaben, die er dort bekommt.

## Was geprüft wurde (34 + 11 grün)

**Die Kalenderdatei und der Handler** (`node test022.mjs`, ohne Deno, ohne Datenbank):

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Rahmen, VERSION, PRODID, jedes VEVENT geschlossen | 21 Termine |
| 2 | Nur CRLF, jede Zeile ≤ 75 Oktette | max. 75 |
| 3 | UID, DTSTAMP, DTSTART, DTEND, SUMMARY an jedem Termin | je 21 |
| 4 | Ganztägig: DTEND ist der Folgetag | 20261012 → 20261013 |
| 5 | Sonderzeichen escaped, Faltung mit führendem Leerzeichen | – |
| 6 | AC: `kuend-s` bei Sebastian drin, bei Anna nicht | – |
| 7 | AC: `kuend-a` bei Anna drin, bei Sebastian nicht | – |
| 8 | AC: gemeinsame Aufgaben in beiden | 11 |
| 9 | Nur fristkritische Aufgaben | – |
| 10 | AC: fünf Gates mit ◆ im Titel | „◆ Spatzlbau: Gate Phase 1 – Finden & Zusagen" |
| 11 | Gate auf dem spätesten Termin seiner Phase | 2026-10-22 |
| 12 | Anker `umzugstag` / `einzug` rechnen richtig (1.1) | 10.01. / 15.01. |
| 13 | Ohne Termine leer, erledigte Aufgaben nicht drin | – |
| 14 | Beschreibung: Zuständigkeit, Phase, Link `#task=` | – |
| 15 | AC: mit Token 200, `text/calendar`, gültiger Kalender | – |
| 16 | Cache-Header eine Stunde | `public, max-age=3600` |
| 17 | AC: ohne / mit falschem / zu kurzem Token 401 | – |
| 18 | Ohne oder mit unbekannter Person 401, POST 405 | – |
| 19 | 401 verrät nichts („Unauthorized") | – |
| 20 | Datenbank weg = 503, nicht 200 | – |
| 21 | AC: nach „Link neu erzeugen" alte Adresse 401, neue 200 | – |

**Die Zeile in den Rahmendaten** (Browser, 380 px):

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 22 | Ohne Token nur „Abo-Adressen erzeugen" | – |
| 23 | Erzeugt 64 Hex-Zeichen (32 Byte) und schreibt sie | `from:settings, upsert` |
| 24 | Zwei Adressen, je Person, mit Token und `person=` | – |
| 25 | Hinweis auf Googles 24 Stunden | – |
| 26 | AC: „Link neu erzeugen" fragt vorher nach | „Die alten Abos hören auf zu aktualisieren" |
| 27 | AC: der Token ändert sich, die alte Adresse ist weg | – |
| 28 | 020: alle Knöpfe im System, 40 px, kein Primär | – |
| 29 | 380 px: kein waagrechtes Scrollen | – |
