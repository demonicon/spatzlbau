// Die Leiter (docs/changes/038 E5). Until now a rung was a glyph (●○○) and 029b P14 gave it a
// colour of its own (grey → ink → green). The export replaces both: four-pixel segments in ink
// for what is reached and --line for what is not, and no colour at all - the state is said in
// words next to it. E5 takes 029b P14 back with that.
//
// One component for every ladder in the app: Posten, Verträge, Anfragen, "Als Nächstes zahlen".
import { esc } from './dom.js';

/**
 * @param {number} reached how many rungs are behind us (0 … total)
 * @param {number} total   how many rungs there are (3 or 4)
 * @param {string} [word]  the state as a word, next to the segments
 * @param {string} [title] the tooltip of the whole ladder
 */
export function ladderHTML(reached, total, word = '', title = '') {
  const segs = Array.from({ length: total }, (_, i) => `<span class="ldr-s${i < reached ? ' on' : ''}"></span>`).join('');
  return `<span class="ldr"${title ? ` title="${esc(title)}"` : ''}><span class="ldr-b" aria-hidden="true">${segs}</span>${
    word ? `<span class="ldr-w">${esc(word)}</span>` : ''
  }<span class="vh">Stufe ${reached} von ${total}${word ? ': ' + esc(word) : ''}</span></span>`;
}
