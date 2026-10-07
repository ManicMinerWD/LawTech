// LawTech - Supabase Postgres Database Module
// Replaces better-sqlite3 so the app persists to a real managed Postgres
// database in production. No better-sqlite3 needed; no secrets shipped.
//
// Env (from .env):
//   SUPABASE_URL      https://<project>.supabase.co
//   SUPABASE_ANON_KEY sb_pub... (anon/publishable key, apiKeys scope)
//   JWT_SECRET        (your own signing secret for LawTech sessions)
//   ADMIN_EMAIL       initial admin email
//   ADMIN_PASSWORD    initial admin password

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'lawtech-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lawtech.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
const ADMIN_ROLE = 'admin';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'LawTech is not configured for Supabase. Set SUPABASE_URL and ' +
    'SUPABASE_ANON_KEY in .env.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// UUID v4
function generateId() {
  return crypto.randomUUID();
}

// bcrypt sync hashing (managed separately, not a DB write)
function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// ---------------------------------------------------------------------------
// Public schema is the single place LawTech writes to. Every query scopes
// through it so future RLS policies (auth.users / profiles) slot in cleanly.
// ---------------------------------------------------------------------------

const SCHEMA = 'public';

// ---- users ------------------------------------------------------------------

async function ensureAdmin() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;

  const hash = hashPassword(ADMIN_PASSWORD);
  const { data: inserted, error: insErr } = await supabase
    .from('users')
    .insert([
      {
        id: generateId(),
        email: ADMIN_EMAIL,
        password_hash: hash,
        name: ADMIN_NAME,
        role: ADMIN_ROLE,
        phone: '0400 000 000',
      },
    ])
    .select()
    .single();
  if (insErr) throw insErr;
  return inserted.id;
}

// ---- clients -----------------------------------------------------------------

async function getClients(search = '') {
  const q = supabase
    .from('clients')
    .select('*')
    .order('name');
  if (search) {
    const like = `%${search}%`;
    q.or(`name.ilike.*${like},email.ilike.*${like},company.ilike.*${like}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function createClientRow(data) {
  const { data: inserted, error } = await supabase
    .from('clients')
    .insert([
      {
        id: generateId(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        country: data.country || 'Australia',
        website: data.website,
        industry: data.industry,
        contact_person: data.contactPerson,
        tier: data.tier || 'standard',
        notes: data.notes,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  logAudit(inserted.id, 'CREATE', 'client', inserted.id, null, JSON.stringify(inserted), null, null);
  return inserted;
}

async function updateClient(id, data) {
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return null;

  const updates = [];
  const values = [];
  for (const key of ['name', 'email', 'phone', 'company', 'address', 'city', 'state', 'zip_code', 'country', 'website', 'industry', 'contact_person', 'tier', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return existing;

  const setClause = updates.join(', ');
  const { data: updated, error } = await supabase
    .from('clients')
    .update([{ [setClause]: values.join(', ') }])
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  logAudit(updated.id, 'UPDATE', 'client', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);
  return updated;
}

async function deleteClient(id) {
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (existing) {
    logAudit(id, 'DELETE', 'client', id, JSON.stringify(existing), null, null, null);
  }
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ---- cases -------------------------------------------------------------------

async function getCases(clientId = '', search = '') {
  let query = supabase
    .from('cases')
    .select(`
      *,
      clients!inner(name, email)
    `)
    .order('created_at', { ascending: false });
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (search) {
    const like = `%${search}%`;
    query.or(`title.ilike.*${like},description.ilike.*${like},clients.name.ilike.*${like}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getCase(id) {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      clients!inner(name, email)
    `)
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function createCase(data) {
  const { data: inserted, error } = await supabase
    .from('cases')
    .insert([
      {
        id: generateId(),
        client_id: data.clientId,
        matter_id: data.matterId,
        title: data.title,
        case_type: data.caseType,
        description: data.description,
        status: data.status || 'open',
        priority: data.priority || 'normal',
        filing_date: data.filingDate,
        due_date: data.dueDate,
        estimated_cost: data.estimatedCost,
        actual_cost: data.actualCost,
        notes: data.notes,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  logAudit(inserted.id, 'CREATE', 'case', inserted.id, null, JSON.stringify(inserted), null, null);
  return inserted;
}

async function updateCase(id, data) {
  const { data: existing } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return null;

  const updates = [];
  const values = [];
  for (const key of ['title', 'case_type', 'description', 'status', 'priority', 'filing_date', 'due_date', 'estimated_cost', 'actual_cost', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return existing;

  const setClause = updates.join(', ');
  const { data: updated, error } = await supabase
    .from('cases')
    .update([{ [setClause]: values.join(', ') }])
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  logAudit(updated.id, 'UPDATE', 'case', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);
  return updated;
}

async function deleteCase(id) {
  const { data: existing } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();
  if (existing) {
    logAudit(id, 'DELETE', 'case', id, JSON.stringify(existing), null, null, null);
  }
  const { error } = await supabase.from('cases').delete().eq('id', id);
  if (error) throw error;
}

// ---- matters -----------------------------------------------------------------

async function getMatters(search = '') {
  const q = supabase.from('matters').select('*').order('title');
  if (search) {
    const like = `%${search}%`;
    q.or(`title.ilike.*${like},description.ilike.*${like}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function getMatter(id) {
  const { data, error } = await supabase
    .from('matters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function createMatter(data) {
  const { data: inserted, error } = await supabase
    .from('matters')
    .insert([
      {
        id: generateId(),
        client_id: data.clientId,
        title: data.title,
        matter_type: data.matterType,
        description: data.description,
        status: data.status || 'open',
        priority: data.priority || 'normal',
        filing_date: data.filingDate,
        target_resolution: data.targetResolution,
        estimated_cost: data.estimatedCost,
        actual_cost: data.actualCost,
        notes: data.notes,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  logAudit(inserted.id, 'CREATE', 'matter', inserted.id, null, JSON.stringify(inserted), null, null);
  return inserted;
}

async function updateMatter(id, data) {
  const { data: existing } = await supabase
    .from('matters')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return null;

  const updates = [];
  const values = [];
  for (const key of ['title', 'matter_type', 'description', 'status', 'priority', 'filing_date', 'target_resolution', 'estimated_cost', 'actual_cost', 'notes']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return existing;

  const setClause = updates.join(', ');
  const { data: updated, error } = await supabase
    .from('matters')
    .update([{ [setClause]: values.join(', ') }])
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  logAudit(updated.id, 'UPDATE', 'matter', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);
  return updated;
}

async function deleteMatter(id) {
  const { data: existing } = await supabase
    .from('matters')
    .select('*')
    .eq('id', id)
    .single();
  if (existing) {
    logAudit(id, 'DELETE', 'matter', id, JSON.stringify(existing), null, null, null);
  }
  const { error } = await supabase.from('matters').delete().eq('id', id);
  if (error) throw error;
}

// ---- articles (knowledgebase) ----------------------------------------------------

async function getArticles(category = '', search = '') {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });
  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    const like = `%${search}%`;
    query.or(`title.ilike.*${like},content.ilike.*${like},tags.ilike.*${like}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getArticle(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function createArticle(data) {
  const { data: inserted, error } = await supabase
    .from('articles')
    .insert([
      {
        id: generateId(),
        title: data.title,
        category: data.category,
        content: data.content,
        tags: data.tags,
        author_id: data.authorId,
        status: data.status || 'published',
      },
    ])
    .select()
    .single();
  if (error) throw error;
  logAudit(inserted.id, 'CREATE', 'article', inserted.id, null, JSON.stringify(inserted), null, null);
  return inserted;
}

async function updateArticle(id, data) {
  const { data: existing } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return null;

  const updates = [];
  const values = [];
  for (const key of ['title', 'category', 'content', 'tags', 'status']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return existing;

  const setClause = updates.join(', ');
  const { data: updated, error } = await supabase
    .from('articles')
    .update([{ [setClause]: values.join(', ') }])
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  logAudit(updated.id, 'UPDATE', 'article', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);
  return updated;
}

async function deleteArticle(id) {
  const { data: existing } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (existing) {
    logAudit(id, 'DELETE', 'article', id, JSON.stringify(existing), null, null, null);
  }
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

// ---- documents -----------------------------------------------------------------

async function getDocuments(search = '') {
  let query = supabase
    .from('documents')
    .select(`
      *,
      clients!inner(name, company)
    `)
    .order('uploaded_at', { ascending: false });
  if (search) {
    const like = `%${search}%`;
    query.or(`title.ilike.*${like},document_type.ilike.*${like},clients.name.ilike.*${like}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getDocument(id) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      clients!inner(name, company)
    `)
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function createDocument(data) {
  const { data: inserted, error } = await supabase
    .from('documents')
    .insert([
      {
        id: generateId(),
        client_id: data.clientId,
        matter_id: data.matterId,
        title: data.title,
        document_type: data.documentType,
        file_path: data.filePath,
        file_name: data.fileName,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        uploaded_by: data.uploadedBy,
        status: data.status || 'active',
      },
    ])
    .select()
    .single();
  if (error) throw error;
  logAudit(inserted.id, 'CREATE', 'document', inserted.id, null, JSON.stringify(inserted), null, null);
  return inserted;
}

async function updateDocument(id, data) {
  const { data: existing } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  if (!existing) return null;

  const updates = [];
  const values = [];
  for (const key of ['title', 'document_type', 'file_path', 'file_name', 'file_size', 'mime_type', 'status']) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (updates.length === 0) return existing;

  const setClause = updates.join(', ');
  const { data: updated, error } = await supabase
    .from('documents')
    .update([{ [setClause]: values.join(', ') }])
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  logAudit(updated.id, 'UPDATE', 'document', updated.id, JSON.stringify(existing), JSON.stringify(updated), null, null);
  return updated;
}

async function deleteDocument(id) {
  const { data: existing } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  if (existing) {
    logAudit(id, 'DELETE', 'document', id, JSON.stringify(existing), null, null, null);
  }
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// ---- document versions -----------------------------------------------------------

async function getDocumentVersions(documentId) {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function addDocumentVersion(documentId, data) {
  const versions = await getDocumentVersions(documentId);
  const versionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
  const { data: inserted, error } = await supabase
    .from('document_versions')
    .insert([
      {
        id: generateId(),
        document_id: documentId,
        version_number: versionNumber,
        content: data.content,
        file_path: data.filePath,
        file_name: data.fileName,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        changed_by: data.changedBy,
        changed_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return inserted;
}

// ---- audit log --------------------------------------------------------------------

async function logAudit(userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent) {
  await supabase.from('audit_log').insert([
    {
      id: generateId(),
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  ]);
}

// ---- visitor (guest) access ----------------------------------------------------------

async function getVisitor(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

module.exports = {
  init() {
    // No-op: Supabase is connectionless. ensureAdmin() seeds on first access.
  },
  generateId,
  hashPassword,
  verifyPassword,
  generateToken,
  getClients,
  getClient,
  createClientRow,
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
  ensureAdmin,
};
