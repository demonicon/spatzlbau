// The "gemeinsamer Start" (docs/changes/026): everything that has to be entered once so
// deadlines, templates and Finanzen add up - eight screens, one at a time, always reachable
// again afterwards. Steps 3-6 (Termine/Mieten/Kautionen/Aufteilung) are the exact screens from
// 016b's Ersteinrichtung, imported unchanged - this file supplies the other four (Personen,
// Wohnungen, Startposten, Wer macht was) plus the shared chrome around all eight.
import { esc } from '../ui/dom.js';
import { OWN } from '../ui/labels.js';
import { state, ui, byId, phases, stammdaten, dueLabel, dueInfo } from '../state.js';
import { setupTermineHTML, setupMietenHTML, setupKautionenHTML, setupAufteilungHTML, icsToken } from './finanzen.js';
import { summary, eurShort, num, parseAmount } from '../costs.js';

const setupAmount = (v) => (v === null || v === undefined ? '' : esc(String(num(v)).replace('.', ',')));

/* ---------- Schritt 1: Ihr beiden ---------- */

function personOf(p) {
  return stammdaten().personen?.find((x) => x.person === p) || {};
}

function stepPersonenHTML() {
  const row = (p) => {
    const person = personOf(p);
    return `<fieldset class="fs-group"><legend>${OWN[p]}</legend>
      <div class="row">
        <label class="lbl">Vorname<input type="text" data-input="stam-vorname-${p}" value="${esc(person.vorname || '')}"></label>
        <label class="lbl">Nachname<input type="text" data-input="stam-nachname-${p}" value="${esc(person.nachname || '')}"></label>
      </div>
      <label class="lbl">Handynummer<input type="tel" data-input="stam-telefon-${p}" value="${esc(person.telefon || '')}" placeholder="für Vorlagen, Umzugsfirma, Halteverbot"></label>
    </fieldset>`;
  };
  return `<p class="fs-note">E-Mails stehen schon (Anmeldung) - hier nur, was in Vorlagen und Anfragen steht.</p>${row('S')}${row('A')}`;
}

async function savePersonen(val) {
  const d = stammdaten();
  const personen = ['S', 'A'].map((p) => {
    const existing = personOf(p);
    const vorname = val(`stam-vorname-${p}`);
    const nachname = val(`stam-nachname-${p}`);
    const telefon = val(`stam-telefon-${p}`);
    return { ...existing, person: p, vorname: vorname || existing.vorname || null, nachname: nachname || existing.nachname || null, telefon: telefon || existing.telefon || null };
  });
  return { stammdaten: { ...d, personen } };
}

/* ---------- Schritt 2: Drei Wohnungen ---------- */

const WOHNUNG_LABEL = { s: 'alt ' + OWN.S, a: 'alt ' + OWN.A, n: 'neu' };
const wohnungOf = (k) => stammdaten().wohnungen?.[k] || {};

function wohnungFieldsHTML(k) {
  const w = wohnungOf(k);
  const aufzug = w.aufzug;
  return `<fieldset class="fs-group"><legend>${WOHNUNG_LABEL[k]}</legend>
    <label class="lbl">Straße<input type="text" data-input="stam-strasse-${k}" value="${esc(w.strasse || '')}"></label>
    <div class="row">
      <label class="lbl">Etage<input type="text" data-input="stam-etage-${k}" value="${esc(w.etage || '')}"></label>
      <div class="lbl">Aufzug
        <div class="seg" role="group" aria-label="Aufzug ${WOHNUNG_LABEL[k]}">
          <button class="pill" data-act="stam-aufzug" data-wohnung="${k}" data-to="ja" aria-pressed="${aufzug === true}">ja</button>
          <button class="pill" data-act="stam-aufzug" data-wohnung="${k}" data-to="nein" aria-pressed="${aufzug === false}">nein</button>
        </div>
      </div>
    </div>
    <div class="row">
      <label class="lbl">Vermieter<input type="text" data-input="stam-vermieter-${k}" value="${esc(w.vermieter || '')}"></label>
      <label class="lbl">Hausverwaltung<input type="text" data-input="stam-hausverwaltung-${k}" value="${esc(w.hausverwaltung || '')}"></label>
    </div>
    <label class="lbl">Adresse (Vermieter/Hausverwaltung)<input type="text" data-input="stam-adresse-${k}" value="${esc(w.vermieter_adresse || '')}"></label>
    ${k !== 'n' ? `<label class="lbl">Kündigungsfrist<input type="text" data-input="stam-kuendigungsfrist-${k}" value="${esc(w.kuendigungsfrist || '')}" placeholder="z. B. 3 Monate zum Monatsende"></label>` : ''}
    <div class="row">
      <label class="lbl">Kaution<input type="text" inputmode="decimal" data-input="stam-kaution-${k}" value="${setupAmount(w.kaution)}"></label>
      <label class="lbl">Kaltmiete<input type="text" inputmode="decimal" data-input="stam-kaltmiete-${k}" value="${setupAmount(w.kaltmiete)}"></label>
      <label class="lbl">Nebenkosten<input type="text" inputmode="decimal" data-input="stam-nk-${k}" value="${setupAmount(w.nebenkosten)}"></label>
    </div>
  </fieldset>`;
}

function stepWohnungenHTML() {
  return `<p class="fs-note">Alt ${OWN.S}/${OWN.A} vorbelegt aus den Verträgen, wo bekannt.</p>${['s', 'a', 'n'].map(wohnungFieldsHTML).join('')}`;
}

async function saveWohnungen(val) {
  const d = stammdaten();
  const wohnungen = { ...d.wohnungen };
  for (const k of ['s', 'a', 'n']) {
    const existing = wohnungOf(k);
    const aufzugSel = ui.setupAufzug?.[k];
    wohnungen[k] = {
      ...existing,
      strasse: val(`stam-strasse-${k}`) || existing.strasse || null,
      etage: val(`stam-etage-${k}`) || existing.etage || null,
      aufzug: aufzugSel === undefined ? (existing.aufzug ?? null) : aufzugSel,
      vermieter: val(`stam-vermieter-${k}`) || existing.vermieter || null,
      hausverwaltung: val(`stam-hausverwaltung-${k}`) || existing.hausverwaltung || null,
      vermieter_adresse: val(`stam-adresse-${k}`) || existing.vermieter_adresse || null,
      kuendigungsfrist: k === 'n' ? (existing.kuendigungsfrist ?? null) : val(`stam-kuendigungsfrist-${k}`) || existing.kuendigungsfrist || null,
      kaution: parseAmount(val(`stam-kaution-${k}`)) ?? existing.kaution ?? null,
      kaltmiete: parseAmount(val(`stam-kaltmiete-${k}`)) ?? existing.kaltmiete ?? null,
      nebenkosten: parseAmount(val(`stam-nk-${k}`)) ?? existing.nebenkosten ?? null,
    };
  }
  return { stammdaten: { ...d, wohnungen } };
}

/* ---------- Schritt 7: Startposten ----------
   docs/changes/026 Vorschlagsliste, mirrored from content/i2b-kosten.json (the same 14 rows the
   seed workflow can bring in). A row already in `costs` (by seed_key) shows as "vorhanden" and
   is never duplicated; everything else is a checkbox, pre-checked, amount editable. */
export const STARTPOSTEN = [
  { key: 'umzugsfirma-schaetzung', label: 'Umzugsunternehmen', amount: 1500, task: 'umzugsfirma' },
  { key: 'transportversicherung', label: 'Transportversicherung', amount: 80, task: 'umzugsfirma' },
  { key: 'halteverbot-3x', label: 'Halteverbotszonen (3 Adressen)', amount: 450, task: 'halteverbot' },
  { key: 'kartons-material', label: 'Kartons und Packmaterial', amount: 180, task: 'material' },
  { key: 'elektriker-herd', label: 'Elektriker Herdanschluss', amount: 150, task: 'kueche-neu' },
  { key: 'bidet-montage', label: 'Bidet-Montage', amount: 250, task: 'bidet' },
  { key: 'renovierung-s', label: 'Schönheitsreparaturen ' + OWN.S, amount: 500, task: 'schoenheit' },
  { key: 'duebel-farbe-a', label: 'Spachtel und Farbe ' + OWN.A, amount: 60, task: 'duebel' },
  { key: 'endreinigung-a', label: 'Endreinigung ' + OWN.A, amount: 200, task: 'reinigung' },
  { key: 'nachsende-s', label: 'Nachsendeauftrag ' + OWN.S, amount: 31.9, task: 'nachsende' },
  { key: 'nachsende-a', label: 'Nachsendeauftrag ' + OWN.A, amount: 31.9, task: 'nachsende' },
  { key: 'kfz-ummeldung', label: 'Kfz-Ummeldung', amount: 30, task: 'kfz' },
  { key: 'helfer-verpflegung', label: 'Verpflegung und Trinkgeld Umzugstag', amount: 100, task: 'umzugstag-ablauf' },
  { key: 'schluessel-neu', label: 'Schlüssel nachmachen / Zylinder neu', amount: 60, task: 'uebergabe-neu' },
];

function stepPostenHTML() {
  const sel = ui.setupCostSel || new Set();
  const rows = STARTPOSTEN.map((s) => {
    const existing = state.costs.find((c) => c.seed_key === s.key);
    const t = byId(s.task);
    if (existing) {
      return `<div class="setup-check present"><span class="check-dummy" aria-hidden="true">✓</span>
        <span class="l">${esc(s.label)} <span class="s muted">${t ? esc(t.title.slice(0, 30)) : ''}</span></span>
        <span class="v muted">vorhanden</span></div>`;
    }
    const checked = !sel.has(s.key);
    return `<div class="setup-check">
      <label class="check-label"><input type="checkbox" data-act="stam-cost-toggle" data-ref="${s.key}" ${checked ? 'checked' : ''}>
        <span class="l">${esc(s.label)} <span class="s muted">${t ? esc(t.title.slice(0, 30)) : ''}</span></span></label>
      <input type="text" inputmode="decimal" class="setup-check-amount" data-input="stam-cost-${s.key}" value="${setupAmount(s.amount)}" ${checked ? '' : 'disabled'} aria-label="Betrag ${esc(s.label)}">
    </div>`;
  });
  return `<p class="fs-note">Häkchen weg lässt die Zeile einfach weg - nichts wird abgehakt oder gelöscht.</p>${rows.join('')}`;
}

async function savePosten(val) {
  const sel = ui.setupCostSel || new Set();
  const toCreate = STARTPOSTEN.filter((s) => !state.costs.find((c) => c.seed_key === s.key) && !sel.has(s.key));
  return {
    costInserts: toCreate.map((s) => ({
      task_id: byId(s.task) ? s.task : null,
      label: s.label,
      amount: parseAmount(val(`stam-cost-${s.key}`)) ?? s.amount,
      seed_key: s.key,
      status: 'geschaetzt',
    })),
  };
}

/* ---------- Schritt 8: Wer macht was ----------
   Vorschlag aus docs/changes/i2a-clean-cut.md: 38 der 45 (heute: aller) "B"-Aufgaben bekommen
   einen Menschen, 9 bleiben bewusst gemeinsam. */
export const OWNER_PROPOSAL = Object.fromEntries([
  ...['kosten', 'vertrag-pruefen', 'kaution', 'wgb', 'protokolle-alt', 'schoenheit', 'kueche', 'energie', 'versicherung', 'vertraege-sichten', 'umzugsfirma', 'kueche-neu', 'renovierung', 'heizung-neu', 'rundgang', 'zaehler-melden', 'schaeden-spedition', 'kaution-zurueck', 'verjaehrung', 'steuer', 'nk-alt'].map((id) => [id, 'S']),
  ...['uebergabe-alt-termin', 'adresse-vermieter', 'moebel-neu', 'ausmisten1', 'entsorgen', 'urlaub', 'packen', 'nachsende', 'erstversorgung', 'lampen', 'dokumente', 'geraete', 'wohnung-neu-check', 'frostschutz', 'auspacken', 'reinigung', 'ummeldung'].map((id) => [id, 'A']),
]);

const OWNER_SEG = [['S', OWN.S], ['B', 'gemeinsam'], ['A', OWN.A]];

function stepOwnerHTML() {
  const shared = state.tasks.filter((t) => t.owner === 'B' && !t.deleted_at);
  const list = phases();
  const groups = list.map((p) => ({ p, rows: shared.filter((t) => t.phase === p.id) })).filter((g) => g.rows.length);
  const proposable = shared.filter((t) => OWNER_PROPOSAL[t.id]).length;
  return `<p class="fs-note">${shared.length} Aufgaben stehen auf „gemeinsam“, ${proposable} davon mit Vorschlag.</p>
    ${proposable ? `<button class="btn-secondary row" data-act="stam-owner-apply">Vorschlag übernehmen (${proposable})</button>` : ''}
    ${groups
      .map(
        (g) => `<h4 class="setup-phase">${esc(g.p.short || g.p.name)}</h4>
      ${g.rows
        .map((t) => {
          const proposal = OWNER_PROPOSAL[t.id];
          return `<div class="setup-owner-row">
            <span class="l">${esc(t.title.slice(0, 46))}${proposal ? ` <span class="s muted">Vorschlag ${OWN[proposal]}</span>` : ''}</span>
            <div class="seg" role="group" aria-label="Zuständig: ${esc(t.title)}">${OWNER_SEG.map(
              ([k, l]) => `<button class="pill" data-act="stam-owner-set" data-ref="${t.id}" data-to="${k}" aria-pressed="${t.owner === k}">${l}</button>`,
            ).join('')}</div>
          </div>`;
        })
        .join('')}`,
      )
      .join('')}`;
}

/* ---------- Schritt-Liste + Chrome ---------- */

export const SETUP_STEPS = [
  ['Ihr beiden', stepPersonenHTML, savePersonen],
  ['Drei Wohnungen', stepWohnungenHTML, saveWohnungen],
  ['Termine', setupTermineHTML, null], // gespeichert über main.js' setupTermineSave (016b)
  ['Mieten', setupMietenHTML, null],
  ['Kautionen', setupKautionenHTML, null],
  ['Aufteilung & Puffer', setupAufteilungHTML, null],
  ['Startposten', stepPostenHTML, savePosten],
  ['Wer macht was', stepOwnerHTML, null],
];
export const SETUP_STEP_TITLES = SETUP_STEPS.map((s) => s[0]);

function pickerHTML() {
  return `<div class="fin-setup" role="dialog" aria-modal="true" aria-labelledby="fs-p-h">
    <div class="fs-card">
      <p class="fs-eyebrow">Stammdaten & Rahmendaten</p>
      <h2 id="fs-p-h">Was ändern?</h2>
      <div class="setup-picker-list">${SETUP_STEP_TITLES.map((title, i) => `<button class="btn-text row" data-act="stam-reopen" data-ref="${i}">${i + 1}. ${esc(title)} ›</button>`).join('')}</div>
      <div class="row fs-foot"><span class="spacer"></span><button class="btn-text" data-act="stam-picker-close">Schließen</button></div>
    </div>
  </div>`;
}

function abschlussHTML() {
  const s = summary();
  const todo = state.tasks.filter((t) => !t.done && !t.deleted_at).sort((a, b) => dueInfo(a).sort - dueInfo(b).sort).slice(0, 3);
  const token = icsToken();
  return `<div class="fin-setup" role="dialog" aria-modal="true" aria-labelledby="fs-a-h">
    <div class="fs-card">
      <p class="fs-eyebrow">Fertig</p>
      <h2 id="fs-a-h">Los geht's</h2>
      <p class="fs-note">Der Umzug kostet euch aktuell <b>${s.net === null ? '–' : eurShort(s.net)}</b> netto.</p>
      ${todo.length ? `<ul class="setup-next-list">${todo.map((t) => `<li>${esc(t.title.slice(0, 50))} · <span class="muted">${esc(dueLabel(t))}</span></li>`).join('')}</ul>` : ''}
      ${
        token
          ? `<p class="fs-note">Kalender-Abo: ${['S', 'A'].map((k) => `<button class="btn-text ics-copy" data-act="ics-copy" data-to="${k}">${OWN[k]} kopieren</button>`).join(' · ')}</p>`
          : ''
      }
      <p class="fs-note">Wochencheck sonntags 15 Minuten – die Timeline zeigt, was ansteht.</p>
      <div class="row fs-foot"><span class="spacer"></span><button class="btn-primary" data-act="stam-finish">Los geht's</button></div>
    </div>
  </div>`;
}

/** The shared step counter, one screen, and the three ways out (016b's own chrome, mirrored). */
function stepChromeHTML(step, reopen) {
  const [title, body] = SETUP_STEPS[step];
  return `<div class="fin-setup" role="dialog" aria-modal="true" aria-labelledby="fs-h">
    <div class="fs-card">
      <p class="fs-eyebrow">${reopen ? 'Stammdaten & Rahmendaten' : `Einrichtung ${step + 1}/${SETUP_STEP_TITLES.length}`}</p>
      <h2 id="fs-h">${title}</h2>
      ${body()}
      <div class="row fs-foot">
        ${!reopen && step > 0 ? `<button class="btn-text" data-act="stam-back">‹ Zurück</button>` : ''}
        <span class="spacer"></span>
        ${reopen ? `<button class="btn-text" data-act="stam-reopen-close">Schließen</button>` : `<button class="btn-text" data-act="stam-skip">Später</button>`}
        <button class="btn-primary" data-act="stam-next">${reopen ? 'Speichern' : 'Weiter'}</button>
      </div>
    </div>
  </div>`;
}

export function startSetupHTML() {
  if (ui.setupPicker) return pickerHTML();
  const step = ui.setupStep ?? Math.min(SETUP_STEP_TITLES.length, state.settings.setup_step || 0);
  if (step >= SETUP_STEP_TITLES.length) return abschlussHTML();
  return stepChromeHTML(step, ui.setupReopen);
}
