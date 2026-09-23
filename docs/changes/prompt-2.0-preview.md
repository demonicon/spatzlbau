# Prompt an Claude Code – Meilenstein 2.0 auf `preview`

Modell: Opus (018 ist L, Rest läuft mit). Im Repo: `docs/changes/016…022`, `2.0-plan.md`; Design-Vorlagen unter `design/handoff/2026-09-23-{tweaks,timeline,upgrades}/` (gitignored, lokal lesbar).

```
Lies CLAUDE.md, docs/changes/2.0-plan.md und die Aufträge docs/changes/020-tweaks.md,
016-finanzen.md, 017-akte.md, 018-dashboard.md, 022-kalender-abo.md, 019-timeline.md,
021-phasen-gates.md. Die Design-Vorlagen liegen unter design/handoff/2026-09-23-tweaks/,
design/handoff/2026-09-23-timeline/ und design/handoff/2026-09-23-upgrades/ – je PDF plus
entpackter Project-HTML-Export. Den Export für Maße, Abstände und Tokens nutzen, das PDF für
Befunde und Begründungen. Wo ein Auftrag "design/handoff/2026-09-23/…pdf" nennt, ist der
passende dieser drei Ordner gemeint.

Ziel: Meilenstein 2.0 vollständig auf dem Branch `preview` (→ /preview/). `main` und die
Live-App bleiben unangetastet. Kein Merge nach main, kein PR gegen main.

Reihenfolge, strikt seriell: 020 → 016 → 017 → 018 → 022 → 019 → 021.
Je Auftrag:
1. Branch feat/<nr> von preview. Umsetzen nach Auftrag und CLAUDE.md-Regeln
   (Rot-Regel, Tap-Flächen, Kennzahl = Filter, Freeze-Regeln für Bugfix vs. Feature).
2. Tests nach Aufwandsklasse des Auftragskopfs, ohne echte Datenbank (Rekorder wie bei 1.1).
3. Migrationen nur als Dateien nach Namensregel, additiv und idempotent, schema.sql nachziehen.
   Nicht anwenden. Die App muss auf preview auch OHNE angewendete Migration laden (Feature
   degradiert, kein Fehler) – bis Sebastian die Migrationen einspielt.
4. docs/changes/<nr>-abweichungen.md (Abweichungsliste + Prüfbericht ≤ 15 Zeilen), Changelog-
   Eintrag unter Version 2.0 (release "2.0", noch nicht der oberste Eintrag – die Fußzeile auf
   preview darf "2.0-preview" zeigen).
5. Merge feat/<nr> nach preview, push. Preview und main dürfen nie auf demselben Commit stehen.
6. Zeile in docs/changes/preview-2.0-status.md: Nr · Commit · Status · offene Migrationen.
   Dann ohne Rückfrage mit dem nächsten Auftrag weitermachen.

Bei Unklarheit im Auftrag: die naheliegende Lesart wählen, in der Abweichungsliste begründen,
nicht anhalten. Anhalten nur bei: Konflikt zwischen zwei Aufträgen, der eine Entscheidung
verlangt, oder wenn ein Test der Live-Datenbank bräuchte.

Wird der Kontext knapp: aktuellen Auftrag sauber abschließen (Schritte 4–6), dann stoppen und
melden. Die nächste Session startet mit derselben Anweisung und setzt bei der ersten Zeile
in preview-2.0-status.md fort, die nicht "fertig" ist.

Am Ende: Gesamtbericht ≤ 25 Zeilen mit (a) allen anzuwendenden Migrationen in Reihenfolge,
(b) der Edge Function aus 022 mit Deploy-Hinweis, (c) offenen Entscheidungen, (d) was auf
/preview/ ohne Migration noch nicht sichtbar ist.
```

## Was danach passiert

1. Claude Code arbeitet die sieben Aufträge ab – realistisch zwei bis drei Sessions, jede setzt an der Statusdatei fort.
2. Du spielst die Migrationen (voraussichtlich 016, 018, 021, 022) im SQL-Editor ein – alle additiv, die Live-App 1.1 läuft weiter. Edge Function 022 per Dashboard hochladen.
3. `/preview/` auf Handy und Tablet, Sonntag mit Anna: 2a-Urteil direkt am Gerät statt am PDF.
4. Ich lese Abweichungslisten und Statusdatei gegen die Aufträge und prüfe die Migrationen per Connector.
5. Freigabe → ein Merge preview → main, Tag v2.0, Changelog-Reihenfolge fixieren. Bis dahin bleibt live auf 1.1.

## Risiken, offen benannt

- **Eine Datenbank für beide.** Preview schreibt in dieselben Tabellen wie live. Tests laufen ohne DB; wenn ihr am Sonntag auf /preview/ echte Häkchen setzt, sind die auch live – gewollt, es sind eure Daten. Nur Test-Kostenzeilen ("Überweisung erfassen" zum Ausprobieren) danach löschen.
- **018 ohne Annas Urteil gebaut.** Bewusst: sie urteilt am Gerät, nicht am PDF. Fällt das Urteil gegen 2a, ist 018 ein Revert auf preview, kein Schaden auf main.
- **Sieben Aufträge, ein Modell.** Opus durchgängig, weil Abbrüche zwischen Modellen teurer sind als der Aufpreis auf S-Aufträge.
