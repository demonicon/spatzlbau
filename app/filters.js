// Dashboard filters and the person grouping (docs/changes/002, reduced in 009).
// Pure functions on top of state.js – no writes, no DOM.
import { state, blockers, dueInfo, einzug } from './state.js';

export const isOpen = (t) => !t.done;
export const isBlocked = (t) => !t.done && blockers(t).length > 0;
export const isLate = (t) => !t.done && !!einzug() && dueInfo(t).diff < 0;
export const isCritical = (t) => !t.done && !!t.critical && !isLate(t); // late wins over critical (one signal per task)
export const isDelegated = (t) => !t.done && t.type === 'claude';
export const atClaude = (t) => isDelegated(t) && ['go', 'recherche', 'arbeit'].includes(t.status);
export const isWaiting = (t) => !t.done && (!!t.wait_on || (t.type === 'claude' && ['rueckfragen', 'ergebnis'].includes(t.status)));

/* ---------- person grouping (docs/changes/009) ---------- */
export const other = (me) => (me === 'S' ? 'A' : 'S');
// waits for me: someone set wait_on to me, or Claude has delivered and we have to decide
export const waitsOnMe = (t, me) => !t.done && (t.wait_on === me || (t.type === 'claude' && t.status === 'ergebnis'));

// docs/changes/009: the ten tiles became four – the three owner counts are the column heads now,
// "Offen" is the count in every column head, and "Diese Woche" is what the "Ich" column shows.
export const FILTERS = {
  claude: { label: 'Bei Claude', test: isDelegated },
  blocked: { label: 'Blockiert', test: isBlocked },
  critical: { label: 'Fristkritisch', test: isCritical },
  late: { label: 'Überfällig', test: isLate },
  wait: { label: 'Wartet auf jemanden', test: isWaiting },
};

export const matches = (t, key) => !key || !FILTERS[key] || FILTERS[key].test(t);
export const count = (key) => state.tasks.filter((t) => matches(t, key)).length;
