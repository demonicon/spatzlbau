# Bugfix 1.1 – Abweichungsliste und Entscheidungen

Stand: 23.09.2026 · Branch `fix/umzugstag` · Aufwand S.

## 1. Migrationsname: `009_b11_umzugstag.sql`

Der Auftrag schlägt `NNN_b011_umzugstag.sql` vor ("oder analog"). Dieser Bugfix hat keine fortlaufende Auftragsnummer wie `004`/`009` – die Datei heißt `bugfix-1-1-umzugstag.md`, nicht `NNN-kurzname.md`. Ich habe `b11` verwendet (Bugfix, Version 1.1), fortlaufend als `009` (letzte Migration war `008`). `schema.sql` ist identisch nachgezogen.

## 2. „Rahmendaten-Bereich" = die kleine Einstellungen-Fläche in `#finanzen`

Der Begriff „Rahmendaten" kommt im Code sonst nur für das Beratungsfeld „Kontext & Rahmendaten" vor. Gemeint ist hier die bestehende `fin-settings`-Fläche (Einzug, Auszugstermine, Anteil, Puffer). Dort steht jetzt zuerst „Einzug (Schlüssel)", direkt danach „Umzugstag" – beide als eigenständige `date`-Felder, die je einen `settings`-Schlüssel schreiben (bestehender generischer Handler in `main.js`, keine Sonderbehandlung nötig).

## 3. Datumsformat im Countdown: wie die Fälligkeiten, nicht wie im Auftragstext

Der Auftrag zeigt als Beispiel „Umzug Sa 2.1." (ohne führende Nullen). Die App schreibt Fälligkeiten sonst durchgehend zweistellig mit Punkt („bis Do 15.10."). Der neue Zusatz übernimmt dieselbe Konvention: „· Umzug Sa 02.01." – für Konsistenz mit jeder anderen Datumsangabe in der App, nicht als Widerspruch zum Auftrag.

## 4. Nicht angefasst: Sortierung nach `offset_days`

Aufgabenspalten und die Kostenliste in `#finanzen` sortieren weiterhin nach dem rohen `offset_days`, nicht nach dem tatsächlich berechneten Datum. Solange alle Aufgaben einer Spalte denselben Anker haben, ist das identisch. Sobald Aufgaben mit unterschiedlichen Ankern gemischt in einer Spalte stehen **und** Einzug und Umzugstag weit auseinanderliegen, kann die Reihenfolge von der echten Kalenderreihenfolge abweichen (Beispiel: Einzug-Aufgabe mit Offset −5 vor einer Umzugstag-Aufgabe mit Offset +2, obwohl der Umzugstag zwei Tage nach dem Einzug liegt). Das ist kein Rückschritt gegenüber 1.0 – vorher gab es nur einen Anker – aber es ist auch keine neue Eigenschaft von 1.1. Bewusst nicht behoben: Aufwand S, der Auftrag nennt es nicht, und laut dem geplanten Inhaltspaket I-2a liegen alle `umzugstag`-Aufgaben ohnehin am Ende der Zeitachse (Phase 3 Ende / Phase 4), wo die Kollision unwahrscheinlich ist. Falls es real auffällt: Spalten nach `dueInfo(t).sort` statt `offset_days` sortieren – eigener kleiner Auftrag.

## 5. Seed-Merge: `anchor` bekommt denselben Default wie der Insert

`SEED_FIELDS` enthält jetzt `anchor`. Der Snapshot, den der Merge zum Vergleichen benutzt, trägt für `anchor` denselben Default (`'einzug'`) wie der Insert – nicht `null` wie bei den anderen Feldern. Ohne das hätte jede frisch eingefügte Aufgabe beim nächsten Merge-Lauf so ausgesehen, als hätte die Person `anchor` bereits von Hand geändert (Snapshot `null` ≠ echter Wert `einzug`), und ein späteres Inhaltspaket hätte sie nie mehr auf `umzugstag` umhängen können. Zusätzlich musste `scripts/seed.mjs` die Spalte `anchor` in die REST-Abfrage aufnehmen – ohne sie wäre der tatsächliche Wert für den Merge unsichtbar geblieben (still ignoriert, wie im Auftrag beschrieben).

## 6. Migration nicht angewendet, nur strukturell geprüft

Wie angesagt: nicht auf die Datenbank angewendet. `costs_before_write()` ist Zeile für Zeile am bestehenden Trigger gespiegelt (derselbe Aufbau, nur der Anker kommt dazu) und gegen das bestehende Muster in `schema.sql`/`008_a010_export_entfernen.sql` gegengelesen, aber nicht live getestet. Bitte nach dem Einspielen einmal quer prüfen: eine Kostenzeile an einer `anchor = 'umzugstag'`-Aufgabe anlegen und `due_on` gegen `settings.umzugstag + offset_days` vergleichen.

## 7. Nebenbei gefunden und behoben: Fußzeile zeigte die Meilenstein-Gruppe statt der eigenen Version

`app/ui/chrome.js` las bislang `cur.release || cur.version` für die Fußzeile. Solange der neueste Eintrag `release === version === '1.0'` war (direkt nach dem Freeze), fiel das nicht auf. Mit dem ersten Bugfix nach dem Freeze (dieser hier, `version: '1.1'`, `release: '1.0'`) hätte die Fußzeile weiter „1.0" gezeigt – entgegen der eigenen Regel in `CLAUDE.md`: „Der erste Eintrag ist die Version, die die App im Footer zeigt". Behoben: die Fußzeile liest jetzt `cur.version`; `release` bleibt, wozu es gedacht ist – die Gruppierung im Changelog-Panel (`changelogHTML()` in `dashboard.js`, unverändert).

## 8. Geprüft

- **AC1 (kein `umzugstag`, 380 px, Hauptansicht):** Pixelvergleich zwischen `main` (eigenes `git worktree`, Port 5501) und diesem Branch (Port 5502), identischer Demo-Zustand, `pngdiff.py` → **identisch**, 0 differierende Pixel.
- **AC2 (`umzugstag = 2027-01-02`, Testaufgabe `anchor: umzugstag, offset 0`):** Fälligkeit „bis 02.01.", Countdown „… · Umzug Sa 02.01.", Aufgabenzeile zeigt dieselbe Fälligkeit, Druckblatt-Kopf „Samstag, 2. Januar 2027" – **5 von 5 grün**.
- **Rahmendaten-Fläche:** beide Felder vorhanden, eigene Schlüssel – **3 von 3 grün**.
- **Seed-Merge (`planSeedMerge` direkt, ohne Netzwerk):** neues Paket mit `anchor` wird übernommen, Insert-Default ohne `anchor` im Paket ist `einzug`, kein Drift im zweiten Lauf, ein Paket kann `anchor` nachträglich auf eine unangetastete Bestandsaufgabe anwenden, ein von Hand geänderter Anker wird nicht überschrieben – **8 von 8 grün**.
- **Fußzeile / Changelog nach dem 1.1-Eintrag:** Fußzeile zeigt „1.1", `hasUnread()` bei `lastSeenVersion = 1.0` ist wahr, das Panel gruppiert den neuen Eintrag weiterhin korrekt unter „Version 1.0" zusammen mit 013/013b/015 – **4 von 4 grün**.
- Alle Läufe ohne Login und ohne Datenbank (Supabase durch einen Rekorder ersetzt, blieb in jedem Lauf leer). Keine Konsolenfehler.

**Nicht geprüft:** der Trigger selbst (Punkt 6) und das Seed-Dispatch-Skript `scripts/seed.mjs` als Ganzes (nur die Planungsfunktion isoliert getestet) – beide brauchen die echte Datenbank, die hier nicht angefasst wurde.
