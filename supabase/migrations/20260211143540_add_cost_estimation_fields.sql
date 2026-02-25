/*
  # Add Cost Estimation Fields

  ## Summary
  Adds fields to support cost estimation for processes based on hourly labor rates
  and tool costs. This enables automatic calculation of estimated process costs.

  ## Changes Made

  ### 1. Roles Table
  - Add `hourly_rate` (decimal): The cost per hour for this role (in dollars)

  ### 2. Tools Table
  - Add `monthly_cost` (decimal): Monthly subscription or usage cost for the tool (in dollars)

  ### 3. Process Steps Table
  - Add `estimated_duration_minutes` (integer): Estimated time to complete this step
  - Add `role_id` (uuid): Foreign key to roles table indicating which role performs this step

  ## Cost Calculation Formula
  - Step Labor Cost = (estimated_duration_minutes / 60) × role.hourly_rate
  - Step Tool Cost = Allocated portion of tool monthly costs
  - Total Process Cost = Sum of all step costs
*/

-- Add hourly_rate to roles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE roles ADD COLUMN hourly_rate DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add monthly_cost to tools table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tools' AND column_name = 'monthly_cost'
  ) THEN
    ALTER TABLE tools ADD COLUMN monthly_cost DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add estimated_duration_minutes to process_steps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_steps' AND column_name = 'estimated_duration_minutes'
  ) THEN
    ALTER TABLE process_steps ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add role_id to process_steps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'process_steps' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE process_steps ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for role_id lookups
CREATE INDEX IF NOT EXISTS idx_process_steps_role_id ON process_steps(role_id);