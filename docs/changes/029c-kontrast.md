# 029c – Kontrastmatrix (Punkt 1)

Alle Text-Tokens × beide Gründe (`--paper`, `--card`). Ziel ≥ 4,5:1 (Text ≤ 18 px). Berechnet nach
der WCAG-Formel (relative Luminanz, `(L1+0,05)/(L2+0,05)`). `--paper` (`#f4f6f2`) unverändert seit
029b, keine Layout-Änderung durch diese Prüfung.

| Token | Wert | Grund | Verhältnis vorher | Verhältnis nachher | Status |
|---|---|---|---|---|---|
| `--ink` | `#1e2b24` | `--paper` | 13,54:1 | 13,54:1 | grün |
| `--ink` | `#1e2b24` | `--card` | 14,72:1 | 14,72:1 | grün |
| `--ink-2` | `#4d5751` | `--paper` | 6,90:1 | 6,90:1 | grün |
| `--ink-2` | `#4d5751` | `--card` | 7,51:1 | 7,51:1 | grün |
| `--ink-3` | `#616161` | `--paper` | 5,70:1 | 5,70:1 | grün |
| `--ink-3` | `#616161` | `--card` | 6,19:1 | 6,19:1 | grün |
| `--seb` (Sebastian) | `#2e5a9c` | `--paper` | 6,31:1 | 6,31:1 | grün |
| `--seb` (Sebastian) | `#2e5a9c` | `--card` | 6,87:1 | 6,87:1 | grün |
| `--anna` (Anna) | `#9a3d64` | `--paper` | 5,99:1 | 5,99:1 | grün |
| `--anna` (Anna) | `#9a3d64` | `--card` | 6,51:1 | 6,51:1 | grün |
| `--both` (Gemeinsam) | `#2f6f4e` | `--paper` | 5,51:1 | 5,51:1 | grün |
| `--both` (Gemeinsam) | `#2f6f4e` | `--card` | 5,99:1 | 5,99:1 | grün |
| `--claude` | `#6b4e16` | `--paper` | 7,08:1 | 7,08:1 | grün |
| `--claude` | `#6b4e16` | `--card` | 7,70:1 | 7,70:1 | grün |
| `--ok` | `#2f6f4e` | `--paper` | 5,51:1 | 5,51:1 | grün |
| `--ok` | `#2f6f4e` | `--card` | 5,99:1 | 5,99:1 | grün |
| `--danger` | `#b33a2e` | `--paper` | 5,42:1 | 5,42:1 | grün |
| `--danger` | `#b33a2e` | `--card` | 5,90:1 | 5,90:1 | grün |
| `--link` | `#2e5a9c` | `--paper` | 6,31:1 | 6,31:1 | grün |
| `--link` | `#2e5a9c` | `--card` | 6,87:1 | 6,87:1 | grün |
| `--mark-deep` („--mark-ink" im Auftragstext) | `#8a7300` → **`#7a6600`** | `--paper` | **4,26:1 – FAIL** | 5,18:1 | grün (gedunkelt) |
| `--mark-deep` | `#8a7300` → `#7a6600` | `--card` | 4,63:1 | 5,63:1 | grün |
| `--decision` (neu, 032b) | `#5c2e91` | `--paper` | – | 8,56:1 | grün |
| `--decision` (neu, 032b) | `#5c2e91` | `--card` | – | 9,31:1 | grün |
| `--decision` (neu, 032b) | `#5c2e91` | `--decision-bg` (`#efe9f7`) | – | 7,84:1 | grün |

## Ergebnis

- **Ein Paar fiel durch:** `--mark-deep` auf `--paper` (4,26:1). Alle anderen Paare waren bereits
  grün – der 029b-Rückbau des Seitengrunds (`--paper` auf `#f4f6f2`, dunkler als das vorherige
  `#fafafa`) hatte Sekundärtext und Personenfarben schon über 4,5:1 gebracht, ohne dass das damals
  gemessen wurde.
- **Gedunkelt:** nur `--mark-deep` (`#8a7300` → `#7a6600`), von 4,26:1 auf **5,18:1** – der größte
  Sprung in dieser Matrix, weil es der einzige Fund war. `--paper` selbst unverändert.
- `--mark-deep` steht in der App aktuell nirgends als laufender Text (CLAUDE.md: „nie für Text");
  der Wert ist jetzt für eine künftige Verwendung bereit, ohne dass dieses Verbot hier aufgehoben
  wird (keine Freigabe dafür in diesem Auftrag).
- Owner-Hintergründe (`--seb-bg` etc.), `--line`, `--line-dash`, `--mark` selbst: bewusst nicht
  Teil dieser Matrix (Flächen/Rahmen, keine Text-Token, CLAUDE.md-Regel unverändert).
- **Nachtrag 032b:** `--decision` (Entscheidungs-Kommentare, Violett) neu aufgenommen - alle drei
  Paare (auf `--paper`, `--card`, dem eigenen `--decision-bg`) liegen deutlich über 4,5:1.
