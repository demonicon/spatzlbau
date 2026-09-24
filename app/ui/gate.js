// The gate moment (docs/changes/021, idea 4p): one quiet full-page page when a phase is finished.
// No confetti, no animation worth the name - the point is a breath, not a firework. It belongs to
// each person once: the one who ticked the last box sees it right away, the other one the next
// time they open the app.
import { esc } from './dom.js';
import { state, phases, einzug, anchorDate, dueInfo } from '../state.js';
import { eurShort, isCounted, num } from '../costs.js';

const DAY = 86400000;

/** The three numbers under the gate text: tasks, days, and the money that really left. */
export function gateNumbers(id) {
  const tasks = state.tasks.filter((t) => t.phase === id);
  const dates = tasks.filter(anchorDate).map((t) => dueInfo(t).sort);
  const days = dates.length ? Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / DAY) + 1) : null;
  const ids = new Set(tasks.map((t) => t.id));
  const paid = state.costs
    .filter((c) => ids.has(c.task_id) && c.status === 'bezahlt' && isCounted(c) && c.kind === 'einmalig')
    .reduce((n, c) => n + num(c.amount), 0);
  return { tasks: tasks.length, days, paid };
}

export function gateHTML(id) {
  const list = phases();
  const p = list.find((x) => x.id === id);
  if (!p) return '';
  const next = list.find((x) => x.id === id + 1);
  const n = gateNumbers(id);
  return `<div class="gate-moment" role="dialog" aria-modal="true" aria-labelledby="gate-h">
    <div class="gm-card">
      <p class="gm-eyebrow">Phase ${p.id} geschafft</p>
      <h2 id="gate-h">${esc(p.short || p.name)}</h2>
      ${p.gate ? `<p class="gm-gate">${esc(p.gate)}</p>` : ''}
      <div class="gm-numbers">
        <div><b>${n.tasks}</b><span>${n.tasks === 1 ? 'Aufgabe' : 'Aufgaben'}</span></div>
        ${n.days ? `<div><b>${n.days}</b><span>Tage</span></div>` : ''}
        ${n.paid ? `<div><b>${esc(eurShort(n.paid))}</b><span>bezahlt</span></div>` : ''}
      </div>
      ${
        next
          ? `<p class="gm-next"><span class="l">Als Nächstes</span> Phase ${next.id} – ${esc(next.short || next.name)}${next.gate ? `<span class="s">${esc(firstSentence(next.gate))}</span>` : ''}</p>`
          : `<p class="gm-next"><span class="l">Das war die letzte Phase.</span></p>`
      }
      ${einzug() ? `<p class="gm-foot">Noch ${daysLeft()} ${daysLeft() === 1 ? 'Tag' : 'Tage'} bis zum Einzug.</p>` : ''}
      <div class="row"><button class="btn-primary btn-wide" data-act="gate-next" data-ref="${id}">Weiter</button></div>
    </div>
  </div>`;
}

const firstSentence = (s) => {
  const t = String(s).trim();
  const i = t.indexOf('. ');
  return i > 0 ? t.slice(0, i + 1) : t;
};

function daysLeft() {
  const d = new Date(einzug() + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((d - today) / DAY));
}
