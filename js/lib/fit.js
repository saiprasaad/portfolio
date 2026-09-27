// Fit Check: compares a pasted job description with the portfolio, entirely in the browser.
// It reports what matches (with evidence), what the portfolio doesn't show, and simple
// requirement checks for years, degree and location. Pure functions, no DOM.

import {
  skills, gapTerms, evidenceFor, listedSkillIds, experienceMonths, profile,
} from '../content.js';

// Patterns prefixed with "CS:" are case-sensitive (for words like "Go" or "REST").
function compile(pattern) {
  if (pattern.startsWith('CS:')) return new RegExp(pattern.slice(3), 'g');
  return new RegExp(pattern, 'gi');
}

const compiled = new Map();
function patternsFor(map, id) {
  const key = `${map === skills ? 's' : 'g'}:${id}`;
  if (!compiled.has(key)) compiled.set(key, (map[id].match || []).map(compile));
  return compiled.get(key);
}

function firstHit(text, regexes) {
  let best = null;
  for (const re of regexes) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m && (best === null || m.index < best.index)) best = { index: m.index, term: m[0] };
  }
  return best;
}

export function guessTitle(text) {
  const explicit = text.match(/(?:job title|title|role|position)\s*[:\-–]\s*([^\n]{3,80})/i);
  if (explicit) return explicit[1].trim();
  const first = text.split('\n').map((l) => l.trim()).find(Boolean) || '';
  if (first.length <= 90 && /(engineer|developer|scientist|architect|lead|intern|manager|designer|programmer|sde|swe)/i.test(first)) {
    return first.replace(/[|•·].*$/, '').replace(/\s[—–-]\s.*$/, '').trim();
  }
  return '';
}

function yearsAsked(text) {
  const re = /(\d{1,2})\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|industry|relevant|hands-on|software|work))?(?:\s+(?:experience|exp))?/gi;
  const found = [];
  let m;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    const context = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).toLowerCase();
    if (n > 0 && n <= 20 && /(experience|exp\b|professional|industry|building|developing|working)/.test(context)) found.push(n);
  }
  return found.length ? Math.min(...found) : null;
}

function degreeAsked(text) {
  const m = text.match(/\b(bachelor'?s|b\.?s\.?c?|b\.?tech|master'?s|m\.?s\.?|ph\.?d|degree)\b[^.\n]{0,60}?\b(computer science|cs|software engineering|engineering|related (?:field|discipline)|stem)\b/i);
  if (!m) return null;
  const level = /master|m\.?s/i.test(m[1]) ? 'master' : /ph\.?d/i.test(m[1]) ? 'phd' : 'bachelor';
  return { level, phrase: m[0] };
}

function locationNotes(text) {
  const notes = [];
  if (/\b(remote|work from home|wfh|distributed)\b/i.test(text)) notes.push('remote');
  if (/\bhybrid\b/i.test(text)) notes.push('hybrid');
  if (/\b(on-?site|in[- ]office|in person)\b/i.test(text)) notes.push('onsite');
  const nyc = /\b(new york|nyc|manhattan|brooklyn|jersey city|hoboken)\b/i.test(text);
  return { modes: notes, nyc };
}

export function analyzeJobDescription(raw) {
  const text = String(raw || '').slice(0, 20000);
  const listed = new Set(listedSkillIds());

  const matched = [];
  for (const id of Object.keys(skills)) {
    const hit = firstHit(text, patternsFor(skills, id));
    if (!hit) continue;
    const evidence = evidenceFor(id);
    if (!evidence.length && !listed.has(id)) continue;
    matched.push({ id, label: skills[id].label, term: hit.term, index: hit.index, listed: listed.has(id), evidence });
  }

  const gaps = [];
  for (const id of Object.keys(gapTerms)) {
    const hit = firstHit(text, patternsFor(gapTerms, id));
    if (!hit) continue;
    gaps.push({ id, label: gapTerms[id].label, term: hit.term, index: hit.index });
  }

  // "React" inside "React Native" is a gap, not a match.
  const hasRN = gaps.some((g) => g.id === 'reactnative');
  const matchedFinal = matched.filter((m) => !(hasRN && m.id === 'react' && !/\breact(?:\.js|js)?\b(?!\s*native)/i.test(text)));

  matchedFinal.sort((a, b) => a.index - b.index);
  gaps.sort((a, b) => a.index - b.index);

  const fullTimeYears = experienceMonths() / 12;
  const allYears = experienceMonths({ includeInternships: true }) / 12;
  const asked = yearsAsked(text);
  let yearsStatus = null;
  if (asked != null) {
    if (fullTimeYears + 0.2 >= asked) yearsStatus = 'ok';
    else if (allYears + 0.2 >= asked || asked - fullTimeYears <= 1) yearsStatus = 'close';
    else yearsStatus = 'below';
  }

  const degree = degreeAsked(text);
  const location = locationNotes(text);

  const considered = matchedFinal.length + gaps.length;
  return {
    title: guessTitle(text),
    matched: matchedFinal,
    gaps,
    coverage: considered ? matchedFinal.length / considered : 0,
    considered,
    years: { asked, status: yearsStatus, fullTime: fullTimeYears, withInternships: allYears },
    degree: degree ? { ...degree, status: 'ok', have: 'M.S. Computer Science, Illinois Tech (GPA 3.7)' } : null,
    location: (location.modes.length || location.nyc) ? { ...location, status: 'ok', have: `Based in ${profile.location}` } : null,
    empty: considered === 0 && asked == null && !degree,
  };
}

export const SAMPLE_JOB = `Full-Stack Software Engineer
Series B fintech · New York, NY (hybrid)

You'll build customer-facing features end to end: React and TypeScript on the front end, Python (Flask or FastAPI) and Java/Spring Boot services behind them.

Requirements
- 2+ years of professional software engineering experience
- Bachelor's degree in Computer Science or a related field
- Strong SQL (PostgreSQL or MySQL) and REST API design
- Experience with microservices, Docker and CI/CD
- Familiarity with AWS

Nice to have
- Kubernetes or Terraform
- GraphQL
- Experience shipping LLM features (RAG, prompt design)
- Redis caching`;
