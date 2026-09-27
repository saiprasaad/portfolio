// Finds the skills a piece of text mentions, using the `match` patterns in content.js.
// Folio uses it to answer questions like "Has he used React?". Pure functions, no DOM.

import { skills, evidenceFor, listedSkillIds } from '../content.js';

// Patterns prefixed with "CS:" are case-sensitive (for words like "Go" or "REST").
function compile(pattern) {
  if (pattern.startsWith('CS:')) return new RegExp(pattern.slice(3), 'g');
  return new RegExp(pattern, 'gi');
}

const compiled = new Map();
function patternsFor(id) {
  if (!compiled.has(id)) compiled.set(id, (skills[id].match || []).map(compile));
  return compiled.get(id);
}

function firstIndex(text, regexes) {
  let best = -1;
  for (const re of regexes) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m && (best < 0 || m.index < best)) best = m.index;
  }
  return best;
}

// Ids of the skills `text` mentions, in the order they first appear. Only skills the portfolio
// lists or shows evidence for count, and "React" inside "React Native" doesn't.
export function skillsIn(raw) {
  const text = String(raw || '').slice(0, 20000);
  const listed = new Set(listedSkillIds());
  const found = [];
  for (const id of Object.keys(skills)) {
    const index = firstIndex(text, patternsFor(id));
    if (index < 0 || (!listed.has(id) && !evidenceFor(id).length)) continue;
    if (id === 'react' && !/\breact(?:\.js|js)?\b(?!\s*native)/i.test(text)) continue;
    found.push({ id, index });
  }
  return found.sort((a, b) => a.index - b.index).map((x) => x.id);
}
