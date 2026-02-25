/*
  # Add Client Edit Permission Field

  1. Changes
    - Add `client_can_edit` column to `clients` table
      - Boolean field to control whether clients have read-write access via share link
      - Defaults to false (read-only)
    
  2. Purpose
    - Allows consultants to grant specific clients the ability to edit their own data
    - Most clients will have read-only access by default
    - Provides flexibility for collaborative engagements
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'client_can_edit'
  ) THEN
    ALTER TABLE clients ADD COLUMN client_can_edit boolean DEFAULT false NOT NULL;
  END IF;
END $$;