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

async function addRemainingSteps() {
  console.log('🚀 Adding process steps for remaining processes...\n');

  const { data: processes } = await supabase
    .from('processes')
    .select('id, name, client_id')
    .order('created_at');

  if (!processes) {
    console.error('No processes found');
    return;
  }

  for (const process of processes) {
    const { data: existingSteps } = await supabase
      .from('process_steps')
      .select('id')
      .eq('process_id', process.id);

    if (existingSteps && existingSteps.length > 0) {
      console.log(`⏭️  Skipping "${process.name}" - already has steps`);
      continue;
    }

    console.log(`➕ Adding steps for "${process.name}"`);

    let steps: any[] = [];

    switch (process.name) {
      case 'Client Onboarding':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Initial Discovery Call',
            description: 'Conduct kickoff meeting to understand client goals, requirements, and expectations',
            estimated_duration_minutes: 60,
            average_time_minutes: 75,
            is_rule_based: 'mostly_judgment' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Contract & Paperwork',
            description: 'Review and sign service agreement, collect payment information, set up billing',
            estimated_duration_minutes: 30,
            average_time_minutes: 45,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Project Setup',
            description: 'Create project workspace, add client to systems, set up communication channels',
            estimated_duration_minutes: 20,
            average_time_minutes: 30,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Team Introduction',
            description: 'Introduce client to project team, establish roles and communication protocols',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mixed' as const
          }
        ];
        break;

      case 'Invoicing & Collections':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Time & Expense Tracking',
            description: 'Gather billable hours and expenses from team members for completed work',
            estimated_duration_minutes: 20,
            average_time_minutes: 30,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Invoice Generation',
            description: 'Create invoice with line items, apply rates, add any additional charges',
            estimated_duration_minutes: 15,
            average_time_minutes: 25,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Invoice Review & Approval',
            description: 'Review invoice for accuracy, get approval from account manager',
            estimated_duration_minutes: 10,
            average_time_minutes: 15,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Send & Track Payment',
            description: 'Send invoice to client, set payment reminder, follow up on overdue invoices',
            estimated_duration_minutes: 10,
            average_time_minutes: 20,
            is_rule_based: 'mixed' as const
          }
        ];
        break;

      case 'Order Processing':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Order Entry',
            description: 'Enter customer order details into ERP system, verify product codes and quantities',
            estimated_duration_minutes: 10,
            average_time_minutes: 15,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Inventory Check',
            description: 'Verify inventory availability for all order items',
            estimated_duration_minutes: 5,
            average_time_minutes: 10,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Credit & Pricing Approval',
            description: 'Check customer credit status, verify pricing and discounts',
            estimated_duration_minutes: 10,
            average_time_minutes: 15,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Order Confirmation',
            description: 'Generate order confirmation with delivery date, send to customer',
            estimated_duration_minutes: 5,
            average_time_minutes: 10,
            is_rule_based: 'mostly_rules' as const
          }
        ];
        break;

      case 'Inventory Management':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Stock Level Monitoring',
            description: 'Review inventory levels daily, identify items approaching reorder points',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Purchase Requisition',
            description: 'Create purchase orders for low-stock items based on demand forecasts',
            estimated_duration_minutes: 20,
            average_time_minutes: 30,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Receiving & Inspection',
            description: 'Receive incoming shipments, verify against PO, inspect for damage',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Inventory Reconciliation',
            description: 'Conduct cycle counts, reconcile physical inventory with system records',
            estimated_duration_minutes: 45,
            average_time_minutes: 60,
            is_rule_based: 'mostly_rules' as const
          }
        ];
        break;

      case 'Project Delivery & Tracking':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Task Assignment',
            description: 'Break down project into tasks and assign to team members based on capacity',
            estimated_duration_minutes: 45,
            average_time_minutes: 60,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Daily Progress Check',
            description: 'Review task status, identify blockers, update project timeline',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mostly_judgment' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Client Status Update',
            description: 'Prepare and send weekly status report to client with progress and next steps',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Deliverable Review',
            description: 'Internal quality review before sending to client',
            estimated_duration_minutes: 60,
            average_time_minutes: 75,
            is_rule_based: 'mostly_judgment' as const
          }
        ];
        break;

      case 'Content Creation Workflow':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Content Ideation',
            description: 'Brainstorm topics, research trends, select content themes',
            estimated_duration_minutes: 60,
            average_time_minutes: 90,
            is_rule_based: 'mostly_judgment' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'First Draft Creation',
            description: 'Write initial draft of content piece',
            estimated_duration_minutes: 120,
            average_time_minutes: 150,
            is_rule_based: 'mostly_judgment' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Internal Review & Editing',
            description: 'Editorial review for quality, brand voice, and accuracy',
            estimated_duration_minutes: 30,
            average_time_minutes: 45,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Approval & Publishing',
            description: 'Get final approval and publish to appropriate channels',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mostly_rules' as const
          }
        ];
        break;

      case 'Sales Prospecting':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Target Market Research',
            description: 'Identify target industries and companies fitting ideal customer profile',
            estimated_duration_minutes: 60,
            average_time_minutes: 75,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Contact List Building',
            description: 'Find decision-maker contacts and verify email addresses',
            estimated_duration_minutes: 45,
            average_time_minutes: 60,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Email Sequence Setup',
            description: 'Create personalized email sequence and schedule sends',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Follow-up & Meeting Scheduling',
            description: 'Track responses, follow up with interested prospects, book discovery calls',
            estimated_duration_minutes: 20,
            average_time_minutes: 30,
            is_rule_based: 'mixed' as const
          }
        ];
        break;

      case 'Quality Control Inspection':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Incoming Material Inspection',
            description: 'Inspect raw materials against specifications and quality standards',
            estimated_duration_minutes: 20,
            average_time_minutes: 25,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'In-Process Quality Check',
            description: 'Monitor production line and perform spot checks during manufacturing',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Final Product Testing',
            description: 'Comprehensive testing of finished products against specifications',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Defect Documentation',
            description: 'Record any defects, categorize issues, initiate corrective actions',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 5,
            title: 'Quality Report Generation',
            description: 'Compile daily quality metrics and generate reports for management',
            estimated_duration_minutes: 20,
            average_time_minutes: 25,
            is_rule_based: 'mostly_rules' as const
          }
        ];
        break;

      case 'Production Scheduling':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Capacity Analysis',
            description: 'Review current workload, equipment availability, and labor capacity',
            estimated_duration_minutes: 45,
            average_time_minutes: 60,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Job Prioritization',
            description: 'Rank orders by due date, customer priority, and material availability',
            estimated_duration_minutes: 30,
            average_time_minutes: 40,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Resource Allocation',
            description: 'Assign jobs to specific machines and operators',
            estimated_duration_minutes: 40,
            average_time_minutes: 50,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Schedule Communication',
            description: 'Distribute production schedule to team leads and update ERP system',
            estimated_duration_minutes: 15,
            average_time_minutes: 20,
            is_rule_based: 'mostly_rules' as const
          }
        ];
        break;

      case 'Shipping & Logistics':
        steps = [
          {
            process_id: process.id,
            step_order: 1,
            title: 'Pick & Pack Operations',
            description: 'Pull items from inventory, pack according to shipping requirements',
            estimated_duration_minutes: 20,
            average_time_minutes: 25,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 2,
            title: 'Carrier Selection',
            description: 'Choose optimal carrier based on destination, cost, and delivery speed',
            estimated_duration_minutes: 5,
            average_time_minutes: 10,
            is_rule_based: 'mixed' as const
          },
          {
            process_id: process.id,
            step_order: 3,
            title: 'Label Generation',
            description: 'Generate shipping labels and attach to packages',
            estimated_duration_minutes: 5,
            average_time_minutes: 5,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 4,
            title: 'Customer Notification',
            description: 'Send tracking number and delivery estimate to customer',
            estimated_duration_minutes: 5,
            average_time_minutes: 5,
            is_rule_based: 'mostly_rules' as const
          },
          {
            process_id: process.id,
            step_order: 5,
            title: 'Shipment Tracking',
            description: 'Monitor shipments and handle any delivery exceptions',
            estimated_duration_minutes: 10,
            average_time_minutes: 15,
            is_rule_based: 'mixed' as const
          }
        ];
        break;

      default:
        console.log(`⚠️  No steps defined for "${process.name}"`);
        continue;
    }

    if (steps.length > 0) {
      const { error } = await supabase
        .from('process_steps')
        .insert(steps);

      if (error) {
        console.error(`❌ Error adding steps for "${process.name}":`, error);
      } else {
        console.log(`✅ Added ${steps.length} steps for "${process.name}"`);
      }
    }
  }

  console.log('\n🎉 Finished adding process steps!');
}

addRemainingSteps().catch(console.error);
