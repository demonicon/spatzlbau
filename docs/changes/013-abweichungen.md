# Auftrag 013 – Abweichungsliste und Entscheidungen

Stand: 22.09.2026 · Branch `feature/audit-fixes` · Teil A mit Opus 5, Teil B mit Sonnet.
Screenshots: `docs/changes/013-screenshots/`.

## 1. A1 – Kacheln: Variante B gewählt (vier Kacheln + eigene Kosten-Zeile)

Beide Varianten gebaut und bei 380 × 700 gemessen:

| | Variante A (fünf Kacheln) | **Variante B (vier + Zeile)** |
|---|---|---|
| Screenshot | `a1-kacheln-a-380.png` | `a1-kacheln-b-gewaehlt-380.png` |
| Kachelbreite | 68 px | 85 px |
| Beschriftung | „Fristkritisch" bricht mitten im Wort um | alle Beschriftungen einzeilig |
| erste Aufgabenzeile endet bei | 613 px | 652 px |

Beide halten das Akzeptanzkriterium (erste Zeile über der Falz). **Gewählt ist B**, aus zwei Gründen:

1. Bei 380 px passt in eine 68-px-Kachel kein deutsches Wort wie „Fristkritisch" – es bricht mitten im Wort. 85 px reichen.
2. Die vier Kacheln sind **Filter**, die Kosten-Zeile ist ein **Link in eine andere Ansicht** (bewusste Ausnahme von „Kennzahl = Filter", vermerkt in `007-abweichungen.md`). In Variante A sehen beide gleich aus und tun Verschiedenes; in B sieht man den Unterschied. Das ist dieselbe Regel, die A6 für die Fußzeile aufstellt: was wie ein Bedienelement aussieht, ist eins – und umgekehrt.

Variante B gilt auf allen Breiten, nicht nur am Handy: zwei Fassungen desselben Blocks wären zwei Code-Wege ohne Gewinn.

## 2. A1 – das Suchfeld bleibt über den Kacheln

Der Auftrag listet das Suchfeld zwischen Kacheln und Phasen-Chips auf. Auftrag 012 hat es bewusst „im Kopf … über den Kacheln, immer sichtbar" verankert, und A1 sagt dazu nur „bleibt sichtbar". Es steht deshalb weiter direkt unter dem Kopf. Kompakter und leichter ist es wie gefordert: 40 px hoch, ohne Kasten, nur eine Linie unten.

Die 40 px sind **kleiner als die sonst geltenden 44 px** Tap-Ziel – so steht es im Auftrag. Das Feld ist über die volle Spaltenbreite tippbar (346 × 40 px), also gut zu treffen.

## 3. A1 – Gate-Leiste 30 px statt 44 px

„Höhe halbiert" heißt hier: die Segmente sind 30 px hoch (vorher 44 px), Balken 6 px, die Zahl darüber 11 px; der Zähler steckt im Tooltip und im `aria-label`. Damit unterschreitet dieses eine Element die 44-px-Regel. Vertretbar, weil jedes Segment 66 px breit ist **und** dieselbe Funktion (Phase wählen) direkt darunter als 44-px-Chip liegt. Wer die Phase filtern will, hat ein volles Tap-Ziel – die Leiste ist die Anzeige dazu.

## 4. A1 – „wartet auf dich" steht im Besuchsblock vorn, nicht hinten

Der Auftrag sagt „Warnfarbe nur beim letzten". Bei 380 px scrollt die Chip-Zeile seitlich, und der letzte Chip liegt außerhalb des Bildschirms – ausgerechnet der, der die Person betrifft. Er steht deshalb **vorn** und ist als einziger farbig. Die Farbregel bleibt, die Reihenfolge nicht.

*(Seit 013b N2 ist der Chip nicht mehr rot, sondern fett mit Umriss – siehe Abschnitt 11.)*

## 5. A2/A3 – die Spaltenzahl richtet sich nach dem Platz, nicht nach einer Stufe

Der Auftrag nennt für ≥ 1180 px drei Spalten mit `minmax(320px, 1fr)`. Fest drei Spalten würden bei 1180 px überlaufen: neben dem 420 px breiten Panel bleiben 760 px, drei Spalten bräuchten 960. Die Spalten stehen deshalb in `repeat(auto-fit, minmax(320px, 1fr))` – der Browser nimmt so viele, wie hineinpassen:

| Fenster | Panel | Liste | Spalten |
|---|---|---|---|
| 900–1179 px | Overlay statt Panel | volle Breite | 2 |
| 1180–1379 px | 420 px | 760 px | 2 |
| 1440 px | 432 px | 1008 px | 3 à 335 px |
| 1920 px | 576 px | 1224 px | 3 à 407 px |

Gemessen bei 1920: Spalten 407 px (≥ 380 gefordert), Panel 576 px (≤ 600), Rand je Seite 60 px = 3 % (≤ 15 % gefordert).

Zeilenlänge im Panel: begrenzt auf 72 Zeichen für Kommentare, Beratungstexte und Hinweise – nicht für die Felder, sonst stünden Eingaben schmal in einer breiten Spalte.

## 6. A3 – Nachtrag in `006-abweichungen.md`

Die Entscheidung aus 006 („stilles Panel, damit nichts springt") gilt seit 013 erst ab 1180 px. Zwischen 900 und 1179 px kommt die Akte als Overlay von rechts. Der Nachtrag steht in `006-abweichungen.md`.

## 7. A5 – zwei Texte anders als vorgeschlagen

- Leerer Bereich: „**Alles erledigt – nächste Fälligkeit am 15.10.2026**" wie gefordert. Steht ein Filter oder eine Suche an, heißt es stattdessen „Nichts in dieser Auswahl." bzw. „Kein Treffer in diesem Bereich." – „Alles erledigt" wäre dort schlicht falsch.
- Kein Suchtreffer: der Auftrag schlägt „Kein Treffer für ‚…' – vielleicht in einem Teilschritt?" vor. Die Suche **durchsucht die Teilschritte bereits** (012), die Rückfrage würde also in die Irre führen. Umgesetzt ist derselbe Satz als Aussage: „**Kein Treffer für ‚…' – auch nicht in den Teilschritten.**" Damit weiß die Person, wo überall gesucht wurde.

## 8. A6 – so gebaut wie beschrieben (und damit ist 013b N1 erledigt)

Avatar-Kürzel, zwei Inline-SVG-Icons (Haus, Münze) mit gefülltem aktivem Zustand, gleicher Kopf in der Finanzansicht, „Finanzen" raus aus der Fußzeile, Version als reiner Text, Changelog hinter ⓘ mit dem Neu-Punkt, „Neu laden" nur noch als Leiste. Das ist die **Zwei-Icon-Fassung** – der Nachtrag `013b` N1 verlangt genau diese und gilt damit als erfüllt.

Zwei Details, die der Auftrag offen lässt:
- Das Haus schließt auch eine offene Akte (Home ist ein Reset, sonst bliebe `#task=…` in der Adresse stehen).
- „10 % erledigt" bleibt am Handy sichtbar (eigene Zeile unter dem Countdown). Es kostet 26 px und beantwortet die Frage „wie weit sind wir" ohne Rechnen.

## 9. B1 – Kästchen 7 mm bei Aufgaben, 5 mm bei Teilschritten

Der Auftrag nennt eine Größe. Ein 7-mm-Kästchen je Teilschritt macht das Blatt bei vier Teilschritten je Aufgabe unruhig und länger; die Teilschritte tragen deshalb 5 mm, die Aufgaben selbst 7 mm. Beides ist mit kalten Händen und Kugelschreiber zu treffen.

## 10. B5 – „nur eigene" ist eine Regel der Oberfläche

Die RLS erlaubt beiden Personen `update` und `delete` auf `comments` (Stand `schema.sql`, seit 002). Die Beschränkung auf eigene Kommentare steckt in der Oberfläche, nicht in der Datenbank. Keine Migration – der Auftrag verlangt keine, und eine engere Policy wäre eine Schema-Änderung, die Sebastian einspielen müsste. Wenn das gewünscht ist: eigener Auftrag.

## 11. 013b (Nachtrag, kam während der Umsetzung dazu) – umgesetzt

- **N1** (Kopfzeile, zwei Icons, Version als Text, Fußzeile): war mit A6 schon gebaut, Zwei-Icon-Fassung, unverändert übernommen.
- **N2** (Besuchsblock ohne Rot): umgesetzt. Der Chip „wartet auf dich" ist jetzt fett mit Umriss in Textfarbe, die aufgeklappte Zeile trägt einen Balken links statt einer roten Fläche. Die Kommentar-Chips tragen den Autoren-Punkt mit Initial.
- **N3** (Lade-Animation): umgesetzt. „Lade …" bleibt, darunter füllt sich die Gate-Leiste in 1,2 s von links nach rechts und leert sich wieder; bei „Bewegung reduzieren" stehen stattdessen drei Punkte.

**Was N2 nicht anfasst:** Die Aufgabenzeile trägt weiterhin ein rotes „wartet auf dich", die Spalte „Wartet auf mich" eine rote Trennlinie und die Akte ein rotes Band (alles aus 009). N2 nennt ausdrücklich nur den Besuchsblock. Wenn Rot überall allein der Überfälligkeit gehören soll, ist das ein eigener Auftrag – im Moment ist die Regel im Besuchsblock strenger als im Rest der Liste.

## 12. Was geprüft wurde

Alles im kopflosen Chrome bei 380 × 700, 1024 × 768, 1440 × 900 und 1920 × 1080, **ohne Login und ohne Datenbank**: jeder Supabase-Aufruf war durch einen Rekorder ersetzt, der am Ende zeigt, was die App hätte schreiben wollen – nichts davon hat die Seite verlassen.

- Teil A: **31 von 31** Prüfungen grün (alle Akzeptanzkriterien, dazu Feldhöhen, Chip-Sichtbarkeit, Spaltenbreiten, Overlay-Verhalten, Navigation, Update-Leiste).
- Teil B: **35 von 35** Prüfungen grün (Druck-DOM und echtes PDF, Kästchengrößen, Teilschritt-Bearbeiten/Löschen, Finanzen-Zurück, Autorenpunkte, Kommentare bearbeiten/löschen samt Zehn-Minuten-Grenze).
- Keine Konsolenfehler in beiden Läufen. Der Rekorder verzeichnete nur, was die Tests selbst ausgelöst haben (`subtasks`, `comments`, `allowlist` beim Öffnen einer Aufgabe).

**Nicht geprüft:** das echte Gerät. Ob die erste Aufgabenzeile auf Sebastians Handy wirklich über der Falz steht, hängt an der Adressleiste von iOS-Safari – 700 px ist die Rechengröße, nicht das Gerät.
