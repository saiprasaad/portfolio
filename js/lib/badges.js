// Award and certification artwork: a medal on ribbon tails for awards, a scalloped seal
// for certifications. Plain SVG strings, so the same art works in the browser and the prerender.

import { strokeGlyph } from './icons.js';

// [light, mid, deep] for each tone used in content.js.
const TONES = {
  gold: ['#ffe58a', '#f5b313', '#c27803'],
  violet: ['#dcc4ff', '#8b5cf6', '#5b21b6'],
  blue: ['#b3dbff', '#3b82f6', '#1e40af'],
  green: ['#b4f2c9', '#22c55e', '#15803d'],
  pink: ['#ffc4de', '#ec4899', '#be185d'],
  orange: ['#ffd5a8', '#f97316', '#c2410c'],
  red: ['#ffc9c9', '#ef4444', '#b91c1c'],
  crimson: ['#ffb8c4', '#d61f45', '#8f1330'],
  navy: ['#c3cdff', '#4263eb', '#1e3a8a'],
  emerald: ['#aef3d6', '#10b981', '#047857'],
};

let seq = 0;

const f = (n) => Number(n.toFixed(2));

function gradient(id, [light, mid, deep], [x1, y1, x2, y2] = [0.15, 0, 0.85, 1]) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${deep}"/></linearGradient>`;
}

function glyph(name, cx, cy, size) {
  const s = size / 24;
  return `<g transform="translate(${f(cx - size / 2)} ${f(cy - size / 2)}) scale(${f(s)})" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<g stroke="#000" stroke-opacity=".22" stroke-width="2.5" transform="translate(0 .7)">${strokeGlyph(name)}</g>`
    + `<g stroke="#fff" stroke-width="2.3">${strokeGlyph(name)}</g></g>`;
}

const svg = (body, defs) => `<svg class="badge-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;

export function medalSvg({ tone = 'gold', icon = 'star' } = {}) {
  const k = `bm${++seq}`;
  const t = TONES[tone] || TONES.gold;
  const tail = 'M34 50L50 57L42.5 97L34.5 90.5L25 95.5Z';
  return svg(
    `<path d="${tail}" fill="url(#${k}t)"/><path d="${tail}" fill="url(#${k}t)" transform="matrix(-1 0 0 1 100 0)"/>`
      + '<path d="M41 61L32.5 92.5M59 61L67.5 92.5" stroke="#fff" stroke-opacity=".32" stroke-width="1.6"/>'
      + `<circle cx="50" cy="40.5" r="33" fill="${t[2]}" opacity=".35"/>`
      + `<circle cx="50" cy="38" r="33" fill="url(#${k}d)"/>`
      + `<circle cx="50" cy="38" r="32.1" fill="none" stroke="url(#${k}r)" stroke-width="1.8"/>`
      + '<circle cx="50" cy="38" r="25" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.3"/>'
      + `<ellipse cx="50" cy="19" rx="25" ry="13.5" fill="url(#${k}s)"/>`
      + glyph(icon, 50, 38, 30),
    gradient(`${k}d`, t)
      + gradient(`${k}t`, [t[1], t[2], t[2]], [0, 0, 0, 1])
      + `<linearGradient id="${k}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>`
      + `<radialGradient id="${k}s" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
  );
}

// Scalloped edge: points alternate between two radii and the stroke rounds them off.
function scallop(cx, cy, outer, inner, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

export function sealSvg({ tone = 'blue', icon = 'check' } = {}) {
  const k = `bs${++seq}`;
  const t = TONES[tone] || TONES.blue;
  const edge = scallop(50, 50, 43, 38.5, 16);
  return svg(
    `<path d="${edge}" fill="${t[2]}" opacity=".35" stroke="${t[2]}" stroke-width="4" stroke-linejoin="round" transform="translate(0 2.5)"/>`
      + `<path d="${edge}" fill="url(#${k}d)" stroke="url(#${k}d)" stroke-width="4" stroke-linejoin="round"/>`
      + `<circle cx="50" cy="50" r="30" fill="url(#${k}i)"/>`
      + '<circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>'
      + '<circle cx="50" cy="50" r="25.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1" stroke-dasharray="1 2.6"/>'
      + `<ellipse cx="50" cy="30" rx="26" ry="14" fill="url(#${k}s)"/>`
      + glyph(icon, 50, 50, 29),
    gradient(`${k}d`, t)
      + gradient(`${k}i`, [t[1], t[2], t[2]], [0.2, 0, 0.8, 1])
      + `<radialGradient id="${k}s" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
  );
}
