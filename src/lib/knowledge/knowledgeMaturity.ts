import { supabase } from '../supabase';

export interface KnowledgeMaturityMetrics {
  percentProcessesWithDocs: number;
  averageMaturity: number;
  staleDocCount: number;
  missingDocCount: number;
}

export interface ProcessMaturityDetail {
  processId: string;
  processName: string;
  maturityScore: number;
  hasDoc: boolean;
  reasons: string[];
}

/**
 * Calculate knowledge maturity score for a single process
 *
 * Scoring breakdown:
 * - 0 if no process-derived knowledge doc exists
 * - +25 if doc exists with a current_version
 * - +25 if process has >= 5 steps
 * - +25 if process has any tools_required populated in steps
 * - +25 if knowledge doc updated within last 30 days
 *
 * Maximum score: 100
 */
async function calculateProcessMaturity(
  processId: string,
  processName: string
): Promise<ProcessMaturityDetail> {
  let score = 0;
  const reasons: string[] = [];
  let hasDoc = false;

  // Check if a knowledge document exists for this process
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('id, current_version_id, updated_at')
    .eq('doc_type', 'process')
    .eq('source_entity_type', 'process')
    .eq('source_entity_id', processId)
    .maybeSingle();

  if (!doc) {
    reasons.push('No documentation');
    return {
      processId,
      processName,
      maturityScore: 0,
      hasDoc: false,
      reasons
    };
  }

  hasDoc = true;

  // +25 if doc exists with current_version
  if (doc.current_version_id) {
    score += 25;
    reasons.push('Has current version');
  } else {
    reasons.push('Missing current version');
  }

  // Check if process has >= 5 steps
  const { count: stepCount } = await supabase
    .from('process_steps')
    .select('id', { count: 'exact', head: true })
    .eq('process_id', processId);

  if (stepCount && stepCount >= 5) {
    score += 25;
    reasons.push('Has 5+ steps');
  }

  // Check if any step has tools_required (tool_id populated)
  const { data: stepsWithTools } = await supabase
    .from('process_steps')
    .select('id')
    .eq('process_id', processId)
    .not('tool_id', 'is', null)
    .limit(1);

  if (stepsWithTools && stepsWithTools.length > 0) {
    score += 25;
    reasons.push('Tools specified');
  }

  // +25 if doc updated within last 30 days
  if (doc.updated_at) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const updatedAt = new Date(doc.updated_at);

    if (updatedAt >= thirtyDaysAgo) {
      score += 25;
      reasons.push('Recently updated');
    } else {
      reasons.push('Stale (>30 days old)');
    }
  }

  return {
    processId,
    processName,
    maturityScore: score,
    hasDoc,
    reasons
  };
}

/**
 * Calculate aggregate knowledge maturity metrics for a client
 */
export async function calculateKnowledgeMaturityForClient(
  clientId: string
): Promise<KnowledgeMaturityMetrics> {
  // Get all processes for the client
  const { data: processes, error } = await supabase
    .from('processes')
    .select('id, name')
    .eq('client_id', clientId);

  if (error || !processes || processes.length === 0) {
    return {
      percentProcessesWithDocs: 0,
      averageMaturity: 0,
      staleDocCount: 0,
      missingDocCount: 0
    };
  }

  // Calculate maturity for each process
  const maturityDetails = await Promise.all(
    processes.map(p => calculateProcessMaturity(p.id, p.name))
  );

  const totalProcesses = maturityDetails.length;
  const processesWithDocs = maturityDetails.filter(p => p.hasDoc).length;
  const percentProcessesWithDocs = totalProcesses > 0
    ? Math.round((processesWithDocs / totalProcesses) * 100)
    : 0;

  const totalMaturity = maturityDetails.reduce((sum, p) => sum + p.maturityScore, 0);
  const averageMaturity = totalProcesses > 0
    ? Math.round(totalMaturity / totalProcesses)
    : 0;

  const staleDocCount = maturityDetails.filter(p =>
    p.hasDoc && p.reasons.includes('Stale (>30 days old)')
  ).length;

  const missingDocCount = maturityDetails.filter(p => !p.hasDoc).length;

  return {
    percentProcessesWithDocs,
    averageMaturity,
    staleDocCount,
    missingDocCount
  };
}

/**
 * Get detailed maturity breakdown for all processes
 */
export async function getProcessMaturityDetails(
  clientId: string
): Promise<ProcessMaturityDetail[]> {
  const { data: processes, error } = await supabase
    .from('processes')
    .select('id, name')
    .eq('client_id', clientId);

  if (error || !processes) {
    return [];
  }

  return await Promise.all(
    processes.map(p => calculateProcessMaturity(p.id, p.name))
  );
}
