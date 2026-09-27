// Regenerates image assets from their sources with headless Chromium:
//   node scripts/assets.mjs [photos|projects|logos|favicons]
// - photos: images/sai-{160,320,640}.webp and sai-640.jpg from images/Sai.jpg
// - projects: images/projects/*.webp from the Repo Vision charts in images/projects/src
// - logos: images/logos/*.webp (128px squares) from the company logos in images/logos/src
// - favicons: favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png from favicon.svg
// With no argument it regenerates everything.
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
const only = process.argv[2];
const want = (group) => !only || only === group;
const TYPES = { '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.js': 'text/javascript' };

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

if (want('photos')) {
  for (const size of [160, 320, 640]) save(`images/sai-${size}.webp`, await resize(`${base}/images/Sai.jpg`, size, { square: true }));
  save('images/sai-640.jpg', await resize(`${base}/images/Sai.jpg`, 640, { square: true, type: 'image/jpeg', quality: 0.86 }));
}

const srcDir = join(ROOT, 'images/projects/src');
if (want('projects') && existsSync(srcDir)) {
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.png'))) {
    save(`images/projects/${f.replace('.png', '.webp')}`, await resize(`${base}/images/projects/src/${f}`, 1000, { quality: 0.9 }));
  }
}

const logoDir = join(ROOT, 'images/logos/src');
if (want('logos') && existsSync(logoDir)) {
  for (const f of readdirSync(logoDir).filter((x) => /\.(png|jpe?g|webp)$/i.test(x))) {
    save(`images/logos/${f.replace(/\.\w+$/, '.webp')}`, await resize(`${base}/images/logos/src/${f}`, 128, { square: true, quality: 0.9 }));
  }
}

// Favicons from favicon.svg.
if (want('favicons')) {
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
}

await browser.close();
server.close();
