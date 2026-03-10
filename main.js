let currentView = 'main';
let viewHistory = ['main'];
let historyIndex = 0;

const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

const quickLookOverlay = document.getElementById('quick-look-overlay');
const resumeIframe = document.getElementById('resume-iframe');
const resumeDriveUrl = "https://drive.google.com/file/d/1m_iyqNUXY4m9T7eEBnZUM8GZTGVFlV5R/preview";

function toggleResumePreview() {
  if (!quickLookOverlay.classList.contains('active')) {
    // Open overlay
    if (!resumeIframe.src || resumeIframe.src === window.location.href) {
      resumeIframe.src = resumeDriveUrl; // Lazy load the iframe
    }
    quickLookOverlay.classList.add('active');
    if (isTerminalOpen) toggleTerminal();
    if (isSpotlightOpen) toggleSpotlight();
  } else {
    // Close overlay
    quickLookOverlay.classList.remove('active');
  }
}

// Close quick look when clicking outside the container
quickLookOverlay.addEventListener('click', (e) => {
  if (e.target === quickLookOverlay) {
    toggleResumePreview();
  }
});


menuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  });
});

function showView(viewName) {
  document.querySelectorAll('.icon-view, .detail-view').forEach(v => {
    v.style.display = 'none';
    v.classList.remove('active');
  });

  if (viewName === 'main') {
    document.getElementById('main-view').style.display = 'grid';
    document.getElementById('current-path').textContent = 'Portfolio';
  } else {
    const dv = document.getElementById(viewName + '-view');
    if (dv) {
      dv.style.display = 'block';
      dv.classList.add('active');
      document.getElementById('current-path').textContent = `Portfolio > ${viewName[0].toUpperCase() + viewName.slice(1)}`;
    }
  }

  document.querySelectorAll('.sidebar-item').forEach(i => {
    i.classList.remove('active');
    if (i.dataset.view === viewName || (viewName === 'main' && !i.dataset.view))
      i.classList.add('active');
  });
  if (viewName !== currentView) {
    viewHistory = viewHistory.slice(0, historyIndex + 1);
    viewHistory.push(viewName);
    historyIndex = viewHistory.length - 1;
    updateNavButtons();
  }
  currentView = viewName;

  if (window.innerWidth < 768) {
    closeSidebar();
  }
}

function updateNavButtons() {
  document.getElementById('back-btn').disabled = historyIndex <= 0;
  document.getElementById('forward-btn').disabled = historyIndex >= viewHistory.length - 1;
}

function goBack() {
  if (historyIndex > 0) {
    historyIndex--;
    showView(viewHistory[historyIndex]);
    updateNavButtons();
  }
}

function goForward() {
  if (historyIndex < viewHistory.length - 1) {
    historyIndex++;
    showView(viewHistory[historyIndex]);
    updateNavButtons();
  }
}

document.getElementById('back-btn').addEventListener('click', goBack);
document.getElementById('forward-btn').addEventListener('click', goForward);

document.querySelectorAll('.file-item, .sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    const v = item.dataset.view || 'main';
    showView(v);
  });
});

document.addEventListener('keydown', e => {
  // Close modals on Escape
  if (e.key === 'Escape') {
    if (isSpotlightOpen) {
      toggleSpotlight();
    }
    if (quickLookOverlay && quickLookOverlay.classList.contains('active')) {
      toggleResumePreview();
    }
    return;
  } else if ((e.metaKey || e.ctrlKey) && e.key === '[') {
    e.preventDefault();
    goBack();
  } else if ((e.metaKey || e.ctrlKey) && e.key === ']') {
    e.preventDefault();
    goForward();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    closeSidebar();
  }
});

showView('main');

// Terminal Logic
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalBody = document.getElementById('terminal-body');

const floatingTerminal = document.getElementById('floating-terminal');
const terminalDragHandle = document.getElementById('terminal-drag-handle');
const terminalCloseBtn = document.getElementById('terminal-close');

const terminalToggleBtn = document.getElementById('terminal-toggle-btn');
const searchToggleBtn = document.getElementById('search-toggle-btn');

// Floating Terminal View Toggle
let isTerminalOpen = false;

function toggleTerminal() {
  isTerminalOpen = !isTerminalOpen;
  if (isTerminalOpen) {
    floatingTerminal.classList.add('active');
    terminalInput.focus();
    if (isSpotlightOpen) toggleSpotlight(); // Close spotlight if open
    if (quickLookOverlay && quickLookOverlay.classList.contains('active')) toggleResumePreview();
  } else {
    floatingTerminal.classList.remove('active');
  }
}

if (terminalToggleBtn) {
  terminalToggleBtn.addEventListener('click', toggleTerminal);
}

terminalCloseBtn.addEventListener('click', () => {
  isTerminalOpen = false;
  floatingTerminal.classList.remove('active');
});

// Spotlight Search Logic
const spotlightOverlay = document.getElementById('spotlight-overlay');
const spotlightInput = document.getElementById('spotlight-input');
const spotlightResults = document.getElementById('spotlight-results');
let isSpotlightOpen = false;

const searchIndex = [
  { id: 'about', title: 'About Me', category: 'Profile', icon: '👋', color: '#c9e265', keywords: ['about', 'bio', 'profile', 'who am i', 'background', 'engineer', 'developer'] },
  { id: 'experience', title: 'Experience', category: 'Career', icon: '💼', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', keywords: ['experience', 'work', 'job', 'career', 'resume', 'full stack', 'developer', 'internship', 'afficiency', 'ernst', 'young'] },
  { id: 'education', title: 'Education', category: 'Academic', icon: '🎓', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', keywords: ['education', 'degree', 'university', 'college', 'master', 'illinois', 'institute', 'technology', 'gpa'] },
  { id: 'skills', title: 'Skills', category: 'Technical', icon: '⚡', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', keywords: ['skills', 'technologies', 'react', 'angular', 'python', 'java', 'spring', 'sql', 'database', 'frontend', 'backend', 'mobile', 'ai', 'machine learning'] },
  { id: 'projects', title: 'Projects', category: 'Portfolio', icon: '📁', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', keywords: ['projects', 'portfolio', 'work', 'code', 'github', 'app', 'website', 'log summarizer', 'repo vision', 'youtube', 'wordle', 'battleships', 'campus cooks'] },
  { id: 'certifications', title: 'Certifications', category: 'Credentials', icon: '🎖️', color: '#80ed99', keywords: ['certifications', 'certs', 'credentials', 'azure', 'oracle', 'cloud', 'coursera', 'cs50', 'hackerrank'] },
  { id: 'accomplishments', title: 'Accomplishments', category: 'Awards', icon: '🏆', color: '#ffd166', keywords: ['accomplishments', 'awards', 'hackathon', 'winner', 'judge', 'performer'] },
  { id: 'contact', title: 'Contact', category: 'Reach out', icon: '📞', gradient: 'linear-gradient(135deg, #fa709a, #fee140)', keywords: ['contact', 'email', 'phone', 'github', 'linkedin', 'hire', 'message'] },
  { id: 'resume', title: 'Resume', category: 'Document', icon: '📄', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)', keywords: ['resume', 'cv', 'document', 'download', 'pdf'] }
];

function toggleSpotlight() {
  isSpotlightOpen = !isSpotlightOpen;
  if (isSpotlightOpen) {
    spotlightOverlay.classList.add('active');
    spotlightInput.focus();
    spotlightInput.value = '';
    spotlightResults.innerHTML = '';
    spotlightResults.classList.remove('has-results');
    if (isTerminalOpen) toggleTerminal(); // Close terminal if open
    if (quickLookOverlay && quickLookOverlay.classList.contains('active')) toggleResumePreview();
  } else {
    spotlightOverlay.classList.remove('active');
    spotlightInput.blur();
    spotlightInput.value = '';
    spotlightResults.innerHTML = '';
    spotlightResults.classList.remove('has-results');
  }
}

if (searchToggleBtn) {
  searchToggleBtn.addEventListener('click', toggleSpotlight);
}

// Close spotlight when clicking outside
spotlightOverlay.addEventListener('click', (e) => {
  if (e.target === spotlightOverlay) {
    toggleSpotlight();
  }
});

// Handle search input
spotlightInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  spotlightResults.innerHTML = '';

  if (query.length === 0) {
    spotlightResults.classList.remove('has-results');
    return;
  }

  const results = searchIndex.filter(item => {
    // Check title, category, and keywords
    const textToSearch = [item.title, item.category, ...item.keywords].join(' ').toLowerCase();
    return textToSearch.includes(query);
  });

  if (results.length > 0) {
    spotlightResults.classList.add('has-results');
    results.forEach((result, index) => {
      const el = document.createElement('div');
      el.className = 'spotlight-item' + (index === 0 ? ' selected' : '');
      el.dataset.id = result.id;

      const backgroundStyle = result.gradient ? `background: ${result.gradient}` : `background: ${result.color}`;

      el.innerHTML = `
              <div class="spotlight-item-icon" style="${backgroundStyle}">${result.icon}</div>
              <div class="spotlight-item-details">
                <div class="spotlight-item-title">${result.title}</div>
                <div class="spotlight-item-category">${result.category}</div>
              </div>
            `;

      el.addEventListener('click', () => {
        showView(result.id);
        toggleSpotlight();
      });

      spotlightResults.appendChild(el);
    });
  } else {
    spotlightResults.classList.remove('has-results');
  }
});

// Terminal Draggable functionality
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

terminalDragHandle.addEventListener('mousedown', dragStart);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('mousemove', drag);

terminalDragHandle.addEventListener('touchstart', dragStart, { passive: true });
document.addEventListener('touchend', dragEnd);
document.addEventListener('touchmove', drag, { passive: false });

function dragStart(e) {
  if (e.target.closest('.traffic-lights')) return;

  if (e.type === 'touchstart') {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } else {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }

  if (e.target === terminalDragHandle || e.target.parentNode === terminalDragHandle) {
    isDragging = true;
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();

    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, floatingTerminal);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
}

const commands = {
  help: () => `
          <div>Available commands:</div>
          <div><span class="terminal-cmd">help</span>       - Show this list of commands</div>
          <div><span class="terminal-cmd">about</span>      - Learn more about me</div>
          <div><span class="terminal-cmd">projects</span>   - View my selected projects</div>
          <div><span class="terminal-cmd">skills</span>     - View my technical skills</div>
          <div><span class="terminal-cmd">contact</span>    - Show contact information</div>
          <div><span class="terminal-cmd">clear</span>      - Clear the terminal output</div>
          <div><span class="terminal-cmd">date</span>       - Show current date and time</div>
          <div><span class="terminal-cmd">echo</span> [msg] - Echo back a message</div>
          <div><span class="terminal-cmd">whoami</span>     - Display current user</div>
        `,
  about: () => `
          <div>Hi, I'm Saiprasaad Kalyanaraman 👋</div>
          <div>I’m a Full-Stack Software Engineer with a Master’s in Computer Science and over two years of experience building scalable web and mobile applications. Specializing in React, Angular, Flask, Spring Boot, MySQL, and Redis.</div>
        `,
  projects: () => `
          <div>Selected Projects:</div>
          <div>- <span class="terminal-cmd">AI-Powered Log Summarizer</span> (Python, Flask, Ollama)</div>
          <div>- <span class="terminal-cmd">Repo Vision</span> (Python, React, Google Cloud)</div>
          <div>- <span class="terminal-cmd">YouTube Translator</span> (Python, Streamlit, Whisper)</div>
          <div>- <span class="terminal-cmd">Campus Cooks</span> (Flutter, Firebase)</div>
          <div>Type 'gui' or use the Finder to view all projects in detail.</div>
        `,
  skills: () => `
          <div>Technical Skills:</div>
          <div><span class="terminal-cmd">Frontend:</span> HTML, CSS, React, Angular, JavaScript, TypeScript</div>
          <div><span class="terminal-cmd">Backend:</span> Spring Boot, Node.js, Flask, PHP</div>
          <div><span class="terminal-cmd">Mobile:</span> Flutter, Android Studio</div>
          <div><span class="terminal-cmd">Databases:</span> MySQL, PostgreSQL, SQLite, MongoDB, Firebase, Redis</div>
          <div><span class="terminal-cmd">AI/ML:</span> Generative AI, LLMs, RAG, NLP, Ollama, OpenAI</div>
        `,
  contact: () => `
          <div>Contact Information:</div>
          <div>Email: <a href="mailto:saiprasaad1999@gmail.com" class="terminal-link">saiprasaad1999@gmail.com</a></div>
          <div>GitHub: <a href="https://github.com/saiprasaad" target="_blank" class="terminal-link">github.com/saiprasaad</a></div>
          <div>LinkedIn: <a href="https://www.linkedin.com/in/saiprasaad/" target="_blank" class="terminal-link">linkedin.com/in/saiprasaad</a></div>
        `,
  date: () => `<div>${new Date().toString()}</div>`,
  whoami: () => `<div>saiprasaad</div>`,
  sudo: () => `<div class="terminal-error">saiprasaad is not in the sudoers file. This incident will be reported.</div>`
};

function executeCommand(cmdStr) {
  const args = cmdStr.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();

  if (cmd === '') return '';

  if (cmd === 'clear') {
    terminalOutput.innerHTML = '';
    return null;
  }

  if (cmd === 'echo') {
    return `<div>${args.slice(1).join(' ').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
  }

  if (commands[cmd]) {
    return commands[cmd]();
  }

  return `<div class="terminal-error">command not found: ${cmd}</div><div>Type <span class="terminal-cmd">help</span> to see a list of available commands.</div>`;
}

function addTerminalOutput(text, isCommand = false) {
  const div = document.createElement('div');
  if (isCommand) {
    div.innerHTML = `<span class="terminal-prompt">saiprasaad@portfolio:~$</span> ${text}`;
  } else {
    div.innerHTML = text;
  }
  terminalOutput.appendChild(div);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmdStr = terminalInput.value;
    terminalInput.value = '';

    addTerminalOutput(cmdStr, true);

    const response = executeCommand(cmdStr);
    if (response !== null) {
      addTerminalOutput(response);
    }
  }
});

// Keep focus on input when clicking terminal body
terminalBody.addEventListener('click', () => {
  const selection = window.getSelection();
  if (selection.toString().length === 0) {
    terminalInput.focus();
  }
});

// Remove intercepting showView for terminal since it is now an overlay

// Window Keyboard Shortcuts
document.addEventListener('keydown', e => {
  // Toggle Terminal: Cmd/Ctrl + \`
  if ((e.metaKey || e.ctrlKey) && e.key === '\`') {
    e.preventDefault();
    toggleTerminal();
  }

  // Toggle Spotlight: Cmd/Ctrl + Space
  if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
    e.preventDefault();
    toggleSpotlight();
  }

  // Spotlight Navigation functionality
  if (isSpotlightOpen) {
    const items = document.querySelectorAll('.spotlight-item');
    if (items.length === 0) return;

    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedIndex < items.length - 1) {
        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
        items[selectedIndex + 1].classList.add('selected');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex > 0) {
        items[selectedIndex].classList.remove('selected');
        items[selectedIndex - 1].classList.add('selected');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        const viewId = items[selectedIndex].dataset.id;
        showView(viewId);
        toggleSpotlight();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleSpotlight();
    }
  }
});

// --- Rotating Helper Tooltips (Toasts) ---
const toastContainer = document.getElementById('toast-container');
const hints = [
  { icon: '⌃', text: 'Press Ctrl + Space for Spotlight Search' },
  { icon: '⌨️', text: 'Press Ctrl + ` to open the Terminal' },
  { icon: '💡', text: 'Try exploring my skills in the sidebar!' },
  { icon: '🔍', text: 'Hit Ctrl + Space and search for "Resume"' },
  { icon: '🖥️', text: 'Type "help" in the floating terminal.' },
  { icon: '👁️', text: 'Click Quick Look to preview my resume.' },
  { icon: '✨', text: 'Try Ask Folio — my AI-powered assistant!' }
];
let currentHintIndex = 0;

function showToast() {
  if (!toastContainer) return;

  // Pick the next hint
  const hint = hints[currentHintIndex];
  currentHintIndex = (currentHintIndex + 1) % hints.length;

  // Create the toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
          <span class="toast-icon">${hint.icon}</span>
          <span class="toast-text">${hint.text}</span>
        `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10); // Small delay to allow CSS transition

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    // Wait for CSS slide out transition to finish (0.4s) before removing from DOM
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 400);
  }, 5000);
}

// Initial delay of 10s before the first hint, then repeat every 30s
setTimeout(() => {
  showToast();
  setInterval(showToast, 30000);
}, 10000);

// --- Gemini AI Chatbot Integration ---
// 👇 Replace with your deployed Vercel backend URL (e.g. 'https://folio-backend.vercel.app')
const FOLIO_BACKEND_URL = 'https://folio-backend-two.vercel.app';

const geminiWidget = document.getElementById('gemini-chat-widget');
const geminiInput = document.getElementById('gemini-chat-input');
const geminiSendBtn = document.getElementById('gemini-send-btn');
const geminiChatBody = document.getElementById('gemini-chat-body');

let isGeminiOpen = false;

function toggleGeminiChat() {
  isGeminiOpen = !isGeminiOpen;
  if (isGeminiOpen) {
    geminiWidget.classList.add('active');
    geminiInput.focus();
  } else {
    geminiWidget.classList.remove('active');
  }
}

function appendGeminiMessage(text, isUser) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `gemini-message ${isUser ? 'user-message' : 'ai-message'}`;
  
  if (isUser) {
    msgDiv.textContent = text;
  } else {
    // Parse markdown to HTML
    msgDiv.innerHTML = parseMarkdown(text);
  }
  
  geminiChatBody.appendChild(msgDiv);
  geminiChatBody.scrollTop = geminiChatBody.scrollHeight;
}

function parseMarkdown(text) {
  // Split into lines
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let listType = ''; // 'ul' or 'ol'
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Skip empty lines but close list
    if (!trimmed) {
      if (inList) { html += `</${listType}>`; inList = false; }
      return;
    }
    
    // Unordered list: * item or - item
    const ulMatch = trimmed.match(/^[\*\-]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>`;
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${inlineFormat(ulMatch[1])}</li>`;
      return;
    }
    
    // Ordered list: 1. item
    const olMatch = trimmed.match(/^\d+[\.\)]\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += `</${listType}>`;
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${inlineFormat(olMatch[1])}</li>`;
      return;
    }
    
    // Close list if we hit a non-list line
    if (inList) { html += `</${listType}>`; inList = false; }
    
    // Headings
    if (trimmed.startsWith('### ')) {
      html += `<strong>${inlineFormat(trimmed.slice(4))}</strong><br>`;
      return;
    }
    if (trimmed.startsWith('## ')) {
      html += `<strong>${inlineFormat(trimmed.slice(3))}</strong><br>`;
      return;
    }
    if (trimmed.startsWith('# ')) {
      html += `<strong>${inlineFormat(trimmed.slice(2))}</strong><br>`;
      return;
    }
    
    // Regular paragraph
    html += `<p style="margin:4px 0">${inlineFormat(trimmed)}</p>`;
  });
  
  if (inList) html += `</${listType}>`;
  return html;
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');  // `code`
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'gemini-message ai-message typing-indicator';
  typingDiv.id = 'gemini-typing';
  typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  geminiChatBody.appendChild(typingDiv);
  geminiChatBody.scrollTop = geminiChatBody.scrollHeight;
}

function removeTypingIndicator() {
  const typingDiv = document.getElementById('gemini-typing');
  if (typingDiv) {
    typingDiv.remove();
  }
}

function getPortfolioContext() {
  const sections = [
    { id: 'about-view', label: 'About' },
    { id: 'experience-view', label: 'Experience' },
    { id: 'education-view', label: 'Education' },
    { id: 'skills-view', label: 'Skills & Technologies' },
    { id: 'projects-view', label: 'Projects' },
    { id: 'certifications-view', label: 'Certifications' },
    { id: 'accomplishments-view', label: 'Accomplishments' },
    { id: 'contact-view', label: 'Contact' }
  ];
  
  let context = '';
  sections.forEach(section => {
    const el = document.getElementById(section.id);
    if (el) {
      // Get all text, collapse whitespace
      const text = el.innerText.replace(/\s+/g, ' ').trim();
      if (text) {
        context += `\n--- ${section.label} ---\n${text}\n`;
      }
    }
  });
  return context;
}

async function sendGeminiMessage() {
  const text = geminiInput.value.trim();
  if (!text) return;

  // 1. Display user message
  appendGeminiMessage(text, true);
  geminiInput.value = '';
  geminiSendBtn.disabled = true;

  // 2. Show AI loading state
  showTypingIndicator();

  // 3. Call backend proxy
  try {
    const response = await fetch(`${FOLIO_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        context: getPortfolioContext()
      })
    });

    const data = await response.json();

    removeTypingIndicator();

    if (!response.ok) {
      throw new Error(data.error || `Server Error: ${response.status}`);
    }

    appendGeminiMessage(data.reply, false);

  } catch (error) {
    removeTypingIndicator();
    console.error("Folio Error:", error);
    appendGeminiMessage(`Sorry, I encountered an error. *${error.message}*`, false);
  } finally {
    geminiSendBtn.disabled = false;
    geminiInput.focus();
  }
}

geminiSendBtn.addEventListener('click', sendGeminiMessage);

geminiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendGeminiMessage();
  }
});