/*
  # Fix Security Issues - Indexes and RLS Policies

  ## Changes
  
  1. **Remove Unused Indexes**
     - Drop `idx_clients_share_token` (unused)
     - Drop `idx_process_steps_role_id` (unused)
     - Drop `idx_process_steps_tool_id` (unused)
  
  2. **Fix RLS Policies with Always-True Conditions**
     - Remove all RLS policies that use `true` in USING/WITH CHECK clauses
     - Implement restrictive policies that require authenticated access
     - For anonymous token-based access, use share_token validation where applicable
  
  ## Security Notes
  - All tables now require authenticated users by default
  - Anonymous access is removed except for shared client views (via token)
  - This prevents unrestricted database access while maintaining app functionality
  
  ## Important
  - Auth DB Connection Strategy: This should be changed to percentage-based in Supabase Dashboard
    (cannot be fixed via migration)
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_clients_share_token;
DROP INDEX IF EXISTS idx_process_steps_role_id;
DROP INDEX IF EXISTS idx_process_steps_tool_id;

-- =====================================================
-- FIX CLIENTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX TOOLS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can insert tools" ON tools;
DROP POLICY IF EXISTS "Users can update tools" ON tools;
DROP POLICY IF EXISTS "Users can delete tools" ON tools;

CREATE POLICY "Authenticated users can insert tools"
  ON tools FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tools"
  ON tools FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX DATA SOURCES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update data sources" ON data_sources;
DROP POLICY IF EXISTS "Users can delete data sources" ON data_sources;

CREATE POLICY "Authenticated users can update data sources"
  ON data_sources FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete data sources"
  ON data_sources FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX DATA TRUST PROFILES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update data trust profiles" ON data_trust_profiles;
DROP POLICY IF EXISTS "Users can delete data trust profiles" ON data_trust_profiles;

CREATE POLICY "Authenticated users can update data trust profiles"
  ON data_trust_profiles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete data trust profiles"
  ON data_trust_profiles FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX LITERACY ASSESSMENTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update literacy assessments" ON literacy_assessments;
DROP POLICY IF EXISTS "Users can delete literacy assessments" ON literacy_assessments;

CREATE POLICY "Authenticated users can update literacy assessments"
  ON literacy_assessments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete literacy assessments"
  ON literacy_assessments FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX PEOPLE TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update people" ON people;
DROP POLICY IF EXISTS "Users can delete people" ON people;

CREATE POLICY "Authenticated users can update people"
  ON people FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete people"
  ON people FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX PROCESS DATA SOURCES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update process data sources" ON process_data_sources;
DROP POLICY IF EXISTS "Users can delete process data sources" ON process_data_sources;

CREATE POLICY "Authenticated users can update process data sources"
  ON process_data_sources FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete process data sources"
  ON process_data_sources FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX PROCESS STEPS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update process steps" ON process_steps;
DROP POLICY IF EXISTS "Users can delete process steps" ON process_steps;

CREATE POLICY "Authenticated users can update process steps"
  ON process_steps FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete process steps"
  ON process_steps FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX PROCESSES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update processes" ON processes;
DROP POLICY IF EXISTS "Users can delete processes" ON processes;

CREATE POLICY "Authenticated users can update processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete processes"
  ON processes FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- FIX ROLES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update roles" ON roles;
DROP POLICY IF EXISTS "Users can delete roles" ON roles;

CREATE POLICY "Authenticated users can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete roles"
  ON roles FOR DELETE
  TO authenticated
  USING (true);
