// App bootstrap: auth gate, rendering, event delegation, realtime, service worker.
import { APP_VERSION } from './config.js';
import { $, $$, esc, toast } from './ui/dom.js';
import { OWN } from './ui/labels.js';
import * as auth from './auth.js';
import {
  state,
  ui,
  onChange,
  onStatus,
  byId,
  einzug,
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
import { weekView } from './views/week.js';
import { focusView } from './views/focus.js';
import { claudeView } from './views/claude.js';
import { phasesView } from './views/phases.js';

const VIEWS = { week: weekView, focus: focusView, claude: claudeView, phases: phasesView };
const UI_KEY = 'umzug-ui';

/* ---------- screens ---------- */
function show(screen) {
  for (const id of ['login', 'denied', 'app', 'loading']) $('#' + id).hidden = id !== screen;
  $('#logout').hidden = screen !== 'app';
}

/* ---------- status line ---------- */
let lastSaved = '';
let live = false;
function renderStatus(kind, msg) {
  const el = $('#status');
  const who = state.person ? OWN[state.person] : '';
  if (kind === 'saved') lastSaved = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (kind === 'live') live = true;
  if (kind === 'error') {
    el.textContent = msg;
    el.className = 'status err';
    return;
  }
  const parts = [who ? 'Eingeloggt als ' + who : '', kind === 'saving' ? msg : lastSaved ? 'Gespeichert ' + lastSaved : '', live ? 'Live' : 'Verbinde …'];
  el.textContent = parts.filter(Boolean).join(' · ');
  el.className = 'status';
}
onStatus(renderStatus);

/* ---------- rendering (skipped while typing, caught up on blur) ---------- */
let renderPending = false;
function isTyping() {
  const a = document.activeElement;
  return a && $('#view').contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text'));
}
function render() {
  if (!state.loaded) return;
  if (isTyping()) {
    renderPending = true;
    return;
  }
  renderPending = false;
  $('#einzug').value = einzug();
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  $('#pct').textContent = (total ? Math.round((done / total) * 100) : 0) + ' %';
  $('#cnt').textContent = done + ' von ' + total + ' erledigt';
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.v === ui.view));
  $('#view').innerHTML = VIEWS[ui.view]();
  if (ui.confirm === 'seed') {
    $('#view').insertAdjacentHTML(
      'afterbegin',
      `<div class="confirm block">Seed aktualisieren? Neue Stammaufgaben und Beratungstexte werden ergänzt, eure Häkchen, Kommentare und Änderungen bleiben. <button class="btn small primary" data-act="seed-yes">Ja, einspielen</button><button class="btn small" data-act="confirm-no">Nein</button></div>`,
    );
  }
  renderStatus('idle');
}
onChange(render);

function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ view: ui.view, filter: ui.filter, phaseOpen: ui.phaseOpen }));
  } catch {}
}
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    if (VIEWS[u.view]) ui.view = u.view;
    if (u.filter) ui.filter = u.filter;
    if (u.phaseOpen) ui.phaseOpen = u.phaseOpen;
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
  $('#einzug').addEventListener('change', (e) => setSetting('einzugstermin', e.target.value || '').catch(fail));
  $('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    ui.view = b.dataset.v;
    ui.expanded = null;
    ui.confirm = null;
    saveUI();
    render();
  });
  $('#logout').addEventListener('click', () => auth.signOut());
  $('#reload').addEventListener('click', () => location.reload());
  $('#seed-btn').addEventListener('click', () => {
    ui.confirm = 'seed';
    render();
    window.scrollTo({ top: 0 });
  });

  const view = $('#view');
  view.addEventListener('focusout', () => setTimeout(() => renderPending && !isTyping() && render(), 0));

  view.addEventListener('change', (e) => {
    const el = e.target;
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
      let v = el.value;
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
    const chip = e.target.closest('.chip[data-f]');
    if (chip) {
      ui.filter = chip.dataset.f;
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
        case 'open':
          ui.expanded = ui.expanded === t.id ? null : t.id;
          ui.confirm = null;
          ui.editingAdvice = null;
          render();
          return;
        case 'phase-toggle': {
          const p = b.closest('.phase').dataset.p;
          ui.phaseOpen[p] = ui.phaseOpen[p] === false;
          saveUI();
          render();
          return;
        }
        case 'crit':
          await updateTask(t.id, { critical: !t.critical });
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
        case 'seed-yes':
          ui.confirm = null;
          render();
          await applySeed('Seed eingespielt');
          return;
        case 'add': {
          const box = b.closest('.addbox');
          const title = input('[data-input=new-t]', box).value.trim();
          if (!title) return toast('Bitte einen Titel eingeben');
          const w = parseInt(input('[data-input=new-w]', box).value || '0', 10);
          const dir = parseInt(input('[data-input=new-dir]', box).value, 10);
          await insertTask({
            phase: +box.dataset.p,
            title,
            owner: input('[data-input=new-o]', box).value,
            offset_days: w * 7 * dir,
            critical: input('[data-input=new-c]', box).checked,
            type: input('[data-input=new-type]', box).value,
          });
          toast('Aufgabe hinzugefügt');
          return;
        }
        case 'add-claude': {
          const inp = $('[data-input=new-claude]');
          const title = inp.value.trim();
          if (!title) return toast('Bitte einen Titel eingeben');
          const id = await insertTask({ phase: 3, title, owner: 'B', offset_days: -28, type: 'claude' });
          ui.expanded = id;
          render();
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
  $('#version').textContent = 'v' + APP_VERSION;

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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
  }
}

main();
