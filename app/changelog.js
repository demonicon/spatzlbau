// Changelog helpers (docs/changes/005, 005b): version comparison and per-person read state.
import { state, ui } from './state.js';

// old versions are date-based 'JJJJ.MM.TT' or 'JJJJ.MM.TT.n'; since 015 (freeze) new versions
// are release numbers 'Haupt.Neben' (z. B. '1.0'). A date-version has four segments and starts
// with a year (20xx); a release number never does – so a release number always counts as newer,
// no matter how the plain numeric segments would otherwise compare (docs/changes/015, Falle).
const isDateVersion = (v) => {
  const p = String(v || '').split('.');
  return p.length === 4 && /^20\d{2}$/.test(p[0]);
};

export function compareVersions(a, b) {
  const aDate = isDateVersion(a);
  const bDate = isDateVersion(b);
  if (aDate !== bDate) return aDate ? -1 : 1;
  const pa = String(a || '').split('.').map(Number);
  const pb = String(b || '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

export const newestVersion = () => ui.changelog?.entries?.[0]?.version || null;

// unread = newer than what this person has closed before; unknown read state (load error) counts as nothing unread
export const hasUnread = () =>
  state.lastSeenVersion !== undefined && !!newestVersion() && compareVersions(newestVersion(), state.lastSeenVersion) > 0;
