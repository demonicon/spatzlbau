# Änderungsauftrag 011 – Design Review mit Varianten

Stand: 22.09.2026 · Status: Teil A umgesetzt (PR offen), Teil B und C offen · Zwei Teile: Teil A Claude Code (Snapshot), Teil B Claude Design (Varianten), Teil C Review-Entscheidung (Sebastian + Anna + Claude Chat)

## Ziel

Die Live-App vollständig nach Claude Design zurückführen und dort drei Varianten entwickeln lassen, die sich in der Grundidee unterscheiden. Danach Entscheidung, welche Richtung (oder welche Mischung) als 009-Design umgesetzt wird.

## Teil A – Design-Snapshot der Live-App (Claude Code, Sonnet, ~20 Min.)

Ordner `design/snapshot/2026-09-22/` mit:

1. **Screenshots** aller Zustände bei 380 und 1280 px (768 nur Dashboard): Login, Dashboard Standardfilter, Dashboard mit aktivem Filter, Phase 2 offen, Akte leicht, Akte voll (Claude-Aufgabe mit Briefing), Panel leer, Changelog-Panel, Zustände "Termin offen" und "überfällig". Dateiname = Zustand.
2. **Tokens** als `tokens.md`: alle CSS-Variablen aus `app.css` mit Wert und Verwendung (welche Elemente nutzen `--ink-3`, wo taucht `--mark` auf).
3. **Komponenten-Inventar** `components.md`: Kachel, Tab, Aufgabenzeile, Owner-Chip, Status-Tag, Akte-Abschnitte, Panel-Kopf, Statuszeile, Fußzeile, Changelog-Panel – je: Zustände, Maße, Text-Beispiel.
4. **Flows** `flows.md`: Aufgabe öffnen → abhaken → kommentieren; Filter setzen → Chip schließen; Claude-Delegation von Briefing bis Ergebnis; Changelog-Auto-Anzeige.
5. **Bekannte Schwächen** `issues.md` – aus dem Konzept, nicht aus dem Code: Akte zu schwer für kleine Aufgaben; keine Benachrichtigung bei neuen Kommentaren; Kachel-Unterzeilen am Desktop ausgeblendet; zwei Kachelreihen; Gate-Text unter den Tabs.
6. **Live-Export** `index.html` + `app.css` (ohne JS-Logik), damit Claude Design den realen Aufbau importieren kann.

ZIP des Ordners für den Upload.

## Teil B – Varianten in Claude Design (Sebastian, ~1 Stunde)

Im bestehenden Projekt "Spatzlbau" ein neues File "Review 2026-09-22". Snapshot-ZIP hochladen. Prompt:

> Grundlage ist die laufende App im Snapshot – Tokens, Komponenten, Flows und Screenshots sind der Ist-Stand, nicht der alte Entwurf. Entwickle drei Varianten des Dashboards und der Akte bei 380 und 1280 px. Die Varianten unterscheiden sich in der Grundidee, nicht im Stil:
>
> **Variante A – Zeit zuerst.** Der Einzugstermin und die nächsten 14 Tage sind das Ordnungsprinzip. Aufgaben erscheinen auf einer Zeitachse nach Fälligkeit; Phasen sind sekundär. Kennzahlen: was ist diese Woche, was nächste, was überfällig.
> **Variante B – Personen zuerst.** Zwei Spalten "Ich / Du" (Sebastian, Anna) mit "gemeinsam" dazwischen. Jeder sieht auf einen Blick, was er tun muss und worauf der andere wartet. Kommentare und "wartet auf" stehen im Vordergrund; Phasen als Filter.
> **Variante C – Ruhe.** Das heutige Modell (Kennzahlen als Filter, Phasen als Tabs) bleibt, aber die Akte wird in zwei Gewichtsklassen geteilt: leicht (Titel, Frist, Teilschritte, Kommentar) und voll (mit Briefing und Beratung). Die Kachelreihe schrumpft auf das, was Entscheidungen auslöst. Ziel: weniger sichtbare Elemente bei gleicher Funktion.
>
> Für jede Variante: die vier Screens, plus ein Absatz, welche Nutzung sie besser macht und welche schlechter. Alle Varianten: eine Schriftfamilie, Highlighter-Gelb nur für Fristkritisches, Owner-Farben aus den Tokens, Kontrast ≥ 4,5:1 für Text, Tap-Ziele ≥ 44 px, keine Dialoge. In `issues.md` stehen bekannte Schwächen – jede Variante muss sagen, welche sie löst.

Iteration in Claude Design per Kommentar, bis jede Variante ihre Idee klar zeigt – nicht bis sie perfekt ist.

## Teil C – Review-Entscheidung

Export der drei Varianten als PDF. Review zu dritt:
- **Anna** am Handy, 15 Minuten, ohne Erklärung: welche Variante versteht sie ohne Hilfe? Das ist die einzige Frage an sie.
- **Sebastian** am Desktop: welche Variante macht Pflege (Kommentare, Kosten, Delegation) leichter?
- **Claude im Chat**: Screenshots hier einstellen; ich prüfe gegen das Konzept (Kennzahl = Filter, Warnfarben-Disziplin, Abhängigkeitsgraph sichtbar, Delegation nachvollziehbar) und benenne, was jede Variante am Konzept ändern würde.

Ergebnis: eine Richtung oder eine benannte Mischung ("B-Layout mit C-Akte"). Daraus wird das Design für 009 – Export als Handoff, Auftrag an Claude Code wie bei 002 und 006.

## Akzeptanzkriterien

- [ ] Snapshot-ZIP vollständig (Teil A, sechs Punkte)
- [ ] Drei Varianten mit je vier Screens und Begründungsabsatz
- [ ] Review-Ergebnis in `docs/changes/011-ergebnis.md`: gewählte Richtung, Begründung, was aus den anderen Varianten übernommen wird
- [ ] 009 wird auf dieser Basis geschrieben

---

## Teil A – Umsetzungsnotizen (Claude Code, 22.09.2026)

Ergebnis: `design/snapshot/2026-09-22/` + `design/snapshot/spatzlbau-snapshot-2026-09-22.zip` (3,9 MB, 27 Dateien).

- **Screenshots (20)** aus der Live-App (`https://demonicon.github.io/spatzlbau/`), eingeloggt als Sebastian, echte Daten (Einzug 01.01.2027, 48 offene Aufgaben). Dateiname = Zustand, Vollseiten-Aufnahmen bei 380 / 768 / 1280 px. Die Test-Aufgabe „test“ war bereits am 13.09. gelöscht (`deleted_at`) und taucht nirgends auf.
  - Für „Akte voll“ wurde das Briefing von `umzugsfirma` mit Beispieltext (Ziel + Kontext) gefüllt und direkt danach wieder geleert – in der Datenbank steht wieder `{}`.
  - Für „Termin offen“ wurde der Einzugstermin nur in der laufenden Seite ausgeblendet und anschließend per `loadAll()` aus der Datenbank zurückgeholt; nichts geschrieben.
- **`tokens.md`** aus `app.css` erzeugt: jede Variable mit Wert, Verwendungszweck, den tatsächlich betroffenen CSS-Regeln, dazu gemessene Kontrastwerte und die drei Breiten.
- **`components.md`** 13 Komponenten mit Zuständen, Maßen, Textbeispielen; **`flows.md`** vier Abläufe plus die nebenläufigen; **`issues.md`** wörtlich die fünf Punkte aus diesem Auftrag, ergänzt um die Liste der Eigenschaften, die jede Variante behalten muss.
- **Live-Export** `index.html`: das gerenderte DOM der eingeloggten App (Phase 3, Akte offen), Formularwerte als Attribute eingebacken, Skripte entfernt, dazu die unveränderte `app.css`. Gegengeprüft: rendert identisch zur Live-App.

**Entscheidung zur Veröffentlichung:** Im Repo liegen nur die fünf Textdokumente und `app.css`. Screenshots, `index.html` und ZIP sind in `.gitignore` – das Repo ist öffentlich und wird über GitHub Pages ausgeliefert, die Aufnahmen zeigen aber echte Kommentare und den Einzugstermin. Sebastian hat die Dateien direkt erhalten. Wenn der komplette Snapshot doch ins Repo soll: die drei Zeilen aus `.gitignore` entfernen.
