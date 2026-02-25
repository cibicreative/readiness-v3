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

async function syncClientResources() {
  console.log('🔄 Syncing client resources with process steps...\n');

  const { data: existingTools } = await supabase
    .from('tools')
    .select('id, name');

  if (!existingTools || existingTools.length === 0) {
    console.log('📦 Adding global tools...');

    const tools = [
      { name: 'Asana', type: 'Project Management', vendor: 'Asana', monthly_cost: 99 },
      { name: 'QuickBooks Online', type: 'Accounting', vendor: 'Intuit', monthly_cost: 85 },
      { name: 'HubSpot CRM', type: 'CRM', vendor: 'HubSpot', monthly_cost: 450 },
      { name: 'Google Workspace', type: 'Collaboration', vendor: 'Google', monthly_cost: 30 },
      { name: 'Slack', type: 'Communication', vendor: 'Slack', monthly_cost: 80 },
      { name: 'SAP Business One', type: 'ERP', vendor: 'SAP', subscription_cost: 14400, billing_cycle: 'yearly' as const },
      { name: 'QC Software Pro', type: 'Quality Management', vendor: 'QC Systems Inc', monthly_cost: 450 },
      { name: 'ShipStation', type: 'Shipping', vendor: 'ShipStation', monthly_cost: 99 },
      { name: 'Microsoft Excel', type: 'Spreadsheet', vendor: 'Microsoft', monthly_cost: 0 },
      { name: 'Microsoft Teams', type: 'Communication', vendor: 'Microsoft', monthly_cost: 120 }
    ];

    await supabase.from('tools').insert(tools);
    console.log('  ✅ Added 10 global tools\n');
  } else {
    console.log('  ⏭️  Tools already exist\n');
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('created_at');

  if (!clients || clients.length === 0) {
    console.error('No clients found');
    return;
  }

  for (const client of clients) {
    console.log(`📋 Processing client: ${client.name}`);

    if (client.name.includes('Catalyst')) {

      const { data: processes } = await supabase
        .from('processes')
        .select('id, name')
        .eq('client_id', client.id);

      if (processes) {
        for (const process of processes) {
          const { data: linkedDataSources } = await supabase
            .from('process_data_sources')
            .select('id')
            .eq('process_id', process.id);

          if (!linkedDataSources || linkedDataSources.length === 0) {
            const { data: dataSources } = await supabase
              .from('data_sources')
              .select('id, name')
              .eq('client_id', client.id);

            if (dataSources && dataSources.length > 0) {
              const links = [];

              if (process.name.includes('Onboarding') || process.name.includes('Sales')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('HubSpot'))?.id });
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Asana'))?.id });
              }

              if (process.name.includes('Project Delivery')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Asana'))?.id });
              }

              if (process.name.includes('Invoicing')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('QuickBooks'))?.id });
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Asana'))?.id });
              }

              if (process.name.includes('Content')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Asana'))?.id });
              }

              if (process.name.includes('Sales Prospecting')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('HubSpot'))?.id });
              }

              const validLinks = links.filter(l => l.data_source_id);
              if (validLinks.length > 0) {
                await supabase.from('process_data_sources').insert(validLinks);
                console.log(`  ✅ Linked ${validLinks.length} data sources to ${process.name}`);
              }
            }
          }
        }
      } else {
        console.log('  ⏭️  All data sources already linked');
      }

    } else if (client.name.includes('PrecisionTech')) {
      const { data: processes } = await supabase
        .from('processes')
        .select('id, name')
        .eq('client_id', client.id);

      if (processes) {
        for (const process of processes) {
          const { data: linkedDataSources } = await supabase
            .from('process_data_sources')
            .select('id')
            .eq('process_id', process.id);

          if (!linkedDataSources || linkedDataSources.length === 0) {
            const { data: dataSources } = await supabase
              .from('data_sources')
              .select('id, name')
              .eq('client_id', client.id);

            if (dataSources && dataSources.length > 0) {
              const links = [];

              if (process.name.includes('Order Processing')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Order'))?.id });
              }

              if (process.name.includes('Inventory')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Inventory'))?.id });
              }

              if (process.name.includes('Quality')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('QC'))?.id });
              }

              if (process.name.includes('Production Scheduling')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Production'))?.id });
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Inventory'))?.id });
              }

              if (process.name.includes('Shipping')) {
                links.push({ process_id: process.id, data_source_id: dataSources.find(ds => ds.name.includes('Order'))?.id });
              }

              const validLinks = links.filter(l => l.data_source_id);
              if (validLinks.length > 0) {
                await supabase.from('process_data_sources').insert(validLinks);
                console.log(`  ✅ Linked ${validLinks.length} data sources to ${process.name}`);
              }
            }
          }
        }
      } else {
        console.log('  ⏭️  All data sources already linked');
      }
    }
  }

  console.log('\n🎉 Client resource sync complete!');

  const { data: clients2 } = await supabase
    .from('clients')
    .select('id, name');

  if (clients2) {
    console.log('\n📊 Summary:');
    for (const client of clients2) {
      const { count: processCount } = await supabase
        .from('processes')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      const { count: peopleCount } = await supabase
        .from('people')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      const { count: dataSourceCount } = await supabase
        .from('data_sources')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      const { count: roleCount } = await supabase
        .from('roles')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      console.log(`\n  ${client.name}:`);
      console.log(`    - ${processCount || 0} processes`);
      console.log(`    - ${peopleCount || 0} people`);
      console.log(`    - ${roleCount || 0} roles`);
      console.log(`    - ${dataSourceCount || 0} data sources`);
    }
  }

  const { count: toolCount } = await supabase
    .from('tools')
    .select('id', { count: 'exact', head: true });

  console.log(`\n  Global: ${toolCount || 0} tools available`);
}

syncClientResources().catch(console.error);
