# 014b – Bugfix 2.0.3: Posten lässt sich nicht zurück auf „geschätzt" setzen

Stand: 23.09.2026 · **Status: umgesetzt** · Version 2.0.2 → 2.0.3 · Branch: `fix/014b` von `preview` · Modell: Sonnet · Aufwand: S
Gefunden von Sebastian in der Akte (Bearbeiten → Kosten), Screenshot 18:01.

## Fehler

Zeile `duebel-farbe-a`: `status = bezahlt`, `paid_on = 2026-09-23`, `paid_by = A`. Wer den Stand zurück auf „geschätzt" oder „fest" setzt, verliert die Änderung: `costs_before_write()` setzt `status := 'bezahlt'`, sobald `paid_on` nicht null ist – bei jedem Update, nicht nur beim Eintragen der Zahlung. Die App lässt `paid_on` stehen, also gewinnt der Trigger.

Zweitens zeigt der Kosten-Block der Akte im Bearbeiten-Modus bei einer bezahlten Zeile ein Datumsfeld mit der **Fälligkeit** (27.12.) neben dem Wort „bezahlt" – gelesen wird das als Zahldatum. Und „ändern" öffnet nicht die Bearbeitung nach 016b (Stand als drei Segmente, Betrag, Datum, Wer), sondern nur ein Teilformular.

## Änderung

1. **Trigger** (Migration `018_b014b_paid_on.sql`): `status := 'bezahlt'` nur, wenn `paid_on` neu gesetzt wird – `tg_op = 'INSERT' and new.paid_on is not null` oder `tg_op = 'UPDATE' and new.paid_on is distinct from old.paid_on and new.paid_on is not null`. Umgekehrt: wird `status` auf etwas anderes als `bezahlt` gesetzt und `paid_on` bleibt, dann `paid_on := null, paid_by := null` (Server räumt auf, damit keine Zeile „geschätzt mit Zahldatum" existiert). Rückfluss-Stände analog (`erhalten` ↔ `paid_on`).
2. **App:** Beim Zurücksetzen des Stands `paid_on` und `paid_by` explizit auf null schreiben (nicht nur auf den Trigger verlassen). Gilt in Finanzen (Tabelle, Als Nächstes) und in der Akte.
3. **Akte, Kosten-Block:** bezahlte Zeile zeigt „● ● ● bezahlt · 23.09. · Anna" – Zahldatum, nicht Fälligkeit; kein offenes Datumsfeld im Ansehen. „ändern" öffnet die Posten-Bearbeitung aus 016b (Stand-Segmente geschätzt · fest · bezahlt, Betrag, fällig am, bezahlt am, Wer, Aufgabe) – dieselbe wie in Finanzen, kein zweiter Code.
4. Test: Zeile bezahlt → Stand „geschätzt" → speichern → Reload: geschätzt, `paid_on` null. Zeile geschätzt → „Bezahlt (Anna)" → bezahlt, `paid_on` heute. Zeile bezahlt, Betrag ändern → bleibt bezahlt, `paid_on` bleibt.

## Akzeptanzkriterien

- [x] Migration im Dry-Run (Claude per Connector), dann anwenden – Schreibzugriff freigegeben
- [x] Die drei Tests aus Punkt 4 grün, per Connector nachvollziehbar an `duebel-farbe-a`
- [ ] Akte: „ändern" bei einem Posten öffnet dieselbe Bearbeitung wie in Finanzen
- [x] Regression grün, Bericht ≤ 8 Zeilen, Changelog 2.0.3 (release "2.0"): „Ein bezahlter Posten lässt sich wieder auf geschätzt setzen."
- [x] Merge preview → main (--no-ff), Tag v2.0.3

## Abweichungen und Nachweis (Umsetzung 23.09.2026)

- Einen Stand `erhalten` gibt es in der Datenbank nicht: Rückfluss nutzt dieselbe Spalte (`bezahlt` = erhalten). Die Trigger-Regel deckt ihn damit ohne eigenen Zweig ab.
- „ändern“ in der Akte lief schon über dieselbe Funktion wie Finanzen (`costEditHTML`); geändert wurde nur, was darum herum stand: bezahlte Zeile zeigt „bezahlt · 23.09. · Name“ statt der Fälligkeit, Feld heißt „bezahlt am“ / „erhalten am“ statt „Datum“.
- App: `costPatch` schreibt beim Zurücksetzen `paid_on`/`paid_by` = null; wird in der Bearbeitung „bezahlt“ ohne Datum gewählt, bucht sie heute und die eigene Person. Gilt in Akte und Finanzen (gemeinsamer Code).
- Dry-Run in zurückgerollter Transaktion, danach Migration `018_b014b_paid_on` angewendet; `schema.sql` nachgezogen.
- Tests live an `duebel-farbe-a` per Connector (Ausgangsstand bezahlt · 2026-09-23 · S · 60 €):
  1. `status = geschaetzt` (nur Stand) → geschaetzt, `paid_on` null, `paid_by` null ✓
  2. `paid_by = A, paid_on = heute, status = bezahlt` → bezahlt, 2026-09-23, A ✓
  3. `amount = 61` → bleibt bezahlt, `paid_on` 2026-09-23 ✓
- Endzustand wiederhergestellt: bezahlt · `paid_on` 2026-09-23 · `paid_by` S · 60 € (Stand vor dem Test; `updated_at` ist neu).
- App-Test eingeloggt nicht möglich (Anmeldung mit Passwort) – Darstellung im Browser simuliert (nur Rendern), keine Konsolenfehler.
