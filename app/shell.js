// The shell (docs/changes/038, Abweichungsliste Zeile 1): one head for every route, rendered
// once. Before this, each view called renderHeader() and the router replaced the whole page on
// every route change - the head was rebuilt four times over even though nothing in it changed
// (038a-matrix.md, Zeile 1). Here the head, the nav, the second level, the footer and the phone
// tab bar are slots: the router only writes into a slot whose HTML actually differs, so the
// <header> node itself survives every route change (Test 1: same node reference).
//
// Two sizes of one component (Zeile 1): >= 900 px the nav sits in the head as underline tabs,
// < 900 px it is the tab bar at the bottom. Both are in the DOM, CSS shows one.
import { $, esc } from './ui/dom.js';
import { ICON } from './ui/icons.js';
import { avatarHTML, countdownHTML, footHTML, updateBarHTML, setupHintHTML } from './ui/chrome.js';
import { searchHTML } from './views/dashboard.js';
import { ui, einzug, myOpenDecisionsCount, openAnfragenCount, newCommentsCount } from './state.js';

/** The four routes, in the order the export fixes: Aufgaben · Finanzen · Entscheidungen ·
    Anfragen (Zeile 1 - today Anfragen still stands before Entscheidungen). */
export const ROUTES = [
  { key: 'dashboard', label: 'Aufgaben', icon: 'home', act: 'home', to: '' },
  { key: 'finanzen', label: 'Finanzen', icon: 'coin', act: 'screen', to: 'finanzen' },
  { key: 'entscheidungen', label: 'Entscheidungen', icon: 'diamond', act: 'screen', to: 'entscheidungen' },
  { key: 'anfragen', label: 'Anfragen', icon: 'scale', act: 'screen', to: 'anfragen' },
];

const TITLE = Object.fromEntries(ROUTES.map((r) => [r.key, r.label]));

/** The second level, one segment element for every page that has one (Zeile 1/#4/#18).
    Finanzen and Anfragen have none - the content starts right under the head. */
const SEGMENTS = {
  // #4: auf Aufgaben steht die Suche daneben, in derselben Zeile
  dashboard: { label: 'Ansicht', act: 'view-switch', current: () => ui.view, items: [['personen', 'Personen'], ['phasen', 'Phasen'], ['timeline', 'Timeline']], extra: searchHTML },
  entscheidungen: { label: 'Entscheidungen filtern', act: 'decisions-filter', current: () => (['alle', 'offen'].includes(ui.decisionsFilter) ? ui.decisionsFilter : 'offen'), items: [['offen', 'offen'], ['alle', 'alle']] },
};

/** The badge of a route: the number it carries, or 0 for none. */
function badgeOf(key) {
  if (key === 'entscheidungen') return myOpenDecisionsCount();
  if (key === 'anfragen') return openAnfragenCount();
  // docs/changes/038c #1: comments from the other person since the last visit, still unopened -
  // the replacement for the "Zwischen euch" block (038), gone with the tile row
  if (key === 'dashboard') return newCommentsCount();
  return 0;
}
const badgeText = (key) => (key === 'anfragen' ? 'Ergebnisse da' : key === 'dashboard' ? 'neu seit deinem Besuch' : 'wartet auf dich');

/* ---------- the slots ---------- */

// Last HTML written per slot. A slot whose content did not change is not touched at all - that
// is what keeps the head from being rebuilt on a route change (Klärung 1, "ohne Neuaufbau").
const written = new Map();
function slot(id, html) {
  if (written.get(id) === html) return;
  written.set(id, html);
  const el = $('#' + id);
  if (el) el.innerHTML = html;
}

/** One nav target. `tab` is the phone version: icon over label, badge at the icon's corner. */
function navItemHTML(r, active, tab) {
  const on = r.key === active;
  const n = badgeOf(r.key);
  const label = `${r.label}${n ? ` – ${n} ${badgeText(r.key)}` : ''}`;
  const badge = n ? `<span class="${tab ? 'tab-badge' : 'nav-badge'}" aria-hidden="true">${n}</span>` : '';
  return `<button class="${tab ? 'tabbtn' : 'navtab'}${on ? ' on' : ''}" data-act="${r.act}"${r.to ? ` data-to="${r.to}"` : ''}
    aria-label="${esc(label)}" title="${esc(r.label)}" aria-current="${on ? 'page' : 'false'}"
    >${tab ? `<span class="tab-ico">${ICON[r.icon]}${badge}</span><span class="tab-l">${r.label}</span>` : `${ICON[r.icon]}<span class="nav-l">${r.label}</span>${badge}`}</button>`;
}

const navHTML = (active) => ROUTES.map((r) => navItemHTML(r, active, false)).join('');
const tabbarHTML = (active) => ROUTES.map((r) => navItemHTML(r, active, true)).join('');

/** The second level as one connected control (#4: a segment, not three loose pills). */
function segmentHTML(active) {
  const seg = SEGMENTS[active];
  if (!seg) return '';
  const cur = seg.current();
  return `<div class="subseg" role="group" aria-label="${esc(seg.label)}">${seg.items
    .map(([k, l]) => `<button class="subseg-i" data-act="${seg.act}" data-to="${k}" aria-pressed="${cur === k}">${esc(l)}</button>`)
    .join('')}</div>${seg.extra ? seg.extra() : ''}`;
}

/** docs/changes/038 #8: on a phone the detail is a page of its own. It replaces the head with
    "‹ <Liste>" (the page type draws that bar), so head and second level step aside; the tab bar
    stays where it is. */
const phoneDetail = (active) =>
  !ui.wide && (active === 'anfragen' ? !!ui.anfrage : (active === 'dashboard' || active === 'entscheidungen') && !!ui.expanded);

/* ---------- mount ---------- */

let mounted = false;

/** Build the shell around #view, once. Everything after this writes into slots. */
export function mountShell() {
  if (mounted) return;
  const app = $('#app');
  const view = $('#view');
  app.insertAdjacentHTML(
    'afterbegin',
    `<div id="shell-update"></div>
     <header class="shell-head" id="shell-head">
       <div class="shell-row">
         <h1 class="shell-title" id="shell-title"></h1>
         <div class="shell-meta" id="shell-meta"></div>
         <span class="spacer"></span>
         <nav class="shell-nav" id="shell-nav" aria-label="Bereiche"></nav>
         <div class="shell-avatar" id="shell-avatar"></div>
       </div>
     </header>
     <div id="shell-date"></div>
     <div id="shell-hint"></div>
     <div class="shell-sub" id="shell-sub"></div>`,
  );
  view.insertAdjacentHTML('afterend', `<div id="shell-foot"></div><nav class="tabbar" id="tabbar" aria-label="Bereiche"></nav>`);
  // Zeile 1: the head is sticky and grows a soft edge as soon as the page is scrolled. The
  // class sits on the head itself, so no layout is read during the scroll event.
  const head = $('#shell-head');
  let edge = false;
  const onScroll = () => {
    const want = window.scrollY > 0;
    if (want === edge) return;
    edge = want;
    head.classList.toggle('scrolled', want);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  mounted = true;
}

/** Fill the slots for the route showing now. Called from render(), before the content. */
export function updateShell(active) {
  mountShell();
  const title = TITLE[active] || 'Aufgaben';
  const el = $('#shell-title');
  if (el && el.textContent !== title) el.textContent = title;
  slot(
    'shell-meta',
    `${ui.preview ? `<span class="preview-chip" title="Live-Daten · Lesestand wird nicht gespeichert">Vorschau</span>` : ''}<span class="shell-count">${countdownHTML()}</span>`,
  );
  slot('shell-nav', navHTML(active));
  slot('tabbar', tabbarHTML(active));
  slot('shell-avatar', avatarHTML(false));
  slot('shell-sub', segmentHTML(active));
  slot('shell-update', updateBarHTML());
  slot('shell-hint', setupHintHTML());
  // the date editor belongs to the head (it is opened from the countdown) but must not be part
  // of the sticky row - it pushes the content down instead
  slot('shell-date', ui.dateEdit || !einzug() ? `<div class="date-edit"><label class="hint" for="einzug">Einzugstermin</label><input type="date" id="einzug" value="${esc(einzug() || '')}"></div>` : '');
  // Finanzen carries the status line in its footer (016c), the other routes the two actions
  slot('shell-foot', footHTML({ status: active === 'finanzen' }));
  const detail = phoneDetail(active);
  for (const id of ['shell-head', 'shell-sub', 'shell-date']) {
    const part = $('#' + id);
    if (part) part.hidden = detail;
  }
  document.body.classList.toggle('route-' + active, true);
  for (const r of ROUTES) if (r.key !== active) document.body.classList.remove('route-' + r.key);
}

/** The shell is out of the way while the eight-step start or the print sheet owns the screen. */
export function shellVisible(on) {
  mountShell();
  for (const id of ['shell-head', 'shell-date', 'shell-hint', 'shell-sub', 'shell-foot', 'tabbar']) {
    const el = $('#' + id);
    if (el) el.hidden = !on;
  }
}
