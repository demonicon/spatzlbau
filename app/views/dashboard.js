// Dashboard (docs/changes/002): countdown, gate bar, KPI tiles as filters, phase tabs, task list.
// Everything on this screen is derived from state.js; filters live in filters.js.
import { BUILD } from '../config.js';
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, phases, einzug } from '../state.js';
import { FILTERS, matches, count, atClaude, isWaiting } from '../filters.js';
import { listHTML } from '../ui/task.js';
import { detailHTML } from '../ui/detail.js';
import { compareVersions, hasUnread } from '../changelog.js';

const DAY = 86400000;

function daysToMoveIn() {
  const base = einzug();
  if (!base) return null;
  const dt = new Date(base + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt - today) / DAY);
}

function headHTML() {
  const base = einzug();
  const days = daysToMoveIn();
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const dateLong = base ? new Date(base + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const hero = !base
    ? `<span class="n open">Termin offen</span><span class="t">Einzugstermin eintragen, dann zählt die App</span>`
    : days > 0
      ? `<span class="n">${days}</span><span class="t">${days === 1 ? 'Tag' : 'Tage'} bis zur Schlüsselübergabe</span>`
      : days === 0
        ? `<span class="n">Heute</span><span class="t">ist Schlüsselübergabe</span>`
        : `<span class="n">${-days}</span><span class="t">${-days === 1 ? 'Tag' : 'Tage'} seit der Schlüsselübergabe</span>`;
  const showDate = ui.dateEdit || !base;
  return `<header class="dash-head">
    <div class="eyebrow-row">
      <button class="eyebrow btn-like" data-act="date-toggle" aria-expanded="${showDate}">Einzug · ${base ? esc(dateLong) : 'Termin eintragen'}</button>
      <span class="pct">${pct} % erledigt</span>
    </div>
    <div class="who-row">
      <span class="who ${state.person}" aria-label="Angemeldet als ${OWN[state.person]}"><span class="initial" aria-hidden="true">${state.person}</span>${OWN[state.person]}</span>
      <span class="spacer"></span>
      <span class="status" id="status" role="status"></span>
    </div>
    <div class="hero-row">
    <div class="hero">${hero}</div>
    ${showDate ? `<div class="date-edit"><label class="hint" for="einzug">Schlüsselübergabe neue Wohnung</label><input type="date" id="einzug" value="${esc(base)}"></div>` : ''}
    ${gatesHTML()}
    </div>
  </header>`;
}

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
      return `<button class="${cls}" data-phase="${p.id}" aria-pressed="${ui.phase === p.id}" title="${esc(p.name)}">
        <span class="lbl">${p.id}<span> · ${dn}/${all.length}</span></span>
        <span class="bar"><i data-pct="${pct}"></i></span>
      </button>`;
    })
    .join('')}</div>`;
}

function kpisHTML() {
  const me = state.person;
  const pressed = (k) => `aria-pressed="${ui.filter === k}"`;
  const tile = (key, label, sub = '') => {
    const n = count(key);
    return `<button class="tile ${key} ${n ? '' : 'zero'}" data-filter="${key}" ${pressed(key)}>
      <span class="n"><span>${n}</span></span>
      <span class="l">${label}${sub ? `<span> ${sub}</span>` : ''}</span>
    </button>`;
  };
  const owners = ['S', 'A', 'B']
    .map((o) => `<button class="owner ${o}" data-filter="${o}" ${pressed(o)}>${OWN[o]} <b>${count(o)}</b></button>`)
    .join('');
  return `<section class="kpis" aria-label="Kennzahlen">
    <div class="kpi-top">
      <button class="kpi-open" data-filter="open" ${pressed('open')}><span class="n">${count('open')}</span><span class="l">Offen</span></button>
      <div class="owners">${owners}</div>
    </div>
    ${tile('week', 'Diese Woche', `· ${OWN[me]}`)}
    ${tile('claude', 'Bei Claude', `· am Zug ${state.tasks.filter(atClaude).length}`)}
    ${tile('wait', 'Wartet auf jemanden', `· auf mich ${state.tasks.filter((t) => isWaiting(t) && t.wait_on === me).length}`)}
    ${tile('blocked', 'Blockiert')}
    ${tile('critical', 'Fristkritisch')}
    ${tile('late', 'Überfällig')}
  </section>`;
}

function tabsHTML() {
  const list = phases();
  const tabs = list
    .map((p) => {
      const all = state.tasks.filter((t) => t.phase === p.id);
      const n = ui.filter ? all.filter((t) => matches(t, ui.filter)).length : all.filter((t) => !t.done).length;
      return `<button role="tab" data-phase="${p.id}" aria-selected="${ui.phase === p.id}"><span class="no">${p.id}</span>${esc(p.short || p.name)}<span class="cnt">${ui.filter ? n : n + ' offen'}</span></button>`;
    })
    .join('');
  const ph = list.find((p) => p.id === ui.phase);
  return `<div class="tabs-row"><nav class="tabs" role="tablist" aria-label="Phasen">${tabs}</nav>
    <p class="gate-text">${esc(ph?.gate || '')}</p></div>`;
}

function addBoxHTML(phase) {
  const claude = ui.filter === 'claude';
  return `<div class="addbox" data-p="${phase}">
    <div class="row"><input type="text" data-input="new-t" placeholder="${claude ? 'Neue Claude-Aufgabe' : 'Neue Aufgabe'} in Phase ${phase}" aria-label="Titel der neuen Aufgabe"></div>
    <div class="row">
      <select data-input="new-o" aria-label="Zuständig"><option value="B">gemeinsam</option><option value="S">Sebastian</option><option value="A">Anna</option></select>
      <select data-input="new-type" aria-label="Typ"><option value="self">nur ihr</option><option value="assist">Claude unterstützt</option><option value="claude" ${claude ? 'selected' : ''}>an Claude delegiert</option></select>
      <span class="row nowrap"><input type="number" inputmode="numeric" data-input="new-w" value="2" min="0" class="num" aria-label="Wochen"><select data-input="new-dir" aria-label="Richtung"><option value="-1">Wochen vorher</option><option value="1">Wochen danach</option></select></span>
      <label class="check-label"><input type="checkbox" data-input="new-c"> kritisch</label>
      <button class="btn ${claude ? 'claude' : 'primary'}" data-act="add">Hinzufügen</button>
    </div></div>`;
}

export function dashboardView() {
  const filter = ui.filter && FILTERS[ui.filter] ? ui.filter : null;
  const inPhase = state.tasks.filter((t) => t.phase === ui.phase);
  const list = inPhase.filter((t) => matches(t, filter)).sort((a, b) => a.offset_days - b.offset_days || a.sort - b.sort);
  const filterRow = filter
    ? `<div class="filter-row">
        <button class="filter-chip" data-act="filter-clear" aria-label="Filter entfernen">Filter: ${FILTERS[filter].label}<span class="x" aria-hidden="true">×</span></button>
        <span class="filter-count">${list.length} in dieser Phase</span>
      </div>`
    : '';
  // docs/changes/006: on wide screens the list and a side panel always sit side by side;
  // the panel holds the Akte of the open task or a quiet placeholder, so the layout never jumps
  const panelTask = ui.wide && ui.expanded ? state.tasks.find((t) => t.id === ui.expanded) : null;
  return (
    `<div class="board"><div class="col-list">` +
    headHTML() +
    kpisHTML() +
    tabsHTML() +
    filterRow +
    `<div class="list">${listHTML(list, 'Nichts in diesem Filter.')}${addBoxHTML(ui.phase)}</div>` +
    `</div>` +
    (ui.wide ? panelHTML(panelTask) : '') +
    `</div>` +
    (ui.changelogOpen ? changelogHTML() : '') +
    footerHTML()
  );
}

function panelHTML(t) {
  if (!t) return `<aside class="panel empty" id="panel" aria-label="Akte"><p>Aufgabe wählen</p></aside>`;
  const ph = phases().find((p) => p.id === t.phase);
  return `<aside class="panel" id="panel" data-id="${t.id}" aria-label="Akte: ${esc(t.title)}">
    <div class="panel-head"><span class="hint">Phase ${t.phase}${ph ? ' · ' + esc(ph.name) : ''}</span><span class="spacer"></span><button class="ico" data-act="panel-close" aria-label="Akte schließen">×</button></div>
    ${detailHTML(t)}
  </aside>`;
}

/* ---------- changelog (docs/changes/005): version in the footer, "Was ist neu?" panel ---------- */
const current = () => ui.changelog?.entries?.[0] || null;
const build = () => (BUILD.startsWith('__') ? '' : BUILD);

function footerHTML() {
  const cur = current();
  const unseen = hasUnread();
  const version = cur
    ? `<button class="link version" data-act="changelog" aria-expanded="${!!ui.changelogOpen}" title="${build() ? 'Build ' + build() : ''}">${esc(cur.version)}${unseen ? '<span class="dot" aria-label="neu">Neu</span>' : ''}</button>`
    : `<span title="${build() ? 'Build ' + build() : ''}">Version unbekannt</span>`;
  return `<footer class="foot">${version}<button class="link" data-act="reload">Neu laden</button><span class="spacer"></span><button class="link" data-act="logout">Abmelden</button></footer>`;
}

const SECTIONS = [['new', 'Neu'], ['improved', 'Verbessert'], ['fixed', 'Behoben']];
function changelogHTML() {
  const all = ui.changelog?.entries || [];
  // auto-opened: every version this person has not closed yet; opened from the footer: everything
  const entries = ui.changelogUnreadOnly ? all.filter((e) => compareVersions(e.version, state.lastSeenVersion) > 0) : all;
  const body = entries
    .map(
      (e) => `<article class="release">
      <h3><span class="v">${esc(e.version)}</span>${esc(e.title || '')}</h3>
      ${SECTIONS.map(([k, label]) => (Array.isArray(e[k]) && e[k].length ? `<h4>${label}</h4><ul>${e[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')).join('')}
    </article>`,
    )
    .join('');
  return `<section class="changelog" id="changelog" aria-labelledby="changelog-title">
    <div class="changelog-head"><h2 id="changelog-title">Was ist neu?</h2>${build() ? `<span class="hint">Build ${esc(build())}</span>` : ''}<span class="spacer"></span><button class="btn small" data-act="changelog-close">Schließen</button></div>
    ${body || '<p class="empty">Noch keine Einträge.</p>'}
  </section>`;
}
