# I-2a – Seed v3 (Clean Cut)

Stand: 23.09.2026 · Aufwand: S (kein Code) · Vorbedingung: Bugfix 1.1 gemerged
Datei: `seed.json` ersetzt v2 · Quelle: Deltaliste 1 + 2, vollständig übernommen

## Entscheidung

Bisherige Daten waren Mockup. Statt Merge-Paket wird `seed.json` auf v3 gehoben und die Inhaltstabellen vorher geleert. Kein Recycling alter IDs, keine Handschritte, keine erledigten Aufgaben im Board.

## Was v3 enthält

- 68 Aufgaben (v2: 48), 112 Teilschritte, Phasen-Gates geschärft (Q.3).
- 19 Aufgaben mit `anchor: umzugstag` – nur was am Lkw hängt. Übergaben, Reinigung, Bidet, Dübellöcher bleiben am Einzug (Mietende 31.12. = Einzug −1).
- Nicht mehr drin: `unterlagen`, `frist-s`, `frist-a` (erledigt), `nachmieter` (gestrichen), `doppelmiete` (ergibt sich aus Auszugsterminen).
- Umbenannt: `moebelplan` → `inventur`, `packsystem` → `packen`, `zaehler-alt` → `zaehler-melden`, `erstausstattung` → `auspacken`, `adressen` → `adressen-s` + `adressen-a`.
- Beratungstexte, Kosten, recurring: Teil B als Paket obendrauf.

## Ablauf

```sql
-- Supabase SQL-Editor, einmalig. allowlist und settings bleiben.
truncate tasks, subtasks, comments, costs, recurring cascade;
update settings set value = '20' where key = 'buffer_pct';
```

```bash
git pull                      # nach Merge fix/umzugstag, seed.json v3 im Root
node scripts/seed.mjs --dry   # erwartet: seed v3: 68 new tasks, 0 updated, 112 subtasks added
node scripts/seed.mjs
```

Danach in der App: Rahmendaten prüfen (Einzug 01.01.2027, Auszugstermine, Umzugstag nach dem 27.09.).

Falls `--dry` `anchor` nicht erwähnt oder das Feld fehlt: 1.1 unvollständig, SEED_FIELDS in `scripts/seed-merge.js` prüfen.

## Owner-Vorschlag für den Wochencheck 27.09.

45 Aufgaben stehen auf "Beide". Regel: **B nur, wo beide unterschreiben oder entscheiden.** Sonst führt einer, der andere sieht es im Besuchsblock. S = Verträge/Finanzen/Technik/Eugen-Kaufmann, A = Uhlandstr./Material/Haushalt/Behörden.

| Bleibt B | → S | → A |
|---|---|---|
| vertrag, innenvereinbarung, auszugstermine, umzugstag, inventur, umzugstag-ablauf, uebergabe-neu, budget, retro | kosten, vertrag-pruefen, kaution, wgb, protokolle-alt, schoenheit, kueche, energie, versicherung, vertraege-sichten, umzugsfirma, kueche-neu, renovierung, heizung-neu, rundgang, zaehler-melden, schaeden-spedition, kaution-zurueck, verjaehrung, steuer, nk-alt | uebergabe-alt-termin, adresse-vermieter, moebel-neu, ausmisten1, entsorgen, urlaub, packen, nachsende, erstversorgung, lampen, dokumente, geraete, wohnung-neu-check, frostschutz, auspacken, reinigung, ummeldung |

Ergebnis: 9 B · 21 S · 17 A, plus die 23 bereits verteilten. Wer anders entscheidet, ändert den Owner in der Akte – das Seed überschreibt keine Handänderung.

## Prüfung

- [ ] Dry-Run: 68 neu, 0 Fehler, `anchor` im Insert
- [ ] Aufgaben-Home leer von Kommentaren, 68 Aufgaben, Phase 3 mit 24
- [ ] `kuend-s` fällig 05.10., `halteverbot` 04.12., `kaution-zurueck` 01.04.2027
- [ ] Nach Umzugstag = 02.01.: `packen` fällig 05.12., `auspacken` 03.01.
- [ ] Finanzen: leer bis Teil B, Puffer 20 %
- [ ] Changelog von Hand: "Inhalt v3: Neustart mit 68 Aufgaben und 112 Teilschritten, Fristen nach Recherche (Kündigung 5.10., Halteverbot 4 Wochen, Kaution 3 Monate)."
