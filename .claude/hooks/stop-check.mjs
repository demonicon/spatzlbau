#!/usr/bin/env node
// docs/changes/037 §4: Stop-Hook - "npm run check"; Exit != 0 blockiert das Ende des Zugs mit der
// Ausgabe als Meldung.
import { execSync } from 'node:child_process';
import { log } from './log.mjs';

try {
  const out = execSync('node scripts/check.mjs', { encoding: 'utf8' });
  log('stop-check', 'ok: ' + out.trim().replace(/\n/g, ' | '));
  console.log(JSON.stringify({ suppressOutput: true }));
} catch (e) {
  const out = (e.stdout || '') + (e.stderr || '');
  log('stop-check', 'BLOCKIERT: ' + out.trim().replace(/\n/g, ' | '));
  console.log(JSON.stringify({ continue: false, stopReason: 'npm run check ist rot:\n' + out.trim() }));
}
