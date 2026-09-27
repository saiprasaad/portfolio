// Document titles for each URL token.

import { profile, sections, getProject } from '../content.js';

const TITLES = {
  '': 'Saiprasaad Kalyanaraman · Full-Stack Software Engineer',
  resume: 'Resume', folio: 'Folio', fit: 'Fit Check', terminal: 'Terminal', mail: 'Mail',
  timeline: 'Timeline', settings: 'Settings', simple: 'Simple page',
};

export function titleFor(token = '') {
  const project = getProject(token);
  const section = sections.find((s) => s.id === token);
  const label = project?.name || section?.label || TITLES[token];
  return !token || !label ? TITLES[''] : `${label} · ${profile.name}`;
}
