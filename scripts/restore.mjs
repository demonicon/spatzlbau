#!/usr/bin/env node
// Restore from a backup file (docs/changes/008b). For emergencies, not for everyday use.
//   node scripts/restore.mjs backup-2026-09-22.json --dry    -> compare only, report differences per table
//   node scripts/restore.mjs backup-2026-09-22.json          -> restore table by table after confirmation
// Encrypted files (.json.enc) need BACKUP_KEY (environment or .env).
// Restoring makes each table equal to the dump: rows are upserted, rows missing in the dump are
// deleted (tasks last, so subtasks/comments go with them). allowlist: only last_seen_version per person.
// settings: export_token is neither in the dump nor touched.
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { loadEnv, restClient } from './lib.mjs';
import { decrypt } from './backup-crypto.mjs';
import { TABLES, dump } from './backup.mjs';

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) {
  console.error('usage: node scripts/restore.mjs <backup-file> [--dry]');
  process.exit(2);
}
const env = loadEnv();
const db = restClient(env);

let raw = JSON.parse(readFileSync(file, 'utf8'));
if (raw.format === 'spatzlbau-backup-enc') {
  if (!env.BACKUP_KEY) throw new Error('BACKUP_KEY missing – the file is encrypted');
  raw = JSON.parse(decrypt(raw, env.BACKUP_KEY));
}
if (raw.format !== 'spatzlbau-backup') throw new Error('not a spatzlbau backup');
console.log(`Backup vom ${raw.exported_at}`);

// compare: ignore updated_at (bumped by the trigger on every write, carries no information)
const norm = (row) => JSON.stringify(Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'updated_at').sort()));
const live = await dump(db);
const plan = {};
let total = 0;
for (const [name, t] of Object.entries(TABLES)) {
  const want = new Map((raw.tables[name] || []).map((r) => [String(r[t.key]), r]));
  const have = new Map((live.tables[name] || []).map((r) => [String(r[t.key]), r]));
  const missing = [...want.keys()].filter((k) => !have.has(k));
  const extra = [...have.keys()].filter((k) => !want.has(k));
  const changed = [...want.keys()].filter((k) => have.has(k) && norm(have.get(k)) !== norm(want.get(k)));
  plan[name] = { missing, extra, changed };
  const n = missing.length + extra.length + changed.length;
  total += n;
  console.log(`${name.padEnd(9)} Dump ${String(want.size).padStart(3)} · DB ${String(have.size).padStart(3)} · fehlt in DB ${missing.length} · nur in DB ${extra.length} · geändert ${changed.length}`);
  for (const k of [...missing, ...changed].slice(0, 5)) console.log(`   ~ ${k}`);
  for (const k of extra.slice(0, 5)) console.log(`   - ${k} (würde gelöscht)`);
}
console.log(total ? `${total} Abweichungen` : 'keine Abweichungen');
if (dry || !total) process.exit(0);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('Datenbank auf den Stand des Backups setzen? Zeilen, die nur in der DB sind, werden gelöscht. (ja/nein) ')).trim();
rl.close();
if (answer !== 'ja') {
  console.log('abgebrochen');
  process.exit(1);
}

// 1. upsert in dependency order
for (const [name, t] of Object.entries(TABLES)) {
  const rows = raw.tables[name] || [];
  const todo = rows.filter((r) => plan[name].missing.includes(String(r[t.key])) || plan[name].changed.includes(String(r[t.key])));
  if (!todo.length) continue;
  if (name === 'allowlist') {
    for (const r of todo) await db.update('allowlist', `person=eq.${r.person}`, { last_seen_version: r.last_seen_version });
  } else {
    for (let i = 0; i < todo.length; i += 200) await db.upsertMerge(name, todo.slice(i, i + 200), t.key);
  }
  console.log(`${name}: ${todo.length} Zeilen geschrieben`);
}
// 2. delete extras, children first (tasks cascade to subtasks/comments anyway)
for (const name of ['comments', 'subtasks', 'tasks', 'settings']) {
  const extra = plan[name].extra;
  if (!extra.length) continue;
  for (const k of extra) await db.remove(name, `${TABLES[name].key}=eq.${encodeURIComponent(k)}`);
  console.log(`${name}: ${extra.length} Zeilen gelöscht`);
}
console.log('wiederhergestellt');
