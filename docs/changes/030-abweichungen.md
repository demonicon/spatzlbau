# 030 – Abweichungen und Entscheidungen

Stand: 24.09.2026 · Branch `feat/030` → `preview` · Aufwand S–M · Tests: `scen030` (14/14 grün,
380 px für 1–3/6, 1280 px für 4–5), Regression 016–026 unverändert gegenüber 029b/014d.
Rahmendaten in der Live-Datenbank nur lesend geprüft (keine Schreibzugriffe in diesem Auftrag).

## Entscheidungen im Zweifel

1. **Punkt 1, AK „kein 'Claude unterstützt' mehr im Code".** Der Fließtext spricht nur von der
   Meta-Zeile, die AK verlangt die Zeichenkette komplett weg. `TYPE.assist` (Wörterbuch) und die
   Option im „Neue Aufgabe"-Formular trugen denselben Text – beide auf „Claude hilft mit"
   umbenannt (gleiche Bedeutung, andere Worte), damit der Typ beim Anlegen weiter wählbar bleibt.
2. **Punkt 2, Fristkritisch neu definiert.** `isCritical()` (`filters.js`) las bisher das manuell
   gesetzte `tasks.critical`-Flag; jetzt liest sie dieselbe 7-Tage-Grenze wie `dueInfo()`s
   „soon"-Klasse (state.js, war schon auf 7 – nur `isCritical` kannte sie nicht). Das Flag/die
   Checkbox „fristkritisch" in Bearbeiten bleibt im Datenmodell bestehen (Auftrag nennt keine
   Löschung), wirkt jetzt aber auf nichts mehr sichtbar – eine eigene Aufgabe wert, falls das
   stören sollte. Zwei weitere Stellen lasen `t.critical` direkt statt über `isCritical()`
   (Timeline-Chip **und** Zeilen-Fettung, Umzugstag-Blatt) – beim Grep gefunden und mit
   umgestellt, sonst wäre die Timeline-Zeile fett gewesen, obwohl ihr eigener Chip längst auf die
   neue Regel umgestellt war.
3. **Punkt 4, „1920 px ohne Scrollen".** Gemessen statt behauptet: Der Spalten-Container bekommt
   neben dem Akte-Panel (das ab 1180 px immer offen ist, unabhängig von der Ansicht) und
   `.wrap`s bestehender Deckelung bei 1800 px höchstens **~1220 px**, gleich wie breit das Fenster
   wird (getestet bis 2600 px) – nie die nötigen 1464 px (5 × 280 px + 4 × 16 px). Die
   `repeat(5, minmax(280px, 1fr))`-Regel selbst ist genau so umgesetzt wie beauftragt und würde
   ab ~1500 px **Container-Breite** nicht mehr scrollen; `.wrap`/das Panel zu verbreitern, um das
   bei jeder Fensterbreite zu erzwingen, ist eine andere, größere Änderung außerhalb dieses
   Auftrags (beträfe jede Ansicht, nicht nur Phasen) – nicht angefasst, hier nur vermessen und
   gemeldet.
4. **Punkt 6, Test „Umzugstag auf 02.01. → kein Hinweis".** Mit unverändertem Auszug (31.12.)
   löst diese eine Änderung Punkt 1 (Umzug vor Einzug) auf, macht aber gleichzeitig Punkt 2 wahr
   (Auszug 31.12. liegt jetzt vor dem neuen Umzugstag 02.01.) – die Zeile bleibt bei genau einem
   Hinweis, nur mit anderem Text. Die Regel ist wortgetreu umgesetzt („Auszug vor dem
   Umzugstag"); das Auftragsbeispiel hat diese Wechselwirkung vermutlich nicht mitgerechnet.
   Geprüft und dokumentiert, nicht stillschweigend anders programmiert.

## Regression

016–026 unverändert gegenüber dem Stand nach 014d (keine neue Abweichung durch 030). `isCritical()`
betrifft viele Stellen (Kacheln, Spaltenköpfe, Datum-Chips, Timeline, Umzugstag-Blatt, Akte) – alle
in der Regression enthalten, nichts zusätzlich gebrochen.
