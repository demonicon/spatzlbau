// One task row (list item) as in the design handoff; the detail panel is appended when expanded.
import { esc } from './dom.js';
import { OWN, STEP_LABEL } from './labels.js';
import { ui, blockers, dueInfo, subProgress, comsOf, einzug } from '../state.js';
import { isBlocked, isLate, isCritical } from '../filters.js';
import { detailHTML } from './detail.js';

const fmtShort = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

// due label per design: "überfällig seit n Tagen" / "heute" / "morgen" / "bis 23.09." – relative text without a date
export function dueLabel(t) {
  const du = dueInfo(t);
  if (!einzug()) return du.label;
  const date = new Date(du.sort);
  if (t.done) return fmtShort(date);
  const d = du.diff;
  if (d < 0) return `überfällig seit ${-d} ${-d === 1 ? 'Tag' : 'Tagen'}`;
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  return 'bis ' + fmtShort(date);
}

export function taskHTML(t) {
  const blocked = isBlocked(t);
  const bl = blockers(t);
  const sp = subProgress(t);
  const coms = comsOf(t.id).length;
  const cls = ['task', t.done ? 'done' : '', blocked ? 'blocked' : '', ui.expanded === t.id ? 'open' : ''].join(' ');
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const claude = t.type === 'claude' ? `<span class="tag claude">Claude · ${STEP_LABEL[t.status] || 'Briefing offen'}</span>` : t.type === 'assist' ? `<span class="tag">Claude unterstützt</span>` : '';
  const wait = t.wait_on ? `<span class="tag">wartet auf ${OWN[t.wait_on]}</span>` : '';
  const block = blocked ? `<span class="tag block">blockiert: ${esc(bl[0].title.slice(0, 34))}${bl[0].title.length > 34 ? '…' : ''}${bl.length > 1 ? ' +' + (bl.length - 1) : ''}</span>` : '';
  const subs = sp ? `<span>${sp[0]}/${sp[1]} Teilschritte</span>` : '';
  const com = coms ? `<span class="muted">${coms} ${coms === 1 ? 'Kommentar' : 'Kommentare'}</span>` : '';
  return `<div class="${cls}" data-id="${t.id}">
    <input type="checkbox" class="check" ${t.done ? 'checked' : ''} data-act="done" aria-label="Erledigt">
    <div class="body">
      <button class="t" data-act="open" aria-expanded="${ui.expanded === t.id}">${esc(t.title)}</button>
      <div class="meta"><span class="own ${t.owner}">${OWN[t.owner]}</span><span class="due ${dueCls}">${esc(dueLabel(t))}</span>${subs}${com}${claude}${wait}${block}</div>
    </div>
    ${ui.expanded === t.id ? detailHTML(t) : ''}
  </div>`;
}

export const listHTML = (tasks, empty = 'Nichts hier.') => tasks.map(taskHTML).join('') || `<p class="empty">${empty}</p>`;
