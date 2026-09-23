// "Umzugstag drucken" (docs/changes/009): one sheet for the day itself, on paper.
// Phase 4 grouped by person, subtasks as boxes to tick, plus the three things nobody
// wants to look up on a phone with cold hands: meter readings, keys, emergency numbers.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, phases, einzug, umzugstag, subsOf, dueInfo } from '../state.js';

const METERS = ['Strom', 'Gas', 'Wasser'];
const METER_FIELDS = ['Zählernummer', 'Stand', 'Uhrzeit'];
const PLACES = [
  ['S', 'Wohnung Sebastian'],
  ['A', 'Wohnung Anna'],
  ['N', 'Neue Wohnung'],
];
const box = (on) => `<span class="pbox${on ? ' on' : ''}" aria-hidden="true">${on ? '✓' : ''}</span>`;
const line = (label) => `<div class="pline"><span>${esc(label)}</span><span class="pfill"></span></div>`;
// docs/changes/013 B1: one line each for the meter number, the reading and the time - one blank
// line per meter was not enough to note down what the number actually belongs to
const meterBlock = (m) => `<div class="pmi"><span class="pmi-l">${esc(m)}</span>${METER_FIELDS.map(line).join('')}</div>`;

export function printHTML() {
  // bugfix 1.1: the sheet is for the day itself - the moving day, falling back to the key
  // handover date while the moving day is not entered yet
  const base = umzugstag() || einzug();
  const day = base
    ? new Date(base + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Termin steht noch nicht fest';
  const ph = phases().find((p) => p.id === 4);
  const tasks = state.tasks.filter((t) => t.phase === 4).sort((a, b) => dueInfo(a).sort - dueInfo(b).sort || a.sort - b.sort);
  const kontakte = typeof state.settings.umzugstag_kontakte === 'string' ? state.settings.umzugstag_kontakte : '';

  const taskRow = (t) => `<div class="prow">${box(t.done)}<div class="pbody">
      <div class="pt">${esc(t.title)}${t.critical ? ' <span class="pcrit">fristkritisch</span>' : ''}</div>
      ${subsOf(t.id).map((s) => `<div class="psub">${box(s.done)}${esc(s.title)}</div>`).join('')}
    </div></div>`;

  const groups = ['S', 'A', 'B']
    .map((o) => {
      const list = tasks.filter((t) => t.owner === o);
      if (!list.length) return '';
      return `<section class="pgroup"><h3>${OWN[o]} <small>${list.length}</small></h3>${list.map(taskRow).join('')}</section>`;
    })
    .join('');

  return `<section class="printsheet" id="printsheet" aria-labelledby="print-title">
    <div class="print-head noprint">
      <h2 id="print-title">Umzugstag drucken</h2>
      <span class="spacer"></span>
      <button class="btn-primary" data-act="print-now">Drucken</button>
      <button class="btn-secondary" data-act="print-close">Schließen</button>
    </div>
    <div class="sheet">
      <h1>Umzugstag</h1>
      <p class="psub-head">${esc(day)}${ph ? ' · ' + esc(ph.gate || '') : ''}</p>
      <p class="psub-head">Stand: ${state.loadedAt ? esc(new Date(state.loadedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : '–'}${ui.offline ? ' · ohne Netz' : ''}</p>
      <section class="pgroup"><h3>Notfallkontakte</h3>
        <textarea class="noprint" data-input="kontakte" rows="4" placeholder="Umzugsfirma, Hausverwaltung alt und neu, Notdienst, Nachbarn – eine Zeile pro Kontakt" aria-label="Notfallkontakte">${esc(kontakte)}</textarea>
        <p class="onlyprint">${kontakte ? esc(kontakte) : ' '}</p>
        <p class="hint noprint">Wird für beide gespeichert und steht auf jedem Ausdruck.</p>
      </section>

      ${groups || '<p class="empty">In Phase 4 steht noch nichts.</p>'}

      <section class="pgroup"><h3>Zählerstände</h3>
        ${PLACES.map(([, name]) => `<div class="pmeter"><b>${esc(name)}</b>${METERS.map(meterBlock).join('')}</div>`).join('')}
      </section>

      <section class="pgroup"><h3>Schlüssel</h3>
        ${PLACES.map(([, name]) => `<div class="pmeter"><b>${esc(name)}</b>${line('Anzahl')}${line('übergeben an')}${line('am')}</div>`).join('')}
      </section>
    </div>
  </section>`;
}
