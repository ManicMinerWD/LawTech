// LawTech - Case Management & Knowledgebase System for Lawyers
// v1.0.0 | Warren Duncan (ManicMinerWD)

const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
database.init();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Client routes
app.get('/api/clients', (req, res) => {
  const clients = database.getClients(req.query.search || '');
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const client = database.createClient(req.body);
  res.status(201).json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const client = database.updateClient(req.params.id, req.body);
  res.json(client);
});

app.delete('/api/clients/:id', (req, res) => {
  database.deleteClient(req.params.id);
  res.json({ success: true });
});

// Case routes
app.get('/api/cases', (req, res) => {
  const cases = database.getCases(req.query.clientId || '', req.query.search || '');
  res.json(cases);
});

app.post('/api/cases', (req, res) => {
  const record = database.createCase(req.body);
  const id = record.id;
  res.status(201).json({ record, matterId: req.body.matterId });
});

app.put('/api/cases/:id', (req, res) => {
  const record = database.updateCase(req.params.id, req.body);
  res.json(record);
});

app.delete('/api/cases/:id', (req, res) => {
  database.deleteCase(req.params.id);
  res.json({ success: true });
});

// Matter routes
app.get('/api/matters', (req, res) => {
  const matters = database.getMatters(req.query.search || '');
  res.json(matters);
});

app.post('/api/matters', (req, res) => {
  const matter = database.createMatter(req.body);
  res.status(201).json(matter);
});

app.put('/api/matters/:id', (req, res) => {
  const matter = database.updateMatter(req.params.id, req.body);
  res.json(matter);
});

app.delete('/api/matters/:id', (req, res) => {
  database.deleteMatter(req.params.id);
  res.json({ success: true });
});

// Knowledgebase routes
app.get('/api/articles', (req, res) => {
  const articles = database.getArticles(req.query.category || '', req.query.search || '');
  res.json(articles);
});

app.post('/api/articles', (req, res) => {
  const article = database.createArticle(req.body);
  res.status(201).json(article);
});

app.put('/api/articles/:id', (req, res) => {
  const article = database.updateArticle(req.params.id, req.body);
  res.json(article);
});

app.delete('/api/articles/:id', (req, res) => {
  database.deleteArticle(req.params.id);
  res.json({ success: true });
});

// Document routes
app.get('/api/documents', (req, res) => {
  const docs = database.getDocuments(req.query.search || '');
  res.json(docs);
});

app.post('/api/documents', (req, res) => {
  const doc = database.createDocument(req.body);
  res.status(201).json(doc);
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const user = database.registerUser(req.body);
  res.status(201).json(user);
});

app.post('/api/auth/login', (req, res) => {
  const result = database.loginUser(req.body);
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

// Visitor route (guest access)
app.get('/api/visitors/:id', (req, res) => {
  const visitor = database.getVisitor(req.params.id);
  res.json(visitor || { error: 'Visitor not found' });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LawTech server running on port ${PORT}`);
});
