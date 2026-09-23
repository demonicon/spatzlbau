// The Finanzen view (docs/changes/016, built on 007). It answers three questions and nothing
// else: what does the move cost us, what is next to pay, who owes whom. No charts, no new money
// colours - yellow stays the deadline, red stays overdue.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, byId, einzug, umzugstag } from '../state.js';
import { costHTML } from '../ui/detail.js';
import { appHeadHTML, updateBarHTML, footHTML } from '../ui/chrome.js';
import { SUPABASE_URL } from '../config.js';
import {
  summary, balance, balanceText, balanceParts, cashflow, peakMonth, moveOutMissing, bufferRow, bufferPct,
  suggestedBuffer, nextPayments, recurringRows, recurringSummary, rowDelta, isCounted, isCostLate,
  eur, eurShort, num, COST_LABEL, COST_NEXT, nextStep,
} from '../costs.js';

const money = (v) => (v === null || v === undefined ? '–' : eur(v));
const fmtDay = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '');
const head = (title, extra = '') => `<div class="fin-h"><h2>${title}${extra ? ` <span class="fin-h-note">${extra}</span>` : ''}</h2>`;

/* ---------- 1. one answer, with the derivation under it (F1, F2) ---------- */

/** The rows that add up to the answer. Each one filters the list of posts (Kennzahl = Filter). */
export function breakdown() {
  const s = summary();
  const rows = [
    { key: 'planned', label: 'Posten', sub: 'inkl. Puffer', value: s.planned_total },
    { key: 'double', label: 'Doppelmiete', sub: moveOutMissing() ? 'Auszugstermine fehlen' : 'berechnet', value: s.double_rent },
    { key: 'refunds', label: 'Rückflüsse', sub: 'Kautionen', value: s.refunds_expected === null ? null : -s.refunds_expected },
  ];
  const paidPct = s.planned_total ? Math.round(((s.paid || 0) / s.planned_total) * 100) : 0;
  rows.push({ key: 'paid', label: 'davon bezahlt', sub: paidPct + ' %', value: s.paid, quiet: true });
  return rows;
}

function answerHTML() {
  const s = summary();
  const rows = breakdown()
    .map(
      (r) => `<button class="fin-break-row ${r.quiet ? 'quiet' : ''}" data-act="fin-filter" data-to="${r.key}" aria-pressed="${ui.finFilter === r.key}">
        <span class="l">${r.label} <span class="s">${esc(r.sub)}</span></span>
        <span class="v">${r.value === null || r.value === undefined ? '–' : (r.value > 0 && r.key !== 'planned' && r.key !== 'paid' ? '+ ' : '') + eurShort(r.value)}</span>
        <span class="arr" aria-hidden="true">›</span>
      </button>`,
    )
    .join('');
  return `<section class="fin-answer">
    <div class="fin-eyebrow">Der Umzug kostet euch</div>
    <div class="fin-number"><span class="n">${s.net === null ? '–' : eurShort(s.net)}</span><span class="u">netto</span></div>
    <div class="fin-break">${rows}</div>
  </section>`;
}

/* ---------- 2. who owes whom, with one action behind it (F3) ---------- */

function balanceHTML() {
  const n = balance();
  const p = balanceParts();
  const other = state.person === 'S' ? 'A' : 'S';
  const owed = Math.abs(n);
  const form = ui.balPay
    ? `<div class="cost-form">
        <div class="row">
          <label class="lbl">Betrag<input type="text" inputmode="decimal" data-input="bal-amount" value="${owed ? String(num(owed)).replace('.', ',') : ''}" aria-label="Betrag in Euro"></label>
          <label class="lbl">von<select data-input="bal-by">${['S', 'A'].map((k) => `<option value="${k}" ${k === (n < 0 ? state.person : other) ? 'selected' : ''}>${OWN[k]}</option>`).join('')}</select></label>
        </div>
        <div class="row">
          <button class="btn-primary" data-act="bal-save">Überweisung erfassen</button>
          <button class="btn-text" data-act="bal-cancel">Abbrechen</button>
        </div>
      </div>`
    : `<div class="row">
        <button class="btn-primary" data-act="bal-pay">Überweisung erfassen</button>
        <button class="btn-text" data-act="bal-how" aria-expanded="${!!ui.balHow}">Wie gerechnet?</button>
      </div>`;
  const how = ui.balHow
    ? `<div class="fin-how">
        <div><span>${OWN.S} hat ausgelegt</span><b>${eur(p.paidS)}</b></div>
        <div><span>${OWN.A} hat ausgelegt</span><b>${eur(p.paidA)}</b></div>
        <div><span>Aufteilung</span><b>${p.split} / ${100 - p.split}</b></div>
        <p class="fin-note">Gezählt wird, was wirklich bezahlt wurde. Eine erfasste Überweisung verschiebt nur diesen Saldo – in keiner anderen Summe taucht sie auf.</p>
      </div>`
    : '';
  return `<section class="fin-balance">
    <div class="fin-eyebrow">Ausgleich</div>
    <div class="fin-bal">${esc(balanceText(n))}</div>
    <div class="fin-bal-sub">${OWN.A} hat ${eurShort(p.paidA)} ausgelegt, ${OWN.S} ${eurShort(p.paidS)} · Aufteilung ${p.split}/${100 - p.split}</div>
    ${how}
    ${form}
  </section>`;
}

/* ---------- 3. what is next to pay (F5) ---------- */

function payRowHTML(c) {
  // while this row is being paid or edited it turns into the full component from the Akte
  if (ui.costPay === c.id || ui.costEdit === c.id) return `<div class="fin-pay open">${costHTML(c)}</div>`;
  const t = c.task_id ? byId(c.task_id) : null;
  const next = nextStep(c);
  const d = c.due_on ? new Date(c.due_on + 'T00:00:00') : null;
  const late = isCostLate(c);
  return `<div class="fin-pay ${late ? 'late' : ''}" data-cost="${c.id}">
    <div class="fin-pay-date">${d ? `<b>${String(d.getDate()).padStart(2, '0')}.</b><span>${d.toLocaleDateString('de-DE', { month: 'short' })}</span>` : '<span>offen</span>'}</div>
    <div class="fin-pay-body">
      <button class="fin-task-title" data-act="fin-open" data-ref="${esc(c.task_id || '')}">${esc(c.label)}</button>
      <div class="quiet"><span class="sig-chip ${late ? 'late' : 'state'}">${late ? 'überfällig' : COST_LABEL[c.status]}</span> ${t ? esc(OWN[t.owner]) : 'Puffer'}</div>
      ${next ? `<button class="btn-secondary" data-act="${next === 'bezahlt' ? 'cost-pay' : 'cost-step'}" data-ref="${c.id}" data-to="${next}">${COST_NEXT[c.status]}</button>` : ''}
    </div>
    <div class="fin-pay-amount">${eurShort(c.amount)}</div>
  </div>`;
}

function nextPayHTML() {
  const { late, next } = nextPayments();
  const rows = [...late, ...next];
  return `${head('Als Nächstes zahlen', late.length ? `· ${late.length} überfällig` : '· nichts überfällig')}</div>
    ${rows.length ? rows.map(payRowHTML).join('') : '<p class="empty">Nichts offen.</p>'}`;
}

/* ---------- 4. month by month (§5) ---------- */

function monthsHTML() {
  const rows = cashflow();
  const peak = peakMonth(rows);
  const missing = moveOutMissing();
  return `${head('Monat für Monat')}</div>
    <div class="fin-table-wrap"><table class="fin-table">
      <thead><tr><th>Monat</th><th>Posten</th><th>davon bezahlt</th><th>Doppelmiete</th><th>gesamt</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr class="${peak && r.key === peak.key ? 'peak' : ''}">
              <th scope="row">${esc(r.label)}</th>
              <td>${r.due ? eurShort(r.due) : '–'}</td>
              <td>${r.paid ? eurShort(r.paid) : '–'}</td>
              <td class="calc">${r.rent ? eurShort(r.rent) : '–'}</td>
              <td>${r.total ? eurShort(r.total) : '–'}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table></div>
    <p class="fin-note">${
      missing
        ? `Auszugstermine fehlen – <button class="btn-text" data-act="fin-settings">in den Rahmendaten setzen</button>. Ohne sie fehlt die Doppelmiete in jeder Summe.`
        : peak
          ? `${esc(peak.label)} ist der teure Monat: ${eurShort(peak.total)}${peak.rent ? `, davon ${eurShort(peak.rent)} Doppelmiete` : ''}.`
          : 'Noch nichts fällig.'
    }</p>`;
}

/* ---------- 5. what runs every month (F4) ---------- */

const amountInput = (id, field, value) =>
  `<input type="text" inputmode="decimal" data-rec-field="${field}" data-ref="${id}" value="${value === null || value === undefined ? '' : esc(String(num(value)).replace('.', ','))}" placeholder="–" aria-label="Betrag">`;

function recurringHTML() {
  const rows = recurringRows();
  const t = recurringSummary();
  const from = einzug() ? new Date(einzug() + 'T00:00:00').toLocaleDateString('de-DE', { month: 'long' }) : '';
  const edit = !!ui.recEdit;
  if (!rows.length) {
    return `${head('Laufend' + (from ? ' ab ' + from : ''))}</div>
      <p class="fin-hint">Noch keine Posten. Sie kommen aus dem Inhaltspaket oder hier von Hand.</p>
      <button class="btn-text row" data-act="rec-edit">Posten eintragen</button>`;
  }
  const delta = (v) => `${v > 0 ? '+ ' : v < 0 ? '− ' : ''}${eurShort(Math.abs(v))}`;
  const table = edit
    ? `<div class="fin-table-wrap"><table class="fin-table rec">
        <thead><tr><th>Posten</th><th>alt ${OWN.S}</th><th>alt ${OWN.A}</th><th>neu</th><th>Δ</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr data-rec="${r.id}">
                <th scope="row">${esc(r.label)}</th>
                <td>${amountInput(r.id, 'amount_s', r.amount_s)}</td>
                <td>${amountInput(r.id, 'amount_a', r.amount_a)}</td>
                <td>${amountInput(r.id, 'amount_n', r.amount_n)}</td>
                <td class="delta">${delta(rowDelta(r))}</td>
              </tr>`,
            )
            .join('')}
          <tr class="sum"><th scope="row">Summe</th><td>${eurShort(t.s)}</td><td>${eurShort(t.a)}</td><td>${eurShort(t.n)}</td><td class="delta">${delta(t.delta)}</td></tr>
        </tbody>
      </table></div>
      ${ui.recAdd
        ? `<div class="row"><label class="lbl">Posten<input type="text" data-input="rec-label" placeholder="z. B. Strom"></label><button class="btn-secondary" data-act="rec-add-save">Hinzufügen</button><button class="btn-text" data-act="rec-add-cancel">Abbrechen</button></div>`
        : `<button class="btn-text row" data-act="rec-add">+ Posten</button>`}
      <div class="row"><button class="btn-secondary" data-act="rec-done">Fertig</button></div>`
    : `<div class="fin-table-wrap"><table class="fin-table rec read">
        <thead><tr><th>Posten</th><th>heute</th><th>neu</th><th>Δ</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr><th scope="row">${esc(r.label)}</th><td>${eurShort(num(r.amount_s) + num(r.amount_a))}</td><td class="new">${eurShort(r.amount_n)}</td><td class="delta">${delta(rowDelta(r))}</td></tr>`,
            )
            .join('')}
        </tbody>
      </table></div>`;
  return `${head('Laufend' + (from ? ' ab ' + from : ''))}
      ${edit ? '' : `<button class="btn-text" data-act="rec-edit">Bearbeiten</button>`}
    </div>
    ${
      edit
        ? ''
        : `<p class="fin-lead"><b>${eurShort(t.n)}</b> im Monat für die neue Wohnung<br><span class="muted">${
            t.delta === 0 ? 'genauso viel wie' : `${eurShort(Math.abs(t.delta))} ${t.delta > 0 ? 'mehr' : 'weniger'} als`
          } eure beiden Wohnungen heute (${eurShort(t.old)})</span></p>`
    }
    ${table}`;
}

/* ---------- 6. every post, by due date (§7) ---------- */

const POST_FILTERS = {
  alle: { label: 'alle', test: () => true },
  offen: { label: 'offen', test: (c) => c.status !== 'bezahlt' && c.kind !== 'rueckfluss' },
  bezahlt: { label: 'bezahlt', test: (c) => c.status === 'bezahlt' },
  rueckfluss: { label: 'Rückfluss', test: (c) => c.kind === 'rueckfluss' },
};

function postsHTML() {
  const all = state.costs.filter((c) => isCounted(c) || c.status === 'bezahlt' || c.status === 'angebot');
  const key = ui.postFilter && POST_FILTERS[ui.postFilter] ? ui.postFilter : 'alle';
  // a tap on a derivation row narrows this list, too (Kennzahl = Filter)
  const fromBreak = { planned: 'offen', paid: 'bezahlt', refunds: 'rueckfluss' }[ui.finFilter];
  const active = fromBreak || key;
  const rows = all
    .filter(POST_FILTERS[active].test)
    .sort((a, b) => (a.due_on || '9999').localeCompare(b.due_on || '9999') || a.sort - b.sort);
  const pills = Object.entries(POST_FILTERS)
    .map(([k, f]) => `<button class="pill" data-act="post-filter" data-to="${k}" aria-pressed="${active === k}">${f.label} <span class="n">${all.filter(f.test).length}</span></button>`)
    .join('');
  const open = ui.postOpen || ui.wide || active !== 'alle';
  return `${head('Alle Posten', '· nach Fälligkeit')}</div>
    <div class="fin-pills">${pills}</div>
    ${
      open
        ? rows.length
          ? `<div class="fin-posts">${rows.map(costHTML).join('')}</div>`
          : '<p class="empty">Keine Zeile in dieser Auswahl.</p>'
        : `<button class="btn-text row" data-act="post-open">${rows.length} ${rows.length === 1 ? 'Posten' : 'Posten'} zeigen →</button>`
    }`;
}

/* ---------- 7. the frame data, read first (§8) ---------- */

const SETTINGS = [
  ['einzugstermin', 'Einzug (Schlüssel)', 'date'],
  ['umzugstag', 'Umzugstag', 'date'],
  ['move_out_s', 'Auszug ' + OWN.S, 'date'],
  ['move_out_a', 'Auszug ' + OWN.A, 'date'],
  ['split_default_s', 'Anteil ' + OWN.S + ' in %', 'num'],
  ['buffer_pct', 'Puffer in %', 'num'],
];

/* ---------- 8b. the calendar subscription (docs/changes/022) ----------
   Two addresses, one per person. The token in them is the whole secret, so the line says what
   happens when it is replaced before it replaces it. */

export const icsToken = () => (typeof state.settings.ics_token === 'string' && state.settings.ics_token) || '';
export const icsUrl = (person) => `${SUPABASE_URL}/functions/v1/ics?token=${encodeURIComponent(icsToken())}&person=${person}`;

function icsHTML() {
  const token = icsToken();
  const asking = ui.confirm === 'ics-new';
  if (!token) {
    return `<p class="fin-rahmen-line">Kalender-Abo · <button class="btn-text" data-act="ics-new">Abo-Adressen erzeugen</button>
      <span class="fin-note">Fristkritische Aufgaben und die fünf Gates als Kalender für iPhone, Google oder Outlook.</span></p>`;
  }
  return `<div class="fin-rahmen-line ics">
    <span class="l">Kalender-Abo</span>
    <span class="ics-links">
      ${['S', 'A']
        .map((k) => `<button class="btn-text ics-copy" data-act="ics-copy" data-to="${k}">${OWN[k]} kopieren</button>`)
        .join('')}
      ${asking
        ? `<span class="confirm">Neue Adresse? Die alten Abos hören auf zu aktualisieren.
            <button class="btn-text danger" data-act="ics-new-yes">Ja, neu erzeugen</button>
            <button class="btn-secondary" data-act="confirm-no">Nein</button></span>`
        : `<button class="btn-secondary" data-act="ics-new">Link neu erzeugen</button>`}
    </span>
    ${ui.icsShow ? `<input class="ics-url" type="text" readonly value="${esc(icsUrl(ui.icsShow))}" aria-label="Abo-Adresse ${esc(OWN[ui.icsShow])}">` : ''}
    <span class="fin-note">Google aktualisiert abonnierte Kalender bis zu 24 Stunden später.</span>
  </div>`;
}

function rahmenHTML() {
  const d = (k) => (typeof state.settings[k] === 'string' && state.settings[k] ? fmtDay(state.settings[k]) : '–');
  const split = state.settings.split_default_s ?? 50;
  const line = `Einzug ${d('einzugstermin')}${umzugstag() ? ` · Umzug ${d('umzugstag')}` : ''} · Auszug ${OWN.S} ${d('move_out_s')}, ${OWN.A} ${d('move_out_a')} · ${split}/${100 - split} · Puffer ${bufferPct()} %`;
  const buffer = bufferRow();
  return `<section class="fin-rahmen" id="fin-settings">
    <p class="fin-rahmen-line">${esc(line)} · <button class="btn-text" data-act="fin-settings" aria-expanded="${!!ui.finSettings}">ändern</button></p>
    ${
      ui.finSettings
        ? `<div class="row">
            ${SETTINGS.map(
              ([key, label, kind]) => `<label class="lbl">${label}<input type="${kind === 'date' ? 'date' : 'text'}" ${kind === 'num' ? 'inputmode="decimal"' : ''} data-setting="${key}" value="${esc(state.settings[key] ?? '')}"></label>`,
            ).join('')}
          </div>
          <div class="row">
            ${
              buffer
                ? `<span class="muted">Puffer ${eur(buffer.amount)}</span><button class="btn-secondary" data-act="buffer-pct-apply" data-ref="${buffer.id}">Satz auf Summe anwenden (${eurShort(suggestedBuffer())})</button>`
                : `<button class="btn-secondary" data-act="buffer-add">Puffer anlegen (${eurShort(suggestedBuffer())})</button>`
            }
          </div>`
        : ''
    }
    ${icsHTML()}
  </section>`;
}

export function finanzenView() {
  const filterRow = ui.finFilter
    ? `<div class="filter-row">
        <button class="pill on filter-chip" data-act="fin-filter-clear" aria-label="Filter entfernen">Filter: ${esc(breakdown().find((r) => r.key === ui.finFilter)?.label || ui.finFilter)}<span class="x" aria-hidden="true">×</span></button>
      </div>`
    : '';
  return (
    updateBarHTML() +
    `<div class="fin">` +
    `<header class="fin-head">${appHeadHTML('finanzen')}</header>` +
    answerHTML() +
    balanceHTML() +
    filterRow +
    `<section class="fin-block">${nextPayHTML()}</section>` +
    `<section class="fin-block">${monthsHTML()}</section>` +
    `<section class="fin-block">${recurringHTML()}</section>` +
    `<section class="fin-block">${postsHTML()}</section>` +
    rahmenHTML() +
    footHTML() +
    `</div>`
  );
}
