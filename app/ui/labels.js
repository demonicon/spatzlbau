// German UI labels for codes stored in the database.
export const OWN = { S: 'Sebastian', A: 'Anna', B: 'gemeinsam', C: 'Claude' };
export const TYPE = { self: 'nur ihr', assist: 'Claude unterstützt', claude: 'an Claude delegiert' };
// docs/changes/009: three states instead of six – questions and answers are normal comments now
export const STEPS = [
  ['briefing', 'Briefing'],
  ['claude', 'bei Claude'],
  ['ergebnis', 'Ergebnis liegt vor'],
];
export const STEP_OWNER = { briefing: 'ihr', claude: 'Claude', ergebnis: 'ihr' };
export const STEP_LABEL = Object.fromEntries(STEPS);
// how the state reads in a task row
export const STEP_TAG = { briefing: 'Claude · Briefing offen', claude: 'bei Claude', ergebnis: 'Ergebnis liegt vor' };
// docs/changes/016b: who paid a cost row - the two people, or the joint account (settles nothing)
export const PAID_BY = { S: OWN.S, A: OWN.A, H: 'Haushaltskonto' };
export const ADV = [
  ['why', 'Ziel & warum jetzt'],
  ['how', 'Ablauf'],
  ['need', 'Was ihr braucht'],
  ['law', 'Rechtslage'],
  ['traps', 'Stolperfallen'],
];
