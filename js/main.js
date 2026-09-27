// Boot: pick the desktop or phone layout, restore the URL state, and handle the simple page.

import { applySettings } from './lib/settings.js';
import { router, parseToken } from './lib/router.js';
import { storage, reducedMotion, isProductionHost } from './lib/dom.js';
import { renderSimplePage } from './lib/simple.js';
import { titleFor } from './lib/titles.js';
import { site } from './content.js';

const root = document.getElementById('os');
const SIMPLE_KEY = 'saios.simple';
const HELLO_KEY = 'saios.hello';
const phone = window.matchMedia('(max-width: 820px), (max-height: 540px) and (pointer: coarse)');

let shell = null;
let shellType = null;

applySettings();

const layout = () => (phone.matches ? 'ios' : 'mac');

async function mountShell() {
  if (!shell) {
    shellType = layout();
    if (shellType === 'ios') {
      const { mountIOS } = await import('./ios/ios.js');
      shell = mountIOS(root, { enterSimple });
    } else {
      const { mountDesktop } = await import('./os/desktop.js');
      shell = mountDesktop(root, { enterSimple });
    }
  }
  // The simple page hides the app; show it again whether it was just built or already running.
  root.hidden = false;
  // If the slow-start fallback already showed the simple page, take the app back.
  document.documentElement.classList.replace('no-js', 'js');
  document.documentElement.classList.add('os-ready');
  return shell;
}

function simpleEl() {
  return document.getElementById('simple');
}

function isSimple() {
  return document.body.classList.contains('is-simple');
}

// Re-render so computed facts (years of experience, the year in the footer) are current.
function freshSimplePage() {
  const current = simpleEl();
  const t = document.createElement('template');
  t.innerHTML = renderSimplePage().trim();
  const next = t.content.firstElementChild;
  if (current) current.replaceWith(next);
  else document.body.append(next);
  const exit = next.querySelector('[data-action="exit-simple"]');
  exit.hidden = false;
  exit.lastChild.textContent = phone.matches ? 'App view' : 'Desktop view';
  return next;
}

function enterSimple({ record = true, replace = false } = {}) {
  const page = freshSimplePage();
  document.body.classList.add('is-simple');
  root.hidden = true;
  storage.set(SIMPLE_KEY, true);
  if (record) router.record('simple', { replace });
  document.title = titleFor('simple');
  window.scrollTo(0, 0);
  page.querySelector('h1')?.setAttribute('tabindex', '-1');
  page.querySelector('h1')?.focus({ preventScroll: true });
}

async function exitSimple(token = '') {
  storage.set(SIMPLE_KEY, false);
  // The window crossed between phone and desktop sizes while the simple page was up,
  // so the running app is the wrong one: load the right one fresh at the same URL.
  if (shell && shellType !== layout()) {
    router.record(token, { replace: true });
    window.location.reload();
    return;
  }
  document.body.classList.remove('is-simple');
  await mountShell();
  if (shellType === 'mac' && !root.dataset.booted) {
    root.dataset.booted = 'true';
    shell.boot(token);
  } else shell.go(token);
  router.record(token, { replace: true });
}

document.addEventListener('click', (e) => {
  const exit = e.target.closest('[data-action="exit-simple"]');
  if (exit) {
    e.preventDefault();
    exitSimple('');
  }
});

router.onNavigate(async (token, { state } = {}) => {
  if (isSimple()) {
    // Entries this page pushed carry state; the simple page's own anchor links don't.
    const fromApp = typeof state?.saios === 'string' && state.saios !== 'simple';
    const target = token ? document.getElementById(token) : null;
    if (token === 'simple') window.scrollTo(0, 0);
    else if (!fromApp && target && simpleEl()?.contains(target)) target.scrollIntoView({ block: 'start' });
    else exitSimple(token);
    return;
  }
  if (token === 'simple') {
    enterSimple({ record: false });
    return;
  }
  const s = await mountShell();
  s.go(token, { fromHistory: true });
});
router.start();

async function start() {
  const initial = parseToken();
  const prefersSimple = storage.get(SIMPLE_KEY, false);
  const initialInSimple = initial && simpleEl()?.querySelector(`#${CSS.escape(initial)}`);
  if (initial === 'simple' || initial === 'simple-page' || (prefersSimple && (!initial || initialInSimple))) {
    enterSimple({ record: !initial || initial === 'simple-page', replace: true });
    if (initialInSimple) initialInSimple.scrollIntoView({ block: 'start' });
    document.documentElement.classList.add('os-ready');
    return;
  }
  await mountShell();
  const boot = () => {
    if (shellType === 'mac') {
      root.dataset.booted = 'true';
      shell.boot(initial);
    } else if (initial) shell.go(initial);
    document.title = titleFor(initial);
  };
  const firstVisit = !storage.get(HELLO_KEY, false);
  const embedded = window.self !== window.top;
  if (firstVisit && !initial && !embedded && !reducedMotion()) {
    storage.set(HELLO_KEY, true);
    const { playHello } = await import('./lib/hello.js');
    boot();
    playHello();
  } else {
    storage.set(HELLO_KEY, true);
    boot();
  }
}

start();

// Crossing between phone and desktop layouts rebuilds the page at the same URL.
phone.addEventListener('change', () => {
  if (!isSimple()) window.location.reload();
});

// Session replay only on the real site, loaded after everything else, with typed text masked.
if (isProductionHost(site.productionHosts)) {
  const load = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.logrocket.io/LogRocket.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => window.LogRocket?.init(site.logRocketId, { dom: { inputSanitizer: true } });
    document.head.append(script);
  };
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
  if (document.readyState === 'complete') idle(load);
  else window.addEventListener('load', () => idle(load), { once: true });
}
