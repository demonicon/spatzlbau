# 039 – Timeline: Filter „neu" wirkt auch dort

Stand: 26.09.2026 · Branch: noch nicht angelegt (folgt in eigener Session) · Modell: Sonnet · Aufwand: S · Art: Feature
Anlass: Abweichung aus 038c – `timeline.js` liest `ui.filter` nicht, nur Phase/Suche/Besitzer. Die Pille „neu" (und mit ihr überfällig/fristkritisch/wartet auf dich) filtert die Timeline deshalb nicht, obwohl sie in Personen/Phasen filtert.

## Klärung (Sebastian, 26.09.)

1. **Eigener Auftrag oder Nachtrag zu 038c?** → *Eigener Auftrag 039.* → Konsequenz: eigene Branch/Session, folgt der Session-Regel aus Auftrag 037 (nicht in derselben Session wie die 038c-Tests umgesetzt).
2. **Umfang – alle vier Pillen oder zunächst nur eine?** → *Zunächst nur „neu".* → Konsequenz: überfällig/fristkritisch/wartet auf dich filtern die Timeline weiterhin nicht – das bleibt eine offene Lücke für einen späteren Auftrag, hier nicht mit umbauen.
3. **Leere Phasen nach dem Filtern – Schiene bleibt oder verschwindet?** → *Schiene bleibt sichtbar.* → Konsequenz: eine Phase ohne Treffer bleibt als leere Schiene erkennbar (Orientierung), nur ohne Aufgaben-Punkte – wie das Verhalten in Personen/Phasen, wo die Struktur stehen bleibt.

## Änderungen

1. `app/views/timeline.js` liest zusätzlich `ui.filter === 'neu'` (Kriterium wie `unseenComments(t).length > 0`, dieselbe Funktion wie beim Badge/der Pille in 038c) und blendet Aufgaben ohne neue Kommentare aus, wenn die Pille „neu" aktiv ist. Phasen-Schienen bleiben immer gezeichnet, auch ohne Treffer.
2. Die Pille „neu" bleibt in der Filterleiste über allen drei Unteransichten (Personen/Phasen/Timeline) sichtbar und wirkt jetzt überall gleich.

## Tests

- Pille „neu" aktivieren auf der Timeline: nur Aufgaben mit mindestens einem neuen Kommentar erscheinen, ihre Phasen-Schienen bleiben sichtbar (auch wenn andere Phasen dadurch leer werden).
- Pille „neu" wieder abwählen: Timeline zeigt wieder alle Aufgaben.
- Wechsel Personen → Timeline mit aktiver Pille „neu": Filter bleibt beim Ansichtswechsel erhalten (wie bei den anderen drei Pillen schon heute).
- Regression: überfällig/fristkritisch/wartet auf dich bleiben auf der Timeline weiterhin ohne Wirkung (bewusst, s. Klärung 2) – kein neuer Fehlerbericht dafür.

## Akzeptanzkriterien

- [ ] Tests grün mit beiden Testkonten
- [ ] Merge preview; Changelog-Eintrag (Patch-Version)
- [ ] Bericht mit Run-Nummer, Live-Version, Ist-Laufzeit
