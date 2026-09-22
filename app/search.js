// Search over task and subtask titles (docs/changes/012). Pure functions: no DOM, no writes.
// The term lives in ui.q while the app is open and is deliberately not stored anywhere.
import { esc } from './ui/dom.js';
import { ui, subsOf } from './state.js';

// "kuendigen" has to find "kündigen" and the other way round, so both sides are folded to the
// long form before they meet. Everything else is plain lower case.
const FOLD = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', é: 'e', è: 'e', ê: 'e', á: 'a', à: 'a', ç: 'c' };

/** Folded text plus a map from every folded character back to its place in the original. */
function fold(s) {
  const src = String(s ?? '');
  let text = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    const low = src[i].toLowerCase();
    for (const ch of FOLD[low] || low) {
      text += ch;
      map.push(i);
    }
  }
  map.push(src.length); // one past the end, so a hit that ends on the last character maps cleanly
  return { text, map };
}

export const term = () => (ui.q || '').trim();
export const searching = () => term().length > 0;

/** Where `q` sits inside `text`, as ranges of the original string. */
export function ranges(text, q) {
  const needle = fold(q).text;
  if (!needle) return [];
  const { text: hay, map } = fold(text);
  const out = [];
  for (let i = hay.indexOf(needle); i > -1; i = hay.indexOf(needle, i + needle.length)) {
    const a = map[i];
    // a hit that starts inside the "ae" of an "ä" marks the whole letter, never half of it
    out.push([a, Math.max(map[i + needle.length], a + 1)]);
  }
  return out;
}

export const hitsTitle = (t, q = term()) => ranges(t.title, q).length > 0;
export const hitSubs = (t, q = term()) => subsOf(t.id).filter((s) => ranges(s.title, q).length > 0);
export const isHit = (t, q = term()) => hitsTitle(t, q) || hitSubs(t, q).length > 0;

/** Escaped HTML with every hit in bold – no colour, the row keeps its own signals. */
export function mark(text, q = term()) {
  const rs = ranges(text, q);
  if (!rs.length) return esc(text);
  let out = '';
  let at = 0;
  for (const [a, b] of rs) {
    if (a < at) continue; // overlapping ranges stay one mark
    out += esc(text.slice(at, a)) + '<b class="hit">' + esc(text.slice(a, b)) + '</b>';
    at = b;
  }
  return out + esc(text.slice(at));
}
