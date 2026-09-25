// In-memory state, derived helpers and all writes to Supabase.
// Every write is field-precise (update of single columns on single rows) and optimistic:
// the local state changes first, the server call follows, errors reload from the server.
import { supabase } from './supabase.js';

export const state = {
  person: null, // 'S' | 'A'
  email: null,
  lastSeenVersion: undefined, // allowlist.last_seen_version of this person; undefined = could not be read (005b)
  lastVisitAt: undefined, // allowlist.last_visit_at: when this person last left; null = never here, undefined = unknown (009)
  seenComments: new Set(), // ids of new comments this person already opened (009)
  seenGates: new Set(), // phase ids whose gate moment this person has already seen (021)
  gatesReady: false, // true once migration 013 is applied: allowlist.seen_gates exists (021)
  visitReady: false, // true once migration 006 is applied: last_visit_at / seen_comments / done_by exist (009)
  loadedAt: null, // when the data last came from the server (009, offline notice)
  settings: {}, // key -> value (jsonb)
  tasks: [], // non-deleted tasks
  subtasks: [],
  comments: [],
  costs: [], // cost rows per task (docs/changes/007)
  recurring: [], // monthly costs old vs new, for the double rent in the cashflow (007)
  changes: [], // task_changes rows, newest first (018) - empty while migration 011 is missing
  hasChanges: false, // true once migration 011 is applied and the table could be read (018)
  loaded: false,
};

export const ui = {
  filter: 'all',
  expanded: null, // task id with open detail
  confirm: null, // 'del:<id>' | null
  phaseOpen: {}, // phase id -> bool (default open)
  // docs/changes/010: the same deploy serves "/" and "/preview/" out of the same database.
  // The preview is read-only for the per-person reading state (012 bugfix), so the flag lives
  // here, next to the three writers it stops – not only in the view layer.
  preview: typeof location !== 'undefined' && location.pathname.includes('/preview/'),
};

/* ---------- change notification ---------- */
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const notify = () => listeners.forEach((fn) => fn());

let statusFn = () => {};
export const onStatus = (fn) => (statusFn = fn);
const status = (kind, msg) => statusFn(kind, msg);

/* ---------- lookups ---------- */
export const byId = (id) => state.tasks.find((t) => t.id === id);
export const subsOf = (taskId) =>
  state.subtasks.filter((s) => s.task_id === taskId).sort((a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at));
export const comsOf = (taskId) =>
  state.comments.filter((c) => c.task_id === taskId).sort((a, b) => a.created_at.localeCompare(b.created_at));
export const phases = () => (Array.isArray(state.settings.phases) && state.settings.phases.length ? state.settings.phases : []);
export const einzug = () => (typeof state.settings.einzugstermin === 'string' && state.settings.einzugstermin) || '';
// docs/changes/026: personen[] + wohnungen{s,a,n}, read-modify-write as one jsonb value so
// fields the setup screens do not show (plz, hinweise, ...) survive every save
export const stammdaten = () => {
  const v = state.settings.stammdaten;
  return v && typeof v === 'object' && !Array.isArray(v) ? v : { personen: [], wohnungen: {} };
};
// bugfix 1.1: the actual moving day, separate from the key handover date - 01.01. is a holiday,
// nothing about the day itself was ever true for it. Falls back to einzug() while unset.
export const umzugstag = () => (typeof state.settings.umzugstag === 'string' && state.settings.umzugstag) || '';
// the date a task's deadline is measured from: einzug for almost everything, umzugstag for the
// tasks a content package anchors to the day itself (tasks.anchor, bugfix 1.1)
export const anchorDate = (t) => (t.anchor === 'umzugstag' && umzugstag()) || einzug();

/* ---------- derived logic (BRIEFING §3) ---------- */
export function blockers(t) {
  return (t.blocked_by || []).map(byId).filter((b) => b && !b.done);
}
export function subProgress(t) {
  const subs = subsOf(t.id);
  return subs.length ? [subs.filter((s) => s.done).length, subs.length] : null;
}

/* "Seit deinem letzten Besuch" (docs/changes/009): everything written by someone else since
   this person left. fresh = what the summary block and its filters count; unseen = what still
   carries a dot in the row (opening the task takes the dot away, per task). */
export function freshComments(t) {
  if (!state.lastVisitAt) return [];
  return comsOf(t.id).filter((c) => c.author !== state.person && c.created_at > state.lastVisitAt);
}
export const unseenComments = (t) => freshComments(t).filter((c) => !state.seenComments.has(c.id));

/* ---------- decisions (docs/changes/032): a comment marked `decision` is confirmed once both
   ack_s and ack_a are set - the trigger sets the author's own tick and nulls both on unmarking.
   "open" = not yet replaced by a newer confirmed decision on the same task (superseded_by). */
export const ackedBy = (c, person) => !!(person === 'S' ? c.ack_s : c.ack_a);
export const isConfirmedDecision = (c) => !!(c.ack_s && c.ack_a);
export const decisionsOf = (t) => comsOf(t.id).filter((c) => c.decision);
export const openDecisionsOf = (t) => decisionsOf(t).filter((c) => !c.superseded_by);
// every decision across all tasks, newest first - the "Alle Entscheidungen" list (032)
export const allDecisions = () => state.comments.filter((c) => c.decision).sort((a, b) => b.created_at.localeCompare(a.created_at));
// docs/changes/032b: how many decisions still miss this person's own tick - the nav badge and
// the "Entscheidungen · n" card share this one number
export const myOpenDecisionsCount = () => allDecisions().filter((c) => !c.superseded_by && !ackedBy(c, state.person)).length;
export const doneByOther = (t) =>
  !!state.lastVisitAt && t.done && !!t.done_by && t.done_by !== state.person && t.updated_at > state.lastVisitAt;

const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtShort = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const fmtWd = (d) => d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');

// docs/changes/029b #4: one date format for running text - "Mo 28.12.", year only when it
// differs from the current one ("Fr 01.01.2027"). Kopf, Gruppenlabels and the Akte's deadline
// text share this; compact figures (a due-date column, "seit N T.") and the Rahmendaten block
// ("Fr, 01.01.2027") are their own thing on purpose and stay untouched (029b Abweichungen).
export function fmtDay(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  const dm = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }); // "28.12."
  const y = d.getFullYear();
  return y === new Date().getFullYear() ? `${fmtWd(d)} ${dm}` : `${fmtWd(d)} ${dm}${y}`;
}

// deadline relative to the move-in date, without a calendar date
export function offsetLabel(t) {
  const d = t.offset_days;
  const w = Math.round(Math.abs(d) / 7);
  if (d === 0) return 'am Umzugstag';
  if (Math.abs(d) < 7) return Math.abs(d) + (d < 0 ? ' Tage vorher' : ' Tage danach');
  return '≈ ' + w + (d < 0 ? ' Wochen vorher' : ' Wochen danach');
}

// due label per design: "überfällig seit n Tagen" / "heute" / "morgen" / "bis 23.09."
export function dueLabel(t) {
  const du = dueInfo(t);
  if (!einzug()) return du.label;
  const date = new Date(du.sort);
  if (t.done) return fmtShort(date);
  const d = du.diff;
  if (d < 0) return `überfällig seit ${-d} ${-d === 1 ? 'Tag' : 'Tagen'}`;
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  // docs/changes/013 A5: near dates also say how near - a date alone is hard to feel
  // docs/changes/014e #3: local-calendar string, not toISOString() (UTC, a day early east of
  // UTC) - `date` already sits at local midnight, converting it through UTC can slip a day
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (d < 60) return `bis ${fmtDay(iso)} (in ${d} Tagen)`;
  return 'bis ' + fmtDay(iso);
}

/** The deadline as the row shows it since 020: a date, right-aligned, short enough to sit
    next to the title. "heute"/"morgen" stay words, an overdue row counts days, and the chip
    next to it already says "überfällig" - so the date itself does not repeat it. */
export function dueShort(t) {
  const du = dueInfo(t);
  if (!anchorDate(t)) return du.label; // no date set at all: the offset text from dueInfo
  const date = new Date(du.sort);
  if (t.done) return fmtShort(date);
  const d = du.diff;
  if (d < 0) return `seit ${-d} T.`;
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  return fmtShort(date);
}

// docs/changes/009: three delegation states. Tasks written before migration 007 can still
// carry go/recherche/rueckfragen/arbeit – they all read as "bei Claude".
export const claudeStep = (t) => (t.status === 'ergebnis' ? 'ergebnis' : t.status && t.status !== 'briefing' ? 'claude' : 'briefing');

export function dueInfo(t) {
  const base = anchorDate(t);
  if (base) {
    const dt = new Date(base + 'T00:00:00');
    dt.setDate(dt.getDate() + t.offset_days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((dt - today) / 86400000);
    const cls = !t.done && diff < 0 ? 'late' : !t.done && diff <= 7 ? 'soon' : '';
    return { label: 'bis ' + fmtDate(dt), cls, sort: dt.getTime(), diff };
  }
  const d = t.offset_days;
  const w = Math.round(Math.abs(d) / 7);
  return { label: offsetLabel(t), cls: '', sort: d, diff: null };
}

/* ---------- offline: the last loaded state stays on the device (docs/changes/009) ----------
   Read only. Nothing is ever written while offline, so there is nothing to sync back.
   localStorage instead of the Cache API: see docs/changes/009-abweichungen.md. */
const SNAP_KEY = 'spatzlbau-snapshot';

function saveSnapshot() {
  try {
    localStorage.setItem(
      SNAP_KEY,
      JSON.stringify({
        saved_at: state.loadedAt,
        settings: state.settings,
        tasks: state.tasks,
        subtasks: state.subtasks,
        comments: state.comments,
        costs: state.costs,
        recurring: state.recurring,
        changes: state.changes,
      }),
    );
  } catch {} // quota or private mode: the app just has no offline copy
}

let snapshotTimer = null;
const saveSnapshotSoon = () => {
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(saveSnapshot, 1000);
};

/** Fill the state from the copy on this device. Returns when it was taken, or null. */
export function loadSnapshot() {
  try {
    const d = JSON.parse(localStorage.getItem(SNAP_KEY) || 'null');
    if (!d || !Array.isArray(d.tasks)) return null;
    state.settings = d.settings || {};
    state.tasks = d.tasks;
    state.subtasks = d.subtasks || [];
    state.comments = d.comments || [];
    state.costs = d.costs || [];
    state.recurring = d.recurring || [];
    state.changes = d.changes || [];
    state.loadedAt = d.saved_at || null;
    state.loaded = true;
    notify();
    return state.loadedAt;
  } catch {
    return null;
  }
}

/* ---------- loading ---------- */
export async function loadAll() {
  const [settings, tasks, subtasks, comments, costs, recurring] = await Promise.all([
    supabase.from('settings').select('key,value'),
    supabase.from('tasks').select('*').is('deleted_at', null),
    supabase.from('subtasks').select('*'),
    supabase.from('comments').select('*'),
    supabase.from('costs').select('*'),
    supabase.from('recurring').select('*'),
  ]);
  const err = settings.error || tasks.error || subtasks.error || comments.error || costs.error || recurring.error;
  if (err) throw err;
  state.settings = Object.fromEntries(settings.data.map((r) => [r.key, r.value]));
  state.tasks = tasks.data;
  state.subtasks = subtasks.data;
  state.comments = comments.data;
  state.costs = costs.data;
  state.recurring = recurring.data;
  // docs/changes/018: the change log is additive and asked for on its own. Without migration 011
  // the table is missing, the query fails, and "Seit du zuletzt da warst" simply stays away.
  const chg = await supabase.from('task_changes').select('*').order('changed_at', { ascending: false }).limit(200);
  state.hasChanges = !chg.error;
  state.changes = chg.error ? [] : chg.data;
  state.loaded = true;
  state.loadedAt = new Date().toISOString();
  notify();
  saveSnapshot();
}

/* ---------- per-person state in the allowlist row (005b: changelog, 009: last visit) ---------- */
// select('*') on purpose: the app keeps working when the 009 migration is not applied yet
export async function loadPersonRow() {
  const { data, error } = await supabase.from('allowlist').select('*').eq('person', state.person).maybeSingle();
  if (error || !data) {
    state.lastSeenVersion = undefined;
    state.lastVisitAt = undefined;
    return;
  }
  state.lastSeenVersion = data.last_seen_version; // null = never read anything
  state.visitReady = 'last_visit_at' in data; // migration 006 applied?
  state.lastVisitAt = state.visitReady ? data.last_visit_at : undefined;
  state.seenComments = new Set(Array.isArray(data.seen_comments) ? data.seen_comments : []);
  // docs/changes/021: without migration 013 the column is missing - the moment is then shown
  // once per session and nothing is written
  state.gatesReady = 'seen_gates' in data;
  state.seenGates = new Set(Array.isArray(data.seen_gates) ? data.seen_gates : []);
}

/** Remember that this person has seen the gate of a phase (021). */
export async function markGateSeen(phase) {
  if (state.seenGates.has(phase)) return;
  state.seenGates.add(phase);
  notify();
  // the preview never writes the reading state (010), and without migration 013 there is no column
  if (ui.preview || !state.gatesReady) return;
  await supabase.from('allowlist').update({ seen_gates: [...state.seenGates] }).eq('person', state.person);
}

/** A phase is done when it has tasks and every one of them is ticked off (021). */
export function phaseDone(id) {
  const all = state.tasks.filter((t) => t.phase === id);
  return all.length > 0 && all.every((t) => t.done);
}

/** The first finished phase whose moment this person has not had yet, or null. */
export function unseenGate() {
  for (const p of phases()) if (phaseDone(p.id) && !state.seenGates.has(p.id)) return p.id;
  return null;
}

// leaving the app ends the visit; the block on the next open is measured from here.
// Silent on purpose (no status line, no throw): this runs while the page is going away.
let visitWritten = 0;
export async function markVisit() {
  if (ui.preview) return; // the preview never ends a visit: it would move the live block (012)
  if (state.lastVisitAt === undefined || !state.person) return; // column not there / not logged in
  const now = Date.now();
  if (now - visitWritten < 60000) return;
  visitWritten = now;
  // state.lastVisitAt stays as it was: the summary block must not vanish under the reader's hands
  await supabase.from('allowlist').update({ last_visit_at: new Date().toISOString(), seen_comments: [] }).eq('person', state.person);
}

// opening a task takes its dot away – per task, so the other dots stay
export async function markCommentsSeen(taskId) {
  if (!state.lastVisitAt) return;
  const t = byId(taskId);
  const fresh = t ? unseenComments(t) : [];
  if (!fresh.length) return;
  fresh.forEach((c) => state.seenComments.add(c.id));
  notify();
  // only ids that are still newer than the last visit – the list can never grow without bound
  const fresher = new Set(state.comments.filter((c) => c.created_at > state.lastVisitAt).map((c) => c.id));
  const ids = [...state.seenComments].filter((id) => fresher.has(id));
  state.seenComments = new Set(ids);
  // the dot goes away while this session lasts, but the preview does not remember it (012)
  if (ui.preview) return;
  await supabase.from('allowlist').update({ seen_comments: ids }).eq('person', state.person);
}

export async function setLastSeenVersion(version) {
  if (state.lastSeenVersion === version) return;
  state.lastSeenVersion = version;
  notify();
  // closing "Was ist neu?" in the preview must not mark the version as read for the real app (012)
  if (ui.preview) return;
  // RLS + column grant: only the own row, only this column
  return write('allowlist', () => supabase.from('allowlist').update({ last_seen_version: version }).eq('person', state.person));
}

/* ---------- realtime (docs/changes/010 point 2) ----------
   Work the single row out of the event into the local state instead of reloading every table.
   A full reload is the fallback for two cases only: an event we cannot apply, and a reconnect
   (while the socket was down we may have missed events).
   An echo of our own write carries the values we already have, so it changes nothing and
   draws nothing - that is what keeps typing and ticking free of flicker. */

// everything except the bookkeeping column: an echo differs only in updated_at
const sameRow = (a, b) => {
  if (!a || !b) return false;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'updated_at') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return false;
  }
  return true;
};

// returns true when the list really changed (and the view has to be drawn again)
function upsertRow(list, row) {
  const i = list.findIndex((x) => x.id === row.id);
  if (i < 0) {
    list.push(row);
    return true;
  }
  const unchanged = sameRow(list[i], row);
  list[i] = row; // keep the server's updated_at either way
  return !unchanged;
}

function dropRow(list, id) {
  const i = id === undefined ? -1 : list.findIndex((x) => x.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

const hasFields = (o) => !!o && Object.keys(o).length > 0;

/** Apply one postgres_changes payload. Exported for the tests; returns true if the state changed. */
export function applyRealtimeEvent(table, payload) {
  const row = hasFields(payload?.new) ? payload.new : null;
  const old = hasFields(payload?.old) ? payload.old : null;
  const deleted = payload?.eventType === 'DELETE';
  if (!deleted && !row) throw new Error('event without row');

  switch (table) {
    case 'tasks':
      // the app never deletes a task hard; deleted_at arrives as a plain update
      if (deleted) return dropRow(state.tasks, old?.id);
      return row.deleted_at ? dropRow(state.tasks, row.id) : upsertRow(state.tasks, row);
    case 'subtasks':
      return deleted ? dropRow(state.subtasks, old?.id) : upsertRow(state.subtasks, row);
    case 'comments':
      return deleted ? dropRow(state.comments, old?.id) : upsertRow(state.comments, row);
    case 'costs':
      return deleted ? dropRow(state.costs, old?.id) : upsertRow(state.costs, row);
    case 'recurring':
      return deleted ? dropRow(state.recurring, old?.id) : upsertRow(state.recurring, row);
    case 'task_changes': {
      // append-only (018): a new row goes to the front, nothing is ever updated or deleted
      if (deleted || state.changes.some((c) => c.id === row.id)) return false;
      state.changes.unshift(row);
      return true;
    }
    case 'settings': {
      const key = deleted ? old?.key : row.key;
      if (!key) return false;
      if (deleted) {
        if (!(key in state.settings)) return false;
        delete state.settings[key];
        return true;
      }
      if (JSON.stringify(state.settings[key]) === JSON.stringify(row.value)) return false;
      state.settings[key] = row.value;
      return true;
    }
    default:
      throw new Error('unknown table ' + table);
  }
}

let reloadTimer = null;
let notifyTimer = null;
export function subscribeRealtime() {
  const scheduleReload = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => loadAll().catch((e) => status('error', 'Aktualisieren fehlgeschlagen: ' + e.message)), 250);
  };
  // a seed run or a burst of subtasks arrives as many events; draw once, not once per row
  const scheduleNotify = () => {
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      notifyTimer = null;
      notify();
    }, 60);
  };

  let wasSubscribed = false;
  const ch = supabase.channel('spatzlbau-db');
  const tables = ['settings', 'tasks', 'subtasks', 'comments', 'costs', 'recurring'];
  if (state.hasChanges) tables.push('task_changes'); // only when migration 011 is in (018)
  for (const table of tables) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      let changed;
      try {
        changed = applyRealtimeEvent(table, payload);
      } catch (e) {
        console.warn('realtime event not applied, reloading instead', e);
        scheduleReload();
        return;
      }
      if (!changed) return; // our own write coming back
      state.loadedAt = new Date().toISOString();
      saveSnapshotSoon();
      scheduleNotify();
    });
  }
  ch.subscribe((s) => {
    if (s === 'SUBSCRIBED') {
      status('live', 'Live');
      if (wasSubscribed) scheduleReload(); // reconnected: catch up on whatever we missed
      wasSubscribed = true;
    } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
      status('error', 'Keine Live-Verbindung – Seite neu laden');
    }
  });
  return ch;
}

/* ---------- write helper ---------- */
async function write(label, fn) {
  status('saving', 'Speichern …');
  const { error } = await fn();
  if (error) {
    status('error', 'Speichern fehlgeschlagen: ' + error.message);
    await loadAll().catch(() => {});
    throw error;
  }
  status('saved', 'Gespeichert');
  return true;
}

/* ---------- mutations ---------- */
// who ticked a task off (009). Skipped while migration 006 is not applied, so ticking keeps
// working between the deploy and the moment Sebastian runs the migration.
export const doneBy = (done) => (state.visitReady ? { done_by: done ? state.person : null } : {});

export async function updateTask(id, patch) {
  const t = byId(id);
  if (!t) return;
  Object.assign(t, patch);
  notify();
  return write('task', () => supabase.from('tasks').update(patch).eq('id', id));
}

export async function insertTask(fields) {
  const task = {
    id: 'c_' + Date.now(),
    owner: 'B',
    offset_days: 0,
    critical: false,
    type: 'self',
    done: false,
    wait_on: null,
    blocked_by: [],
    brief: {},
    advice: {},
    sort: 9999,
    ...fields,
    status: fields.type === 'claude' ? 'briefing' : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.tasks.push(task);
  notify();
  const { created_at, updated_at, ...row } = task;
  await write('task', () => supabase.from('tasks').insert(row));
  return task.id;
}

export async function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  notify();
  return write('task', () => supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id));
}

export async function setSubtaskDone(id, done) {
  const s = state.subtasks.find((x) => x.id === id);
  if (!s) return false;
  s.done = done;
  notify();
  await write('subtask', () => supabase.from('subtasks').update({ done }).eq('id', id));
  // a task with subtasks is done once all subtasks are done
  const t = byId(s.task_id);
  const subs = subsOf(s.task_id);
  if (t && !t.done && subs.length && subs.every((x) => x.done)) {
    await updateTask(t.id, { done: true, ...doneBy(true) });
    return true;
  }
  return false;
}

export async function addSubtask(taskId, title) {
  const subs = subsOf(taskId);
  const row = { task_id: taskId, title, done: false, sort: subs.length ? Math.max(...subs.map((s) => s.sort)) + 1 : 0 };
  status('saving', 'Speichern …');
  const { data, error } = await supabase.from('subtasks').insert(row).select().single();
  if (error) {
    status('error', 'Speichern fehlgeschlagen: ' + error.message);
    throw error;
  }
  state.subtasks.push(data);
  status('saved', 'Gespeichert');
  notify();
}

export async function deleteSubtask(id) {
  state.subtasks = state.subtasks.filter((s) => s.id !== id);
  notify();
  return write('subtask', () => supabase.from('subtasks').delete().eq('id', id));
}

// renaming a subtask (docs/changes/013 B2) - same shape as updateTask/updateCost
export async function updateSubtask(id, patch) {
  const s = state.subtasks.find((x) => x.id === id);
  if (!s) return;
  Object.assign(s, patch);
  notify();
  return write('subtask', () => supabase.from('subtasks').update(patch).eq('id', id));
}

export async function addComment(taskId, body, decision = false) {
  const row = { task_id: taskId, author: state.person, body, decision };
  status('saving', 'Speichern …');
  const { data, error } = await supabase.from('comments').insert(row).select().single();
  if (error) {
    status('error', 'Speichern fehlgeschlagen: ' + error.message);
    throw error;
  }
  state.comments.push(data);
  status('saved', 'Gespeichert');
  notify();
}

// docs/changes/032: the author marks or unmarks their own comment as a decision - the trigger
// sets/nulls the ticks server-side, this just flips the one column
export async function setCommentDecision(id, decision) {
  return updateComment(id, { decision });
}
// each person sets or takes back only their own tick (client rule, comsOf() enforces it in the UI)
export async function setDecisionAck(id, on) {
  const key = state.person === 'S' ? 'ack_s' : 'ack_a';
  return updateComment(id, { [key]: on ? new Date().toISOString() : null });
}

// docs/changes/013 B5: only the own comments, deleting always allowed, editing only for ten
// minutes after writing it - a rule of the interface, RLS already allows both for either person
const COMMENT_EDIT_MS = 10 * 60 * 1000;
export const canEditComment = (c) => c.author === state.person && Date.now() - new Date(c.created_at).getTime() < COMMENT_EDIT_MS;

export async function updateComment(id, patch) {
  const c = state.comments.find((x) => x.id === id);
  if (!c) return;
  Object.assign(c, patch);
  notify();
  return write('comment', () => supabase.from('comments').update(patch).eq('id', id));
}

export async function deleteComment(id) {
  state.comments = state.comments.filter((c) => c.id !== id);
  notify();
  return write('comment', () => supabase.from('comments').delete().eq('id', id));
}

/* ---------- cost rows (docs/changes/007) ----------
   Label and amount are enough; the trigger from 004 fills due_on from the task deadline on
   insert and forces status 'bezahlt' as soon as paid_on is set, so the row comes back from the
   server with those values already applied. */
export async function addCost(taskId, fields) {
  // docs/changes/016: the balance transfer arrives here with kind/status/paid_* already set
  const row = { task_id: taskId, label: fields.label, amount: fields.amount, kind: 'einmalig', status: 'geschaetzt', belongs_to: 'B', tax_relevant: false, ...fields };
  status('saving', 'Speichern …');
  const { data, error } = await supabase.from('costs').insert(row).select().single();
  if (error) {
    status('error', 'Speichern fehlgeschlagen: ' + error.message);
    throw error;
  }
  state.costs.push(data);
  status('saved', 'Gespeichert');
  notify();
  return data.id;
}

export async function updateCost(id, patch) {
  const c = state.costs.find((x) => x.id === id);
  if (!c) return;
  Object.assign(c, patch);
  notify();
  return write('cost', () => supabase.from('costs').update(patch).eq('id', id));
}

export async function deleteCost(id) {
  state.costs = state.costs.filter((c) => c.id !== id);
  notify();
  return write('cost', () => supabase.from('costs').delete().eq('id', id));
}

/* ---------- monthly costs (docs/changes/007 commit 3) ---------- */
export async function addRecurring(label, fields = {}) {
  const rows = state.recurring;
  // docs/changes/016b: the Ersteinrichtung wizard hands amounts and a seed_key straight in,
  // instead of inserting empty and updating right after
  const row = { label, amount_s: null, amount_a: null, amount_n: null, sort: rows.length ? Math.max(...rows.map((r) => r.sort)) + 1 : 0, ...fields };
  status('saving', 'Speichern …');
  const { data, error } = await supabase.from('recurring').insert(row).select().single();
  if (error) {
    status('error', 'Speichern fehlgeschlagen: ' + error.message);
    throw error;
  }
  state.recurring.push(data);
  status('saved', 'Gespeichert');
  notify();
}

export async function updateRecurring(id, patch) {
  const r = state.recurring.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, patch);
  notify();
  return write('recurring', () => supabase.from('recurring').update(patch).eq('id', id));
}

export async function deleteRecurring(id) {
  state.recurring = state.recurring.filter((r) => r.id !== id);
  notify();
  return write('recurring', () => supabase.from('recurring').delete().eq('id', id));
}

export async function setSetting(key, value) {
  state.settings[key] = value;
  notify();
  return write('setting', () => supabase.from('settings').upsert({ key, value }, { onConflict: 'key' }));
}
