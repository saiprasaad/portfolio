// Small DOM helpers shared by every module that runs in the browser.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, props = {}, ...children) {
  const el = tag === 'svg' || tag.startsWith('svg:')
    ? document.createElementNS(SVG_NS, tag.replace('svg:', ''))
    : document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.setAttribute('class', value);
    else if (key === 'style') {
      if (typeof value === 'string') el.style.cssText = value;
      else for (const [prop, v] of Object.entries(value)) {
        if (v == null) continue;
        if (prop.startsWith('--')) el.style.setProperty(prop, v);
        else el.style[prop] = v;
      }
    } else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'html') el.innerHTML = value; // trusted, static markup only (icons, covers)
    else if (key === 'text') el.textContent = value;
    else if (key === 'value') el.value = value;
    else if (key === 'checked') el.checked = !!value;
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false || child === '') continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function frag(...children) {
  return append(document.createDocumentFragment(), children);
}

// Parse a trusted markup string (an icon or a cover) into a node.
export function fromHtml(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

let uidCounter = 0;
export const uid = (prefix = 'id') => `${prefix}-${(++uidCounter).toString(36)}`;

export function debounce(fn, ms = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// localStorage can be missing or throw (private windows, sandboxed previews), so every call is guarded.
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch { /* storage unavailable */ }
  },
};

export const session = {
  get(key, fallback = null) {
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
  },
};

// Must be called from inside the click handler that triggered it.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = h('textarea', { style: 'position:fixed;top:-1000px;opacity:0', readonly: true });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch { ok = false; }
    area.remove();
    return ok;
  }
}

export function reducedMotion() {
  return document.documentElement.dataset.motion === 'reduced'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusables(root) {
  return $$(FOCUSABLE, root).filter((el) => !el.closest('[hidden], [inert]') && el.offsetParent !== null);
}

// Keep Tab and Shift+Tab inside a modal container.
export function trapTab(container, event) {
  if (event.key !== 'Tab') return;
  const items = focusables(container);
  if (!items.length) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function formatClock(date = new Date(), timeZone) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone }).format(date);
}

export function formatMenuDate(date = new Date()) {
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  return `${day}  ${formatClock(date)}`;
}

export function animate(el, keyframes, options) {
  if (reducedMotion() || !el.animate) return Promise.resolve();
  const anim = el.animate(keyframes, { easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both', ...options });
  return anim.finished.then(() => anim).catch(() => anim);
}

// Opens a link in a new tab through a real anchor, which works where window.open is blocked.
export function openExternal(url) {
  const a = h('a', { href: url, target: '_blank', rel: 'noopener', style: 'display:none' });
  document.body.append(a);
  a.click();
  a.remove();
}

export function isProductionHost(hosts) {
  return hosts.includes(window.location.hostname);
}

export function canPrint(hosts) {
  const host = window.location.hostname;
  return hosts.includes(host) || host === 'localhost' || host === '127.0.0.1';
}
