# Audit-Aufnahmen vom 22.09.2026

Stand der App: `main`, Commit `22646ee`, Version **2026.09.22.6** (Auftrag 012, Suche).
Aufgenommen mit kopflosem Chrome über das lokale Abbild des Repos (`http://localhost:5500/`).

**Kein Login, kein Schreiben.** Es lief keine Anmeldung; der gezeigte Stand ist im Browser gesetzt.
Jeder Supabase-Aufruf war während der Aufnahme durch einen Rekorder ersetzt, der am Ende leer war
(Protokoll des Laufs: `Datenbank-Aufrufe: leer`). Es wurde also weder gelesen noch geschrieben – auch
nicht `last_seen_version`, `last_visit_at` oder `seen_comments`.

## Woher die Daten kommen

- **Aufgaben, Teilschritte, Beratungstexte:** unverändert aus `seed.json` (48 Aufgaben, der echte
  Aufgabenkatalog, der ohnehin im Repo liegt).
- **Zustände drumherum sind Demo-Werte:** Einzugstermin 15.01.2027 (daher „115 Tage"), acht Aufgaben
  abgehakt, eine an Claude delegiert, eine wartet auf Sebastian, drei Kommentare, vier Kostenzeilen,
  drei laufende Kosten, letzter Besuch am 20.09. Angemeldete Person: Sebastian.
- **Notfallkontakte im Druckblatt sind erfunden** (`0800 000000` usw.), echte Nummern stehen nirgends.

## Die Aufnahmen

| Datei | Was sie zeigt |
|---|---|
| `hauptansicht-380x700.png` | Hauptansicht, Standardzustand – genau der erste Bildschirm (Handy) |
| `hauptansicht-380x700-ganze-seite.png` | dieselbe Ansicht komplett, mit **markierter Falzlinie** bei 700 px |
| `hauptansicht-768x1024.png` / `-ganze-seite.png` | Tablet hochkant |
| `hauptansicht-1024x768.png` / `-ganze-seite.png` | Tablet quer (ab 900 px mit Seitenpanel) |
| `hauptansicht-1440x900.png` / `-ganze-seite.png` | Desktop, drei Personen-Spalten |
| `hauptansicht-1920x1080.png` / `-ganze-seite.png` | großer Desktop (die Spalte bleibt bei 1280 px stehen) |
| `akte-380x700.png` | Akte inline unter der Aufgabe, mit Titelfeld (Aufgabe „Wohnung Sebastian kündigen") |
| `akte-1440x900.png` | dieselbe Akte als Seitenpanel, mit Titelfeld |
| `ladezustand-380x700.png` | Ladezustand („Lade …") bei gedrosseltem Netz (ca. 350 kbit/s, 500 ms Latenz, Cache und Service Worker vorher entfernt) |
| `login-380x700.png` | Anmeldebildschirm (fiel beim selben Lauf an) |
| `umzugstag-druck.pdf` | Druckansicht „Umzugstag", drei Seiten A4, aus derselben Ansicht gedruckt |
| `umzugstag-druck-vorschau.png` | dasselbe Blatt als Bild, für den schnellen Blick |
| `umzugstag-druckblatt-1024x768.png` | wie das Druckblatt **am Bildschirm** aussieht, bevor man druckt |

Bei jeder Größe gibt es zwei Bilder: die Datei ohne Zusatz ist genau der Ausschnitt, den ein Gerät
dieser Größe zeigt; `-ganze-seite` ist dieselbe Ansicht in voller Länge ausgerollt. Nur beim Handy
ist zusätzlich die Falzlinie eingezeichnet – sie markiert, wo der erste Bildschirm endet.

## Zwei Hinweise zum Lesen der Bilder

- **Der Ladezustand ist bewusst karg:** Titel und „Lade …", sonst nichts. Kein Skelett, kein
  Ladebalken. Bei schnellem Netz sieht man ihn kaum, bei langsamem eben so.
- **Farben im PNG:** Die Bilder sind mit einfacher Pixeldichte aufgenommen, Text bekommt dadurch
  eine leichte Farbsäumung (auf dem Druckblatt wirkt Schwarz dadurch bläulich). Geprüft: im
  Druck-Modus ist jeder Text `rgb(0, 0, 0)`. Maßgeblich ist das PDF.

## Nicht im Repo

Die Bilder, das PDF und das ZIP sind in `.gitignore` – wie die Design-Snapshots aus Auftrag 011.
Im Repo bleibt nur dieser Begleittext.
