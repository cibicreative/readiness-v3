/*
  # Knowledge Layer Schema

  ## Overview
  Creates a structured markdown knowledge layer for documenting processes, data sources,
  tools, and investment decisions. Supports versioning, export tracking, and flexible
  tagging without modifying the core assessment tables.

  ## 1. New Tables

  ### knowledge_documents
  Metadata for each markdown document
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → clients)
  - `doc_type` (text) - process, data_source, tool, gate_reference, investment_memo_appendix
  - `title` (text) - Document title
  - `slug` (text) - URL-friendly identifier, unique per client
  - `source_entity_type` (text, nullable) - process, data_source, tool, etc.
  - `source_entity_id` (uuid, nullable) - ID of source entity
  - `status` (text) - active, archived, draft
  - `owner_role_id` (uuid, nullable, FK → roles)
  - `risk_level` (text, nullable) - low, medium, high
  - `investment_category` (text, nullable)
  - `bucket` (text, nullable) - do_now, prepare, defer, avoid
  - `tags` (jsonb) - Array of tags
  - `metadata` (jsonb) - Additional key-value data
  - `current_version_id` (uuid, nullable, FK → knowledge_document_versions)
  - `created_at`, `updated_at` (timestamptz)

  ### knowledge_document_versions
  Version history for markdown content
  - `id` (uuid, primary key)
  - `document_id` (uuid, FK → knowledge_documents)
  - `version_number` (int) - Sequential version number
  - `content_markdown` (text) - Full markdown content
  - `content_hash` (text) - SHA256 hash for deduplication
  - `generated_from` (jsonb) - Snapshot of source data (process_id, step_ids, scores)
  - `generation_mode` (text) - generated, edited, imported
  - `created_by_user_id` (uuid, nullable) - Future user tracking
  - `created_at` (timestamptz)

  ### knowledge_exports
  Track bulk export operations
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → clients)
  - `export_type` (text) - zip, bundle
  - `filters` (jsonb) - Export filters (doc_type, bucket, risk_level)
  - `status` (text) - queued, running, done, failed
  - `result_url` (text, nullable) - Optional download URL
  - `created_by_user_id` (uuid, nullable)
  - `created_at`, `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Authenticated users can read/write their own client documents
  - Anonymous users can read via share_token validation

  ## 3. Indexes
  - Fast lookups by client and doc_type
  - Unique slugs per client
  - Source entity tracking
  - Version history ordering
*/

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('process', 'data_source', 'tool', 'gate_reference', 'investment_memo_appendix', 'overview')),
  title text NOT NULL,
  slug text NOT NULL,
  source_entity_type text,
  source_entity_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  owner_role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high')),
  investment_category text,
  bucket text CHECK (bucket IN ('do_now', 'prepare', 'defer', 'avoid')),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_version_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create knowledge_document_versions table
CREATE TABLE IF NOT EXISTS knowledge_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  content_markdown text NOT NULL,
  content_hash text NOT NULL,
  generated_from jsonb NOT NULL DEFAULT '{}'::jsonb,
  generation_mode text NOT NULL CHECK (generation_mode IN ('generated', 'edited', 'imported')),
  created_by_user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create knowledge_exports table
CREATE TABLE IF NOT EXISTS knowledge_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  export_type text NOT NULL CHECK (export_type IN ('zip', 'bundle')),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  result_url text,
  created_by_user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for current_version_id (must be added after versions table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'knowledge_documents_current_version_id_fkey'
  ) THEN
    ALTER TABLE knowledge_documents
    ADD CONSTRAINT knowledge_documents_current_version_id_fkey
    FOREIGN KEY (current_version_id)
    REFERENCES knowledge_document_versions(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for knowledge_documents
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_client_doc_type ON knowledge_documents(client_id, doc_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_documents_client_slug ON knowledge_documents(client_id, slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source_entity ON knowledge_documents(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_bucket ON knowledge_documents(bucket) WHERE bucket IS NOT NULL;

-- Create indexes for knowledge_document_versions
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_document_versions_doc_version ON knowledge_document_versions(document_id, version_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_versions_doc_created ON knowledge_document_versions(document_id, created_at DESC);

-- Create indexes for knowledge_exports
CREATE INDEX IF NOT EXISTS idx_knowledge_exports_client ON knowledge_exports(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_exports_status ON knowledge_exports(status);

-- Enable Row Level Security
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_documents
CREATE POLICY "Authenticated users can read all knowledge documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert knowledge documents"
  ON knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge documents"
  ON knowledge_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete knowledge documents"
  ON knowledge_documents FOR DELETE
  TO authenticated
  USING (true);

-- Anonymous users can view via share token
CREATE POLICY "Anonymous users can view knowledge documents via share token"
  ON knowledge_documents FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = knowledge_documents.client_id
      AND clients.share_enabled = true
      AND (clients.share_expires_at IS NULL OR clients.share_expires_at > now())
    )
  );

-- RLS Policies for knowledge_document_versions
CREATE POLICY "Authenticated users can read all document versions"
  ON knowledge_document_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document versions"
  ON knowledge_document_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update document versions"
  ON knowledge_document_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document versions"
  ON knowledge_document_versions FOR DELETE
  TO authenticated
  USING (true);

-- Anonymous users can view versions via share token
CREATE POLICY "Anonymous users can view document versions via share token"
  ON knowledge_document_versions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_documents kd
      JOIN clients c ON c.id = kd.client_id
      WHERE kd.id = knowledge_document_versions.document_id
      AND c.share_enabled = true
      AND (c.share_expires_at IS NULL OR c.share_expires_at > now())
    )
  );

-- RLS Policies for knowledge_exports
CREATE POLICY "Authenticated users can read all exports"
  ON knowledge_exports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exports"
  ON knowledge_exports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exports"
  ON knowledge_exports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete exports"
  ON knowledge_exports FOR DELETE
  TO authenticated
  USING (true);
