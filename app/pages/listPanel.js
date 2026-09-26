// Seitentyp 1: Liste + Panel (docs/changes/038, Abweichungsliste #4 bis #8, #18 bis #24).
// Aufgaben (Personen, Phasen, Timeline), Entscheidungen und Anfragen are the same page with a
// different configuration - before 038 each of them built its own board, its own panel head and
// its own way back on a phone (038a-matrix.md, Merkmale 4 and 5).
//
// Three rules the type carries for every page that uses it:
//   - Desktop: list 1fr, panel 400 fixed. Nothing selected shows the first row (#7), so the
//     panel is never an empty column; the ✕ only exists where the Akte is an overlay.
//   - Anfragen is the one exception (#21): list 320 left, detail 1fr right - the comparison
//     table needs the width.
//   - Phone: the list is the page, a tap opens the detail as its own page with "‹ <Liste>"
//     (#8). Browser-Zurück lands on the list again, at the scroll position it was left at.
import { esc } from '../ui/dom.js';

/** The bar that replaces the head on a phone detail page (#8, Maße 380: 48 hoch, 44 Tap). */
export function backBarHTML(label, act, extra = '') {
  return `<div class="page-back"><button class="back-btn" data-act="${act}">‹ ${esc(label)}</button><span class="spacer"></span>${extra}</div>`;
}

/**
 * @param {object} cfg
 * @param {string} cfg.key          route key, becomes a class on the board
 * @param {boolean} cfg.wide        >= 900 px
 * @param {boolean} cfg.panelMode   the panel stands next to the list (>= 1180 px)
 * @param {string} cfg.list         the list column (head, filters, rows or table)
 * @param {string} cfg.panel        the panel for the current selection, '' for none
 * @param {string} cfg.panelEmpty   what the panel says when there is nothing to select at all
 * @param {string} [cfg.detail]     the phone detail page; without it the phone stays on the list
 * @param {string} [cfg.backLabel]  the name of the list on the phone detail page
 * @param {string} [cfg.backAct]    the data-act that closes the detail page
 * @param {string} [cfg.layout]     'panel' (default) or 'wide' for Anfragen's 320 | 1fr
 * @param {string} [cfg.after]      overlays and sheets that belong to the page
 */
export function listPanelHTML(cfg) {
  const { key, wide, panelMode, list, panel, panelEmpty, detail, backLabel, backAct, layout = 'panel', after = '' } = cfg;
  // phone: the detail is a page of its own, not a third column and not an inline block (#8)
  if (!wide && detail) {
    return `<div class="board lp lp-${key} lp-detail">${backBarHTML(backLabel, backAct)}<div class="col-list">${detail}</div></div>${after}`;
  }
  const side = wide && (layout === 'wide' || panelMode);
  const aside = !side
    ? ''
    : panel
      ? `<aside class="panel" id="panel" aria-label="${esc(cfg.panelLabel || 'Akte')}"${cfg.panelId ? ` data-id="${cfg.panelId}"` : ''}>${panel}</aside>`
      : `<aside class="panel empty" id="panel" aria-label="${esc(cfg.panelLabel || 'Akte')}">${panelEmpty}</aside>`;
  const cls = ['board', 'lp', 'lp-' + key, side ? (layout === 'wide' ? 'lp-wide' : 'lp-panel') : ''].filter(Boolean).join(' ');
  return `<div class="${cls}"><div class="col-list">${list}</div>${aside}</div>${after}`;
}

/** The filter pills of a list (#5, #11): one row, a pill only while it counts something (030). */
export function filterPillsHTML(pills, { act = 'filter-pill', label = 'Filter' } = {}) {
  const shown = pills.filter((p) => p.always || p.n > 0);
  if (shown.length < 2) return '';
  return `<div class="fpills" role="group" aria-label="${esc(label)}">${shown
    .map(
      (p) => `<button class="fpill" data-act="${act}" data-to="${esc(p.key)}" aria-pressed="${!!p.on}">${esc(p.label)}${
        p.n === undefined ? '' : `<span class="fpill-n">${p.n}</span>`
      }</button>`,
    )
    .join('')}</div>`;
}
