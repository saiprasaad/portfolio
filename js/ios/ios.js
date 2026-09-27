// Phone layout: an iOS-style home screen whose apps reuse the desktop's section renderers.

import { h, fromHtml, copyText, reducedMotion, animate, trapTab } from '../lib/dom.js';
import { appIconHtml, APPS } from '../lib/icons.js';
import { coverHtml } from '../lib/covers.js';
import { mountWallpaper } from '../lib/wallpaper.js';
import { settings, toggleTheme, ACCENTS, WALLPAPERS } from '../lib/settings.js';
import { router } from '../lib/router.js';
import { site, profile, projects, getProject, skillLabel } from '../content.js';
import {
  icon, photo, renderAbout, renderExperience, renderSkills, renderEducation, renderAchievements, renderContact,
  renderProjectDetail,
} from '../lib/sections.js';
import { createSpotlight } from '../apps/spotlight.js';
import { createTerminalView } from '../apps/terminal.js';
import { createFolioView, askFolio } from '../apps/folio.js';
import { createMailView } from '../apps/mail.js';
import { createResumeView } from '../apps/resume.js';
import { titleFor } from '../lib/titles.js';

const GRID = ['about', 'experience', 'skills', 'education', 'achievements', 'fit', 'terminal', 'settings'];
const DOCK = ['folio', 'projects', 'mail', 'preview'];
const LABELS = { about: 'About', experience: 'Experience', skills: 'Skills', education: 'Education', achievements: 'Awards', fit: 'Fit Check', terminal: 'Terminal', settings: 'Settings', folio: 'Folio', projects: 'Projects', mail: 'Mail', preview: 'Resume' };
const TOKEN_TO_APP = { about: 'about', experience: 'experience', skills: 'skills', education: 'education', achievements: 'achievements', contact: 'contact', projects: 'projects', resume: 'preview', folio: 'folio', fit: 'fit', terminal: 'terminal', mail: 'mail', settings: 'settings', timeline: 'experience' };
const APP_TO_TOKEN = { preview: 'resume' };

export function mountIOS(root, { enterSimple }) {
  root.className = 'ios';
  root.dataset.shell = 'ios';
  root.replaceChildren();

  const wallpaper = mountWallpaper({ portrait: true });
  const home = h('main', { class: 'ios-home scroll', 'aria-label': 'Home Screen' });
  const dock = h('nav', { class: 'ios-dock', 'aria-label': 'Dock' });
  const searchPill = h('button', { class: 'ios-search-pill', type: 'button', onClick: () => spotlight.open() }, icon('search', 14), 'Search');
  const screens = h('div', { class: 'ios-screens' });
  const indicator = h('button', { class: 'ios-indicator', type: 'button', 'aria-label': 'Go to Home Screen', hidden: true, onClick: () => goHome() }, h('span'));
  const hudEl = h('div', { class: 'hud', role: 'status', 'aria-live': 'polite' });
  root.append(wallpaper, home, searchPill, dock, screens, indicator, hudEl);

  let stack = []; // [{ el, app, title, token }]
  let hudTimer;

  function hud(text, iconName = 'check') {
    hudEl.replaceChildren(icon(iconName, 16), text);
    hudEl.classList.add('is-visible');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => hudEl.classList.remove('is-visible'), 1700);
  }

  async function copy(text, message = 'Copied') {
    const ok = await copyText(text);
    hud(ok ? message : 'Copy failed. Select the text instead.', ok ? 'check' : 'info');
  }

  function record(token, opts) {
    router.record(token, opts);
    document.title = titleFor(token);
  }

  // ---------- Screens ----------

  function screen({ title, app, token, build, actionsNode = null, back = 'Home' }) {
    const titleId = `ios-t-${Math.random().toString(36).slice(2, 8)}`;
    const small = h('h2', { class: 'ios-title', id: titleId }, title);
    const backBtn = h('button', { class: 'ios-back', type: 'button', onClick: () => pop() }, icon('chevron-left', 22), back);
    const nav = h('header', { class: 'ios-nav' }, backBtn, small, h('div', { class: 'ios-nav-actions' }, actionsNode));
    const body = h('div', { class: 'ios-screen-body scroll' });
    const el = h('section', { class: 'ios-screen', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, 'data-app': app, tabindex: '-1' }, nav, body);
    const content = build(body);
    if (content) body.append(h('h1', { class: 'ios-large-title' }, title), content);
    else el.classList.add('is-app-screen');
    body.addEventListener('scroll', () => el.classList.toggle('is-scrolled', body.scrollTop > 36), { passive: true });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); pop(); } else trapTab(el, e);
    });
    enableSwipeBack(el);
    return { el, app, title, token, body };
  }

  function push(spec, { from = null, record: shouldRecord = true } = {}) {
    const s = screen({ ...spec, back: stack.length ? stack[stack.length - 1].title : 'Home' });
    const prev = stack[stack.length - 1];
    stack.push(s);
    screens.append(s.el);
    indicator.hidden = false;
    home.inert = true;
    dock.inert = true;
    searchPill.inert = true;
    if (prev) prev.el.inert = true;
    if (from && !reducedMotion()) {
      const r = from.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      animate(s.el, [
        { transform: `translate(${r.left + r.width / 2 - W / 2}px, ${r.top + r.height / 2 - H / 2}px) scale(${r.width / W}, ${r.height / H})`, borderRadius: '40px', opacity: 0.4 },
        { transform: 'none', borderRadius: '0px', opacity: 1 },
      ], { duration: 360, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'none' });
    } else if (prev) {
      animate(s.el, [{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 300, fill: 'none' });
      animate(prev.el, [{ transform: 'none' }, { transform: 'translateX(-24%)' }, { transform: 'none' }], { duration: 300, fill: 'none' });
    } else {
      animate(s.el, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 240, fill: 'none' });
    }
    requestAnimationFrame(() => (s.el.querySelector('[data-autofocus]') || s.el).focus({ preventScroll: true }));
    if (spec.token != null && shouldRecord) record(spec.token);
    return s;
  }

  async function pop({ fromHistory = false } = {}) {
    const s = stack.pop();
    if (!s) return;
    const prev = stack[stack.length - 1];
    if (prev) prev.el.inert = false;
    await animate(s.el, [{ transform: 'none' }, { transform: stack.length ? 'translateX(100%)' : 'scale(.9)', opacity: stack.length ? 1 : 0 }], { duration: 240, fill: 'forwards' });
    s.el.remove();
    s.destroy?.();
    if (!stack.length) {
      indicator.hidden = true;
      home.inert = false;
      dock.inert = false;
      searchPill.inert = false;
    }
    if (!fromHistory) {
      // The screen's entry was pushed when it opened, so step back past it.
      if (router.canGoBack()) router.back();
      else record(prev ? prev.token : '', { replace: true });
    }
    document.title = titleFor(prev ? prev.token : '');
    (prev?.el || home).focus?.({ preventScroll: true });
  }

  function goHome() {
    const all = stack.splice(0);
    all.forEach((s) => { s.el.remove(); s.destroy?.(); });
    indicator.hidden = true;
    home.inert = false;
    dock.inert = false;
    searchPill.inert = false;
    record('', { replace: true });
  }

  function enableSwipeBack(el) {
    let start = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || e.clientX > 28) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = Math.max(0, e.clientX - start.x);
      el.style.transform = `translateX(${dx}px)`;
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      start = null;
      el.style.transform = '';
      if (dx > window.innerWidth * 0.3) pop();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ---------- Apps ----------

  const actions = {
    openProject: (slug, opts = {}) => openProject(slug, opts),
    openSection: (id) => (id === 'root' ? goHome() : openApp(TOKEN_TO_APP[id] || id)),
    filterSkill: (id) => openApp('projects', { filter: id }),
    openResume: () => openApp('preview'),
    openMail: (prefill) => openApp('mail', { prefill }),
    openFit: () => openApp('fit'),
    openFolio: ({ question, tab } = {}) => openApp(tab === 'fit' ? 'fit' : 'folio', { question }),
    openTerminal: () => openApp('terminal'),
    openTimeMachine: null,
    copy,
    hud,
  };

  function projectList(body, filter) {
    const list = filter ? projects.filter((p) => p.stack.includes(filter)) : [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));
    const wrap = h('div', { class: 'ios-stack' });
    if (filter) {
      wrap.append(h('div', { class: 'finder-filter', role: 'status' }, icon('tag', 15), h('span', {}, `${list.length} project${list.length > 1 ? 's' : ''} using `, h('strong', {}, skillLabel(filter))),
        h('button', { class: 'btn btn-glass', type: 'button', onClick: () => { pop(); openApp('projects'); } }, 'All')));
    }
    wrap.append(h('ul', { class: 'ios-projects' }, list.map((p) => h('li', {},
      h('button', { class: 'ios-project', type: 'button', onClick: () => openProject(p.slug) },
        fromHtml(coverHtml(p)),
        h('span', { class: 'ios-project-text' },
          h('strong', {}, p.name),
          h('small', {}, `${p.kind}${p.year ? ` · ${p.year}` : ''}`),
          h('span', {}, p.tagline),
        ),
      )))));
    return wrap;
  }

  function settingsScreen() {
    const group = (title, ...rows) => h('section', { class: 'ios-group', 'aria-label': title }, h('h3', { class: 'ios-group-title' }, title), h('div', { class: 'ios-group-body' }, rows));
    const render = () => {
      const seg = (key, options) => h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': key },
        options.map(([v, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(settings.get(key) === v), onClick: () => { settings.set(key, v); body.replaceChildren(render()); } }, label)));
      const switchRow = (label, key, on, value) => h('div', { class: 'ios-row' }, h('span', {}, label),
        h('button', { class: 'ios-switch', type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label, onClick: () => { settings.set(key, on ? 'auto' : value); body.replaceChildren(render()); } }, h('span')));
      return h('div', { class: 'ios-stack' },
        group('Appearance', h('div', { class: 'ios-row' }, seg('theme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']]))),
        group('Accent color', h('div', { class: 'ios-row cc-swatches', role: 'radiogroup', 'aria-label': 'Accent color' },
          ACCENTS.map((a) => h('button', { class: 'cc-swatch', type: 'button', role: 'radio', 'aria-checked': String(settings.get('accent') === a.id), 'aria-label': a.label, style: `--sw:${a.color}`, onClick: () => { settings.set('accent', a.id); body.replaceChildren(render()); } }, settings.get('accent') === a.id ? icon('check', 12) : '')))),
        group('Wallpaper', h('div', { class: 'ios-row cc-walls', role: 'radiogroup', 'aria-label': 'Wallpaper' },
          WALLPAPERS.map((w) => h('button', { class: 'cc-wall', type: 'button', role: 'radio', 'aria-checked': String(settings.get('wallpaper') === w.id), onClick: () => { settings.set('wallpaper', w.id); body.replaceChildren(render()); } },
            h('span', { class: `cc-wall-thumb${w.id === 'dynamic' ? ' cc-wall-thumb--dynamic' : ''}`, 'data-palette': w.id === 'dynamic' ? null : w.id }), w.label)))),
        group('Accessibility',
          switchRow('Reduce motion', 'motion', settings.get('motion') === 'reduced', 'reduced'),
          switchRow('Reduce transparency', 'transparency', settings.get('transparency') === 'reduced', 'reduced')),
        group('Other ways to view',
          h('button', { class: 'ios-row ios-row-btn', type: 'button', onClick: () => enterSimple() }, h('span', {}, 'Simple page'), icon('chevron-right', 16)),
          h('p', { class: 'ios-row ios-note' }, 'Open this site on a larger screen to use the desktop version.')),
        h('p', { class: 'ios-foot' }, `${site.osName} ${site.osVersion} · ${profile.name}`),
      );
    };
    const body = h('div');
    body.append(render());
    return body;
  }

  function openProject(slug, { record: shouldRecord = true } = {}) {
    const p = getProject(slug);
    if (!p) return;
    const top = stack[stack.length - 1];
    if (top?.token === p.slug) return;
    // From the Home screen or a deep link, put the project list underneath so Back lands there.
    if (!stack.length) openApp('projects', { record: false });
    push({ title: p.name, app: 'project', token: p.slug, build: () => renderProjectDetail(p, actions) }, { record: shouldRecord });
  }

  // From Home this starts a fresh stack; from inside an app it pushes, so Back returns there.
  function openApp(app, { filter = null, prefill = null, question = null, from = null, record: shouldRecord = true } = {}) {
    if (!app) return;
    const top = stack[stack.length - 1];
    if (top && top.app === app && !filter) {
      if (question && top.view?.ask) top.view.ask(question);
      if (prefill && top.view?.setPrefill) top.view.setPrefill(prefill);
      return;
    }
    const token = APP_TO_TOKEN[app] || app;
    const title = app === 'contact' ? 'Contact' : LABELS[app] || app;
    let view = null;
    const spec = { title, app, token, build: null, actionsNode: null };
    switch (app) {
      case 'about': spec.build = () => renderAbout(actions); break;
      case 'experience': spec.build = () => renderExperience(actions); break;
      case 'skills': spec.build = () => renderSkills(actions, { touch: true }); break;
      case 'education': spec.build = () => renderEducation(actions); break;
      case 'achievements': spec.build = () => renderAchievements('all'); break;
      case 'contact': spec.build = () => renderContact(actions); break;
      case 'projects': spec.build = (body) => projectList(body, filter); break;
      case 'settings': spec.build = () => settingsScreen(); break;
      case 'folio':
      case 'fit':
        view = createFolioView(actions, { tab: app === 'fit' ? 'fit' : 'chat' });
        spec.title = 'Folio';
        spec.build = (body) => { body.classList.add('is-app'); body.append(view.el); return null; };
        break;
      case 'terminal':
        view = createTerminalView({
          ...actions, close: () => pop(), ask: (q) => askFolio(q), setTheme: (v) => settings.set('theme', v),
          setWallpaper: (v) => settings.set('wallpaper', v), enterSimple,
        }, { touch: true });
        spec.build = (body) => { body.classList.add('is-app', 'is-terminal'); body.append(view.el); return null; };
        break;
      case 'mail':
        view = createMailView(actions, prefill || {});
        spec.actionsNode = view.sendButton;
        spec.title = 'New Message';
        spec.build = (body) => { body.classList.add('is-app'); body.append(view.el); return null; };
        break;
      case 'preview':
        view = createResumeView({ allowPrint: false });
        spec.actionsNode = h('a', { class: 'ios-nav-link', href: profile.resume.view, target: '_blank', rel: 'noopener' }, 'PDF');
        spec.build = (body) => { body.classList.add('is-app'); body.append(view.el); return null; };
        break;
      default: return;
    }
    const s = push(spec, { from, record: shouldRecord });
    s.view = view;
    s.destroy = () => view?.destroy?.();
    if (question && view?.ask) view.ask(question);
  }

  // ---------- Home screen ----------

  const appButton = (id, withLabel = true) => h('button', {
    class: 'ios-app', type: 'button', 'aria-label': LABELS[id] || APPS[id]?.label,
    onClick: (e) => openApp(id, { from: e.currentTarget.querySelector('.app-icon') || e.currentTarget }),
  }, fromHtml(appIconHtml(id === 'achievements' ? 'achievements' : id, { size: 60, photo: profile.photo.src })), withLabel ? h('span', { 'aria-hidden': 'true' }, LABELS[id]) : null);

  home.append(
    h('section', { class: 'ios-widget ios-profile-card', 'aria-label': 'Profile' },
      h('button', { class: 'ios-profile', type: 'button', onClick: (e) => openApp('about', { from: e.currentTarget }) },
        photo(64, 'wp-photo'),
        h('span', { class: 'ios-profile-text' },
          h('strong', {}, profile.name),
          h('span', {}, `${profile.role} at ${profile.company}`),
          h('small', {}, icon('pin', 12), profile.location),
        ),
      ),
      h('div', { class: 'ios-profile-links' }, profile.links.map((l) => h('a', {
        class: 'ios-link-pill', href: l.url, target: '_blank', rel: 'noopener', 'aria-label': l.label,
      }, icon(l.id, 14), h('span', { class: 'ios-link-label' }, l.label)))),
    ),
    h('ul', { class: 'ios-grid', 'aria-label': 'Apps' }, GRID.map((id) => h('li', {}, appButton(id)))),
    h('button', { class: 'ios-widget ios-fit', type: 'button', onClick: (e) => openApp('fit', { from: e.currentTarget }) },
      h('span', { class: 'widget-label' }, icon('target', 13), 'Hiring?'),
      h('strong', {}, "Check a role against Sai's experience"),
      h('span', {}, 'Paste a job description to see matches and gaps.'),
    ),
    h('p', { class: 'ios-home-foot' }, h('button', { type: 'button', onClick: () => enterSimple() }, 'Simple page')),
  );
  dock.append(...DOCK.map((id) => appButton(id, false)));

  // ---------- Search ----------

  const os = {
    isMac: false,
    go: (token) => go(token),
    openProject: (slug) => openProject(slug),
    openSection: (id) => actions.openSection(id),
    filterSkill: (id) => actions.filterSkill(id),
    openFolio: ({ question, tab } = {}) => actions.openFolio({ question, tab }),
    copy,
    toggleTheme,
    enterSimple,
    openReadme: () => {},
  };
  const spotlight = createSpotlight(os);

  // ---------- Routing ----------

  function go(token = '', { fromHistory = false } = {}) {
    if (token === 'simple') return enterSimple();
    document.title = titleFor(token);
    if (!token) {
      if (stack.length) goHome();
      return undefined;
    }
    if (fromHistory) {
      const idx = stack.findIndex((s) => s.token === token);
      if (idx >= 0) {
        while (stack.length > idx + 1) pop({ fromHistory: true });
        return undefined;
      }
    }
    const p = getProject(token);
    if (p) {
      openProject(p.slug, { record: !fromHistory });
      return undefined;
    }
    const app = TOKEN_TO_APP[token];
    if (!app) return goHome();
    openApp(app, { record: !fromHistory });
    return undefined;
  }

  return { go, isMac: false };
}
