# Änderungsauftrag 005b – Changelog beim Aufruf anzeigen

Stand: 22.09.2026 · Status: umgesetzt, PR offen · Branch: `feature/changelog` (auf Zuruf, statt `feature/changelog-autoshow`) · Modell: Sonnet (umgesetzt mit Opus)
Erweitert 005. Betrifft: Changelog-Panel, `allowlist`, App-Start

## Ziel

Beim Öffnen der App erscheint das Panel "Was ist neu?" von selbst, wenn es seit dem letzten Lesen neue Versionen gibt – einmal pro Person, nicht pro Gerät.

## Verhalten

- **Auslöser:** Nach erfolgreichem Login und geladenen Daten prüft die App, ob die neueste Version in `changelog.json` neuer ist als `allowlist.last_seen_version` der eingeloggten Person. Wenn ja: Panel öffnen, alle ungelesenen Versionen zeigen (nicht nur die neueste).
- **Nicht** vor dem Login, **nicht** während der Anmeldung, **nicht** wenn die App über einen Aufgaben-Link (`#task=<id>`) geöffnet wurde – dann hat die Person ein Ziel; der "Neu"-Punkt im Footer bleibt und reicht.
- **Gelesen:** Schließen des Panels (Button, Escape, Tippen außerhalb) setzt `last_seen_version` auf die neueste Version. Das Panel erscheint erst bei der nächsten Version wieder. Kein "Später erinnern" – das erzeugt nur Wiederholungen.
- **Footer:** Der "Neu"-Punkt aus 005 folgt derselben Quelle (`last_seen_version` statt Gerätespeicher). Der Gerätespeicher aus 005 entfällt.
- **Offline/Fehler:** Kann der Wert nicht gelesen oder geschrieben werden, wird das Panel nicht automatisch geöffnet; manuelles Öffnen über den Footer funktioniert weiter.

## Datenmodell

`allowlist` bekommt `last_seen_version text null`. RLS: jede Person darf nur die eigene Zeile aktualisieren (Policy auf `email = auth.email()`), lesen wie bisher. Migration in `supabase/migrations/`, `schema.sql` nachziehen.

## Akzeptanzkriterien

- [ ] Neue Version deployt → beim nächsten Öffnen erscheint das Panel einmal; nach Schließen nicht mehr, auch nicht auf einem anderen Gerät derselben Person
- [ ] Zwei übersprungene Versionen werden beide angezeigt
- [ ] Öffnen über `#task=<id>` zeigt kein Panel, nur den "Neu"-Punkt
- [ ] Anna kann Sebastians `last_seen_version` nicht ändern (RLS-Test)
- [ ] Changelog-Eintrag: "Neuigkeiten zeigen sich jetzt von selbst, wenn du die App öffnest – einmal, danach findest du sie unten über die Versionsnummer."

## Umsetzungsnotizen (Claude Code, 22.09.2026)

- Migration `003_allowlist_last_seen_version.sql` (live eingespielt): Spalte `last_seen_version`, `update`-Recht für `authenticated` auf genau diese Spalte, Zeilenregel `lower(email) = lower(auth.jwt()->>'email')`. `schema.sql` nachgezogen.
- Gerätespeicher aus 005 entfernt; „Neu“-Punkt und Auto-Öffnen hängen nur noch an `last_seen_version`. Lesefehler → kein Auto-Öffnen, kein Punkt, manuelles Öffnen geht weiter.
- Auto-Öffnen zeigt nur ungelesene Versionen, Öffnen über den Footer alle. Schließen per Button, Escape oder Tippen außerhalb setzt `last_seen_version` auf die neueste Version.
- `#task=<id>` öffnet die Akte der Aufgabe (Phase wird gewählt, Filter aufgehoben) und unterdrückt das Auto-Öffnen – Aufgaben-Links gab es vorher nicht, das ist der minimale Einstiegspunkt dafür.
- Neuer Eintrag `2026.09.22.2` in `changelog.json` (zweiter Deploy des Tages).
- Headless geprüft (380 px): nie gelesen → Panel mit 2 Versionen; Schließen → DB `2026.09.22.2`, Punkt weg, nach Neuladen kein Panel; eine Version zurückgesetzt → Panel mit 1 Version, Escape schließt; `#task=umzugsfirma` → Akte offen, kein Panel, Punkt da; Tippen außerhalb schließt. RLS als Sebastian: Annas Zeile 0 Treffer, eigene Spalte `person` → „permission denied“. Testwerte danach auf `null` zurückgesetzt, damit das Panel nach dem Deploy bei beiden einmal erscheint.
