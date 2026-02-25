import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from '../src/lib/database.types';
import { calculateExecutiveMetrics, calculateValueScore, calculateFeasibilityScore } from '../src/lib/executiveScoring';

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

async function verifyCalculations() {
  console.log('🔍 Verifying Executive Dashboard Calculations\n');
  console.log('='.repeat(80));

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at');

  if (!clients || clients.length === 0) {
    console.error('❌ No clients found');
    return;
  }

  for (const client of clients) {
    console.log(`\n\n📊 CLIENT: ${client.name}`);
    console.log(`   Company Size: ${client.company_size}`);
    console.log(`   Industry: ${client.industry}`);
    console.log(`   Risk Tolerance: ${client.risk_tolerance || 'unknown'}`);
    console.log('─'.repeat(80));

    const { data: processes } = await supabase
      .from('processes')
      .select('*')
      .eq('client_id', client.id)
      .order('name');

    if (!processes || processes.length === 0) {
      console.log('   ⚠️  No processes found');
      continue;
    }

    let doNowCount = 0;
    let prepareCount = 0;
    let deferCount = 0;
    let avoidCount = 0;

    const investmentCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const gateFailures: Record<string, number> = {};

    for (const process of processes) {
      const { data: steps } = await supabase
        .from('process_steps')
        .select('*')
        .eq('process_id', process.id)
        .order('step_order');

      const metrics = calculateExecutiveMetrics(
        process,
        steps || [],
        client.risk_tolerance || 'unknown'
      );

      console.log(`\n   📋 Process: ${process.name}`);
      console.log(`      Category: ${process.category || 'other'}`);
      console.log(`      Steps: ${steps?.length || 0}`);
      console.log(`
      📊 Metrics:`);
      console.log(`         Value Score: ${metrics.valueScore}/100`);
      console.log(`         Feasibility Score: ${metrics.feasibilityScore}/100`);
      console.log(`         Risk Class: ${metrics.riskClass}`);
      console.log(`         Investment Type: ${metrics.investmentCategory}`);
      console.log(`         Sequencing: ${metrics.sequencingBucket}`);
      console.log(`
      🚦 Gates:`);
      console.log(`         Process Gate: ${metrics.gateStatus.processGate}`);
      console.log(`         Data Gate: ${metrics.gateStatus.dataGate}`);
      console.log(`         People Gate: ${metrics.gateStatus.peopleGate}`);
      console.log(`         Finance Gate: ${metrics.gateStatus.financeGate}`);
      console.log(`         Guardrails Gate: ${metrics.gateStatus.guardrailsGate}`);

      console.log(`
      📈 Scoring Details:`);
      console.log(`         Automation Potential: ${process.automation_potential_score || 0}`);
      console.log(`         Documentation Completeness: ${process.documentation_completeness_score || 0}`);
      console.log(`         Literacy Fit: ${process.literacy_fit_score || 0}`);
      console.log(`         Data Risk: ${process.data_risk_score || 0}`);
      console.log(`         Frequency: ${process.frequency || 'ad hoc'}`);

      const totalTime = (steps || []).reduce((sum, step) =>
        sum + (step.average_time_minutes || step.estimated_duration_minutes || 0), 0);
      console.log(`         Total Time: ${totalTime} minutes`);

      if (steps && steps.length > 0) {
        const ruleBased = steps.filter(s => s.is_rule_based === 'mostly_rules').length;
        const mixed = steps.filter(s => s.is_rule_based === 'mixed').length;
        const judgment = steps.filter(s => s.is_rule_based === 'mostly_judgment').length;
        console.log(`         Rule-based Steps: ${ruleBased} rules, ${mixed} mixed, ${judgment} judgment`);
      }

      if (metrics.sequencingBucket === 'do now') doNowCount++;
      else if (metrics.sequencingBucket === 'prepare') prepareCount++;
      else if (metrics.sequencingBucket === 'defer') deferCount++;
      else if (metrics.sequencingBucket === 'avoid') avoidCount++;

      investmentCounts[metrics.investmentCategory] = (investmentCounts[metrics.investmentCategory] || 0) + 1;
      riskCounts[metrics.riskClass]++;

      Object.entries(metrics.gateStatus).forEach(([gate, status]) => {
        if (status === 'fail') {
          gateFailures[gate] = (gateFailures[gate] || 0) + 1;
        }
      });
    }

    console.log('\n   📊 EXECUTIVE SUMMARY:');
    console.log('   ─'.repeat(40));
    console.log(`   Sequencing Buckets:`);
    console.log(`      Do Now: ${doNowCount}`);
    console.log(`      Prepare: ${prepareCount}`);
    console.log(`      Defer: ${deferCount}`);
    console.log(`      Avoid: ${avoidCount}`);

    console.log(`\n   Investment Categories:`);
    Object.entries(investmentCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`      ${cat}: ${count}`);
      });

    console.log(`\n   Risk Distribution:`);
    console.log(`      Low: ${riskCounts.low}, Medium: ${riskCounts.medium}, High: ${riskCounts.high}`);

    if (Object.keys(gateFailures).length > 0) {
      console.log(`\n   Gate Failures:`);
      Object.entries(gateFailures)
        .sort((a, b) => b[1] - a[1])
        .forEach(([gate, count]) => {
          console.log(`      ${gate}: ${count} failures`);
        });
    } else {
      console.log(`\n   ✅ No gate failures - all processes passing gates`);
    }

    const topInvestment = Object.entries(investmentCounts)
      .sort((a, b) => b[1] - a[1])[0];
    console.log(`\n   💡 Top Investment Category: ${topInvestment[0]} (${topInvestment[1]} processes)`);

    const topGate = Object.entries(gateFailures)
      .sort((a, b) => b[1] - a[1])[0];
    console.log(`   ⚠️  Top Gate Issue: ${topGate ? `${topGate[0]} (${topGate[1]} failures)` : 'None - All Green'}`);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ Verification Complete\n');
}

verifyCalculations().catch(console.error);
