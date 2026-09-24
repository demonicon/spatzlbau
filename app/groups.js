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
import { state, dueInfo, anchorDate, phases, fmtDay } from './state.js';

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
// docs/changes/014e #3: dieselbe Aufgabenmenge wie die Timeline (nur offene, docs/changes/019) -
// eine erledigte Aufgabe zaehlt hier nicht mehr mit, sonst zeigen Spaltenlabel und Timeline zwei
// verschiedene Gate-Daten
export function gate() {
  const id = currentPhase();
  if (id === null) return null;
  const inPhase = state.tasks.filter((t) => t.phase === id && !t.done && anchorDate(t));
  if (!inPhase.length) return null;
  const last = Math.max(...inPhase.map((t) => dueInfo(t).sort));
  const p = phases().find((x) => x.id === id);
  return { phase: id, name: p ? p.short || p.name : String(id), at: new Date(last) };
}

// docs/changes/029b #4: the group note is running text - the shared weekday+date helper.
// docs/changes/014e #3: fmtDay() wants a local-calendar ISO string, not toISOString() (which
// is UTC and can land a day early for anyone east of UTC) - build the string from the Date
// object's own local getters instead, the same fix already used in dashboard.js's visitHTML.
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (d) => fmtDay(localISO(d));
const fmtMonth = (d) => { const s = d.toLocaleDateString('de-DE', { month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1); };

/**
 * docs/changes/014e #2: one grouping function for every column, Personen and Phasen alike -
 * "Diese Woche" -> "Bis Gate n" (only when that gate is within the next 14 days - and, for a
 * Phasen column, only when n is that column's own phase; a Personen column has no "own phase",
 * so the global gate applies whenever it is close enough) -> month names for the rest. No
 * "Später" catch-all anymore: a month name is always a real answer to "when".
 * Each group: { key, label, note, tasks, fold } - fold = "shown behind one line by default"
 * (kept for callers, but every group here is fold: false - nothing is folded by default now).
 */
export function timeGroups(tasks, phaseId) {
  const list = [...tasks];
  if (!list.some(anchorDate)) return list.length ? [{ key: 'all', label: '', note: '', tasks: list, fold: false }] : [];
  const week = endOfWeek().getTime();
  const g = gate();
  const gd = gateInDays();
  const gateApplies = g && gd !== null && gd <= 14 && (phaseId === undefined || g.phase === phaseId);
  const gateAt = gateApplies && g.at.getTime() > week ? g.at.getTime() : null;
  const groups = [{ key: 'week', label: 'Diese Woche', note: 'bis ' + fmt(endOfWeek()), tasks: [], fold: false }];
  if (gateAt !== null) {
    groups.push({ key: 'gate', label: `Bis Gate ${g.phase}`, note: 'bis ' + fmt(new Date(gateAt)), tasks: [], fold: false });
  }
  const rest = [];
  for (const t of list) {
    const at = dueInfo(t).sort;
    if (at <= week) groups[0].tasks.push(t);
    else if (gateAt && at <= gateAt) groups[1].tasks.push(t);
    else rest.push(t);
  }
  rest.sort((a, b) => dueInfo(a).sort - dueInfo(b).sort);
  const byMonth = new Map();
  for (const t of rest) {
    const d = new Date(dueInfo(t).sort);
    const key = d.getFullYear() + '-' + d.getMonth();
    if (!byMonth.has(key)) byMonth.set(key, { key: 'm-' + key, label: fmtMonth(d), note: '', tasks: [], fold: false });
    byMonth.get(key).tasks.push(t);
  }
  groups.push(...byMonth.values());
  return groups.filter((x) => x.tasks.length);
}

/** How many days the gate is away - the head line uses it ("Gate P2 in 9 Tagen"). */
export function gateInDays() {
  const g = gate();
  if (!g) return null;
  return Math.round((g.at - dayStart()) / DAY);
}
