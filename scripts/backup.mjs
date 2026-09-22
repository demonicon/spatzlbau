#!/usr/bin/env node
// Daily backup (docs/changes/008b): dumps every table into one JSON file.
//   node scripts/backup.mjs [outDir]          -> backup-<JJJJ-MM-TT>.json  (or .json.enc, see below)
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (environment or .env).
// Never contains e-mail addresses (allowlist -> person + last_seen_version only) or the export token.
// If BACKUP_KEY is set the file is encrypted (AES-256-GCM): the workflow artefact of a public
// repository can be downloaded by anyone with a GitHub account, so it must not be readable.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv, restClient } from './lib.mjs';
import { encrypt } from './backup-crypto.mjs';

// tables in dependency order (docs/changes/004 added costs and recurring)
export const TABLES = {
  allowlist: { key: 'person', select: 'person,last_seen_version' },
  settings: { key: 'key', select: 'key,value,updated_at', filter: 'key=neq.export_token' },
  tasks: { key: 'id', select: '*' },
  subtasks: { key: 'id', select: '*' },
  comments: { key: 'id', select: '*' },
  costs: { key: 'id', select: '*' },
  recurring: { key: 'id', select: '*' },
};

export async function dump(db) {
  const tables = {};
  for (const [name, t] of Object.entries(TABLES)) {
    tables[name] = await db.all(name, `select=${t.select}${t.filter ? '&' + t.filter : ''}&order=${t.key}`);
  }
  return { format: 'spatzlbau-backup', version: 1, exported_at: new Date().toISOString(), tables };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const env = loadEnv();
  const out = resolve(process.argv[2] || '.');
  mkdirSync(out, { recursive: true });
  const data = await dump(restClient(env));
  const date = data.exported_at.slice(0, 10);
  const counts = Object.entries(data.tables).map(([k, v]) => `${k} ${v.length}`).join(', ');
  const json = JSON.stringify(data, null, 1);
  if (env.BACKUP_KEY) {
    const file = resolve(out, `backup-${date}.json.enc`);
    writeFileSync(file, JSON.stringify(encrypt(json, env.BACKUP_KEY)));
    console.log(`${file} (verschlüsselt) – ${counts}`);
  } else {
    const file = resolve(out, `backup-${date}.json`);
    writeFileSync(file, json);
    console.log(`${file} – ${counts}`);
  }
}
