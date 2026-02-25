/**
 * Process Knowledge Document Template
 * Generates deterministic markdown content from process data
 * No LLM inference - uses actual data only
 */

export type GateStatus = 'pass' | 'yellow' | 'fail' | 'unknown';

export interface ProcessStep {
  step_number: number;
  name: string;
  description: string | null;
  inputs: string | null;
  outputs: string | null;
  responsible_role: string | null;
  tools_required: string[] | null;
  estimated_duration: number | null; // minutes
}

export interface ProcessKnowledgeInput {
  clientId: string;
  processId: string;
  processName: string;
  processDescription: string | null;
  category: string | null;
  frequency: string | null;
  trigger: string | null;
  desired_outcome: string | null;
  is_customer_facing: boolean;
  is_compliance_sensitive: boolean;

  // Scores
  scores: {
    business_case_score: number;
    data_readiness_score: number;
    technical_feasibility_score: number;
    org_capability_score: number;
    risk_score: number;
    market_timing_score: number;
    overall_score: number;
  };

  // Sequencing
  sequencing_bucket: string | null; // 'do_now' | 'prepare' | 'defer' | 'avoid'

  // Cost estimates
  dev_cost_est: number | null;
  integration_cost_est: number | null;
  training_cost_est: number | null;

  // Risks
  technical_risk: string | null;
  organizational_risk: string | null;
  data_quality_risk: string | null;

  // Steps
  steps: ProcessStep[];
}

export interface ProcessKnowledgeOutput {
  title: string;
  slug: string;
  frontMatter: string;
  markdown: string;
  metadataJson: Record<string, unknown>;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '(not specified)';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '(not specified)';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}

function formatScore(score: number): string {
  return `${score}/100`;
}

function getScoreStatus(score: number): GateStatus {
  if (score >= 70) return 'pass';
  if (score >= 40) return 'yellow';
  if (score > 0) return 'fail';
  return 'unknown';
}

function formatBucket(bucket: string | null): string {
  if (!bucket) return '(not specified)';
  const bucketMap: Record<string, string> = {
    'do_now': 'Do Now',
    'prepare': 'Prepare',
    'defer': 'Defer',
    'avoid': 'Avoid'
  };
  return bucketMap[bucket] || bucket;
}

function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function formatList(items: string[] | null | undefined): string {
  if (!items || items.length === 0) return '(none captured)';
  return items.map(item => `- ${item}`).join('\n');
}

export function buildProcessKnowledgeMarkdown(
  input: ProcessKnowledgeInput,
  versionNumber: number,
  isoNow: string
): ProcessKnowledgeOutput {
  const title = `Process: ${input.processName}`;
  const slug = `process-${input.processName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')}`;

  // Calculate total cost
  const totalCost = (input.dev_cost_est || 0) + (input.integration_cost_est || 0) + (input.training_cost_est || 0);

  // Build YAML front matter
  const frontMatterObj = {
    doc_type: 'process',
    client_id: input.clientId,
    process_id: input.processId,
    title: input.processName,
    sequencing_bucket: input.sequencing_bucket || null,
    scores: {
      business_case: input.scores.business_case_score,
      data_readiness: input.scores.data_readiness_score,
      technical_feasibility: input.scores.technical_feasibility_score,
      org_capability: input.scores.org_capability_score,
      risk: input.scores.risk_score,
      market_timing: input.scores.market_timing_score,
      overall: input.scores.overall_score
    },
    costs: {
      development: input.dev_cost_est,
      integration: input.integration_cost_est,
      training: input.training_cost_est,
      total: totalCost
    },
    risks: {
      technical: input.technical_risk,
      organizational: input.organizational_risk,
      data_quality: input.data_quality_risk
    },
    last_generated_at: isoNow,
    version: versionNumber
  };

  const frontMatter = `---\n${Object.entries(frontMatterObj)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')}\n---`;

  // Build markdown sections
  const sections: string[] = [];

  // Title
  sections.push(`# Process: ${input.processName}`);
  sections.push('');

  // Purpose
  sections.push('## Purpose');
  sections.push(input.processDescription || '(not specified)');
  sections.push('');

  // Executive Snapshot
  sections.push('## Executive Snapshot');
  sections.push('');
  sections.push(`**Category:** ${input.category || '(not specified)'}`);
  sections.push(`**Frequency:** ${input.frequency || '(not specified)'}`);
  sections.push(`**Trigger:** ${input.trigger || '(not specified)'}`);
  sections.push(`**Desired Outcome:** ${input.desired_outcome || '(not specified)'}`);
  sections.push(`**Customer-Facing:** ${formatBoolean(input.is_customer_facing)}`);
  sections.push(`**Compliance-Sensitive:** ${formatBoolean(input.is_compliance_sensitive)}`);
  sections.push('');

  // Scores
  sections.push('## Scores');
  sections.push('');
  sections.push(`- **Business Case:** ${formatScore(input.scores.business_case_score)} (${getScoreStatus(input.scores.business_case_score)})`);
  sections.push(`- **Data Readiness:** ${formatScore(input.scores.data_readiness_score)} (${getScoreStatus(input.scores.data_readiness_score)})`);
  sections.push(`- **Technical Feasibility:** ${formatScore(input.scores.technical_feasibility_score)} (${getScoreStatus(input.scores.technical_feasibility_score)})`);
  sections.push(`- **Organizational Capability:** ${formatScore(input.scores.org_capability_score)} (${getScoreStatus(input.scores.org_capability_score)})`);
  sections.push(`- **Risk:** ${formatScore(input.scores.risk_score)} (${getScoreStatus(input.scores.risk_score)})`);
  sections.push(`- **Market Timing:** ${formatScore(input.scores.market_timing_score)} (${getScoreStatus(input.scores.market_timing_score)})`);
  sections.push(`- **Overall Score:** ${formatScore(input.scores.overall_score)} (${getScoreStatus(input.scores.overall_score)})`);
  sections.push('');

  // Investment Recommendation
  sections.push('## Investment Recommendation');
  sections.push('');
  sections.push(`**Sequencing Bucket:** ${formatBucket(input.sequencing_bucket)}`);
  sections.push('');
  sections.push('This recommendation is based on the composite score across all evaluation dimensions.');
  sections.push('');

  // Cost Estimate
  sections.push('## Cost Estimate');
  sections.push('');
  sections.push(`- **Development:** ${formatCurrency(input.dev_cost_est)}`);
  sections.push(`- **Integration:** ${formatCurrency(input.integration_cost_est)}`);
  sections.push(`- **Training:** ${formatCurrency(input.training_cost_est)}`);
  sections.push(`- **Total Estimated Cost:** ${formatCurrency(totalCost)}`);
  sections.push('');

  // Risk Profile
  sections.push('## Risk Profile');
  sections.push('');
  sections.push('### Technical Risk');
  sections.push(input.technical_risk || '(not specified)');
  sections.push('');
  sections.push('### Organizational Risk');
  sections.push(input.organizational_risk || '(not specified)');
  sections.push('');
  sections.push('### Data Quality Risk');
  sections.push(input.data_quality_risk || '(not specified)');
  sections.push('');

  // Steps
  sections.push('## Steps');
  sections.push('');
  if (input.steps.length === 0) {
    sections.push('(none captured)');
  } else {
    input.steps
      .sort((a, b) => a.step_number - b.step_number)
      .forEach(step => {
        sections.push(`### Step ${step.step_number}: ${step.name}`);
        sections.push('');
        sections.push(step.description || '(not specified)');
        sections.push('');
        if (step.estimated_duration !== null) {
          sections.push(`**Estimated Duration:** ${formatDuration(step.estimated_duration)}`);
          sections.push('');
        }
      });
  }

  // Inputs and Outputs
  sections.push('## Inputs and Outputs');
  sections.push('');
  if (input.steps.length === 0) {
    sections.push('(none captured)');
  } else {
    input.steps
      .sort((a, b) => a.step_number - b.step_number)
      .forEach(step => {
        sections.push(`### Step ${step.step_number}: ${step.name}`);
        sections.push('');
        sections.push('**Inputs:**');
        sections.push(step.inputs || '(not specified)');
        sections.push('');
        sections.push('**Outputs:**');
        sections.push(step.outputs || '(not specified)');
        sections.push('');
      });
  }

  // Roles and Tools
  sections.push('## Roles and Tools');
  sections.push('');
  if (input.steps.length === 0) {
    sections.push('(none captured)');
  } else {
    input.steps
      .sort((a, b) => a.step_number - b.step_number)
      .forEach(step => {
        sections.push(`### Step ${step.step_number}: ${step.name}`);
        sections.push('');
        sections.push(`**Responsible Role:** ${step.responsible_role || '(not specified)'}`);
        sections.push('');
        sections.push('**Tools Required:**');
        sections.push(formatList(step.tools_required));
        sections.push('');
      });
  }

  // Notes
  sections.push('## Notes');
  sections.push('');
  sections.push('This document was generated deterministically from captured process data.');
  sections.push(`Version ${versionNumber} created at ${isoNow}.`);
  sections.push('');

  const markdown = sections.join('\n');

  return {
    title,
    slug,
    frontMatter,
    markdown: `${frontMatter}\n\n${markdown}`,
    metadataJson: {
      generated_at: isoNow,
      version: versionNumber,
      source_type: 'process',
      source_id: input.processId
    }
  };
}
