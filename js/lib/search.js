// A small ranked search over everything in content.js. Spotlight and Folio's offline
// answers both use it. Pure functions, no DOM.

import {
  profile, projects, experience, education, skills, skillCategories, accomplishments, certifications,
  sections, skillLabel, projectsUsing, formatRange, listedSkillIds,
} from '../content.js';

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();
}

const words = (text) => normalize(text).split(' ').filter(Boolean);

export function buildIndex() {
  const items = [];

  sections.forEach((s) => items.push({
    id: `section:${s.id}`, type: 'section', target: s.id, icon: s.icon,
    title: s.label, subtitle: s.blurb, keywords: [s.short, s.id], text: '', weight: 34,
  }));

  items.push({
    id: 'section:resume', type: 'section', target: 'resume', icon: 'doc',
    title: 'Resume', subtitle: `${profile.resume.fileName}`, keywords: ['cv', 'pdf', 'resume', 'download'], text: '', weight: 36,
  });

  projects.forEach((p) => items.push({
    id: `project:${p.slug}`, type: 'project', target: p.slug, project: p,
    title: p.name, subtitle: `${p.kind}${p.year ? ` · ${p.year}` : ''}`,
    keywords: [p.kind, ...p.stack.map(skillLabel), p.team || ''],
    text: [p.tagline, p.summary, ...(p.flow || []), ...(p.features || []).map((x) => `${x.title} ${x.text}`)].join(' '), weight: p.featured ? 30 : 26,
  }));

  experience.forEach((r) => items.push({
    id: `role:${r.id}`, type: 'role', target: r.id, role: r,
    title: `${r.title}`, subtitle: `${r.company} · ${formatRange(r.start, r.end)}`,
    keywords: [r.company, r.location, r.type, ...r.stack.map(skillLabel)],
    text: [r.summary, ...r.bullets].join(' '), weight: 24,
  }));

  education.forEach((e) => items.push({
    id: `edu:${e.id}`, type: 'education', target: 'education', edu: e,
    title: e.degree, subtitle: `${e.school} · ${formatRange(e.start, e.end)}`,
    keywords: [e.school, e.short, 'gpa', 'masters', 'ms', 'iit', 'illinois tech', ...e.activities],
    text: e.coursework.join(' '), weight: 22,
  }));

  const listed = new Set(listedSkillIds());
  Object.entries(skills).forEach(([id, s]) => {
    const used = projectsUsing(id);
    const category = skillCategories.find((c) => c.skills.includes(id));
    if (!listed.has(id) && !used.length) return;
    items.push({
      id: `skill:${id}`, type: 'skill', target: id, skill: { id, ...s },
      title: s.label,
      subtitle: used.length ? `Used in ${used.length} project${used.length > 1 ? 's' : ''}` : (category ? category.label : 'Skill'),
      keywords: [category?.label || '', id], text: used.map((p) => p.name).join(' '), weight: 20,
    });
  });

  accomplishments.forEach((a) => items.push({
    id: `award:${a.id}`, type: 'award', target: 'achievements', icon: a.icon,
    title: a.title, subtitle: a.org, keywords: ['award', 'winner', 'hackathon'], text: '', weight: 16,
  }));

  certifications.forEach((c) => items.push({
    id: `cert:${c.id}`, type: 'cert', target: 'achievements', icon: c.icon,
    title: c.title, subtitle: c.issuer, keywords: ['certification', 'certificate', 'cert', ...(c.skills || []).map(skillLabel)], text: '', weight: 16,
  }));

  items.forEach((item) => {
    item._title = normalize(item.title);
    item._titleWords = words(item.title);
    item._keywords = item.keywords.map(normalize).filter(Boolean);
    item._text = normalize(`${item.subtitle} ${item.text}`);
  });
  return items;
}

// Characters of `needle` appear in order in `hay`; returns a 0..1 closeness score.
function fuzzy(needle, hay) {
  let i = 0;
  let gaps = 0;
  let last = -1;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) {
      if (last >= 0) gaps += j - last - 1;
      last = j;
      i++;
    }
  }
  if (i < needle.length) return 0;
  return 1 / (1 + gaps * 0.35);
}

function scoreToken(item, token) {
  let best = 0;
  if (item._title === token) best = 1000;
  else if (item._title.startsWith(token)) best = 820;
  else if (item._titleWords.some((w) => w.startsWith(token))) best = 640;
  else if (item._title.includes(token)) best = 420;

  for (const k of item._keywords) {
    if (k === token) best = Math.max(best, 380);
    else if (k.split(' ').some((w) => w.startsWith(token))) best = Math.max(best, 260);
    else if (token.length > 2 && k.includes(token)) best = Math.max(best, 170);
  }

  if (best === 0 && token.length > 2 && item._text.includes(token)) best = 90;
  if (best === 0 && token.length > 2) {
    const f = fuzzy(token, item._title.replace(/ /g, ''));
    if (f > 0.45) best = Math.round(150 * f);
  }
  return best;
}

export function search(index, query, { limit = 30 } = {}) {
  const tokens = words(query);
  if (!tokens.length) return [];
  const results = [];
  for (const item of index) {
    let total = 0;
    let ok = true;
    for (const token of tokens) {
      const s = scoreToken(item, token);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (!ok) continue;
    results.push({ item, score: total / tokens.length + item.weight });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
