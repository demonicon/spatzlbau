// docs/changes/037 §4: jeder Hook schreibt eine Zeile hierher, damit Blockaden nachvollziehbar sind.
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');

export function log(hook, line) {
  try {
    appendFileSync(join(ROOT, '.claude', 'hooks.log'), `${new Date().toISOString()} [${hook}] ${line}\n`);
  } catch {
    // Logging darf nie selbst den Hook zum Absturz bringen
  }
}

export function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (d) => (data += d));
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}
