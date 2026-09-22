# Release-Check (Vorlage)

Wird bei jedem Meilenstein kopiert nach `docs/release-check-<version>.md` und dort ausgefüllt (docs/changes/015). Regeln: Rot in **Sicherheit** oder **Daten** blockiert den Meilenstein. Rot anderswo wird der erste Bugfix der Nebenversion.

Version: `_._` · Termin: TT.MM.JJJJ · Status: offen

| Block | Prüfung | Wer | Ergebnis |
|---|---|---|---|
| Funktion | Smoke-Test zu zweit auf beiden Geräten: Login, Abhaken, Kommentar, Realtime, Kostenzeile, Suche, Flugmodus, Changelog | Sebastian + Anna | |
| Daten | Backup grün, `restore --dry` 0 Abweichungen; `costs_summary` App = View; keine Testzeilen (Claude per Connector) | Claude Code + Claude | |
| Sicherheit | Drittes Konto sieht nichts; Secret-Scan leer; Advisor ohne neue Hinweise; Supabase-JS gepinnt | Claude Code | |
| Zugänglichkeit | Kontrast ≥ 4,5:1, Tap-Ziele ≥ 44 px, Tastatur-Durchlauf, Fokus überlebt Rendern | Claude Code | |
| Verständlichkeit | Changelog in Alltagssprache; **Anna-Kriterium:** drei vorgegebene Dinge ohne Hilfe finden | Anna | |
| Betrieb | Tag gesetzt, `preview` ≠ `main`-Commit, alle Aufträge "deployt", Abweichungslisten vorhanden, Backlog aktuell, `BRIEFING.md` = Ist-Stand | Sebastian | |

Ergebnis je Zeile: grün / gelb (Bugfix notiert) / rot (blockiert). Offene Punkte darunter als Liste.
