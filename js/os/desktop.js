// The macOS-style desktop: menu bar, Dock, widgets, desktop icons, windows and system UI.

import { h, fromHtml, copyText, storage, formatClock, formatMenuDate, isTypingTarget, reducedMotion, canPrint } from '../lib/dom.js';
import { appIconHtml, folderSvg, docSvg, textDocSvg, APPS } from '../lib/icons.js';
import { coverHtml } from '../lib/covers.js';
import { mountWallpaper } from '../lib/wallpaper.js';
import { settings, applySettings, toggleTheme, isDark, ACCENTS, WALLPAPERS } from '../lib/settings.js';
import { router } from '../lib/router.js';
import { titleFor } from '../lib/titles.js';
import {
  site, profile, projects, sections, getProject, experiencePhrase, education,
} from '../content.js';
import { icon, photo, chipList } from '../lib/sections.js';
import { WindowManager } from './wm.js';
import { playHello } from '../lib/hello.js';
import { showMenu, showPopover, closeMenus } from './menu.js';
import { createFinder } from '../apps/finder.js';
import { createQuickLook } from '../apps/quicklook.js';
import { createSpotlight } from '../apps/spotlight.js';
import { createTimeMachine } from '../apps/timemachine.js';
import { createTerminalView } from '../apps/terminal.js';
import { createFolioView, askFolio } from '../apps/folio.js';
import { createMailView } from '../apps/mail.js';
import { createResumeView } from '../apps/resume.js';

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? '⌘' : 'Ctrl+';
const SEEN_KEY = 'saios.seen';

export function mountDesktop(root, { enterSimple }) {
  root.className = 'os';
  root.dataset.shell = 'mac';
  root.replaceChildren();

  const wallpaper = mountWallpaper();
  const desktop = h('main', { class: 'desktop', id: 'desktop', tabindex: '-1', 'aria-label': 'Desktop' });
  const windowsLayer = h('div', { class: 'windows' });
  const menubar = h('header', { class: 'menubar' });
  const dockWrap = h('nav', { class: 'dock-wrap', 'aria-label': 'Dock' });
  const hudEl = h('div', { class: 'hud', role: 'status', 'aria-live': 'polite' });
  root.append(wallpaper, desktop, windowsLayer, menubar, dockWrap, hudEl);

  const seen = storage.get(SEEN_KEY, {}) || {};
  const markSeen = (key) => {
    seen[key] = true;
    storage.set(SEEN_KEY, seen);
  };

  // ---------- Services ----------

  const dockItems = new Map();
  const area = () => ({ left: 0, top: 30, right: window.innerWidth, bottom: window.innerHeight - 92 });
  const wm = new WindowManager({
    layer: windowsLayer,
    area,
    dockTarget: (app) => (dockItems.get(app) || dockItems.get('finder'))?.getBoundingClientRect() || null,
    onChange: () => updateChrome(),
  });

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

  // A notification as it sits in Notification Center. Nothing pops up on its own.
  function noteCard({ app, title, body, actions: buttons = [] }, close) {
    return h('article', { class: 'note-card', 'aria-label': title },
      fromHtml(appIconHtml(app, { size: 38 })),
      h('div', {},
        h('div', { class: 'note-head' }, h('strong', {}, APPS[app]?.label || app)),
        h('p', { class: 'note-title' }, title),
        h('p', { class: 'note-body' }, body),
        buttons.length ? h('div', { class: 'note-actions' }, buttons.map((b) => h('button', {
          class: b.primary ? 'btn btn-primary' : 'btn', type: 'button', onClick: () => { close(); b.run(); },
        }, b.label))) : null,
      ),
    );
  }

  function contextMenu(e, items) {
    showMenu({ items, x: e.clientX, y: e.clientY, label: 'Context menu' });
  }

  // ---------- Routing ----------

  function record(token, opts) {
    router.record(token, opts);
    document.title = titleFor(token);
  }

  // Leave a transient location (Quick Look, Time Machine): step back if we added the entry.
  function leave(token) {
    if (router.current !== token) return;
    const fallback = finder.win ? finder.token() : '';
    if (router.canGoBack()) router.back();
    else record(fallback, { replace: true });
  }

  function leaveProject(slug) {
    leave(slug);
  }

  function go(token = '', { fromHistory = false } = {}) {
    token = token || '';
    if (!fromHistory) closeMenus();
    if (token === 'simple') {
      enterSimple();
      return;
    }
    if (fromHistory) {
      if (quickLook.isOpen && quickLook.current !== token) quickLook.close({ fromHistory: true });
      if (timeMachine.isOpen && token !== 'time-machine') timeMachine.close({ fromHistory: true });
    }
    const project = getProject(token);
    if (project) {
      if (!finder.win) finder.open('projects', { record: false });
      quickLook.open(project.slug);
      if (!fromHistory) record(token);
      document.title = titleFor(token);
      return;
    }
    const section = sections.find((s) => s.id === token);
    // Coming back from a Quick Look or Time Machine entry shouldn't reset the Finder view.
    const alreadyThere = fromHistory && finder.win && finder.token() === (section ? section.id : token);
    if (section) {
      if (!alreadyThere) finder.open(section.id, { record: !fromHistory });
    } else {
      switch (token) {
        case 'resume': openPreview(); break;
        case 'folio': openFolio(); break;
        case 'fit': openFolio({ tab: 'fit' }); break;
        case 'terminal': openTerminal(); break;
        case 'mail': openMail(); break;
        case 'time-machine': timeMachine.open(); break;
        default:
          if (!alreadyThere) finder.open('root', { record: false });
          token = '';
      }
      if (!fromHistory) record(token);
    }
    document.title = titleFor(token);
  }

  // When a window that owns the current URL closes, point the URL at what's left.
  function released(...tokens) {
    if (!tokens.includes(router.current)) return;
    record(finder?.win ? finder.token() : '', { replace: true });
  }

  // ---------- App windows ----------

  const singletons = {};

  function focusExisting(app) {
    const win = singletons[app];
    if (!win) return null;
    if (win.state === 'minimized') wm.restore(win);
    else wm.focus(win);
    return win;
  }

  function openFolio({ tab = 'chat', question = null } = {}) {
    let win = focusExisting('folio');
    if (!win) {
      bounce('folio');
      const view = createFolioView(os.actions, { tab });
      const a = area();
      win = wm.create({
        app: 'folio', title: 'Folio', titlebar: false, body: view.el, width: 440, height: 640, minWidth: 360, minHeight: 420,
        x: a.right - 440 - 24, y: a.top + 14,
        onClose: () => { view.destroy(); delete singletons.folio; released('folio', 'fit'); },
      });
      win.view = view;
      singletons.folio = win;
      if (!seen.folioIntro) markSeen('folioIntro');
      setBadge('folio', 0);
    }
    win.view.setTab(tab);
    if (question) win.view.ask(question);
    return win;
  }

  function openTerminal() {
    let win = focusExisting('terminal');
    if (!win) {
      const view = createTerminalView({
        ...os.actions,
        close: () => wm.close(win),
        ask: (q) => askFolio(q),
        setTheme: (v) => settings.set('theme', v),
        setWallpaper: (v) => settings.set('wallpaper', v),
        enterSimple,
        openTimeMachine: () => go('time-machine'),
      });
      bounce('terminal');
      win = wm.create({ app: 'terminal', title: 'sai — zsh — 80×24', label: 'Terminal', body: view.el, width: 740, height: 460, minWidth: 420, minHeight: 240, onClose: () => { delete singletons.terminal; released('terminal'); } });
      win.view = view;
      singletons.terminal = win;
    }
    win.view.focus();
    return win;
  }

  function openMail(prefill = {}) {
    let win = focusExisting('mail');
    if (!win) {
      bounce('mail');
      const view = createMailView({ ...os.actions, hud }, prefill);
      win = wm.create({
        app: 'mail', title: 'New Message', label: 'Mail', body: view.el, titlebarActions: view.sendButton,
        width: 640, height: 540, minWidth: 420, minHeight: 360, center: true, onClose: () => { delete singletons.mail; released('mail'); },
      });
      win.view = view;
      singletons.mail = win;
    } else win.view.setPrefill(prefill);
    win.view.focus();
    return win;
  }

  function openPreview() {
    let win = focusExisting('preview');
    if (!win) {
      bounce('preview');
      const view = createResumeView({ allowPrint: canPrint(site.productionHosts) });
      const a = area();
      win = wm.create({
        app: 'preview', title: profile.resume.fileName, label: 'Resume', body: view.el, titlebarActions: view.toolbar,
        width: Math.min(900, a.right - 80), height: a.bottom - a.top - 30, minWidth: 460, minHeight: 360, center: true,
        onClose: () => { delete singletons.preview; released('resume'); }, onResize: () => view.fitWidth(),
      });
      win.view = view;
      singletons.preview = win;
    }
    return win;
  }

  function openAbout() {
    if (focusExisting('about')) return;
    const edu = education[0];
    const body = h('div', { class: 'about-sai' },
      photo(110),
      h('h2', {}, profile.name),
      h('p', { class: 'as-sub' }, `${profile.role} · ${site.osName} ${site.osVersion}`),
      h('dl', { class: 'about-specs' },
        h('dt', {}, 'Chip'), h('dd', {}, 'Full-stack: React, Flask, Spring Boot'),
        h('dt', {}, 'Memory'), h('dd', {}, `${experiencePhrase()} in production`),
        h('dt', {}, 'Startup disk'), h('dd', {}, `${edu.degree.replace('Master of ', 'M.S. ')}, ${edu.short}`),
        h('dt', {}, 'Location'), h('dd', {}, profile.location),
        h('dt', {}, 'Serial number'), h('dd', {}, 'S41-PR4-54D'),
      ),
      h('div', { class: 'doc-row' },
        h('button', { class: 'btn', type: 'button', onClick: () => { wm.close(win); go('about'); } }, 'More Info…'),
        h('button', { class: 'btn btn-primary', type: 'button', onClick: () => { wm.close(win); go('resume'); } }, 'Resume'),
      ),
      h('p', { class: 'about-foot' }, `™ and © ${new Date().getFullYear()} ${profile.name}. Made with vanilla JavaScript.`),
    );
    const win = wm.create({ app: 'about', title: 'About Sai', titlebar: false, body, width: 420, height: 470, resizable: false, zoomable: false, minimizable: false, center: true, onClose: () => delete singletons.about });
    singletons.about = win;
  }

  function openReadme() {
    if (focusExisting('readme')) return;
    const k = (...keys) => h('dt', {}, keys.map((key) => h('span', { class: 'kbd' }, key)));
    const body = h('div', { class: 'readme scroll' },
      h('h2', {}, `Welcome to ${site.osName}`),
      h('p', {}, `This is ${profile.nickname}'s portfolio, built as a small operating system. Everything is also on one simple page if you prefer.`),
      h('h3', {}, 'Good places to start'),
      h('ul', {},
        h('li', {}, 'Projects in Finder, with Quick Look previews'),
        h('li', {}, 'Fit Check in Folio: paste a job description to compare it with his experience'),
        h('li', {}, 'Time Machine in the Dock for his career history'),
        h('li', {}, 'Terminal, if you like typing: try neofetch or git log'),
      ),
      h('h3', {}, 'Keyboard shortcuts'),
      h('dl', { class: 'shortcut-table' },
        k(IS_MAC ? '⌘' : 'Ctrl', 'K'), h('dd', {}, 'Search everything'),
        k('/'), h('dd', {}, 'Search everything'),
        k('Ctrl', '`'), h('dd', {}, 'Open Terminal'),
        k('Space'), h('dd', {}, 'Quick Look the selected project'),
        k('←', '→'), h('dd', {}, 'Previous or next project in Quick Look'),
        k('?'), h('dd', {}, 'Show this window'),
        k('esc'), h('dd', {}, 'Close menus, Spotlight and Quick Look'),
      ),
      h('h3', {}, 'Prefer something simpler?'),
      h('p', {}, h('button', { class: 'btn', type: 'button', onClick: () => enterSimple() }, icon('layout', 15), 'Open the simple page')),
    );
    const win = wm.create({ app: 'readme', title: 'Read Me.txt', label: 'Read Me', body, width: 560, height: 560, minWidth: 380, minHeight: 300, center: true, onClose: () => delete singletons.readme });
    singletons.readme = win;
  }

  const TRASH = [
    ['jquery-1.4.2.min.js', 'JavaScript'], ['internet-explorer-support.css', 'Stylesheet'], ['!important.css', 'Stylesheet'],
    ["console.log('here').js", 'JavaScript'], ['TODO-final-FINAL-v3.txt', 'Text'], ['tabs-vs-spaces-debate.md', 'Markdown'],
  ];
  let trashEmpty = false;
  function openTrash() {
    if (focusExisting('trash')) return;
    const list = h('ul', { class: 'trash-list scroll' });
    const note = h('span', {});
    const renderList = () => {
      list.replaceChildren(...(trashEmpty ? [h('li', {}, h('span'), h('span', { class: 'skill-note' }, 'Trash is empty.'), h('span'))] : TRASH.map(([name, kind]) => h('li', {}, h('span', { html: textDocSvg({ size: 22 }) }), h('span', {}, name), h('small', {}, kind)))));
      note.textContent = trashEmpty ? '0 items' : `${TRASH.length} items`;
    };
    const emptyBtn = h('button', {
      class: 'btn', type: 'button', onClick: () => {
        if (trashEmpty) return;
        list.querySelectorAll('li').forEach((li, i) => setTimeout(() => li.classList.add('is-gone'), i * 70));
        setTimeout(() => { trashEmpty = true; renderList(); hud('Trash emptied. Technical debt: 0 (for now).', 'trash'); }, TRASH.length * 70 + 300);
      },
    }, 'Empty Trash');
    renderList();
    const body = h('div', { class: 'trash' }, list, h('div', { class: 'trash-foot' }, note, emptyBtn));
    const win = wm.create({ app: 'trash', title: 'Trash', body, width: 560, height: 400, minWidth: 360, minHeight: 260, center: true, onClose: () => delete singletons.trash });
    singletons.trash = win;
  }

  function getInfo(slug) {
    const p = getProject(slug);
    if (!p) return;
    const body = h('div', { class: 'info-panel scroll' },
      fromHtml(coverHtml(p)),
      h('h3', {}, p.name),
      h('dl', {},
        h('dt', {}, 'Kind:'), h('dd', {}, p.kind),
        h('dt', {}, 'Year:'), h('dd', {}, p.year ? String(p.year) : 'Not listed'),
        h('dt', {}, 'Where:'), h('dd', {}, 'Portfolio › Projects'),
        p.team ? [h('dt', {}, 'Team:'), h('dd', {}, p.team)] : null,
        h('dt', {}, 'Links:'), h('dd', {}, p.links.length ? p.links.map((l, i) => [i ? ', ' : '', h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label)]) : 'Private work'),
      ),
      h('div', { class: 'fit-group' }, h('h5', {}, 'Tags'), chipList(p.stack, { actions: os.actions })),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => go(p.slug) }, icon('eye', 14), 'Quick Look'),
    );
    wm.create({ app: 'info', title: `${p.name} Info`, body, width: 320, height: 540, minWidth: 280, minHeight: 320, zoomable: false, titlebar: false });
  }

  // ---------- Shared actions for app contents ----------

  // Assigned right after `os` exists; everything above only calls them later.
  let finder;
  let quickLook;
  let spotlight;
  let timeMachine;

  const os = {
    isMac: true,
    wm,
    area,
    siteUrl: site.url,
    record,
    leave,
    leaveProject,
    go,
    copy,
    hud,
    contextMenu,
    getInfo,
    enterSimple,
    toggleTheme,
    openReadme,
    openSection: (id, opts = {}) => {
      if (id === 'root') finder.open('root');
      else finder.open(id, opts);
      document.title = titleFor(id === 'root' ? '' : id);
    },
    openProject: (slug, { list } = {}) => {
      if (!finder.win) finder.open('projects', { record: false });
      quickLook.open(slug, { list });
      record(slug);
    },
    filterSkill: (id) => {
      quickLook.close({ fromHistory: true });
      finder.open('projects', { filter: id });
    },
    openFolio: ({ question, tab } = {}) => {
      openFolio({ question, tab });
      record(tab === 'fit' ? 'fit' : 'folio');
    },
  };

  os.actions = {
    openProject: os.openProject,
    openSection: os.openSection,
    filterSkill: os.filterSkill,
    openResume: () => go('resume'),
    openMail: (prefill) => { openMail(prefill); record('mail'); },
    openFit: () => go('fit'),
    openFolio: os.openFolio,
    openTerminal: () => go('terminal'),
    openTimeMachine: () => go('time-machine'),
    copy,
    hud,
  };

  finder = createFinder(os);
  quickLook = createQuickLook(os);
  spotlight = createSpotlight(os);
  timeMachine = createTimeMachine(os);

  // ---------- Menu bar ----------

  const appLabel = h('span');
  const clock = h('span', { class: 'mb-clock-text' });
  const menuDefs = [
    { id: 'logo', label: 'SaiOS menu', node: h('span', { class: 'monogram', 'aria-hidden': 'true' }, 'S'), cls: 'mb-logo', items: logoMenu },
    { id: 'app', label: 'Application menu', node: appLabel, cls: 'mb-item--app', items: appMenu },
    { id: 'file', label: 'File', items: fileMenu },
    { id: 'edit', label: 'Edit', items: editMenu },
    { id: 'view', label: 'View', items: viewMenu },
    { id: 'go', label: 'Go', items: goMenu },
    { id: 'window', label: 'Window', items: windowMenu },
    { id: 'help', label: 'Help', items: helpMenu },
  ];
  const topButtons = menuDefs.map((def, i) => {
    const btn = h('button', {
      class: `mb-item ${def.cls || ''}`.trim(), type: 'button', role: 'menuitem', 'aria-haspopup': 'menu', 'aria-expanded': 'false',
      'aria-label': def.node ? def.label : null, tabindex: i === 0 ? '0' : '-1',
    }, def.node || def.label);
    btn.addEventListener('click', () => (openIndex === i ? closeTop() : openTop(i)));
    btn.addEventListener('pointerenter', () => { if (openIndex !== -1 && openIndex !== i) openTop(i, { focusFirst: false }); });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + topButtons.length) % topButtons.length;
        topButtons[next].focus();
      } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTop(i);
      }
    });
    return btn;
  });
  let openIndex = -1;
  function openTop(i, { focusFirst = true } = {}) {
    const def = menuDefs[i];
    topButtons.forEach((b, idx) => {
      b.setAttribute('aria-expanded', String(idx === i));
      b.tabIndex = idx === i ? 0 : -1;
    });
    openIndex = i;
    const menu = showMenu({
      items: def.items(), anchor: topButtons[i], label: def.label, focusFirst,
      onClose: () => {
        topButtons[i].setAttribute('aria-expanded', 'false');
        if (openIndex === i) openIndex = -1;
      },
    });
    menu.setArrowHandler((dir) => {
      const next = (i + dir + menuDefs.length) % menuDefs.length;
      openTop(next);
    });
  }
  function closeTop() {
    closeMenus();
    openIndex = -1;
  }

  const folioBtn = h('button', { class: 'mb-item mb-status', type: 'button', 'aria-label': 'Ask Folio', title: 'Ask Folio', onClick: () => go('folio') }, icon('sparkle', 16));
  const ccBtn = h('button', { class: 'mb-item mb-status', type: 'button', 'aria-label': 'Control Center', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', title: 'Control Center', onClick: () => openControlCenter() }, icon('toggles', 16));
  const spotBtn = h('button', { class: 'mb-item mb-status', type: 'button', 'aria-label': `Search (${MOD}K)`, title: `Search (${MOD}K)`, onClick: () => spotlight.open() }, icon('search', 15));
  const clockBtn = h('button', { class: 'mb-item mb-clock', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', onClick: () => openNotificationCenter() }, clock);
  menubar.append(
    h('div', { class: 'menubar-group', role: 'menubar', 'aria-label': 'Menu bar' }, topButtons),
    h('div', { class: 'menubar-group menubar-group--right' }, folioBtn, ccBtn, spotBtn, clockBtn),
  );

  function tick() {
    const now = new Date();
    clock.textContent = formatMenuDate(now);
    clockBtn.setAttribute('aria-label', `${now.toLocaleString()}. Show Notification Center`);
  }
  tick();
  setInterval(tick, 15000);

  function focusedApp() {
    const w = wm.focused;
    if (!w) return 'Finder';
    return w.opts.label || APPS[w.app]?.label || w.title;
  }

  function logoMenu() {
    return [
      { label: 'About Sai', action: openAbout },
      { type: 'separator' },
      { label: 'Control Center…', action: () => openControlCenter() },
      { label: 'Read Me', action: openReadme },
      { label: 'Simple Page', action: enterSimple },
      { type: 'separator' },
      { label: 'Lock Screen', action: lock },
      { label: 'Restart…', action: restart },
      { label: 'Shut Down…', action: shutdown },
    ];
  }

  function appMenu() {
    const w = wm.focused;
    const name = focusedApp();
    return [
      { label: `Hide ${name}`, disabled: !w || w.opts.minimizable === false, action: () => w && wm.minimize(w) },
      { label: `Quit ${name}`, disabled: !w, action: () => w && wm.close(w) },
      { type: 'separator' },
      { label: 'Keyboard Shortcuts', shortcut: '?', action: openReadme },
    ];
  }

  function fileMenu() {
    const w = wm.focused;
    return [
      { label: 'New Finder Window', action: () => go('') },
      { label: 'New Terminal Window', shortcut: 'Ctrl+`', action: () => go('terminal') },
      { label: 'New Message', action: () => go('mail') },
      { type: 'separator' },
      { label: 'Open Resume', action: () => go('resume') },
      { type: 'separator' },
      { label: 'Close Window', disabled: !w, action: () => w && wm.close(w) },
    ];
  }

  function editMenu() {
    return [
      { label: 'Copy Email Address', action: () => copy(profile.email, 'Email address copied') },
      { label: 'Copy Link to This Page', action: () => copy(window.location.href.startsWith('http') ? window.location.href : site.url, 'Link copied') },
      { type: 'separator' },
      { label: 'Find…', shortcut: `${MOD}K`, action: () => spotlight.open() },
    ];
  }

  function viewMenu() {
    const inProjects = finder.win && finder.loc === 'projects';
    const mode = finder.view;
    const hasFinder = Boolean(finder.win);
    return [
      { label: 'as Icons', checked: hasFinder && mode === 'icons', radio: true, disabled: !hasFinder, action: () => finder.setView('icons') },
      { label: 'as List', checked: hasFinder && mode === 'list', radio: true, disabled: !hasFinder, action: () => finder.setView('list') },
      { label: 'as Gallery', checked: hasFinder && mode === 'gallery', radio: true, disabled: !inProjects, action: () => finder.setView('gallery') },
      { type: 'separator' },
      { label: 'Dark Mode', checked: isDark(), action: toggleTheme },
      { label: document.fullscreenElement ? 'Exit Full Screen' : 'Enter Full Screen', action: toggleFullscreen },
      { type: 'separator' },
      { label: 'Simple Page', action: enterSimple },
    ];
  }

  function goMenu() {
    return [
      { label: 'Back', shortcut: `${MOD}[`, disabled: !finder.canBack, action: () => finder.back() },
      { label: 'Forward', shortcut: `${MOD}]`, disabled: !finder.canForward, action: () => finder.forward() },
      { type: 'separator' },
      { label: 'Portfolio', action: () => go('') },
      ...sections.map((s) => ({ label: s.label, action: () => go(s.id) })),
      { type: 'separator' },
      { label: 'Time Machine', action: () => go('time-machine') },
    ];
  }

  function windowMenu() {
    const w = wm.focused;
    const list = wm.windows.map((win) => ({
      label: win.title, checked: win === w, radio: true,
      action: () => (win.state === 'minimized' ? wm.restore(win) : wm.focus(win)),
    }));
    return [
      { label: 'Minimize', disabled: !w || w.opts.minimizable === false, action: () => w && wm.minimize(w) },
      { label: 'Zoom', disabled: !w || w.opts.zoomable === false, action: () => w && wm.zoom(w) },
      { type: 'separator' },
      ...(list.length ? list : [{ label: 'No windows', disabled: true }]),
      { type: 'separator' },
      { label: 'Bring All to Front', disabled: !wm.windows.length, action: () => wm.windows.forEach((win) => (win.state === 'minimized' ? wm.restore(win) : wm.focus(win))) },
    ];
  }

  function helpMenu() {
    return [
      { label: 'Search…', shortcut: `${MOD}K`, action: () => spotlight.open() },
      { label: 'Ask Folio', action: () => go('folio') },
      { label: 'Keyboard Shortcuts', shortcut: '?', action: openReadme },
      { type: 'separator' },
      { label: 'Simple Page', action: enterSimple },
    ];
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => hud('Full screen isn’t available here', 'info'));
    } catch {
      hud('Full screen isn’t available here', 'info');
    }
  }

  // ---------- Control Center & clock ----------

  function openControlCenter() {
    const render = () => {
      const theme = settings.get('theme');
      const radio = (group, value, label, current, onPick, extra = {}) => h('button', {
        type: 'button', role: 'radio', 'aria-checked': String(current === value), 'aria-label': extra.aria || label, onClick: () => { onPick(value); rerender(); },
        ...extra.attrs,
      }, extra.content !== undefined ? extra.content : label);
      return h('div', { class: 'cc' },
        h('div', { class: 'cc-tile' },
          h('div', { class: 'cc-title' }, 'Appearance'),
          h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Appearance' },
            ['light', 'dark', 'auto'].map((v) => radio('theme', v, v === 'auto' ? 'Auto' : v[0].toUpperCase() + v.slice(1), theme, (x) => settings.set('theme', x)))),
          h('div', { class: 'cc-title' }, 'Accent color'),
          h('div', { class: 'cc-swatches', role: 'radiogroup', 'aria-label': 'Accent color' },
            ACCENTS.map((a) => radio('accent', a.id, a.label, settings.get('accent'), (x) => settings.set('accent', x), {
              attrs: { class: 'cc-swatch', style: `--sw:${a.color}`, title: a.label }, content: settings.get('accent') === a.id ? icon('check', 12) : '',
            }))),
        ),
        h('div', { class: 'cc-tile' },
          h('div', { class: 'cc-title' }, 'Wallpaper'),
          h('div', { class: 'cc-walls', role: 'radiogroup', 'aria-label': 'Wallpaper' },
            WALLPAPERS.map((w) => radio('wall', w.id, w.label, settings.get('wallpaper'), (x) => settings.set('wallpaper', x), {
              attrs: { class: 'cc-wall' },
              content: [h('span', { class: `cc-wall-thumb${w.id === 'dynamic' ? ' cc-wall-thumb--dynamic' : ''}`, 'data-palette': w.id === 'dynamic' ? null : w.id }), w.label],
            }))),
        ),
        h('div', { class: 'cc-tile' },
          toggleRow('Reduce motion', 'Fewer animations', settings.get('motion') === 'reduced', () => { settings.set('motion', settings.get('motion') === 'reduced' ? 'auto' : 'reduced'); rerender(); }, 'refresh'),
          toggleRow('Reduce transparency', 'Solid backgrounds', settings.get('transparency') === 'reduced', () => { settings.set('transparency', settings.get('transparency') === 'reduced' ? 'auto' : 'reduced'); rerender(); }, 'sidebar'),
          h('button', { class: 'cc-toggle', type: 'button', onClick: () => { pop.close(); enterSimple(); } }, h('span', { class: 'cc-dot' }, icon('layout', 15)), h('span', {}, 'Simple page', h('small', {}, 'Everything on one printable page'))),
        ),
      );
    };
    const toggleRow = (label, sub, on, onClick, iconName) => h('button', { class: 'cc-toggle', type: 'button', role: 'switch', 'aria-checked': String(on), onClick },
      h('span', { class: 'cc-dot' }, icon(iconName, 15)), h('span', {}, label, h('small', {}, sub)));
    const pop = showPopover({ anchor: ccBtn, content: render(), label: 'Control Center', align: 'right' });
    function rerender() {
      const active = document.activeElement;
      const key = active && pop.el.contains(active) ? `${active.getAttribute('role')}|${active.getAttribute('aria-label') || active.textContent}` : null;
      pop.el.replaceChildren(render());
      if (!key) return;
      const match = [...pop.el.querySelectorAll('button')].find((b) => `${b.getAttribute('role')}|${b.getAttribute('aria-label') || b.textContent}` === key);
      match?.focus({ preventScroll: true });
    }
  }

  function openNotificationCenter() {
    let pop = null;
    const close = () => pop?.close();
    const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
    pop = showPopover({
      anchor: clockBtn, label: 'Notification Center', align: 'right', className: 'nc-pop',
      content: [
        h('p', { class: 'nc-date' }, today),
        noteCard({
          app: 'folio', title: 'Hi, I’m Folio', body: "Ask me about Sai's work, or check a job description against his experience.",
          actions: [{ label: 'Fit Check', primary: true, run: () => go('fit') }, { label: 'Ask a question', run: () => go('folio') }],
        }, close),
        noteCard({
          app: 'finder', title: 'Search everything', body: `Press ${MOD}K or / to search every project, role and skill.`,
          actions: [{ label: 'Search', run: () => spotlight.open() }],
        }, close),
      ],
    });
  }

  // ---------- Dock ----------

  const dock = h('div', { class: 'dock', role: 'toolbar', 'aria-label': 'Applications' });
  const dockDefs = [
    { id: 'finder', label: 'Finder', run: () => { const w = finder.win; if (!w) go(''); else if (w.state === 'minimized') wm.restore(w); else wm.focus(w); } },
    { id: 'folio', label: 'Folio', run: () => go('folio') },
    { id: 'terminal', label: 'Terminal', run: () => go('terminal') },
    { id: 'timemachine', label: 'Time Machine', run: () => go('time-machine') },
    { id: 'mail', label: 'Mail', run: () => go('mail') },
    { id: 'preview', label: 'Resume', run: () => go('resume') },
    { type: 'sep' },
    { id: 'projects', label: 'Projects', icon: 'stack', run: (btn) => openStack(btn) },
    { id: 'trash', label: 'Trash', run: () => openTrash() },
  ];
  dockDefs.forEach((d) => {
    if (d.type === 'sep') {
      dock.append(h('div', { class: 'dock-sep', role: 'separator' }));
      return;
    }
    const btn = h('button', { class: 'dock-item', type: 'button', 'aria-label': d.label, 'data-app': d.id },
      fromHtml(appIconHtml(d.icon || d.id, { size: 54 })),
      h('span', { class: 'dock-tip', 'aria-hidden': 'true' }, d.label));
    btn.addEventListener('click', () => d.run(btn));
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const running = wm.windows.filter((w) => w.app === d.id);
      contextMenu(e, [
        { label: 'Open', action: () => d.run(btn) },
        running.length ? { label: 'Quit', action: () => running.forEach((w) => wm.close(w)) } : null,
      ]);
    });
    if (d.id === 'finder') btn.classList.add('is-running');
    dockItems.set(d.id, btn);
    dock.append(btn);
  });
  dockWrap.append(dock);

  // Magnification: icons near the pointer grow, like the real Dock.
  const BASE = 54;
  dock.addEventListener('pointermove', (e) => {
    if (reducedMotion() || e.pointerType !== 'mouse') return;
    dock.classList.add('is-magnifying');
    dockItems.forEach((btn) => {
      const r = btn.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const scale = 1 + 0.5 * Math.max(0, Math.cos(Math.min(d, 150) / 150 * (Math.PI / 2)));
      btn.style.setProperty('--s', `${Math.round(BASE * scale)}px`);
    });
  });
  dock.addEventListener('pointerleave', () => {
    dock.classList.remove('is-magnifying');
    dockItems.forEach((btn) => btn.style.setProperty('--s', `${BASE}px`));
  });

  function setBadge(app, count) {
    const btn = dockItems.get(app);
    if (!btn) return;
    btn.querySelector('.dock-badge')?.remove();
    const label = APPS[app]?.label || app;
    if (count > 0) {
      btn.append(h('span', { class: 'dock-badge', 'aria-hidden': 'true' }, String(count)));
      btn.setAttribute('aria-label', `${label}, ${count} new message${count > 1 ? 's' : ''}`);
    } else {
      btn.setAttribute('aria-label', label);
    }
  }

  function bounce(app) {
    const btn = dockItems.get(app);
    if (!btn || reducedMotion() || btn.classList.contains('is-running')) return;
    btn.classList.remove('is-bouncing');
    void btn.offsetWidth;
    btn.classList.add('is-bouncing');
    setTimeout(() => btn.classList.remove('is-bouncing'), 1300);
  }

  function openStack(anchor) {
    const pop = showPopover({
      anchor, label: 'Projects', align: 'above', className: 'stack-pop',
      content: [
        h('div', { class: 'stack-grid' }, projects.map((p) => h('button', {
          class: 'stack-item', type: 'button', onClick: () => { pop.close(); os.openProject(p.slug); },
        }, fromHtml(coverHtml(p)), p.name))),
        h('div', { class: 'stack-foot' }, h('button', { class: 'btn', type: 'button', onClick: () => { pop.close(); go('projects'); } }, icon('folder', 14), 'Open in Finder')),
      ],
    });
  }

  function updateChrome() {
    appLabel.textContent = focusedApp();
    const running = new Set(wm.windows.map((w) => w.app));
    dockItems.forEach((btn, id) => btn.classList.toggle('is-running', id === 'finder' || running.has(id)));
  }

  // ---------- Widgets & desktop icons ----------

  const featured = projects.filter((p) => p.featured);
  let featuredAt = 0;
  const fpCover = h('div');
  const fpName = h('h3');
  const fpLine = h('p');
  const renderFeatured = () => {
    const p = featured[featuredAt];
    fpCover.replaceChildren(fromHtml(coverHtml(p)));
    fpName.textContent = p.name;
    fpLine.textContent = p.tagline;
  };
  renderFeatured();

  const widgets = h('div', { class: 'widgets' },
    h('section', { class: 'widget widget-profile', 'aria-label': 'Profile' },
      h('div', { class: 'wp-head' },
        photo(64, 'wp-photo'),
        h('div', {},
          h('h1', { class: 'wp-name' }, profile.name),
          h('p', { class: 'wp-role' }, `${profile.role} at ${profile.company}`),
        ),
      ),
      h('p', { class: 'wp-headline' }, profile.headline),
      h('div', { class: 'wp-actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onClick: () => go('resume') }, icon('doc', 14), 'Resume'),
        h('button', { class: 'btn btn-glass', type: 'button', onClick: () => go('mail') }, icon('mail', 14), 'Contact'),
        h('button', { class: 'btn btn-glass', type: 'button', onClick: () => go('about') }, icon('user', 14), 'About'),
      ),
      h('div', { class: 'wp-foot' },
        h('span', { class: 'wp-meta' }, icon('pin', 13), profile.location),
        h('div', { class: 'wp-links' }, profile.links.map((l) => h('a', {
          class: 'btn btn-glass btn-icon', href: l.url, target: '_blank', rel: 'noopener', 'aria-label': l.label, title: l.label,
        }, icon(l.id, 14)))),
      ),
    ),
    h('button', { class: 'widget widget-fit', type: 'button', onClick: () => go('fit') },
      h('span', { class: 'widget-label' }, icon('target', 13), 'Hiring?'),
      h('h2', { class: 'wf-title' }, "Check a role against Sai's experience"),
      h('p', {}, 'Paste a job description and Folio matches it to his projects and roles, gaps included.'),
      h('span', { class: 'wf-cta' }, 'Open Fit Check', icon('arrow-right', 13)),
    ),
    h('section', { class: 'widget widget-project', 'aria-label': 'Featured project' },
      h('button', { type: 'button', style: 'display:grid;gap:10px;text-align:left', onClick: () => os.openProject(featured[featuredAt].slug, { list: featured.map((p) => p.slug) }), 'aria-label': 'Open featured project' }, fpCover),
      h('div', { class: 'wpj-row' },
        h('div', { class: 'wpj-text' }, fpName, fpLine),
        h('div', { class: 'capsule' },
          h('button', { type: 'button', 'aria-label': 'Previous featured project', onClick: () => { featuredAt = (featuredAt - 1 + featured.length) % featured.length; renderFeatured(); } }, icon('chevron-left', 14)),
          h('button', { type: 'button', 'aria-label': 'Next featured project', onClick: () => { featuredAt = (featuredAt + 1) % featured.length; renderFeatured(); } }, icon('chevron-right', 14)),
        ),
      ),
    ),
  );

  let lastIcon = { label: null, at: 0 };
  const desktopIcon = (label, art, run) => h('button', {
    class: 'desktop-icon', type: 'button',
    onClick: (e) => {
      const now = Date.now();
      desktop.querySelectorAll('.desktop-icon').forEach((b) => b.classList.toggle('is-selected', b === e.currentTarget));
      if (lastIcon.label === label && now - lastIcon.at < 420) return;
      lastIcon = { label, at: now };
      run();
    },
  }, h('span', { class: 'di-art', html: art }), h('span', { class: 'di-label' }, label));

  const icons = h('div', { class: 'desktop-icons', role: 'group', 'aria-label': 'Desktop items' },
    desktopIcon('Resume.pdf', docSvg({ size: 60 }), () => go('resume')),
    desktopIcon('Projects', folderSvg('code', { size: 66 }), () => go('projects')),
    desktopIcon('Read Me', textDocSvg({ size: 60 }), () => openReadme()),
  );
  desktop.append(widgets, icons);

  desktop.addEventListener('pointerdown', (e) => {
    if (e.target === desktop) desktop.querySelectorAll('.desktop-icon').forEach((b) => b.classList.remove('is-selected'));
  });
  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.widget, .desktop-icon')) return;
    e.preventDefault();
    contextMenu(e, [
      { label: 'New Folder', action: () => hud('This desktop is read-only, but nice try', 'folder') },
      { label: 'Get Info', action: openAbout },
      { type: 'separator' },
      { label: 'Change Wallpaper…', action: () => openControlCenter() },
      { label: isDark() ? 'Use Light Mode' : 'Use Dark Mode', action: toggleTheme },
      { type: 'separator' },
      { label: 'Show Read Me', action: openReadme },
      { label: 'Simple Page', action: enterSimple },
    ]);
  });

  // ---------- System screens ----------

  function lock() {
    closeMenus();
    const time = h('p', { class: 'lock-time' });
    const date = h('p', { class: 'lock-date' });
    const update = () => {
      const now = new Date();
      time.textContent = formatClock(now).replace(/\s?[AP]M$/i, '');
      date.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
    };
    update();
    const t = setInterval(update, 10000);
    const screen = h('div', { class: 'system-screen lock', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lock screen', tabindex: '-1' },
      h('div', {}, time, date),
      h('button', { class: 'lock-user', type: 'button', onClick: () => unlock() }, photo(72), h('strong', {}, profile.name), h('span', {}, 'Click or press any key to unlock')),
    );
    const unlock = () => {
      clearInterval(t);
      screen.remove();
      document.removeEventListener('keydown', onKey, true);
    };
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      unlock();
    };
    document.body.append(screen);
    screen.focus();
    setTimeout(() => document.addEventListener('keydown', onKey, true), 300);
  }

  function shutdown() {
    closeMenus();
    const screen = h('div', { class: 'system-screen shutdown', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Shut down', tabindex: '-1' },
      h('div', { class: 'shutdown-inner' },
        h('h2', {}, 'Thanks for stopping by.'),
        h('p', {}, `If you'd like to talk, ${profile.nickname} is at ${profile.email}.`),
        h('div', { class: 'shutdown-actions' },
          h('button', { class: 'btn btn-primary btn-lg', type: 'button', onClick: () => { screen.remove(); go('mail'); } }, icon('mail', 15), 'Get in touch'),
          h('button', { class: 'btn btn-lg', type: 'button', style: 'color:#fff;background:rgba(255,255,255,.14)', onClick: () => screen.remove() }, icon('power', 15), 'Turn on'),
        ),
      ),
    );
    document.body.append(screen);
    screen.focus();
  }

  function restart() {
    closeMenus();
    [...wm.windows].forEach((w) => wm.close(w));
    playHello(() => go(''));
  }

  // ---------- Keyboard ----------

  document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('is-simple')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      spotlight.isOpen ? spotlight.close() : spotlight.open();
      return;
    }
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      spotlight.isOpen ? spotlight.close() : spotlight.open();
      return;
    }
    if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
      e.preventDefault();
      go('terminal');
      return;
    }
    if (isTypingTarget(e.target) || mod || e.altKey) return;
    if (e.key === '?') {
      e.preventDefault();
      openReadme();
    } else if (e.key === '/') {
      e.preventDefault();
      spotlight.open();
    }
  });

  // First visit: a badge on Folio's Dock icon until Folio is opened once. Nothing pops up.
  if (!seen.folioIntro) {
    setTimeout(() => {
      if (!seen.folioIntro && !singletons.folio) setBadge('folio', 1);
    }, 2500);
  }

  // Finder always starts underneath whatever the link points to.
  os.boot = (token = '') => {
    const section = sections.find((s) => s.id === token);
    finder.open(section ? section.id : 'root', { record: false });
    if (token && !section) go(token);
    else document.title = titleFor(token);
  };

  applySettings();
  updateChrome();
  return os;
}
