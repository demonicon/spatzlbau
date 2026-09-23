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

/** docs/changes/026: the avatar opens its own small menu. `named` (016c, Finanzen head): from
    900 px the design shows the avatar as a pill with the name next to the initial. "Abmelden"
    sits in the menu too, since the Finanzen footer carries the status line instead (016c). */
export function avatarHTML(named) {
  const me = state.person;
  return `<div class="avatar-wrap">
      <button class="avatar ${me}${named ? ' named' : ''}" data-act="avatar-menu-toggle" aria-haspopup="true" aria-expanded="${!!ui.avatarMenu}" title="Angemeldet als ${OWN[me]}" aria-label="Menü, angemeldet als ${OWN[me]}">${
        named ? `<span class="ai" aria-hidden="true">${me}</span><span class="an">${OWN[me]}</span>` : me
      }</button>
      ${
        ui.avatarMenu
          ? `<div class="avatar-menu" role="menu"><button class="avatar-menu-item" role="menuitem" data-act="stam-picker-open">Stammdaten & Rahmendaten</button><button class="avatar-menu-item" role="menuitem" data-act="logout">Abmelden</button></div>`
          : ''
      }
    </div>`;
}

/** Avatar plus the two places the app has. `active`: 'dashboard' | 'finanzen'. */
export function appHeadHTML(active) {
  const me = state.person;
  const nav = (key, act, to, label) => {
    const on = active === key;
    return `<button class="pill navbtn ${on ? 'on' : ''}" data-act="${act}"${to ? ` data-to="${to}"` : ''} aria-label="${label}" title="${label}" aria-current="${on ? 'page' : 'false'}">${ICON[key === 'dashboard' ? 'home' : 'coin']}<span class="nl" aria-hidden="true">${label}</span></button>`;
  };
  return `<div class="apphead">
    ${avatarHTML(false)}
    <nav class="mainnav" aria-label="Bereiche">
      ${nav('dashboard', 'home', '', 'Aufgaben')}
      ${nav('finanzen', 'screen', 'finanzen', 'Finanzen')}
    </nav>
    ${ui.preview ? `<span class="preview-badge" title="Testversion unter /preview/ – gleiche Datenbank wie die echte App, aber dein Lesestand wird hier nicht gespeichert">Vorschau</span>` : ''}
    <span class="spacer"></span>
    <span class="status" id="status" role="status"></span>
  </div>`;
}

/** docs/changes/026: "Später" was chosen - a way back in, not a lock. Mirrors 016b's own hint. */
export function setupHintHTML() {
  if (state.settings.setup_done || !ui.setupSkip) return '';
  const step = Math.min(8, (state.settings.setup_step || 0) + 1);
  return `<p class="fin-setup-hint"><button class="btn-text" data-act="stam-resume">Setup fortsetzen (Schritt ${step} von 8) ›</button></p>`;
}

/** A new build is waiting: a bar that says so, instead of a button that is always there. */
export function updateBarHTML() {
  if (!ui.updateReady) return '';
  return `<div class="updatebar on-ink" role="status">Eine neuere Version ist da.<button class="btn-secondary" data-act="reload">Neu laden</button></div>`;
}

/** The footer of the task list: info icon, version as plain text, then the two actions.
    `status` (016c, Finanzen): version and info left, the status line right - as the design has it. */
export function footHTML({ status = false } = {}) {
  const cur = ui.changelog?.entries?.[0] || null;
  const unseen = hasUnread();
  const info = `<button class="ico info ${unseen ? 'new' : ''}" data-act="changelog" aria-expanded="${!!ui.changelogOpen}" aria-label="Was ist neu?${unseen ? ' – neue Einträge' : ''}" title="Was ist neu?">${ICON.info}${unseen ? '<span class="ndot" aria-hidden="true"></span>' : ''}</button>`;
  // plain text on purpose (013 A6): the version is information, not a button.
  // CLAUDE.md: "Der erste Eintrag ist die Version, die die App im Footer zeigt" - the entry's own
  // version (1.0, then 1.1, 1.2, ...), not its release group (which stays 1.0 across every
  // bugfix until the next milestone and only labels the changelog panel's groups, see below).
  const tip = [cur?.date, build() ? `Build ${build()}` : ''].filter(Boolean).join(' · ');
  // docs/changes/020: /preview/ is where 2.0 is being built - it says so instead of showing the
  // version the live app is on (the changelog entry for 2.0 sits below 1.1 until it goes live)
  const label = ui.preview ? '2.0-preview' : cur ? esc(cur.version) : 'Version unbekannt';
  const version = `<span class="version"${tip ? ` title="${esc(tip)}"` : ''}>${label}</span>`;
  if (status) return `<footer class="foot fin-foot">${version}${info}<span class="spacer"></span><span class="status" id="status" role="status"></span></footer>`;
  return `<footer class="foot">${info}${version}<button class="btn-text" data-act="print" aria-expanded="${!!ui.printOpen}">Umzugstag drucken</button><span class="spacer"></span><button class="btn-text" data-act="logout">Abmelden</button></footer>`;
}
