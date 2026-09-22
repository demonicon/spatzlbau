# Änderungsauftrag 002 – Abweichungsliste

Stand: 13.09.2026 · Branch `feature/dashboard` · Quelle: `design/handoff/2026-09-13/Umzug App.dc.html` + PDF
Screenshots (380 px, Vollseite): `docs/changes/002-screenshots/01-standard.png`, `02-filter-fristkritisch.png`, `03-phase-2.png`, `04-ohne-einzugstermin.png`

## 1. Technisch nötige Abweichungen vom Design

| Design-Element | Gebaut | Grund |
|---|---|---|
| Schrift „Instrument Sans“ per Google-Fonts-Link | Systemschrift-Stack (`"Instrument Sans", "Avenir Next", "Segoe UI", Roboto, …`) – Instrument Sans wird genutzt, falls lokal installiert | Kein externer Request beim Laden; Google Fonts wäre ein Tracking-/Abhängigkeitsrisiko und im PWA-Shell-Cache nicht enthalten |
| Person-Chip als Button „Person wechseln“ (⇄, „wechseln zu Anna“) | Person-Chip ist nicht klickbar; rechts daneben die Statuszeile, „Abmelden“ in der Fußzeile | Im Prototyp war die Person ein Schalter; in der App ist sie die Login-Identität. Ein Wechsel wäre ein Logout |
| Kopfzeile ohne App-Namen | Ebenso – im eingeloggten Zustand kein Titel „Spatzlbau“ mehr; der Name bleibt auf Login-Screen und Browser-Tab | Design gewinnt; Statuszeile und Person-Chip identifizieren die Sitzung |
| Kachel „In Arbeit“ mit Unterzeile „bei Claude n, wartet n“ | Zwei Kacheln „Bei Claude · am Zug n“ und „Wartet auf jemanden · auf mich n“ | Auftrag §3 verlangt beide als eigene Filter; Unterzeilen tragen die Zusatzzahlen des Designs |
| Keine Kachel „Diese Woche“; ohne Filter zeigt das Design alle Aufgaben der Phase | Sechste Kachel „Diese Woche · Sebastian/Anna“, beim Öffnen aktiv | Auftrag §5 verlangt den Standardfilter als Kachel oder Chip; im Design gibt es keinen – Kachel gewählt, damit das 2-Spalten-Raster gerade bleibt (6 Kacheln + Offen-Zeile) |
| Filterwechsel springt in die erste Phase mit Treffern (`setFilter` im Prototyp) | Phase bleibt stehen; die Tab-Zähler zeigen, wo Treffer liegen | Auftrag §4: aktiver Tab bleibt beim Filterwechsel erhalten |
| Tabs zeigen Kurzname + „n offen“ (bei Filter: Treffer), keine Nummer | Wie Design, zusätzlich die kleine Phasennummer vor dem Namen | Auftrag §4 nennt „Nummer, Name, Zähler erledigt/gesamt“; erledigt/gesamt steht bereits in der Gate-Leiste direkt darüber, deshalb im Tab nur die Nummer ergänzt und der Design-Zähler beibehalten. **Entschieden im Review zu 006 (22.09.2026): bleibt so** |
| Gate-Leiste: kein „Gate-Punkt“, der Füllbalken wird grün, wenn die Phase komplett ist | Wie Design (Balken grün bei komplett) | Auftrag §2 spricht von einem gefüllten Gate-Punkt; das Design hat keinen – Design gewinnt (§6c-Regel analog) |
| Kurze Phasennamen in den Tabs („Verträge lösen“, „Umzugstag“) als Konstante im Prototyp | `seed.json` Phasen um `short` ergänzt (Version 2), landet per Seed-Merge in `settings.phases`; ohne `short` fällt der Tab auf den vollen Namen zurück | `seed.json` ist die einzige Quelle für Phasen; keine Namensliste im Frontend |
| Einzugstermin nur als Text „Einzug · Fr., 1. Januar 2027“ | Text ist ein Button, der ein Datumsfeld ein-/ausklappt; ohne Termin ist das Feld immer sichtbar | Der Termin muss in der App änderbar sein; das Design zeigt keine Eingabe |
| Eigenes Checkbox-Markup (`<button role="checkbox">` mit Kästchen-Span) | Natives `<input type="checkbox">`, per CSS auf das Design-Kästchen (22 px, grün mit ✓) gezeichnet | Native Semantik/Tastatur ohne Zusatz-JS; sieht identisch aus |
| Untere Navigationsleiste „Phasen · Finanzen · Person“ | Entfällt; stattdessen Fußzeile mit Version, Neu laden, Seed aktualisieren, Abmelden | Mit nur einem Screen wäre die Leiste leer; Finanzen kommt in einem eigenen Auftrag (Abschnitt 3) |
| Kein Stern zum Umschalten „fristkritisch“ in der Liste | Stern aus der Zeile entfernt (wie Design); „fristkritisch“ ist als Häkchen in der Akte editierbar | Funktion darf nicht wegfallen (Auftrag „unverändert“), Design zeigt sie nicht in der Zeile |
| Aufgabe hinzufügen fehlt im Design | Eingabebox am Listenende der aktiven Phase (bestehende Funktion, Design-Tokens); bei Filter „Bei Claude“ als Claude-Aufgabe vorbelegt | Auftrag „unverändert“: Aufgabe hinzufügen und „Neue Claude-Aufgabe“ bleiben erreichbar |
| Seitenbreite: Spalte max. 440 px mit Rand links/rechts, auch am Desktop | Übernommen | Design ist reine Handy-Spalte; am Desktop bleibt es dadurch eine Handy-Ansicht in der Mitte |

## 2. Design-Lücken (selbst entschieden)

| Zustand | Lösung |
|---|---|
| Leerer Filter in der Phase | „Nichts in diesem Filter.“ in der Liste; Chip mit „0 in dieser Phase“; Tab-Zähler zeigen Treffer der anderen Phasen |
| Kein Einzugstermin | Hero „Termin offen“ (34 px statt 60 px Zahl) mit Zeile „Einzugstermin eintragen, dann zählt die App“, Datumsfeld direkt darunter; Fälligkeiten relativ („≈ 14 Wochen vorher“); Kachel Überfällig = 0, Fristkritisch zählt alle offenen kritischen |
| Einzugstermin heute / vergangen | „Heute · ist Schlüsselübergabe“ bzw. „n Tage seit der Schlüsselübergabe“ |
| Alle Aufgaben erledigt | Gate-Balken aller Phasen grün, „100 % erledigt“, alle Zähler 0 (grau), Liste ohne Filter zeigt die erledigten Aufgaben durchgestrichen |
| Sehr langer Aufgabentitel | Umbruch mit `overflow-wrap: anywhere`, Zeile wächst; „blockiert: …“ kürzt den Blocker-Titel auf 34 Zeichen mit „…“ |
| Ladezustand | Screen „Lade …“ bis Session, Person und Daten da sind; Realtime-Status „verbinde …“ → „Live“ in der Statuszeile |
| Fehler beim Speichern / Verbindung weg | Statuszeile rot mit Meldung („Speichern fehlgeschlagen: …“, „Keine Live-Verbindung – Seite neu laden“), Toast „Nicht gespeichert – bitte nochmal versuchen“, lokaler Stand wird vom Server neu geladen |
| Aufgabe angelegt, die der aktive Filter ausblenden würde | Filter wird aufgehoben und die neue Aufgabe geöffnet, damit sie nicht „verschwindet“ |
| Owner-Chips (Sebastian/Anna/gemeinsam) bei 380 px | Umbruch auf zwei Zeilen innerhalb der Offen-Kachel (Design zeigt eine Zeile bei schmaleren Zahlen) |
| Aktiver Owner-Chip | 2-px-Rahmen in der Owner-Farbe (`aria-pressed`), wie der `outline` im Prototyp |
| Kachel-Unterzeilen „am Zug n“ / „auf mich n“ | Grau, umbrechen bei Bedarf in eine zweite Zeile; Kachelhöhe wächst mit |
| Fristkritisch **und** überfällig | Nur Rot (überfällig gewinnt, wie `isCritical` im Prototyp); Kachel Fristkritisch zählt solche Aufgaben nicht doppelt |
| „Diese Woche“ genaue Definition | Offen, Owner ich oder gemeinsam, nicht blockiert, nicht gerade bei Claude (Zustände go/recherche/arbeit) **oder** `wait_on` = ich. Damit ist „Wartet auf mich“ (§6b) enthalten |
| „Bei Claude“ genaue Definition | Alle offenen delegierten Aufgaben (auch im Briefing), Unterzeile zählt, wie viele davon bei Claude liegen (go/recherche/arbeit) |
| „Wartet auf jemanden“ genaue Definition | `wait_on` gesetzt oder Claude-Zustand rueckfragen/ergebnis (Prototyp-Logik) |
| Gemerkte Phase existiert nicht mehr / erstes Öffnen | Erste Phase mit offenen Aufgaben |
| Akte („Aufgabe“-Detail) | Unverändert in Funktion, nur Tokens übernommen (eckige Kanten, Design-Trennlinien, Zustandsbalken der Delegation wie im Handoff) |

## 3. Bewusst nicht umgesetzt (über den Dashboard-Screen hinaus)

| Handoff-Element | Status |
|---|---|
| Screen „Aufgabe“ als eigener Vollbild-Screen mit „← Phasen“, leichter Akte (keine Editierfelder, Beratung nur bei Inhalt) | Nicht umgesetzt – Auftrag schließt die Akte aus; kommt mit der UX-Runde „leichte Akte“ (BRIEFING §9, Punkt 2) |
| Screen „Finanzen“ (Budget, Ist, Rückflüsse, Saldo, Kostenzeile je Aufgabe) | Nicht umgesetzt – eigener Auftrag; braucht Datenmodell (Kosten je Aufgabe), Rückfrage an Sebastian |
| Untere Navigation mit Tab „Finanzen“ | Entfällt bis Finanzen existiert |
| Demo-Daten des Prototyps (Kommentare von „Claude“, Rückfragen, Beispiel-Briefings) | Nicht übernommen – echte Daten kommen aus Supabase |
| Hover-Unterstreichung des Titels (`style-hover`) | Übernommen (CSS `:hover`), kein eigener Punkt |

## Bestätigungen zu §6

- (a) „Neue Claude-Aufgabe“: erreichbar über die Eingabebox am Listenende (Typ „an Claude delegiert“), bei aktivem Filter „Bei Claude“ vorbelegt und als Claude-Button.
- (b) „Wartet auf mich“: Teilmenge von „Wartet auf jemanden“ (Unterzeile „auf mich n“) und im Standardfilter „Diese Woche“ enthalten.
- (c) Gelber Im-Blick-Kasten: im Design nicht vorhanden – Kachel „Fristkritisch“ (gelbe Zahl) plus gelbe Fälligkeit in der Zeile.

## Prüfstand (Claude Code, headless Chrome 380 px)

- Alle Kacheln, Owner-Chips, Gate-Segmente und Tabs durchgeklickt, Akte geöffnet, Datumsfeld auf-/zugeklappt, Seed-Dialog geöffnet/abgebrochen: keine Konsolenfehler, keine Ausnahmen.
- Alle interaktiven Elemente ≥ 44 px hoch (gemessen).
- Realtime „Live“ nach dem Laden; Login unverändert.
- Offen (Sebastian): Handy-Check laut Auftrag; Entscheidung zu den Tab-Zählern (Abschnitt 1).
