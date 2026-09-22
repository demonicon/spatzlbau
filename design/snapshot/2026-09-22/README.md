# Design-Snapshot der Live-App – 22.09.2026

Ist-Stand von https://demonicon.github.io/spatzlbau/ (Build `b815103`, Auftrag 011 Teil A).
Grundlage für die drei Varianten in Claude Design (Teil B). **Nicht der alte Entwurf vom 13.09.** –
seitdem sind Passwort-Login (001), Dashboard (002), Update-Hinweis (003), Changelog (005/005b),
Desktop-Layout (006) und die Härtung (008/008b) dazugekommen.

| Datei | Inhalt |
|---|---|
| `screens/` | 20 Screenshots, Dateiname = Zustand, Vollseite bei 380 / 768 / 1280 px |
| `tokens.md` | alle CSS-Variablen mit Wert, Verwendung, betroffenen Regeln, Kontrastwerten, Breiten |
| `components.md` | 13 Komponenten: Zustände, Maße, Textbeispiele |
| `flows.md` | vier Abläufe plus die nebenläufigen (Update, Termin, Anlegen, Löschen, Seed) |
| `issues.md` | fünf bekannte Schwächen aus dem Konzept + die Eigenschaften, die jede Variante behalten muss |
| `index.html` + `app.css` | statischer Export des gerenderten DOM (eingeloggt, Phase 3, Akte offen), ohne JS |

## Screenshots

Echte Daten, eingeloggt als Sebastian, Einzugstermin 01.01.2027 (101 Tage), 48 offene Aufgaben.

| Zustand | 380 | 768 | 1280 |
|---|---|---|---|
| Login | ✓ | | ✓ |
| Dashboard, Standardfilter „Diese Woche“ | ✓ | ✓ | ✓ |
| Dashboard mit aktivem Filter (Fristkritisch) | ✓ | | ✓ |
| Phase 2 offen | ✓ | | ✓ |
| Akte leicht (einfache Aufgabe, „Kartons“) | ✓ | | ✓ |
| Akte voll (Claude-Aufgabe mit ausgefülltem Briefing) | ✓ | | ✓ |
| Panel leer („Aufgabe wählen“) | | | ✓ |
| Changelog-Panel | ✓ | | ✓ |
| Termin offen (ohne Einzugstermin) | ✓ | | ✓ |
| Überfällig (Filter aktiv) | ✓ | | ✓ |

Hinweise zu zwei Aufnahmen: Für „Akte voll“ wurde das Briefing der Aufgabe „Umzugsunternehmen“
mit Beispieltext gefüllt und danach wieder geleert. Für „Termin offen“ wurde der Einzugstermin nur
in der laufenden Seite ausgeblendet, nichts in der Datenbank geändert.

## Live-Export

`index.html` ist das echte DOM der App, `app.css` die unveränderte Datei. Ohne JavaScript: Filter,
Tabs, Häkchen und Panel reagieren nicht, das Layout und alle Klassennamen stimmen aber mit der
Live-App überein. Breiten: ≤ 599 Handy, 600–899 Tablet, ≥ 900 zwei Spalten.

## Was im Repo liegt und was nicht

Im Git liegen nur die fünf Textdokumente – sie enthalten keine privaten Daten. **Screenshots,
`index.html` und das ZIP bleiben lokal** (`.gitignore`), weil das Repo öffentlich ist und über
GitHub Pages ausgeliefert wird: die Aufnahmen zeigen echte Kommentare und den Einzugstermin.
Sebastian hat die drei Teile direkt bekommen; das ZIP lädt er in Claude Design hoch.

Soll der komplette Snapshot doch ins Repo, genügt es, `design/snapshot/**/screens/`,
`index.html` und `*.zip` aus der `.gitignore` zu nehmen – dann sind sie allerdings öffentlich
abrufbar.
