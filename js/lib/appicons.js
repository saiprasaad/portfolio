// App icons for the Dock, the phone home screen, Spotlight and Notification Center.
// Each icon is a 100x100 SVG: a squircle tile with a gradient, layered artwork with
// soft offset shadows, and a thin glass rim. Gradient ids are unique per instance so
// icons never depend on another (possibly hidden) copy in the page.

// Continuous-corner squircle (closer to the system icon shape than a rounded rect).
export const SQUIRCLE = 'M50 0C96 0 100 4 100 50C100 96 96 100 50 100C4 100 0 96 0 50C0 4 4 0 50 0Z';

let seq = 0;

const f = (n) => Number(n.toFixed(2));

function stops(list) {
  return list.map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}"${opacity === 1 ? '' : ` stop-opacity="${opacity}"`}/>`).join('');
}

function linear(id, list, [x1, y1, x2, y2] = [0, 0, 0, 1]) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
}

function radial(id, list, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;
}

// A shape drawn twice: a soft offset shadow, then the shape itself.
function lifted(shape, { dy = 2.2, opacity = 0.22, color = '#000' } = {}) {
  return `<g transform="translate(0 ${dy})" opacity="${opacity}" fill="${color}" stroke="${color}">${shape.replace(/fill="[^"]*"/g, '').replace(/stroke="[^"]*"/g, '')}</g>${shape}`;
}

// Four-point sparkle with concave sides.
function sparkle(cx, cy, r, pinch = 0.16) {
  const p = r * pinch;
  return `M${cx} ${cy - r}C${f(cx + p)} ${f(cy - p)} ${f(cx + p)} ${f(cy - p)} ${cx + r} ${cy}`
    + `C${f(cx + p)} ${f(cy + p)} ${f(cx + p)} ${f(cy + p)} ${cx} ${cy + r}`
    + `C${f(cx - p)} ${f(cy + p)} ${f(cx - p)} ${f(cy + p)} ${cx - r} ${cy}`
    + `C${f(cx - p)} ${f(cy - p)} ${f(cx - p)} ${f(cy - p)} ${cx} ${cy - r}Z`;
}

function gear(cx, cy, outer, inner, teeth = 8) {
  const step = (Math.PI * 2) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const half = step * 0.22;
    const flank = step * 0.1;
    pts.push([a - half - flank, inner], [a - half, outer], [a + half, outer], [a + half + flank, inner]);
  }
  return `M${pts.map(([ang, r]) => `${f(cx + r * Math.cos(ang))} ${f(cy + r * Math.sin(ang))}`).join('L')}Z`;
}

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [f(cx + r * Math.cos(a)), f(cy + r * Math.sin(a))];
}

function tile(k, { bg, bgDir, body, defs = '', rim = 0.55 }) {
  return `<svg class="app-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>`
    + linear(`${k}b`, bg, bgDir)
    + linear(`${k}r`, [[0, '#fff', rim], [0.35, '#fff', 0.06], [0.8, '#fff', 0.03], [1, '#fff', rim * 0.35]])
    + `<clipPath id="${k}c"><path d="${SQUIRCLE}"/></clipPath>${defs}</defs>`
    + `<path d="${SQUIRCLE}" fill="url(#${k}b)"/>`
    + `<g clip-path="url(#${k}c)">${body}</g>`
    + `<path d="${SQUIRCLE}" fill="none" stroke="url(#${k}r)" stroke-width="1.6" transform="translate(.8 .8) scale(.984)"/>`
    + '</svg>';
}

// Soft light from the top of every tile.
function sheen(k, opacity = 0.22) {
  return `<ellipse cx="50" cy="4" rx="70" ry="34" fill="url(#${k}s)" opacity="${opacity}"/>`;
}
const sheenDef = (k) => radial(`${k}s`, [[0, '#fff', 1], [1, '#fff', 0]], { cx: 0.5, cy: 0.3, r: 0.6 });

// ---------- Icons ----------

function finder(k) {
  const folder = (x, y, c1, c2) => `<path d="M${x} ${y + 2.2}a2 2 0 0 1 2-2h4.2l1.6 1.8h7.2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" fill="${c1}"/><path d="M${x} ${y + 4.4}h17a2 2 0 0 1 2 2v5.6a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="${c2}"/>`;
  return tile(k, {
    bg: [[0, '#8fd8ff'], [0.5, '#3aa2fb'], [1, '#1466e6']],
    defs: sheenDef(k) + `<clipPath id="${k}w"><rect x="16" y="22" width="68" height="56" rx="9"/></clipPath>`,
    body: sheen(k)
      + lifted('<rect x="16" y="22" width="68" height="56" rx="9" fill="#fff"/>', { dy: 3, opacity: 0.2 })
      + `<g clip-path="url(#${k}w)"><rect x="16" y="22" width="68" height="12" fill="#e9f2fd"/><rect x="16" y="34" width="19" height="44" fill="#eef4fc"/>`
      + '<rect x="35" y="34" width=".8" height="44" fill="#d5e3f5"/><rect x="16" y="33.6" width="68" height=".8" fill="#d5e3f5"/></g>'
      + '<circle cx="23" cy="28" r="1.9" fill="#ff5f57"/><circle cx="28.6" cy="28" r="1.9" fill="#febc2e"/><circle cx="34.2" cy="28" r="1.9" fill="#28c840"/>'
      + '<rect x="20" y="40" width="11" height="2.6" rx="1.3" fill="#9cc3ee"/><rect x="20" y="46" width="9" height="2.6" rx="1.3" fill="#c3d8f1"/><rect x="20" y="52" width="10" height="2.6" rx="1.3" fill="#c3d8f1"/><rect x="20" y="58" width="8" height="2.6" rx="1.3" fill="#c3d8f1"/>'
      + folder(41, 39, '#3d8fe8', '#62b0fa') + folder(61, 39, '#3d8fe8', '#62b0fa')
      + folder(41, 57, '#3d8fe8', '#62b0fa') + folder(61, 57, '#3d8fe8', '#62b0fa'),
  });
}

function folio(k) {
  return tile(k, {
    bg: [[0, '#ff9ed8'], [0.42, '#a45cff'], [0.74, '#4f6cff'], [1, '#19b9ff']],
    bgDir: [0, 0, 1, 1],
    defs: radial(`${k}o`, [[0, '#fff', 0.55], [0.55, '#fff', 0.08], [1, '#fff', 0]], { cx: 0.35, cy: 0.3, r: 0.75 }),
    body: '<circle cx="50" cy="52" r="33" fill="url(#' + k + 'o)"/><circle cx="50" cy="52" r="33" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2"/>'
      + lifted(`<path d="${sparkle(50, 52, 23)}" fill="#fff"/>`, { dy: 2.4, opacity: 0.28, color: '#2b1580' })
      + `<path d="${sparkle(73, 26, 8.5)}" fill="#fff" opacity=".95"/>`
      + `<path d="${sparkle(27, 76, 5)}" fill="#fff" opacity=".7"/>`,
  });
}

function terminal(k) {
  return tile(k, {
    bg: [[0, '#5a6069'], [0.5, '#2b2f35'], [1, '#121418']],
    defs: sheenDef(k),
    body: sheen(k, 0.12)
      + '<rect x="12" y="15" width="76" height="70" rx="9" fill="#0b0d10" stroke="#fff" stroke-opacity=".14" stroke-width="1"/>'
      + '<path d="M24 36l10 8.5-10 8.5" fill="none" stroke="#3ee07e" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<rect x="39" y="50" width="16" height="5.4" rx="2.7" fill="#eef1f5"/>'
      + '<rect x="24" y="66" width="30" height="3.4" rx="1.7" fill="#fff" opacity=".16"/><rect x="58" y="66" width="12" height="3.4" rx="1.7" fill="#fff" opacity=".1"/>',
  });
}

function timemachine(k) {
  const [sx, sy] = polar(50, 52, 31, 240);
  const [ex, ey] = polar(50, 52, 31, 300);
  // Arrowhead at the end of the counter-clockwise ring, pointing along the ring.
  const dir = ((300 - 90) * Math.PI) / 180;
  const dx = Math.cos(dir);
  const dy = Math.sin(dir);
  const tip = [f(ex + dx * 5), f(ey + dy * 5)];
  const back = [ex - dx * 3.5, ey - dy * 3.5];
  const n = [-dy, dx];
  const c1 = [f(back[0] + n[0] * 7), f(back[1] + n[1] * 7)];
  const c2 = [f(back[0] - n[0] * 7), f(back[1] - n[1] * 7)];
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const [x1, y1] = polar(50, 52, 17.5, i * 30);
    const [x2, y2] = polar(50, 52, i % 3 === 0 ? 13.5 : 15.5, i * 30);
    return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#7fb8a2" stroke-width="${i % 3 === 0 ? 2.2 : 1.4}" stroke-linecap="round"/>`;
  }).join('');
  return tile(k, {
    bg: [[0, '#5eeab1'], [0.5, '#1db680'], [1, '#07784f']],
    defs: sheenDef(k),
    body: sheen(k)
      + `<g opacity=".22" transform="translate(0 2.4)"><path d="M${sx} ${sy}A31 31 0 1 0 ${ex} ${ey}" fill="none" stroke="#003b26" stroke-width="6.5" stroke-linecap="round"/></g>`
      + `<path d="M${sx} ${sy}A31 31 0 1 0 ${ex} ${ey}" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>`
      + `<path d="M${tip[0]} ${tip[1]}L${c1[0]} ${c1[1]}L${c2[0]} ${c2[1]}Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`
      + lifted('<circle cx="50" cy="52" r="21" fill="#fff"/>', { dy: 2, opacity: 0.2, color: '#003b26' })
      + ticks
      + '<path d="M50 52L50 38.5M50 52L40.5 57.5" stroke="#0d5c40" stroke-width="3.6" stroke-linecap="round"/><circle cx="50" cy="52" r="2.8" fill="#0d5c40"/>',
  });
}

function mail(k) {
  return tile(k, {
    bg: [[0, '#8adcff'], [0.5, '#3a9df8'], [1, '#155fe0']],
    defs: sheenDef(k) + linear(`${k}e`, [[0, '#ffffff'], [1, '#e6eefb']]),
    body: sheen(k)
      + lifted(`<rect x="15" y="29" width="70" height="48" rx="8" fill="url(#${k}e)"/>`, { dy: 3, opacity: 0.2, color: '#0b3f9e' })
      + '<path d="M18 74L42 52M82 74L58 52" fill="none" stroke="#d2e1f7" stroke-width="2.4" stroke-linecap="round"/>'
      + '<path d="M18 33L50 57L82 33" fill="none" stroke="#b9d0f2" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  });
}

function preview(k) {
  const lines = [[47, 38], [53, 36], [59, 38], [65, 30], [71, 34]]
    .map(([y, w]) => `<rect x="33" y="${y}" width="${w}" height="3" rx="1.5" fill="#cbd3de"/>`).join('');
  return tile(k, {
    bg: [[0, '#fbfcfe'], [1, '#d3dbe6']],
    defs: linear(`${k}a`, [[0, '#6cb6ff'], [1, '#2563eb']]),
    body: '<rect x="25" y="19" width="50" height="64" rx="5" fill="#fff" stroke="#000" stroke-opacity=".08" transform="rotate(-8 50 51)"/>'
      + lifted('<rect x="27" y="16" width="50" height="67" rx="5" fill="#fff" stroke="#000" stroke-opacity=".1" stroke-width=".8"/>', { dy: 2.5, opacity: 0.12 })
      + `<circle cx="38.5" cy="29" r="6.2" fill="url(#${k}a)"/>`
      + '<rect x="48" y="24.5" width="22" height="4.4" rx="2.2" fill="#1f2937"/><rect x="48" y="31.4" width="15" height="3" rx="1.5" fill="#9aa4b2"/>'
      + '<rect x="33" y="40" width="38" height="1.6" rx=".8" fill="#2563eb"/>'
      + lines,
    rim: 0.9,
  });
}

function projects(k) {
  return tile(k, {
    bg: [[0, '#a5b0ff'], [0.5, '#6a6ef5'], [1, '#3f36c9']],
    defs: sheenDef(k),
    body: sheen(k)
      + lifted('<path d="M37 32L22 50L37 68M63 32L78 50L63 68" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>', { dy: 2.4, opacity: 0.22, color: '#1d1670' })
      + '<path d="M56 29L44 71" stroke="#dfe3ff" stroke-width="6" stroke-linecap="round"/>',
  });
}

function experience(k) {
  return tile(k, {
    bg: [[0, '#ffc071'], [0.5, '#ff8a3c'], [1, '#e2561b']],
    defs: sheenDef(k),
    body: sheen(k)
      + '<path d="M39 34v-5a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
      + lifted('<rect x="17" y="33" width="66" height="45" rx="9" fill="#fff"/>', { dy: 2.6, opacity: 0.2, color: '#7a2800' })
      + '<rect x="17" y="49" width="66" height="4" fill="#ffd9bd"/><rect x="44" y="45" width="12" height="12" rx="3" fill="#f07a2f"/>',
  });
}

function skills(k) {
  return tile(k, {
    bg: [[0, '#ff8fb4'], [0.5, '#ff4f7d'], [1, '#d91d52']],
    defs: sheenDef(k),
    body: sheen(k)
      + lifted('<path d="M57 13L27 57H47L41 87L73 41H53Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>', { dy: 2.6, opacity: 0.22, color: '#6e0a2a' }),
  });
}

function education(k) {
  return tile(k, {
    bg: [[0, '#77eaa1'], [0.5, '#27c265'], [1, '#128a44']],
    defs: sheenDef(k),
    body: sheen(k)
      + '<path d="M29 49v14c0 7 9.5 12 21 12s21-5 21-12V49" fill="#e8fbef"/>'
      + lifted('<path d="M50 25L88 42L50 59L12 42Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>', { dy: 2.4, opacity: 0.2, color: '#064a22' })
      + '<path d="M79 46v17" stroke="#ffd84d" stroke-width="3" stroke-linecap="round"/><circle cx="79" cy="66" r="3.6" fill="#ffd84d"/>',
  });
}

function achievements(k) {
  return tile(k, {
    bg: [[0, '#ffd45c'], [0.45, '#ff8a45'], [1, '#c63a9a']],
    bgDir: [0.2, 0, 0.8, 1],
    defs: sheenDef(k),
    body: sheen(k)
      + '<path d="M34 28H23c0 12 5 19 14 21M66 28h11c0 12-5 19-14 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>'
      + lifted('<path d="M33 21H67V40C67 53 59.5 61 50 61C40.5 61 33 53 33 40Z" fill="#fff"/><rect x="45.5" y="60" width="9" height="10" fill="#fff"/><rect x="33" y="70" width="34" height="9" rx="3" fill="#fff"/>', { dy: 2.6, opacity: 0.22, color: '#6a1440' })
      + `<path d="${sparkle(50, 38, 9, 0.28)}" fill="#ff9a3c"/>`,
  });
}

// A contact card: portrait on the left, name and details on the right.
function contact(k) {
  return tile(k, {
    bg: [[0, '#5ff0dd'], [0.5, '#16bfb0'], [1, '#08857f']],
    defs: sheenDef(k) + `<clipPath id="${k}a"><circle cx="35" cy="49" r="11.5"/></clipPath>`,
    body: sheen(k)
      + lifted('<rect x="13" y="27" width="74" height="46" rx="8" fill="#fff"/>', { dy: 2.6, opacity: 0.2, color: '#034a46' })
      + '<circle cx="35" cy="49" r="11.5" fill="#d3f5f0"/>'
      + `<g clip-path="url(#${k}a)" fill="#12a89c"><circle cx="35" cy="45.5" r="4.8"/><path d="M24.5 62c0-6.8 4.7-10 10.5-10s10.5 3.2 10.5 10z"/></g>`
      + '<rect x="53" y="40" width="25" height="4.6" rx="2.3" fill="#17544f"/>'
      + '<rect x="53" y="48.5" width="18" height="3.6" rx="1.8" fill="#9fd9d2"/>'
      + '<rect x="53" y="55.5" width="21" height="3.6" rx="1.8" fill="#9fd9d2"/>',
  });
}

function settings(k) {
  return tile(k, {
    bg: [[0, '#d7dbe1'], [0.5, '#9aa1ac'], [1, '#626974']],
    defs: sheenDef(k) + linear(`${k}g`, [[0, '#fbfcfd'], [1, '#d9dde3']]),
    body: sheen(k, 0.3)
      + lifted(`<path d="${gear(50, 50, 36, 28.5, 10)}" fill="url(#${k}g)"/><circle cx="50" cy="50" r="29" fill="url(#${k}g)"/>`, { dy: 2.4, opacity: 0.25, color: '#2d3239' })
      + '<circle cx="50" cy="50" r="20" fill="#8f96a1"/><circle cx="50" cy="50" r="17" fill="#e9ecf0"/><circle cx="50" cy="50" r="8" fill="#8f96a1"/>',
  });
}

function notes(k) {
  return tile(k, {
    bg: [[0, '#ffffff'], [1, '#f1f1ee']],
    body: '<rect x="0" y="0" width="100" height="26" fill="#ffd24a"/><rect x="0" y="26" width="100" height="1.2" fill="#e8b92a"/>'
      + [40, 51, 62, 73].map((y, i) => `<rect x="16" y="${y}" width="${[64, 58, 66, 40][i]}" height="3" rx="1.5" fill="#d8d6cf"/>`).join(''),
    rim: 0.9,
  });
}

// A generic profile picture: a person in a white disc.
function about(k) {
  return tile(k, {
    bg: [[0, '#8fb6ff'], [0.5, '#4f7cf7'], [1, '#2847c9']],
    defs: sheenDef(k)
      + linear(`${k}d`, [[0, '#ffffff'], [1, '#e3eaff']])
      + linear(`${k}p`, [[0, '#7c9cff'], [1, '#2f4fd6']])
      + `<clipPath id="${k}q"><circle cx="50" cy="50" r="29"/></clipPath>`,
    body: sheen(k)
      + lifted(`<circle cx="50" cy="50" r="29" fill="url(#${k}d)"/>`, { dy: 2.6, opacity: 0.22, color: '#10236e' })
      + `<g clip-path="url(#${k}q)" fill="url(#${k}p)"><circle cx="50" cy="42" r="11"/><path d="M24 84C24 66 36 58.5 50 58.5S76 66 76 84Z"/></g>`,
  });
}

// The Trash sits in the Dock without a tile, like the real one.
function trash(k) {
  const ribs = [37, 43.5, 50, 56.5, 63].map((x) => `<path d="M${x} 37L${f(50 + (x - 50) * 0.9)} 83" stroke="#5b6472" stroke-opacity=".28" stroke-width="2.4" stroke-linecap="round"/>`).join('');
  return '<svg class="app-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>'
    + linear(`${k}b`, [[0, '#ffffff', 0.92], [1, '#cfd5dd', 0.88]], [0, 0, 1, 0])
    + linear(`${k}l`, [[0, '#f7f8fa'], [1, '#c3c9d2']])
    + '</defs>'
    + '<ellipse cx="50" cy="91" rx="24" ry="3.5" fill="#000" opacity=".22"/>'
    + `<path d="M26 31H74L69.2 85.5Q68.7 90 64.2 90H35.8Q31.3 90 30.8 85.5Z" fill="url(#${k}b)" stroke="#4b5563" stroke-opacity=".35" stroke-width="1.2"/>`
    + ribs
    + '<path d="M30 34L33.5 86" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M41 19.5V16a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3.5" fill="none" stroke="#9aa2ad" stroke-width="2.6"/>'
    + `<rect x="21" y="19" width="58" height="10" rx="4" fill="url(#${k}l)" stroke="#4b5563" stroke-opacity=".35" stroke-width="1.2"/>`
    + '</svg>';
}

// A Dock stack: a folder with pages peeking out. No tile, like the Trash.
function stack(k) {
  const code = 'M41 51l-8 8.5 8 8.5M59 51l8 8.5-8 8.5';
  return '<svg class="app-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>'
    + linear(`${k}b`, [[0, '#4f9ff3'], [1, '#2466c9']])
    + linear(`${k}f`, [[0, '#a4deff'], [0.55, '#62b4fb'], [1, '#3a8def']])
    + '</defs>'
    + '<ellipse cx="50" cy="89" rx="38" ry="3.5" fill="#000" opacity=".2"/>'
    + `<path d="M7 23a6 6 0 0 1 6-6h20.5a6 6 0 0 1 4.6 2.2l3.4 4.1a6 6 0 0 0 4.6 2.2H87a6 6 0 0 1 6 6V80a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6z" fill="url(#${k}b)"/>`
    + '<rect x="16" y="24" width="46" height="38" rx="3" fill="#fff" opacity=".92" transform="rotate(-7 39 43)"/>'
    + '<rect x="36" y="23" width="48" height="38" rx="3" fill="#eef4fc" transform="rotate(5 60 42)"/>'
    + `<path d="M5 40a6 6 0 0 1 6-6h78a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6z" fill="url(#${k}f)" stroke="#0b3f8a" stroke-opacity=".28" stroke-width="1"/>`
    + '<path d="M11 35.2h78" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>'
    + `<path d="${code}" fill="none" stroke="#1d5fbf" stroke-opacity=".4" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 1.3)"/>`
    + `<path d="${code}" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + '<path d="M53.5 49L46.5 70" stroke="#fff" stroke-width="3.8" stroke-linecap="round" opacity=".92"/>'
    + '</svg>';
}

const ICONS = {
  finder, folio, terminal, timemachine, mail, preview, projects, experience, skills, education, achievements,
  contact, settings, notes, trash, stack, about,
};

export function appIconSvg(id) {
  const draw = ICONS[id] || finder;
  seq += 1;
  return draw(`ai${seq}`);
}

export const hasAppIcon = (id) => id in ICONS;
