// Layered-hills wallpaper whose colors follow the visitor's time of day.

import { h } from './dom.js';
import { settings, paletteFor } from './settings.js';

function starField() {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let out = '';
  for (let i = 0; i < 110; i++) {
    const x = Math.round(rand() * 1600);
    const y = Math.round(rand() * 560);
    const r = (rand() * 1.3 + 0.4).toFixed(2);
    const o = (rand() * 0.6 + 0.35).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
  }
  return out;
}

const STARS = starField();

export function wallpaperMarkup({ portrait = false } = {}) {
  const view = portrait ? '420 0 760 1000' : '0 0 1600 1000';
  return `<svg viewBox="${view}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="wp-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="wp-sky-1"/><stop offset=".55" class="wp-sky-2"/><stop offset="1" class="wp-sky-3"/>
    </linearGradient>
    <radialGradient id="wp-glow" cx="1180" cy="360" r="340" gradientUnits="userSpaceOnUse">
      <stop offset="0" class="wp-glow" stop-opacity=".55"/><stop offset="1" class="wp-glow" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#wp-sky)"/>
  <g class="wp-stars">${STARS}</g>
  <circle cx="1180" cy="360" r="340" fill="url(#wp-glow)" class="wp-sun-glow"/>
  <circle cx="1180" cy="360" r="62" class="wp-sun"/>
  <path class="wp-h1" d="M0 560 C 200 505, 380 470, 560 505 S 900 575, 1110 520 S 1450 455, 1600 495 V1000 H0 Z"/>
  <path class="wp-h2" d="M0 640 C 160 600, 360 588, 520 625 S 860 695, 1080 640 S 1420 590, 1600 632 V1000 H0 Z"/>
  <path class="wp-h3" d="M0 725 C 220 680, 430 700, 650 738 S 1010 790, 1230 732 S 1480 690, 1600 716 V1000 H0 Z"/>
  <path class="wp-h4" d="M0 815 C 240 772, 480 800, 710 832 S 1090 875, 1310 822 S 1520 800, 1600 812 V1000 H0 Z"/>
  <path class="wp-h5" d="M0 905 C 260 862, 520 892, 790 918 S 1190 952, 1430 906 S 1560 892, 1600 896 V1000 H0 Z"/>
</svg>`;
}

// Renders the wallpaper and keeps its palette in step with the clock and settings.
export function mountWallpaper({ portrait = false } = {}) {
  const el = h('div', { class: 'wallpaper', html: wallpaperMarkup({ portrait }) });
  const update = () => {
    el.dataset.palette = paletteFor();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(el).getPropertyValue('--sky-1').trim() || '#1c2340');
  };
  update();
  const timer = setInterval(update, 60 * 1000);
  const unsubscribe = settings.subscribe((key) => { if (key === 'wallpaper') update(); });
  el.destroy = () => {
    clearInterval(timer);
    unsubscribe();
  };
  return el;
}
