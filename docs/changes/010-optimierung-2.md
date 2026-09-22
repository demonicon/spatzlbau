# Änderungsauftrag 010 – Optimierungsschleife 2

Stand: 22.09.2026 · Status: vorgemerkt (Entwurf) · Branch: `feature/optimierung-2` · Modell: Sonnet, für Punkt 2 Opus
Reihenfolge: nach 004 und 009. Ausnahme: Punkt 4 darf als eigener Vorab-PR laufen.
Scope-Regel: Punkte sind unabhängig; jeder kann einzeln gestrichen werden, ohne die anderen zu berühren.

## 1. Seed via GitHub Action

`.github/workflows/seed.yml`, nur `workflow_dispatch`, Eingabe: Pfad des Inhaltspakets (Default `seed.json`), optional `--dry`. Nutzt die vorhandenen Secrets. Ausgabe im Lauf-Log: angelegt / ergänzt / unverändert je Tabelle. Damit sind Inhaltspakete ohne PC einspielbar. `SETUP.md` ergänzen.

## 2. Realtime inkrementell

Statt Voll-Reload aller Tabellen bei jedem Ereignis: das Ereignis (`INSERT`/`UPDATE`/`DELETE` mit Zeile) in den lokalen State einarbeiten, Neu-Rendern wie bisher. Eigene Schreibvorgänge lösen keinen Reload aus. Fallback auf Voll-Reload bei Verbindungsabbruch und nach Wiederverbinden. Vorbedingung für Punkt 3.

## 3. Delegations-Schleife als Skript (Vorbereitung, kein Scheduled Task)

`scripts/claude-loop.mjs`: liest Aufgaben mit `type = claude` und `status in (go, arbeit)`, gibt sie als JSON aus (Format wie der frühere Handover), nimmt ein Ergebnis-JSON entgegen und schreibt Status, Ergebnis, Kommentar (`author = C`) und neue Teilschritte. Kein Aufruf von Claude im Skript – das bleibt vorerst die Chat-Session. Der Scheduled Task, der das automatisiert, wird erst nach der ersten manuell durchlaufenen Delegation angelegt.

## 4. Preview-Deploy

Pages-Workflow deployt `main` nach `/` und Branch `preview` nach `/preview/`. Gleiche Supabase-Konfiguration, gleiche Datenbank. Sichtbarer Hinweis "Vorschau" in der Statuszeile, wenn die App unter `/preview/` läuft. Service Worker mit eigenem Scope, damit Vorschau und Live sich nicht den Cache teilen. `CLAUDE.md`: Cloud-Sitzungen mergen nach `preview`, Sebastian merged `preview` → `main` nach Handy-Check.

## 5. `export_state` entfernen

Funktion, Token in `settings` und die zugehörige Policy löschen (Migration nach Namensregel). Claude liest über den Supabase-Connector; das Token ist eine offene Tür ohne Nutzen. `BRIEFING.md` Abschnitt 2 anpassen.

## 6. Datenschicht aufräumen

`runSeedMerge` und verbliebene Seed-Logik aus `state.js` entfernen; Seed existiert nur noch in `scripts/`.

## Akzeptanzkriterien

- [ ] Seed-Workflow einmal mit `--dry` gelaufen, Log zeigt 0/0/0
- [ ] Realtime: Annas Häkchen erscheint bei Sebastian ohne Voll-Reload (Netzwerk-Tab: kein REST-Request nach dem Ereignis); eigene Änderung erzeugt keinen Reload
- [ ] `claude-loop.mjs` Roundtrip an einer Testaufgabe: Ausgabe → Ergebnis einspielen → Kommentar als Claude sichtbar
- [ ] `/preview/` erreichbar, Hinweis sichtbar, Live-App unverändert
- [ ] Advisor meldet keine `security definer`-Funktion mehr außer den für RLS nötigen
- [ ] Changelog-Eintrag nur für Punkt 4 (falls Anna die Vorschau je sieht) – sonst keiner
