// Dashboard (docs/changes/018, on top of 009 "Personen zuerst"): countdown, three signals,
// one person at a time on a phone and, inside that column, tasks grouped by time.
// Everything on this screen is derived from state.js; filters live in filters.js, the time
// groups in groups.js (shared with the timeline in 019).
import { esc } from '../ui/dom.js';
import { OWN, STEPS } from '../ui/labels.js';
import { renderHeader, updateBarHTML, footHTML, setupHintHTML } from '../ui/chrome.js';
import { state, ui, byId, phases, einzug, umzugstag, dueInfo, dueShort, freshComments, doneByOther, claudeStep, fmtDay } from '../state.js';
import { FILTERS, matches, count, isBlocked, isLate, isCritical, waitsOnMe, waitsOnYou, hasNews, other } from '../filters.js';
import { timeGroups, gate, gateInDays } from '../groups.js';
import { taskHTML } from '../ui/task.js';
import { detailHTML } from '../ui/detail.js';
import { compareVersions } from '../changelog.js';
import { summary, eurShort } from '../costs.js';
import { isHit, term } from '../search.js';
import { printHTML } from './print.js';
import { timelineHTML } from './timeline.js';
import { gateHTML } from '../ui/gate.js';

const CAP = 8; // rows per column before "alle n zeigen"
// compact figure inside a longer sentence (changeLine, old -> new date) - not the running-text
// fmtDay from 029b #4 on purpose, see 029b-abweichungen.md
const fmtDayMonth = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

// docs/changes/029b #2: countdown and the date-editor now live in the shared renderHeader()
// (chrome.js) - the phase strip stays dashboard-only, right underneath it.
function headHTML() {
  return `<header class="dash-head">
    ${renderHeader('dashboard')}
    ${phaseStripHTML()}
  </header>`;
}

/* ---------- the phase strip (docs/changes/021, idea 4o) ----------
   Five labelled segments instead of a percentage: as wide as the phase has tasks, filled by how
   much of it is done, outlined while it is the one being worked on. A tap is the phase filter -
   the phase tabs from 009 are gone. Widths are set via CSSOM in render(), because CSP forbids
   style attributes (008). */
function phaseStripHTML() {
  const list = phases();
  if (!list.length) return '';
  const rows = list.map((p) => {
    const all = state.tasks.filter((t) => t.phase === p.id);
    const dn = all.filter((t) => t.done).length;
    return { p, all: all.length, dn, pct: all.length ? Math.round((dn / all.length) * 100) : 0, complete: all.length > 0 && dn === all.length };
  });
  const firstOpen = (rows.find((r) => !r.complete) || {}).p;
  const total = rows.reduce((n, r) => n + r.all, 0) || 1;
  return `<div class="pstrip" role="group" aria-label="Phasen">${rows
    .map((r) => {
      const cls = ['pseg-ph', r.complete ? 'complete' : '', firstOpen && r.p.id === firstOpen.id ? 'current' : ''].join(' ');
      // the share of the whole, as a number for the CSSOM step in render()
      const share = Math.round((r.all / total) * 1000) / 10;
      return `<button class="${cls}" data-phase="${r.p.id}" data-share="${share}" aria-pressed="${ui.phase === r.p.id}"
        aria-label="Phase ${r.p.id} – ${esc(r.p.name)}, ${r.dn} von ${r.all} erledigt" title="Phase ${r.p.id} · ${esc(r.p.name)} · ${r.dn}/${r.all}">
        <span class="lbl"><span class="n">${r.p.id}</span> <span class="s">${esc(r.p.short || r.p.name)}</span></span>
        <span class="bar"><i data-pct="${r.pct}"></i></span>
        ${r.complete ? `<span class="gate-mark" aria-hidden="true">◆</span>` : ''}
      </button>`;
    })
    .join('')}</div>`;
}

/* ---------- search (docs/changes/012) ----------
   Always visible, never folded away behind an icon: the field is the fastest way into a task
   that is neither in "Ich" nor in the open phase. */
function searchHTML() {
  const q = ui.q || '';
  // docs/changes/029b #7: die Lupe als Inline-SVG, 16 px, links im Feld
  return `<div class="search-row">
    <svg class="search-ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="10.3" y1="10.3" x2="15" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <input type="search" id="search" data-input="q" value="${esc(q)}" placeholder="Aufgabe suchen" aria-label="Aufgabe suchen" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
    ${q ? `<button class="search-x" data-act="q-clear" aria-label="Suche leeren">×</button>` : ''}
  </div>`;
}

/* ---------- "Seit du zuletzt da warst" (docs/changes/018 §6, replaces the block from 009) ----------
   One line while it is folded. Moved deadlines come first: they change what has to happen when,
   and nothing else on this screen would say it. Nothing happened = the line is not there. */

const fmtChangeDay = (iso) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

/** What the other person (or Claude) did while this person was away. */
export function sinceVisit() {
  const at = state.lastVisitAt;
  if (!at) return null;
  const mine = state.person;
  // only changes not made by me, and only on tasks that still exist; changed_by = null means a
  // content package, the seed script or the connector wrote it (docs/changes/014 #1)
  const moved = state.changes
    .filter((c) => c.changed_at > at && c.changed_by !== mine && byId(c.task_id))
    .slice(0, 20);
  const coms = state.comments.filter((c) => c.created_at > at && c.author !== mine && byId(c.task_id));
  const done = state.tasks.filter(doneByOther);
  if (!moved.length && !coms.length && !done.length) return null;
  return { at, moved, coms, done };
}

const FIELD_LABEL = { offset_days: 'Frist', anchor: 'Stichtag', owner: 'Zuständig', title: 'Titel' };

/** "Halteverbot: 11.12. → 04.12., Sebastian" - the sentence for one logged change. */
function changeLine(c) {
  const t = byId(c.task_id);
  const who = c.changed_by ? OWN[c.changed_by] || c.changed_by : 'Inhaltspaket';
  if (c.field === 'offset_days') {
    const at = (v) => {
      const base = t && t.anchor === 'umzugstag' && umzugstag() ? umzugstag() : einzug();
      if (!base) return v + ' Tage';
      const d = new Date(base + 'T00:00:00');
      d.setDate(d.getDate() + Number(v));
      return fmtDayMonth(d.toISOString().slice(0, 10));
    };
    return `${esc(t.title)}: ${at(c.old_value)} → <b>${at(c.new_value)}</b>${who ? ', ' + who : ''}`;
  }
  if (c.field === 'owner') return `${esc(t.title)}: ${OWN[c.old_value] || c.old_value} → <b>${OWN[c.new_value] || c.new_value}</b>${who ? ', ' + who : ''}`;
  if (c.field === 'anchor') return `${esc(t.title)}: gerechnet ab <b>${c.new_value === 'umzugstag' ? 'Umzugstag' : 'Einzug'}</b>${who ? ', ' + who : ''}`;
  return `${esc(c.old_value || '')} → <b>${esc(c.new_value || '')}</b>${who ? ', ' + who : ''}`;
}

function visitHTML() {
  const v = sinceVisit();
  if (!v) return '';
  // docs/changes/029b #4: derselbe Kopf-Helfer wie ueberall in laufendem Text - v.at ist ein
  // Zeitstempel (Zeitzone zaehlt), erst auf den lokalen Kalendertag umrechnen, dann formatieren
  const visitDt = new Date(v.at);
  const localISO = `${visitDt.getFullYear()}-${String(visitDt.getMonth() + 1).padStart(2, '0')}-${String(visitDt.getDate()).padStart(2, '0')}`;
  const day = fmtDay(localISO);
  const parts = [];
  if (v.moved.length) parts.push(`${v.moved.length} ${v.moved.length === 1 ? 'Frist verschoben' : 'Fristen verschoben'}`);
  if (v.coms.length) parts.push(`${v.coms.length} ${v.coms.length === 1 ? 'Kommentar' : 'Kommentare'}`);
  if (v.done.length) parts.push(`${v.done.length} erledigt`);
  const open = !!ui.visitOpen;
  return `<section class="visit" aria-label="Seit du zuletzt da warst">
    <button class="visit-line" data-act="visit-toggle" aria-expanded="${open}">
      <span class="l">Seit ${esc(day)}:</span> <span class="v">${esc(parts.join(' · '))}</span>
      <span class="chev" aria-hidden="true">${open ? '−' : '+'}</span>
    </button>
    ${
      open
        ? `<div class="visit-body">
            ${v.moved.map((c) => `<p class="visit-item"><span class="k">${FIELD_LABEL[c.field]}</span> ${changeLine(c)}</p>`).join('')}
            ${v.coms
              .map(
                (c) => `<p class="visit-item"><span class="k">Kommentar</span> <a class="tlink" href="#task=${encodeURIComponent(c.task_id)}">${esc(byId(c.task_id).title)}</a> · ${esc(OWN[c.author] || c.author)}, ${esc(fmtChangeDay(c.created_at))}</p>`,
              )
              .join('')}
            ${v.done.map((t) => `<p class="visit-item"><span class="k">Erledigt</span> <a class="tlink" href="#task=${encodeURIComponent(t.id)}">${esc(t.title)}</a>${t.done_by ? ' · ' + esc(OWN[t.done_by]) : ''}</p>`).join('')}
          </div>`
        : ''
    }
  </section>`;
}

/* ---------- the three signals (docs/changes/018 §3) ----------
   They count across both people - that is the point: "warten auf dich" is not a property of a
   column. A pressed signal turns the list below into one flat list with the quote and the one
   action that answers it. */

const SIGNALS = [
  ['waitme', (n) => (n === 1 ? 'wartet auf dich' : 'warten auf dich'), 'Antworten'],
  ['news', (n) => (n === 1 ? 'neuer Kommentar' : 'neue Kommentare'), 'Antworten'],
  ['waityou', () => 'du wartest', 'Erinnern'],
];

function signalsHTML() {
  const tiles = SIGNALS.map(([key, label]) => {
    const n = count(key);
    return `<button class="tile sig-tile ${n ? '' : 'zero'}" data-filter="${key}" aria-pressed="${ui.filter === key}">
      <span class="n"><span>${n}</span></span>
      <span class="l">${esc(label(n))}</span>
    </button>`;
  }).join('');
  // the four counts from 009 stay reachable, but quietly: they are not what this screen is about
  const quiet = [['critical', 'fristkritisch'], ['late', 'überfällig'], ['blocked', 'blockiert'], ['claude', 'bei Claude']]
    .map(([key, label]) => [key, label, count(key)])
    .filter(([, , n]) => n > 0)
    .map(([key, label, n]) => `<button class="pill quiet-count" data-filter="${key}" aria-pressed="${ui.filter === key}">${n} ${esc(label)}</button>`)
    .join('');
  return `<section class="kpis three" aria-label="Signale">${tiles}</section>
    ${quiet ? `<div class="quiet-counts">${quiet}</div>` : ''}`;
}

/** The last comment of a task, as the quote under a signal row. */
function quoteOf(t) {
  const coms = state.comments.filter((c) => c.task_id === t.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  return coms.length ? coms[coms.length - 1] : null;
}

/** One row of the flat signal list: who, when, title, quote, one action. */
function signalRowHTML(t, action) {
  const q = quoteOf(t);
  return `<article class="sigrow" data-id="${t.id}">
    <div class="sigrow-meta"><span class="own ${t.owner}">${OWN[t.owner]}</span><span class="due ${isLate(t) ? 'late' : ''}">${esc(dueShort(t))}</span></div>
    <button class="sigrow-title" data-act="open" data-ref="${t.id}">${esc(t.title)}</button>
    ${q ? `<p class="sigrow-quote">„${esc(q.body.length > 140 ? q.body.slice(0, 140) + ' …' : q.body)}“ <span class="who">${esc(OWN[q.author] || q.author)}</span></p>` : ''}
    <div class="row"><button class="btn-secondary" data-act="${action === 'Erinnern' ? 'remind' : 'answer'}" data-ref="${t.id}">${action}</button></div>
  </article>`;
}

function signalListHTML(key) {
  const sig = SIGNALS.find(([k]) => k === key);
  if (!sig) return '';
  const rows = state.tasks.filter((t) => matches(t, key)).sort(order);
  return `<div class="siglist">
    <p class="siglist-note">über alle Personen</p>
    ${rows.length ? rows.map((t) => signalRowHTML(t, sig[2])).join('') : `<p class="empty">Nichts in dieser Auswahl.</p>`}
  </div>`;
}

/** Personen · Phasen · Timeline - the three ways to look at the same tasks (019). */
const VIEWS = [['personen', 'Personen'], ['phasen', 'Phasen'], ['timeline', 'Timeline']];
function viewChipsHTML() {
  return `<div class="pchips view-chips" role="group" aria-label="Ansicht">${VIEWS.map(
    ([k, l]) => `<button class="pill" data-act="view-switch" data-to="${k}" aria-pressed="${currentView() === k}">${l}</button>`,
  ).join('')}</div>`;
}

export const currentView = () => (VIEWS.some(([k]) => k === ui.view) ? ui.view : 'personen');

/** The gate sentence of the chosen phase - the strip has no room for it (021). */
function phaseNoteHTML() {
  const ph = phases().find((p) => p.id === ui.phase);
  return ph?.gate ? `<p class="gate-text">${esc(ph.gate)}</p>` : '';
}

/* ---------- the columns: who has to act (docs/changes/009) ---------- */

// by calendar date, not by offset - two anchors (Einzug, Umzugstag) mix in one list (014 #6)
const order = (a, b) => dueInfo(a).sort - dueInfo(b).sort || a.sort - b.sort;

// A column holds three lists: what can be done now, what waits for another task
// (collapsed, review decision after commit 2) and what is already ticked off.
function column(key, name, cls, tasks, collapsible = false) {
  const open = tasks.filter((t) => !t.done);
  return {
    key,
    name,
    cls,
    collapsible,
    open: open.filter((t) => !isBlocked(t)).sort(order),
    blocked: open.filter(isBlocked).sort(order),
    done: tasks.filter((t) => t.done),
  };
}

export function columns() {
  const me = state.person;
  const you = other(me);
  const q = term();
  const pool = state.tasks.filter((t) => (ui.phase === null || t.phase === ui.phase) && matches(t, ui.filter) && (!q || isHit(t, q)));
  // "Bei Claude" is the one view that groups by state instead of by person (docs/changes/009)
  if (ui.filter === 'claude') return STEPS.map(([key, label]) => column('st-' + key, label, 'C', pool.filter((t) => claudeStep(t) === key)));
  // docs/changes/019: the same list, cut by phase instead of by person
  if (currentView() === 'phasen') {
    // docs/changes/029b #5: 'ph', not 'B' - a phase is not a person, it stays neutral (.own.ph)
    return phases().map((p) => column('ph-' + p.id, `${p.id} ${p.short || p.name}`, 'ph', pool.filter((t) => t.phase === p.id)));
  }
  const all = [
    column('me', `Ich (${OWN[me]})`, me, pool.filter((t) => t.owner === me)),
    column('B', 'Gemeinsam', 'B', pool.filter((t) => t.owner === 'B')),
    column('you', OWN[you], you, pool.filter((t) => t.owner === you)),
  ];
  // docs/changes/018 §1: three columns side by side on a desktop, one at a time on a phone.
  // A search shows every column again - a hit in the other person's column would be invisible.
  if (ui.wide || q) return all;
  return all.filter((c) => c.key === currentCol());
}

/** True while the phone shows the switch: then the switch is the column head (018 §1). */
export const switchShown = () => currentView() === 'personen' && !ui.wide && !term() && !(ui.filter && FILTERS[ui.filter]);

/** All three columns, whatever the phone is showing - the switch needs every counter. */
export function allColsForSwitch() {
  const me = state.person;
  const you = other(me);
  const pool = state.tasks.filter((t) => ui.phase === null || t.phase === ui.phase);
  return [
    column('me', `Ich (${OWN[me]})`, me, pool.filter((t) => t.owner === me)),
    column('B', 'Gemeinsam', 'B', pool.filter((t) => t.owner === 'B')),
    column('you', OWN[you], you, pool.filter((t) => t.owner === you)),
  ];
}

/** Which of the three columns the phone shows. Remembered per device (018 §1). */
export function currentCol() {
  return ['me', 'B', 'you'].includes(ui.col) ? ui.col : 'me';
}

/** The switch: three segments with their own counters, phone only. */
function switchHTML(cols) {
  const cur = currentCol();
  return `<div class="pswitch" role="group" aria-label="Wessen Aufgaben">${cols
    .map((c) => {
      const open = c.open.length + c.blocked.length;
      const late = [...c.open, ...c.blocked].filter(isLate).length;
      const wait = [...c.open, ...c.blocked].filter((t) => waitsOnMe(t, state.person)).length;
      // the number stands on its own from 600 px on, so the note never repeats it
      const note = late ? `${late} überfällig` : wait ? `${wait} ${wait === 1 ? 'wartet' : 'warten'}` : `${open} offen`;
      return `<button class="pill pseg" data-act="col-person" data-to="${c.key}" aria-pressed="${cur === c.key}">
        <b>${esc(shortName(c))}</b><span class="s">${esc(note)}</span>
      </button>`;
    })
    .join('')}</div>`;
}

const shortName = (c) => (c.key === 'me' ? 'Du' : c.key === 'B' ? 'Gemeinsam' : c.name);

function columnNote(c) {
  const all = [...c.open, ...c.blocked];
  const late = all.filter(isLate).length;
  if (late) return late + ' überfällig';
  const crit = all.filter(isCritical).length;
  return crit ? crit + ' fristkritisch' : '';
}

// docs/changes/013 A5: an empty list is good news, so it reads like good news
function emptyText() {
  if (term()) return 'Kein Treffer in diesem Bereich.';
  if (ui.filter) return 'Nichts in dieser Auswahl.';
  const next = state.tasks
    .filter((t) => !t.done)
    .map((t) => dueInfo(t))
    .sort((a, b) => a.sort - b.sort)[0];
  return next && einzug() ? 'Alles erledigt – nächste Fälligkeit am ' + new Date(next.sort).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Alles erledigt.';
}

function columnHTML(c) {
  const has = (list) => !!ui.expanded && list.some((t) => t.id === ui.expanded);
  const total = c.open.length + c.blocked.length;
  // a search shows everything it found: nothing collapsed, no "weitere n zeigen" (012)
  const q = term();
  const collapsed = c.collapsible && !ui.openCols.has(c.key) && !has([...c.open, ...c.blocked, ...c.done]) && !ui.filter && !q;
  const all = !!q || ui.allCols.has(c.key) || c.open.findIndex((t) => t.id === ui.expanded) >= CAP;
  const rows = all ? c.open : c.open.slice(0, CAP);
  const showDone = !!q || ui.doneCols.has(c.key) || has(c.done) || !!FILTERS[ui.filter]?.done;
  // "N warten auf einen Vorgänger": collapsed, opens with a filter, a search or a link leading there
  const showBlocked = !!q || ui.blockedCols.has(c.key) || has(c.blocked) || !!ui.filter;
  const note = columnNote(c);
  const inner = `<span class="own ${c.cls}">${esc(c.name)}</span><span class="cnt">${total} offen</span>${note ? `<span class="note">${esc(note)}</span>` : ''}`;
  // docs/changes/018 §2: inside the column the order is time, not the raw sort - one function
  // for the dashboard and the timeline. A search or a filter shows one flat list instead.
  const head = switchShown()
    ? '' // the switch above already says whose column this is and how much is in it
    : c.collapsible
      ? `<button class="col-head" data-act="col-toggle" data-ref="${c.key}" aria-expanded="${!collapsed}" aria-controls="col-${c.key}">${inner}<span class="chev" aria-hidden="true">${collapsed ? '+' : '−'}</span></button>`
      : `<div class="col-head">${inner}</div>`;
  // an empty column keeps its head (the count is the information) and says what it means (A5)
  const body =
    collapsed
      ? ''
      : `<div class="col-body" id="col-${c.key}">
        ${total ? '' : `<p class="col-empty">${esc(emptyText())}</p>`}
        ${groupedHTML(c, rows, all)}
        ${
          c.blocked.length
            ? `<button class="btn-text row col-sub disclose" data-act="col-blocked" data-ref="${c.key}" aria-expanded="${showBlocked}" aria-controls="blocked-${c.key}"><span class="dchev" aria-hidden="true">${showBlocked ? '▾' : '▸'}</span>${c.blocked.length} ${c.blocked.length === 1 ? 'wartet' : 'warten'} auf einen Vorgänger</button>${showBlocked ? `<div id="blocked-${c.key}">${c.blocked.map(taskHTML).join('')}</div>` : ''}`
            : ''
        }
        ${showDone ? c.done.map(taskHTML).join('') : ''}
        ${c.done.length && !showDone ? `<button class="btn-text row disclose" data-act="col-done" data-ref="${c.key}"><span class="dchev" aria-hidden="true">▸</span>${c.done.length} erledigt zeigen</button>` : ''}
      </div>`;
  return `<section class="col ${c.key} own-${c.cls}" data-col="${c.key}">${head}${body}</section>`;
}

/** The open tasks of a column, in time groups. "Später" stays folded behind one line. */
function groupedHTML(c, rows, all) {
  const q = term();
  const flat = () =>
    rows.map(taskHTML).join('') +
    (!all && c.open.length > CAP ? `<button class="btn-text row" data-act="col-all" data-ref="${c.key}">weitere ${c.open.length - CAP} zeigen →</button>` : '');
  if (q || ui.filter || !c.open.length) return flat();
  // docs/changes/014d #3: a Phasen column passes its own phase id, so the gate bucket only
  // shows when it is genuinely that phase's own gate - a Personen column passes undefined
  const phaseId = c.key.startsWith('ph-') ? Number(c.key.slice(3)) : undefined;
  const groups = timeGroups(c.open, phaseId);
  if (groups.length < 2) return flat();
  return groups
    .map((g) => {
      const openGroup = !g.fold || ui.openGroups.has(c.key + ':' + g.key) || g.tasks.some((t) => t.id === ui.expanded);
      const head = `<div class="tgroup-head"><span class="l">${esc(g.label)}</span>${g.note ? `<span class="n">${esc(g.note)}</span>` : ''}</div>`;
      if (!openGroup) {
        return `<button class="btn-text row tgroup-more disclose" data-act="group-open" data-ref="${c.key}:${g.key}"><span class="dchev" aria-hidden="true">▸</span>${g.tasks.length} ${g.tasks.length === 1 ? 'Aufgabe' : 'Aufgaben'} ${esc(g.note || 'später')}</button>`;
      }
      return `<div class="tgroup">${head}${g.tasks.map(taskHTML).join('')}</div>`;
    })
    .join('');
}

/* ---------- "Zwischen euch" (docs/changes/018 §5): the desktop panel without a selection ---------- */

const BETWEEN = [
  ['waitme', (n) => `${n} ${n === 1 ? 'wartet' : 'warten'} auf dich`, 'Antworten'],
  ['news', (n) => `${n} ${n === 1 ? 'neuer Kommentar' : 'neue Kommentare'}`, 'Ansehen'],
  ['waityou', (n) => `${n}× du wartest auf ${OWN[other(state.person)]}`, 'Erinnern'],
];

function betweenHTML() {
  const blocks = BETWEEN.map(([key, label, action]) => {
    const rows = state.tasks.filter((t) => matches(t, key)).sort(order);
    if (!rows.length) return '';
    const t = rows[0];
    const q = quoteOf(t);
    return `<section class="between-block">
      <h3>${esc(label(rows.length))}</h3>
      <button class="between-title" data-act="open" data-ref="${t.id}">${esc(t.title)}</button>
      ${q ? `<p class="sigrow-quote">„${esc(q.body.length > 120 ? q.body.slice(0, 120) + ' …' : q.body)}“ <span class="who">${esc(OWN[q.author] || q.author)}</span></p>` : ''}
      <div class="row">
        <button class="btn-secondary" data-act="${action === 'Erinnern' ? 'remind' : 'answer'}" data-ref="${t.id}">${action}</button>
        ${rows.length > 1 ? `<button class="btn-text" data-filter="${key}">alle ${rows.length} zeigen</button>` : ''}
      </div>
    </section>`;
  }).join('');
  if (!blocks) return `<aside class="panel empty" id="panel" aria-label="Akte"><p>Nichts hängt gerade zwischen euch.</p></aside>`;
  return `<aside class="panel between" id="panel" aria-label="Zwischen euch">
    <div class="panel-head"><span class="hint">Zwischen euch</span></div>
    ${blocks}
  </aside>`;
}

function addBoxHTML() {
  const claude = ui.filter === 'claude';
  const list = phases();
  const sel = ui.phase || (list[0] ? list[0].id : 1);
  return `<div class="addbox">
    <div class="row"><input type="text" data-input="new-t" placeholder="${claude ? 'Neue Claude-Aufgabe' : 'Neue Aufgabe'}" aria-label="Titel der neuen Aufgabe"></div>
    <div class="row">
      <select data-input="new-p" aria-label="Phase">${list.map((p) => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>Phase ${p.id} · ${esc(p.short || p.name)}</option>`).join('')}</select>
      <select data-input="new-o" aria-label="Zuständig"><option value="B">gemeinsam</option><option value="S">Sebastian</option><option value="A">Anna</option></select>
      <select data-input="new-type" aria-label="Typ"><option value="self">nur ihr</option><option value="assist">Claude unterstützt</option><option value="claude" ${claude ? 'selected' : ''}>an Claude delegiert</option></select>
      <span class="row nowrap"><input type="number" inputmode="numeric" data-input="new-w" value="2" min="0" class="num" aria-label="Wochen"><select data-input="new-dir" aria-label="Richtung"><option value="-1">Wochen vorher</option><option value="1">Wochen danach</option></select></span>
      <label class="check-label"><input type="checkbox" data-input="new-c"> kritisch</label>
      <button class="${ui.akteEdit || ui.printOpen ? 'btn-secondary' : 'btn-primary'}" data-act="add">Hinzufügen</button>
    </div></div>`;
}

export function dashboardView() {
  const filter = ui.filter && FILTERS[ui.filter] ? ui.filter : null;
  const q = term();
  // docs/changes/018 §3: a pressed signal replaces the columns with one flat list over both people
  const isSignal = !!filter && SIGNALS.some(([k]) => k === filter);
  const tl = currentView() === 'timeline'; // the timeline brings its own filters and list (019)
  // docs/changes/012: the sections stay, the ones without a hit go
  const allCols = columns();
  const cols = allCols.filter((c) => !q || c.open.length + c.blocked.length + c.done.length);
  const hits = cols.reduce((n, c) => n + c.open.length + c.blocked.length + c.done.length, 0);
  const filterRow = filter
    ? `<div class="filter-row">
        <button class="pill on filter-chip" data-act="filter-clear" aria-label="Filter entfernen">Filter: ${FILTERS[filter].label}<span class="x" aria-hidden="true">×</span></button>
        <span class="filter-count">${hits} ${hits === 1 ? 'Aufgabe' : 'Aufgaben'}${ui.phase ? ' in Phase ' + ui.phase : ''}</span>
      </div>`
    : '';
  // docs/changes/006 + 013 A3: from 1180 px the list and a quiet side panel sit next to each
  // other; between 900 and 1179 px the list uses the full width and the Akte is an overlay
  const open = ui.expanded ? byId(ui.expanded) : null;
  // docs/changes/019c: the timeline keeps its list at most 720 px wide and puts the Akte (or
  // "Zwischen euch") next to it from 900 px on - the overlay step of 013 A3 is skipped there
  const mode = tl && ui.mode === 'overlay' ? 'panel' : ui.mode;
  const panelTask = mode === 'panel' ? open : null;
  return (
    updateBarHTML() +
    setupHintHTML() +
    `<div class="board mode-${mode}${tl ? ' v-timeline' : ''}"><div class="col-list">` +
    headHTML() +
    searchHTML() +
    viewChipsHTML() +
    (tl ? '' : visitHTML() + signalsHTML()) +
    phaseNoteHTML() +
    filterRow +
    (tl ? timelineHTML() : '') +
    (isSignal && !tl ? signalListHTML(filter) : '') +
    (isSignal || tl
      ? ''
      : (switchShown() ? switchHTML(allColsForSwitch()) : '') +
        (q && !cols.length ? `<p class="empty no-hits">Kein Treffer für „${esc(q)}“ – auch nicht in den Teilschritten.</p>` : `<div class="cols">${cols.map(columnHTML).join('')}</div>`)) +
    addBoxHTML() +
    `</div>` +
    (mode === 'panel' ? panelHTML(panelTask) : '') +
    `</div>` +
    (mode === 'overlay' ? overlayHTML(open) : '') +
    (ui.gate !== null && ui.gate !== undefined ? gateHTML(ui.gate) : '') +
    (ui.printOpen ? printHTML() : '') +
    (ui.changelogOpen ? changelogHTML() : '') +
    footHTML()
  );
}

function panelHTML(t) {
  if (!t) return betweenHTML(); // docs/changes/018 §5: no selection = "Zwischen euch"
  return `<aside class="panel" id="panel" data-id="${t.id}" aria-label="Akte: ${esc(t.title)}">
    ${panelHeadHTML(t)}
    ${detailHTML(t)}
  </aside>`;
}

function panelHeadHTML(t) {
  const ph = phases().find((p) => p.id === t.phase);
  return `<div class="panel-head"><span class="hint">Phase ${t.phase}${ph ? ' · ' + esc(ph.name) : ''}</span><span class="spacer"></span><button class="ico" data-act="panel-close" aria-label="Akte schließen">×</button></div>`;
}

/* docs/changes/013 A3: between 900 and 1179 px there is no room for a quiet panel next to the
   list - the Akte comes in from the right, over a dimmed list, and closes again. */
function overlayHTML(t) {
  if (!t) return '';
  return `<div class="overlay" data-act="overlay-close">
    <aside class="sheet" id="panel" data-id="${t.id}" role="dialog" aria-modal="true" aria-label="Akte: ${esc(t.title)}">
      ${panelHeadHTML(t)}
      ${detailHTML(t)}
    </aside>
  </div>`;
}

/* ---------- changelog (docs/changes/005, grouped by release since 015): opened from the info icon in the footer ---------- */
const SECTIONS = [['new', 'Neu'], ['improved', 'Verbessert'], ['fixed', 'Behoben']];
function changelogHTML() {
  const all = ui.changelog?.entries || [];
  // auto-opened: every version this person has not closed yet; opened from the footer: everything
  const entries = ui.changelogUnreadOnly ? all.filter((e) => compareVersions(e.version, state.lastSeenVersion) > 0) : all;
  // group by release (docs/changes/015): newest release open, older releases collapsed; entries stay in file order within a group
  const groups = [];
  for (const e of entries) {
    const key = e.release || e.version;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, entries: [] }; groups.push(g); }
    g.entries.push(e);
  }
  const article = (e) => `<article class="release">
      <h3><span class="v">${esc(e.version)}</span>${esc(e.title || '')}</h3>
      ${SECTIONS.map(([k, label]) => (Array.isArray(e[k]) && e[k].length ? `<h4>${label}</h4><ul>${e[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')).join('')}
    </article>`;
  const body = groups
    .map((g, i) => `<details class="adv" ${i === 0 ? 'open' : ''}>
      <summary>Version ${esc(g.key)}${ui.changelog?.releases?.[g.key] ? ' · ' + esc(ui.changelog.releases[g.key]) : ''}</summary>
      ${g.entries.map(article).join('')}
    </details>`)
    .join('');
  return `<section class="changelog" id="changelog" aria-labelledby="changelog-title">
    <div class="changelog-head"><h2 id="changelog-title">Was ist neu?</h2><span class="spacer"></span><button class="btn-secondary" data-act="changelog-close">Schließen</button></div>
    ${body || '<p class="empty">Noch keine Einträge.</p>'}
  </section>`;
}
