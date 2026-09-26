// Anfragen (docs/changes/033): comparisons asked of Claude in one place - list left, the anfrage
// right. From 900 px the list is a fixed 320 px and the detail takes the rest: the comparison
// table needs that width (five offers without horizontal scrolling at 1280 px). Below 900 px the
// list comes first and a tap opens the anfrage as its own page - the pattern of Entscheidungen.
import { esc, fmtTime } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, byId, anfrageById, fmtDay } from '../state.js';
import { commentsHTML, nextRunText, anfrageStepsHTML } from '../ui/detail.js';
import { ladderHTML } from '../ui/ladder.js';
import { listPanelHTML } from '../pages/listPanel.js';
import { sectionHTML } from '../pages/dashboard.js';
import {
  CATEGORIES, FIELDS, categoryOf, offersOf, shownOffers, cheapestId, isExpired, fmtPrice, PRICE_KIND,
  STEPS as AF_STEPS, stepIndex,
} from '../anfragen.js';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const day = (iso) => (iso ? fmtDay(String(iso).slice(0, 10)) : '');
// data from Claude or typed by a person ends up in href - only http(s) becomes a link
const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);
const linkHTML = (u, label) => {
  const s = safeUrl(u);
  if (!s) return u ? esc(u) : '–';
  let host = label;
  if (!host) try { host = new URL(s).hostname.replace(/^www\./, ''); } catch { host = s; }
  return `<a href="${esc(s)}" target="_blank" rel="noopener noreferrer">${esc(host)}</a>`;
};

const titleOf = (a) => a.title || CATEGORIES[categoryOf(a)].label;
const taskOf = (a) => byId(a.brief?.anfrage?.task_id) || null;

// Ergebnis da first - that is what is waiting for the two of them - then sent, drafts, decided
const RANK = { ergebnis: 0, claude: 1, briefing: 2, entschieden: 3 };
export function sortedAnfragen() {
  return state.anfragen
    .slice()
    .sort((a, b) => (RANK[a.status] ?? 4) - (RANK[b.status] ?? 4) || (b.updated_at || '').localeCompare(a.updated_at || ''));
}

function whenText(a) {
  const af = a.brief?.anfrage || {};
  const v = a.brief?.vergleich || {};
  if (a.status === 'entschieden') return `entschieden ${day(v.chosen_at)}`;
  if (a.status === 'ergebnis') return `Ergebnis ${day(v.updated_at || a.updated_at)}`;
  if (a.status === 'claude') return `gesendet ${day(af.sent_at)}`;
  return `Entwurf ${day(a.created_at)}`;
}

/* ---------- list ---------- */

// docs/changes/038 #22: two lines, not a card with a rung ladder underneath - title with the
// "Ergebnis da" chip above, the segment ladder with its state and the task below.
function rowHTML(a, selectedId) {
  const t = taskOf(a);
  const idx = stepIndex(a);
  return `<article class="af-row${a.id === selectedId ? ' selected' : ''}" data-act="anfrage-open" data-ref="${a.id}" tabindex="0" role="button" aria-label="Anfrage öffnen: ${esc(titleOf(a))}">
    <div class="af-row1"><b class="af-title">${esc(titleOf(a))}</b>${a.status === 'ergebnis' && !a.brief?.vergleich?.chosen ? '<span class="own C">Ergebnis da</span>' : ''}</div>
    <div class="af-row2">${ladderHTML(idx + 1, AF_STEPS.length, AF_STEPS[idx][1])}<span class="dr-task">· ${t ? esc(t.title) : 'ohne Aufgabe'}</span></div>
  </article>`;
}

function newFormHTML() {
  if (!ui.anfrageNew) return '';
  return `<div class="af-new" role="group" aria-label="Neue Anfrage">
    <p class="hint">Worum geht es?</p>
    <div class="seg">${Object.entries(CATEGORIES)
      .map(([k, c]) => `<button class="pill" data-act="anfrage-create" data-to="${k}">${esc(c.label)}</button>`)
      .join('')}</div>
  </div>`;
}

// docs/changes/038 #21: the list is a collapsible section with a section head - "Anfragen · 3 ·
// 1 Ergebnis", the anlegen "+" and the chevron. #24: the anlegen action stays where it was, top
// right of the list, and stays secondary.
function listHTML(selectedId) {
  const all = sortedAnfragen();
  const results = all.filter((a) => a.status === 'ergebnis').length;
  const open = ui.anfragenList !== false;
  const body = all.length
    ? all.map((a) => rowHTML(a, selectedId)).join('')
    : '<p class="empty">Noch keine Anfrage. „+ Anfrage“ stellt Claude einen Vergleich zusammen.</p>';
  return sectionHTML({
    key: 'anfragen',
    act: 'anfragen-list',
    title: 'Anfragen',
    count: all.length,
    note: results ? `· ${results} ${results === 1 ? 'Ergebnis' : 'Ergebnisse'}` : '',
    // #24: die Anlegen-Aktion bleibt oben rechts an der Liste und bleibt sekundär
    add: { label: '+ Anfrage', act: 'anfrage-new', primary: false, expanded: !!ui.anfrageNew },
    open,
    body: newFormHTML() + body,
  });
}

/* ---------- detail: draft ---------- */

function fieldHTML(f, value) {
  const id = `af-${f.key}`;
  const attr = `data-anfrage-field="${f.key}" id="${id}"`;
  if (f.type === 'bool') {
    return `<label class="check-label"><input type="checkbox" ${attr} ${value ? 'checked' : ''}> ${esc(f.label)}</label>`;
  }
  let control;
  if (f.type === 'textarea') control = `<textarea ${attr}>${esc(value ?? '')}</textarea>`;
  else if (f.type === 'select') {
    control = `<select ${attr}><option value="">bitte wählen</option>${f.options
      .map((o) => `<option ${value === o ? 'selected' : ''}>${esc(o)}</option>`)
      .join('')}</select>`;
  } else {
    const input = f.type === 'number' ? 'type="text" inputmode="decimal"' : `type="${f.type}"`;
    control = `<input ${input} ${attr} value="${esc(value ?? '')}">`;
  }
  return `<label class="lbl" for="${id}"><span class="lbl-h">${esc(f.label)}</span>${control}</label>`;
}

function taskSelectHTML(a) {
  const current = a.brief?.anfrage?.task_id || '';
  const tasks = state.tasks.slice().sort((x, y) => x.phase - y.phase || x.sort - y.sort);
  return `<label class="lbl" for="af-task"><span class="lbl-h">Gehört zu Aufgabe</span>
    <select id="af-task" data-anfrage-task><option value="">bitte wählen</option>${tasks
      .map((t) => `<option value="${t.id}" ${t.id === current ? 'selected' : ''}>${t.phase} · ${esc(t.title.slice(0, 60))}</option>`)
      .join('')}</select></label>`;
}

function draftHTML(a) {
  const cat = categoryOf(a);
  const fields = a.brief?.anfrage?.fields || {};
  const hasTask = !!taskOf(a);
  return `${taskSelectHTML(a)}
    <h3>Rahmen</h3>
    ${FIELDS[cat].map((f) => fieldHTML(f, fields[f.key])).join('')}
    ${fieldHTML({ key: 'notiz', label: 'Was noch wichtig ist', type: 'textarea' }, fields.notiz)}
    <div class="row"><button class="btn-primary" data-act="anfrage-send" ${hasTask ? '' : 'disabled aria-disabled="true"'}>An Claude senden</button></div>
    <p class="stand-line quiet">${hasTask ? 'Claude arbeitet um 8, 12, 15, 18 und 22 Uhr – oder jetzt mit dem Button' : 'Erst eine Aufgabe wählen – dort landen später Ergebnis und Entscheidung.'}</p>`;
}

/* ---------- detail: sent ---------- */

function frameReadHTML(a) {
  const cat = categoryOf(a);
  const fields = a.brief?.anfrage?.fields || {};
  const lines = [...FIELDS[cat], { key: 'notiz', label: 'Was noch wichtig ist', type: 'textarea' }]
    .filter((f) => fields[f.key] !== undefined && fields[f.key] !== '' && fields[f.key] !== false && fields[f.key] !== null)
    .map((f) => `<div class="akte-line"><span class="l">${esc(f.label)}</span><span class="v">${f.type === 'bool' ? 'ja' : f.type === 'date' ? esc(day(fields[f.key])) : esc(String(fields[f.key]))}</span></div>`);
  return lines.length ? `<h3>Rahmen</h3>${lines.join('')}` : '';
}

function sentHTML(a) {
  const af = a.brief?.anfrage || {};
  return `<p class="stand-line">Gesendet${af.sent_at ? ` ${esc(fmtTime(af.sent_at))}` : ''}${af.requested_by ? ` von ${esc(OWN[af.requested_by] || af.requested_by)}` : ''}.</p>
    <p class="stand-line quiet">Claude arbeitet um 8, 12, 15, 18 und 22 Uhr · ${nextRunText()}</p>
    ${frameReadHTML(a)}`;
}

/* ---------- detail: result ---------- */

const ROWS = [
  ['price', 'Preis'],
  ['price_kind', 'Art'],
  ['service', 'Leistung'],
  ['term', 'Termin'],
  // docs/changes/038c #2: vierte Detailzeile auf der Karte (ROWS ohne 'price')
  ['setup_fee', 'Einmalig'],
  ['valid_until', 'Gültig bis'],
  ['plusminus', 'Plus / Minus'],
  ['url', 'Quelle'],
];

function byText(o) {
  const who = o.author === 'C' || !o.author ? 'Claude' : OWN[o.author] || o.author;
  return `von ${who}${o.date ? ` · ${day(o.date)}` : ''}`;
}

function cellHTML(o, key, cheap) {
  switch (key) {
    case 'price':
      return o.id === cheap ? `<b>${esc(fmtPrice(o))}</b>` : esc(fmtPrice(o));
    case 'price_kind':
      return esc(PRICE_KIND[o.price_kind] || '–');
    case 'setup_fee':
      return esc(fmtPrice({ price: o.setup_fee }));
    case 'valid_until':
      if (!o.valid_until) return '–';
      return isExpired(o, today()) ? `<span class="tag replaced">abgelaufen · ${esc(day(o.valid_until))}</span>` : esc(day(o.valid_until));
    case 'plusminus':
      return [o.plus ? `<span class="vg-plus">+ ${esc(o.plus)}</span>` : '', o.minus ? `<span class="vg-minus">− ${esc(o.minus)}</span>` : ''].filter(Boolean).join('') || '–';
    case 'url':
      return o.url ? linkHTML(o.url) : esc(o.source && o.source !== 'manual' ? o.source : '–');
    default:
      return o[key] ? esc(o[key]) : '–';
  }
}

// docs/changes/038 #23: "Wählen" stands in every column, but filled only under the offer Claude
// recommends - the other columns get the secondary. One primary on the page, and it is the one
// the page suggests.
function offerActionsHTML(a, o) {
  const v = a.brief?.vergleich || {};
  if (v.chosen === o.id) return `<span class="vg-chosen-mark">✓ gewählt</span>`;
  const kind = o.id === v.recommended ? 'btn-primary' : 'btn-secondary';
  const choose = a.status === 'ergebnis' && !v.chosen ? `<button class="${kind}" data-act="offer-choose" data-to="${esc(o.id)}">Wählen</button>` : '';
  return `${choose}<button class="btn-text quiet" data-act="offer-edit" data-to="${esc(o.id)}">ändern</button>`;
}

function tableHTML(a, offers, cheap) {
  const v = a.brief?.vergleich || {};
  return `<table class="vg-table">
    <colgroup><col class="c-label">${offers.map(() => '<col>').join('')}</colgroup>
    <thead><tr><th></th>${offers
      .map(
        (o) => `<th class="${[v.chosen === o.id ? 'vg-chosen' : '', o.id === v.recommended ? 'vg-reco-col' : ''].filter(Boolean).join(' ')}" scope="col">${esc(o.name || 'Angebot')}<span class="vg-by">${esc(byText(o))}${
          o.id === v.recommended ? ' · Claude empfiehlt' : ''
        }</span></th>`,
      )
      .join('')}</tr></thead>
    <tbody>${ROWS.map(
      ([k, l]) => `<tr><th scope="row">${l}</th>${offers.map((o) => `<td class="${v.chosen === o.id ? 'vg-chosen' : ''}">${cellHTML(o, k, cheap)}</td>`).join('')}</tr>`,
    ).join('')}</tbody>
    <tfoot><tr><th></th>${offers.map((o) => `<td>${offerActionsHTML(a, o)}</td>`).join('')}</tr></tfoot>
  </table>`;
}

// docs/changes/038 #23: on a phone the comparison is transposed - one row per offer with name
// and price, and only the opened one unfolds the rest and shows "Wählen" (40).
function cardsHTML(a, offers, cheap) {
  const v = a.brief?.vergleich || {};
  // the recommended offer first on a phone (033); the table keeps Claude's order
  const list = v.recommended ? [...offers.filter((o) => o.id === v.recommended), ...offers.filter((o) => o.id !== v.recommended)] : offers;
  return `<div class="vg-rows">${list
    .map((o) => {
      const open = ui.offerOpen === o.id;
      return `<article class="vg-row${v.chosen === o.id ? ' vg-chosen' : ''}">
      <button class="vg-row-h" data-act="offer-open" data-to="${esc(o.id)}" aria-expanded="${open}">
        <span class="vg-row-n"><b>${esc(o.name || 'Angebot')}</b><span class="vg-by">${esc(byText(o))}${o.id === v.recommended ? ' · Claude empfiehlt' : ''}</span></span>
        <span class="vg-row-p">${o.id === cheap ? `<b>${esc(fmtPrice(o))}</b>` : esc(fmtPrice(o))}</span>
        <span class="vg-row-c" aria-hidden="true">${open ? '⌃' : '⌄'}</span>
      </button>
      ${
        open
          ? `<dl class="vg-dl">${ROWS.filter(([k]) => k !== 'price').map(([k, l]) => `<dt>${l}</dt><dd>${cellHTML(o, k, cheap)}</dd>`).join('')}</dl>
             <div class="row vg-row-a">${offerActionsHTML(a, o)}</div>`
          : ''
      }
    </article>`;
    })
    .join('')}</div>`;
}

function offerEditHTML(a) {
  const e = ui.offerEdit;
  if (!e || e.id !== a.id) return '';
  const o = e.offerId === 'new' ? {} : offersOf(a).find((x) => x.id === e.offerId) || {};
  const txt = (k, l, extra = '') => `<label class="lbl"><span class="lbl-h">${l}</span><input type="text" data-input="of-${k}" value="${esc(o[k] ?? '')}" ${extra}></label>`;
  return `<div class="cost-form vg-edit">
    <h3>${e.offerId === 'new' ? 'Eigenes Angebot' : 'Angebot ändern'}</h3>
    ${txt('name', 'Anbieter')}
    <div class="row">
      ${txt('price', 'Preis in €', 'inputmode="decimal"')}
      <label class="lbl"><span class="lbl-h">Art</span><select data-input="of-price_kind">${Object.entries(PRICE_KIND)
        .map(([k, l]) => `<option value="${k}" ${(o.price_kind || 'fest') === k ? 'selected' : ''}>${l}</option>`)
        .join('')}</select></label>
    </div>
    ${txt('setup_fee', 'Einmalig in € (optional)', 'inputmode="decimal"')}
    ${txt('service', 'Leistung')}
    <div class="row">${txt('term', 'Termin')}<label class="lbl"><span class="lbl-h">Gültig bis</span><input type="date" data-input="of-valid_until" value="${esc(o.valid_until || '')}"></label></div>
    ${txt('plus', 'Plus')}${txt('minus', 'Minus')}${txt('url', 'Link (optional)', 'inputmode="url"')}
    <div class="row"><button class="btn-secondary" data-act="offer-save">Speichern</button><button class="btn-text" data-act="offer-cancel">Abbrechen</button></div>
  </div>`;
}

function moneyHTML(a) {
  const m = ui.anfrageMoney;
  if (!m || m.id !== a.id) return '';
  // docs/changes/038c #2: 'none' mit `extra` fragt trotzdem - der Posten aus setup_fee, auch ohne
  // eine Laufend-Zeile für die Kategorie
  if (m.money.kind === 'none' && !m.money.question) return m.money.note ? `<p class="stand-line quiet">${esc(m.money.note)}</p>` : '';
  return `<p class="confirm block af-money">${esc(m.money.question)} <button class="btn-secondary" data-act="money-yes">Ja</button><button class="btn-text" data-act="money-no">Nein</button></p>`;
}

function resultHTML(a) {
  const v = a.brief?.vergleich || {};
  const offers = shownOffers(a);
  const more = offersOf(a).length - offers.length;
  const cheap = cheapestId(offers);
  const reco = v.recommendation ? (/^claude empfiehlt/i.test(v.recommendation) ? v.recommendation : `Claude empfiehlt: ${v.recommendation}`) : '';
  const chosen = offersOf(a).find((o) => o.id === v.chosen);
  return `${reco ? `<p class="vg-reco">${esc(reco)}</p>` : ''}
    ${moneyHTML(a)}
    ${
      chosen
        ? `<p class="stand-line">Gewählt: <b>${esc(chosen.name)}</b> · ${esc(OWN[v.chosen_by] || v.chosen_by || '')} ${esc(day(v.chosen_at))} <button class="btn-text quiet" data-act="offer-unchoose">Wahl aufheben</button></p>`
        : ''
    }
    ${offers.length ? (ui.wide ? tableHTML(a, offers, cheap) : cardsHTML(a, offers, cheap)) : '<p class="empty">Noch keine Angebote.</p>'}
    ${more > 0 ? `<p class="stand-line quiet">${more} weitere${more === 1 ? 's' : ''} Angebot${more === 1 ? '' : 'e'} nicht gezeigt – die Tabelle zeigt höchstens fünf.</p>` : ''}
    ${ui.offerEdit?.id === a.id ? offerEditHTML(a) : `<button class="btn-text row" data-act="offer-edit" data-to="new">+ Angebot</button>`}
    ${v.reason ? `<h3>Begründung</h3><p class="stand-line">${esc(v.reason)}</p>` : ''}
    ${Array.isArray(v.sources) && v.sources.length ? `<h3>Quellen</h3><ul class="vg-sources">${v.sources.map((u) => `<li>${linkHTML(u)}</li>`).join('')}</ul>` : ''}
    ${categoryOf(a) === 'umzug' && v.request_text ? `<div class="row"><button class="btn-secondary" data-act="anfrage-copy">Anfragetext kopieren</button></div>` : ''}
    ${frameReadHTML(a)}`;
}

/* ---------- detail ---------- */

function detailHTML(a) {
  const t = taskOf(a);
  const body = a.status === 'briefing' ? draftHTML(a) : a.status === 'claude' ? sentHTML(a) : resultHTML(a);
  return `<div class="detail af-detail">
    <h2 class="akte-title-text">${esc(titleOf(a))}</h2>
    <div class="akte-meta nohead-meta">${t ? `<button class="tlink" data-act="fin-open" data-ref="${t.id}">${esc(t.title)}</button>` : '<span class="muted">ohne Aufgabe</span>'}<span class="muted">${esc(CATEGORIES[categoryOf(a)].label)}</span></div>
    ${anfrageStepsHTML(a)}
    ${body}
    ${a.status === 'briefing' ? '' : commentsHTML(a, { decisions: false, placeholder: 'Nachfrage an Claude, z. B. „@claude bitte auch Anbieter X“ …' })}
  </div>`;
}

export function anfragenView() {
  const list = sortedAnfragen();
  const explicit = ui.anfrage ? anfrageById(ui.anfrage) : null;
  // #21: nothing chosen yet shows the first row - the one that most likely waits for them
  const shown = ui.wide ? explicit || list[0] || null : explicit;
  return listPanelHTML({
    key: 'anfragen',
    wide: ui.wide,
    panelMode: ui.wide,
    layout: 'wide', // #21: list 320 | detail 1fr - the one exception from Panel 400
    list: listHTML(shown?.id),
    panel: shown ? detailHTML(shown) : '',
    panelId: shown?.id,
    panelLabel: shown ? 'Anfrage: ' + titleOf(shown) : 'Anfrage',
    panelEmpty: '<p>Noch keine Anfrage – „+“ legt eine an.</p>',
    detail: shown ? detailHTML(shown) : '',
    backLabel: 'Anfragen',
    backAct: 'anfrage-close',
  });
}
