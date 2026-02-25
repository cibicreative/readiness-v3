import type { Database } from './database.types';
import type { ExecutiveMetrics, GateStatus } from './executiveScoring';
import type { RoadmapCostEstimate } from './costCalculation';
import { formatCurrency } from './costCalculation';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];

export interface RoadmapPhase {
  phase: number;
  name: string;
  duration: string;
  objective: string;
  actions: string[];
  successCriteria: string[];
  estimatedCost?: string;
}

export interface ProcessRoadmap {
  processId: string;
  processName: string;
  currentStatus: string;
  overallTimeline: string;
  phases: RoadmapPhase[];
  criticalPath: string[];
  dependencies: string[];
}

function getGateFailures(gateStatus: GateStatus): string[] {
  const failures: string[] = [];
  if (gateStatus.processGate === 'fail') failures.push('Process Documentation');
  if (gateStatus.dataGate === 'fail') failures.push('Data Quality');
  if (gateStatus.peopleGate === 'fail') failures.push('Team Literacy');
  if (gateStatus.financeGate === 'fail') failures.push('Budget Allocation');
  if (gateStatus.guardrailsGate === 'fail') failures.push('Risk & Compliance');
  return failures;
}

function generatePrerequisitePhases(
  process: Process,
  metrics: ExecutiveMetrics,
  steps: ProcessStep[],
  costEstimate?: RoadmapCostEstimate
): RoadmapPhase[] {
  const phases: RoadmapPhase[] = [];
  const failures = getGateFailures(metrics.gateStatus);

  if (failures.length === 0) {
    return phases;
  }

  if (failures.includes('Process Documentation')) {
    const cost = costEstimate?.prerequisiteCosts.processDocumentation;
    const duration = costEstimate
      ? `${Math.ceil(steps.length * 0.5) + 2}-${Math.ceil(steps.length * 0.5) + 4} weeks`
      : '4-6 weeks';

    phases.push({
      phase: 0,
      name: 'Process Documentation',
      duration,
      objective: 'Complete process mapping and documentation to enable automation planning',
      actions: [
        'Conduct detailed process walkthrough with process owner',
        'Document each step with inputs, outputs, and decision points',
        'Create process flowcharts and standard operating procedures',
        'Validate documentation with stakeholders',
        'Establish process performance baseline metrics'
      ],
      successCriteria: [
        'Documentation completeness score reaches 70%+',
        'All steps clearly defined with owners',
        'Process flow diagram approved by stakeholders'
      ],
      estimatedCost: cost ? formatCurrency(cost) : '$5,000-$15,000'
    });
  }

  if (failures.includes('Data Quality')) {
    const cost = costEstimate?.prerequisiteCosts.dataFoundation;

    phases.push({
      phase: phases.length,
      name: 'Data Foundation',
      duration: '6-8 weeks',
      objective: 'Improve data quality and establish data governance to support automation',
      actions: [
        'Conduct data quality audit across all process data sources',
        'Implement data validation rules and quality checks',
        'Establish data ownership and stewardship roles',
        'Create data cleaning and enrichment workflows',
        'Set up data quality monitoring dashboards'
      ],
      successCriteria: [
        'Data risk score reduced below 45',
        'Data quality metrics tracked and improving',
        'Source of truth identified for each data element'
      ],
      estimatedCost: cost ? formatCurrency(cost) : '$10,000-$40,000'
    });
  }

  if (failures.includes('Team Literacy')) {
    const literacyScore = process.literacy_fit_score || 0;
    const literacyGap = 70 - literacyScore;
    const trainingIntensity = literacyScore < 30 ? 'comprehensive' : literacyScore < 50 ? 'moderate' : 'light';
    const cost = costEstimate?.prerequisiteCosts.teamEnablement;

    const duration = costEstimate && literacyGap > 0
      ? `${literacyGap > 40 ? 8 : literacyGap > 20 ? 6 : 4}-${literacyGap > 40 ? 12 : literacyGap > 20 ? 8 : 6} weeks`
      : trainingIntensity === 'comprehensive' ? '8-12 weeks' : trainingIntensity === 'moderate' ? '6-8 weeks' : '4-6 weeks';

    phases.push({
      phase: phases.length,
      name: 'Team Enablement',
      duration,
      objective: 'Build team AI literacy and change readiness for automation adoption',
      actions: [
        `Assess current literacy levels and learning gaps (Current: ${literacyScore}%)`,
        'Design tailored training program for team skill level',
        'Conduct hands-on workshops with real process examples',
        'Establish AI champions within the team',
        'Create ongoing learning resources and support system'
      ],
      successCriteria: [
        'Team literacy score reaches 70%+',
        'All team members complete core training modules',
        'At least 2 team members certified as AI champions'
      ],
      estimatedCost: cost
        ? formatCurrency(cost)
        : trainingIntensity === 'comprehensive' ? '$15,000-$30,000' : trainingIntensity === 'moderate' ? '$10,000-$20,000' : '$5,000-$15,000'
    });
  }

  if (failures.includes('Budget Allocation')) {
    const cost = costEstimate?.prerequisiteCosts.businessCase;

    phases.push({
      phase: phases.length,
      name: 'Business Case Development',
      duration: '3-4 weeks',
      objective: 'Build compelling ROI case and secure budget approval',
      actions: [
        'Calculate detailed cost-benefit analysis with ROI projections',
        'Identify quick wins and measurable value opportunities',
        'Develop phased investment plan with milestones',
        'Present business case to decision-makers',
        'Secure budget commitment and funding approval'
      ],
      successCriteria: [
        'Budget approved and allocated',
        'ROI targets agreed upon',
        'Funding released for Phase 1 implementation'
      ],
      estimatedCost: cost ? formatCurrency(cost) : '$3,000-$8,000'
    });
  }

  if (failures.includes('Risk & Compliance')) {
    const cost = costEstimate?.prerequisiteCosts.riskCompliance;
    const duration = costEstimate
      ? `${Math.ceil(steps.length * 0.7) + 4}-${Math.ceil(steps.length * 0.7) + 8} weeks`
      : '6-10 weeks';

    phases.push({
      phase: phases.length,
      name: 'Risk Mitigation & Compliance',
      duration,
      objective: 'Establish guardrails and compliance frameworks for safe automation',
      actions: [
        'Conduct comprehensive risk assessment',
        'Design human oversight and approval workflows',
        'Implement compliance monitoring and audit trails',
        'Establish escalation procedures for edge cases',
        'Create governance framework for AI use'
      ],
      successCriteria: [
        'Risk mitigation plan approved',
        'Compliance requirements documented and validated',
        'Guardrails framework implemented and tested'
      ],
      estimatedCost: cost ? formatCurrency(cost) : '$15,000-$40,000'
    });
  }

  return phases.map((phase, idx) => ({ ...phase, phase: idx }));
}

function generateImplementationPhases(
  process: Process,
  metrics: ExecutiveMetrics,
  steps: ProcessStep[],
  prerequisitePhases: RoadmapPhase[],
  costEstimate?: RoadmapCostEstimate
): RoadmapPhase[] {
  const phases: RoadmapPhase[] = [];
  const startPhase = prerequisitePhases.length;

  const complexity = steps.length;
  const isHighValue = metrics.valueScore >= 60;

  const pilotCost = costEstimate?.implementationCosts.pilotPhase;
  const pilotDuration = costEstimate
    ? `${complexity >= 8 ? 8 : complexity >= 5 ? 6 : 4}-${complexity >= 8 ? 12 : complexity >= 5 ? 10 : 8} weeks`
    : complexity >= 8 ? '8-12 weeks' : complexity >= 5 ? '6-10 weeks' : '4-8 weeks';

  phases.push({
    phase: startPhase,
    name: 'Pilot Implementation',
    duration: pilotDuration,
    objective: 'Deploy initial automation with limited scope to validate approach',
    actions: [
      'Select 1-2 subprocess for pilot (highest value, lowest risk)',
      'Design automation solution with vendor/technology selection',
      'Build and configure automation tools',
      'Conduct user acceptance testing with pilot team',
      'Deploy pilot and monitor performance closely'
    ],
    successCriteria: [
      'Pilot automation deployed and running',
      'Initial performance metrics meet targets',
      'User feedback collected and positive',
      'No major issues or blockers identified'
    ],
    estimatedCost: pilotCost
      ? formatCurrency(pilotCost)
      : metrics.investmentCategory === 'AI implementation'
      ? '$50,000-$100,000'
      : metrics.investmentCategory === 'automation' || metrics.investmentCategory === 'traditional software'
      ? '$25,000-$75,000'
      : '$10,000-$40,000'
  });

  if (complexity >= 5 || isHighValue) {
    const scaleCost = costEstimate?.implementationCosts.scalePhase;
    const optimizationCost = costEstimate?.implementationCosts.optimizationPhase;

    phases.push({
      phase: startPhase + 1,
      name: 'Scale Rollout',
      duration: '6-12 weeks',
      objective: 'Expand automation to full process scope across all users',
      actions: [
        'Incorporate lessons learned from pilot',
        'Extend automation to remaining process steps',
        'Train all users on new automated workflows',
        'Migrate data and transition from old to new process',
        'Implement full monitoring and support infrastructure'
      ],
      successCriteria: [
        'Full process automated and in production',
        'All users trained and transitioned',
        'Performance targets consistently met',
        'Old manual process deprecated'
      ],
      estimatedCost: scaleCost
        ? formatCurrency(scaleCost)
        : metrics.investmentCategory === 'AI implementation'
        ? '$75,000-$150,000'
        : metrics.investmentCategory === 'automation' || metrics.investmentCategory === 'traditional software'
        ? '$40,000-$100,000'
        : '$20,000-$60,000'
    });

    phases.push({
      phase: startPhase + 2,
      name: 'Optimize & Enhance',
      duration: 'Ongoing',
      objective: 'Continuously improve performance and add advanced capabilities',
      actions: [
        'Monitor KPIs and identify optimization opportunities',
        'Implement advanced features based on user feedback',
        'Automate exception handling and edge cases',
        'Integrate with additional systems and data sources',
        'Establish continuous improvement process'
      ],
      successCriteria: [
        'Process performance exceeds baseline by 30%+',
        'Exception rate reduced below 5%',
        'User satisfaction score 8+/10',
        'ROI targets achieved or exceeded'
      ],
      estimatedCost: optimizationCost
        ? `${formatCurrency(optimizationCost)} annually`
        : '$10,000-$30,000 annually'
    });
  } else {
    const optimizationCost = costEstimate?.implementationCosts.optimizationPhase;

    phases.push({
      phase: startPhase + 1,
      name: 'Optimization',
      duration: '4-6 weeks',
      objective: 'Fine-tune automation and achieve target performance',
      actions: [
        'Gather user feedback and identify improvements',
        'Optimize automation rules and workflows',
        'Add monitoring and alerting for key metrics',
        'Document lessons learned and best practices'
      ],
      successCriteria: [
        'Process performance meets or exceeds targets',
        'User adoption at 90%+',
        'Positive ROI demonstrated'
      ],
      estimatedCost: optimizationCost
        ? formatCurrency(optimizationCost)
        : '$5,000-$15,000'
    });
  }

  return phases;
}

export function generateProcessRoadmap(
  process: Process,
  steps: ProcessStep[],
  metrics: ExecutiveMetrics,
  costEstimate?: RoadmapCostEstimate
): ProcessRoadmap {
  const prerequisitePhases = generatePrerequisitePhases(process, metrics, steps, costEstimate);
  const implementationPhases = generateImplementationPhases(process, metrics, steps, prerequisitePhases, costEstimate);

  const allPhases = [...prerequisitePhases, ...implementationPhases];

  const criticalPath: string[] = [];
  const failures = getGateFailures(metrics.gateStatus);

  if (metrics.sequencingBucket === 'avoid') {
    criticalPath.push('Process does not meet investment criteria - recommend deferring indefinitely or eliminating');
  } else if (metrics.sequencingBucket === 'defer') {
    criticalPath.push('High-risk or insufficient value - delay until market/organizational conditions improve');
  } else {
    if (failures.length > 0) {
      criticalPath.push(`Complete prerequisites: ${failures.join(', ')}`);
    }
    criticalPath.push('Execute pilot with controlled scope');
    if (allPhases.length > prerequisitePhases.length + 1) {
      criticalPath.push('Scale to full implementation');
      criticalPath.push('Optimize and measure ROI');
    }
  }

  const dependencies: string[] = [];
  if (failures.includes('Team Literacy')) {
    dependencies.push('Team training must complete before pilot launch');
  }
  if (failures.includes('Data Quality')) {
    dependencies.push('Data foundation work is prerequisite for automation build');
  }
  if (failures.includes('Process Documentation')) {
    dependencies.push('Process documentation gates all subsequent work');
  }

  const totalWeeks = costEstimate
    ? costEstimate.timingEstimate.totalWeeks
    : allPhases.reduce((sum, phase) => {
        const match = phase.duration.match(/(\d+)-(\d+)\s+weeks?/);
        if (match) {
          return sum + parseInt(match[2]);
        }
        return sum;
      }, 0);

  const overallTimeline = totalWeeks > 0
    ? costEstimate
      ? `${Math.floor(totalWeeks / 4)}-${Math.ceil((totalWeeks + 2) / 4)} months`
      : `${Math.floor(totalWeeks / 4)}-${Math.ceil(totalWeeks / 4)} months`
    : 'Not recommended';

  let currentStatus = '';
  if (metrics.sequencingBucket === 'do_now') {
    currentStatus = 'Ready to start - all gates passed';
  } else if (metrics.sequencingBucket === 'prepare') {
    currentStatus = `Prerequisites needed: ${failures.join(', ') || 'Building readiness'}`;
  } else if (metrics.sequencingBucket === 'defer') {
    currentStatus = 'Defer - timing not optimal';
  } else {
    currentStatus = 'Not recommended for investment';
  }

  return {
    processId: process.id,
    processName: process.name,
    currentStatus,
    overallTimeline,
    phases: allPhases,
    criticalPath,
    dependencies
  };
}
