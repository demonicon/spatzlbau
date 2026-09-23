// The Finanzen view (docs/changes/016, built on 007). It answers three questions and nothing
// else: what does the move cost us, what is next to pay, who owes whom. No charts, no new money
// colours - yellow stays the deadline, red stays overdue.
import { esc } from '../ui/dom.js';
import { OWN, PAID_BY } from '../ui/labels.js';
import { state, ui, byId, einzug, umzugstag } from '../state.js';
import { costHTML, costNewHTML, ladderHTML } from '../ui/detail.js';
import { updateBarHTML, footHTML, setupHintHTML, avatarHTML } from '../ui/chrome.js';
import { SUPABASE_URL } from '../config.js';
import {
  summary, balance, balanceParts, cashflow, peakMonth, moveOutMissing, bufferInfo, bufferPct, bufferFixed,
  nextPayments, recurringRows, recurringSummary, rowDelta, isCounted, isCostLate, isCostSoon,
  eur, eurShort, num, ladderState, refundState, rowState, LADDER_LABEL, REFUND_LABEL,
} from '../costs.js';

const money = (v) => (v === null || v === undefined ? '–' : eur(v));
const fmtDay = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '');
const head = (title, extra = '') => `<div class="fin-h"><h2>${title}${extra ? ` <span class="fin-h-note">${extra}</span>` : ''}</h2>`;

/* ---------- 0. Ersteinrichtung: vier Fragen (docs/changes/016b) ----------
   Finanzen without a starting point is just an empty screen. The wizard asks the four things
   that make the answer number real - the frame dates, what the two flats and the new one cost
   each month, the deposits, and how the two of them split. Every value stays editable
   afterwards through the same mechanisms this replaces (Rahmendaten "ändern", Laufend
   "Bearbeiten", the cost rows themselves) - there is no separate "reopen step n" launcher. */

const recurringSeed = (key) => state.recurring.find((r) => r.seed_key === key) || null;
const costSeed = (key) => state.costs.find((c) => c.seed_key === key) || null;
const setupDate = (v) => (typeof v === 'string' ? v : '');
const setupAmount = (v) => (v === null || v === undefined ? '' : esc(String(num(v)).replace('.', ',')));

// exported for docs/changes/026: steps 3-6 of the "gemeinsamer Start" reuse these four screens
// unchanged, instead of a second Termine/Mieten/Kautionen/Aufteilung implementation
export function setupTermineHTML() {
  const v = (k) => setupDate(state.settings[k]);
  return `
    <label class="lbl">Einzug (Schlüsselübergabe)<input type="date" data-input="setup-einzug" value="${esc(v('einzugstermin'))}"></label>
    <label class="lbl">Umzugstag<input type="date" data-input="setup-umzugstag" value="${esc(v('umzugstag'))}"></label>
    <div class="row">
      <label class="lbl">Auszug ${OWN.S}<input type="date" data-input="setup-auszug-s" value="${esc(v('move_out_s'))}"></label>
      <label class="lbl">Auszug ${OWN.A}<input type="date" data-input="setup-auszug-a" value="${esc(v('move_out_a'))}"></label>
    </div>`;
}

export function setupMietenHTML() {
  const miete = recurringSeed('miete');
  const nk = recurringSeed('nk');
  // vorbelegt aus Teil B, wo vorhanden - sonst die bekannten Werte aus dem Vertrag (016b)
  const row = (id, label, r, fallS, fallA) => `<tr>
      <th scope="row">${label}</th>
      <td><input type="text" inputmode="decimal" data-input="setup-${id}-s" value="${r ? setupAmount(r.amount_s) : setupAmount(fallS)}" placeholder="–"></td>
      <td><input type="text" inputmode="decimal" data-input="setup-${id}-a" value="${r ? setupAmount(r.amount_a) : setupAmount(fallA)}" placeholder="–"></td>
      <td><input type="text" inputmode="decimal" data-input="setup-${id}-n" value="${r ? setupAmount(r.amount_n) : ''}" placeholder="–"></td>
    </tr>`;
  return `<div class="fin-table-wrap"><table class="fin-table rec">
      <thead><tr><th>Posten</th><th>alt ${OWN.S}</th><th>alt ${OWN.A}</th><th>neu</th></tr></thead>
      <tbody>
        ${row('miete', 'Kaltmiete', miete, 1150, 700)}
        ${row('nk', 'Nebenkosten', nk, 200, 150)}
      </tbody>
    </table></div>`;
}

export function setupKautionenHTML() {
  const altS = costSeed('kaution-alt-s');
  const altA = costSeed('kaution-alt-a');
  const neu = costSeed('kaution-neu');
  return `
    <div class="row">
      <label class="lbl">Kaution alt ${OWN.S}<input type="text" inputmode="decimal" data-input="setup-kaution-s" value="${altS ? setupAmount(altS.amount) : setupAmount(2910)}"></label>
      <label class="lbl">Kaution alt ${OWN.A}<input type="text" inputmode="decimal" data-input="setup-kaution-a" value="${altA ? setupAmount(altA.amount) : setupAmount(2040)}"></label>
    </div>
    <div class="row">
      <label class="lbl">Kaution neu, Betrag<input type="text" inputmode="decimal" data-input="setup-kaution-neu-betrag" value="${neu ? setupAmount(neu.amount) : ''}" placeholder="z. B. 2400"></label>
      <label class="lbl">fällig am<input type="date" data-input="setup-kaution-neu-frist" value="${neu ? esc(neu.due_on || '') : ''}"></label>
    </div>`;
}

export function setupAufteilungHTML() {
  const split = state.settings.split_default_s ?? 50;
  const hh = ui.finSetupHousehold;
  return `
    <label class="lbl">Anteil ${OWN.S} in %<input type="text" inputmode="numeric" data-input="setup-split" value="${esc(String(split))}"></label>
    <label class="lbl">Puffer in %<input type="text" inputmode="numeric" data-input="setup-puffer" value="${esc(String(bufferPct()))}"></label>
    <div class="lbl">Haushaltskonto?
      <div class="seg" role="group" aria-label="Haushaltskonto">
        <button class="pill" data-act="fin-setup-household" data-to="ja" aria-pressed="${hh === true}">ja</button>
        <button class="pill" data-act="fin-setup-household" data-to="nein" aria-pressed="${hh === false}">nein</button>
      </div>
    </div>`;
}

const SETUP_STEPS = [
  ['Termine', setupTermineHTML],
  ['Mieten', setupMietenHTML],
  ['Kautionen', setupKautionenHTML],
  ['Aufteilung', setupAufteilungHTML],
];

function setupHTML() {
  const step = Math.min(Math.max(ui.finSetupStep || 0, 0), 3);
  const [title, body] = SETUP_STEPS[step];
  return `<div class="fin-setup" role="dialog" aria-modal="true" aria-labelledby="fs-h">
    <div class="fs-card">
      <p class="fs-eyebrow">Einrichtung ${step + 1}/4</p>
      <h2 id="fs-h">${title}</h2>
      ${body()}
      <div class="row fs-foot">
        ${step > 0 ? `<button class="btn-text" data-act="fin-setup-back">‹ Zurück</button>` : ''}
        <span class="spacer"></span>
        <button class="btn-text" data-act="fin-setup-skip">Später</button>
        <button class="btn-primary" data-act="fin-setup-next">${step < 3 ? 'Weiter' : 'Fertig'}</button>
      </div>
    </div>
  </div>`;
}

/* ---------- docs/changes/016c: one layout, three arrangements ----------
   Every block is a direct child of .fin-grid, in the phone order of the design export (answer,
   Ausgleich, next payments, month by month, Laufend, Alle Posten, Rahmendaten). The aside wraps
   the three blocks that form the right-hand rail on a desktop; below 900 px it is display:
   contents, so its children fall back into that single column. CSS (app.css, 016c) arranges the
   same markup as three columns from 1100 px and as A+B over C between 900 and 1099 px. */

const ME = () => state.person || 'S';
const OTHER = () => (ME() === 'S' ? 'A' : 'S');
/** "du" for the person looking, the name for the other one - as the design export writes it. */
const who = (p) => (p === ME() ? 'du' : p === 'B' ? 'gemeinsam' : p === 'H' ? PAID_BY.H : OWN[p] || '');
const Who = (p) => {
  const w = who(p);
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const MINUS = '−';
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
/** Signed money with a real minus sign and a space, as the tiles show it: "− 1.200 €". */
const signed = (v, plus = false) => (v < 0 ? MINUS + ' ' + eurShort(-v) : (plus && v > 0 ? '+ ' : '') + eurShort(v));
/** Whole euros unless there are cents - "510 €", but "15,95 €" stays exact. */
const money2 = (v) => (Number.isInteger(Math.round(num(v) * 100) / 100) ? eurShort(v) : eur(v));
/** Table figures without the € sign: "1.380", "−1.200", "–" for nothing. */
const fig = (v) => (!v ? '–' : (v < 0 ? MINUS : '') + nf0.format(Math.abs(v)));
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return MONTHS[Number(m) - 1] + ' ' + y;
};

function daysToEinzug() {
  if (!einzug()) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(einzug() + 'T00:00:00') - today) / 86400000);
  return d >= 0 ? d : null;
}

/* ---------- 1. one answer, with the derivation next to or under it (F1, F2) ---------- */

/** The rows that add up to the answer. Each one filters the list of posts (Kennzahl = Filter). */
export function breakdown() {
  const s = summary();
  // 016c: "Termine fehlen" only while one of the three dates is missing - with all three set,
  // no overlap is a real 0 € (Fund 23.09.)
  // 014c: der Puffer ist keine Zeile mehr - die Kachel "Posten inkl. Puffer" addiert ihn dazu
  const plannedWithBuffer = s.planned_total === null && s.buffer_mode !== 'fixed' ? null : (s.planned_total || 0) + (s.buffer || 0);
  const rows = [
    { key: 'planned', label: 'Posten', sub: 'inkl. Puffer', value: plannedWithBuffer },
    { key: 'double', label: 'Doppelmiete', sub: s.double_rent === null ? 'Termine fehlen' : 'berechnet', value: s.double_rent },
    { key: 'refunds', label: 'Rückflüsse', sub: 'Kautionen', value: s.refunds_expected === null ? null : -s.refunds_expected },
  ];
  // 016c: "davon" refers to the answer above it - the share of the net figure (export: 19 %)
  const paidPct = s.net ? Math.round(((s.paid || 0) / s.net) * 100) : 0;
  rows.push({ key: 'paid', label: 'davon bezahlt', sub: paidPct + ' %', value: s.paid, quiet: true });
  return rows;
}

function answerHTML() {
  const s = summary();
  const rows = breakdown()
    .map(
      (r) => `<button class="fin-break-row ${r.quiet ? 'paid-row' : ''}" data-act="fin-filter" data-to="${r.key}" aria-pressed="${ui.finFilter === r.key}">
        <span class="l">${r.label} <span class="s">${esc(r.sub)}</span></span>
        <span class="v">${r.value === null || r.value === undefined ? '–' : signed(r.value, r.key === 'double')}</span>
        <span class="arr" aria-hidden="true">›</span>
      </button>`,
    )
    .join('');
  return `<section class="fin-answer">
    <div class="fin-hero">
      <div class="fin-eyebrow">Der Umzug kostet euch</div>
      <div class="fin-number"><span class="n">${s.net === null ? '–' : eurShort(s.net)}</span><span class="u">netto</span></div>
    </div>
    <div class="fin-break">${rows}</div>
  </section>`;
}

/* ---------- 2. who owes whom, with one action behind it (F3) ---------- */

/** Positive = the other person owes me. balance() itself is always "Anna owes Sebastian". */
const myBalance = () => (ME() === 'S' ? balance() : -balance());

function balanceHeadline(n) {
  if (Math.abs(n) < 0.005) return 'Ihr seid ausgeglichen';
  return n > 0 ? `${OWN[OTHER()]} schuldet dir ${money2(n)}` : `Du schuldest ${OWN[OTHER()]} ${money2(-n)}`;
}

/** The rows the balance comes from - on a desktop the card lists them instead of a sentence. */
function balanceRows() {
  const split = state.settings.split_default_s ?? 50;
  return state.costs
    .filter((c) => c.paid_on && c.paid_by && c.paid_by !== 'H')
    .sort((a, b) => (a.paid_on || '').localeCompare(b.paid_on || ''))
    .map((c) => {
      const shareS = c.belongs_to === 'S' ? 1 : c.belongs_to === 'A' ? 0 : (c.split_s === null || c.split_s === undefined ? split : Number(c.split_s)) / 100;
      const other = c.paid_by === 'S' ? 'A' : 'S';
      const otherShare = Math.round(num(c.amount) * (other === 'S' ? shareS : 1 - shareS) * 100) / 100;
      const sign = c.kind === 'rueckfluss' ? -1 : 1;
      return `<tr><th scope="row">${esc(Who(c.paid_by))}: ${esc(c.label)}</th><td>${signed(sign * num(c.amount))}</td><td>${otherShare ? `${esc(who(other))} ${signed(sign * otherShare)}` : '–'}</td></tr>`;
    })
    .join('');
}

function balanceHTML() {
  const n = myBalance();
  const p = balanceParts();
  const mine = ME() === 'S' ? p.paidS : p.paidA;
  const theirs = ME() === 'S' ? p.paidA : p.paidS;
  const owed = Math.abs(balance());
  // 014 #4: one primary per view - while a post is being edited its "Fertig" is the primary
  const balBtn = ui.costEdit ? 'btn-secondary' : 'btn-primary';
  const form = ui.balPay
    ? `<div class="cost-form">
        <div class="row">
          <label class="lbl">Betrag<input type="text" inputmode="decimal" data-input="bal-amount" value="${owed ? String(num(owed)).replace('.', ',') : ''}" aria-label="Betrag in Euro"></label>
          <label class="lbl">von<select data-input="bal-by">${['S', 'A'].map((k) => `<option value="${k}" ${k === (n < 0 ? ME() : OTHER()) ? 'selected' : ''}>${OWN[k]}</option>`).join('')}</select></label>
        </div>
        <div class="row">
          <button class="${balBtn}" data-act="bal-save">Überweisung erfassen</button>
          <button class="btn-text" data-act="bal-cancel">Abbrechen</button>
        </div>
      </div>`
    : `<div class="row fin-bal-actions">
        <button class="${balBtn}" data-act="bal-pay">Überweisung erfassen</button>
        <button class="btn-text fin-bal-how" data-act="bal-how" aria-expanded="${!!ui.balHow}">Wie gerechnet?</button>
      </div>`;
  const how = ui.balHow
    ? `<div class="fin-how">
        <div><span>${OWN[OTHER()]} hat ausgelegt</span><b>${eur(theirs)}</b></div>
        <div><span>Du hast ausgelegt</span><b>${eur(mine)}</b></div>
        <div><span>Aufteilung</span><b>${p.split} / ${100 - p.split}</b></div>
        <p class="fin-note">Gezählt wird, was wirklich bezahlt wurde. Eine erfasste Überweisung verschiebt nur diesen Saldo – in keiner anderen Summe taucht sie auf.</p>
      </div>`
    : '';
  const rows = balanceRows();
  return `<section class="fin-balance">
    <div class="fin-eyebrow">Ausgleich</div>
    <div class="fin-bal">${esc(balanceHeadline(n))}</div>
    <div class="fin-bal-sub">${OWN[OTHER()]} hat ${eurShort(theirs)} ausgelegt, du ${eurShort(mine)} · Aufteilung ${p.split}/${100 - p.split}</div>
    ${rows ? `<table class="fin-bal-rows"><tbody>${rows}</tbody></table>` : ''}
    ${how}
    ${form}
  </section>`;
}

/* ---------- 3. what is next to pay (F5) ---------- */

/** The state as one chip: the three words of 016b, in the export's chip colours. */
function stateChip(c) {
  if (isCostLate(c)) return `<span class="st-chip late">überfällig</span>`;
  const st = rowState(c);
  const label = c.kind === 'rueckfluss' ? REFUND_LABEL[st] : LADDER_LABEL[st];
  return `<span class="st-chip ${st}">${esc(label)}</span>`;
}

function actionHTML(c) {
  if (c.kind === 'rueckfluss') return c.status === 'bezahlt' ? '' : `<button class="btn-secondary" data-act="cost-pay" data-ref="${c.id}">Erhalten</button>`;
  const st = ladderState(c);
  if (st === 'geschaetzt') return `<button class="btn-secondary" data-act="cost-set" data-ref="${c.id}">Betrag festlegen</button>`;
  if (st === 'fest') return `<button class="btn-secondary" data-act="cost-pay" data-ref="${c.id}">Bezahlt</button>`;
  return '';
}

// docs/changes/014 #7: a post can stand in "Als Nächstes zahlen" and in "Alle Posten" at once -
// the form opens only in the list it was tapped in (ui.costWhere), the other copy stays a row
const openRow = (c, where) =>
  (ui.costPay === c.id || ui.costEdit === c.id || ui.costSet === c.id) && (!ui.costWhere || ui.costWhere === where);
// 014c: task_id null war einmal immer der Puffer - jetzt ist es ein normaler Posten ohne Aufgabe
const ownerOf = (c) => {
  const t = c.task_id ? byId(c.task_id) : null;
  return t ? who(t.owner) : 'ohne Aufgabe';
};

function payRowHTML(c) {
  // while this row has a form open it turns into the full component from the Akte (016b)
  if (openRow(c, 'next')) return `<div class="fin-pay open" data-where="next">${costHTML(c)}</div>`;
  const d = c.due_on ? new Date(c.due_on + 'T00:00:00') : null;
  const late = isCostLate(c);
  return `<div class="fin-pay ${late ? 'late' : ''}" data-cost="${c.id}" data-where="next">
    <div class="fin-pay-date">${d ? `<b>${String(d.getDate()).padStart(2, '0')}.</b><span>${MONTHS[d.getMonth()]}</span>` : '<span>offen</span>'}</div>
    <div class="fin-pay-body">
      <button class="fin-task-title" data-act="fin-open" data-ref="${esc(c.task_id || '')}">${esc(c.label)}</button>
      <div class="fin-pay-meta">${stateChip(c)}<span class="who">${esc(ownerOf(c))}</span>${actionHTML(c)}</div>
    </div>
    <div class="fin-pay-amount">${ladderState(c) === 'geschaetzt' ? '≈ ' : ''}${eurShort(c.amount)}</div>
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
    <div class="fin-table-wrap"><table class="fin-table fin-months">
      <thead><tr><th>Monat</th><th>Posten</th><th class="paidcol">davon bezahlt</th><th>Doppelmiete</th><th>gesamt</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr class="${peak && r.key === peak.key ? 'peak' : ''}">
              <th scope="row">${esc(monthLabel(r.key))}</th>
              <td>${fig(r.due)}</td>
              <td class="paidcol calc">${fig(r.paid)}</td>
              <td class="calc">${fig(r.rent)}</td>
              <td>${fig(r.total)}</td>
            </tr>`,
          )
          .join('')}
      </tbody>
    </table></div>
    <p class="fin-note fin-months-note">${
      missing
        ? `Auszugstermine fehlen – <button class="btn-text" data-act="fin-settings">in den Rahmendaten setzen</button>. Ohne sie fehlt die Doppelmiete in jeder Summe.`
        : peak
          ? `${esc(monthLabel(peak.key))} ist der teure Monat: ${eurShort(peak.total)}${peak.rent ? `, davon ${eurShort(peak.rent)} Doppelmiete` : ''}.`
          : 'Noch nichts fällig.'
    }</p>`;
}

/* ---------- 5. what runs every month (F4) ---------- */

const amountInput = (id, field, value) =>
  `<input type="text" inputmode="decimal" data-rec-field="${field}" data-ref="${id}" value="${value === null || value === undefined ? '' : esc(String(num(value)).replace('.', ','))}" placeholder="–" aria-label="Betrag">`;
/** "+50 €" / "−70 €": a difference, written without the space the tiles use. */
const delta = (v) => (v > 0 ? '+' : v < 0 ? MINUS : '') + eurShort(Math.abs(v));

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
  const mineCol = ME() === 'S' ? 'amount_s' : 'amount_a';
  const theirCol = ME() === 'S' ? 'amount_a' : 'amount_s';
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
    : // two read tables: the phone sums both old flats into "heute", the desktop rail splits them
      `<table class="fin-table rec read rec-narrow"><tbody>
          ${rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${eurShort(num(r.amount_s) + num(r.amount_a))}</td><td class="new">${eurShort(r.amount_n)}</td><td class="delta">${delta(rowDelta(r))}</td></tr>`).join('')}
        </tbody></table>
        <table class="fin-table rec read rec-wide">
          <thead><tr><th>Posten</th><th>du</th><th>${OWN[OTHER()]}</th><th>neu</th><th>Δ</th></tr></thead>
          <tbody>
          ${rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${eurShort(r[mineCol])}</td><td>${eurShort(r[theirCol])}</td><td class="new">${eurShort(r.amount_n)}</td><td class="delta">${delta(rowDelta(r))}</td></tr>`).join('')}
          </tbody></table>`;
  const diff = t.delta === 0 ? 'genauso viel wie' : `${eurShort(Math.abs(t.delta))} ${t.delta > 0 ? 'mehr' : 'weniger'} als`;
  return `${head('Laufend' + (from ? ' ab ' + from : ''))}
      ${edit ? '' : `<button class="btn-text" data-act="rec-edit">Bearbeiten</button>`}
    </div>
    ${
      edit
        ? ''
        : `<p class="fin-lead"><b>${eurShort(t.n)}</b><span class="lg"> im Monat für die neue Wohnung</span><span class="sm"> / Monat</span>
            <span class="fin-lead-sub"><span class="lg">${diff} eure beiden Wohnungen heute (${eurShort(t.old)})</span><span class="sm">${
              t.delta === 0 ? 'genauso viel wie heute zusammen' : `${eurShort(Math.abs(t.delta))} ${t.delta > 0 ? 'mehr' : 'weniger'} als heute zusammen`
            }</span></span></p>`
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

/** Overdue first, then by due date, the paid ones at the end (016c). */
function postOrder(a, b) {
  const rank = (c) => (isCostLate(c) ? 0 : c.status === 'bezahlt' ? 2 : 1);
  return rank(a) - rank(b) || (a.due_on || '9999').localeCompare(b.due_on || '9999') || a.sort - b.sort;
}

const taxMark = (c) => (c.tax_relevant ? `<span class="tax" title="steuerrelevant" aria-label="steuerrelevant">§</span>` : '');
const amountText = (c) => (c.kind === 'rueckfluss' ? signed(-num(c.amount)) : (ladderState(c) === 'geschaetzt' ? '≈ ' : '') + eurShort(c.amount));
/** Who pays: the payer once paid, otherwise whose it is; a refund goes back to someone. */
function payerText(c) {
  if (c.kind === 'rueckfluss') return c.belongs_to === 'B' ? 'an beide' : 'an ' + who(c.belongs_to);
  if (c.status === 'bezahlt' && c.paid_by) return who(c.paid_by);
  return who(c.belongs_to || 'B');
}
const dueText = (c) => (c.due_on ? fmtDay(c.due_on) : '—');

/** ≥ 900 px: one table row per post, the columns of the export plus the action of 016b. */
function postRowHTML(c) {
  if (openRow(c, 'list')) return `<tr class="fin-post-open" data-where="list"><td colspan="7">${costHTML(c)}</td></tr>`;
  const t = c.task_id ? byId(c.task_id) : null;
  return `<tr class="fin-post ${c.status === 'bezahlt' ? 'paid' : ''} ${isCostLate(c) ? 'late' : ''}" data-cost="${c.id}" data-where="list">
    <th scope="row"><button class="fp-title" data-act="cost-open" data-ref="${c.id}">${esc(c.label)}</button></th>
    <td class="fp-task">${t ? `<button class="fin-link" data-act="fin-open" data-ref="${esc(t.id)}">${esc(t.title)}</button>` : '—'}</td>
    <td class="fp-state">${ladderHTML(c)}</td>
    <td class="fp-due">${dueText(c)}</td>
    <td class="fp-who">${esc(payerText(c))}</td>
    <td class="fp-amt">${amountText(c)}${taxMark(c)}</td>
    <td class="fp-act">${actionHTML(c) || `<button class="btn-text" data-act="cost-open" data-ref="${c.id}">ändern</button>`}</td>
  </tr>`;
}

/** < 900 px: at most two lines - title and amount, then state · due · who and the action. */
function postLineHTML(c) {
  if (openRow(c, 'list')) return `<div class="fin-post-open" data-where="list">${costHTML(c)}</div>`;
  return `<div class="fin-post ${c.status === 'bezahlt' ? 'paid' : ''} ${isCostLate(c) ? 'late' : ''}" data-cost="${c.id}" data-where="list">
    <div class="fp-l1"><button class="fp-title" data-act="cost-open" data-ref="${c.id}">${esc(c.label)}</button><span class="fp-amt">${amountText(c)}${taxMark(c)}</span></div>
    <div class="fp-l2"><span class="fp-meta">${ladderHTML(c)}${c.due_on ? ` · ${isCostLate(c) ? 'überfällig seit ' : 'fällig '}${fmtDay(c.due_on)}` : ''} · ${esc(payerText(c))}</span>${actionHTML(c)}</div>
  </div>`;
}

function postsHTML() {
  // a transfer between the two ("ausgleich") settles the balance - it is no post (016c)
  const all = state.costs.filter((c) => c.kind !== 'ausgleich' && (isCounted(c) || c.status === 'bezahlt' || c.status === 'angebot'));
  const key = ui.postFilter && POST_FILTERS[ui.postFilter] ? ui.postFilter : 'alle';
  // a tap on a derivation row narrows this list, too (Kennzahl = Filter)
  const fromBreak = { planned: 'offen', paid: 'bezahlt', refunds: 'rueckfluss' }[ui.finFilter];
  const active = fromBreak || key;
  const rows = all.filter(POST_FILTERS[active].test).sort(postOrder);
  const pills = Object.entries(POST_FILTERS)
    .map(([k, f]) => `<button class="pill" data-act="post-filter" data-to="${k}" aria-pressed="${active === k}">${f.label} ${all.filter(f.test).length}</button>`)
    .join('');
  const open = ui.postOpen || ui.wide || active !== 'alle';
  const openCount = all.filter(POST_FILTERS.offen.test).length;
  const filterRow = ui.finFilter
    ? `<div class="filter-row">
        <button class="pill on filter-chip" data-act="fin-filter-clear" aria-label="Filter entfernen">Filter: ${esc(breakdown().find((r) => r.key === ui.finFilter)?.label || ui.finFilter)}<span class="x" aria-hidden="true">×</span></button>
      </div>`
    : '';
  const list = !open
    ? `<button class="fin-more" data-act="post-open" data-to="offen">${openCount} offene Posten zeigen →</button>`
    : !rows.length
      ? '<p class="empty">Keine Zeile in dieser Auswahl.</p>'
      : ui.wide
        ? `<table class="fin-posts-table">
            <thead><tr><th>Posten</th><th>Aufgabe</th><th>Stand</th><th>fällig</th><th>zahlt</th><th class="r">Betrag</th><th><span class="sr">Aktion</span></th></tr></thead>
            <tbody>${rows.map(postRowHTML).join('')}</tbody>
          </table>`
        : `<div class="fin-posts">${rows.map(postLineHTML).join('')}</div>`;
  return `<div class="fin-ph">
      <div class="fin-h"><h2>Alle Posten <span class="fin-h-note">${all.length}<span class="sort-inline"> · nach Fälligkeit</span></span></h2><span class="sort-right">nach Fälligkeit</span></div>
      <div class="fin-pills">${pills}</div>
    </div>
    ${filterRow}
    ${list}
    ${bufferFootHTML()}
    ${ui.finPostAdd ? costNewHTML(null) : `<button class="btn-text row fin-add" data-act="fin-post-add">+ Posten</button>`}`;
}

/* ---------- 7. the frame data, read first (§8) ---------- */

const SETTINGS = [
  ['einzugstermin', 'Einzug (Schlüssel)', 'date'],
  ['umzugstag', 'Umzugstag', 'date'],
  ['move_out_s', 'Auszug ' + OWN.S, 'date'],
  ['move_out_a', 'Auszug ' + OWN.A, 'date'],
  ['split_default_s', 'Anteil ' + OWN.S + ' in %', 'num'],
];

/** Die stille Fußzeile unter der Posten-Tabelle: der Puffer steckt in keiner Zeile, nur in der
    Summe "Posten inkl. Puffer" oben (docs/changes/014c §4). */
function bufferFootHTML() {
  const buf = bufferInfo();
  const label = buf.mode === 'fixed' ? `${eurShort(buf.amount)} fest` : `${bufferPct()} % · ${eurShort(buf.amount)}`;
  return `<p class="fin-note fin-buffer-foot">+ Puffer ${label}</p>`;
}

/** Puffer als Segment Satz | Betrag (014c §3): Satz schreibt buffer_pct, Betrag schreibt
    buffer_fixed - ein Wechsel zurück auf Satz räumt buffer_fixed wieder ab. */
function bufferSettingHTML() {
  const mode = ui.bufferMode || (bufferFixed() !== null ? 'fixed' : 'pct');
  return `<div class="row">
    <div class="lbl">Puffer
      <div class="seg" role="group" aria-label="Puffer">
        <button class="pill" data-act="buffer-mode" data-to="pct" aria-pressed="${mode === 'pct'}">Satz</button>
        <button class="pill" data-act="buffer-mode" data-to="fixed" aria-pressed="${mode === 'fixed'}">Betrag</button>
      </div>
    </div>
    ${
      mode === 'pct'
        ? `<label class="lbl">Puffer in %<input type="text" inputmode="numeric" data-setting="buffer_pct" value="${esc(String(bufferPct()))}"></label>`
        : `<label class="lbl">Puffer in €<input type="text" inputmode="decimal" data-setting="buffer_fixed" value="${bufferFixed() === null ? '' : esc(String(bufferFixed()).replace('.', ','))}"></label>`
    }
  </div>`;
}

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

// "Fr, 01.01.2027" - the export writes the weekday without the dot de-DE puts after it
const fmtLong = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/^(\w+)\./, '$1');
const fmtFull = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const set = (k) => (typeof state.settings[k] === 'string' && state.settings[k] ? state.settings[k] : '');

function rahmenHTML() {
  const d = (k) => (set(k) ? fmtDay(set(k)) : '–');
  const split = state.settings.split_default_s ?? 50;
  const out = (p) => (p === 'S' ? 'move_out_s' : 'move_out_a');
  const buf = bufferInfo();
  const bufferShort = buf.mode === 'fixed' ? `Puffer ${eurShort(buf.amount)} fest` : `Puffer ${bufferPct()} %`;
  // the phone: one line; the desktop rail: a small read block - same data, same "ändern"
  const line = `Einzug ${d('einzugstermin')}${umzugstag() ? ` · Umzug ${d('umzugstag')}` : ''} · Auszug du ${d(out(ME()))}, ${OWN[OTHER()]} ${d(out(OTHER()))} · ${split}/${100 - split} · ${bufferShort}`;
  const kv = (l, v) => `<div><dt>${l}</dt><dd>${v}</dd></div>`;
  const block = `<dl class="fin-kv">
      ${kv('Einzug', set('einzugstermin') ? esc(fmtLong(set('einzugstermin'))) : '–')}
      ${umzugstag() ? kv('Umzugstag', esc(fmtLong(umzugstag()))) : ''}
      ${kv('Auszug du', set(out(ME())) ? fmtFull(set(out(ME()))) : '–')}
      ${kv('Auszug ' + OWN[OTHER()], set(out(OTHER())) ? fmtFull(set(out(OTHER()))) : '–')}
      ${kv('Aufteilung', `${split} / ${100 - split}`)}
      ${kv('Puffer', buf.mode === 'fixed' ? `${eurShort(buf.amount)} fest · ${bufferPct()} % wären ${eurShort(buf.suggested)}` : `${bufferPct()} % · ${eurShort(buf.amount)}`)}
    </dl>`;
  return `<section class="fin-rahmen" id="fin-settings">
    <div class="fin-h fin-rahmen-h"><h2>Rahmendaten</h2><button class="btn-text" data-act="fin-settings" aria-expanded="${!!ui.finSettings}">ändern</button></div>
    ${block}
    <p class="fin-rahmen-line fin-rahmen-one">${esc(line)} · <button class="fin-link" data-act="fin-settings" aria-expanded="${!!ui.finSettings}">ändern</button></p>
    ${
      ui.finSettings
        ? `<div class="row">
            ${SETTINGS.map(
              ([key, label, kind]) => `<label class="lbl">${label}<input type="${kind === 'date' ? 'date' : 'text'}" ${kind === 'num' ? 'inputmode="decimal"' : ''} data-setting="${key}" value="${esc(state.settings[key] ?? '')}"></label>`,
            ).join('')}
          </div>
          ${bufferSettingHTML()}`
        : ''
    }
    ${icsHTML()}
  </section>`;
}

/* ---------- the head of the view (016c: title left, places and avatar right) ---------- */

function finHeadHTML() {
  const days = daysToEinzug();
  return `<header class="fin-head">
    <h1 class="fin-title">Finanzen${days !== null ? `<span class="fin-days">${days} ${days === 1 ? 'Tag' : 'Tage'} bis Einzug</span>` : ''}</h1>
    ${ui.preview ? `<span class="preview-badge" title="Testversion unter /preview/ – gleiche Datenbank wie die echte App, aber dein Lesestand wird hier nicht gespeichert">Vorschau</span>` : ''}
    <span class="spacer"></span>
    <nav class="fin-nav" aria-label="Bereiche">
      <button class="pill navbtn" data-act="home">Aufgaben</button>
      <button class="pill navbtn on" data-act="screen" data-to="finanzen" aria-current="page">Finanzen</button>
    </nav>
    ${avatarHTML(true)}
  </header>`;
}

export function finanzenView() {
  // docs/changes/016b: without settings.fin_setup_done, Finanzen opens to the four questions
  // instead of an empty view - "Später" leaves it empty with a way back in
  if (!state.settings.fin_setup_done && !ui.finSetupSkip) return updateBarHTML() + setupHTML();
  const setupHint = !state.settings.fin_setup_done
    ? `<p class="fin-setup-hint"><button class="btn-text" data-act="fin-setup-resume">Einrichtung abschließen ›</button></p>`
    : '';
  return (
    updateBarHTML() +
    setupHintHTML() +
    `<div class="fin">` +
    finHeadHTML() +
    setupHint +
    `<div class="fin-grid">` +
    answerHTML() +
    `<aside class="fin-side" aria-label="Ausgleich, laufende Kosten, Rahmendaten">` +
    balanceHTML() +
    `<section class="fin-block fin-rec">${recurringHTML()}</section>` +
    rahmenHTML() +
    `</aside>` +
    `<section class="fin-block fin-next">${nextPayHTML()}</section>` +
    `<section class="fin-block fin-mon">${monthsHTML()}</section>` +
    `<section class="fin-block fin-postsec">${postsHTML()}</section>` +
    `</div>` +
    footHTML({ status: true }) +
    `</div>`
  );
}
