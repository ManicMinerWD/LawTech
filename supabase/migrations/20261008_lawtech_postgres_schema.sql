CREATE SCHEMA IF NOT EXISTS public;

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL DEFAULT 'lawyer',
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  email       text,
  phone       text,
  company     text,
  address     text,
  city        text,
  state       text,
  zip_code    text,
  country     text NOT NULL DEFAULT 'Australia',
  website     text,
  industry    text,
  contact_person text,
  tier        text NOT NULL DEFAULT 'standard',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- matters
CREATE TABLE IF NOT EXISTS public.matters (
  id                uuid PRIMARY KEY,
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title             text NOT NULL,
  matter_type       text,
  description       text,
  status            text NOT NULL DEFAULT 'open',
  priority          text NOT NULL DEFAULT 'normal',
  filing_date       date,
  target_resolution date,
  estimated_cost    real,
  actual_cost       real,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- cases
CREATE TABLE IF NOT EXISTS public.cases (
  id                uuid PRIMARY KEY,
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  matter_id         uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  title             text NOT NULL,
  case_type         text,
  description       text,
  status            text NOT NULL DEFAULT 'open',
  priority          text NOT NULL DEFAULT 'normal',
  filing_date       date,
  due_date          date,
  estimated_cost    real,
  actual_cost       real,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- articles
CREATE TABLE IF NOT EXISTS public.articles (
  id          uuid PRIMARY KEY,
  title       text NOT NULL,
  category    text,
  content     text NOT NULL,
  tags        text,
  author_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  views       integer NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'published',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- documents
CREATE TABLE IF NOT EXISTS public.documents (
  id            uuid PRIMARY KEY,
  client_id     uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  matter_id     uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  title         text NOT NULL,
  document_type text,
  file_path     text,
  file_name     text,
  file_size     bigint,
  mime_type     text,
  uploaded_by   text,
  status        text NOT NULL DEFAULT 'active',
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- document_versions
CREATE TABLE IF NOT EXISTS public.document_versions (
  id            uuid PRIMARY KEY,
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  content       text,
  file_path     text,
  file_name     text,
  file_size     bigint,
  mime_type     text,
  changed_by    text,
  changed_at    timestamptz NOT NULL DEFAULT now()
);

-- audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            uuid PRIMARY KEY,
  user_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  old_values    text,
  new_values    text,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients USING btree (lower(name));
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients USING btree (lower(email));
CREATE INDEX IF NOT EXISTS idx_matters_client_id ON public.matters USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_matters_title ON public.matters USING btree (lower(title));
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_cases_matter_id ON public.cases USING btree (matter_id);
CREATE INDEX IF NOT EXISTS idx_cases_title ON public.cases USING btree (lower(title));
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_title ON public.documents USING btree (lower(title));
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions USING btree (user_id);

-- FKs (explicit, in case CREATE TABLE did not attach them)
ALTER TABLE IF EXISTS public.cases    ADD CONSTRAINT fk_cases_client FOREIGN KEY (client_id)    REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.cases    ADD CONSTRAINT fk_cases_matter  FOREIGN KEY (matter_id)   REFERENCES public.matters(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.matters  ADD CONSTRAINT fk_matters_client FOREIGN KEY (client_id)  REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.articles ADD CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.documents ADD CONSTRAINT fk_documents_client FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.documents ADD CONSTRAINT fk_documents_matter  FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.document_versions ADD CONSTRAINT fk_document_versions_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.audit_log    ADD CONSTRAINT fk_audit_log_user    FOREIGN KEY (user_id)   REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.sessions     ADD CONSTRAINT fk_sessions_user     FOREIGN KEY (user_id)   REFERENCES public.users(id) ON DELETE CASCADE;
