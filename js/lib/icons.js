// Icon markup as strings, so the same icons work in the browser and in the Node prerender.
// Glyphs are drawn on a 24px grid with a 1.8px stroke.

import { appIconSvg } from './appicons.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const STROKE = {
  'chevron-left': '<path d="M15 18l-6-6 6-6"/>',
  'chevron-right': '<path d="M9 18l6-6-6-6"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-up': '<path d="M6 15l6-6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke-width="2.6"/>',
  gallery: '<rect x="3.5" y="4" width="17" height="11" rx="2"/><path d="M5 19.5h3M10.5 19.5h3M16 19.5h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.6-3.9 3.7-6 7.5-6s6.9 2.1 7.5 6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.3c1.4 1.5 3.4 2.2 5.5 2.2s4.1-.7 5.5-2.2v-4.3M21.5 9.5v5"/>',
  bolt: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14"/>',
  trophy: '<path d="M8 20.5h8M12 16.5v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5v1.2A3.3 3.3 0 0 0 7.8 10.5M17 6h2.5v1.2a3.3 3.3 0 0 1-3.3 3.3"/>',
  medal: '<circle cx="12" cy="9" r="5.5"/><path d="M9.3 14l-1.3 7 4-2 4 2-1.3-7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  doc: '<path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16.5h5"/>',
  sparkle: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  'clock-back': '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4h4M12 8v4.2l2.8 1.8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  minus: '<path d="M5.5 12h13"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  expand: '<path d="M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.5 6.5M4 20l6.5-6.5"/>',
  external: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18.5 14v4a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2H10"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M5.5 15.5h-.5A1.5 1.5 0 0 1 3.5 14V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.6 6.6 0 0 0 10.7 10.7z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.7 15.6a5 5 0 0 1 6.6 0"/><path d="M12 19h.01" stroke-width="2.8"/>',
  battery: '<rect x="2.5" y="7.5" width="17" height="9" rx="2.5"/><path d="M22 11v2"/><rect x="4.5" y="9.5" width="13" height="5" rx="1.2" fill="currentColor" stroke="none"/>',
  toggles: '<rect x="3" y="4.5" width="18" height="6.5" rx="3.25"/><circle cx="7.8" cy="7.75" r="1.6"/><rect x="3" y="13" width="18" height="6.5" rx="3.25"/><circle cx="16.2" cy="16.25" r="1.6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l.9 12.2A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.8L18 7M9 7V4.5h6V7"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  send: '<path d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  power: '<path d="M12 3.5v8"/><path d="M6.6 6.8a7.5 7.5 0 1 0 10.8 0"/>',
  refresh: '<path d="M19.5 11A7.5 7.5 0 0 0 6 6.6L4.5 8M4.5 4v4h4M4.5 13A7.5 7.5 0 0 0 18 17.4l1.5-1.4M19.5 20v-4h-4"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" stroke-width="2"/>',
  folder: '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h3.6l2 2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  tag: '<path d="M20.5 12.4l-8.1 8.1L3.5 11.6V3.5h8.1z"/><circle cx="7.8" cy="7.8" r="1.4"/>',
  filter: '<path d="M4 5.5h16l-6.2 7.2v5.6L10.2 20v-7.3z"/>',
  'arrow-up': '<path d="M12 19V5.5M6 11.5l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v13.5M6 12.5l6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h13.5M12.5 6l6 6-6 6"/>',
  bug: '<rect x="8" y="7" width="8" height="13" rx="4"/><path d="M12 11v9M3.5 13.5H8M16 13.5h4.5M5 8.5l3 2M19 8.5l-3 2M5 19l3-2M19 19l-3-2M9.5 7l-1-3M14.5 7l1-3"/>',
  gavel: '<path d="M13.5 3.5l7 7M10 7l7 7M12 5l-5.5 5.5 3.5 3.5L15.5 8.5M8.3 12.2L3 17.5 6.5 21l5.3-5.3M13 21h7.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5S14.5 17.9 12 20.5c-2.5-2.6-3.7-5.4-3.7-8.5S9.5 6.1 12 3.5z"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  sidebar: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M9 4.5v15"/>',
  share: '<path d="M12 3.5v12M7.5 8L12 3.5 16.5 8M5 13.5v5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2v-5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  home: '<path d="M3.5 11.5L12 4l8.5 7.5M6 9.5V20h12V9.5"/>',
  sliders: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  message: '<path d="M4 5.5h16v11H9l-5 4z"/>',
  layout: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M9.5 9v11"/>',
  server: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01" stroke-width="2.4"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3"/>',
  database: '<ellipse cx="12" cy="5.8" rx="7.5" ry="2.8"/><path d="M4.5 5.8v12.4c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.8M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 1 5-3.5l-2.6 2.6.4 2.1 2.1.4L22 5.5a4 4 0 0 1-5.4 5L8 19a2 2 0 0 1-2.9-2.9l8.6-8.6a4 4 0 0 1 .8-1z"/>',
  cloud: '<path d="M7.5 19a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.6 1.6A3.8 3.8 0 0 1 17.5 19z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  'git-branch': '<circle cx="6.5" cy="5.5" r="2"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="7.5" r="2"/><path d="M6.5 7.5v9M17.5 9.5c0 4.5-6 4-11 7"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01"/>',
  'hand': '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13"/><path d="M17 11a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L4 15.6a1.6 1.6 0 0 1 2.4-2.1L8 15"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};

const FILLED = {
  github: '<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>',
  linkedin: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>',
  hackerrank: '<path fill-rule="evenodd" d="M12 .9l9.6 5.5v11.2L12 23.1l-9.6-5.5V6.4zM8.2 7.4v9.2h2.1v-3.7h3.4v3.7h2.1V7.4h-2.1v3.6h-3.4V7.4z"/>',
  logo: '<path d="M16.9 6.1c-1.1-1.3-2.9-2.1-5-2.1-3.3 0-5.6 1.9-5.6 4.5 0 2.3 1.6 3.4 4.6 4.1l1.5.4c2 .5 2.8 1 2.8 2.1 0 1.2-1.3 2-3.1 2-1.9 0-3.4-.8-4.3-2.2L5.5 16.7C6.7 18.8 9 20 12 20c3.6 0 6.1-1.9 6.1-4.8 0-2.4-1.5-3.6-4.8-4.3l-1.5-.3c-1.8-.4-2.6-.9-2.6-1.9 0-1.1 1.1-1.8 2.7-1.8 1.4 0 2.6.6 3.3 1.6z"/>',
};

export function iconSvg(name, { size = 16, cls = '', label = '' } = {}) {
  const filled = Object.prototype.hasOwnProperty.call(FILLED, name);
  const body = filled ? FILLED[name] : (STROKE[name] || STROKE.info);
  const paint = filled
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="icon${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" ${paint} ${a11y}>${body}</svg>`;
}

export const hasIcon = (name) => name in STROKE || name in FILLED;

// macOS-style folder. Gradients live in the page-level <defs> (see index.html) and follow the accent color.
export function folderSvg(glyph, { size = 64, label = '' } = {}) {
  const inner = STROKE[glyph] || STROKE.folder;
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="folder-icon" width="${size}" height="${Math.round(size * 0.8)}" viewBox="0 0 80 64" ${a11y}>`
    + '<path d="M6 12.5A5.5 5.5 0 0 1 11.5 7h16.8a5 5 0 0 1 3.9 1.9l2.4 3a5 5 0 0 0 3.9 1.9H68.5a5.5 5.5 0 0 1 5.5 5.5V52a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="url(#fg-back)"/>'
    + '<path d="M3.5 24A5.5 5.5 0 0 1 9 18.5h62a5.5 5.5 0 0 1 5.5 5.5v29a5.5 5.5 0 0 1-5.5 5.5H9A5.5 5.5 0 0 1 3.5 53z" fill="url(#fg-front)"/>'
    + '<path d="M9 19.2h62" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>'
    + `<g transform="translate(28.6 27.4) scale(.95)" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">`
    + `<g stroke="#fff" stroke-opacity=".45" transform="translate(0 .9)">${inner}</g>`
    + `<g stroke="url(#fg-glyph)">${inner}</g></g></svg>`;
}

export function docSvg({ size = 64, badge = 'PDF' } = {}) {
  return `<svg class="doc-icon" width="${Math.round(size * 0.8)}" height="${size}" viewBox="0 0 52 64" aria-hidden="true" focusable="false">`
    + '<path d="M6 4.5A3.5 3.5 0 0 1 9.5 1H33l13 13v45.5a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 6 59.5z" fill="#fff" stroke="rgba(0,0,0,.18)"/>'
    + '<path d="M33 1v9.5a3.5 3.5 0 0 0 3.5 3.5H46" fill="#eef1f6" stroke="rgba(0,0,0,.18)"/>'
    + '<g fill="#c9d1dd"><rect x="12" y="20" width="22" height="2.4" rx="1.2"/><rect x="12" y="26" width="28" height="2.4" rx="1.2"/><rect x="12" y="32" width="26" height="2.4" rx="1.2"/><rect x="12" y="38" width="28" height="2.4" rx="1.2"/></g>'
    + `<rect x="4" y="44" width="30" height="12" rx="3" fill="#e5484d"/><text x="19" y="52.6" text-anchor="middle" font-family="-apple-system, Inter, Segoe UI, sans-serif" font-size="8" font-weight="700" fill="#fff">${esc(badge)}</text></svg>`;
}

export function textDocSvg({ size = 64 } = {}) {
  return `<svg class="doc-icon" width="${Math.round(size * 0.8)}" height="${size}" viewBox="0 0 52 64" aria-hidden="true" focusable="false">`
    + '<path d="M6 4.5A3.5 3.5 0 0 1 9.5 1H33l13 13v45.5a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 6 59.5z" fill="#fff" stroke="rgba(0,0,0,.18)"/>'
    + '<path d="M33 1v9.5a3.5 3.5 0 0 0 3.5 3.5H46" fill="#eef1f6" stroke="rgba(0,0,0,.18)"/>'
    + '<g fill="#a7b0bd"><rect x="12" y="20" width="26" height="2" rx="1"/><rect x="12" y="25" width="28" height="2" rx="1"/><rect x="12" y="30" width="22" height="2" rx="1"/><rect x="12" y="38" width="28" height="2" rx="1"/><rect x="12" y="43" width="25" height="2" rx="1"/><rect x="12" y="48" width="18" height="2" rx="1"/></g></svg>';
}

// App names. The artwork itself lives in appicons.js.
export const APPS = {
  finder: { label: 'Files' },
  folio: { label: 'Folio' },
  terminal: { label: 'Terminal' },
  timemachine: { label: 'Timeline' },
  achievements: { label: 'Achievements' },
  mail: { label: 'Mail' },
  preview: { label: 'Resume' },
  trash: { label: 'Trash' },
  settings: { label: 'Settings' },
  about: { label: 'About' },
  projects: { label: 'Projects' },
  experience: { label: 'Experience' },
  skills: { label: 'Skills' },
  education: { label: 'Education' },
  fit: { label: 'Fit Check' },
  notes: { label: 'Read Me' },
};

export function appIconHtml(id, { size = 52 } = {}) {
  return `<span class="app-icon app-icon--${id}" style="--size:${size}px" aria-hidden="true">${appIconSvg(id)}</span>`;
}
