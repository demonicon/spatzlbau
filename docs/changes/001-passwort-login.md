# Änderungsauftrag 001 – Login per E-Mail und Passwort statt Magic Link

Stand: 13.09.2026 · Status: offen · Betrifft: Auth, Login-Screen, SETUP.md, BRIEFING.md

## Warum

Supabase versendet ohne eigenen SMTP-Server nur wenige Mails pro Stunde; beim Testen wurde das Limit erreicht ("email rate limit exceeded"). Passwort-Login braucht beim Anmelden keine Mail. Die Sicherheitsarchitektur bleibt unverändert: Supabase Auth als Identität, Allowlist und RLS als Sperre.

## Was sich ändert

**Auth-Modell**
- Anmeldung über `signInWithPassword({ email, password })`. Magic Link wird aus dem Frontend entfernt (kein zweiter Login-Weg, kein toter Code).
- Keine Selbstregistrierung. Die zwei Konten werden manuell im Supabase-Dashboard angelegt. In den Email-Provider-Einstellungen wird "Allow new users to sign up" ausgeschaltet.
- Keine "Passwort vergessen"-Funktion (bräuchte Mailversand). Zurücksetzen erledigt Sebastian im Dashboard unter Authentication → Users. **Kein Hinweis dazu auf dem Login-Screen** – der Screen verrät weder Namen, Backend noch Rollen. Der Login-Screen zeigt nur: Titel der App, E-Mail, Passwort, "Anmelden". Kein Footer, keine Erklärtexte.
- Sitzung bleibt bestehen (Supabase-Standard mit Refresh-Token, persistent im Browser). Kein Auto-Logout.

**Login-Screen**
- Felder: E-Mail, Passwort (mit Sichtbar-Schalter), Button "Anmelden". Tap-Ziele ≥ 44 px, `autocomplete="email"` bzw. `"current-password"`, damit Passwortmanager greifen.
- Fehlertexte in Klartext, ohne Hinweis auf die Ursache über das Nötige hinaus: "E-Mail oder Passwort stimmt nicht." Bei nicht freigeschalteter Adresse nach erfolgreichem Login: "Dieses Konto ist nicht freigeschaltet." – kein Zugriff auf Daten (RLS greift ohnehin).
- Abmelden-Link in der Statuszeile oder im Kopfbereich.

**Unverändert**
- Allowlist-Tabelle, RLS-Policies, Person-Mapping (E-Mail → S/A), Datenzugriff, Views.
- URL Configuration in Supabase kann bleiben; für den Passwort-Login ist sie nicht mehr relevant.

## Was Sebastian im Dashboard tut (in SETUP.md dokumentieren)

1. Authentication → Sign In / Providers → Email: "Allow new users to sign up" ausschalten. Email sign-in bleibt an (Passwort-Login läuft über diesen Provider).
2. Authentication → Users → "Add user" → "Create new user": E-Mail und Passwort eintragen, "Auto Confirm User" aktivieren. Einmal für Sebastian, einmal für Anna. Passphrasen: lang, im Passwortmanager ablegen; Anna bekommt ihre persönlich, nicht per E-Mail.
3. Die zwei E-Mails müssen exakt den Einträgen in `allowlist` entsprechen (Groß-/Kleinschreibung beachten; RLS-Vergleich bitte case-insensitiv implementieren, falls noch nicht).

## Akzeptanzkriterien

- [ ] Login mit korrekten Daten öffnet die Liste; nach Browser-Neustart bleibt man angemeldet.
- [ ] Falsches Passwort zeigt die Fehlermeldung, kein Konsolenfehler.
- [ ] Ein drittes Konto (Testadresse, im Dashboard angelegt, **nicht** in der Allowlist) kann sich anmelden, sieht aber keine Daten und die Meldung "nicht freigeschaltet".
- [ ] Ohne Konto (Adresse nicht angelegt) schlägt der Login fehl; keine Mail wird versendet.
- [ ] Abmelden funktioniert und führt zum Login-Screen.
- [ ] Login-Screen enthält keine Hinweise auf Personen, Supabase, Zurücksetzen oder Freischaltung; die Fehlermeldung ist für falsches Passwort und unbekannte Adresse identisch.
- [ ] Kein Magic-Link-Code mehr im Frontend; `SETUP.md` Schritt "Auth" ersetzt; `BRIEFING.md` Abschnitt 2 (Auth-Zeile) angepasst.

## Handy-Check

Login-Screen bei 380 px: Felder untereinander, Tastatur verdeckt den Button nicht, Passwortmanager-Autofill erscheint.
