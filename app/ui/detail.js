// Detail panel ("Akte") of a task: editable fields, dependencies, subtasks, Claude briefing,
// advice sections, comments, delete with inline confirmation.
import { esc, fmtTime } from './dom.js';
import { OWN, TYPE, STEPS, STEP_OWNER, ADV } from './labels.js';
import { state, ui, byId, subsOf, comsOf } from '../state.js';

const opts = (sel, arr) => arr.map(([v, l]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${l}</option>`).join('');

export function detailHTML(t) {
  const others = state.tasks.filter((x) => x.id !== t.id && !(t.blocked_by || []).includes(x.id)).sort((a, b) => a.phase - b.phase || a.sort - b.sort);
  const stepIdx = STEPS.findIndex((s) => s[0] === t.status);
  const subs = subsOf(t.id);
  const coms = comsOf(t.id);
  const brief = t.brief || {};
  const adv = t.advice || {};
  const del =
    ui.confirm === 'del:' + t.id
      ? `<span class="confirm">Wirklich löschen? <button class="btn small danger" data-act="del-yes">Ja, löschen</button><button class="btn small" data-act="confirm-no">Nein</button></span>`
      : `<button class="btn small danger" data-act="del">Aufgabe löschen</button>`;

  return `<div class="detail" data-detail="${t.id}">
    <h3>Aufgabe</h3>
    <div class="row"><input type="text" data-field="title" value="${esc(t.title)}" aria-label="Titel"></div>
    <div class="row">
      <select data-field="owner" aria-label="Zuständig">${opts(t.owner, Object.entries(OWN).filter(([k]) => k !== 'C'))}</select>
      <select data-field="type" aria-label="Typ">${opts(t.type, Object.entries(TYPE))}</select>
      <select data-field="wait_on" aria-label="Wartet auf"><option value="">wartet auf niemanden</option>${opts(t.wait_on || '', [['S', 'wartet auf Sebastian'], ['A', 'wartet auf Anna'], ['C', 'wartet auf Claude']])}</select>
      <span class="row nowrap"><input type="number" inputmode="numeric" data-field="offset_days" value="${t.offset_days}" class="num" aria-label="Tage relativ zum Einzug"><span class="hint">Tage (− vor / + nach Einzug)</span></span>
      <label class="check-label"><input type="checkbox" data-field="critical" ${t.critical ? 'checked' : ''}> fristkritisch</label>
    </div>

    <h3>Hängt ab von</h3>
    <div class="chips">${
      (t.blocked_by || [])
        .map((id) => {
          const b = byId(id);
          return b ? `<span class="chip">${b.done ? '✓ ' : ''}${esc(b.title.slice(0, 36))} <button class="ico" data-act="unblock" data-ref="${id}" aria-label="Abhängigkeit entfernen">×</button></span>` : '';
        })
        .join('') || '<span class="empty">keine</span>'
    }</div>
    <div class="row"><select data-act="block-select" aria-label="Abhängigkeit hinzufügen"><option value="">+ Abhängigkeit wählen …</option>${others.map((x) => `<option value="${x.id}">${x.phase} · ${esc(x.title.slice(0, 60))}</option>`).join('')}</select></div>

    <h3>Teilschritte</h3>
    ${subs.map((s) => `<div class="sub ${s.done ? 'done' : ''}" data-sub="${s.id}"><input type="checkbox" ${s.done ? 'checked' : ''} data-act="sub-done" aria-label="Teilschritt erledigt"><span>${esc(s.title)}</span><button class="ico" data-act="sub-del" aria-label="Teilschritt löschen">×</button></div>`).join('')}
    <div class="row"><input type="text" data-input="sub" placeholder="Neuer Teilschritt" aria-label="Neuer Teilschritt"><button class="btn small" data-act="sub-add">Hinzufügen</button></div>

    ${
      t.type === 'claude'
        ? `<h3>Delegation an Claude</h3>
    <div class="brief">
      <ol class="steps" aria-label="Zustandsverlauf">${STEPS.map((s, i) => `<li class="${i === stepIdx ? 'cur' : i < stepIdx ? 'past' : ''}" ${i === stepIdx ? 'aria-current="step"' : ''}><i></i><span>${s[1]}</span></li>`).join('')}</ol>
      <div class="turn">Jetzt dran: <b>${STEP_OWNER[t.status] || 'ihr'}</b></div>
      <label>Ziel – was soll am Ende vorliegen?<textarea data-brief="goal" placeholder="z. B. Shortlist mit 3 Umzugsfirmen inkl. Preisrahmen und Verfügbarkeit im Zeitfenster">${esc(brief.goal)}</textarea></label>
      <label>Kontext & Rahmendaten – alles, was Claude wissen muss<textarea data-brief="ctx" placeholder="z. B. 3-Zimmer + 2-Zimmer, beide 3. OG ohne Aufzug, ~35 m³, Budget bis …, Wunschzeitraum …">${esc(brief.ctx)}</textarea></label>
      <label>Ergebnis von Claude<textarea data-brief="result" placeholder="Hier landet das Ergebnis – von Claude Code eingetragen oder von euch">${esc(brief.result)}</textarea></label>
      <div class="row">
        ${t.status === 'briefing' || !t.status ? `<button class="btn claude" data-act="go">Go erteilen</button>` : ''}
        ${t.status === 'rueckfragen' ? `<button class="btn claude" data-act="answered">Rückfragen beantwortet</button>` : ''}
        ${t.status === 'ergebnis' ? `<button class="btn primary" data-act="accept">Ergebnis übernommen</button>` : ''}
        ${t.status && t.status !== 'briefing' ? `<button class="btn small" data-act="back">Zurück auf Briefing</button>` : ''}
      </div>
    </div>`
        : ''
    }

    <h3>Beratung <small>– klappbar, editierbar</small></h3>
    ${ADV.map(([k, l]) => {
      const editing = ui.editingAdvice === t.id + ':' + k;
      return `<details class="adv" ${editing || ui.wide ? 'open' : ''}><summary>${l}${adv[k] ? '' : ' <span class="hint">(leer)</span>'}</summary>
      ${
        editing
          ? `<textarea data-adv="${k}" aria-label="${l}">${esc(adv[k])}</textarea>
      <div class="row pad"><button class="btn small primary" data-act="adv-save" data-ref="${k}">Speichern</button><button class="btn small" data-act="adv-cancel">Abbrechen</button></div>`
          : `<div class="body ${adv[k] ? '' : 'none'}">${adv[k] ? esc(adv[k]) : 'noch nicht ausgearbeitet – kommt mit den Inhalten für Phase 1+2'}</div>
      <div class="row pad"><button class="btn small" data-act="adv-edit" data-ref="${k}">Bearbeiten</button></div>`
      }</details>`;
    }).join('')}

    <h3>Kommentare</h3>
    ${coms.map((c) => `<div class="com ${c.author}"><div class="h"><b>${OWN[c.author] || c.author}</b> · ${fmtTime(c.created_at)}</div>${esc(c.body)}</div>`).join('') || '<div class="empty">Noch keine Kommentare. Kurz notieren, woran es hängt oder was der andere wissen muss.</div>'}
    <textarea data-input="com" placeholder="Kommentar als ${OWN[state.person]}" aria-label="Neuer Kommentar"></textarea>
    <div class="row"><button class="btn primary" data-act="com-add">Kommentar speichern</button><span class="spacer"></span>${del}</div>
  </div>`;
}
