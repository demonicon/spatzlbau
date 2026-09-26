# 038 – Abweichungen

Start: 2026-09-26T09:19:21+02:00

## Klärungen im Plan-Stopp (26.09., vor Block 1)

Vier Fragen aus der Erkundung, von Sebastian im Plan-Stopp beantwortet:

1. **Panel 400 ab 900 px (#7)?** → *Overlay bleibt bis 1179.* Konsequenz: Panel 400 fest erst
   ab 1180 px, dazwischen weiter der Overlay aus 013 A3. Damit weicht die Umsetzung von #7 in
   einem Punkt ab: **das ✕ entfällt nur im Panel** (≥ 1180). Im Overlay bleibt es – sonst käme
   man dort nicht mehr heraus.
2. **`app/**/*.js` nicht größer als heute?** → *Messwert, kein Abbruchgrund* (siehe Messungen).
3. **Geist ohne Kursive?** → *Kursive raus.* `.brief-read p.none` („keine Angabe" in der
   Beratung) ist jetzt grau statt kursiv – die einzige Kursiv-Regel der App.
4. **Changelog-Version?** → *2.3.0, Release-Gruppe „2.3"* (Titel der Gruppe: „Seitensystem").

## Entscheidungen im Zweifel

1. **Geist kommt als eine variable woff2 statt als drei Schnitte** (Zeile 0 nennt „nur drei
   Schnitte als woff2, ≈ 3 × 30–60 kB"). Google liefert Geist ausschließlich variabel – für 400,
   600 und 700 dieselbe Datei. Die latin-Datei ist **29,4 kB für den ganzen Bereich** und damit
   unter dem Budget der drei Schnitte, bei einem Request statt dreien. Die Bedingung der Zeile
   ist im Ergebnis übererfüllt, im Wortlaut nicht: statt drei Dateien eine.
   Offen für Sebastian: nur zur Kenntnis, oder soll es wirklich drei statische Schnitte sein?
2. **`--bg` ist nicht neu** (E7 nennt es „Neue Fläche"). Das Token existierte schon mit exakt
   `#F3F3F3` und war der Grund außerhalb der Spalte; die App-Fläche war bereits `--paper`. E7 ist
   damit keine neue Farbe, sondern eine neue *Verwendung* – umgesetzt wie beschrieben
   (Sektionsköpfe, „Als Nächstes zahlen"-Kopf, gewählte Zeile, Segment-Hülle). Kontrastmatrix in
   `029c-kontrast.md` erweitert: kein Fund, alle Text-Tokens über 4,5:1 auf `--bg`.
3. **`--fs-section` (18/600) ergänzt.** Der Export lässt die Rolle „Sektionskopf" in seiner
   Typo-Tabelle ausdrücklich ohne Token-Namen („–"), E10 verlangt aber Tokens statt nackter
   Werte. Beides zusammen geht nur mit einem Namen.
4. **Nicht jeder nackte `font-size` ist umgezogen.** Umgezogen wurden alle Werte, die exakt auf
   der Skala liegen, plus die Komponenten, die 038 ohnehin neu baut (Kopf, Kacheln, Antwortzahl,
   Zeilen). Off-Skala-Werte in Bauteilen, die 038 nicht anfasst (Login-Karte, Druckbogen,
   Setup-Karten, Glyphen wie Chevron und Haken), stehen weiter als px da. Vollständig wird das
   mit 038b, wenn diese Bauteile an die Reihe kommen.
5. **„Zwischen euch" ist entfallen.** #7 verlangt, dass das Panel ohne eigene Auswahl die erste
   Zeile zeigt. Damit hat der Block „Zwischen euch" (018 §5) keinen Platz mehr. Seine drei
   Zähler stehen jetzt in den Filter-Pillen über der Liste (#5), die Entscheidungs-Karte war
   seit 032b ohnehin nur noch ein Link auf die eigene Seite. **Das ist eine sichtbare Wegnahme** –
   abgehakt ist #7, nicht ausdrücklich das Ende von „Zwischen euch".
6. **Zeile min 56 / max 78 (#6):** gemessen 63 bis 78 px in den Spalten (vorher 56 bis 91). Die
   Untergrenze liegt bei 63 statt 56, weil das Häkchen seine 44 px Tap-Fläche behält (Regel 014)
   und die Zeile damit nicht unter 62 px fallen kann, ohne das Tap-Ziel zu verkleinern.
7. **Segment: 44 Tap, 40 sichtbar (E3).** Die weiße Fläche der gewählten Stufe liegt als Schicht
   im 44er Knopf, statt den Knopf auf 40 zu verkleinern.
8. **Login-Tests laufen nach dem Merge gegen `/preview/`.** Angesagt vor Block 2 (siehe unten).
   Lokal (`localhost`) ist `ui.preview` falsch, dort würden `last_seen_version`, `last_visit_at`
   und `seen_comments` echt geschrieben. Deshalb: alles ohne Login lokal mit simuliertem Zustand,
   die acht Tests des Auftrags nach dem Merge auf dem Vorschau-Pfad.

## Ansage Schreib-/Login-Test (`rules/tests.md`)

Vor Block 2 angesagt: Anmeldung mit den Testkonten aus `.env` (`TEST_EMAIL_S`/`TEST_PW_S`,
`TEST_EMAIL_A`/`TEST_PW_A`, zwei Kontexte) gegen **`https://demonicon.github.io/spatzlbau/preview/`**.
Dort schreibt die App den Lesestand nicht (`ui.preview`-Guards in `app/state.js`). Alles vorher
lief ohne Login gegen einen lokalen Server mit simuliertem Zustand (nur `state`/`ui` gesetzt,
keine Supabase-Schreiboperation).

## Offen für Sebastian

- **`BRIEFING.md` ist an vier Stellen überholt** (Zeilen 88, 92, 96, 108: Nav-Pillen, Akte inline
  am Handy, die Breiten-Tabelle, das Anfragen-Layout). Die „Definition of Done" verlangt das
  Nachziehen, `CLAUDE.md` verlangt für `BRIEFING.md` eine ausdrückliche Bestätigung. Deshalb hier
  gemeldet statt geändert – auf „ja" ziehe ich die vier Absätze nach.
- Entscheidung 1 (eine variable Schriftdatei statt drei Schnitten) und Entscheidung 5 („Zwischen
  euch" entfällt) sind die beiden Punkte, die von der abgehakten Liste abweichen.
