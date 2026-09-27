// Dropdown menus, context menus and popovers with keyboard support.

import { h, clamp, focusables, trapTab } from '../lib/dom.js';
import { iconSvg } from '../lib/icons.js';

let openMenu = null;
let openPopover = null;

export function closeMenus() {
  openMenu?.close({ restore: false });
  openPopover?.close({ restore: false });
}

function position(el, { x, y, anchor, align = 'left', offset = 4 }) {
  const rect = anchor?.getBoundingClientRect();
  let left = x ?? (align === 'right' ? rect.right : rect.left);
  let top = y ?? rect.bottom + offset;
  el.style.left = '0px';
  el.style.top = '0px';
  const { width, height } = el.getBoundingClientRect();
  if (align === 'right' && x == null) left -= width;
  if (align === 'center' && x == null) left = rect.left + rect.width / 2 - width / 2;
  if (align === 'above' && rect) {
    left = rect.left + rect.width / 2 - width / 2;
    top = rect.top - height - 12;
  }
  left = clamp(left, 6, window.innerWidth - width - 6);
  top = clamp(top, 6, window.innerHeight - height - 6);
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

export function showMenu({ items, x, y, anchor, align, label = 'Menu', onClose, focusFirst = true }) {
  openMenu?.close({ restore: false });
  const el = h('div', { class: 'menu', role: 'menu', 'aria-label': label, tabindex: '-1' });
  const buttons = [];

  items.filter(Boolean).forEach((item) => {
    if (item.type === 'separator') {
      el.append(h('div', { class: 'menu-sep', role: 'separator' }));
      return;
    }
    if (item.type === 'label') {
      el.append(h('div', { class: 'menu-label', role: 'presentation' }, item.label));
      return;
    }
    const role = item.checked === undefined ? 'menuitem' : (item.radio ? 'menuitemradio' : 'menuitemcheckbox');
    const btn = h('button', {
      class: 'menu-item', type: 'button', role, tabindex: '-1',
      'aria-checked': item.checked === undefined ? null : String(Boolean(item.checked)),
      'aria-disabled': item.disabled ? 'true' : null,
      onClick: () => {
        if (item.disabled) return;
        close({ restore: !item.keepFocus });
        item.action?.();
      },
    },
    item.checked ? h('span', { class: 'menu-check', html: iconSvg('check', { size: 12 }) }) : null,
    h('span', {}, item.label),
    item.shortcut ? h('span', { class: 'menu-shortcut' }, item.shortcut) : null);
    btn.addEventListener('pointerenter', () => btn.focus({ preventScroll: true }));
    buttons.push(btn);
    el.append(btn);
  });

  const move = (dir) => {
    const enabled = buttons.filter((b) => b.getAttribute('aria-disabled') !== 'true');
    if (!enabled.length) return;
    const i = enabled.indexOf(document.activeElement);
    const next = dir === 'first' ? 0 : dir === 'last' ? enabled.length - 1 : (i + dir + enabled.length) % enabled.length;
    enabled[next].focus();
  };

  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); move('first'); }
    else if (e.key === 'End') { e.preventDefault(); move('last'); }
    else if (e.key === 'Escape') { e.preventDefault(); close({ restore: true }); }
    else if (e.key === 'Tab') { close({ restore: false }); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (onArrow) {
        e.preventDefault();
        onArrow(e.key === 'ArrowLeft' ? -1 : 1);
      }
    }
  });

  let onArrow = null;
  const outside = (e) => {
    if (!el.contains(e.target) && !(anchor && anchor.contains(e.target))) close({ restore: false });
  };

  function close({ restore = false } = {}) {
    if (!el.isConnected) return;
    el.remove();
    document.removeEventListener('pointerdown', outside, true);
    window.removeEventListener('blur', blurClose);
    if (openMenu?.el === el) openMenu = null;
    onClose?.();
    if (restore) anchor?.focus?.({ preventScroll: true });
  }
  const blurClose = () => close({ restore: false });

  document.body.append(el);
  position(el, { x, y, anchor, align });
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
  window.addEventListener('blur', blurClose);
  if (focusFirst) move('first');
  else el.focus({ preventScroll: true });

  openMenu = { el, close, setArrowHandler: (fn) => { onArrow = fn; } };
  return openMenu;
}

export function showPopover({ anchor, content, label, align = 'right', className = '', onClose, initialFocus }) {
  openPopover?.close({ restore: false });
  const el = h('div', { class: `popover ${className}`.trim(), role: 'dialog', 'aria-label': label, tabindex: '-1' }, content);
  const outside = (e) => {
    if (!el.contains(e.target) && !(anchor && anchor.contains(e.target))) close({ restore: false });
  };
  const keydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close({ restore: true });
    } else trapTab(el, e);
  };
  function close({ restore = false } = {}) {
    if (!el.isConnected) return;
    el.remove();
    document.removeEventListener('pointerdown', outside, true);
    if (openPopover?.el === el) openPopover = null;
    anchor?.setAttribute('aria-expanded', 'false');
    onClose?.();
    if (restore) anchor?.focus?.({ preventScroll: true });
  }
  el.addEventListener('keydown', keydown);
  document.body.append(el);
  position(el, { anchor, align, offset: 6 });
  anchor?.setAttribute('aria-expanded', 'true');
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
  const first = initialFocus ? el.querySelector(initialFocus) : focusables(el)[0];
  (first || el).focus({ preventScroll: true });
  openPopover = { el, close, reposition: () => position(el, { anchor, align, offset: 6 }) };
  return openPopover;
}
