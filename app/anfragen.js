// Anfragen (docs/changes/033): pure logic - no DOM, no state.js, no Supabase import. The page
// (views/anfragen.js), the click handlers (main.js) and scripts/claude-result.mjs share it, and
// plain node can test it.

// The four ordered categories plus a free one. `task` is the task a new anfrage is linked to;
// `recurring` is the seed_key of the "Laufend" row a monthly price goes to. Only internet has one
// until contracts (031) exist - energie/versicherung get no money step (Entscheidung A, 033).
export const CATEGORIES = {
  umzug: { label: 'Umzugsfirma', task: 'umzugsfirma' },
  internet: { label: 'Internet', task: 'internet', recurring: 'internet' },
  energie: { label: 'Strom und Gas', task: 'energie' },
  versicherung: { label: 'Versicherung', task: 'versicherung' },
  sonstiges: { label: 'Sonstiges', task: null },
};
export const categoryOf = (a) => CATEGORIES[a?.brief?.anfrage?.category] ? a.brief.anfrage.category : 'sonstiges';

// The frame form ("Rahmen") per category, declarative - one entry is one field.
// type: text | number | date | bool | select | textarea
export const FIELDS = {
  umzug: [
    { key: 'volumen', label: 'Volumen in m³', type: 'number' },
    { key: 'von', label: 'Von (Adressen, Etage, Aufzug)', type: 'textarea' },
    { key: 'nach', label: 'Nach (Adresse, Etage, Aufzug)', type: 'textarea' },
    { key: 'termin', label: 'Umzugstag', type: 'date' },
    { key: 'kueche', label: 'Küchenmontage', type: 'bool' },
    { key: 'halteverbot', label: 'Halteverbot durch die Firma', type: 'bool' },
    { key: 'budget', label: 'Budget in €', type: 'number' },
  ],
  internet: [
    { key: 'adresse', label: 'Adresse neu', type: 'text' },
    { key: 'bandbreite', label: 'Bandbreite ab (Mbit/s)', type: 'number' },
    { key: 'laufzeit', label: 'Laufzeit höchstens (Monate)', type: 'number' },
    { key: 'budget', label: 'Budget pro Monat in €', type: 'number' },
    { key: 'anschluss', label: 'Anschluss ab', type: 'date' },
  ],
  energie: [
    { key: 'art', label: 'Was', type: 'select', options: ['Strom', 'Gas', 'Strom und Gas'] },
    { key: 'plz', label: 'PLZ neu', type: 'text' },
    { key: 'verbrauch', label: 'Verbrauch in kWh/Jahr (Schätzung)', type: 'number' },
    { key: 'oeko', label: 'Ökostrom', type: 'bool' },
    { key: 'beginn', label: 'Beginn', type: 'date' },
  ],
  versicherung: [
    { key: 'art', label: 'Was', type: 'select', options: ['Hausrat', 'Haftpflicht', 'Hausrat und Haftpflicht'] },
    { key: 'flaeche', label: 'Wohnfläche in m²', type: 'number' },
    { key: 'summe', label: 'Versicherungssumme in €', type: 'number' },
    { key: 'sb', label: 'Selbstbeteiligung in €', type: 'number' },
  ],
  sonstiges: [{ key: 'text', label: 'Worum geht es?', type: 'textarea' }],
};

// What the master data can fill in. Wohnfläche, Personen and PLZ do not exist there (033
// Abweichung) and stay empty.
function flat(w) {
  if (!w || !w.strasse) return '';
  const floor = w.etage ? `, ${w.etage}` : '';
  const lift = w.aufzug === true ? ', mit Aufzug' : w.aufzug === false ? ', ohne Aufzug' : '';
  return `${w.strasse}${floor}${lift}`;
}
export function prefill(category, { stammdaten, umzugstag, einzug } = {}) {
  const w = stammdaten?.wohnungen || {};
  const neu = w.n?.strasse || '';
  switch (category) {
    case 'umzug':
      return { von: [flat(w.s), flat(w.a)].filter(Boolean).join('\n'), nach: flat(w.n), termin: umzugstag || einzug || '' };
    case 'internet':
      return { adresse: neu, anschluss: einzug || '' };
    case 'energie':
      return { beginn: einzug || '' };
    default:
      return {};
  }
}

// The four rungs of an anfrage: draft -> sent -> result -> decided
export const STEPS = [
  ['briefing', 'Entwurf'],
  ['claude', 'gesendet'],
  ['ergebnis', 'Ergebnis'],
  ['entschieden', 'entschieden'],
];
export const stepIndex = (a) => Math.max(0, STEPS.findIndex(([k]) => k === a?.status));

/* ---------- offers ---------- */

export const PRICE_KIND = { fest: 'Festpreis', ab: 'Richtwert ab', monat: 'pro Monat' };
export const offersOf = (a) => (Array.isArray(a?.brief?.vergleich?.offers) ? a.brief.vergleich.offers : []);
export const isHumanOffer = (o) => o?.author === 'S' || o?.author === 'A' || o?.source === 'manual';

const n2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const price = (v) => Number(v);
const hasPrice = (o) => o && o.price !== null && o.price !== undefined && o.price !== '' && Number.isFinite(price(o.price));
/** "1.740 €", "ab 1.390 €", "29,99 €/Monat" - whole euros without cents, as the order writes them */
export function fmtPrice(o) {
  if (!hasPrice(o)) return '–';
  const v = price(o.price);
  const s = `${Number.isInteger(v) ? n0.format(v) : n2.format(v)} €`;
  return o.price_kind === 'ab' ? `ab ${s}` : o.price_kind === 'monat' ? `${s}/Monat` : s;
}
/** At most `max` offers are shown - the chosen one and those a person added always among them,
    Claude's fill the remaining places in their order. */
export function shownOffers(a, max = 5) {
  const all = offersOf(a);
  const chosen = a?.brief?.vergleich?.chosen;
  const must = (o) => o.id === chosen || isHumanOffer(o);
  let room = Math.max(0, max - all.filter(must).length);
  return all.filter((o) => must(o) || room-- > 0);
}
/** the cheapest offer is marked bold, never coloured (design rule) */
export function cheapestId(offers) {
  const priced = offers.filter(hasPrice);
  if (priced.length < 2) return null;
  return priced.reduce((min, o) => (price(o.price) < price(min.price) ? o : min)).id;
}
export const isExpired = (o, today) => !!o?.valid_until && o.valid_until < today;

/* ---------- Wählen (033): the writes are computed here and only executed by main.js ---------- */

/**
 * @returns {{ patch, comment, money }} - patch: the anfrage row; comment: the decision on the
 * linked task ({ taskId, body } or null); money: what may happen to the price ({ kind: 'none'|
 * 'cost-update'|'cost-new'|'recurring', question, ... }), asked inline before anything is written.
 */
export function choosePlan({ anfrage, offer, person, now, costs = [], recurring = [] }) {
  const cat = categoryOf(anfrage);
  const taskId = anfrage.brief?.anfrage?.task_id || null;
  const v = anfrage.brief?.vergleich || {};
  const patch = {
    status: 'entschieden',
    brief: { ...anfrage.brief, vergleich: { ...v, chosen: offer.id, chosen_by: person, chosen_at: now } },
  };
  const detail = [offer.service, offer.term].filter(Boolean).join(' · ');
  const comment = taskId
    ? { taskId, body: `Entschieden: ${offer.name} – ${fmtPrice(offer)}${offer.price_kind === 'fest' ? ' Festpreis' : ''}${detail ? ` (${detail})` : ''}` }
    : null;
  return { patch, comment, money: moneyPlan({ cat, taskId, offer, costs, recurring }) };
}

function moneyPlan({ cat, taskId, offer, costs, recurring }) {
  if (!hasPrice(offer)) return { kind: 'none' };
  const amount = price(offer.price);
  if (offer.price_kind === 'monat') {
    const key = CATEGORIES[cat].recurring;
    const row = key ? recurring.find((r) => r.seed_key === key) : null;
    if (!row) return { kind: 'none', note: 'Laufende Kosten dafür kommen mit den Verträgen.' };
    return { kind: 'recurring', id: row.id, patch: { amount_n: amount }, question: `${fmtPrice(offer)} als neuen Wert in „Laufend“ übernehmen?` };
  }
  if (!taskId) return { kind: 'none' };
  // "fest" is the UI word, the database value is faellig (costs.js); a price "ab" stays an estimate
  const status = offer.price_kind === 'ab' ? 'geschaetzt' : 'faellig';
  const word = status === 'faellig' ? 'fest' : 'Schätzung';
  const open = costs.filter((c) => c.task_id === taskId && (c.kind || 'einmalig') === 'einmalig' && c.status !== 'bezahlt');
  const target = open.find((c) => (c.seed_key || '').endsWith('-schaetzung')) || (open.length === 1 ? open[0] : null);
  if (target) {
    return { kind: 'cost-update', id: target.id, patch: { amount, status, note: offer.name }, question: `${fmtPrice(offer)} als ${word} übernehmen? (${offer.name})` };
  }
  return {
    kind: 'cost-new',
    taskId,
    fields: { label: `${CATEGORIES[cat].label}: ${offer.name}`, amount, status, note: offer.name },
    question: `Noch kein Posten – ${fmtPrice(offer)} als neuen Posten anlegen? (${offer.name})`,
  };
}

/** "Wahl aufheben": the choice goes, comment, posten and Laufend value stay (033) */
export function unchoosePatch(anfrage) {
  const v = anfrage.brief?.vergleich || {};
  return { status: 'ergebnis', brief: { ...anfrage.brief, vergleich: { ...v, chosen: null, chosen_by: null, chosen_at: null } } };
}

/* ---------- Claude's run (scripts/claude-result.mjs) ---------- */

/**
 * Claude writes brief.vergleich - everything except the choice, and never an offer a person
 * added or changed (author S|A or source 'manual'). Those and chosen* come from the server copy.
 */
export function mergeVergleich(server = {}, incoming = {}) {
  const before = server.offers || [];
  const choice = { chosen: server.chosen ?? null, chosen_by: server.chosen_by ?? null, chosen_at: server.chosen_at ?? null };
  // a run that only answers a follow-up (reason, recommendation) keeps every offer as it was
  if (!Array.isArray(incoming.offers)) return { ...server, ...incoming, offers: before, ...choice };
  const human = before.filter(isHumanOffer);
  const taken = new Set(human.map((o) => o.id));
  const claude = incoming.offers.filter((o) => !taken.has(o.id) && !isHumanOffer(o)).map((o) => ({ ...o, author: 'C' }));
  // the offer that was chosen never disappears, even if Claude's new list leaves it out
  const kept = new Set([...claude, ...human].map((o) => o.id));
  const chosen = choice.chosen && !kept.has(choice.chosen) ? before.filter((o) => o.id === choice.chosen) : [];
  return { ...server, ...incoming, offers: [...claude, ...chosen, ...human], ...choice };
}
