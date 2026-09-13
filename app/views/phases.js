// "Phasen": five phases with gate text, filter chips, add-task box per phase.
import { state, ui, phases } from '../state.js';
import { esc } from '../ui/dom.js';
import { listHTML } from '../ui/task.js';

const FILTERS = [['all', 'Alle'], ['S', 'Sebastian'], ['A', 'Anna'], ['B', 'Gemeinsam'], ['open', 'Nur offene']];

function addBoxHTML(p) {
  return `<div class="addbox" data-p="${p}">
    <div class="row"><input type="text" data-input="new-t" placeholder="Neue Aufgabe in Phase ${p}" aria-label="Titel der neuen Aufgabe"></div>
    <div class="row">
      <select data-input="new-o" aria-label="Zuständig"><option value="B">gemeinsam</option><option value="S">Sebastian</option><option value="A">Anna</option></select>
      <select data-input="new-type" aria-label="Typ"><option value="self">nur ihr</option><option value="assist">Claude unterstützt</option><option value="claude">an Claude delegiert</option></select>
      <span class="row nowrap"><input type="number" inputmode="numeric" data-input="new-w" value="2" min="0" class="num" aria-label="Wochen"><select data-input="new-dir" aria-label="Richtung"><option value="-1">Wochen vorher</option><option value="1">Wochen danach</option></select></span>
      <label class="check"><input type="checkbox" data-input="new-c"> kritisch</label>
      <button class="btn primary" data-act="add">Hinzufügen</button>
    </div></div>`;
}

export function phasesView() {
  const chips = `<div class="chips" role="group" aria-label="Filter">${FILTERS.map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${ui.filter === k}">${l}</button>`).join('')}</div>`;
  const list = phases().length ? phases() : [1, 2, 3, 4, 5].map((id) => ({ id, name: 'Phase ' + id, gate: '' }));
  return (
    chips +
    list
      .map((ph) => {
        const all = state.tasks.filter((t) => t.phase === ph.id);
        const shown = all
          .filter((t) => ui.filter === 'all' || (ui.filter === 'open' ? !t.done : t.owner === ui.filter))
          .sort((a, b) => a.offset_days - b.offset_days || a.sort - b.sort);
        const dn = all.filter((t) => t.done).length;
        const isOpen = ui.phaseOpen[ph.id] !== false;
        return `<section class="phase" data-p="${ph.id}" data-open="${isOpen}">
        <button class="phase-head" data-act="phase-toggle" aria-expanded="${isOpen}"><span class="n">${ph.id}</span><h2>${esc(ph.name)}</h2><span class="cnt">${dn}/${all.length}</span><span aria-hidden="true">${isOpen ? '▾' : '▸'}</span><span class="gate">${esc(ph.gate)}</span></button>
        <div class="list">${listHTML(shown, 'Nichts in diesem Filter.')}${addBoxHTML(ph.id)}</div></section>`;
      })
      .join('')
  );
}
