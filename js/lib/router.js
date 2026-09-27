// URL state as a single hash token: #projects, #repo-vision, #resume, #simple ...
// Tokens are plain words so they survive every host (and scroll to the matching
// section of the prerendered page when JavaScript is off).

const listeners = new Set();

export function parseToken(hash = window.location.hash) {
  let raw = String(hash || '').replace(/^#\/?/, '');
  try {
    raw = decodeURIComponent(raw);
  } catch { /* keep raw */ }
  return raw.trim().toLowerCase().replace(/[^a-z0-9._~-]/g, '');
}

let current = parseToken();

function write(token, replace) {
  const url = token ? `#${token}` : `${window.location.pathname}${window.location.search}`;
  const state = { saios: token, pushed: !replace || Boolean(window.history.state?.pushed) };
  try {
    window.history[replace ? 'replaceState' : 'pushState'](state, '', url);
    return true;
  } catch {
    try {
      if (!replace) window.location.hash = token;
      return true;
    } catch {
      return false;
    }
  }
}

export const router = {
  get current() {
    return current;
  },
  // Update the address bar for state the page already shows.
  record(token = '', { replace = false } = {}) {
    token = token || '';
    if (token === current) return;
    current = token;
    write(token, replace);
  },
  // True when the current entry was pushed by this page (so Back stays on the site).
  canGoBack() {
    return Boolean(window.history.state?.pushed);
  },
  back() {
    try {
      window.history.back();
    } catch { /* ignore */ }
  },
  onNavigate(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  start() {
    const handle = () => {
      const token = parseToken();
      if (token === current) return;
      current = token;
      listeners.forEach((fn) => fn(token, { fromHistory: true, state: window.history.state }));
    };
    window.addEventListener('popstate', handle);
    window.addEventListener('hashchange', handle);
  },
};
