# Änderungsauftrag 005 – Changelog in der App

Stand: 22.09.2026 · Status: offen · Branch: `feature/changelog` · Modell: Sonnet
Betrifft: Footer, neue Datei `changelog.json`, `CLAUDE.md`, Pages-Workflow

## Ziel

Anna und Sebastian sehen in der App, was sich seit dem letzten Mal geändert hat – in einfacher Sprache, ohne Technikbegriffe. Einstieg: die Versionsnummer im Footer. Antippen öffnet die Liste.

## Struktur

**Datei `changelog.json`** im Repo-Root, von der App zur Laufzeit geladen (kein Build-Step, kein Markdown-Parser):

```json
{
  "entries": [
    {
      "version": "2026.09.22",
      "title": "Updates kommen jetzt zuverlässig an",
      "new": ["Ein Hinweis erscheint, wenn eine neue Version bereitsteht – einmal tippen, fertig."],
      "improved": [],
      "fixed": ["Nach einem Update musste die App manchmal von Hand neu geladen werden. Das ist behoben."]
    }
  ]
}
```

- `version`: Datum des Deploys als `JJJJ.MM.TT`; zwei Deploys am selben Tag bekommen `.2`, `.3`. Diese Nummer steht im Footer.
- `title`: ein Satz, was diese Version für die Nutzer bedeutet.
- `new` / `improved` / `fixed`: je 0–5 Einträge, jeder ein kurzer Satz. Leere Listen werden nicht angezeigt.

**Sprache – Testfrage für jeden Eintrag:** *Versteht Anna, was sich für sie beim Benutzen ändert?* Kein "Service Worker", "Refactoring", "RLS", "Branch". Statt "Filter-State wird persistiert" → "Die App merkt sich, welche Phase du zuletzt offen hattest." Rein technische Änderungen ohne sichtbare Wirkung bekommen keinen Eintrag.

**Anzeige**
- Footer: Versionsnummer als Button, daneben ein kleiner Punkt "Neu", solange die aktuelle Version noch nicht angesehen wurde (pro Gerät gemerkt).
- Antippen öffnet ein Panel "Was ist neu?" mit den letzten Versionen, neueste zuerst, Abschnitte "Neu", "Verbessert", "Behoben". Schließen-Button, Tap-Ziele ≥ 44 px, keine Dialoge.
- Die Version im Footer kommt aus derselben Datei (erster Eintrag), nicht aus einer zweiten Quelle. Falls 003 die Version aus dem Commit-SHA bezieht: Anzeige bleibt die Changelog-Version, der SHA nur als Tooltip/Untertitel.

**Pflege – Regel in `CLAUDE.md`:**
- Jeder PR, der etwas Sichtbares ändert, ergänzt `changelog.json` um einen Eintrag oder erweitert den Eintrag des Tages. PR ohne Changelog-Eintrag bei sichtbarer Änderung gilt als unvollständig.
- Die erste Version fasst rückwirkend zusammen, was seit dem 13.09. sichtbar geändert wurde: Passwort-Login, Dashboard mit Kennzahlen und Phasen-Tabs, Umbenennung Spatzlbau, Update-Hinweis (003).

## Akzeptanzkriterien

- [ ] Version im Footer sichtbar, Antippen öffnet das Panel, Schließen funktioniert
- [ ] "Neu"-Punkt verschwindet nach dem Öffnen und erscheint bei der nächsten Version wieder
- [ ] Erster Eintrag beschreibt die Änderungen seit 13.09. in Alltagssprache
- [ ] `CLAUDE.md` enthält die Pflegeregel und die Testfrage
- [ ] Bei 380 px lesbar, keine Konsolenfehler
