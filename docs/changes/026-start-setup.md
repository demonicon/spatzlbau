# 026 – Gemeinsamer Start: Setup-Ablauf

Status: umgesetzt (Branch `feat/026-start-setup` → `preview`, Abweichungen in `026-abweichungen.md`)
Stand: 23.09.2026 · Meilenstein 2.0 · Ziel-Branch: `preview` · Modell: Sonnet · Aufwand: M
Setzt 016b voraus (die vier Finanz-Schritte werden wiederverwendet, nicht neu gebaut), 020 (Buttons), 022 (Abo-Links im Abschluss, optional). Ziel: **vor So 27.09. auf preview**, damit der Wochencheck der Durchlauf ist.

## Ziel

Alles, was am Anfang eingetragen werden muss, damit Fristen, Vorlagen und Finanzen stimmen, an einem Ort, in einer Reihenfolge, einmal – und danach jederzeit einzeln änderbar. Kein Wissen nötig, wo in der App welches Feld liegt.

## Grundsätze

- **Einmal geführt, immer editierbar.** Jeder Schritt schreibt in die bestehenden Felder (settings, recurring, costs, tasks). Später erreichbar über „Stammdaten & Rahmendaten" (neuer Eintrag im Avatar-Menü) – dieselben Schritte, einzeln aufrufbar, gleiche Bildschirme.
- **Unterbrechbar.** `settings.setup_step` merkt den Stand; Abbruch → beim nächsten Öffnen „Weiter bei Schritt n" als Zeile über der Liste, nicht als Sperre. Nichts blockiert die App.
- **Vorbelegt, wo wir es wissen.** Werte aus Seed/Teil B und Verträgen stehen drin; der Schritt bestätigt, tippt nicht ab.
- **Ein Primär-Button je Schritt (Weiter), Text „Überspringen".** Fortschritt „3 von 8" im Kopf. Beide Personen können denselben Ablauf sehen, gespeichert wird projektweit (nicht pro Person).
- Startet automatisch beim ersten Öffnen nach dem Deploy, solange `settings.setup_done` fehlt; danach nur über das Menü.

## Die acht Schritte

| # | Schritt | Inhalt | Schreibt |
|---|---|---|---|
| 1 | **Ihr beiden** | Vor-/Nachname, Handynummer je Person (für Vorlagen, Umzugsfirma, Halteverbot). E-Mails stehen (allowlist). | `settings.stammdaten.personen` |
| 2 | **Drei Wohnungen** | je alt S / alt A / neu: Straße, Etage, Aufzug ja/nein, Vermieter oder Hausverwaltung mit Adresse, Kündigungsfrist, Kaution, Kaltmiete + NK. Alt S/A vorbelegt aus den Verträgen. | `settings.stammdaten.wohnungen`; Kaution/Miete fließen in Schritt 4/5 |
| 3 | **Termine** | Einzug, Umzugstag, Auszug S, Auszug A | 016b §1 Schritt 1 |
| 4 | **Mieten** | alt S, alt A, neu – vorbelegt aus Schritt 2 | 016b §1 Schritt 2 (`recurring`) |
| 5 | **Kautionen** | alt S, alt A (Rückfluss), neu (fällig, Datum) – vorbelegt aus Schritt 2 | 016b §1 Schritt 3 (`costs`) |
| 6 | **Aufteilung & Puffer** | 50/50 oder Schlüssel, Puffer %, Haushaltskonto | 016b §1 Schritt 4 |
| 7 | **Startposten** | Liste der Kosten, die jetzt schon absehbar sind: Zeilen aus Teil B (seed_key, Stand geschätzt) plus Vorschläge, die noch fehlen. Je Zeile: Häkchen (übernehmen), Betrag editierbar, Aufgabe angezeigt. „Übernehmen" legt fehlende Zeilen an, hakt keine ab, löscht nichts – abgewählte Vorschläge bleiben einfach weg. | `costs` (geschätzt) |
| 8 | **Wer macht was** | Alle Aufgaben mit Zuständigkeit „gemeinsam", gruppiert nach Phase, je Zeile Segment S · gemeinsam · A. Vorbelegt mit dem Vorschlag aus `i2a-clean-cut.md` (9 bleiben B). „Vorschlag übernehmen" in einem Tipp, dann einzeln umstellen. | `tasks.owner` (per Person geändert → Trigger 018 protokolliert es) |

**Abschluss:** eine ruhige Seite: Antwortzahl aus Finanzen, die nächsten drei Fristen, Kalender-Abo-Links (022, wenn Token da), „Wochencheck sonntags 15 Minuten – Timeline zeigt, was ansteht". Primär **Los geht's** → Aufgaben-Home. `settings.setup_done = true`.

## Vorschlagsliste für Schritt 7 (Startwerte, alle editierbar)

Umzugsfirma ≈ 1.500 · Halteverbot 3 × ≈ 150 · Kartons & Material ≈ 180 · Elektriker Herd ≈ 150 · Bidet-Montage ≈ 250 · Renovierung Altwohnungen ≈ 500 · Nachsendeauftrag 2 × 31,90 · Kaution neu (Betrag aus Schritt 2) · Transportversicherung ≈ 80 · Schlüssel/Zylinder neu ≈ 60. Teil B liefert dieselben Zeilen mit `seed_key`; die Liste zeigt, was schon da ist, und ergänzt nur.

## Daten

`settings.setup_done` (bool), `settings.setup_step` (int), `settings.stammdaten` (jsonb: personen[], wohnungen{s,a,n}). Migration `NNN_a026_setup.sql`, additiv. Stammdaten-Doc im Drive (Teil B) bleibt als lesbare Kopie; die App ist die Quelle, das Doc wird beim Wochencheck einmal abgeglichen (später: Export-Button, Backlog).

## Nicht in diesem Auftrag

Export der Stammdaten als Doc · Import aus Vertrags-PDF · Onboarding pro Person (Tour durch die Ansichten) – Anna lernt die App am Sonntag am Gerät, nicht per Tour.

## Akzeptanzkriterien

- [x] Leere `setup_done` → App öffnet Schritt 1; „Überspringen" auf jedem Schritt; Abbruch bei Schritt 4 → beim nächsten Öffnen Zeile „Setup fortsetzen (Schritt 4 von 8)", App sonst normal
- [x] Schritt 2 vorbelegt mit beiden Altverträgen (Adressen, Vermieter, Kaution 2.910/2.040, Miete 1.150+200 / 700+150)
- [x] Schritte 3–6 sind die Bildschirme aus 016b, kein zweiter Code
- [x] Schritt 7: vorhandene Seed-Zeilen erscheinen als vorhanden (kein Duplikat nach „Übernehmen"), abgewählte Vorschläge werden nicht angelegt, Beträge editierbar
- [x] Schritt 8: „Vorschlag übernehmen" setzt 38 Zuständigkeiten in einem Durchgang, 9 bleiben gemeinsam; Trigger schreibt `task_changes` mit `changed_by` = Person (per Migration 011, ungeprüft ohne DB – siehe Abweichungen)
- [x] Menü „Stammdaten & Rahmendaten": jeder Schritt einzeln aufrufbar, Werte änderbar, keine Wiederholung des ganzen Ablaufs
- [x] Abschlussseite zeigt Antwortzahl > 0 und drei Fristen; danach `setup_done`, kein erneuter Start
- [x] 380 px + 1280 px, Bericht ≤ 15 Zeilen, Changelog: „Beim ersten Start fragt die App alles, was sie zum Rechnen braucht – in acht Schritten, jederzeit änderbar."
