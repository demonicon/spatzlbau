// The frame both screens share (docs/changes/013 A6): who is logged in, where you are, and the
// footer. One header for the task list and for Finanzen, so the way out is always in the same
// place. Rule for the footer: what looks like a control is one - and the other way round.
import { esc } from './dom.js';
import { OWN } from './labels.js';
import { BUILD } from '../config.js';
import { state, ui, einzug, umzugstag, fmtDay } from '../state.js';
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

// docs/changes/029b #2/#3/#4: one header for both screens - title left with the countdown
// underneath it in running text ("N Tage bis Einzug · Fr 01.01.2027 · Umzug Mo 28.12."), nav
// pills and the avatar (initial only, the name is the title attribute) on the right. Clicking
// the date opens the same inline editor the dashboard has always had (main.js #einzug) - now
// reachable from Finanzen too, since both screens share this one markup.
export function countdownHTML() {
  const base = einzug();
  if (!base) {
    return `Einzugstermin eintragen, dann zählt die App · <button class="cd-date" data-act="date-toggle" aria-expanded="${!!ui.dateEdit}" aria-label="Einzugstermin eintragen">eintragen ›</button>`;
  }
  const dt = new Date(base + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dt - today) / 86400000);
  const move = umzugstag() && umzugstag() !== base ? umzugstag() : '';
  const dateText = fmtDay(base) + (move ? ' · Umzug ' + fmtDay(move) : '');
  const n =
    days > 0
      ? `<span class="cd-n">${days}</span> ${days === 1 ? 'Tag' : 'Tage'} bis Einzug`
      : days === 0
        ? `Heute ist Einzug`
        : `<span class="cd-n">${-days}</span> ${-days === 1 ? 'Tag' : 'Tage'} seit dem Einzug`;
  return `${n} · <button class="cd-date" data-act="date-toggle" aria-expanded="${!!ui.dateEdit}" aria-label="Einzugstermin ändern">${esc(dateText)}</button>`;
}

/* docs/changes/038 Zeile 1: renderHeader() is gone. The head, the nav and the second level
   live in app/shell.js and are rendered once; the nav order and the underline tabs moved there
   with it. What stays here is what every route still asks for as a piece: the avatar with its
   menu, the countdown line, the update bar, the setup hint and the footer. */

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
  // /preview/ shows the newest version with "-preview" behind it - the version live is on or is
  // about to get (020 hard-coded "2.0-preview" while 2.0 was still being built)
  const label = cur ? esc(cur.version) + (ui.preview ? '-preview' : '') : 'Version unbekannt';
  const version = `<span class="version"${tip ? ` title="${esc(tip)}"` : ''}>${label}</span>`;
  if (status) return `<footer class="foot fin-foot">${version}${info}<span class="spacer"></span><span class="status" id="status" role="status"></span></footer>`;
  return `<footer class="foot">${info}${version}<span class="status" id="status" role="status"></span><button class="btn-text" data-act="print" aria-expanded="${!!ui.printOpen}">Umzugstag drucken</button><span class="spacer"></span><button class="btn-text" data-act="logout">Abmelden</button></footer>`;
}
