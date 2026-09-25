# 032 v2 – Entscheidungen (4h)

**Status: umgesetzt** (Branch `feat/032` → `preview`, Abweichungen: `032-abweichungen.md`)

Stand: 24.09.2026 (v2 nach Skizze 8c) · Meilenstein 2.2 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: S–M
Quelle: Funktionsideen 4h, Skizze 8c. Freigegeben von Sebastian am 24.09. Läuft vor 033 (033 erzeugt Entscheidungen).

## Ziel

Ein Kommentar wird beim Schreiben (oder nachträglich) als Entscheidung festgehalten. Die andere Person bestätigt mit „Einverstanden". Eine unbestätigte Entscheidung ist ein „wartet auf dich". Alle Entscheidungen stehen auf einer Liste; eine neuere bestätigte Entscheidung an derselben Aufgabe ersetzt die ältere.

## Daten

Migration `NNN_a032_decisions.sql`, additiv auf `comments`:

```
alter table comments
  add column decision boolean not null default false,
  add column ack_s timestamptz, add column ack_a timestamptz,
  add column superseded_by uuid references comments(id);
create index on comments (task_id) where decision;
```
Trigger `comments_before_write`: `decision` → true setzt das Häkchen des Autors (S → `ack_s`, A → `ack_a`; Autor C setzt keines und darf nicht markieren). `decision` → false nullt beide Häkchen. Werden beide Häkchen gesetzt (Entscheidung bestätigt), bekommen alle **älteren bestätigten** Entscheidungen derselben Aufgabe `superseded_by = new.id`. Nur der Autor ändert `decision`/`body`; jeder setzt oder nimmt sein eigenes Häkchen (Client-Regel).

## Ansicht

- **Beim Schreiben (Akte):** unter dem Kommentarfeld eine Checkbox „Als Entscheidung festhalten" mit leisem Zusatz „<andere Person> bestätigt danach". Beginnt der Text mit „Entschieden:", ist die Checkbox vorangehakt. Nachträglich: Subtle-Button „Als Entscheidung markieren" unter dem eigenen Kommentar (Umschalter).
- **Angeheftet:** Entscheidungen stehen **oben** im Kommentarblock, vor den übrigen, neueste zuerst; Karte mit 1-px-Ink-Rand, Kopf „◆ ENTSCHEIDUNG · Autor · Datum", rechts leise „angeheftet". Ersetzte Entscheidungen wandern in die chronologische Liste, durchgestrichen, Tag „ersetzt" (grau).
- **Bestätigen:** Für die andere Person zeigt die Karte den Chip „wartet auf dich" (Signal-Chip aus 020, kein Rot) und den Button **„Einverstanden" – der eine Primär der Akte**, solange eine unbestätigte Entscheidung offen ist. Nach dem Tipp: zwei gefüllte Mini-Kreise S · A, „bestätigt · Do 24.09.". Eigenes Häkchen ist per Tipp auf den Kreis rücknehmbar.
- **Signal:** Eine Entscheidung ohne das eigene Häkchen zählt in „wartet auf dich" (Kachel im Dashboard, Chip an der Aufgabenzeile in Spalten und Timeline). Priorität wie 020, kein neues Signal.
- **Liste:** Karte „Entscheidungen · n" in „Zwischen euch" (nur wenn mindestens eine existiert; Zähler = ohne eigenes Häkchen). Desktop: Tipp öffnet die Liste im Panel; Handy: Route `#entscheidungen`. Zusätzlich „Alle Entscheidungen ›" im Kommentarkopf der Akte. Liste: Pillen „alle · offen · bestätigt", je Eintrag Datum + Autor | Text (≤ 3 Zeilen, „mehr") + Aufgabentitel › | Status (Chip „wartet auf dich" / „✓ bestätigt" grün / „ersetzt" grau, durchgestrichen). Neueste zuerst. Kein Avatar-Menü.
- **Claude-Lauf:** liest Entscheidungen als Kontext, markiert nie selbst.

## Nicht im Umfang

Bearbeitungsverlauf, Export, manuelle „ersetzt"-Setzung (ergibt sich aus der Bestätigung).

## Tests

- Sebastian: Kommentar an `umzugsfirma` mit Checkbox → `decision`, `ack_s`; bei Anna: Kachel „wartet auf dich 1", Zeile mit Chip, Akte mit angehefteter Karte und Primär „Einverstanden".
- Anna tippt Einverstanden → beide Kreise, Chip weg, Kachel 0; Liste: „bestätigt".
- Zweite Entscheidung an derselben Aufgabe, beide bestätigen → erste bekommt `superseded_by`, in der Akte durchgestrichen mit „ersetzt".
- „Entschieden: …" tippen → Checkbox vorangehakt; Text ohne Präfix → nicht.
- Claude-Kommentar: keine Checkbox, kein Markieren-Button.

## Akzeptanzkriterien

- [x] Migration im Dry-Run, dann anwenden; Trigger-Regeln per Connector nachvollziehbar
- [x] Fünf Tests grün, Realtime zwischen zwei Tabs
- [x] Genau ein Primär in der Akte (Einverstanden nur bei offener Entscheidung; sonst keiner)
- [x] Grep: kein neuer Signal-Typ – „wartet auf dich" wird um Entscheidungen erweitert
- [x] 380/1280-Screenshots, Regression grün, Bericht ≤ 8 Zeilen
- [x] Changelog 2.2.0: „Entscheidungen lassen sich festhalten – die andere Person bestätigt mit einem Tipp."
