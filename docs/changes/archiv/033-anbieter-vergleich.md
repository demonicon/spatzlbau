# 033 – Anbieter-Vergleich (4z)

Stand: 24.09.2026 · Meilenstein 2.2 · Ziel-Branch: `preview` · Modell: Opus (Tabelle + Handy-Layout) · Aufwand: M
Quelle: Funktionsideen Teil E, 4z. Freigegeben von Sebastian am 24.09. Setzt 024 (Delegation) und 032 (Entscheidungen) voraus.

## Ziel

Claudes Angebotsvergleich (Umzugsfirma, Internet, Strom, Versicherung) erscheint in der Akte als Tabelle: Optionen gegen Kriterien, mit Empfehlung und Begründung. Entschieden wird mit einem Tipp; die Entscheidung landet als markierter Kommentar (032) und – falls ein Posten an der Aufgabe hängt – als fester Betrag in Finanzen. Werte bleiben editierbar.

## Daten

Kein neues Schema. `tasks.brief.vergleich` (jsonb), additiv:

```
{
  "criteria":  ["Preis", "Leistung", "Frist", "Bewertung"],        // 2–6
  "options":   [ { "name": "Firma A", "values": {"Preis": "1.450 €", "Leistung": "2 Mann, 7,5 t, Halteverbot inkl.", ...},
                   "price": 1450, "url": "https://…", "note": "…" } ],   // 2–4
  "recommendation": "Firma B", "reason": "…",
  "decided": null | "Firma B", "decided_by": "S"|"A", "decided_at": "…",
  "source": "claude"|"manual", "updated_at": "…"
}
```
Standing-Regel 024 wird erweitert: Claude darf `tasks.brief.vergleich` schreiben (nur `criteria`, `options`, `recommendation`, `reason`, `source`, `updated_at` – nie `decided*`). Der Stundenlauf füllt das Feld, wenn ein Kommentar „@claude vergleiche …" oder ein Briefing mit „Vergleich" verlangt; zusätzlich bleibt `brief.ergebnis` als Text.

## Ansicht (Akte, Block „Vergleich" unter der Delegationskarte)

- **≥ 900 px:** Tabelle, Kriterien als Zeilen, Optionen als Spalten (max. 4). Kopfzelle je Option: Name (600), darunter Preis tabular, Link „Angebot ›" wenn `url`. Empfohlene Spalte: Chip „Empfehlung" im Kopf, Spaltengrund `--card` mit Rand `--ink` 1 px – keine Signalfarbe. Unter der Tabelle: „Warum: <reason>" (≤ 3 Zeilen, dann „mehr"). Fuß je Spalte: Sekundär-Button „Wählen"; nach der Wahl: gewählte Spalte mit „✓ gewählt · Do 24.09. · Sebastian", andere Buttons weg, „Wahl aufheben" als Subtle.
- **< 900 px:** je Option eine Karte (Name, Preis, Kriterien als Liste Label: Wert, Link, Button). Empfehlung zuerst, mit Chip.
- **Editierbar:** Doppeltipp/„ändern" auf eine Zelle öffnet ein Inline-Feld; Option hinzufügen (+), Kriterium hinzufügen (+), Option löschen (✕ mit Rückfrage). Änderung setzt `source = manual`, `updated_at`. Claude überschreibt einen manuell geänderten Vergleich beim nächsten Lauf nicht, sondern kommentiert („Vergleich aktualisiert? Ich habe neue Angebote: …").
- **Wahl:** „Wählen" → (1) `decided*` setzen, (2) Kommentar des Wählenden „Entschieden: Firma B – <reason gekürzt>" mit `decision = true` (032; das eigene Häkchen sitzt, das andere fehlt), (3) hängt ein Posten mit `task_id` an der Aufgabe: Inline-Frage „Betrag 1.450 € als fest übernehmen?" (Ja / Nein) – Ja setzt `costs.amount`, `status = fest`. Existiert kein Posten: Angebot „Posten anlegen ›" (016b-Editor vorbelegt).
- **Leer:** Kein Block, wenn `vergleich` fehlt. In der Delegationskarte statt dessen der Hinweis „Vergleich anfordern: Kommentar „@claude vergleiche …"" – nur, wenn die Aufgabe noch offen ist.

## Nicht im Umfang

Eigene Angebotssuche durch die App, Anhänge, Mehrfachwahl.

## Tests

- Per Connector `brief.vergleich` an `umzugsfirma` setzen (3 Optionen, 4 Kriterien, Empfehlung B) → Tabelle bei 1280, Karten bei 380, Empfehlung markiert.
- „Wählen" auf B → `decided = B`, Kommentar „Entschieden: …" mit `decision = true`, Frage nach Betrag; Ja → `costs.umzugsfirma-schaetzung` = 1.450 € fest.
- Preis von A auf 1.390 ändern → `source = manual`; erneuter Claude-Lauf (Simulation per Connector) überschreibt nicht.
- „Wahl aufheben" → `decided = null`, der Entscheidungs-Kommentar bleibt (Historie), Posten bleibt fest.
- Aufgabe ohne `vergleich` → kein Block, Hinweis in der Delegationskarte.

## Akzeptanzkriterien

- [ ] Fünf Tests grün; Standing-Regel in CLAUDE.md um `brief.vergleich` ergänzt (freigegeben)
- [ ] Kein Rot/Gelb im Block; ein Primär je Ansicht bleibt (Wählen ist Sekundär)
- [ ] Tabelle bei 1280 ohne horizontales Scrollen bis 4 Optionen; 380 px Karten
- [ ] Regression grün, Screenshots, Bericht ≤ 10 Zeilen
- [ ] Changelog 2.2.0: „Angebote stehen als Vergleich in der Akte – ein Tipp entscheidet."

## Nach dem Merge (Claude)

Prompt des Stundenlaufs um das Vergleichsformat ergänzen; erster Ernstfall: `umzugsfirma` (Angebote ab Anfang Oktober).
