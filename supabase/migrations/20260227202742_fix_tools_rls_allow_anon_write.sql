/*
  # Fix Tools RLS to Allow Anonymous Write Access

  ## Summary
  The tools table had its INSERT/UPDATE/DELETE policies overwritten by a later migration
  that restricted them to `TO authenticated` only. Since this application operates without
  an authentication system (using the anon key directly), anonymous users cannot save
  changes to tools, causing the "Update Tool" button to silently fail.

  ## Changes
  - Drops the authenticated-only INSERT, UPDATE, DELETE policies on `tools`
  - Recreates them as `TO anon, authenticated` with client existence check for INSERT/UPDATE
  - Consistent with the pattern used for all other tables (processes, roles, people, etc.)

  ## Tables affected
  - `tools` — insert, update, delete policies restored to allow anon access
*/

DROP POLICY IF EXISTS "Authenticated users can insert tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can update tools" ON tools;
DROP POLICY IF EXISTS "Authenticated users can delete tools" ON tools;

CREATE POLICY "Users can insert tools"
  ON tools FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    client_id IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = tools.client_id
    )
  );

CREATE POLICY "Users can update tools"
  ON tools FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    client_id IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = tools.client_id
    )
  );

CREATE POLICY "Users can delete tools"
  ON tools FOR DELETE
  TO anon, authenticated
  USING (true);
