// Quick Look: a large preview of a project. Arrow keys move between projects.

import { h, trapTab } from '../lib/dom.js';
import { projects, getProject } from '../content.js';
import { renderProjectDetail, icon } from '../lib/sections.js';

export function createQuickLook(os) {
  let layer = null;
  let list = projects.map((p) => p.slug);
  let current = null;
  let returnFocus = null;
  let body;
  let titleText;
  let countEl;
  let prevBtn;
  let nextBtn;
  let linkSlot;

  function build() {
    titleText = h('span', { id: 'ql-title' });
    countEl = h('span', { class: 'ql-count' });
    prevBtn = h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Previous project', onClick: () => step(-1) }, icon('chevron-left', 16));
    nextBtn = h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Next project', onClick: () => step(1) }, icon('chevron-right', 16));
    linkSlot = h('div', { class: 'doc-row' });
    body = h('div', { class: 'ql-body scroll' });
    const panel = h('div', { class: 'ql', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ql-title', tabindex: '-1' },
      h('div', { class: 'ql-head' },
        h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Close Quick Look', onClick: () => close() }, icon('x', 15)),
        h('div', { class: 'ql-title' }, icon('eye', 16), titleText, countEl),
        linkSlot,
        h('button', { class: 'btn', type: 'button', onClick: () => { const slug = current; close(); os.getInfo(slug); } }, icon('info', 15), 'Get Info'),
        h('div', { class: 'capsule' }, prevBtn, nextBtn),
      ),
      body,
    );
    layer = h('div', { class: 'ql-layer', onPointerdown: (e) => { if (e.target === layer) close(); } }, panel);
    panel.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'Escape' || (e.key === ' ' && !e.target.closest('button, a'))) {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        step(-1);
      } else trapTab(panel, e);
    });
    document.body.append(layer);
    return panel;
  }

  function render() {
    const p = getProject(current);
    if (!p) return;
    const i = list.indexOf(current);
    titleText.textContent = p.name;
    countEl.textContent = `${i + 1} of ${list.length}`;
    prevBtn.disabled = list.length < 2;
    nextBtn.disabled = list.length < 2;
    linkSlot.replaceChildren(...p.links.slice(0, 1).map((l) => h('a', { class: 'btn btn-primary', href: l.url, target: '_blank', rel: 'noopener' }, icon(l.type === 'github' ? 'github' : l.type === 'video' ? 'play' : 'external', 14), l.label)));
    body.replaceChildren(renderProjectDetail(p, os.actions));
    body.scrollTop = 0;
  }

  function step(dir) {
    const i = list.indexOf(current);
    current = list[(i + dir + list.length) % list.length];
    render();
    os.record(current, { replace: true });
  }

  function open(slug, { list: slugs } = {}) {
    if (!getProject(slug)) return;
    if (slugs?.length) list = slugs.includes(slug) ? slugs : [slug, ...slugs];
    else if (!list.includes(slug)) list = projects.map((p) => p.slug);
    current = slug;
    if (!layer) {
      returnFocus = document.activeElement;
      const panel = build();
      render();
      panel.focus({ preventScroll: true });
    } else render();
  }

  function close({ fromHistory = false } = {}) {
    if (!layer) return;
    layer.remove();
    layer = null;
    const slug = current;
    current = null;
    if (!fromHistory) os.leaveProject(slug);
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }

  return { open, close, get isOpen() { return Boolean(layer); }, get current() { return current; } };
}
