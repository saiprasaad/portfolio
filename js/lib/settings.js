// Visitor preferences: appearance, accent color, wallpaper, motion and transparency.
// Stored per browser; the page works the same when storage is unavailable.

import { storage } from './dom.js';

const KEY = 'saios.settings.v1';
const DEFAULTS = { theme: 'auto', accent: 'blue', wallpaper: 'dynamic', motion: 'auto', transparency: 'auto' };

let state = { ...DEFAULTS, ...(storage.get(KEY, {}) || {}) };
const listeners = new Set();
let themeTouched = state.theme !== 'auto';

export const ACCENTS = [
  { id: 'blue', label: 'Blue', color: '#0071e3' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
  { id: 'pink', label: 'Pink', color: '#c8286a' },
  { id: 'orange', label: 'Orange', color: '#c25e00' },
  { id: 'green', label: 'Green', color: '#16833a' },
  { id: 'graphite', label: 'Graphite', color: '#5e5e66' },
];

export const WALLPAPERS = [
  { id: 'dynamic', label: 'Dynamic' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
  { id: 'graphite', label: 'Graphite' },
];

export const settings = {
  get(key) {
    return state[key];
  },
  set(key, value) {
    if (state[key] === value) return;
    state = { ...state, [key]: value };
    if (key === 'theme') themeTouched = true;
    storage.set(KEY, state);
    applySettings();
    listeners.forEach((fn) => fn(key, value));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function applySettings() {
  const root = document.documentElement;
  if (state.theme === 'light' || state.theme === 'dark') root.dataset.theme = state.theme;
  else if (themeTouched) delete root.dataset.theme; // only undo a theme this page set itself
  if (state.accent && state.accent !== 'blue') root.dataset.accent = state.accent;
  else delete root.dataset.accent;
  if (state.motion === 'reduced') root.dataset.motion = 'reduced';
  else delete root.dataset.motion;
  if (state.transparency === 'reduced') root.dataset.transparency = 'reduced';
  else delete root.dataset.transparency;
}

export function isDark() {
  const forced = document.documentElement.dataset.theme;
  if (forced) return forced === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function toggleTheme() {
  settings.set('theme', isDark() ? 'light' : 'dark');
}

export function paletteFor(date = new Date()) {
  const choice = state.wallpaper;
  if (choice && choice !== 'dynamic') return choice;
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}
