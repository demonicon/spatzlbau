# 037b – Abweichungen und Entscheidungen

Stand: 25.09.2026 · Branch `chore/037b` → `preview` · Aufwand S · Status: in Umsetzung (Merge, Lauf und Live-Prüfung stehen noch aus)
Start: 2026-09-25T20:01:42Z

## Umsetzung

1. **Testkonten in `.env`:** `.env.example` um die vier Zeilen `TEST_EMAIL_S`, `TEST_PW_S`,
   `TEST_EMAIL_A`, `TEST_PW_A` erweitert (leer, wie die übrigen Platzhalter). `SETUP.md` Abschnitt 6
   erwähnt sie in einem Satz. Sebastian trägt die echten Werte lokal in `.env` ein (Anweisung im
   Bericht) – nie ins Repo, nie in Berichte, nie in Screenshots.
2. **`/auftrag`, Schritt 1:** hält jetzt `Start: <ISO-Zeit>` in `docs/changes/<NNN>-abweichungen.md`
   fest (Datei bei Bedarf neu anlegen), sobald die eine passende Auftragsdatei gefunden ist.
3. **`/auftrag`, Schritt 5:** Login-Tests laufen mit den vier `.env`-Konten (Playwright, zwei
   Kontexte = zwei Personen). Fehlen die Variablen: im Bericht **„nicht getestet – Testkonten
   fehlen"**, nie grün, nie „simuliert" ohne dieses Wort.
4. **`/auftrag`, Schritt 8 / `/release`, Schritt 10:** Bericht nennt die aus dem Startzeitstempel
   berechnete Ist-Laufzeit statt einer Schätzung.
5. **`/release`:** neuer Schritt 1 „Startzeit merken" (kein `docs/changes/<NNN>-*.md` vorhanden, da
   ein Release mehrere Aufträge bündeln kann – die Zeit steht nur im eigenen Bericht, siehe
   Abweichung unten).
6. **Reviewer (`.claude/agents/reviewer.md`):** neuer Prüfpunkt (d) – ist ein Test in der
   Abweichungsliste als nur simuliert oder als „nicht getestet – Testkonten fehlen" markiert, im
   Auftrag oder Bericht aber als grün/bestanden (`[x]`) gemeldet, ist das eine Lücke, unabhängig
   davon, ob die Einschränkung irgendwo als Randbemerkung steht.

## Entscheidungen im Zweifel

1. **Wohin schreibt `/release` den Startzeitstempel?** Der Auftrag sagt nur „ebenso", nennt aber
   kein Ziel-Dokument – anders als `/auftrag` hat `/release` keine feste `docs/changes/<NNN>-*.md`
   (ein Release kann, wie gerade eben 2.2.5, mehrere Aufträge bündeln). Entscheidung: `/release`
   merkt sich die Startzeit nur für den eigenen Bericht (Schritt 1 „Startzeit merken", letzter
   Schritt berechnet daraus die Ist-Laufzeit), ohne eigene Abweichungsdatei anzulegen. Wer die
   Laufzeit dauerhaft nachlesen will, findet sie im Chat-Bericht des jeweiligen `/release`-Laufs.
2. **Playwright ist nicht installiert und wird in diesem Auftrag nicht ergänzt.** `037b` ändert nur
   die Skill-/Agent-Texte, die künftige `/auftrag`-Läufe anleiten; ob und wie ein Login-Test in
   einem späteren Auftrag Playwright dazu braucht, entscheidet dieser spätere Auftrag – das wäre
   dann eine neue Abhängigkeit mit Rückfrage nach `CLAUDE.md`. Diese Nennung im Skill-Text ist daher
   nur die Anleitung fürs nächste Mal, keine Installation jetzt.

## Tests

037b hat keinen eigenen Login-Test – die drei Auftrags-Tests lassen sich deshalb innerhalb dieses
Auftrags nicht vollständig end-to-end zeigen, nur die neue Regel bzw. ihr erster Teil. Ehrlich
getrennt, keiner der drei ist zum Zeitpunkt dieser Review (Schritt 6) vollständig grün:

| # | Prüfung (laut Auftrag) | Stand zum Zeitpunkt der Review |
| --- | --- | --- |
| 1 | „`.env` ohne Testkonten → Bericht enthält ‚nicht getestet – Testkonten fehlen' für jeden Login-Test" | **nur die Regel geprüft, nicht der Bericht**: `.env` hat aktuell kein `TEST_*` (`grep -oE '^[A-Z_]+' .env`), und `/auftrag` Schritt 5 verlangt für diesen Fall wörtlich diesen Satz. Ein echter Bericht mit einem Login-Test, der das zeigt, existiert in 037b nicht |
| 2 | „`.env` mit Testkonten → Login-Test real, zwei Kontexte, Nachweis im Bericht" | **nicht getestet – Testkonten fehlen** (die vier Variablen sind lokal nicht gesetzt) |
| 3 | „Abweichungsliste hat `Start:`-Zeile, Bericht die berechnete Laufzeit" | **teilweise**: Diese Datei trägt oben `Start: 2026-09-25T20:01:42Z`, genau nach dem neuen Verfahren geschrieben (dieser Teil grün) – die daraus berechnete Ist-Laufzeit steht erst im Chat-Bericht nach dem Merge (Schritt 8), zum jetzigen Zeitpunkt also noch offen |
| 4 | `npm run check` (Regression, nicht Teil der drei Auftrags-Tests) | grün (`check ok`) |
| 5 | Grep: keine Passwörter außerhalb `.env` (Regression, nicht Teil der drei Auftrags-Tests) | grün – `.env.example`, `SETUP.md`, `.claude/**` enthalten nur Variablennamen, keine Werte |

Test 3 wird mit dem Chat-Bericht dieses Auftrags vollständig grün (die Ist-Laufzeit steht dort).
Test 2 braucht die vier `.env`-Werte von Sebastian, dann ist er in einem künftigen Login-Test
nachholbar. Test 1 braucht zusätzlich einen künftigen Auftrag mit einem echten Login-Test – die
vier `.env`-Werte einzutragen würde an Test 1 nichts ändern, der setzt gerade `.env` **ohne**
Testkonten voraus (siehe Auftrag). Beides ist für Sebastian ein offener Punkt (siehe
Akzeptanzkriterien im Auftrag).
