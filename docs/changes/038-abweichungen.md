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
9. **`--fs-hero-s` (44 px) ergänzt** für die Antwortzahl am Handy – der Export zeigt dort 44
   statt 60, und E10 verlangt Tokens statt nackter Werte in den neuen Bauteilen.

## Ansage Schreib-/Login-Test (`rules/tests.md`)

Vor Block 2 angesagt: Anmeldung mit den Testkonten aus `.env` (`TEST_EMAIL_S`/`TEST_PW_S`,
`TEST_EMAIL_A`/`TEST_PW_A`, zwei Kontexte) gegen **`https://demonicon.github.io/spatzlbau/preview/`**.
Dort schreibt die App den Lesestand nicht (`ui.preview`-Guards in `app/state.js`). Alles vorher
lief ohne Login gegen einen lokalen Server mit simuliertem Zustand (nur `state`/`ui` gesetzt,
keine Supabase-Schreiboperation).

## Nach dem Review nachgetragen (26.09.)

Der Reviewer hat 22 Lücken gemeldet; behoben sind alle, die eine Funktion oder eine Regel
verletzten. Die folgenden Punkte bleiben als bewusste Abweichung stehen:

- **#23, Zeilen des Vergleichs.** Export-Soll nennt „Preis · Laufzeit · Leistung · Einmalig".
  Die Tabelle zeigt weiter sieben Zeilen (zusätzlich Art, Gültig bis, Plus/Minus, Quelle). Grund:
  „Einmalig" gibt es im Datenmodell nicht, und die vier zusätzlichen Zeilen tragen echte Daten,
  die Claude schreibt – sie wegzulassen hieße, sie unsichtbar zu machen. Das Datenmodell darf
  dieser Auftrag nicht ändern. **Entscheidung für Sebastian:** so lassen oder in 038b nachziehen.
- **E9 unter 900 px.** Rechenweg und Mini-Balken fehlen am Handy – genau so zeigt es der Export
  in „Dashboard 380" (Antwortzahl 44, danach direkt die Kacheln). Keine Abweichung vom Export,
  nur von seinem Text, der beides ohne Breitenangabe nennt.
- **„news" und „du wartest" sind aus der Oberfläche verschwunden.** #5 nennt für die Pillen
  genau vier Werte (alle · überfällig · fristkritisch · wartet auf dich). Die beiden anderen
  Signale aus 018 §3 hatten ihren einzigen Einstieg über die Kacheln und über „Zwischen euch" –
  beides ist mit #5 und #7 weg. **Das ist die zweite sichtbare Wegnahme** neben „Zwischen euch"
  selbst (die frühere Fassung dieser Datei behauptete, alle drei Zähler stünden in den Pillen –
  das stimmte nicht, nur „wartet auf dich" steht dort).
- **Das Zahldatum in der Akte verliert die Jahreszahl.** `detail.js` hatte drei eigene
  Datumsformatierer, einer davon mit Jahr („bezahlt 23.09.25"). #3 lässt nur drei Formate zu
  (Kurzform in Listen, laufender Text in Kopf und Panel, Monat für Monat); die vierte Form fällt
  damit weg, die Zeile liest sich jetzt „bezahlt 23.09.". Betroffen: bezahlt/erhalten/fällig in
  der Kostenzeile der Akte.
- **„Hinzufügen" ist jetzt sekundär.** Die neue Regel („der Primär lebt im Panel, nie in der
  Liste") lässt für einen gefüllten Knopf in der Aufgabenliste keinen Platz. Die Ausnahme aus
  032b #1 (Hinzufügen wird sekundär, sobald die Akte einen Primär zeigt) ist damit hinfällig.

## Messungen (Klärung 1)

| Messwert | vorher (`preview`) | nachher (`feat/038`) |
|---|---|---|
| `app/**/*.js` gesamt | 7.040 Zeilen | 7.568 Zeilen (+528) |
| `app.css` | 1.325 Zeilen | 1.453 Zeilen (+128) |
| Render-Funktionen je Seitentyp | 4 eigene Ansichten mit eigenem Kopf, Panel und Rückweg | 2 Seitentypen (`pages/listPanel.js`, `pages/dashboard.js`) für 6 Ansichten |
| `renderHeader()`-Aufrufer | 4 | 0 (die Shell rendert den Kopf einmal) |
| `innerHTML =` je Routenwechsel | 1× die **ganze** Seite inklusive Kopf | 1× nur der Inhaltscontainer; im laufenden Betrieb 0 (der Diff patcht Knoten) |
| Mutationen bei einem fremden Kommentar | ganze Seite ersetzt | **2** (die betroffene Zeile, die „Seit du zuletzt da warst"-Zahl); Kopf: 0 |
| Zeilenhöhe in den Spalten (#6) | 56–91 px | 63–78 px |
| Konsole auf sechs Routen | – | leer (in einem frischen Tab geprüft) |

**Die Zeilenzahl ist gestiegen, nicht gefallen** (Klärung 1 wollte „nicht größer als heute";
Sebastian hat das im Plan-Stopp zum Messwert erklärt). Grund: 038 darf die Duplikate nicht
entfernen, die 038b entfernt – die neun Tabellen, dreizehn Leertexte und zwei Editor-Hüllen
stehen unverändert da, und die zwei Seitentypen, die Shell, der Zeichen-Diff, die Leiter und die
Mini-Balken kommen dazu. Abgezogen wurden immerhin `renderHeader`, „Zwischen euch", die
Signal-Kacheln, die Personen-Umschaltung, das `fin-grid` und die Aufschlüsselungs-Zeilen.

## Offen für Sebastian

- **Test 8 wörtlich gelesen schlägt fehl.** Das Kriterium sagt „Liste+Panel-Seiten genau einen
  (im Panel)". Mit „Hinzufügen" als Sekundär zeigen Aufgaben und Entscheidungen im Normalfall
  **keinen** Primär – einen gibt es erst, wenn die Akte einen anbietet („Einverstanden",
  „Fertig", „An Claude senden"). Das folgt der Regel aus #13, nicht dem Wortlaut des Kriteriums.
  Entweder das Kriterium liest sich künftig „höchstens einen, und nur im Panel", oder
  „Hinzufügen" bleibt doch der Primär der Aufgabenliste – deine Entscheidung.
- **`BRIEFING.md` ist an vier Stellen überholt** (Zeilen 88, 92, 96, 108: Nav-Pillen, Akte inline
  am Handy, die Breiten-Tabelle, das Anfragen-Layout). Die „Definition of Done" verlangt das
  Nachziehen, `CLAUDE.md` verlangt für `BRIEFING.md` eine ausdrückliche Bestätigung. Deshalb hier
  gemeldet statt geändert – auf „ja" ziehe ich die vier Absätze nach.
- Entscheidung 1 (eine variable Schriftdatei statt drei Schnitten) und Entscheidung 5 („Zwischen
  euch" entfällt) sind die beiden Punkte, die von der abgehakten Liste abweichen.
