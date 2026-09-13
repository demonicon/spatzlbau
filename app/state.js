// In-memory state, derived helpers and all writes to Supabase.
// Every write is field-precise (update of single columns on single rows) and optimistic:
// the local state changes first, the server call follows, errors reload from the server.
import { supabase } from './supabase.js';
import { planSeedMerge } from './seed-merge.js';

export const state = {
  person: null, // 'S' | 'A'
  email: null,
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
export const forPerson = (t, p) => t.owner === p || t.owner === 'B';

const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  const label =
    d === 0 ? 'am Umzugstag' : Math.abs(d) < 7 ? Math.abs(d) + (d < 0 ? ' Tage vorher' : ' Tage danach') : '≈ ' + w + (d < 0 ? ' Wochen vorher' : ' Wochen danach');
  return { label, cls: '', sort: d, diff: null };
}
export const bySort = (a, b) => dueInfo(a).sort - dueInfo(b).sort;

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

/* ---------- realtime: any change -> debounced reload ---------- */
let reloadTimer = null;
export function subscribeRealtime() {
  const scheduleReload = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => loadAll().catch((e) => status('error', 'Aktualisieren fehlgeschlagen: ' + e.message)), 250);
  };
  const ch = supabase.channel('umzug-db');
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
    await updateTask(t.id, { done: true });
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

/* ---------- seed merge (browser side executor) ---------- */
export async function runSeedMerge(seed) {
  const [tasks, subtasks] = await Promise.all([
    supabase.from('tasks').select('id,deleted_at,seed_snapshot,advice,phase,title,owner,offset_days,critical,type,blocked_by,sort'),
    supabase.from('subtasks').select('task_id,seed_key'),
  ]);
  if (tasks.error || subtasks.error) throw tasks.error || subtasks.error;
  const plan = planSeedMerge(seed, tasks.data, subtasks.data);
  status('saving', 'Seed wird eingespielt …');
  if (plan.taskInserts.length) {
    const { error } = await supabase.from('tasks').upsert(plan.taskInserts, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
  for (const u of plan.taskUpdates) {
    const { error } = await supabase.from('tasks').update(u.patch).eq('id', u.id);
    if (error) throw error;
  }
  if (plan.subtaskInserts.length) {
    const { error } = await supabase.from('subtasks').upsert(plan.subtaskInserts, { onConflict: 'task_id,seed_key', ignoreDuplicates: true });
    if (error) throw error;
  }
  const { error } = await supabase
    .from('settings')
    .upsert([{ key: 'phases', value: plan.settings.phases }, { key: 'seed_version', value: plan.settings.seed_version }], { onConflict: 'key' });
  if (error) throw error;
  status('saved', 'Seed eingespielt');
  await loadAll();
  return plan.summary;
}
