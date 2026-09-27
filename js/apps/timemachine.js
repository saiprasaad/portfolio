// Time Machine: career history as windows receding into the past.

import { h, reducedMotion, trapTab } from '../lib/dom.js';
import { experience, education, formatRange, formatMonth, formatDuration, roleMonths, skillLabel } from '../content.js';
import { icon, ROLE_TONES, ROLE_MARKS } from '../lib/sections.js';

function entries() {
  const edu = education[0];
  const list = [
    ...experience.map((r) => ({ kind: 'role', id: r.id, end: r.end, start: r.start, data: r })),
    { kind: 'edu', id: edu.id, end: edu.end, start: edu.start, data: edu },
  ];
  const key = (e) => (e.end ? e.end : '9999-12');
  return list.sort((a, b) => key(b).localeCompare(key(a)));
}

function card(entry) {
  const body = h('div', { class: 'tm-card-body doc' });
  if (entry.kind === 'role') {
    const r = entry.data;
    body.append(
      h('div', { class: 'role-head' },
        h('span', { class: 'role-mark', style: { '--role-tone': ROLE_TONES[r.id] }, 'aria-hidden': 'true' }, ROLE_MARKS[r.id] || r.company.slice(0, 2)),
        h('div', {}, h('h3', {}, r.title), h('p', { class: 'role-meta' }, `${r.company} · ${r.location}`)),
        h('div', { class: 'role-when' }, h('time', {}, formatRange(r.start, r.end)), h('span', {}, `${formatDuration(roleMonths(r))} · ${r.type}`)),
      ),
      r.highlights?.length ? h('ul', { class: 'metrics', style: { '--role-tone': ROLE_TONES[r.id], marginTop: '12px' } }, r.highlights.map((m) => h('li', { class: 'metric' }, h('strong', {}, m.value), h('span', {}, m.label)))) : null,
      h('ul', { class: 'bullets', style: 'margin-top:12px' }, r.bullets.slice(0, 3).map((b) => h('li', {}, b))),
      h('p', { class: 'skill-note', style: 'margin-top:10px' }, r.stack.slice(0, 7).map(skillLabel).join(' · ')),
    );
  } else {
    const e = entry.data;
    body.append(
      h('div', { class: 'edu-head' },
        h('span', { class: 'edu-mark', 'aria-hidden': 'true' }, 'IIT'),
        h('div', {}, h('h3', {}, e.degree), h('p', { class: 'role-meta' }, `${e.school} · ${formatRange(e.start, e.end)}`)),
        h('div', { class: 'edu-gpa' }, h('strong', {}, e.gpa), h('span', {}, 'GPA')),
      ),
      h('p', { class: 'doc-prose', style: 'margin-top:12px' }, `Coursework: ${e.coursework.join(', ')}.`),
      h('p', { class: 'skill-note', style: 'margin-top:8px' }, e.activities.join(' · ')),
    );
  }
  const title = entry.kind === 'role' ? `${entry.data.company} — ${entry.data.title}` : `${entry.data.short} — ${entry.data.degree}`;
  return h('article', { class: 'tm-card', 'aria-label': title },
    h('div', { class: 'tm-card-bar' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', {}, title)),
    body,
  );
}

function stars(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let hgt = 0;
  let raf = 0;
  const pts = Array.from({ length: 220 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    hgt = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = hgt * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, hgt);
    const cx = w / 2;
    const cy = hgt * 0.38;
    for (const p of pts) {
      if (!reducedMotion()) {
        p.z -= 0.0016;
        if (p.z <= 0.02) {
          p.z = 1;
          p.x = Math.random() * 2 - 1;
          p.y = Math.random() * 2 - 1;
        }
      }
      const sx = cx + (p.x / p.z) * w * 0.35;
      const sy = cy + (p.y / p.z) * hgt * 0.35;
      if (sx < 0 || sx > w || sy < 0 || sy > hgt) continue;
      const r = Math.max(0.3, (1 - p.z) * 1.8);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, (1 - p.z) * 1.2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  resize();
  draw();
  window.addEventListener('resize', resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}

export function createTimeMachine(os) {
  let layer = null;
  let stopStars = null;
  let returnFocus = null;

  function open() {
    if (layer) return;
    returnFocus = document.activeElement;
    const list = entries();
    let at = 0;
    const cards = list.map(card);
    const canvas = h('canvas', { 'aria-hidden': 'true' });
    const stage = h('div', { class: 'tm-stage' }, cards.slice().reverse());
    const ticks = list.map((e, i) => h('button', {
      class: 'tm-tick', type: 'button', onClick: () => go(i),
      'aria-label': `${e.kind === 'role' ? e.data.company : e.data.short}, ${e.end ? formatMonth(e.end) : 'now'}`,
    }, i === 0 ? 'Now' : formatMonth(e.end)));
    const olderBtn = h('button', { type: 'button', 'aria-label': 'Go back in time', onClick: () => go(at + 1) }, icon('chevron-up', 18));
    const newerBtn = h('button', { type: 'button', 'aria-label': 'Go forward in time', onClick: () => go(at - 1) }, icon('chevron-down', 18));
    const status = h('p', { 'aria-live': 'polite' });

    function go(i) {
      at = Math.max(0, Math.min(list.length - 1, i));
      cards.forEach((c, idx) => {
        const d = idx - at;
        c.style.setProperty('--d', String(Math.max(0, d)));
        c.dataset.past = String(d < 0);
        c.style.zIndex = String(100 - idx);
        c.inert = idx !== at;
      });
      ticks.forEach((t, idx) => t.setAttribute('aria-current', String(idx === at)));
      olderBtn.disabled = at === list.length - 1;
      newerBtn.disabled = at === 0;
      const e = list[at];
      status.textContent = `${e.kind === 'role' ? `${e.data.title}, ${e.data.company}` : `${e.data.degree}, ${e.data.school}`} · ${formatRange(e.start, e.end)}`;
    }

    const panel = h('div', { class: 'tm', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Time Machine: career history', tabindex: '-1' },
      canvas,
      h('div', { class: 'tm-head' }, h('h2', {}, 'Time Machine'), status),
      stage,
      h('div', { class: 'tm-arrows' }, olderBtn, newerBtn),
      h('nav', { class: 'tm-timeline', 'aria-label': 'Timeline' }, ticks),
      h('div', { class: 'tm-bottom' },
        h('button', { class: 'btn', type: 'button', onClick: () => close() }, 'Close'),
        h('button', { class: 'btn', type: 'button', onClick: () => { const e = list[at]; close(); os.openSection(e.kind === 'role' ? 'experience' : 'education', { focus: e.kind === 'role' ? `role-${e.id}` : null }); } }, 'Show in Finder'),
      ),
    );
    let wheelLock = 0;
    panel.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock < 420 || Math.abs(e.deltaY) < 8) return;
      wheelLock = now;
      go(at + (e.deltaY < 0 ? 1 : -1));
    }, { passive: false });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(at + 1); }
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(at - 1); }
      else trapTab(panel, e);
    });
    layer = panel;
    document.body.append(panel);
    stopStars = stars(canvas);
    go(0);
    panel.focus({ preventScroll: true });
  }

  function close({ fromHistory = false } = {}) {
    if (!layer) return;
    stopStars?.();
    layer.remove();
    layer = null;
    if (!fromHistory) os.leave('time-machine');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }

  return { open, close, get isOpen() { return Boolean(layer); } };
}
