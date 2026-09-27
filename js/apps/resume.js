// Resume: a web version of the resume on a paper sheet, built from content.js,
// with a link to the original PDF.

import { h } from '../lib/dom.js';
import {
  profile, experience, education, projects, skillCategories, certifications, accomplishments,
  formatRange, skillLabel, experiencePhrase,
} from '../content.js';
import { icon } from '../lib/sections.js';

function paper() {
  const edu = education[0];
  const featured = projects.filter((p) => p.featured).concat(projects.filter((p) => !p.featured)).slice(0, 5);
  return h('article', { class: 'paper', 'aria-label': 'Resume' },
    h('header', {},
      h('h1', {}, profile.name),
      h('div', { class: 'pp-role' }, `${profile.role} · ${profile.location}`),
      h('div', { class: 'pp-contact' },
        h('a', { href: `mailto:${profile.email}` }, profile.email),
        ...profile.links.map((l) => h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.handle)),
      ),
    ),
    h('h2', {}, 'Summary'),
    h('p', {}, `Full-stack software engineer with ${experiencePhrase()} of full-time experience and a Master's in Computer Science. ${profile.headline}`),
    h('h2', {}, 'Experience'),
    experience.map((r) => h('div', { class: 'pp-item' },
      h('div', { class: 'pp-line' }, h('strong', {}, `${r.title}, ${r.company}`), h('span', {}, formatRange(r.start, r.end))),
      h('div', { class: 'pp-sub' }, `${r.location} · ${r.type}`),
      h('ul', {}, r.bullets.map((b) => h('li', {}, b))),
    )),
    h('h2', {}, 'Selected projects'),
    featured.map((p) => h('div', { class: 'pp-item' },
      h('div', { class: 'pp-line' }, h('strong', {}, p.name), h('span', {}, p.year ? String(p.year) : '')),
      h('p', {}, `${p.tagline} ${p.stack.slice(0, 6).map(skillLabel).join(', ')}.`),
    )),
    h('h2', {}, 'Skills'),
    h('dl', { class: 'pp-skills' }, skillCategories.map((c) => [h('dt', {}, c.label), h('dd', {}, c.skills.map(skillLabel).join(', '))])),
    h('h2', {}, 'Education'),
    h('div', { class: 'pp-item' },
      h('div', { class: 'pp-line' }, h('strong', {}, `${edu.degree}, ${edu.school}`), h('span', {}, formatRange(edu.start, edu.end))),
      h('div', { class: 'pp-sub' }, `GPA ${edu.gpa} · ${edu.activities.join(', ')}`),
    ),
    h('div', { class: 'pp-cols' },
      h('div', {}, h('h2', {}, 'Certifications'), h('ul', {}, certifications.map((c) => h('li', {}, `${c.title} (${c.issuer})`)))),
      h('div', {}, h('h2', {}, 'Awards'), h('ul', {}, accomplishments.map((a) => h('li', {}, `${a.title} (${a.org})`)))),
    ),
  );
}

export function createResumeView({ allowPrint = false } = {}) {
  const sheet = paper();
  const canvas = h('div', { class: 'preview scroll' }, sheet);
  let zoom = 1;
  let fit = true;
  const label = h('span', { class: 'pill', style: 'min-width:48px;justify-content:center', 'aria-live': 'polite' }, '100%');

  const setZoom = (z, manual = true) => {
    zoom = Math.min(1.6, Math.max(0.35, z));
    if (manual) fit = false;
    sheet.style.setProperty('--zoom', zoom.toFixed(3));
    label.textContent = `${Math.round(zoom * 100)}%`;
  };

  const fitWidth = () => {
    const w = canvas.clientWidth - 48;
    if (w > 0) setZoom(Math.min(1, w / 816), false);
  };

  const toolbar = h('div', { class: 'doc-row', role: 'toolbar', 'aria-label': 'Resume controls' },
    h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Zoom out', onClick: () => setZoom(zoom - 0.1) }, icon('minus', 15)),
    label,
    h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Zoom in', onClick: () => setZoom(zoom + 0.1) }, icon('plus', 15)),
    h('button', { class: 'btn', type: 'button', onClick: () => { fit = true; fitWidth(); } }, 'Fit'),
    allowPrint ? h('button', { class: 'btn', type: 'button', onClick: () => window.print() }, icon('print', 15), 'Print') : null,
    h('a', { class: 'btn btn-primary', href: profile.resume.view, target: '_blank', rel: 'noopener' }, icon('external', 14), 'Open PDF'),
  );

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (fit) fitWidth(); }).observe(canvas);
  }
  requestAnimationFrame(fitWidth);

  return { el: canvas, toolbar, fitWidth };
}
