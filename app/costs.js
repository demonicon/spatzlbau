// Cost rows (docs/changes/007). Pure logic on top of state.js - no writes, no DOM.
//
// The counting rule is the one from the view costs_summary (supabase/schema.sql) and it lives
// here exactly once, so the badge in the task row, the Akte and the block in commit 2 can never
// drift apart from the database:
//   counted = beauftragt / faellig / bezahlt, plus geschaetzt as long as no row of the same task
//   is already beauftragt or further. angebot never counts (it is history). The buffer row
//   (task_id null) always counts.
import { state } from './state.js';

export const COST_STEPS = ['geschaetzt', 'angebot', 'beauftragt', 'faellig', 'bezahlt'];
export const COST_LABEL = { geschaetzt: 'geschätzt', angebot: 'Angebot', beauftragt: 'beauftragt', faellig: 'fällig', bezahlt: 'bezahlt' };
// the button that moves a row one step forward; 'bezahlt' is the end of the line
export const COST_NEXT = { geschaetzt: 'Angebot eintragen', angebot: 'Beauftragen', beauftragt: 'Fällig', faellig: 'Bezahlt am …' };
export const KIND = { einmalig: 'einmalig', rueckfluss: 'Rückfluss' };
// docs/changes/016: an 'ausgleich' row is a transfer between the two - it settles the balance
// and counts in no other sum. It is not offered in the kind picker, only created by the button.
export const isBalanceRow = (c) => c.kind === 'ausgleich';
export const APARTMENT = { S: 'Wohnung Sebastian', A: 'Wohnung Anna', N: 'neue Wohnung' };
const FIRM = ['beauftragt', 'faellig', 'bezahlt'];

// numeric columns arrive from PostgREST as strings ("1800.00")
export const num = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));

const nf2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const nf0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const eur = (v) => nf2.format(num(v));
export const eurShort = (v) => nf0.format(num(v));

/** German or plain: "1.800,50" / "1800.5" / "1.800 €" / "1800". Null when it is not a number. */
export function parseAmount(v) {
  let s = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (!s) return null;
  const comma = s.lastIndexOf(',');
  const dot = s.lastIndexOf('.');
  if (comma > -1 && dot > -1) {
    // whichever comes last is the decimal separator, the other one groups thousands
    s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (comma > -1) {
    s = s.replace(',', '.');
  } else if (dot > -1 && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // 1.800 and 1.234.567 are thousands, 12.34 is not
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

// no sorting by hand in 007: the order is how they were entered
const order = (a, b) => a.sort - b.sort || (a.created_at || '').localeCompare(b.created_at || '');
export const costsOf = (taskId) => state.costs.filter((c) => c.task_id === taskId).sort(order);

/** A task with a firm row turns its remaining estimates into history. */
export const hasFirm = (taskId) => !!taskId && state.costs.some((c) => c.task_id === taskId && FIRM.includes(c.status));

export function isCounted(c) {
  if (c.kind === 'ausgleich') return false; // docs/changes/016: only the balance sees these
  if (FIRM.includes(c.status)) return true;
  if (c.status !== 'geschaetzt') return false; // angebot is history, never counted
  return !c.task_id || !hasFirm(c.task_id); // the buffer row always counts
}

/** An estimate that lost against a firm row of the same task - shown, but greyed out. */
export const isHistory = (c) => !isCounted(c) && c.status !== 'bezahlt';

/** The same numbers as the view costs_summary - including the double rent since 016. */
export function summary(rows = state.costs) {
  const counted = rows.filter(isCounted);
  const sum = (list) => list.reduce((n, c) => n + num(c.amount), 0);
  const once = counted.filter((c) => c.kind === 'einmalig');
  const back = counted.filter((c) => c.kind === 'rueckfluss');
  const dr = doubleRentTotal();
  return {
    planned_total: once.length ? sum(once) : null,
    paid: once.some((c) => c.status === 'bezahlt') ? sum(once.filter((c) => c.status === 'bezahlt')) : null,
    refunds_expected: back.length ? sum(back) : null,
    buffer: once.some((c) => !c.task_id) ? sum(once.filter((c) => !c.task_id)) : null,
    double_rent: dr,
    net: once.length || dr ? sum(once) + (dr || 0) - sum(back) : null,
  };
}

/** Every month of double rent added up - the single largest item of the move (016 F2). */
export function doubleRentTotal() {
  if (moveOutMissing()) return null;
  let n = 0;
  for (const m of cashflowMonths()) n += doubleRent(m) || 0;
  return Math.round(n * 100) / 100;
}

/** What the task row shows as a small amount badge: null when the task has no counted costs. */
export function taskAmount(taskId) {
  const rows = costsOf(taskId).filter((c) => c.kind === 'einmalig' && isCounted(c));
  if (!rows.length) return null;
  return { sum: rows.reduce((n, c) => n + num(c.amount), 0), estimated: rows.every((c) => c.status === 'geschaetzt') };
}

/** Overdue payment: warning colour is reserved for exactly this (docs/changes/007). */
export function isCostLate(c) {
  if (c.status === 'bezahlt' || !c.due_on) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(c.due_on + 'T00:00:00') < today;
}

export const stepOf = (c) => COST_STEPS.indexOf(c.status);
export const nextStep = (c) => COST_STEPS[stepOf(c) + 1] || null;
export const prevStep = (c) => COST_STEPS[stepOf(c) - 1] || null;

/* ---------- the numbers behind the Finanzen view (docs/changes/007 commit 2) ---------- */

const settingNum = (key, fallback) => {
  const v = state.settings[key];
  return v === null || v === undefined || v === '' ? fallback : Number(v);
};

/** Who owes whom. Positive = Anna owes Sebastian. Only rows that were actually paid count. */
export function balance() {
  const split = settingNum('split_default_s', 50);
  let n = 0;
  for (const c of state.costs) {
    if (!c.paid_on || !c.paid_by) continue;
    const amount = num(c.amount) * (c.kind === 'rueckfluss' ? -1 : 1); // a refund flows back to whoever received it
    const shareS = c.belongs_to === 'S' ? 1 : c.belongs_to === 'A' ? 0 : (c.split_s === null || c.split_s === undefined ? split : Number(c.split_s)) / 100;
    // the payer advanced the whole amount but owes only their own share
    n += c.paid_by === 'S' ? amount * (1 - shareS) : -amount * shareS;
  }
  return Math.round(n * 100) / 100;
}

/** How the balance came about, in the three numbers the card shows (016 F3). */
export function balanceParts() {
  const split = settingNum('split_default_s', 50);
  let paidS = 0;
  let paidA = 0;
  for (const c of state.costs) {
    if (!c.paid_on || !c.paid_by) continue;
    const amount = num(c.amount) * (c.kind === 'rueckfluss' ? -1 : 1);
    if (c.paid_by === 'S') paidS += amount;
    else paidA += amount;
  }
  return { paidS: Math.round(paidS * 100) / 100, paidA: Math.round(paidA * 100) / 100, split };
}

export function balanceText(n = balance()) {
  if (Math.abs(n) < 0.005) return 'ausgeglichen';
  return n > 0 ? `Anna schuldet dir ${eur(n)}` : `Du schuldest Anna ${eur(-n)}`;
}

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Payments that need attention: due within a week, and overdue. */
export function payments() {
  const today = dayStart();
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  let due7 = 0;
  let late = 0;
  for (const c of state.costs) {
    if (c.status === 'bezahlt' || !c.due_on || !isCounted(c)) continue;
    const d = new Date(c.due_on + 'T00:00:00');
    if (d < today) late++;
    else if (d <= in7) due7++;
  }
  return { due7, late };
}

export const monthKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
export const monthName = (key) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
};

/** Rent of the old flat per person, from the recurring rows the content package delivers. */
function oldRent(person) {
  const col = person === 'S' ? 'amount_s' : 'amount_a';
  return state.recurring
    .filter((r) => /kaltmiete|nebenkosten/i.test(r.label || ''))
    .reduce((n, r) => n + num(r[col]), 0);
}

/** Double rent for one month: the new flat already runs while an old one has not ended yet. */
export function doubleRent(key) {
  const einzug = typeof state.settings.einzugstermin === 'string' ? state.settings.einzugstermin : '';
  if (!einzug) return null;
  const out = { S: state.settings.move_out_s, A: state.settings.move_out_a };
  if (!out.S || !out.A) return null; // the hint row asks for the dates instead
  if (key < einzug.slice(0, 7)) return 0; // before moving in there is nothing doubled
  let sum = 0;
  for (const p of ['S', 'A']) if (key <= String(out[p]).slice(0, 7)) sum += oldRent(p);
  return Math.round(sum * 100) / 100;
}

export const moveOutMissing = () => !state.settings.move_out_s || !state.settings.move_out_a;

/** The months the cashflow spans: from this month to two after the move (or the last move-out). */
export function cashflowMonths() {
  const einzug = typeof state.settings.einzugstermin === 'string' ? state.settings.einzugstermin : '';
  const from = dayStart();
  const outs = [state.settings.move_out_s, state.settings.move_out_a].filter((d) => typeof d === 'string' && d);
  const last = einzug ? new Date(einzug + 'T00:00:00') : new Date(from);
  for (const o of outs) {
    const d = new Date(o + 'T00:00:00');
    if (d > last) last.setTime(d.getTime());
  }
  last.setMonth(last.getMonth() + 2);
  if (last < from) last.setTime(from.getTime());
  const months = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);
  while (cur <= end && months.length < 36) {
    months.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

/** Month by month: what falls due, what of it is paid, plus the calculated double rent. */
export function cashflow() {
  return cashflowMonths().map((key) => {
    const rows = state.costs.filter((c) => c.due_on && c.due_on.slice(0, 7) === key && isCounted(c) && c.kind === 'einmalig');
    const back = state.costs.filter((c) => c.due_on && c.due_on.slice(0, 7) === key && isCounted(c) && c.kind === 'rueckfluss');
    const due = rows.reduce((n, c) => n + num(c.amount), 0) - back.reduce((n, c) => n + num(c.amount), 0);
    const rent = doubleRent(key);
    return {
      key,
      label: monthName(key),
      due,
      paid: rows.filter((c) => c.status === 'bezahlt').reduce((n, c) => n + num(c.amount), 0),
      rent,
      total: Math.round((due + (rent || 0)) * 100) / 100,
    };
  });
}

/** The month that costs the most - the one sentence under the table (016 §5). */
export function peakMonth(rows = cashflow()) {
  let best = null;
  for (const r of rows) if (r.total > 0 && (!best || r.total > best.total)) best = r;
  return best;
}

/** The next payments that need a decision: overdue first, then by date (016 F5). */
export function nextPayments(limit = 3) {
  // this list asks a different question than isCounted: an offer counts in no sum (007) but it is
  // exactly the row that needs the next step. Out go only rows a firm row of the same task replaced.
  const live = (c) =>
    c.kind === 'einmalig' && c.status !== 'bezahlt' && (FIRM.includes(c.status) || !c.task_id || !hasFirm(c.task_id));
  const open = state.costs
    .filter(live)
    .sort((a, b) => (a.due_on || '9999').localeCompare(b.due_on || '9999') || a.sort - b.sort);
  const late = open.filter(isCostLate);
  const rest = open.filter((c) => !isCostLate(c));
  return { late, next: rest.slice(0, limit), openCount: open.length };
}

/** "1.785 € im Monat für die neue Wohnung · 50 € weniger als eure beiden Wohnungen heute" (F4). */
export function recurringSummary() {
  const t = recurringTotals();
  return { ...t, old: Math.round((t.s + t.a) * 100) / 100 };
}

/** The buffer row lives in costs without a task (docs/changes/004). */
export const bufferRow = () => state.costs.find((c) => !c.task_id) || null;
export const bufferPct = () => settingNum('buffer_pct', 20);

/** What the buffer should be: the percentage on everything counted that belongs to a task. */
export function suggestedBuffer() {
  const base = state.costs
    .filter((c) => c.task_id && c.kind === 'einmalig' && isCounted(c))
    .reduce((n, c) => n + num(c.amount), 0);
  return Math.round(base * bufferPct()) / 100;
}

/** Tasks that carry cost rows, grouped by phase - the list under the block. */
export function tasksWithCosts(match = () => true) {
  const ids = new Set(state.costs.filter((c) => c.task_id && match(c)).map((c) => c.task_id));
  return state.tasks.filter((t) => ids.has(t.id)).sort((a, b) => a.phase - b.phase || a.offset_days - b.offset_days || a.sort - b.sort);
}

/** The filters the five numbers and the payment line switch on. */
export const FIN_FILTERS = {
  paid: { label: 'bezahlt', test: (c) => c.status === 'bezahlt' },
  refunds: { label: 'Rückflüsse', test: (c) => c.kind === 'rueckfluss' },
  open: { label: 'offen', test: (c) => c.status !== 'bezahlt' && isCounted(c) },
  planned: { label: 'gezählt', test: (c) => isCounted(c) },
  due7: { label: 'fällig in 7 Tagen', test: (c) => c.status !== 'bezahlt' && !!c.due_on && isCounted(c) && !isCostLate(c) && new Date(c.due_on + 'T00:00:00') <= new Date(Date.now() + 7 * 86400000) },
  late: { label: 'überfällig', test: (c) => isCostLate(c) && isCounted(c) },
};
export const finMatch = (c, key) => !key || !FIN_FILTERS[key] || FIN_FILTERS[key].test(c);

/* ---------- monthly costs, old against new (docs/changes/007 commit 3) ---------- */
export const recurringRows = () => [...state.recurring].sort((a, b) => a.sort - b.sort || (a.created_at || '').localeCompare(b.created_at || ''));

/** Per row and in total: what the two old flats cost, what the new one costs, and the delta. */
export function recurringTotals(rows = recurringRows()) {
  const s = rows.reduce((n, r) => n + num(r.amount_s), 0);
  const a = rows.reduce((n, r) => n + num(r.amount_a), 0);
  const nNew = rows.reduce((n, r) => n + num(r.amount_n), 0);
  return { s, a, n: nNew, delta: Math.round((nNew - s - a) * 100) / 100 };
}
export const rowDelta = (r) => Math.round((num(r.amount_n) - num(r.amount_s) - num(r.amount_a)) * 100) / 100;
