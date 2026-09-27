// Writes the simple page and the JSON-LD profile into index.html, so crawlers, link
// previews and visitors without JavaScript get the full content. Runs in CI before deploy.
//   node scripts/prerender.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { renderSimplePage } from '../js/lib/simple.js';
import { site, profile, experience, education, skills, listedSkillIds } from '../js/content.js';

const file = new URL('../index.html', import.meta.url);
const html = readFileSync(file, 'utf8');

const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  alternateName: profile.nickname,
  url: site.url,
  image: `${site.url}images/sai-640.jpg`,
  jobTitle: profile.role,
  description: profile.headline,
  worksFor: { '@type': 'Organization', name: experience[0].company },
  alumniOf: { '@type': 'CollegeOrUniversity', name: education[0].school },
  address: { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' },
  email: `mailto:${profile.email}`,
  sameAs: profile.links.map((l) => l.url),
  knowsAbout: listedSkillIds().map((id) => skills[id].label),
};

const indent = (text, pad) => text.split('\n').map((line) => (line ? pad + line : line)).join('\n');

const out = html
  .replace(/(<!-- prerender:start -->)[\s\S]*?(<!-- prerender:end -->)/, (_, a, b) => `${a}\n${indent(renderSimplePage({ prerendered: true }), '  ')}\n  ${b}`)
  .replace(/(<!-- jsonld:start -->)[\s\S]*?(<!-- jsonld:end -->)/, (_, a, b) => `${a}\n  <script type="application/ld+json">\n${indent(JSON.stringify(person, null, 2), '  ')}\n  </script>\n  ${b}`);

writeFileSync(file, out);
console.log(`Prerendered index.html (${Math.round(out.length / 1024)} KB)`);
