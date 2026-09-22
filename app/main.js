// App bootstrap: auth gate, rendering, event delegation, realtime, service worker.
import { $, esc, toast } from './ui/dom.js';
import * as auth from './auth.js';
import {
  state,
  ui,
  onChange,
  onStatus,
  byId,
  phases,
  loadAll,
  subscribeRealtime,
  updateTask,
  insertTask,
  deleteTask,
  setSubtaskDone,
  addSubtask,
  deleteSubtask,
  addComment,
  setSetting,
  loadPersonRow,
  setLastSeenVersion,
  markVisit,
  markCommentsSeen,
  doneBy,
} from './state.js';
import { FILTERS } from './filters.js';
import { compareVersions, newestVersion, hasUnread } from './changelog.js';
import { dashboardView, columns } from './views/dashboard.js';

const UI_KEY = 'spatzlbau-ui';

// dashboard state (docs/changes/009): no filter on open – the columns already answer "what is mine";
// the phase is a chip (null = all phases) and is remembered per device
ui.filter = null;
ui.phase = null;
ui.dateEdit = false;
ui.openCols = new Set(); // collapsible column ("Bei Anna") that the person opened
ui.allCols = new Set(); // columns showing more than the first eight rows
ui.doneCols = new Set(); // columns showing their done tasks as well
ui.wide = false; // docs/changes/006: ≥ 900 px -> Akte as side panel instead of inline
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
let updateReady = false; // a newer build took over the service worker (docs/changes/003)
function renderStatus(kind, msg) {
  if (kind === 'saved') lastSaved = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (kind === 'live') live = true;
  if (kind === 'error') lastError = msg;
  if (kind === 'saved' || kind === 'saving') lastError = '';
  const el = $('#status');
  if (!el) return;
  if (lastError) {
    el.textContent = lastError;
    el.className = 'status err';
    return;
  }
  const parts = [kind === 'saving' ? msg : lastSaved ? 'gespeichert ' + lastSaved : '', live ? 'Live' : 'verbinde …'];
  el.textContent = parts.filter(Boolean).join(' · ');
  el.className = 'status';
  if (updateReady) {
    el.insertAdjacentHTML('beforeend', ' · <button class="link up" data-act="reload">Neue Version – neu laden</button>');
  }
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
  $('#view').innerHTML = dashboardView();
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
  const scope = el.closest('[data-id]');
  const own = FOCUS_ATTRS.filter((a) => el.hasAttribute(a)).map((a) => `[${a}="${CSS.escape(el.getAttribute(a))}"]`).join('');
  const sub = el.closest('[data-sub]');
  // the first class disambiguates controls that share an attribute (gate segment vs. phase chip)
  const cls = el.classList[0] ? '.' + CSS.escape(el.classList[0]) : '';
  const sel = (sub ? `[data-sub="${CSS.escape(sub.dataset.sub)}"] ` : '') + el.tagName.toLowerCase() + cls + own + (el.id ? '#' + CSS.escape(el.id) : '');
  return { scope: scope ? scope.dataset.id : null, sel };
}
function restoreFocus(key) {
  if (!key) return;
  const root = key.scope ? $(`#view [data-id="${CSS.escape(key.scope)}"]`) : $('#view');
  const el = (root && root.querySelector(key.sel)) || $('#view').querySelector(key.sel);
  if (el) el.focus({ preventScroll: true });
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
    if (![...c.open, ...c.done].some((x) => x.id === t.id)) continue;
    ui.openCols.add(c.key);
    if (c.done.some((x) => x.id === t.id)) ui.doneCols.add(c.key);
  }
}
// the open task lives in the URL, so a link to it can be shared (docs/changes/006)
function syncHash() {
  const want = ui.expanded ? '#task=' + encodeURIComponent(ui.expanded) : '';
  if (location.hash === want) return;
  history.replaceState(null, '', location.pathname + location.search + want);
}
function setExpanded(id) {
  const prev = ui.expanded;
  if (id) markCommentsSeen(id).catch(() => {}); // opening takes the "new" dot away (009)
  ui.expanded = id;
  ui.confirm = null;
  ui.editingAdvice = null;
  syncHash();
  render();
  // closing gives the keyboard focus back to the task's title in the list
  if (!id && prev) $(`#view .task[data-id="${CSS.escape(prev)}"] .t`)?.focus({ preventScroll: true });
}

/* ---------- events ---------- */
const fail = (e) => e && toast('Nicht gespeichert – bitte nochmal versuchen');

function wireEvents() {
  const view = $('#view');
  view.addEventListener('focusout', () => setTimeout(() => renderPending && !isTyping() && render(), 0));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (ui.changelogOpen) closeChangelog();
    else if (ui.expanded && ui.wide) {
      // a field still being typed in saves on blur – let that happen before the panel goes
      if (document.activeElement?.closest?.('#panel')) document.activeElement.blur();
      setExpanded(null); // Escape empties the side panel
    }
  });
  // browser back/forward or a pasted link: follow the hash
  window.addEventListener('hashchange', () => {
    if (!state.loaded) return;
    const id = hashTaskId();
    if (id && byId(id)) openTaskFromHash();
    else if (!id) ui.expanded = null;
    render();
  });
  // leaving the app ends the visit: the next open measures "Seit deinem letzten Besuch" from here (009)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && markVisit().catch(() => {}));
  window.addEventListener('pagehide', () => markVisit().catch(() => {}));
  // layout mode: the Akte moves between inline (narrow) and side panel (wide) – same behaviour, other place
  const mq = matchMedia('(min-width: 900px)');
  ui.wide = mq.matches;
  mq.addEventListener('change', () => {
    ui.wide = mq.matches;
    render();
  });

  view.addEventListener('change', (e) => {
    const el = e.target;
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
    if (el.dataset.act === 'done' && t) {
      // done_by: who ticked it off – "Seit deinem letzten Besuch" must not count my own work (009)
      updateTask(t.id, { done: el.checked, ...doneBy(el.checked) }).catch(fail);
      return;
    }
    if (el.dataset.field && t) {
      const f = el.dataset.field;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'offset_days') v = parseInt(v || '0', 10);
      if (f === 'wait_on') v = v || null;
      const patch = { [f]: v };
      if (f === 'type' && v === 'claude' && !t.status) patch.status = 'briefing';
      updateTask(t.id, patch).catch(fail);
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
      ui.filter = ui.filter === key ? null : FILTERS[key] ? key : null;
      if (!ui.wide) setExpanded(null); // inline Akte closes with the list change; the side panel stays open
      else render();
      return;
    }
    // gate bar and phase chips select the phase; the filter stays
    const ph = e.target.closest('[data-phase]');
    if (ph) {
      const want = ph.dataset.phase === 'all' ? null : parseInt(ph.dataset.phase, 10);
      ui.phase = ui.phase === want ? null : want; // tapping the active phase again shows all phases
      saveUI();
      if (!ui.wide) setExpanded(null);
      else render();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const act = b.dataset.act;
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
        case 'open':
          setExpanded(ui.expanded === t.id ? null : t.id);
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
        case 'sub-del':
          await deleteSubtask(b.closest('.sub').dataset.sub);
          return;
        case 'com-add': {
          const ta = input('[data-input=com]');
          const v = ta.value.trim();
          if (!v) return;
          await addComment(t.id, v);
          return;
        }
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
        case 'go':
          await updateTask(t.id, { status: 'go' });
          await addComment(t.id, 'Go erteilt – Claude darf starten.');
          return;
        case 'answered':
          await updateTask(t.id, { status: 'arbeit' });
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
  } catch (e) {
    $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
    return;
  }
  if (!state.person) {
    $('#denied-email').textContent = state.email || '';
    show('denied');
    return;
  }
  try {
    await Promise.all([loadAll(), loadChangelog(), loadPersonRow()]);
  } catch (e) {
    $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
    return;
  }
  ui.filter = null;
  ui.changelogOpen = false;
  // never been here: set the baseline now, otherwise everything would be "new" forever (009)
  if (state.lastVisitAt === null) markVisit().catch(() => {});
  const viaLink = openedViaTaskLink();
  if (viaLink) openTaskFromHash();
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
        updateReady = true;
        renderStatus('idle');
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
