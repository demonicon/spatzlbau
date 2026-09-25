#!/usr/bin/env node
// Write Claude's results into the database. Usage:
//   node scripts/claude-result.mjs result.json      (or pipe JSON on stdin)
// Input: {"tasks":[{"id":"umzugsfirma","status":"ergebnis","result":"…","comment":"…","sub_add":["…"]}]}
// - status   optional, one of briefing|claude|ergebnis (docs/changes/009)
// - result   optional, stored in brief.result (other brief fields untouched)
// - comment  optional, inserted with author 'C'
// - sub_add  optional, new subtasks appended
// - advice   optional, object with keys why|how|need|law|traps – merged key by key
// - vergleich optional, for an anfrage (033): {offers:[…], recommendation, recommended, reason,
//            sources, request_text} – merged into brief.vergleich; offers a person added or changed
//            (author S|A, source 'manual') and the choice (chosen*) always stay as they are
import { readFileSync } from 'node:fs';
import { loadEnv, restClient } from './lib.mjs';
import { mergeVergleich } from '../app/anfragen.js';

const STATUS = ['briefing', 'claude', 'ergebnis'];
const ADVICE = ['why', 'how', 'need', 'law', 'traps'];

const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
const input = JSON.parse(src);
if (!Array.isArray(input.tasks)) throw new Error('input must be {tasks:[...]}');

const env = loadEnv();
const db = restClient(env);

for (const u of input.tasks) {
  const rows = await db.select('tasks', `select=id,brief,advice,deleted_at&id=eq.${encodeURIComponent(u.id)}`);
  const t = rows[0];
  if (!t || t.deleted_at) {
    console.warn(`! ${u.id}: not found – skipped`);
    continue;
  }
  const patch = {};
  if (u.status) {
    if (!STATUS.includes(u.status)) throw new Error(`${u.id}: invalid status ${u.status}`);
    patch.status = u.status;
  }
  if (typeof u.result === 'string') patch.brief = { ...(t.brief || {}), result: u.result };
  if (u.vergleich && typeof u.vergleich === 'object') {
    const incoming = { ...u.vergleich, updated_at: u.vergleich.updated_at || new Date().toISOString() };
    patch.brief = { ...(patch.brief || t.brief || {}), vergleich: mergeVergleich(t.brief?.vergleich, incoming) };
  }
  if (u.advice && typeof u.advice === 'object') {
    const advice = { ...(t.advice || {}) };
    for (const k of ADVICE) if (typeof u.advice[k] === 'string') advice[k] = u.advice[k];
    patch.advice = advice;
  }
  if (Object.keys(patch).length) await db.update('tasks', `id=eq.${encodeURIComponent(u.id)}`, patch);
  if (u.comment) await db.insert('comments', { task_id: u.id, author: 'C', body: u.comment }, 'return=minimal');
  if (Array.isArray(u.sub_add) && u.sub_add.length) {
    const existing = await db.select('subtasks', `select=sort&task_id=eq.${encodeURIComponent(u.id)}`);
    let sort = existing.length ? Math.max(...existing.map((s) => s.sort)) + 1 : 0;
    await db.insert(
      'subtasks',
      u.sub_add.map((title) => ({ task_id: u.id, title, sort: sort++ })),
      'return=minimal',
    );
  }
  console.log(`✓ ${u.id}: ${Object.keys(patch).join(', ') || '–'}${u.comment ? ' + comment' : ''}${u.sub_add?.length ? ` + ${u.sub_add.length} subtasks` : ''}`);
}
