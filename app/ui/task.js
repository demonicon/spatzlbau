// One task row (list item) incl. meta chips; the detail panel is appended when expanded.
import { esc } from './dom.js';
import { OWN, STEP_LABEL } from './labels.js';
import { ui, blockers, dueInfo, subProgress, comsOf } from '../state.js';
import { detailHTML } from './detail.js';

export function taskHTML(t) {
  const du = dueInfo(t);
  const bl = blockers(t);
  const sp = subProgress(t);
  const coms = comsOf(t.id).length;
  const cls = ['task', t.done ? 'done' : '', bl.length && !t.done ? 'blocked' : '', ui.expanded === t.id ? 'open' : ''].join(' ');
  const wait = t.wait_on ? `<span class="tag wait">wartet auf ${OWN[t.wait_on]}</span>` : '';
  const cl =
    t.type === 'claude'
      ? `<span class="tag claude">Claude · ${STEP_LABEL[t.status] || 'Briefing offen'}</span>`
      : t.type === 'assist'
        ? `<span class="tag">Claude unterstützt</span>`
        : '';
  const blk =
    bl.length && !t.done
      ? `<span class="tag block">blockiert: ${esc(bl[0].title.slice(0, 40))}${bl.length > 1 ? ' +' + (bl.length - 1) : ''}</span>`
      : '';
  const subs = sp ? `<span>${sp[0]}/${sp[1]} Teilschritte</span>` : '';
  const com = coms ? `<span>💬 ${coms}</span>` : '';
  return `<div class="${cls}" data-id="${t.id}">
    <input type="checkbox" ${t.done ? 'checked' : ''} data-act="done" aria-label="Erledigt">
    <div class="body">
      <button class="t" data-act="open" aria-expanded="${ui.expanded === t.id}">${esc(t.title)}</button>
      <div class="meta"><span class="own ${t.owner}">${OWN[t.owner]}</span><span class="due ${du.cls}">${du.label}</span>${subs}${com}${cl}${wait}${blk}</div>
    </div>
    <button class="ico${t.critical ? ' on' : ''}" data-act="crit" title="Fristkritisch" aria-pressed="${t.critical}" aria-label="Fristkritisch">${t.critical ? '★' : '☆'}</button>
    ${ui.expanded === t.id ? detailHTML(t) : ''}
  </div>`;
}

export const listHTML = (tasks, empty = 'Nichts hier.') => tasks.map(taskHTML).join('') || `<div class="empty">${empty}</div>`;
