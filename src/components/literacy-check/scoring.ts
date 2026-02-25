import { QUESTIONS, DOMAIN_WEIGHTS, Domain } from './questions';

export type LiteracyLevel = 'novice' | 'basic' | 'applied' | 'optimizer';
export type Confidence = 'low' | 'medium' | 'high';
export type CalibrationFlag = 'aligned' | 'overconfident risk' | 'underconfident potential';

export interface DomainScores {
  ai_knowledge: number;
  data_competency: number;
  automation: number;
}

export interface AssessmentResults {
  overallScore: number;
  overallLevel: LiteracyLevel;
  selfConfidence: Confidence;
  calibrationFlag: CalibrationFlag;
  domainScores: DomainScores;
  topRisks: string[];
  nextActions: string[];
  timestamp: string;
  version: string;
}

export interface UserAnswers {
  [questionId: string]: string;
}

function calculateDomainScore(domain: Domain, answers: UserAnswers): number {
  const domainQuestions = QUESTIONS.filter(q => q.domain === domain);
  if (domainQuestions.length === 0) return 0;

  let totalPoints = 0;
  let maxPoints = 0;

  domainQuestions.forEach(question => {
    const answerId = answers[question.id];
    const selectedOption = question.options.find(opt => opt.id === answerId);

    if (selectedOption) {
      totalPoints += selectedOption.points;
    }

    maxPoints += Math.max(...question.options.map(opt => opt.points));
  });

  return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
}

function calculateOverallScore(domainScores: DomainScores): number {
  let weightedSum = 0;

  (Object.keys(DOMAIN_WEIGHTS) as Domain[]).forEach(domain => {
    weightedSum += domainScores[domain] * DOMAIN_WEIGHTS[domain];
  });

  return Math.round(weightedSum);
}

function getLevel(score: number): LiteracyLevel {
  if (score >= 80) return 'optimizer';
  if (score >= 55) return 'applied';
  if (score >= 30) return 'basic';
  return 'novice';
}

function getConfidenceNumeric(confidence: Confidence): number {
  switch (confidence) {
    case 'low': return 30;
    case 'medium': return 60;
    case 'high': return 85;
  }
}

function calculateCalibration(
  overallScore: number,
  confidence: Confidence
): CalibrationFlag {
  const confidenceNumeric = getConfidenceNumeric(confidence);
  const diff = confidenceNumeric - overallScore;

  if (diff >= 25) return 'overconfident risk';
  if (diff <= -25) return 'underconfident potential';
  return 'aligned';
}

function getLowestDomains(domainScores: DomainScores): Domain[] {
  const sorted = (Object.entries(domainScores) as [Domain, number][])
    .sort((a, b) => a[1] - b[1]);

  return [sorted[0][0], sorted[1][0]];
}

const RISK_LIBRARY: Record<Domain, string[]> = {
  ai_knowledge: [
    'Risk of exposing confidential data through public AI tools without understanding privacy implications',
    'AI-generated errors and hallucinations may go undetected, leading to incorrect work outputs',
    'Using AI without proper review or validation could result in compliance violations or reputational damage',
  ],
  data_competency: [
    'Poor data handling practices could lead to data breaches or privacy violations',
    'Inability to work effectively with data limits contribution to data-driven decision making',
    'Lack of data quality awareness leads to decisions based on inaccurate or incomplete information',
  ],
  automation: [
    'Missing automation opportunities results in wasted time on repetitive manual tasks',
    'Inability to streamline workflows limits personal productivity and team efficiency',
    'Lack of process thinking prevents participation in improvement initiatives',
  ],
};

const ACTION_LIBRARY: Record<Domain, string[]> = {
  ai_knowledge: [
    'Complete AI fundamentals training covering prompting, ethics, privacy, and guardrails',
    'Practice prompt engineering techniques to improve AI output quality',
    'Learn your company\'s AI usage policies and data classification guidelines',
    'Start with low-risk AI use cases and always review outputs before use',
  ],
  data_competency: [
    'Take a course on data fundamentals, Excel/Google Sheets, or basic analytics',
    'Learn to identify and handle sensitive data according to company policies',
    'Practice data cleaning and validation techniques on sample datasets',
    'Understand key privacy regulations (GDPR, CCPA) relevant to your role',
  ],
  automation: [
    'Identify 3-5 repetitive tasks in your workflow that could be automated',
    'Learn a no-code automation tool like Zapier, Make, or Power Automate',
    'Document your current processes before attempting to automate them',
    'Start small with simple automations (email rules, templates) and build up',
  ],
};

function generateRisksAndActions(domainScores: DomainScores) {
  const lowestDomains = getLowestDomains(domainScores);

  const topRisks: string[] = [];
  const nextActions: string[] = [];

  lowestDomains.forEach((domain, index) => {
    if (index === 0) {
      topRisks.push(...RISK_LIBRARY[domain]);
      nextActions.push(...ACTION_LIBRARY[domain]);
    } else {
      topRisks.push(RISK_LIBRARY[domain][0]);
      nextActions.push(ACTION_LIBRARY[domain][0]);
    }
  });

  return {
    topRisks: topRisks.slice(0, 3),
    nextActions: nextActions.slice(0, 3),
  };
}

export function calculateResults(
  answers: UserAnswers,
  confidence: Confidence
): AssessmentResults {
  const domainScores: DomainScores = {
    ai_knowledge: calculateDomainScore('ai_knowledge', answers),
    data_competency: calculateDomainScore('data_competency', answers),
    automation: calculateDomainScore('automation', answers),
  };

  const overallScore = calculateOverallScore(domainScores);
  const overallLevel = getLevel(overallScore);
  const calibrationFlag = calculateCalibration(overallScore, confidence);
  const { topRisks, nextActions } = generateRisksAndActions(domainScores);

  return {
    overallScore,
    overallLevel,
    selfConfidence: confidence,
    calibrationFlag,
    domainScores,
    topRisks,
    nextActions,
    timestamp: new Date().toISOString(),
    version: 'v1',
  };
}
