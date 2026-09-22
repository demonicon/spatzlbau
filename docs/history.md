# Historie

Abgeschlossene, nicht mehr laufend gebrauchte Teile aus `BRIEFING.md` und `CLAUDE.md`, verschoben mit dem Freeze-Auftrag (docs/changes/015, Abschnitt 6). Nichts davon gilt nicht mehr – es wird nur nicht mehr täglich gebraucht.

## Setup-Reihenfolge (was Sebastian getan hat, was Claude Code getan hat)

**Sebastian, im Browser (~15 Minuten):**
1. supabase.com → Konto → neues Projekt (Region EU, Frankfurt). Projekt-URL, Anon-Key und Service-Role-Key notieren.
2. Authentication → Providers → Email: „Allow new users to sign up“ aus. Unter Users die zwei Konten mit Passwort anlegen (Auto Confirm).
3. SQL Editor → Inhalt von `supabase/schema.sql` einfügen und ausführen (enthält Platzhalter für die zwei E-Mails).
4. github.com → neues öffentliches Repo `spatzlbau` (oder per `gh`, wenn eingeloggt).

**Claude Code:**
1. Repo-Gerüst anlegen, `schema.sql` schreiben, `SETUP.md` schreiben – zuerst, damit Sebastian parallel klicken kann.
2. App bauen, Seed-Skript, Result-Skript, PWA, Pages-Workflow.
3. Nach Push: Pages-URL an Sebastian melden (für Supabase Redirect), Seed einspielen.
4. Smoke-Test-Checkliste ausführen (siehe unten).

Vor dem Bauen abgefragt: Projekt-URL + Anon-Key, die zwei E-Mail-Adressen, ob `gh` und Node lokal verfügbar sind, Repo-Name.

## Smoke-Test (mit Anna, ~10 Minuten) – ausgeführt beim Setup

1. Sebastian öffnet die URL, loggt sich mit E-Mail und Passwort ein, trägt einen Einzugstermin ein, hakt eine Aufgabe ab, schreibt einen Kommentar.
2. Anna öffnet dieselbe URL auf dem Handy, loggt sich ein, sieht Sebastians Stand, hakt eine andere Aufgabe ab, kommentiert, fügt „Zum Home-Bildschirm“ hinzu.
3. Bei Sebastian erscheinen Annas Änderungen ohne Neuladen (Realtime).
4. Ein drittes Konto (Testadresse, im Dashboard angelegt, nicht in der Allowlist) loggt sich ein: App zeigt „nicht freigeschaltet“, keine Daten sichtbar. Eine Adresse ohne Konto kann sich gar nicht anmelden.
5. Sebastian fragt Claude im Chat nach dem Stand (Supabase-Connector); Claude liest ihn und nennt die beiden Kommentare korrekt.

Erfolgskriterium war: alle fünf Punkte grün. Danach begann die Weiterentwicklung (Änderungsaufträge 001 ff.).

## Mini-Roadmap vom 13.09.2026

1. **Setup & Smoke-Test** – erledigt (siehe oben)
2. **Konzeptrunde 2 (Chat) + UX/UI-Runde (Claude Code):** leichte Akte für kleine Aufgaben, Review-Export für Claude (alles Kommentierte/Geänderte seit letztem Review), Onboarding-Screen für Anna, Diese-Woche-Sicht schärfen
3. **Inhalte Phase 1 + 2:** Beratungsfelder und Teilschritte für Vertrag/Kündigung, mit Rechtslage-Check, geliefert als Seed-Update
4. **Delegation live:** erste echte Aufgabe (z. B. Umzugsunternehmen) durch die Schleife; danach optional Scheduled Task, der über den Connector täglich prüft und bei delegierten Aufgaben proaktiv startet
5. **Inhalte Phase 3–5** und Betrieb bis zum Einzug

Stand danach: alle fünf Punkte durchlaufen (Änderungsaufträge 001–013b), Meilenstein 1.0 mit Auftrag 015 eröffnet – die laufende Roadmap ist seither der Backlog (`docs/backlog.md`) plus die Änderungsaufträge in `docs/changes/`.
