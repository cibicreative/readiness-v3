import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from '../src/lib/database.types';

function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function createDemoData() {
  console.log('🚀 Creating demo data...\n');

  const { data: client1, error: error1 } = await supabase
    .from('clients')
    .insert({
      name: 'Catalyst Creative Agency',
      industry: 'Professional Services',
      company_size: '5',
      risk_tolerance: 'medium',
      notes: 'Goals: Streamline client delivery, improve project profitability, scale operations. Data maturity: developing.'
    })
    .select()
    .single();

  if (!client1 || error1) {
    console.error('Error creating Client 1:', error1);
    return;
  }

  console.log('✅ Created Client 1: Catalyst Creative Agency');

  const { data: client2, error: error2 } = await supabase
    .from('clients')
    .insert({
      name: 'PrecisionTech Manufacturing',
      industry: 'Manufacturing',
      company_size: '24',
      risk_tolerance: 'low',
      notes: 'Goals: Reduce production errors, optimize inventory, improve quality control. Data maturity: basic.'
    })
    .select()
    .single();

  if (!client2 || error2) {
    console.error('Error creating Client 2:', error2);
    return;
  }

  console.log('✅ Created Client 2: PrecisionTech Manufacturing\n');

  const processesClient1 = [
    {
      client_id: client1.id,
      name: 'Client Onboarding',
      description: 'Complete process from initial contract signing through project kickoff, including documentation gathering, team assignment, and kickoff meeting',
      category: 'sales',
      frequency: 'weekly',
      owner_role: 'Account Manager',
      is_customer_facing: true,
      is_compliance_sensitive: false,
      documentation_completeness_score: 75,
      automation_potential_score: 65,
      data_risk_score: 25,
      literacy_fit_score: 70
    },
    {
      client_id: client1.id,
      name: 'Project Delivery & Tracking',
      description: 'End-to-end project execution including task assignment, progress tracking, client communication, and deliverable review',
      category: 'operations',
      frequency: 'daily',
      owner_role: 'Project Manager',
      is_customer_facing: true,
      is_compliance_sensitive: false,
      documentation_completeness_score: 60,
      automation_potential_score: 55,
      data_risk_score: 35,
      literacy_fit_score: 65
    },
    {
      client_id: client1.id,
      name: 'Invoicing & Collections',
      description: 'Monthly invoicing process including time tracking consolidation, expense reconciliation, invoice generation, and payment follow-up',
      category: 'finance',
      frequency: 'monthly',
      owner_role: 'Finance Manager',
      is_customer_facing: true,
      is_compliance_sensitive: true,
      documentation_completeness_score: 85,
      automation_potential_score: 80,
      data_risk_score: 40,
      literacy_fit_score: 75
    },
    {
      client_id: client1.id,
      name: 'Content Creation Workflow',
      description: 'Marketing content development from brief to publication including ideation, drafting, review cycles, approval, and publishing',
      category: 'marketing',
      frequency: 'daily',
      owner_role: 'Creative Director',
      is_customer_facing: false,
      is_compliance_sensitive: false,
      documentation_completeness_score: 45,
      automation_potential_score: 40,
      data_risk_score: 20,
      literacy_fit_score: 80
    },
    {
      client_id: client1.id,
      name: 'Sales Prospecting',
      description: 'Lead generation and outreach process including research, contact list building, email sequencing, and meeting scheduling',
      category: 'sales',
      frequency: 'weekly',
      owner_role: 'Business Development',
      is_customer_facing: true,
      is_compliance_sensitive: false,
      documentation_completeness_score: 50,
      automation_potential_score: 70,
      data_risk_score: 30,
      literacy_fit_score: 60
    }
  ];

  const insertedProcessesC1 = await supabase.from('processes').insert(processesClient1).select();
  if (!insertedProcessesC1.data) {
    console.error('Error creating processes for Client 1:', insertedProcessesC1.error);
    return;
  }
  console.log(`✅ Created ${processesClient1.length} processes for Catalyst Creative\n`);

  const processesClient2 = [
    {
      client_id: client2.id,
      name: 'Order Processing',
      description: 'Customer order intake through production scheduling including order validation, inventory check, production queue assignment, and customer confirmation',
      category: 'sales',
      frequency: 'daily',
      owner_role: 'Order Manager',
      is_customer_facing: true,
      is_compliance_sensitive: false,
      documentation_completeness_score: 70,
      automation_potential_score: 75,
      data_risk_score: 35,
      literacy_fit_score: 55
    },
    {
      client_id: client2.id,
      name: 'Inventory Management',
      description: 'Raw materials and finished goods tracking including receiving, storage location assignment, cycle counting, and reorder point monitoring',
      category: 'operations',
      frequency: 'daily',
      owner_role: 'Warehouse Supervisor',
      is_customer_facing: false,
      is_compliance_sensitive: false,
      documentation_completeness_score: 55,
      automation_potential_score: 85,
      data_risk_score: 50,
      literacy_fit_score: 45
    },
    {
      client_id: client2.id,
      name: 'Quality Control Inspection',
      description: 'Multi-stage quality checks including incoming material inspection, in-process checks, final product testing, and defect documentation',
      category: 'operations',
      frequency: 'daily',
      owner_role: 'QC Manager',
      is_customer_facing: false,
      is_compliance_sensitive: true,
      documentation_completeness_score: 80,
      automation_potential_score: 60,
      data_risk_score: 55,
      literacy_fit_score: 50
    },
    {
      client_id: client2.id,
      name: 'Production Scheduling',
      description: 'Weekly production planning including capacity analysis, job sequencing, resource allocation, and schedule communication',
      category: 'operations',
      frequency: 'weekly',
      owner_role: 'Production Manager',
      is_customer_facing: false,
      is_compliance_sensitive: false,
      documentation_completeness_score: 65,
      automation_potential_score: 70,
      data_risk_score: 45,
      literacy_fit_score: 50
    },
    {
      client_id: client2.id,
      name: 'Shipping & Logistics',
      description: 'Finished goods dispatch including pick/pack operations, carrier selection, label generation, tracking number assignment, and customer notification',
      category: 'customer support',
      frequency: 'daily',
      owner_role: 'Logistics Coordinator',
      is_customer_facing: true,
      is_compliance_sensitive: false,
      documentation_completeness_score: 75,
      automation_potential_score: 80,
      data_risk_score: 30,
      literacy_fit_score: 60
    }
  ];

  const insertedProcessesC2 = await supabase.from('processes').insert(processesClient2).select();
  if (!insertedProcessesC2.data) {
    console.error('Error creating processes for Client 2:', insertedProcessesC2.error);
    return;
  }
  console.log(`✅ Created ${processesClient2.length} processes for PrecisionTech\n`);

  const client1Process1Steps = [
    {
      process_id: insertedProcessesC1.data![0].id,
      step_order: 1,
      step_name: 'Contract Review & Setup',
      description: 'Review signed contract, create client folder structure, set up project in PM tool',
      estimated_duration_minutes: 30,
      average_time_minutes: 35,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC1.data![0].id,
      step_order: 2,
      step_name: 'Team Assignment',
      description: 'Review project requirements and assign team members based on availability and expertise',
      estimated_duration_minutes: 20,
      average_time_minutes: 25,
      is_rule_based: 'mixed'
    },
    {
      process_id: insertedProcessesC1.data![0].id,
      step_order: 3,
      step_name: 'Client Documentation Request',
      description: 'Send standardized request for brand assets, access credentials, and project materials',
      estimated_duration_minutes: 15,
      average_time_minutes: 15,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC1.data![0].id,
      step_order: 4,
      step_name: 'Kickoff Meeting Scheduling',
      description: 'Coordinate calendars and schedule kickoff meeting with all stakeholders',
      estimated_duration_minutes: 10,
      average_time_minutes: 15,
      is_rule_based: 'mostly_rules'
    }
  ];

  const client1Process3Steps = [
    {
      process_id: insertedProcessesC1.data![2].id,
      step_order: 1,
      step_name: 'Time Entry Consolidation',
      description: 'Export and compile time entries from project management system',
      estimated_duration_minutes: 20,
      average_time_minutes: 20,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC1.data![2].id,
      step_order: 2,
      step_name: 'Expense Reconciliation',
      description: 'Review and categorize project expenses from receipts and purchase orders',
      estimated_duration_minutes: 30,
      average_time_minutes: 40,
      is_rule_based: 'mixed'
    },
    {
      process_id: insertedProcessesC1.data![2].id,
      step_order: 3,
      step_name: 'Invoice Generation',
      description: 'Create invoice in accounting system with line items and send to client',
      estimated_duration_minutes: 15,
      average_time_minutes: 15,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC1.data![2].id,
      step_order: 4,
      step_name: 'Payment Follow-up',
      description: 'Track payment status and send reminders for overdue invoices',
      estimated_duration_minutes: 10,
      average_time_minutes: 20,
      is_rule_based: 'mostly_judgment'
    }
  ];

  const client2Process1Steps = [
    {
      process_id: insertedProcessesC2.data![0].id,
      step_order: 1,
      step_name: 'Order Entry',
      description: 'Enter customer order details into ERP system from email or phone',
      estimated_duration_minutes: 10,
      average_time_minutes: 12,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC2.data![0].id,
      step_order: 2,
      step_name: 'Inventory Verification',
      description: 'Check raw material availability against order requirements',
      estimated_duration_minutes: 5,
      average_time_minutes: 8,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC2.data![0].id,
      step_order: 3,
      step_name: 'Production Scheduling',
      description: 'Assign order to production queue based on priority and capacity',
      estimated_duration_minutes: 10,
      average_time_minutes: 15,
      is_rule_based: 'mixed'
    },
    {
      process_id: insertedProcessesC2.data![0].id,
      step_order: 4,
      step_name: 'Customer Confirmation',
      description: 'Send order confirmation with estimated delivery date to customer',
      estimated_duration_minutes: 5,
      average_time_minutes: 5,
      is_rule_based: 'mostly_rules'
    }
  ];

  const client2Process2Steps = [
    {
      process_id: insertedProcessesC2.data![1].id,
      step_order: 1,
      step_name: 'Material Receiving',
      description: 'Inspect incoming shipments, verify packing slip, update inventory counts',
      estimated_duration_minutes: 20,
      average_time_minutes: 25,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC2.data![1].id,
      step_order: 2,
      step_name: 'Location Assignment',
      description: 'Determine optimal storage location and update location in system',
      estimated_duration_minutes: 10,
      average_time_minutes: 15,
      is_rule_based: 'mixed'
    },
    {
      process_id: insertedProcessesC2.data![1].id,
      step_order: 3,
      step_name: 'Cycle Counting',
      description: 'Perform daily cycle counts on assigned SKUs and reconcile discrepancies',
      estimated_duration_minutes: 30,
      average_time_minutes: 40,
      is_rule_based: 'mostly_rules'
    },
    {
      process_id: insertedProcessesC2.data![1].id,
      step_order: 4,
      step_name: 'Reorder Point Monitoring',
      description: 'Review inventory levels against reorder points and create purchase requisitions',
      estimated_duration_minutes: 15,
      average_time_minutes: 20,
      is_rule_based: 'mostly_rules'
    }
  ];

  await supabase.from('process_steps').insert([
    ...client1Process1Steps,
    ...client1Process3Steps,
    ...client2Process1Steps,
    ...client2Process2Steps
  ]);

  console.log('✅ Created process steps for key processes\n');

  const rolesClient1 = [
    { client_id: client1.id, title: 'Account Manager', description: 'Client relationship and project oversight' },
    { client_id: client1.id, title: 'Project Manager', description: 'Day-to-day project execution and delivery' },
    { client_id: client1.id, title: 'Creative Director', description: 'Creative strategy and content quality' },
    { client_id: client1.id, title: 'Finance Manager', description: 'Billing, invoicing, and financial operations' },
    { client_id: client1.id, title: 'Business Development', description: 'Lead generation and sales' }
  ];

  const rolesClient2 = [
    { client_id: client2.id, title: 'Order Manager', description: 'Order processing and customer coordination' },
    { client_id: client2.id, title: 'Warehouse Supervisor', description: 'Inventory and warehouse operations' },
    { client_id: client2.id, title: 'QC Manager', description: 'Quality control and compliance' },
    { client_id: client2.id, title: 'Production Manager', description: 'Production planning and execution' },
    { client_id: client2.id, title: 'Logistics Coordinator', description: 'Shipping and carrier management' }
  ];

  const insertedRolesC1 = await supabase.from('roles').insert(rolesClient1).select();
  const insertedRolesC2 = await supabase.from('roles').insert(rolesClient2).select();

  if (!insertedRolesC1.data || !insertedRolesC2.data) {
    console.error('Error creating roles:', insertedRolesC1.error, insertedRolesC2.error);
    return;
  }

  console.log('✅ Created roles for both clients\n');

  const peopleClient1 = [
    {
      client_id: client1.id,
      name: 'Sarah Chen',
      email: 'sarah@catalystcreative.example',
      role_id: insertedRolesC1.data![0].id
    },
    {
      client_id: client1.id,
      name: 'Marcus Williams',
      email: 'marcus@catalystcreative.example',
      role_id: insertedRolesC1.data![1].id
    },
    {
      client_id: client1.id,
      name: 'Elena Rodriguez',
      email: 'elena@catalystcreative.example',
      role_id: insertedRolesC1.data![2].id
    },
    {
      client_id: client1.id,
      name: 'David Park',
      email: 'david@catalystcreative.example',
      role_id: insertedRolesC1.data![3].id
    },
    {
      client_id: client1.id,
      name: 'Jennifer Martinez',
      email: 'jen@catalystcreative.example',
      role_id: insertedRolesC1.data![4].id
    }
  ];

  const peopleClient2 = [
    {
      client_id: client2.id,
      name: 'Robert Thompson',
      email: 'rthompson@precisiontech.example',
      role_id: insertedRolesC2.data![0].id
    },
    {
      client_id: client2.id,
      name: 'Lisa Chang',
      email: 'lchang@precisiontech.example',
      role_id: insertedRolesC2.data![1].id
    },
    {
      client_id: client2.id,
      name: 'James Miller',
      email: 'jmiller@precisiontech.example',
      role_id: insertedRolesC2.data![2].id
    },
    {
      client_id: client2.id,
      name: 'Patricia Anderson',
      email: 'panderson@precisiontech.example',
      role_id: insertedRolesC2.data![3].id
    },
    {
      client_id: client2.id,
      name: 'Michael Brown',
      email: 'mbrown@precisiontech.example',
      role_id: insertedRolesC2.data![4].id
    }
  ];

  const insertedPeopleC1 = await supabase.from('people').insert(peopleClient1).select();
  const insertedPeopleC2 = await supabase.from('people').insert(peopleClient2).select();

  if (!insertedPeopleC1.data || !insertedPeopleC2.data) {
    console.error('Error creating people:', insertedPeopleC1.error, insertedPeopleC2.error);
    return;
  }

  console.log('✅ Created people for both clients\n');

  const literacyC1 = [
    {
      person_id: insertedPeopleC1.data![0].id,
      overall_level: 'applied' as const,
      notes: 'Strong technology adopter, comfortable with AI tools for client communication'
    },
    {
      person_id: insertedPeopleC1.data![1].id,
      overall_level: 'applied' as const,
      notes: 'Very comfortable with project management tools and automation'
    },
    {
      person_id: insertedPeopleC1.data![2].id,
      overall_level: 'optimizer' as const,
      notes: 'Early AI adopter, actively uses AI for creative ideation and efficiency'
    },
    {
      person_id: insertedPeopleC1.data![3].id,
      overall_level: 'applied' as const,
      notes: 'Comfortable with financial systems and process automation'
    },
    {
      person_id: insertedPeopleC1.data![4].id,
      overall_level: 'basic' as const,
      notes: 'Uses basic CRM tools, needs training on advanced automation features'
    }
  ];

  const literacyC2 = [
    {
      person_id: insertedPeopleC2.data![0].id,
      overall_level: 'basic' as const,
      notes: 'Familiar with ERP basics but manual processes preferred'
    },
    {
      person_id: insertedPeopleC2.data![1].id,
      overall_level: 'novice' as const,
      notes: 'Paper-based tracking preferred, resistant to new technology'
    },
    {
      person_id: insertedPeopleC2.data![2].id,
      overall_level: 'basic' as const,
      notes: 'Uses quality software but limited understanding of automation potential'
    },
    {
      person_id: insertedPeopleC2.data![3].id,
      overall_level: 'basic' as const,
      notes: 'Comfortable with production software, skeptical of AI applications'
    },
    {
      person_id: insertedPeopleC2.data![4].id,
      overall_level: 'applied' as const,
      notes: 'Strong with shipping systems and tracking tools'
    }
  ];

  await supabase.from('literacy_assessments').insert([...literacyC1, ...literacyC2]);
  console.log('✅ Created literacy assessments\n');

  const dataSourcesClient1 = [
    {
      client_id: client1.id,
      name: 'Asana Project Data',
      system_name: 'Asana',
      data_type: 'structured' as const,
      description: 'Time tracking, task completion, project milestones'
    },
    {
      client_id: client1.id,
      name: 'QuickBooks Financial Data',
      system_name: 'QuickBooks Online',
      data_type: 'structured' as const,
      description: 'Invoices, expenses, payments, financial reports'
    },
    {
      client_id: client1.id,
      name: 'HubSpot Contact Data',
      system_name: 'HubSpot CRM',
      data_type: 'structured' as const,
      description: 'Client contacts, deals, communication history'
    }
  ];

  const dataSourcesClient2 = [
    {
      client_id: client2.id,
      name: 'SAP Inventory Data',
      system_name: 'SAP Business One',
      data_type: 'structured' as const,
      description: 'Raw materials, finished goods, stock levels, locations'
    },
    {
      client_id: client2.id,
      name: 'SAP Order Data',
      system_name: 'SAP Business One',
      data_type: 'structured' as const,
      description: 'Customer orders, order status, production assignments'
    },
    {
      client_id: client2.id,
      name: 'QC Inspection Records',
      system_name: 'QC Software Pro',
      data_type: 'structured' as const,
      description: 'Quality inspection results, defect tracking, compliance data'
    },
    {
      client_id: client2.id,
      name: 'Production Schedules',
      system_name: 'Microsoft Excel',
      data_type: 'documents' as const,
      description: 'Weekly production plans, capacity data, resource allocation'
    }
  ];

  const insertedDataC1 = await supabase.from('data_sources').insert(dataSourcesClient1).select();
  const insertedDataC2 = await supabase.from('data_sources').insert(dataSourcesClient2).select();

  if (!insertedDataC1.data || !insertedDataC2.data) {
    console.error('Error creating data sources:', insertedDataC1.error, insertedDataC2.error);
    return;
  }

  console.log('✅ Created data sources for both clients\n');

  const trustProfilesC1 = [
    {
      data_source_id: insertedDataC1.data![0].id,
      completeness: 'high' as const,
      accuracy: 'high' as const,
      timeliness: 'high' as const,
      governance: 'medium' as const
    },
    {
      data_source_id: insertedDataC1.data![1].id,
      completeness: 'high' as const,
      accuracy: 'high' as const,
      timeliness: 'high' as const,
      governance: 'high' as const
    },
    {
      data_source_id: insertedDataC1.data![2].id,
      completeness: 'medium' as const,
      accuracy: 'medium' as const,
      timeliness: 'high' as const,
      governance: 'medium' as const
    }
  ];

  const trustProfilesC2 = [
    {
      data_source_id: insertedDataC2.data![0].id,
      completeness: 'medium' as const,
      accuracy: 'medium' as const,
      timeliness: 'high' as const,
      governance: 'low' as const
    },
    {
      data_source_id: insertedDataC2.data![1].id,
      completeness: 'high' as const,
      accuracy: 'high' as const,
      timeliness: 'high' as const,
      governance: 'medium' as const
    },
    {
      data_source_id: insertedDataC2.data![2].id,
      completeness: 'medium' as const,
      accuracy: 'high' as const,
      timeliness: 'high' as const,
      governance: 'medium' as const
    },
    {
      data_source_id: insertedDataC2.data![3].id,
      completeness: 'low' as const,
      accuracy: 'low' as const,
      timeliness: 'medium' as const,
      governance: 'low' as const
    }
  ];

  await supabase.from('data_trust_profiles').insert([...trustProfilesC1, ...trustProfilesC2]);
  console.log('✅ Created data trust profiles\n');

  await supabase.from('process_data_sources').insert([
    { process_id: insertedProcessesC1.data![0].id, data_source_id: insertedDataC1.data![0].id },
    { process_id: insertedProcessesC1.data![0].id, data_source_id: insertedDataC1.data![2].id },
    { process_id: insertedProcessesC1.data![2].id, data_source_id: insertedDataC1.data![0].id },
    { process_id: insertedProcessesC1.data![2].id, data_source_id: insertedDataC1.data![1].id },
    { process_id: insertedProcessesC2.data![0].id, data_source_id: insertedDataC2.data![0].id },
    { process_id: insertedProcessesC2.data![0].id, data_source_id: insertedDataC2.data![1].id },
    { process_id: insertedProcessesC2.data![1].id, data_source_id: insertedDataC2.data![0].id }
  ]);

  console.log('✅ Linked data sources to processes\n');

  console.log('🎉 Demo data creation complete!\n');
  console.log(`📊 Client 1 ID: ${client1.id}`);
  console.log(`📊 Client 2 ID: ${client2.id}`);
}

createDemoData().catch(console.error);
