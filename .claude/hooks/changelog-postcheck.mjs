#!/usr/bin/env node
// docs/changes/037 §4: PostToolUse (Edit auf changelog.json) - node -e "JSON.parse(...)" sofort.
import { readFileSync } from 'node:fs';
import { readStdinJson, log } from './log.mjs';

const input = await readStdinJson();
const filePath = input?.tool_input?.file_path || input?.tool_response?.filePath || '';
if (!/changelog\.json$/.test(filePath)) process.exit(0);

try {
  JSON.parse(readFileSync(filePath, 'utf8'));
  log('changelog-postcheck', 'ok: ' + filePath);
} catch (e) {
  log('changelog-postcheck', 'UNGUELTIG: ' + filePath + ' :: ' + e.message);
  console.log(JSON.stringify({
    decision: 'block',
    reason: `changelog.json ist nach der letzten Änderung kein gültiges JSON mehr: ${e.message}`,
  }));
}
