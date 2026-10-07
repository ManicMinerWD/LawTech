-- LawTech - Supabase Postgres schema
-- Migration to migrate LawTech from SQLite to Postgres.
-- Apply in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- pragma journal_mode=WAL (SQLite) is not valid in Postgres.
-- We generate ids via crypto.randomUUID() in app code, so no serial/autoincrement.
--
-- Ordering:
--   1. ids + table skeletons
--   2. indexes
--   3. FK constraints
--   4. seed admin + demo data (optional, only if you seed manually)
--
-- NOTE: RLS off for the write surface. If you later enable RLS, the public
-- schema here is the single place `database.js` writes to; add policies on
-- `public.users`, `public.clients`, `public.cases`, `public.matters`,
-- `public.articles`, `public.documents`, `public.audit_log` as needed.
--
-- pragma foreign_keys = ON is what SQLite uses; Postgres always enforces FKs.

-- ============================================================================
-- Schema version: 1
-- ============================================================================

-- ---- users (login / roles) ----
-- key: email
create table if not exists public.users (
  id         uuid primary key,
  email      text unique not null,
  password_hash text not null,
  name       text not null,
  role       text default 'lawyer' not null,
  phone      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---- clients ----
create table if not exists public.clients (
  id          uuid primary key,
  name        text not null,
  email       text,
  phone       text,
  company     text,
  address     text,
  city        text,
  state       text,
  zip_code    text,
  country     text default 'Australia',
  website     text,
  industry    text,
  contact_person text,
  tier        text default 'standard',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---- matters ----
create table if not exists public.matters (
  id                uuid primary key,
  client_id         uuid not null references public.clients(id) on delete cascade,
  title             text not null,
  matter_type       text,
  description       text,
  status            text default 'open',
  priority          text default 'normal',
  filing_date       date,
  target_resolution date,
  estimated_cost    real,
  actual_cost       real,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ---- cases ----
create table if not exists public.cases (
  id                uuid primary key,
  client_id         uuid not null references public.clients(id) on delete cascade,
  matter_id         uuid references public.matters(id) on delete set null,
  title             text not null,
  case_type         text,
  description       text,
  status            text default 'open',
  priority          text default 'normal',
  filing_date       date,
  due_date          date,
  estimated_cost    real,
  actual_cost       real,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ---- articles -------------------------------------------------
create table if not exists public.articles (
  id          uuid primary key,
  title       text not null,
  category    text,
  content     text not null,
  tags        text,
  author_id   uuid references public.users(id) on delete set null,
  views       integer default 0,
  status      text default 'published',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---- documents -------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key,
  client_id    uuid references public.clients(id) on delete set null,
  matter_id    uuid references public.matters(id) on delete set null,
  title        text not null,
  document_type text,
  file_path    text,
  file_name    text,
  file_size    bigint,
  mime_type    text,
  uploaded_by  text,
  status       text default 'active',
  uploaded_at  timestamptz default now(),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ---- document_versions -------------------------------------------
create table if not exists public.document_versions (
  id            uuid primary key,
  document_id   uuid not null references public.documents(id) on delete cascade,
  version_number integer default 1,
  content       text,
  file_path     text,
  file_name     text,
  file_size     bigint,
  mime_type     text,
  changed_by    text,
  changed_at    timestamptz default now()
);

-- ---- audit_log (append-only) ---------------------------------------
create table if not exists public.audit_log (
  id           uuid primary key,
  user_id      uuid references public.users(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    text not null,
  old_values   text,
  new_values   text,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz default now()
);

-- ---- sessions (auth) ---------------------------------------------
create table if not exists public.sessions (
  id         uuid primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text unique not null,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ---- indexes (additional) -------------------------------------------
create index if not exists idx_clients_name on public.clients using btree (lower(name));
create index if not exists idx_clients_email on public.clients using btree (lower(email));
create index if not exists idx_matters_client_id on public.matters using btree (client_id);
create index if not exists idx_matters_title on public.matters using btree (lower(title));
create index if not exists idx_cases_client_id on public.cases using btree (client_id);
create index if not exists idx_cases_matter_id on public.cases using btree (matter_id);
create index if not exists idx_cases_title on public.cases using btree (lower(title));
create index if not exists idx_articles_author_id on public.articles using btree (author_id);
create index if not exists idx_documents_client_id on public.documents using btree (client_id);
create index if not exists idx_documents_title on public.documents using btree (lower(title));
create index if not exists idx_document_versions_document_id on public.document_versions using btree (document_id);
create index if not exists idx_audit_log_entity on public.audit_log using btree (entity_type, entity_id);
create index if not exists idx_sessions_user_id on public.sessions using btree (user_id);

-- ---- FK constraints (second pass so all tables exist) -------------------
alter table if exists public.cases
  add constraint fk_cases_client foreign key (client_id) references public.clients(id) on delete cascade;

alter table if exists public.cases
  add constraint fk_cases_matter foreign key (matter_id) references public.matters(id) on delete set null;

alter table if exists public.matters
  add constraint fk_matters_client foreign key (client_id) references public.clients(id) on delete cascade;

alter table if exists public.articles
  add constraint fk_articles_author foreign key (author_id) references public.users(id) on delete set null;

alter table if exists public.documents
  add constraint fk_documents_client foreign key (client_id) references public.clients(id) on delete set null;

alter table if exists public.documents
  add constraint fk_documents_matter foreign key (matter_id) references public.matters(id) on delete set null;

alter table if exists public.document_versions
  add constraint fk_document_versions_document foreign key (document_id) references public.documents(id) on delete cascade;

alter table if exists public.audit_log
  add constraint fk_audit_log_user foreign key (user_id) references public.users(id) on delete set null;

alter table if exists public.sessions
  add constraint fk_sessions_user foreign key (user_id) references public.users(id) on delete cascade;

