# content/

Inhaltspakete für den Seed-Merge (Auftrag 004). Gleiches Format wie `seed.json`, alle Blöcke
optional (`tasks`, `phases`, `costs`, `recurring`); Kosten- und Recurring-Zeilen brauchen je einen
`seed_key`.

```bash
node scripts/seed.mjs --file content/<paket>.json --dry   # zeigt, was sich ändern würde
node scripts/seed.mjs --file content/<paket>.json         # schreibt (nie destruktiv)
```

Bestehende Zeilen werden feldweise aktualisiert, solange die Nutzer sie nicht geändert haben; eine
`costs`-Zeile wird nie mehr angefasst, sobald sie über `geschaetzt` hinaus ist, ein `paid_on` hat
oder ihr Betrag von Hand geändert wurde. `phases` und `seed_version` fasst ein Paket nicht an – die
kommen nur aus `seed.json`.

- `beispiel-004.json` – Formatbeispiel aus Auftrag 004 (nicht für die echte Datenbank gedacht).
