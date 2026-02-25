import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

(async () => {
  const { data: clients } = await supabase.from('clients').select('id, name');

  if (clients) {
    for (const client of clients) {
      const { data: people } = await supabase.from('people').select('*').eq('client_id', client.id);
      const { data: roles } = await supabase.from('roles').select('*').eq('client_id', client.id);
      const { data: dataSources } = await supabase.from('data_sources').select('*').eq('client_id', client.id);
      const { data: processes } = await supabase.from('processes').select('*').eq('client_id', client.id);

      console.log(`\n${client.name}:`);
      console.log(`  People: ${people?.length || 0}`);
      console.log(`  Roles: ${roles?.length || 0}`);
      console.log(`  Data Sources: ${dataSources?.length || 0}`);
      console.log(`  Processes: ${processes?.length || 0}`);

      if (processes) {
        for (const process of processes) {
          const { data: steps } = await supabase.from('process_steps').select('id').eq('process_id', process.id);
          const { data: links } = await supabase.from('process_data_sources').select('id').eq('process_id', process.id);
          console.log(`    ${process.name}: ${steps?.length || 0} steps, ${links?.length || 0} data source links`);
        }
      }
    }
  }

  const { data: tools } = await supabase.from('tools').select('*');
  console.log(`\nGlobal Tools: ${tools?.length || 0}`);
})();
