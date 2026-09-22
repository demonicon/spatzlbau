// Inline SVG icons (docs/changes/013 A6). No icon font, no extra request, no external file:
// they are part of the markup and take the colour of the text around them (currentColor).
// 24x24 view box, 1.8 px strokes - that keeps them legible next to 15 px type.
const svg = (body, extra = '') =>
  `<svg class="ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra ? ' ' + extra : ''}>${body}</svg>`;

export const ICON = {
  // house: the task list is home
  home: svg('<path d="M3.2 11.4 12 4.2l8.8 7.2"/><path d="M5.6 10.2V19.8h12.8V10.2"/><path d="M10 19.8v-5h4v5"/>'),
  // a coin with a euro sign: money
  coin: svg('<circle cx="12" cy="12" r="8.2"/><path d="M15.2 9.2a3.9 3.9 0 1 0 0 5.6"/><path d="M8 11.1h4.6M8 12.9h4.6"/>'),
  // the classic i in a circle
  info: svg('<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5"/><path d="M12 7.9h.01"/>'),
  // pencil: the title is text until this is pressed
  pencil: svg('<path d="M4 20h4L18.3 9.7a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.8 7.2l3 3"/>'),
};
