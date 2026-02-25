import type { Database } from './database.types';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];

export type RiskClass = 'low' | 'medium' | 'high';
export type InvestmentCategory =
  | 'process'
  | 'data'
  | 'people'
  | 'automation'
  | 'AI tools'
  | 'AI implementation'
  | 'traditional software';
export type SequencingBucket = 'do_now' | 'prepare' | 'defer' | 'avoid';

export interface GateStatus {
  processGate: 'pass' | 'yellow' | 'fail';
  dataGate: 'pass' | 'yellow' | 'fail';
  peopleGate: 'pass' | 'yellow' | 'fail';
  financeGate: 'pass' | 'yellow' | 'fail';
  guardrailsGate: 'pass' | 'yellow' | 'fail';
}

export interface ExecutiveMetrics {
  valueScore: number;
  feasibilityScore: number;
  riskClass: RiskClass;
  investmentCategory: InvestmentCategory;
  sequencingBucket: SequencingBucket;
  gateStatus: GateStatus;
}

export function calculateValueScore(
  process: Process,
  steps: ProcessStep[]
): number {
  const automationPotential = process.automation_potential_score || 0;
  const documentationCompleteness = process.documentation_completeness_score || 0;
  const literacyFitScore = process.literacy_fit_score || 0;

  const frequencyMultipliers: Record<string, number> = {
    'daily': 1.0,
    'weekly': 0.8,
    'monthly': 0.6,
    'quarterly': 0.4,
    'ad hoc': 0.3
  };
  const frequencyMultiplier = frequencyMultipliers[process.frequency || 'ad hoc'] || 0.3;

  const totalTime = steps.reduce((sum, step) =>
    sum + (step.average_time_minutes || step.estimated_duration_minutes || 0), 0);

  let timeMultiplier = 0.2;
  if (totalTime >= 120) timeMultiplier = 1.0;
  else if (totalTime >= 60) timeMultiplier = 0.8;
  else if (totalTime >= 30) timeMultiplier = 0.6;
  else if (totalTime >= 10) timeMultiplier = 0.4;

  const base = automationPotential * 0.6 + documentationCompleteness * 0.2 + literacyFitScore * 0.2;
  const valueScore = Math.round(base * frequencyMultiplier * timeMultiplier);

  return Math.max(0, Math.min(100, valueScore));
}

export function calculateFeasibilityScore(
  process: Process,
  steps: ProcessStep[]
): number {
  const documentationCompleteness = process.documentation_completeness_score || 0;
  const dataRiskScore = process.data_risk_score || 0;
  const literacyFitScore = process.literacy_fit_score || 0;

  const ruleBasedCounts = { rules: 0, mixed: 0, judgment: 0 };
  steps.forEach(step => {
    if (step.is_rule_based === 'mostly_rules') ruleBasedCounts.rules++;
    else if (step.is_rule_based === 'mixed') ruleBasedCounts.mixed++;
    else if (step.is_rule_based === 'mostly_judgment') ruleBasedCounts.judgment++;
  });

  let decisionAdj = 0;
  const total = ruleBasedCounts.rules + ruleBasedCounts.mixed + ruleBasedCounts.judgment;
  if (total > 0) {
    const ruleRatio = ruleBasedCounts.rules / total;
    if (ruleRatio > 0.6) decisionAdj = 10;
    else if (ruleRatio < 0.3) decisionAdj = -10;
  }

  const feasibility =
    0.35 * documentationCompleteness +
    0.35 * (100 - dataRiskScore) +
    0.20 * literacyFitScore +
    decisionAdj;

  return Math.max(0, Math.min(100, Math.round(feasibility)));
}

export function calculateRiskClass(process: Process): RiskClass {
  let riskPoints = process.data_risk_score || 0;

  if (process.is_compliance_sensitive) riskPoints += 15;
  if (process.is_customer_facing) riskPoints += 15;

  if (riskPoints <= 39) return 'low';
  if (riskPoints <= 69) return 'medium';
  return 'high';
}

export function classifyInvestmentCategory(
  process: Process,
  steps: ProcessStep[],
  riskClass: RiskClass
): InvestmentCategory {
  const docComplete = process.documentation_completeness_score || 0;
  const dataRisk = process.data_risk_score || 0;
  const literacyFit = process.literacy_fit_score || 0;
  const automationPotential = process.automation_potential_score || 0;

  if (docComplete < 50) return 'process';
  if (dataRisk > 65) return 'data';
  if (literacyFit < 50) return 'people';

  const ruleBasedCounts = { rules: 0, total: 0 };
  steps.forEach(step => {
    ruleBasedCounts.total++;
    if (step.is_rule_based === 'mostly_rules') ruleBasedCounts.rules++;
  });

  const ruleMajority = ruleBasedCounts.total > 0 &&
    (ruleBasedCounts.rules / ruleBasedCounts.total) > 0.5;

  if (automationPotential >= 70 && ruleMajority) return 'automation';
  if (automationPotential >= 45 && automationPotential < 70 && riskClass !== 'high') return 'AI tools';

  const integrationComplexity = steps.length;
  if (integrationComplexity >= 5 && automationPotential >= 60) return 'AI implementation';

  return 'traditional software';
}

export function classifySequencingBucket(
  valueScore: number,
  feasibilityScore: number,
  riskClass: RiskClass,
  investmentCategory: InvestmentCategory,
  gateStatus: GateStatus
): SequencingBucket {
  if (valueScore < 40 && riskClass === 'high') return 'avoid';
  if (feasibilityScore < 35) return 'avoid';

  const anyGateFailed = Object.values(gateStatus).some(status => status === 'fail');

  if (investmentCategory === 'AI implementation' && anyGateFailed) {
    return 'defer';
  }

  if (valueScore >= 60 && riskClass === 'high') return 'defer';

  // High value + high feasibility + low/medium risk = do_now
  // (regardless of investment category, as long as gates pass for AI implementation)
  if (valueScore >= 60 && feasibilityScore >= 60 && riskClass !== 'high') {
    // AI implementation needs all gates to pass
    if (investmentCategory === 'AI implementation' && anyGateFailed) {
      return 'prepare';
    }
    return 'do_now';
  }

  if (valueScore >= 60 && feasibilityScore < 60) return 'prepare';
  if (['process', 'data', 'people'].includes(investmentCategory)) return 'prepare';

  return 'defer';
}

export function calculateGateStatus(
  process: Process,
  budgetTolerance?: string
): GateStatus {
  const docComplete = process.documentation_completeness_score || 0;
  const dataRisk = process.data_risk_score || 0;
  const literacyFit = process.literacy_fit_score || 0;

  const processGate: GateStatus['processGate'] =
    docComplete >= 65 ? 'pass' :
    docComplete >= 55 ? 'yellow' : 'fail';

  const dataGate: GateStatus['dataGate'] =
    dataRisk <= 45 ? 'pass' :
    dataRisk <= 55 ? 'yellow' : 'fail';

  const peopleGate: GateStatus['peopleGate'] =
    literacyFit >= 60 ? 'pass' :
    literacyFit >= 50 ? 'yellow' : 'fail';

  const financeGate: GateStatus['financeGate'] =
    !budgetTolerance || budgetTolerance === 'unknown' ? 'yellow' :
    ['medium', 'high'].includes(budgetTolerance) ? 'pass' : 'fail';

  let guardrailsGate: GateStatus['guardrailsGate'] = 'pass';
  if (process.is_customer_facing || process.is_compliance_sensitive) {
    if (dataRisk <= 40 && docComplete >= 70) {
      guardrailsGate = 'pass';
    } else if (dataRisk <= 50 || docComplete >= 60) {
      guardrailsGate = 'yellow';
    } else {
      guardrailsGate = 'fail';
    }
  }

  return { processGate, dataGate, peopleGate, financeGate, guardrailsGate };
}

export function calculateExecutiveMetrics(
  process: Process,
  steps: ProcessStep[],
  budgetTolerance?: string
): ExecutiveMetrics {
  const valueScore = calculateValueScore(process, steps);
  const feasibilityScore = calculateFeasibilityScore(process, steps);
  const riskClass = calculateRiskClass(process);
  const investmentCategory = classifyInvestmentCategory(process, steps, riskClass);
  const gateStatus = calculateGateStatus(process, budgetTolerance);
  const sequencingBucket = classifySequencingBucket(
    valueScore,
    feasibilityScore,
    riskClass,
    investmentCategory,
    gateStatus
  );

  return {
    valueScore,
    feasibilityScore,
    riskClass,
    investmentCategory,
    sequencingBucket,
    gateStatus
  };
}

export function getBudgetRangeBand(category: InvestmentCategory): string {
  const ranges: Record<InvestmentCategory, string> = {
    'process': 'Small ($5k-$25k)',
    'data': 'Small to Medium ($10k-$50k)',
    'people': 'Small ($5k-$30k)',
    'automation': 'Medium ($25k-$100k)',
    'AI tools': 'Small to Medium ($10k-$60k)',
    'AI implementation': 'Large ($50k-$250k+)',
    'traditional software': 'Medium to Large ($30k-$150k)'
  };
  return ranges[category] || 'Medium ($25k-$100k)';
}
