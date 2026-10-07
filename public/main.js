// LawTech Main Application
// Frontend JavaScript for the LawTech case management system

document.addEventListener('DOMContentLoaded', () => {
  Data.init().then(() => {
    setupNavigation();
    setupEventListeners();
    setupGlobalSearch();
    loadInitialData();
  });
});

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeSidebar');

  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open')) {
      const navRect = sidebar.getBoundingClientRect();
      const clickRect = e.clientRect;
      if (clickRect.left > navRect.right || clickRect.top > navRect.bottom || clickRect.bottom < navRect.top) {
        sidebar.classList.remove('open');
      }
    }
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      views.forEach(view => {
        view.classList.remove('active');
      });

      const viewId = item.dataset.view;
      const targetView = document.getElementById('view-' + viewId);
      if (targetView) {
        targetView.classList.add('active');
      }

      sidebar.classList.remove('open');
      loadViewData(viewId);
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('lawtech_token');
      window.location.href = '/login.html';
    }
  });

  const themeToggle = document.getElementById('themeToggle');
  const icon = themeToggle.querySelector('i');
  const savedTheme = localStorage.getItem('lawtech_theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('theme-dark');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }

  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('theme-dark');
    if (document.documentElement.classList.contains('theme-dark')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      localStorage.setItem('lawtech_theme', 'dark');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      localStorage.setItem('lawtech_theme', 'light');
    }
  });
}

function loadViewData(viewId) {
  switch (viewId) {
    case 'clients':
      loadClients();
      break;
    case 'cases':
      loadCases();
      break;
    case 'matters':
      loadMatters();
      break;
    case 'knowledgebase':
      loadArticles();
      break;
    case 'documents':
      loadDocuments();
      break;
    case 'dashboard':
      loadDashboard();
      break;
  }
}

function loadDashboard() {
  Data.getClients().then(clients => {
    const tbody = document.getElementById('recentClients');
    tbody.innerHTML = '';
    const recent = clients.slice(0, 5);
    recent.forEach(client => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(client.name) + '</strong></td>' +
        '<td>' + escapeHtml(client.company || '-') + '</td>' +
        '<td>' + escapeHtml(client.contact_person || client.email || '-') + '</td>' +
        '<td><span class="badge badge-' + (client.tier || 'standard') + '">' + (client.tier || 'standard') + '</span></td>';
      tbody.appendChild(row);
    });
  });

  Data.getCases().then(cases => {
    const tbody = document.getElementById('activeCases');
    tbody.innerHTML = '';
    const active = cases.filter(c => c.status === 'open' || c.status === 'in_progress').slice(0, 5);
    active.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(c.title) + '</strong></td>' +
        '<td>' + escapeHtml(c.client_name || '-') + '</td>' +
        '<td>' + escapeHtml(c.case_type || '-') + '</td>' +
        '<td><span class="badge badge-' + (c.status || 'open') + '">' + (c.status || 'open') + '</span></td>';
      tbody.appendChild(row);
    });
  });
}

async function loadClients() {
  try {
    const clients = await Data.getClients();
    const tbody = document.getElementById('clientsTable');
    tbody.innerHTML = '';
    clients.forEach(client => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(client.name) + '</strong></td>' +
        '<td>' + escapeHtml(client.company || '-') + '</td>' +
        '<td>' + escapeHtml(client.contact_person || client.email || '-') + '</td>' +
        '<td><span class="badge badge-' + (client.tier || 'standard') + '">' + (client.tier || 'standard') + '</span></td>' +
        '<td><div class="action-btns">' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openEditClient(\'' + client.id + '\')"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" onclick="Data.openDeleteClient(\'' + client.id + '\')"><i class="fas fa-trash-alt"></i></button>' +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load clients:', error);
  }
}

async function loadCases() {
  try {
    const cases = await Data.getCases();
    const tbody = document.getElementById('casesTable');
    tbody.innerHTML = '';
    cases.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(c.title) + '</strong></td>' +
        '<td>' + escapeHtml(c.client_name || '-') + '</td>' +
        '<td>' + escapeHtml(c.case_type || '-') + '</td>' +
        '<td><span class="badge badge-' + (c.status || 'open') + '">' + (c.status || 'open') + '</span></td>' +
        '<td><span class="badge badge-priority-' + (c.priority || 'normal') + '">' + (c.priority || 'normal') + '</span></td>' +
        '<td><div class="action-btns">' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openEditCase(\'' + c.id + '\')"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" onclick="Data.openDeleteCase(\'' + c.id + '\')"><i class="fas fa-trash-alt"></i></button>' +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load cases:', error);
  }
}

async function loadMatters() {
  try {
    const matters = await Data.getMatters();
    const tbody = document.getElementById('mattersTable');
    tbody.innerHTML = '';
    matters.forEach(m => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(m.title) + '</strong></td>' +
        '<td>' + escapeHtml(m.client_name || '-') + '</td>' +
        '<td>' + escapeHtml(m.matter_type || '-') + '</td>' +
        '<td><span class="badge badge-' + (m.status || 'open') + '">' + (m.status || 'open') + '</span></td>' +
        '<td><span class="badge badge-priority-' + (m.priority || 'normal') + '">' + (m.priority || 'normal') + '</span></td>' +
        '<td><div class="action-btns">' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openEditMatter(\'' + m.id + '\')"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" onclick="Data.openDeleteMatter(\'' + m.id + '\')"><i class="fas fa-trash-alt"></i></button>' +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load matters:', error);
  }
}

async function loadArticles() {
  try {
    const { category } = document.getElementById('articleCategory');
    const articles = await Data.getArticles(category.value);
    const tbody = document.getElementById('articlesTable');
    tbody.innerHTML = '';
    articles.forEach(a => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(a.title) + '</strong></td>' +
        '<td>' + escapeHtml(a.category || '-') + '</td>' +
        '<td>' + escapeHtml(a.author_id || '-') + '</td>' +
        '<td><span class="stat-value">' + (a.views || 0) + '</span></td>' +
        '<td><div class="action-btns">' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openEditArticle(\'' + a.id + '\')"><i class="fas fa-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" onclick="Data.openDeleteArticle(\'' + a.id + '\')"><i class="fas fa-trash-alt"></i></button>' +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load articles:', error);
  }
}

async function loadDocuments() {
  try {
    const documents = await Data.getDocuments();
    const tbody = document.getElementById('documentsTable');
    tbody.innerHTML = '';
    documents.forEach(d => {
      const row = document.createElement('tr');
      row.innerHTML =
        '<td><strong>' + escapeHtml(d.title) + '</strong></td>' +
        '<td>' + escapeHtml(d.document_type || '-') + '</td>' +
        '<td>' + escapeHtml(d.client_name || '-') + '</td>' +
        '<td>' + Data.formatFileSize(d.file_size) + '</td>' +
        '<td>' + Data.formatDate(d.uploaded_at) + '</td>' +
        '<td><div class="action-btns">' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openViewDocument(\'' + d.id + '\')"><i class="fas fa-eye"></i></button>' +
          '<button class="btn btn-sm btn-secondary" onclick="Data.openEditDocument(\'' + d.id + '\')"><i class="fas fa-edit"></i></button>' +
        '</div></td>';
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load documents:', error);
  }
}

// Global search
function setupGlobalSearch() {
  const searchInput = document.getElementById('globalSearch');
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 2) {
      const activeView = document.querySelector('.view.active');
      if (activeView) {
        loadViewData(activeView.id.replace('view-', ''));
      }
      return;
    }

    try {
      const [clientsRes, casesRes, mattersRes, docsRes] = await Promise.all([
        fetch('/api/clients?search=' + encodeURIComponent(query)),
        fetch('/api/cases?search=' + encodeURIComponent(query)),
        fetch('/api/matters?search=' + encodeURIComponent(query)),
        fetch('/api/documents?search=' + encodeURIComponent(query))
      ]);
      const [clients, cases, matters, documents] = await Promise.all([
        clientsRes.json(),
        casesRes.json(),
        mattersRes.json(),
        docsRes.json()
      ]);
      showSearchResults(query, clients, cases, matters, documents);
    } catch (error) {
      console.error('Search failed:', error);
      showSearchResults(query, [], [], [], []);
    }
  });
}

function showSearchResults(query, clients, cases, matters, documents) {
  const results = document.getElementById('searchResults');
  if (query.length < 2) {
    results.classList.add('hidden');
    return;
  }
  results.classList.remove('hidden');

  let html = '<div class="search-header"><strong>Search results for:</strong> "' + escapeHtml(query) + '"</div>';

  if (clients.length > 0) {
    html += '<div class="search-section"><h4>Clients (' + clients.length + ')</h4><div class="search-results-list">';
    clients.slice(0, 3).forEach(c => {
      html += '<div class="search-result-item" onclick="selectSearchResult(\'client\', \'' + c.id + '\')"><strong>' + escapeHtml(c.name) + '</strong> - ' + escapeHtml(c.company || '') + '</div>';
    });
    html += '</div></div>';
  }

  if (cases.length > 0) {
    html += '<div class="search-section"><h4>Cases (' + cases.length + ')</h4><div class="search-results-list">';
    cases.slice(0, 3).forEach(c => {
      html += '<div class="search-result-item" onclick="selectSearchResult(\'case\', \'' + c.id + '\')"><strong>' + escapeHtml(c.title) + '</strong> - ' + escapeHtml(c.client_name || '') + '</div>';
    });
    html += '</div></div>';
  }

  if (matters.length > 0) {
    html += '<div class="search-section"><h4>Matters (' + matters.length + ')</h4><div class="search-results-list">';
    matters.slice(0, 3).forEach(m => {
      html += '<div class="search-result-item" onclick="selectSearchResult(\'matter\', \'' + m.id + '\')"><strong>' + escapeHtml(m.title) + '</strong> - ' + escapeHtml(m.matter_type || '') + '</div>';
    });
    html += '</div></div>';
  }

  if (documents.length > 0) {
    html += '<div class="search-section"><h4>Documents (' + documents.length + ')</h4><div class="search-results-list">';
    documents.slice(0, 3).forEach(d => {
      html += '<div class="search-result-item" onclick="selectSearchResult(\'document\', \'' + d.id + '\')"><strong>' + escapeHtml(d.title) + '</strong> - ' + escapeHtml(d.client_name || '') + '</div>';
    });
    html += '</div></div>';
  }

  if (clients.length === 0 && cases.length === 0 && matters.length === 0 && documents.length === 0) {
    html += '<div class="search-result-item">No results found</div>';
  }

  results.innerHTML = html;
}

function selectSearchResult(type, id) {
  const viewMap = {
    'client': 'clients',
    'case': 'cases',
    'matter': 'matters',
    'document': 'documents'
  };
  const view = viewMap[type];
  if (view) {
    const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
    if (navItem) navItem.click();
    if (type === 'client') Data.openEditClient(id);
    else if (type === 'case') Data.openEditCase(id);
    else if (type === 'matter') Data.openEditMatter(id);
    else if (type === 'document') Data.openViewDocument(id);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setupEventListeners() {
  document.getElementById('newClientBtn').addEventListener('click', () => {
    Data.openAddClientModal();
  });
  document.getElementById('newClientViewBtn').addEventListener('click', () => {
    Data.openAddClientModal();
  });
  document.getElementById('newCaseBtn').addEventListener('click', () => {
    Data.openAddCaseModal();
  });
  document.getElementById('newCaseViewBtn').addEventListener('click', () => {
    Data.openAddCaseModal();
  });
  document.getElementById('newMatterBtn').addEventListener('click', () => {
    Data.openAddMatterModal();
  });
  document.getElementById('newArticleBtn').addEventListener('click', () => {
    Data.openAddArticleModal();
  });
  document.getElementById('uploadDocBtn').addEventListener('click', () => {
    Data.openUploadDocumentModal();
  });
  document.getElementById('composerCancelBtn').addEventListener('click', () => {
    Data.closeComposer();
  });
  document.getElementById('composerSaveBtn').addEventListener('click', () => {
    Data.saveComposer();
  });
  document.getElementById('sendMessageBtn').addEventListener('click', Data.sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      Data.sendMessage();
    }
  });
  document.getElementById('startRecording').addEventListener('click', Data.startRecording);
  document.getElementById('stopRecording').addEventListener('click', Data.stopRecording);
  document.getElementById('boldBtn').addEventListener('click', () => {
    document.execCommand('bold');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('italicBtn').addEventListener('click', () => {
    document.execCommand('italic');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('bulletListBtn').addEventListener('click', () => {
    document.execCommand('insertUnorderedList');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('numberListBtn').addEventListener('click', () => {
    document.execCommand('insertOrderedList');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('headingBtn').addEventListener('click', () => {
    document.execCommand('formatBlock', false, '<h1>');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('paragraphBtn').addEventListener('click', () => {
    document.execCommand('formatBlock', false, '<p>');
    document.getElementById('composerEditor').focus();
  });
  document.getElementById('contactForm').addEventListener('submit', Data.submitContactForm);
}
