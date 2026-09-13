// Dashboard filters (docs/changes/002): predicates over tasks, KPI definitions, "Diese Woche".
// Pure functions on top of state.js – no writes, no DOM.
import { state, blockers, dueInfo, einzug } from './state.js';

export const isOpen = (t) => !t.done;
export const isBlocked = (t) => !t.done && blockers(t).length > 0;
export const isLate = (t) => !t.done && !!einzug() && dueInfo(t).diff < 0;
export const isCritical = (t) => !t.done && !!t.critical && !isLate(t); // late wins over critical (one signal per task)
export const isDelegated = (t) => !t.done && t.type === 'claude';
export const atClaude = (t) => isDelegated(t) && ['go', 'recherche', 'arbeit'].includes(t.status);
export const isWaiting = (t) => !t.done && (!!t.wait_on || (t.type === 'claude' && ['rueckfragen', 'ergebnis'].includes(t.status)));

// "Diese Woche": what the logged-in person can act on now – own or shared tasks that are open and
// not blocked and not currently with Claude, plus anything explicitly waiting for this person.
export const isMineNow = (t, me) =>
  !t.done && ((['B', me].includes(t.owner) && !isBlocked(t) && !atClaude(t)) || t.wait_on === me);

export const FILTERS = {
  week: { label: 'Diese Woche', test: (t) => isMineNow(t, state.person) },
  open: { label: 'Offen', test: isOpen },
  S: { label: 'Offen · Sebastian', test: (t) => isOpen(t) && t.owner === 'S' },
  A: { label: 'Offen · Anna', test: (t) => isOpen(t) && t.owner === 'A' },
  B: { label: 'Offen · gemeinsam', test: (t) => isOpen(t) && t.owner === 'B' },
  claude: { label: 'Bei Claude', test: isDelegated },
  wait: { label: 'Wartet auf jemanden', test: isWaiting },
  blocked: { label: 'Blockiert', test: isBlocked },
  critical: { label: 'Fristkritisch', test: isCritical },
  late: { label: 'Überfällig', test: isLate },
};

export const matches = (t, key) => !key || !FILTERS[key] || FILTERS[key].test(t);
export const count = (key) => state.tasks.filter((t) => matches(t, key)).length;
