/*
  # Process & Data Readiness Schema

  ## Overview
  Complete database schema for AI consultant's internal app to assess client readiness
  for AI agents and automation. Supports multi-client management with token-based sharing.

  ## 1. New Tables

  ### Clients
  - `id` (uuid, primary key)
  - `name` (text, required) - Client company name
  - `industry` (text) - Industry vertical
  - `company_size` (text) - Employee range
  - `primary_contact_name` (text)
  - `primary_contact_email` (text)
  - `risk_tolerance` (text) - low/medium/high
  - `notes` (text) - Internal consultant notes
  - `share_token` (text, unique) - URL token for client access
  - `share_enabled` (boolean) - Whether sharing is active
  - `share_expires_at` (timestamptz) - Optional expiration
  - `created_at`, `updated_at` (timestamptz)

  ### Processes
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → Clients)
  - `name` (text, required)
  - `category` (text) - sales/marketing/operations/etc
  - `description` (text)
  - `owner_role` (text)
  - `frequency` (text) - daily/weekly/monthly/etc
  - `trigger` (text)
  - `desired_outcome` (text)
  - `is_customer_facing` (boolean)
  - `is_compliance_sensitive` (boolean)
  - `documentation_completeness_score` (integer 0-100)
  - `automation_potential_score` (integer 0-100)
  - `data_risk_score` (integer 0-100)
  - `literacy_fit_score` (integer 0-100)
  - `client_approved_description` (boolean) - Client review flag
  - `created_at`, `updated_at` (timestamptz)

  ### ProcessSteps
  - `id` (uuid, primary key)
  - `process_id` (uuid, FK → Processes)
  - `step_order` (integer)
  - `title` (text)
  - `description` (text)
  - `tool_id` (uuid, FK → Tools, nullable)
  - `role_id` (uuid, FK → Roles, nullable)
  - `average_time_minutes` (integer)
  - `is_rule_based` (text) - mostly_rules/mixed/mostly_judgment
  - `risk_notes` (text)

  ### Tools
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `type` (text) - CRM/Spreadsheet/Email/etc
  - `vendor` (text)
  - `plan_name` (text)
  - `billing_cycle` (text) - monthly/yearly
  - `subscription_cost` (decimal)
  - `num_seats` (integer)
  - `contract_notes` (text)

  ### Roles
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → Clients)
  - `title` (text, required)
  - `description` (text)
  - `hourly_rate` (decimal)
  - `employment_type` (text) - employee/contractor
  - `department` (text)

  ### People
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → Clients)
  - `name` (text, required)
  - `email` (text)
  - `role_id` (uuid, FK → Roles, nullable)
  - `hourly_rate_override` (decimal, nullable)

  ### LiteracyAssessments
  - `id` (uuid, primary key)
  - `person_id` (uuid, FK → People)
  - `assessment_date` (timestamptz)
  - `overall_level` (text) - novice/basic/applied/optimizer
  - `score_numeric` (integer 0-100)
  - `self_confidence_level` (text) - low/medium/high
  - `notes` (text)

  ### DataSources
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK → Clients)
  - `name` (text, required)
  - `system_name` (text)
  - `data_type` (text) - structured/documents/email/audio/other
  - `owner_role` (text)
  - `update_frequency` (text) - real-time/daily/weekly/etc
  - `is_source_of_truth` (boolean)
  - `description` (text)

  ### DataTrustProfiles
  - `id` (uuid, primary key)
  - `data_source_id` (uuid, FK → DataSources)
  - `completeness` (text) - low/medium/high
  - `accuracy` (text) - low/medium/high
  - `timeliness` (text) - low/medium/high
  - `governance` (text) - low/medium/high
  - `overall_risk_score` (integer 0-100)
  - `notes` (text)

  ### ProcessDataSources (join table)
  - `id` (uuid, primary key)
  - `process_id` (uuid, FK → Processes)
  - `data_source_id` (uuid, FK → DataSources)

  ## 2. Security
  - Enable RLS on all tables
  - Public read access for client-share views via share_token validation
  - All write operations restricted (consultant-only in production)

  ## 3. Indexes
  - Index on share_token for fast lookups
  - Indexes on foreign keys for join performance
*/

-- Create Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  company_size text,
  primary_contact_name text,
  primary_contact_email text,
  risk_tolerance text CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  notes text,
  share_token text UNIQUE,
  share_enabled boolean DEFAULT false,
  share_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Processes table
CREATE TABLE IF NOT EXISTS processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text CHECK (category IN ('sales', 'marketing', 'operations', 'customer support', 'finance', 'other')),
  description text,
  owner_role text,
  frequency text CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'ad hoc')),
  trigger text,
  desired_outcome text,
  is_customer_facing boolean DEFAULT false,
  is_compliance_sensitive boolean DEFAULT false,
  documentation_completeness_score integer DEFAULT 0 CHECK (documentation_completeness_score >= 0 AND documentation_completeness_score <= 100),
  automation_potential_score integer DEFAULT 0 CHECK (automation_potential_score >= 0 AND automation_potential_score <= 100),
  data_risk_score integer DEFAULT 0 CHECK (data_risk_score >= 0 AND data_risk_score <= 100),
  literacy_fit_score integer DEFAULT 0 CHECK (literacy_fit_score >= 0 AND literacy_fit_score <= 100),
  client_approved_description boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  vendor text,
  plan_name text,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  subscription_cost decimal(10,2),
  num_seats integer,
  contract_notes text
);

-- Create Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  hourly_rate decimal(10,2),
  employment_type text CHECK (employment_type IN ('employee', 'contractor')),
  department text
);

-- Create ProcessSteps table
CREATE TABLE IF NOT EXISTS process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  title text,
  description text,
  tool_id uuid REFERENCES tools(id) ON DELETE SET NULL,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  average_time_minutes integer,
  is_rule_based text CHECK (is_rule_based IN ('mostly_rules', 'mixed', 'mostly_judgment')),
  risk_notes text
);

-- Create People table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  hourly_rate_override decimal(10,2)
);

-- Create LiteracyAssessments table
CREATE TABLE IF NOT EXISTS literacy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  assessment_date timestamptz DEFAULT now(),
  overall_level text CHECK (overall_level IN ('novice', 'basic', 'applied', 'optimizer')),
  score_numeric integer CHECK (score_numeric >= 0 AND score_numeric <= 100),
  self_confidence_level text CHECK (self_confidence_level IN ('low', 'medium', 'high')),
  notes text
);

-- Create DataSources table
CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  system_name text,
  data_type text CHECK (data_type IN ('structured', 'documents', 'email/messages', 'audio/video', 'other')),
  owner_role text,
  update_frequency text CHECK (update_frequency IN ('real-time', 'daily', 'weekly', 'monthly', 'ad hoc')),
  is_source_of_truth boolean DEFAULT false,
  description text
);

-- Create DataTrustProfiles table
CREATE TABLE IF NOT EXISTS data_trust_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  completeness text CHECK (completeness IN ('low', 'medium', 'high')),
  accuracy text CHECK (accuracy IN ('low', 'medium', 'high')),
  timeliness text CHECK (timeliness IN ('low', 'medium', 'high')),
  governance text CHECK (governance IN ('low', 'medium', 'high')),
  overall_risk_score integer DEFAULT 0 CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  notes text
);

-- Create ProcessDataSources join table
CREATE TABLE IF NOT EXISTS process_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  UNIQUE(process_id, data_source_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_share_token ON clients(share_token);
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_process_steps_process_id ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_roles_client_id ON roles(client_id);
CREATE INDEX IF NOT EXISTS idx_people_client_id ON people(client_id);
CREATE INDEX IF NOT EXISTS idx_people_role_id ON people(role_id);
CREATE INDEX IF NOT EXISTS idx_literacy_assessments_person_id ON literacy_assessments(person_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_client_id ON data_sources(client_id);
CREATE INDEX IF NOT EXISTS idx_data_trust_profiles_data_source_id ON data_trust_profiles(data_source_id);
CREATE INDEX IF NOT EXISTS idx_process_data_sources_process_id ON process_data_sources(process_id);
CREATE INDEX IF NOT EXISTS idx_process_data_sources_data_source_id ON process_data_sources(data_source_id);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE literacy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_data_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for now (internal app, no auth system yet)
-- In production, you would restrict write access to authenticated consultant only

CREATE POLICY "Allow all on clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on processes"
  ON processes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on process_steps"
  ON process_steps FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on tools"
  ON tools FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on roles"
  ON roles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on people"
  ON people FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on literacy_assessments"
  ON literacy_assessments FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on data_sources"
  ON data_sources FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on data_trust_profiles"
  ON data_trust_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on process_data_sources"
  ON process_data_sources FOR ALL
  USING (true)
  WITH CHECK (true);
