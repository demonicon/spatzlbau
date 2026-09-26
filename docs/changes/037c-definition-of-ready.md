# 037c – Definition of Ready: Klärung vor jedem Auftrag

Stand: 25.09.2026 · Status: umgesetzt · Release 2.2 · Branch: `chore/037c` von `preview` (Merge cf29543) · Modell: Sonnet · Aufwand: S · Art: Chore · Klärung: Chat, 25.09.
Anweisung Sebastian 25.09.: „Beziehe mich ab sofort mehr in die Entwicklung ein und stelle mindestens drei Fragen, um Kontext und Ziel klar zu haben – das darf auch Claude Code machen." Kein Changelog, kein Release.

## Klärung (Sebastian, 25.09. 22:44)

1. Geltungsbereich – auch Bugfixes? → **Nur Features.** → Konsequenz: DoR greift bei Aufträgen mit Kennzeichen `Feature` (Kopfzeile bekommt das Feld `Art: Feature | Bugfix | Chore`); Bugfixes und Chores starten ohne Schritt 0.
2. Wer antwortet? → **Sebastian.** → Konsequenz: Fragen gehen immer an Sebastian; betrifft eine Frage Annas Nutzung, holt er die Antwort selbst und trägt sie ein – Claude Code fragt nie Anna.
3. Wo festhalten? → **Abschnitt „Klärung" oberhalb von „Änderungen".** → Konsequenz: Vorlage und Reviewer-Prüfpunkt wie unten.

## Änderungen

1. **Kopfzeile jedes Auftrags** erhält `Art: Feature | Bugfix | Chore`. Fehlt das Feld, gilt `Feature`.
2. **CLAUDE.md, Kern (freigegeben):** „Definition of Ready (Features): Ein Feature-Auftrag startet erst, wenn Kontext und Ziel mit mindestens drei Fragen an Sebastian geklärt sind. Die Antworten stehen im Auftrag unter „Klärung". Bugfix und Chore starten direkt."
3. **Skill `/auftrag`, neuer Schritt 0 (vor dem Branch), nur bei `Art: Feature`:** Auftragsdatei lesen. Fehlt der Abschnitt „Klärung" oder hat er weniger als drei beantwortete Fragen → mindestens drei Fragen per AskUserQuestion an Sebastian stellen: Ziel („Woran erkennst du, dass es gelungen ist?"), Kontext („Wer nutzt das zuerst, auf welchem Gerät, in welcher Situation?"), Abgrenzung („Was gehört ausdrücklich nicht dazu?"), dazu auftragsspezifische Unklarheiten aus dem Text – Fragen, deren Antwort schon im Auftrag steht, werden nicht gestellt. Antworten als „Frage → Antwort → Konsequenz" in den Abschnitt „Klärung" schreiben und committen, dann weiter. Bei Aufwand M/L zusätzlich im Plan-Stopp (Schritt 3) die offenen Fragen aus der Erkundung stellen.
4. **Reviewer, Prüfpunkt e (nur Feature):** Abschnitt „Klärung" vorhanden, ≥ 3 beantwortete Fragen, und jede Konsequenz findet sich in Änderungen oder Tests wieder – sonst Lücke.
5. **Auftragsvorlage** (`docs/changes/_vorlage.md`): Abschnitt „Klärung" fest zwischen Kopf und Änderungen, mit den drei Standardfragen als Platzhalter. Claude im Chat schreibt keinen Feature-Auftrag mehr ohne vorherige drei Fragen an Sebastian; der Auftrag trägt dann im Kopf „Klärung: Chat, <Datum>" und Schritt 0 entfällt, sofern der Abschnitt vollständig ist.

## Tests

- `Art: Feature` ohne „Klärung" → Schritt 0 stoppt mit drei Fragen, schreibt die Antworten in die Datei, committet, geht weiter.
- `Art: Feature` mit „Klärung" und drei Antworten → kein Stopp. `Art: Bugfix` ohne „Klärung" → kein Stopp.
- Reviewer gegen einen Feature-Diff, dessen Klärung eine Konsequenz nennt, die nirgends umgesetzt ist → Lücke.

## Akzeptanzkriterien

- [x] CLAUDE.md-Zeile (≤ 50 Zeilen bleiben – ggf. eine andere Zeile nach rules/ verschieben), Kopffeld `Art`, Skill-Schritt 0, Reviewer-Punkt e, Vorlage
- [x] Drei Tests grün (Test 2 Bugfix-Teil real per zweitem Testauftrag geprüft, siehe Abweichungen); Merge preview (Commit cf29543), kein Release, kein Changelog-Eintrag; Run [36191180787](https://github.com/demonicon/spatzlbau/actions/runs/36191180787) grün, Live-Version `/preview/` unverändert 2.2.5
