// Building the calendar file (docs/changes/022). Pure functions, no Deno and no network, so the
// same code runs in the Edge Function and in a plain Node test.
//
// Everything is an all-day event: a deadline is a day, not a point in time. iOS, Google and
// Outlook all read VALUE=DATE with an end date one day later.

/** Fold a line at 75 OCTETS the way RFC 5545 wants it - an umlaut counts twice, and no character
    is ever cut in half. Continuation lines start with one space. */
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) {
      out.push(cur);
      cur = ' ';
      bytes = 1;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n');
}

/** Escape the four characters that mean something inside a property value. */
export const esc = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const pad = (n) => String(n).padStart(2, '0');
export const asDate = (iso) => iso.slice(0, 10).replace(/-/g, '');

/** The day after a date, for DTEND of an all-day event. */
export function nextDay(iso) {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

/** UTC timestamp for DTSTAMP / LAST-MODIFIED. */
export const asStamp = (iso) => new Date(iso || Date.now()).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
/** Same shape, from a Date object directly (docs/changes/022, Ergänzung 24.09. - alarm triggers). */
export const asUtcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

/** `YYYY-MM-DD` shifted by `n` days (negative goes back), in plain calendar arithmetic (no zone). */
export function shiftDate(iso, n) {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// docs/changes/022, Ergänzung 24.09.: an all-day event's alarm fires "relative to the start of
// the day" by spec, and every calendar app reads that differently (some UTC, some the device's
// zone) - so the reminder shows up at a different hour for everyone. Instead we compute the
// absolute UTC instant for "09:00 in Europe/Berlin" ourselves, using Intl (built into V8/Deno,
// no new dependency) to find that day's real UTC offset (CET/CEST) - iOS and Outlook then agree.
const berlinFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Berlin', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function berlinOffsetMinutes(utcGuess) {
  const parts = Object.fromEntries(berlinFmt.formatToParts(utcGuess).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - utcGuess.getTime()) / 60000;
}
/** The UTC instant for `HH:MM` wall-clock time in Berlin on `iso` (YYYY-MM-DD). */
export function berlinWallToUtc(iso, hh, mm) {
  const guess = new Date(`${iso.slice(0, 10)}T${pad(hh)}:${pad(mm)}:00Z`);
  const offsetMin = berlinOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMin * 60000);
}

const OWN = { S: 'Sebastian', A: 'Anna', B: 'gemeinsam' };

/** The day a task is due: its own anchor date plus the offset (bugfix 1.1). */
export function dueOn(task, settings) {
  const base = task.anchor === 'umzugstag' && settings.umzugstag ? settings.umzugstag : settings.einzugstermin;
  if (!base) return null;
  const d = new Date(base + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + (task.offset_days || 0));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// docs/changes/022, Ergänzung 24.09.: three alarms for a critical task (3 days before, 1 day
// before, the day itself, each 09:00 Europe/Berlin), two for a gate (7 days before, the day
// itself). The wording names how soon the deadline is - fixed per slot, since an ICS file has no
// "today" of its own to compute a live relative date from.
function taskAlarms(t, on) {
  const who = OWN[t.owner] || t.owner;
  return [
    { at: berlinWallToUtc(shiftDate(on, -3), 9, 0), desc: `${t.title} · ${who} · in 3 Tagen` },
    { at: berlinWallToUtc(shiftDate(on, -1), 9, 0), desc: `${t.title} · ${who} · morgen` },
    { at: berlinWallToUtc(on, 9, 0), desc: `${t.title} · ${who} · heute` },
  ];
}
function gateAlarms(title, on) {
  return [
    { at: berlinWallToUtc(shiftDate(on, -7), 9, 0), desc: `${title} · in 7 Tagen` },
    { at: berlinWallToUtc(on, 9, 0), desc: `${title} · heute` },
  ];
}

/**
 * The events for one person: every open deadline-critical task that is theirs or shared,
 * plus one gate per phase (the latest deadline in it, marked with a diamond).
 */
export function events({ tasks, settings, phases, person, appUrl }) {
  const open = tasks.filter((t) => !t.done && !t.deleted_at);
  const mine = open.filter((t) => t.critical && (t.owner === person || t.owner === 'B'));
  const out = [];
  for (const t of mine) {
    const on = dueOn(t, settings);
    if (!on) continue;
    out.push({
      uid: `task-${t.id}@spatzlbau`,
      start: on,
      summary: `Spatzlbau: ${t.title}`,
      description: [`Zuständig: ${OWN[t.owner] || t.owner}`, `Phase ${t.phase}`, `${appUrl}#task=${encodeURIComponent(t.id)}`].join('\n'),
      stamp: t.updated_at,
      alarms: taskAlarms(t, on),
    });
  }
  // the gate of a phase is its latest deadline - the day the phase has to be finished
  for (const p of phases) {
    const inPhase = open.filter((t) => t.phase === p.id).map((t) => dueOn(t, settings)).filter(Boolean);
    if (!inPhase.length) continue;
    const last = inPhase.sort()[inPhase.length - 1];
    const gateTitle = `Gate Phase ${p.id} – ${p.short || p.name}`;
    out.push({
      uid: `gate-${p.id}@spatzlbau`,
      start: last,
      summary: `◆ Spatzlbau: ${gateTitle}`,
      description: [p.gate || `Ende von Phase ${p.id}`, appUrl].join('\n'),
      stamp: settings.updated_at,
      alarms: gateAlarms(gateTitle, last),
    });
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.uid.localeCompare(b.uid));
}

/** The whole file. Lines are joined with CRLF, as the format demands. */
export function buildIcs(list, now = new Date().toISOString()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Spatzlbau//Umzug//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Spatzlbau',
    'X-WR-TIMEZONE:Europe/Berlin',
  ];
  for (const e of list) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${asStamp(e.stamp || now)}`,
      `DTSTART;VALUE=DATE:${asDate(e.start)}`,
      `DTEND;VALUE=DATE:${nextDay(e.start)}`,
      fold(`SUMMARY:${esc(e.summary)}`),
      fold(`DESCRIPTION:${esc(e.description)}`),
      'TRANSP:TRANSPARENT',
    );
    // docs/changes/022, Ergänzung 24.09.: absolute triggers (09:00 Europe/Berlin, already
    // converted to UTC in events()) - not TRIGGER:-P3D, which an all-day event's client is free
    // to read against midnight in whichever zone it likes
    for (const a of e.alarms || []) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `TRIGGER;VALUE=DATE-TIME:${asUtcStamp(a.at)}`, fold(`DESCRIPTION:${esc(a.desc)}`), 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/* ---------- the request, without Deno ----------
   Everything the Edge Function decides lives here, so a plain Node test can drive it: the token
   check, the status codes and the headers. `load` is the one thing that talks to the database. */

const timingSafeEqual = (a, b) => {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const plain = (status, body) => ({ status, headers: { 'content-type': 'text/plain; charset=utf-8' }, body });

/**
 * @param {{url: string, method: string, appUrl: string, load: () => Promise<{settings: object, tasks: object[]}>}} req
 * @returns {Promise<{status: number, headers: Record<string,string>, body: string}>}
 */
export async function handleIcs({ url, method, appUrl, load }) {
  if (method !== 'GET' && method !== 'HEAD') return plain(405, 'Method Not Allowed');
  const q = new URL(url).searchParams;
  const token = q.get('token') || '';
  const person = (q.get('person') || '').toUpperCase();
  // one answer for every kind of wrong: a wrong token learns nothing from the reply
  if (!token || (person !== 'S' && person !== 'A')) return plain(401, 'Unauthorized');

  let data;
  try {
    data = await load();
  } catch {
    return plain(503, 'Service Unavailable');
  }
  const settings = data.settings || {};
  const want = typeof settings.ics_token === 'string' ? settings.ics_token : '';
  if (!want || want.length !== token.length || !timingSafeEqual(want, token)) return plain(401, 'Unauthorized');

  const body = buildIcs(
    events({
      tasks: data.tasks || [],
      settings: {
        einzugstermin: typeof settings.einzugstermin === 'string' ? settings.einzugstermin : '',
        umzugstag: typeof settings.umzugstag === 'string' ? settings.umzugstag : '',
      },
      phases: Array.isArray(settings.phases) ? settings.phases : [],
      person,
      appUrl,
    }),
  );
  return {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'inline; filename="spatzlbau.ics"',
      'cache-control': 'public, max-age=3600',
    },
    body,
  };
}
