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
  runSeedMerge,
} from './state.js';
import { FILTERS } from './filters.js';
import { dashboardView } from './views/dashboard.js';

const UI_KEY = 'spatzlbau-ui';

// dashboard state (docs/changes/002): one active filter, "Diese Woche" on every open; phase is remembered per device
ui.filter = 'week';
ui.phase = null;
ui.dateEdit = false;

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
  if (!list.length) return;
  if (!list.some((p) => p.id === ui.phase)) {
    const firstOpen = state.tasks.filter((t) => !t.done).sort((a, b) => a.phase - b.phase)[0];
    ui.phase = firstOpen ? firstOpen.phase : list[0].id;
  }
}
function render() {
  if (!state.loaded) return;
  if (isTyping()) {
    renderPending = true;
    return;
  }
  renderPending = false;
  ensurePhase();
  $('#view').innerHTML = dashboardView();
  if (ui.confirm === 'seed') {
    $('#view .list').insertAdjacentHTML(
      'afterbegin',
      `<div class="confirm block">Seed aktualisieren? Neue Stammaufgaben und Beratungstexte werden ergänzt, eure Häkchen, Kommentare und Änderungen bleiben. <button class="btn small primary" data-act="seed-yes">Ja, einspielen</button><button class="btn small" data-act="confirm-no">Nein</button></div>`,
    );
  }
  renderStatus('idle');
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
    if (Number.isInteger(u.phase)) ui.phase = u.phase;
  } catch {}
}

/* ---------- seed ---------- */
async function fetchSeed() {
  const r = await fetch('./seed.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('seed.json nicht ladbar');
  return r.json();
}
async function applySeed(reason) {
  try {
    const seed = await fetchSeed();
    const s = await runSeedMerge(seed);
    toast(`${reason}: ${s.newTasks} neue Aufgaben, ${s.updatedTasks} aktualisiert, ${s.newSubtasks} Teilschritte ergänzt`);
  } catch (e) {
    toast('Seed konnte nicht eingespielt werden: ' + e.message);
  }
}
async function maybeAutoSeed() {
  try {
    const seed = await fetchSeed();
    const current = Number(state.settings.seed_version) || 0;
    if (seed.version > current) await applySeed('Inhalte aktualisiert');
  } catch (e) {
    console.warn('seed check failed', e);
  }
}

/* ---------- events ---------- */
const fail = (e) => e && toast('Nicht gespeichert – bitte nochmal versuchen');

function wireEvents() {
  const view = $('#view');
  view.addEventListener('focusout', () => setTimeout(() => renderPending && !isTyping() && render(), 0));

  view.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 'einzug') {
      ui.dateEdit = false;
      setSetting('einzugstermin', el.value || '').catch(fail);
      return;
    }
    const row = el.closest('.task');
    const t = row ? byId(row.dataset.id) : null;
    if (el.dataset.act === 'sub-done') {
      setSubtaskDone(el.closest('.sub').dataset.sub, el.checked)
        .then((autoDone) => autoDone && toast('Alle Teilschritte erledigt – Aufgabe abgehakt'))
        .catch(fail);
      return;
    }
    if (el.dataset.act === 'done' && t) {
      updateTask(t.id, { done: el.checked }).catch(fail);
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
    // KPI tiles: exactly one active filter, tapping again clears it
    const tile = e.target.closest('[data-filter]');
    if (tile) {
      const key = tile.dataset.filter;
      ui.filter = ui.filter === key ? null : FILTERS[key] ? key : null;
      ui.expanded = null;
      render();
      return;
    }
    // gate bar and phase tabs select the phase; the filter stays
    const ph = e.target.closest('[data-phase]');
    if (ph) {
      ui.phase = parseInt(ph.dataset.phase, 10);
      ui.expanded = null;
      saveUI();
      render();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const act = b.dataset.act;
    const row = b.closest('.task');
    const t = row ? byId(row.dataset.id) : null;
    const input = (sel, root = row) => $(sel, root);
    try {
      switch (act) {
        case 'filter-clear':
          ui.filter = null;
          render();
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
        case 'seed':
          ui.confirm = 'seed';
          render();
          $('#view .list')?.scrollIntoView({ block: 'start' });
          return;
        case 'seed-yes':
          ui.confirm = null;
          render();
          await applySeed('Seed eingespielt');
          return;
        case 'open':
          ui.expanded = ui.expanded === t.id ? null : t.id;
          ui.confirm = null;
          ui.editingAdvice = null;
          render();
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
          await updateTask(t.id, { status: 'ergebnis', done: true });
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
            phase: +box.dataset.p,
            title,
            owner: input('[data-input=new-o]', box).value,
            offset_days: w * 7 * dir,
            critical: input('[data-input=new-c]', box).checked,
            type: input('[data-input=new-type]', box).value,
          });
          const nt = byId(id);
          // keep the new task visible: drop the filter if it would hide it
          if (nt && ui.filter && !FILTERS[ui.filter].test(nt)) ui.filter = null;
          ui.expanded = id;
          render();
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
    await loadAll();
  } catch (e) {
    $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
    return;
  }
  ui.filter = 'week';
  show('app');
  render();
  subscribeRealtime();
  maybeAutoSeed();
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
