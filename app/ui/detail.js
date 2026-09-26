// Detail panel ("Akte") in two modes (docs/changes/017, replaces the light/full split from 009).
//
// Ansehen is the default and shows text only: empty sections disappear, so a small task is four
// lines and nothing else. Ticking off and commenting stay allowed there - they report the state,
// they do not change the task. Everything else lives behind "Bearbeiten": a mode of its own with
// form fields and a clear end. Fertig writes every changed field in one go, Abbrechen discards.
import { esc, fmtTime } from './dom.js';
import { ladderHTML as ladder } from './ladder.js';
import { OWN, STEPS, STEP_OWNER, ADV, PAID_BY } from './labels.js';
import {
  state, ui, byId, subsOf, comsOf, dueLabel, offsetLabel, claudeStep, umzugstag, dueInfo, anchorDate, freshComments, canEditComment, fmtDay as fmtRunningDay, fmtShort,
  openDecisionsOf, ackedBy, isConfirmedDecision, anfrageOfTask,
} from '../state.js';
import { isLate, isCritical } from '../filters.js';
import { CATEGORIES, STEPS as AF_STEPS, stepIndex } from '../anfragen.js';
import {
  costsOf, isHistory, isCostLate, isCostSoon, eur, num, KIND, APARTMENT, ladderState, refundState,
  LADDER, LADDER_LABEL, REFUND, REFUND_LABEL,
} from '../costs.js';

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

// "Do 24.09." - weekday plus date, no dot after the abbreviation (like finanzen.js's fmtLong)
const fmtWeekDay = (iso) => new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace(/^(\w+)\./, '$1');

// docs/changes/013 B5: only the own comments carry actions - deleting always, editing only
// inside the ten-minute window (RLS allows both for either person; the "own only" limit is
// a rule of the interface)
function commentHTML(c, fresh, decisions = true) {
  const own = c.author === state.person;
  const editing = own && ui.comEdit === c.id;
  const confirming = own && ui.confirm === 'comdel:' + c.id;
  const superseded = c.decision && c.superseded_by;
  const body = editing
    ? `<textarea class="com-edit" aria-label="Kommentar bearbeiten">${esc(c.body)}</textarea>
      <div class="row pad"><button class="btn-secondary" data-act="com-save" data-ref="${c.id}">Speichern</button><button class="btn-text" data-act="com-cancel">Abbrechen</button></div>`
    : superseded
      ? `<s>${esc(c.body)}</s> <span class="tag replaced">ersetzt</span>`
      : esc(c.body);
  // docs/changes/032: a subtle toggle under the own comment, always available (not time-boxed
  // like Bearbeiten) - Claude never authors its own comment as `state.person`, so it never gets
  // this button either, without a special case
  const decisionToggle =
    decisions && own && !editing && !confirming
      ? `<button class="btn-text quiet" data-act="com-decision-toggle" data-ref="${c.id}" aria-pressed="${!!c.decision}">${c.decision ? 'Entscheidung aufheben' : 'Als Entscheidung markieren'}</button>`
      : '';
  const actions =
    own && !editing
      ? confirming
        ? `<div class="com-own-actions"><span class="confirm">Kommentar löschen? <button class="btn-text danger" data-act="com-del-yes" data-ref="${c.id}">Ja</button><button class="btn-secondary" data-act="confirm-no">Nein</button></span></div>`
        : `<div class="com-own-actions">${canEditComment(c) ? `<button class="btn-text" data-act="com-edit" data-ref="${c.id}">Bearbeiten</button>` : ''}<button class="btn-text" data-act="com-del" data-ref="${c.id}">Löschen</button>${decisionToggle}</div>`
      : '';
  // docs/changes/029c #6: der Autor ist derselbe Chip wie Punkt 2 (own.S/.A/.C), nicht mehr nur fett
  // docs/changes/032b #4: eine ersetzte Entscheidung bleibt hier nur am grauen Balken erkennbar,
  // ohne Grund - der violette Grund gehört ausschließlich der aktuell angehefteten Karte
  return `<div class="com ${c.author}${superseded ? ' decision-replaced' : ''}" data-com="${c.id}"><div class="h"><span class="own ${c.author}">${OWN[c.author] || c.author}</span> · ${fmtTime(c.created_at)}${fresh ? ' · <span class="new">neu</span>' : ''}</div>${body}${actions}</div>`;
}

/** docs/changes/032: an open (not yet replaced) decision, pinned above the chronological list.
    032b #1 (Reviewer-Fund 037): nur die erste wartende Karte bekommt den primären Button - bei
    zwei gleichzeitig offenen Entscheidungen auf derselben Aufgabe wäre sonst "Einverstanden"
    zweimal gefüllt zu sehen (Regel: ein Primär je Ansicht). */
function decisionCardHTML(c, primary) {
  const author = OWN[c.author] || c.author;
  const myAck = ackedBy(c, state.person);
  const confirmed = isConfirmedDecision(c);
  const otherOf = (p) => (p === 'S' ? 'A' : 'S');
  const foot = confirmed
    ? (() => {
        const at = new Date(Math.max(new Date(c.ack_s).getTime(), new Date(c.ack_a).getTime())).toISOString();
        return `<div class="dc-confirmed">
          <span class="dc-circles">${['S', 'A']
            .map((p) => `<${p === state.person ? 'button data-act="decision-ack-toggle" data-ref="' + c.id + '"' : 'span'} class="dc-circle ${p}">${p}</${p === state.person ? 'button' : 'span'}>`)
            .join('')}</span>
          <span class="fin-note">bestätigt · ${esc(fmtWeekDay(at))}</span>
        </div>`;
      })()
    : myAck
      ? `<p class="fin-note">wartet auf ${esc(OWN[otherOf(c.author)])}</p>`
      : `<div class="dc-action">
          <span class="sig-chip waitme">wartet auf dich</span>
          <button class="${primary ? 'btn-primary' : 'btn-secondary'}" data-act="decision-ack" data-ref="${c.id}">Einverstanden</button>
        </div>`;
  return `<div class="com decision-card" data-com="${c.id}">
    <div class="dc-head"><span class="dc-tag">◆ ENTSCHEIDUNG · ${esc(author)} · ${esc(fmtWeekDay(c.created_at))}</span><span class="fin-note">angeheftet</span></div>
    <p class="dc-body">${esc(c.body)}</p>
    ${foot}
  </div>`;
}

/** `decisions: false` (033, an anfrage): no pinning, no "Als Entscheidung" - the decision is made
    by "Wählen" and lands on the linked task; the comments there are the way back to Claude. */
export function commentsHTML(t, { decisions = true, placeholder = null } = {}) {
  const coms = comsOf(t.id);
  if (!decisions) {
    const fresh = new Set(freshComments(t).map((c) => c.id));
    return `<h3>Kommentare ${coms.length ? `<small>${coms.length}</small>` : ''}</h3>
      ${coms.map((c) => commentHTML(c, fresh.has(c.id), false)).join('')}
      <textarea data-input="com" placeholder="${esc(placeholder || 'Kommentar …')}" aria-label="Neuer Kommentar"></textarea>
      <div class="row"><button class="btn-secondary" data-act="com-add">Senden</button></div>`;
  }
  const pinned = openDecisionsOf(t).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pinnedIds = new Set(pinned.map((c) => c.id));
  const rest = coms.filter((c) => !pinnedIds.has(c.id));
  const fresh = new Set(freshComments(t).map((c) => c.id));
  const other = state.person === 'S' ? 'A' : 'S';
  const n = fresh.size;
  let primaryUsed = false;
  return `<h3>Kommentare ${coms.length ? `<small>${coms.length}${n ? ` · ${n} neu` : ''}</small>` : ''}
      ${coms.some((c) => c.decision) ? `<button class="btn-text quiet" data-act="entscheidungen-open">Alle Entscheidungen ›</button>` : ''}
    </h3>
    ${pinned
      .map((c) => {
        const waiting = !isConfirmedDecision(c) && !ackedBy(c, state.person);
        const primary = waiting && !primaryUsed;
        if (waiting) primaryUsed = true;
        return decisionCardHTML(c, primary);
      })
      .join('')}
    ${rest.map((c) => commentHTML(c, fresh.has(c.id))).join('')}
    <textarea data-input="com" placeholder="Kommentar an ${OWN[other]} …" aria-label="Neuer Kommentar"></textarea>
    <label class="check-label"><input type="checkbox" data-input="com-decision"> Als Entscheidung festhalten <span class="fin-note">${esc(OWN[other])} bestätigt danach</span></label>
    <div class="row"><button class="btn-secondary" data-act="com-add">Senden</button></div>`;
}

/* ---------- Ansehen ---------- */

// docs/changes/038 #3: eine Kurzform fuer Listen und Tabellen (fmtShort aus state.js), eine
// fuer laufenden Text (fmtRunningDay) - die drei eigenen Formatierer, die hier standen, sind
// weg; der Jahreszusatz der alten `fmtDay` entfaellt mit ihnen (Reviewer-Fund 18).
const fmtDM = (iso) => (iso ? fmtShort(new Date(iso + 'T00:00:00')) : '');
const fmtDay = fmtDM;
// docs/changes/034 (Fund aus 014e): local-calendar string, not toISOString() (UTC, a day early
// east of UTC near Mitternacht)
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const STEP_SENTENCE = {
  briefing: 'Das Briefing geht an Claude, sobald ihr es abschickt.',
  claude: 'Claude arbeitet daran. Ihr seid wieder dran, sobald das Ergebnis vorliegt.',
  ergebnis: 'Das Ergebnis liegt vor – lest es durch und hakt die Aufgabe ab.',
};

const fmtHM = (iso) => (iso ? new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '');

// docs/changes/032b #5: seit 25.09. läuft Claude um 8, 12, 15, 18 und 22 Uhr statt stündlich
const RUN_HOURS = [8, 12, 15, 18, 22];

/** docs/changes/024, Takt seit 032b: die nächste der fünf festen Uhrzeiten, sonst die erste am Folgetag. */
export function nextRunText() {
  const h = new Date().getHours();
  const next = RUN_HOURS.find((x) => x > h);
  return `nächster Lauf um ${String(next ?? RUN_HOURS[0]).padStart(2, '0')}:00`;
}

/** docs/changes/024: wie es um den Takt steht, nur solange etwas dazu zu sagen ist. */
function rhythmHTML(t) {
  if (t.status === 'claude' && t.brief?.requested_at) {
    return `<p class="stand-line quiet">bei Claude seit ${fmtHM(t.brief.requested_at)} · ${nextRunText()}</p>`;
  }
  if (t.status === 'briefing' || !t.status) {
    const last = state.settings.claude_last_run;
    return `<p class="stand-line quiet">Claude arbeitet um 8, 12, 15, 18 und 22 Uhr – oder jetzt mit dem Button${last ? ` · zuletzt ${fmtHM(last)}` : ''}</p>`;
  }
  return '';
}

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
    ${rhythmHTML(t)}
    <div class="row">
      <button class="btn-text" data-act="brief-read" data-ref="${t.id}" aria-expanded="${open}">Briefing lesen ${open ? '›' : '›'}</button>
      ${step === 'claude' ? `<button class="btn-secondary" data-act="accept">Ergebnis übernommen</button>` : ''}
    </div>
    ${open ? `<div class="brief read">${text('goal', 'Ziel') || '<div class="brief-read"><b>Ziel</b><p class="none">noch nicht geschrieben</p></div>'}${text('ctx', 'Kontext & Rahmendaten')}${text('result', 'Ergebnis von Claude')}</div>` : ''}`;
}

/** docs/changes/033: the four rungs of an anfrage - the same .steps bar as "Stand", four wide. */
export function anfrageStepsHTML(a) {
  const idx = stepIndex(a);
  // docs/changes/038 E5/#22: dieselbe Leiter wie bei Posten - Segmente, keine Farbe, die Stufe
  // als Wort daneben (loest die vierstufige .steps-Leiste aus 033 ab)
  return ladder(idx + 1, AF_STEPS.length, AF_STEPS[idx][1], 'Stand der Anfrage: ' + AF_STEPS[idx][1]);
}

/** docs/changes/033: the anfrage linked to this task - or, on the four category tasks, a way to
    start one. Every other task stays as it was. */
function anfrageBlockHTML(t) {
  const a = anfrageOfTask(t.id);
  if (!a) {
    const cat = Object.keys(CATEGORIES).find((k) => CATEGORIES[k].task === t.id);
    return cat ? `<p class="row"><button class="btn-text" data-act="anfrage-create" data-to="${cat}">Anfrage stellen ›</button></p>` : '';
  }
  const step = AF_STEPS[stepIndex(a)][1];
  const small = a.status === 'ergebnis' ? 'Ergebnis da' : step;
  const link = a.status === 'ergebnis' || a.status === 'entschieden' ? 'Ergebnis ansehen ›' : 'Anfrage ansehen ›';
  // docs/changes/038 #23: die Akte zeigt nur die Kurzfassung und den Weg zur Anfrage - die
  // Vergleichstabelle braucht die Breite der Anfrage-Seite, ins Panel 400 passt sie nicht
  const reco = a.brief?.vergleich?.recommendation || '';
  const short = reco ? (/^claude empfiehlt/i.test(reco) ? reco : 'Claude empfiehlt: ' + reco) : '';
  return `<h3>Anfrage <small>${small}</small></h3>
    ${anfrageStepsHTML(a)}
    ${short ? `<p class="vg-reco">${esc(short)}</p>` : ''}
    <p class="row"><button class="btn-text" data-act="anfrage-open" data-ref="${a.id}">${link}</button></p>`;
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
/** One line per cost row, in the words of the three-rung ladder (docs/changes/016b). */
function costLineText(c) {
  const amt = eur(c.amount);
  if (c.kind === 'rueckfluss') {
    return refundState(c) === 'erhalten' ? `${amt} erhalten${c.paid_on ? ' ' + fmtDay(c.paid_on) : ''}` : `${amt} ausstehend`;
  }
  const st = ladderState(c);
  if (st === 'geschaetzt') return `≈ ${amt}`;
  if (st === 'bezahlt') return `${amt} · bezahlt${c.paid_on ? ' ' + fmtDay(c.paid_on) : ''}${c.paid_by ? ', ' + esc(PAID_BY[c.paid_by] || c.paid_by) : ''}`;
  return `${amt} · ${isCostLate(c) ? `überfällig seit ${fmtDay(c.due_on)}` : c.due_on ? `fällig ${fmtDay(c.due_on)}` : 'fest'}`;
}

function costsViewHTML(t) {
  const rows = costsOf(t.id).filter((c) => !isHistory(c));
  if (!rows.length) return '';
  return `<div class="akte-line"><span class="l">Kosten</span><span class="v">${rows.map(costLineText).join('<br>')}</span></div>`;
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
  // docs/changes/029b #9: Akkordeon-Zeilen statt Pillenreihe - nur ein Thema gleichzeitig offen,
  // derselbe ui.advOpen-Zustand wie vorher, nur die Darstellung ist neu
  return `<h3>Beratung <small>von Claude · ${filled.length} ${filled.length === 1 ? 'Thema' : 'Themen'}</small></h3>
    <div class="adv-acc">${filled
      .map(
        ([k, l]) => `<button class="adv-row" data-act="adv-open" data-ref="${t.id}" data-to="${k}" aria-expanded="${openKey === k}"><span class="dchev" aria-hidden="true">${openKey === k ? '▾' : '▸'}</span>${l}</button>
    ${openKey === k && adv[k] ? `<div class="adv-body">${esc(adv[k])}</div>` : ''}`,
      )
      .join('')}</div>`;
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
    ${anfrageBlockHTML(t)}
    ${subtasksViewHTML(t)}
    ${costsViewHTML(t)}
    ${dependsViewHTML(t)}
    ${t.id === 'kosten' ? `<p class="row"><button class="btn-text" data-act="fin-recurring">Laufende Kosten öffnen →</button></p>` : ''}
    ${adviceViewHTML(t)}
    ${commentsHTML(t)}
    <p class="akte-changed">zuletzt geändert ${esc(fmtRunningDay(t.updated_at.slice(0, 10)))}${t.done && t.done_by ? ` · abgehakt von ${OWN[t.done_by]}` : ''}</p>
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
  const goalFilled = !!String(fieldValue(t, 'brief.goal') || '').trim();
  return `<h3>Delegation an Claude <small>Briefing ${filled === 2 ? 'vollständig' : 'unvollständig'} ${filled}/2</small></h3>
    <div class="seg" role="group" aria-label="Stand der Delegation">${STEPS.map(
      ([k, l]) => `<button class="pill" data-act="draft-set" data-field="status" data-to="${k}" aria-pressed="${cur === k}">${l}</button>`,
    ).join('')}${mark(t, 'status')}</div>
    <label class="lbl${markCls(t, 'brief.goal')}"><span class="lbl-h">Ziel – was soll am Ende vorliegen?${mark(t, 'brief.goal')}</span>
      <textarea data-draft="brief.goal" placeholder="z. B. Shortlist mit 3 Umzugsfirmen inkl. Preisrahmen und Verfügbarkeit">${esc(fieldValue(t, 'brief.goal'))}</textarea></label>
    <label class="lbl${markCls(t, 'brief.ctx')}"><span class="lbl-h">Kontext & Rahmendaten${mark(t, 'brief.ctx')}</span>
      <textarea data-draft="brief.ctx" placeholder="z. B. 3-Zimmer + 2-Zimmer, beide 3. OG ohne Aufzug, ~35 m³">${esc(fieldValue(t, 'brief.ctx'))}</textarea></label>
    ${
      cur === 'briefing'
        ? `<div class="row"><button class="btn-secondary" data-act="claude-start" data-ref="${t.id}" ${goalFilled ? '' : 'disabled aria-disabled="true"'}>Claude jetzt starten</button></div>`
        : ''
    }
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

/* ---------- Kosten (docs/changes/007 point 1, ladder rebuilt in 016b) ----------
   Three rungs instead of five: geschätzt (amount unsure) -> fest (amount and date stand) ->
   bezahlt (money is gone). A Rückfluss (a deposit coming back) has its own two rungs: ausstehend
   -> erhalten. The database still has all five status values (angebot/beauftragt/faellig all
   read as "fest"); the app writes only geschaetzt | faellig | bezahlt from here on.
   Three ways into a row: the label opens the full Bearbeiten-Modus (017-style, every field,
   the ladder itself movable in both directions); the one button on the row is the short way
   forward (Betrag festlegen / Bezahlt / Erhalten); amount and due date are tappable in place for
   the one-field correction (Enter speichert, Esc verwirft). */

/** The ladder as three (or two, for a refund) dots and the current word - no learning required. */
export function ladderHTML(c) {
  const steps = c.kind === 'rueckfluss' ? REFUND : LADDER;
  const label = c.kind === 'rueckfluss' ? REFUND_LABEL : LADDER_LABEL;
  const cur = c.kind === 'rueckfluss' ? refundState(c) : ladderState(c);
  const at = steps.indexOf(cur);
  // docs/changes/029b #14: the tier decides the colour, not the kind - "erhalten" reads as
  // "bezahlt" (paid), "ausstehend" as the lowest rung (geschaetzt)
  // docs/changes/038 E5: Segmente statt Glyphen und **keine Farbe** - das nimmt 029b P14
  // (grau -> Tinte -> Gruen) zurueck. Die Stufe steht als Wort daneben, das traegt die
  // Information jetzt allein.
  return ladder(at + 1, steps.length, label[cur], label[cur]);
}

/** Amount, tappable in place unless a form already has this row open (016b). */
function amountFieldHTML(c, editable) {
  if (ui.costQuick && ui.costQuick.id === c.id && ui.costQuick.field === 'amount') {
    return `<input class="cost-quick" type="text" inputmode="decimal" data-quick-field="amount" data-ref="${c.id}" value="${esc(String(num(c.amount)).replace('.', ','))}" aria-label="Betrag in Euro">`;
  }
  const text = `${c.kind === 'rueckfluss' ? '+ ' : ''}${eur(c.amount)}`;
  return editable
    ? `<button class="cost-amount" data-act="cost-quick" data-ref="${c.id}" data-field="amount" aria-label="Betrag ändern: ${esc(text)}">${text}</button>`
    : `<span class="cost-amount">${text}</span>`;
}

/** Due date, tappable in place the same way - only where a date makes sense (fest, ausstehend). */
function dateFieldHTML(c) {
  if (ui.costQuick && ui.costQuick.id === c.id && ui.costQuick.field === 'due_on') {
    return `<input class="cost-quick" type="date" data-quick-field="due_on" data-ref="${c.id}" value="${esc(c.due_on || '')}" aria-label="Fällig am">`;
  }
  const late = isCostLate(c);
  const soon = isCostSoon(c);
  const text = c.due_on ? (late ? `überfällig seit ${fmtDay(c.due_on)}` : `fällig ${fmtDay(c.due_on)}`) : 'ohne Datum';
  return `<button class="due ${late ? 'late' : soon ? 'crit' : ''}" data-act="cost-quick" data-ref="${c.id}" data-field="due_on" aria-label="Fälligkeit ändern: ${esc(text)}">${esc(text)}</button>`;
}

/** The one button a row offers to move forward - never backward (that is Bearbeiten only). */
function costActionHTML(c) {
  if (c.kind === 'rueckfluss') {
    return refundState(c) === 'ausstehend'
      ? `<button class="btn-secondary" data-act="cost-pay" data-ref="${c.id}">Erhalten</button>`
      : `<button class="btn-text" data-act="cost-open" data-ref="${c.id}">ändern</button>`;
  }
  const st = ladderState(c);
  if (st === 'geschaetzt') return `<button class="btn-secondary" data-act="cost-set" data-ref="${c.id}">Betrag festlegen</button>`;
  if (st === 'fest') return `<button class="btn-secondary" data-act="cost-pay" data-ref="${c.id}">Bezahlt</button>`;
  return `<button class="btn-text" data-act="cost-open" data-ref="${c.id}">ändern</button>`;
}

/** "Betrag festlegen": the amount and the date it is due, plus an optional note. */
function costSetHTML(c) {
  const t = c.task_id ? byId(c.task_id) : null;
  // docs/changes/034 (Fund aus 014e): local-calendar string, not toISOString() (UTC, a day early
  // east of UTC near Mitternacht) - dueInfo(t).sort sits at local midnight, converting it through
  // UTC can slip a day
  const dueDate = t && anchorDate(t) ? new Date(dueInfo(t).sort) : null;
  const prefillDue = c.due_on || (dueDate ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}` : '');
  return `<div class="cost-form cost-set">
    <div class="row">
      <label class="lbl">Betrag<input type="text" inputmode="decimal" data-input="set-amount" value="${c.status === 'geschaetzt' && num(c.amount) ? esc(String(num(c.amount)).replace('.', ',')) : ''}" aria-label="Betrag in Euro"></label>
      <label class="lbl">fällig am<input type="date" data-input="set-due" value="${esc(prefillDue)}"></label>
    </div>
    <div class="row"><label class="lbl">Angebot von … <span class="hint">(optional)</span><input type="text" data-input="set-note" value="${esc(c.note || '')}" placeholder="z. B. Umzug Schmidt GmbH"></label></div>
    <div class="row"><button class="btn-secondary" data-act="cost-set-save" data-ref="${c.id}">Speichern</button><button class="btn-text" data-act="cost-set-cancel">Abbrechen</button></div>
  </div>`;
}

/** "Bezahlt" (wer/Datum) or "Erhalten" (Betrag/Datum, Teilbetrag erlaubt) - one question each. */
function costAdvanceHTML(c) {
  if (c.kind === 'rueckfluss') {
    return `<div class="cost-form cost-pay">
      <p class="hint">Erwartet: ${eur(c.amount)}</p>
      <div class="row">
        <label class="lbl">Erhalten<input type="text" inputmode="decimal" data-input="recv-amount" value="${esc(String(num(c.amount)).replace('.', ','))}" aria-label="Erhaltener Betrag in Euro"></label>
        <label class="lbl">am<input type="date" data-input="recv-date" value="${today()}"></label>
      </div>
      <div class="row"><button class="btn-secondary" data-act="cost-recv-save" data-ref="${c.id}">Erhalten buchen</button><button class="btn-text" data-act="cost-pay-cancel">Abbrechen</button></div>
    </div>`;
  }
  const cur = ui.costPayBy || c.paid_by || state.person;
  return `<div class="cost-form cost-pay">
    <div class="lbl">Wer hat bezahlt?
      <div class="seg" role="group" aria-label="Wer hat bezahlt">${Object.entries(PAID_BY)
        .map(([k, l]) => `<button class="pill" data-act="pay-by-set" data-to="${k}" aria-pressed="${cur === k}">${k === state.person ? 'du' : l}</button>`)
        .join('')}</div>
    </div>
    <div class="row"><label class="lbl">am<input type="date" data-input="pay-date" value="${today()}"></label></div>
    <div class="row"><button class="btn-secondary" data-act="cost-pay-save" data-ref="${c.id}" data-by="${cur}">Bezahlt buchen</button><button class="btn-text" data-act="cost-pay-cancel">Abbrechen</button></div>
  </div>`;
}

/* ---------- the draft (mirrors 017 exactly, keyed by cost id instead of task id) ---------- */

export const costDraftOf = (c) => (ui.costDraft && ui.costDraft.id === c.id ? ui.costDraft.fields : {});
export const costDraftCount = (c) => Object.keys(costDraftOf(c)).length;
export function costFieldValue(c, key) {
  const d = costDraftOf(c);
  return key in d ? d[key] : c[key];
}
const costChanged = (c, key) => key in costDraftOf(c);
const cmark = (c, key) => (costChanged(c, key) ? ' <span class="changed">geändert</span>' : '');
const cmarkCls = (c, key) => (costChanged(c, key) ? ' is-changed' : '');

/** The full Bearbeiten-Modus of one cost row: every field, the ladder movable both ways. */
export function costEditHTML(c) {
  const n = costDraftCount(c);
  const other = state.person === 'S' ? 'A' : 'S';
  const asking = ui.confirm === 'cost-cancel:' + c.id;
  const steps = c.kind === 'rueckfluss' ? REFUND : LADDER;
  const label = c.kind === 'rueckfluss' ? REFUND_LABEL : LADDER_LABEL;
  const cur = c.kind === 'rueckfluss' ? refundState({ status: costFieldValue(c, 'status') }) : ladderState({ status: costFieldValue(c, 'status') });
  const statusFor = (want) => (c.kind === 'rueckfluss' ? { ausstehend: 'faellig', erhalten: 'bezahlt' }[want] : { geschaetzt: 'geschaetzt', fest: 'faellig', bezahlt: 'bezahlt' }[want]);
  const more = ui.costMore === c.id;
  const tasks = state.tasks.slice().sort((a, b) => a.phase - b.phase || a.sort - b.sort);
  const del =
    ui.confirm === 'costdel:' + c.id
      ? `<span class="confirm">Kostenzeile löschen? <button class="btn-text danger" data-act="cost-del-yes" data-ref="${c.id}">Ja</button><button class="btn-secondary" data-act="confirm-no">Nein</button></span>`
      : `<button class="btn-text danger" data-act="cost-del" data-ref="${c.id}">Kostenzeile löschen</button>`;
  return `<div class="cost-edit" data-cost-edit="${c.id}">
    <div class="edit-bar on-ink">
      <button class="btn-text" data-act="cost-cancel" data-ref="${c.id}">Abbrechen</button>
      <b>Kostenzeile bearbeiten</b>
      <button class="btn-primary" data-act="cost-done" data-ref="${c.id}">Fertig</button>
    </div>
    ${
      asking
        ? `<p class="edit-hint ask">${n} ${n === 1 ? 'Änderung' : 'Änderungen'} verwerfen?
            <button class="btn-text danger" data-act="cost-discard" data-ref="${c.id}">Ja, verwerfen</button>
            <button class="btn-secondary" data-act="confirm-no">Nein</button></p>`
        : `<p class="edit-hint">${n ? `${n} ungespeicherte ${n === 1 ? 'Änderung' : 'Änderungen'} · ${OWN[other]} sieht sie erst nach „Fertig“` : `Noch nichts geändert · ${OWN[other]} sieht Änderungen erst nach „Fertig“`}</p>`
    }
    <label class="lbl${cmarkCls(c, 'label')}"><span class="lbl-h">Bezeichnung${cmark(c, 'label')}</span>
      <input type="text" data-cost-draft="label" value="${esc(costFieldValue(c, 'label'))}" aria-label="Bezeichnung"></label>
    <div class="row">
      <label class="lbl${cmarkCls(c, 'amount')}"><span class="lbl-h">Betrag${cmark(c, 'amount')}</span>
        <input type="text" inputmode="decimal" data-cost-draft="amount" value="${esc(String(num(costFieldValue(c, 'amount'))).replace('.', ','))}" aria-label="Betrag in Euro"></label>
      <label class="lbl${cmarkCls(c, 'due_on')}"><span class="lbl-h">fällig am${cmark(c, 'due_on')}</span>
        <input type="date" data-cost-draft="due_on" value="${esc(costFieldValue(c, 'due_on') || '')}"></label>
    </div>
    <div class="lbl">Stand${cmark(c, 'status')}
      <div class="seg stand-seg" role="group" aria-label="Stand">${steps
        .map((k) => `<button class="pill" data-act="cost-draft-status" data-ref="${c.id}" data-to="${statusFor(k)}" aria-pressed="${cur === k}">${label[k]}</button>`)
        .join('')}</div>
    </div>
    <div class="row">
      <div class="lbl">${c.kind === 'rueckfluss' ? 'Wer hat es bekommen?' : 'Wer hat bezahlt?'}${cmark(c, 'paid_by')}
        <div class="seg" role="group" aria-label="Wer">${Object.entries(PAID_BY)
          .filter(([k]) => k !== 'H' || c.kind !== 'rueckfluss')
          .map(([k, l]) => `<button class="pill" data-act="cost-draft-set" data-ref="${c.id}" data-field="paid_by" data-to="${k}" aria-pressed="${costFieldValue(c, 'paid_by') === k}">${l}</button>`)
          .join('')}</div>
      </div>
      <label class="lbl${cmarkCls(c, 'paid_on')}"><span class="lbl-h">${c.kind === 'rueckfluss' ? 'erhalten am' : 'bezahlt am'}${cmark(c, 'paid_on')}</span>
        <input type="date" data-cost-draft="paid_on" value="${esc(costFieldValue(c, 'paid_on') || '')}"></label>
    </div>
    <label class="lbl${cmarkCls(c, 'task_id')}"><span class="lbl-h">Aufgabe${cmark(c, 'task_id')}</span>
      <select data-cost-draft="task_id"><option value="">keine Aufgabe</option>${tasks
        .map((x) => `<option value="${x.id}" ${costFieldValue(c, 'task_id') === x.id ? 'selected' : ''}>${x.phase} · ${esc(x.title.slice(0, 60))}</option>`)
        .join('')}</select></label>
    ${
      more
        ? `<div class="row">
            <label class="lbl">Wohnung<select data-cost-draft="apartment"><option value="">keine</option>${opts(costFieldValue(c, 'apartment') || '', Object.entries(APARTMENT))}</select></label>
            <label class="lbl">Art<select data-cost-draft="kind">${opts(costFieldValue(c, 'kind'), Object.entries(KIND))}</select></label>
          </div>
          <div class="row">
            <label class="lbl">Gehört zu<select data-cost-draft="belongs_to">${opts(costFieldValue(c, 'belongs_to'), [['B', 'gemeinsam'], ['S', OWN.S], ['A', OWN.A]])}</select></label>
            <label class="lbl">Anteil ${OWN.S} in %<input type="text" inputmode="numeric" data-cost-draft="split_s" value="${costFieldValue(c, 'split_s') ?? ''}" placeholder="Standard"></label>
          </div>
          <label class="check-label"><input type="checkbox" data-cost-draft="tax_relevant" ${costFieldValue(c, 'tax_relevant') ? 'checked' : ''}> steuerrelevant</label>
          <label class="lbl">Beleg (Link)<input type="text" inputmode="url" data-cost-draft="receipt_url" value="${esc(costFieldValue(c, 'receipt_url') || '')}" placeholder="optional"></label>
          <button class="btn-text row mehr-link" data-act="cost-more" data-ref="${c.id}">− weniger</button>`
        : `<button class="btn-text row mehr-link" data-act="cost-more" data-ref="${c.id}">mehr: Wohnung, gehört zu, Anteil, steuerrelevant, Beleg</button>`
    }
    <div class="row cost-edit-foot"><span class="spacer"></span>${del}</div>
  </div>`;
}

export function costHTML(c) {
  const open = ui.costEdit === c.id;
  const setting = ui.costSet === c.id;
  const paying = ui.costPay === c.id;
  const late = isCostLate(c);
  return `<div class="cost ${isHistory(c) ? 'history' : ''} ${open ? 'open' : ''}" data-cost="${c.id}">
    <div class="cost-row">
      <button class="cost-label" data-act="cost-open" data-ref="${c.id}" aria-expanded="${open}">${esc(c.label)}</button>
      ${amountFieldHTML(c, !open && !setting && !paying)}
    </div>
    <div class="cost-meta">
      ${ladderHTML(c)}
      ${c.status === 'bezahlt' && c.paid_on ? `<span class="cost-paid">· ${fmtDM(c.paid_on)}</span>` : ''}
      ${c.due_on && c.status !== 'bezahlt' && !open && !setting && !paying ? dateFieldHTML(c) : ''}
      ${c.apartment ? `<span class="tag">${APARTMENT[c.apartment]}</span>` : ''}
      ${c.tax_relevant ? `<span class="tag">steuerrelevant</span>` : ''}
      ${c.paid_by && c.status === 'bezahlt' ? `<span class="own ${c.paid_by}">${PAID_BY[c.paid_by] || c.paid_by}</span>` : ''}
    </div>
    ${!open && !setting && !paying ? `<div class="cost-actions">${costActionHTML(c)}</div>` : ''}
    ${setting ? costSetHTML(c) : ''}
    ${paying ? costAdvanceHTML(c) : ''}
    ${open ? costEditHTML(c) : ''}
  </div>`;
}

export function costRowsHTML(t, filter = () => true) {
  const rows = costsOf(t.id).filter(filter);
  const adding = ui.costAdd === t.id;
  return `${rows.map(costHTML).join('')}
    ${adding ? costNewHTML(t.id) : `<button class="btn-text row" data-act="cost-add" data-ref="${t.id}">+ Posten</button>`}`;
}

/** Anlegen - two required fields, the rest inferred or behind "mehr" (docs/changes/016b §2b). */
export function costNewHTML(taskId) {
  const t = taskId ? byId(taskId) : null;
  const tasks = state.tasks.slice().sort((a, b) => a.phase - b.phase || a.sort - b.sort);
  const more = ui.costNewMore;
  return `<div class="cost-form cost-new">
    <div class="row"><label class="lbl">Was?<input type="text" data-input="cost-label" placeholder="z. B. Kartons" aria-label="Bezeichnung"></label></div>
    <div class="row"><label class="lbl">Wieviel?<input type="text" inputmode="decimal" data-input="cost-amount" placeholder="180" aria-label="Betrag in Euro"></label></div>
    <label class="lbl">Aufgabe<select data-input="cost-task">${t ? `<option value="${t.id}" selected>${t.phase} · ${esc(t.title.slice(0, 60))}</option>` : ''}<option value="" ${t ? '' : 'selected'}>keine Aufgabe</option>${tasks
      .filter((x) => x.id !== taskId)
      .map((x) => `<option value="${x.id}">${x.phase} · ${esc(x.title.slice(0, 60))}</option>`)
      .join('')}</select></label>
    ${
      more
        ? `<div class="row">
            <label class="lbl">Wohnung<select data-input="cost-apartment"><option value="">keine</option>${opts('', Object.entries(APARTMENT))}</select></label>
            <label class="lbl">Art<select data-input="cost-kind">${opts('einmalig', Object.entries(KIND))}</select></label>
          </div>
          <div class="row">
            <label class="lbl">Gehört zu<select data-input="cost-belongs">${opts('B', [['B', 'gemeinsam'], ['S', OWN.S], ['A', OWN.A]])}</select></label>
            <label class="lbl">Anteil ${OWN.S} in %<input type="text" inputmode="numeric" data-input="cost-split" placeholder="Standard"></label>
          </div>
          <label class="check-label"><input type="checkbox" data-input="cost-tax"> steuerrelevant</label>
          <button class="btn-text row mehr-link" data-act="cost-new-more">− weniger</button>`
        : `<button class="btn-text row mehr-link" data-act="cost-new-more">mehr: Wohnung, gehört zu, Anteil, steuerrelevant</button>`
    }
    <div class="row"><button class="btn-secondary" data-act="cost-add-save">Anlegen</button><button class="btn-text" data-act="cost-add-cancel">Abbrechen</button></div>
  </div>`;
}

export function costsHTML(t) {
  const n = costsOf(t.id).length;
  return `<h3>Kosten ${n ? `<small>${n}</small>` : ''}</h3>
    ${costRowsHTML(t)}`;
}

/** Title as plain text - editing it is a mode of its own since 017. */
/** Title as plain text - editing it is a mode of its own since 017. */
export function titleHTML(t, cls = 'akte-title-text') {
  return `<h2 class="${cls}">${esc(t.title)}</h2>`;
}

export function detailHTML(t, withHead = true) {
  return ui.akteEdit === t.id ? editHTML(t, withHead) : viewHTML(t, withHead);
}
