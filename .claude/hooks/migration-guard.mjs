#!/usr/bin/env node
// docs/changes/037 §4: PreToolUse (Edit/Write) - blockiert supabase/migrations/*.sql, wenn im
// aktuellen Auftrag (docs/changes/<NNN>-*.md, NNN aus dem Branch-Namen) das Wort "Migration"
// nicht vorkommt (und auch nicht im Branch-Namen selbst).
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { readStdinJson, log } from './log.mjs';

const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');
const input = await readStdinJson();
const filePath = input?.tool_input?.file_path || '';

if (!/supabase[\\/]migrations[\\/].*\.sql$/i.test(filePath)) process.exit(0); // betrifft diese Datei nicht

let branch = '';
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {
  /* kein Git - dann kann auch kein Auftrag zugeordnet werden, sicherheitshalber blockieren */
}

const nnn = branch.split('/')[1] || '';
let orderText = '';
try {
  const file = readdirSync(join(ROOT, 'docs', 'changes')).find((f) => f.startsWith(nnn + '-'));
  if (file) orderText = readFileSync(join(ROOT, 'docs', 'changes', file), 'utf8');
} catch {
  /* keine Auftragsdatei gefunden */
}

const mentionsMigration = /migration/i.test(orderText) || /migration/i.test(branch);
if (!mentionsMigration) {
  const reason = `${filePath}: Branch "${branch}" bzw. dessen Auftragsdatei nennt "Migration" nicht - Schema-Änderung ohne Auftragsdeckung?`;
  log('migration-guard', 'BLOCKIERT: ' + reason);
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
  process.exit(0);
}

log('migration-guard', `erlaubt :: ${filePath} (Branch ${branch})`);
