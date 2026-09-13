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

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

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

  seed.tasks.forEach((st, index) => {
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
    settings: { phases: seed.phases, seed_version: seed.version },
    summary: {
      newTasks: taskInserts.length,
      updatedTasks: taskUpdates.filter((u) => Object.keys(u.patch).length > 1).length,
      changedFields,
      newSubtasks: subtaskInserts.length,
    },
  };
}
