# Flows – wie die Live-App bedient wird

Stand 22.09.2026, Build `b815103`. Jeder Schritt beschreibt, was die Nutzer tun und was die App
daraufhin tut. Alle Schreibvorgänge gehen feldgenau an Supabase und erscheinen bei der anderen
Person ohne Neuladen (Realtime).

---

## 1. Aufgabe öffnen → abhaken → kommentieren

1. **Öffnen.** Tippen auf den Aufgabentitel.
   - Handy (< 900 px): die Akte klappt direkt unter der Zeile auf.
   - Desktop (≥ 900 px): die Akte erscheint rechts im Panel, die Zeile bekommt links einen Balken; der Platzhalter „Aufgabe wählen“ verschwindet. Die Liste bleibt stehen und scrollt unabhängig.
   - In beiden Fällen wandert die Aufgabe in die Adresszeile (`#task=<id>`) – der Link lässt sich teilen. Kein History-Eintrag, Zurück verlässt die Seite.
2. **Abhaken.** Häkchen in der Liste oder in der Akte. Die Zeile wird sofort grau und durchgestrichen (optimistisch), der Server folgt; bei Fehler wird der Serverstand neu geladen und die Statuszeile wird rot.
   - Hat die Aufgabe Teilschritte und wird der letzte abgehakt, hakt die App die Aufgabe selbst ab und meldet „Alle Teilschritte erledigt – Aufgabe abgehakt“.
   - Zählt die Aufgabe im aktiven Filter nicht mehr, verschwindet sie aus der Liste; das Panel bleibt offen.
3. **Kommentieren.** Textfeld am Ende der Akte („Kommentar als Sebastian“) → „Kommentar speichern“. Der Kommentar erscheint mit Autor und Zeit; Claude-Kommentare sind ockerfarben hinterlegt. Die Zeile in der Liste zeigt danach „n Kommentare“.
4. **Schließen.** Nochmal auf den Titel, am Desktop zusätzlich × im Panel-Kopf oder Escape. Der Fokus springt auf den Titel in der Liste zurück, die Adresszeile wird wieder sauber.

**Was fehlt:** Es gibt keine Benachrichtigung. Wer einen Kommentar bekommt, erfährt es nur, wenn er die Aufgabe öffnet oder die Zahl in der Zeile bemerkt.

---

## 2. Filter setzen → Phase wechseln → Chip schließen

1. **Beim Öffnen** ist der Filter „Diese Woche“ aktiv: offene Aufgaben der eingeloggten Person plus gemeinsame, nicht blockiert, nicht gerade bei Claude, dazu alles, was auf diese Person wartet.
2. **Kachel tippen** setzt genau einen Filter (`aria-pressed`), über alle Phasen hinweg. Über der Liste erscheint der schwarze Chip „Filter: Fristkritisch ×“ mit „n in dieser Phase“; die Zähler in den Tabs zeigen nun die Treffer je Phase statt „n offen“.
3. **Phase wechseln** über Tab oder Gate-Segment. Der Filter bleibt, die Liste zeigt die Treffer der neuen Phase. Am Desktop bleibt auch das Panel offen – man kann eine Aufgabe lesen und nebenher durch Phasen blättern.
4. **Chip schließen** (× oder dieselbe Kachel nochmal) hebt den Filter auf; die Liste zeigt wieder alle Aufgaben der Phase, die Tab-Zähler wechseln zurück auf „n offen“.
5. **Zuletzt gewählte Phase** merkt sich das Gerät (localStorage); der Filter dagegen ist bei jedem Start wieder „Diese Woche“.

---

## 3. Delegation an Claude – von Briefing bis Ergebnis

Zustandsautomat in der Akte, sichtbar als sechsteiliger Balken mit „Jetzt dran: ihr / Claude“.

| Zustand | Wer | Was passiert |
|---|---|---|
| **briefing** | ihr | Aufgabe auf Typ „an Claude delegiert“ stellen (oder über den Filter „Bei Claude“ neu anlegen). Ziel und Kontext ausfüllen. Button: „Go erteilen“. |
| **go** | Claude | Das Go schreibt zusätzlich einen Kommentar „Go erteilt – Claude darf starten.“. Claude im Chat ruft die Export-URL ab und sieht Briefing, Teilschritte, Kommentare und Abhängigkeiten. |
| **recherche** | Claude | Claude klärt Anforderungen und stellt bis zu fünf Rückfragen – als Kommentare mit Autor „Claude“ (geschrieben von Claude Code per `scripts/claude-result.mjs`). |
| **rueckfragen** | ihr | Antworten als Kommentar, dann „Rückfragen beantwortet“. |
| **arbeit** | Claude | Claude liefert das Ergebnis; es landet im Feld „Ergebnis von Claude“, Teilschritte können ergänzt werden. |
| **ergebnis** | ihr | Lesen, entscheiden, „Ergebnis übernommen“ → die Aufgabe gilt als erledigt. |

Jederzeit möglich: „Zurück auf Briefing“. In der Liste zeigt das Tag „Claude · <Zustand>“ den Stand;
die Kachel „Bei Claude“ zählt alle delegierten Aufgaben, ihre Unterzeile nur die, bei denen Claude
am Zug ist. Aufgaben mit `rueckfragen` oder `ergebnis` zählen zusätzlich in „Wartet auf jemanden“.

---

## 4. Changelog – automatisch und manuell

1. **Automatisch.** Nach Login und geladenen Daten prüft die App, ob `changelog.json` eine neuere Version enthält als die zuletzt von dieser Person gelesene (`allowlist.last_seen_version`). Wenn ja, öffnet sich „Was ist neu?“ von selbst und zeigt **alle** ungelesenen Versionen.
2. **Nicht automatisch**, wenn die App über einen Aufgaben-Link (`#task=…`) geöffnet wurde – dann hat die Person ein Ziel; es bleibt beim „Neu“-Punkt in der Fußzeile.
3. **Schließen** per Button, Escape oder Tippen außerhalb speichert die gelesene Version in der Datenbank – auf allen Geräten dieser Person erledigt.
4. **Manuell** jederzeit über die Versionsnummer in der Fußzeile; dann werden alle Versionen gezeigt.

---

## 5. Nebenläufige Abläufe

- **Neue Version der App.** Ein neuer Build übernimmt sofort (Service Worker mit `skipWaiting`); die Statuszeile zeigt „Neue Version – neu laden“ als Button. Geprüft wird beim Öffnen, bei Rückkehr in den Tab und alle 30 Minuten.
- **Einzugstermin setzen.** Über die Kopfzeile („Einzug · Termin eintragen“) klappt ein Datumsfeld auf. Ohne Termin zeigen alle Aufgaben relative Fristen („≈ 8 Wochen vorher“) und „Überfällig“ ist immer 0; mit Termin werden daraus Datumsangaben mit Überfälligkeits-Logik.
- **Aufgabe anlegen.** Kasten am Ende der Liste; die neue Aufgabe wird sofort geöffnet. Würde der aktive Filter sie verstecken, wird der Filter aufgehoben.
- **Aufgabe löschen.** In der Akte mit Inline-Bestätigung; gelöscht wird nur weich (`deleted_at`), die Aufgabe verschwindet aus allen Sichten.
- **Seed/Inhalte.** Stammaufgaben und Beratungstexte kommen ausschließlich über `scripts/seed.mjs` (Claude Code); in der App gibt es dafür seit 006 keinen Knopf mehr.
