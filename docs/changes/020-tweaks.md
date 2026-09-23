# 020 – Tweaks: Button-System und Zeilenregeln

Stand: 23.09.2026 · Meilenstein 2.0 · Branch: `feat/020-tweaks` · Modell: Sonnet · Aufwand: M (viele Stellen, keine Logik)
Quelle: Review v2 Teil C (`design/handoff/2026-09-23/Tweaks.pdf`, lokal). Läuft **vor** 016/017/018 – die drei bauen darauf auf.

## Ziel

Alle Schaltflächen und Zeilensignale der App folgen einem System. Danach ändert kein Auftrag mehr Buttonhöhen, Farben oder Chip-Logik nebenbei.

## 1. Button-System – vier Arten, eine Höhe

| Art | Aussehen | Einsatz | Regel |
|---|---|---|---|
| **Primär** | Tintenfläche, weiße Schrift; auf dunklem Grund invertiert | Der Schritt, der etwas abschließt: "Überweisung erfassen", "Fertig" | Höchstens einer pro Ansicht |
| **Sekundär** | Rahmen, transparent | Aktion an einer Zeile oder Moduswechsel: Antworten, Erinnern, Angebot eintragen, Bearbeiten | beliebig, aber pro Zeile höchstens einer |
| **Text** | unterstrichen, Tintenfarbe | Abschnittsköpfe, Abbrechen, Nachschlagen ("Wie gerechnet?"), "Mehr zeigen" als volle Zeile | Rot nur für Löschen (Rot-Regel aus 013) |
| **Pille** | rund, Zähler erlaubt | Nur Auswahl und Navigation: Filter, Aufgaben/Finanzen, Beratungsthemen | Nie eine Aktion |

- Schrift 14 px / 600, einheitlich.
- Höhe 40 px mobil, 32 px Desktop. Tap-Fläche mobil 44 px über Zeilenhöhe oder Padding (Audit-Regel bleibt).
- Ecken: Primär/Sekundär/Text eckig (4 px), Pille voll rund.
- Tokens in `app.css` (`--btn-h`, `--btn-h-desktop`), Klassen `.btn-primary`, `.btn-secondary`, `.btn-text`, `.pill`. Bestehende Ad-hoc-Stile darauf umstellen, keine Sonderfälle übrig lassen.

## 2. Zeilenregel: ein Signal-Chip (B4)

Heute bis zu fünf Chips pro Aufgabenzeile. Neu:
- Höchstens **ein** Signal-Chip, Vorrang: überfällig › wartet auf dich › blockiert. Farbe nach Rot-Regel (Rot nur überfällig).
- Frist rechtsbündig als Datum ("06.11."), Fristkritisch weiter Gelb.
- Alles andere (neuer Kommentar, bei Claude, Zuständigkeit) als eine leise Textzeile unter dem Titel in `--ink-3`, durch " · " getrennt.

## 3. Zeilenregel: blockierte Aufgabe (B5)

- Checkbox gestrichelt, nicht tippbar (`aria-disabled`, kein Handler).
- Darunter "wartet auf: <Titel der blockierenden Aufgabe>" als Textzeile, Titel verlinkt (#task).
- Wird die Blockade gelöst, wechselt die Zeile ohne Reload (Realtime reicht).

## Nicht in diesem Auftrag

Dashboard-Umschalter, Zeitgruppen, Signal-Filter (→ 018) · Akte Ansehen/Bearbeiten (→ 017) · Finanzen (→ 016). Wo diese Aufträge Buttons brauchen, nutzen sie die Klassen aus 020.

## Akzeptanzkriterien

- [ ] Kein `<button>` ohne eine der vier Klassen (grep im Bericht nennen)
- [ ] Pro Ansicht höchstens ein `.btn-primary` – Aufgaben-Home, Akte, Finanzen, Umzugstag, Login
- [ ] 380 px: alle Buttons 40 px hoch, Tap-Fläche ≥ 44 px; 1280 px: 32 px
- [ ] Aufgabenzeile mit überfällig + wartet + Kommentar zeigt genau einen Chip (überfällig) und die Textzeile
- [ ] Blockierte Aufgabe: Checkbox nicht tippbar, "wartet auf:" mit Link; nach Abhaken der blockierenden Aufgabe wird sie tippbar
- [ ] Rot nur bei überfällig und Löschen (grep auf `--danger`)
- [ ] Zwei Breiten (M), Bericht ≤ 15 Zeilen, Changelog 2.0-Eintrag: "Einheitliche Schaltflächen, ein Signal je Aufgabe, blockierte Aufgaben nicht mehr abhakbar."
