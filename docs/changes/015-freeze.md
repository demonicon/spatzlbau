# Änderungsauftrag 015 – Meilenstein 1.0 (Freeze)

Stand: 22.09.2026 (vollständige Sammlung) · Status: umgesetzt · Branch: `chore/release-1-0` · Modell: Sonnet · Aufwand: S
Start nach Merge von 013/013b. Betrifft: Versionierung, `changelog.json`, `CLAUDE.md`, `BRIEFING.md`, `docs/backlog.md`, `docs/release-check.md`, `docs/history.md`. Kein Funktionscode.

## 1. Was ein Freeze bedeutet

Ein Freeze ist ein **stabiler Meilenstein**, keine Pause. Der Stand nach 013 wird Version **1.0**. Danach nur Nebenversionen (1.1, 1.2 …) für Bugfixes, bis Sebastian den nächsten Meilenstein (2.0) bewusst eröffnet.

- **Bugfix:** Etwas, das vorher funktioniert hat und jetzt nicht mehr – oder ein Verhalten, das Daten falsch speichert oder anzeigt. Alles andere ist ein Feature und geht in den Backlog.
- **Eröffnen:** Nur Sebastian. Claude (Chat) erinnert an die Regel, wenn ein Feature-Wunsch kommt, und fragt explizit, ob der Meilenstein eröffnet wird. Claude Code baut keine Features ohne Eröffnung.
- **`CLAUDE.md` / `BRIEFING.md`:** Änderungen nur nach expliziter Bestätigung durch Sebastian. Dokumentarische Nachführung (Auftragsstatus, Abweichungslisten) ist ausgenommen.
- **Weiter erlaubt:** Inhaltspakete über den Seed-Workflow; Migrationen nur für Inhalte; tägliches Backup, wöchentliche Kontrolle; Supabase-JS gepinnt; keine Abhängigkeits-Updates ohne Bugfix-Grund.

## 2. Versionierung und Changelog

- Footer zeigt **1.0** (Haupt.Neben); Datum und Commit als Untertitel/Tooltip. Bugfix-PR ⇒ Nebenversion +1 und Changelog-Eintrag; Meilenstein ⇒ Hauptversion +1. Git-Tag `v1.0` auf den Merge-Commit, künftige Versionen ebenso.
- `changelog.json` bekommt `release` als Gruppe. Bestehende Einträge werden rückwirkend zugeordnet:

| Version | Aufträge | Titel |
|---|---|---|
| 0.1 | 001, 002 | Die App gibt es: Login, Dashboard, gemeinsame Liste |
| 0.2 | 003, 005, 005b | Updates und "Was ist neu?" |
| 0.3 | 006 | Am Computer nebeneinander |
| 0.4 | 008, 008b | Sicherer und mit täglicher Sicherung |
| 0.5 | 004, 007 | Kosten an jeder Aufgabe, Finanzansicht |
| 0.6 | 009 | Zuerst siehst du, was bei dir liegt; Umzugstag ohne Netz |
| 0.7 | 010, 012 | Vorschau, schnellere Live-Updates, Suche |
| 1.0 | 013, 013b, 015 | Version 1.0 – die App, mit der ihr umzieht |

- Changelog-Panel: neueste Version offen mit Zweizeiler, ältere Versionen eingeklappt. Der 1.0-Eintrag erklärt in einem Satz den Wechsel von Datum auf Versionsnummer.

## 3. Release-Check (`docs/release-check.md`, Vorlage, je Meilenstein kopiert)

| Block | Prüfung | Wer |
|---|---|---|
| Funktion | Smoke-Test zu zweit auf beiden Geräten: Login, Abhaken, Kommentar, Realtime, Kostenzeile, Suche, Flugmodus, Changelog | Sebastian + Anna |
| Daten | Backup grün, `restore --dry` 0 Abweichungen; `costs_summary` App = View; keine Testzeilen (Claude per Connector) | Claude Code + Claude |
| Sicherheit | Drittes Konto sieht nichts; Secret-Scan leer; Advisor ohne neue Hinweise; Supabase-JS gepinnt | Claude Code |
| Zugänglichkeit | Kontrast ≥ 4,5:1, Tap-Ziele ≥ 44 px, Tastatur-Durchlauf, Fokus überlebt Rendern | Claude Code |
| Verständlichkeit | Changelog in Alltagssprache; **Anna-Kriterium:** drei vorgegebene Dinge ohne Hilfe finden | Anna |
| Betrieb | Tag gesetzt, `preview` ≠ `main`-Commit, alle Aufträge "deployt", Abweichungslisten vorhanden, Backlog aktuell, `BRIEFING.md` = Ist-Stand | Sebastian |

Regeln: Rot in Sicherheit oder Daten blockiert den Meilenstein. Rot anderswo wird der erste Bugfix der Nebenversion. Für 1.0 läuft der Check am Wochencheck 27.09.

## 4. Backlog (`docs/backlog.md`)

Eine Zeile pro Idee: Datum · von wem (S/A/Claude) · Idee · Auslöser. Kein Status, keine Priorität; sortiert wird bei Eröffnung des nächsten Meilensteins. Claude (Chat) führt den Backlog mit der Auftragsliste; Claude Code hält die Datei synchron, wenn Sebastian sie übergibt. Startbestand:

- 22.09. · Claude · Push-Benachrichtigung bei neuen Kommentaren, falls der Besuchsblock nicht reicht
- 22.09. · Claude · Kostenzeilen manuell sortieren (`sort` im Schema)
- 22.09. · Claude · Suche in Kommentaren, Beratung, Kostenzeilen
- 22.09. · Claude · Scheduled Task für die Delegations-Schleife (nach erster manueller Delegation)
- 22.09. · Claude · Akte am Handy als Vollbild mit Browser-Zurück
- 22.09. · Claude · Suchfeld hinter Lupe – nach zwei Wochen Nutzung entscheiden
- 22.09. · S · Breakpoint-Feinschliff: Tablet und Zwischenbreiten (600–899 px, Querformat, > 1800 px) – Tablet-Test mit Anna am 27.09.

## 5. Arbeitsregeln für Claude Code (`CLAUDE.md`)

- **Aufwand im Auftragskopf (S/M/L) steuert die Prüftiefe:** S = Akzeptanzkriterien, eine Breite (380), kein Pixelvergleich, Bericht ≤ 10 Zeilen. M = zwei Breiten, Pixelvergleich nur bei Layout-Änderung, Bericht ≤ 20 Zeilen. L = volle Prüfung. Ansage-Regel für Schreibtests und Rollback-Prüfung von Migrationen gelten immer.
- **Bericht = Abweichungen, Entscheidungen, was Sebastian tun muss.** Was funktioniert, steht in der Abweichungsliste, nicht im Chat. Ist-Laufzeit am Ende jedes Berichts in einer Zeile.
- **Modell und Effort:** Sonnet, Effort standard als Default. Opus nur bei L oder Layout-Umbau; "extra" nur auf Ansage.
- **Parallel:** Zwei Aufträge ohne gemeinsame Dateien dürfen in zwei Cloud-Sitzungen auf getrennten Branches laufen; beide mergen nach `preview`, Reihenfolge nach Fertigstellung.
- **Preview ist für Nutzerstand read-only** (aus 012). **`preview` und `main` nie auf demselben Commit** (aus 010). **Tests mit echtem Konto nur nach Ansage** (aus 009).

## 6. Kontext straffen

`BRIEFING.md` und `CLAUDE.md` auf den Ist-Stand kürzen: Setup-Reihenfolge, Smoke-Test-Historie, erledigte Entscheidungen und die Roadmap vom 13.09. nach `docs/history.md` verschieben. Vorn bleibt: Konzept, Datenmodell, Sichten, Delegation (drei Zustände), Betrieb, Regeln. Ziel: beide Dateien zusammen unter 500 Zeilen.

## Akzeptanzkriterien

- [x] Footer 1.0; Changelog-Panel mit 1.0 offen und 0.1–0.7 eingeklappt; alle bestehenden Einträge zugeordnet
- [ ] Tag `v1.0` – bewusst offen gelassen, macht Sebastian nach dem Merge (siehe Auftragsanweisung: nicht pushen, nicht mergen, kein Tag durch Claude Code)
- [x] `docs/release-check.md` (Vorlage) und `docs/release-check-1.0.md` (Kopie, offen für 27.09.)
- [x] `docs/backlog.md` mit sieben Einträgen
- [x] `CLAUDE.md` mit Freeze-Regeln, Versionierung, Prüftiefe S/M/L, Berichtsregel, Modell/Effort, Parallelität
- [x] `BRIEFING.md` + `CLAUDE.md` < 500 Zeilen (203 zusammen), `docs/history.md` vorhanden
- [x] Bericht dieses Auftrags selbst nach der neuen S-Regel: ≤ 10 Zeilen

## Umsetzung (Nachtrag)

- Release-Zuordnung der bestehenden Einträge: chronologisch fortlaufend (ältester Eintrag `2026.09.22` → 0.1, jüngster bestehender `2026.09.22.7` → 0.7), passend zur Reihenfolge der Tabelle oben. Die Titel der Tabelle sind reine Release-Check-Dokumentation; im Changelog-Panel bleibt der ursprüngliche Titel jedes Eintrags stehen, die Gruppe zeigt nur die Versionsnummer.
- `compareVersions` (`app/changelog.js`) erkennt Datums-Versionen (vier Segmente, beginnt mit `20`) und behandelt jede andere Version als Release-Nummer, die immer neuer zählt. Geprüft mit `scen015.mjs` (12/12 PASS, `window.__db` blieb leer).
- Siehe `docs/changes/015-abweichungen.md` für die eine Auslegungsfrage (Wortlaut „erledigte Entscheidungen").
