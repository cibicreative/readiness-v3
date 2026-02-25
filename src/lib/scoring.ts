import type { Database } from './database.types';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type DataSource = Database['public']['Tables']['data_sources']['Row'];
type DataTrustProfile = Database['public']['Tables']['data_trust_profiles']['Row'];
type LiteracyAssessment = Database['public']['Tables']['literacy_assessments']['Row'];

export function calculateDocumentationScore(
  process: Process,
  steps: ProcessStep[],
  linkedDataSources: DataSource[]
): number {
  let score = 0;

  if (process.description && process.description.length > 20) score += 20;
  if (process.owner_role) score += 20;
  if (process.frequency) score += 20;
  if (steps.length > 0) score += 20;
  if (linkedDataSources.length > 0) score += 20;

  return Math.min(score, 100);
}

export function calculateAutomationPotentialScore(
  process: Process,
  steps: ProcessStep[]
): number {
  if (steps.length === 0) return 0;

  const totalTime = steps.reduce((sum, step) => sum + (step.average_time_minutes || 0), 0);

  const frequencyMultiplier: Record<string, number> = {
    'daily': 5,
    'weekly': 3,
    'monthly': 1,
    'quarterly': 0.5,
    'ad hoc': 0.3
  };

  const freqScore = frequencyMultiplier[process.frequency || 'ad hoc'] || 0.3;

  const ruleBasedFactors = steps.map(step => {
    if (step.is_rule_based === 'mostly_rules') return 1;
    if (step.is_rule_based === 'mixed') return 0.5;
    if (step.is_rule_based === 'mostly_judgment') return 0.2;
    return 0.5;
  });

  const avgRuleBased = ruleBasedFactors.reduce((a, b) => a + b, 0) / ruleBasedFactors.length;

  const timeScore = Math.min(totalTime / 60, 5);

  const rawScore = (timeScore + freqScore + (avgRuleBased * 5)) * 6.67;

  return Math.round(Math.min(rawScore, 100));
}

export function calculateDataRiskScore(
  process: Process,
  linkedDataSources: DataSource[],
  trustProfiles: DataTrustProfile[]
): number {
  if (linkedDataSources.length === 0) return 0;

  const trustScores = trustProfiles.map(profile => {
    const completenessScore = profile.completeness === 'low' ? 3 : profile.completeness === 'medium' ? 2 : 1;
    const accuracyScore = profile.accuracy === 'low' ? 3 : profile.accuracy === 'medium' ? 2 : 1;
    const timelinessScore = profile.timeliness === 'low' ? 3 : profile.timeliness === 'medium' ? 2 : 1;
    const governanceScore = profile.governance === 'low' ? 3 : profile.governance === 'medium' ? 2 : 1;

    return (completenessScore + accuracyScore + timelinessScore + governanceScore) / 4;
  });

  const avgTrustScore = trustScores.length > 0
    ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length
    : 2;

  let riskScore = (avgTrustScore - 1) * 50;

  if (process.is_compliance_sensitive) {
    riskScore += 20;
  }

  return Math.round(Math.min(riskScore, 100));
}

export function calculateLiteracyFitScore(
  assessments: LiteracyAssessment[]
): number {
  if (assessments.length === 0) return 0;

  const levelScores: Record<string, number> = {
    'novice': 1,
    'basic': 2,
    'applied': 3,
    'optimizer': 4
  };

  const scores = assessments
    .map(a => levelScores[a.overall_level || 'novice'] || 1);

  const minScore = Math.min(...scores);

  const normalized = ((minScore - 1) / 3) * 100;

  return Math.round(normalized);
}

export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function isShareTokenValid(
  shareEnabled: boolean,
  shareExpiresAt: string | null
): boolean {
  if (!shareEnabled) return false;
  if (!shareExpiresAt) return true;

  const expiryDate = new Date(shareExpiresAt);
  return expiryDate > new Date();
}
