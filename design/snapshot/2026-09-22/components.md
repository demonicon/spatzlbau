# Komponenten-Inventar – Ist-Stand der Live-App

Stand 22.09.2026, Build `b815103`. Maße sind die tatsächlich gerenderten Werte; Screenshots in
`screens/`. Alles steckt in `app.css` und wird von `app/views/dashboard.js`, `app/ui/task.js` und
`app/ui/detail.js` als HTML-String erzeugt – es gibt keine Komponentenbibliothek, nur CSS-Klassen.

---

## 1. Kennzahl-Kachel (`.tile`, `.kpi-open`, `.owner`)

Die zehn Kacheln sind der einzige Filtermechanismus: eine Kachel ist ein Button mit `aria-pressed`,
genau eine kann aktiv sein, erneutes Tippen hebt den Filter auf.

| | |
|---|---|
| **Zustände** | normal · aktiv (2 px Unterstrich in `--ink`) · Wert 0 (Zahl in `--ink-3`) · Warnzustand (Fristkritisch: Zahl auf `--mark`; Überfällig: Zahl in `--danger`) |
| **Maße** | Handy/Tablet ≥ 64 px hoch, Desktop ≥ 72 px; Padding 10/12/8 px; Fugen 1 px (`--line` als Rasterhintergrund) |
| **Aufbau** | Zahl (`--fs-tile` 24 px, Ziffernblock mit −4 px Versatz, damit die Markierfarbe bündig sitzt) über Beschriftung (`--fs-micro` 12 px) |
| **Text-Beispiel** | „48 Offen“ · „16 Diese Woche · Sebastian“ · „4 Bei Claude · am Zug 0“ · „15 Fristkritisch“ · „1 Überfällig“ |
| **Besonderheit** | Owner-Kacheln (Sebastian/Anna/gemeinsam) tragen die Owner-Farbe als Fläche. Am Handy sind sie Chips in der Zeile der Kachel „Offen“, ab 900 px vollwertige Kacheln (`display: contents` auf dem Wrapper). Die grauen Unterzeilen („· am Zug 0“) sind am Desktop ausgeblendet. |

## 2. Phasen-Tab (`.tabs [role=tab]`)

| | |
|---|---|
| **Zustände** | aktiv (fett, 2 px Unterstrich) · inaktiv (`--ink-2`) · am Handy horizontal scrollbar, ab 600 px fünf gleich breite Tabs ohne Scrollen |
| **Maße** | ≥ 44 px hoch, Padding 8/10/10 px, ab 600 px Raster „Nummer | Name“ mit Zähler in der zweiten Zeile |
| **Aufbau** | kleine Phasennummer (`--fs-micro`, `--ink-3`), Kurzname (`--fs-ui` 15 px), Zähler „n offen“ bzw. bei aktivem Filter nur „n“ |
| **Text-Beispiel** | „3 Umzug vorbereiten · 14 offen“ |
| **Dazu** | Gate-Text darunter (`.gate-text`, `--fs-small`, `--ink-2`): „Gate: Transport gebucht, gepackt, Halteverbot steht“ |

## 3. Gate-Leiste (`.gates` / `.gate`)

| | |
|---|---|
| **Zustände** | laufende Phase (Beschriftung in `--ink`) · gewählte Phase (2 px Unterstrich) · vollständige Phase (Balken in `--ok` statt `--ink`) |
| **Maße** | fünf gleiche Segmente, ≥ 44 px hoch, Balken 6 px, Lücke 4 px |
| **Aufbau** | „1 · 0/8“ (`--fs-micro`) über dem Fortschrittsbalken; Klick wählt die Phase |
| **Besonderheit** | am Handy unter dem Countdown, ab 600 px rechts daneben in derselben Zeile |

## 4. Aufgabenzeile (`.task`)

Die zentrale Komponente. Raster `44px 1fr`: Häkchen links, Titel + Meta rechts.

| | |
|---|---|
| **Zustände** | offen · erledigt (Titel `--ink-3`, durchgestrichen) · blockiert (Titel `--ink-2`, Häkchenrahmen `--line`) · ausgewählt (nur ≥ 900 px: 3 px Balken links in `--ink`, Fläche `--card`) · geöffnet (< 900 px: Akte direkt darunter) |
| **Maße** | Häkchen-Tap-Ziel 44 × 44 px, Kästchen 22 px; Titel ≥ 44 px Tap-Höhe, Zeilenhöhe 1.35; Trennlinie 1 px |
| **Aufbau** | Titel (`--fs-body` 16 px, lange Titel brechen um) · Meta-Zeile mit Owner-Chip, Fälligkeit, „n/m Teilschritte“, „n Kommentare“, Claude-Tag, „wartet auf …“, „blockiert: …“ (auf 34 Zeichen gekürzt, „+1“ für weitere) |
| **Text-Beispiel** | „Umzugsunternehmen: Angebote einholen und buchen“ / gemeinsam · bis 06.11. · 0/5 Teilschritte · Claude · Briefing offen · blockiert: Grundriss neue Wohnung + Möbelplan… |

## 5. Owner-Chip (`.own`)

| | |
|---|---|
| **Zustände** | S (blau) · A (pflaume) · B (grün) · C (ocker, nur als Kommentarautor) |
| **Maße** | 12 px Text, Padding 1/7 px, Radius 4 px |
| **Text-Beispiel** | „Sebastian“, „Anna“, „gemeinsam“ |

## 6. Status-Tag und Fälligkeit (`.tag`, `.due`)

| | |
|---|---|
| **Varianten** | `.tag` neutral mit Rahmen („Claude unterstützt“, „wartet auf Anna“) · `.tag.claude` ockerfarben („Claude · Briefing offen“) · `.tag.block` rahmenlos in `--ink-3` („blockiert: …“) |
| **Fälligkeit** | normal (`--ink-2`) · fristkritisch (Fläche `--mark`, fett) · überfällig (`--danger`, fett) |
| **Text-Beispiel** | „bis 06.11.“ · „heute“ · „morgen“ · „überfällig seit 19 Tagen“ · ohne Einzugstermin „≈ 8 Wochen vorher“ |

## 7. Akte (`.detail`) – Abschnitte in fester Reihenfolge

Identisch am Handy (inline unter der Zeile) und am Desktop (im Panel). Abschnittsüberschriften sind
12 px, versalien, mit 1-px-Linie in `--ink` darunter.

| Abschnitt | Inhalt | Zustände |
|---|---|---|
| **Aufgabe** | Titelfeld, Zuständig, Typ, Wartet auf, Offset-Tage, Häkchen „fristkritisch“ | immer |
| **Hängt ab von** | Chips mit ✓ bei erledigten Blockern, „+ Abhängigkeit wählen …“ | Chips nur wenn vorhanden, sonst „keine“ |
| **Teilschritte** | Liste mit Häkchen (44 px Tap-Ziel), Löschen-×, Eingabefeld + „Hinzufügen“ | leer / mit Einträgen; alle erledigt ⇒ Aufgabe wird automatisch abgehakt |
| **Delegation an Claude** | nur bei Typ „an Claude delegiert“: Zustandsbalken (6 Schritte), „Jetzt dran: ihr/Claude“, drei Textfelder (Ziel, Kontext, Ergebnis), Aktionsbutton | sechs Zustände, siehe `flows.md` |
| **Beratung** | fünf klappbare Felder (Ziel & warum jetzt, Ablauf, Was ihr braucht, Rechtslage, Stolperfallen) mit „Bearbeiten“ | leer (kursiver Platzhalter, „(leer)“ im Titel) / gefüllt; am Desktop aufgeklappt, am Handy zu |
| **Kommentare** | Liste mit Autor + Zeit, Claude-Kommentare auf `--claude-bg`; Textfeld „Kommentar als Sebastian“ | leer / mit Einträgen |
| **Fuß** | „Kommentar speichern“ + „Aufgabe löschen“ mit Inline-Bestätigung („Wirklich löschen? Ja/Nein“ auf `--danger-bg`) | normal / Bestätigung offen |

## 8. Panel-Kopf (`.panel-head`, nur ≥ 900 px)

| | |
|---|---|
| **Zustände** | mit Aufgabe („Phase 3 · Umzug vorbereiten“ links, × rechts) · leer (Platzhalter „Aufgabe wählen“, mittig, `--ink-3`, kein Rahmen) |
| **Maße** | Kopf ≥ 52 px; Panel 340–440 px breit, klebt oben (`sticky`), scrollt eigenständig bis 100 vh; 1 px Trennlinie zur Liste |

## 9. Statuszeile (`.status`)

| | |
|---|---|
| **Zustände** | „verbinde …“ → „Live“ · „Speichern …“ · „gespeichert 13:20 · Live“ · Fehler (rot, z. B. „Speichern fehlgeschlagen: …“) · Update-Hinweis („Neue Version – neu laden“ als Button, 44 px) |
| **Maße/Ort** | 12 px, rechtsbündig, in der Kopfzeile neben der Person-Pille |

## 10. Person-Pille (`.who`)

| | |
|---|---|
| **Zustände** | S oder A – nicht klickbar, zeigt die Login-Identität |
| **Maße** | ≥ 44 px, Initiale als 32-px-Kreis in der Owner-Farbe, Rahmen 1,5 px, vollrund |
| **Text-Beispiel** | „S Sebastian“ |

## 11. Fußzeile (`.foot`)

| | |
|---|---|
| **Aufbau** | Versionsnummer als Button (mit „Neu“-Punkt, solange ungelesen) · „Neu laden“ · rechts „Abmelden“ |
| **Maße** | 13 px, Tap-Ziele 44 px, 1 px Trennlinie oben, Safe-Area unten |
| **Text-Beispiel** | „2026.09.22.3 NEU · Neu laden · Abmelden“ |

## 12. Changelog-Panel (`.changelog`)

| | |
|---|---|
| **Zustände** | geschlossen · manuell geöffnet (alle Versionen) · automatisch geöffnet (nur ungelesene Versionen, einmal pro Person) |
| **Maße** | Karte über der Fußzeile, Padding 12/14 px, Überschrift 18 px; pro Version Datum (12 px, `--ink-3`), Titel (15 px fett), Abschnitte „Neu“/„Verbessert“/„Behoben“ (12 px versal) mit Aufzählung (15 px) |
| **Text-Beispiel** | „2026.09.22.3 – Am Computer: Liste und Aufgabe nebeneinander“ |
| **Schließen** | Button „Schließen“, Escape oder Tippen außerhalb – setzt die gelesene Version pro Person in der Datenbank |

## 13. Weitere Elemente

| Element | Kurz |
|---|---|
| **Countdown** (`.hero`) | 60-px-Zahl + „Tage bis zur Schlüsselübergabe“; ohne Termin „Termin offen“ (34 px) mit Datumsfeld darunter |
| **Filter-Chip** (`.filter-chip`) | schwarze Pille „Filter: Fristkritisch ×“ + „n in dieser Phase“ |
| **Neue Aufgabe** (`.addbox`) | gestrichelter Kasten am Listenende: Titel, Zuständig, Typ, Wochen vorher/danach, „kritisch“, Button |
| **Login** (`.card`) | E-Mail, Passwort mit „Anzeigen“-Schalter, „Anmelden“ – ohne jeden Zusatztext (Auftrag 001b) |
| **Toast** | schwarzer Balken unten, 2,8 s, z. B. „Alle Teilschritte erledigt – Aufgabe abgehakt“ |
