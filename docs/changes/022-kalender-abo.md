# 022 – Kalender-Abo

Status: umgesetzt (Branch `feat/022-kalender` → `preview`, Abweichungen in `022-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: S
Quelle: Funktionsideen Teil E, 4a.

## Ziel

Kritische Fristen und Gates als abonnierbarer Kalender (ICS) für iOS, Google, Outlook – ohne App-Öffnen, ohne Push.

## Umsetzung

- Supabase Edge Function `ics`: `GET /ics?token=…&person=S|A`. Liefert `text/calendar` mit ganztägigen Terminen für alle offenen Aufgaben mit `critical = true` (gefiltert auf Person oder B) und die fünf Gates (spätester Termin der Phase). Titel "Spatzlbau: <Titel>", Beschreibung: Zuständigkeit, Phase, Link `https://…/#task=<id>`. UID stabil je Aufgabe, `DTSTAMP` = `updated_at`. Fälligkeit nach Anker (1.1).
- Token: `settings.ics_token` (32 Byte, zufällig), Service-Role in der Function; falscher/fehlender Token → 401, kein Hinweistext. Rahmendaten: Zeile "Kalender-Abo" mit zwei Links (Sebastian, Anna) zum Kopieren, Sekundär "Link neu erzeugen" (Inline-Bestätigung: alte Abos brechen), kurzer Hinweis "Google aktualisiert bis zu 24 h".
- Cache-Header 1 h. Kein Schreiben. CSP unberührt (anderer Origin, nur Link).
- Die Function wird im Repo unter `supabase/functions/ics/` abgelegt; Deploy von Sebastian per Dashboard oder CLI – Claude Code deployt nicht.

## Daten

Migration `NNN_a022_ics_token.sql`: `settings.ics_token` (initial null; App erzeugt beim ersten Öffnen der Rahmendaten). Additiv.

## Akzeptanzkriterien

- [x] Function lokal (`supabase functions serve` oder Node-Test der Handler-Funktion): mit Token 200 + gültiges ICS (validator), ohne 401
- [x] Person S: `kuend-s` drin, `kuend-a` nicht; `B`-Aufgaben in beiden
- [x] Gates als fünf Termine mit ◆ im Titel
- [x] "Link neu erzeugen" ändert Token, alte URL → 401
- [x] Bericht ≤ 10 Zeilen, Changelog: "Fristen und Gates lassen sich als Kalender abonnieren."
