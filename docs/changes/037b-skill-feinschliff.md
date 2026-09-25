# 037b – Skill-Feinschliff: Login-Tests aus `.env`, Startzeitstempel

Stand: 25.09.2026 · Status: in Umsetzung (Merge, Lauf und Live-Prüfung stehen noch aus, siehe `037b-abweichungen.md`) · Release 2.2 · Branch: `chore/037b` von `preview` · Modell: Sonnet · Aufwand: S
Anlass: 032b lief nur simuliert („Login mit echtem Passwort nicht möglich"), 032 tags zuvor mit echten Logins – das darf nicht vom Zufall abhängen. Kein Changelog, kein Release.

## Änderungen

1. **Testkonten in `.env`** (gitignored, wie der Service-Key): `TEST_EMAIL_S`, `TEST_PW_S`, `TEST_EMAIL_A`, `TEST_PW_A`. Sebastian trägt sie ein (Anweisung im Bericht: welche vier Zeilen). `SETUP.md` erwähnt sie in einem Satz. Nie ins Repo, nie in Berichte, nie in Screenshots.
2. **`/auftrag`, Schritt 5:** Tests, die einen Login verlangen, laufen mit den Konten aus `.env` (Playwright, zwei Kontexte = zwei Personen). Fehlen die Variablen: Test im Bericht als **„nicht getestet – Testkonten fehlen"** markieren, nie als grün, nie als „simuliert" ohne dieses Wort. Schreibtests weiterhin vorher ansagen und danach mit Nachweis aufräumen (rules/tests.md).
3. **Startzeitstempel:** `/auftrag` schreibt beim Start `Start: <ISO-Zeit>` in `docs/changes/<NNN>-abweichungen.md` und berechnet die Ist-Laufzeit am Ende daraus. `/release` ebenso.
4. **Reviewer:** prüft zusätzlich, ob ein Test als grün gemeldet ist, der laut Abweichungsliste nur simuliert war → Lücke.

## Tests

- `.env` ohne Testkonten → Bericht enthält „nicht getestet – Testkonten fehlen" für jeden Login-Test.
- `.env` mit Testkonten → Login-Test läuft real in zwei Kontexten, Nachweis (Abfrage) im Bericht, Testdaten entfernt.
- Abweichungsliste hat `Start:`-Zeile, Bericht die berechnete Laufzeit.

## Akzeptanzkriterien

- [ ] Drei Tests grün; Grep: keine Passwörter außerhalb `.env` (keiner der drei end-to-end grün, siehe Abweichungen: Test 1 nur als Regel bestätigt – 037b hat selbst keinen Login-Test, der das an einem echten Bericht zeigen könnte; Test 2 „nicht getestet – Testkonten fehlen“, die vier `.env`-Zeilen fehlen lokal; Test 3 zur Hälfte, die Ist-Laufzeit folgt im Bericht. Grep auf Passwörter: grün. Offene Punkte: Test 2 braucht die vier `.env`-Werte von Sebastian; Test 1 braucht zusätzlich einen künftigen Auftrag mit einem echten Login-Test)
- [ ] Merge preview, kein Changelog, kein Release; Bericht mit Run-Nummer und Live-Version preview (folgt in Schritt 7/8, noch nicht geschehen)
