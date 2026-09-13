// "Im Blick": critical & open (highlighted), overdue, waiting for someone.
import { state, dueInfo, bySort } from '../state.js';
import { listHTML } from '../ui/task.js';

export function focusView() {
  const open = state.tasks.filter((t) => !t.done);
  const crit = open.filter((t) => t.critical).sort(bySort);
  const late = open.filter((t) => !t.critical && dueInfo(t).cls === 'late').sort(bySort);
  const wait = open.filter((t) => t.wait_on);
  return `<section class="focus"><h2>Fristkritisch und offen</h2>${listHTML(crit, 'Nichts Kritisches offen.')}</section>
    ${late.length ? `<h2 class="sec">Überfällig</h2>${listHTML(late)}` : ''}
    ${wait.length ? `<h2 class="sec">Wartet auf jemanden</h2>${listHTML(wait)}` : ''}`;
}
