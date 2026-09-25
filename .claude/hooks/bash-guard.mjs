#!/usr/bin/env node
// docs/changes/037 §4: PreToolUse (Bash) - blockiert taskkill /IM, rm -rf, git push --force,
// git reset --hard, supabase db reset, jedes truncate/drop/delete from in SQL-Aufrufen ohne
// "-- dry-run-ok"-Marker, und jedes Schreiben unter design/handoff/ oder design/snapshot/**/*.md.
import { readStdinJson, log } from './log.mjs';

const input = await readStdinJson();
const cmd = input?.tool_input?.command || '';

function deny(reason) {
  log('bash-guard', `BLOCKIERT: ${reason} :: ${cmd}`);
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
  process.exit(0);
}

const RULES = [
  [/taskkill\s+.*\/IM\b/i, 'taskkill /IM toetet prozessweit - nur die eigene PID (rules/tests.md)'],
  [/\brm\s+-rf\b/i, 'rm -rf ist gesperrt - gezielt loeschen'],
  [/git\s+push\s+.*--force/i, 'git push --force ist gesperrt'],
  [/git\s+reset\s+.*--hard/i, 'git reset --hard ist gesperrt'],
  [/supabase\s+db\s+reset/i, 'supabase db reset ist gesperrt'],
];
for (const [re, reason] of RULES) {
  if (re.test(cmd)) {
    deny(reason);
    break;
  }
}

// SQL truncate/drop/delete from ohne "-- dry-run-ok"-Marker
if (/\b(truncate|drop\s+(table|view|column|index)|delete\s+from)\b/i.test(cmd) && !/--\s*dry-run-ok/.test(cmd)) {
  deny('truncate/drop/delete from ohne "-- dry-run-ok"-Marker (rules/db.md: additiv, Dry-Run)');
}

// Schreiben unter design/handoff/ oder design/snapshot/**/*.md
const writeMatch = cmd.match(/(?:>>?|tee|cp\s+\S+\s+|mv\s+\S+\s+)\s*"?([^"\s]+)"?/);
const targets = [...cmd.matchAll(/([\w./-]+\.(?:md|json|png|html|zip))/g)].map((m) => m[1]);
const blockedTarget = targets.find((t) => /(^|\/)design\/handoff\//.test(t) || /(^|\/)design\/snapshot\/.*\.md$/.test(t));
if (blockedTarget || (writeMatch && (/design\/handoff\//.test(writeMatch[1]) || /design\/snapshot\/.*\.md$/.test(writeMatch[1])))) {
  deny(`Schreiben unter design/handoff/ oder design/snapshot/**/*.md ist gesperrt (${blockedTarget || writeMatch[1]})`);
}

log('bash-guard', 'erlaubt :: ' + cmd);
