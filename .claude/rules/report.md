# Prüftiefe, Bericht, Modell

- **Aufwand im Auftragskopf (S/M/L) steuert die Prüftiefe:** S = Akzeptanzkriterien, eine Breite (380 px), kein Pixelvergleich, Bericht ≤ 10 Zeilen. M = zwei Breiten, Pixelvergleich nur bei Layout-Änderung, Bericht ≤ 20 Zeilen. L = volle Prüfung. Die Ansage-Pflicht für Schreibtests und die Rollback-Prüfung von Migrationen gelten immer, unabhängig vom Aufwand.
- **Bericht = Abweichungen, Entscheidungen, was Sebastian tun muss.** Was funktioniert, steht in der Abweichungsliste im Auftrag, nicht im Chat-Bericht. Letzte Zeile jedes Berichts: die Ist-Laufzeit.
- Format (seit Auftrag 037): Commit, Tests n/n, Abweichungen, Run-Nummer, Live-Version, Review-Ergebnis. Ohne grünen Workflow-Lauf und geprüfte Live-Version kein Abschluss (siehe „Definition of Done" in `CLAUDE.md`).
- **Parallel:** Zwei Aufträge ohne gemeinsame Dateien dürfen in zwei Cloud-Sitzungen auf getrennten Branches laufen; beide mergen nach `preview`, Reihenfolge nach Fertigstellung.
