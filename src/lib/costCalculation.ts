import type { Database } from './database.types';

type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

export interface StepCostBreakdown {
  stepId: string;
  stepTitle: string;
  laborCost: number;
  toolCost: number;
  totalCost: number;
  duration: number;
  roleName?: string;
  toolNames: string[];
}

export interface ProcessCostSummary {
  totalLaborCost: number;
  totalToolCost: number;
  totalCost: number;
  totalDuration: number;
  stepBreakdowns: StepCostBreakdown[];
}

export function calculateStepLaborCost(
  step: ProcessStep,
  role: Role | null
): number {
  if (!step.estimated_duration_minutes || !role?.hourly_rate) {
    return 0;
  }

  const hours = step.estimated_duration_minutes / 60;
  return hours * role.hourly_rate;
}

export function calculateStepToolCost(
  tools: Tool[],
  stepToolIds: string[]
): number {
  if (!tools.length || !stepToolIds.length) {
    return 0;
  }

  return tools
    .filter((tool) => stepToolIds.includes(tool.id))
    .reduce((total, tool) => total + (tool.monthly_cost || 0), 0);
}

export function calculateProcessCost(
  steps: ProcessStep[],
  roles: Role[],
  tools: Tool[],
  stepToolMap: Record<string, string[]>
): ProcessCostSummary {
  const stepBreakdowns: StepCostBreakdown[] = [];
  let totalLaborCost = 0;
  let totalToolCost = 0;
  let totalDuration = 0;

  for (const step of steps) {
    const role = roles.find((r) => r.id === step.role_id) || null;
    const stepToolIds = stepToolMap[step.id] || [];
    const stepTools = tools.filter((t) => stepToolIds.includes(t.id));

    const laborCost = calculateStepLaborCost(step, role);
    const toolCost = calculateStepToolCost(tools, stepToolIds);
    const totalCost = laborCost + toolCost;

    stepBreakdowns.push({
      stepId: step.id,
      stepTitle: step.title || `Step ${step.step_order}`,
      laborCost,
      toolCost,
      totalCost,
      duration: step.estimated_duration_minutes || 0,
      roleName: role?.title,
      toolNames: stepTools.map((t) => t.name),
    });

    totalLaborCost += laborCost;
    totalToolCost += toolCost;
    totalDuration += step.estimated_duration_minutes || 0;
  }

  return {
    totalLaborCost,
    totalToolCost,
    totalCost: totalLaborCost + totalToolCost,
    totalDuration,
    stepBreakdowns,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export interface RoadmapCostEstimate {
  prerequisiteCosts: {
    processDocumentation?: number;
    dataFoundation?: number;
    teamEnablement?: number;
    businessCase?: number;
    riskCompliance?: number;
  };
  implementationCosts: {
    pilotPhase: number;
    scalePhase?: number;
    optimizationPhase?: number;
  };
  totalPrerequisiteCost: number;
  totalImplementationCost: number;
  totalProjectCost: number;
  timingEstimate: {
    prerequisiteWeeks: number;
    implementationWeeks: number;
    totalWeeks: number;
  };
}

export function estimateProcessDocumentationCost(
  processStepCount: number,
  avgHourlyRate: number
): number {
  const hoursPerStep = 2;
  const overheadHours = 8;
  const totalHours = (processStepCount * hoursPerStep) + overheadHours;
  return totalHours * avgHourlyRate;
}

export function estimateDataFoundationCost(
  dataSourceCount: number,
  avgHourlyRate: number,
  dataRiskScore: number
): number {
  const baseHours = 40;
  const hoursPerSource = 8;
  const riskMultiplier = dataRiskScore > 60 ? 1.5 : dataRiskScore > 40 ? 1.25 : 1.0;

  const totalHours = (baseHours + (dataSourceCount * hoursPerSource)) * riskMultiplier;
  return totalHours * avgHourlyRate;
}

export function estimateTeamEnablementCost(
  teamSize: number,
  literacyScore: number,
  avgHourlyRate: number
): number {
  const literacyGap = 70 - literacyScore;
  const hoursPerPerson = literacyGap > 40 ? 24 : literacyGap > 20 ? 16 : 8;
  const trainingCostPerPerson = hoursPerPerson * avgHourlyRate;

  const materialsCost = teamSize * 500;

  return (teamSize * trainingCostPerPerson) + materialsCost;
}

export function estimateBusinessCaseCost(avgHourlyRate: number): number {
  const analysisHours = 24;
  return analysisHours * avgHourlyRate;
}

export function estimateRiskComplianceCost(
  processComplexity: number,
  avgHourlyRate: number
): number {
  const baseHours = 32;
  const complexityHours = processComplexity * 4;
  const totalHours = baseHours + complexityHours;
  return totalHours * avgHourlyRate;
}

export function estimatePilotImplementationCost(
  processCost: ProcessCostSummary,
  teamSize: number,
  avgHourlyRate: number
): number {
  const baseDevelopmentHours = 120;
  const configHoursPerStep = 8;
  const testingHours = 40;

  const totalDevHours = baseDevelopmentHours +
    (processCost.stepBreakdowns.length * configHoursPerStep) +
    testingHours;

  const developmentCost = totalDevHours * avgHourlyRate * 1.5;
  const toolingCost = processCost.totalToolCost * 3;
  const trainingCost = teamSize * 4 * avgHourlyRate;

  return developmentCost + toolingCost + trainingCost;
}

export function estimateScaleImplementationCost(
  pilotCost: number,
  processCost: ProcessCostSummary,
  teamSize: number
): number {
  const scaleMultiplier = 1.5;
  const additionalIntegrationCost = processCost.totalToolCost * 6;
  const fullTeamTraining = teamSize * processCost.totalLaborCost * 0.1;

  return (pilotCost * scaleMultiplier) + additionalIntegrationCost + fullTeamTraining;
}

export function estimateOptimizationCost(
  processCost: ProcessCostSummary,
  avgHourlyRate: number
): number {
  const monthlyMonitoring = 8 * avgHourlyRate;
  const annualEnhancements = 40 * avgHourlyRate;
  const annualToolMaintenance = processCost.totalToolCost * 12;

  return monthlyMonitoring * 12 + annualEnhancements + annualToolMaintenance;
}

export function estimateRoadmapTimeline(
  prerequisitePhases: string[],
  processComplexity: number,
  literacyScore: number
): { prerequisiteWeeks: number; implementationWeeks: number; totalWeeks: number } {
  let prerequisiteWeeks = 0;

  for (const phase of prerequisitePhases) {
    if (phase.includes('Process Documentation')) {
      prerequisiteWeeks += Math.ceil(processComplexity * 0.5) + 2;
    }
    if (phase.includes('Data Quality')) {
      prerequisiteWeeks += 7;
    }
    if (phase.includes('Team Literacy')) {
      const literacyGap = 70 - literacyScore;
      prerequisiteWeeks += literacyGap > 40 ? 10 : literacyGap > 20 ? 7 : 5;
    }
    if (phase.includes('Budget Allocation')) {
      prerequisiteWeeks += 3;
    }
    if (phase.includes('Risk & Compliance')) {
      prerequisiteWeeks += Math.ceil(processComplexity * 0.7) + 4;
    }
  }

  const pilotWeeks = processComplexity >= 8 ? 10 : processComplexity >= 5 ? 8 : 6;
  const scaleWeeks = processComplexity >= 5 ? 9 : 0;
  const optimizationWeeks = processComplexity >= 5 ? 4 : 3;

  const implementationWeeks = pilotWeeks + scaleWeeks + optimizationWeeks;

  return {
    prerequisiteWeeks,
    implementationWeeks,
    totalWeeks: prerequisiteWeeks + implementationWeeks
  };
}

export function calculateRoadmapCostEstimate(
  processCost: ProcessCostSummary,
  failures: string[],
  teamSize: number,
  dataSourceCount: number,
  literacyScore: number,
  dataRiskScore: number,
  avgHourlyRate: number
): RoadmapCostEstimate {
  const prerequisiteCosts: RoadmapCostEstimate['prerequisiteCosts'] = {};

  if (failures.includes('Process Documentation')) {
    prerequisiteCosts.processDocumentation = estimateProcessDocumentationCost(
      processCost.stepBreakdowns.length,
      avgHourlyRate
    );
  }

  if (failures.includes('Data Quality')) {
    prerequisiteCosts.dataFoundation = estimateDataFoundationCost(
      dataSourceCount,
      avgHourlyRate,
      dataRiskScore
    );
  }

  if (failures.includes('Team Literacy')) {
    prerequisiteCosts.teamEnablement = estimateTeamEnablementCost(
      teamSize,
      literacyScore,
      avgHourlyRate
    );
  }

  if (failures.includes('Budget Allocation')) {
    prerequisiteCosts.businessCase = estimateBusinessCaseCost(avgHourlyRate);
  }

  if (failures.includes('Risk & Compliance')) {
    prerequisiteCosts.riskCompliance = estimateRiskComplianceCost(
      processCost.stepBreakdowns.length,
      avgHourlyRate
    );
  }

  const totalPrerequisiteCost = Object.values(prerequisiteCosts).reduce((sum, cost) => sum + (cost || 0), 0);

  const pilotCost = estimatePilotImplementationCost(processCost, teamSize, avgHourlyRate);
  const complexity = processCost.stepBreakdowns.length;

  const implementationCosts = {
    pilotPhase: pilotCost,
    scalePhase: complexity >= 5 ? estimateScaleImplementationCost(pilotCost, processCost, teamSize) : undefined,
    optimizationPhase: estimateOptimizationCost(processCost, avgHourlyRate)
  };

  const totalImplementationCost =
    implementationCosts.pilotPhase +
    (implementationCosts.scalePhase || 0) +
    (implementationCosts.optimizationPhase || 0);

  const timingEstimate = estimateRoadmapTimeline(
    failures,
    processCost.stepBreakdowns.length,
    literacyScore
  );

  return {
    prerequisiteCosts,
    implementationCosts,
    totalPrerequisiteCost,
    totalImplementationCost,
    totalProjectCost: totalPrerequisiteCost + totalImplementationCost,
    timingEstimate
  };
}
