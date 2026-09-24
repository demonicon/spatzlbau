// Dashboard filters and the person grouping (docs/changes/002, reduced in 009).
// Pure functions on top of state.js – no writes, no DOM.
import { state, blockers, dueInfo, einzug, freshComments, doneByOther, claudeStep } from './state.js';

export const isOpen = (t) => !t.done;
export const isBlocked = (t) => !t.done && blockers(t).length > 0;
export const isLate = (t) => !t.done && !!einzug() && dueInfo(t).diff < 0;
// docs/changes/030 #2: fristkritisch ist jetzt die Frist selbst (<= 7 Tage), nicht mehr das
// manuell gesetzte `critical`-Flag - dieselbe Grenze wie dueInfo()'s "soon"-Klasse (state.js),
// eine einzige Stelle fuer die Zahl. Late gewinnt (ein Signal je Aufgabe).
export const isCritical = (t) => !t.done && !isLate(t) && dueInfo(t).cls === 'soon';
export const isDelegated = (t) => !t.done && t.type === 'claude';
export const atClaude = (t) => isDelegated(t) && claudeStep(t) === 'claude';
export const isWaiting = (t) => !t.done && (!!t.wait_on || (t.type === 'claude' && claudeStep(t) === 'ergebnis'));

/* ---------- person grouping (docs/changes/009) ---------- */
export const other = (me) => (me === 'S' ? 'A' : 'S');
// waits for me: someone set wait_on to me, or Claude has delivered and we have to decide
export const waitsOnMe = (t, me) => !t.done && (t.wait_on === me || (t.type === 'claude' && claudeStep(t) === 'ergebnis'));
// docs/changes/018 §3: the other direction - I am waiting for the other person or for Claude
export const waitsOnYou = (t, me) => !t.done && !!t.wait_on && t.wait_on !== me;
// a comment the other person (or Claude) wrote since the last visit and this person has not opened
export const hasNews = (t) => freshComments(t).some((c) => c.author !== state.person);

// docs/changes/009: the ten tiles became four – the three owner counts are the column heads now,
// "Offen" is the count in every column head, and "Diese Woche" is what the "Ich" column shows.
// The keys below "wait" are not tiles: they belong to "Seit deinem letzten Besuch".
export const FILTERS = {
  claude: { label: 'Bei Claude', test: isDelegated },
  blocked: { label: 'Blockiert', test: isBlocked },
  critical: { label: 'Fristkritisch', test: isCritical },
  late: { label: 'Überfällig', test: isLate },
  wait: { label: 'Wartet auf jemanden', test: isWaiting },
  waitme: { label: 'Wartet auf dich', test: (t) => waitsOnMe(t, state.person) },
  // docs/changes/018 §3: the three signals of the dashboard, counted over both people
  news: { label: 'Neue Kommentare', test: hasNews },
  waityou: { label: 'Du wartest', test: (t) => waitsOnYou(t, state.person) },
  // done: the filter shows tasks that are already ticked off – the columns have to unfold them
  donenew: { label: 'Seit deinem Besuch erledigt', test: doneByOther, done: true },
  newS: { label: 'Neu von Sebastian', test: (t) => freshComments(t).some((c) => c.author === 'S') },
  newA: { label: 'Neu von Anna', test: (t) => freshComments(t).some((c) => c.author === 'A') },
  newC: { label: 'Neu von Claude', test: (t) => freshComments(t).some((c) => c.author === 'C') },
};

export const matches = (t, key) => !key || !FILTERS[key] || FILTERS[key].test(t);
export const count = (key) => state.tasks.filter((t) => matches(t, key)).length;
