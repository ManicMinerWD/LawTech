// LawTech Database Module
// SQLite database for case management and knowledgebase system

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DB_PATH = path.join(__dirname, 'lawtech.db');

if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

let db;

function init() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create all tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'lawyer',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT DEFAULT 'Australia',
      website TEXT,
      industry TEXT,
      contact_person TEXT,
      tier TEXT DEFAULT 'standard',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      matter_id TEXT,
      title TEXT NOT NULL,
      case_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      filing_date DATE,
      due_date DATE,
      estimated_cost REAL,
      actual_cost REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (matter_id) REFERENCES matters(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS matters (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      matter_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      filing_date DATE,
      target_resolution DATE,
      estimated_cost REAL,
      actual_cost REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      content TEXT NOT NULL,
      tags TEXT,
      author_id TEXT,
      views INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      matter_id TEXT,
      title TEXT NOT NULL,
      document_type TEXT,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_by TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (matter_id) REFERENCES matters(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_number INTEGER DEFAULT 1,
      content TEXT,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      changed_by TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed initial data
  seedData();
}

function seedData() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const existing = stmt.get();
  if (existing.count > 0) return;

  // Create default admin user
  const adminId = generateId();
  const adminHash = hashPassword('admin123');
  db.prepare('INSERT INTO users (id, email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)')
    .run(adminId, 'admin@lawtech.com', adminHash, 'Admin User', 'admin', '0400 000 000');

  // Insert demo client
  const clientId = generateId();
  db.prepare('INSERT INTO clients (id, name, email, phone, company, address, city, state, zip_code, country, website, industry, contact_person, tier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(clientId, 'Sarah Johnson', 'sarah@example.com', '+61 400 000 001', 'Globex Inc', '108 Queen Street', 'Melbourne', 'VIC', '3000', 'Australia', 'https://globex.com', 'Finance', 'Robert Johnson', 'standard', '');

  // Insert demo case
  const caseId = generateId();
  db.prepare('INSERT INTO cases (id, client_id, title, case_type, description, status, priority, filing_date, due_date, estimated_cost, actual_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(caseId, clientId, 'Johnson Asset Acquisition', 'M&A', 'Acquisition of portfolio assets across multiple sectors.', 'in_progress', 'high', '2026-03-01', '2026-12-01', 200000, null, '');

  // Insert demo matter
  const matterId = generateId();
  db.prepare('INSERT INTO matters (id, client_id, title, matter_type, description, status, priority, filing_date, target_resolution, estimated_cost, actual_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(matterId, clientId, 'Portfolio Acquisition', 'M&A', 'Portfolio acquisition across multiple sectors and jurisdictions.', 'in_progress', 'high', '2026-03-01', '2026-12-01', 350000, null, '');

  // Insert demo article
  const articleId = generateId();
  db.prepare('INSERT INTO articles (id, title, category, content, tags, author_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(articleId, 'M&A Due Diligence Checklist', 'corporate', 'Standard checklist for M&A due diligence preparation covering financial, legal, and operational aspects. Key areas include: 1) Financial due diligence - review of financial statements, tax records, and forecasts. 2) Legal due diligence - contracts, IP, litigation, employment matters. 3) Commercial due diligence - market analysis, customer concentration, and product viability.', 'M&A, due diligence, checklist, corporate, finance', adminId, 'published');

  // Insert demo document
  const docId = generateId();
  db.prepare('INSERT INTO documents (id, client_id, title, document_type, file_path, file_name, file_size, mime_type, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(docId, clientId, 'NDA Template', 'Template', '/docs/nda.pdf', 'nda-template.pdf', 245760, 'application/pdf', adminId, 'active');
}

function getDB() {
  if (!db) {
    init();
  }
  return db;
}

function generateId() {
  return require('uuid').v4();
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'lawtech-secret-key', {
    expiresIn: '7d'
  });
}

// // User operations
// function registerUser(data) {
//   const db = getDB();
//   const id = generateId();
//   const passwordHash = hashPassword(data.password);

//   const info = db.prepare(`
//     INSERT INTO users (id, email, password_hash, name, role, phone)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `).run(id, data.email, passwordHash, data.name, data.role || 'lawyer', data.phone);

//   const user = db.prepare('SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?')
//     .get(id);

//   return user;
// }

// function loginUser(data) {
//   const db = getDB();
//   const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);

//   if (!user) {
//     return { error: 'Invalid email or password' };
//   }

//   if (!verifyPassword(data.password, user.password_hash)) {
//     return { error: 'Invalid email or password' };
//   }

//   const token = generateToken(user.id);
//   const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

//   db.prepare(`
//     INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `).run(generateId(), user.id, token, expiresAt, data.ip, data.userAgent);

//   const { password_hash, ...userWithoutHash } = user;
//   return { ...userWithoutHash, token };
// }

// function getUsers(search) {
//   const db = getDB();
//   if (search) {
//     return db.prepare('SELECT id, email, name, role, phone, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY name')
//       .all(`%${search}%`, `%${search}%`);
//   }
//   return db.prepare('SELECT id, email, name, role, phone, created_at FROM users ORDER BY name').all();
// }

// Client operations
function getClients(search) {
  const db = getDB();
  if (search) {
    return db.prepare('SELECT * FROM clients WHERE name LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY name')
      .all(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  return db.prepare('SELECT * FROM clients ORDER BY name').all();
}

function getClient(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

function createClient(data) {
  const db = getDB();
  const id = generateId();

  const info = db.prepare(`
    INSERT INTO clients (id, name, email, phone, company, address, city, state, zip_code, country, website, industry, contact_person, tier, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.name, data.email, data.phone, data.company, data.address, data.city, data.state,
    data.zipCode, data.country, data.website, data.industry, data.contactPerson, data.tier, data.notes
  );

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'CREATE', 'client', client.id, null, JSON.stringify(client), null, null);

  return client;
}

function updateClient(id, data) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];
  for (const key of ['name', 'email', 'phone', 'company', 'address', 'city', 'state', 'zip_code', 'country', 'website', 'industry', 'contact_person', 'tier', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  values.push(id);

  if (updates.length === 0) {
    return existing;
  }

  db.prepare(`UPDATE clients SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);

  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'UPDATE', 'client', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);

  return updated;
}

function deleteClient(id) {
  const db = getDB();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  db.prepare('DELETE FROM clients WHERE id = ?').run(id);

  if (client) {
    logAudit(id, 'DELETE', 'client', client.id, JSON.stringify(client), null, null, null);
  }

  // Also delete related cases and documents
  db.prepare('DELETE FROM cases WHERE client_id = ?').run(id);
  db.prepare('DELETE FROM documents WHERE client_id = ?').run(id);
}

// Case operations
function getCases(clientId, search) {
  const db = getDB();
  let query = `
    SELECT c.*, cl.name as client_name, cl.email as client_email
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
  `;
  const params = [];

  if (clientId) {
    query += ' WHERE c.client_id = ?';
    params.push(clientId);
  }

  if (search) {
    query += (clientId ? ' AND' : ' WHERE') + ' (c.title LIKE ? OR c.description LIKE ? OR cl.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY c.created_at DESC';

  return db.prepare(query).all(...params);
}

function getCase(id) {
  const db = getDB();
  return db.prepare(`
    SELECT c.*, cl.name as client_name, cl.email as client_email
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ?
  `).get(id);
}

function createCase(data) {
  const db = getDB();
  const id = generateId();

  const info = db.prepare(`
    INSERT INTO cases (id, client_id, matter_id, title, case_type, description, status, priority, filing_date, due_date, estimated_cost, actual_cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.clientId, data.matterId, data.title, data.caseType, data.description,
    data.status || 'open', data.priority || 'normal', data.filingDate, data.dueDate,
    data.estimatedCost, data.actualCost, data.notes
  );

  const record = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'CREATE', 'case', record.id, null, JSON.stringify(record), null, null);

  return record;
}

function updateCase(id, data) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);

  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];
  for (const key of ['title', 'case_type', 'description', 'status', 'priority', 'filing_date', 'due_date', 'estimated_cost', 'actual_cost', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  values.push(id);

  if (updates.length === 0) {
    return existing;
  }

  db.prepare(`UPDATE cases SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);

  const updated = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'UPDATE', 'case', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);

  return updated;
}

function deleteCase(id) {
  const db = getDB();
  const record = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);

  db.prepare('DELETE FROM cases WHERE id = ?').run(id);

  if (record) {
    logAudit(id, 'DELETE', 'case', record.id, JSON.stringify(record), null, null, null);
  }
}

// Matter operations
function getMatters(search) {
  const db = getDB();
  if (search) {
    return db.prepare(`
      SELECT * FROM matters WHERE title LIKE ? OR description LIKE ? ORDER BY title
    `).all(`%${search}%`, `%${search}%`);
  }
  return db.prepare('SELECT * FROM matters ORDER BY title').all();
}

function getMatter(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM matters WHERE id = ?').get(id);
}

function createMatter(data) {
  const db = getDB();
  const id = generateId();

  const info = db.prepare(`
    INSERT INTO matters (id, client_id, title, matter_type, description, status, priority, filing_date, target_resolution, estimated_cost, actual_cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.clientId, data.title, data.matterType, data.description,
    data.status || 'open', data.priority || 'normal', data.filingDate,
    data.targetResolution, data.estimatedCost, data.actualCost, data.notes
  );

  const matter = db.prepare('SELECT * FROM matters WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'CREATE', 'matter', matter.id, null, JSON.stringify(matter), null, null);

  return matter;
}

function updateMatter(id, data) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM matters WHERE id = ?').get(id);

  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];
  for (const key of ['title', 'matter_type', 'description', 'status', 'priority', 'filing_date', 'target_resolution', 'estimated_cost', 'actual_cost', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  values.push(id);

  if (updates.length === 0) {
    return existing;
  }

  db.prepare(`UPDATE matters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);

  const updated = db.prepare('SELECT * FROM matters WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'UPDATE', 'matter', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);

  return updated;
}

function deleteMatter(id) {
  const db = getDB();
  const matter = db.prepare('SELECT * FROM matters WHERE id = ?').get(id);

  db.prepare('DELETE FROM matters WHERE id = ?').run(id);

  if (matter) {
    logAudit(id, 'DELETE', 'matter', matter.id, JSON.stringify(matter), null, null, null);
  }
}

// Article (knowledgebase) operations
function getArticles(category, search) {
  const db = getDB();
  let query = 'SELECT * FROM articles WHERE status = ?';
  const params = ['published'];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY updated_at DESC';

  return db.prepare(query).all(...params);
}

function getArticle(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
}

function createArticle(data) {
  const db = getDB();
  const id = generateId();

  const info = db.prepare(`
    INSERT INTO articles (id, title, category, content, tags, author_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.title, data.category, data.content, data.tags, data.authorId, data.status || 'published'
  );

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'CREATE', 'article', article.id, null, JSON.stringify(article), null, null);

  return article;
}

function updateArticle(id, data) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];
  for (const key of ['title', 'category', 'content', 'tags', 'status']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  values.push(id);

  if (updates.length === 0) {
    return existing;
  }

  db.prepare(`UPDATE articles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'UPDATE', 'article', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);

  return updated;
}

function deleteArticle(id) {
  const db = getDB();
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

  db.prepare('DELETE FROM articles WHERE id = ?').run(id);

  if (article) {
    logAudit(id, 'DELETE', 'article', article.id, JSON.stringify(article), null, null, null);
  }
}

// Document operations
function getDocuments(search) {
  const db = getDB();
  if (search) {
    return db.prepare(`
      SELECT d.*, cl.name as client_name, cl.company
      FROM documents d
      LEFT JOIN clients cl ON d.client_id = cl.id
      WHERE d.title LIKE ? OR d.document_type LIKE ? OR cl.name LIKE ?
      ORDER BY d.uploaded_at DESC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  return db.prepare(`
    SELECT d.*, cl.name as client_name, cl.company
    FROM documents d
    LEFT JOIN clients cl ON d.client_id = cl.id
    ORDER BY d.uploaded_at DESC
  `).all();
}

function getDocument(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

function createDocument(data) {
  const db = getDB();
  const id = generateId();

  const info = db.prepare(`
    INSERT INTO documents (id, client_id, matter_id, title, document_type, file_path, file_name, file_size, mime_type, uploaded_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.clientId, data.matterId, data.title, data.documentType,
    data.filePath, data.fileName, data.fileSize, data.mimeType, data.uploadedBy, data.status || 'active'
  );

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'CREATE', 'document', doc.id, null, JSON.stringify(doc), null, null);

  return doc;
}

function updateDocument(id, data) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];
  for (const key of ['title', 'document_type', 'file_path', 'file_name', 'file_size', 'mime_type', 'status']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  values.push(id);

  if (updates.length === 0) {
    return existing;
  }

  db.prepare(`UPDATE documents SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  // Audit log
  logAudit(id, 'UPDATE', 'document', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);

  return updated;
}

function deleteDocument(id) {
  const db = getDB();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);

  if (doc) {
    logAudit(id, 'DELETE', 'document', doc.id, JSON.stringify(doc), null, null, null);
  }
}

// Document version history
function getDocumentVersions(documentId) {
  const db = getDB();
  return db.prepare('SELECT * FROM document_versions WHERE document_id = ? ORDER BY version_number DESC').all(documentId);
}

function addDocumentVersion(documentId, data) {
  const db = getDB();
  const versions = getDocumentVersions(documentId);
  const versionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

  const info = db.prepare(`
    INSERT INTO document_versions (id, document_id, version_number, content, file_path, file_name, file_size, mime_type, changed_by, changed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(), documentId, versionNumber, data.content, data.filePath, data.fileName,
    data.fileSize, data.mimeType, data.changedBy, new Date().toISOString()
  );

  return db.prepare('SELECT * FROM document_versions WHERE id = ?').get(info.lastInsertRowid);
}

// Audit log
function logAudit(userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent) {
  const db = getDB();
  db.prepare(`
    INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(generateId(), userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent);
}

// Visitor (guest) access
function getVisitor(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
}

module.exports = {
  init,
  getDB,
  // registerUser,
  // loginUser,
  // getUsers,
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  getMatters,
  getMatter,
  createMatter,
  updateMatter,
  deleteMatter,
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  addDocumentVersion,
  getVisitor,
  // hashPassword,
  // verifyPassword,
  // generateToken,
  generateId,
};
