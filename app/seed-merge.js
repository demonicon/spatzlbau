// Seed merge planner. Pure module, shared by the browser (admin button / first start)
// and scripts/seed.mjs (Node, service role). It never touches the network: it takes the
// seed and the current DB rows and returns a list of field-precise operations.
//
// Rules (see BRIEFING.md §3):
// - unknown seed task  -> insert (with seed_snapshot)
// - known seed task    -> overwrite only fields the user has NOT changed, i.e. fields whose
//                         current value still equals the seed_snapshot; then refresh the snapshot
// - advice             -> per key, same rule; empty seed keys never clear user text
// - subtasks           -> only add missing ones (matched by seed_key = seed title), never remove
// - deleted tasks      -> left alone (no resurrection)
// - ticks, comments, briefings, status, wait_on, own tasks -> never touched

export const SEED_FIELDS = ['phase', 'title', 'owner', 'offset_days', 'critical', 'type', 'blocked_by', 'sort'];
export const ADVICE_KEYS = ['why', 'how', 'need', 'law', 'traps'];

// Postgres returns jsonb with its own key order, so compare canonically (sorted keys), not by
// raw JSON text – otherwise every run would rewrite every snapshot without any field changing.
const canon = (v) =>
  v === null || v === undefined
    ? null
    : Array.isArray(v)
      ? v.map(canon)
      : typeof v === 'object'
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]))
        : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

function snapshotOf(seedTask, sort) {
  const snap = {};
  for (const f of SEED_FIELDS) snap[f] = f === 'sort' ? sort : (seedTask[f] ?? null);
  snap.advice = {};
  for (const k of ADVICE_KEYS) if (seedTask.advice?.[k]) snap.advice[k] = seedTask.advice[k];
  return snap;
}

/**
 * @param {object} seed        parsed seed.json ({version, phases, tasks})
 * @param {object[]} tasks     all rows of `tasks` (including soft-deleted), needs id, seed_snapshot, advice + SEED_FIELDS
 * @param {object[]} subtasks  all rows of `subtasks`, needs task_id, seed_key
 * @returns {{taskInserts: object[], taskUpdates: {id: string, patch: object}[], subtaskInserts: object[], settings: object, summary: object}}
 */
export function planSeedMerge(seed, tasks, subtasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const taskInserts = [];
  const taskUpdates = [];
  const subtaskInserts = [];
  let changedFields = 0;

  (seed.tasks ?? []).forEach((st, index) => {
    const sort = index;
    const snap = snapshotOf(st, sort);
    const existing = byId.get(st.id);

    if (!existing) {
      taskInserts.push({
        id: st.id,
        phase: st.phase,
        title: st.title,
        owner: st.owner ?? 'B',
        offset_days: st.offset_days ?? 0,
        critical: !!st.critical,
        type: st.type ?? 'self',
        status: (st.type ?? 'self') === 'claude' ? 'briefing' : null,
        blocked_by: st.blocked_by ?? [],
        advice: snap.advice,
        sort,
        seed_snapshot: snap,
      });
    } else if (!existing.deleted_at) {
      const prev = existing.seed_snapshot ?? {};
      const patch = {};
      for (const f of SEED_FIELDS) {
        const userUntouched = same(existing[f], prev[f]);
        if (userUntouched && !same(existing[f], snap[f])) patch[f] = snap[f];
      }
      const advice = { ...(existing.advice ?? {}) };
      let adviceChanged = false;
      for (const k of ADVICE_KEYS) {
        const seedVal = snap.advice[k];
        if (!seedVal) continue; // seed says nothing -> keep whatever is there
        const userUntouched = same(existing.advice?.[k] ?? '', prev.advice?.[k] ?? '');
        if (userUntouched && (existing.advice?.[k] ?? '') !== seedVal) {
          advice[k] = seedVal;
          adviceChanged = true;
        }
      }
      if (adviceChanged) patch.advice = advice;
      if (Object.keys(patch).length || !same(prev, snap)) {
        changedFields += Object.keys(patch).length;
        patch.seed_snapshot = snap;
        taskUpdates.push({ id: st.id, patch });
      }
    }

    if (existing?.deleted_at) return;
    const have = new Set(subtasks.filter((s) => s.task_id === st.id && s.seed_key).map((s) => s.seed_key));
    (st.subtasks ?? []).forEach((title, i) => {
      if (!have.has(title)) subtaskInserts.push({ task_id: st.id, title, sort: i, seed_key: title });
    });
  });

  return {
    taskInserts,
    taskUpdates,
    subtaskInserts,
    settings: { phases: seed.phases, seed_version: seed.version }, // undefined = leave as is (partial package)
    summary: {
      newTasks: taskInserts.length,
      updatedTasks: taskUpdates.filter((u) => Object.keys(u.patch).length > 1).length,
      changedFields,
      newSubtasks: subtaskInserts.length,
    },
  };
}

/* ---------- content packages: costs and recurring (docs/changes/004) ----------
   Rows are matched by seed_key. Existing rows are updated field by field like tasks (only fields
   still equal to the snapshot), but a cost row is locked as soon as it is beyond 'geschaetzt',
   has paid_on, or its amount was changed by hand – then the package never touches it. */
export const COST_FIELDS = ['task_id', 'label', 'kind', 'apartment', 'amount', 'due_on', 'belongs_to', 'split_s', 'tax_relevant', 'note', 'sort'];
export const RECURRING_FIELDS = ['label', 'amount_s', 'amount_a', 'amount_n', 'note', 'sort'];
// columns the database declares NOT NULL: a package may omit them, the snapshot must still match the row
const COST_DEFAULTS = { kind: 'einmalig', amount: 0, belongs_to: 'B', tax_relevant: false };

function planRows(seedRows, dbRows, fields, isLocked, defaults = {}) {
  const byKey = new Map(dbRows.filter((r) => r.seed_key).map((r) => [r.seed_key, r]));
  const inserts = [];
  const updates = [];
  let locked = 0;
  (seedRows ?? []).forEach((sr, index) => {
    if (!sr.seed_key) throw new Error('package row without seed_key: ' + JSON.stringify(sr).slice(0, 80));
    const snap = {};
    for (const f of fields) snap[f] = f === 'sort' ? (sr.sort ?? index) : (sr[f] ?? defaults[f] ?? null);
    const existing = byKey.get(sr.seed_key);
    if (!existing) {
      inserts.push({ ...snap, seed_key: sr.seed_key, seed_snapshot: snap, ...(sr.status ? { status: sr.status } : {}) });
      return;
    }
    if (isLocked(existing)) {
      locked++;
      return;
    }
    const prev = existing.seed_snapshot ?? {};
    const patch = {};
    for (const f of fields) {
      const userUntouched = same(existing[f], prev[f]);
      if (userUntouched && !same(existing[f], snap[f])) patch[f] = snap[f];
    }
    if (Object.keys(patch).length || !same(prev, snap)) {
      patch.seed_snapshot = snap;
      updates.push({ id: existing.id, patch });
    }
  });
  return { inserts, updates, locked };
}

const num = (v) => (v === null || v === undefined ? null : Number(v));
const costLocked = (row) => row.status !== 'geschaetzt' || !!row.paid_on || !same(num(row.amount), num(row.seed_snapshot?.amount));

/**
 * @param {object} seed        package ({costs: [], recurring: []}; both optional)
 * @param {object[]} costs     all rows of `costs`
 * @param {object[]} recurring all rows of `recurring`
 */
export function planPackageMerge(seed, costs, recurring) {
  // amounts come back from Postgres as strings; compare numerically
  const normalise = (rows, keys) => rows.map((r) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, num(r[k])])), seed_snapshot: r.seed_snapshot && { ...r.seed_snapshot, ...Object.fromEntries(keys.filter((k) => k in r.seed_snapshot).map((k) => [k, num(r.seed_snapshot[k])])) } }));
  const c = planRows(seed.costs, normalise(costs, ['amount', 'split_s']), COST_FIELDS, costLocked, COST_DEFAULTS);
  const r = planRows(seed.recurring, normalise(recurring, ['amount_s', 'amount_a', 'amount_n']), RECURRING_FIELDS, () => false);
  return {
    costInserts: c.inserts,
    costUpdates: c.updates,
    recurringInserts: r.inserts,
    recurringUpdates: r.updates,
    summary: { newCosts: c.inserts.length, updatedCosts: c.updates.length, lockedCosts: c.locked, newRecurring: r.inserts.length, updatedRecurring: r.updates.length },
  };
}
