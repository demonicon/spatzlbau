#!/usr/bin/env node
// Merge seed.json into the database (never destructive).
//   node scripts/seed.mjs [--dry]                  merge seed.json (tasks, phases, subtasks, costs, recurring)
//   node scripts/seed.mjs --file <paket.json> [--dry]   merge a content package with the same format
//                                                  (partial: any of tasks/phases/costs/recurring; no version bump)
// Rules: app/seed-merge.js. Packages carry cost rows via seed_key (docs/changes/004).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv, restClient, ROOT } from './lib.mjs';
import { planSeedMerge, planPackageMerge } from './seed-merge.js';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const file = fileArg ? resolve(fileArg) : resolve(ROOT, 'seed.json');
const env = loadEnv();
const db = restClient(env);
const seed = JSON.parse(readFileSync(file, 'utf8'));

// ---- tasks / subtasks / phases
const tasks = await db.all('tasks', 'select=id,deleted_at,seed_snapshot,advice,phase,title,owner,offset_days,critical,type,blocked_by,sort');
const subtasks = await db.all('subtasks', 'select=task_id,seed_key');
const plan = planSeedMerge(seed, tasks, subtasks);
console.log(`${fileArg ? 'package ' + fileArg : 'seed v' + seed.version}: ${plan.summary.newTasks} new tasks, ${plan.summary.updatedTasks} tasks updated (${plan.summary.changedFields} fields), ${plan.summary.newSubtasks} subtasks added`);
for (const u of plan.taskUpdates) {
  const fields = Object.keys(u.patch).filter((k) => k !== 'seed_snapshot');
  if (fields.length) console.log(`  ~ ${u.id}: ${fields.join(', ')}`);
}
for (const t of plan.taskInserts) console.log(`  + ${t.id}`);

// ---- costs / recurring (content packages)
const costs = await db.all('costs', 'select=id,seed_key,seed_snapshot,status,paid_on,task_id,label,kind,apartment,amount,due_on,belongs_to,split_s,tax_relevant,note,sort');
const recurring = await db.all('recurring', 'select=id,seed_key,seed_snapshot,label,amount_s,amount_a,amount_n,note,sort');
const pkg = planPackageMerge(seed, costs, recurring);
const ps = pkg.summary;
console.log(`costs: ${ps.newCosts} new, ${ps.updatedCosts} updated, ${ps.lockedCosts} locked (beyond geschaetzt / paid / amount edited) · recurring: ${ps.newRecurring} new, ${ps.updatedRecurring} updated`);
for (const c of pkg.costInserts) console.log(`  + cost ${c.seed_key} (${c.task_id ?? 'Puffer'}, ${c.status ?? 'geschaetzt'}, ${c.amount})`);
for (const u of pkg.costUpdates) console.log(`  ~ cost ${costs.find((c) => c.id === u.id)?.seed_key}: ${Object.keys(u.patch).filter((k) => k !== 'seed_snapshot').join(', ')}`);
for (const r of pkg.recurringInserts) console.log(`  + recurring ${r.seed_key}`);
for (const u of pkg.recurringUpdates) console.log(`  ~ recurring ${recurring.find((r) => r.id === u.id)?.seed_key}: ${Object.keys(u.patch).filter((k) => k !== 'seed_snapshot').join(', ')}`);

if (dry) {
  console.log('dry run – nothing written');
  process.exit(0);
}

if (plan.taskInserts.length) await db.upsertIgnore('tasks', plan.taskInserts, 'id');
for (const u of plan.taskUpdates) await db.update('tasks', `id=eq.${encodeURIComponent(u.id)}`, u.patch);
if (plan.subtaskInserts.length) await db.upsertIgnore('subtasks', plan.subtaskInserts, 'task_id,seed_key');
if (pkg.costInserts.length) await db.upsertIgnore('costs', pkg.costInserts, 'seed_key');
for (const u of pkg.costUpdates) await db.update('costs', `id=eq.${u.id}`, u.patch);
if (pkg.recurringInserts.length) await db.upsertIgnore('recurring', pkg.recurringInserts, 'seed_key');
for (const u of pkg.recurringUpdates) await db.update('recurring', `id=eq.${u.id}`, u.patch);

const settingsRows = [];
if (plan.settings.phases !== undefined) settingsRows.push({ key: 'phases', value: plan.settings.phases });
if (plan.settings.seed_version !== undefined) settingsRows.push({ key: 'seed_version', value: plan.settings.seed_version });
if (settingsRows.length) await db.upsertMerge('settings', settingsRows, 'key');
console.log('done');
