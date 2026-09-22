// The Finanzen view (docs/changes/007 commit 2 plus the addendum of 22.09.): its own screen
// under #finanzen - the block on top, then every task that carries cost rows, grouped by phase.
// The rows themselves are the component from the Akte (costRowsHTML), not a second copy.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, phases, einzug } from '../state.js';
import { costRowsHTML } from '../ui/detail.js';
import {
  summary, balance, balanceText, payments, cashflow, moveOutMissing, bufferRow, bufferPct,
  suggestedBuffer, tasksWithCosts, finMatch, FIN_FILTERS, eur, eurShort, num, costsOf, taskAmount,
} from '../costs.js';

const money = (v) => (v === null || v === undefined ? '–' : eur(v));

function headHTML() {
  return `<header class="fin-head">
    <button class="link back" data-act="screen" data-to="dashboard">← Aufgaben</button>
    <span class="spacer"></span>
    <span class="status" id="status" role="status"></span>
  </header>
  <h1 class="fin-title">Finanzen</h1>`;
}

/* ---------- the five numbers, straight out of the same rule as costs_summary ---------- */
function numbersHTML() {
  const s = summary();
  const cell = (key, label, value, extra = '') =>
    `<button class="fin-num ${extra}" data-act="fin-filter" data-to="${key}" aria-pressed="${ui.finFilter === key}">
      <span class="n">${money(value)}</span><span class="l">${label}</span>
    </button>`;
  const bal = balance();
  return `<section class="fin-numbers" aria-label="Summen">
    ${cell('planned', 'geplant inkl. Puffer', s.planned_total)}
    ${cell('paid', 'bisher bezahlt', s.paid)}
    ${cell('refunds', 'Rückflüsse erwartet', s.refunds_expected)}
    ${cell('open', 'netto', s.net)}
    <div class="fin-num balance"><span class="n">${Math.abs(bal) < 0.005 ? 'ausgeglichen' : eur(Math.abs(bal))}</span><span class="l">${esc(balanceText(bal))}</span></div>
  </section>`;
}

function paymentsHTML() {
  const { due7, late } = payments();
  return `<div class="fin-payments">
    <button data-act="fin-filter" data-to="due7" aria-pressed="${ui.finFilter === 'due7'}">Fällig in 7 Tagen: <b>${due7}</b></button>
    <button class="${late ? 'late' : ''}" data-act="fin-filter" data-to="late" aria-pressed="${ui.finFilter === 'late'}">Überfällig: <b>${late}</b></button>
  </div>`;
}

/* ---------- buffer: one cost row without a task (docs/changes/004) ---------- */
function bufferHTML() {
  const row = bufferRow();
  if (!row) {
    return `<div class="fin-buffer">
      <span>Puffer (${bufferPct()} %) ist noch nicht angelegt – Vorschlag ${eur(suggestedBuffer())}</span>
      <button class="btn small" data-act="buffer-add">Puffer anlegen</button>
    </div>`;
  }
  const open = ui.bufferEdit;
  return `<div class="fin-buffer" data-id="${row.id}">
    <button class="link" data-act="buffer-edit" aria-expanded="${open}">Puffer (${bufferPct()} %)</button>
    <b>${eur(row.amount)}</b>
    ${
      open
        ? `<div class="cost-form">
            <div class="row">
              <label class="lbl">Betrag<input type="text" inputmode="decimal" data-buffer="amount" value="${esc(String(num(row.amount)).replace('.', ','))}"></label>
              <label class="lbl">Satz in %<input type="text" inputmode="decimal" data-buffer="pct" value="${bufferPct()}"></label>
            </div>
            <div class="row">
              <button class="btn small primary" data-act="buffer-save" data-ref="${row.id}">Speichern</button>
              <button class="btn small" data-act="buffer-pct-apply" data-ref="${row.id}">Satz auf Summe anwenden (${eur(suggestedBuffer())})</button>
              <button class="btn small" data-act="buffer-cancel">Abbrechen</button>
            </div>
          </div>`
        : ''
    }
  </div>`;
}

/* ---------- month by month ---------- */
function cashflowHTML() {
  const rows = cashflow();
  const missing = moveOutMissing();
  return `<section class="fin-block">
    <h2>Cashflow nach Monat</h2>
    ${
      missing
        ? `<p class="fin-hint">Auszugstermine fehlen – <button class="link" data-act="fin-settings">in den Einstellungen setzen</button>. Ohne sie lässt sich die Doppelmiete nicht berechnen.</p>`
        : ''
    }
    <table class="fin-table">
      <thead><tr><th>Monat</th><th>fällig</th><th>davon bezahlt</th>${missing ? '' : '<th>Doppelmiete</th>'}</tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
              <th scope="row">${esc(r.label)}</th>
              <td>${r.due ? eurShort(r.due) : '–'}</td>
              <td>${r.paid ? eurShort(r.paid) : '–'}</td>
              ${missing ? '' : `<td class="calc">${r.rent ? eurShort(r.rent) : '–'}</td>`}
            </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    ${missing ? '' : `<p class="fin-note">Doppelmiete (berechnet) aus Einzugstermin, Auszugsterminen und den laufenden Kosten – nicht bearbeitbar.</p>`}
  </section>`;
}

/* ---------- the small settings area ---------- */
const SETTINGS = [
  ['einzugstermin', 'Einzug', 'date'],
  ['move_out_s', 'Auszug Sebastian', 'date'],
  ['move_out_a', 'Auszug Anna', 'date'],
  ['split_default_s', 'Anteil Sebastian in %', 'num'],
  ['buffer_pct', 'Puffer in %', 'num'],
];
function settingsHTML() {
  if (!ui.finSettings) return '';
  return `<section class="fin-block fin-settings" id="fin-settings">
    <h2>Einstellungen</h2>
    <div class="row">
      ${SETTINGS.map(
        ([key, label, kind]) => `<label class="lbl">${label}<input type="${kind === 'date' ? 'date' : 'text'}" ${kind === 'num' ? 'inputmode="decimal"' : ''} data-setting="${key}" value="${esc(state.settings[key] ?? '')}"></label>`,
      ).join('')}
    </div>
  </section>`;
}

/* ---------- the tasks that carry costs ---------- */
function tasksHTML() {
  const filter = (c) => finMatch(c, ui.finFilter);
  const list = tasksWithCosts(filter);
  if (!list.length) {
    return `<p class="empty">${ui.finFilter ? 'Keine Zeile in diesem Filter.' : 'Noch keine Kostenzeilen. Sie entstehen in der Akte einer Aufgabe.'}</p>`;
  }
  const byPhase = phases()
    .map((p) => ({ p, tasks: list.filter((t) => t.phase === p.id) }))
    .filter((g) => g.tasks.length);
  return byPhase
    .map(
      ({ p, tasks }) => `<section class="fin-phase">
      <h2>${p.id} · ${esc(p.short || p.name)}</h2>
      ${tasks
        .map((t) => {
          const counted = taskAmount(t.id);
          return `<section class="fin-task" data-id="${t.id}">
          <div class="fin-task-head">
            <button class="fin-task-title" data-act="fin-open" data-ref="${t.id}">${esc(t.title)}</button>
            <span class="own ${t.owner}">${OWN[t.owner]}</span>
            ${counted ? `<span class="cost-badge">${counted.estimated ? '≈ ' : ''}${eurShort(counted.sum)}</span>` : ''}
          </div>
          ${costRowsHTML(t, filter)}
        </section>`;
        })
        .join('')}
    </section>`,
    )
    .join('');
}

export function finanzenView() {
  const filterRow = ui.finFilter
    ? `<div class="filter-row">
        <button class="filter-chip" data-act="fin-filter-clear" aria-label="Filter entfernen">Filter: ${FIN_FILTERS[ui.finFilter].label}<span class="x" aria-hidden="true">×</span></button>
      </div>`
    : '';
  return (
    `<div class="fin">` +
    headHTML() +
    numbersHTML() +
    paymentsHTML() +
    bufferHTML() +
    filterRow +
    cashflowHTML() +
    settingsHTML() +
    `<div class="fin-tasks">${tasksHTML()}</div>` +
    `<footer class="foot"><button class="link" data-act="screen" data-to="dashboard">← Aufgaben</button><span class="spacer"></span><button class="link" data-act="fin-settings">Einstellungen</button></footer>` +
    `</div>`
  );
}
