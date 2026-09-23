# 014 – Abweichungen und Entscheidungen (Bugfix 2.0.2)

Stand: 23.09.2026 · Branch `fix/014` → `preview` → `main` (Tag `v2.0.2`) · Aufwand S
Tests: `scen014` (18 von 18 grün, 380 und 1280 px, ohne Login/Datenbank), Punkt 5 per SQL gegen die
Live-Datenbank (freigegeben). Regression 016–026: 222 von 223 (die eine: 016s alter Test auf
„Angebot eintragen“, seit 016b ersetzt – unverändert).

| # | Punkt | Umsetzung | Abweichung / Entscheidung |
|---|---|---|---|
| 1 | „Seit du zuletzt da warst“ ohne Person | `changed_by = null` erscheint jetzt und endet auf „Inhaltspaket“ | Solche Zeilen fielen vorher ganz heraus (Filter verlangte eine Person). Die Akte zeigt keine Änderungsliste – dort nichts zu tun |
| 2 | „wartet auf n ›“ Tap-Ziel | Timeline: 8 px unter dem Titel, Trefferfläche 44 px (Pseudo-Element 8 px nach oben bis zur Titelkante, 19 px nach unten); die Trefferfläche des Titels endet an seiner Unterkante. Aufgabenzeilen: Link „wartet auf: …“ mit Inline-Padding 4/22 px = 44 px | Ab 900 px Zeilenabstand oben/unten 7 → 5 px, damit die Zeile mit 8 px Lücke bei 56 px bleibt; Punkte/Rauten 2 px nach oben mit. Am Handy (380) wird die Zeile 3 px höher. Bricht die Meta-Zeile um (lange Titel, 380 px), steht „wartet auf“ in der zweiten Zeile – ein Tipp 8 px unter dem Titel trifft dann die Meta-Zeile, weder Abhängigkeit noch Akte |
| 3 | Teilschritt ↑/↓ | je 44 × 44, untereinander, 8 px Abstand | Einen Ziehen-Griff gibt es nicht (017 hat Pfeile gewählt, siehe Backlog) – also die zweite Variante. Eine Teilschritt-Zeile im Bearbeiten-Modus ist dadurch 96 px hoch |
| 4 | Zwei Primär-Buttons | „Hinzufügen“ (Neue Aufgabe) wird Sekundär, solange eine Akte bearbeitet wird oder das Umzugstag-Blatt offen ist | **Zusätzlich gefunden und mit derselben Regel behoben:** Finanzen mit einem Posten im Bearbeiten-Modus hatte „Überweisung erfassen“ + „Fertig“ – „Überweisung erfassen“ wird dann Sekundär |
| 5 | `log_task_change()` aufrufbar | Migration `017_b014_revoke.sql`, in `schema.sql` nachgezogen, **angewendet** | Dry-Run in einer zurückgerollten Transaktion, dann echt: Frist von `kosten` −100 → −101 als Sebastian (`authenticated`) → Zeile in `task_changes` mit `changed_by = S`. Zurückgenommen ohne Trigger (`session_replication_role = replica`): `offset_days` −100, `updated_at` wieder 11:26:35, Testzeile gelöscht – Nachweis: `task_changes` hat wieder nur Zeile 1 (`halteverbot`). Linter: Warnung zu `log_task_change` weg; bleiben die bekannten zu `current_person()`/`is_allowed()` (für RLS gewollt) und Leaked-Password-Schutz |
| 6 | Sortierung nach Kalenderdatum | Spalten (Personen und Phasen) nach `dueInfo(t).sort` | Die Kostenliste in Finanzen sortierte schon nach Fälligkeitsdatum; die einzige Offset-Sortierung dort (`tasksWithCosts`, derzeit ungenutzt) ist mit umgestellt, ebenso das Umzugstag-Blatt (Phase 4 mischt die Anker am stärksten). Test mit Umzugstag 20 Tage nach dem Einzug: `renovierung` (18.12.) vor `packen` (24.12.) |
| 7 | Posten in zwei Listen | `ui.costWhere` merkt sich, in welcher Liste getippt wurde (`next`/`list`); nur dort öffnet das Formular | In der Akte gilt die Einschränkung nicht (dort gibt es nur eine Liste) |

Ohne Nummer:
- `preview-2.0-status.md`: Migrationen 010–017 als angewendet vermerkt, 014-Zeile ergänzt.
- CLAUDE.md: „Eigenen Testserver nur über seine PID beenden, nie prozessweit.“ ergänzt. Die
  Datumsversions-Zeile stand seit `c3a2c51` schon so drin (drei- oder vierteilig, Jahreszahl `20xx`).

## Offene Punkte

- Die Timeline-Screenshots in `design/snapshot/2026-09-23-timeline/` zeigen noch die 019c-Geometrie (5 px Lücke).
- Veralteter Test `scen_umzugstag3` (Bugfix 1.1) sucht die Rahmendaten-Felder unter dem Selektor von vor 016c – schlägt mit und ohne 014 gleich fehl, kein Befund an der App.
