// Time groups (docs/changes/018 §2). One function, two users: the dashboard columns and the
// timeline (019) group by the same three buckets, so a task never sits in "Diese Woche" here
// and in "Später" there.
//
//   Diese Woche   - due up to and including the coming Sunday (overdue counts as this week:
//                   it is the most urgent thing there is, and the row already says "überfällig")
//   Bis Gate n    - due up to the gate date of the phase that is currently being worked on
//   Später        - everything after that, folded away behind one line
//
// Without a date of its own (no move-in date set) there is nothing to order by: everything
// lands in one unnamed group, exactly the list the app showed before.
import { state, dueInfo, anchorDate, phases } from './state.js';

const DAY = 86400000;

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** The coming Sunday, end of day. Today counts as this week, Sunday included. */
export function endOfWeek() {
  const d = dayStart();
  const toSunday = (7 - d.getDay()) % 7; // 0 = Sunday today
  d.setDate(d.getDate() + toSunday);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** The phase currently being worked on: the first one that still has an open task. */
export function currentPhase() {
  const open = state.tasks.filter((t) => !t.done).sort((a, b) => a.phase - b.phase);
  return open.length ? open[0].phase : null;
}

/** The gate of that phase: the latest deadline in it. Null without dates or without a phase. */
export function gate() {
  const id = currentPhase();
  if (id === null) return null;
  const inPhase = state.tasks.filter((t) => t.phase === id && anchorDate(t));
  if (!inPhase.length) return null;
  const last = Math.max(...inPhase.map((t) => dueInfo(t).sort));
  const p = phases().find((x) => x.id === id);
  return { phase: id, name: p ? p.short || p.name : String(id), at: new Date(last) };
}

const fmt = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

/**
 * Sort tasks into the three groups. Returns only the groups that hold something.
 * Each group: { key, label, note, tasks, fold } - fold = "shown behind one line by default".
 */
export function timeGroups(tasks) {
  const list = [...tasks];
  if (!list.some(anchorDate)) return list.length ? [{ key: 'all', label: '', note: '', tasks: list, fold: false }] : [];
  const week = endOfWeek().getTime();
  const g = gate();
  // a gate before the end of the week adds nothing: the week already covers it
  const gateAt = g && g.at.getTime() > week ? g.at.getTime() : null;
  const groups = [
    { key: 'week', label: 'Diese Woche', note: 'bis ' + fmt(endOfWeek()), tasks: [], fold: false },
    { key: 'gate', label: g ? `Bis Gate ${g.phase}` : 'Als Nächstes', note: gateAt ? 'bis ' + fmt(new Date(gateAt)) : '', tasks: [], fold: false },
    { key: 'later', label: 'Später', note: '', tasks: [], fold: true },
  ];
  for (const t of list) {
    const at = dueInfo(t).sort;
    if (at <= week) groups[0].tasks.push(t);
    else if (gateAt && at <= gateAt) groups[1].tasks.push(t);
    else groups[2].tasks.push(t);
  }
  const later = groups[2].tasks;
  if (later.length) {
    const first = Math.min(...later.map((t) => dueInfo(t).sort));
    groups[2].note = 'ab ' + fmt(new Date(first));
  }
  return groups.filter((x) => x.tasks.length);
}

/** How many days the gate is away - the head line uses it ("Gate P2 in 9 Tagen"). */
export function gateInDays() {
  const g = gate();
  if (!g) return null;
  return Math.round((g.at - dayStart()) / DAY);
}
