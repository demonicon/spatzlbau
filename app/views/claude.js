// "Bei Claude": delegated tasks grouped by state, plus "new Claude task".
import { state } from '../state.js';
import { STEPS, STEP_OWNER } from '../ui/labels.js';
import { listHTML } from '../ui/task.js';

export function claudeView() {
  const cl = state.tasks.filter((t) => t.type === 'claude' && !t.done);
  const groups = STEPS.map(([k, l]) => {
    const ts = cl.filter((t) => (t.status || 'briefing') === k);
    return ts.length ? `<h2 class="sec">${l}<small>${STEP_OWNER[k]} am Zug</small></h2>${listHTML(ts)}` : '';
  }).join('');
  return `<p class="intro">Jede Aufgabe kann in ihrer Akte auf „an Claude delegiert“ gestellt werden. Claude startet erst nach eurem Go, liest den Stand über die Export-URL und meldet sich im Chat; Ergebnisse landen per Claude Code hier.</p>
    ${groups || '<div class="empty">Noch nichts delegiert.</div>'}
    <div class="addbox"><div class="row"><input type="text" data-input="new-claude" placeholder="Neue Claude-Aufgabe (Phase 3, 4 Wochen vorher – später anpassbar)" aria-label="Neue Claude-Aufgabe"><button class="btn claude" data-act="add-claude">Anlegen</button></div></div>`;
}
