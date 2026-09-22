# Änderungsauftrag 009 – Abweichungsliste (Stand nach Commit 2)

Stand: 22.09.2026 · Branch `feature/personen-layout` · Quelle: `docs/changes/009-personen-layout.md`, Design `design/handoff/2026-09-22-b/` (nur Variante B, „1b Personen zuerst")
Screenshots (Vollseite): `docs/changes/009-screenshots/` – `ich-380`, `ich-1280`, `besuch-380`, `besuch-1280`, `akte-leicht-380`, `akte-leicht-1280`, `akte-voll-380`, `akte-voll-1280`

Commit 1 = Layout, Commit 2 = „Seit deinem letzten Besuch". **Noch nicht gebaut:** Akte in zwei Gewichtsklassen (Auftrag Punkt 3) und Delegation auf drei Zustände (Punkt 4) folgen in Commit 3, Umzugstag-Modus (Punkt 5) in Commit 4. Die beiden Akte-Screenshots zeigen deshalb den **Ist-Stand vor** dem Umbau – sie sind der Vergleichspunkt, nicht das Ergebnis.

**Das musst du vor dem Weiterbauen tun:** `supabase/migrations/006_a009_letzter_besuch.sql` im SQL-Editor einspielen. Bis dahin läuft die App vollständig weiter, nur ohne den Besuchsblock und ohne Punkte (siehe 3.1).

---

## 1. Abweichungen vom Design-Handoff

| Design (Variante 1b) | Gebaut | Grund |
|---|---|---|
| Bei 380 px dieselben drei Personen-Spalten wie am Desktop (Du · Sebastian / Gemeinsam / Anna) | Am Handy drei Bereiche untereinander: **Ich** (eigene **+ gemeinsame**), **Wartet auf mich**, **Bei Anna** (eingeklappt, Zähler im Kopf) | Auftrag Punkt 1 schreibt genau diese Reihenfolge vor. Die Handoff-Fassung bräuchte am Handy drei Überschriften für dieselbe Liste |
| Kasten „Zwischen euch" mit drei Signalen (`2 Anna wartet auf dich`, `3 neue Kommentare seit gestern`, `1 du wartest auf Anna`), **keine** Kennzahl-Kacheln | Kasten „Seit deinem letzten Besuch" mit den vier Teilen aus dem Auftrag (Kommentare je Autor, erledigte Aufgaben, wartet auf dich) **und** darunter die vier Kacheln (Fristkritisch, Überfällig, Blockiert, Bei Claude) | Auftrag Punkt 1 nennt die vier Kacheln, Punkt 2 den Block. Beides ist drin; der Kopf ist dadurch zwei Zeilen höher als im Entwurf. **Offene Frage 4.1** |
| „du wartest auf Anna" als eigenes Signal | Nicht im Block | Der Auftrag zählt vier Teile auf, dieser ist nicht dabei. **Offene Frage 4.1** |
| Phasen-Chips am Handy gruppiert: `alle · P1–P2 · P3` | `alle` + alle fünf Phasen, am Handy seitlich scrollbar, ab 600 px umbrechend | Eine Gruppierung „P1–P2" gibt es im Datenmodell nicht; sie wäre eine zweite, unsichtbare Phasenlogik |
| Spaltenkopf: `11 offen · 3 diese Woche` und `alle 11 zeigen →` | Kopf: Owner-Chip, `n offen`, dazu **eine** abgeleitete Notiz in dieser Reihenfolge: `n überfällig` → `n fristkritisch` → `n blockiert`; `alle n zeigen →` ab der 9. Zeile | „diese Woche" ist mit dem Personen-Layout kein Filter mehr. Die Notiz sagt, warum man in diese Spalte schauen sollte |
| Zeilen ohne Owner-Chip | Chip am Handy sichtbar (die Spalte „Ich" mischt eigene und gemeinsame), ab 900 px ausgeblendet | Ohne Chip wäre am Handy nicht erkennbar, was gemeinsam ist |
| Drei Spalten ab 900 px | Drei Spalten erst ab **1180 px**; zwischen 900 und 1179 px stehen dieselben drei Gruppen untereinander, das Panel bleibt rechts | Gemessen: bei 900 px neben dem 440-px-Panel bleiben 152 px je Spalte, der Titel bekommt 92 px. Das ist unlesbar |
| Offline-Blatt (Phase 4 ohne Netz) | Kommt in Commit 4 | – |
| Schrift Instrument Sans per Google Fonts | Systemschrift-Stack | Kein externer Request (wie seit 002) |
| Rote Pille „wartet auf dich", Kommentare/Punkte in Autorenfarbe, Zahl + Label je Signal, Spaltenkopf mit farbiger Unterlinie | Übernommen | – |

## 2. Auslegungen des Auftrags

| Stelle im Auftrag | Gebaut | Grund |
|---|---|---|
| „Ich (eigene + gemeinsame Aufgaben, **nicht blockiert**, nach Fälligkeit)" | Blockierte Aufgaben bleiben in der Spalte, sortieren aber **ans Ende** und tragen den Grund als Link | 27 der 48 Aufgaben sind aktuell blockiert (fast alles hängt am Mietvertrag). Als Filter gelesen wären am Handy mehr als die Hälfte der eigenen Aufgaben unsichtbar. **Offene Frage 4.2** |
| „Wartet auf mich" als eigener Bereich | Am Handy ja; ab 900 px nicht – dort steht die rote Markierung in der Zeile, die Aufgabe bleibt in der Spalte ihrer Person | Der Auftrag gibt für Desktop genau drei Spalten vor |
| Erledigte Aufgaben | Spalten zeigen offene Aufgaben; am Fuß jeder Spalte `n erledigt zeigen` | Sonst wäre ein versehentlich gesetztes Häkchen nicht mehr rückgängig zu machen – es gibt keine Phasenliste mehr, in der die Aufgabe noch stünde |
| Kennzahl = Filter | Alle vier Kacheln und alle Teile des Besuchsblocks setzen genau einen Filter (`aria-pressed`), erneutes Tippen hebt ihn auf | wie 002 |
| Startzustand | **Kein** Filter beim Öffnen (vorher „Diese Woche"), Phasen-Chip „alle"; der zuletzt gewählte Chip wird pro Gerät gemerkt | Die Spalte „Ich" beantwortet „was ist meins" jetzt ohne Filter |
| Ein Filter ist aktiv und „Bei Anna" ist eingeklappt | Der eingeklappte Bereich klappt auf, solange ein Filter aktiv ist | Sonst wären Treffer in Annas Spalte unsichtbar |
| `allowlist.seen_comments jsonb` oder Tabelle `comment_reads` | `seen_comments jsonb` (Array von Kommentar-IDs) | Eine Zeile mehr pro Person statt einer wachsenden Tabelle. Beim Schreiben werden nur IDs behalten, die neuer als `last_visit_at` sind – die Liste kann nicht unbegrenzt wachsen |
| „`last_visit_at` gesetzt beim Verlassen **und beim Login**" | Beim Verlassen (`visibilitychange` → hidden, `pagehide`) und beim Login **nur, wenn der Wert noch leer ist** | Schreibt der Login immer, sieht das zweite Gerät derselben Person eine Minute später einen leeren Block – das widerspricht dem Akzeptanzkriterium |
| Block „beim Öffnen" | Der Block bleibt die ganze Sitzung über stehen (der gemerkte Zeitpunkt wird im Browser eingefroren), auch wenn die App zwischendurch im Hintergrund war | Sonst verschwindet er beim App-Wechsel unter den Händen des Lesers. Beim nächsten Öffnen zählt er ab dem Verlassen |
| „Aufgaben erledigt: `tasks.done` und `updated_at > last_visit_at`, **nicht von der eigenen Person**" | Neue Spalte `tasks.done_by` (`S`/`A`), von der App beim Abhaken gesetzt | Ohne sie steht nirgends, wer abgehakt hat. Aufgaben, die vor der Migration abgehakt wurden, haben `done_by = null` und zählen nie mit – **Datenmodell-Erweiterung, bitte bestätigen (4.3)** |
| Jeder Teil des Blocks filtert | Der Block **zählt Kommentare**, der Filter **zeigt Aufgaben** – drei Kommentare können auf zwei Aufgaben liegen | Die Formulierung im Auftrag („3 Kommentare von Anna") ist die Kommentarzahl |
| Punkt verschwindet beim Öffnen | Der Punkt (Gelesen-Stand) nutzt `seen_comments`, Block und Filter nicht: sie zeigen alles seit dem letzten Besuch | Sonst schrumpfen die Zahlen im Kopf, während man liest |

## 3. Design-Lücken (selbst entschieden)

| Zustand | Lösung |
|---|---|
| **3.1 Migration noch nicht eingespielt** | `loadPersonRow()` liest die Zeile mit `select('*')`; fehlen die Spalten, bleibt `lastVisitAt` unbekannt: kein Block, keine Punkte, kein `done_by` beim Abhaken. Getestet: Abhaken und Zurücknehmen funktionieren ohne Migration fehlerfrei |
| **Person war noch nie eingeloggt** (`last_visit_at` null) | Kein Block, keine Punkte – sonst wäre beim ersten Login alles „neu". Der erste Login setzt den Startpunkt, ab dem zweiten zählt der Block |
| **Sehr viele Punkte** | Ein Punkt je Autor und Zeile (höchstens drei), nicht je Kommentar. Beim Öffnen der Aufgabe verschwinden genau deren Punkte, die anderen bleiben |
| **Zweites Gerät derselben Person** | Gelesen-Stand und Besuchszeit liegen in der Datenbank, nicht im Gerät. `allowlist` ist bewusst **nicht** in der Realtime-Übertragung: das zweite Gerät zieht beim nächsten Laden nach (wie der Changelog-Stand seit 005b) |
| **Kommentar auf gelöschter Aufgabe** | Zählt im Block nicht mit (es gibt eine solche Zeile aus dem Smoke-Test) |
| **Spalte ohne Inhalt** | Nur der Kopf bleibt stehen („Wartet auf mich · 0 offen"), kein leerer Kasten |
| **Lange Spalte** | Acht Zeilen, dann `alle n zeigen →`. Eine per Link geöffnete Aufgabe wird immer aufgedeckt, auch wenn sie an Position 20 steht |
| **`#task=<id>`-Link** | Wie seit 006: Phase wird gesetzt, ein Filter, der die Aufgabe verstecken würde, fällt weg – zusätzlich klappt jetzt der Bereich auf, in dem sie steht |
| **Tablet 600–899 px** | Eine Spalte (760 px) mit der Handy-Gruppierung, Kacheln mit Unterzeilen, Chips ohne Scrollen |
| **Kachel-Unterzeilen** (issues.md #3) | Ab 600 px sichtbar statt ausgeblendet – auf dem größeren Bildschirm steht jetzt mehr, nicht weniger |
| **Backup** | `allowlist` bleibt im Backup auf `person` + `last_seen_version`; `last_visit_at`/`seen_comments` sind Bedienzustand, kein Inhalt. `tasks.done_by` ist automatisch dabei |

## 4. Entscheidungen, die ich von dir brauche

1. **Besuchsblock und Kacheln** stehen jetzt beide im Kopf (zusammen ~180 px am Handy). Alternative: die Kachel „Bei Claude" in den Block ziehen oder den Block auf zwei Teile kürzen. Oder das Signal „du wartest auf Anna" aus dem Handoff ergänzen – dann sind es bis zu fünf Teile.
2. **Blockierte Aufgaben in „Ich"**: bleiben (am Ende, mit Grund) oder doch raus, wie wörtlich im Auftrag?
3. **`tasks.done_by`**: neue Spalte, nur für „n Aufgaben erledigt". Einverstanden? Ohne sie fällt dieser Teil des Blocks ersatzlos weg.
4. **Phasen-Chips am Handy scrollen seitlich.** Alternative: Umbruch in zwei Zeilen (kostet 50 px) oder nur Nummern ohne Namen.
5. Spalte „Ich" am Handy enthält 38 der 48 Aufgaben, weil 27 gemeinsam sind. Soll „Gemeinsam" am Handy ein eigener vierter Bereich werden (dann: Ich 11 · Gemeinsam 27 · Wartet auf mich · Bei Anna)?

## 5. Bewusst nicht umgesetzt

- Push-Benachrichtigungen (Auftrag: erst, wenn der Block nachweislich nicht reicht)
- Offline-Schreiben (seit dem Briefing außerhalb des Scopes; Commit 4 bringt nur das Lesen)
- `costs`/`recurring` bleiben unberührt (Finanzmodul ist 007)

## 6. Prüfungen, die gelaufen sind

- Migration `006_a009_letzter_besuch.sql` in einer Transaktion gegen die Live-Datenbank geprüft und zurückgerollt: Spalten, Check-Constraint und Spaltenrechte kommen wie erwartet, danach war die Datenbank unverändert (`allowlist_new_cols = 0`)
- Headless Chrome, eingeloggt als Sebastian, echte Daten: Layout bei 380/768/900/1024/1280 px, Filter, Phasen-Chip, „blockiert:"-Link (öffnet die blockierende Aufgabe, hebt den Filter auf, setzt `#task=`), Ein-/Ausklappen, `n erledigt zeigen`, Abhaken und Zurücknehmen, Tastaturfokus über den Neuaufbau hinweg. Keine Konsolenfehler
- Besuchsblock mit simuliertem Vorbesuch (nur im Browser, nichts geschrieben): Block, Punkte, alle drei Filter, Punkt verschwindet beim Öffnen der Aufgabe
