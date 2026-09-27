// Mail: a compose window that hands the message to the visitor's email app.
// Nothing is sent from the page, and the copy says so. The visitor's email app adds
// their name and address, so the form only asks for a subject and a message.

import { h, copyText } from '../lib/dom.js';
import { profile } from '../content.js';
import { icon, photo } from '../lib/sections.js';

let counter = 0;

export function createMailView(actions, prefill = {}) {
  const n = ++counter;
  const subjectInput = h('input', { id: `mail-subject-${n}`, type: 'text', value: prefill.subject || '' });
  const body = h('textarea', { id: `mail-body-${n}`, placeholder: 'Write your message…', 'aria-label': 'Message', 'data-autofocus': '' });
  body.value = prefill.body || '';
  const status = h('p', { class: 'mail-status', 'aria-live': 'polite' }, `Sending opens your email app with this message addressed to ${profile.email}.`);
  const copyBtn = h('button', { class: 'btn', type: 'button', hidden: true, onClick: () => copyMessage() }, icon('copy', 14), 'Copy message');

  const field = (label, input, extra) => h('div', { class: 'mail-field' }, h('label', { for: input.id }, label), input, extra || h('span'));

  const toRow = h('div', { class: 'mail-field' },
    h('span', { class: 'mf-label' }, 'To'),
    h('span', { class: 'mail-to' }, photo(22), h('span', {}, `${profile.name} <${profile.email}>`)),
    h('button', { class: 'btn btn-quiet btn-icon', type: 'button', 'aria-label': 'Copy email address', title: 'Copy email address', onClick: () => actions.copy(profile.email, 'Email address copied') }, icon('copy', 15)),
  );

  const sendButton = h('button', { class: 'btn btn-primary', type: 'button', onClick: () => send() }, icon('send', 14), 'Send');

  const el = h('form', { class: 'mail', onSubmit: (e) => { e.preventDefault(); send(); } },
    h('div', { class: 'mail-fields' },
      toRow,
      field('Subject', subjectInput),
    ),
    h('div', { class: 'mail-body' }, body),
    h('div', { class: 'mail-foot' }, h('p', {}, status), copyBtn),
  );

  function composed() {
    return { subject: subjectInput.value.trim() || 'Hello from your portfolio', text: body.value.trim() };
  }

  async function copyMessage() {
    const { subject, text } = composed();
    const ok = await copyText(`To: ${profile.email}\nSubject: ${subject}\n\n${text}`);
    actions.hud?.(ok ? 'Message copied' : 'Select the message to copy it', ok ? 'check' : 'info');
  }

  function send() {
    if (!body.value.trim()) {
      status.textContent = 'Write a message first.';
      body.focus();
      return;
    }
    const { subject, text } = composed();
    const href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    const a = h('a', { href, style: 'display:none' });
    document.body.append(a);
    a.click();
    a.remove();
    status.textContent = `Your email app should open with this message. If it didn't, copy the message and send it to ${profile.email}.`;
    copyBtn.hidden = false;
  }

  return {
    el,
    sendButton,
    focus: () => body.focus({ preventScroll: true }),
    setPrefill(p = {}) {
      if (p.subject) subjectInput.value = p.subject;
      if (p.body) body.value = p.body;
    },
  };
}
