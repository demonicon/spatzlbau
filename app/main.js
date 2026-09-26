// App bootstrap: auth gate, rendering, event delegation, realtime, service worker.
import { $, esc, toast } from './ui/dom.js';
import * as auth from './auth.js';
import {
  state,
  ui,
  onChange,
  onStatus,
  byId,
  blockers,
  phases,
  loadAll,
  loadSnapshot,
  subscribeRealtime,
  updateTask,
  insertTask,
  deleteTask,
  setSubtaskDone,
  addSubtask,
  deleteSubtask,
  updateSubtask,
  subsOf,
  addComment,
  updateComment,
  deleteComment,
  canEditComment,
  setCommentDecision,
  setDecisionAck,
  setSetting,
  loadPersonRow,
  setLastSeenVersion,
  markVisit,
  markCommentsSeen,
  markGateSeen,
  phaseDone,
  unseenGate,
  doneBy,
  addCost,
  updateCost,
  deleteCost,
  addRecurring,
  updateRecurring,
  anfrageById,
} from './state.js';
import { anfragenView } from './views/anfragen.js';
import { CATEGORIES, prefill, choosePlan, unchoosePatch, offersOf } from './anfragen.js';
import { FILTERS } from './filters.js';
import { compareVersions, newestVersion, hasUnread } from './changelog.js';
import { dashboardView, columns, entscheidungenView } from './views/dashboard.js';
import { finanzenView } from './views/finanzen.js';
import { startSetupHTML, SETUP_STEPS, SETUP_STEP_TITLES, OWNER_PROPOSAL } from './views/start.js';
import { draftOf, draftCount, fieldValue, costDraftOf, costDraftCount, costFieldValue } from './ui/detail.js';
import { searching } from './search.js';
import { parseAmount, bufferPct, bufferFixed, costsOf, num, eurShort } from './costs.js';
import { OWN } from './ui/labels.js';
import { icsToken, icsUrl, alarmStagesOf } from './views/finanzen.js';
import { updateShell, shellVisible } from './shell.js';
import { paint } from './ui/paint.js';

const UI_KEY = 'spatzlbau-ui';
const PERSON_KEY = 'spatzlbau-person';

// docs/changes/034 (Fund aus 014e): local-calendar string, not toISOString() (UTC, a day early
// east of UTC near Mitternacht) - the date fields below default to "today" as the person sees it
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// dashboard state (docs/changes/009): no filter on open – the columns already answer "what is mine";
// the phase is a chip (null = all phases) and is remembered per device
ui.filter = null;
ui.phase = null;
ui.dateEdit = false;
ui.q = ''; // search term (docs/changes/012) – on purpose only in memory: not stored, not in the hash
ui.qPrev = null; // filter and phase the search replaced, put back when the field is emptied
ui.openCols = new Set(); // collapsible column ("Bei Anna") that the person opened
ui.allCols = new Set(); // columns showing more than the first eight rows
ui.doneCols = new Set(); // columns showing their done tasks as well
ui.blockedCols = new Set(); // columns with "N warten auf einen Vorgänger" unfolded
ui.costEdit = null; // cost row in the full Bearbeiten-Modus (007, rebuilt 016b)
ui.costSet = null; // cost row asking "Betrag festlegen" (016b)
ui.costPay = null; // cost row asking "Bezahlt" / "Erhalten" (016b)
ui.costWhere = null; // 'next' | 'list' - which Finanzen list opened it (014 #7)
ui.costPayBy = null; // who is picked in that open "Wer hat bezahlt?" form (016b)
ui.costDraft = null; // { id, fields } - the unsaved changes of a cost row's Bearbeiten-Modus (016b)
ui.costMore = null; // cost row (in Bearbeiten-Modus) showing the "mehr" fields (016b)
ui.costNewMore = false; // the "+ Posten" dialog showing the "mehr" fields (016b)
ui.costQuick = null; // { id, field } - amount or due_on tapped open right in the row (016b)
ui.costAdd = null; // task id showing the "new cost row" form
ui.finPostAdd = false; // "+ Posten" opened from "Alle Posten", no task preselected (016b)
ui.finSetupStep = 0; // 0-3, which Ersteinrichtung screen shows while the wizard is open (016b)
ui.finSetupSkip = false; // "Später" was chosen this visit - the wizard stays away until reload (016b)
ui.finSetupHousehold = null; // true/false - the Ersteinrichtung's own question, not persisted (016b)
ui.screen = 'dashboard'; // 'dashboard' | 'finanzen' (#finanzen, docs/changes/007)
ui.finFilter = null; // which cost rows the Finanzen view shows
ui.finSettings = false; // the frame data at the foot, open for editing (016)
ui.balHow = false; // "Wie gerechnet?" under the balance (016 F3)
ui.balPay = false; // the transfer form (016 F3)
ui.recEdit = false; // monthly costs in edit mode instead of read mode (016 F4)
ui.postFilter = 'alle'; // which posts the list shows (016 §7)
ui.postOpen = false; // the phone shows the list only after a tap (016 §7)
ui.finSections = {}; // welcher Abschnitt des Dashboards offen ist, je Schluessel (038 #13/#14)
ui.bufferMode = null; // Satz|Betrag-Segment in den Rahmendaten, null = aus buffer_fixed ableiten (014c)
ui.recAdd = false; // the "new monthly cost" field in the Finanzen view
ui.printOpen = false; // "Umzugstag drucken" sheet
ui.offline = false; // no connection: the cached state is shown read-only (009)
ui.wide = false; // ≥ 900 px: the Akte is not inline any more (006)
// docs/changes/013 A3: three steps instead of two - 'phone' (Akte inline), 'overlay' (Akte comes
// in from the right over the list) and 'panel' (list and Akte side by side from 1180 px)
ui.mode = 'phone';
ui.gate = null; // phase id whose gate moment is on screen (021)
ui.view = 'personen'; // 'personen' | 'phasen' | 'timeline' (019), kept per device
ui.tlOwner = 'all'; // timeline: 'all' | 'me' | 'B' | 'you' (019)
ui.tlDone = false; // timeline: the ticked-off tasks unfolded at the end (019)
ui.tlWait = null; // timeline: the row whose "wartet auf n ›" is unfolded (019c)
ui.icsShow = null; // 'S' | 'A': the calendar address shown as text when copying failed (022)
ui.col = 'me'; // which of the three columns the phone shows (018 §1), kept per device
ui.listScroll = 0; // where the list stood when the phone left it for a detail page (038 #8)
ui.visitOpen = false; // "Seit du zuletzt da warst" unfolded (018 §6)
ui.openGroups = new Set(); // "<col>:<group>" - time groups opened by hand (018 §2)
ui.akteEdit = null; // task id whose Akte is in edit mode (017)
ui.draft = null; // { id, fields } - the unsaved changes of that Akte (017)
ui.briefOpen = null; // task id whose briefing is unfolded in Ansehen (017)
ui.advOpen = null; // "<taskId>:<topic>" - the open advice topic in Ansehen (017)
ui.subEdit = null; // subtask id whose row is in edit mode (013 B2)
ui.comEdit = null; // comment id whose body field is open (013 B5)
ui.updateReady = false; // a newer build took over the service worker (003, bar since 013 A6)
// ui.preview (docs/changes/010) is set in state.js, where the writers it stops live
ui.changelog = null; // changelog.json (docs/changes/005), loaded at start
ui.changelogOpen = false;
ui.changelogUnreadOnly = false; // auto-opened panel shows only the versions newer than last_seen_version
ui.setupStep = null; // 0-7, the "gemeinsamer Start" screen showing now; null = read settings.setup_step (026)
ui.setupSkip = false; // "Später" was chosen this visit - the wizard stays away until reload (026)
ui.setupReopen = false; // opened one step from the menu instead of the sequential first run (026)
ui.setupPicker = false; // "Stammdaten & Rahmendaten" step list open (026)
ui.setupAufzug = null; // { s/a/n: bool } - Schritt 2's own tri-state toggle, not an <input> (026)
ui.setupCostSel = null; // Set of seed_keys unchecked in Schritt 7 - "abgewählt", nichts wird angelegt (026)
ui.avatarMenu = false; // the avatar's own small menu (026)
ui.decisionsFilter = 'offen'; // 'alle' | 'offen' (032, eigene Seite seit 032b, "bestätigt"-Pille entfällt seit 032c)
ui.anfrage = null; // the anfrage open on #anfragen (033)
ui.anfrageNew = false; // the category pills of "+ Anfrage" are open (033)
ui.anfrageMoney = null; // { id, money } - the price question after "Wählen", until Ja/Nein (033)
ui.offerEdit = null; // { id, offerId } - an offer being added ('new') or changed (033)
ui.offerOpen = null; // the offer whose transposed row is unfolded on a phone (038 #23)
ui.anfragenList = true; // the Anfragen list section, collapsed or not (038 #21)

/* ---------- screens ---------- */
function show(screen) {
  for (const id of ['login', 'denied', 'app', 'loading']) $('#' + id).hidden = id !== screen;
  $('#top').hidden = screen === 'app';
}

/* ---------- status line (inside the dashboard header) ---------- */
let lastSaved = '';
let live = false;
let lastError = '';
function renderStatus(kind, msg) {
  if (kind === 'saved') lastSaved = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (kind === 'live') live = true;
  if (kind === 'error') lastError = msg;
  // 'live' after a reconnect clears the error, too (docs/changes/010 point 2)
  if (kind === 'saved' || kind === 'saving' || kind === 'live') lastError = '';
  const el = $('#status');
  if (!el) return;
  // docs/changes/012: the preview writes tasks, costs and settings like the real app, but never
  // the reading state – and it says so, in every state of the line
  const set = (text, cls = '') => {
    el.textContent = [text, ui.preview ? 'Vorschau – Lesestand wird nicht gespeichert' : ''].filter(Boolean).join(' · ');
    el.className = ['status', cls, ui.preview ? 'prev' : ''].filter(Boolean).join(' ');
  };
  if (lastError) {
    set(lastError, 'err');
    return;
  }
  if (ui.offline) {
    const at = state.loadedAt ? new Date(state.loadedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–';
    set('Offline – Stand von ' + at, 'off');
    return;
  }
  const parts = [kind === 'saving' ? msg : lastSaved ? 'gespeichert ' + lastSaved : '', live ? 'Live' : 'verbinde …'];
  set(parts.filter(Boolean).join(' · '));
}
onStatus(renderStatus);

/* ---------- rendering (skipped while typing, caught up on blur) ---------- */
let renderPending = false;
function isTyping() {
  const a = document.activeElement;
  return a && $('#app').contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type === 'text'));
}
/** The route the shell marks as active - ui.screen, with the task list as the default. */
const route = () => (['finanzen', 'entscheidungen', 'anfragen'].includes(ui.screen) ? ui.screen : 'dashboard');
function ensurePhase() {
  const list = phases();
  // null = chip "alle"; anything else has to exist
  if (ui.phase !== null && list.length && !list.some((p) => p.id === ui.phase)) ui.phase = null;
}
function render() {
  if (!state.loaded) return;
  if (isTyping()) {
    renderPending = true;
    return;
  }
  renderPending = false;
  ensurePhase();
  const focusKey = keyOf(document.activeElement);
  document.body.classList.toggle('printing', !!ui.printOpen);
  // docs/changes/026: the eight-step start takes the whole screen, like the Finanzen wizard it
  // reuses parts of - first run (not skipped), or one step reopened from the avatar menu
  const showSetup = (!state.settings.setup_done && !ui.setupSkip) || ui.setupReopen || ui.setupPicker;
  // docs/changes/038: the shell is rendered once and only updated - the router writes the route
  // into #view and never touches the head. The eight-step start owns the whole screen, so the
  // shell steps aside for it instead of framing it.
  shellVisible(!showSetup);
  if (!showSetup) updateShell(route());
  paint(
    showSetup
      ? startSetupHTML()
      : ui.screen === 'finanzen'
        ? finanzenView()
        : ui.screen === 'entscheidungen'
          ? entscheidungenView()
          : ui.screen === 'anfragen'
            ? anfragenView()
            : dashboardView(),
  );
  // CSP forbids style attributes (docs/changes/008): the gate fill is the one dynamic style, set
  // via CSSOM. 038: only when it changed - a write that changes nothing is still a mutation.
  for (const el of $('#view').querySelectorAll('.bar i[data-pct]')) {
    const w = el.dataset.pct + '%';
    if (el.style.width !== w) el.style.width = w;
  }
  // docs/changes/021: a segment is as wide as its share of all tasks, at least 44 px
  for (const el of $('#view').querySelectorAll('.pstrip [data-share]')) {
    if (el.style.flexGrow !== el.dataset.share) el.style.flexGrow = el.dataset.share;
  }
  // docs/changes/038 E9: die Hoehe eines Mini-Balkens - derselbe Weg, aus demselben Grund
  for (const el of $('#view').querySelectorAll('[data-h]')) {
    const h = el.dataset.h + 'px';
    if (el.style.height !== h) el.style.height = h;
  }
  restoreFocus(focusKey);
  renderStatus('idle');
}

/* ---------- the draft of an Akte in edit mode (docs/changes/017) ---------- */

/** Remember one changed field. A value back at the saved one drops out of the count again. */
function setDraft(t, key, raw) {
  if (!t || ui.akteEdit !== t.id) return;
  if (!ui.draft || ui.draft.id !== t.id) ui.draft = { id: t.id, fields: {} };
  let v = raw;
  if (key === 'offset_days') v = parseInt(String(raw) || '0', 10) || 0;
  if (key === 'title') v = String(raw).replace(/\s+/g, ' ').trim() || t.title;
  const saved = key.startsWith('brief.') ? (t.brief || {})[key.slice(6)] ?? '' : t[key];
  if (JSON.stringify(saved ?? '') === JSON.stringify(v ?? '')) delete ui.draft.fields[key];
  else ui.draft.fields[key] = v;
}

/** The draft as one patch: brief.* fold back into the one jsonb column. */
function taskPatch(t) {
  const fields = draftOf(t);
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const patch = {};
  let brief = null;
  for (const k of keys) {
    if (k.startsWith('brief.')) {
      brief = brief || { ...(t.brief || {}) };
      brief[k.slice(6)] = fields[k];
    } else patch[k] = fields[k];
  }
  if (brief) patch.brief = brief;
  if (patch.type === 'claude' && !t.status && !patch.status) patch.status = 'briefing';
  return patch;
}

function closeEdit() {
  ui.akteEdit = null;
  ui.draft = null;
  ui.confirm = null;
  render();
}

/* ---------- the draft of a cost row in Bearbeiten-Modus (docs/changes/016b, mirrors 017) ---------- */

/** Remember one changed field of a cost row. Amount is parsed here, not stored as raw text. */
function setCostDraft(c, key, raw) {
  if (!c || ui.costEdit !== c.id) return;
  if (!ui.costDraft || ui.costDraft.id !== c.id) ui.costDraft = { id: c.id, fields: {} };
  let v = raw;
  if (key === 'amount') v = parseAmount(raw) ?? num(c.amount);
  if (key === 'split_s') v = raw === '' ? null : parseAmount(raw);
  if (key === 'label') v = String(raw).replace(/\s+/g, ' ').trim() || c.label;
  if ((key === 'due_on' || key === 'paid_on' || key === 'task_id' || key === 'apartment' || key === 'receipt_url') && v === '') v = null;
  const saved = c[key] ?? null;
  if (JSON.stringify(saved) === JSON.stringify(v ?? null)) delete ui.costDraft.fields[key];
  else ui.costDraft.fields[key] = v;
}

/** The draft as one patch, ready for updateCost. */
function costPatch(c) {
  const fields = costDraftOf(c);
  if (!Object.keys(fields).length) return null;
  const patch = { ...fields };
  // 014b: moving the ladder back clears the payment explicitly, moving it to bezahlt without a
  // date books it today - the trigger does the same, the app does not rely on it
  if ('status' in patch && patch.status !== 'bezahlt') {
    patch.paid_on = null;
    patch.paid_by = null;
  } else if (patch.status === 'bezahlt') {
    if (!('paid_on' in patch) && !c.paid_on) patch.paid_on = todayISO();
    if (!('paid_by' in patch) && !c.paid_by) patch.paid_by = state.person;
  }
  return patch;
}

function closeCostEdit() {
  ui.costEdit = null;
  ui.costDraft = null;
  ui.costMore = null;
  ui.confirm = null;
  render();
}

/** Commit the amount/due date tapped open right in a row (016b). Called from the native
    'change' event and directly from Enter, so it works even when a blur does not chain
    through to a 'change' on its own. */
function saveQuickField(el) {
  const id = el.dataset.ref;
  const f = el.dataset.quickField;
  // a blur can fire a native 'change' of its own before Enter's own call gets here - once this
  // field is no longer the open one, the first call already did the work
  if (!ui.costQuick || ui.costQuick.id !== id || ui.costQuick.field !== f) return;
  let v = el.value;
  if (f === 'amount') {
    v = parseAmount(v);
    if (v === null) {
      ui.costQuick = null;
      render();
      return toast('Betrag nicht lesbar – z. B. 1800 oder 1.800,50');
    }
  } else if (v === '') v = null;
  ui.costQuick = null;
  updateCost(id, { [f]: v }).catch(fail);
}

/* ---------- Ersteinrichtung: vier Fragen (docs/changes/016b) ----------
   Each "Weiter" writes only that screen's fields, right away - going back and forth just
   re-writes the same values, nothing is held back for a final save. */

const setupVal = (id) => $(`[data-input="${id}"]`, $('#view'))?.value.trim() ?? '';

// The four saves, factored out so docs/changes/026's own eight-step start can call the exact
// same code for its Termine/Mieten/Kautionen/Aufteilung screens (016b's own AC: "kein zweiter
// Code"). finSetupNext() below is now a thin wrapper kept for the Finanzen-embedded wizard.
async function setupTermineSave() {
  const fields = { einzugstermin: setupVal('setup-einzug'), umzugstag: setupVal('setup-umzugstag'), move_out_s: setupVal('setup-auszug-s'), move_out_a: setupVal('setup-auszug-a') };
  for (const [key, v] of Object.entries(fields)) {
    if (v && v !== (state.settings[key] || '')) await setSetting(key, v).catch(fail);
  }
}
async function setupMietenSave() {
  await finSetupSaveRecurring('miete', 'Kaltmiete', 'setup-miete-s', 'setup-miete-a', 'setup-miete-n');
  await finSetupSaveRecurring('nk', 'Nebenkosten', 'setup-nk-s', 'setup-nk-a', 'setup-nk-n');
}
async function setupKautionenSave() {
  const kautionTask = byId('kaution-zurueck') ? 'kaution-zurueck' : null;
  await finSetupSaveCost('kaution-alt-s', 'Kaution zurück – ' + OWN.S, setupVal('setup-kaution-s'), { kind: 'rueckfluss', belongs_to: 'S', task_id: kautionTask });
  await finSetupSaveCost('kaution-alt-a', 'Kaution zurück – ' + OWN.A, setupVal('setup-kaution-a'), { kind: 'rueckfluss', belongs_to: 'A', task_id: kautionTask });
  const neuBetrag = setupVal('setup-kaution-neu-betrag');
  if (neuBetrag) {
    await finSetupSaveCost('kaution-neu', 'Kaution neue Wohnung', neuBetrag, {
      kind: 'einmalig',
      belongs_to: 'B',
      task_id: byId('kaution') ? 'kaution' : null,
      due_on: setupVal('setup-kaution-neu-frist') || null,
    });
  }
}
async function setupAufteilungSave() {
  const split = parseAmount(setupVal('setup-split'));
  const pct = parseAmount(setupVal('setup-puffer'));
  if (split !== null && split !== (state.settings.split_default_s ?? 50)) await setSetting('split_default_s', split).catch(fail);
  if (pct !== null && pct !== bufferPct()) await setSetting('buffer_pct', pct).catch(fail);
  await setSetting('fin_setup_done', true).catch(fail);
}

async function finSetupNext() {
  const step = ui.finSetupStep || 0;
  if (step === 0) await setupTermineSave();
  else if (step === 1) await setupMietenSave();
  else if (step === 2) await setupKautionenSave();
  else if (step === 3) {
    await setupAufteilungSave();
    toast('Finanzen eingerichtet');
    render();
    return;
  }
  ui.finSetupStep = Math.min(3, step + 1);
  render();
}

/* ---------- docs/changes/026: the eight-step start, steps 2-5 reuse the four saves above ---------- */
const STAM_REUSED_SAVE = [setupTermineSave, setupMietenSave, setupKautionenSave, setupAufteilungSave];
function currentSetupStep() {
  return ui.setupStep ?? Math.min(SETUP_STEP_TITLES.length, state.settings.setup_step || 0);
}

/** One recurring row (Kaltmiete/Nebenkosten): update the seeded row if there is one, else insert. */
async function finSetupSaveRecurring(seedKey, label, idS, idA, idN) {
  const existing = state.recurring.find((r) => r.seed_key === seedKey);
  const amount_s = parseAmount(setupVal(idS));
  const amount_a = parseAmount(setupVal(idA));
  const amount_n = parseAmount(setupVal(idN));
  if (existing) {
    const patch = {};
    if (amount_s !== null) patch.amount_s = amount_s;
    if (amount_a !== null) patch.amount_a = amount_a;
    if (amount_n !== null) patch.amount_n = amount_n;
    if (Object.keys(patch).length) await updateRecurring(existing.id, patch).catch(fail);
  } else if (amount_s !== null || amount_a !== null || amount_n !== null) {
    await addRecurring(label, { seed_key: seedKey, amount_s, amount_a, amount_n }).catch(fail);
  }
}

/** One Kautionen row: update the seeded row if there is one, else insert (016b §Kautionen). */
async function finSetupSaveCost(seedKey, label, amountRaw, extra) {
  const amount = parseAmount(amountRaw);
  if (amount === null) return;
  const existing = state.costs.find((c) => c.seed_key === seedKey);
  if (existing) {
    await updateCost(existing.id, { amount, ...extra }).catch(fail);
  } else {
    await addCost(extra.task_id ?? null, { label, amount, status: 'faellig', seed_key: seedKey, ...extra }).catch(fail);
  }
}

/* ---------- keyboard (docs/changes/006 step 3): the view is re-rendered on every change,
   so remember which control had focus and give it back afterwards ---------- */
const FOCUS_ATTRS = ['data-act', 'data-phase', 'data-field', 'data-input', 'data-brief', 'data-adv', 'data-ref', 'data-anfrage-field', 'data-anfrage-task', 'role'];
function keyOf(el) {
  if (!el || el === document.body || !$('#app')?.contains(el)) return null;
  // typing in a field triggers renders (the search does it on every character), so the cursor
  // position travels with the focus – otherwise it would jump to the end mid-word
  let at = null;
  try {
    if (el.selectionStart !== null && el.selectionStart !== undefined) at = [el.selectionStart, el.selectionEnd];
  } catch {}
  const scope = el.closest('[data-id]');
  const own = FOCUS_ATTRS.filter((a) => el.hasAttribute(a)).map((a) => `[${a}="${CSS.escape(el.getAttribute(a))}"]`).join('');
  const sub = el.closest('[data-sub]');
  // the first class disambiguates controls that share an attribute (gate segment vs. phase chip)
  const cls = el.classList[0] ? '.' + CSS.escape(el.classList[0]) : '';
  const sel = (sub ? `[data-sub="${CSS.escape(sub.dataset.sub)}"] ` : '') + el.tagName.toLowerCase() + cls + own + (el.id ? '#' + CSS.escape(el.id) : '');
  return { scope: scope ? scope.dataset.id : null, sel, at };
}
function restoreFocus(key) {
  if (!key) return;
  const root = key.scope ? $(`#app [data-id="${CSS.escape(key.scope)}"]`) : $('#app');
  const el = (root && root.querySelector(key.sel)) || $('#app').querySelector(key.sel);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (key.at) {
    try {
      el.setSelectionRange(key.at[0], key.at[1]);
    } catch {}
  }
}
onChange(render);

function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ phase: ui.phase, col: ui.col, view: ui.view }));
  } catch {}
}
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    if (Number.isInteger(u.phase) || u.phase === null) ui.phase = u.phase;
    if (['me', 'B', 'you'].includes(u.col)) ui.col = u.col; // docs/changes/018 §1
    if (['personen', 'phasen', 'timeline'].includes(u.view)) ui.view = u.view; // docs/changes/019
  } catch {}
}

/* ---------- changelog ---------- */
async function loadChangelog() {
  try {
    const r = await fetch('./changelog.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    ui.changelog = await r.json();
  } catch (e) {
    console.warn('changelog.json nicht ladbar', e);
    ui.changelog = { entries: [] };
  }
}
function openChangelog(unreadOnly) {
  ui.changelogOpen = true;
  ui.changelogUnreadOnly = !!unreadOnly;
  render();
  $('#changelog')?.scrollIntoView({ block: 'start' });
}
// closing (button, Escape, tap outside) marks everything as read – per person, in the database
function closeChangelog() {
  if (!ui.changelogOpen) return;
  ui.changelogOpen = false;
  const v = newestVersion();
  if (v && state.lastSeenVersion !== undefined && compareVersions(v, state.lastSeenVersion) > 0) setLastSeenVersion(v).catch(fail);
  render();
}
// opened via a task link (#task=<id>)? then the person has a goal – no automatic panel
const openedViaTaskLink = () => /^#task=/.test(location.hash);
const openedViaFinanzen = () => location.hash === '#finanzen';
const openedViaEntscheidungen = () => location.hash === '#entscheidungen';
// docs/changes/033: #anfragen or #anfragen=<id> - one anfrage can be shared as a link
const openedViaAnfragen = () => /^#anfragen(=|$)/.test(location.hash);
const hashAnfrageId = () => (/^#anfragen=/.test(location.hash) ? decodeURIComponent(location.hash.slice('#anfragen='.length)) : null);
const hashTaskId = () => (openedViaTaskLink() ? decodeURIComponent(location.hash.slice('#task='.length)) : null);
function openTaskFromHash() {
  const t = byId(hashTaskId());
  if (!t) return false;
  ui.phase = t.phase;
  if (ui.filter && !FILTERS[ui.filter].test(t)) ui.filter = null;
  ui.expanded = t.id;
  revealTask(t);
  return true;
}
// the task has to be visible: open its column, show it even past the eighth row or among the done ones
function revealTask(t) {
  for (const c of columns()) {
    if (![...c.open, ...c.blocked, ...c.done].some((x) => x.id === t.id)) continue;
    ui.openCols.add(c.key);
    if (c.done.some((x) => x.id === t.id)) ui.doneCols.add(c.key);
    if (c.blocked.some((x) => x.id === t.id)) ui.blockedCols.add(c.key);
  }
}
// the open task lives in the URL, so a link to it can be shared (docs/changes/006)
function syncHash() {
  const want =
    ui.screen === 'finanzen'
      ? '#finanzen'
      : ui.screen === 'entscheidungen'
        ? '#entscheidungen'
        : ui.screen === 'anfragen'
          ? '#anfragen' + (ui.anfrage ? '=' + encodeURIComponent(ui.anfrage) : '')
          : ui.expanded
            ? '#task=' + encodeURIComponent(ui.expanded)
            : '';
  if (location.hash === want) return;
  history.replaceState(null, '', location.pathname + location.search + want);
}
// docs/changes/033: entering Anfragen gets its own step back, like Finanzen and Entscheidungen;
// switching between anfragen inside the page only replaces (syncHash)
function openAnfragen(id = null) {
  const already = ui.screen === 'anfragen';
  ui.screen = 'anfragen';
  ui.anfrage = id;
  ui.offerEdit = null;
  ui.anfrageMoney = null;
  if (already) return syncHash();
  history.pushState(null, '', location.pathname + location.search + '#anfragen' + (id ? '=' + encodeURIComponent(id) : ''));
}
// docs/changes/032: same pattern as openFinanzen() - the mobile route for the decisions list
function openEntscheidungen() {
  const already = ui.screen === 'entscheidungen';
  ui.screen = 'entscheidungen';
  if (already) return;
  history.pushState(null, '', location.pathname + location.search + '#entscheidungen');
}
// docs/changes/013 B3: entering Finanzen gets its own step back - Browser-Zurück leaves it
// again and lands on the list. Opening an Akte still replaces (decision from 006), unaffected.
function openFinanzen() {
  const already = ui.screen === 'finanzen';
  ui.screen = 'finanzen';
  ui.finFilter = null;
  if (already) return; // opened again while already there: no second entry
  history.pushState(null, '', location.pathname + location.search + '#finanzen');
}

function setExpanded(id) {
  const prev = ui.expanded;
  if (id) markCommentsSeen(id).catch(() => {}); // opening takes the "new" dot away (009)
  // docs/changes/018 §1: the phone shows one column - a task from another one (a signal, a link,
  // a search hit) would open into nothing, so the switch follows the task
  const t0 = id ? byId(id) : null;
  if (t0 && !ui.wide) {
    const want = t0.owner === state.person ? 'me' : t0.owner === 'B' ? 'B' : 'you';
    if (ui.col !== want) {
      ui.col = want;
      saveUI();
    }
  }
  // docs/changes/038 #8: the phone leaves the list for a detail page, so opening is a history
  // step and the list gets its scroll position back when the person comes back
  // nur die Aufgabenliste: dort ist der leere Hash das Ziel, auf das Browser-Zurueck faellt.
  // Auf #entscheidungen wuerde ein #task=... dagegen die Route wechseln, und Zurueck landete
  // wieder auf derselben Detailseite (Reviewer-Fund 2).
  const leavingList = !ui.wide && id && !prev && ui.screen === 'dashboard';
  if (leavingList) ui.listScroll = window.scrollY;
  ui.expanded = id;
  ui.confirm = null;
  ui.akteEdit = null;
  ui.draft = null;
  ui.briefOpen = null;
  ui.advOpen = null;
  ui.subEdit = null;
  ui.comEdit = null;
  ui.costEdit = null;
  ui.costSet = null;
  ui.costPay = null;
  ui.costPayBy = null;
  ui.costDraft = null;
  ui.costMore = null;
  ui.costAdd = null;
  ui.costNewMore = false;
  ui.costQuick = null;
  if (leavingList) {
    history.pushState(null, '', location.pathname + location.search + '#task=' + encodeURIComponent(id));
    render();
    window.scrollTo({ top: 0 });
    return;
  }
  syncHash();
  render();
  // coming back from the detail page: the list stands where it was left (#8)
  if (!id && prev && !ui.wide) {
    window.scrollTo({ top: ui.listScroll || 0 });
    ui.listScroll = 0;
  }
  // closing gives the keyboard focus back to the task's title in the list
  if (!id && prev) $(`#view .task[data-id="${CSS.escape(prev)}"] .t`)?.focus({ preventScroll: true });
}

/* ---------- search (docs/changes/012) ----------
   Typing replaces what narrows the list (tile filter and phase), emptying the field puts both
   back. Tapping a tile or a phase chip while searching is a decision of its own – then there is
   nothing left to restore. */
function setQuery(v) {
  const had = searching();
  ui.q = v;
  const now = searching();
  if (now && !had) {
    ui.qPrev = { filter: ui.filter, phase: ui.phase };
    ui.filter = null;
    ui.phase = null; // the phase chip is remembered per device, so this is not saved
  } else if (!now && had) {
    restoreBeforeSearch();
  }
  render();
}
function restoreBeforeSearch() {
  const p = ui.qPrev;
  ui.qPrev = null;
  if (!p) return;
  ui.filter = p.filter;
  ui.phase = p.phase;
}
// a hit is a way in, not a toggle: the search closes and the list comes back as it was
function jumpTo(t) {
  $('#search')?.blur(); // the keyboard has to go before the list scrolls
  ui.q = '';
  restoreBeforeSearch();
  if (ui.filter && !FILTERS[ui.filter].test(t)) ui.filter = null;
  if (ui.phase !== null && t.phase !== ui.phase) ui.phase = t.phase;
  revealTask(t);
  if (ui.wide) setExpanded(t.id); // desktop: the Akte opens in the panel as well (renders)
  else render(); // phone: the person decides with the next tap
  const el = $(`#view .task[data-id="${CSS.escape(t.id)}"]`);
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1000);
}
const isEditable = (el) => !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/* ---------- events ---------- */
const fail = (e) => e && toast('Nicht gespeichert – bitte nochmal versuchen');

/** After my own tick: did that finish the phase? Then the moment belongs to me now (021). */
function checkGate(phase) {
  if (ui.gate !== null) return;
  if (!phaseDone(phase) || state.seenGates.has(phase)) return;
  ui.gate = phase;
  render();
  window.scrollTo({ top: 0 });
}

/** Put the today marker of the timeline in view (docs/changes/019). */
function jumpToToday() {
  requestAnimationFrame(() => $('#tl-today')?.scrollIntoView({ block: 'center' }));
}

/** A fresh 32-byte secret for the calendar addresses (docs/changes/022). */
async function newIcsToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  await setSetting('ics_token', token);
}
// what still works without a connection: looking, folding, filtering, printing (docs/changes/009)
const OFFLINE_OK = new Set([
  'open', 'panel-close', 'filter-clear', 'changelog', 'changelog-close', 'reload', 'logout',
  'col-toggle', 'col-all', 'col-done', 'col-blocked', 'goto', 'col-person', 'visit-toggle', 'group-open',
  'task-filter',
  'view-switch', 'tl-owner', 'tl-done', 'tl-today', 'tl-wait',
  'brief-read', 'adv-open', 'akte-cancel', 'akte-discard',
  'print', 'print-close', 'print-now',
  'screen', 'fin-open', 'fin-filter', 'fin-filter-clear', 'fin-settings',
  'fin-recurring', 'q-clear', 'home', 'overlay-close', 'title-edit', 'title-done',
  'bal-how', 'post-open', 'rec-edit', 'rec-done',
  'sub-edit', 'sub-edit-done', 'com-edit', 'com-cancel',
  'entscheidungen-open', 'entscheidungen-close', 'decisions-filter', 'decisions-row-open',
  'anfrage-new', 'anfrage-open', 'anfrage-close', 'offer-edit', 'offer-cancel', 'money-no', 'anfrage-copy',
  'anfragen-list', 'offer-open', 'db-section',
  'cost-cancel', 'cost-discard', 'fin-setup-back', 'fin-setup-skip', 'fin-setup-resume', 'fin-setup-household',
]);

function wireEvents() {
  // docs/changes/038: #app, not #view - the shell (nav, second level, footer, tab bar) lives
  // outside the content container and its controls have to reach the same switch
  const view = $('#app');
  view.addEventListener('focusout', () => setTimeout(() => renderPending && !isTyping() && render(), 0));
  document.addEventListener('keydown', (e) => {
    // docs/changes/012: Escape empties the search field and leaves it, "/" jumps into it
    const el = document.activeElement;
    // docs/changes/032c: Zeilen mit role="button" (Entscheidungen-Tabelle/-Karten) sind per Tab
    // erreichbar - Enter/Leertaste lösen denselben Klick aus wie ein Tap, sonst wäre die Tastatur
    // ausgesperrt (echte <button>-Elemente bekommen das schon vom Browser geschenkt)
    if ((e.key === 'Enter' || e.key === ' ') && el?.getAttribute('role') === 'button' && el.dataset.act) {
      e.preventDefault();
      el.click();
      return;
    }
    if (e.key === 'Escape' && el?.id === 'search') {
      el.blur(); // before the render, so the focus is not handed back to the field
      setQuery('');
      return;
    }
    if (e.key === '/' && !isEditable(el) && state.loaded && ui.screen === 'dashboard') {
      e.preventDefault();
      $('#search')?.focus();
      return;
    }
    // docs/changes/016b: the amount/date tapped open right in the row - Enter speichert, Esc verwirft
    if (el?.dataset?.quickField && (e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      el.blur(); // first, so the redraw right after is not held back by "still typing" (006 step 3)
      if (e.key === 'Escape') {
        ui.costQuick = null;
        render();
      } else saveQuickField(el);
      return;
    }
    if (e.key !== 'Escape') return;
    if (ui.avatarMenu) {
      ui.avatarMenu = false;
      render();
    } else if (ui.setupPicker) {
      ui.setupPicker = false;
      render();
    } else if (ui.setupReopen) {
      ui.setupReopen = false;
      ui.setupStep = null;
      render();
    } else if (ui.titleEdit) {
      if (document.activeElement?.closest?.('.akte-title')) document.activeElement.blur();
      ui.titleEdit = null;
      render();
    } else if (ui.changelogOpen) closeChangelog();
    else if (ui.printOpen) {
      ui.printOpen = false;
      render();
    } else if (ui.expanded && ui.wide) {
      // a field still being typed in saves on blur – let that happen before the panel goes
      if (document.activeElement?.closest?.('#panel')) document.activeElement.blur();
      setExpanded(null); // Escape empties the side panel and closes the overlay
    }
  });
  // browser back/forward or a pasted link: follow the hash
  window.addEventListener('hashchange', () => {
    if (!state.loaded) return;
    if (openedViaFinanzen()) {
      ui.screen = 'finanzen';
      render();
      return;
    }
    if (openedViaEntscheidungen()) {
      ui.screen = 'entscheidungen';
      render();
      return;
    }
    if (openedViaAnfragen()) {
      ui.screen = 'anfragen';
      ui.anfrage = hashAnfrageId();
      render();
      return;
    }
    ui.screen = 'dashboard';
    const id = hashTaskId();
    const wasOpen = ui.expanded;
    if (id && byId(id)) openTaskFromHash();
    else if (!id) ui.expanded = null;
    render();
    // docs/changes/038 #8: Browser-Zurueck aus der Detailseite laesst die Liste dort stehen, wo
    // sie verlassen wurde - der Weg ueber hashchange ist der haeufigere von beiden
    if (!id && wasOpen && !ui.wide) {
      window.scrollTo({ top: ui.listScroll || 0 });
      ui.listScroll = 0;
    }
  });
  // no connection: show the cached state read-only; back online: reload, no page reload needed (009)
  window.addEventListener('offline', () => {
    ui.offline = true;
    render();
  });
  window.addEventListener('online', () => {
    loadAll()
      .then(() => {
        ui.offline = false;
        render();
      })
      .catch(() => {});
  });
  // leaving the app ends the visit: the next open measures "Seit deinem letzten Besuch" from here (009)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && markVisit().catch(() => {}));
  window.addEventListener('pagehide', () => markVisit().catch(() => {}));
  // layout: the Akte moves between inline, overlay and side panel – same behaviour, other place
  const mqWide = matchMedia('(min-width: 900px)');
  const mqPanel = matchMedia('(min-width: 1180px)');
  syncMode();
  for (const mq of [mqWide, mqPanel]) {
    mq.addEventListener('change', () => {
      syncMode();
      // the Akte changes place, so this render cannot be skipped: a field that is being typed in
      // gives up focus first (which saves it) instead of freezing the old layout
      if (isTyping()) document.activeElement.blur();
      render();
    });
  }
  function syncMode() {
    ui.wide = mqWide.matches;
    ui.mode = mqPanel.matches ? 'panel' : mqWide.matches ? 'overlay' : 'phone';
  }

  // docs/changes/012: from the first character, without a delay
  view.addEventListener('input', (e) => {
    if (e.target.dataset.input === 'q') setQuery(e.target.value);
    // docs/changes/032: "Entschieden: …" pre-checks the checkbox below, live, without a render
    // (a full render mid-keystroke would drop the cursor position)
    if (e.target.dataset.input === 'com') {
      const box = e.target.closest('[data-id]')?.querySelector('[data-input="com-decision"]');
      if (box) box.checked = /^entschieden:/i.test(e.target.value.trim());
    }
  });

  view.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.input === 'q') return; // the search saves nothing – it reacts on 'input'
    if (ui.offline) {
      render(); // put the control back the way the cached state says
      return toast('Ohne Netz kannst du nur lesen');
    }
    // docs/changes/033: the frame of an anfrage draft, one field at a time straight into
    // brief.anfrage.fields - the Akte's draft path (setDraft/taskPatch) stays untouched
    if (el.dataset.anfrageField !== undefined || el.dataset.anfrageTask !== undefined) {
      const a = anfrageById(el.closest('[data-id]')?.dataset.id);
      if (!a) return;
      const af = a.brief?.anfrage || {};
      if (el.dataset.anfrageTask !== undefined) {
        const t = byId(el.value);
        const place = t ? { phase: t.phase, offset_days: t.offset_days, anchor: t.anchor } : {};
        updateTask(a.id, { ...place, brief: { ...a.brief, anfrage: { ...af, task_id: el.value || null } } }).catch(fail);
        return;
      }
      const v = el.type === 'checkbox' ? el.checked : el.value.trim();
      updateTask(a.id, { brief: { ...a.brief, anfrage: { ...af, fields: { ...(af.fields || {}), [el.dataset.anfrageField]: v } } } }).catch(fail);
      return;
    }
    // monthly costs: three amounts per row, each written on its own (007 commit 3)
    if (el.dataset.recField) {
      const raw = el.value.trim();
      const v = raw === '' ? null : parseAmount(raw);
      if (v === null && raw !== '') return toast('Betrag nicht lesbar – z. B. 780 oder 780,50');
      updateRecurring(el.dataset.ref, { [el.dataset.recField]: v }).catch(fail);
      return;
    }
    // the small finance settings area (007): dates and percentages, one key at a time
    if (el.dataset.setting) {
      const key = el.dataset.setting;
      const raw = el.value.trim();
      // 014c: buffer_fixed is a number or nothing - an emptied field means "no fixed amount",
      // stored as jsonb null (not '' - the view casts it to numeric)
      if (key === 'buffer_fixed') {
        const v = raw === '' ? null : parseAmount(raw);
        if (raw !== '' && v === null) return toast('Betrag nicht lesbar');
        setSetting(key, v).catch(fail);
        return;
      }
      // settings.value is jsonb NOT NULL: an emptied field stores '', never null
      let v = '';
      if (raw !== '') {
        v = key.endsWith('_pct') || key.startsWith('split') ? parseAmount(raw) : raw;
        if (v === null) return toast('Wert nicht lesbar');
      }
      setSetting(key, v).catch(fail);
      return;
    }
    if (el.dataset.input === 'kontakte') {
      setSetting('umzugstag_kontakte', el.value).catch(fail);
      return;
    }
    if (el.id === 'einzug') {
      ui.dateEdit = false;
      setSetting('einzugstermin', el.value || '').catch(fail);
      return;
    }
    // docs/changes/026 Schritt 7: a checkbox, not a button - "abgewählt" is remembered until Weiter
    if (el.dataset.act === 'stam-cost-toggle') {
      ui.setupCostSel = ui.setupCostSel || new Set();
      if (el.checked) ui.setupCostSel.delete(el.dataset.ref);
      else ui.setupCostSel.add(el.dataset.ref);
      render();
      return;
    }
    const row = el.closest('[data-id]'); // task row, or the side panel
    const t = row ? byId(row.dataset.id) || anfrageById(row.dataset.id) : null; // an anfrage too (033: its comments)
    if (el.dataset.act === 'sub-done') {
      setSubtaskDone(el.closest('.sub').dataset.sub, el.checked)
        .then((autoDone) => autoDone && toast('Alle Teilschritte erledigt – Aufgabe abgehakt'))
        .catch(fail);
      return;
    }
    // renaming a subtask (013 B2): saves on blur, like the other text fields
    if (el.dataset.subField === 'title') {
      const s = state.subtasks.find((x) => x.id === el.dataset.ref);
      if (!s) return;
      const v = el.value.replace(/\s+/g, ' ').trim() || s.title; // never save an empty title
      updateSubtask(s.id, { title: v }).catch(fail);
      return;
    }
    if (el.dataset.act === 'done' && t) {
      // docs/changes/020: a blocked task is not tickable - the box is disabled, and if an event
      // arrives anyway (keyboard, stale DOM) the row is drawn again instead of written
      if (blockers(t).length && !t.done) {
        render();
        return toast('Wartet noch auf eine andere Aufgabe');
      }
      // done_by: who ticked it off – "Seit deinem letzten Besuch" must not count my own work (009)
      updateTask(t.id, { done: el.checked, ...doneBy(el.checked) })
        .then(() => checkGate(t.phase))
        .catch(fail);
      return;
    }
    // docs/changes/017: in Bearbeiten nothing is written until "Fertig" - the field lands in
    // the draft, and the counter in the hint line goes up by one the first time it is touched
    if (el.dataset.draft && t) {
      setDraft(t, el.dataset.draft, el.type === 'checkbox' ? el.checked : el.value);
      render();
      return;
    }
    if (el.dataset.field && t) {
      const f = el.dataset.field;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'offset_days') v = parseInt(v || '0', 10);
      if (f === 'title') v = String(v).replace(/\s+/g, ' ').trim() || t.title; // the title field wraps, but stays one line of text
      if (f === 'wait_on') v = v || null;
      const patch = { [f]: v };
      if (f === 'type' && v === 'claude' && !t.status) patch.status = 'briefing';
      updateTask(t.id, patch).catch(fail);
      return;
    }
    // docs/changes/016b: a cost row's Bearbeiten-Modus works like the Akte's - nothing is
    // written until "Fertig", the field lands in the draft
    if (el.dataset.costDraft) {
      const c = state.costs.find((x) => x.id === el.closest('[data-cost-edit]')?.dataset.costEdit);
      setCostDraft(c, el.dataset.costDraft, el.type === 'checkbox' ? el.checked : el.value);
      render();
      return;
    }
    // the amount or due date tapped open right in the row - one field, no mode (016b)
    if (el.dataset.quickField) {
      saveQuickField(el);
      return;
    }
    if (el.dataset.brief && t) {
      const brief = { ...(t.brief || {}), [el.dataset.brief]: el.value };
      updateTask(t.id, { brief }).catch(fail);
      return;
    }
    if (el.dataset.act === 'block-select' && el.value && t) {
      if (ui.akteEdit === t.id) {
        setDraft(t, 'blocked_by', [...fieldValue(t, 'blocked_by'), el.value]);
        return render();
      }
      updateTask(t.id, { blocked_by: [...(t.blocked_by || []), el.value] }).catch(fail);
    }
  });

  view.addEventListener('click', async (e) => {
    // tap outside the open panel closes it (and marks it read); the tap itself still does what it does
    if (ui.changelogOpen && !e.target.closest('#changelog') && !e.target.closest('[data-act="changelog"]')) closeChangelog();
    // gate bar and phase chips select the phase; the filter stays
    const ph = e.target.closest('[data-phase]');
    if (ph) {
      const want = ph.dataset.phase === 'all' ? null : parseInt(ph.dataset.phase, 10);
      ui.qPrev = null;
      ui.phase = ui.phase === want ? null : want; // tapping the active phase again shows all phases
      saveUI();
      if (!ui.wide) setExpanded(null);
      else render();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const act = b.dataset.act;
    // Pressing a button ends typing. Without this the field keeps the focus (Safari does not
    // focus buttons on tap), isTyping() stays true and the redraw after the write is skipped -
    // the new row would only appear once the person taps somewhere else. The blur also saves
    // what was typed, and the values below are read before the redraw replaces the DOM.
    if (isTyping()) document.activeElement.blur();
    if (ui.offline && !OFFLINE_OK.has(act)) return toast('Ohne Netz kannst du nur lesen');
    const row = b.closest('[data-id]'); // task row, or the side panel
    const t = row ? byId(row.dataset.id) || anfrageById(row.dataset.id) : null; // an anfrage too (033: its comments)
    const input = (sel, root = row) => $(sel, root);
    try {
      switch (act) {
        case 'filter-clear':
          ui.filter = null;
          render();
          return;
        // docs/changes/038 #5: the pills above the list are the filter now - "alle" is no filter
        case 'task-filter': {
          const key = b.dataset.to;
          ui.qPrev = null;
          ui.filter = key === 'all' || ui.filter === key ? null : FILTERS[key] ? key : null;
          render();
          return;
        }
        case 'changelog':
          if (ui.changelogOpen) closeChangelog();
          else openChangelog(false);
          return;
        case 'changelog-close':
          closeChangelog();
          $('.foot')?.scrollIntoView({ block: 'end' });
          return;
        case 'date-toggle':
          ui.dateEdit = !ui.dateEdit;
          render();
          if (ui.dateEdit) $('#einzug')?.focus();
          return;
        case 'logout':
          auth.signOut();
          return;
        case 'reload':
          location.reload();
          return;
        case 'print':
          ui.printOpen = !ui.printOpen;
          render();
          if (ui.printOpen) $('#printsheet')?.scrollIntoView({ block: 'start' });
          return;
        case 'print-close':
          ui.printOpen = false;
          render();
          $('.foot')?.scrollIntoView({ block: 'end' });
          return;
        case 'print-now':
          window.print();
          return;
        case 'open':
          if (searching()) return jumpTo(t); // docs/changes/012
          setExpanded(ui.expanded === t.id ? null : t.id);
          return;
        // docs/changes/032c: eigene, nicht umschaltende Variante von 'open' - mehrere Zeilen der
        // Entscheidungen-Seite können auf dieselbe Aufgabe zeigen; ein Klick auf eine zweite Zeile
        // derselben Aufgabe soll immer zu deren Karte scrollen, nicht die Akte schließen (Reviewer-
        // Fund: das Umschalten aus 'open' hätte genau das getan, sobald die Aufgabe schon offen war)
        case 'decisions-row-open':
          setExpanded(t.id);
          if (b.dataset.scroll) $(`[data-com="${CSS.escape(b.dataset.scroll)}"]`)?.scrollIntoView({ block: 'center' });
          return;
        case 'q-clear':
          setQuery('');
          $('#search')?.focus();
          return;
        // docs/changes/009: "blockiert: …" is a link to the blocking task
        case 'goto': {
          const dep = byId(b.dataset.ref);
          if (!dep) return;
          if (ui.phase !== null && dep.phase !== ui.phase) ui.phase = dep.phase;
          if (ui.filter && !FILTERS[ui.filter].test(dep)) ui.filter = null;
          revealTask(dep);
          setExpanded(dep.id);
          if (!ui.wide) $(`#view .task[data-id="${CSS.escape(dep.id)}"]`)?.scrollIntoView({ block: 'start' });
          return;
        }
        case 'col-toggle':
          ui.openCols.has(b.dataset.ref) ? ui.openCols.delete(b.dataset.ref) : ui.openCols.add(b.dataset.ref);
          render();
          return;
        case 'col-all':
          ui.allCols.add(b.dataset.ref);
          render();
          return;
        case 'col-done':
          ui.doneCols.add(b.dataset.ref);
          render();
          return;
        case 'col-blocked':
          ui.blockedCols.has(b.dataset.ref) ? ui.blockedCols.delete(b.dataset.ref) : ui.blockedCols.add(b.dataset.ref);
          render();
          return;
        /* ---------- Gate-Moment 021 ---------- */
        case 'gate-next':
          await markGateSeen(parseInt(b.dataset.ref, 10)).catch(() => {});
          ui.gate = null;
          render();
          window.scrollTo({ top: 0 });
          return;
        /* ---------- Timeline 019 ---------- */
        case 'view-switch': {
          const to = b.dataset.to;
          if (ui.view === to) return;
          ui.view = to;
          ui.filter = null; // the signals belong to the person view
          ui.expanded = null;
          saveUI();
          render();
          // the timeline opens where today is: what is overdue stands directly above it
          if (to === 'timeline') jumpToToday();
          else window.scrollTo({ top: 0 });
          return;
        }
        case 'tl-owner':
          ui.tlOwner = b.dataset.to;
          render();
          return;
        case 'tl-done':
          ui.tlDone = !ui.tlDone;
          render();
          return;
        case 'tl-wait': // 019c: "wartet auf 2 ›" names the two tasks right under the row
          ui.tlWait = ui.tlWait === b.dataset.ref ? null : b.dataset.ref;
          render();
          return;
        case 'tl-today':
          jumpToToday();
          return;
        /* ---------- dashboard 018 ---------- */
        case 'col-person':
          ui.col = b.dataset.to;
          ui.expanded = null;
          saveUI();
          render();
          window.scrollTo({ top: 0 });
          return;
        case 'visit-toggle':
          ui.visitOpen = !ui.visitOpen;
          render();
          return;
        case 'group-open':
          ui.openGroups.add(b.dataset.ref);
          render();
          return;
        case 'answer': {
          // open the Akte and put the cursor in the comment field - that is the answer (018 §3)
          const id = b.dataset.ref;
          ui.filter = null;
          setExpanded(id); // marks the comments seen and renders
          $(`[data-detail="${CSS.escape(id)}"] [data-input=com], #view .task[data-id="${CSS.escape(id)}"] [data-input=com]`, $('#view'))?.focus();
          return;
        }
        case 'remind': {
          const task = byId(b.dataset.ref);
          if (!task) return;
          await addComment(task.id, `Erinnerung: ${task.title}`);
          toast('Erinnerung geschrieben');
          return;
        }
        // docs/changes/038 #21/#23: the list section folds, and on a phone one offer row unfolds
        case 'anfragen-list':
          ui.anfragenList = ui.anfragenList === false;
          render();
          return;
        case 'offer-open':
          ui.offerOpen = ui.offerOpen === b.dataset.to ? null : b.dataset.to;
          render();
          return;
        // docs/changes/038 #13/#14: ein Abschnitt des Dashboards klappt auf und zu; die
        // Mini-Balken oeffnen damit "Monat fuer Monat"
        case 'db-section': {
          const k = b.dataset.to;
          const dflt = k === 'posten';
          // data-open="1" heisst oeffnen statt umschalten - die Mini-Balken sagen "oeffnen"
          // und sollen dann auch oeffnen, wenn der Abschnitt schon offen ist (Reviewer-Fund 16)
          ui.finSections[k] = b.dataset.open ? true : ui.finSections[k] === undefined ? !dflt : !ui.finSections[k];
          render();
          if (b.dataset.open) $(`[data-sect="${CSS.escape(k)}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          return;
        }
        case 'panel-close':
          // #8: the phone detail page is a history step - leaving it goes back, so the list is
          // reached the same way by the button and by Browser-Zurück
          if (!ui.wide && ui.expanded && /^#task=/.test(location.hash)) history.back();
          else setExpanded(null);
          return;
        case 'unblock':
          if (ui.akteEdit === t.id) {
            setDraft(t, 'blocked_by', fieldValue(t, 'blocked_by').filter((id) => id !== b.dataset.ref));
            return render();
          }
          await updateTask(t.id, { blocked_by: (t.blocked_by || []).filter((id) => id !== b.dataset.ref) });
          return;
        case 'sub-add': {
          const v = input('[data-input=sub]').value.trim();
          if (!v) return;
          await addSubtask(t.id, v);
          return;
        }
        case 'sub-edit':
          ui.subEdit = b.dataset.ref;
          ui.confirm = null;
          render();
          $(`[data-sub="${CSS.escape(b.dataset.ref)}"] .sub-edit-title`, $('#view'))?.focus();
          return;
        case 'sub-edit-done':
          ui.subEdit = null;
          render();
          return;
        case 'sub-del':
          ui.confirm = 'subdel:' + b.dataset.ref;
          render();
          return;
        case 'sub-del-yes':
          ui.subEdit = null;
          ui.confirm = null;
          await deleteSubtask(b.dataset.ref);
          toast('Teilschritt gelöscht');
          return;
        case 'com-add': {
          const ta = input('[data-input=com]');
          const v = ta.value.trim();
          if (!v) return;
          const decision = !!input('[data-input=com-decision]')?.checked;
          await addComment(t.id, v, decision);
          return;
        }
        /* ---------- own comments (013 B5) ---------- */
        case 'com-edit': {
          const c = state.comments.find((x) => x.id === b.dataset.ref);
          if (!c || !canEditComment(c)) return; // the ten minutes are over - stale button from an old render
          ui.comEdit = c.id;
          ui.confirm = null;
          render();
          $(`[data-com="${CSS.escape(c.id)}"] .com-edit`, $('#view'))?.focus();
          return;
        }
        case 'com-cancel':
          ui.comEdit = null;
          render();
          return;
        case 'com-save': {
          const ta = $(`[data-com="${CSS.escape(b.dataset.ref)}"] .com-edit`, $('#view'));
          const v = ta.value.trim();
          if (!v) return toast('Kommentar darf nicht leer sein');
          ui.comEdit = null;
          await updateComment(b.dataset.ref, { body: v });
          return;
        }
        case 'com-del':
          ui.confirm = 'comdel:' + b.dataset.ref;
          render();
          return;
        case 'com-del-yes':
          ui.comEdit = null;
          ui.confirm = null;
          await deleteComment(b.dataset.ref);
          toast('Kommentar gelöscht');
          return;
        /* ---------- decisions (docs/changes/032) ---------- */
        case 'com-decision-toggle': {
          const c = state.comments.find((x) => x.id === b.dataset.ref);
          if (!c) return;
          await setCommentDecision(c.id, !c.decision);
          return;
        }
        case 'decision-ack':
          await setDecisionAck(b.dataset.ref, true);
          toast('Bestätigt');
          return;
        case 'decision-ack-toggle': // the filled circle is only ever tappable to take the own tick back
          await setDecisionAck(b.dataset.ref, false);
          return;
        case 'entscheidungen-open':
          ui.expanded = null;
          openEntscheidungen();
          render();
          return;
        case 'entscheidungen-close':
          ui.screen = 'dashboard';
          ui.expanded = null;
          syncHash();
          render();
          return;
        case 'decisions-filter':
          ui.decisionsFilter = b.dataset.to;
          render();
          return;
        /* ---------- Anfragen (033) ---------- */
        // `t` is the anfrage wherever the button sits in its detail (data-id on panel/page).
        // Every action there pins it (ui.anfrage): a new status re-sorts the list, and on a wide
        // screen without an explicit pick the panel would otherwise jump to the new first row.
        case 'anfrage-new':
          ui.anfrageNew = !ui.anfrageNew;
          render();
          return;
        case 'anfrage-create': {
          // from "+ Anfrage" or from "Anfrage stellen ›" in the Akte of one of the four tasks
          const cat = CATEGORIES[b.dataset.to] ? b.dataset.to : 'sonstiges';
          const linked = byId(CATEGORIES[cat].task);
          const s = state.settings;
          const id = await insertTask({
            type: 'anfrage',
            title: CATEGORIES[cat].label,
            owner: 'B',
            // phase and deadline of the linked task, so the anfrage sorts where the task is
            phase: linked?.phase ?? (phases()[0]?.id || 1),
            offset_days: linked?.offset_days ?? 0,
            anchor: linked?.anchor ?? 'einzug',
            brief: { anfrage: { category: cat, task_id: linked?.id || null, fields: prefill(cat, { stammdaten: s.stammdaten, umzugstag: s.umzugstag, einzug: s.einzugstermin }) } },
          });
          ui.anfrageNew = false;
          openAnfragen(id);
          render();
          window.scrollTo({ top: 0 });
          return;
        }
        case 'anfrage-open': // a row of the list, or the block in the Akte of the linked task
          ui.anfrageNew = false;
          openAnfragen(b.dataset.ref);
          render();
          if (!ui.wide) window.scrollTo({ top: 0 });
          return;
        case 'anfrage-close':
          ui.anfrage = null;
          ui.offerEdit = null;
          ui.anfrageMoney = null;
          syncHash();
          render();
          return;
        case 'anfrage-send': {
          const af = t?.brief?.anfrage;
          if (!t || t.type !== 'anfrage' || !af?.task_id) return;
          ui.anfrage = t.id;
          syncHash();
          // like "Claude jetzt starten" (024): the next scheduled run picks it up
          await updateTask(t.id, { status: 'claude', brief: { ...t.brief, anfrage: { ...af, sent_at: new Date().toISOString(), requested_by: state.person } } });
          await addComment(af.task_id, `Anfrage „${t.title}“ an Claude gesendet – das Ergebnis erscheint unter Anfragen.`);
          return;
        }
        case 'offer-choose': {
          if (!t || t.type !== 'anfrage' || t.status !== 'ergebnis') return;
          const offer = offersOf(t).find((o) => o.id === b.dataset.to);
          if (!offer) return;
          const plan = choosePlan({ anfrage: t, offer, person: state.person, now: new Date().toISOString(), costs: state.costs, recurring: state.recurring });
          ui.anfrage = t.id;
          syncHash();
          await updateTask(t.id, plan.patch);
          // the decision lands on the linked task (032) - the other person confirms it there
          if (plan.comment) await addComment(plan.comment.taskId, plan.comment.body, true);
          ui.anfrageMoney = { id: t.id, money: plan.money };
          render();
          return;
        }
        case 'money-yes': {
          const m = ui.anfrageMoney?.money;
          ui.anfrageMoney = null;
          if (m?.kind === 'cost-update') await updateCost(m.id, m.patch);
          else if (m?.kind === 'cost-new') await addCost(m.taskId, m.fields);
          else if (m?.kind === 'recurring') await updateRecurring(m.id, m.patch);
          if (m && m.kind !== 'none') toast('Übernommen');
          render();
          return;
        }
        case 'money-no':
          ui.anfrageMoney = null;
          render();
          return;
        case 'offer-unchoose': // comment, posten and Laufend value stay (033)
          if (!t || t.type !== 'anfrage') return;
          ui.anfrageMoney = null;
          ui.anfrage = t.id;
          syncHash();
          await updateTask(t.id, unchoosePatch(t));
          return;
        case 'offer-edit':
          if (!t || t.type !== 'anfrage') return;
          ui.anfrage = t.id;
          syncHash();
          ui.offerEdit = { id: t.id, offerId: b.dataset.to };
          render();
          return;
        case 'offer-cancel':
          ui.offerEdit = null;
          render();
          return;
        case 'offer-save': {
          const e = ui.offerEdit;
          if (!t || !e || e.id !== t.id) return;
          const val = (k) => input(`[data-input="of-${k}"]`)?.value.trim() || '';
          const name = val('name');
          if (!name) return toast('Bitte einen Anbieter eintragen');
          const raw = val('price');
          const price = raw === '' ? null : parseAmount(raw);
          if (raw !== '' && price === null) return toast('Preis nicht lesbar – z. B. 1740 oder 29,99');
          const offers = offersOf(t);
          const prev = e.offerId === 'new' ? null : offers.find((o) => o.id === e.offerId);
          // added or changed by a person: Claude's run never overwrites it again (standing rule)
          const offer = {
            ...(prev || {}),
            id: prev?.id || 'm_' + Date.now(),
            name,
            price,
            price_kind: val('price_kind') || 'fest',
            service: val('service'),
            term: val('term'),
            valid_until: val('valid_until') || null,
            plus: val('plus'),
            minus: val('minus'),
            url: val('url'),
            author: state.person,
            source: 'manual',
            date: todayISO(),
          };
          const next = prev ? offers.map((o) => (o.id === prev.id ? offer : o)) : [...offers, offer];
          ui.offerEdit = null;
          await updateTask(t.id, { brief: { ...t.brief, vergleich: { ...(t.brief?.vergleich || {}), offers: next } } });
          return;
        }
        case 'anfrage-copy': {
          const text = t?.brief?.vergleich?.request_text;
          if (!text) return;
          await navigator.clipboard.writeText(text);
          toast('Anfragetext kopiert');
          return;
        }
        /* ---------- navigation (013 A6) ---------- */
        case 'home': // the house: back to the plain list, no filter, all phases
          ui.screen = 'dashboard';
          ui.filter = null;
          ui.phase = null;
          ui.finFilter = null;
          ui.q = '';
          ui.qPrev = null;
          saveUI();
          setExpanded(null);
          window.scrollTo({ top: 0 });
          return;
        /* ---------- Akte: Ansehen und Bearbeiten (017) ---------- */
        case 'akte-edit':
          ui.akteEdit = b.dataset.ref;
          ui.draft = { id: b.dataset.ref, fields: {} };
          ui.confirm = null;
          ui.briefOpen = null;
          render();
          $(`[data-detail="${CSS.escape(b.dataset.ref)}"] [data-draft=title]`, $('#view'))?.focus();
          return;
        case 'akte-cancel':
          // without a single change there is nothing to ask about
          if (!draftCount({ id: b.dataset.ref })) return closeEdit();
          ui.confirm = 'akte-cancel:' + b.dataset.ref;
          render();
          return;
        case 'akte-discard':
          closeEdit();
          toast('Änderungen verworfen');
          return;
        case 'akte-done': {
          const patch = taskPatch(t);
          closeEdit();
          if (!patch) return;
          await updateTask(t.id, patch); // every changed field in one request
          toast('Gespeichert');
          return;
        }
        case 'draft-set':
          setDraft(t, b.dataset.field, b.dataset.to);
          render();
          return;
        case 'brief-read':
          ui.briefOpen = ui.briefOpen === b.dataset.ref ? null : b.dataset.ref;
          render();
          return;
        case 'adv-open': {
          const key = b.dataset.ref + ':' + b.dataset.to;
          ui.advOpen = ui.advOpen === key ? null : key;
          render();
          return;
        }
        case 'sub-up':
        case 'sub-down': {
          const subs = subsOf(t.id);
          const i = subs.findIndex((s) => s.id === b.dataset.ref);
          const j = act === 'sub-up' ? i - 1 : i + 1;
          if (i < 0 || j < 0 || j >= subs.length) return;
          // two rows swap their place - sort is what the list is ordered by
          await updateSubtask(subs[i].id, { sort: subs[j].sort });
          await updateSubtask(subs[j].id, { sort: subs[i].sort });
          return;
        }
        case 'overlay-close': // only the dimmed area around the Akte closes it (013 A3)
          if (e.target.closest('.sheet')) return;
          setExpanded(null);
          return;

        /* ---------- Finanzen view (007, addendum) ---------- */
        case 'screen':
          ui.costEdit = null;
          ui.costSet = null;
          ui.costPay = null;
          ui.costPayBy = null;
          ui.costDraft = null;
          ui.costMore = null;
          ui.finPostAdd = false;
          ui.avatarMenu = false;
          if (b.dataset.to === 'finanzen') openFinanzen();
          else if (b.dataset.to === 'entscheidungen') {
            ui.expanded = null;
            openEntscheidungen();
          } else if (b.dataset.to === 'anfragen') {
            ui.expanded = null;
            openAnfragen(ui.screen === 'anfragen' ? ui.anfrage : null);
          } else {
            ui.screen = b.dataset.to;
            ui.finFilter = null;
            syncHash();
          }
          render();
          window.scrollTo({ top: 0 });
          return;
        case 'fin-open': // from the Finanzen list into the Akte of that task
          ui.screen = 'dashboard';
          ui.finFilter = null;
          revealTask(byId(b.dataset.ref));
          setExpanded(b.dataset.ref);
          return;
        /* ---------- Kalender-Abo (022) ---------- */
        case 'ics-new':
          // the first time there is nothing to lose; later it breaks running subscriptions
          if (icsToken()) {
            ui.confirm = 'ics-new';
            render();
            return;
          }
          await newIcsToken();
          toast('Abo-Adressen erzeugt');
          return;
        case 'ics-new-yes':
          ui.confirm = null;
          await newIcsToken();
          toast('Neue Abo-Adressen – die alten gelten nicht mehr');
          return;
        case 'ics-copy': {
          const url = icsUrl(b.dataset.to);
          try {
            await navigator.clipboard.writeText(url);
            toast(`Adresse für ${OWN[b.dataset.to]} kopiert`);
          } catch {
            // no clipboard permission (or no https): show it, so it can be copied by hand
            ui.icsShow = ui.icsShow === b.dataset.to ? null : b.dataset.to;
            render();
          }
          return;
        }
        case 'alarm-stage-toggle': {
          const p = b.dataset.person;
          const n = Number(b.dataset.stage);
          const current = alarmStagesOf(p);
          const next = current.includes(n) ? current.filter((x) => x !== n) : [...current, n].sort((a, c) => c - a);
          const other = p === 'S' ? 'A' : 'S';
          await setSetting('alarm_stages', { [p]: next, [other]: alarmStagesOf(other) }).catch(fail);
          return;
        }
        /* ---------- Finanzen 016 ---------- */
        case 'bal-how':
          ui.balHow = !ui.balHow;
          render();
          return;
        case 'bal-pay':
          ui.balPay = true;
          ui.balHow = false;
          render();
          $('[data-input=bal-amount]', $('#view'))?.focus();
          return;
        case 'bal-cancel':
          ui.balPay = false;
          render();
          return;
        case 'bal-save': {
          const amount = parseAmount($('[data-input=bal-amount]', $('#view')).value);
          if (amount === null || amount <= 0) return toast('Betrag nicht lesbar – z. B. 510 oder 510,50');
          const by = $('[data-input=bal-by]', $('#view')).value;
          ui.balPay = false;
          // an 'ausgleich' row moves the balance and nothing else (016 F3)
          await addCost(null, {
            label: 'Ausgleich ' + OWN[by] + ' → ' + OWN[by === 'S' ? 'A' : 'S'],
            amount,
            kind: 'ausgleich',
            status: 'bezahlt',
            paid_by: by,
            paid_on: todayISO(),
            belongs_to: by === 'S' ? 'A' : 'S',
          }).catch((e) => {
            // without migration 010 the database still refuses the new kind - say so plainly
            toast('Ausgleich braucht Migration 010 – noch nicht eingespielt');
            throw e;
          });
          toast('Überweisung erfasst');
          return;
        }
        case 'rec-edit':
          ui.recEdit = true;
          render();
          return;
        case 'rec-done':
          ui.recEdit = false;
          ui.recAdd = false;
          render();
          return;
        case 'post-open':
          ui.postOpen = true;
          if (b.dataset.to) ui.postFilter = b.dataset.to; // "5 offene Posten zeigen" shows those five (016c)
          render();
          return;
        case 'fin-filter':
          ui.finFilter = ui.finFilter === b.dataset.to ? null : b.dataset.to;
          render();
          return;
        case 'fin-filter-clear':
          // docs/changes/038 #12: es gibt nur noch einen sichtbaren Filter - die Pille im
          // Sektionskopf raeumt deshalb beide Quellen weg, sonst bliebe die Handy-Auswahl
          // "offene Posten" ohne Weg zurueck stehen (Reviewer-Fund 6)
          ui.finFilter = null;
          ui.postFilter = 'alle';
          render();
          return;
        case 'rec-add':
          ui.recAdd = true;
          render();
          $('[data-input=rec-label]', $('#view'))?.focus();
          return;
        case 'rec-add-cancel':
          ui.recAdd = false;
          render();
          return;
        case 'rec-add-save': {
          const label = $('[data-input=rec-label]', $('#view')).value.trim();
          if (!label) return toast('Bitte einen Posten eingeben');
          ui.recAdd = false;
          await addRecurring(label);
          return;
        }
        case 'fin-recurring': // from the Akte of "Kostenmodell klären" straight to the table
          openFinanzen();
          render();
          $('#fin-recurring')?.scrollIntoView({ block: 'start' });
          return;
        case 'fin-settings':
          ui.finSettings = !ui.finSettings;
          render();
          if (ui.finSettings) $('#fin-settings')?.scrollIntoView({ block: 'start' });
          return;
        /* ---------- Ersteinrichtung: vier Fragen (docs/changes/016b) ---------- */
        case 'fin-setup-back':
          ui.finSetupStep = Math.max(0, (ui.finSetupStep || 0) - 1);
          render();
          return;
        case 'fin-setup-skip':
          ui.finSetupSkip = true;
          render();
          return;
        case 'fin-setup-resume':
          ui.finSetupSkip = false;
          ui.finSetupStep = 0;
          render();
          return;
        case 'fin-setup-household':
          ui.finSetupHousehold = b.dataset.to === 'ja';
          render();
          return;
        case 'fin-setup-next':
          await finSetupNext();
          return;
        /* ---------- docs/changes/026: der gemeinsame Start, acht Schritte ---------- */
        case 'stam-next': {
          const step = currentSetupStep();
          const [, , saveFn] = SETUP_STEPS[step];
          if (saveFn) {
            const plan = await saveFn(setupVal);
            if (plan.stammdaten) await setSetting('stammdaten', plan.stammdaten).catch(fail);
            if (plan.costInserts) for (const row of plan.costInserts) await addCost(row.task_id, row).catch(fail);
          } else if (step >= 2 && step <= 5) {
            // Termine/Mieten/Kautionen/Aufteilung (016b) - Schritt 7 "Wer macht was" hat kein
            // eigenes saveFn UND ist kein wiederverwendeter Finanzen-Schritt: seine Änderungen
            // schreiben sofort bei jedem Klick, "Weiter" hat dort nichts mehr zu speichern
            await STAM_REUSED_SAVE[step - 2]();
          }
          ui.setupAufzug = null;
          ui.setupCostSel = null;
          if (ui.setupReopen) {
            ui.setupReopen = false;
            ui.setupStep = null;
            toast('Gespeichert');
            render();
            return;
          }
          const next = step + 1;
          ui.setupStep = next;
          await setSetting('setup_step', next).catch(fail);
          render();
          return;
        }
        case 'stam-back':
          ui.setupAufzug = null;
          ui.setupCostSel = null;
          ui.setupStep = Math.max(0, currentSetupStep() - 1);
          render();
          return;
        case 'stam-skip':
          ui.setupSkip = true;
          render();
          return;
        case 'stam-resume':
          ui.setupSkip = false;
          ui.setupStep = null;
          render();
          return;
        case 'stam-finish':
          await setSetting('setup_done', true).catch(fail);
          ui.setupStep = null;
          toast('Los geht’s');
          render();
          return;
        case 'stam-picker-open':
          ui.avatarMenu = false;
          ui.setupPicker = true;
          render();
          return;
        case 'stam-picker-close':
          ui.setupPicker = false;
          render();
          return;
        case 'stam-reopen':
          ui.setupAufzug = null;
          ui.setupCostSel = null;
          ui.setupPicker = false;
          ui.setupReopen = true;
          ui.setupStep = Number(b.dataset.ref);
          render();
          return;
        case 'stam-reopen-close':
          ui.setupReopen = false;
          ui.setupStep = null;
          render();
          return;
        case 'stam-aufzug':
          ui.setupAufzug = ui.setupAufzug || {};
          ui.setupAufzug[b.dataset.wohnung] = b.dataset.to === 'ja';
          render();
          return;
        case 'stam-owner-set':
          await updateTask(b.dataset.ref, { owner: b.dataset.to }).catch(fail);
          return;
        case 'stam-owner-apply': {
          const targets = state.tasks.filter((x) => x.owner === 'B' && OWNER_PROPOSAL[x.id]);
          for (const t of targets) await updateTask(t.id, { owner: OWNER_PROPOSAL[t.id] }).catch(fail);
          toast(`${targets.length} Zuständigkeiten gesetzt`);
          return;
        }
        case 'avatar-menu-toggle':
          ui.avatarMenu = !ui.avatarMenu;
          render();
          return;
        // 014c: der Puffer ist eine Einstellung, kein Posten mehr - Satz/Betrag-Segment in den
        // Rahmendaten; "Satz" räumt einen gesetzten Festbetrag sofort ab
        case 'buffer-mode':
          ui.bufferMode = b.dataset.to;
          if (b.dataset.to === 'pct' && bufferFixed() !== null) await setSetting('buffer_fixed', null).catch(fail);
          render();
          return;

        /* ---------- cost rows: three-rung ladder (docs/changes/016b, was 007) ---------- */
        case 'cost-add':
          ui.costAdd = b.dataset.ref || t?.id || null;
          render();
          $('[data-input=cost-label]', $('#view'))?.focus();
          return;
        case 'fin-post-add':
          ui.finPostAdd = true;
          render();
          $('[data-input=cost-label]', $('#view'))?.focus();
          return;
        case 'cost-add-cancel':
          ui.costAdd = null;
          ui.finPostAdd = false;
          ui.costNewMore = false;
          render();
          return;
        case 'cost-new-more':
          ui.costNewMore = !ui.costNewMore;
          render();
          return;
        case 'cost-add-save': {
          // docs/changes/016b §2b: opened from Finanzen there is no [data-id] ancestor to read
          // fields off of (that is what `input()` defaults to), so every field is looked up in
          // the whole view instead - the same way the Ersteinrichtung reads its own fields
          const view = $('#view');
          const val = (sel) => $(`[data-input="${sel}"]`, view)?.value ?? '';
          const label = val('cost-label').trim();
          const amount = parseAmount(val('cost-amount'));
          if (!label) return toast('Bitte eine Bezeichnung eingeben');
          if (amount === null) return toast('Betrag nicht lesbar – z. B. 1800 oder 1.800,50');
          const taskId = val('cost-task') || null;
          const fields = { label, amount, task_id: taskId };
          // "mehr" is optional - inferred otherwise (docs/changes/016b §2b): Wohnung aus der
          // Aufgabe, sonst N (Aufgaben tragen selbst keine Wohnung, "sonst" ist darum der Regelfall);
          // gehört zu B ist bereits addCost()s eigener Grundwert, hier nichts zu tun; Anteil aus
          // split_default_s ebenso (null lässt die App den Standard nehmen); fällig aus der
          // Aufgabenfrist setzt der Datenbank-Trigger, sobald task_id gegeben ist
          if (ui.costNewMore) {
            const apartment = val('cost-apartment') || null;
            const kind = val('cost-kind');
            const belongs = val('cost-belongs');
            const splitRaw = val('cost-split').trim();
            const split = splitRaw ? parseAmount(splitRaw) : null;
            if (splitRaw && split === null) return toast('Anteil nicht lesbar – eine Zahl zwischen 0 und 100');
            Object.assign(fields, { apartment, kind, belongs_to: belongs, split_s: split });
          } else {
            fields.apartment = 'N';
          }
          ui.costAdd = null;
          ui.finPostAdd = false;
          ui.costNewMore = false;
          await addCost(taskId, fields).catch(fail);
          return;
        }
        case 'cost-open': {
          // 014 #7: remember in which Finanzen list it was tapped (null in the Akte)
          const where = b.closest('[data-where]')?.dataset.where || null;
          ui.costEdit = ui.costEdit === b.dataset.ref && ui.costWhere === where ? null : b.dataset.ref;
          ui.costWhere = where;
          ui.costSet = null;
          ui.costPay = null;
          ui.costDraft = null;
          ui.costMore = null;
          render();
          return;
        }
        case 'cost-more':
          ui.costMore = ui.costMore === b.dataset.ref ? null : b.dataset.ref;
          render();
          return;
        case 'cost-quick':
          ui.costQuick = { id: b.dataset.ref, field: b.dataset.field };
          render();
          $(`[data-quick-field="${CSS.escape(b.dataset.field)}"][data-ref="${CSS.escape(b.dataset.ref)}"]`, $('#view'))?.focus();
          return;
        /* ---------- "Betrag festlegen": geschätzt -> fest ---------- */
        case 'cost-set':
          ui.costSet = b.dataset.ref;
          ui.costWhere = b.closest('[data-where]')?.dataset.where || null;
          ui.costEdit = null;
          ui.costPay = null;
          render();
          $('[data-input=set-amount]', $('#view'))?.focus();
          return;
        case 'cost-set-cancel':
          ui.costSet = null;
          render();
          return;
        case 'cost-set-save': {
          const row = b.closest('.cost, .fin-pay');
          const amount = parseAmount(input('[data-input=set-amount]', row).value);
          if (amount === null || amount <= 0) return toast('Betrag nicht lesbar – z. B. 1800 oder 1.800,50');
          const due = input('[data-input=set-due]', row).value || null;
          const note = input('[data-input=set-note]', row).value.trim();
          ui.costSet = null;
          await updateCost(b.dataset.ref, { amount, due_on: due, status: 'faellig', note: note || null }).catch(fail);
          return;
        }
        /* ---------- "Bezahlt" (einmalig) / "Erhalten" (Rückfluss): fest/ausstehend -> Ende ---------- */
        case 'cost-pay':
          ui.costPay = b.dataset.ref;
          ui.costWhere = b.closest('[data-where]')?.dataset.where || null;
          ui.costEdit = null;
          ui.costSet = null;
          ui.costPayBy = null;
          render();
          return;
        case 'cost-pay-cancel':
          ui.costPay = null;
          ui.costPayBy = null;
          render();
          return;
        case 'pay-by-set':
          ui.costPayBy = b.dataset.to;
          render();
          return;
        case 'cost-pay-save': {
          const row = b.closest('.cost, .fin-pay');
          const by = b.dataset.by;
          const date = input('[data-input=pay-date]', row).value || todayISO();
          ui.costPay = null;
          ui.costPayBy = null;
          try {
            await updateCost(b.dataset.ref, { paid_by: by, paid_on: date, status: 'bezahlt' });
          } catch (e) {
            // without migration 014 the database still refuses 'H' - say so plainly (016), and
            // stop here (not the outer catch) so that message is the one that stays on screen
            if (by === 'H') toast('Haushaltskonto als Zahler braucht Migration 014 – noch nicht eingespielt');
            else fail(e);
          }
          return;
        }
        case 'cost-recv-save': {
          const row = b.closest('.cost, .fin-pay');
          const amount = parseAmount(input('[data-input=recv-amount]', row).value);
          if (amount === null || amount < 0) return toast('Betrag nicht lesbar – z. B. 2610 oder 2.610,50');
          const date = input('[data-input=recv-date]', row).value || todayISO();
          const c = state.costs.find((x) => x.id === b.dataset.ref);
          const shortfall = c ? Math.round((num(c.amount) - amount) * 100) / 100 : 0;
          const by = c?.paid_by || (c?.belongs_to === 'B' ? state.person : c?.belongs_to) || state.person;
          ui.costPay = null;
          await updateCost(b.dataset.ref, { amount, paid_on: date, paid_by: by, status: 'bezahlt' }).catch(fail);
          if (shortfall > 0.005) toast(`${eurShort(shortfall)} einbehalten – prüfen`);
          return;
        }
        /* ---------- the full Bearbeiten-Modus, ladder movable in both directions ---------- */
        case 'cost-cancel': {
          const c = state.costs.find((x) => x.id === b.dataset.ref);
          if (!c || !costDraftCount(c)) return closeCostEdit();
          ui.confirm = 'cost-cancel:' + b.dataset.ref;
          render();
          return;
        }
        case 'cost-discard':
          closeCostEdit();
          toast('Änderungen verworfen');
          return;
        case 'cost-done': {
          const c = state.costs.find((x) => x.id === b.dataset.ref);
          const patch = c && costPatch(c);
          const householdPick = patch && patch.paid_by === 'H';
          closeCostEdit();
          if (!patch) return;
          try {
            await updateCost(c.id, patch);
            toast('Gespeichert');
          } catch (e) {
            if (householdPick) toast('Haushaltskonto als Zahler braucht Migration 014 – noch nicht eingespielt');
            else fail(e);
          }
          return;
        }
        case 'cost-draft-status':
          setCostDraft(state.costs.find((x) => x.id === b.dataset.ref), 'status', b.dataset.to);
          render();
          return;
        case 'cost-draft-set':
          setCostDraft(state.costs.find((x) => x.id === b.dataset.ref), b.dataset.field, b.dataset.to);
          render();
          return;
        case 'cost-del':
          ui.confirm = 'costdel:' + b.dataset.ref; // the prefix costEditHTML asks for (like subdel:/comdel:)
          render();
          return;
        case 'cost-del-yes':
          ui.confirm = null;
          ui.costEdit = null;
          await deleteCost(b.dataset.ref);
          toast('Kostenzeile gelöscht');
          return;
        // docs/changes/009: briefing -> claude -> ergebnis, nothing in between
        // docs/changes/024: "Claude jetzt starten" commits the open draft (Ziel/Kontext could
        // still be unsaved) in the same request, so Claude never reads a stale briefing.
        case 'claude-start': {
          const patch = taskPatch(t) || {};
          patch.status = 'claude';
          patch.brief = { ...(t.brief || {}), ...(patch.brief || {}), requested_at: new Date().toISOString(), requested_by: state.person };
          closeEdit();
          await updateTask(t.id, patch);
          await addComment(t.id, `${OWN[state.person]} hat Claude gestartet`);
          return;
        }
        case 'accept':
          await updateTask(t.id, { status: 'ergebnis', done: true, ...doneBy(true) });
          return;
        case 'back':
          await updateTask(t.id, { status: 'briefing' });
          return;
        case 'del':
          ui.confirm = 'del:' + t.id;
          render();
          return;
        case 'del-yes':
          ui.expanded = null;
          ui.confirm = null;
          syncHash();
          await deleteTask(t.id);
          toast('Aufgabe gelöscht');
          return;
        case 'confirm-no':
          ui.confirm = null;
          render();
          return;
        case 'add': {
          const box = b.closest('.addbox');
          const title = input('[data-input=new-t]', box).value.trim();
          if (!title) return toast('Bitte einen Titel eingeben');
          const w = parseInt(input('[data-input=new-w]', box).value || '0', 10);
          const dir = parseInt(input('[data-input=new-dir]', box).value, 10);
          const id = await insertTask({
            phase: parseInt(input('[data-input=new-p]', box).value, 10),
            title,
            owner: input('[data-input=new-o]', box).value,
            offset_days: w * 7 * dir,
            critical: input('[data-input=new-c]', box).checked,
            type: input('[data-input=new-type]', box).value,
          });
          const nt = byId(id);
          // keep the new task visible: drop the filter and the phase chip if they would hide it
          if (nt && ui.filter && !FILTERS[ui.filter].test(nt)) ui.filter = null;
          if (nt && ui.phase !== null && nt.phase !== ui.phase) ui.phase = nt.phase;
          if (nt) revealTask(nt);
          setExpanded(id);
          toast('Aufgabe hinzugefügt');
          return;
        }
      }
    } catch (err) {
      fail(err);
    }
  });
}

/* ---------- bootstrap ---------- */
async function enter(session) {
  if (!session) {
    state.person = null;
    show('login');
    return;
  }
  state.email = session.user?.email || null;
  show('loading');
  try {
    state.person = await auth.whoAmI();
    try {
      localStorage.setItem(PERSON_KEY, state.person || '');
    } catch {}
  } catch (e) {
    // offline: fall back to the person code of the last successful login (RLS is unaffected)
    try {
      state.person = localStorage.getItem(PERSON_KEY) || null;
    } catch {}
    if (!state.person) {
      $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
      return;
    }
  }
  if (!state.person) {
    $('#denied-email').textContent = state.email || '';
    show('denied');
    return;
  }
  try {
    await Promise.all([loadAll(), loadChangelog(), loadPersonRow()]);
    ui.offline = false;
  } catch (e) {
    // no connection: the move-in day still works – last loaded state, read only (009)
    const at = await loadSnapshot();
    if (!at) {
      $('#loading').textContent = 'Fehler beim Laden: ' + esc(e.message);
      return;
    }
    ui.offline = true;
    await loadChangelog();
  }
  ui.filter = null;
  ui.changelogOpen = false;
  // never been here: set the baseline now, otherwise everything would be "new" forever (009)
  if (state.lastVisitAt === null) markVisit().catch(() => {});
  const viaLink = openedViaTaskLink();
  if (viaLink) openTaskFromHash();
  if (openedViaFinanzen()) ui.screen = 'finanzen';
  if (openedViaEntscheidungen()) ui.screen = 'entscheidungen';
  if (openedViaAnfragen()) {
    ui.screen = 'anfragen';
    ui.anfrage = hashAnfrageId();
  }
  // docs/changes/021: a phase the other person finished while I was away - the moment is mine
  // too, once, and it waits for the next opening instead of interrupting anything
  if (!viaLink) ui.gate = unseenGate();
  show('app');
  render();
  // 019c: opened straight into the timeline (the view is kept per device) - it starts at today too
  if (!viaLink && ui.view === 'timeline' && ui.screen === 'dashboard') jumpToToday();
  if (viaLink) $('.task.open')?.scrollIntoView({ block: 'start' });
  else if (hasUnread()) openChangelog(true); // once per person: after login and data, never when following a task link
  subscribeRealtime();
}

let started = false;
async function main() {
  loadUI();
  auth.initLoginForm();
  wireEvents();
  $('#denied-logout').addEventListener('click', () => auth.signOut());

  auth.onAuthChange((session) => {
    // defer: supabase calls inside the auth callback itself can deadlock
    if (session && !started) {
      started = true;
      setTimeout(() => enter(session), 0);
    } else if (!session) {
      started = false;
      setTimeout(() => enter(null), 0);
    }
  });
  const session = await auth.getSession();
  if (!session) enter(null);
  else if (!started) {
    started = true;
    enter(session);
  }

  registerServiceWorker();
}

/* ---------- service worker: install, look for new builds, announce them ---------- */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // updateViaCache: 'none' -> sw.js itself is always fetched from the network on update checks
    const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      const isUpdate = !!navigator.serviceWorker.controller; // no controller yet = first install, nothing to announce
      if (!sw || !isUpdate) return;
      // the new build calls skipWaiting + clients.claim, so 'activated' means it now serves this page
      sw.addEventListener('statechange', () => {
        if (sw.state !== 'activated') return;
        ui.updateReady = true; // docs/changes/013 A6: a bar says it, instead of a permanent button
        render();
      });
    });
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    setInterval(check, 30 * 60 * 1000);
  } catch (e) {
    console.warn('SW registration failed', e);
  }
}

main();
