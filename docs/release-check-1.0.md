# Release-Check 1.0

Kopie von `docs/release-check.md` für den Meilenstein 1.0 (docs/changes/015).

Version: `1.0` · Termin: 27.09.2026 · Status: offen

| Block | Prüfung | Wer | Ergebnis |
|---|---|---|---|
| Funktion | Smoke-Test zu zweit auf beiden Geräten: Login, Abhaken, Kommentar, Realtime, Kostenzeile, Suche, Flugmodus, Changelog | Sebastian + Anna | offen |
| Daten | Backup grün, `restore --dry` 0 Abweichungen; `costs_summary` App = View; keine Testzeilen (Claude per Connector) | Claude Code + Claude | offen |
| Sicherheit | Drittes Konto sieht nichts; Secret-Scan leer; Advisor ohne neue Hinweise; Supabase-JS gepinnt | Claude Code | offen |
| Zugänglichkeit | Kontrast ≥ 4,5:1, Tap-Ziele ≥ 44 px, Tastatur-Durchlauf, Fokus überlebt Rendern | Claude Code | offen |
| Verständlichkeit | Changelog in Alltagssprache; **Anna-Kriterium:** drei vorgegebene Dinge ohne Hilfe finden | Anna | offen |
| Betrieb | Tag gesetzt, `preview` ≠ `main`-Commit, alle Aufträge "deployt", Abweichungslisten vorhanden, Backlog aktuell, `BRIEFING.md` = Ist-Stand | Sebastian | offen |

Offene Punkte: –
