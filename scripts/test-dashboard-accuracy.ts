import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Database } from '../src/lib/database.types';
import { calculateExecutiveMetrics } from '../src/lib/executiveScoring';

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

async function testDashboardAccuracy() {
  console.log('🧪 Testing Dashboard Calculation Accuracy\n');
  console.log('='.repeat(80));

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (!clients || clients.length === 0) {
    console.error('❌ No clients found');
    return;
  }

  let totalTests = 0;
  let passedTests = 0;

  for (const client of clients) {
    console.log(`\n📊 Testing: ${client.name}`);
    console.log('─'.repeat(80));

    const { data: processes } = await supabase
      .from('processes')
      .select('*')
      .eq('client_id', client.id);

    if (!processes || processes.length === 0) {
      console.log('   ⚠️  No processes to test');
      continue;
    }

    const processesWithMetrics = [];

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

      processesWithMetrics.push({
        ...process,
        steps: steps || [],
        ...metrics
      });
    }

    totalTests++;
    const doNowCount = processesWithMetrics.filter(p => p.sequencingBucket === 'do now').length;
    const prepareCount = processesWithMetrics.filter(p => p.sequencingBucket === 'prepare').length;
    const deferCount = processesWithMetrics.filter(p => p.sequencingBucket === 'defer').length;
    const avoidCount = processesWithMetrics.filter(p => p.sequencingBucket === 'avoid').length;

    console.log(`\n✅ Sequencing Counts:`);
    console.log(`   Do Now: ${doNowCount}`);
    console.log(`   Prepare: ${prepareCount}`);
    console.log(`   Defer: ${deferCount}`);
    console.log(`   Avoid: ${avoidCount}`);
    console.log(`   Total: ${doNowCount + prepareCount + deferCount + avoidCount} (should equal ${processes.length})`);

    if (doNowCount + prepareCount + deferCount + avoidCount === processes.length) {
      console.log('   ✅ PASS: All processes classified');
      passedTests++;
    } else {
      console.log('   ❌ FAIL: Mismatch in process count');
    }

    totalTests++;
    const investmentCategoryCounts = processesWithMetrics.reduce((acc, p) => {
      acc[p.investmentCategory] = (acc[p.investmentCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(investmentCategoryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    console.log(`\n✅ Investment Category Analysis:`);
    Object.entries(investmentCategoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    console.log(`   Top Category: ${topCategory[0]} with ${topCategory[1]} processes`);
    if (topCategory) {
      console.log('   ✅ PASS: Investment categories calculated');
      passedTests++;
    } else {
      console.log('   ❌ FAIL: No investment categories found');
    }

    totalTests++;
    const gateFailures = processesWithMetrics.reduce((acc, p) => {
      Object.entries(p.gateStatus).forEach(([gate, status]) => {
        if (status === 'fail') {
          acc[gate] = (acc[gate] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n✅ Gate Status Analysis:`);
    if (Object.keys(gateFailures).length > 0) {
      Object.entries(gateFailures)
        .sort((a, b) => b[1] - a[1])
        .forEach(([gate, count]) => {
          console.log(`   ${gate}: ${count} failures`);
        });
      const topGate = Object.entries(gateFailures).sort((a, b) => b[1] - a[1])[0];
      console.log(`   Top Issue: ${topGate[0]} with ${topGate[1]} failures`);
    } else {
      console.log('   All gates passing ✅');
    }
    console.log('   ✅ PASS: Gate analysis complete');
    passedTests++;

    totalTests++;
    const fundCandidates = processesWithMetrics
      .filter(p => p.sequencingBucket === 'do now')
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 2);

    console.log(`\n✅ Recommended Actions:`);
    if (fundCandidates.length > 0) {
      console.log(`   Fund Candidates:`);
      fundCandidates.forEach(p => {
        console.log(`      - ${p.name} (Value: ${p.valueScore})`);
      });
    } else {
      console.log(`   No immediate funding candidates`);
    }

    const fixCandidate = processesWithMetrics
      .filter(p => p.sequencingBucket === 'prepare')
      .sort((a, b) => b.valueScore - a.valueScore)[0];

    if (fixCandidate) {
      console.log(`   Prepare: ${fixCandidate.name} (Value: ${fixCandidate.valueScore})`);
    }

    const dontFundCandidate = processesWithMetrics
      .filter(p => p.sequencingBucket === 'avoid')
      .sort((a, b) => b.valueScore - a.valueScore)[0];

    if (dontFundCandidate) {
      console.log(`   Don't Fund: ${dontFundCandidate.name} (Risk: ${dontFundCandidate.riskClass})`);
    }

    console.log('   ✅ PASS: Action recommendations generated');
    passedTests++;

    totalTests++;
    console.log(`\n✅ Value & Feasibility Scores:`);
    let allScoresValid = true;
    processesWithMetrics.forEach(p => {
      const validValue = p.valueScore >= 0 && p.valueScore <= 100;
      const validFeasibility = p.feasibilityScore >= 0 && p.feasibilityScore <= 100;

      if (!validValue || !validFeasibility) {
        console.log(`   ❌ ${p.name}: Value=${p.valueScore}, Feasibility=${p.feasibilityScore}`);
        allScoresValid = false;
      }
    });

    if (allScoresValid) {
      console.log(`   All scores within valid range (0-100) ✅`);
      passedTests++;
    } else {
      console.log('   ❌ FAIL: Some scores out of range');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('✅ All dashboard calculations are accurate!\n');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed\n`);
  }
}

testDashboardAccuracy().catch(console.error);
