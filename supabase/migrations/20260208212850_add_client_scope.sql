/*
  # Add Scope Column to Clients Table
  
  1. Changes
    - Add `scope` column to `clients` table with default value 'full'
    - Scope controls what routes a client token can access:
      - 'full': Can access all client routes (shared view, literacy check, etc.)
      - 'literacy_only': Can ONLY access literacy check module
    
  2. Security
    - No RLS changes needed (uses existing client policies)
    - Scope validation happens in application layer via TokenGuard
*/

-- Add scope column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'scope'
  ) THEN
    ALTER TABLE clients ADD COLUMN scope text DEFAULT 'full';
  END IF;
END $$;
