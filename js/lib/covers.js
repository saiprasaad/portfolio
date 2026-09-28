// Illustrated covers for projects that have no screenshots. Each is a 320x200 SVG drawn
// over a CSS gradient (project.cover.from/to), so they work in Finder, Quick Look,
// the phone layout and the prerendered simple page. They are illustrations, not screenshots.

const MONO = 'ui-monospace, SF Mono, JetBrains Mono, Menlo, Consolas, monospace';
const SANS = '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, sans-serif';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function chart() {
  const dots = [[34, 164], [46, 158], [58, 166], [70, 156], [82, 150], [94, 157], [106, 145], [118, 149], [130, 138], [142, 142], [154, 128], [166, 131], [178, 118], [186, 122]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#fff" fill-opacity=".9"/>`).join('');
  return `<g stroke="#fff" stroke-opacity=".12">${[60, 92, 124, 156].map((y) => `<path d="M24 ${y}H296"/>`).join('')}</g>
  <path d="M190 116 C 215 104, 240 88, 296 60 L296 104 C 250 118, 222 128, 190 134 Z" fill="#fff" fill-opacity=".16"/>
  <path d="M24 166 C 60 160, 90 158, 120 146 S 170 130, 190 124" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
  <path d="M190 124 C 222 112, 250 96, 296 80" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round"/>
  ${dots}
  <path d="M190 40V176" stroke="#fff" stroke-opacity=".35" stroke-dasharray="2 4"/>
  <text x="24" y="36" font-family="${SANS}" font-size="10" font-weight="700" letter-spacing="1.4" fill="#fff" fill-opacity=".8">FORECAST · NEXT 12 MONTHS</text>
  <g font-family="${SANS}" font-size="9" font-weight="600" fill="#fff">
    <rect x="24" y="178" width="42" height="14" rx="7" fill="#fff" fill-opacity=".18"/><text x="45" y="188" text-anchor="middle">LSTM</text>
    <rect x="72" y="178" width="50" height="14" rx="7" fill="#fff" fill-opacity=".18"/><text x="97" y="188" text-anchor="middle">Prophet</text>
    <rect x="128" y="178" width="56" height="14" rx="7" fill="#fff" fill-opacity=".18"/><text x="156" y="188" text-anchor="middle">SARIMAX</text>
  </g>`;
}

function logs() {
  const rows = [
    ['12:04:01', 'INFO ', 'api     GET /quotes 200 41ms', '#9fb3c8'],
    ['12:04:02', 'INFO ', 'worker  batch 1182 done', '#9fb3c8'],
    ['12:04:02', 'WARN ', 'db      slow query 2.1s', '#f5c26b'],
    ['12:04:03', 'ERROR', 'auth    token refresh timeout', '#ff8a80'],
    ['12:04:03', 'ERROR', 'auth    token refresh timeout', '#ff8a80'],
    ['12:04:04', 'INFO ', 'api     GET /policy 200 38ms', '#9fb3c8'],
  ];
  const text = rows.map(([t, lvl, msg, c], i) => `<text x="20" y="${38 + i * 17}" font-family="${MONO}" font-size="9.5" fill="${c}"><tspan fill="#5d6d80">${t}</tspan>  ${esc(lvl)} ${esc(msg)}</text>`).join('');
  return `<rect x="12" y="75" width="296" height="38" rx="4" fill="#ff5f57" fill-opacity=".12"/>${text}
  <g transform="translate(150 132)">
    <rect width="156" height="56" rx="12" fill="#fff" fill-opacity=".96"/>
    <path d="M18 16l1.4 3.8 3.8 1.4-3.8 1.4L18 26.4l-1.4-3.8-3.8-1.4 3.8-1.4z" fill="#7c5cff"/>
    <text x="30" y="24" font-family="${SANS}" font-size="10" font-weight="700" fill="#1d1d1f">Summary</text>
    <text x="12" y="39" font-family="${SANS}" font-size="9" fill="#45454a">Auth timeouts spiking since 12:03</text>
    <text x="12" y="50" font-family="${SANS}" font-size="9" fill="#6e6e75">Posted to Teams</text>
  </g>`;
}

function cipher() {
  const hex = ['3f 9a c1 07 e4 5b 2d 88', 'a0 1e 7c f3 69 04 bd 52', '5e d8 93 2a 0f c6 71 e9', 'b4 37 06 fa 8d 21 cc 4e'];
  const rows = hex.map((r, i) => `<text x="160" y="${50 + i * 36}" text-anchor="middle" font-family="${MONO}" font-size="15" letter-spacing="2" fill="#fff" fill-opacity="${0.16 + i * 0.06}">${r}</text>`).join('');
  return `${rows}
  <circle cx="160" cy="100" r="34" fill="#fff"/>
  <g transform="translate(145 83)" fill="none" stroke="#0d5c56" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="14" width="24" height="18" rx="4"/><path d="M8 14V9a7 7 0 0 1 14 0v5"/><path d="M15 21v4"/>
  </g>
  <rect x="118" y="150" width="84" height="20" rx="10" fill="#000" fill-opacity=".25"/>
  <text x="160" y="164" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="700" letter-spacing="1.2" fill="#fff">AES-CBC</text>`;
}

function graph() {
  const node = (x, y, w, label, strong = false) => `<g transform="translate(${x} ${y})"><rect width="${w}" height="24" rx="7" fill="#fff" fill-opacity="${strong ? 1 : 0.92}"/><text x="${w / 2}" y="16" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="600" fill="#3b36a8">${esc(label)}</text></g>`;
  const edge = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} C ${x1 + 26} ${y1}, ${x2 - 26} ${y2}, ${x2} ${y2}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`;
  return `${edge(74, 100, 118, 62)}${edge(74, 100, 118, 138)}${edge(172, 62, 214, 36)}${edge(172, 62, 214, 80)}${edge(186, 138, 214, 122)}${edge(186, 138, 214, 158)}
  ${node(22, 88, 52, '{ }', true)}${node(118, 50, 54, 'user')}${node(118, 126, 68, 'orders[2]')}
  ${node(214, 24, 84, 'name: "Sai"')}${node(214, 68, 84, 'role: "dev"')}${node(214, 110, 60, '0: {…}')}${node(214, 146, 60, '1: {…}')}`;
}

function tasks() {
  const row = (y, done, w) => `<g transform="translate(58 ${y})"><circle cx="9" cy="9" r="8.5" fill="${done ? '#f0607e' : 'none'}" stroke="${done ? '#f0607e' : '#c6c6cc'}" stroke-width="1.6"/>${done ? '<path d="M5 9.2l2.7 2.7L13 6.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' : ''}<rect x="26" y="5" width="${w}" height="8" rx="4" fill="${done ? '#d5d5da' : '#8e8e96'}"/></g>`;
  return `<rect x="40" y="30" width="240" height="140" rx="14" fill="#fff" fill-opacity=".97"/>
  <text x="58" y="56" font-family="${SANS}" font-size="12" font-weight="700" fill="#1d1d1f">Today</text>
  <text x="262" y="56" text-anchor="end" font-family="${SANS}" font-size="9" fill="#8e8e96">auto-created 9:00</text>
  ${row(70, true, 150)}${row(98, true, 118)}${row(126, false, 136)}
  <g transform="translate(252 142)"><circle r="20" fill="#9f1239"/><path d="M-8 -2a8 8 0 0 1 14-4M8 2a8 8 0 0 1-14 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M6 -10v5h-5M-6 10v-5h5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function video() {
  return `<rect x="30" y="24" width="260" height="146" rx="12" fill="#000" fill-opacity=".45"/>
  <rect x="42" y="36" width="58" height="18" rx="9" fill="#fff" fill-opacity=".92"/>
  <text x="71" y="48.5" text-anchor="middle" font-family="${SANS}" font-size="9.5" font-weight="700" fill="#8f1d1d">EN → ES</text>
  <circle cx="160" cy="88" r="24" fill="#fff" fill-opacity=".95"/><path d="M153 76v24l20-12z" fill="#d63b1f"/>
  <rect x="62" y="128" width="196" height="24" rx="6" fill="#000" fill-opacity=".7"/>
  <text x="160" y="144" text-anchor="middle" font-family="${SANS}" font-size="11" fill="#fff">Hola a todos, bienvenidos al canal</text>
  <rect x="42" y="160" width="236" height="3" rx="1.5" fill="#fff" fill-opacity=".3"/><rect x="42" y="160" width="92" height="3" rx="1.5" fill="#fff"/>`;
}

// Three guesses at VOILA, scored the way the game scores them.
function voila() {
  const G = '#538d4e', Y = '#b59f3b', X = '#3a3a3c';
  const rows = [
    [['C', X], ['R', X], ['A', Y], ['N', X], ['E', X]],
    [['S', X], ['O', G], ['L', Y], ['I', Y], ['D', X]],
    [['V', G], ['O', G], ['I', G], ['L', G], ['A', G]],
  ];
  const size = 22, gap = 4, x0 = 97, y0 = 24;
  let out = '';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 5; c++) {
      const x = x0 + c * (size + gap), y = y0 + r * (size + gap);
      const cell = rows[r]?.[c];
      out += cell
        ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${cell[1]}"/><text x="${x + size / 2}" y="${y + 15.5}" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="800" fill="#fff">${cell[0]}</text>`
        : `<rect x="${x + 0.75}" y="${y + 0.75}" width="${size - 1.5}" height="${size - 1.5}" rx="3" fill="none" stroke="#565758" stroke-width="1.5"/>`;
    }
  }
  return out;
}

function battleship() {
  const cell = 16, x0 = 96, y0 = 38, n = 8;
  let grid = '';
  for (let i = 0; i <= n; i++) {
    grid += `<path d="M${x0 + i * cell} ${y0}V${y0 + n * cell}M${x0} ${y0 + i * cell}H${x0 + n * cell}" stroke="#fff" stroke-opacity=".22"/>`;
  }
  const letters = 'ABCDEFGH'.split('').map((l, i) => `<text x="${x0 + i * cell + 8}" y="${y0 - 6}" text-anchor="middle" font-family="${SANS}" font-size="8" font-weight="700" fill="#fff" fill-opacity=".7">${l}</text>`).join('');
  const nums = Array.from({ length: n }, (_, i) => `<text x="${x0 - 7}" y="${y0 + i * cell + 11}" text-anchor="middle" font-family="${SANS}" font-size="8" font-weight="700" fill="#fff" fill-opacity=".7">${i + 1}</text>`).join('');
  const ship = (c, r, len, vertical) => `<rect x="${x0 + c * cell + 2}" y="${y0 + r * cell + 2}" width="${vertical ? cell - 4 : len * cell - 4}" height="${vertical ? len * cell - 4 : cell - 4}" rx="6" fill="#dbe6f0"/>`;
  const hit = (c, r) => `<g transform="translate(${x0 + c * cell + 8} ${y0 + r * cell + 8})"><circle r="5.5" fill="#ff5a3c"/><path d="M-2.5-2.5l5 5M2.5-2.5l-5 5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>`;
  const miss = (c, r) => `<circle cx="${x0 + c * cell + 8}" cy="${y0 + r * cell + 8}" r="2.2" fill="#fff" fill-opacity=".75"/>`;
  return `${grid}${letters}${nums}${ship(1, 1, 4, false)}${ship(6, 2, 3, true)}${ship(2, 5, 3, false)}${ship(0, 3, 2, true)}${ship(5, 7, 2, false)}
  ${hit(2, 1)}${hit(3, 1)}${hit(6, 3)}${miss(4, 3)}${miss(1, 6)}${miss(7, 0)}${miss(3, 7)}${miss(5, 5)}`;
}

function map() {
  // Chicago's street grid, the river's main stem and branches, and Lake Michigan to the east.
  let streets = '';
  for (let x = 20; x < 230; x += 26) streets += `<path d="M${x} 0V200" stroke="#fff" stroke-width="${x % 78 === 20 ? 4 : 2}"/>`;
  for (let y = 14; y < 200; y += 24) streets += `<path d="M0 ${y}H240" stroke="#fff" stroke-width="${y % 72 === 14 ? 4 : 2}"/>`;
  return `${streets}
  <path d="M232 0 C 222 40, 238 70, 226 104 S 236 160, 224 200 H320 V0 Z" fill="#8cc4e6"/>
  <path d="M232 0 C 222 40, 238 70, 226 104 S 236 160, 224 200" fill="none" stroke="#fff" stroke-width="3"/>
  <path d="M229 92 C 200 94, 176 90, 150 96 C 138 99, 126 96, 118 90 C 108 70, 102 44, 96 0" fill="none" stroke="#6fb2de" stroke-width="7" stroke-linecap="round"/>
  <path d="M150 96 C 142 120, 128 150, 110 200" fill="none" stroke="#6fb2de" stroke-width="7" stroke-linecap="round"/>
  <text x="274" y="104" text-anchor="middle" font-family="${SANS}" font-size="8.5" font-weight="700" letter-spacing="1" fill="#fff" fill-opacity=".95">LAKE</text>
  <text x="274" y="115" text-anchor="middle" font-family="${SANS}" font-size="8.5" font-weight="700" letter-spacing="1" fill="#fff" fill-opacity=".95">MICHIGAN</text>
  <circle cx="176" cy="132" r="18" fill="#0a7aff" fill-opacity=".14"/><circle cx="176" cy="132" r="6" fill="#0a7aff" stroke="#fff" stroke-width="2.5"/>
  <g transform="translate(118 36)"><path d="M12 30s-11-9.7-11-18a11 11 0 0 1 22 0c0 8.3-11 18-11 18z" fill="#ff3b30" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#fff"/></g>
  <g transform="translate(58 112)"><path d="M10 25S1 17 1 10a9 9 0 0 1 18 0c0 7-9 15-9 15z" fill="#ff9500" stroke="#fff" stroke-width="2"/><circle cx="10" cy="10" r="3.4" fill="#fff"/></g>
  <rect x="20" y="164" width="116" height="24" rx="12" fill="#fff"/>
  <text x="78" y="180" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="700" fill="#1f5134">Parade 0.4 mi away</text>`;
}

function camera() {
  const corner = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 18}V${y}H${x + dx * 18}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const box = (x, y, w, hgt, label) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="8" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 3"/><rect x="${x}" y="${y - 16}" width="${label.length * 6 + 14}" height="14" rx="7" fill="#fff"/><text x="${x + 7}" y="${y - 6}" font-family="${SANS}" font-size="9" font-weight="700" fill="#a33a0b">${label}</text>`;
  return `${corner(40, 28, 1, 1)}${corner(280, 28, -1, 1)}${corner(40, 172, 1, -1)}${corner(280, 172, -1, -1)}
  <ellipse cx="160" cy="112" rx="92" ry="44" fill="#fff" fill-opacity=".92"/>
  <circle cx="118" cy="108" r="17" fill="#e53935"/><path d="M112 94c3 3 9 3 12 0" fill="none" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>
  <path d="M158 96c10-10 26-8 30 4-10 8-24 8-30-4z" fill="#43a047"/><path d="M160 118c10-8 24-6 28 4-9 7-22 7-28-4z" fill="#66bb6a"/>
  <g fill="#f4c542"><rect x="198" y="100" width="34" height="6" rx="3" transform="rotate(-12 215 103)"/><rect x="200" y="112" width="34" height="6" rx="3" transform="rotate(8 217 115)"/><rect x="194" y="122" width="30" height="6" rx="3" transform="rotate(-4 209 125)"/></g>
  ${box(96, 86, 44, 44, 'tomato')}${box(152, 86, 42, 44, 'basil')}${box(194, 92, 44, 40, 'pasta')}`;
}

// A session replay player: live badge, the recorded page, a cursor, and playback controls.
function replay() {
  const chip = (x, label, on = false) => `<rect x="${x}" y="156" width="22" height="12" rx="3" fill="${on ? '#6c63ff' : '#fff'}" fill-opacity="${on ? 1 : 0.12}"/><text x="${x + 11}" y="165" text-anchor="middle" font-family="${SANS}" font-size="7.5" font-weight="700" fill="#fff">${label}</text>`;
  return `<rect x="22" y="22" width="276" height="156" rx="12" fill="#05060d" fill-opacity=".55" stroke="#fff" stroke-opacity=".12"/>
  <circle cx="38" cy="38" r="3.4" fill="#ff4d5e"/>
  <text x="46" y="41.5" font-family="${SANS}" font-size="9" font-weight="800" letter-spacing=".8" fill="#ff8a95">LIVE</text>
  <text x="74" y="41.5" font-family="${SANS}" font-size="9" fill="#fff" fill-opacity=".55">session replay</text>
  <rect x="34" y="52" width="252" height="86" rx="6" fill="#fff" fill-opacity=".05"/>
  <rect x="46" y="64" width="64" height="7" rx="3.5" fill="#fff" fill-opacity=".22"/>
  <rect x="46" y="78" width="148" height="10" rx="5" fill="#fff" fill-opacity=".14"/>
  <rect x="46" y="96" width="112" height="6" rx="3" fill="#fff" fill-opacity=".12"/>
  <rect x="46" y="106" width="136" height="6" rx="3" fill="#fff" fill-opacity=".12"/>
  <rect x="46" y="118" width="62" height="12" rx="4" fill="#6c63ff"/>
  <path d="M116 119v14l3.6-3.4 2.6 5.6 2.2-1-2.6-5.4 4.8-.2z" fill="#fff" stroke="#05060d" stroke-width=".8" stroke-linejoin="round"/>
  <rect x="34" y="146" width="252" height="3" rx="1.5" fill="#fff" fill-opacity=".16"/>
  <rect x="34" y="146" width="104" height="3" rx="1.5" fill="#8b85ff"/>
  <circle cx="138" cy="147.5" r="4" fill="#fff"/>
  ${chip(34, '1×')}${chip(60, '2×', true)}${chip(86, '4×')}
  <rect x="228" y="157" width="18" height="10" rx="5" fill="#3ddc97"/><circle cx="241" cy="162" r="3.6" fill="#fff"/>
  <text x="251" y="165" font-family="${SANS}" font-size="7.5" fill="#fff" fill-opacity=".75">Skip idle</text>`;
}

const ART = { chart, logs, cipher, graph, tasks, video, voila, battleship, map, camera, replay };

export function coverSvg(project) {
  const draw = ART[project.cover?.type] || chart;
  return `<svg class="cover-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${draw()}</svg>`;
}

export function coverStyle(project) {
  const { from = '#1d2a44', to = '#3a4d78' } = project.cover || {};
  return `--cover-from:${from};--cover-to:${to}`;
}

export function coverHtml(project, { cls = '' } = {}) {
  return `<div class="cover${cls ? ` ${cls}` : ''}" style="${coverStyle(project)}" role="img" aria-label="${esc(`Illustration for ${project.name}`)}">${coverSvg(project)}</div>`;
}
