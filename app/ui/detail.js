// Detail panel ("Akte") in two modes (docs/changes/017, replaces the light/full split from 009).
//
// Ansehen is the default and shows text only: empty sections disappear, so a small task is four
// lines and nothing else. Ticking off and commenting stay allowed there - they report the state,
// they do not change the task. Everything else lives behind "Bearbeiten": a mode of its own with
// form fields and a clear end. Fertig writes every changed field in one go, Abbrechen discards.
import { esc, fmtTime } from './dom.js';
import { OWN, STEPS, STEP_OWNER, ADV } from './labels.js';
import { state, ui, byId, subsOf, comsOf, dueLabel, offsetLabel, claudeStep, umzugstag, freshComments, canEditComment } from '../state.js';
import { isLate, isCritical } from '../filters.js';
import { costsOf, isHistory, isCostLate, eur, num, COST_LABEL, COST_NEXT, KIND, APARTMENT, nextStep, prevStep } from '../costs.js';

const opts = (sel, arr) => arr.map(([v, l]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${l}</option>`).join('');

/* ---------- the draft (docs/changes/017) ----------
   Bearbeiten collects changes in ui.draft and writes nothing until Fertig. Only task columns go
   in here; subtasks, costs and comments are rows of their own and keep saving straight away. */

export const draftOf = (t) => (ui.draft && ui.draft.id === t.id ? ui.draft.fields : {});
export const draftCount = (t) => Object.keys(draftOf(t)).length;
/** The value a field currently shows: the draft if it was touched, otherwise the saved one. */
export function fieldValue(t, key) {
  const d = draftOf(t);
  if (key in d) return d[key];
  if (key.startsWith('brief.')) return (t.brief || {})[key.slice(6)] ?? '';
  return t[key];
}
const isChanged = (t, key) => key in draftOf(t);
const mark = (t, key) => (isChanged(t, key) ? ' <span class="changed">geändert</span>' : '');
const markCls = (t, key) => (isChanged(t, key) ? ' is-changed' : '');

/* ---------- comments: the same in both modes, one field ---------- */

// docs/changes/013 B5: only the own comments carry actions - deleting always, editing only
// inside the ten-minute window (RLS allows both for either person; the "own only" limit is
// a rule of the interface)
function commentHTML(c, fresh) {
  const own = c.author === state.person;
  const editing = own && ui.comEdit === c.id;
  const confirming = own && ui.confirm === 'comdel:' + c.id;
  const body = editing
    ? `<textarea class="com-edit" aria-label="Kommentar bearbeiten">${esc(c.body)}</textarea>
      <div class="row pad"><button class="btn-secondary" data-act="com-save" data-ref="${c.id}">Speichern</button><button class="btn-text" data-act="com-cancel">Abbrechen</button></div>`
    : esc(c.body);
  const actions =
    own && !editing
      ? confirming
        ? `<div class="com-own-actions"><span class="confirm">Kommentar löschen? <button class="btn-text danger" data-act="com-del-yes" data-ref="${c.id}">Ja</button><button class="btn-secondary" data-act="confirm-no">Nein</button></span></div>`
        : `<div class="com-own-actions">${canEditComment(c) ? `<button class="btn-text" data-act="com-edit" data-ref="${c.id}">Bearbeiten</button>` : ''}<button class="btn-text" data-act="com-del" data-ref="${c.id}">Löschen</button></div>`
      : '';
  return `<div class="com ${c.author}" data-com="${c.id}"><div class="h"><b>${OWN[c.author] || c.author}</b> · ${fmtTime(c.created_at)}${fresh ? ' · <span class="new">neu</span>' : ''}</div>${body}${actions}</div>`;
}

function commentsHTML(t) {
  const coms = comsOf(t.id);
  const fresh = new Set(freshComments(t).map((c) => c.id));
  const other = state.person === 'S' ? 'A' : 'S';
  const n = fresh.size;
  return `<h3>Kommentare ${coms.length ? `<small>${coms.length}${n ? ` · ${n} neu` : ''}</small>` : ''}</h3>
    ${coms.map((c) => commentHTML(c, fresh.has(c.id))).join('')}
    <textarea data-input="com" placeholder="Kommentar an ${OWN[other]} …" aria-label="Neuer Kommentar"></textarea>
    <div class="row"><button class="btn-secondary" data-act="com-add">Senden</button></div>`;
}

/* ---------- Ansehen ---------- */

const fmtDay = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '');
const fmtShortDay = (iso) => (iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '');
const today = () => new Date().toISOString().slice(0, 10);

const STEP_SENTENCE = {
  briefing: 'Das Briefing geht an Claude, sobald ihr es abschickt.',
  claude: 'Claude arbeitet daran. Ihr seid wieder dran, sobald das Ergebnis vorliegt.',
  ergebnis: 'Das Ergebnis liegt vor – lest es durch und hakt die Aufgabe ab.',
};

/** "Stand": where the delegation stands, one sentence, and the briefing behind a text link. */
function standHTML(t) {
  const step = claudeStep(t);
  const idx = STEPS.findIndex((s) => s[0] === step);
  const brief = t.brief || {};
  const open = ui.briefOpen === t.id;
  const text = (k, l) => (brief[k] ? `<div class="brief-read"><b>${l}</b><p>${esc(brief[k])}</p></div>` : '');
  return `<h3>Stand <small>Jetzt dran: ${STEP_OWNER[step]}</small></h3>
    <ol class="steps" aria-label="Zustandsverlauf">${STEPS.map((s, i) => `<li class="${i === idx ? 'cur' : i < idx ? 'past' : ''}" ${i === idx ? 'aria-current="step"' : ''}><i></i><span>${s[1]}</span></li>`).join('')}</ol>
    <p class="stand-line">${STEP_SENTENCE[step]}</p>
    <div class="row">
      <button class="btn-text" data-act="brief-read" data-ref="${t.id}" aria-expanded="${open}">Briefing lesen ${open ? '›' : '›'}</button>
      ${step === 'briefing' ? `<button class="btn-secondary" data-act="to-claude">An Claude geben</button>` : ''}
      ${step === 'claude' ? `<button class="btn-secondary" data-act="accept">Ergebnis übernommen</button>` : ''}
    </div>
    ${open ? `<div class="brief read">${text('goal', 'Ziel') || '<div class="brief-read"><b>Ziel</b><p class="none">noch nicht geschrieben</p></div>'}${text('ctx', 'Kontext & Rahmendaten')}${text('result', 'Ergebnis von Claude')}</div>` : ''}`;
}

function subtasksViewHTML(t) {
  const subs = subsOf(t.id);
  if (!subs.length) return '';
  const done = subs.filter((s) => s.done).length;
  return `<h3>Teilschritte <small>${done}/${subs.length}</small></h3>
    ${subs
      .map(
        (s) => `<div class="sub ${s.done ? 'done' : ''}" data-sub="${s.id}">
      <input type="checkbox" ${s.done ? 'checked' : ''} ${ui.offline ? 'disabled' : ''} data-act="sub-done" aria-label="Teilschritt erledigt">
      <span class="sub-read">${esc(s.title)}</span>
    </div>`,
      )
      .join('')}`;
}

/** One line per cost row: amount, state, due date. Nothing to tap - that is Bearbeiten. */
function costsViewHTML(t) {
  const rows = costsOf(t.id).filter((c) => !isHistory(c));
  if (!rows.length) return '';
  return `<div class="akte-line"><span class="l">Kosten</span><span class="v">${rows
    .map((c) => `${eur(c.amount)} · ${isCostLate(c) ? `überfällig seit ${fmtDay(c.due_on)}` : COST_LABEL[c.status] + (c.due_on ? ` bis ${fmtDay(c.due_on)}` : '')}`)
    .join('<br>')}</span></div>`;
}

function dependsViewHTML(t) {
  const ids = t.blocked_by || [];
  if (!ids.length) return '';
  return `<div class="akte-line"><span class="l">Hängt ab von</span><span class="v">${ids
    .map((id) => {
      const b = byId(id);
      return b ? `${b.done ? '✓ ' : ''}<a class="tlink" href="#task=${encodeURIComponent(id)}">${esc(b.title)}</a>` : '';
    })
    .filter(Boolean)
    .join(' · ')}</span></div>`;
}

/** Advice: one pill per filled topic, the text opens underneath. Empty topics get no pill. */
function adviceViewHTML(t) {
  const adv = t.advice || {};
  const filled = ADV.filter(([k]) => adv[k]);
  if (!filled.length) return '';
  const openKey = (ui.advOpen || '').startsWith(t.id + ':') ? ui.advOpen.slice(t.id.length + 1) : null;
  return `<h3>Beratung <small>von Claude · ${filled.length} ${filled.length === 1 ? 'Thema' : 'Themen'}</small></h3>
    <div class="pchips adv-pills">${filled
      .map(([k, l]) => `<button class="pill" data-act="adv-open" data-ref="${t.id}" data-to="${k}" aria-pressed="${openKey === k}">${l}</button>`)
      .join('')}</div>
    ${openKey && adv[openKey] ? `<div class="adv-body">${esc(adv[openKey])}</div>` : ''}`;
}

function viewHTML(t, withHead) {
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const edit = `<button class="btn-secondary" data-act="akte-edit" data-ref="${t.id}">Bearbeiten</button>`;
  const head = !withHead
    ? ''
    : `<div class="akte-top">
      <input type="checkbox" class="check" ${t.done ? 'checked' : ''} ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt">
      ${titleHTML(t)}
    </div>
    <div class="akte-meta">
      <span class="own ${t.owner}">${OWN[t.owner]}</span>
      <span class="due ${dueCls}">${esc(dueLabel(t))}</span>
      <span class="muted">Phase ${t.phase}</span>
    </div>
    ${t.wait_on === state.person ? `<p class="wait-banner">Diese Aufgabe wartet auf dich</p>` : ''}`;
  return `<div class="detail akte-view ${withHead ? '' : 'nohead'}" data-detail="${t.id}">
    ${withHead ? '' : `<div class="akte-meta nohead-meta"><span class="own ${t.owner}">${OWN[t.owner]}</span><span class="due ${dueCls}">${esc(dueLabel(t))}</span><span class="muted">Phase ${t.phase}</span></div>`}
    ${head}
    <div class="akte-actions">${edit}</div>
    ${t.type === 'claude' ? standHTML(t) : ''}
    ${subtasksViewHTML(t)}
    ${costsViewHTML(t)}
    ${dependsViewHTML(t)}
    ${t.id === 'kosten' ? `<p class="row"><button class="btn-text" data-act="fin-recurring">Laufende Kosten öffnen →</button></p>` : ''}
    ${adviceViewHTML(t)}
    ${commentsHTML(t)}
    <p class="akte-changed">zuletzt geändert ${esc(fmtShortDay(t.updated_at))}${t.done && t.done_by ? ` · abgehakt von ${OWN[t.done_by]}` : ''}</p>
  </div>`;
}

/* ---------- Bearbeiten ---------- */

const SEGMENTS = [['S', OWN.S], ['B', 'gemeinsam'], ['A', OWN.A]];

function subtasksEditHTML(t) {
  const subs = subsOf(t.id);
  return `<h3>Teilschritte ${subs.length ? `<small>${subs.length}</small>` : ''}</h3>
    ${subs
      .map(
        (s, i) => `<div class="sub sub-edit" data-sub="${s.id}">
      <span class="sub-move">
        <button class="ico" data-act="sub-up" data-ref="${s.id}" ${i === 0 ? 'disabled' : ''} aria-label="Teilschritt nach oben">↑</button>
        <button class="ico" data-act="sub-down" data-ref="${s.id}" ${i === subs.length - 1 ? 'disabled' : ''} aria-label="Teilschritt nach unten">↓</button>
      </span>
      <input type="text" data-sub-field="title" data-ref="${s.id}" value="${esc(s.title)}" aria-label="Titel des Teilschritts">
      <button class="ico" data-act="sub-del" data-ref="${s.id}" aria-label="Teilschritt löschen: ${esc(s.title)}">×</button>
    </div>`,
      )
      .join('')}
    ${
      ui.confirm && ui.confirm.startsWith('subdel:')
        ? `<p class="confirm">Teilschritt löschen? <button class="btn-text danger" data-act="sub-del-yes" data-ref="${ui.confirm.slice(7)}">Ja</button><button class="btn-secondary" data-act="confirm-no">Nein</button></p>`
        : ''
    }
    <div class="row sub-add"><input type="text" data-input="sub" placeholder="+ Teilschritt" aria-label="Neuer Teilschritt"><button class="btn-secondary" data-act="sub-add">Hinzufügen</button></div>`;
}

function delegationEditHTML(t) {
  const step = claudeStep(t);
  const cur = fieldValue(t, 'status') || 'briefing';
  const brief = t.brief || {};
  const filled = ['goal', 'ctx'].filter((k) => String(fieldValue(t, 'brief.' + k) || '').trim()).length;
  return `<h3>Delegation an Claude <small>Briefing ${filled === 2 ? 'vollständig' : 'unvollständig'} ${filled}/2</small></h3>
    <div class="seg" role="group" aria-label="Stand der Delegation">${STEPS.map(
      ([k, l]) => `<button class="pill" data-act="draft-set" data-field="status" data-to="${k}" aria-pressed="${cur === k}">${l}</button>`,
    ).join('')}${mark(t, 'status')}</div>
    <label class="lbl${markCls(t, 'brief.goal')}"><span class="lbl-h">Ziel – was soll am Ende vorliegen?${mark(t, 'brief.goal')}</span>
      <textarea data-draft="brief.goal" placeholder="z. B. Shortlist mit 3 Umzugsfirmen inkl. Preisrahmen und Verfügbarkeit">${esc(fieldValue(t, 'brief.goal'))}</textarea></label>
    <label class="lbl${markCls(t, 'brief.ctx')}"><span class="lbl-h">Kontext & Rahmendaten${mark(t, 'brief.ctx')}</span>
      <textarea data-draft="brief.ctx" placeholder="z. B. 3-Zimmer + 2-Zimmer, beide 3. OG ohne Aufzug, ~35 m³">${esc(fieldValue(t, 'brief.ctx'))}</textarea></label>
    <div class="brief-read"><b>Ergebnis von Claude</b><p class="${brief.result ? '' : 'none'}">${brief.result ? esc(brief.result) : 'liegt noch nicht vor'}</p></div>`;
}

function editHTML(t, withHead) {
  const n = draftCount(t);
  const other = state.person === 'S' ? 'A' : 'S';
  const asking = ui.confirm === 'akte-cancel:' + t.id;
  const others = state.tasks.filter((x) => x.id !== t.id && !fieldValue(t, 'blocked_by').includes(x.id)).sort((a, b) => a.phase - b.phase || a.sort - b.sort);
  const anchor = fieldValue(t, 'anchor') || 'einzug';
  const del =
    ui.confirm === 'del:' + t.id
      ? `<span class="confirm">Wirklich löschen? <button class="btn-text danger" data-act="del-yes">Ja, löschen</button><button class="btn-secondary" data-act="confirm-no">Nein</button></span>`
      : `<button class="btn-text danger" data-act="del">Aufgabe löschen</button>`;
  return `<div class="detail akte-edit ${withHead ? '' : 'nohead'}" data-detail="${t.id}">
    <div class="edit-bar on-ink">
      <button class="btn-text" data-act="akte-cancel" data-ref="${t.id}">Abbrechen</button>
      <b>Aufgabe bearbeiten</b>
      <button class="btn-primary" data-act="akte-done" data-ref="${t.id}">Fertig</button>
    </div>
    ${
      asking
        ? `<p class="edit-hint ask">${n} ${n === 1 ? 'Änderung' : 'Änderungen'} verwerfen?
            <button class="btn-text danger" data-act="akte-discard" data-ref="${t.id}">Ja, verwerfen</button>
            <button class="btn-secondary" data-act="confirm-no">Nein</button></p>`
        : `<p class="edit-hint">${n ? `${n} ungespeicherte ${n === 1 ? 'Änderung' : 'Änderungen'} · ${OWN[other]} sieht sie erst nach „Fertig“` : `Noch nichts geändert · ${OWN[other]} sieht Änderungen erst nach „Fertig“`}</p>`
    }

    <h3>Grunddaten</h3>
    <label class="lbl${markCls(t, 'title')}"><span class="lbl-h">Titel${mark(t, 'title')}</span>
      <input type="text" data-draft="title" value="${esc(fieldValue(t, 'title'))}" aria-label="Titel"></label>
    <div class="lbl"><span class="lbl-h">Zuständig${mark(t, 'owner')}</span>
      <div class="seg" role="group" aria-label="Zuständig">${SEGMENTS.map(
        ([k, l]) => `<button class="pill" data-act="draft-set" data-field="owner" data-to="${k}" aria-pressed="${fieldValue(t, 'owner') === k}">${l}</button>`,
      ).join('')}</div>
    </div>
    <div class="row">
      <label class="lbl${markCls(t, 'offset_days')}"><span class="lbl-h">Tage (− vor / + nach)${mark(t, 'offset_days')}</span>
        <input type="number" inputmode="numeric" data-draft="offset_days" value="${esc(String(fieldValue(t, 'offset_days')))}" aria-label="Tage relativ zum Stichtag"></label>
      <label class="lbl${markCls(t, 'anchor')}"><span class="lbl-h">Gerechnet ab${mark(t, 'anchor')}</span>
        <select data-draft="anchor">${opts(anchor, [['einzug', 'Einzug'], ['umzugstag', 'Umzugstag']])}</select></label>
    </div>
    <p class="hint">${esc(offsetLabel({ offset_days: Number(fieldValue(t, 'offset_days')) || 0 }))} · gerechnet ab ${anchor === 'umzugstag' ? 'Umzugstag' : 'Einzug'}${
      anchor === 'umzugstag' && !umzugstag() ? ' – der ist noch nicht gesetzt, bis dahin zählt der Einzug' : ''
    }</p>
    <label class="check-label"><input type="checkbox" data-draft="critical" ${fieldValue(t, 'critical') ? 'checked' : ''}> fristkritisch${mark(t, 'critical')}</label>

    <h3>Hängt ab von${mark(t, 'blocked_by')}</h3>
    <div class="chips">${
      fieldValue(t, 'blocked_by')
        .map((id) => {
          const b = byId(id);
          return b
            ? `<span class="chip">${b.done ? '✓ ' : ''}${esc(b.title.slice(0, 36))}<button class="ico" data-act="unblock" data-ref="${id}" aria-label="Abhängigkeit entfernen">×</button></span>`
            : '';
        })
        .join('') || '<span class="empty">keine</span>'
    }</div>
    <div class="row"><select data-act="block-select" aria-label="Abhängigkeit hinzufügen"><option value="">+ Abhängigkeit wählen …</option>${others
      .map((x) => `<option value="${x.id}">${x.phase} · ${esc(x.title.slice(0, 60))}</option>`)
      .join('')}</select></div>

    ${subtasksEditHTML(t)}
    ${t.type === 'claude' ? delegationEditHTML(t) : ''}
    ${costsHTML(t)}
    <div class="row akte-foot"><span class="spacer"></span>${del}</div>
  </div>`;
}

/* ---------- Kosten (docs/changes/007 point 1) ----------
   One row per amount. Tapping a row opens its fields inline - no overlay, no dialog. The status
   moves one step at a time and can go back exactly one step. Estimates that lost against a firm
   row of the same task stay visible as history, greyed out. */

function costFormHTML(c) {
  return `<div class="cost-form">
    <div class="row"><label class="lbl">Bezeichnung<input type="text" data-cost-field="label" data-ref="${c.id}" value="${esc(c.label)}"></label></div>
    <div class="row">
      <label class="lbl">Betrag<input type="text" inputmode="decimal" data-cost-field="amount" data-ref="${c.id}" value="${esc(String(num(c.amount)).replace('.', ','))}" aria-label="Betrag in Euro"></label>
      <label class="lbl">Art<select data-cost-field="kind" data-ref="${c.id}">${opts(c.kind, Object.entries(KIND))}</select></label>
    </div>
    <div class="row">
      <label class="lbl">Wohnung<select data-cost-field="apartment" data-ref="${c.id}"><option value="">keine</option>${opts(c.apartment || '', Object.entries(APARTMENT))}</select></label>
      <label class="lbl">Fällig<input type="date" data-cost-field="due_on" data-ref="${c.id}" value="${esc(c.due_on || '')}"></label>
    </div>
    <label class="check-label"><input type="checkbox" data-cost-field="tax_relevant" data-ref="${c.id}" ${c.tax_relevant ? 'checked' : ''}> steuerrelevant</label>
    <div class="row"><label class="lbl">Beleg (Link)<input type="text" inputmode="url" data-cost-field="receipt_url" data-ref="${c.id}" value="${esc(c.receipt_url || '')}" placeholder="optional"></label></div>
    <div class="row">
      ${
        ui.confirm === 'costdel:' + c.id
          ? `<span class="confirm">Kostenzeile löschen? <button class="btn-text danger" data-act="cost-del-yes" data-ref="${c.id}">Ja</button><button class="btn-secondary" data-act="confirm-no">Nein</button></span>`
          : `<button class="btn-text danger" data-act="cost-del" data-ref="${c.id}">Löschen</button>`
      }
      <span class="spacer"></span>
      <button class="btn-secondary" data-act="cost-edit-done">Fertig</button>
    </div>
  </div>`;
}

function costPayHTML(c) {
  return `<div class="cost-form cost-pay">
    <div class="row">
      <label class="lbl">Bezahlt am<input type="date" data-input="paid-on" data-ref="${c.id}" value="${today()}"></label>
      <label class="lbl">Von<select data-input="paid-by" data-ref="${c.id}">${opts(c.paid_by || state.person, [['S', OWN.S], ['A', OWN.A]])}</select></label>
    </div>
    <div class="row"><button class="btn-secondary" data-act="cost-pay-save" data-ref="${c.id}">Als bezahlt buchen</button><button class="btn-text" data-act="cost-pay-cancel">Abbrechen</button></div>
  </div>`;
}

export function costHTML(c) {
  const open = ui.costEdit === c.id;
  const paying = ui.costPay === c.id;
  const next = nextStep(c);
  const back = prevStep(c);
  const late = isCostLate(c);
  return `<div class="cost ${isHistory(c) ? 'history' : ''} ${open ? 'open' : ''}" data-cost="${c.id}">
    <button class="cost-head" data-act="cost-edit" data-ref="${c.id}" aria-expanded="${open}">
      <span class="cost-label">${esc(c.label)}</span>
      <span class="cost-amount">${c.kind === 'rueckfluss' ? '+ ' : ''}${eur(c.amount)}</span>
      <span class="cost-meta">
        <span class="tag">${COST_LABEL[c.status] || c.status}</span>
        ${c.status === 'bezahlt' && c.paid_on ? `<span class="due">bezahlt ${fmtDay(c.paid_on)}</span>` : ''}
        ${c.due_on && c.status !== 'bezahlt' ? `<span class="due ${late ? 'late' : ''}">${late ? 'überfällig seit ' : 'bis '}${fmtDay(c.due_on)}</span>` : ''}
        ${c.kind === 'rueckfluss' ? `<span class="tag">Rückfluss</span>` : ''}
        ${c.apartment ? `<span class="tag">${APARTMENT[c.apartment]}</span>` : ''}
        ${c.tax_relevant ? `<span class="tag">steuerrelevant</span>` : ''}
        ${c.paid_by && c.status === 'bezahlt' ? `<span class="own ${c.paid_by}">${OWN[c.paid_by]}</span>` : ''}
      </span>
    </button>
    ${open ? costFormHTML(c) : ''}
    ${paying ? costPayHTML(c) : ''}
    ${
      paying
        ? ''
        : `<div class="cost-actions">
      ${next ? `<button class="btn-secondary" data-act="${next === 'bezahlt' ? 'cost-pay' : 'cost-step'}" data-ref="${c.id}" data-to="${next}">${COST_NEXT[c.status]}</button>` : ''}
      ${back ? `<button class="btn-text back" data-act="cost-step" data-ref="${c.id}" data-to="${back}">zurück auf ${COST_LABEL[back]}</button>` : ''}
    </div>`
    }
  </div>`;
}

export function costRowsHTML(t, filter = () => true) {
  const rows = costsOf(t.id).filter(filter);
  const adding = ui.costAdd === t.id;
  return `${rows.map(costHTML).join('')}
    ${
      adding
        ? `<div class="cost-form cost-new">
            <div class="row">
              <label class="lbl">Bezeichnung<input type="text" data-input="cost-label" placeholder="z. B. Umzugsunternehmen"></label>
              <label class="lbl">Betrag<input type="text" inputmode="decimal" data-input="cost-amount" placeholder="1800" aria-label="Betrag in Euro"></label>
            </div>
            <div class="row"><button class="btn-secondary" data-act="cost-add-save">Hinzufügen</button><button class="btn-text" data-act="cost-add-cancel">Abbrechen</button></div>
          </div>`
        : `<button class="btn-text row" data-act="cost-add">+ Bezeichnung und Betrag</button>`
    }`;
}

export function costsHTML(t) {
  const n = costsOf(t.id).length;
  return `<h3>Kosten ${n ? `<small>${n}</small>` : ''}</h3>
    ${costRowsHTML(t)}`;
}

/** Title as plain text - editing it is a mode of its own since 017. */
export function titleHTML(t, cls = 'akte-title-text') {
  return `<h2 class="${cls}">${esc(t.title)}</h2>`;
}

export function detailHTML(t, withHead = true) {
  return ui.akteEdit === t.id ? editHTML(t, withHead) : viewHTML(t, withHead);
}
