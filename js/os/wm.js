// Window manager: create, focus, drag, resize, minimize to the Dock, zoom and close.

import { h, uid, clamp, animate, reducedMotion } from '../lib/dom.js';

const GLYPH = {
  close: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M2 2l4 4M6 2L2 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  min: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.6 4h4.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  zoom: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.8 1.8h3L1.8 4.8zM6.2 6.2h-3l3-3z" fill="currentColor"/></svg>',
};

const INTERACTIVE = 'button, a, input, textarea, select, label, [role="tab"], [role="menuitem"], [data-no-drag], .capsule, .segmented, .search-field, .chip';

export class WindowManager {
  constructor({ layer, area, dockTarget, onChange }) {
    this.layer = layer;
    this.area = area; // () => { left, top, right, bottom }
    this.dockTarget = dockTarget; // (app) => DOMRect | null
    this.onChange = onChange || (() => {});
    this.windows = [];
    this.z = 20;
    this.cascade = 0;
    window.addEventListener('resize', () => this.keepInView());
  }

  get focused() {
    return this.windows.filter((w) => w.state !== 'minimized').sort((a, b) => b.z - a.z)[0] || null;
  }

  find(app) {
    return this.windows.find((w) => w.app === app) || null;
  }

  create(opts) {
    const {
      app, title, body, width = 720, height = 480, minWidth = 360, minHeight = 240,
      resizable = true, zoomable = true, minimizable = true, titlebar = true, titlebarActions = null,
      className = '', center = false, x, y, onClose, onResize, label,
    } = opts;
    const titleId = uid('wt');
    const win = { id: uid('win'), app, title, state: 'normal', z: 0, opts, prevBounds: null };

    const closeBtn = h('button', { class: 'tl-close', type: 'button', 'aria-label': `Close ${label || title}`, html: GLYPH.close, onClick: (e) => { e.stopPropagation(); this.close(win); } });
    const minBtn = h('button', { class: 'tl-min', type: 'button', 'aria-label': `Minimize ${label || title}`, html: GLYPH.min, disabled: !minimizable, onClick: (e) => { e.stopPropagation(); this.minimize(win); } });
    const zoomBtn = h('button', { class: 'tl-zoom', type: 'button', 'aria-label': `Zoom ${label || title}`, html: GLYPH.zoom, disabled: !zoomable, onClick: (e) => { e.stopPropagation(); this.zoom(win); } });
    const traffic = h('div', { class: 'traffic', role: 'group', 'aria-label': 'Window controls' }, closeBtn, minBtn, zoomBtn);

    const titleEl = h('span', { class: titlebar ? 'titlebar-title' : 'sr-only', id: titleId }, title);
    const frameKids = [traffic];
    if (titlebar) {
      frameKids.push(h('div', { class: 'titlebar', 'data-drag': '' }, titleEl, titlebarActions ? h('div', { class: 'titlebar-actions' }, titlebarActions) : null));
    } else {
      frameKids.push(titleEl);
    }
    const bodyWrap = h('div', { class: 'window-body' }, body);
    frameKids.push(bodyWrap);

    const frame = h('div', { class: 'window-frame' }, frameKids);
    const el = h('section', {
      class: `window ${className}`.trim(), role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': titleId, 'data-app': app, tabindex: '-1',
    }, frame);

    if (resizable) {
      ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((dir) => {
        const handle = h('div', { class: `resize-handle rh-${dir}`, 'data-dir': dir, 'aria-hidden': 'true' });
        handle.addEventListener('pointerdown', (e) => this.startResize(win, e, dir));
        el.append(handle);
      });
    }

    Object.assign(win, { el, frame, body: bodyWrap, titleEl, minBtn, zoomBtn });

    // Initial bounds: centered or cascaded, always inside the visible area.
    const a = this.area();
    const w = Math.min(width, a.right - a.left - 24);
    const hgt = Math.min(height, a.bottom - a.top - 16);
    let left;
    let top;
    if (x != null && y != null) {
      left = x;
      top = y;
    } else if (center) {
      left = a.left + (a.right - a.left - w) / 2;
      top = a.top + Math.max(12, (a.bottom - a.top - hgt) / 2 - 20);
    } else {
      const step = (this.cascade++ % 6) * 26;
      left = a.left + (a.right - a.left - w) / 2 + step - 60;
      top = a.top + 36 + step;
    }
    win.bounds = this.clampBounds({ left, top, width: w, height: hgt }, { minWidth, minHeight });

    el.addEventListener('pointerdown', (e) => this.onPointerDown(win, e), true);
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('[data-drag]') && !e.target.closest(INTERACTIVE) && zoomable) this.zoom(win);
    });
    el.addEventListener('focusin', () => this.focus(win, { fromFocus: true }));

    this.applyBounds(win);
    this.layer.append(el);
    this.windows.push(win);
    this.focus(win);
    win.onClose = onClose;
    win.onResize = onResize;
    onResize?.(win.bounds);
    animate(el, [{ opacity: 0, transform: 'scale(.96) translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 180 });
    this.onChange();
    return win;
  }

  setTitle(win, title) {
    win.title = title;
    win.titleEl.textContent = title;
    this.onChange();
  }

  clampBounds(b, { minWidth = 320, minHeight = 200 } = {}) {
    const a = this.area();
    const width = clamp(b.width, minWidth, Math.max(minWidth, a.right - a.left));
    const height = clamp(b.height, minHeight, Math.max(minHeight, window.innerHeight - a.top));
    const left = clamp(b.left, a.left - width + 120, a.right - 120);
    const top = clamp(b.top, a.top, window.innerHeight - 60);
    return { left, top, width, height };
  }

  applyBounds(win) {
    const { left, top, width, height } = win.bounds;
    Object.assign(win.el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }

  keepInView() {
    this.windows.forEach((win) => {
      if (win.state === 'zoomed') {
        win.bounds = this.zoomBounds();
      } else {
        win.bounds = this.clampBounds(win.bounds, win.opts);
      }
      this.applyBounds(win);
      win.onResize?.(win.bounds);
    });
  }

  zoomBounds() {
    const a = this.area();
    return { left: a.left + 6, top: a.top + 6, width: a.right - a.left - 12, height: a.bottom - a.top - 12 };
  }

  focus(win, { fromFocus = false } = {}) {
    if (!win || win.state === 'minimized') return;
    const top = this.focused;
    if (top !== win) {
      this.z += 1;
      if (this.z > 1800) this.renumber();
      win.z = this.z;
      win.el.style.zIndex = String(win.z);
    }
    this.windows.forEach((w) => w.el.classList.toggle('is-focused', w === win));
    if (!fromFocus && !win.el.contains(document.activeElement)) {
      const target = win.el.querySelector('[data-autofocus]');
      (target || win.el).focus({ preventScroll: true });
    }
    this.onChange();
  }

  renumber() {
    const sorted = [...this.windows].sort((a, b) => a.z - b.z);
    sorted.forEach((w, i) => {
      w.z = 20 + i;
      w.el.style.zIndex = String(w.z);
    });
    this.z = 20 + sorted.length;
  }

  onPointerDown(win, e) {
    if (e.button !== 0) return;
    this.focus(win, { fromFocus: true });
    const region = e.target.closest('[data-drag]');
    if (!region || e.target.closest(INTERACTIVE) || e.target.closest('.resize-handle')) return;
    if (win.state === 'zoomed') return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, left: win.bounds.left, top: win.bounds.top };
    const el = win.el;
    el.setPointerCapture?.(e.pointerId);
    document.body.classList.add('is-dragging');
    const move = (ev) => {
      win.bounds = this.clampBounds({ ...win.bounds, left: start.left + ev.clientX - start.x, top: start.top + ev.clientY - start.y }, win.opts);
      this.applyBounds(win);
    };
    const up = () => {
      document.body.classList.remove('is-dragging');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  startResize(win, e, dir) {
    if (e.button !== 0 || win.state === 'zoomed') return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);
    const start = { x: e.clientX, y: e.clientY, ...win.bounds };
    const { minWidth = 320, minHeight = 200 } = win.opts;
    document.body.classList.add('is-resizing');
    const move = (ev) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      let { left, top, width, height } = start;
      if (dir.includes('e')) width = Math.max(minWidth, start.width + dx);
      if (dir.includes('s')) height = Math.max(minHeight, start.height + dy);
      if (dir.includes('w')) {
        width = Math.max(minWidth, start.width - dx);
        left = start.left + (start.width - width);
      }
      if (dir.includes('n')) {
        const a = this.area();
        height = Math.max(minHeight, start.height - dy);
        top = start.top + (start.height - height);
        if (top < a.top) {
          height -= a.top - top;
          top = a.top;
        }
      }
      win.bounds = { left, top, width, height };
      this.applyBounds(win);
      win.onResize?.(win.bounds);
    };
    const up = () => {
      document.body.classList.remove('is-resizing');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  }

  zoom(win) {
    if (!win.opts.zoomable && win.opts.zoomable !== undefined) return;
    win.el.classList.add('is-zooming');
    if (win.state === 'zoomed') {
      win.bounds = win.prevBounds || win.bounds;
      win.state = 'normal';
    } else {
      win.prevBounds = { ...win.bounds };
      win.bounds = this.zoomBounds();
      win.state = 'zoomed';
    }
    this.applyBounds(win);
    win.onResize?.(win.bounds);
    setTimeout(() => win.el.classList.remove('is-zooming'), reducedMotion() ? 0 : 320);
    this.focus(win);
  }

  async minimize(win) {
    if (win.state === 'minimized' || win.opts.minimizable === false) return;
    const target = this.dockTarget(win.app);
    const r = win.el.getBoundingClientRect();
    if (target && !reducedMotion()) {
      const dx = target.left + target.width / 2 - (r.left + r.width / 2);
      const dy = target.top + target.height / 2 - (r.top + r.height / 2);
      const s = Math.max(0.05, target.width / r.width);
      await animate(win.el, [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s}, ${s * 0.6})`, opacity: 0.2 },
      ], { duration: 360, easing: 'cubic-bezier(.5,0,.75,.2)', fill: 'forwards' });
    }
    win.restoreState = win.state === 'zoomed' ? 'zoomed' : 'normal';
    win.state = 'minimized';
    win.el.hidden = true;
    win.el.getAnimations?.().forEach((a) => a.cancel());
    const next = this.focused;
    if (next) this.focus(next);
    this.onChange();
  }

  async restore(win) {
    if (win.state !== 'minimized') {
      this.focus(win);
      return;
    }
    win.state = win.restoreState || 'normal';
    win.el.hidden = false;
    const target = this.dockTarget(win.app);
    this.focus(win);
    if (target && !reducedMotion()) {
      const r = win.el.getBoundingClientRect();
      const dx = target.left + target.width / 2 - (r.left + r.width / 2);
      const dy = target.top + target.height / 2 - (r.top + r.height / 2);
      const s = Math.max(0.05, target.width / r.width);
      await animate(win.el, [
        { transform: `translate(${dx}px, ${dy}px) scale(${s}, ${s * 0.6})`, opacity: 0.2 },
        { transform: 'none', opacity: 1 },
      ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' });
    }
    this.onChange();
  }

  async close(win) {
    if (!this.windows.includes(win)) return;
    if (win.onBeforeClose && win.onBeforeClose() === false) return;
    this.windows = this.windows.filter((w) => w !== win);
    await animate(win.el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 130, fill: 'forwards' });
    win.el.remove();
    win.onClose?.();
    const next = this.focused;
    if (next) this.focus(next);
    else document.querySelector('.desktop')?.focus?.({ preventScroll: true });
    this.onChange();
  }
}
