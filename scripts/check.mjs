// docs/changes/036: "npm run check", ohne Abhängigkeiten - läuft vor jedem Commit und ist der
// erste Schritt im Deploy-Workflow (ersetzt den reinen changelog.json-Validate-Schritt aus 035).
// Vier Prüfungen, jeder Fund bricht mit Datei/Zeile ab, am Ende ein Sammel-Exit.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:');
let ok = true;
const fail = (msg) => { console.error('FEHLER: ' + msg); ok = false; };

// 1. Jede *.json im Repo parsen (ausser node_modules, design/) - der Fund aus 035: ein
// unbemerktes ungueltiges changelog.json hat jeden Deploy blockiert, egal welcher Branch pushte.
function listJsonFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'design') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listJsonFiles(full));
    else if (name.endsWith('.json')) out.push(full);
  }
  return out;
}
for (const file of listJsonFiles(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    const m = /position (\d+)/.exec(e.message);
    let where = '';
    if (m) {
      const text = readFileSync(file, 'utf8').slice(0, +m[1]);
      where = ` (Zeile ${text.split('\n').length})`;
    }
    fail(`${rel}${where}: ${e.message}`);
  }
}

// 2. Service-Worker-SHELL-Liste: jede Datei existiert; jede .js/.css unter app/ (bzw. app.css
// selbst) steht in der Liste - die Luecke aus 2.0.1.
const swSrc = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const shellMatch = /const SHELL = \[([\s\S]*?)\];/.exec(swSrc);
if (!shellMatch) {
  fail('sw.js: SHELL-Liste nicht gefunden');
} else {
  const shell = [...shellMatch[1].matchAll(/'\.\/(.*?)'/g)].map((m) => m[1]);
  for (const entry of shell) {
    if (!existsSync(join(ROOT, entry))) fail(`sw.js SHELL: '${entry}' existiert nicht`);
  }
  function listAppFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) out.push(...listAppFiles(full));
      else if (name.endsWith('.js')) out.push(full);
    }
    return out;
  }
  const appFiles = [...listAppFiles(join(ROOT, 'app')), join(ROOT, 'app.css')];
  for (const file of appFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (!shell.includes(rel)) fail(`sw.js SHELL: '${rel}' fehlt (existiert unter app/, ist nicht im Cache-Shell)`);
  }
}

// 3. changelog.json: oberster Eintrag hat version/date/release und mindestens eine Zeile Inhalt;
// Version drei- oder vierteilig im Datumsformat (CLAUDE.md-Regel, wie app/changelog.js's
// isDateVersion) oder dreiteilige Release-Nummer; die Version ist noch nicht vergeben (kein Tag
// v<version> existiert schon - verhindert einen doppelten Tag).
try {
  const cl = JSON.parse(readFileSync(join(ROOT, 'changelog.json'), 'utf8'));
  const top = cl.entries && cl.entries[0];
  if (!top) {
    fail('changelog.json: keine Einträge');
  } else {
    for (const field of ['version', 'date', 'release']) {
      if (!top[field]) fail(`changelog.json: oberster Eintrag ohne '${field}'`);
    }
    const lines = [...(top.new || []), ...(top.improved || []), ...(top.fixed || [])];
    if (!lines.length) fail('changelog.json: oberster Eintrag ohne Zeilen (new/improved/fixed alle leer)');
    const v = String(top.version || '');
    const parts = v.split('.');
    const isDateVersion = (parts.length === 3 || parts.length === 4) && /^20\d{2}$/.test(parts[0]);
    const isReleaseVersion = parts.length === 3 && parts.every((p) => /^\d+$/.test(p));
    if (v && !isDateVersion && !isReleaseVersion) {
      fail(`changelog.json: Version '${v}' ist weder dreiteilige Release-Nummer noch Datumsform`);
    }
    // Der Tag-Vergleich ist ein Vor-dem-Commit-Netz ("habe ich die Version wirklich erhöht,
    // bevor ich einen neuen Eintrag ergänzt habe") - er darf nur greifen, wenn changelog.json
    // gerade tatsächlich angefasst wurde (uncommitted gegenüber HEAD). Sonst ruht der Ruhezustand
    // zwischen zwei Versionssprüngen immer auf der zuletzt getaggten Version, und der Check würde
    // dort ständig Alarm schlagen - genau das hat den Stop-Hook bei diesem Auftrag (037, kein
    // neuer Changelog-Eintrag geplant) sofort rot laufen lassen, obwohl nichts kaputt war. In der
    // CI ist der Checkout ohnehin immer sauber (kein Diff gegen HEAD), die GITHUB_ACTIONS-Prüfung
    // bleibt trotzdem als zweite, robustere Absicherung stehen.
    if (v && !process.env.GITHUB_ACTIONS) {
      try {
        const dirty = execSync('git status --porcelain -- changelog.json', { cwd: ROOT, encoding: 'utf8' }).trim();
        const tags = dirty ? execSync('git tag -l', { cwd: ROOT, encoding: 'utf8' }).split('\n').map((t) => t.trim()) : [];
        if (dirty && tags.includes('v' + v)) fail(`changelog.json: Version '${v}' hat schon den Tag v${v} - Version nicht erhöht?`);
      } catch {
        // kein Git-Repo oder kein Tag-Zugriff - keine Blockade
      }
    }
  }
} catch (e) {
  // schon in Schritt 1 gemeldet, wenn es ein reiner Parse-Fehler ist
  if (!/Unexpected|JSON/.test(e.message)) fail('changelog.json: ' + e.message);
}

if (!ok) {
  console.error('check FAILED');
  process.exit(1);
}
console.log('check ok');
