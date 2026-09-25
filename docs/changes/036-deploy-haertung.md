# 036 – Deploy-Härtung: Definition of Done, entkoppelte Jobs, Smoke-Test, `npm run check`

**Status: umgesetzt** (Branch `fix/036` → `preview` → `main`, Abweichungen: `036-abweichungen.md`)

Stand: 25.09.2026 · Release 2.2 · Branch: `fix/036` von `preview` · Modell: Sonnet · Aufwand: S
Anlass: 035 – 20 Stunden ohne Deploy, ohne dass es jemand sah. Entscheidung Sebastian 25.09.: alle vier Maßnahmen, 1 und 4 sind ab sofort Pflicht in jedem Lauf.

## 1 · Definition of Done (CLAUDE.md, freigegeben)

Neuer Abschnitt „Fertig heißt":
> Ein Auftrag ist fertig, wenn (a) `npm run check` grün ist, (b) der Workflow-Lauf des Ziel-Branches grün ist (`gh run watch` auf den eigenen Push), und (c) die Live-URL die neue Version liefert: `curl -s <url>/changelog.json | node -e '…'` – oberster Eintrag = erwartete Version (preview: `…/preview/`, main: `…/`). Der Bericht nennt Run-Nummer und Live-Version. Ein Bericht ohne (b) und (c) ist kein Abschluss.

Dazu in CLAUDE.md unter Git: „`git push` ist kein Deploy. Nach jedem Push auf preview oder main: Run abwarten, Live-Version prüfen."

## 2 · Rückkanal (Sebastian, erledigt 25.09.)

GitHub-Benachrichtigung „Failed workflows only" aktiv. Zusätzlich im Workflow: Schritt `if: failure()` am Ende, der eine Mail an sylv83@gmail.com schickt (Betreff „Spatzlbau Deploy rot · <branch> · <sha>", Body: Link zum Run, fehlgeschlagener Schritt). Umsetzung mit `dawidd6/action-send-mail` oder gleichwertig; SMTP-Zugang als Repository-Secret (nie im Repo). Falls kein SMTP gewünscht: GitHub-Benachrichtigung reicht, Schritt entfällt – im Bericht sagen, welcher Weg.

## 3 · Workflow entkoppeln + Smoke-Test

- Zwei Jobs `build-main` und `build-preview`, unabhängig; ein Job `deploy`, der die Artefakte zusammensetzt. Scheitert ein Build, nimmt `deploy` für diesen Branch das **zuletzt erfolgreich gebaute Artefakt** (Actions-Cache oder `actions/upload-artifact` mit festem Namen je Branch, Retention 30 Tage) und deployt den anderen Branch normal. Ein roter Branch blockiert den anderen nie mehr.
- Job `smoke` nach `deploy`: `curl` auf `…/changelog.json` und `…/preview/changelog.json`, oberste Version je Branch = Version aus dem jeweiligen Quell-Commit; zusätzlich `index.html` beider Pfade liefert 200 und enthält den Service-Worker-Verweis. Bei Abweichung: Job rot (Deploy bleibt, aber die Meldung kommt).
- `concurrency` je Branch, damit ein neuer Push den alten Lauf abbricht statt zweimal zu deployen.

## 4 · `npm run check` (Pflicht vor jedem Commit)

Ein Skript `scripts/check.mjs`, aufrufbar als `npm run check`, ohne Abhängigkeiten:
1. Alle `*.json` im Repo parsen (außer `node_modules`, `design/`); Fehler mit Datei und Zeile.
2. Service-Worker-`SHELL`-Liste: jede Datei existiert; jede JS/CSS-Datei unter `app/` (bzw. dem tatsächlichen Verzeichnis) steht in der Liste – die Lücke aus 2.0.1.
3. `changelog.json`: oberster Eintrag hat `version`, `date`, `release`, `lines`; Version dreiteilig oder Datumsform (CLAUDE.md-Regel); oberste Version ≠ die von `git describe --tags` bereits vergebene (verhindert doppelte Tags).
4. Exit 1 bei jedem Fund, sonst „check ok".

Der Workflow ruft dasselbe Skript als ersten Schritt auf (ersetzt den Validate-Schritt aus 035). CLAUDE.md: „Vor jedem Commit `npm run check`; der Commit-Bericht nennt das Ergebnis." Optional ein `.githooks/pre-commit`, das es aufruft (`git config core.hooksPath .githooks`) – nur, wenn es ohne weitere Werkzeuge läuft.

## Tests

- `changelog.json` absichtlich mit einem geraden Anführungszeichen in einer Zeichenkette → `npm run check` rot mit Zeilenangabe; zurück → grün.
- Datei aus der SHELL-Liste umbenennen → rot; zurück → grün.
- Push auf `fix/036` mit kaputter changelog.json auf preview (Testbranch, sofort revertiert) → preview-Build rot, main wird trotzdem deployt, Smoke für main grün, für preview rot mit der alten Version; Failure-Mail kommt an.
- Sauberer Lauf: beide Builds, Deploy, Smoke grün; Bericht enthält Run-Nummer und beide Live-Versionen.

## Akzeptanzkriterien

- [x] CLAUDE.md: Abschnitt „Fertig heißt" und die `npm run check`-Zeile vorhanden
- [x] Vier Tests grün; GitHub-Benachrichtigung dokumentiert (kein SMTP-Secret vorhanden, siehe Abweichungen)
- [x] Workflow: zwei Build-Jobs, Deploy mit Fallback, Smoke, Concurrency
- [x] Merge nach preview, `--no-ff` nach main, Tag v2.2.1; Changelog 2.2.1: „Der Betrieb meldet sich, wenn etwas nicht ankommt." Bericht ≤ 8 Zeilen **mit Run-Nummer und Live-Versionen** – das ist ab jetzt die Form jedes Berichts.
