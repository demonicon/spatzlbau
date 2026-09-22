// Detail panel ("Akte") of a task in two weight classes (docs/changes/009).
// Light by default: title, deadline, subtasks, comments – that is the whole task for
// "Kartons besorgen". Dependencies, delegation, advice and the fields sit behind "Mehr".
// Full automatically when the task carries something: delegated to Claude, advice written,
// or dependencies. The state is remembered per task for as long as the app is open.
import { esc, fmtTime } from './dom.js';
import { OWN, TYPE, STEPS, STEP_OWNER, ADV } from './labels.js';
import { state, ui, byId, subsOf, comsOf, dueLabel, offsetLabel, claudeStep, einzug } from '../state.js';
import { isLate, isCritical } from '../filters.js';

const opts = (sel, arr) => arr.map(([v, l]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${l}</option>`).join('');

// does this task carry more than a checkbox?
export const isFull = (t) =>
  t.type === 'claude' || (t.blocked_by || []).length > 0 || ADV.some(([k]) => (t.advice || {})[k]);
export const isMoreOpen = (t) => (ui.more[t.id] === undefined ? isFull(t) : ui.more[t.id]);

function commentsHTML(t) {
  const coms = comsOf(t.id);
  return `<h3>Kommentare ${coms.length ? `<small>${coms.length}</small>` : ''}</h3>
    ${coms.map((c) => `<div class="com ${c.author}"><div class="h"><b>${OWN[c.author] || c.author}</b> · ${fmtTime(c.created_at)}</div>${esc(c.body)}</div>`).join('') || '<div class="empty">Noch keine Kommentare. Kurz notieren, woran es hängt oder was der andere wissen muss.</div>'}
    <textarea data-input="com" placeholder="Kommentar als ${OWN[state.person]}" aria-label="Neuer Kommentar"></textarea>
    <div class="row"><button class="btn primary" data-act="com-add">Kommentar speichern</button></div>`;
}

function subtasksHTML(t) {
  const subs = subsOf(t.id);
  const done = subs.filter((s) => s.done).length;
  return `<h3>Teilschritte ${subs.length ? `<small>${done}/${subs.length}</small>` : ''}</h3>
    ${subs.map((s) => `<div class="sub ${s.done ? 'done' : ''}" data-sub="${s.id}"><input type="checkbox" ${s.done ? 'checked' : ''} data-act="sub-done" aria-label="Teilschritt erledigt"><span>${esc(s.title)}</span><button class="ico" data-act="sub-del" aria-label="Teilschritt löschen">×</button></div>`).join('')}
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

export function detailHTML(t) {
  const more = isMoreOpen(t);
  const claude = t.type === 'claude';
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const del =
    ui.confirm === 'del:' + t.id
      ? `<span class="confirm">Wirklich löschen? <button class="btn small danger" data-act="del-yes">Ja, löschen</button><button class="btn small" data-act="confirm-no">Nein</button></span>`
      : `<button class="btn small danger" data-act="del">Aufgabe löschen</button>`;

  return `<div class="detail" data-detail="${t.id}">
    <div class="akte-top">
      <input type="checkbox" class="check" ${t.done ? 'checked' : ''} data-act="done" aria-label="Erledigt">
      <textarea class="akte-title" data-field="title" rows="${Math.min(4, Math.ceil(t.title.length / 26))}" aria-label="Titel">${esc(t.title)}</textarea>
    </div>
    <div class="akte-meta">
      <span class="own ${t.owner}">${OWN[t.owner]}</span>
      <span class="due ${dueCls}">${esc(dueLabel(t))}</span>
      ${einzug() ? `<span class="muted">${esc(offsetLabel(t))}</span>` : ''}
      ${t.type !== 'self' ? `<span class="tag ${claude ? 'claude' : ''}">${TYPE[t.type]}</span>` : ''}
      ${t.wait_on && t.wait_on !== state.person ? `<span class="tag">wartet auf ${OWN[t.wait_on]}</span>` : ''}
    </div>
    ${t.wait_on === state.person ? `<p class="wait-banner">Diese Aufgabe wartet auf dich</p>` : ''}

    ${more && claude ? delegationHTML(t) : ''}
    ${more && claude ? commentsHTML(t) : ''}
    ${subtasksHTML(t)}
    ${more ? adviceHTML(t) : ''}
    ${more && claude ? '' : commentsHTML(t)}

    <button class="col-more akte-more" data-act="more" aria-expanded="${more}">${more ? '− Weniger anzeigen' : '+ Alle Felder anzeigen'}</button>
    ${more ? fieldsHTML(t) : ''}
    <div class="row akte-foot"><span class="spacer"></span>${del}</div>
  </div>`;
}
