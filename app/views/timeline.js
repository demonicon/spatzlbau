// Timeline (docs/changes/019, variant 3b; layout 019c against the export "3b · Handy 380"): every
// open task in the order it comes due, with the five phases as rails beside it. It is a list, not
// a chart - full titles, two lines per task, tick it off where you read it. Dragging a deadline is
// not possible here on purpose: deadlines change in "Bearbeiten" (017).
//
// Every entry of the list - month, today, Einzug, task, gate - is one row of the same grid: date
// on the left, the five rails in the middle, the content on the right. So the rails run through
// all of them without a gap, and a phase's line ends in the diamond of its gate row.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, phases, einzug, umzugstag, dueInfo, anchorDate, blockers, subProgress, comsOf, openDecisionsOf, ackedBy, fmtShort } from '../state.js';
import { isLate, isCritical } from '../filters.js';
import { filterPillsHTML } from '../pages/listPanel.js';
import { detailHTML } from '../ui/detail.js';
import { isHit, term } from '../search.js';
import { taskAmount, eurShort } from '../costs.js';

const DAY = 86400000;

const dayStart = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const fmtWd = (d) => d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
const fmtMonth = (d) => d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const fmtFull = (d) => d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/^(\w+)\./, '$1');

/** T−92: days from the move-in date, whatever a task is anchored to; the day itself is "Tag 0". */
export function tOffset(at) {
  const base = einzug();
  if (!base) return null;
  const n = Math.round((dayStart(at) - dayStart(new Date(base + 'T00:00:00'))) / DAY);
  return n === 0 ? 'Tag 0' : n < 0 ? `T−${-n}` : `T+${n}`;
}

/** Which tasks the timeline shows: open ones (overdue included), never the ticked-off ones. */
export function rows() {
  const q = term();
  return state.tasks
    .filter((t) => !t.done && anchorDate(t))
    .filter((t) => (ui.phase === null || t.phase === ui.phase) && (!q || isHit(t, q)))
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

/** The five lanes of one row: a line where the phase runs on that day, a dot on the task's own
    lane (in the owner's colour), a diamond where the phase ends (its gate row). */
function railHTML(time, rl, { dot = null, owner = '', gate = null } = {}) {
  return `<div class="tl-rails" aria-hidden="true">${phases()
    .map((p) => {
      const r = rl.get(p.id);
      const on = r && time >= r.from && time <= r.to;
      const cls = ['rail', 'r' + p.id, on ? 'on' : '', gate === p.id ? 'end' : ''].join(' ');
      return `<span class="${cls}">${dot === p.id ? `<i class="dot ${owner}"></i>` : ''}${gate === p.id ? '<i class="gate"></i>' : ''}</span>`;
    })
    .join('')}</div>`;
}

/** The one signal of a row (020), in the words of the export: overdue since, waiting for you,
    due today, fristkritisch. Being blocked is not a chip here - it sits in the meta line. */
function signalHTML(t, at) {
  if (isLate(t)) {
    const n = Math.round((dayStart() - dayStart(at)) / DAY);
    return `<span class="tl-sig late">seit ${n} T. überfällig</span>`;
  }
  // docs/changes/032: an open decision without my own tick waits the same way wait_on does
  if (t.wait_on === state.person || openDecisionsOf(t).some((c) => !ackedBy(c, state.person))) return `<span class="tl-sig waitme">wartet auf dich</span>`;
  if (dayStart(at).getTime() === dayStart().getTime()) return `<span class="tl-sig crit">heute</span>`;
  // docs/changes/029c #5: kein eigener "kritisch"-Chip mehr - das Datum selbst wird gelb (wie in
  // den Spalten, .tl-row.crit .tl-when b), damit Spalten und Timeline dasselbe Signal zeigen
  return '';
}

/** "Phase 2 · wartet auf 2 › · 0/4 Teilschritte · 1 Kommentar" - at most two quiet facts after
    the phase, plus the amount when the task carries a cost row (019c §5). */
function metaHTML(t) {
  const bl = blockers(t);
  const parts = [`Phase ${t.phase}`];
  if (bl.length) {
    parts.push(`<button class="tl-wait" data-act="tl-wait" data-ref="${t.id}" aria-expanded="${ui.tlWait === t.id}" title="wartet auf: ${esc(bl.map((b) => b.title).join(' · '))}">wartet auf ${bl.length} ›</button>`);
  }
  const quiet = [];
  const sp = subProgress(t);
  if (sp) quiet.push(`${sp[0]}/${sp[1]} Teilschritte`);
  const coms = comsOf(t.id).length;
  if (coms) quiet.push(`${coms} ${coms === 1 ? 'Kommentar' : 'Kommentare'}`);
  parts.push(...quiet.slice(0, 2));
  const money = taskAmount(t.id);
  if (money) parts.push(`${money.estimated ? '≈ ' : ''}${eurShort(money.sum)}`);
  return parts.join(' · ');
}

function whenHTML(at, { weekday = true, moved = false, date = true } = {}) {
  const tt = tOffset(at) || '';
  const sub = [weekday ? fmtWd(at) : '', moved ? 'Umzug' : '', tt].filter(Boolean).join(' · ');
  return `<div class="tl-when">${date ? `<b>${esc(fmtShort(at))}</b>` : ''}<span>${esc(sub)}</span></div>`;
}

function rowHTML({ t, at }, rl) {
  const late = isLate(t);
  const blocked = blockers(t).length > 0;
  const open = ui.expanded === t.id;
  const moved = t.anchor === 'umzugstag' && umzugstag();
  const sig = signalHTML(t, at);
  const cls = ['tl-row', 'tl-task', late ? 'late' : '', isCritical(t) ? 'crit' : '', blocked ? 'blocked' : '', open ? 'open' : '', open && ui.wide ? 'selected' : ''].join(' ');
  const waitList =
    ui.tlWait === t.id && blocked
      ? `<div class="tl-waitlist">wartet auf: ${blockers(t)
          .map((b) => `<a class="tlink" href="#task=${encodeURIComponent(b.id)}">${esc(b.title)}</a>`)
          .join(' · ')}</div>`
      : '';
  return `<div class="${cls}" data-id="${t.id}">
    ${whenHTML(at, { moved })}
    ${railHTML(at.getTime(), rl, { dot: t.phase, owner: t.owner })}
    <div class="tl-c">
      <div class="tl-top">
        <button class="t" data-act="open" aria-expanded="${open}" title="${esc(t.title)}">${esc(t.title)}</button>
        <input type="checkbox" class="check" ${ui.offline || blocked ? 'disabled' : ''} data-act="done" aria-label="Erledigt${blocked ? ' – wartet noch auf eine andere Aufgabe' : ''}">
      </div>
      <div class="tl-meta"><span class="own text-only ${t.owner}">${OWN[t.owner]}</span>${sig}<span class="tl-q">${metaHTML(t)}</span></div>
      ${waitList}
    </div>
    ${open && !ui.wide ? detailHTML(t, false) : ''}
  </div>`;
}

const monthHTML = (label, time, rl) =>
  `<div class="tl-row tl-mrow"><div class="tl-when"></div>${railHTML(time, rl)}<div class="tl-month">${esc(label)}</div></div>`;

/** The gate row: what has to be true before the phase is over, the diamond ends its rail. */
function gateHTML(p, time, rl) {
  const at = new Date(time);
  return `<div class="tl-row tl-gaterow">
    ${whenHTML(at, { weekday: false })}
    ${railHTML(time, rl, { gate: p.id })}
    <div class="tl-gate"><span class="gh">Gate Phase ${p.id}${p.name ? ' · ' + esc(p.name) : ''}</span>${p.gate ? `<span class="gt">${esc(String(p.gate).replace(/^Gate:\s*/i, ''))}</span>` : ''}</div>
  </div>`;
}

/** Today: a pill and a dashed line over the list's width. Ink, not red - today is no deadline
    that passed (CLAUDE.md: red only for overdue and for what cannot be undone). */
function todayHTML(today, rl) {
  return `<div class="tl-row tl-today" id="tl-today">
    ${whenHTML(today, { weekday: false })}
    ${railHTML(today.getTime(), rl)}
    <div class="tl-tc"><span class="tl-pill">Heute</span></div>
  </div>`;
}

function einzugHTML(day, rl) {
  return `<div class="tl-row tl-einzug">
    ${whenHTML(day, { weekday: false })}
    ${railHTML(day.getTime(), rl)}
    <div class="tl-ec"><b>Einzug</b><span>${esc(fmtFull(day))} · Tag 0</span></div>
  </div>`;
}

/** How many open tasks one of the four pills stands for (030: a pill without a count stays away). */
function ownerCount(key) {
  const me = state.person;
  const you = me === 'S' ? 'A' : 'S';
  const want = key === 'me' ? me : key === 'you' ? you : 'B';
  return state.tasks.filter((t) => !t.done && anchorDate(t) && t.owner === want).length;
}

export function timelineHTML() {
  const list = rows();
  const rl = rails(list);
  const today = dayStart();
  const moveIn = einzug() ? dayStart(new Date(einzug() + 'T00:00:00')) : null;
  const doneCount = state.tasks.filter((t) => t.done).length;
  const ps = phases();

  let out = '';
  let month = '';
  let todayDrawn = false;
  let einzugDrawn = !moveIn;
  const lastOf = new Map(); // phase -> time of its last row, for the gate row
  for (const { t, at } of list) lastOf.set(t.phase, at.getTime());
  let pendingDay = null; // gates wait until every row of their day is out (as in the export)
  const flushGates = () => {
    if (pendingDay === null) return;
    for (const p of ps) if (lastOf.get(p.id) === pendingDay) out += gateHTML(p, pendingDay, rl);
    pendingDay = null;
  };

  const ensureMonth = (at, time) => {
    const m = fmtMonth(at);
    if (m === month) return;
    month = m;
    out += monthHTML(m, time, rl);
  };
  for (const row of list) {
    const time = row.at.getTime();
    if (pendingDay !== null && pendingDay !== time) flushGates();
    // the today marker sits between the last overdue row and the first coming one - under the
    // head of its own month (export: "SEPTEMBER 2026", overdue rows, Heute, the rest)
    if (!todayDrawn && row.at >= today) {
      ensureMonth(today, today.getTime());
      out += todayHTML(today, rl);
      todayDrawn = true;
    }
    // the Einzug band closes the month before it, the new month's head follows (export)
    if (!einzugDrawn && row.at >= moveIn) {
      out += einzugHTML(moveIn, rl);
      einzugDrawn = true;
    }
    ensureMonth(row.at, time);
    out += rowHTML(row, rl);
    if ([...lastOf.values()].includes(time)) pendingDay = time;
  }
  flushGates();
  if (!todayDrawn) out += todayHTML(today, rl);
  if (!einzugDrawn) out += einzugHTML(moveIn, rl);

  const note = einzug()
    ? `Tag 0 ist der Einzug am ${esc(fmtShort(new Date(einzug() + 'T00:00:00')))}${umzugstag() && umzugstag() !== einzug() ? ` · Umzug am ${esc(fmtShort(new Date(umzugstag() + 'T00:00:00')))}` : ''}`
    : '';
  return `<section class="timeline" aria-label="Timeline">
    <div class="tl-filters">
      ${/* docs/changes/038 #11: the same filter pill as every other list, with the names
            instead of "Du" (029b) - the rail and the Heute divider stay as they are */ ''}
      ${filterPillsHTML(
        [
          { key: 'all', label: 'alle', on: ui.tlOwner === 'all', always: true },
          { key: 'me', label: OWN[state.person], n: ownerCount('me'), on: ui.tlOwner === 'me' },
          { key: 'B', label: 'Gemeinsam', n: ownerCount('B'), on: ui.tlOwner === 'B' },
          { key: 'you', label: OWN[state.person === 'S' ? 'A' : 'S'], n: ownerCount('you'), on: ui.tlOwner === 'you' },
        ],
        { act: 'tl-owner', label: 'Wessen Aufgaben' },
      )}
      <button class="btn-text tl-jump" data-act="tl-today">↓ Heute</button>
    </div>
    ${note ? `<p class="tl-note">${note}</p>` : ''}
    <div class="tl-list">${list.length ? out : `<p class="empty">${term() ? 'Kein Treffer in dieser Auswahl.' : 'Nichts offen in dieser Auswahl.'}</p>`}</div>
    ${
      doneCount
        ? ui.tlDone
          ? `<div class="tl-done">${state.tasks
              .filter((t) => t.done && anchorDate(t))
              .sort((a, b) => dueInfo(a).sort - dueInfo(b).sort)
              .map((t) => `<div class="tl-row done" data-id="${t.id}"><div class="tl-when"><b>${esc(fmtShort(new Date(dueInfo(t).sort)))}</b></div><div class="tl-rails" aria-hidden="true"></div><div class="tl-c"><div class="tl-top"><button class="t" data-act="open">${esc(t.title)}</button><input type="checkbox" class="check" checked ${ui.offline ? 'disabled' : ''} data-act="done" aria-label="Erledigt"></div></div></div>`)
              .join('')}
            <button class="btn-text row" data-act="tl-done">erledigte ausblenden</button></div>`
          : `<button class="btn-text row" data-act="tl-done">${doneCount} erledigte zeigen</button>`
        : ''
    }
  </section>`;
}

