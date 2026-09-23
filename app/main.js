// App bootstrap: auth gate, rendering, event delegation, realtime, service worker.
import { $, esc, toast } from './ui/dom.js';
import * as auth from './auth.js';
import {
  state,
  ui,
  onChange,
  onStatus,
  byId,
  blockers,
  phases,
  loadAll,
  loadSnapshot,
  subscribeRealtime,
  updateTask,
  insertTask,
  deleteTask,
  setSubtaskDone,
  addSubtask,
  deleteSubtask,
  updateSubtask,
  addComment,
  updateComment,
  deleteComment,
  canEditComment,
  setSetting,
  loadPersonRow,
  setLastSeenVersion,
  markVisit,
  markCommentsSeen,
  doneBy,
  addCost,
  updateCost,
  deleteCost,
  addRecurring,
  updateRecurring,
} from './state.js';
import { FILTERS } from './filters.js';
import { compareVersions, newestVersion, hasUnread } from './changelog.js';
import { dashboardView, columns } from './views/dashboard.js';
import { finanzenView } from './views/finanzen.js';
import { isMoreOpen } from './ui/detail.js';
import { searching } from './search.js';
import { parseAmount, bufferRow, bufferPct, suggestedBuffer, costsOf } from './costs.js';

const UI_KEY = 'spatzlbau-ui';
const PERSON_KEY = 'spatzlbau-person';

// dashboard state (docs/changes/009): no filter on open – the columns already answer "what is mine";
// the phase is a chip (null = all phases) and is remembered per device
ui.filter = null;
ui.phase = null;
ui.dateEdit = false;
ui.q = ''; // search term (docs/changes/012) – on purpose only in memory: not stored, not in the hash
ui.qPrev = null; // filter and phase the search replaced, put back when the field is emptied
ui.openCols = new Set(); // collapsible column ("Bei Anna") that the person opened
ui.allCols = new Set(); // columns showing more than the first eight rows
ui.doneCols = new Set(); // columns showing their done tasks as well
ui.blockedCols = new Set(); // columns with "N warten auf einen Vorgänger" unfolded
ui.more = {}; // Akte: task id -> "Mehr" open? (undefined = automatic, see isMoreOpen)
ui.adviceAdd = new Set(); // Akte: tasks showing the empty advice fields
ui.costEdit = null; // cost row with its fields open (007)
ui.costPay = null; // cost row asking for date, person and receipt
ui.costAdd = null; // task id showing the "new cost row" form
ui.screen = 'dashboard'; // 'dashboard' | 'finanzen' (#finanzen, docs/changes/007)
ui.finFilter = null; // which cost rows the Finanzen view shows
ui.finSettings = false; // the small settings area (move-out dates, split, buffer)
ui.bufferEdit = false;
ui.recAdd = false; // the "new monthly cost" field in the Finanzen view
ui.printOpen = false; // "Umzugstag drucken" sheet
ui.offline = false; // no connection: the cached state is shown read-only (009)
ui.wide = false; // ≥ 900 px: the Akte is not inline any more (006)
// docs/changes/013 A3: three steps instead of two - 'phone' (Akte inline), 'overlay' (Akte comes
// in from the right over the list) and 'panel' (list and Akte side by side from 1180 px)
ui.mode = 'phone';
ui.titleEdit = null; // task id whose title field is open (013 A4)
ui.subEdit = null; // subtask id whose row is in edit mode (013 B2)
ui.comEdit = null; // comment id whose body field is open (013 B5)
ui.costHint = null; // task id that shows the one-off line about the cost states (013 A5)
ui.updateReady = false; // a newer build took over the service worker (003, bar since 013 A6)
// ui.preview (docs/changes/010) is set in state.js, where the writers it stops live
ui.changelog = null; // changelog.json (docs/changes/005), loaded at start
ui.changelogOpen = false;
ui.changelogUnreadOnly = false; // auto-opened panel shows only the versions newer than last_seen_version

/* ---------- screens ---------- */
function show(screen) {
  for (const id of ['login', 'denied', 'app', 'loading']) $('#' + id).hidden = id !== screen;
  $('#top').hidden = screen === 'app';
}

/* ---------- status line (inside the dashboard header) ---------- */
let lastSaved = '';
let live = false;
let lastError = '';
function renderStatus(kind, msg) {
  if (kind === 'saved') lastSaved = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (kind === 'live') live = true;
  if (kind === 'error') lastError = msg;
  // 'live' after a reconnect clears the error, too (docs/changes/010 point 2)
  if (kind === 'saved' || kind === 'saving' || kind === 'live') lastError = '';
  const el = $('#status');
  if (!el) return;
  // docs/changes/012: the preview writes tasks, costs and settings like the real app, but never
  // the reading state – and it says so, in every state of the line
  const set = (text, cls = '') => {
    el.textContent = [text, ui.preview ? 'Vorschau – Lesestand wird nicht gespeichert' : ''].filter(Boolean).join(' · ');
    el.className = ['status', cls, ui.preview ? 'prev' : ''].filter(Boolean).join(' ');
  };
  if (lastError) {
    set(lastError, 'err');
    return;
  }
  if (ui.offline) {
    const at = state.loadedAt ? new Date(state.loadedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–';
    set('Offline – Stand von ' + at, 'off');
    return;
  }
  const parts = [kind === 'saving' ? msg : lastSaved ? 'gespeichert ' + lastSaved : '', live ? 'Live' : 'verbinde …'];
  set(parts.filter(Boolean).join(' · '));
}
onStatus(renderStatus);

/* ---------- rendering (skipped while typing, caught up on blur) ---------- */
let renderPending = false;
function isTyping() {
  const a = document.activeElement;
  return a && $('#view').contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text'));
}
function ensurePhase() {
  const list = phases();
  // null = chip "alle"; anything else has to exist
  if (ui.phase !== null && list.length && !list.some((p) => p.id === ui.phase)) ui.phase = null;
}
function render() {
  if (!state.loaded) return;
  if (isTyping()) {
    renderPending = true;
    return;
  }
  renderPending = false;
  ensurePhase();
  const focusKey = keyOf(document.activeElement);
  document.body.classList.toggle('printing', !!ui.printOpen);
  $('#view').innerHTML = ui.screen === 'finanzen' ? finanzenView() : dashboardView();
  // CSP forbids style attributes (docs/changes/008): the gate fill is the one dynamic style, set via CSSOM
  for (const el of $('#view').querySelectorAll('.gate .bar i[data-pct]')) el.style.width = el.dataset.pct + '%';
  restoreFocus(focusKey);
  renderStatus('idle');
}

/* ---------- keyboard (docs/changes/006 step 3): the view is re-rendered on every change,
   so remember which control had focus and give it back afterwards ---------- */
const FOCUS_ATTRS = ['data-act', 'data-filter', 'data-phase', 'data-field', 'data-input', 'data-brief', 'data-adv', 'data-ref', 'role'];
function keyOf(el) {
  if (!el || el === document.body || !$('#view')?.contains(el)) return null;
  // typing in a field triggers renders (the search does it on every character), so the cursor
  // position travels with the focus – otherwise it would jump to the end mid-word
  let at = null;
  try {
    if (el.selectionStart !== null && el.selectionStart !== undefined) at = [el.selectionStart, el.selectionEnd];
  } catch {}
  const scope = el.closest('[data-id]');
  const own = FOCUS_ATTRS.filter((a) => el.hasAttribute(a)).map((a) => `[${a}="${CSS.escape(el.getAttribute(a))}"]`).join('');
  const sub = el.closest('[data-sub]');
  // the first class disambiguates controls that share an attribute (gate segment vs. phase chip)
  const cls = el.classList[0] ? '.' + CSS.escape(el.classList[0]) : '';
  const sel = (sub ? `[data-sub="${CSS.escape(sub.dataset.sub)}"] ` : '') + el.tagName.toLowerCase() + cls + own + (el.id ? '#' + CSS.escape(el.id) : '');
  return { scope: scope ? scope.dataset.id : null, sel, at };
}
function restoreFocus(key) {
  if (!key) return;
  const root = key.scope ? $(`#view [data-id="${CSS.escape(key.scope)}"]`) : $('#view');
  const el = (root && root.querySelector(key.sel)) || $('#view').querySelector(key.sel);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (key.at) {
    try {
      el.setSelectionRange(key.at[0], key.at[1]);
    } catch {}
  }
}
onChange(render);

function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ phase: ui.phase }));
  } catch {}
}
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    if (Number.isInteger(u.phase) || u.phase === null) ui.phase = u.phase;
  } catch {}
}

/* ---------- one-off hints (docs/changes/013 A5): shown once per device, then never again ---------- */
const HINT_KEY = 'spatzlbau-hints';
function hints() {
  try {
    return JSON.parse(localStorage.getItem(HINT_KEY) || '{}');
  } catch {
    return {};
  }
}
function markHint(key) {
  try {
    localStorage.setItem(HINT_KEY, JSON.stringify({ ...hints(), [key]: true }));
  } catch {}
}

/* ---------- changelog ---------- */
async function loadChangelog() {
  try {
    const r = await fetch('./changelog.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    ui.changelog = await r.json();
  } catch (e) {
    console.warn('changelog.json nicht ladbar', e);
    ui.changelog = { entries: [] };
  }
}
function openChangelog(unreadOnly) {
  ui.changelogOpen = true;
  ui.changelogUnreadOnly = !!unreadOnly;
  render();
  $('#changelog')?.scrollIntoView({ block: 'start' });
}
// closing (button, Escape, tap outside) marks everything as read – per person, in the database
function closeChangelog() {
  if (!ui.changelogOpen) return;
  ui.changelogOpen = false;
  const v = newestVersion();
  if (v && state.lastSeenVersion !== undefined && compareVersions(v, state.lastSeenVersion) > 0) setLastSeenVersion(v).catch(fail);
  render();
}
// opened via a task link (#task=<id>)? then the person has a goal – no automatic panel
const openedViaTaskLink = () => /^#task=/.test(location.hash);
const openedViaFinanzen = () => location.hash === '#finanzen';
const hashTaskId = () => (openedViaTaskLink() ? decodeURIComponent(location.hash.slice('#task='.length)) : null);
function openTaskFromHash() {
  const t = byId(hashTaskId());
  if (!t) return false;
  ui.phase = t.phase;
  if (ui.filter && !FILTERS[ui.filter].test(t)) ui.filter = null;
  ui.expanded = t.id;
  revealTask(t);
  return true;
}
// the task has to be visible: open its column, show it even past the eighth row or among the done ones
function revealTask(t) {
  for (const c of columns()) {
    if (![...c.open, ...c.blocked, ...c.done].some((x) => x.id === t.id)) continue;
    ui.openCols.add(c.key);
    if (c.done.some((x) => x.id === t.id)) ui.doneCols.add(c.key);
    if (c.blocked.some((x) => x.id === t.id)) ui.blockedCols.add(c.key);
  }
}
// the open task lives in the URL, so a link to it can be shared (docs/changes/006)
function syncHash() {
  const want = ui.screen === 'finanzen' ? '#finanzen' : ui.expanded ? '#task=' + encodeURIComponent(ui.expanded) : '';
  if (location.hash === want) return;
  history.replaceState(null, '', location.pathname + location.search + want);
}
// docs/changes/013 B3: entering Finanzen gets its own step back - Browser-Zurück leaves it
// again and lands on the list. Opening an Akte still replaces (decision from 006), unaffected.
function openFinanzen() {
  const already = ui.screen === 'finanzen';
  ui.screen = 'finanzen';
  ui.finFilter = null;
  if (already) return; // opened again while already there: no second entry
  history.pushState(null, '', location.pathname + location.search + '#finanzen');
}

function setExpanded(id) {
  const prev = ui.expanded;
  if (id) markCommentsSeen(id).catch(() => {}); // opening takes the "new" dot away (009)
  ui.expanded = id;
  ui.confirm = null;
  ui.editingAdvice = null;
  ui.titleEdit = null;
  ui.subEdit = null;
  ui.comEdit = null;
  // the cost states are explained the first time a task with costs is opened, then never again
  ui.costHint = id && costsOf(id).length && !hints().costs ? id : null;
  syncHash();
  render();
  if (ui.costHint) markHint('costs');
  // closing gives the keyboard focus back to the task's title in the list
  if (!id && prev) $(`#view .task[data-id="${CSS.escape(prev)}"] .t`)?.focus({ preventScroll: true });
}

/* ---------- search (docs/changes/012) ----------
   Typing replaces what narrows the list (tile filter and phase), emptying the field puts both
   back. Tapping a tile or a phase chip while searching is a decision of its own – then there is
   nothing left to restore. */
function setQuery(v) {
  const had = searching();
  ui.q = v;
  const now = searching();
  if (now && !had) {
    ui.qPrev = { filter: ui.filter, phase: ui.phase };
    ui.filter = null;
    ui.phase = null; // the phase chip is remembered per device, so this is not saved
  } else if (!now && had) {
    restoreBeforeSearch();
  }
  render();
}
function restoreBeforeSearch() {
  const p = ui.qPrev;
  ui.qPrev = null;
  if (!p) return;
  ui.filter = p.filter;
  ui.phase = p.phase;
}
// a hit is a way in, not a toggle: the search closes and the list comes back as it was
function jumpTo(t) {
  $('#search')?.blur(); // the keyboard has to go before the list scrolls
  ui.q = '';
  restoreBeforeSearch();
  if (ui.filter && !FILTERS[ui.filter].test(t)) ui.filter = null;
  if (ui.phase !== null && t.phase !== ui.phase) ui.phase = t.phase;
  revealTask(t);
  if (ui.wide) setExpanded(t.id); // desktop: the Akte opens in the panel as well (renders)
  else render(); // phone: the person decides with the next tap
  const el = $(`#view .task[data-id="${CSS.escape(t.id)}"]`);
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1000);
}
const isEditable = (el) => !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/* ---------- events ---------- */
const fail = (e) => e && toast('Nicht gespeichert – bitte nochmal versuchen');
// what still works without a connection: looking, folding, filtering, printing (docs/changes/009)
const OFFLINE_OK = new Set([
  'open', 'panel-close', 'filter-clear', 'changelog', 'changelog-close', 'reload', 'logout',
  'col-toggle', 'col-all', 'col-done', 'col-blocked', 'goto', 'more', 'advice-add',
  'print', 'print-close', 'print-now',
  'screen', 'fin-open', 'fin-filter', 'fin-filter-clear', 'fin-settings', 'buffer-edit', 'buffer-cancel',
  'fin-recurring', 'q-clear', 'home', 'overlay-close', 'title-edit', 'title-done',
  'sub-edit', 'sub-edit-done', 'com-edit', 'com-cancel',
]);

function wireEvents() {
  const view = $('#view');
  view.addEventListener('focusout', () => setTimeout(() => renderPending && !isTyping() && render(), 0));
  document.addEventListener('keydown', (e) => {
    // docs/changes/012: Escape empties the search field and leaves it, "/" jumps into it
    const el = document.activeElement;
    if (e.key === 'Escape' && el?.id === 'search') {
      el.blur(); // before the render, so the focus is not handed back to the field
      setQuery('');
      return;
    }
    if (e.key === '/' && !isEditable(el) && state.loaded && ui.screen === 'dashboard') {
      e.preventDefault();
      $('#search')?.focus();
      return;
    }
    if (e.key !== 'Escape') return;
    if (ui.titleEdit) {
      if (document.activeElement?.closest?.('.akte-title')) document.activeElement.blur();
      ui.titleEdit = null;
      render();
    } else if (ui.changelogOpen) closeChangelog();
    else if (ui.printOpen) {
      ui.printOpen = false;
      render();
    } else if (ui.expanded && ui.wide) {
      // a field still being typed in saves on blur – let that happen before the panel goes
      if (document.activeElement?.closest?.('#panel')) document.activeElement.blur();
      setExpanded(null); // Escape empties the side panel and closes the overlay
    }
  });
  // browser back/forward or a pasted link: follow the hash
  window.addEventListener('hashchange', () => {
    if (!state.loaded) return;
    if (openedViaFinanzen()) {
      ui.screen = 'finanzen';
      render();
      return;
    }
    ui.screen = 'dashboard';
    const id = hashTaskId();
    if (id && byId(id)) openTaskFromHash();
    else if (!id) ui.expanded = null;
    render();
  });
  // no connection: show the cached state read-only; back online: reload, no page reload needed (009)
  window.addEventListener('offline', () => {
    ui.offline = true;
    render();
  });
  window.addEventListener('online', () => {
    loadAll()
      .then(() => {
        ui.offline = false;
        render();
      })
      .catch(() => {});
  });
  // leaving the app ends the visit: the next open measures "Seit deinem letzten Besuch" from here (009)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && markVisit().catch(() => {}));
  window.addEventListener('pagehide', () => markVisit().catch(() => {}));
  // layout: the Akte moves between inline, overlay and side panel – same behaviour, other place
  const mqWide = matchMedia('(min-width: 900px)');
  const mqPanel = matchMedia('(min-width: 1180px)');
  syncMode();
  for (const mq of [mqWide, mqPanel]) {
    mq.addEventListener('change', () => {
      syncMode();
      // the Akte changes place, so this render cannot be skipped: a field that is being typed in
      // gives up focus first (which saves it) instead of freezing the old layout
      if (isTyping()) document.activeElement.blur();
      render();
    });
  }
  function syncMode() {
    ui.wide = mqWide.matches;
    ui.mode = mqPanel.matches ? 'panel' : mqWide.matches ? 'overlay' : 'phone';
  }

  // docs/changes/012: from the first character, without a delay
  view.addEventListener('input', (e) => {
    if (e.target.dataset.input === 'q') setQuery(e.target.value);
  });

  view.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.input === 'q') return; // the search saves nothing – it reacts on 'input'
    if (ui.offline) {
      render(); // put the control back the way the cached state says
      return toast('Ohne Netz kannst du nur lesen');
    }
    // monthly costs: three amounts per row, each written on its own (007 commit 3)
    if (el.dataset.recField) {
      const raw = el.value.trim();
      const v = raw === '' ? null : parseAmount(raw);
      if (v === null && raw !== '') return toast('Betrag nicht lesbar – z. B. 780 oder 780,50');
      updateRecurring(el.dataset.ref, { [el.dataset.recField]: v }).catch(fail);
      return;
    }
    // the small finance settings area (007): dates and percentages, one key at a time
    if (el.dataset.setting) {
      const key = el.dataset.setting;
      const raw = el.value.trim();
      // settings.value is jsonb NOT NULL: an emptied field stores '', never null
      let v = '';
      if (raw !== '') {
        v = key.endsWith('_pct') || key.startsWith('split') ? parseAmount(raw) : raw;
        if (v === null) return toast('Wert nicht lesbar');
      }
      setSetting(key, v).catch(fail);
      return;
    }
    if (el.dataset.input === 'kontakte') {
      setSetting('umzugstag_kontakte', el.value).catch(fail);
      return;
    }
    if (el.id === 'einzug') {
      ui.dateEdit = false;
      setSetting('einzugstermin', el.value || '').catch(fail);
      return;
    }
    const row = el.closest('[data-id]'); // task row, or the side panel
    const t = row ? byId(row.dataset.id) : null;
    if (el.dataset.act === 'sub-done') {
      setSubtaskDone(el.closest('.sub').dataset.sub, el.checked)
        .then((autoDone) => autoDone && toast('Alle Teilschritte erledigt – Aufgabe abgehakt'))
        .catch(fail);
      return;
    }
    // renaming a subtask (013 B2): saves on blur, like the other text fields
    if (el.dataset.subField === 'title') {
      const s = state.subtasks.find((x) => x.id === el.dataset.ref);
      if (!s) return;
      const v = el.value.replace(/\s+/g, ' ').trim() || s.title; // never save an empty title
      updateSubtask(s.id, { title: v }).catch(fail);
      return;
    }
    if (el.dataset.act === 'done' && t) {
      // docs/changes/020: a blocked task is not tickable - the box is disabled, and if an event
      // arrives anyway (keyboard, stale DOM) the row is drawn again instead of written
      if (blockers(t).length && !t.done) {
        render();
        return toast('Wartet noch auf eine andere Aufgabe');
      }
      // done_by: who ticked it off – "Seit deinem letzten Besuch" must not count my own work (009)
      updateTask(t.id, { done: el.checked, ...doneBy(el.checked) }).catch(fail);
      return;
    }
    if (el.dataset.field && t) {
      const f = el.dataset.field;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'offset_days') v = parseInt(v || '0', 10);
      if (f === 'title') v = String(v).replace(/\s+/g, ' ').trim() || t.title; // the title field wraps, but stays one line of text
      if (f === 'wait_on') v = v || null;
      const patch = { [f]: v };
      if (f === 'type' && v === 'claude' && !t.status) patch.status = 'briefing';
      updateTask(t.id, patch).catch(fail);
      return;
    }
    // cost fields write one column at a time, like every other field (007)
    if (el.dataset.costField) {
      const f = el.dataset.costField;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'amount') {
        v = parseAmount(v);
        if (v === null) return toast('Betrag nicht lesbar – z. B. 1800 oder 1.800,50');
      }
      if ((f === 'apartment' || f === 'due_on' || f === 'receipt_url' || f === 'note') && v === '') v = null;
      updateCost(el.dataset.ref, { [f]: v }).catch(fail);
      return;
    }
    if (el.dataset.brief && t) {
      const brief = { ...(t.brief || {}), [el.dataset.brief]: el.value };
      updateTask(t.id, { brief }).catch(fail);
      return;
    }
    if (el.dataset.act === 'block-select' && el.value && t) {
      updateTask(t.id, { blocked_by: [...(t.blocked_by || []), el.value] }).catch(fail);
    }
  });

  view.addEventListener('click', async (e) => {
    // tap outside the open panel closes it (and marks it read); the tap itself still does what it does
    if (ui.changelogOpen && !e.target.closest('#changelog') && !e.target.closest('[data-act="changelog"]')) closeChangelog();
    // KPI tiles: exactly one active filter, tapping again clears it
    const tile = e.target.closest('[data-filter]');
    if (tile) {
      const key = tile.dataset.filter;
      ui.qPrev = null; // chosen by hand while searching: there is nothing to put back afterwards
      ui.filter = ui.filter === key ? null : FILTERS[key] ? key : null;
      if (!ui.wide) setExpanded(null); // inline Akte closes with the list change; the side panel stays open
      else render();
      return;
    }
    // gate bar and phase chips select the phase; the filter stays
    const ph = e.target.closest('[data-phase]');
    if (ph) {
      const want = ph.dataset.phase === 'all' ? null : parseInt(ph.dataset.phase, 10);
      ui.qPrev = null;
      ui.phase = ui.phase === want ? null : want; // tapping the active phase again shows all phases
      saveUI();
      if (!ui.wide) setExpanded(null);
      else render();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const act = b.dataset.act;
    // Pressing a button ends typing. Without this the field keeps the focus (Safari does not
    // focus buttons on tap), isTyping() stays true and the redraw after the write is skipped -
    // the new row would only appear once the person taps somewhere else. The blur also saves
    // what was typed, and the values below are read before the redraw replaces the DOM.
    if (isTyping()) document.activeElement.blur();
    if (ui.offline && !OFFLINE_OK.has(act)) return toast('Ohne Netz kannst du nur lesen');
    const row = b.closest('[data-id]'); // task row, or the side panel
    const t = row ? byId(row.dataset.id) : null;
    const input = (sel, root = row) => $(sel, root);
    try {
      switch (act) {
        case 'filter-clear':
          ui.filter = null;
          render();
          return;
        case 'changelog':
          if (ui.changelogOpen) closeChangelog();
          else openChangelog(false);
          return;
        case 'changelog-close':
          closeChangelog();
          $('.foot')?.scrollIntoView({ block: 'end' });
          return;
        case 'date-toggle':
          ui.dateEdit = !ui.dateEdit;
          render();
          if (ui.dateEdit) $('#einzug')?.focus();
          return;
        case 'logout':
          auth.signOut();
          return;
        case 'reload':
          location.reload();
          return;
        case 'print':
          ui.printOpen = !ui.printOpen;
          render();
          if (ui.printOpen) $('#printsheet')?.scrollIntoView({ block: 'start' });
          return;
        case 'print-close':
          ui.printOpen = false;
          render();
          $('.foot')?.scrollIntoView({ block: 'end' });
          return;
        case 'print-now':
          window.print();
          return;
        case 'open':
          if (searching()) return jumpTo(t); // docs/changes/012
          setExpanded(ui.expanded === t.id ? null : t.id);
          return;
        case 'q-clear':
          setQuery('');
          $('#search')?.focus();
          return;
        // docs/changes/009: "blockiert: …" is a link to the blocking task
        case 'goto': {
          const dep = byId(b.dataset.ref);
          if (!dep) return;
          if (ui.phase !== null && dep.phase !== ui.phase) ui.phase = dep.phase;
          if (ui.filter && !FILTERS[ui.filter].test(dep)) ui.filter = null;
          revealTask(dep);
          setExpanded(dep.id);
          if (!ui.wide) $(`#view .task[data-id="${CSS.escape(dep.id)}"]`)?.scrollIntoView({ block: 'start' });
          return;
        }
        case 'col-toggle':
          ui.openCols.has(b.dataset.ref) ? ui.openCols.delete(b.dataset.ref) : ui.openCols.add(b.dataset.ref);
          render();
          return;
        case 'col-all':
          ui.allCols.add(b.dataset.ref);
          render();
          return;
        case 'col-done':
          ui.doneCols.add(b.dataset.ref);
          render();
          return;
        case 'col-blocked':
          ui.blockedCols.has(b.dataset.ref) ? ui.blockedCols.delete(b.dataset.ref) : ui.blockedCols.add(b.dataset.ref);
          render();
          return;
        case 'panel-close':
          setExpanded(null);
          return;
        case 'unblock':
          await updateTask(t.id, { blocked_by: (t.blocked_by || []).filter((id) => id !== b.dataset.ref) });
          return;
        case 'sub-add': {
          const v = input('[data-input=sub]').value.trim();
          if (!v) return;
          await addSubtask(t.id, v);
          return;
        }
        case 'sub-edit':
          ui.subEdit = b.dataset.ref;
          ui.confirm = null;
          render();
          $(`[data-sub="${CSS.escape(b.dataset.ref)}"] .sub-edit-title`, $('#view'))?.focus();
          return;
        case 'sub-edit-done':
          ui.subEdit = null;
          render();
          return;
        case 'sub-del':
          ui.confirm = 'subdel:' + b.dataset.ref;
          render();
          return;
        case 'sub-del-yes':
          ui.subEdit = null;
          ui.confirm = null;
          await deleteSubtask(b.dataset.ref);
          toast('Teilschritt gelöscht');
          return;
        case 'com-add': {
          const ta = input('[data-input=com]');
          const v = ta.value.trim();
          if (!v) return;
          await addComment(t.id, v);
          return;
        }
        /* ---------- own comments (013 B5) ---------- */
        case 'com-edit': {
          const c = state.comments.find((x) => x.id === b.dataset.ref);
          if (!c || !canEditComment(c)) return; // the ten minutes are over - stale button from an old render
          ui.comEdit = c.id;
          ui.confirm = null;
          render();
          $(`[data-com="${CSS.escape(c.id)}"] .com-edit`, $('#view'))?.focus();
          return;
        }
        case 'com-cancel':
          ui.comEdit = null;
          render();
          return;
        case 'com-save': {
          const ta = $(`[data-com="${CSS.escape(b.dataset.ref)}"] .com-edit`, $('#view'));
          const v = ta.value.trim();
          if (!v) return toast('Kommentar darf nicht leer sein');
          ui.comEdit = null;
          await updateComment(b.dataset.ref, { body: v });
          return;
        }
        case 'com-del':
          ui.confirm = 'comdel:' + b.dataset.ref;
          render();
          return;
        case 'com-del-yes':
          ui.comEdit = null;
          ui.confirm = null;
          await deleteComment(b.dataset.ref);
          toast('Kommentar gelöscht');
          return;
        /* ---------- navigation (013 A6) ---------- */
        case 'home': // the house: back to the plain list, no filter, all phases
          ui.screen = 'dashboard';
          ui.filter = null;
          ui.phase = null;
          ui.finFilter = null;
          ui.q = '';
          ui.qPrev = null;
          saveUI();
          setExpanded(null);
          window.scrollTo({ top: 0 });
          return;
        case 'title-edit':
          ui.titleEdit = b.dataset.ref;
          render();
          $(`[data-detail="${CSS.escape(b.dataset.ref)}"] .akte-title, #view .task[data-id="${CSS.escape(b.dataset.ref)}"] .akte-title`, $('#view'))?.focus();
          return;
        case 'title-done':
          ui.titleEdit = null;
          render();
          return;
        case 'overlay-close': // only the dimmed area around the Akte closes it (013 A3)
          if (e.target.closest('.sheet')) return;
          setExpanded(null);
          return;

        /* ---------- Finanzen view (007, addendum) ---------- */
        case 'screen':
          if (b.dataset.to === 'finanzen') openFinanzen();
          else {
            ui.screen = b.dataset.to;
            ui.finFilter = null;
            syncHash();
          }
          render();
          window.scrollTo({ top: 0 });
          return;
        case 'fin-open': // from the Finanzen list into the Akte of that task
          ui.screen = 'dashboard';
          ui.finFilter = null;
          revealTask(byId(b.dataset.ref));
          setExpanded(b.dataset.ref);
          return;
        case 'fin-filter':
          ui.finFilter = ui.finFilter === b.dataset.to ? null : b.dataset.to;
          render();
          return;
        case 'fin-filter-clear':
          ui.finFilter = null;
          render();
          return;
        case 'rec-add':
          ui.recAdd = true;
          render();
          $('[data-input=rec-label]', $('#view'))?.focus();
          return;
        case 'rec-add-cancel':
          ui.recAdd = false;
          render();
          return;
        case 'rec-add-save': {
          const label = $('[data-input=rec-label]', $('#view')).value.trim();
          if (!label) return toast('Bitte einen Posten eingeben');
          ui.recAdd = false;
          await addRecurring(label);
          return;
        }
        case 'fin-recurring': // from the Akte of "Kostenmodell klären" straight to the table
          openFinanzen();
          render();
          $('#fin-recurring')?.scrollIntoView({ block: 'start' });
          return;
        case 'fin-settings':
          ui.finSettings = !ui.finSettings;
          render();
          if (ui.finSettings) $('#fin-settings')?.scrollIntoView({ block: 'start' });
          return;
        case 'buffer-add':
          await addCost(null, { label: 'Puffer', amount: suggestedBuffer() });
          return;
        case 'buffer-edit':
          ui.bufferEdit = !ui.bufferEdit;
          render();
          return;
        case 'buffer-cancel':
          ui.bufferEdit = false;
          render();
          return;
        case 'buffer-save': {
          const amount = parseAmount($('[data-buffer=amount]', $('#view')).value);
          const pct = parseAmount($('[data-buffer=pct]', $('#view')).value);
          if (amount === null) return toast('Betrag nicht lesbar');
          ui.bufferEdit = false;
          if (pct !== null && pct !== bufferPct()) await setSetting('buffer_pct', pct);
          await updateCost(b.dataset.ref, { amount });
          return;
        }
        case 'buffer-pct-apply': {
          const pct = parseAmount($('[data-buffer=pct]', $('#view')).value);
          if (pct === null) return toast('Prozentsatz nicht lesbar');
          if (pct !== bufferPct()) await setSetting('buffer_pct', pct);
          ui.bufferEdit = false;
          await updateCost(b.dataset.ref, { amount: suggestedBuffer() });
          return;
        }

        /* ---------- cost rows (007) ---------- */
        case 'cost-add':
          ui.costAdd = t.id;
          render();
          $('[data-input=cost-label]', $('#view'))?.focus();
          return;
        case 'cost-add-cancel':
          ui.costAdd = null;
          render();
          return;
        case 'cost-add-save': {
          const label = input('[data-input=cost-label]').value.trim();
          const amount = parseAmount(input('[data-input=cost-amount]').value);
          if (!label) return toast('Bitte eine Bezeichnung eingeben');
          if (amount === null) return toast('Betrag nicht lesbar – z. B. 1800 oder 1.800,50');
          ui.costAdd = null;
          await addCost(t.id, { label, amount });
          return;
        }
        case 'cost-edit':
          ui.costEdit = ui.costEdit === b.dataset.ref ? null : b.dataset.ref;
          ui.costPay = null;
          render();
          return;
        case 'cost-step':
          // one step at a time; leaving 'bezahlt' has to clear the payment, otherwise the
          // trigger from 004 puts the row straight back on 'bezahlt'
          await updateCost(b.dataset.ref, b.dataset.to === 'faellig' ? { status: 'faellig', paid_on: null, paid_by: null } : { status: b.dataset.to });
          return;
        case 'cost-pay':
          ui.costPay = b.dataset.ref;
          ui.costEdit = null;
          render();
          return;
        case 'cost-pay-cancel':
          ui.costPay = null;
          render();
          return;
        case 'cost-pay-save': {
          const row = b.closest('.cost');
          const receipt = $('[data-pay=receipt]', row).value.trim();
          const cost = state.costs.find((c) => c.id === b.dataset.ref);
          if (cost?.tax_relevant && !receipt) return toast('Beleg-Link fehlt – die Zeile ist steuerrelevant');
          ui.costPay = null;
          await updateCost(b.dataset.ref, {
            paid_on: $('[data-pay=date]', row).value || new Date().toISOString().slice(0, 10),
            paid_by: $('[data-pay=by]', row).value,
            receipt_url: receipt || null,
            status: 'bezahlt',
          });
          return;
        }
        case 'cost-del':
          ui.confirm = 'cost-del:' + b.dataset.ref;
          render();
          return;
        case 'cost-del-yes':
          ui.confirm = null;
          ui.costEdit = null;
          await deleteCost(b.dataset.ref);
          toast('Kostenzeile gelöscht');
          return;
        case 'adv-edit':
          ui.editingAdvice = t.id + ':' + b.dataset.ref;
          render();
          $(`[data-adv=${b.dataset.ref}]`, $('#view'))?.focus();
          return;
        case 'adv-cancel':
          ui.editingAdvice = null;
          render();
          return;
        case 'adv-save': {
          const k = b.dataset.ref;
          const v = input(`[data-adv=${k}]`).value;
          ui.editingAdvice = null;
          await updateTask(t.id, { advice: { ...(t.advice || {}), [k]: v } });
          return;
        }
        // docs/changes/009: briefing -> claude -> ergebnis, nothing in between
        case 'to-claude':
          await updateTask(t.id, { status: 'claude' });
          await addComment(t.id, 'An Claude übergeben.');
          return;
        case 'more':
          ui.more[t.id] = !isMoreOpen(t);
          render();
          return;
        case 'advice-add':
          ui.adviceAdd.add(t.id);
          render();
          return;
        case 'accept':
          await updateTask(t.id, { status: 'ergebnis', done: true, ...doneBy(true) });
          return;
        case 'back':
          await updateTask(t.id, { status: 'briefing' });
          return;
        case 'del':
          ui.confirm = 'del:' + t.id;
          render();
          return;
        case 'del-yes':
          ui.expanded = null;
          ui.confirm = null;
          syncHash();
          await deleteTask(t.id);
          toast('Aufgabe gelöscht');
          return;
        case 'confirm-no':
          ui.confirm = null;
          render();
          return;
        case 'add': {
          const box = b.closest('.addbox');
          const title = input('[data-input=new-t]', box).value.trim();
          if (!title) return toast('Bitte einen Titel eingeben');
          const w = parseInt(input('[data-input=new-w]', box).value || '0', 10);
          const dir = parseInt(input('[data-input=new-dir]', box).value, 10);
          const id = await insertTask({
            phase: parseInt(input('[data-input=new-p]', box).value, 10),
            title,
            owner: input('[data-input=new-o]', box).value,
            offset_days: w * 7 * dir,
            critical: input('[data-input=new-c]', box).checked,
            type: input('[data-input=new-type]', box).value,
          });
          const nt = byId(id);
          // keep the new task visible: drop the filter and the phase chip if they would hide it
          if (nt && ui.filter && !FILTERS[ui.filter].test(nt)) ui.filter = null;
          if (nt && ui.phase !== null && nt.phase !== ui.phase) ui.phase = nt.phase;
          if (nt) revealTask(nt);
          setExpanded(id);
          toast('Aufgabe hinzugefügt');
          return;
        }
      }
    } catch (err) {
      fail(err);
    }
  });
}

/* ---------- bootstrap ---------- */
async function enter(session) {
  if (!session) {
    state.person = null;
    show('login');
    return;
  }
  state.email = session.user?.email || null;
  show('loading');
  try {
    state.person = await auth.whoAmI();
    try {
      localStorage.setItem(PERSON_KEY, state.person || '');
    } catch {}
  } catch (e) {
    // offline: fall back to the person code of the last successful login (RLS is unaffected)
    try {
      state.person = localStorage.getItem(PERSON_KEY) || null;
    } catch {}
    if (!state.person) {
      $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
      return;
    }
  }
  if (!state.person) {
    $('#denied-email').textContent = state.email || '';
    show('denied');
    return;
  }
  try {
    await Promise.all([loadAll(), loadChangelog(), loadPersonRow()]);
    ui.offline = false;
  } catch (e) {
    // no connection: the move-in day still works – last loaded state, read only (009)
    const at = await loadSnapshot();
    if (!at) {
      $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
      return;
    }
    ui.offline = true;
    await loadChangelog();
  }
  ui.filter = null;
  ui.changelogOpen = false;
  // never been here: set the baseline now, otherwise everything would be "new" forever (009)
  if (state.lastVisitAt === null) markVisit().catch(() => {});
  const viaLink = openedViaTaskLink();
  if (viaLink) openTaskFromHash();
  if (openedViaFinanzen()) ui.screen = 'finanzen';
  show('app');
  render();
  if (viaLink) $('.task.open')?.scrollIntoView({ block: 'start' });
  else if (hasUnread()) openChangelog(true); // once per person: after login and data, never when following a task link
  subscribeRealtime();
}

let started = false;
async function main() {
  loadUI();
  auth.initLoginForm();
  wireEvents();
  $('#denied-logout').addEventListener('click', () => auth.signOut());

  auth.onAuthChange((session) => {
    // defer: supabase calls inside the auth callback itself can deadlock
    if (session && !started) {
      started = true;
      setTimeout(() => enter(session), 0);
    } else if (!session) {
      started = false;
      setTimeout(() => enter(null), 0);
    }
  });
  const session = await auth.getSession();
  if (!session) enter(null);
  else if (!started) {
    started = true;
    enter(session);
  }

  registerServiceWorker();
}

/* ---------- service worker: install, look for new builds, announce them ---------- */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // updateViaCache: 'none' -> sw.js itself is always fetched from the network on update checks
    const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      const isUpdate = !!navigator.serviceWorker.controller; // no controller yet = first install, nothing to announce
      if (!sw || !isUpdate) return;
      // the new build calls skipWaiting + clients.claim, so 'activated' means it now serves this page
      sw.addEventListener('statechange', () => {
        if (sw.state !== 'activated') return;
        ui.updateReady = true; // docs/changes/013 A6: a bar says it, instead of a permanent button
        render();
      });
    });
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    setInterval(check, 30 * 60 * 1000);
  } catch (e) {
    console.warn('SW registration failed', e);
  }
}

main();
