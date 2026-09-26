# 038c – Nachlauf Seitensystem: „neu seit deinem Besuch", Einmalkosten im Vergleich

**Status: umgesetzt – ein offener Punkt** (Login-Tests am 26.09. real nachgeholt, Test 4 hat eine ungelöste Nebenwirkung in echten Finanzdaten; siehe Nachtrag in `docs/changes/038c-abweichungen.md`)

Stand: 26.09.2026 · Meilenstein 2.3 · Branch: `feat/038c` von `preview` · Modell: Sonnet · Aufwand: S · Art: Feature · Klärung: Chat, 26.09.
Anlass: Abweichungen aus 038 (Zwischen euch entfallen; Vergleichstabelle ohne „Einmalig"). **Startklar** (Sebastian 26.09. 11:30: ohne Anna-Teil); Annas Befund vom Wochencheck wird ein eigener Auftrag 038d.

## Klärung (Sebastian, 26.09. 11:28)

1. **„neu seit deinem Besuch" – nur Pille oder auch Badge?** → *Beides.* → Konsequenz: Badge am Tab „Aufgaben" (Zahl neuer Kommentare seit `last_visit_at`, wie „wartet auf dich" bei Entscheidungen) und Filter-Pille „neu · n" in Liste+Panel, nur mit n > 0 (030). Der Badge ist der Ersatz für „Zwischen euch", die Pille der Weg dahin.
2. **Feld „Einmalig" jetzt oder mit 031?** → *Jetzt.* → Konsequenz: `brief.vergleich.offers[].setup_fee` (Zahl, optional) als Konvention in 033 nachgetragen; Vergleichstabelle zeigt Zeile „Einmalig"; Claude-Lauf-Prompt liefert das Feld (macht Claude im Chat, nicht Claude Code). **Keine SQL-Migration** – `brief` ist jsonb.
3. **Nutzertest Anna – wer hält fest?** → *Sebastian beobachtet und meldet Änderungswünsche.* → Konsequenz (revidiert 11:30): Annas Punkte werden nach dem Wochencheck als **038d** geschrieben; 038c läuft heute ohne sie.

## Änderungen

1. **Badge „neu" am Tab Aufgaben** (Tab-Leiste 380 und Unterstrich-Tab 1280): Zahl der Kommentare anderer Autoren seit `settings.last_visit_at` der angemeldeten Person, ohne eigene; verschwindet beim Öffnen der betroffenen Akte (wie `seen_comments` heute). Badge-Komponente aus 038 (18, Tinte, Zahl hinter dem Label / an der Icon-Ecke).
2. **Filter-Pille „neu · n"** in Aufgaben (alle drei Unteransichten), Position nach „wartet auf dich"; nur bei n > 0. Filter zeigt Aufgaben mit mindestens einem neuen Kommentar. „neu" ist nur Filter, kein Zeilen-Signal – ein Signal je Zeile bleibt (Datum/Frist/wartet auf dich).
3. **Vergleichstabelle Zeile „Einmalig"**: `offers[].setup_fee` als Betrag (€, tabular); fehlt das Feld → „–". In der transponierten Handy-Fassung als vierte Detailzeile. `docs/changes/033-anfragen.md` bekommt das Feld in der `vergleich`-Struktur (Nachtrag, nicht Umschreibung). „Wählen" bei Einmalkosten: Posten `fest` in Höhe `setup_fee` zusätzlich zur monatlichen `recurring`-Zeile (033-Regel erweitert).
4. *(entfällt – Befund Anna → 038d)*
5. **Abgrenzung:** keine Konsolidierung (038b), keine 031-Inhalte, kein Wieder-Einbau des Blocks „Zwischen euch".

## Tests

- Login A schreibt Kommentar an Aufgabe X; Login S (letzter Besuch davor) sieht Badge „1" am Tab Aufgaben und Pille „neu · 1"; Öffnen der Akte → Badge 0, Pille weg. Testkommentar danach entfernt, Nachweis per Abfrage.
- Eigener Kommentar erzeugt keinen Badge.
- Anfrage mit `setup_fee` in zwei von fünf Angeboten → Zeile „Einmalig" zeigt Betrag bzw. „–"; 380: vierte Detailzeile.
- „Wählen" bei Angebot mit `setup_fee` 39,99 und `price_kind` monat → `recurring`-Zeile + Posten fest 39,99 €.

## Akzeptanzkriterien

- [ ] Tests grün mit beiden Testkonten – am 26.09. real nachgeholt, Tests 1–3 grün, Test 4 funktional bestätigt aber mit offener Nebenwirkung im echten `recurring`-Wert „Internet" (Details in den Abweichungen). Reviewer nach drei Runden ohne Lücken.
- [x] 033 Nachtrag `setup_fee` committet – Claude-Lauf-Prompt-Anpassung ist Sache von Claude im Chat (Klärung 2), hier nicht enthalten
- [x] Merge preview; Changelog 2.3.1: „Neue Kommentare seit deinem Besuch als Badge und Filter; Vergleich zeigt Einmalkosten." – `/release 2.3.1` bleibt Sebastians Schritt
- [x] Bericht mit Run-Nummer, Live-Version beider Pfade, Ist-Laufzeit
