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
  if (cur.isEqualNode(next)) return 0;
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
  return n;
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
