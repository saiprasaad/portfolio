// First-visit greeting: "hello" written out, then the desktop.

import { h, reducedMotion } from './dom.js';
import { profile } from '../content.js';

export function playHello(done) {
  const screen = h('div', { class: 'system-screen hello', role: 'dialog', 'aria-label': 'Welcome', tabindex: '-1' },
    h('div', {},
      h('svg', { viewBox: '0 0 560 220', role: 'img', 'aria-label': 'hello', html: '<text class="hello-text" x="50%" y="160" text-anchor="middle">hello</text>' }),
      h('p', { class: 'hello-sub' }, `I'm ${profile.nickname}. Welcome to my portfolio.`),
    ),
    h('span', { class: 'hello-skip' }, 'Click or press any key to skip'),
  );
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', finish, true);
    screen.classList.add('is-leaving');
    setTimeout(() => {
      screen.remove();
      done?.();
    }, reducedMotion() ? 0 : 600);
  };
  screen.addEventListener('pointerdown', finish);
  document.addEventListener('keydown', finish, true);
  document.body.append(screen);
  screen.focus({ preventScroll: true });
  setTimeout(finish, 3200);
}
