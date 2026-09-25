# 036 – Abweichungen und Entscheidungen

Stand: 25.09.2026 · Branch `fix/036` → `preview` · Aufwand S

## Entscheidungen im Zweifel

1. **Kein SMTP-Secret vorhanden** (`gh secret list`, 25.09.2026: nur `BACKUP_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`). Kein Mail-Schritt – GitHub-Benachrichtigung
   „Failed workflows only" ist aktiv und reicht als Rückkanal, im Workflow selbst dokumentiert
   (Kommentarkopf `pages.yml`). Ein Mail-Schritt lässt sich nachrüsten, sobald ein SMTP-Secret da
   ist.
2. **Fallback über `actions/cache`, nicht `upload-artifact` mit festem Namen.** Der Auftrag
   erlaubt beides; Cache mit `restore-keys` (Präfix statt exaktem Key) liefert von selbst „die
   neueste passende Ablage", also genau „das zuletzt erfolgreich gebaute Artefakt" – ohne einen
   fremden Lauf per API suchen zu müssen. `upload-artifact` bleibt daneben für die
   build→deploy-Übergabe innerhalb desselben Laufs (Retention 1 Tag, dafür reicht das).
3. **Ein Rand-Fall bleibt offen:** Hat `main` noch nie einen erfolgreichen Build gehabt (keine
   Cache-Ablage), bricht `deploy` für beide Seiten ab, auch wenn `preview` sauber wäre – die Wurzel
   der Seite („/") kann nicht leer bleiben. In diesem Repo mit seiner Historie kann das nicht mehr
   eintreten; nicht weiter gehärtet (Aufwand S).
4. **`changelog.json`-Feld „lines" (Auftrag Punkt 4.3)** existiert nicht als Feldname – die Datei
   kennt `new`/`improved`/`fixed`. Gelesen als „mindestens eine Zeile Inhalt über die drei Listen
   zusammen", zusätzlich zur harten Pflicht aus CLAUDE.md (`title`).
5. **Node 20 explizit über `actions/setup-node`** in allen vier Jobs, die `node` aufrufen (baut auf
   der Backup/Seed-Workflow-Konvention auf) – kein Verlass auf die undokumentierte, jederzeit
   änderbare Node-Version von `ubuntu-latest`.
6. **`concurrency` je Branch** (`pages-${{ github.ref_name }}`), wie im Auftrag verlangt, nicht
   mehr global wie vorher. Da jeder Lauf ohnehin main **und** preview zusammen deployt, schützt
   zusätzlich Pages' eigene Umgebungssperre (`environment: github-pages`) vor zwei gleichzeitigen
   Deploys unterschiedlicher Läufe.

## Tests

Reihenfolge wie im Auftrag; 1 und 2 lokal, 3 und 4 real (Live-Läufe, siehe Bericht für
Run-Nummern).

| # | Prüfung | Ergebnis |
| --- | --- | --- |
| 1 | `changelog.json` mit geradem Anführungszeichen → rot mit Zeile; zurück → grün | `check ok` / `FEHLER: changelog.json (Zeile 7): … (line 7 column 48)` |
| 2 | `app/groups.js` umbenannt → rot; zurück → grün (zusätzlich geprüft: neue `app/`-Datei fehlt in SHELL → auch rot) | „sw.js SHELL: 'app/groups.js' existiert nicht" |
| 3 | `fix/036` → `preview` mit kaputter `changelog.json` (Testbranch, sofort revertiert): preview-Build rot, main deployt, Smoke main grün, Smoke preview rot mit alter Version | siehe Bericht |
| 4 | Sauberer Lauf: beide Builds, Deploy, Smoke grün | siehe Bericht |
