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
  visitReady: false, // true once migration 006 is applied: last_visit_at / seen_comments / done_by exist (009)
  settings: {}, // key -> value (jsonb)
  tasks: [], // non-deleted tasks
  subtasks: [],
  comments: [],
  loaded: false,
};

export const ui = {
  view: 'week',
  filter: 'all',
  expanded: null, // task id with open detail
  confirm: null, // 'del:<id>' | 'seed' | null
  phaseOpen: {}, // phase id -> bool (default open)
  editingAdvice: null, // '<taskId>:<key>'
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
export const doneByOther = (t) =>
  !!state.lastVisitAt && t.done && !!t.done_by && t.done_by !== state.person && t.updated_at > state.lastVisitAt;

const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtShort = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

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
  return 'bis ' + fmtShort(date);
}

// docs/changes/009: three delegation states. Tasks written before migration 007 can still
// carry go/recherche/rueckfragen/arbeit – they all read as "bei Claude".
export const claudeStep = (t) => (t.status === 'ergebnis' ? 'ergebnis' : t.status && t.status !== 'briefing' ? 'claude' : 'briefing');

export function dueInfo(t) {
  const base = einzug();
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

/* ---------- loading ---------- */
export async function loadAll() {
  const [settings, tasks, subtasks, comments] = await Promise.all([
    supabase.from('settings').select('key,value'),
    supabase.from('tasks').select('*').is('deleted_at', null),
    supabase.from('subtasks').select('*'),
    supabase.from('comments').select('*'),
  ]);
  const err = settings.error || tasks.error || subtasks.error || comments.error;
  if (err) throw err;
  state.settings = Object.fromEntries(settings.data.map((r) => [r.key, r.value]));
  state.tasks = tasks.data;
  state.subtasks = subtasks.data;
  state.comments = comments.data;
  state.loaded = true;
  notify();
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
}

// leaving the app ends the visit; the block on the next open is measured from here.
// Silent on purpose (no status line, no throw): this runs while the page is going away.
let visitWritten = 0;
export async function markVisit() {
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
  await supabase.from('allowlist').update({ seen_comments: ids }).eq('person', state.person);
}

export async function setLastSeenVersion(version) {
  if (state.lastSeenVersion === version) return;
  state.lastSeenVersion = version;
  notify();
  // RLS + column grant: only the own row, only this column
  return write('allowlist', () => supabase.from('allowlist').update({ last_seen_version: version }).eq('person', state.person));
}

/* ---------- realtime: any change -> debounced reload ---------- */
let reloadTimer = null;
export function subscribeRealtime() {
  const scheduleReload = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => loadAll().catch((e) => status('error', 'Aktualisieren fehlgeschlagen: ' + e.message)), 250);
  };
  const ch = supabase.channel('spatzlbau-db');
  for (const table of ['settings', 'tasks', 'subtasks', 'comments']) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleReload);
  }
  ch.subscribe((s) => {
    if (s === 'SUBSCRIBED') status('live', 'Live');
    else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') status('error', 'Keine Live-Verbindung – Seite neu laden');
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

export async function addComment(taskId, body) {
  const row = { task_id: taskId, author: state.person, body };
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

export async function setSetting(key, value) {
  state.settings[key] = value;
  notify();
  return write('setting', () => supabase.from('settings').upsert({ key, value }, { onConflict: 'key' }));
}
