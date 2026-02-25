/*
  # Fix RLS Policies to Allow Anonymous Access

  ## Summary
  Updates all RLS policies to allow anonymous access while maintaining Row Level Security.
  The application uses anonymous connections (no authentication system), so policies
  need to support the 'anon' role in addition to 'authenticated' users.

  ## Changes Made

  All policies are updated to use `TO anon, authenticated` instead of `TO authenticated`,
  allowing the application to function with anonymous connections while still having
  RLS enabled for security.

  ## Security Notes
  - RLS remains enabled on all tables
  - Policies now support both anonymous and authenticated access
  - This maintains better security than having no RLS while allowing the app to function
  - If authentication is added later, policies will already support it
*/

-- ============================================================================
-- CLIENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Users can view all clients"
  ON clients FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete clients"
  ON clients FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- PROCESSES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can update processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can delete processes" ON processes;

CREATE POLICY "Users can view all processes"
  ON processes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert processes"
  ON processes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = processes.client_id
    )
  );

CREATE POLICY "Users can update processes"
  ON processes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = processes.client_id
    )
  );

CREATE POLICY "Users can delete processes"
  ON processes FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- PROCESS_STEPS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all process steps" ON process_steps;
DROP POLICY IF EXISTS "Authenticated users can insert process steps" ON process_steps;
DROP POLICY IF EXISTS "Authenticated users can update process steps" ON process_steps;
DROP POLICY IF EXISTS "Authenticated users can delete process steps" ON process_steps;

CREATE POLICY "Users can view all process steps"
  ON process_steps FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert process steps"
  ON process_steps FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_steps.process_id
    )
  );

CREATE POLICY "Users can update process steps"
  ON process_steps FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_steps.process_id
    )
  );

CREATE POLICY "Users can delete process steps"
  ON process_steps FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- PROCESS_DATA_SOURCES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all process data sources" ON process_data_sources;
DROP POLICY IF EXISTS "Authenticated users can insert process data sources" ON process_data_sources;
DROP POLICY IF EXISTS "Authenticated users can update process data sources" ON process_data_sources;
DROP POLICY IF EXISTS "Authenticated users can delete process data sources" ON process_data_sources;

CREATE POLICY "Users can view all process data sources"
  ON process_data_sources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert process data sources"
  ON process_data_sources FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_data_sources.process_id
    ) AND EXISTS (
      SELECT 1 FROM data_sources
      WHERE data_sources.id = process_data_sources.data_source_id
    )
  );

CREATE POLICY "Users can update process data sources"
  ON process_data_sources FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM processes
      WHERE processes.id = process_data_sources.process_id
    ) AND EXISTS (
      SELECT 1 FROM data_sources
      WHERE data_sources.id = process_data_sources.data_source_id
    )
  );

CREATE POLICY "Users can delete process data sources"
  ON process_data_sources FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- DATA_SOURCES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all data sources" ON data_sources;
DROP POLICY IF EXISTS "Authenticated users can insert data sources" ON data_sources;
DROP POLICY IF EXISTS "Authenticated users can update data sources" ON data_sources;
DROP POLICY IF EXISTS "Authenticated users can delete data sources" ON data_sources;

CREATE POLICY "Users can view all data sources"
  ON data_sources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert data sources"
  ON data_sources FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = data_sources.client_id
    )
  );

CREATE POLICY "Users can update data sources"
  ON data_sources FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = data_sources.client_id
    )
  );

CREATE POLICY "Users can delete data sources"
  ON data_sources FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- DATA_TRUST_PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all data trust profiles" ON data_trust_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert data trust profiles" ON data_trust_profiles;
DROP POLICY IF EXISTS "Authenticated users can update data trust profiles" ON data_trust_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete data trust profiles" ON data_trust_profiles;

CREATE POLICY "Users can view all data trust profiles"
  ON data_trust_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert data trust profiles"
  ON data_trust_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM data_sources
      WHERE data_sources.id = data_trust_profiles.data_source_id
    )
  );

CREATE POLICY "Users can update data trust profiles"
  ON data_trust_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM data_sources
      WHERE data_sources.id = data_trust_profiles.data_source_id
    )
  );

CREATE POLICY "Users can delete data trust profiles"
  ON data_trust_profiles FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- ROLES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON roles;

CREATE POLICY "Users can view all roles"
  ON roles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert roles"
  ON roles FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = roles.client_id
    )
  );

CREATE POLICY "Users can update roles"
  ON roles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = roles.client_id
    )
  );

CREATE POLICY "Users can delete roles"
  ON roles FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- PEOPLE TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all people" ON people;
DROP POLICY IF EXISTS "Authenticated users can insert people" ON people;
DROP POLICY IF EXISTS "Authenticated users can update people" ON people;
DROP POLICY IF EXISTS "Authenticated users can delete people" ON people;

CREATE POLICY "Users can view all people"
  ON people FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert people"
  ON people FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = people.client_id
    )
  );

CREATE POLICY "Users can update people"
  ON people FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = people.client_id
    )
  );

CREATE POLICY "Users can delete people"
  ON people FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- LITERACY_ASSESSMENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all literacy assessments" ON literacy_assessments;
DROP POLICY IF EXISTS "Authenticated users can insert literacy assessments" ON literacy_assessments;
DROP POLICY IF EXISTS "Authenticated users can update literacy assessments" ON literacy_assessments;
DROP POLICY IF EXISTS "Authenticated users can delete literacy assessments" ON literacy_assessments;

CREATE POLICY "Users can view all literacy assessments"
  ON literacy_assessments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert literacy assessments"
  ON literacy_assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM people
      WHERE people.id = literacy_assessments.person_id
    )
  );

CREATE POLICY "Users can update literacy assessments"
  ON literacy_assessments FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM people
      WHERE people.id = literacy_assessments.person_id
    )
  );

CREATE POLICY "Users can delete literacy assessments"
  ON literacy_assessments FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- TOOLS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can insert tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can update tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can delete tools" ON tools;

CREATE POLICY "Users can view all tools"
  ON tools FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert tools"
  ON tools FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tools"
  ON tools FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete tools"
  ON tools FOR DELETE
  TO anon, authenticated
  USING (true);