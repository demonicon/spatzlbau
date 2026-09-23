# 024 – Claude-Anbindung: Ergebnisse in der Akte, „Claude jetzt starten"

Status: Teil 2 (PWA) umgesetzt (Branch `feat/024-claude-anbindung` → `preview`, Abweichungen in `024-abweichungen.md`). Teil 1 (Schreibrecht) und Teil 3 (Scheduled Task) sind nicht Aufgabe von Claude Code – siehe Abweichungsliste.
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: S (App) + Einrichtung außerhalb des Repos
Entscheidung Sebastian 23.09.: Lösung B (Claude schreibt Ergebnisse selbst) plus ein Auslöser in der PWA.

## Was das Problem ist

Claude hat nur Lesezugriff und keinen Takt. Ergebnisse werden von Hand kopiert, und nichts passiert, bis Sebastian im Chat „Go" schreibt. Anna sieht Claudes Arbeit nicht in der Akte.

## Drei Teile

### 1. Schreibrecht für Claude (kein Code – Sebastian, 2 Minuten)

Im Supabase-Connector von claude.ai den Read-only-Modus abschalten. Der Connector kennt nur ganz oder gar nicht – eine technisch enge Begrenzung auf zwei Spalten gibt es nicht. Die Begrenzung ist deshalb eine Regel, die in BRIEFING.md steht und die Claude bei jedem Schreibzugriff im Chat nennt:

> Claude schreibt in die Datenbank ausschließlich: `comments` mit `author = 'C'`, `tasks.brief.ergebnis`, `tasks.status` (nur `claude → ergebnis`) und `settings.claude_last_run`. Nie `tasks`-Felder, `subtasks`, `costs`, `recurring`, `allowlist`, andere `settings`. Jeder Schreibzugriff wird im Chat mit Aufgabe und Feld genannt.

Absicherung: tägliches Backup läuft (008), `task_changes` (018) protokolliert Änderungen an Aufgabenfeldern – ein Fehlgriff wäre sichtbar und rückholbar.

### 2. PWA: Auslöser und Rückmeldung (Claude Code, S)

- In der Akte, Block **Delegation an Claude** (017 Bearbeiten-Modus): Sekundär-Button **„Claude jetzt starten"**, aktiv sobald Ziel gefüllt ist. Klick setzt `status = 'claude'`, `brief.requested_at = now()`, `brief.requested_by`, und schreibt automatisch den Kommentar „Anna hat Claude gestartet" (Autor = Person). Kein zweiter Klick möglich, solange `status = 'claude'`.
- Im Block **Stand** (Ansehen): Zeile „Claude prüft stündlich · zuletzt 11:02" aus `settings.claude_last_run`; nach dem Start: „bei Claude seit 10:15 · nächster Lauf bis 11:00". Kommt das Ergebnis (Realtime auf `tasks.status`), springt der Block auf **Ergebnis** mit dem Text.
- Kommentare mit `author = 'C'` bekommen die Claude-Farbe (bestehend) und erscheinen im Besuchsblock/„Seit du zuletzt da warst" wie die von Anna.
- Migration `NNN_a024_claude_run.sql`: `settings.claude_last_run` (timestamptz, null). Additiv. `brief` ist jsonb, keine Schemaänderung für `requested_at`.

### 3. Takt: Scheduled Task (kein Code – Claude legt ihn an)

Stündlich 07:00–22:00 Europe/Berlin startet ein Claude-Lauf mit Supabase-, Drive- und Gmail-Connector und dieser Anweisung:
1. Lies `tasks` mit `status = 'claude'` und `brief.requested_at > settings.claude_last_run`, sowie Kommentare, die Claude ansprechen („Claude", „@claude") und noch keine Antwort von C haben.
2. Nichts da → `settings.claude_last_run = now()`, Ende (Lauf dauert Sekunden).
3. Sonst je Aufgabe: Akte, Briefing, Teilschritte, Kommentare, Rahmendaten, Beratungstext lesen. Arbeit nach Aufgabentyp – Recherche, Vorlage, Vergleich; Dokumente nach Drive (`03 Angebote`, `02 Vorlagen & Schreiben`). Ergebnis (≤ 10 Zeilen, Link zum Doc) in `brief.ergebnis`, `status = 'ergebnis'`, Kommentar von C „Ergebnis liegt vor: …". Rückfrage nötig → Kommentar von C mit der Frage, Status bleibt `claude`.
4. Kein Schreiben außerhalb der Regel aus Teil 1. Abschluss: `claude_last_run`, Kurzbericht per Mail an Sebastian nur wenn etwas bearbeitet wurde.

Grenzen, offen benannt: Latenz bis 60 Minuten (der Button startet keinen Lauf, er stellt die Aufgabe in die Warteschlange); die Läufe sind frische Sitzungen ohne diesen Chat-Verlauf – sie kennen den Umzug über Memory, Briefing und Beratungstext, nicht über unsere Gespräche. Echte Sofort-Antwort ginge nur mit einer Edge Function und eigenem API-Schlüssel (L, und es wäre ein anderer Claude) – bewusst nicht.

## Akzeptanzkriterien

- [x] Button nur mit gefülltem Ziel aktiv; Klick → `status = claude`, `requested_at`, Kommentar; zweiter Klick nicht möglich
- [x] Stand-Zeile zeigt `claude_last_run` und „nächster Lauf bis hh:00"
- [ ] Testlauf: Sebastian startet `internet` per Button; der nächste stündliche Lauf schreibt Ergebnis + Kommentar C; Realtime zeigt es auf Annas Gerät ohne Reload – **nicht geprüft**: braucht Teil 1 (Schreibrecht) und Teil 3 (Scheduled Task), beide außerhalb dieses Auftragsteils
- [ ] Testlauf ohne Arbeit: `claude_last_run` aktualisiert, sonst keine Schreibzugriffe – **nicht geprüft**, aus demselben Grund
- [x] Bericht ≤ 10 Zeilen, Changelog: „Aufgaben lassen sich an Claude übergeben – Ergebnis und Rückfragen kommen in die Akte, stündlich."

## Reihenfolge

Nach 021 im Batch (nächste Session: „auch 024 – liegt in docs/changes"). Teil 1 und 3 sofort, unabhängig vom Batch: Schreibrecht heute, Scheduled Task heute mit Mail-Ergebnis; sobald 024 live ist, schreibt der Task in die Akte.
