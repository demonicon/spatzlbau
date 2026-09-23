# Release-Check 2.0

Kopie von `docs/release-check.md` für den Meilenstein 2.0, geprüft am Stand **2.0.1**
(`main` = `cabce7e`, Tag `v2.0.1`). Regeln: Rot in **Sicherheit** oder **Daten** blockiert den
Meilenstein, Rot anderswo wird der erste Bugfix der Nebenversion.

Version: `2.0.1` · Termin: 23.09.2026 · Status: offen (Geräte-Prüfungen stehen aus, kein Rot)

| Block | Prüfung | Wer | Ergebnis |
|---|---|---|---|
| Funktion | Smoke-Test zu zweit auf beiden Geräten: Login, Abhaken, Kommentar, Realtime, Kostenzeile, Suche, Flugmodus, Changelog | Sebastian + Anna | offen – siehe „Am Gerät“ |
| Daten | Backup grün, `restore --dry` 0 Abweichungen; `costs_summary` App = View; keine Testzeilen (Claude per Connector) | Claude Code + Claude | gelb – Backup grün, Migrationen 010–016 eingespielt; `restore --dry` und Testzeilen offen |
| Sicherheit | Drittes Konto sieht nichts; Secret-Scan leer; Advisor ohne neue Hinweise; Supabase-JS gepinnt | Claude Code | gelb – ein neuer Advisor-Hinweis (s. u.); drittes Konto offen |
| Zugänglichkeit | Kontrast ≥ 4,5:1, Tap-Ziele ≥ 44 px, Tastatur-Durchlauf, Fokus überlebt Rendern | Claude Code | gelb – zwei Stellen mit zu engen Tap-Zielen (s. u.) |
| Verständlichkeit | Changelog in Alltagssprache; **Anna-Kriterium:** drei vorgegebene Dinge ohne Hilfe finden | Anna | offen – Changelog-Text geprüft, Anna-Kriterium offen |
| Betrieb | Tag gesetzt, `preview` ≠ `main`-Commit, alle Aufträge "deployt", Abweichungslisten vorhanden, Backlog aktuell, `BRIEFING.md` = Ist-Stand | Sebastian | grün (Tag, Commits, Deploy) – Backlog/BRIEFING offen |

Ergebnis je Zeile: grün / gelb (Bugfix notiert) / rot (blockiert).

## Von Claude Code geprüft (23.09.2026)

Methode: App lokal (`python -m http.server`) in Headless-Chrome, **ohne Login und ohne Datenbank** –
Demo-Daten, jeder Supabase-Aufruf läuft in einen Rekorder (Nachweis: 0 Aufrufe). Live-Seite
zusätzlich ohne Login geladen. Datenbank nur lesend (eine Abfrage, Advisor).

| Prüfung | Ergebnis | |
|---|---|---|
| Konsolenfehler, alle Ansichten, 380 und 1280 px | Aufgaben (Personen, Phasen), Timeline, Finanzen (+ Rahmendaten), Akte Ansehen, Akte Bearbeiten, Umzugstag-Blatt, Setup Schritt 1–8, dazu ein Klick-Durchlauf über die echten Ansichts-Umschalter: **0 Fehler**, kein waagrechtes Scrollen | grün |
| CSP ohne Verletzung | dieselben 34 Zustände: 0 `securitypolicyviolation`; Live-Seite (`/`) geladen: 0 Fehler, CSP-Meta vorhanden | grün |
| Service-Worker-Precache gegen `app/**/*.js` | alle 22 Module in `SHELL`, keines zu viel, keines fehlt; live `BUILD = cabce7e`, Vorschau `BUILD = c3a2c51` | grün |
| Fußzeile | live „2.0.1“, `/preview/` „2.0.1-preview“ (mit echter `changelog.json`) | grün |
| Changelog-Reihenfolge | 2.0.1 (release 2.0) · 2.0 (2.0) · 1.1 (1.0) · 1.0 · Datums-Versionen; ungelesen für Sebastian (`1.1`): genau 2.0.1 und 2.0; Anna (`null`): alles; live und Vorschau ausgeliefert mit 2.0.1 oben | grün |
| Tap-Flächen ≥ 44 px mobil (380) | Buttons 40 px + Freiraum nach Regel aus 020 – eingehalten. **Zwei Konflikte** (fremdes Ziel im 44-px-Quadrat): Timeline „wartet auf n ›“ 72×17 direkt unter dem Titel-Knopf; Akte Bearbeiten Teilschritt ↑/↓ je 28×22 nebeneinander. Avatar 36×36 ohne Nachbarn | gelb |
| Rot nur bei überfällig/Löschen | mit überfälligen Daten (Einzug 20.10.2026, Posten fällig 10.09.) geprüft: rot sind nur Frist-Datum/-Chip „überfällig“, überfällige Timeline-Zeilen und -Daten, überfälliger Posten (Finanzen), Frist „überfällig seit …“ in Bearbeiten, „Aufgabe löschen“. Rote Fläche „n Änderungen verwerfen?“ = unwiderruflich. Setup: kein Rot | grün |
| Ein Primär-Button je Ansicht | 1 in Aufgaben, Timeline, Finanzen, Akte Ansehen, Setup 1–8. **Zwei** in Akte Bearbeiten („Fertig“ + „Hinzufügen“ in der Kopfzeile) und im Umzugstag-Blatt („Drucken“ + „Hinzufügen“), beide Breiten | gelb |
| Migrationen 001–016 in `schema.sql` | jede Tabelle, Spalte, Policy, Funktion, jeder Trigger, Check-Wert und Settings-Schlüssel der 16 Dateien findet sich in `schema.sql` (`export_state` bewusst nicht – in 008 entfernt) | grün |
| Migrationen live | lesend geprüft: `task_changes`, `allowlist.seen_gates`, `paid_by` mit `H`, `kind` mit `ausgleich`, Settings `ics_token`, `fin_setup_done`, `claude_last_run`, `setup_done`, `setup_step`, `stammdaten` vorhanden – 010–016 sind eingespielt (`preview-2.0-status.md` sagt noch „keine angewendet“) | grün |
| Backup-Workflow zuletzt grün | `backup.yml` 23.09.2026 08:23 (Zeitplan) success, davor 22.09. success | grün |
| `preview` ≠ `main`-Commit | `main` `cabce7e` = Tag `v2.0.1`, `preview` `c3a2c51`; Unterschied nur `CLAUDE.md` | grün |
| Supabase-JS gepinnt | `@supabase/supabase-js@2.116.0` | grün |
| Secret-Scan | kein Service-Role-Key, keine E-Mail-Adresse im Repo | grün |
| Advisor (Sicherheit) | **neu:** `log_task_change()` (Migration 011, `security definer`) ist für `anon` und `authenticated` per RPC aufrufbar. Als Trigger-Funktion direkt nicht ausführbar, trotzdem `revoke execute` nachziehen. Bekannt: `current_person()`, `is_allowed()` (für RLS gewollt), Leaked-Password-Schutz aus | gelb |

## Am Gerät oder mit der Datenbank – offen

- [ ] Sebastian – Realtime zwischen zwei Geräten (abhaken, Kommentar, Kostenzeile erscheint ohne Neuladen beim anderen)
- [ ] Sebastian – Offline-Modus Umzugstag: Flugmodus, App öffnen, Umzugstag-Blatt und Aufgaben lesbar
- [ ] Sebastian – Login Anna auf ihrem Gerät (Passwort-Login, danach Changelog 2.0.1 + 2.0 als neu)
- [ ] Sebastian – Kalender-Abo: **bekannt offen**, Edge Function `ics` ist noch nicht deployt (SETUP.md §11); bis dahin bleibt „Abo-Adressen erzeugen“ wirkungslos
- [ ] Sebastian – „Claude jetzt starten“ mit stündlichem Lauf (024 Teil 1 + 3 außerhalb des Repos): Button setzen, nach dem nächsten Lauf Ergebnis und „zuletzt HH:MM“ prüfen
- [ ] Sebastian – drittes Konto sieht nichts (Sicherheit)
- [ ] Claude – `restore --dry` 0 Abweichungen, `costs_summary` App = View, keine Testzeilen (Daten)
- [ ] Anna – Anna-Kriterium: drei vorgegebene Dinge ohne Hilfe finden

## Bekannte offene Punkte (aus 014)

- Sortierung nach Kalenderdatum.
- `task_changes` ohne Person (`changed_by` leer).
- Ein Posten in zwei Listen („Als Nächstes zahlen“ und „Alle Posten“) öffnet sein Formular doppelt (016b, 016c).

## Neue Funde aus diesem Check (Bugfix-Kandidaten für 2.0.x, nicht behoben)

1. Timeline: „wartet auf n ›“ ist 17 px hoch und liegt direkt unter dem Titel-Knopf – Fehltipp öffnet die Akte statt der Liste.
2. Akte Bearbeiten: Teilschritt ↑/↓ je 28×22 px, nebeneinander.
3. Zwei Primär-Buttons in Akte Bearbeiten und im Umzugstag-Blatt (Kopfzeilen-„Hinzufügen“ bleibt primär).
4. Advisor: `revoke execute on function public.log_task_change() from anon, authenticated` als Migration.
5. `docs/changes/preview-2.0-status.md` meldet die Migrationen noch als nicht eingespielt – Status nachführen.
