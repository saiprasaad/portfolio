// End-to-end smoke test: boots the site in Chromium and exercises every app.
//   npm test
// Needs Playwright's Chromium (npx playwright install chromium).

import { createRequire } from 'node:module';
import { startServer } from '../scripts/serve.mjs';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node22/lib/node_modules/playwright');
}

const failures = [];
let passed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` (${detail})` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` (${detail})` : ''}`);
  }
}

const server = await startServer();
const BASE = `http://127.0.0.1:${server.address().port}/`;
const browser = await playwright.chromium.launch();

async function page({ width = 1440, height = 900, hash = '', folio = 'fail', touch = false } = {}) {
  // Reduced motion makes timing deterministic; the animated paths are the same code with transitions.
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  await context.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: '' }));
  await context.route('https://folio-backend-two.vercel.app/**', (r) => (folio === 'ok'
    ? r.fulfill({ contentType: 'application/json', body: JSON.stringify({ reply: 'Mock reply: **Repo Vision** is a strong pick.' }) })
    : r.abort()));
  await context.addInitScript(() => {
    localStorage.setItem('saios.hello', 'true');
    localStorage.setItem('saios.seen', JSON.stringify({ folioNote: true, searchNote: true }));
  });
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(BASE + (hash ? `#${hash}` : ''));
  await p.waitForSelector('.os-ready, html.os-ready', { state: 'attached' }).catch(() => {});
  await p.waitForTimeout(400);
  return { p, context, errors };
}

const count = (p, sel) => p.locator(sel).count();

console.log('Desktop');
{
  const { p, context, errors } = await page();
  check('boots without page errors', errors.length === 0, errors.join('; '));
  check('shows the name as the page heading', (await p.locator('h1').first().textContent()).includes('Saiprasaad'));
  check('opens Finder at the portfolio root', await count(p, '.window[data-app="finder"] .fv-item') === 8);

  await p.click('.fv-item[data-key="projects"]');
  await p.waitForTimeout(200);
  check('lists 10 projects', await count(p, '.fv-icons--projects .fv-item') === 10);
  check('records #projects in the URL', p.url().endsWith('#projects'));

  await p.click('.finder-toolbar [data-mode="list"]');
  check('list view has 10 rows', await count(p, '.fv-list tbody tr') === 10);
  await p.click('.finder-toolbar [data-mode="gallery"]');
  check('gallery view has 10 thumbnails', await count(p, '.fvg-thumb') === 10);
  await p.click('.finder-toolbar [data-mode="icons"]');

  await p.click('.fv-item[data-key="repo-vision"]');
  await p.waitForTimeout(300);
  check('Quick Look opens a project', (await p.locator('.ql #ql-title').textContent()) === 'Repo Vision');
  check('Quick Look records the project in the URL', p.url().endsWith('#repo-vision'));
  await p.keyboard.press('ArrowRight');
  check('arrow keys move to the next project', (await p.locator('.ql #ql-title').textContent()) !== 'Repo Vision');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  check('Escape closes Quick Look', await count(p, '.ql') === 0);
  check('closing Quick Look restores the folder URL', p.url().endsWith('#projects'), p.url());

  await p.keyboard.press('Control+k');
  await p.keyboard.type('flutter');
  await p.waitForTimeout(150);
  check('Spotlight finds Flutter projects', (await p.locator('.spotlight-list').textContent()).includes('Campus Cooks'));
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  check('Spotlight top hit filters Finder by skill', (await p.locator('.finder-filter').textContent()).includes('Flutter') && await count(p, '.fv-icons--projects .fv-item') === 4);

  await p.keyboard.press('Control+Backquote');
  await p.waitForTimeout(200);
  const term = p.locator('.terminal-input');
  for (const cmd of ['ls', '<b id="xss">x</b>', 'cat about.txt']) {
    await term.fill(cmd);
    await term.press('Enter');
  }
  const out = await p.locator('.terminal-output').textContent();
  check('terminal lists the virtual home folder', out.includes('projects/'));
  check('terminal never renders typed HTML', await count(p, '#xss') === 0);
  check('terminal cat prints files', out.includes('Full-Stack Software Engineer'));
  await term.fill('open resume.pdf');
  await term.press('Enter');
  await p.waitForTimeout(300);
  check('terminal open launches apps', await count(p, '.window[data-app="preview"]') === 1);

  await p.click('.mb-status[aria-label="Ask Folio"]');
  await p.waitForTimeout(200);
  await p.fill('.folio-form textarea', 'What has he built with AI?');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.fm-note', { timeout: 8000 }).catch(() => {});
  check('Folio answers from the portfolio when the service is down', (await p.locator('.folio-chat').textContent()).includes('YouTube Translator'));
  await p.fill('.folio-form textarea', 'show me his flutter work');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  check('Folio can drive the site', (await p.locator('.finder-filter').textContent()).includes('Flutter'));

  await p.click('.folio [role="tab"]:has-text("Fit Check")');
  await p.click('.fit-form .btn-quiet');
  await p.waitForTimeout(200);
  const fit = await p.locator('.fit-result').textContent();
  check('Fit Check scores the example', /Matches \d+ of \d+ technologies/.test(fit) && fit.includes('Kubernetes'));

  const mail = await p.evaluate(() => { document.querySelector('.dock-item[data-app="mail"]').click(); return true; });
  await p.waitForTimeout(400);
  check('Dock opens Mail', mail && await count(p, '.window[data-app="mail"]') === 1);
  await p.click('.window[data-app="mail"] .tl-min');
  await p.waitForTimeout(600);
  check('minimize hides the window', await p.locator('.window[data-app="mail"]').isHidden());
  await p.click('.dock-item[data-app="mail"]');
  await p.waitForTimeout(600);
  check('Dock restores a minimized window', await p.locator('.window[data-app="mail"]').isVisible());
  const before = await p.locator('.window[data-app="mail"]').boundingBox();
  await p.click('.window[data-app="mail"] .tl-zoom');
  await p.waitForTimeout(450);
  const after = await p.locator('.window[data-app="mail"]').boundingBox();
  check('zoom enlarges the window', after.width > before.width + 100);
  await p.click('.window[data-app="mail"] .tl-close');
  await p.waitForTimeout(300);
  check('close removes the window', await count(p, '.window[data-app="mail"]') === 0);

  await p.click('.fs-item[data-loc="root"]');
  await p.locator('.fv-item').first().focus();
  await p.keyboard.press('ArrowRight');
  check('arrow keys move the Finder selection', await p.evaluate(() => document.activeElement?.dataset.key === 'projects'));
  await p.keyboard.press('Enter');
  await p.waitForTimeout(200);
  check('Enter opens the selected folder', await count(p, '.fv-icons--projects') === 1);

  check('no page errors after exercising apps', errors.length === 0, errors.join('; '));
  await context.close();
}

console.log('Folio service');
{
  const { p, context } = await page({ folio: 'ok', hash: 'folio' });
  await p.fill('.folio-form textarea', 'Tell me about his work');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(2200);
  check('shows the AI reply when the service answers', (await p.locator('.folio-chat').textContent()).includes('Mock reply'));
  await context.close();
}

console.log('Deep links and simple page');
{
  const { p, context } = await page({ hash: 'repo-vision' });
  check('#repo-vision opens Quick Look', (await p.locator('.ql #ql-title').textContent()) === 'Repo Vision');
  await context.close();
  const s = await page({ hash: 'simple' });
  check('#simple shows the simple page', await s.p.evaluate(() => document.body.classList.contains('is-simple')));
  check('simple page lists every project', await count(s.p, '.simple-page .sp-project') === 10);
  await s.p.click('.sp-desktop-btn');
  await s.p.waitForTimeout(500);
  check('simple page can return to the desktop', await count(s.p, '.window[data-app="finder"]') === 1);
  await s.context.close();
}

console.log('Browser history');
{
  const { p, context } = await page();
  await p.click('.fv-item[data-key="projects"]');
  await p.click('.fv-item[data-key="wordle-clone"]');
  await p.waitForTimeout(300);
  await p.goBack();
  await p.waitForTimeout(300);
  check('Back closes Quick Look', await count(p, '.ql') === 0 && p.url().endsWith('#projects'));
  await p.goForward();
  await p.waitForTimeout(300);
  check('Forward reopens it', (await p.locator('.ql #ql-title').textContent()) === 'Wordle Clone');
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.mb-logo').click());
  await p.click('.menu-item:has-text("Simple Page")');
  await p.waitForTimeout(300);
  check('menu opens the simple page', await p.evaluate(() => document.body.classList.contains('is-simple')));
  await p.click('.sp-nav a[href="#skills"]');
  await p.waitForTimeout(200);
  check('simple page anchors stay on the simple page', await p.evaluate(() => document.body.classList.contains('is-simple')));
  await p.goBack();
  await p.waitForTimeout(200);
  await p.goBack();
  await p.waitForTimeout(500);
  check('Back from the simple page returns to the desktop', await p.evaluate(() => !document.body.classList.contains('is-simple')) && p.url().endsWith('#projects'), p.url());
  await context.close();
}

console.log('Phone');
{
  const { p, context, errors } = await page({ width: 390, height: 844, touch: true });
  check('shows the home screen', await count(p, '.ios-grid .ios-app') === 8);
  await p.click('.ios-dock .ios-app[aria-label="Projects"]');
  await p.waitForTimeout(500);
  check('Projects app lists 10 projects', await count(p, '.ios-project') === 10);
  await p.locator('.ios-project').first().click();
  await p.waitForTimeout(500);
  check('tapping a project opens its page', (await p.locator('.ios-screen:last-child .ios-large-title').textContent()) === 'Repo Vision');
  await p.click('.ios-screen:last-child .ios-back');
  await p.waitForTimeout(400);
  check('Back returns to the list', await count(p, '.ios-screen') === 1);
  await p.locator('.ios-project').nth(1).click();
  await p.waitForTimeout(500);
  await p.goBack();
  await p.waitForTimeout(500);
  check('browser Back closes the top screen', await count(p, '.ios-screen') === 1 && p.url().endsWith('#projects'), p.url());
  await p.click('.ios-indicator');
  await p.waitForTimeout(300);
  check('home bar returns to the home screen', await count(p, '.ios-screen') === 0);
  check('no page errors on the phone', errors.length === 0, errors.join('; '));
  await context.close();
  const d = await page({ width: 390, height: 844, touch: true, hash: 'experience' });
  check('#experience opens Experience on the phone', (await d.p.locator('.ios-screen .ios-large-title').textContent()) === 'Experience');
  await d.context.close();
}

console.log('Without JavaScript');
{
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await p.goto(BASE);
  check('prerendered page has every project', await count(p, '.simple-page .sp-project') === 10);
  check('prerendered page has the JSON-LD profile', (await p.locator('script[type="application/ld+json"]').textContent()).includes('Saiprasaad Kalyanaraman'));
  await context.close();
}

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`FAILED: ${f}`));
  process.exit(1);
}
