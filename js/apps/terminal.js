// Terminal: a small zsh-flavoured shell over a virtual copy of the portfolio.
// Output is built with DOM nodes only, so nothing typed is ever parsed as HTML.

import { h, session, isTypingTarget, openExternal } from '../lib/dom.js';
import {
  site, profile, projects, experience, education, skillCategories, accomplishments, certifications,
  aboutParagraphs, experiencePhrase, formatRange, formatMonth, skillLabel,
} from '../content.js';

const HISTORY_KEY = 'saios.terminal.history';
let cmdHistory = session.get(HISTORY_KEY, []) || [];

const seg = (t, c) => ({ t, c });
const link = (t, href) => ({ t, href });

// ---------- Virtual filesystem ----------

function file(name, content, extra = {}) {
  return { type: 'file', name, content, ...extra };
}
function dir(name, children, extra = {}) {
  return { type: 'dir', name, children, ...extra };
}

function projectLines(p) {
  const lines = [[seg(`# ${p.name}`, 't-bold')], [seg(`${p.kind}${p.year ? ` · ${p.year}` : ''}`, 't-dim')], '', p.summary];
  if (p.facts?.length) lines.push('', [seg(p.facts.map((x) => `${x.value} ${x.label}`).join(' · '), 't-cyan')]);
  if (p.flow?.length) {
    lines.push('', seg('## How it works', 't-cmd'));
    p.flow.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  }
  if (p.features?.length) {
    lines.push('', seg('## Features', 't-cmd'));
    p.features.forEach((x) => lines.push([seg(`- ${x.title}: `, 't-bold'), x.text]));
  }
  lines.push('', [seg('Stack: ', 't-dim'), p.stack.map(skillLabel).join(', ')]);
  if (p.team) lines.push([seg('Team: ', 't-dim'), p.team]);
  p.links.forEach((l) => lines.push([seg(`${l.label}: `, 't-dim'), link(l.url, l.url)]));
  lines.push('', [seg('Tip: ', 't-dim'), seg(`open ${p.slug}.md`, 't-cmd'), seg(' shows it in Quick Look.', 't-dim')]);
  return lines;
}

function roleLines(r) {
  const lines = [[seg(`# ${r.title}`, 't-bold')], [seg(`${r.company} · ${r.location} · ${formatRange(r.start, r.end)}`, 't-dim')], ''];
  r.bullets.forEach((b) => lines.push(`- ${b}`));
  lines.push('', [seg('Stack: ', 't-dim'), r.stack.map(skillLabel).join(', ')]);
  return lines;
}

function buildFs() {
  const edu = education[0];
  return dir('~', [
    file('README.md', () => [
      [seg(`Welcome to ${site.osName}.`, 't-bold')],
      'Everything in this home folder mirrors the Finder window.',
      '',
      [seg('ls', 't-cmd'), '            list what is here'],
      [seg('cd projects', 't-cmd'), '   move into a folder'],
      [seg('cat about.txt', 't-cmd'), ' read a file'],
      [seg('open resume.pdf', 't-cmd'), ' open it in the desktop'],
    ]),
    file('about.txt', () => [[seg(profile.name, 't-bold')], [seg(`${profile.role} · ${profile.location}`, 't-dim')], '', ...aboutParagraphs().flatMap((p) => [p, ''])], { open: ['section', 'about'] }),
    file('contact.vcf', () => [
      'BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`, `TITLE:${profile.role}`, `ORG:${profile.company}`,
      [`EMAIL:`, link(profile.email, `mailto:${profile.email}`)],
      ...profile.links.map((l) => [`URL;TYPE=${l.label}:`, link(l.url, l.url)]),
      `ADR:;;;${profile.city};;;USA`, 'END:VCARD',
    ], { open: ['section', 'contact'] }),
    file('resume.pdf', null, { open: ['resume'], binary: true }),
    dir('projects', projects.map((p) => file(`${p.slug}.md`, () => projectLines(p), { open: ['project', p.slug] })), { open: ['section', 'projects'] }),
    dir('experience', experience.map((r) => file(`${r.id}.md`, () => roleLines(r), { open: ['section', 'experience'] })), { open: ['section', 'experience'] }),
    dir('education', [file(`${edu.id}.md`, () => [
      [seg(`# ${edu.degree}`, 't-bold')], [seg(`${edu.school} · ${formatRange(edu.start, edu.end)} · GPA ${edu.gpa}`, 't-dim')], '',
      [seg('Activities: ', 't-dim'), edu.activities.join(', ')], [seg('Coursework: ', 't-dim'), edu.coursework.join(', ')],
    ], { open: ['section', 'education'] })], { open: ['section', 'education'] }),
    file('skills.txt', () => skillCategories.map((c) => [seg(`${c.label.padEnd(24)}`, 't-cyan'), c.skills.map(skillLabel).join(', ')]), { open: ['section', 'skills'] }),
    dir('achievements', [
      file('awards.txt', () => accomplishments.map((a) => [seg('★ ', 't-cmd'), a.title, seg(` · ${a.org}`, 't-dim')])),
      file('certifications.txt', () => certifications.map((c) => [seg('✓ ', 't-ok'), c.title, seg(` · ${c.issuer}`, 't-dim')])),
    ], { open: ['section', 'achievements'] }),
    file('.secrets', () => [[seg('cat: .secrets: Permission denied', 't-err')], [seg('hint: ', 't-dim'), seg('sudo hire-me', 't-cmd')]], { hidden: true }),
  ]);
}

// ---------- Helpers ----------

function hashOf(text) {
  let n = 2166136261;
  for (const ch of text) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0;
  return n.toString(16).padStart(8, '0').slice(0, 7);
}

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function sizeOf(node) {
  if (node.type === 'dir') return '-';
  if (node.binary) return '184K';
  const text = node.content().flat(2).map((x) => (typeof x === 'string' ? x : x?.t || '')).join('');
  return `${(Math.max(120, text.length) / 1024).toFixed(1)}K`;
}

function commonPrefix(list) {
  if (!list.length) return '';
  let p = list[0];
  for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}

// Same figure as the rest of the site: full-time experience, not time since the first job.
function careerUptime() {
  const first = experience[experience.length - 1].start;
  return `${experiencePhrase()} full-time, plus internships (first job ${formatMonth(first)})`;
}

const COMMANDS = {
  help: 'Show this list',
  ls: 'List files (try ls -la)',
  cd: 'Change folder',
  pwd: 'Print the current folder',
  cat: 'Print a file',
  open: 'Open a file or folder on the desktop',
  tree: 'Show the folder tree',
  neofetch: 'System summary',
  'git log': 'Career history as commits',
  skills: 'Skills by category',
  projects: 'List projects',
  contact: 'Contact details',
  email: 'Write an email to Sai',
  resume: 'Open the resume',
  ask: 'Ask Folio a question, e.g. ask what did he build with AI?',
  fit: 'Check a job description against his experience',
  theme: 'theme light | dark | auto',
  wallpaper: 'wallpaper dynamic | dawn | day | dusk | night | graphite',
  history: 'Commands you have run',
  clear: 'Clear the screen (Ctrl+L)',
  exit: 'Close the terminal',
};

const HIDDEN_COMMANDS = ['whoami', 'date', 'echo', 'uname', 'uptime', 'man', 'sudo', 'rm', 'vim', 'nano', 'emacs', 'hello', 'simple', 'timemachine', 'git', 'cls'];

// ---------- View ----------

export function createTerminalView(actions, { touch = false } = {}) {
  const root = buildFs();
  let cwd = [];
  let historyIndex = cmdHistory.length;
  let draft = '';
  let lastTab = 0;

  const output = h('div', { class: 'terminal-output', role: 'log', 'aria-live': 'polite', 'aria-label': 'Terminal output' });
  const promptEl = h('span', { class: 'terminal-prompt', 'aria-hidden': 'true' });
  const input = h('input', {
    class: 'terminal-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    'aria-label': 'Terminal command', 'data-autofocus': '', enterkeyhint: 'send',
  });
  const form = h('form', { class: 'terminal-form', onSubmit: (e) => { e.preventDefault(); submit(); } }, promptEl, input);
  const chips = h('div', { class: 'terminal-chips', style: touch ? 'display:flex' : null },
    ['help', 'ls', 'neofetch', 'git log', 'cat about.txt', 'projects', 'ask what did he build with AI?'].map((c) => h('button', {
      type: 'button', onClick: () => { input.value = c; submit(); },
    }, c)));
  const scroller = h('div', { class: 'terminal scroll', onClick: (e) => { if (!window.getSelection()?.toString() && !e.target.closest('a, button')) input.focus({ preventScroll: true }); } }, output, form, chips);

  const pathString = (parts = cwd) => (parts.length ? `~/${parts.join('/')}` : '~');

  function renderPrompt() {
    promptEl.replaceChildren('sai@portfolio ', h('span', { class: 't-path' }, pathString()), ' %');
  }

  function printLine(parts) {
    const line = h('div', { class: 'terminal-line' });
    [parts].flat().forEach((p) => {
      if (p == null) return;
      if (typeof p === 'string' || typeof p === 'number') line.append(String(p));
      else if (p instanceof Node) line.append(p);
      else if (p.href) line.append(h('a', { href: p.href, target: '_blank', rel: 'noopener' }, p.t));
      else line.append(h('span', { class: p.c }, p.t));
    });
    output.append(line);
  }

  function print(...lines) {
    lines.forEach((l) => printLine(l === '' ? ' ' : l));
    scroller.scrollTop = scroller.scrollHeight;
  }

  function echoCommand(text) {
    printLine([seg('sai@portfolio ', 't-ok'), seg(pathString(), 't-dir'), seg(' % ', 't-ok'), text]);
  }

  function resolve(pathText = '') {
    let parts = pathText.startsWith('~') || pathText.startsWith('/') ? [] : [...cwd];
    const raw = pathText.replace(/^~\/?/, '').replace(/^\/(home\/sai\/?)?/, '');
    for (const piece of raw.split('/').filter(Boolean)) {
      if (piece === '.') continue;
      if (piece === '..') parts.pop();
      else parts.push(piece);
    }
    let node = root;
    for (const piece of parts) {
      if (node.type !== 'dir') return { node: null, parts };
      node = node.children.find((c) => c.name === piece);
      if (!node) return { node: null, parts };
    }
    return { node, parts };
  }

  function listing(node, { all = false, long = false } = {}) {
    const kids = node.children.filter((c) => all || !c.hidden);
    if (!long) {
      const items = kids.map((c) => (c.type === 'dir' ? seg(`${c.name}/`, 't-dir') : seg(c.name, c.binary ? 't-accent' : undefined)));
      const line = [];
      items.forEach((it, i) => { line.push(it); if (i < items.length - 1) line.push('   '); });
      print(line);
      return;
    }
    const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date());
    print([seg(`total ${kids.length}`, 't-dim')]);
    kids.forEach((c) => {
      print([seg(c.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--', 't-dim'), '  sai  staff  ', sizeOf(c).padStart(5), `  ${date}  `, c.type === 'dir' ? seg(`${c.name}/`, 't-dir') : c.name]);
    });
  }

  function tree(node, prefix = '') {
    const kids = node.children.filter((c) => !c.hidden);
    kids.forEach((c, i) => {
      const last = i === kids.length - 1;
      print([seg(`${prefix}${last ? '└── ' : '├── '}`, 't-dim'), c.type === 'dir' ? seg(`${c.name}/`, 't-dir') : c.name]);
      if (c.type === 'dir') tree(c, `${prefix}${last ? '    ' : '│   '}`);
    });
  }

  function runOpen(target) {
    if (!target) return print([seg('usage: open <file | folder | url>', 't-dim')]);
    if (/^https?:\/\//.test(target)) {
      print([seg('Opening ', 't-dim'), link(target, target)]);
      openExternal(target);
      return;
    }
    if (target === '.' && !cwd.length) {
      actions.openSection('root');
      return print([seg('Opened Finder.', 't-dim')]);
    }
    const { node } = resolve(target);
    const fallback = node || resolve(`${target}.md`).node;
    const n = fallback;
    if (!n) return print([seg(`open: ${target}: No such file or directory`, 't-err')]);
    const how = n.open;
    if (!how) return print([seg(`open: ${target}: nothing to open it with`, 't-err')]);
    if (how[0] === 'section') actions.openSection(how[1]);
    else if (how[0] === 'project') actions.openProject(how[1]);
    else if (how[0] === 'resume') actions.openResume();
    print([seg(`Opened ${n.name}.`, 't-dim')]);
  }

  function gitLog() {
    const [aff, oa, hex, ey] = experience;
    const edu = education[0];
    const row = (graph, text, when, deco) => {
      const hash = hashOf(text);
      print([seg(graph, 't-cmd'), seg(hash, 't-cmd'), ' ', deco ? seg(`(${deco}) `, 't-accent') : '', text, seg(`  ${when}`, 't-dim')]);
    };
    row('* ', `${aff.title} @ ${aff.company}`, formatMonth(aff.start), 'HEAD -> main');
    row('*   ', `Merge branch 'illinois-tech': ${edu.degree}, GPA ${edu.gpa}`, formatMonth(edu.end));
    print([seg('|\\  ', 't-cmd')]);
    row('| * ', `${oa.title} @ ${oa.company}`, formatMonth(oa.start));
    row('| * ', `${hex.title} @ ${hex.company}`, formatMonth(hex.start));
    row('| * ', `Start ${edu.degree} @ ${edu.short}`, formatMonth(edu.start), 'illinois-tech');
    print([seg('|/  ', 't-cmd')]);
    row('* ', `${ey.title} @ ${ey.company}`, formatMonth(ey.start));
    row('* ', 'Initial commit: hello, world', '');
  }

  function neofetch() {
    const listed = (id) => skillCategories.find((c) => c.id === id).skills.map(skillLabel);
    const info = [
      [seg('sai', 't-ok'), '@', seg('portfolio', 't-ok')],
      [seg('-------------', 't-dim')],
      [seg('OS: ', 't-cyan'), `${site.osName} ${site.osVersion}`],
      [seg('Host: ', 't-cyan'), 'saiprasaad.com'],
      [seg('Role: ', 't-cyan'), `${profile.role} @ ${profile.company}`],
      [seg('Uptime: ', 't-cyan'), careerUptime()],
      [seg('Location: ', 't-cyan'), profile.location],
      [seg('Shell: ', 't-cyan'), 'zsh 5.9 (portfolio edition)'],
      [seg('Languages: ', 't-cyan'), listed('languages').concat(['JavaScript', 'TypeScript']).join(', ')],
      [seg('Frontend: ', 't-cyan'), 'React, Angular, TypeScript'],
      [seg('Backend: ', 't-cyan'), listed('backend').join(', ')],
      [seg('Mobile: ', 't-cyan'), listed('mobile').join(', ')],
      [seg('AI: ', 't-cyan'), 'LLMs, RAG, Ollama, OpenAI, Whisper'],
      [seg('Projects: ', 't-cyan'), `${projects.length} · Certifications: ${certifications.length}`],
      [seg('Contact: ', 't-cyan'), link(profile.email, `mailto:${profile.email}`)],
    ];
    const infoCol = h('div', { class: 't-fetch' });
    info.forEach((parts) => {
      const line = h('div', { class: 'terminal-line' });
      parts.forEach((p) => {
        if (typeof p === 'string') line.append(p);
        else if (p.href) line.append(h('a', { href: p.href }, p.t));
        else line.append(h('span', { class: p.c }, p.t));
      });
      infoCol.append(line);
    });
    infoCol.append(h('div', { class: 't-swatches', 'aria-hidden': 'true' },
      ['#ff5f57', '#febc2e', '#28c840', '#56d4dd', '#6cb6ff', '#d2a8ff', '#e7e7ea', '#8b8d98'].map((c) => h('i', { style: `background:${c}` }))));
    output.append(infoCol);
    scroller.scrollTop = scroller.scrollHeight;
  }

  async function ask(question) {
    if (!question) return print([seg('usage: ask <question>', 't-dim')]);
    print([seg('Folio is thinking…', 't-dim')]);
    const thinking = output.lastChild;
    try {
      const { text, source } = await actions.ask(question);
      thinking.remove();
      const plain = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
      plain.split('\n').forEach((l) => print(l ? [l.replace(/^[-*]\s+/, '• ')] : ''));
      if (source === 'local') print([seg('(answered from the portfolio data because the AI service did not respond)', 't-dim')]);
    } catch {
      thinking.remove();
      print([seg('Folio could not answer right now. Try again in a moment.', 't-err')]);
    }
  }

  const handlers = {
    help() {
      print([seg(`${site.osName} Terminal. Commands:`, 't-bold')]);
      Object.entries(COMMANDS).forEach(([name, desc]) => print([seg(name.padEnd(12), 't-cmd'), seg(desc, 't-dim')]));
      print('', [seg('Tab completes, ↑ and ↓ browse history.', 't-dim')]);
    },
    ls(args) {
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const target = args.find((a) => !a.startsWith('-'));
      const { node } = resolve(target || '.');
      if (!node) return print([seg(`ls: ${target}: No such file or directory`, 't-err')]);
      if (node.type === 'file') return print(node.name);
      listing(node, { all: flags.includes('a'), long: flags.includes('l') });
    },
    cd(args) {
      const target = args[0] || '~';
      const { node, parts } = resolve(target);
      if (!node) return print([seg(`cd: no such file or directory: ${target}`, 't-err')]);
      if (node.type !== 'dir') return print([seg(`cd: not a directory: ${target}`, 't-err')]);
      cwd = parts;
      renderPrompt();
    },
    pwd() {
      print(`/home/sai${cwd.length ? `/${cwd.join('/')}` : ''}`);
    },
    cat(args) {
      if (!args.length) return print([seg('usage: cat <file>', 't-dim')]);
      args.forEach((target) => {
        const { node } = resolve(target);
        const n = node || resolve(`${target}.md`).node;
        if (!n) return print([seg(`cat: ${target}: No such file or directory`, 't-err')]);
        if (n.type === 'dir') return print([seg(`cat: ${target}: Is a directory`, 't-err')]);
        if (n.binary) return print([seg(`cat: ${n.name}: binary file. Try `, 't-dim'), seg(`open ${n.name}`, 't-cmd')]);
        n.content().forEach((line) => print(line));
      });
    },
    open(args) {
      runOpen(args[0]);
    },
    tree(args) {
      const { node } = resolve(args[0] || '.');
      if (!node || node.type !== 'dir') return print([seg(`tree: ${args[0] || '.'}: not a folder`, 't-err')]);
      print(seg(pathString(), 't-dir'));
      tree(node);
    },
    neofetch,
    git(args) {
      if (args[0] === 'log') return gitLog();
      if (args[0] === 'status') return print('On branch main', "Your branch is up to date with 'origin/career'.", '', 'nothing to commit, working tree clean');
      print([seg('usage: git log | git status', 't-dim')]);
    },
    skills() {
      skillCategories.forEach((c) => print([seg(c.label.padEnd(24), 't-cyan'), c.skills.map(skillLabel).join(', ')]));
    },
    projects(args) {
      if (args[0]) return handlers.cat([`~/projects/${args[0].replace(/\.md$/, '')}.md`]);
      projects.forEach((p) => print([seg(p.slug.padEnd(26), 't-dir'), p.tagline]));
      print('', [seg('Read one with ', 't-dim'), seg('cat projects/repo-vision.md', 't-cmd'), seg(' or ', 't-dim'), seg('open projects/repo-vision.md', 't-cmd')]);
    },
    contact() {
      print([seg('Email     ', 't-cyan'), link(profile.email, `mailto:${profile.email}`)]);
      profile.links.forEach((l) => print([seg(l.label.padEnd(10), 't-cyan'), link(l.handle, l.url)]));
      print([seg('Location  ', 't-cyan'), profile.location]);
    },
    email() {
      actions.openMail();
      print([seg('Opened a new message to Sai.', 't-dim')]);
    },
    resume() {
      actions.openResume();
      print([seg('Opened the resume.', 't-dim')]);
    },
    ask(args, raw) {
      return ask(raw.replace(/^ask\s*/i, '').trim());
    },
    fit() {
      actions.openFit();
      print([seg('Opened Fit Check in Folio.', 't-dim')]);
    },
    theme(args) {
      const v = args[0];
      if (!['light', 'dark', 'auto'].includes(v)) return print([seg('usage: theme light | dark | auto', 't-dim')]);
      actions.setTheme(v);
      print([seg(`Appearance set to ${v}.`, 't-dim')]);
    },
    wallpaper(args) {
      const v = args[0];
      const options = ['dynamic', 'dawn', 'day', 'dusk', 'night', 'graphite'];
      if (!options.includes(v)) return print([seg(`usage: wallpaper ${options.join(' | ')}`, 't-dim')]);
      actions.setWallpaper(v);
      print([seg(`Wallpaper set to ${v}.`, 't-dim')]);
    },
    history() {
      cmdHistory.forEach((c, i) => print([seg(String(i + 1).padStart(4), 't-dim'), `  ${c}`]));
    },
    clear() {
      output.replaceChildren();
    },
    cls() {
      output.replaceChildren();
    },
    exit() {
      actions.close?.();
    },
    whoami() {
      print('sai');
    },
    date() {
      print(new Date().toString());
    },
    echo(args, raw) {
      print(raw.replace(/^echo\s?/, ''));
    },
    uname(args) {
      print(args.includes('-a') ? `${site.osName} portfolio ${site.osVersion} full-stack arm64` : site.osName);
    },
    uptime() {
      print(`career uptime: ${careerUptime()}`);
    },
    man(args) {
      const name = args[0];
      if (!name) return print([seg('What manual page do you want?', 't-dim')]);
      const desc = COMMANDS[name] || (name === 'git' ? COMMANDS['git log'] : null);
      if (!desc) return print([seg(`No manual entry for ${name}`, 't-err')]);
      print([seg(name.toUpperCase(), 't-bold')], `    ${name} — ${desc}`);
    },
    sudo(args) {
      if (args.join(' ') === 'hire-me' || args.join(' ') === 'hire sai') {
        print([seg('[sudo] password for recruiter: ', 't-dim'), seg('••••••••', 't-dim')], [seg('Access granted. Opening a new message to Sai…', 't-ok')]);
        actions.openMail({ subject: "Let's talk about a role", body: 'Hi Sai,\n\nI found your portfolio and would love to talk.\n\n' });
        return;
      }
      print([seg('sai is not in the sudoers file. This incident will be reported.', 't-err')]);
    },
    rm(args) {
      if (args.some((a) => a.includes('r')) && args.some((a) => a === '/' || a === '~' || a === '*')) {
        return print([seg('rm: refusing to delete a portfolio this nice.', 't-err')]);
      }
      print([seg('rm: this file system is read-only', 't-err')]);
    },
    vim() {
      print([seg('Opening vim… just kidding. You are safe here. (Type :q anywhere else.)', 't-dim')]);
    },
    nano() {
      handlers.vim();
    },
    emacs() {
      handlers.vim();
    },
    hello() {
      print('hello, world 👋');
    },
    simple() {
      actions.enterSimple?.();
    },
    timemachine() {
      actions.openTimeMachine?.();
    },
  };

  function submit() {
    const raw = input.value;
    input.value = '';
    echoCommand(raw);
    const text = raw.trim();
    if (text) {
      if (cmdHistory[cmdHistory.length - 1] !== text) cmdHistory.push(text);
      cmdHistory = cmdHistory.slice(-100);
      session.set(HISTORY_KEY, cmdHistory);
    }
    historyIndex = cmdHistory.length;
    draft = '';
    if (!text) {
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }
    const [cmd, ...args] = text.split(/\s+/);
    const name = cmd.toLowerCase();
    const handler = handlers[name];
    if (handler) {
      const result = handler(args, text);
      if (result?.then) result.then(() => { scroller.scrollTop = scroller.scrollHeight; });
    } else {
      const all = [...Object.keys(handlers)];
      const guess = all.map((c) => [c, levenshtein(name, c)]).sort((a, b) => a[1] - b[1])[0];
      print([seg(`zsh: command not found: ${cmd}`, 't-err')]);
      if (guess && guess[1] <= 2) print([seg('Did you mean ', 't-dim'), seg(guess[0], 't-cmd'), seg('?', 't-dim')]);
      else print([seg('Type ', 't-dim'), seg('help', 't-cmd'), seg(' to see what you can do.', 't-dim')]);
    }
    scroller.scrollTop = scroller.scrollHeight;
  }

  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    const now = Date.now();
    const double = now - lastTab < 450;
    lastTab = now;
    if (parts.length <= 1) {
      const names = [...Object.keys(handlers)].filter((c) => !HIDDEN_COMMANDS.includes(c) || c === 'git');
      const matches = names.filter((c) => c.startsWith(parts[0])).sort();
      if (matches.length === 1) input.value = `${matches[0]} `;
      else if (matches.length > 1) {
        const prefix = commonPrefix(matches);
        if (prefix.length > parts[0].length) input.value = prefix;
        else if (double) print(matches.join('   '));
      }
      return;
    }
    const cmd = parts[0];
    const partial = parts[parts.length - 1];
    let options = [];
    if (cmd === 'theme') options = ['light', 'dark', 'auto'];
    else if (cmd === 'wallpaper') options = ['dynamic', 'dawn', 'day', 'dusk', 'night', 'graphite'];
    else if (cmd === 'git') options = ['log', 'status'];
    else if (cmd === 'man') options = Object.keys(COMMANDS).filter((c) => !c.includes(' '));
    else {
      const slash = partial.lastIndexOf('/');
      const base = slash >= 0 ? partial.slice(0, slash + 1) : '';
      const stem = slash >= 0 ? partial.slice(slash + 1) : partial;
      const { node } = resolve(base || '.');
      if (node?.type === 'dir') {
        options = node.children.filter((c) => !c.hidden || stem.startsWith('.')).map((c) => `${base}${c.name}${c.type === 'dir' ? '/' : ''}`);
        options = options.filter((o) => o.startsWith(base + stem));
      }
    }
    const matches = options.filter((o) => o.startsWith(partial));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = `${parts.join(' ')}${matches[0].endsWith('/') ? '' : ' '}`;
    } else if (matches.length > 1) {
      const prefix = commonPrefix(matches);
      if (prefix.length > partial.length) {
        parts[parts.length - 1] = prefix;
        input.value = parts.join(' ');
      } else if (double) print(matches.map((m) => m.split('/').filter(Boolean).pop() + (m.endsWith('/') ? '/' : '')).join('   '));
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex === cmdHistory.length) draft = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = cmdHistory[historyIndex] ?? draft;
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
      input.value = historyIndex === cmdHistory.length ? draft : cmdHistory[historyIndex];
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      output.replaceChildren();
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      echoCommand(`${input.value}^C`);
      input.value = '';
    }
  });

  // Typing anywhere in the terminal window goes to the prompt.
  scroller.addEventListener('keydown', (e) => {
    if (!isTypingTarget(e.target) && e.key.length === 1 && !e.metaKey && !e.ctrlKey) input.focus();
  });

  renderPrompt();
  const last = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  print([seg(`Last login: ${last} on ttys001`, 't-dim')]);
  print([`Welcome to ${site.osName} Terminal. Type `, seg('help', 't-cmd'), ' to see what you can do, or try ', seg('neofetch', 't-cmd'), '.']);
  print('');

  return {
    el: scroller,
    focus: () => input.focus({ preventScroll: true }),
    run(command) {
      input.value = command;
      submit();
    },
  };
}

