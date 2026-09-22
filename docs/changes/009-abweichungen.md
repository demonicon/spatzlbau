# Änderungsauftrag 009 – Abweichungsliste

Stand: 22.09.2026 · Branch `feature/personen-layout` · Quelle: `docs/changes/009-personen-layout.md`, Design `design/handoff/2026-09-22-b/` (nur Variante B, „1b Personen zuerst")
Screenshots (Vollseite): `docs/changes/009-screenshots/` – `ich-380/1280`, `besuch-380/1280`, `akte-leicht-380/1280`, `akte-voll-380/1280`, `bei-claude-1280`, `umzugstag-druck-380`, `offline-380`

Vier Commits: (1) Layout, (2) „Seit deinem letzten Besuch", (3) Akte in zwei Gewichtsklassen + Delegation auf drei Zustände, (4) Umzugstag-Modus. Dazwischen der Review-Stopp; die dort getroffenen Entscheidungen stehen in Abschnitt 0.

**Zwei Migrationen, beide im SQL-Editor auszuführen:**

| Datei | Was | Status |
|---|---|---|
| `supabase/migrations/006_a009_letzter_besuch.sql` | `allowlist.last_visit_at`, `allowlist.seen_comments`, `tasks.done_by` + Spaltenrechte | **eingespielt** (22.09.) |
| `supabase/migrations/007_a009_delegation.sql` | `go/recherche/rueckfragen/arbeit` → `claude`, neuer Check auf drei Werte | **offen – vor dem Merge einspielen** |

Ohne 007 läuft die App weiter (alte Zustände werden als „bei Claude" gelesen), aber der Knopf „An Claude geben" schlägt fehl: der alte Check-Constraint kennt den Wert `claude` nicht. Geprüft.

---

## 0. Entscheidungen aus dem Review (nach Commit 2) – so gebaut

| Entscheidung | Umsetzung |
|---|---|
| „Ich" zeigt nur nicht blockierte; darunter eine eingeklappte Zeile „N warten auf einen Vorgänger", aufklappbar, nach Fälligkeit, mit Grund-Link | Gilt für **jede** Spalte, nicht nur „Ich" (auch am Desktop) – blockierte Aufgaben gehören zur Person, die sie später macht. Die Zeile klappt automatisch auf, wenn ein Filter aktiv ist oder ein Link in sie hinein führt. Der Zähler im Spaltenkopf („27 offen") zählt beide Listen |
| `done_by` freigegeben | `tasks.done_by` wird beim Abhaken gesetzt (auch beim automatischen Abhaken über die Teilschritte und bei „Ergebnis übernommen") |
| Block nur mit Inhalt, dann über den Kacheln | So gebaut: der Block steht zwischen Countdown und Kacheln und verschwindet ganz, wenn nichts neu ist |
| „Gemeinsam" als eigener Bereich am Handy, offen, zwischen „Wartet auf mich" und „Bei Anna" | So gebaut. „Ich" enthält damit nur noch eigene Aufgaben – am Handy sind das 11 statt 38 Zeilen, davon 4 sofort machbar |
| Phasen-Chips scrollen seitlich | Bleibt so (ab 600 px brechen sie um) |

## 1. Abweichungen vom Design-Handoff

| Design (Variante 1b) | Gebaut | Grund |
|---|---|---|
| Bei 380 px dieselben drei Personen-Spalten wie am Desktop | Am Handy vier Bereiche untereinander: Ich · Wartet auf mich · Gemeinsam · Bei Anna (eingeklappt) | Auftrag Punkt 1 plus Review-Entscheidung |
| Kasten „Zwischen euch" mit drei Signalen, **keine** Kennzahl-Kacheln | Kasten „Seit deinem letzten Besuch" **und** vier Kacheln | Auftrag Punkt 1 nennt die Kacheln, Punkt 2 den Block |
| Signal „du wartest auf Anna" | Nicht im Block | Der Auftrag zählt vier Teile auf, dieser ist nicht dabei |
| Phasen-Chips am Handy gruppiert (`alle · P1–P2 · P3`) | `alle` + fünf Phasen, seitlich scrollbar | Eine Gruppierung „P1–P2" gibt es im Datenmodell nicht |
| Spaltenkopf `11 offen · 3 diese Woche`, Button `alle 11 zeigen →` | Kopf: Owner-Chip, `n offen`, eine abgeleitete Notiz (`n überfällig` → `n fristkritisch`); Button `weitere n zeigen →` ab der 9. Zeile | „diese Woche" ist mit dem Personen-Layout kein Filter mehr; „weitere n" ist eindeutig, weil die blockierten Aufgaben separat stehen |
| Zeilen ohne Owner-Chip | Chip am Handy sichtbar, ab 900 px ausgeblendet | Am Handy mischen „Wartet auf mich" und „Gemeinsam" die Owner |
| Drei Spalten ab 900 px | Drei Spalten ab **1180 px**; zwischen 900 und 1179 px stehen die Gruppen untereinander, das Panel bleibt rechts | Gemessen: bei 900 px neben dem 440-px-Panel bleiben 152 px je Spalte, der Titel bekommt 92 px |
| Akte: Titel als feste Überschrift, „← Liste" als eigener Screen am Handy | Titel als Überschrift, die editierbar bleibt (Textfeld ohne Rahmen, umbrechend); die Akte klappt wie seit 006 unter der Zeile auf | Der Titel war seit 002 editierbar, das soll nicht verloren gehen; ein eigener Handy-Screen wäre ein zweiter Navigationsumbau |
| Akte voll: Kommentare direkt unter dem Briefing | Übernommen, aber nur bei Claude-Aufgaben; sonst stehen die Kommentare wie bisher unten | Bei der Delegation **sind** die Kommentare der Dialog, sonst nicht |
| Offline-Blatt als eigene Ansicht mit Tagesgruppen | Druckblatt nach Personen gruppiert, zusätzlich Zählerstände, Schlüssel, Notfallkontakte | Auftrag Punkt 5 nennt genau diese Felder; die Tagesgruppen des Entwurfs brauchen ein Datum je Aufgabe, das es nicht gibt |
| Schrift Instrument Sans per Google Fonts | Systemschrift-Stack | Kein externer Request (wie seit 002) |
| Rote Pille „wartet auf dich", Punkte in Autorenfarbe, Zahl + Label je Signal, farbige Unterlinie am Spaltenkopf, dreiteiliger Zustandsbalken | Übernommen | – |

## 2. Auslegungen des Auftrags

| Stelle im Auftrag | Gebaut | Grund |
|---|---|---|
| „Wartet auf mich" als eigener Bereich | Am Handy ja; ab 900 px nicht – dort markiert die rote Pille die Zeile in der Spalte ihrer Person | Der Auftrag gibt für den Desktop genau drei Spalten vor |
| Erledigte Aufgaben | Spalten zeigen offene Aufgaben; am Fuß jeder Spalte `n erledigt zeigen` | Sonst wäre ein versehentliches Häkchen nicht mehr rückgängig zu machen |
| Startzustand | Kein Filter beim Öffnen (vorher „Diese Woche"), Phasen-Chip „alle", pro Gerät gemerkt | Die Spalte „Ich" beantwortet „was ist meins" jetzt ohne Filter |
| `allowlist.seen_comments jsonb` **oder** Tabelle `comment_reads` | `seen_comments jsonb` (Array von Kommentar-IDs) | Eine Spalte statt einer wachsenden Tabelle; beim Schreiben bleiben nur IDs übrig, die neuer als `last_visit_at` sind – die Liste kann nicht unbegrenzt wachsen |
| „`last_visit_at` gesetzt beim Verlassen **und beim Login**" | Beim Verlassen (`visibilitychange` → hidden, `pagehide`, höchstens einmal pro Minute) und beim Login **nur, wenn der Wert noch leer ist** | Schriebe der Login immer, sähe das zweite Gerät derselben Person eine Minute später einen leeren Block |
| Block „beim Öffnen" | Der gemerkte Zeitpunkt wird für die Sitzung eingefroren: der Block bleibt stehen, auch wenn die App zwischendurch im Hintergrund war | Sonst verschwindet er beim App-Wechsel unter den Händen des Lesers |
| „Aufgaben erledigt … nicht von der eigenen Person" | Neue Spalte `tasks.done_by`; Aufgaben, die vorher abgehakt wurden, haben `null` und zählen nie mit | Ohne sie steht nirgends, wer abgehakt hat (im Review freigegeben) |
| Jeder Teil des Blocks filtert | Der Block **zählt Kommentare**, der Filter **zeigt Aufgaben**; Block und Filter ignorieren „schon geöffnet", nur der Punkt an der Zeile nutzt es | Sonst schrumpfen die Zahlen im Kopf, während man liest |
| „Voll automatisch, wenn … oder Kostenzeilen vorhanden (ab 007)" | Drei der vier Auslöser gebaut: `type = claude`, mindestens ein Beratungsfeld gefüllt, Abhängigkeiten vorhanden | `costs` hat noch keine UI; der vierte Auslöser kommt mit 007 |
| „Der Zustand wird pro Aufgabe gemerkt" | Im Browser, für die Dauer der Sitzung (nicht in der Datenbank) | Ein Anzeigezustand, der sich nicht zwischen Geräten abgleichen muss |
| „Ansicht ‚Bei Claude' gruppiert nach den drei Zuständen" | Der Filter „Bei Claude" ersetzt die Personen-Spalten durch drei Spalten: Briefing · bei Claude · Ergebnis liegt vor | Einzige Stelle, an der nicht nach Personen gruppiert wird |
| Buttons „An Claude geben" / „Ergebnis übernommen" | Gebaut, dazu bleibt „Zurück auf Briefing" (aus dem Design) | Ohne ihn gäbe es keinen Weg zurück, wenn das Briefing nachgebessert werden muss |
| „Service Worker cacht zusätzlich den letzten geladenen Datenstand (JSON im Cache)" | Der Datenstand liegt in `localStorage` (36 kB bei 48 Aufgaben), nicht im Cache-Storage | **Bewusste Abweichung:** `Cache.put` aus der Seite heraus war im Testaufbau (headless Chrome) nicht nutzbar – jeder Schreibversuch endet mit „Entry already exists", auch mit frischem Cache-Namen. Ein Offline-Modus, den ich nicht prüfen kann, ist am Umzugstag wertlos. `localStorage` ist synchron, geprüft und braucht den Service Worker nicht; dieser cacht weiter die App selbst |
| „Häkchen deaktiviert mit Hinweis" | Häkchen und Teilschritt-Häkchen sind `disabled`; jeder andere Schreibversuch (Kommentar, Feld, Löschen, Delegation) meldet „Ohne Netz kannst du nur lesen" | Ein `disabled` Häkchen kann keinen Hinweis auslösen, deshalb beides |

## 3. Design-Lücken (selbst entschieden)

| Zustand | Lösung |
|---|---|
| **Migration 006 nicht eingespielt** | `loadPersonRow()` liest die Zeile mit `select('*')`; fehlen die Spalten, bleibt `lastVisitAt` unbekannt: kein Block, keine Punkte, kein `done_by`. Abhaken funktioniert unverändert (geprüft) |
| **Person war noch nie eingeloggt** (`last_visit_at` null) | Kein Block, keine Punkte – sonst wäre beim ersten Login alles „neu". Der erste Login setzt den Startpunkt |
| **Sehr viele Punkte** | Ein Punkt je Autor und Zeile (höchstens drei), nicht je Kommentar |
| **Zweites Gerät derselben Person** | Gelesen-Stand und Besuchszeit liegen in der Datenbank. `allowlist` ist bewusst **nicht** in der Realtime-Übertragung: das zweite Gerät zieht beim nächsten Laden nach (wie der Changelog-Stand seit 005b) |
| **Kommentar auf gelöschter Aufgabe** | Zählt im Block nicht mit |
| **Spalte ohne Inhalt** | Nur der Kopf bleibt stehen („Wartet auf mich · 0 offen") |
| **Lange Spalte** | Acht Zeilen, dann `weitere n zeigen →`. Eine per Link geöffnete Aufgabe wird immer aufgedeckt, auch aus der eingeklappten Vorgänger-Liste heraus |
| **Fenster über die 900-px-Grenze ziehen, während ein Feld getippt wird** | Das Feld gibt den Fokus ab (und speichert dabei), danach wird neu gezeichnet. Vorher blieb das alte Layout stehen – beim Umbau gefunden und behoben |
| **Tablet 600–899 px** | Eine Spalte (760 px) mit der Handy-Gruppierung, Kacheln mit Unterzeilen, Chips ohne Scrollen |
| **Kachel-Unterzeilen** (issues.md #3) | Ab 600 px sichtbar statt ausgeblendet |
| **Akte: sehr langer Titel** | Das Titelfeld bricht um (Textfeld mit `field-sizing: content`, Zeilenzahl aus der Titellänge als Rückfall für iOS) |
| **Drucken ohne geöffnetes Blatt** | `body.printing` schaltet die Druckregeln; wer die App sonst druckt, bekommt wie bisher die Seite |
| **Notfallkontakte** | `settings.umzugstag_kontakte`, ein Textfeld im Druckblatt – gilt für beide, steht auf jedem Ausdruck |
| **Backup** | `allowlist` bleibt im Backup auf `person` + `last_seen_version`; `last_visit_at`/`seen_comments` sind Bedienzustand, kein Inhalt. `tasks.done_by` ist automatisch dabei |

## 4. Bewusst nicht umgesetzt

- Push-Benachrichtigungen (Auftrag: erst, wenn der Block nachweislich nicht reicht)
- Offline-Schreiben und Sync (seit dem Briefing außerhalb des Scopes)
- `costs`/`recurring` bleiben unberührt (Finanzmodul ist 007)
- Der vierte Auslöser für die volle Akte (Kostenzeilen) – kommt mit 007

## 5. Geprüft

- Migration 006 vor der Übergabe in einer Transaktion gegen die Live-Datenbank geprüft und zurückgerollt; danach war die Datenbank unverändert
- Headless Chrome, eingeloggt als Sebastian, echte Daten, 380 / 768 / 900 / 1024 / 1280 px: Spalten, Filter, Phasen-Chips, „blockiert:"-Link, Ein- und Ausklappen, `weitere n zeigen`, `n erledigt zeigen`, Abhaken und Zurücknehmen (mit und ohne Migration), Tastaturfokus über den Neuaufbau hinweg, Escape-Reihenfolge (Changelog → Druckblatt → Akte), Changelog öffnet sich automatisch bei neuer Version. Keine Konsolenfehler
- Besuchsblock mit simuliertem Vorbesuch (nur im Browser, nichts geschrieben): Block, Punkte, alle drei Filter, Punkt verschwindet beim Öffnen der Aufgabe
- Akte leicht/voll bei 380 und 1280, „Beratung ergänzen", „Alle Felder anzeigen", Titel bearbeiten und speichern
- Offline: Statuszeile „Offline – Stand von 15:18", Häkchen deaktiviert, Kommentar blockiert mit Hinweis, Aufgaben weiter lesbar, Druckblatt funktioniert ohne Netz („Stand … · ohne Netz"); zurück im Netz wieder „Live" ohne Reload, Schreiben funktioniert sofort wieder
- Druckblatt in der Druckvorschau: Aufgaben nach Person mit Kästchen, Zählerstände, Schlüssel, Notfallkontakte als Text

**Nicht prüfbar im Testaufbau, bitte auf dem Gerät gegenlesen:** App vom Home-Bildschirm im Flugmodus öffnen. Headless Chrome hat in diesem Aufbau weder Cache-Storage-Schreibzugriff noch einen zuverlässig aktiven Service Worker. Die Shell-Logik dafür ist seit Auftrag 003 unverändert; neu ist nur, dass die Daten aus `localStorage` kommen. Drei Schritte: App öffnen (lädt), Flugmodus an, App neu öffnen – erwartet: Liste sichtbar, Statuszeile „Offline – Stand von …".
