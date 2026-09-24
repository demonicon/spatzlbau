// One task row (list item). Since docs/changes/020 every row follows the same three rules:
// title left with the deadline right, at most one signal chip, and one quiet line for
// everything else. A blocked row cannot be ticked and says what it waits for.
import { esc } from './dom.js';
import { OWN, STEP_TAG } from './labels.js';
import { state, ui, blockers, subProgress, comsOf, unseenComments, dueShort, claudeStep } from '../state.js';
import { isBlocked, isLate, isCritical } from '../filters.js';
import { taskAmount, eurShort } from '../costs.js';
import { term, mark, hitSubs } from '../search.js';
import { detailHTML, titleHTML } from './detail.js';

/** At most one signal per row: overdue beats waiting for me, waiting beats blocked (020). */
export function signalHTML(t) {
  // docs/changes/029b #6: the date next to the title is already red ("seit 1 T.") when late -
  // a second red "überfällig" chip underneath would say the same thing twice
  if (isLate(t)) return '';
  if (!t.done && t.wait_on === state.person) return `<span class="sig-chip waitme">wartet auf dich</span>`;
  const bl = blockers(t);
  if (!t.done && bl.length) {
    // the reason is a link to the blocking task - this is where the dependency graph lives (009)
    // a link, not a button: it navigates to #task=<id>, which the hash router already knows (020)
    return `<span class="sig-chip blocked">wartet auf: <a class="tlink" href="#task=${encodeURIComponent(bl[0].id)}">${esc(bl[0].title)}</a>${bl.length > 1 ? ` <span>+ ${bl.length - 1}</span>` : ''}</span>`;
  }
  return '';
}

/** Everything the row still has to say, in one line, quietly (020).
    The timeline (019) carries the owner as a badge of its own and asks for it to be left out. */
export function quietHTML(t, { owner = true } = {}) {
  const parts = [];
  if (owner) parts.push(esc(OWN[t.owner]));
  if (t.type === 'claude') parts.push(esc(STEP_TAG[claudeStep(t)]));
  else if (t.type === 'assist') parts.push('Claude unterstützt');
  if (t.wait_on && t.wait_on !== state.person) parts.push('wartet auf ' + esc(OWN[t.wait_on]));
  const sp = subProgress(t);
  if (sp) parts.push(`${sp[0]}/${sp[1]} Teilschritte`);
  // one dot per author who wrote something since this person's last visit (009), with the
  // initial so it reads without colour too (013 B4)
  const fresh = [...new Set(unseenComments(t).map((c) => c.author))];
  const coms = comsOf(t.id).length;
  if (coms) {
    const dots = fresh.map((a) => `<span class="ndot ${a}" role="img" aria-label="neu von ${OWN[a] || a}">${a}</span>`).join(' ');
    parts.push(`${dots}${dots ? ' ' : ''}${coms} ${coms === 1 ? 'Kommentar' : 'Kommentare'}${fresh.length ? ', neu' : ''}`);
  }
  // what this task costs, counted like costs_summary: "≈" while it is only an estimate (007)
  const money = taskAmount(t.id);
  if (money) parts.push(`${money.estimated ? '≈ ' : ''}${eurShort(money.sum)}`);
  return parts.join(' · ');
}

export function taskHTML(t) {
  const q = term();
  const blocked = isBlocked(t);
  const open = ui.expanded === t.id;
  const cls = ['task', t.done ? 'done' : '', blocked ? 'blocked' : '', open ? 'open' : '', open && ui.wide ? 'selected' : ''].join(' ');
  const dueCls = isLate(t) ? 'late' : isCritical(t) ? 'crit' : '';
  const sig = signalHTML(t);
  const quiet = quietHTML(t);
  // docs/changes/012: while searching, the hit is bold and a matching subtask becomes a second line
  const subHits = q ? hitSubs(t, q) : [];
  // docs/changes/013 A4: open and inline, this row is the head of the Akte - so the title
  // turns into the heading and carries the pencil; the Akte below has no head of its own
  const inlineHead = open && !ui.wide;
  // docs/changes/020: a blocked task cannot be ticked off - the box is dashed and inert
  const box = `<input type="checkbox" class="check" ${t.done ? 'checked' : ''} ${ui.offline || blocked ? 'disabled' : ''} ${blocked ? 'aria-disabled="true"' : ''} data-act="done" aria-label="${blocked ? 'Erledigt – wartet noch auf eine andere Aufgabe' : 'Erledigt'}">`;
  return `<div class="${cls}" data-id="${t.id}">
    ${box}
    <div class="body">
      ${
        inlineHead
          ? `<div class="task-head">${titleHTML(t, 'akte-title-text t-head')}<button class="ico" data-act="open" aria-label="Akte schließen" aria-expanded="true">×</button></div>`
          : `<div class="t-row"><button class="t" data-act="open" aria-expanded="false">${q ? mark(t.title, q) : esc(t.title)}</button><span class="due ${dueCls}">${esc(dueShort(t))}</span></div>`
      }
      ${subHits.length ? `<div class="sub-hit">${subHits.map((s) => `<span><span class="arr" aria-hidden="true">↳</span> ${mark(s.title, q)}</span>`).join('')}</div>` : ''}
      ${/* docs/changes/017: open and inline, the Akte below says all of this in full - the row
            keeps only the title, so nothing is read twice */ ''}
      ${sig && !inlineHead ? `<div class="sig">${sig}</div>` : ''}
      ${quiet && !inlineHead ? `<div class="quiet">${quiet}</div>` : ''}
    </div>
    ${inlineHead ? detailHTML(t, false) : ''}
  </div>`;
}
