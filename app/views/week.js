// "Diese Woche": per person – possible now, waiting for me, blocked.
import { state, blockers, forPerson, bySort } from '../state.js';
import { OWN } from '../ui/labels.js';
import { listHTML } from '../ui/task.js';

export function weekView() {
  const open = state.tasks.filter((t) => !t.done);
  const section = (p) => {
    const mine = open.filter((t) => forPerson(t, p) && t.type !== 'claude');
    const ready = mine.filter((t) => !blockers(t).length).sort(bySort).slice(0, 6);
    const blocked = mine.filter((t) => blockers(t).length).sort(bySort).slice(0, 4);
    const waiting = open.filter((t) => t.wait_on === p);
    return `<h2 class="sec ${p === state.person ? 'me' : ''}">${OWN[p]}${p === state.person ? ' (ich)' : ''}<small>${ready.length} jetzt möglich · ${blocked.length} blockiert</small></h2>
      ${listHTML(ready, 'Nichts fällig.')}
      ${waiting.length ? `<h2 class="sec sub">Wartet auf ${OWN[p]}</h2>${listHTML(waiting)}` : ''}
      ${blocked.length ? `<h2 class="sec sub muted">Noch blockiert</h2>${listHTML(blocked)}` : ''}`;
  };
  const order = state.person === 'A' ? ['A', 'S'] : ['S', 'A'];
  return order.map(section).join('');
}
