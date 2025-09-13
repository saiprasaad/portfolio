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

      function toggleResumePreview() {
        const preview = document.getElementById("resume-preview");
        preview.style.display = (preview.style.display === "none" || preview.style.display === "")
          ? "block"
          : "none";
      }


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
        if ((e.metaKey || e.ctrlKey) && e.key === '[') {
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