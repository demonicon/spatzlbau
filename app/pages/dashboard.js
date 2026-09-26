// Seitentyp 2: Dashboard (docs/changes/038, Abweichungsliste #12 bis #17, E8, E9, E11).
// One answer at the top, the tiles under it as filters, collapsible sections below, and a rail
// on the right. Finanzen is the first page of this type; the Posten- and Verträge-Sektionen of
// 031 find their place here without this file having to change again.
//
// The rule this type carries (#13, Regeländerung in rules/design.md): one primary per section
// head, not one per view - the anlegen action of a section is the step that finishes something
// there. The rail carries none.
import { esc } from '../ui/dom.js';
import { CHEV } from '../ui/icons.js';

/** Die Antwortzahl (E9): Label 12 caps, Zahl 60/600, Rechenweg 14 darunter - und rechts daneben,
    wenn die Seite eins mitgibt, die Mini-Balken als eigene Karte. */
export function answerHTML({ label, value, unit = '', derivation = '', aside = '' }) {
  return `<section class="db-answer">
    <div class="db-a-main">
      <div class="db-a-label">${esc(label)}</div>
      <div class="db-a-value"><span class="n">${esc(value)}</span>${unit ? `<span class="u">${esc(unit)}</span>` : ''}</div>
      ${derivation ? `<div class="db-a-calc">${derivation}</div>` : ''}
    </div>
    ${aside}
  </section>`;
}

/** Eine Kachel (E8): min 88, Label 13 oben, Wert 24/600, Zusatz 12. Aktiv = Umriss 1,5 Tinte.
    `tone` faerbt nur den Wert: 'ok' fuer Gutschriften (Rueckfluesse), sonst Tinte. Rot bleibt
    ueberfaellig vorbehalten (rules/design.md). */
export function tilesHTML(tiles, { act = 'db-tile', label = 'Kennzahlen' } = {}) {
  if (!tiles.length) return '';
  return `<div class="db-tiles" role="group" aria-label="${esc(label)}">${tiles
    .map(
      (t) => `<button class="db-tile${t.tone ? ' t-' + t.tone : ''}" data-act="${act}" data-to="${esc(t.key)}" aria-pressed="${!!t.on}">
      <span class="db-t-l">${esc(t.label)}</span>
      <span class="db-t-v">${esc(t.value)}</span>
      <span class="db-t-n">${esc(t.note || '')}</span>
    </button>`,
    )
    .join('')}</div>`;
}

/** Ein Sektionskopf mit seinem Inhalt (#13): Name · Zahl · Fortschritt · aktiver Filter ·
    Anlegen · Chevron. Ein eingeklappter Abschnitt zeigt seinen Kopf weiter - die Zahl ist die
    Information, auch ohne die Liste darunter. */
export function sectionHTML({ key, title, count = '', progress = null, filter = null, add = null, open = true, body = '' }) {
  const head = `<div class="sect-h">
    <h2 class="sect-t">${esc(title)}</h2>
    ${count === '' ? '' : `<span class="sect-n">${esc(String(count))}</span>`}
    ${
      progress
        ? `<span class="sect-bar"><span class="bar"><i data-pct="${progress.pct}"></i></span><span class="sect-prog">${esc(progress.text)}</span></span>`
        : ''
    }
    ${filter ? `<button class="fpill on sect-filter" data-act="${filter.act}" aria-label="Filter entfernen">${esc(filter.label)}<span class="x" aria-hidden="true">×</span></button>` : ''}
    <span class="spacer"></span>
    ${
      add
        ? `<button class="${add.primary ? 'btn-primary' : 'btn-secondary'} sect-add-btn" data-act="${add.act}" aria-label="${esc(add.label)}"><span class="sect-add-l">${esc(add.label)}</span><span class="sect-add-s" aria-hidden="true">+</span></button>`
        : ''
    }
    <button class="ico sect-chev${open ? ' up' : ''}" data-act="db-section" data-to="${esc(key)}" aria-expanded="${open}" aria-controls="sect-${esc(key)}" aria-label="${open ? 'Einklappen' : 'Ausklappen'}: ${esc(title)}">${CHEV}</button>
  </div>`;
  return `<section class="sect db-sect" data-sect="${esc(key)}">${head}${open ? `<div id="sect-${esc(key)}">${body}</div>` : ''}</section>`;
}

/**
 * The page.
 * @param {string} cfg.answer   the answer row (answerHTML)
 * @param {string} cfg.tiles    the tile row (tilesHTML)
 * @param {string} cfg.lead     what stands between the tiles and the sections ("Als Nächstes")
 * @param {string} cfg.sections the sections, in order
 * @param {string} cfg.side     the rail on the right (400) - on a phone it falls apart: the
 *                              first block goes up under the tiles, the rest is already part of
 *                              `sections` (#16)
 * @param {string} cfg.sideTop  the one block of the rail a phone keeps at the top (Ausgleich)
 */
export function dashboardPageHTML({ key, wide, answer = '', tiles = '', lead = '', sections = '', side = '', sideTop = '', after = '' }) {
  const main = `<div class="db-main">${answer}${tiles}${wide ? '' : sideTop}${lead}${sections}</div>`;
  return `<div class="board db db-${key}${wide ? ' db-wide' : ''}">${main}${wide ? `<aside class="db-side" aria-label="Ausgleich, laufende Kosten, Rahmendaten">${sideTop}${side}</aside>` : ''}</div>${after}`;
}
