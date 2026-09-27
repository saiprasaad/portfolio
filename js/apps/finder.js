// Finder: the portfolio as folders. Icon, list and gallery views; sections open as documents.

import { h, fromHtml, storage, openExternal } from '../lib/dom.js';
import { folderSvg, docSvg } from '../lib/icons.js';
import { coverHtml } from '../lib/covers.js';
import { normalize } from '../lib/search.js';
import { sections, projects, tags, skillLabel, profile } from '../content.js';
import {
  icon, renderAbout, renderExperience, renderSkills, renderEducation, renderAchievements, renderContact, chipList, projectLinks,
} from '../lib/sections.js';

const VIEW_KEY = 'saios.finder.views';
const DOCS = {
  about: renderAbout,
  experience: renderExperience,
  skills: renderSkills,
  education: renderEducation,
  achievements: () => renderAchievements('all'),
  contact: renderContact,
};

function sectionLabel(loc) {
  if (loc === 'root') return 'Portfolio';
  return sections.find((s) => s.id === loc)?.label || loc;
}

export function createFinder(os) {
  let win = null;
  let els = {};
  const views = { root: 'icons', projects: 'icons', ...(storage.get(VIEW_KEY, {}) || {}) };
  const state = { loc: 'root', filter: null, query: '', sel: null, sort: { key: 'featured', dir: 1 } };
  let hist = [];
  let hi = -1;
  let lastActivate = 0;
  let lastKey = null;

  const actions = () => os.actions;

  // ---------- Window ----------

  function build() {
    const back = h('button', { type: 'button', 'aria-label': 'Back', onClick: () => go(-1) }, icon('chevron-left', 16));
    const fwd = h('button', { type: 'button', 'aria-label': 'Forward', onClick: () => go(1) }, icon('chevron-right', 16));
    const title = h('div', { class: 'finder-title' }, h('strong'), h('small'));
    const viewBtns = ['icons', 'list', 'gallery'].map((mode) => h('button', {
      type: 'button', 'aria-label': `View as ${mode === 'icons' ? 'icons' : mode}`, 'aria-pressed': 'false', title: `View as ${mode === 'icons' ? 'Icons' : mode === 'list' ? 'List' : 'Gallery'}`,
      'data-mode': mode, onClick: () => setView(mode),
    }, icon(mode === 'icons' ? 'grid' : mode, 15)));
    const search = h('input', { class: 'field', type: 'search', placeholder: 'Search projects', 'aria-label': 'Search projects', autocomplete: 'off' });
    search.addEventListener('input', () => {
      state.query = search.value;
      if (state.loc !== 'projects') navigate('projects', { keepQuery: true });
      else renderContent();
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) {
        e.stopPropagation();
        search.value = '';
        state.query = '';
        renderContent();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusItem(0);
      }
    });
    const toolbar = h('div', { class: 'finder-toolbar', 'data-drag': '' },
      h('div', { class: 'capsule' }, back, fwd),
      title,
      h('div', { class: 'capsule', role: 'group', 'aria-label': 'View' }, viewBtns),
      h('div', { class: 'search-field finder-search' }, icon('search', 14), search),
    );
    const content = h('div', { class: 'finder-content scroll', role: 'region', 'aria-label': 'Folder contents' });
    content.addEventListener('keydown', onKey);
    content.addEventListener('contextmenu', (e) => {
      if (e.target.closest('[data-key]') || e.target.closest('.doc')) return;
      e.preventDefault();
      os.contextMenu(e, backgroundMenu());
    });
    const status = h('div', { class: 'finder-status' });
    const sidebar = renderSidebar();
    const root = h('div', { class: 'finder' }, sidebar, h('div', { class: 'finder-main' }, toolbar, content, status));
    els = { back, fwd, title, viewBtns, search, content, status, sidebar, root };
    // Leave room for the widgets on the left (and the desktop icons on wide screens).
    const a = os.area();
    const withWidgets = a.right >= 1000;
    const right = a.right >= 1240 ? 128 : 16;
    const width = withWidgets ? Math.min(980, a.right - 364 - right) : Math.min(900, a.right - a.left - 48);
    const height = Math.min(660, a.bottom - a.top - 36);
    const x = withWidgets ? 364 : (a.right - width) / 2;
    win = os.wm.create({
      app: 'finder', title: 'Portfolio', label: 'Files', titlebar: false, body: root,
      width, height, minWidth: 460, minHeight: 320, x, y: a.top + 22,
      onClose: () => { win = null; },
      onResize: (b) => {
        root.classList.toggle('is-narrow', b.width < 560);
        root.classList.toggle('is-compact', b.width >= 560 && b.width < 720);
      },
    });
  }

  function renderSidebar() {
    const item = (loc, label, iconName, extra = {}) => h('button', {
      class: 'fs-item', type: 'button', 'data-loc': loc,
      onClick: () => (loc === 'resume' ? os.go('resume') : navigate(loc)), ...extra,
    }, icon(iconName, 16), label);
    return h('nav', { class: 'finder-sidebar', 'aria-label': 'Sidebar' },
      h('div', { class: 'fs-label' }, 'Favorites'),
      item('root', 'Portfolio', 'folder'),
      sections.map((s) => item(s.id, s.label, s.icon)),
      h('div', { class: 'fs-label' }, 'Documents'),
      item('resume', 'Resume.pdf', 'doc'),
      h('div', { class: 'fs-label' }, 'Tags'),
      tags.map((t) => h('button', {
        class: 'fs-item', type: 'button', 'data-tag': t.skill, onClick: () => open('projects', { filter: t.skill }),
      }, h('span', { class: 'fs-dot', style: { '--dot': t.color }, 'aria-hidden': 'true' }), skillLabel(t.skill))),
    );
  }

  // ---------- Navigation ----------

  function open(loc = 'root', { filter = null, select = null, focus = null, record = true } = {}) {
    if (!win) build();
    else if (win.state === 'minimized') os.wm.restore(win);
    else os.wm.focus(win);
    navigate(loc, { filter, select, focus, record });
    return win;
  }

  function navigate(loc, { filter = null, select = null, focus = null, push = true, record = true, keepQuery = false } = {}) {
    if (!win) return open(loc, { filter, select, focus, record });
    const same = state.loc === loc && state.filter === filter;
    state.loc = loc;
    state.filter = loc === 'projects' ? filter : null;
    if (!keepQuery) {
      state.query = '';
      els.search.value = '';
    }
    state.sel = select || null;
    if (push && !same) {
      hist = hist.slice(0, hi + 1);
      hist.push({ loc, filter: state.filter });
      hi = hist.length - 1;
    }
    render();
    if (focus) {
      requestAnimationFrame(() => {
        const target = els.content.querySelector(`#${CSS.escape(focus)}`);
        target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
    if (record) os.record(token());
    return win;
  }

  function go(delta) {
    const next = hi + delta;
    if (next < 0 || next >= hist.length) return;
    hi = next;
    const entry = hist[hi];
    state.loc = entry.loc;
    state.filter = entry.filter;
    state.query = '';
    els.search.value = '';
    state.sel = null;
    render();
    os.record(token(), { replace: true });
  }

  function token() {
    return state.loc === 'root' ? '' : state.loc;
  }

  function setView(mode) {
    const key = state.loc === 'projects' ? 'projects' : 'root';
    if (mode === 'gallery' && key !== 'projects') return;
    views[key] = mode;
    storage.set(VIEW_KEY, views);
    render();
  }

  // ---------- Rendering ----------

  function render() {
    if (!win) return;
    const isDoc = Boolean(DOCS[state.loc]);
    const label = sectionLabel(state.loc);
    os.wm.setTitle(win, state.loc === 'projects' && state.filter ? `Projects · ${skillLabel(state.filter)}` : label);
    els.title.children[0].textContent = label;
    els.back.disabled = hi <= 0;
    els.fwd.disabled = hi >= hist.length - 1;
    els.sidebar.querySelectorAll('[data-loc]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.loc === state.loc && !state.filter)));
    els.sidebar.querySelectorAll('[data-tag]').forEach((b) => b.setAttribute('aria-current', String(state.loc === 'projects' && b.dataset.tag === state.filter)));
    const mode = currentView();
    els.viewBtns.forEach((b) => {
      const m = b.dataset.mode;
      b.setAttribute('aria-pressed', String(!isDoc && m === mode));
      b.disabled = isDoc || (m === 'gallery' && state.loc !== 'projects');
    });
    renderContent();
  }

  function currentView() {
    return state.loc === 'projects' ? views.projects : views.root;
  }

  function visibleProjects() {
    let list = [...projects];
    if (state.filter) list = list.filter((p) => p.stack.includes(state.filter));
    const tokens = normalize(state.query).split(' ').filter(Boolean);
    if (tokens.length) {
      list = list.filter((p) => {
        const hay = normalize(`${p.name} ${p.kind} ${p.tagline} ${p.summary} ${p.stack.map(skillLabel).join(' ')} ${p.year || ''}`);
        return tokens.every((t) => hay.includes(t));
      });
    }
    const { key, dir } = state.sort;
    const val = (p) => (key === 'name' ? p.name : key === 'kind' ? p.kind : key === 'year' ? (p.year || 0) : (p.featured ? 0 : 1));
    if (key !== 'featured' || currentView() === 'list') {
      list.sort((a, b) => {
        const va = val(a);
        const vb = val(b);
        if (va < vb) return -dir;
        if (va > vb) return dir;
        return 0;
      });
    } else {
      list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }

  function renderContent() {
    const c = els.content;
    c.replaceChildren();
    c.classList.toggle('is-flush', state.loc === 'projects' && currentView() === 'gallery');
    const sub = els.title.children[1];

    if (DOCS[state.loc]) {
      c.append(DOCS[state.loc](actions()));
      sub.textContent = sections.find((s) => s.id === state.loc)?.blurb || '';
      status([state.loc], '');
      c.scrollTop = 0;
      return;
    }

    if (state.loc === 'root') {
      const items = [
        ...sections.map((s) => ({ key: s.id, name: s.label, kind: 'Folder', sub: s.blurb, art: folderSvg(s.icon, { size: 72 }), activate: () => navigate(s.id) })),
        { key: 'resume', name: 'Resume.pdf', kind: 'PDF document', sub: profile.resume.fileName, art: docSvg({ size: 66 }), activate: () => os.go('resume') },
      ];
      sub.textContent = `${profile.name}`;
      if (currentView() === 'list') c.append(listTable(items, [
        { key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }, { key: 'sub', label: 'Contents' },
      ], { sortable: false }));
      else c.append(iconGrid(items));
      status([], `${items.length} items`);
      restoreSelection();
      return;
    }

    // Projects
    const list = visibleProjects();
    const total = projects.length;
    sub.textContent = state.filter ? `${list.length} of ${total} use ${skillLabel(state.filter)}` : `${total} projects`;
    if (state.filter) {
      c.append(h('div', { class: 'finder-filter', role: 'status' },
        icon('tag', 15),
        h('span', {}, 'Projects using ', h('strong', {}, skillLabel(state.filter))),
        h('button', { class: 'btn btn-glass', type: 'button', onClick: () => navigate('projects') }, 'Show all'),
      ));
    }
    if (!list.length) {
      c.append(h('div', { class: 'finder-empty' }, icon('search', 28), h('p', {}, `No projects match “${state.query}”.`),
        h('button', { class: 'btn', type: 'button', onClick: () => { els.search.value = ''; state.query = ''; renderContent(); } }, 'Clear search')));
      status(['projects'], '0 items');
      return;
    }
    const items = list.map((p) => ({
      key: p.slug, name: p.name, kind: p.kind, year: p.year ? String(p.year) : '—', stack: p.stack.slice(0, 3).map(skillLabel).join(', '),
      project: p, activate: () => os.openProject(p.slug, { list: list.map((x) => x.slug) }),
    }));
    const mode = currentView();
    if (mode === 'list') {
      c.append(listTable(items, [
        { key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }, { key: 'stack', label: 'Stack', sortable: false }, { key: 'year', label: 'Year' },
      ], { sortable: true }));
    } else if (mode === 'gallery') {
      c.append(gallery(items));
    } else {
      c.append(iconGrid(items, { projects: true }));
    }
    status(['projects'], state.filter || state.query ? `${list.length} of ${total} items` : `${total} items`);
    restoreSelection();
  }

  function status(path, count) {
    const crumbs = [h('button', { class: 'crumb', type: 'button', onClick: () => navigate('root') }, icon('folder', 13), 'Portfolio')];
    path.forEach((loc) => {
      crumbs.push(h('span', { 'aria-hidden': 'true' }, '›'));
      crumbs.push(h('button', { class: 'crumb', type: 'button', onClick: () => navigate(loc) }, icon(sections.find((s) => s.id === loc)?.icon || 'folder', 13), sectionLabel(loc)));
    });
    if (state.filter) {
      crumbs.push(h('span', { 'aria-hidden': 'true' }, '›'));
      crumbs.push(h('span', { class: 'crumb' }, icon('tag', 13), skillLabel(state.filter)));
    }
    els.status.replaceChildren(...[h('nav', { 'aria-label': 'Path', style: 'display:flex;align-items:center;gap:2px' }, crumbs), count ? h('span', { class: 'count' }, count) : null].filter(Boolean));
  }

  // ----- Icon view -----

  function iconGrid(items, { projects: isProjects = false } = {}) {
    const ul = h('ul', { class: `fv-icons${isProjects ? ' fv-icons--projects' : ''}`, role: 'listbox', 'aria-label': isProjects ? 'Projects' : 'Folders', 'aria-orientation': 'horizontal' });
    items.forEach((item, i) => {
      const art = item.project ? fromHtml(coverHtml(item.project)) : h('span', { html: item.art });
      const btn = h('li', {
        class: 'fv-item', role: 'option', tabindex: i === 0 ? '0' : '-1', 'data-key': item.key, 'aria-selected': 'false',
        'aria-label': item.project ? `${item.name}, ${item.kind}${item.project.year ? `, ${item.project.year}` : ''}` : `${item.name}, ${item.kind}`,
        onClick: (e) => activateFromClick(item, e),
        onContextmenu: (e) => { e.preventDefault(); select(item.key); os.contextMenu(e, itemMenu(item)); },
      },
      h('span', { class: 'fv-art' }, art),
      h('span', { class: 'fv-name' }, item.name),
      item.project ? h('span', { class: 'fv-sub' }, `${item.kind}${item.project.year ? ` · ${item.project.year}` : ''}`) : h('span', { class: 'fv-sub' }, item.kind === 'Folder' ? '' : item.kind),
      item.project ? h('span', { class: 'fv-desc' }, item.project.tagline) : null);
      btn._item = item;
      ul.append(btn);
    });
    return ul;
  }

  // ----- List view -----

  function listTable(items, cols, { sortable }) {
    const head = h('tr', {}, cols.map((col) => {
      const sorted = state.sort.key === col.key;
      const th = h('th', { scope: 'col', 'aria-sort': sortable && sorted ? (state.sort.dir > 0 ? 'ascending' : 'descending') : null });
      if (sortable && col.sortable !== false) {
        th.append(h('button', {
          type: 'button', onClick: () => {
            state.sort = { key: col.key, dir: state.sort.key === col.key ? -state.sort.dir : 1 };
            renderContent();
          },
        }, col.label, sorted ? icon(state.sort.dir > 0 ? 'chevron-up' : 'chevron-down', 11) : null));
      } else th.append(col.label);
      return th;
    }));
    const body = h('tbody', { role: 'rowgroup' });
    items.forEach((item, i) => {
      const nameCell = h('td', {}, h('span', { class: 'fv-row-name' },
        item.project ? fromHtml(coverHtml(item.project)) : h('span', { html: item.art.replace(/width="\d+"/, 'width="22"').replace(/height="\d+"/, 'height="18"') }),
        item.name));
      const row = h('tr', {
        tabindex: i === 0 ? '0' : '-1', 'data-key': item.key, 'aria-selected': 'false', role: 'row',
        onClick: (e) => activateFromClick(item, e),
        onContextmenu: (e) => { e.preventDefault(); select(item.key); os.contextMenu(e, itemMenu(item)); },
      }, nameCell, cols.slice(1).map((col) => h('td', {}, item[col.key] || '')));
      row._item = item;
      body.append(row);
    });
    return h('div', { class: 'fv-list-wrap' }, h('table', { class: 'fv-list', role: 'grid', 'aria-label': 'Items' }, h('thead', {}, head), body));
  }

  // ----- Gallery view -----

  function gallery(items) {
    const selItem = items.find((i) => i.key === state.sel) || items[0];
    state.sel = selItem.key;
    const p = selItem.project;
    const stage = h('div', { class: 'fvg-stage' }, h('button', {
      type: 'button', 'aria-label': `Preview ${p.name}`, style: 'display:contents', onClick: () => selItem.activate(),
    }, fromHtml(coverHtml(p))));
    const info = h('aside', { class: 'fvg-info', 'aria-label': 'Details' },
      h('h3', {}, p.name),
      h('p', {}, `${p.kind}${p.year ? ` · ${p.year}` : ''}`),
      h('p', {}, p.tagline),
      chipList(p.stack.slice(0, 6), { actions: actions() }),
      h('div', { class: 'doc-row' },
        h('button', { class: 'btn btn-primary', type: 'button', onClick: () => selItem.activate() }, icon('eye', 14), 'Preview'),
        projectLinks(p).slice(0, 1)),
    );
    const strip = h('div', { class: 'fvg-strip', role: 'listbox', 'aria-label': 'Projects', 'aria-orientation': 'horizontal' },
      items.map((item) => {
        const t = h('div', {
          class: 'fvg-thumb', role: 'option', tabindex: item.key === selItem.key ? '0' : '-1', 'data-key': item.key,
          'aria-selected': String(item.key === selItem.key), 'aria-label': item.name,
          onClick: () => { state.sel = item.key; renderContent(); els.content.querySelector(`[data-key="${item.key}"]`)?.focus(); },
          onDblclick: () => item.activate(),
          onContextmenu: (e) => { e.preventDefault(); os.contextMenu(e, itemMenu(item)); },
        }, fromHtml(coverHtml(item.project)));
        t._item = item;
        return t;
      }));
    return h('div', { class: 'fv-gallery' }, stage, info, strip);
  }

  // ---------- Selection & keyboard ----------

  function itemsEls() {
    return Array.from(els.content.querySelectorAll('[data-key]'));
  }

  function select(key) {
    state.sel = key;
    itemsEls().forEach((el) => {
      const on = el.dataset.key === key;
      el.setAttribute('aria-selected', String(on));
      el.tabIndex = on ? 0 : -1;
    });
  }

  function restoreSelection() {
    if (state.sel) select(state.sel);
  }

  function focusItem(i) {
    const list = itemsEls();
    if (!list.length) return;
    const el = list[Math.max(0, Math.min(list.length - 1, i))];
    select(el.dataset.key);
    el.focus();
  }

  function activateFromClick(item, e) {
    const now = Date.now();
    // Swallow the second click of a double-click on the same item.
    if (item.key === lastKey && now - lastActivate < 420) return;
    lastActivate = now;
    lastKey = item.key;
    select(item.key);
    if (e.metaKey || e.ctrlKey) return;
    item.activate();
  }

  function onKey(e) {
    const current = e.target.closest('[data-key]');
    if ((e.metaKey || e.altKey) && e.key === 'ArrowUp') {
      e.preventDefault();
      navigate('root');
      return;
    }
    if (!current) return;
    const list = itemsEls();
    const i = list.indexOf(current);
    const mode = state.loc === 'projects' || state.loc === 'root' ? currentView() : null;
    let cols = 1;
    if (mode === 'icons') {
      const top = list[0].offsetTop;
      cols = Math.max(1, list.filter((el) => el.offsetTop === top).length);
    }
    const horizontal = mode === 'icons' || mode === 'gallery';
    let next = null;
    if (e.key === 'ArrowRight' && horizontal) next = i + 1;
    else if (e.key === 'ArrowLeft' && horizontal) next = i - 1;
    else if (e.key === 'ArrowDown' && mode !== 'gallery') next = i + cols;
    else if (e.key === 'ArrowUp' && mode !== 'gallery') next = i - cols;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    if (next != null) {
      e.preventDefault();
      if (next >= 0 && next < list.length) {
        focusItem(next);
        if (mode === 'gallery') {
          state.sel = list[next].dataset.key;
          renderContent();
          els.content.querySelector(`[data-key="${state.sel}"]`)?.focus();
        }
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      current._item?.activate();
    }
  }

  function itemMenu(item) {
    const p = item.project;
    const base = [
      { label: p ? 'Preview' : 'Open', shortcut: p ? 'Space' : '', action: () => item.activate() },
    ];
    if (p) {
      base.push({ label: 'Get Info', action: () => os.getInfo(p.slug) });
      base.push({ type: 'separator' });
      p.links.forEach((l) => base.push({ label: `Open ${l.label}`, action: () => openExternal(l.url) }));
      base.push({ label: 'Copy Link', action: () => os.copy(`${os.siteUrl}#${p.slug}`, 'Link copied') });
    } else if (item.key !== 'resume') {
      base.push({ label: 'Copy Link', action: () => os.copy(`${os.siteUrl}#${item.key}`, 'Link copied') });
    }
    return base;
  }

  function backgroundMenu() {
    const mode = currentView();
    const canGallery = state.loc === 'projects';
    return [
      { type: 'label', label: 'View' },
      { label: 'as Icons', checked: mode === 'icons', radio: true, action: () => setView('icons') },
      { label: 'as List', checked: mode === 'list', radio: true, action: () => setView('list') },
      { label: 'as Gallery', checked: mode === 'gallery', radio: true, disabled: !canGallery, action: () => setView('gallery') },
      { type: 'separator' },
      { label: 'Simple Page', action: () => os.enterSimple() },
    ];
  }

  return {
    open,
    navigate,
    back: () => go(-1),
    forward: () => go(1),
    setView,
    get canBack() { return hi > 0; },
    get canForward() { return hi < hist.length - 1; },
    get view() { return currentView(); },
    get loc() { return state.loc; },
    get win() { return win; },
    token,
  };
}
