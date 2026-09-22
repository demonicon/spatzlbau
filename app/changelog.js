// Changelog helpers (docs/changes/005, 005b): version comparison and per-person read state.
import { state, ui } from './state.js';

// versions are 'JJJJ.MM.TT' or 'JJJJ.MM.TT.n' – compare part by part
export function compareVersions(a, b) {
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
