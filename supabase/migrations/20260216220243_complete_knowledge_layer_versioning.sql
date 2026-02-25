/*
  # Complete Knowledge Layer Versioning Setup

  This migration completes the knowledge layer versioning system by adding:
  
  1. Missing Indexes
    - Status filtering index for knowledge_documents
    - Content hash index for knowledge_document_versions (deduplication)
    - Unique constraint for source entity linking

  2. RLS Policies
    - Public read access for document versions (client sharing)
    - Authenticated-only write access for versions
    - Immutability enforcement for versions

  Note: Tables and core columns already exist from previous migration.
  This migration is idempotent and safe to run multiple times.
*/

-- =====================================================
-- 1. Add missing indexes
-- =====================================================

-- Index for status filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status
  ON knowledge_documents(client_id, status);

-- Index for content hash lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_knowledge_document_versions_hash
  ON knowledge_document_versions(content_hash);

-- Unique constraint: one knowledge document per source entity
-- This ensures we don't create duplicate docs for the same process, tool, etc.
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_documents_unique_source
  ON knowledge_documents(client_id, source_entity_type, source_entity_id)
  WHERE source_entity_id IS NOT NULL;

-- =====================================================
-- 2. Ensure RLS is enabled
-- =====================================================

ALTER TABLE knowledge_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Drop existing policies if they exist (idempotent)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read access to document versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Authenticated users can create versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Versions are immutable" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Versions deleted only via cascade" ON knowledge_document_versions;

-- =====================================================
-- 4. Create RLS policies for knowledge_document_versions
-- =====================================================

-- Policy: Anyone can view versions (for public sharing via client token)
CREATE POLICY "Allow public read access to document versions"
  ON knowledge_document_versions
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can create new versions
-- This ensures version history integrity
-- For anonymous access apps, you can change this to allow anon role
CREATE POLICY "Authenticated users can create versions"
  ON knowledge_document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: No updates allowed - versions are immutable
-- If you need to change content, create a new version
CREATE POLICY "Versions are immutable"
  ON knowledge_document_versions
  FOR UPDATE
  USING (false);

-- Policy: No deletes by users - cascade from parent document only
CREATE POLICY "Versions deleted only via cascade"
  ON knowledge_document_versions
  FOR DELETE
  USING (false);

-- =====================================================
-- 5. Add helpful comments
-- =====================================================

COMMENT ON TABLE knowledge_document_versions IS
  'Immutable version history for knowledge documents with markdown content and generation metadata';

COMMENT ON COLUMN knowledge_document_versions.version_number IS
  'Sequential version number starting at 1 for each document';

COMMENT ON COLUMN knowledge_document_versions.content_markdown IS
  'Full markdown content for this version';

COMMENT ON COLUMN knowledge_document_versions.content_hash IS
  'SHA-256 hash of content for deduplication and integrity';

COMMENT ON COLUMN knowledge_document_versions.generation_mode IS
  'How this version was created: generated (AI), edited (manual), imported (external)';

COMMENT ON COLUMN knowledge_document_versions.generated_from IS
  'Source metadata: {process_id, tool_id, template_id, etc.}';

COMMENT ON COLUMN knowledge_documents.source_entity_type IS
  'Type of linked entity: process, tool, data_source, etc.';

COMMENT ON COLUMN knowledge_documents.source_entity_id IS
  'UUID of the linked source entity';

COMMENT ON COLUMN knowledge_documents.current_version_id IS
  'Reference to the active/published version';

COMMENT ON COLUMN knowledge_documents.metadata IS
  'Flexible JSON storage for tags, authors, review status, etc.';

COMMENT ON COLUMN knowledge_documents.status IS
  'Lifecycle status: active (published), draft (work in progress), archived (deprecated)';
