// Dashboard (docs/changes/009 "Personen zuerst"): countdown, gate bar, four KPI filters,
// phase chips and the task list grouped by person instead of by phase.
// Everything on this screen is derived from state.js; filters live in filters.js.
import { esc } from '../ui/dom.js';
import { OWN, STEPS } from '../ui/labels.js';
import { appHeadHTML, updateBarHTML, footHTML } from '../ui/chrome.js';
import { state, ui, byId, phases, einzug, dueInfo, freshComments, doneByOther, claudeStep } from '../state.js';
import { FILTERS, matches, count, isBlocked, isLate, isCritical, waitsOnMe, other } from '../filters.js';
import { taskHTML } from '../ui/task.js';
import { detailHTML } from '../ui/detail.js';
import { compareVersions } from '../changelog.js';
import { summary, eurShort } from '../costs.js';
import { isHit, term } from '../search.js';
import { printHTML } from './print.js';

const DAY = 86400000;
const CAP = 8; // rows per column before "alle n zeigen"

function daysToMoveIn() {
  const base = einzug();
  if (!base) return null;
  const dt = new Date(base + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt - today) / DAY);
}

/* docs/changes/013 A1: the head of the phone carries one line instead of a poster -
   number, what it counts and the date, so the first task fits on the first screen. */
function headHTML() {
  const base = einzug();
  const days = daysToMoveIn();
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const d = base ? new Date(base + 'T00:00:00') : null;
  const dateLong = d ? d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const dateShort = d ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const count = !base
    ? `<span class="n open">Termin offen</span><span class="t">Einzugstermin eintragen, dann zählt die App</span>`
    : days > 0
      ? `<span class="n">${days}</span><span class="t">${days === 1 ? 'Tag' : 'Tage'} bis zur Schlüsselübergabe</span>`
      : days === 0
        ? `<span class="n">Heute</span><span class="t">ist Schlüsselübergabe</span>`
        : `<span class="n">${-days}</span><span class="t">${-days === 1 ? 'Tag' : 'Tage'} seit der Schlüsselübergabe</span>`;
  const showDate = ui.dateEdit || !base;
  return `<header class="dash-head">
    ${appHeadHTML('dashboard')}
    <div class="countdown">
      ${count}
      ${base ? `<button class="eyebrow btn-like" data-act="date-toggle" aria-expanded="${showDate}" aria-label="Einzugstermin ändern"><span class="long">${esc(dateLong)}</span><span class="short">${esc(dateShort)}</span></button>` : ''}
      <span class="spacer"></span>
      <span class="pct">${pct} % erledigt</span>
    </div>
    ${showDate ? `<div class="date-edit"><label class="hint" for="einzug">Schlüsselübergabe neue Wohnung</label><input type="date" id="einzug" value="${esc(base)}"></div>` : ''}
    ${gatesHTML()}
  </header>`;
}

// the phases stay visible as progress, they are no longer the ordering principle (docs/changes/009)
function gatesHTML() {
  const list = phases();
  const firstOpen = (state.tasks.filter((t) => !t.done).sort((a, b) => a.phase - b.phase)[0] || {}).phase;
  return `<div class="gates" role="group" aria-label="Phasen">${list
    .map((p) => {
      const all = state.tasks.filter((t) => t.phase === p.id);
      const dn = all.filter((t) => t.done).length;
      const pct = all.length ? Math.round((dn / all.length) * 100) : 0;
      const complete = all.length > 0 && dn === all.length;
      const cls = ['gate', complete ? 'complete' : '', p.id === firstOpen ? 'current' : ''].join(' ');
      // docs/changes/013 A1: the count moved into the label for screen readers and the tooltip
      return `<button class="${cls}" data-phase="${p.id}" aria-pressed="${ui.phase === p.id}" aria-label="Phase ${p.id} – ${esc(p.name)}, ${dn} von ${all.length} erledigt" title="Phase ${p.id} · ${esc(p.name)} · ${dn}/${all.length}">
        <span class="lbl" aria-hidden="true">${p.id}</span>
        <span class="bar"><i data-pct="${pct}"></i></span>
      </button>`;
    })
    .join('')}</div>`;
}

/* ---------- search (docs/changes/012) ----------
   Always visible, never folded away behind an icon: the field is the fastest way into a task
   that is neither in "Ich" nor in the open phase. */
function searchHTML() {
  const q = ui.q || '';
  return `<div class="search-row">
    <input type="search" id="search" data-input="q" value="${esc(q)}" placeholder="Aufgabe suchen" aria-label="Aufgabe suchen" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
    ${q ? `<button class="search-x" data-act="q-clear" aria-label="Suche leeren">×</button>` : ''}
  </div>`;
}

/* ---------- "Seit deinem letzten Besuch" (docs/changes/009) ----------
   Only shown when something happened while this person was away; every part is a filter.
   The block is measured against the visit that ended – it stays put until the app is opened
   again, so it cannot disappear while it is being read. */
function visitHTML() {
  if (!state.lastVisitAt) return '';
  const since = (c) => c.created_at > state.lastVisitAt;
  const parts = [];
  const youName = { S: 'Sebastian', A: 'Anna', C: 'Claude' };
  for (const who of [other(state.person), 'C']) {
    // only comments on tasks that still exist – a deleted task must not show up in the count
    const n = state.comments.filter((c) => c.author === who && since(c) && byId(c.task_id)).length;
    if (n) parts.push(['new' + who, n, `${n === 1 ? 'Kommentar' : 'Kommentare'} von ${youName[who]}`, '']);
  }
  const done = state.tasks.filter(doneByOther).length;
  if (done) parts.push(['donenew', done, `${done === 1 ? 'Aufgabe' : 'Aufgaben'} erledigt`, '']);
  const waits = count('waitme');
  // first, not last: on a 380 px screen the chip row scrolls, and this is the one to see
  if (waits) parts.unshift(['waitme', waits, waits === 1 ? 'wartet auf dich' : 'warten auf dich', 'urgent']);
  if (!parts.length) return '';
  // docs/changes/013 A1: one line of chips; the four full rows appear once a chip is active.
  // docs/changes/013b N2: no red field here - red belongs to "überfällig". What stands out
  // does so through weight and the author's dot.
  const open = parts.some(([key]) => key === ui.filter);
  if (!open) {
    return `<section class="visit chips-only" aria-label="Seit deinem letzten Besuch">
      <span class="visit-label">Seit deinem Besuch</span>
      ${parts
        .map(
          ([key, n, label, cls]) => `<button class="vchip ${cls}" data-filter="${key}" aria-pressed="false" title="${esc(label)}">${authorDot(key)}<b>${n}</b> ${esc(shortLabel(key, label))}</button>`,
        )
        .join('')}
    </section>`;
  }
  return `<section class="visit" aria-labelledby="visit-title">
    <h2 id="visit-title">Seit deinem letzten Besuch</h2>
    ${parts
      .map(
        ([key, n, label, cls]) => `<button class="visit-part ${cls}" data-filter="${key}" aria-pressed="${ui.filter === key}">
          ${authorDot(key)}<span class="n">${n}</span><span class="l">${esc(label)}</span>
        </button>`,
      )
      .join('')}
  </section>`;
}

// who wrote it, in their colour and with their initial - the same dot as in the task row (013b N2)
function authorDot(key) {
  const who = key.startsWith('new') ? key.slice(3) : '';
  return who ? `<span class="ndot ${who}" aria-hidden="true">${who}</span>` : '';
}

// the chip says the same in two words: "1 Anna", "1 erledigt", "1 wartet auf dich"
function shortLabel(key, label) {
  if (key === 'waitme') return 'wartet auf dich';
  if (key === 'donenew') return 'erledigt';
  return label.replace(/^Kommentare? von /, '');
}

// four tiles, one row: only what triggers a decision (docs/changes/009)
const TILES = [
  ['critical', 'Fristkritisch', ''],
  ['late', 'Überfällig', ''],
  ['blocked', 'Blockiert', ''],
  ['claude', 'Bei Claude', 'claude'],
];
function kpisHTML() {
  const net = summary().net;
  // docs/changes/013 A1: five tiles in one row, no empty cell. Variant B keeps four tiles and
  // puts the money on its own narrow line underneath (decision in 013-abweichungen.md).
  const tiles = TILES.map(([key, label]) => {
    const n = count(key);
    return `<button class="tile ${key} ${n ? '' : 'zero'}" data-filter="${key}" aria-pressed="${ui.filter === key}">
      <span class="n"><span>${n}</span></span>
      <span class="l">${label}</span>
    </button>`;
  }).join('');
  // the four tiles filter, the money row opens the Finanzen view - two different things,
  // so they do not look alike (decision in 013-abweichungen.md, both variants as screenshots)
  return `<section class="kpis four" aria-label="Kennzahlen">${tiles}</section>
    <button class="money-row" data-act="screen" data-to="finanzen">Kosten · <b>${net ? eurShort(net) : '–'}</b> netto<span class="arr" aria-hidden="true">→</span></button>`;
}

function phaseChipsHTML() {
  const list = phases();
  const chip = (val, label, on) => `<button class="pchip" data-phase="${val}" aria-pressed="${on}">${esc(label)}</button>`;
  const ph = list.find((p) => p.id === ui.phase);
  return `<div class="chips-row">
    <span class="chips-label">Phase</span>
    <div class="pchips" role="group" aria-label="Phase">${chip('all', 'alle', ui.phase === null)}${list.map((p) => chip(p.id, p.id + ' ' + (p.short || p.name), ui.phase === p.id)).join('')}</div>
  </div>
  ${ph?.gate ? `<p class="gate-text">${esc(ph.gate)}</p>` : ''}`;
}

/* ---------- the columns: who has to act (docs/changes/009) ---------- */

const order = (a, b) => a.offset_days - b.offset_days || a.sort - b.sort;

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
  if (ui.wide) {
    // desktop: three columns side by side, "wartet auf dich" is a mark on the row
    return [
      column('me', `Ich (${OWN[me]})`, me, pool.filter((t) => t.owner === me)),
      column('B', 'Gemeinsam', 'B', pool.filter((t) => t.owner === 'B')),
      column('you', OWN[you], you, pool.filter((t) => t.owner === you)),
    ];
  }
  // phone: my own things first, then what waits for me, then shared, the other person collapsed
  const waiting = pool.filter((t) => waitsOnMe(t, me));
  const isWait = new Set(waiting.map((t) => t.id));
  const rest = (owner) => pool.filter((t) => t.owner === owner && !isWait.has(t.id));
  return [
    column('me', `Ich (${OWN[me]})`, me, rest(me)),
    column('wait', 'Wartet auf mich', 'wait', waiting),
    column('B', 'Gemeinsam', 'B', rest('B')),
    column('you', 'Bei ' + OWN[you], you, rest(you), true),
  ];
}

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
  const head = c.collapsible
    ? `<button class="col-head" data-act="col-toggle" data-ref="${c.key}" aria-expanded="${!collapsed}" aria-controls="col-${c.key}">${inner}<span class="chev" aria-hidden="true">${collapsed ? '+' : '−'}</span></button>`
    : `<div class="col-head">${inner}</div>`;
  // an empty column keeps its head (the count is the information) and says what it means (A5)
  const body =
    collapsed
      ? ''
      : `<div class="col-body" id="col-${c.key}">
        ${total ? '' : `<p class="col-empty">${esc(emptyText())}</p>`}
        ${rows.map(taskHTML).join('')}
        ${!all && c.open.length > CAP ? `<button class="col-more" data-act="col-all" data-ref="${c.key}">weitere ${c.open.length - CAP} zeigen →</button>` : ''}
        ${
          c.blocked.length
            ? `<button class="col-sub" data-act="col-blocked" data-ref="${c.key}" aria-expanded="${showBlocked}" aria-controls="blocked-${c.key}">${c.blocked.length} ${c.blocked.length === 1 ? 'wartet' : 'warten'} auf einen Vorgänger<span class="chev" aria-hidden="true">${showBlocked ? '−' : '+'}</span></button>${showBlocked ? `<div id="blocked-${c.key}">${c.blocked.map(taskHTML).join('')}</div>` : ''}`
            : ''
        }
        ${showDone ? c.done.map(taskHTML).join('') : ''}
        ${c.done.length && !showDone ? `<button class="col-more" data-act="col-done" data-ref="${c.key}">${c.done.length} erledigt zeigen</button>` : ''}
      </div>`;
  return `<section class="col ${c.key} own-${c.cls}" data-col="${c.key}">${head}${body}</section>`;
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
      <button class="btn ${claude ? 'claude' : 'primary'}" data-act="add">Hinzufügen</button>
    </div></div>`;
}

export function dashboardView() {
  const filter = ui.filter && FILTERS[ui.filter] ? ui.filter : null;
  const q = term();
  // docs/changes/012: the sections stay, the ones without a hit go
  const cols = columns().filter((c) => !q || c.open.length + c.blocked.length + c.done.length);
  const hits = cols.reduce((n, c) => n + c.open.length + c.blocked.length + c.done.length, 0);
  const filterRow = filter
    ? `<div class="filter-row">
        <button class="filter-chip" data-act="filter-clear" aria-label="Filter entfernen">Filter: ${FILTERS[filter].label}<span class="x" aria-hidden="true">×</span></button>
        <span class="filter-count">${hits} ${hits === 1 ? 'Aufgabe' : 'Aufgaben'}${ui.phase ? ' in Phase ' + ui.phase : ''}</span>
      </div>`
    : '';
  // docs/changes/006 + 013 A3: from 1180 px the list and a quiet side panel sit next to each
  // other; between 900 and 1179 px the list uses the full width and the Akte is an overlay
  const open = ui.expanded ? byId(ui.expanded) : null;
  const panelTask = ui.mode === 'panel' ? open : null;
  return (
    updateBarHTML() +
    `<div class="board mode-${ui.mode}"><div class="col-list">` +
    headHTML() +
    searchHTML() +
    visitHTML() +
    kpisHTML() +
    phaseChipsHTML() +
    filterRow +
    (q && !cols.length ? `<p class="empty no-hits">Kein Treffer für „${esc(q)}“ – auch nicht in den Teilschritten.</p>` : `<div class="cols">${cols.map(columnHTML).join('')}</div>`) +
    addBoxHTML() +
    `</div>` +
    (ui.mode === 'panel' ? panelHTML(panelTask) : '') +
    `</div>` +
    (ui.mode === 'overlay' ? overlayHTML(open) : '') +
    (ui.printOpen ? printHTML() : '') +
    (ui.changelogOpen ? changelogHTML() : '') +
    footHTML()
  );
}

function panelHTML(t) {
  if (!t) return `<aside class="panel empty" id="panel" aria-label="Akte"><p>Aufgabe wählen</p></aside>`;
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
      <summary>Version ${esc(g.key)}</summary>
      ${g.entries.map(article).join('')}
    </details>`)
    .join('');
  return `<section class="changelog" id="changelog" aria-labelledby="changelog-title">
    <div class="changelog-head"><h2 id="changelog-title">Was ist neu?</h2><span class="spacer"></span><button class="btn small" data-act="changelog-close">Schließen</button></div>
    ${body || '<p class="empty">Noch keine Einträge.</p>'}
  </section>`;
}
