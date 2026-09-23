// Timeline (docs/changes/019, variant 3b): every open task in the order it comes due, with the
// five phases as rails beside it. It is a list, not a chart - full titles, one row per task,
// tick it off where you read it. Dragging a deadline is not possible here on purpose: deadlines
// change in "Bearbeiten" (017), and Ansehen and Bearbeiten stay apart.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, phases, einzug, umzugstag, dueInfo, anchorDate } from '../state.js';
import { isLate } from '../filters.js';
import { signalHTML, quietHTML } from '../ui/task.js';
import { detailHTML } from '../ui/detail.js';
import { isHit, term } from '../search.js';

const DAY = 86400000;

const dayStart = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const fmtDay = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const fmtWd = (d) => d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
const fmtMonth = (d) => d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }).toUpperCase();

/** T−92: days from the move-in date, whatever a task is anchored to. Null without a date. */
export function tOffset(at) {
  const base = einzug();
  if (!base) return null;
  const n = Math.round((dayStart(at) - dayStart(new Date(base + 'T00:00:00'))) / DAY);
  return n === 0 ? 'T±0' : n < 0 ? `T−${-n}` : `T+${n}`;
}

/** Which tasks the timeline shows: open ones (overdue included), never the ticked-off ones. */
export function rows() {
  const q = term();
  return state.tasks
    .filter((t) => !t.done && anchorDate(t))
    .filter((t) => (ui.tlPhase === null || t.phase === ui.tlPhase) && (!q || isHit(t, q)))
    .filter((t) => ui.tlOwner === 'all' || (ui.tlOwner === 'me' ? t.owner === state.person : ui.tlOwner === 'B' ? t.owner === 'B' : t.owner !== state.person && t.owner !== 'B'))
    .map((t) => ({ t, at: new Date(dueInfo(t).sort) }))
    .sort((a, b) => a.at - b.at || a.t.sort - b.t.sort);
}

/** First and last due day of each phase - the ends of its rail. Phases without a task have none. */
export function rails(list = rows()) {
  const out = new Map();
  for (const { t, at } of list) {
    const r = out.get(t.phase);
    if (!r) out.set(t.phase, { from: at.getTime(), to: at.getTime() });
    else {
      r.from = Math.min(r.from, at.getTime());
      r.to = Math.max(r.to, at.getTime());
    }
  }
  return out;
}

/** The five rail cells next to one row: a line where the phase runs, a dot on its own row. */
function railHTML(phase, at, rl, list) {
  return phases()
    .map((p) => {
      const r = rl.get(p.id);
      const time = at.getTime();
      const on = r && time >= r.from && time <= r.to;
      const dot = p.id === phase;
      // the diamond marks the end of a rail: the last deadline of that phase
      const gate = r && time === r.to && list.some((x) => x.t.phase === p.id && x.at.getTime() === r.to);
      return `<span class="rail r${p.id} ${on ? 'on' : ''}">${dot ? `<i class="dot"></i>` : ''}${gate && dot ? `<i class="gate">◆</i>` : ''}</span>`;
    })
    .join('');
}

function rowHTML({ t, at }, rl, list) {
  const late = isLate(t);
  const sig = signalHTML(t);
  const quiet = quietHTML(t, { owner: false });
  const ph = phases().find((p) => p.id === t.phase);
  const open = ui.expanded === t.id;
  const moved = t.anchor === 'umzugstag' && umzugstag();
  return `<div class="tl-row ${late ? 'late' : ''} ${open ? 'open' : ''}" data-id="${t.id}">
    <div class="tl-when">
      <b>${esc(fmtDay(at))}</b>
      <span>${esc(fmtWd(at))}${moved ? ' · Umzug' : ''}</span>
      <span class="t">${esc(tOffset(at) || '')}</span>
    </div>
    <div class="tl-rails" aria-hidden="true">${railHTML(t.phase, at, rl, list)}</div>
    <div class="tl-body">
      <input type="checkbox" class="check" ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt">
      <div class="tl-main">
        <button class="t" data-act="open" aria-expanded="${open}">${esc(t.title)}</button>
        <span class="own ${t.owner}">${OWN[t.owner]}</span>
        ${sig ? `<div class="sig">${sig}</div>` : ''}
        <div class="quiet">Phase ${t.phase}${ph ? ' · ' + esc(ph.short || ph.name) : ''}${quiet ? ' · ' + quiet : ''}</div>
      </div>
    </div>
    ${open ? detailHTML(t, false) : ''}
  </div>`;
}

/** The gate line under the last row of a phase: what has to be true before it is over. */
function gateLineHTML(p) {
  return `<div class="tl-gate"><span class="d" aria-hidden="true">◆</span><span>Gate Phase ${p.id}${p.gate ? ' · ' + esc(p.gate) : ''}</span></div>`;
}

export function timelineHTML() {
  const list = rows();
  const rl = rails(list);
  const today = dayStart();
  const doneCount = state.tasks.filter((t) => t.done).length;
  const ps = phases();
  const chip = (val, label, on, act) => `<button class="pill" data-act="${act}" data-to="${val}" aria-pressed="${on}">${esc(label)}</button>`;

  let out = '';
  let month = '';
  let todayDrawn = false;
  const lastOf = new Map(); // phase -> time of its last row, for the gate line
  const gateDrawn = new Set();
  for (const { t, at } of list) lastOf.set(t.phase, at.getTime());

  for (const row of list) {
    // the today marker sits between the last overdue row and the first coming one
    if (!todayDrawn && row.at >= today) {
      out += todayHTML(today);
      todayDrawn = true;
    }
    const m = fmtMonth(row.at);
    if (m !== month) {
      month = m;
      out += `<div class="tl-month">${esc(month)}</div>`;
    }
    out += rowHTML(row, rl, list);
    const p = ps.find((x) => x.id === row.t.phase);
    // the gate line comes once, under the last row of its phase - several tasks can share that day
    if (p && !gateDrawn.has(p.id) && lastOf.get(row.t.phase) === row.at.getTime()) {
      gateDrawn.add(p.id);
      out += gateLineHTML(p);
    }
  }
  if (!todayDrawn) out += todayHTML(today);

  return `<section class="timeline" aria-label="Timeline">
    <div class="tl-filters">
      <div class="pchips" role="group" aria-label="Phase">
        ${chip('all', 'alle Phasen', ui.tlPhase === null, 'tl-phase')}
        ${ps.map((p) => chip(p.id, p.id + ' ' + (p.short || p.name), ui.tlPhase === p.id, 'tl-phase')).join('')}
      </div>
      <div class="pchips" role="group" aria-label="Wessen Aufgaben">
        ${chip('all', 'alle', ui.tlOwner === 'all', 'tl-owner')}
        ${chip('me', 'Du', ui.tlOwner === 'me', 'tl-owner')}
        ${chip('B', 'Gemeinsam', ui.tlOwner === 'B', 'tl-owner')}
        ${chip('you', OWN[state.person === 'S' ? 'A' : 'S'], ui.tlOwner === 'you', 'tl-owner')}
        <button class="pill" data-act="tl-today">Heute</button>
      </div>
    </div>
    ${einzug() ? `<p class="tl-note">Tag 0 ist der Einzug am ${esc(fmtDay(new Date(einzug() + 'T00:00:00')))}${umzugstag() && umzugstag() !== einzug() ? ` · Umzug am ${esc(fmtDay(new Date(umzugstag() + 'T00:00:00')))}` : ''}.</p>` : ''}
    ${list.length ? out : `<p class="empty">${term() ? 'Kein Treffer in dieser Auswahl.' : 'Nichts offen in dieser Auswahl.'}</p>`}
    ${
      doneCount
        ? ui.tlDone
          ? `<div class="tl-done">${state.tasks
              .filter((t) => t.done && anchorDate(t))
              .sort((a, b) => dueInfo(a).sort - dueInfo(b).sort)
              .map((t) => `<div class="tl-row done" data-id="${t.id}"><div class="tl-when"><b>${esc(fmtDay(new Date(dueInfo(t).sort)))}</b></div><div class="tl-rails" aria-hidden="true"></div><div class="tl-body"><input type="checkbox" class="check" checked ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt"><div class="tl-main"><button class="t" data-act="open">${esc(t.title)}</button></div></div></div>`)
              .join('')}
            <button class="btn-text row" data-act="tl-done">erledigte ausblenden</button></div>`
          : `<button class="btn-text row" data-act="tl-done">${doneCount} erledigte zeigen</button>`
        : ''
    }
  </section>`;
}

function todayHTML(today) {
  return `<div class="tl-today" id="tl-today"><span class="l">Heute</span><span class="d">${esc(fmtDay(today))}</span></div>`;
}
