# 030 – Verhalten: Signale, Kacheln, Spalten, Betrag als Aktion, Plausibilität

**Status: umgesetzt** (Abweichungen: `030-abweichungen.md`)

Stand: 24.09.2026 · Release 2.1 · Branch: `feat/030` von `preview` (nach 014d) · Modell: Sonnet · Aufwand: S–M
Sechs Punkte aus dem Desktop-Check 24.09., von Sebastian am 24.09. aus dem Freeze freigegeben. Enthält eine CLAUDE.md-Änderung (Punkt 2, freigegeben).

## Änderungen

1. **„Claude unterstützt" verschwindet aus den Meta-Zeilen.** Seit dem Inhaltspaket haben alle 68 Aufgaben Beratung – das Merkmal unterscheidet nichts. Der Signal-Chip „Claude" (020) deckt Delegation ab; die Meta-Zeile nennt Claude nur noch bei `status in (briefing, claude, ergebnis)` mit dem Zustand: „Briefing offen" · „bei Claude" · „Ergebnis da". Der Beratungsblock in der Akte bleibt unverändert.
2. **Fristkritisch = Frist in ≤ 7 Tagen** (bisher 14). CLAUDE.md-Zeile anpassen: „Gelb nur für fristkritisch: Frist in höchstens 7 Tagen." Gilt für Datum-Chips, Kachel „n fristkritisch", Spaltenköpfe, Akte-Chip („in 14 Tagen" ist dann nicht mehr gelb). Überfällig bleibt rot, unabhängig davon.
3. **„Zwischen euch"-Kacheln nur mit Inhalt.** Sind alle drei Werte 0: statt der Kachelreihe eine leise Zeile „Zwischen euch ist nichts offen." (`--ink-3`, 14 px). Sobald ein Wert > 0 ist, erscheinen alle drei Kacheln wie bisher (Positionen stabil).
4. **Fünf Spalten sichtbar.** Phasen-Ansicht zeigt immer alle fünf Spalten: Grid `repeat(5, minmax(280px, 1fr))`, ab ~1.500 px ohne Scrollen; darunter horizontal scrollbar mit sichtbarer Leiste und einem Verlauf am rechten Rand als Hinweis. Kein Verstecken von 4 und 5. Mit offenem Akte-Panel gilt dasselbe für die verbleibende Breite.
5. **Betrag ist die Aktion.** In der Postentabelle (≥ 900 px) entfällt der Button „Betrag festlegen": die Betrag-Zelle ist klickbar und öffnet die 016b-Bearbeitung; „≈" bleibt der Hinweis auf geschätzt, Hover unterstreicht. Die Aktionsspalte behält nur Zustandswechsel: „Bezahlt" bei festen Posten, „Erhalten" bei Rückflüssen. Geschätzte Zeilen haben keinen Button (Leiter geschätzt → fest über den Betrag, fest → bezahlt über den Button). „Als Nächstes zahlen" behält seine drei Buttons. Unter 900 px unverändert.
6. **Rahmendaten prüfen sich selbst.** Leise Hinweiszeilen (`--ink-2`, kein Rot, kein Gelb) unter dem Rahmendaten-Block, in Lesen und Ändern:
   - Umzugstag vor Einzug (Schlüssel): „Umzug vor der Schlüsselübergabe – Vorab-Schlüssel mit dem Vermieter vereinbart?"
   - Auszug (S oder A) vor Umzugstag: „Auszug Sebastian vor dem Umzug – Übergabe der Altwohnung vor dem Umzugstag?"
   - Einzug = Tag nach Auszug: „Kein Überlappungstag – Übergabe und Einzug direkt nacheinander."
   Mehrere Hinweise untereinander, jeder einzeilig. Heutiger Stand (28.12. / 31.12. / 01.01.) löst den ersten aus.

## Tests

- Aufgabe mit `status = claude` → Meta „bei Claude"; Aufgabe ohne Delegation → keine Claude-Nennung in der Meta-Zeile.
- Frist in 10 Tagen → kein Gelb; in 6 Tagen → Gelb; Kachel „n fristkritisch" zählt entsprechend (heute deutlich unter 18).
- Alle drei Kennzahlen 0 → eine Zeile; Kommentar von Anna anlegen (Connector) → drei Kacheln.
- 1280 px: fünf Spalten mit sichtbarer Scrollleiste und Verlauf; 1920 px: fünf Spalten ohne Scrollen.
- Postentabelle: Klick auf „≈ 4.725 €" öffnet Bearbeitung; geschätzte Zeile ohne Button; feste Zeile mit „Bezahlt".
- Rahmendaten heute → genau ein Hinweis (Umzug vor Schlüssel); Umzugstag auf 02.01. → kein Hinweis; zurück auf 28.12.

## Akzeptanzkriterien

- [x] CLAUDE.md-Zeile geändert, sonst keine weitere CLAUDE.md-Änderung
- [x] Grep: kein „Claude unterstützt" mehr im Code
- [x] Sechs Tests grün, Rahmendaten-Werte am Ende wie vorher (per Connector prüfbar)
- [x] 380 px: Punkte 1–3 und 6 wirken, 4–5 nicht
- [x] Regression grün, Bericht ≤ 10 Zeilen; Changelog-Zeile (in 2.1.0): „Weniger Gelb, weniger Buttons, alle Phasen im Blick – und die Rahmendaten sagen, wenn etwas nicht zusammenpasst."
