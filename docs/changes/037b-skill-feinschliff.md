# 037b – Skill-Feinschliff: Login-Tests aus `.env`, Startzeitstempel

Stand: 25.09.2026 · Status: umgesetzt bis auf zwei offene Punkte für Sebastian (Testkonten, siehe `037b-abweichungen.md`) · Release 2.2 · Branch: `chore/037b` von `preview` (Merge c6e12fb) · Modell: Sonnet · Aufwand: S
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

- [x] Grep: keine Passwörter außerhalb `.env` – grün. Von den drei Auftrags-Tests ist nur Test 3 vollständig grün (siehe Abweichungen, Ist-Laufzeit 12m). Test 1 (nur die Regel geprüft – 037b hat selbst keinen Login-Test) und Test 2 („nicht getestet – Testkonten fehlen“) bleiben offene Punkte für Sebastian: Test 2 braucht die vier `.env`-Werte, Test 1 zusätzlich einen künftigen Auftrag mit echtem Login-Test
- [x] Merge preview (Commit c6e12fb), kein Changelog-Eintrag, kein Release; Run [36184344283](https://github.com/demonicon/spatzlbau/actions/runs/36184344283) grün, Live-Version `/preview/` unverändert 2.2.5 (kein Changelog-Eintrag laut Auftrag)
