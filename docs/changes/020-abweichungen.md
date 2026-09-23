# 020 – Abweichungsliste und Prüfbericht

Stand: 23.09.2026 · Branch `feat/020-tweaks` → `preview` · Aufwand M.

## Entscheidungen

1. **„Kein `<button>` ohne Systemklasse" gilt für Schaltflächen, nicht für Zeilenflächen.** Die vier Arten beschreiben Schaltflächen. Interaktive *Flächen* sind etwas anderes und behalten ihre eigene Klasse: Aufgabentitel (`.t`), Teilschritt-Zeile (`.sub-text`), Spaltenkopf (`.col-head`), Finanz-Aufgabenzeile (`.fin-task-title`), Kostenzeile (`.cost-head`), Icon-Knöpfe ohne Wort (`.ico`, `.search-x`) und die Filterflächen, die 016/018/021 ohnehin neu bauen (`.tile`, `.fin-num`, `.money-row`, `.visit-part`, `.gate`). Der Lauf nennt sie am Ende namentlich – 63 Schaltflächen sind umgestellt, 10 Flächen bleiben begründet außen vor.
2. **Verweise auf andere Aufgaben sind Links, keine Schaltflächen.** „wartet auf: <Titel>" und die Abhängigkeits-Chips in der Akte zeigen jetzt `<a href="#task=…">` (Klasse `.tlink`). Der Auftrag verlangt genau das („Titel verlinkt (#task)"), und ein Link in einer Textzeile muss keine 40 px hoch sein.
3. **Tap-Fläche 44 px = 40 px Schaltfläche + 4 px Freiraum.** Der Auftrag sagt „über Zeilenhöhe oder Padding". Ein Pseudo-Element, das die Trefferfläche über die gezeichnete Kante hinaus zieht, trägt in Chrome nicht zuverlässig nach unten (dieselbe Beobachtung wie bei der Gate-Leiste in 013) – deshalb bleibt die Schaltfläche 40 px und jede Knopfzeile hält mindestens 4 px frei. Gemessen wird der Abstand zum nächsten anderen Bedienelement: Minimum im Lauf 48 px.
4. **„wartet auf dich" bleibt ohne Rot.** Das Mockup im Review zeigt den Chip rot hinterlegt (`--danger-bg`). Die Regel aus 013/015 – Rot nur für überfällig und Unwiderrufliches – ist jünger und bindend, der Auftrag selbst sagt „Rot nur überfällig". Der Chip ist deshalb fett mit Umriss in Textfarbe.
5. **Vierter Chip-Fall „du wartest auf Anna" entfällt.** Das Mockup kennt ihn, der Auftrag nennt nur drei Stufen (überfällig › wartet auf dich › blockiert). Die Information steht in der leisen Zeile.
6. **Die Frist verliert den Zusatz „(in 45 Tagen)" aus 013 A5.** 020 verlangt „Frist rechtsbündig als Datum (06.11.)", das Mockup zeigt „morgen" / „01.10." / „seit 19 T.". Genau das ist umgesetzt; die ausführliche Form bleibt in der Akte.
7. **Primär-Knöpfe:** Aufgaben-Home behält „Hinzufügen", Umzugstag „Drucken", Login „Anmelden". Akte und Finanzen haben vorerst **keinen** – ihre bisherigen Primärknöpfe (Kommentar speichern, Speichern in Formularen, An Claude geben) sind Aktionen an einer Zeile und damit sekundär. 017 gibt der Akte „Fertig", 016 der Finanzansicht „Überweisung erfassen".
8. **Update-Leiste:** der Knopf darin ist jetzt sekundär auf dunklem Grund (`.on-ink`), damit das Aufgaben-Home auch mit wartender Version nur einen Primär hat.

## Prüfbericht

Kopfloses Chrome, 380 px und 1280 px, ohne Login und ohne Datenbank (Rekorder statt Supabase, blieb leer). **17 von 17 grün**, keine Konsolenfehler.

Geprüft: alle Schaltflächen 40 px (380) bzw. 32 px (1280), durchgehend 14 px/600, eckig außer Pillen, Tap-Fläche ≥ 44 px (min. 48), höchstens ein Primär je Ansicht (Home, Akte, Finanzen, Umzugstag, Login), Zeile mit überfällig + wartet + Kommentar zeigt genau einen Chip und die leise Zeile, blockierte Zeile gestrichelt und nicht tippbar mit Link auf die blockierende Aufgabe, und nach deren Abhaken wieder tippbar.

`grep` auf `--danger` in `app.css`: nur `.btn-text.danger` (Löschen), `.confirm` (Löschen-Rückfrage), `.sig-chip.late` / `.due.late` / `.tile.late` / `.fin-payments .pill.late` (überfällig) und `.status.err` / `.msg.err` / `.status.off` (Fehlzustand, in CLAUDE.md ausdrücklich ausgenommen).

**Nicht geprüft:** echtes Gerät; Migrationen gibt es in diesem Auftrag keine.
