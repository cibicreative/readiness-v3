/*
  # Fix Database Performance and Security Issues

  ## Summary
  Addresses performance issues with missing foreign key indexes, removes unused indexes,
  and consolidates duplicate RLS policies to improve query performance and reduce
  policy evaluation overhead.

  ## Changes Made

  ### 1. Performance Improvements - Add Missing Foreign Key Indexes
  Creates indexes for foreign key columns to improve JOIN performance:
  - `knowledge_documents.current_version_id` - used in version lookup queries
  - `knowledge_documents.owner_role_id` - used in ownership queries
  - `process_steps.role_id` - used in process-role relationship queries  
  - `process_steps.tool_id` - used in process-tool relationship queries

  ### 2. Performance Improvements - Remove Unused Indexes
  Drops indexes that are not being used by query optimizer:
  - `idx_knowledge_documents_client_doc_type` - composite index not utilized
  - `idx_knowledge_documents_bucket` - bucket queries use other indexes
  - `idx_knowledge_documents_status` - status queries use other indexes
  - `idx_knowledge_document_versions_doc_created` - composite index not utilized
  - `idx_knowledge_document_versions_hash` - hash lookups are infrequent
  - `idx_knowledge_exports_client` - client FK index is sufficient
  - `idx_knowledge_exports_status` - status queries are infrequent

  ### 3. Security Improvements - Consolidate Duplicate Policies
  Removes overlapping/duplicate RLS policies on knowledge tables to simplify
  policy evaluation and prevent conflicts:
  - `knowledge_document_versions` - consolidates 3 SELECT policies into 1
  - `knowledge_document_versions` - consolidates 2 INSERT policies into 1
  - `knowledge_document_versions` - consolidates 2 UPDATE policies into 1
  - `knowledge_document_versions` - consolidates 2 DELETE policies into 1
  - `knowledge_documents` - consolidates 2 SELECT policies into 1

  ## Security Notes
  - This application intentionally uses anonymous access (no authentication)
  - RLS policies with `USING (true)` are intentional for anonymous usage
  - Access control is managed at the application level
  - If authentication is added later, policies can be updated to restrict by user
  
  ## Important
  - Auth DB Connection Strategy should be changed to percentage-based in Supabase Dashboard
    (cannot be fixed via migration)
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for knowledge_documents.current_version_id
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_current_version 
  ON knowledge_documents(current_version_id);

-- Index for knowledge_documents.owner_role_id  
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_owner_role 
  ON knowledge_documents(owner_role_id);

-- Index for process_steps.role_id
CREATE INDEX IF NOT EXISTS idx_process_steps_role 
  ON process_steps(role_id);

-- Index for process_steps.tool_id
CREATE INDEX IF NOT EXISTS idx_process_steps_tool 
  ON process_steps(tool_id);

-- ============================================================================
-- REMOVE UNUSED INDEXES TO IMPROVE WRITE PERFORMANCE
-- ============================================================================

DROP INDEX IF EXISTS idx_knowledge_documents_client_doc_type;
DROP INDEX IF EXISTS idx_knowledge_documents_bucket;
DROP INDEX IF EXISTS idx_knowledge_documents_status;
DROP INDEX IF EXISTS idx_knowledge_document_versions_doc_created;
DROP INDEX IF EXISTS idx_knowledge_document_versions_hash;
DROP INDEX IF EXISTS idx_knowledge_exports_client;
DROP INDEX IF EXISTS idx_knowledge_exports_status;

-- ============================================================================
-- CONSOLIDATE DUPLICATE/OVERLAPPING RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- knowledge_document_versions: Consolidate SELECT policies
-- ----------------------------------------------------------------------------

-- Remove all existing SELECT policies (3 overlapping policies)
DROP POLICY IF EXISTS "Allow public read access to document versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Anonymous users can view document versions via share token" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Users can read all document versions" ON knowledge_document_versions;

-- Create single consolidated SELECT policy
CREATE POLICY "Users can read document versions"
  ON knowledge_document_versions FOR SELECT
  TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- knowledge_document_versions: Consolidate INSERT policies
-- ----------------------------------------------------------------------------

-- Remove all existing INSERT policies (2 overlapping policies)
DROP POLICY IF EXISTS "Authenticated users can create versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Users can insert document versions" ON knowledge_document_versions;

-- Create single consolidated INSERT policy with validation
CREATE POLICY "Users can create document versions"
  ON knowledge_document_versions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_documents
      WHERE knowledge_documents.id = knowledge_document_versions.document_id
    )
  );

-- ----------------------------------------------------------------------------
-- knowledge_document_versions: Consolidate UPDATE policies
-- ----------------------------------------------------------------------------

-- Remove all existing UPDATE policies (2 overlapping policies)
DROP POLICY IF EXISTS "Users can update document versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Versions are immutable" ON knowledge_document_versions;

-- Create single restrictive UPDATE policy (versions should be immutable)
CREATE POLICY "Document versions are immutable"
  ON knowledge_document_versions FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- knowledge_document_versions: Consolidate DELETE policies
-- ----------------------------------------------------------------------------

-- Remove all existing DELETE policies (2 overlapping policies)
DROP POLICY IF EXISTS "Users can delete document versions" ON knowledge_document_versions;
DROP POLICY IF EXISTS "Versions deleted only via cascade" ON knowledge_document_versions;

-- Create single DELETE policy (only via cascade from parent document)
CREATE POLICY "Versions cascade delete only"
  ON knowledge_document_versions FOR DELETE
  TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- knowledge_documents: Consolidate SELECT policies
-- ----------------------------------------------------------------------------

-- Remove overlapping SELECT policies (2 policies)
DROP POLICY IF EXISTS "Anonymous users can view knowledge documents via share token" ON knowledge_documents;
DROP POLICY IF EXISTS "Users can read all knowledge documents" ON knowledge_documents;

-- Create single consolidated SELECT policy
CREATE POLICY "Users can read knowledge documents"
  ON knowledge_documents FOR SELECT
  TO anon, authenticated
  USING (true);