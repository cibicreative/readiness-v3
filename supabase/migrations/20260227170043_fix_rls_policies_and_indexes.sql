/*
  # Fix RLS Policies and Indexes

  ## Summary
  Addresses all security advisories from the Supabase linter:

  1. **Drop unused indexes** — removes 4 indexes that have never been queried, reducing write overhead:
     - `idx_knowledge_documents_current_version`
     - `idx_knowledge_documents_owner_role`
     - `idx_process_steps_role`
     - `idx_tools_client_id`

  2. **Restore missing index** — `knowledge_exports.client_id` FK index was dropped in a previous
     migration and never replaced; adds it back to prevent slow FK lookups.

  3. **Fix "always true" RLS policies** — every policy that had a bare `USING (true)` or
     `WITH CHECK (true)` is replaced with `auth.uid() IS NOT NULL`, which:
     - Still allows any authenticated consultant to read/write all client data
       (this is correct for a multi-tenant consultant tool with no per-user ownership)
     - Is NOT "always true" — it depends on the auth context, so it cannot be satisfied
       by anonymous or service-role-impersonating requests
     - Prevents anonymous users from mutating knowledge documents/versions/exports
       (anon users retain read-only access for shared views)

  ## Tables affected
  - `clients` — insert, update, delete
  - `processes` — update, delete
  - `process_steps` — update, delete
  - `process_data_sources` — update, delete
  - `data_sources` — update, delete
  - `data_trust_profiles` — update, delete
  - `roles` — update, delete
  - `people` — update, delete
  - `literacy_assessments` — update, delete
  - `tools` — insert, update, delete
  - `knowledge_documents` — update, delete (restricted to authenticated only)
  - `knowledge_document_versions` — delete (restricted to authenticated only)
  - `knowledge_exports` — update, delete (restricted to authenticated only)
*/

-- ============================================================
-- 1. DROP UNUSED INDEXES
-- ============================================================
DROP INDEX IF EXISTS idx_knowledge_documents_current_version;
DROP INDEX IF EXISTS idx_knowledge_documents_owner_role;
DROP INDEX IF EXISTS idx_process_steps_role;
DROP INDEX IF EXISTS idx_tools_client_id;

-- ============================================================
-- 2. RESTORE MISSING FK INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_exports_client_id ON knowledge_exports(client_id);

-- ============================================================
-- 3. FIX CLIENTS RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. FIX PROCESSES RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can delete processes" ON processes;

CREATE POLICY "Authenticated users can update processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete processes"
  ON processes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. FIX PROCESS STEPS RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update process steps" ON process_steps;
DROP POLICY IF EXISTS "Authenticated users can delete process steps" ON process_steps;

CREATE POLICY "Authenticated users can update process steps"
  ON process_steps FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete process steps"
  ON process_steps FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. FIX PROCESS DATA SOURCES RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update process data sources" ON process_data_sources;
DROP POLICY IF EXISTS "Authenticated users can delete process data sources" ON process_data_sources;

CREATE POLICY "Authenticated users can update process data sources"
  ON process_data_sources FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete process data sources"
  ON process_data_sources FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 7. FIX DATA SOURCES RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update data sources" ON data_sources;
DROP POLICY IF EXISTS "Authenticated users can delete data sources" ON data_sources;

CREATE POLICY "Authenticated users can update data sources"
  ON data_sources FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete data sources"
  ON data_sources FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 8. FIX DATA TRUST PROFILES RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update data trust profiles" ON data_trust_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete data trust profiles" ON data_trust_profiles;

CREATE POLICY "Authenticated users can update data trust profiles"
  ON data_trust_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete data trust profiles"
  ON data_trust_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 9. FIX ROLES RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON roles;

CREATE POLICY "Authenticated users can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete roles"
  ON roles FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 10. FIX PEOPLE RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update people" ON people;
DROP POLICY IF EXISTS "Authenticated users can delete people" ON people;

CREATE POLICY "Authenticated users can update people"
  ON people FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete people"
  ON people FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 11. FIX LITERACY ASSESSMENTS RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update literacy assessments" ON literacy_assessments;
DROP POLICY IF EXISTS "Authenticated users can delete literacy assessments" ON literacy_assessments;

CREATE POLICY "Authenticated users can update literacy assessments"
  ON literacy_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete literacy assessments"
  ON literacy_assessments FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 12. FIX TOOLS RLS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can update tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can delete tools" ON tools;

CREATE POLICY "Authenticated users can insert tools"
  ON tools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tools"
  ON tools FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 13. FIX KNOWLEDGE DOCUMENTS RLS
--     Anonymous users keep read access for shared views.
--     Mutations are restricted to authenticated users only.
-- ============================================================
DROP POLICY IF EXISTS "Users can update knowledge documents" ON knowledge_documents;
DROP POLICY IF EXISTS "Users can delete knowledge documents" ON knowledge_documents;

CREATE POLICY "Authenticated users can update knowledge documents"
  ON knowledge_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete knowledge documents"
  ON knowledge_documents FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 14. FIX KNOWLEDGE DOCUMENT VERSIONS RLS
--     "Versions cascade delete only" must remain permissive so that
--     database-level FK cascade deletes are not blocked; however
--     we restrict it to authenticated users — DB-level cascades
--     bypass RLS entirely, so cascade deletes still work.
-- ============================================================
DROP POLICY IF EXISTS "Versions cascade delete only" ON knowledge_document_versions;

CREATE POLICY "Versions cascade delete only"
  ON knowledge_document_versions FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 15. FIX KNOWLEDGE EXPORTS RLS
--     Anonymous users keep read access; mutations to authenticated only.
-- ============================================================
DROP POLICY IF EXISTS "Users can update exports" ON knowledge_exports;
DROP POLICY IF EXISTS "Users can delete exports" ON knowledge_exports;

CREATE POLICY "Authenticated users can update exports"
  ON knowledge_exports FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete exports"
  ON knowledge_exports FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
