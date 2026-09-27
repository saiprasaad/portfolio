// Regenerates image assets from their sources with headless Chromium:
//   node scripts/assets.mjs
// - images/sai-{160,320,640}.webp and sai-640.jpg from images/Sai.jpg
// - images/projects/*.webp from the Repo Vision charts in images/projects/src
// - js/lib/ascii.js (the Terminal's neofetch portrait)
// - favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png from favicon.svg
// Needs Playwright (npm install) and a local server; it starts one itself.

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node22/lib/node_modules/playwright');
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.js': 'text/javascript' };

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/__blank.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>assets</title>');
    return;
  }
  const path = join(ROOT, pathname);
  if (!path.startsWith(ROOT) || !existsSync(path) || !extname(path)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/__blank.html`);

const save = (file, dataUrl) => {
  writeFileSync(join(ROOT, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote', file);
};

// Resize an image (square-cropped from the center when square is true) to a data URL.
async function resize(src, width, { square = false, type = 'image/webp', quality = 0.82, height = null } = {}) {
  return page.evaluate(async ({ src, width, square, type, quality, height }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sw = square ? side : img.naturalWidth;
    const sh = square ? side : img.naturalHeight;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    const w = width;
    const h = height || Math.round(width * (sh / sw));
    // Downscale in halves for a sharper result.
    let canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    while (canvas.width / 2 > w) {
      const next = document.createElement('canvas');
      next.width = Math.round(canvas.width / 2);
      next.height = Math.round(canvas.height / 2);
      const ctx = next.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, next.width, next.height);
      canvas = next;
    }
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(canvas, 0, 0, w, h);
    return out.toDataURL(type, quality);
  }, { src, width, square, type, quality, height });
}

for (const size of [160, 320, 640]) save(`images/sai-${size}.webp`, await resize(`${base}/images/Sai.jpg`, size, { square: true }));
save('images/sai-640.jpg', await resize(`${base}/images/Sai.jpg`, 640, { square: true, type: 'image/jpeg', quality: 0.86 }));

const srcDir = join(ROOT, 'images/projects/src');
if (existsSync(srcDir)) {
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.png'))) {
    save(`images/projects/${f.replace('.png', '.webp')}`, await resize(`${base}/images/projects/src/${f}`, 1000, { quality: 0.9 }));
  }
}

// ASCII portrait: remove the flat studio background, then map darkness to characters.
const ascii = await page.evaluate(async (src) => {
  const COLS = 46;
  const ROWS = 24;
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = COLS * 4;
  c.height = ROWS * 8;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, img.naturalWidth * 0.08, img.naturalHeight * 0.02, img.naturalWidth * 0.84, img.naturalHeight * 0.9, 0, 0, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const cell = (x, y) => {
    let r = 0; let g = 0; let b = 0; let n = 0;
    for (let yy = y * 8; yy < y * 8 + 8; yy++) {
      for (let xx = x * 4; xx < x * 4 + 4; xx++) {
        const i = (yy * c.width + xx) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
    }
    r /= n * 255; g /= n * 255; b /= n * 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return { lum: 0.2126 * r + 0.7152 * g + 0.0722 * b, sat: max === 0 ? 0 : (max - min) / max };
  };
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid.push([]);
    for (let x = 0; x < COLS; x++) grid[y].push(cell(x, y));
  }
  const bg = [grid[0][0], grid[0][COLS - 1], grid[2][1], grid[2][COLS - 2]];
  const bgLum = bg.reduce((s, v) => s + v.lum, 0) / bg.length;
  // Flood-fill the background from the edges.
  const isBg = (v) => v.sat < 0.16 && Math.abs(v.lum - bgLum) < 0.115;
  const empty = grid.map((row) => row.map(() => false));
  const queue = [];
  for (let x = 0; x < COLS; x++) queue.push([x, 0]);
  for (let y = 0; y < ROWS; y++) queue.push([0, y], [COLS - 1, y]);
  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS || empty[y][x] || !isBg(grid[y][x])) continue;
    empty[y][x] = true;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const lums = grid.flat().filter((_, i) => !empty[Math.floor(i / COLS)][i % COLS]).map((v) => v.lum).sort((a, b) => a - b);
  const lo = lums[Math.floor(lums.length * 0.03)];
  const hi = lums[Math.floor(lums.length * 0.97)];
  const RAMP = ' .:-=+*#%@';
  return grid.map((row, y) => row.map((v, x) => {
    if (empty[y][x]) return ' ';
    const t = 1 - Math.min(1, Math.max(0, (v.lum - lo) / (hi - lo)));
    return RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1))))];
  }).join('').replace(/\s+$/, '')).join('\n');
}, `${base}/images/Sai.jpg`);
writeFileSync(join(ROOT, 'js/lib/ascii.js'), `// Generated by scripts/assets.mjs from images/Sai.jpg.\nexport const ASCII_PORTRAIT = ${JSON.stringify(ascii)};\n`);
console.log('wrote js/lib/ascii.js');
console.log(ascii);

// Favicons from favicon.svg.
async function renderSvg(size) {
  return page.evaluate(async ({ src, size }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    c.getContext('2d').drawImage(img, 0, 0, size, size);
    return c.toDataURL('image/png');
  }, { src: `${base}/favicon.svg`, size });
}
save('apple-touch-icon.png', await renderSvg(180));
save('icon-192.png', await renderSvg(192));
save('icon-512.png', await renderSvg(512));
const png32 = Buffer.from((await renderSvg(32)).split(',')[1], 'base64');
// An .ico file is a tiny header plus the PNG itself.
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync(join(ROOT, 'favicon.ico'), Buffer.concat([header, png32]));
console.log('wrote favicon.ico');

await browser.close();
server.close();
