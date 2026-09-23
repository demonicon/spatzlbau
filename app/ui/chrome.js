// The frame both screens share (docs/changes/013 A6): who is logged in, where you are, and the
// footer. One header for the task list and for Finanzen, so the way out is always in the same
// place. Rule for the footer: what looks like a control is one - and the other way round.
import { esc } from './dom.js';
import { OWN } from './labels.js';
import { BUILD } from '../config.js';
import { state, ui } from '../state.js';
import { ICON } from './icons.js';
import { hasUnread } from '../changelog.js';

const build = () => (BUILD.startsWith('__') ? '' : BUILD);

/** Avatar plus the two places the app has. `active`: 'dashboard' | 'finanzen'. */
export function appHeadHTML(active) {
  const me = state.person;
  const nav = (key, act, to, label) => {
    const on = active === key;
    return `<button class="navbtn ${on ? 'on' : ''}" data-act="${act}"${to ? ` data-to="${to}"` : ''} aria-label="${label}" title="${label}" aria-current="${on ? 'page' : 'false'}">${ICON[key === 'dashboard' ? 'home' : 'coin']}<span class="nl" aria-hidden="true">${label}</span></button>`;
  };
  return `<div class="apphead">
    <span class="avatar ${me}" title="Angemeldet als ${OWN[me]}" aria-label="Angemeldet als ${OWN[me]}">${me}</span>
    <nav class="mainnav" aria-label="Bereiche">
      ${nav('dashboard', 'home', '', 'Aufgaben')}
      ${nav('finanzen', 'screen', 'finanzen', 'Finanzen')}
    </nav>
    ${ui.preview ? `<span class="preview-badge" title="Testversion unter /preview/ – gleiche Datenbank wie die echte App, aber dein Lesestand wird hier nicht gespeichert">Vorschau</span>` : ''}
    <span class="spacer"></span>
    <span class="status" id="status" role="status"></span>
  </div>`;
}

/** A new build is waiting: a bar that says so, instead of a button that is always there. */
export function updateBarHTML() {
  if (!ui.updateReady) return '';
  return `<div class="updatebar" role="status">Eine neuere Version ist da.<button class="btn small primary" data-act="reload">Neu laden</button></div>`;
}

/** The footer of the task list: info icon, version as plain text, then the two actions. */
export function footHTML() {
  const cur = ui.changelog?.entries?.[0] || null;
  const unseen = hasUnread();
  const info = `<button class="ico info ${unseen ? 'new' : ''}" data-act="changelog" aria-expanded="${!!ui.changelogOpen}" aria-label="Was ist neu?${unseen ? ' – neue Einträge' : ''}" title="Was ist neu?">${ICON.info}${unseen ? '<span class="ndot" aria-hidden="true"></span>' : ''}</button>`;
  // plain text on purpose (013 A6): the version is information, not a button.
  // CLAUDE.md: "Der erste Eintrag ist die Version, die die App im Footer zeigt" - the entry's own
  // version (1.0, then 1.1, 1.2, ...), not its release group (which stays 1.0 across every
  // bugfix until the next milestone and only labels the changelog panel's groups, see below).
  const tip = [cur?.date, build() ? `Build ${build()}` : ''].filter(Boolean).join(' · ');
  const version = `<span class="version"${tip ? ` title="${esc(tip)}"` : ''}>${cur ? esc(cur.version) : 'Version unbekannt'}</span>`;
  return `<footer class="foot">${info}${version}<button class="link" data-act="print" aria-expanded="${!!ui.printOpen}">Umzugstag drucken</button><span class="spacer"></span><button class="link" data-act="logout">Abmelden</button></footer>`;
}
