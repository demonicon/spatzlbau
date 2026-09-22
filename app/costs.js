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
  if (FIRM.includes(c.status)) return true;
  if (c.status !== 'geschaetzt') return false; // angebot is history, never counted
  return !c.task_id || !hasFirm(c.task_id); // the buffer row always counts
}

/** An estimate that lost against a firm row of the same task - shown, but greyed out. */
export const isHistory = (c) => !isCounted(c) && c.status !== 'bezahlt';

/** The same five numbers as the view costs_summary. */
export function summary(rows = state.costs) {
  const counted = rows.filter(isCounted);
  const sum = (list) => list.reduce((n, c) => n + num(c.amount), 0);
  const once = counted.filter((c) => c.kind === 'einmalig');
  const back = counted.filter((c) => c.kind === 'rueckfluss');
  return {
    planned_total: once.length ? sum(once) : null,
    paid: once.some((c) => c.status === 'bezahlt') ? sum(once.filter((c) => c.status === 'bezahlt')) : null,
    refunds_expected: back.length ? sum(back) : null,
    buffer: once.some((c) => !c.task_id) ? sum(once.filter((c) => !c.task_id)) : null,
    net: once.length ? sum(once) - sum(back) : null,
  };
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
