// Detail panel ("Akte") of a task in two weight classes (docs/changes/009).
// Light by default: title, deadline, subtasks, comments – that is the whole task for
// "Kartons besorgen". Dependencies, delegation, advice and the fields sit behind "Mehr".
// Full automatically when the task carries something: delegated to Claude, advice written,
// or dependencies. The state is remembered per task for as long as the app is open.
import { esc, fmtTime } from './dom.js';
import { ICON } from './icons.js';
import { OWN, TYPE, STEPS, STEP_OWNER, ADV } from './labels.js';
import { state, ui, byId, subsOf, comsOf, dueLabel, offsetLabel, claudeStep, einzug, canEditComment } from '../state.js';
import { isLate, isCritical } from '../filters.js';
import { costsOf, isHistory, isCostLate, eur, num, taskAmount, COST_LABEL, COST_NEXT, KIND, APARTMENT, nextStep, prevStep } from '../costs.js';

const opts = (sel, arr) => arr.map(([v, l]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${l}</option>`).join('');

// does this task carry more than a checkbox?
export const isFull = (t) =>
  t.type === 'claude' || (t.blocked_by || []).length > 0 || ADV.some(([k]) => (t.advice || {})[k]) || costsOf(t.id).length > 0;
export const isMoreOpen = (t) => (ui.more[t.id] === undefined ? isFull(t) : ui.more[t.id]);

// docs/changes/013 B5: only the own comments carry actions - deleting always, editing only
// inside the ten-minute window (RLS allows both for either person; the "own only" limit is
// a rule of the interface)
function commentHTML(c) {
  const own = c.author === state.person;
  const editing = own && ui.comEdit === c.id;
  const confirming = own && ui.confirm === 'comdel:' + c.id;
  const body = editing
    ? `<textarea class="com-edit" aria-label="Kommentar bearbeiten">${esc(c.body)}</textarea>
      <div class="row pad"><button class="btn small primary" data-act="com-save" data-ref="${c.id}">Speichern</button><button class="btn small" data-act="com-cancel">Abbrechen</button></div>`
    : esc(c.body);
  const actions =
    own && !editing
      ? confirming
        ? `<div class="com-own-actions"><span class="confirm">Kommentar löschen? <button class="btn small danger" data-act="com-del-yes" data-ref="${c.id}">Ja</button><button class="btn small" data-act="confirm-no">Nein</button></span></div>`
        : `<div class="com-own-actions">${canEditComment(c) ? `<button class="link" data-act="com-edit" data-ref="${c.id}">Bearbeiten</button>` : ''}<button class="link" data-act="com-del" data-ref="${c.id}">Löschen</button></div>`
      : '';
  return `<div class="com ${c.author}" data-com="${c.id}"><div class="h"><b>${OWN[c.author] || c.author}</b> · ${fmtTime(c.created_at)}</div>${body}${actions}</div>`;
}

function commentsHTML(t) {
  const coms = comsOf(t.id);
  return `<h3>Kommentare ${coms.length ? `<small>${coms.length}</small>` : ''}</h3>
    ${coms.map(commentHTML).join('') || '<div class="empty">Noch keine Kommentare. Kurz notieren, woran es hängt oder was der andere wissen muss.</div>'}
    <textarea data-input="com" placeholder="Kommentar als ${OWN[state.person]}" aria-label="Neuer Kommentar"></textarea>
    <div class="row"><button class="btn primary" data-act="com-add">Kommentar speichern</button></div>`;
}

// docs/changes/013 B2: a tap on the text (or the pencil) opens the one row for editing - no more
// × that deletes on a single tap. Deleting sits behind its own inline confirmation there.
function subtaskHTML(s) {
  if (ui.subEdit === s.id) {
    const confirming = ui.confirm === 'subdel:' + s.id;
    return `<div class="sub sub-editing" data-sub="${s.id}">
      <input type="text" class="sub-edit-title" data-sub-field="title" data-ref="${s.id}" value="${esc(s.title)}" aria-label="Titel des Teilschritts">
      <div class="row pad">
        ${
          confirming
            ? `<span class="confirm">Teilschritt löschen? <button class="btn small danger" data-act="sub-del-yes" data-ref="${s.id}">Ja</button><button class="btn small" data-act="confirm-no">Nein</button></span>`
            : `<button class="btn small danger" data-act="sub-del" data-ref="${s.id}">Löschen</button>`
        }
        <span class="spacer"></span>
        <button class="btn small primary" data-act="sub-edit-done">Fertig</button>
      </div>
    </div>`;
  }
  return `<div class="sub ${s.done ? 'done' : ''}" data-sub="${s.id}">
    <input type="checkbox" ${s.done ? 'checked' : ''} ${ui.offline ? 'disabled' : ''} data-act="sub-done" aria-label="Teilschritt erledigt">
    <button class="sub-text" data-act="sub-edit" data-ref="${s.id}" aria-label="Teilschritt bearbeiten: ${esc(s.title)}">${esc(s.title)}</button>
    <button class="ico pencil" data-act="sub-edit" data-ref="${s.id}" aria-label="Teilschritt bearbeiten" title="Bearbeiten">${ICON.pencil}</button>
  </div>`;
}

function subtasksHTML(t) {
  const subs = subsOf(t.id);
  const done = subs.filter((s) => s.done).length;
  return `<h3>Teilschritte ${subs.length ? `<small>${done}/${subs.length}</small>` : ''}</h3>
    ${subs.map(subtaskHTML).join('')}
    <div class="row"><input type="text" data-input="sub" placeholder="Neuer Teilschritt" aria-label="Neuer Teilschritt"><button class="btn small" data-act="sub-add">Hinzufügen</button></div>`;
}

// delegation: briefing -> bei Claude -> Ergebnis liegt vor (docs/changes/009)
function delegationHTML(t) {
  const step = claudeStep(t);
  const idx = STEPS.findIndex((s) => s[0] === step);
  const brief = t.brief || {};
  return `<h3>Delegation an Claude</h3>
    <div class="brief">
      <ol class="steps" aria-label="Zustandsverlauf">${STEPS.map((s, i) => `<li class="${i === idx ? 'cur' : i < idx ? 'past' : ''}" ${i === idx ? 'aria-current="step"' : ''}><i></i><span>${s[1]}</span></li>`).join('')}</ol>
      <div class="turn">Jetzt dran: <b>${STEP_OWNER[step]}</b></div>
      <label>Ziel – was soll am Ende vorliegen?<textarea data-brief="goal" placeholder="z. B. Shortlist mit 3 Umzugsfirmen inkl. Preisrahmen und Verfügbarkeit im Zeitfenster">${esc(brief.goal)}</textarea></label>
      <label>Kontext & Rahmendaten – alles, was Claude wissen muss<textarea data-brief="ctx" placeholder="z. B. 3-Zimmer + 2-Zimmer, beide 3. OG ohne Aufzug, ~35 m³, Budget bis …, Wunschzeitraum …">${esc(brief.ctx)}</textarea></label>
      <label>Ergebnis von Claude<textarea data-brief="result" placeholder="Hier landet das Ergebnis – von Claude Code eingetragen oder von euch">${esc(brief.result)}</textarea></label>
      <p class="hint">Rückfragen und Antworten laufen über die Kommentare darunter.</p>
      <div class="row">
        ${step === 'briefing' ? `<button class="btn claude" data-act="to-claude">An Claude geben</button>` : ''}
        ${step === 'claude' ? `<button class="btn primary" data-act="accept">Ergebnis übernommen</button>` : ''}
        ${step !== 'briefing' ? `<button class="btn small" data-act="back">Zurück auf Briefing</button>` : ''}
      </div>
    </div>`;
}

// only filled advice is shown; the empty ones hide behind one link (docs/changes/009)
function adviceHTML(t) {
  const adv = t.advice || {};
  const filled = ADV.filter(([k]) => adv[k]);
  const empty = ADV.filter(([k]) => !adv[k]);
  const showEmpty = ui.adviceAdd.has(t.id);
  const box = ([k, l]) => {
    const editing = ui.editingAdvice === t.id + ':' + k;
    return `<details class="adv" ${editing || (adv[k] && ui.wide) ? 'open' : ''}><summary>${l}${adv[k] ? '' : ' <span class="hint">(leer)</span>'}</summary>
      ${
        editing
          ? `<textarea data-adv="${k}" aria-label="${l}">${esc(adv[k])}</textarea>
      <div class="row pad"><button class="btn small primary" data-act="adv-save" data-ref="${k}">Speichern</button><button class="btn small" data-act="adv-cancel">Abbrechen</button></div>`
          : `<div class="body ${adv[k] ? '' : 'none'}">${adv[k] ? esc(adv[k]) : 'noch nicht ausgearbeitet'}</div>
      <div class="row pad"><button class="btn small" data-act="adv-edit" data-ref="${k}">Bearbeiten</button></div>`
      }</details>`;
  };
  const editingEmpty = empty.some(([k]) => ui.editingAdvice === t.id + ':' + k);
  return `<h3>Beratung ${filled.length ? `<small>von Claude</small>` : ''}</h3>
    ${filled.map(box).join('')}
    ${
      empty.length && (showEmpty || editingEmpty)
        ? empty.map(box).join('')
        : empty.length
          ? `<button class="col-more" data-act="advice-add">Beratung ergänzen (${empty.length} ${empty.length === 1 ? 'Feld' : 'Felder'})</button>`
          : ''
    }`;
}

/* ---------- Kosten (docs/changes/007 point 1) ----------
   One row per amount. Tapping a row opens its fields inline - no overlay, no dialog. The status
   moves one step at a time and can go back exactly one step. Estimates that lost against a firm
   row of the same task stay visible as history, greyed out. */

const fmtDay = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '');
const today = () => new Date().toISOString().slice(0, 10);

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
    <div class="row"><label class="lbl">Notiz<input type="text" data-cost-field="note" data-ref="${c.id}" value="${esc(c.note || '')}"></label></div>
    <div class="row">${
      ui.confirm === 'cost-del:' + c.id
        ? `<span class="confirm">Zeile löschen? <button class="btn small danger" data-act="cost-del-yes" data-ref="${c.id}">Ja</button><button class="btn small" data-act="confirm-no">Nein</button></span>`
        : `<button class="btn small danger" data-act="cost-del" data-ref="${c.id}">Zeile löschen</button>`
    }</div>
  </div>`;
}

function costPayHTML(c) {
  return `<div class="cost-form cost-pay">
    <div class="row">
      <label class="lbl">Bezahlt am<input type="date" data-pay="date" value="${esc(c.paid_on || today())}"></label>
      <label class="lbl">von<select data-pay="by">${opts(c.paid_by || state.person, [['S', 'Sebastian'], ['A', 'Anna']])}</select></label>
    </div>
    <div class="row"><label class="lbl">Beleg (Link)${c.tax_relevant ? ' – Pflicht, weil steuerrelevant' : ''}<input type="text" inputmode="url" data-pay="receipt" value="${esc(c.receipt_url || '')}" placeholder="${c.tax_relevant ? 'https://…' : 'optional'}"></label></div>
    <div class="row"><button class="btn small primary" data-act="cost-pay-save" data-ref="${c.id}">Speichern</button><button class="btn small" data-act="cost-pay-cancel">Abbrechen</button></div>
  </div>`;
}

function costHTML(c) {
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
      ${next ? `<button class="btn small" data-act="${next === 'bezahlt' ? 'cost-pay' : 'cost-step'}" data-ref="${c.id}" data-to="${next}">${COST_NEXT[c.status]}</button>` : ''}
      ${back ? `<button class="link back" data-act="cost-step" data-ref="${c.id}" data-to="${back}">zurück auf ${COST_LABEL[back]}</button>` : ''}
    </div>`
    }
  </div>`;
}

/** The rows of one task - used by the Akte and, unchanged, by the Finanzen view (007). */
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
            <div class="row"><button class="btn small primary" data-act="cost-add-save">Hinzufügen</button><button class="btn small" data-act="cost-add-cancel">Abbrechen</button></div>
          </div>`
        : `<button class="col-more" data-act="cost-add">${costsOf(t.id).length ? '+ Kostenzeile' : 'Kosten erfassen'}</button>`
    }`;
}

export function costsHTML(t) {
  const counted = taskAmount(t.id); // the same number the task row shows, history excluded
  const n = costsOf(t.id).length;
  return `<h3>Kosten ${n ? `<small>${n} · ${counted ? (counted.estimated ? '≈ ' : '') + eur(counted.sum) : 'nichts gezählt'}</small>` : ''}</h3>
    ${ui.costHint === t.id ? `<p class="hint-line">Geschätzt → Angebot → beauftragt → fällig → bezahlt – ein Schritt vor, einer zurück.</p>` : ''}
    ${costRowsHTML(t)}`;
}

function fieldsHTML(t) {
  const others = state.tasks.filter((x) => x.id !== t.id && !(t.blocked_by || []).includes(x.id)).sort((a, b) => a.phase - b.phase || a.sort - b.sort);
  return `<h3>Hängt ab von</h3>
    <div class="chips">${
      (t.blocked_by || [])
        .map((id) => {
          const b = byId(id);
          return b
            ? `<span class="chip">${b.done ? '✓ ' : ''}<button class="link-plain" data-act="goto" data-ref="${id}">${esc(b.title.slice(0, 36))}</button><button class="ico" data-act="unblock" data-ref="${id}" aria-label="Abhängigkeit entfernen">×</button></span>`
            : '';
        })
        .join('') || '<span class="empty">keine</span>'
    }</div>
    <div class="row"><select data-act="block-select" aria-label="Abhängigkeit hinzufügen"><option value="">+ Abhängigkeit wählen …</option>${others.map((x) => `<option value="${x.id}">${x.phase} · ${esc(x.title.slice(0, 60))}</option>`).join('')}</select></div>

    <h3>Aufgabe</h3>
    <div class="row">
      <select data-field="owner" aria-label="Zuständig">${opts(t.owner, Object.entries(OWN).filter(([k]) => k !== 'C'))}</select>
      <select data-field="type" aria-label="Typ">${opts(t.type, Object.entries(TYPE))}</select>
      <select data-field="wait_on" aria-label="Wartet auf"><option value="">wartet auf niemanden</option>${opts(t.wait_on || '', [['S', 'wartet auf Sebastian'], ['A', 'wartet auf Anna'], ['C', 'wartet auf Claude']])}</select>
      <span class="row nowrap"><input type="number" inputmode="numeric" data-field="offset_days" value="${t.offset_days}" class="num" aria-label="Tage relativ zum Einzug"><span class="hint">Tage (− vor / + nach Einzug)</span></span>
      <label class="check-label"><input type="checkbox" data-field="critical" ${t.critical ? 'checked' : ''}> fristkritisch</label>
    </div>`;
}

/** Title as text; the pencil opens the field. Used by the panel, the overlay and the row. */
export function titleHTML(t, cls = 'akte-title-text') {
  if (ui.titleEdit === t.id) {
    return `<textarea class="akte-title" data-field="title" rows="${Math.min(4, Math.ceil(t.title.length / 26))}" aria-label="Titel">${esc(t.title)}</textarea>
      <button class="ico" data-act="title-done" aria-label="Titel fertig bearbeiten" title="Fertig">✓</button>`;
  }
  return `<h2 class="${cls}">${esc(t.title)}</h2>
    <button class="ico pencil" data-act="title-edit" data-ref="${t.id}" aria-label="Titel bearbeiten" title="Titel bearbeiten">${ICON.pencil}</button>`;
}

export function detailHTML(t, withHead = true) {
  const more = isMoreOpen(t);
  const claude = t.type === 'claude';
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const del =
    ui.confirm === 'del:' + t.id
      ? `<span class="confirm">Wirklich löschen? <button class="btn small danger" data-act="del-yes">Ja, löschen</button><button class="btn small" data-act="confirm-no">Nein</button></span>`
      : `<button class="btn small danger" data-act="del">Aufgabe löschen</button>`;

  // inline the task row above is the head: checkbox, title and meta appear exactly once (A4)
  const head = !withHead
    ? ''
    : `<div class="akte-top">
      <input type="checkbox" class="check" ${t.done ? 'checked' : ''} ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt">
      ${titleHTML(t)}
    </div>
    <div class="akte-meta">
      <span class="own ${t.owner}">${OWN[t.owner]}</span>
      <span class="due ${dueCls}">${esc(dueLabel(t))}</span>
      ${einzug() ? `<span class="muted">${esc(offsetLabel(t))}</span>` : ''}
      ${t.type !== 'self' ? `<span class="tag ${claude ? 'claude' : ''}">${TYPE[t.type]}</span>` : ''}
      ${t.wait_on && t.wait_on !== state.person ? `<span class="tag">wartet auf ${OWN[t.wait_on]}</span>` : ''}
    </div>
    ${t.wait_on === state.person ? `<p class="wait-banner">Diese Aufgabe wartet auf dich</p>` : ''}`;
  return `<div class="detail ${withHead ? '' : 'nohead'}" data-detail="${t.id}">
    ${head}

    ${more && claude ? delegationHTML(t) : ''}
    ${more && claude ? commentsHTML(t) : ''}
    ${subtasksHTML(t)}
    ${more || costsOf(t.id).length ? costsHTML(t) : ''}
    ${t.id === 'kosten' ? `<p class="row"><button class="link" data-act="fin-recurring">Laufende Kosten öffnen →</button></p>` : ''}
    ${more ? adviceHTML(t) : ''}
    ${more && claude ? '' : commentsHTML(t)}

    <button class="col-more akte-more" data-act="more" aria-expanded="${more}">${more ? '− Weniger anzeigen' : '+ Alle Felder anzeigen'}</button>
    ${more ? fieldsHTML(t) : ''}
    <div class="row akte-foot"><span class="spacer"></span>${del}</div>
  </div>`;
}
