// One task row (list item) as in the design handoff; the detail panel is appended when expanded.
import { esc } from './dom.js';
import { OWN, STEP_TAG } from './labels.js';
import { state, ui, blockers, subProgress, comsOf, unseenComments, dueLabel, claudeStep } from '../state.js';
import { isBlocked, isLate, isCritical } from '../filters.js';
import { taskAmount, eurShort } from '../costs.js';
import { term, mark, hitSubs } from '../search.js';
import { detailHTML } from './detail.js';

export function taskHTML(t) {
  const q = term();
  const blocked = isBlocked(t);
  const bl = blockers(t);
  const sp = subProgress(t);
  const coms = comsOf(t.id).length;
  const open = ui.expanded === t.id;
  const cls = ['task', t.done ? 'done' : '', blocked ? 'blocked' : '', open ? 'open' : '', open && ui.wide ? 'selected' : ''].join(' ');
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const claude = t.type === 'claude' ? `<span class="tag claude">${STEP_TAG[claudeStep(t)]}</span>` : t.type === 'assist' ? `<span class="tag">Claude unterstützt</span>` : '';
  // docs/changes/009: what waits for the logged-in person is the loudest thing in the row
  const wait = t.wait_on
    ? t.wait_on === state.person
      ? `<span class="tag wait-me">wartet auf dich</span>`
      : `<span class="tag">wartet auf ${OWN[t.wait_on]}</span>`
    : '';
  // docs/changes/009: the reason is a link to the blocking task – this is where the dependency graph lives
  const block = blocked
    ? `<button class="tag block" data-act="goto" data-ref="${esc(bl[0].id)}">blockiert: ${esc(bl[0].title.slice(0, 34))}${bl[0].title.length > 34 ? '…' : ''}${bl.length > 1 ? ' +' + (bl.length - 1) : ''}</button>`
    : '';
  const subs = sp ? `<span>${sp[0]}/${sp[1]} Teilschritte</span>` : '';
  // what this task costs, counted like costs_summary: "≈" while it is only an estimate (007)
  const money = taskAmount(t.id);
  const cost = money ? `<span class="cost-badge">${money.estimated ? '≈ ' : ''}${eurShort(money.sum)}</span>` : '';
  const com = coms ? `<span class="muted">${coms} ${coms === 1 ? 'Kommentar' : 'Kommentare'}</span>` : '';
  // docs/changes/009: one dot per author who wrote something since this person's last visit;
  // it goes away as soon as the task is opened
  const dots = [...new Set(unseenComments(t).map((c) => c.author))]
    .map((a) => `<span class="ndot ${a}" role="img" aria-label="neuer Kommentar von ${OWN[a] || a}"></span>`)
    .join('');
  // docs/changes/012: while searching, the hit is bold and a matching subtask becomes a second line
  const subHits = q ? hitSubs(t, q) : [];
  return `<div class="${cls}" data-id="${t.id}">
    <input type="checkbox" class="check" ${t.done ? 'checked' : ''} ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt">
    <div class="body">
      <button class="t" data-act="open" aria-expanded="${ui.expanded === t.id}">${q ? mark(t.title, q) : esc(t.title)}</button>
      ${subHits.length ? `<div class="sub-hit">${subHits.map((s) => `<span><span class="arr" aria-hidden="true">↳</span> ${mark(s.title, q)}</span>`).join('')}</div>` : ''}
      <div class="meta"><span class="own ${t.owner}">${OWN[t.owner]}</span><span class="due ${dueCls}">${esc(dueLabel(t))}</span>${subs}${com}${dots}${cost}${claude}${wait}${block}</div>
    </div>
    ${open && !ui.wide ? detailHTML(t) : ''}
  </div>`;
}
