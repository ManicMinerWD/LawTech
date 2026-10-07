// LawTech Data Module
// Client-side state and data management for the LawTech app

const Data = {
  clients: [],
  cases: [],
  matters: [],
  articles: [],
  documents: [],

  // Initialize data from the server
  async init() {
    try {
      const [clientsRes, casesRes, mattersRes, articlesRes, docsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/cases'),
        fetch('/api/matters'),
        fetch('/api/articles'),
        fetch('/api/documents')
      ]);

      this.clients = await clientsRes.json();
      this.cases = await casesRes.json();
      this.matters = await mattersRes.json();
      this.articles = await articlesRes.json();
      this.documents = await docsRes.json();

      // Update counts in sidebar
      document.getElementById('clientCount').textContent = this.clients.length;
      document.getElementById('caseCount').textContent = this.cases.filter(c => c.status === 'open').length;
      document.getElementById('articleCount').textContent = this.articles.length;
    } catch (error) {
      console.error('Failed to initialize data:', error);
      this.clients = [
        { id: '1', name: 'John Smith', email: 'john@example.com', phone: '+61 400 000 000', company: 'Acme Corp', industry: 'Technology', tier: 'premium', contact_person: 'Jane Smith' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+61 400 000 001', company: 'Globex Inc', industry: 'Finance', tier: 'standard', contact_person: 'Robert Johnson' },
        { id: '3', name: 'Michael Brown', email: 'michael@example.com', phone: '+61 400 000 002', company: 'Initech LLC', industry: 'Healthcare', tier: 'standard', contact_person: 'Emily Brown' },
      ];
      this.cases = [
        { id: '1', clientId: '1', title: 'Smith v. Acme Corp', client_name: 'John Smith', case_type: 'Commercial Litigation', status: 'open', priority: 'high', filing_date: '2026-01-15', due_date: '2027-03-01', estimated_cost: 150000 },
        { id: '2', clientId: '2', title: 'Johnson Asset Acquisition', client_name: 'Sarah Johnson', case_type: 'M&A', status: 'in_progress', priority: 'normal', filing_date: '2026-03-01', due_date: '2026-12-01', estimated_cost: 200000 },
        { id: '3', clientId: '3', title: 'Brown Medical record dispute', client_name: 'Michael Brown', case_type: 'Privacy Litigation', status: 'closed', priority: 'low', filing_date: '2025-11-01', actual_cost: 45000 },
      ];
      this.matters = [
        { id: '1', clientId: '1', title: 'Corporate Restructuring', matter_type: 'Corporate', status: 'open', priority: 'high' },
        { id: '2', clientId: '2', title: 'Portfolio Acquisition', matter_type: 'M&A', status: 'in_progress', priority: 'high' },
        { id: '3', clientId: '3', title: 'HIPAA Compliance', matter_type: 'Compliance', status: 'closed', priority: 'normal' },
      ];
      this.articles = [
        { id: '1', title: 'Drafting Commercial Contracts', category: 'practice', views: 142, status: 'published' },
        { id: '2', title: 'M&A Due Diligence Checklist', category: 'corporate', views: 289, status: 'published' },
        { id: '3', title: 'Privacy Regulations Overview', category: 'litigation', views: 95, status: 'published' },
      ];
      this.documents = [
        { id: '1', title: 'NDA Template', document_type: 'Template', file_name: 'nda-template.pdf', file_size: 245760, uploaded_by: 'admin', status: 'active', client_name: 'Acme Corp' },
        { id: '2', title: 'Contract Draft 2026', document_type: 'Contract', file_name: 'contract-2026.pdf', file_size: 1024000, uploaded_by: 'admin', status: 'active', client_name: 'Globex Inc' },
      ];
    }
  },

  // Getter methods for views
  async getClients() {
    try {
      const res = await fetch('/api/clients');
      return res.json();
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  },

  async getCases() {
    try {
      const res = await fetch('/api/cases');
      return res.json();
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      throw error;
    }
  },

  async getMatters() {
    try {
      const res = await fetch('/api/matters');
      return res.json();
    } catch (error) {
      console.error('Failed to fetch matters:', error);
      throw error;
    }
  },

  async getArticles(category) {
    try {
      let url = '/api/articles';
      if (category) {
        url += '?category=' + encodeURIComponent(category);
      }
      const res = await fetch(url);
      return res.json();
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      throw error;
    }
  },

  async getDocuments() {
    try {
      const res = await fetch('/api/documents');
      return res.json();
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  },

  // CRUD operations
  async addClient(client) {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      const newClient = await res.json();
      this.clients.push(newClient);
      document.getElementById('clientCount').textContent = this.clients.length;
      return newClient;
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  },

  async updateClient(id, updates) {
    try {
      const res = await fetch('/api/clients/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      const index = this.clients.findIndex(c => c.id === id);
      if (index !== -1) this.clients[index] = updated;
      return updated;
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      await fetch('/api/clients/' + id, { method: 'DELETE' });
      this.clients = this.clients.filter(c => c.id !== id);
      document.getElementById('clientCount').textContent = this.clients.length;
    } catch (error) {
      console.error('Failed to delete client:', error);
      throw error;
    }
  },

  async addCase(caseData) {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      const result = await res.json();
      this.cases.push(result.case);
      document.getElementById('caseCount').textContent = this.cases.filter(c => c.status === 'open').length;
      return result;
    } catch (error) {
      console.error('Failed to add case:', error);
      throw error;
    }
  },

  async updateCase(id, updates) {
    try {
      const res = await fetch('/api/cases/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      const index = this.cases.findIndex(c => c.id === id);
      if (index !== -1) this.cases[index] = updated;
      return updated;
    } catch (error) {
      console.error('Failed to update case:', error);
      throw error;
    }
  },

  async deleteCase(id) {
    try {
      await fetch('/api/cases/' + id, { method: 'DELETE' });
      this.cases = this.cases.filter(c => c.id !== id);
    } catch (error) {
      console.error('Failed to delete case:', error);
      throw error;
    }
  },

  async addMatter(matter) {
    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matter)
      });
      const newMatter = await res.json();
      this.matters.push(newMatter);
      return newMatter;
    } catch (error) {
      console.error('Failed to add matter:', error);
      throw error;
    }
  },

  async updateMatter(id, updates) {
    try {
      const res = await fetch('/api/matters/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      const index = this.matters.findIndex(m => m.id === id);
      if (index !== -1) this.matters[index] = updated;
      return updated;
    } catch (error) {
      console.error('Failed to update matter:', error);
      throw error;
    }
  },

  async deleteMatter(id) {
    try {
      await fetch('/api/matters/' + id, { method: 'DELETE' });
      this.matters = this.matters.filter(m => m.id !== id);
    } catch (error) {
      console.error('Failed to delete matter:', error);
      throw error;
    }
  },

  async addArticle(article) {
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      const newArticle = await res.json();
      this.articles.push(newArticle);
      document.getElementById('articleCount').textContent = this.articles.length;
      return newArticle;
    } catch (error) {
      console.error('Failed to add article:', error);
      throw error;
    }
  },

  async updateArticle(id, article) {
    try {
      const res = await fetch('/api/articles/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      const updated = await res.json();
      const index = this.articles.findIndex(a => a.id === id);
      if (index !== -1) this.articles[index] = updated;
      return updated;
    } catch (error) {
      console.error('Failed to update article:', error);
      throw error;
    }
  },

  async deleteArticle(id) {
    try {
      await fetch('/api/articles/' + id, { method: 'DELETE' });
      this.articles = this.articles.filter(a => a.id !== id);
      document.getElementById('articleCount').textContent = this.articles.length;
    } catch (error) {
      console.error('Failed to delete article:', error);
      throw error;
    }
  },

  async addDocument(documentData) {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });
      const newDoc = await res.json();
      this.documents.push(newDoc);
      return newDoc;
    } catch (error) {
      console.error('Failed to add document:', error);
      throw error;
    }
  },

  async updateDocument(id, documentData) {
    try {
      const res = await fetch('/api/documents/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });
      const updated = await res.json();
      const index = this.documents.findIndex(d => d.id === id);
      if (index !== -1) this.documents[index] = updated;
      return updated;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  },

  async deleteDocument(id) {
    try {
      await fetch('/api/documents/' + id, { method: 'DELETE' });
      this.documents = this.documents.filter(d => d.id !== id);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },

  // Client modals
  openAddClientModal() {
    this.createClient = {
      id: Date.now().toString(),
      name: '', email: '', phone: '', company: '', address: '', city: '',
      state: '', zipCode: '', country: 'Australia', website: '', industry: '',
      contactPerson: '', tier: 'standard', notes: ''
    };
    document.getElementById('modalTitle').textContent = 'New Client';
    document.getElementById('modalForm').reset();
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.saveClient()">Save</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async saveClient() {
    try {
      await Data.addClient(this.createClient);
      document.getElementById('modal').classList.add('hidden');
      loadClients();
    } catch (error) {
      alert('Failed to save client: ' + error.message);
    }
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
  },

  openEditClient(id) {
    const client = this.clients.find(c => c.id === id);
    if (!client) return;
    this.editClient = client;
    document.getElementById('modalTitle').textContent = 'Edit Client';
    document.getElementById('modalForm').value = client.name;
    document.getElementById('modalEmail').value = client.email || '';
    document.getElementById('modalPhone').value = client.phone || '';
    document.getElementById('modalCompany').value = client.company || '';
    document.getElementById('modalIndustry').value = client.industry || '';
    document.getElementById('modalContact').value = client.contact_person || '';
    document.getElementById('modalTier').value = client.tier || 'standard';
    document.getElementById('modalNotes').value = client.notes || '';
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.updateClient()">Update</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async updateClient() {
    try {
      await Data.updateClient(this.editClient.id, {
        name: document.getElementById('modalForm').value,
        email: document.getElementById('modalEmail').value,
        phone: document.getElementById('modalPhone').value,
        company: document.getElementById('modalCompany').value,
        industry: document.getElementById('modalIndustry').value,
        contactPerson: document.getElementById('modalContact').value,
        tier: document.getElementById('modalTier').value,
        notes: document.getElementById('modalNotes').value
      });
      document.getElementById('modal').classList.add('hidden');
      loadClients();
    } catch (error) {
      alert('Failed to update client: ' + error.message);
    }
  },

  openDeleteClient(id) {
    if (confirm('Are you sure you want to delete this client?')) {
      Data.deleteClient(id).then(() => {
        loadClients();
      }).catch(error => {
        alert('Failed to delete client: ' + error.message);
      });
    }
  },

  // Case modals
  openAddCaseModal() {
    const clientOptions = document.getElementById('caseClientOptions');
    if (clientOptions) {
      clientOptions.innerHTML = '';
      this.clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name + ' (' + (c.company || 'No Company') + ')';
        clientOptions.appendChild(opt);
      });
    }
    document.getElementById('modalTitle').textContent = 'New Case';
    document.getElementById('modalForm').reset();
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.saveCase()">Save</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async saveCase() {
    try {
      await Data.addCase(this.caseData);
      document.getElementById('modal').classList.add('hidden');
      loadCases();
    } catch (error) {
      alert('Failed to save case: ' + error.message);
    }
  },

  openEditCase(id) {
    const c = this.cases.find(c => c.id === id);
    if (!c) return;
    this.editCase = c;
    document.getElementById('modalTitle').textContent = 'Edit Case';
    document.getElementById('modalForm').value = c.title;
    const clientOptions = document.getElementById('caseClientOptions2');
    if (clientOptions) {
      clientOptions.innerHTML = '';
      this.clients.forEach(cl => {
        const opt = document.createElement('option');
        opt.value = cl.id;
        opt.textContent = cl.name;
        if (cl.id === c.clientId) opt.selected = true;
        clientOptions.appendChild(opt);
      });
    }
    document.getElementById('modalClient').value = c.client_name || '';
    document.getElementById('modalCaseType').value = c.case_type || '';
    document.getElementById('modalStatus').value = c.status || 'open';
    document.getElementById('modalPriority').value = c.priority || 'normal';
    document.getElementById('modalNotes').value = c.notes || '';
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.updateCase()">Update</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async updateCase() {
    try {
      await Data.updateCase(this.editCase.id, {
        title: document.getElementById('modalForm').value,
        clientId: document.getElementById('modalClient').value,
        caseType: document.getElementById('modalCaseType').value,
        status: document.getElementById('modalStatus').value,
        priority: document.getElementById('modalPriority').value,
        notes: document.getElementById('modalNotes').value
      });
      document.getElementById('modal').classList.add('hidden');
      loadCases();
    } catch (error) {
      alert('Failed to update case: ' + error.message);
    }
  },

  openDeleteCase(id) {
    if (confirm('Are you sure you want to delete this case?')) {
      Data.deleteCase(id).then(() => {
        loadCases();
      }).catch(error => {
        alert('Failed to delete case: ' + error.message);
      });
    }
  },

  // Matter modals
  openAddMatterModal() {
    this.matterData = {
      clientId: '', title: '', matterType: '', status: 'open', priority: 'normal', notes: ''
    };
    document.getElementById('modalTitle').textContent = 'New Matter';
    document.getElementById('modalForm').reset();
    document.getElementById('modalClient').innerHTML =
      '<option value="">Select Client</option>' + this.clients.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.saveMatter()">Save</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async saveMatter() {
    try {
      await Data.addMatter(this.matterData);
      document.getElementById('modal').classList.add('hidden');
      loadMatters();
    } catch (error) {
      alert('Failed to save matter: ' + error.message);
    }
  },

  openEditMatter(id) {
    const m = this.matters.find(m => m.id === id);
    if (!m) return;
    this.editMatter = m;
    document.getElementById('modalTitle').textContent = 'Edit Matter';
    document.getElementById('modalForm').value = m.title;
    document.getElementById('modalClient').value = m.clientId || '';
    document.getElementById('modalMatterType').value = m.matter_type || '';
    document.getElementById('modalStatus').value = m.status || 'open';
    document.getElementById('modalPriority').value = m.priority || 'normal';
    document.getElementById('modalNotes').value = m.notes || '';
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.updateMatter()">Update</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async updateMatter() {
    try {
      await Data.updateMatter(this.editMatter.id, {
        title: document.getElementById('modalForm').value,
        clientId: document.getElementById('modalClient').value,
        matterType: document.getElementById('modalMatterType').value,
        status: document.getElementById('modalStatus').value,
        priority: document.getElementById('modalPriority').value,
        notes: document.getElementById('modalNotes').value
      });
      document.getElementById('modal').classList.add('hidden');
      loadMatters();
    } catch (error) {
      alert('Failed to update matter: ' + error.message);
    }
  },

  openDeleteMatter(id) {
    if (confirm('Are you sure you want to delete this matter?')) {
      Data.deleteMatter(id).then(() => {
        loadMatters();
      }).catch(error => {
        alert('Failed to delete matter: ' + error.message);
      });
    }
  },

  // Article modals
  openAddArticleModal() {
    this.articleData = { title: '', category: '', content: '', tags: '', status: 'published' };
    document.getElementById('modalTitle').textContent = 'New Article';
    document.getElementById('modalForm').reset();
    document.getElementById('modalCategory').innerHTML =
      '<option value="">Uncategorized</option>' + ['litigation', 'corporate', 'commercial', 'family', 'conveyancing', 'criminal', 'practice']
        .map(c => '<option value="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>').join('');
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.saveArticle()">Save</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async saveArticle() {
    try {
      await Data.addArticle(this.articleData);
      document.getElementById('modal').classList.add('hidden');
      loadArticles();
    } catch (error) {
      alert('Failed to save article: ' + error.message);
    }
  },

  openEditArticle(id) {
    const a = this.articles.find(a => a.id === id);
    if (!a) return;
    this.editArticle = a;
    document.getElementById('modalTitle').textContent = 'Edit Article';
    document.getElementById('modalForm').value = a.title;
    document.getElementById('modalCategory').value = a.category || '';
    document.getElementById('modalContent').value = a.content || '';
    document.getElementById('modalTags').value = a.tags || '';
    document.getElementById('modalStatus').value = a.status || 'published';
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.updateArticle()">Update</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async updateArticle() {
    try {
      await Data.updateArticle(this.editArticle.id, {
        title: document.getElementById('modalForm').value,
        category: document.getElementById('modalCategory').value,
        content: document.getElementById('modalContent').value,
        tags: document.getElementById('modalTags').value,
        status: document.getElementById('modalStatus').value
      });
      document.getElementById('modal').classList.add('hidden');
      loadArticles();
    } catch (error) {
      alert('Failed to update article: ' + error.message);
    }
  },

  openDeleteArticle(id) {
    if (confirm('Are you sure you want to delete this article?')) {
      Data.deleteArticle(id).then(() => {
        loadArticles();
      }).catch(error => {
        alert('Failed to delete article: ' + error.message);
      });
    }
  },

  // Document modals
  openUploadDocumentModal() {
    this.docData = {
      title: '', documentType: '', clientId: '', matterId: '',
      filePath: '', fileName: '', fileSize: 0, mimeType: '', uploadedBy: 'admin', status: 'active'
    };
    document.getElementById('modalTitle').textContent = 'Upload Document';
    document.getElementById('modalForm').reset();
    document.getElementById('modalClient').innerHTML =
      '<option value="">Select Client</option>' + this.clients.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.saveDocument()">Upload</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async saveDocument() {
    try {
      await Data.addDocument(this.docData);
      document.getElementById('modal').classList.add('hidden');
      loadDocuments();
    } catch (error) {
      alert('Failed to save document: ' + error.message);
    }
  },

  openViewDocument(id) {
    const d = this.documents.find(d => d.id === id);
    if (d) {
      alert('Viewing document: ' + d.title + '\nSize: ' + this.formatFileSize(d.file_size) + '\nType: ' + d.document_type);
    }
  },

  openEditDocument(id) {
    const d = this.documents.find(d => d.id === id);
    if (!d) return;
    this.editDocument = d;
    document.getElementById('modalTitle').textContent = 'Edit Document';
    document.getElementById('modalForm').value = d.title;
    document.getElementById('modalDocType').value = d.document_type || '';
    document.getElementById('modalFooter').innerHTML =
      '<button class="btn btn-primary" onclick="Data.updateDocument()">Update</button>' +
      '<button class="btn btn-secondary" onclick="Data.closeModal()">Cancel</button>';
    document.getElementById('modal').classList.remove('hidden');
  },

  async updateDocument() {
    try {
      await Data.updateDocument(this.editDocument.id, {
        title: document.getElementById('modalForm').value,
        documentType: document.getElementById('modalDocType').value
      });
      document.getElementById('modal').classList.add('hidden');
      loadDocuments();
    } catch (error) {
      alert('Failed to update document: ' + error.message);
    }
  },

  // Chat methods
  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-message user';
    userDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-user"></i></div><div class="message-content"><p>' + escapeHtml(message) + '</p></div>';
    chatMessages.appendChild(userDiv);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-message bot';
      botDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><p>' + escapeHtml(data.response || 'I am not fully set up yet. Please contact support for assistance.') + '</p></div>';
      chatMessages.appendChild(botDiv);
    } catch (err) {
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-message bot';
      botDiv.innerHTML = '<div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><p>I am not fully set up yet. Please contact support.</p></div>';
      chatMessages.appendChild(botDiv);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  },

  // Scribe methods
  startRecording() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-AU';

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        document.getElementById('transcript').textContent = transcript;
      };

      this.recognition.onend = () => {
        this.startRecording();
      };

      this.recognition.start();
      document.getElementById('startRecording').disabled = true;
      document.getElementById('stopRecording').disabled = false;
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  },

  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
      document.getElementById('startRecording').disabled = false;
      document.getElementById('stopRecording').disabled = true;
    }
  },

  // Contact form
  async submitContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const result = await fetch('/api/contact', {
      method: 'POST',
      body: data
    });
    if (result.ok) {
      alert('Message sent successfully!');
      form.reset();
    } else {
      alert('Failed to send message.');
    }
  },

  // Composer
  openComposer() {
    document.getElementById('view-composer').classList.add('active');
  },

  closeComposer() {
    document.getElementById('view-composer').classList.remove('active');
  },

  saveComposer() {
    const title = document.getElementById('fileTitle').value;
    const content = document.getElementById('composerEditor').innerHTML;
    if (title) {
      alert('Saved draft: ' + title);
      document.getElementById('fileTitle').value = '';
    } else {
      alert('Please enter a title for your document.');
    }
  },

  // Utility methods
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
