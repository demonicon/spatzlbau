// German UI labels for codes stored in the database.
export const OWN = { S: 'Sebastian', A: 'Anna', B: 'gemeinsam', C: 'Claude' };
export const TYPE = { self: 'nur ihr', assist: 'Claude unterstützt', claude: 'an Claude delegiert' };
export const STEPS = [
  ['briefing', 'Briefing offen'],
  ['go', 'Go erteilt'],
  ['recherche', 'Recherche'],
  ['rueckfragen', 'Rückfragen offen'],
  ['arbeit', 'In Arbeit'],
  ['ergebnis', 'Ergebnis liegt vor'],
];
export const STEP_OWNER = { briefing: 'ihr', go: 'Claude', recherche: 'Claude', rueckfragen: 'ihr', arbeit: 'Claude', ergebnis: 'ihr' };
export const STEP_LABEL = Object.fromEntries(STEPS);
export const ADV = [
  ['why', 'Ziel & warum jetzt'],
  ['how', 'Ablauf'],
  ['need', 'Was ihr braucht'],
  ['law', 'Rechtslage'],
  ['traps', 'Stolperfallen'],
];
