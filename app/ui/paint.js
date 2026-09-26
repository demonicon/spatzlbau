// Painting (docs/changes/038). Its own module so the render loop in main.js stays about what
// to show, not about how the DOM gets there - and so a test can call it without the app.
import { $ } from './dom.js';

/* ---------- painting (docs/changes/038, Klärung 1 "Realtime tauscht nur die betroffene Zeile")
   Until now every change - a comment of the other person, a ticked subtask, a realtime event -
   replaced the whole content container, so a single new comment rebuilt every row on the screen.
   That is what makes a list flicker and what loses the place you were reading at.
   paint() compares the new HTML with what stands there and changes only what differs: one text
   node, one attribute, one row. The head is out of this anyway - it lives in the shell.  */

/** Bring `cur` to look like `next`, touching as few nodes as possible. Returns how many it had
    to touch (the Realtime test in 038 counts exactly this). */
export function patchNode(cur, next) {
  // Gleiches Markup heisst nicht gleicher Zustand: ein <input> traegt seinen Wert als Property,
  // die isEqualNode nicht sieht. Der Teilbaum wird deshalb nicht uebersprungen, ohne dass seine
  // Formularfelder abgeglichen wurden (zweiter Reviewer-Durchlauf zu 038).
  if (cur.isEqualNode(next)) return cur.nodeType === Node.ELEMENT_NODE ? syncFields(cur, next) : 0;
  if (cur.nodeType !== next.nodeType || cur.nodeName !== next.nodeName) {
    cur.replaceWith(next.cloneNode(true));
    return 1;
  }
  if (cur.nodeType === Node.TEXT_NODE || cur.nodeType === Node.COMMENT_NODE) {
    cur.data = next.data;
    return 1;
  }
  // a different number of children means the row itself is another one - swapping it whole is
  // both cheaper and safer than guessing which child went where
  if (cur.childNodes.length !== next.childNodes.length) {
    cur.replaceWith(next.cloneNode(true));
    return 1;
  }
  let n = 0;
  for (const a of [...cur.attributes]) {
    // CSP forbids style attributes in the markup (docs/changes/008), so a style on a live node
    // was written by the CSSOM step in render() - it belongs to the app, not to this diff
    if (a.name === 'style') continue;
    if (!next.hasAttribute(a.name)) {
      cur.removeAttribute(a.name);
      n++;
    }
  }
  for (const a of next.attributes) {
    if (cur.getAttribute(a.name) !== a.value) {
      cur.setAttribute(a.name, a.value);
      n++;
    }
  }
  for (let i = 0; i < cur.childNodes.length; i++) n += patchNode(cur.childNodes[i], next.childNodes[i]);
  n += syncField(cur, next);
  return n;
}

/* A form control carries its value as a property, not as an attribute - the diff above would
   never see it. Before 038 the full innerHTML reset those properties on every render, and the
   app relies on it: after "Hinzufügen" the title field is empty again, a checkbox follows the
   row it belongs to. So the value is written across explicitly - except into the control the
   person is currently in, which would move their cursor. (Reviewer-Fund 3 zu 038.) */
const FIELD = { INPUT: 1, TEXTAREA: 1, SELECT: 1 };

/** Every field of a subtree whose markup did not change. The two trees are equal node for node,
    so the two lists line up one to one. */
function syncFields(cur, next) {
  let n = syncField(cur, next);
  const a = cur.querySelectorAll('input, textarea, select');
  if (!a.length) return n;
  const b = next.querySelectorAll('input, textarea, select');
  for (let i = 0; i < a.length && i < b.length; i++) n += syncField(a[i], b[i]);
  return n;
}
function syncField(cur, next) {
  if (!FIELD[cur.nodeName] || cur === document.activeElement) return 0;
  if (cur.type === 'checkbox' || cur.type === 'radio') {
    const want = next.hasAttribute('checked');
    if (cur.checked === want) return 0;
    cur.checked = want;
    return 1;
  }
  if (cur.nodeName === 'SELECT') {
    const opt = next.querySelector('option[selected]') || next.querySelector('option');
    const want = opt ? (opt.hasAttribute('value') ? opt.getAttribute('value') : opt.textContent) : '';
    if (cur.value === want) return 0;
    cur.value = want;
    return 1;
  }
  const want = cur.nodeName === 'TEXTAREA' ? next.textContent : (next.getAttribute('value') ?? '');
  if (cur.value === want) return 0;
  cur.value = want;
  return 1;
}

export function paint(html) {
  const view = $('#view');
  const next = document.createElement('div');
  next.innerHTML = html;
  // the very first paint and a route change have nothing to compare against
  if (!view.firstChild || view.childNodes.length !== next.childNodes.length) {
    view.innerHTML = html;
    return;
  }
  for (let i = 0; i < view.childNodes.length; i++) patchNode(view.childNodes[i], next.childNodes[i]);
}
