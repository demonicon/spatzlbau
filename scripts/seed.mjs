#!/usr/bin/env node
// Merge seed.json into the database (never destructive). Usage:  node scripts/seed.mjs [--dry]
// Uses the same planner as the app's "Seed aktualisieren" button (app/seed-merge.js).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv, restClient, ROOT } from './lib.mjs';
import { planSeedMerge } from '../app/seed-merge.js';

const dry = process.argv.includes('--dry');
const env = loadEnv();
const db = restClient(env);
const seed = JSON.parse(readFileSync(resolve(ROOT, 'seed.json'), 'utf8'));

const tasks = await db.select('tasks', 'select=id,deleted_at,seed_snapshot,advice,phase,title,owner,offset_days,critical,type,blocked_by,sort');
const subtasks = await db.select('subtasks', 'select=task_id,seed_key');
const plan = planSeedMerge(seed, tasks, subtasks);

console.log(`seed v${seed.version}: ${plan.summary.newTasks} new tasks, ${plan.summary.updatedTasks} tasks updated (${plan.summary.changedFields} fields), ${plan.summary.newSubtasks} subtasks added`);
for (const u of plan.taskUpdates) {
  const fields = Object.keys(u.patch).filter((k) => k !== 'seed_snapshot');
  if (fields.length) console.log(`  ~ ${u.id}: ${fields.join(', ')}`);
}
for (const t of plan.taskInserts) console.log(`  + ${t.id}`);
if (dry) {
  console.log('dry run – nothing written');
  process.exit(0);
}

if (plan.taskInserts.length) await db.upsertIgnore('tasks', plan.taskInserts, 'id');
for (const u of plan.taskUpdates) await db.update('tasks', `id=eq.${encodeURIComponent(u.id)}`, u.patch);
if (plan.subtaskInserts.length) await db.upsertIgnore('subtasks', plan.subtaskInserts, 'task_id,seed_key');
await db.upsertMerge(
  'settings',
  [
    { key: 'phases', value: plan.settings.phases },
    { key: 'seed_version', value: plan.settings.seed_version },
  ],
  'key',
);
console.log('done');
