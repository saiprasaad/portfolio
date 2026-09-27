// The simple page: one fast, printable, crawlable page with everything on it.
// scripts/prerender.mjs writes its output into index.html for crawlers and no-JS visitors,
// and the site re-renders it at runtime when someone picks View → Simple Page.
// Pure string rendering, no DOM.

import {
  profile, experience, education, projects, skillCategories, skills, accomplishments, certifications,
  aboutParagraphs, experiencePhrase, formatRange, formatDuration, roleMonths,
} from '../content.js';
import { coverHtml } from './covers.js';
import { iconSvg } from './icons.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function skillChip(id) {
  const s = skills[id];
  if (!s) return '';
  const mark = s.logo
    ? `<img src="images/${esc(s.logo)}.png" alt="" width="16" height="16" loading="lazy" decoding="async">`
    : `<span class="sp-mono" aria-hidden="true">${esc(s.mono || s.label.slice(0, 2))}</span>`;
  return `<li class="sp-chip">${mark}${esc(s.label)}</li>`;
}

function linkIcon(type) {
  if (type === 'github') return iconSvg('github', { size: 15 });
  if (type === 'demo') return iconSvg('external', { size: 15 });
  if (type === 'video') return iconSvg('play', { size: 15 });
  return iconSvg('link', { size: 15 });
}

function renderRole(role, date) {
  const highlights = role.highlights?.length
    ? `<ul class="sp-metrics">${role.highlights.map((m) => `<li><strong>${esc(m.value)}</strong> ${esc(m.label)}</li>`).join('')}</ul>`
    : '';
  return `<li class="sp-role">
    <div class="sp-role-head">
      <h3>${esc(role.title)}</h3>
      <p class="sp-meta"><span>${esc(role.company)}</span> · <span>${esc(role.location)}</span></p>
      <p class="sp-meta sp-dates"><time>${esc(formatRange(role.start, role.end))}</time> · ${esc(formatDuration(roleMonths(role, date)))} · ${esc(role.type)}</p>
    </div>
    ${highlights}
    <ul class="sp-bullets">${role.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    <ul class="sp-chips" aria-label="Technologies">${role.stack.map(skillChip).join('')}</ul>
  </li>`;
}

function renderProject(p) {
  const videos = p.media.filter((m) => m.type === 'video').map((m) => ({ type: 'video', label: 'Watch the demo', url: m.src }));
  const all = [...videos, ...p.links];
  const links = all.length
    ? `<p class="sp-links">${all.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${linkIcon(l.type)}${esc(l.label)}</a>`).join('')}</p>`
    : '';
  const facts = p.facts?.length ? `<p class="sp-facts-line">${p.facts.map((x) => `<span><strong>${esc(x.value)}</strong> ${esc(x.label)}</span>`).join('')}</p>` : '';
  const flow = p.flow?.length ? `<h4 class="sp-sub">How it works</h4><ol class="sp-flow">${p.flow.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : '';
  const features = p.features?.length ? `<h4 class="sp-sub">Features</h4><ul class="sp-bullets sp-features">${p.features.map((x) => `<li><strong>${esc(x.title)}.</strong> ${esc(x.text)}</li>`).join('')}</ul>` : '';
  return `<article class="sp-project" id="${esc(p.slug)}">
    ${coverHtml(p, { cls: 'sp-cover' })}
    <div class="sp-project-body">
      <h3>${esc(p.name)}</h3>
      <p class="sp-meta">${esc(p.kind)}${p.year ? ` · ${p.year}` : ''}${p.status ? ` · ${esc(p.status)}` : ''}${p.team ? ` · ${esc(p.team)}` : ''}</p>
      <p class="sp-tagline">${esc(p.tagline)}</p>
      ${facts}
      <p>${esc(p.summary)}</p>
      ${flow}
      ${features}
      <ul class="sp-chips" aria-label="Technologies">${p.stack.slice(0, 8).map(skillChip).join('')}</ul>
      ${links}
    </div>
  </article>`;
}

export function renderSimplePage({ date = new Date(), prerendered = false } = {}) {
  const edu = education[0];
  const year = date.getFullYear();
  const featured = [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));
  const photo = profile.photo;

  return `<div class="simple-page" id="simple" data-prerendered="${prerendered ? 'true' : 'false'}">
  <header class="sp-top">
    <div class="sp-bar">
      <a class="sp-brand" href="#simple">${esc(profile.name)}</a>
      <nav class="sp-nav" aria-label="Sections">
        <a href="#about">About</a><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#skills">Skills</a><a href="#education">Education</a><a href="#achievements">Achievements</a><a href="#contact">Contact</a>
      </nav>
      <button type="button" class="sp-desktop-btn" data-action="exit-simple" hidden>${iconSvg('layout', { size: 15 })}Desktop view</button>
    </div>
  </header>
  <main class="sp-main">
    <section class="sp-hero" aria-labelledby="sp-name">
      <img class="sp-photo" src="${esc(photo.src)}" srcset="${esc(photo.srcset)}" sizes="112px" width="112" height="112" alt="${esc(photo.alt)}" decoding="async">
      <div class="sp-hero-text">
        <p class="sp-eyebrow">${esc(profile.role)} · ${esc(profile.location)}</p>
        <h1 id="sp-name">${esc(profile.name)}</h1>
        <p class="sp-lead">${esc(profile.headline)}</p>
        <p class="sp-actions">
          <a class="sp-btn sp-btn-primary" href="mailto:${esc(profile.email)}">${iconSvg('mail', { size: 15 })}${esc(profile.email)}</a>
          <a class="sp-btn" href="${esc(profile.resume.view)}" target="_blank" rel="noopener">${iconSvg('doc', { size: 15 })}Resume (PDF)</a>
          ${profile.links.map((l) => `<a class="sp-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${iconSvg(l.id, { size: 15 })}${esc(l.label)}</a>`).join('')}
        </p>
      </div>
    </section>

    <section class="sp-section" id="about" aria-labelledby="sp-about">
      <h2 id="sp-about">About</h2>
      ${aboutParagraphs(date).map((p) => `<p class="sp-prose">${esc(p)}</p>`).join('')}
      <dl class="sp-facts">
        <div><dt>Experience</dt><dd>${esc(experiencePhrase(date))} full-time, plus internships</dd></div>
        <div><dt>Currently</dt><dd>${esc(experience[0].title)}, ${esc(experience[0].company)}</dd></div>
        <div><dt>Education</dt><dd>${esc(edu.degree)}, ${esc(edu.short)}</dd></div>
        <div><dt>Based in</dt><dd>${esc(profile.location)}</dd></div>
      </dl>
    </section>

    <section class="sp-section" id="experience" aria-labelledby="sp-experience">
      <h2 id="sp-experience">Experience</h2>
      <ol class="sp-roles">${experience.map((r) => renderRole(r, date)).join('')}</ol>
    </section>

    <section class="sp-section" id="projects" aria-labelledby="sp-projects">
      <h2 id="sp-projects">Projects</h2>
      <div class="sp-projects">${featured.map(renderProject).join('')}</div>
    </section>

    <section class="sp-section" id="skills" aria-labelledby="sp-skills">
      <h2 id="sp-skills">Skills</h2>
      <dl class="sp-skills">${skillCategories.map((c) => `<div><dt>${esc(c.label)}</dt><dd><ul class="sp-chips">${c.skills.map(skillChip).join('')}</ul></dd></div>`).join('')}</dl>
    </section>

    <section class="sp-section" id="education" aria-labelledby="sp-education">
      <h2 id="sp-education">Education</h2>
      <div class="sp-edu">
        <h3>${esc(edu.degree)}</h3>
        <p class="sp-meta">${esc(edu.school)} · ${esc(edu.location)} · <time>${esc(formatRange(edu.start, edu.end))}</time> · GPA ${esc(edu.gpa)}</p>
        <p><strong>Activities:</strong> ${edu.activities.map(esc).join(', ')}</p>
        <p><strong>Coursework:</strong> ${edu.coursework.map(esc).join(', ')}</p>
      </div>
    </section>

    <section class="sp-section" id="achievements" aria-labelledby="sp-achievements">
      <h2 id="sp-achievements">Achievements</h2>
      <div class="sp-two">
        <div><h3>Awards</h3><ul class="sp-list">${accomplishments.map((a) => `<li><strong>${esc(a.title)}</strong><span>${esc(a.org)}</span></li>`).join('')}</ul></div>
        <div><h3>Certifications</h3><ul class="sp-list">${certifications.map((c) => `<li><strong>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a>` : esc(c.title)}</strong><span>${esc(c.issuer)}</span></li>`).join('')}</ul></div>
      </div>
    </section>

    <section class="sp-section" id="contact" aria-labelledby="sp-contact">
      <h2 id="sp-contact">Contact</h2>
      <p class="sp-prose">Reach me by email at <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>, or find me here:</p>
      <ul class="sp-list sp-contact">${profile.links.map((l) => `<li><strong>${esc(l.label)}</strong><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.handle)}</a></li>`).join('')}</ul>
    </section>
  </main>
  <footer class="sp-footer">
    <p>© ${year} ${esc(profile.name)} · New York</p>
  </footer>
</div>`;
}

