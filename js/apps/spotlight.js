// Spotlight: search every project, role, skill and section, run quick actions,
// or hand the question to Folio.

import { h, fromHtml, trapTab, openExternal } from '../lib/dom.js';
import { appIconHtml } from '../lib/icons.js';
import { coverHtml } from '../lib/covers.js';
import { buildIndex, search, normalize } from '../lib/search.js';
import { profile, formatRange, skillLabel, evidenceFor, sections } from '../content.js';
import { skillMark, icon } from '../lib/sections.js';

const GROUPS = [
  ['top', 'Top hit'],
  ['action', 'Actions'],
  ['project', 'Projects'],
  ['role', 'Experience'],
  ['skill', 'Skills'],
  ['section', 'Sections'],
  ['education', 'Education'],
  ['award', 'Awards'],
  ['cert', 'Certifications'],
];

function actionItems(os) {
  const mod = os.isMac ? '⌘' : 'Ctrl+';
  const items = [
    { id: 'act:resume', title: 'Open resume', subtitle: profile.resume.fileName, icon: 'doc', app: 'preview', keywords: ['resume', 'cv', 'pdf'], run: () => os.go('resume') },
    { id: 'act:fit', title: 'Check a job description', subtitle: 'Fit Check in Folio', icon: 'target', app: 'fit', keywords: ['fit', 'job', 'role', 'hiring', 'recruiter', 'match'], run: () => os.go('fit') },
    { id: 'act:mail', title: 'Write an email to Sai', subtitle: profile.email, icon: 'mail', app: 'mail', keywords: ['email', 'mail', 'contact', 'message', 'hire'], run: () => os.go('mail') },
    { id: 'act:copy', title: 'Copy email address', subtitle: profile.email, icon: 'copy', keywords: ['copy', 'email', 'address'], run: () => os.copy(profile.email, 'Email address copied') },
    { id: 'act:folio', title: 'Ask Folio', subtitle: 'Portfolio assistant', icon: 'sparkle', app: 'folio', keywords: ['folio', 'ai', 'assistant', 'chat', 'ask'], run: () => os.go('folio') },
    { id: 'act:terminal', title: 'Open Terminal', subtitle: 'Ctrl+`', icon: 'terminal', app: 'terminal', keywords: ['terminal', 'shell', 'command', 'cli'], run: () => os.go('terminal') },
    { id: 'act:dark', title: 'Toggle dark mode', subtitle: 'Appearance', icon: 'moon', keywords: ['dark', 'light', 'theme', 'appearance', 'mode'], run: () => os.toggleTheme() },
    { id: 'act:simple', title: 'Switch to the simple page', subtitle: 'One printable page', icon: 'layout', keywords: ['simple', 'plain', 'page', 'print', 'text', 'accessible'], run: () => os.enterSimple() },
    ...profile.links.map((l) => ({ id: `act:${l.id}`, title: `Open ${l.label}`, subtitle: l.handle, icon: l.id, keywords: [l.label, 'profile', 'social'], href: l.url })),
  ];
  if (os.isMac) {
    items.push({ id: 'act:tm', title: 'Open Timeline', subtitle: 'Career history', icon: 'clock-back', app: 'timemachine', keywords: ['timeline', 'history', 'career', 'time'], run: () => os.go('timeline') });
    items.push({ id: 'act:shortcuts', title: 'Keyboard shortcuts', subtitle: `${mod}K, /, Ctrl+\``, icon: 'keyboard', keywords: ['keyboard', 'shortcuts', 'keys', 'help'], run: () => os.openReadme() });
  }
  return items.map((it) => ({ ...it, type: 'action', weight: 18, text: '' }));
}

function prepare(item) {
  item._title = normalize(item.title);
  item._titleWords = item._title.split(' ').filter(Boolean);
  item._keywords = (item.keywords || []).map(normalize).filter(Boolean);
  item._text = normalize(`${item.subtitle || ''} ${item.text || ''}`);
  return item;
}

function iconFor(item) {
  if (item.type === 'project') return fromHtml(coverHtml(item.project));
  if (item.type === 'skill' && item.skill) return skillMark(item.skill.id);
  if (item.app) return fromHtml(appIconHtml(item.app, { size: 30 }));
  const name = item.icon || { role: 'briefcase', education: 'cap', award: 'trophy', cert: 'medal', section: 'folder' }[item.type] || 'search';
  return icon(name, 17);
}

export function createSpotlight(os) {
  let index = null;
  let layer = null;
  let input;
  let listEl;
  let previewEl;
  let panel;
  let results = [];
  let selected = 0;
  let returnFocus = null;

  function ensureIndex() {
    if (!index) index = [...buildIndex(), ...actionItems(os).map(prepare)];
    return index;
  }

  function run(item) {
    close();
    if (item.type === 'ask') return os.openFolio({ question: item.query });
    if (item.href) {
      openExternal(item.href);
      return;
    }
    if (item.run) return item.run();
    switch (item.type) {
      case 'project': return os.openProject(item.target);
      case 'role': return os.openSection('experience', { focus: `role-${item.target}` });
      case 'skill': return os.filterSkill(item.target);
      case 'education': return os.openSection('education');
      case 'award':
      case 'cert': return os.openSection('achievements');
      case 'section': return item.target === 'resume' ? os.go('resume') : os.openSection(item.target);
      default: return undefined;
    }
  }

  function preview(item) {
    previewEl.replaceChildren();
    if (!item) return;
    if (item.type === 'ask') {
      previewEl.append(
        h('div', { html: appIconHtml('folio', { size: 44 }) }),
        h('h3', {}, 'Ask Folio'),
        h('p', {}, `Folio will answer “${item.query}” using Sai's portfolio.`),
      );
      return;
    }
    if (item.type === 'project') {
      const p = item.project;
      previewEl.append(fromHtml(coverHtml(p)), h('h3', {}, p.name), h('p', {}, p.tagline),
        h('dl', { class: 'sp-kv' }, h('dt', {}, 'Kind'), h('dd', {}, p.kind), h('dt', {}, 'Stack'), h('dd', {}, p.stack.slice(0, 6).map(skillLabel).join(', '))));
      return;
    }
    if (item.type === 'role') {
      const r = item.role;
      previewEl.append(h('h3', {}, r.title), h('p', {}, `${r.company} · ${r.location}`), h('p', {}, formatRange(r.start, r.end)), h('p', {}, r.bullets[0]));
      return;
    }
    if (item.type === 'skill') {
      const ev = evidenceFor(item.target);
      previewEl.append(h('h3', {}, item.title), h('p', {}, ev.length ? `Used in ${ev.map((e) => e.label).join(', ')}.` : 'Listed in his skills.'));
      return;
    }
    const section = sections.find((s) => s.id === item.target);
    previewEl.append(h('div', { style: 'color:var(--accent-ink)' }, icon(item.icon || section?.icon || 'folder', 30)), h('h3', {}, item.title), h('p', {}, item.subtitle || section?.blurb || ''));
  }

  function renderResults() {
    const q = input.value.trim();
    listEl.replaceChildren();
    results = [];
    if (!q) {
      const picks = ['act:resume', 'section:projects', 'act:fit', 'act:folio', 'act:mail', 'section:experience'];
      const idx = ensureIndex();
      results = picks.map((id) => idx.find((i) => i.id === id)).filter(Boolean).map((item) => ({ item, group: 'suggested' }));
      listEl.append(h('div', { class: 'sl-group', role: 'presentation' }, 'Suggestions'));
    } else {
      const hits = search(ensureIndex(), q, { limit: 24 });
      const byGroup = new Map();
      hits.forEach((hit, i) => {
        const group = i === 0 ? 'top' : hit.item.type;
        if (!byGroup.has(group)) byGroup.set(group, []);
        if (byGroup.get(group).length < 5) byGroup.get(group).push(hit.item);
      });
      GROUPS.forEach(([key]) => (byGroup.get(key) || []).forEach((item) => results.push({ item, group: key })));
      results.push({ item: { id: 'ask', type: 'ask', title: `Ask Folio: “${q}”`, subtitle: 'Get an answer from the portfolio assistant', app: 'folio', query: q }, group: 'ask' });
    }
    let lastGroup = null;
    results.forEach((r, i) => {
      if (r.group !== lastGroup && r.group !== 'suggested') {
        const label = r.group === 'ask' ? 'Folio' : (GROUPS.find(([k]) => k === r.group)?.[1] || '');
        listEl.append(h('div', { class: 'sl-group', role: 'presentation' }, label));
        lastGroup = r.group;
      }
      const opt = h('div', {
        class: 'sl-item', role: 'option', id: `sl-opt-${i}`, 'aria-selected': 'false',
        onClick: () => run(r.item),
        onPointermove: () => select(i, false),
      },
      h('span', { class: 'sl-icon' }, iconFor(r.item)),
      h('span', {}, h('span', { class: 'sl-title' }, r.item.title), h('span', { class: 'sl-sub' }, r.item.subtitle || '')));
      listEl.append(opt);
    });
    select(0, false);
  }

  function select(i, scroll = true) {
    if (!results.length) return;
    selected = Math.max(0, Math.min(results.length - 1, i));
    listEl.querySelectorAll('.sl-item').forEach((el, idx) => el.setAttribute('aria-selected', String(idx === selected)));
    const active = listEl.querySelector(`#sl-opt-${selected}`);
    input.setAttribute('aria-activedescendant', active?.id || '');
    if (scroll) active?.scrollIntoView({ block: 'nearest' });
    preview(results[selected]?.item);
  }

  function open(query = '') {
    if (layer) {
      input.value = query || input.value;
      renderResults();
      input.focus();
      return;
    }
    returnFocus = document.activeElement;
    input = h('input', {
      type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'spotlight-list', 'aria-autocomplete': 'list',
      'aria-label': 'Search the portfolio', placeholder: 'Search projects, skills, experience…', autocomplete: 'off', spellcheck: 'false', value: query,
    });
    listEl = h('div', { class: 'spotlight-list', id: 'spotlight-list', role: 'listbox', 'aria-label': 'Results' });
    previewEl = h('div', { class: 'spotlight-preview', 'aria-live': 'polite' });
    const mod = os.isMac ? '⌘' : 'Ctrl';
    const hints = h('div', { class: 'spotlight-hints', 'aria-hidden': 'true' },
      h('span', {}, h('span', { class: 'kbd' }, '↑'), h('span', { class: 'kbd' }, '↓'), 'move'),
      h('span', {}, h('span', { class: 'kbd' }, '↵'), 'open'),
      h('span', {}, h('span', { class: 'kbd' }, `${mod} K`), 'search anytime'));
    panel = h('div', { class: 'spotlight-panel' }, listEl, previewEl, hints);
    const box = h('div', { class: 'spotlight', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search' },
      h('div', { class: 'spotlight-bar' }, icon('search', 22), input, h('span', { class: 'kbd' }, 'esc')),
      panel,
    );
    layer = h('div', { class: 'spotlight-layer', onPointerdown: (e) => { if (e.target === layer) close(); } }, box);
    input.addEventListener('input', renderResults);
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); select(selected + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); select(selected - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); const r = results[selected]; if (r) run(r.item); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else trapTab(box, e);
    });
    document.body.append(layer);
    renderResults();
    input.focus();
  }

  function close() {
    if (!layer) return;
    layer.remove();
    layer = null;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }

  return { open, close, get isOpen() { return Boolean(layer); } };
}
