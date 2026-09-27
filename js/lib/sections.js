// Section documents shared by Finder (desktop) and the phone apps. Each renderer takes an
// `actions` object so the same markup can open a Quick Look on desktop or push a screen on a phone.

import { h, fromHtml } from './dom.js';
import { iconSvg } from './icons.js';
import { coverHtml } from './covers.js';
import {
  profile, experience, education, projects, skills, skillCategories, accomplishments, certifications,
  aboutParagraphs, experiencePhrase, formatRange, formatDuration, roleMonths, projectsUsing, listedSkillIds,
  skillLabel,
} from '../content.js';

export const icon = (name, size = 16, cls = '') => fromHtml(iconSvg(name, { size, cls }));

const MONO_TONES = ['#4f46e5', '#0e7490', '#b45309', '#be185d', '#15803d', '#7c3aed', '#1d4ed8', '#c2410c', '#0f766e', '#6d28d9'];
function toneFor(id) {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return MONO_TONES[n % MONO_TONES.length];
}

export const ROLE_TONES = { afficiency: '#4f46e5', 'open-avenues': '#d9480f', hexaware: '#0b7285', ey: '#6d28d9' };
export const ROLE_MARKS = { afficiency: 'Af', 'open-avenues': 'OA', hexaware: 'Hx', ey: 'EY' };

export function photo(size, cls = '') {
  const p = profile.photo;
  return h('img', {
    class: cls, src: p.src, srcset: p.srcset, sizes: `${size}px`, width: size, height: size, alt: p.alt, decoding: 'async',
  });
}

export function skillMark(id) {
  const s = skills[id];
  if (!s) return null;
  if (s.logo) {
    return h('span', { class: 'chip-mark' }, h('img', { src: `images/${s.logo}.png`, alt: '', width: 14, height: 14, loading: 'lazy', decoding: 'async' }));
  }
  return h('span', { class: 'chip-mark chip-mono', style: { '--chip-tone': toneFor(id) }, 'aria-hidden': 'true' }, s.mono || s.label.slice(0, 2));
}

// A skill chip; clicking it shows the projects that use the skill (when any do).
export function skillChip(id, { actions, count = false } = {}) {
  const s = skills[id];
  if (!s) return null;
  const used = projectsUsing(id).length;
  const kids = [skillMark(id), s.label];
  if (count && used) kids.push(h('span', { class: 'chip-count', 'aria-hidden': 'true' }, used));
  if (actions?.filterSkill && used) {
    return h('button', {
      class: 'chip', type: 'button', title: `Projects using ${s.label}`,
      'aria-label': `${s.label}: show ${used} project${used > 1 ? 's' : ''}`,
      onClick: () => actions.filterSkill(id),
    }, kids);
  }
  return h('span', { class: 'chip' }, kids);
}

export function chipList(ids, opts = {}) {
  return h('ul', { class: 'chips', 'aria-label': opts.label || 'Technologies' }, ids.map((id) => h('li', {}, skillChip(id, opts))));
}

function button(label, iconName, onClick, cls = 'btn') {
  return h('button', { class: cls, type: 'button', onClick }, iconName ? icon(iconName, 15) : null, label);
}

function linkButton(label, iconName, href) {
  return h('a', { class: 'link-btn', href, target: '_blank', rel: 'noopener' }, icon(iconName, 16), label);
}

function brandIcon(id) {
  return icon(id === 'github' || id === 'linkedin' || id === 'hackerrank' ? id : 'link', 16);
}

function kicker(text) {
  return h('div', { class: 'doc-kicker' }, text);
}

// ---------- About ----------

export function renderAbout(actions) {
  const now = new Date();
  const current = experience[0];
  const edu = education[0];
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  return h('div', { class: 'doc doc-stack' },
    h('section', { class: 'about-hero', 'aria-label': 'Introduction' },
      photo(112, 'about-photo'),
      h('div', {},
        h('h2', { class: 'about-name' }, profile.name),
        h('p', { class: 'about-role' }, `${profile.role} at ${profile.company} · ${profile.location}`),
        h('p', { class: 'about-headline' }, profile.headline),
        h('div', { class: 'doc-row' },
          button('Resume', 'doc', () => actions.openResume(), 'btn btn-primary'),
          button('Email Sai', 'mail', () => actions.openMail()),
          button('Check role fit', 'target', () => actions.openFit()),
        ),
      ),
    ),
    h('section', { class: 'doc-section', 'aria-label': 'About' },
      kicker('About'),
      h('div', {}, aboutParagraphs(now).map((t) => h('p', { class: 'doc-prose' }, t))),
    ),
    h('dl', { class: 'facts' },
      fact('Experience', `${capitalize(experiencePhrase(now))} full-time`),
      fact('Currently', `${current.title}, ${current.company}`),
      fact('Education', `${edu.degree.replace('Master of ', 'M.S. ')}, ${edu.short}`),
      fact('Based in', profile.location),
    ),
    h('section', { class: 'doc-section', 'aria-label': 'Featured projects' },
      h('div', { class: 'doc-row', style: 'justify-content:space-between' },
        kicker('Featured projects'),
        button('All projects', 'arrow-right', () => actions.openSection('projects'), 'btn btn-quiet'),
      ),
      h('div', { class: 'feature-strip' }, featured.map((p) => featureCard(p, actions))),
    ),
    h('section', { class: 'doc-section', 'aria-label': 'Links' },
      kicker('Elsewhere'),
      h('div', { class: 'link-row' }, profile.links.map((l) => linkButton(l.label, l.id, l.url))),
    ),
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fact(label, value) {
  return h('div', {}, h('dt', {}, label), h('dd', {}, value));
}

export function featureCard(p, actions) {
  return h('button', { class: 'feature-card', type: 'button', onClick: () => actions.openProject(p.slug), 'aria-label': `${p.name}: ${p.tagline}` },
    fromHtml(coverHtml(p)),
    h('strong', {}, p.name),
    h('span', {}, p.tagline),
  );
}

// ---------- Experience ----------

export function renderExperience(actions) {
  const now = new Date();
  return h('div', { class: 'doc doc-stack' },
    h('div', { class: 'doc-row', style: 'justify-content:space-between;align-items:flex-end' },
      h('div', {},
        h('h2', { class: 'doc-title' }, 'Experience'),
        h('p', { class: 'doc-prose', style: 'margin-top:4px' }, `${capitalize(experiencePhrase(now))} full-time, plus two internships.`),
      ),
      actions.openTimeMachine ? button('Browse in Time Machine', 'clock-back', () => actions.openTimeMachine()) : null,
    ),
    h('ol', { class: 'timeline' }, experience.map((r) => roleCard(r, actions, now))),
  );
}

export function roleCard(r, actions, now = new Date()) {
  const related = r.project ? projects.find((p) => p.slug === r.project) : null;
  return h('li', { class: `role${r.end ? '' : ' is-current'}`, id: `role-${r.id}`, style: { '--role-tone': ROLE_TONES[r.id] } },
    h('div', { class: 'role-head' },
      h('span', { class: 'role-mark', 'aria-hidden': 'true' }, ROLE_MARKS[r.id] || r.company.slice(0, 2)),
      h('div', {},
        h('h3', {}, r.title),
        h('p', { class: 'role-meta' }, `${r.company} · ${r.location}`),
      ),
      h('div', { class: 'role-when' },
        h('time', {}, formatRange(r.start, r.end)),
        h('span', {}, `${formatDuration(roleMonths(r, now))} · ${r.type}`),
      ),
    ),
    r.highlights?.length
      ? h('ul', { class: 'metrics', 'aria-label': 'Highlights' }, r.highlights.map((m) => h('li', { class: 'metric' }, h('strong', {}, m.value), h('span', {}, m.label))))
      : null,
    h('ul', { class: 'bullets' }, r.bullets.map((b) => h('li', {}, b))),
    h('div', { class: 'role-foot' },
      chipList(r.stack, { actions }),
      related ? button(`See ${related.name}`, 'arrow-right', () => actions.openProject(related.slug), 'btn btn-quiet') : null,
    ),
  );
}

// ---------- Skills ----------

export function renderSkills(actions, { touch = false } = {}) {
  const listed = new Set(listedSkillIds());
  const evidenced = Object.keys(skills)
    .filter((id) => !listed.has(id) && (projectsUsing(id).length || experience.some((r) => r.stack.includes(id))))
    .sort((a, b) => projectsUsing(b).length - projectsUsing(a).length || skillLabel(a).localeCompare(skillLabel(b)));
  return h('div', { class: 'doc doc-stack' },
    h('div', {},
      h('h2', { class: 'doc-title' }, 'Skills & technologies'),
      h('p', { class: 'doc-prose', style: 'margin-top:4px' }, `${touch ? 'Tap' : 'Click'} a skill with a number to see the projects that use it.`),
    ),
    h('div', { class: 'skill-groups' }, skillCategories.map((cat) => h('section', { class: 'skill-group', 'aria-label': cat.label },
      h('div', { class: 'skill-group-head' },
        h('span', { class: 'sg-icon', style: { '--tone': cat.accent }, 'aria-hidden': 'true' }, icon(cat.icon, 16)),
        h('h3', {}, cat.label),
        h('small', {}, `${cat.skills.length}`),
      ),
      chipList(cat.skills, { actions, count: true, label: cat.label }),
    ))),
    h('section', { class: 'doc-section', 'aria-label': 'Also used' },
      kicker('Also used in projects and roles'),
      chipList(evidenced, { actions, count: true, label: 'Also used' }),
    ),
  );
}

// ---------- Education ----------

export function renderEducation() {
  return h('div', { class: 'doc doc-stack' },
    h('h2', { class: 'doc-title' }, 'Education'),
    education.map((e) => h('article', { class: 'edu-card' },
      h('div', { class: 'edu-head' },
        h('span', { class: 'edu-mark', 'aria-hidden': 'true' }, 'IIT'),
        h('div', {},
          h('h3', {}, e.degree),
          h('p', { class: 'role-meta' }, `${e.school} · ${e.location}`),
          h('p', { class: 'role-meta' }, h('time', {}, formatRange(e.start, e.end))),
        ),
        h('div', { class: 'edu-gpa' }, h('strong', {}, e.gpa), h('span', {}, 'GPA')),
      ),
      h('div', { class: 'doc-section' },
        kicker('Activities'),
        h('ul', { class: 'chips' }, e.activities.map((a) => h('li', {}, h('span', { class: 'chip chip--plain' }, a)))),
      ),
      h('div', { class: 'doc-section' },
        kicker('Coursework'),
        h('ul', { class: 'chips' }, e.coursework.map((c) => h('li', {}, h('span', { class: 'chip chip--plain' }, c)))),
      ),
    )),
  );
}

// ---------- Achievements ----------

export function badge({ iconName, tone, title, sub, url }) {
  return h('li', { class: 'badge-card' },
    h('span', { class: `badge-art tone-${tone}`, 'aria-hidden': 'true' }, icon(iconName, 30)),
    h('strong', {}, title),
    h('span', {}, sub),
    url ? h('a', { class: 'pill pill--accent', href: url, target: '_blank', rel: 'noopener' }, icon('check', 12), 'Verify') : null,
  );
}

export function renderAchievements(filter = 'all') {
  const awards = h('section', { class: 'doc-section', 'aria-label': 'Awards' },
    kicker(`Awards · ${accomplishments.length}`),
    h('ul', { class: 'badges' }, accomplishments.map((a) => badge({ iconName: a.icon, tone: a.tone, title: a.title, sub: a.org }))),
  );
  const certs = h('section', { class: 'doc-section', 'aria-label': 'Certifications' },
    kicker(`Certifications · ${certifications.length}`),
    h('ul', { class: 'badges' }, certifications.map((c) => badge({ iconName: c.icon, tone: c.tone, title: c.title, sub: c.issuer, url: c.url }))),
  );
  return h('div', { class: 'doc doc-stack' }, filter !== 'certs' ? awards : null, filter !== 'awards' ? certs : null);
}

// ---------- Contact ----------

export function renderContact(actions) {
  const row = (label, value, ...tools) => h('div', { class: 'contact-row' }, h('dt', {}, label), h('dd', {}, value), tools.length ? h('div', { class: 'doc-row' }, tools) : h('span'));
  return h('div', { class: 'doc doc-stack' },
    h('article', { class: 'contact-card' },
      h('div', { class: 'contact-head' },
        photo(72),
        h('div', {},
          h('h2', {}, profile.name),
          h('p', { class: 'role-meta' }, `${profile.role} · ${profile.location}`),
        ),
      ),
      h('dl', { class: 'contact-rows' },
        row('Email', h('span', { class: 'selectable' }, profile.email),
          button('Copy', 'copy', () => actions.copy(profile.email, 'Email address copied')),
          button('Write', 'mail', () => actions.openMail(), 'btn btn-primary')),
        row('Location', profile.location),
        ...profile.links.map((l) => row(l.label,
          h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.handle),
          h('a', { class: 'btn btn-icon', href: l.url, target: '_blank', rel: 'noopener', 'aria-label': `Open ${l.label}` }, brandIcon(l.id)))),
        row('Resume', h('span', {}, profile.resume.fileName),
          button('View', 'eye', () => actions.openResume()),
          h('a', { class: 'btn btn-icon', href: profile.resume.view, target: '_blank', rel: 'noopener', 'aria-label': 'Open the PDF in Google Drive' }, icon('external', 15))),
      ),
    ),
  );
}

// ---------- Projects ----------

export function projectLinks(p, { size = 'btn' } = {}) {
  return p.links.map((l) => h('a', {
    class: l.type === 'demo' ? `${size} btn-primary` : size, href: l.url, target: '_blank', rel: 'noopener',
  }, icon(l.type === 'github' ? 'github' : l.type === 'video' ? 'play' : 'external', 15), l.label));
}

function relatedProjects(p) {
  return projects
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, score: o.stack.filter((s) => p.stack.includes(s)).length + (o.featured ? 0.1 : 0) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.o);
}

export function renderProjectDetail(p, actions) {
  const related = relatedProjects(p);
  const features = p.features || [];
  const flow = p.flow || [];
  return h('article', { class: 'pd', 'aria-labelledby': `pd-${p.slug}` },
    h('div', { class: 'pd-hero' },
      fromHtml(coverHtml(p)),
      h('div', { class: 'pd-text' },
        h('div', { class: 'pd-kicker' },
          h('span', { class: 'pill pill--accent' }, p.kind),
          p.year ? h('span', { class: 'pill' }, String(p.year)) : null,
          p.featured ? h('span', { class: 'pill' }, icon('star', 11), 'Featured') : null,
        ),
        h('h2', { class: 'pd-name', id: `pd-${p.slug}` }, p.name),
        h('p', { class: 'pd-tagline' }, p.tagline),
        p.status ? h('p', { class: 'pd-status' }, h('span', { class: 'pd-status-dot', 'aria-hidden': 'true' }), p.status) : null,
        p.links.length ? h('div', { class: 'doc-row' }, projectLinks(p)) : null,
      ),
    ),
    p.facts?.length ? h('dl', { class: 'pd-facts' }, p.facts.map((x) => h('div', {}, h('dt', {}, x.value), h('dd', {}, x.label)))) : null,
    h('div', { class: 'pd-body' },
      h('div', { class: 'pd-main' },
        h('section', { class: 'pd-section', 'aria-label': 'Overview' }, kicker('Overview'), h('p', { class: 'pd-summary' }, p.summary)),
        flow.length ? h('section', { class: 'pd-section', 'aria-label': 'How it works' },
          kicker('How it works'),
          h('ol', { class: 'pd-flow' }, flow.map((step, i) => h('li', {}, h('span', { class: 'pd-step', 'aria-hidden': 'true' }, String(i + 1)), h('span', {}, step)))),
        ) : null,
        features.length ? h('section', { class: 'pd-section', 'aria-label': 'Features' },
          kicker('Features'),
          h('ul', { class: 'pd-features' }, features.map((x) => h('li', {}, h('strong', {}, x.title), h('span', {}, x.text)))),
        ) : null,
        p.media.length ? h('section', { class: 'pd-section', 'aria-label': 'Screens and output' },
          kicker('Output'),
          h('div', { class: 'pd-media' }, p.media.map((m) => h('figure', {},
            h('img', { src: m.src, alt: m.alt, width: m.width, height: m.height, loading: 'lazy', decoding: 'async' }),
            m.caption ? h('figcaption', {}, m.caption) : null,
          ))),
        ) : null,
      ),
      h('aside', { class: 'pd-side' },
        h('div', { class: 'pd-box' }, h('h3', {}, 'Stack'), chipList(p.stack, { actions })),
        h('div', { class: 'pd-box' }, h('h3', {}, 'Details'),
          h('dl', { class: 'pd-kv' },
            h('dt', {}, 'Kind'), h('dd', {}, p.kind),
            p.year ? [h('dt', {}, 'Year'), h('dd', {}, String(p.year))] : null,
            p.team ? [h('dt', {}, 'Team'), h('dd', {}, p.team.replace('Built with ', 'With '))] : null,
            h('dt', {}, 'Code'), h('dd', {}, p.links.some((l) => l.type === 'github') ? 'Public on GitHub' : 'Not public'),
          ),
        ),
        related.length ? h('div', { class: 'pd-box' }, h('h3', {}, 'Related'),
          h('div', { class: 'doc-row' }, related.map((o) => button(o.name, null, () => actions.openProject(o.slug), 'btn')))) : null,
      ),
    ),
  );
}
