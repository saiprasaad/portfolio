// Folio: the portfolio assistant, plus Fit Check for job descriptions.
// The backend contract is unchanged ({ message, context } -> { reply }). Recent turns are
// folded into `context` so follow-up questions work. When the service can't be reached,
// Folio answers from the portfolio data and says so.

import { h, session, reducedMotion } from '../lib/dom.js';
import { iconSvg } from '../lib/icons.js';
import {
  site, profile, projects, experience, education, sections, skills, skillCategories, accomplishments,
  certifications, portfolioContext, experiencePhrase, formatRange, evidenceFor, skillLabel, projectsUsing,
} from '../content.js';
import { buildIndex, search } from '../lib/search.js';
import { analyzeJobDescription, SAMPLE_JOB } from '../lib/fit.js';
import { skillChip, icon } from '../lib/sections.js';

const STORE = 'saios.folio.v2';
let messages = session.get(STORE, []) || [];
const views = new Set();
let index = null;

function save() {
  messages = messages.slice(-40);
  session.set(STORE, messages);
}

// ---------- Safe markdown (DOM only) ----------

function inline(parent, text) {
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|(\*([^*\s][^*]*?)\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.append(text.slice(last, m.index));
    if (m[1]) parent.append(h('strong', {}, m[2]));
    else if (m[3]) parent.append(h('code', {}, m[4]));
    else if (m[5]) parent.append(h('a', { href: m[7], target: '_blank', rel: 'noopener' }, m[6]));
    else if (m[8]) parent.append(h('a', { href: m[8], target: '_blank', rel: 'noopener' }, m[8].replace(/^https?:\/\/(www\.)?/, '')));
    else if (m[9]) parent.append(h('em', {}, m[10]));
    last = re.lastIndex;
  }
  if (last < text.length) parent.append(text.slice(last));
}

export function renderMarkdown(text) {
  const out = document.createDocumentFragment();
  let list = null;
  let listTag = '';
  let para = [];
  const flushPara = () => {
    if (!para.length) return;
    const p = h('p');
    inline(p, para.join(' '));
    out.append(p);
    para = [];
  };
  const flushList = () => {
    if (list) out.append(list);
    list = null;
    listTag = '';
  };
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^[-*•]\s+(.*)/)) || (m = line.match(/^\d+[.)]\s+(.*)/))) {
      flushPara();
      const tag = /^\d/.test(line) ? 'ol' : 'ul';
      if (listTag !== tag) {
        flushList();
        list = h(tag);
        listTag = tag;
      }
      const li = h('li');
      inline(li, m[1]);
      list.append(li);
    } else if ((m = line.match(/^#{1,4}\s+(.*)/))) {
      flushPara();
      flushList();
      const p = h('p');
      const strong = h('strong');
      inline(strong, m[1]);
      p.append(strong);
      out.append(p);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

// ---------- Understanding questions ----------

function mentionedSkills(text) {
  return analyzeJobDescription(text).matched.map((m) => m.id);
}

// Short names people use for projects; plain city or topic words don't count.
const PROJECT_ALIASES = {
  'repo-vision': ['repo vision', 'repovision'],
  'ai-log-summarizer': ['log summarizer', 'log summariser', 'log summary'],
  'youtube-translator': ['youtube translator', 'video translator'],
  'json-explorer': ['json explorer'],
  'campus-cooks': ['campus cooks', 'campus cook'],
  'chicago-streets-harmony': ['chicago streets', 'streets harmony'],
  'asana-automation': ['asana'],
  'encryption-module': ['encryption module', 'decryption module', 'aes module'],
  battleships: ['battleship'],
  'wordle-clone': ['wordle'],
};

function mentionedProject(text) {
  const t = text.toLowerCase();
  return projects.find((p) => t.includes(p.name.toLowerCase())
    || t.includes(p.slug.replace(/-/g, ' '))
    || (PROJECT_ALIASES[p.slug] || []).some((a) => t.includes(a))) || null;
}

// Requests to move around the site are handled directly, without the AI service.
export function detectIntent(text) {
  const t = text.toLowerCase().trim();
  if (/\bopen to\b/.test(t) || t.endsWith('?') && !/^(can|could|would|will) you\b/.test(t)) return null;
  const wants = /^(please\s+)?((can|could|would|will) you\s+)?(show|open|see|view|take me|go to|bring up|pull up|display|list)\b/.test(t)
    || /\b(show me|take me to|pull up|bring up|open (up )?(his|the|a))\b/.test(t);
  if (!wants) return null;
  if (/\b(resume|cv)\b/.test(t)) return { type: 'resume' };
  if (/\b(terminal|shell)\b/.test(t)) return { type: 'terminal' };
  if (/\b(timeline|career history)\b/.test(t)) return { type: 'timemachine' };
  if (/\b(fit check|job description)\b/.test(t)) return { type: 'fit' };
  if (/\b(email|mail|message)\b/.test(t)) return { type: 'mail' };
  const project = mentionedProject(text);
  if (project) return { type: 'project', slug: project.slug };
  const skill = mentionedSkills(text).find((id) => projectsUsing(id).length);
  if (skill) return { type: 'skill', id: skill };
  const section = sections.find((s) => t.includes(s.id) || t.includes(s.short.toLowerCase()));
  if (section) return { type: 'section', id: section.id };
  return null;
}

function list(items) {
  return items.map((i) => `- ${i}`).join('\n');
}

function projectLine(p) {
  return `**${p.name}**: ${p.tagline}`;
}

// Answers built only from content.js, for when the AI service is unavailable.
export function localAnswer(question) {
  const q = question.toLowerCase();
  const sources = [];
  const addProject = (p) => sources.push({ label: p.name, kind: 'project', id: p.slug });

  if (/^(hi|hello|hey|yo|hola)\b/.test(q)) {
    return { text: `Hi! I can tell you about Sai's projects, experience and skills. Try asking what he built with AI, or switch to Fit Check to compare a job description with his background.`, sources };
  }
  if (/(open to|available|availability|hiring|looking for (a )?(job|role|work)|job search|relocat|visa|sponsor|salary|compensation|notice period|start date)/.test(q)) {
    return {
      text: `I don't have details about Sai's availability, work authorization or preferences. The best way to ask is email: **${profile.email}**. You can also message him on [LinkedIn](${profile.links.find((l) => l.id === 'linkedin').url}).`,
      sources: [{ label: 'Write an email', kind: 'mail' }],
    };
  }
  if (/(email|contact|reach|get in touch|phone|linkedin|message him)/.test(q)) {
    return {
      text: `You can reach Sai at **${profile.email}**.\n\n${list(profile.links.map((l) => `${l.label}: ${l.url}`))}`,
      sources: [{ label: 'Write an email', kind: 'mail' }],
    };
  }
  if (/\b(resume|cv)\b/.test(q)) {
    return { text: `Here's his resume: [${profile.resume.fileName}](${profile.resume.view}). There's also a web version in the Resume app.`, sources: [{ label: 'Open resume', kind: 'resume' }] };
  }
  if (/(education|degree|school|university|college|gpa|master|study|studied)/.test(q)) {
    const e = education[0];
    return { text: `Sai has a **${e.degree}** from ${e.school} (${formatRange(e.start, e.end)}, GPA ${e.gpa}). Coursework included ${e.coursework.slice(0, 6).join(', ')} and more. He was also a Senior TechNews Writer and photographer.`, sources: [{ label: 'Education', kind: 'section', id: 'education' }] };
  }
  if (/(where|location|based|live|city|time ?zone)/.test(q) && !/project/.test(q)) {
    return { text: `Sai is based in **${profile.location}**.`, sources };
  }
  if (/(strongest|best|favou?rite|top|impressive|proud|flagship|highlight)/.test(q) && /(project|work|built)/.test(q) || /featured project/.test(q)) {
    const featured = projects.filter((p) => p.featured);
    featured.forEach(addProject);
    return { text: `Four projects stand out:\n\n${list(featured.map(projectLine))}\n\nRepo Vision is the most complete: three microservices, three forecasting models and a React dashboard.`, sources };
  }
  if (/(\bai\b|llm|machine learning|\bml\b|genai|generative|gpt|openai|ollama|\brag\b|whisper|nlp|model)/.test(q)) {
    const ai = projects.filter((p) => p.stack.some((s) => ['llms', 'openai', 'ollama', 'whisper', 'tensorflow', 'ml', 'genai', 'nlp'].includes(s)));
    ai.forEach(addProject);
    const aiSkills = skillCategories.find((c) => c.id === 'ai').skills.map(skillLabel).join(', ');
    return { text: `Sai's AI work so far:\n\n${list(ai.map(projectLine))}\n\nListed AI skills: ${aiSkills}.`, sources };
  }
  const project = mentionedProject(question);
  if (project) {
    addProject(project);
    const feats = (project.features || []).map((x) => `**${x.title}**: ${x.text}`);
    return { text: `**${project.name}** (${project.kind}${project.year ? `, ${project.year}` : ''}): ${project.summary}${feats.length ? `\n\n${list(feats)}` : ''}\n\nStack: ${project.stack.map(skillLabel).join(', ')}.`, sources };
  }
  const skillIds = mentionedSkills(question);
  if (skillIds.length) {
    const lines = skillIds.slice(0, 4).map((id) => {
      const ev = evidenceFor(id);
      return `**${skillLabel(id)}**: ${ev.length ? ev.map((e) => e.label).join(', ') : 'listed in his skills'}`;
    });
    skillIds.slice(0, 2).forEach((id) => projectsUsing(id).slice(0, 2).forEach(addProject));
    return { text: `Where Sai has used that:\n\n${list(lines)}`, sources };
  }
  if (/(experience|years|how long|senior|career|work history|job|role|afficiency|ernst|\bey\b|hexaware|open avenues)/.test(q)) {
    return {
      text: `Sai has ${experiencePhrase()} of full-time experience, plus two internships:\n\n${list(experience.map((r) => `**${r.title}**, ${r.company} (${formatRange(r.start, r.end)})`))}`,
      sources: [{ label: 'Experience', kind: 'section', id: 'experience' }],
    };
  }
  if (/(skill|stack|tech|language|framework|tools?)\b/.test(q)) {
    return { text: list(skillCategories.map((c) => `**${c.label}**: ${c.skills.map(skillLabel).join(', ')}`)), sources: [{ label: 'Skills', kind: 'section', id: 'skills' }] };
  }
  if (/(award|hackathon|won|achievement|certif)/.test(q)) {
    return { text: `**Awards**\n${list(accomplishments.map((a) => `${a.title} (${a.org})`))}\n\n**Certifications**\n${list(certifications.map((c) => `${c.title} (${c.issuer})`))}`, sources: [{ label: 'Achievements', kind: 'section', id: 'achievements' }] };
  }
  index = index || buildIndex();
  const hits = search(index, question).slice(0, 4);
  if (hits.length) {
    hits.forEach(({ item }) => { if (item.project) addProject(item.project); });
    return { text: `Here's what I found in the portfolio:\n\n${list(hits.map(({ item }) => `**${item.title}**: ${item.subtitle}`))}`, sources };
  }
  return { text: `I couldn't find that in Sai's portfolio. Try asking about his projects, experience, skills or education, or email him at **${profile.email}**.`, sources };
}

function sourcesFromReply(reply) {
  const text = reply.toLowerCase();
  const found = projects.filter((p) => text.includes(p.name.toLowerCase())).slice(0, 3).map((p) => ({ label: p.name, kind: 'project', id: p.slug }));
  if (/\bresume\b/.test(text) && found.length < 3) found.push({ label: 'Open resume', kind: 'resume' });
  return found;
}

async function callService(message, history) {
  const convo = history.slice(-8).map((m) => `${m.role === 'user' ? 'Visitor' : 'Folio'}: ${m.text}`).join('\n');
  const context = `${portfolioContext()}${convo ? `\n\n--- Conversation so far ---\n${convo}` : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(site.folioEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error(data.error || `HTTP ${res.status}`);
    return data.reply.trim();
  } finally {
    clearTimeout(timer);
  }
}

// Ask Folio; resolves to { text, sources, source: 'ai' | 'local' }.
export async function askFolio(question, { history = messages } = {}) {
  try {
    const reply = await callService(question, history);
    return { text: reply, sources: sourcesFromReply(reply), source: 'ai' };
  } catch {
    const local = localAnswer(question);
    return { ...local, source: 'local' };
  }
}

// ---------- Fit Check narrative ----------

function fitPrompt(jd) {
  return `A recruiter pasted the job description below. Using only the portfolio context, assess how well Saiprasaad fits it: his strongest matches with specific evidence, honest gaps, and a one-sentence summary. Keep it under 170 words and use short bullet points.\n\nJOB DESCRIPTION:\n${jd.slice(0, 6000)}`;
}

function localFitNarrative(result) {
  const top = result.matched.slice(0, 5).map((m) => `**${m.label}**: ${m.evidence.slice(0, 3).map((e) => e.label).join(', ') || 'listed in his skills'}`);
  const gaps = result.gaps.map((g) => g.label);
  const years = result.years.asked != null
    ? `The role asks for ${result.years.asked}+ years; Sai has ${experiencePhrase()} full-time (about ${result.years.withInternships.toFixed(1)} including internships).`
    : `Sai has ${experiencePhrase()} of full-time experience.`;
  return `${years}\n\nStrongest matches:\n${list(top)}${gaps.length ? `\n\nNot shown in the portfolio: ${gaps.join(', ')}.` : ''}`;
}

// ---------- View ----------

const SUGGESTIONS = [
  "What's his strongest project?",
  'What has he built with AI?',
  'Summarize his React experience',
  'How can I contact him?',
];

export function createFolioView(actions, { tab = 'chat', header = true } = {}) {
  const orb = h('span', { class: 'folio-orb', 'aria-hidden': 'true', html: iconSvg('sparkle', { size: 16 }) });
  const tabChat = h('button', { type: 'button', role: 'tab', id: `folio-tab-chat-${views.size}`, 'aria-selected': 'true', onClick: () => setTab('chat') }, 'Chat');
  const tabFit = h('button', { type: 'button', role: 'tab', id: `folio-tab-fit-${views.size}`, 'aria-selected': 'false', onClick: () => setTab('fit') }, 'Fit Check');
  const tablist = h('div', { class: 'segmented', role: 'tablist', 'aria-label': 'Folio mode' }, tabChat, tabFit);
  tablist.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setTab(current === 'chat' ? 'fit' : 'chat');
      (current === 'chat' ? tabChat : tabFit).focus();
    }
  });
  const head = header ? h('div', { class: 'folio-head', 'data-drag': '' },
    orb,
    h('div', { class: 'folio-id' }, h('strong', {}, 'Folio'), h('span', {}, "Sai's portfolio assistant")),
    tablist,
  ) : null;

  // Chat
  const log = h('div', { class: 'folio-chat scroll', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation with Folio' });
  const inputEl = h('textarea', {
    class: 'field', id: `folio-input-${views.size}`, rows: 1, placeholder: 'Ask about projects, skills, experience…', 'aria-label': 'Message Folio', 'data-autofocus': '',
  });
  const sendBtn = h('button', { class: 'send-btn', type: 'submit', 'aria-label': 'Send', html: iconSvg('arrow-up', { size: 18 }) });
  const form = h('form', { class: 'folio-form', onSubmit: (e) => { e.preventDefault(); send(inputEl.value); } }, inputEl, sendBtn);
  const suggest = h('div', { class: 'folio-suggest', role: 'group', 'aria-label': 'Suggested questions' },
    SUGGESTIONS.map((s) => h('button', { class: 'chip chip--plain', type: 'button', onClick: () => send(s) }, s)));
  const privacy = h('p', { class: 'folio-privacy' }, 'Folio uses an AI service and can make mistakes. Check important details on the resume.');
  const chatPane = h('div', { class: 'folio-pane', role: 'tabpanel', 'aria-labelledby': tabChat.id }, log, suggest, form, privacy);

  // Fit Check
  const jd = h('textarea', { class: 'field', id: `fit-jd-${views.size}`, placeholder: 'Paste a job description…', 'aria-label': 'Job description' });
  const result = h('div', { class: 'fit-output', 'aria-live': 'polite' });
  const fitForm = h('form', { class: 'fit-form', onSubmit: (e) => { e.preventDefault(); runFit(); } },
    jd,
    h('div', { class: 'doc-row' },
      h('button', { class: 'btn btn-quiet', type: 'button', onClick: () => { jd.value = SAMPLE_JOB; runFit({ sample: true }); } }, icon('doc', 15), 'Try an example'),
      h('button', { class: 'btn btn-primary', type: 'submit' }, icon('target', 15), 'Check fit'),
    ),
  );
  const fitPane = h('div', { class: 'folio-pane', role: 'tabpanel', 'aria-labelledby': tabFit.id, hidden: true },
    h('div', { class: 'fit scroll' },
      h('div', { class: 'fit-intro' },
        h('h3', {}, 'Fit Check'),
        h('p', {}, "Paste a job description to see how it lines up with Sai's projects and roles, gaps included. The match runs in your browser; nothing is sent unless you ask Folio for a written assessment."),
      ),
      fitForm,
      result,
    ),
  );

  const el = h('div', { class: 'folio' }, head, chatPane, fitPane);
  let current = 'chat';
  let busy = false;

  function setTab(next) {
    current = next;
    tabChat.setAttribute('aria-selected', String(next === 'chat'));
    tabFit.setAttribute('aria-selected', String(next === 'fit'));
    chatPane.hidden = next !== 'chat';
    fitPane.hidden = next !== 'fit';
    (next === 'chat' ? inputEl : jd).focus({ preventScroll: true });
    actions.onTab?.(next);
  }

  function sourceChips(list) {
    if (!list?.length) return null;
    return h('div', { class: 'fm-sources' }, list.map((s) => h('button', {
      class: 'chip chip--plain', type: 'button',
      onClick: () => {
        if (s.kind === 'project') actions.openProject(s.id);
        else if (s.kind === 'section') actions.openSection(s.id);
        else if (s.kind === 'resume') actions.openResume();
        else if (s.kind === 'mail') actions.openMail();
        else if (s.kind === 'skill') actions.filterSkill(s.id);
      },
    }, icon(s.kind === 'project' ? 'code' : s.kind === 'mail' ? 'mail' : s.kind === 'resume' ? 'doc' : 'arrow-right', 13), s.label)));
  }

  function bubble(m) {
    const node = h('div', { class: `folio-message ${m.role === 'user' ? 'fm-user' : 'fm-ai'}` });
    if (m.role === 'user') node.textContent = m.text;
    else node.append(renderMarkdown(m.text));
    return node;
  }

  function renderLog() {
    log.replaceChildren();
    if (!messages.length) {
      log.append(bubble({ role: 'ai', text: "Hi! I'm **Folio**, Sai's portfolio assistant. Ask me about his projects, experience or skills. Hiring? Switch to **Fit Check** and paste a job description." }));
    }
    messages.forEach((m) => {
      log.append(bubble(m));
      if (m.note) log.append(h('p', { class: 'fm-note' }, m.note));
      const chips = sourceChips(m.sources);
      if (chips) log.append(chips);
    });
    log.scrollTop = log.scrollHeight;
  }

  async function typeInto(node, text) {
    if (reducedMotion() || text.length < 40) {
      node.replaceChildren(renderMarkdown(text));
      return;
    }
    const duration = Math.min(1400, text.length * 5);
    const start = performance.now();
    await new Promise((resolve) => {
      const step = (now) => {
        const n = Math.ceil(text.length * Math.min(1, (now - start) / duration));
        node.replaceChildren(renderMarkdown(text.slice(0, n)));
        log.scrollTop = log.scrollHeight;
        if (n < text.length) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function send(raw) {
    const text = String(raw || '').trim();
    if (!text || busy) return;
    inputEl.value = '';
    autoSize();
    busy = true;
    sendBtn.disabled = true;
    const history = messages.slice();
    messages.push({ role: 'user', text });
    save();
    renderLog();
    views.forEach((v) => v !== api && v.refresh());

    const intent = detectIntent(text);
    if (intent) {
      const reply = performIntent(intent);
      messages.push({ role: 'ai', text: reply.text, sources: reply.sources });
      save();
      renderLog();
      busy = false;
      sendBtn.disabled = false;
      return;
    }

    const typing = h('div', { class: 'folio-message fm-ai fm-typing', 'aria-label': 'Folio is typing' }, h('i'), h('i'), h('i'));
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    orb.classList.add('is-thinking');
    const answer = await askFolio(text, { history });
    orb.classList.remove('is-thinking');
    typing.remove();
    const node = h('div', { class: 'folio-message fm-ai' });
    log.append(node);
    await typeInto(node, answer.text);
    const note = answer.source === 'local' ? "Folio's AI service didn't respond, so this answer comes straight from the portfolio." : '';
    messages.push({ role: 'ai', text: answer.text, sources: answer.sources, note });
    save();
    renderLog();
    views.forEach((v) => v !== api && v.refresh());
    busy = false;
    sendBtn.disabled = false;
    inputEl.focus({ preventScroll: true });
  }

  function performIntent(intent) {
    switch (intent.type) {
      case 'resume': actions.openResume(); return { text: 'Opened the resume.' };
      case 'terminal': actions.openTerminal?.(); return { text: 'Opened the Terminal. Try `neofetch`.' };
      case 'timemachine': actions.openTimeMachine?.(); return { text: 'Opened Timeline.' };
      case 'fit': setTab('fit'); return { text: 'Switched to Fit Check. Paste a job description to compare.' };
      case 'mail': actions.openMail(); return { text: 'Opened a new email to Sai.' };
      case 'project': {
        const p = projects.find((x) => x.slug === intent.slug);
        actions.openProject(p.slug);
        return { text: `Opened **${p.name}**.`, sources: [{ label: p.name, kind: 'project', id: p.slug }] };
      }
      case 'skill': {
        const used = projectsUsing(intent.id);
        actions.filterSkill(intent.id);
        return {
          text: `Showing ${used.length} project${used.length > 1 ? 's' : ''} that use **${skillLabel(intent.id)}**:\n\n${list(used.map(projectLine))}`,
          sources: used.slice(0, 3).map((p) => ({ label: p.name, kind: 'project', id: p.slug })),
        };
      }
      case 'section': {
        actions.openSection(intent.id);
        const s = sections.find((x) => x.id === intent.id);
        return { text: `Opened **${s.label}**.` };
      }
      default: return { text: 'Done.' };
    }
  }

  // ----- Fit Check -----

  function checkRow(status, text) {
    const mark = status === 'ok' ? 'check' : status === 'close' ? 'minus' : 'x';
    return h('li', { class: 'fit-check', 'data-status': status }, h('span', { class: 'fc-mark', html: iconSvg(mark, { size: 12 }) }), h('span', {}, text));
  }

  function runFit({ sample = false } = {}) {
    const text = jd.value.trim();
    result.replaceChildren();
    if (!text) {
      result.append(h('p', { class: 'skill-note' }, 'Paste a job description first, or try the example.'));
      jd.focus();
      return;
    }
    const r = analyzeJobDescription(text);
    if (r.empty) {
      result.append(h('div', { class: 'fit-result' }, h('p', {}, "I couldn't find any technologies or requirements in that text. Try pasting the full job description, including the requirements.")));
      return;
    }
    const pct = Math.round(r.coverage * 100);
    const checks = [];
    if (r.years.asked != null) {
      const have = `${experiencePhrase()} full-time, ${r.years.withInternships.toFixed(1)} years including internships`;
      checks.push(checkRow(r.years.status, `Asks for ${r.years.asked}+ years. Sai has ${have}.`));
    }
    if (r.degree) checks.push(checkRow('ok', `Asks for a degree. Sai has an ${r.degree.have}.`));
    if (r.location) {
      const modes = r.location.modes.length ? ` (${r.location.modes.join(', ')})` : '';
      checks.push(checkRow('ok', `${r.location.nyc ? 'New York role' : 'Location'}${modes}. Sai is based in New York.`));
    }

    const matches = h('ul', { class: 'fit-matches' }, r.matched.map((m) => h('li', { class: 'fit-match' },
      skillChip(m.id, { actions }),
      h('span', { class: 'fm-where' }, m.evidence.length ? m.evidence.slice(0, 4).map((e) => e.label).join(', ') : 'Listed in skills'),
    )));

    const ai = h('div', { class: 'fit-ai', hidden: true, 'aria-live': 'polite' });
    const askBtn = h('button', {
      class: 'btn', type: 'button',
      onClick: async () => {
        askBtn.disabled = true;
        ai.hidden = false;
        ai.replaceChildren(h('p', { class: 'skill-note' }, 'Folio is writing an assessment…'));
        let text2;
        let note = '';
        try {
          text2 = await callService(fitPrompt(text), []);
        } catch {
          text2 = localFitNarrative(r);
          note = "Folio's AI service didn't respond, so this summary comes from the match above.";
        }
        ai.replaceChildren(renderMarkdown(text2));
        if (note) ai.append(h('p', { class: 'skill-note' }, note));
        askBtn.disabled = false;
      },
    }, icon('sparkle', 15), 'Ask Folio for a written assessment');

    const title = r.title;
    const emailBtn = h('button', {
      class: 'btn btn-primary', type: 'button',
      onClick: () => actions.openMail({
        subject: title ? `${title}: your portfolio came up` : 'A role that matches your portfolio',
        body: `Hi Sai,\n\nI ran the Fit Check on your portfolio for ${title ? `our ${title} role` : 'a role on our team'}. It matched ${r.matched.length} of the ${r.considered} technologies we list, including ${r.matched.slice(0, 5).map((m) => m.label).join(', ')}.\n\nWould you be open to a quick chat?\n\n`,
      }),
    }, icon('mail', 15), 'Email Sai about this role');

    result.append(h('div', { class: 'fit-result' },
      sample ? h('span', { class: 'pill' }, 'Example job description') : null,
      h('div', { class: 'fit-summary' },
        h('div', { class: 'fit-ring-wrap' }, h('div', { class: 'fit-ring', style: { '--p': pct } }), h('strong', {}, `${pct}%`)),
        h('div', {},
          h('h4', {}, `Matches ${r.matched.length} of ${r.considered} technologies this role mentions`),
          h('p', {}, title ? `Role: ${title}` : 'Based on the technologies named in the description.'),
        ),
      ),
      checks.length ? h('ul', { class: 'fit-checks' }, checks) : null,
      r.matched.length ? h('div', { class: 'fit-group' }, h('h5', {}, 'Strong matches'), matches) : null,
      r.gaps.length ? h('div', { class: 'fit-group' }, h('h5', {}, 'Not in the portfolio yet'),
        h('ul', { class: 'chips' }, r.gaps.map((g) => h('li', {}, h('span', { class: 'chip chip--plain' }, g.label))))) : null,
      h('div', { class: 'fit-actions' }, emailBtn, askBtn),
      ai,
    ));
    result.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function autoSize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = `${Math.min(120, inputEl.scrollHeight)}px`;
  }

  inputEl.addEventListener('input', autoSize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(inputEl.value);
    }
  });

  const api = {
    el,
    setTab,
    get tab() { return current; },
    focus: () => (current === 'chat' ? inputEl : jd).focus({ preventScroll: true }),
    ask: (q) => { setTab('chat'); send(q); },
    fitWith: (text) => { setTab('fit'); jd.value = text; runFit(); },
    refresh: renderLog,
    destroy: () => views.delete(api),
  };
  views.add(api);
  renderLog();
  if (tab === 'fit') setTab('fit');
  return api;
}
