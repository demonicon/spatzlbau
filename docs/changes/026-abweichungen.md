# 026 – Abweichungen und Entscheidungen

Stand: 23.09.2026 · Branch `feat/026-start-setup` → `preview` · Aufwand M (zwei Breiten)
Migration `016_a026_setup.sql` – **nicht eingespielt**

## Entscheidungen im Zweifel

1. **Schritte 3–6 wirklich wortwörtlich wiederverwendet, nicht kopiert.** `setupTermineHTML` /
   `setupMietenHTML` / `setupKautionenHTML` / `setupAufteilungHTML` (016b, `app/views/finanzen.js`)
   sind jetzt `export`iert und stehen unverändert an Platz 3–6; die vier Speicherfunktionen aus
   `finSetupNext` (016b) sind zu eigenen Funktionen (`setupTermineSave` etc.) herausgezogen, die
   sowohl die alte Finanzen-eigene Ersteinrichtung als auch 026 aufrufen. `fin_setup_done` bleibt
   ein eigener Schlüssel – Schritt 6 (Aufteilung) setzt ihn mit, genau wie 016b es schon tat, damit
   Finanzen nach 026 nicht ein zweites Mal fragt.
2. **Der alte Ansehen-Avatar (`<span>`) ist jetzt ein Knopf mit eigenem kleinen Menü.** Der Auftrag
   setzt „Avatar-Menü" voraus, das es noch nicht gab. Ein Eintrag heute („Stammdaten &
   Rahmendaten"), Platz für mehr – kein Overlay-System, kein Schließen-bei-Klick-daneben (Escape
   und der Avatar selbst schließen es, wie die anderen kleinen Panels der App).
3. **„Menü … jeder Schritt einzeln aufrufbar" wird ein zweiter, schlankerer Chrome um dieselben
   acht Bildschirme** – ohne Zähler „x/8", ohne Zurück/Später, mit „Speichern"/„Schließen" statt
   des Ablaufs. Reopen speichert nur den einen Schritt und kehrt in die App zurück; die Sequenz
   selbst (Ablaufsteuerung, `setup_step`) bleibt unberührt.
4. **Schritt 2 zeigt genau die Felder aus der Auftragstabelle** (Straße, Etage, Aufzug,
   Vermieter/Hausverwaltung/Adresse, Kündigungsfrist, Kaution, Kaltmiete, Nebenkosten) – die
   Live-Datenbank hat `stammdaten.wohnungen` bereits mit mehr Feldern (PLZ, Ort, Stellplatz,
   `hinweise[]`, `quelle`). Diese bleiben unangetastet: jeder Schritt-2-Save liest das bestehende
   Objekt und schreibt nur die gezeigten Felder hinein (`{...bestehend, ...neue Felder}`), nichts
   wird überschrieben oder gelöscht.
5. **Aufzug ist ein Ja/Nein-Segment, kein Textfeld** – „ja/nein" in der Auftragstabelle ist ein
   Tri-State (unbekannt/ja/nein wegen `null` in der Datenbank); ein eigenes `ui.setupAufzug`
   merkt sich den Klick pro Wohnung, bis „Weiter"/„Speichern" ihn schreibt.
6. **Schritt 7 – Startposten stammen aus `content/i2b-kosten.json` (die 14 echten Teil-B-Zeilen),
   nicht aus der kürzeren Beispielliste im Auftragstext.** Beide meinen dieselbe Sache; die echten
   `seed_key`/Beträge sind die verlässlichere Quelle, da sie schon in der Datenbank liegen können.
   „Kaution neu" aus der Vorschlagsliste ist bewusst nicht als Checkbox in Schritt 7 – die gehört
   zu Schritt 5 (Kautionen) und würde sonst doppelt erscheinen.
7. **Schritt 8 zeigt den Vorschlag als Hinweistext neben jeder Zeile, „Vorschlag übernehmen" setzt
   ihn für alle vorschlagbaren Aufgaben auf einmal.** Einzelne Zeilen bleiben jederzeit per
   Segment umstellbar, auch vor oder statt des Sammel-Klicks. Owner-Schreibzugriffe sind sofort
   (kein Entwurf) – passt zu „dann einzeln umstellen" und macht `task_changes` (018) für jede
   Änderung einzeln nachvollziehbar, nicht als ein Sammel-Patch.
8. **`settings.stammdaten` in der Migration ist nur der Default für eine leere Datenbank** (`on
   conflict do nothing`) – die Live-Datenbank hat den Schlüssel schon mit echten Daten (Session
   davor, außerhalb der App gesetzt); die Migration lässt ihn unangetastet.

## Gefunden, nebenbei behoben (Fehler beim eigenen Testaufbau, keine App-Bugs)

- Die geteilte Test-Vorlage `demo.mjs` (frühere Sitzungen) kannte `settings.setup_done` nicht –
  ohne einen Default hätte jeder ältere Test versehentlich den neuen Schritt-1-Bildschirm
  bekommen. Ergänzt (`setup_done: true`, wie schon `fin_setup_done` für 016b), Regression über
  016–022 und 024 erneut geprüft.

## Offene Punkte

- **Migration 016 ist nicht eingespielt.** Ohne sie liest `settings.setup_done`/`setup_step` als
  `undefined` – wirkt wie `false`/`0`, das Setup startet also ohnehin beim ersten Öffnen. Kein
  Absturz. `settings.stammdaten` existiert in der Live-Datenbank bereits (siehe Punkt 8 oben).
- **AC „Schritt 8 … Trigger schreibt `task_changes`" ist ungeprüft ohne Datenbank** – die App
  schickt dasselbe `updateTask()` wie jede andere Owner-Änderung; ob der Trigger (Migration 011)
  greift, kann nur an der echten Datenbank geprüft werden (Migration 011 selbst ist laut
  `preview-2.0-status.md` ebenfalls noch nicht eingespielt).
- **Rollback-Prüfung der Migration steht aus** (braucht die Datenbank).

## Was geprüft wurde (23 von 23 grün, 380 px + 1280 px)

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | Leere `setup_done` → Schritt 1 (Ihr beiden), „Später" da, kein „Zurück" | – |
| 2 | „Weiter" schreibt Schritt 1 (Personen), zeigt Schritt 2 | – |
| 3 | Schritt 2 vorbelegt aus `stammdaten` (Adresse, Kaution 2910/2040, Miete 1150) | – |
| 4 | 380 px, Schritt 2 (viele Felder): kein waagrechtes Scrollen | – |
| 5 | Schritt 3 ist der 016b-Termine-Screen, kein zweiter Code | `data-input=setup-einzug` |
| 6 | Aufzug-Tri-State gespeichert | – |
| 7 | 016b-Save wiederverwendet: `einzugstermin` geschrieben, Schritt 4 (Mieten) | – |
| 8 | Abbruch → „Setup fortsetzen (Schritt 4 von 8)", App sonst normal | – |
| 9 | „Setup fortsetzen" springt zurück zu Schritt 4 | – |
| 10 | Schritt 7: 14 Zeilen, 1 vorhanden, Rest vorausgewählt | – |
| 11 | „Übernehmen" legt 12 fehlende an (1 abgewählt, 1 vorhanden), kein Duplikat | – |
| 12 | Schritt 8 mit Vorschlag-Knopf (38) | – |
| 13 | „Vorschlag übernehmen" setzt S/A, 9 bleiben B | – |
| 14 | Abschlussseite: Antwortzahl, drei Fristen | – |
| 15 | „Los geht's" setzt `setup_done`, App zeigt Dashboard, kein erneuter Start | – |
| 16 | Avatar ist ein Menü-Knopf mit „Stammdaten & Rahmendaten" | – |
| 17 | Picker listet alle 8 Schritte einzeln | – |
| 18 | Reopen: kein Zurück/Später/Zähler, „Speichern"/„Schließen" | – |
| 19 | Speichern schreibt das Feld, schließt zurück in die App | – |
| 20 | 1280 px: kein waagrechtes Scrollen | – |

Regression: `016`–`022`, `024` erneut gelaufen – 137 von 138 Prüfungen weiter grün; die eine
erwartete Abweichung ist 016s alter Test auf „Angebot eintragen" (von 016b ersetzt, dokumentiert
seit dessen Abweichungsliste).
