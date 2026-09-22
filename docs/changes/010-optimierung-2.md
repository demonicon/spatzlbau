# Änderungsauftrag 010 – Optimierungsschleife 2

Stand: 22.09.2026 · Status: **deployt 22.09.2026** (Merge fc5e6b3, PR #11); Punkt 3 gestrichen · Branch: `feature/optimierung-2` (gelöscht) · Modell: Sonnet, für Punkt 2 Opus
Migration `008_a010_export_entfernen.sql` eingespielt. Alle Akzeptanzkriterien erfüllt; Nachweise im PR und im Chat-Bericht vom 22.09.
Reihenfolge: nach 004 und 009. Ausnahme: Punkt 4 darf als eigener Vorab-PR laufen. Umsetzung: ein Branch `feature/optimierung-2`, Commit-Reihenfolge 4 · 1 · 5 · 6 · 2, Stopp vor Punkt 2 mit Zwischenbericht.
Scope-Regel: Punkte sind unabhängig; jeder kann einzeln gestrichen werden, ohne die anderen zu berühren.

## 1. Seed via GitHub Action

`.github/workflows/seed.yml`, nur `workflow_dispatch`, Eingabe: Pfad des Inhaltspakets (Default `seed.json`), optional `--dry`. Nutzt die vorhandenen Secrets. Ausgabe im Lauf-Log: angelegt / ergänzt / unverändert je Tabelle. Damit sind Inhaltspakete ohne PC einspielbar. `SETUP.md` ergänzen.

## 2. Realtime inkrementell

Statt Voll-Reload aller Tabellen bei jedem Ereignis: das Ereignis (`INSERT`/`UPDATE`/`DELETE` mit Zeile) in den lokalen State einarbeiten, Neu-Rendern wie bisher. Eigene Schreibvorgänge lösen keinen Reload aus. Fallback auf Voll-Reload bei Verbindungsabbruch und nach Wiederverbinden.

## 4. Preview-Deploy

Pages-Workflow deployt `main` nach `/` und Branch `preview` nach `/preview/`. Gleiche Supabase-Konfiguration, gleiche Datenbank. Sichtbarer Hinweis "Vorschau" in der Statuszeile, wenn die App unter `/preview/` läuft. Service Worker mit eigenem Scope, damit Vorschau und Live sich nicht den Cache teilen. `CLAUDE.md`: Cloud-Sitzungen mergen nach `preview`, Sebastian merged `preview` → `main` nach Handy-Check.

## 5. `export_state` entfernen

Funktion, Token in `settings` und die zugehörige Policy löschen (Migration nach Namensregel). Claude liest über den Supabase-Connector; das Token ist eine offene Tür ohne Nutzen. `BRIEFING.md` Abschnitt 2 anpassen.

## 6. Datenschicht aufräumen

`runSeedMerge` und verbliebene Seed-Logik aus `state.js` entfernen; Seed existiert nur noch in `scripts/`.

## Akzeptanzkriterien

- [x] Seed-Workflow einmal mit `--dry` gelaufen, Log zeigt 0/0/0 (Lauf 35742699985)
- [x] Realtime: Annas Häkchen erscheint bei Sebastian ohne Voll-Reload (gemessen: **keine** REST-Anfrage nach dem Ereignis); eigener Schreibvorgang erzeugt nur das PATCH selbst
- [x] `/preview/` erreichbar, eigener Build-Stempel und eigener Service-Worker-Scope, Live-App unverändert
- [x] Advisor meldet keine `security definer`-Funktion mehr außer `is_allowed`/`current_person`
- [x] Kein Changelog-Eintrag: die Vorschau ist Sebastians Prüfpfad, in der Live-App ändert sich für Anna nichts Sichtbares
