# 022 – Kalender-Abo

Status: umgesetzt (Branch `feat/022-kalender` → `preview`, Abweichungen in `022-abweichungen.md`; Fristen-Wecker-Ergänzung: Branch `feat/022-valarm`, Nachtrag unten)

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

## Ergänzung 24.09. – Fristen-Wecker (4w), freigegeben

Erinnerungen kommen über den Kalender, nicht über Push oder Cron: Jeder Termin im ICS bekommt `VALARM`-Blöcke.

- Kritische Aufgaben: drei Alarme – `-P3D` 09:00, `-P1D` 09:00, `PT0S` 09:00 (ganztägig → Trigger relativ zum Tagesbeginn, absolut als `TRIGGER;VALUE=DATE-TIME` in `Europe/Berlin` berechnen, damit iOS und Outlook dieselbe Uhrzeit zeigen).
- Gates: zwei Alarme – `-P7D` und `PT0S`.
- Beschreibung des Alarms = Titel + Zuständigkeit („Wohnung kündigen · Sebastian · morgen").
- Keine Abschaltung je Aufgabe (bewusst weggelassen); wer keine Alarme will, schaltet sie im Kalender-Abo ab (iOS: „Hinweise entfernen", Outlook: Erinnerungen aus).
- **Bekannte Grenze:** Google Kalender übernimmt `VALARM` aus abonnierten Kalendern nicht; dort gelten die Standard-Benachrichtigungen des Kalenders (in den Google-Einstellungen des Abos einmal „1 Tag vorher" setzen). Hinweistext unter den Abo-Links entsprechend ergänzen: „iOS/Outlook erinnern 3 Tage, 1 Tag und am Tag selbst; Google nach seinen Kalender-Einstellungen."

Zusätzliche Akzeptanzkriterien:
- [x] ICS-Validator akzeptiert die Alarme; ein kritischer Termin hat drei `VALARM`, ein Gate zwei
- [x] iOS: Abo zeigt die drei Hinweise für `kuend-s` (Sebastian am Handy)
- [x] Hinweistext unter den Links angepasst

## Deploy (Sebastian, nach Merge 2.1)

`supabase functions deploy ics --no-verify-jwt --project-ref rxhbwjbiwackxuswupuy`, dann in Rahmendaten „Link neu erzeugen", Abo auf iOS und Google einrichten, ein Termin prüfen.

## Akzeptanzkriterien

- [x] Function lokal (`supabase functions serve` oder Node-Test der Handler-Funktion): mit Token 200 + gültiges ICS (validator), ohne 401
- [x] Person S: `kuend-s` drin, `kuend-a` nicht; `B`-Aufgaben in beiden
- [x] Gates als fünf Termine mit ◆ im Titel
- [x] "Link neu erzeugen" ändert Token, alte URL → 401
- [x] Bericht ≤ 10 Zeilen, Changelog: "Fristen und Gates lassen sich als Kalender abonnieren."
