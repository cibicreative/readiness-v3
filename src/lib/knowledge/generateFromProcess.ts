/**
 * Generate knowledge documents from process data
 * Loads process, computes scores, generates markdown, and saves to database
 */

import { supabase } from '../supabase';
import { sha256 } from './hash';
import { toSlug } from './slug';
import { buildProcessKnowledgeMarkdown, type ProcessKnowledgeInput, type ProcessStep } from './templates/processMarkdown';
import { calculateExecutiveMetrics } from '../executiveScoring';
import type { Database } from '../database.types';

type Process = Database['public']['Tables']['processes']['Row'];
type DBProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

interface GenerateResult {
  documentId: string;
  versionId: string | null;
  versionNumber: number;
  contentHash: string;
  markdown: string;
  noChanges?: boolean;
}

/**
 * Generate or update a knowledge document from a process
 */
export async function generateKnowledgeFromProcess(params: {
  clientId: string;
  processId: string;
}): Promise<GenerateResult> {
  const { clientId, processId } = params;

  // 1. Load process data
  const { data: process, error: processError } = await supabase
    .from('processes')
    .select('*')
    .eq('id', processId)
    .eq('client_id', clientId)
    .single();

  if (processError || !process) {
    throw new Error(`Failed to load process: ${processError?.message || 'Not found'}`);
  }

  // 2. Load process steps
  const { data: steps, error: stepsError } = await supabase
    .from('process_steps')
    .select('*')
    .eq('process_id', processId)
    .order('step_order');

  if (stepsError) {
    throw new Error(`Failed to load process steps: ${stepsError.message}`);
  }

  const processSteps = steps || [];

  // 3. Load roles for step mapping
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('client_id', clientId);

  const rolesMap = new Map<string, Role>();
  (roles || []).forEach(role => rolesMap.set(role.id, role));

  // 4. Load tools for step mapping
  const { data: tools } = await supabase
    .from('tools')
    .select('*');

  const toolsMap = new Map<string, Tool>();
  (tools || []).forEach(tool => toolsMap.set(tool.id, tool));

  // 5. Calculate executive metrics for scoring
  const executiveMetrics = calculateExecutiveMetrics(process, processSteps);

  // 6. Map database steps to template format
  const templateSteps: ProcessStep[] = processSteps.map((step, index) => {
    const role = step.role_id ? rolesMap.get(step.role_id) : null;
    const tool = step.tool_id ? toolsMap.get(step.tool_id) : null;
    const toolsRequired = tool ? [tool.name] : null;

    return {
      step_number: index + 1,
      name: step.title || `Step ${index + 1}`,
      description: step.description,
      inputs: null, // Not captured in current schema
      outputs: null, // Not captured in current schema
      responsible_role: role?.title || null,
      tools_required: toolsRequired,
      estimated_duration: step.average_time_minutes || step.estimated_duration_minutes
    };
  });

  // 7. Map process fields to template input
  // Note: The template expects executive gate scores, but we have different scores
  // We'll map our scores to the closest equivalent executive dimensions
  const templateInput: ProcessKnowledgeInput = {
    clientId,
    processId,
    processName: process.name,
    processDescription: process.description,
    category: process.category,
    frequency: process.frequency,
    trigger: process.trigger,
    desired_outcome: process.desired_outcome,
    is_customer_facing: process.is_customer_facing,
    is_compliance_sensitive: process.is_compliance_sensitive,
    scores: {
      // Map our scores to executive framework
      business_case_score: executiveMetrics.valueScore, // Value = business case
      data_readiness_score: Math.round(100 - (process.data_risk_score || 0)), // Inverse of data risk
      technical_feasibility_score: executiveMetrics.feasibilityScore,
      org_capability_score: process.literacy_fit_score || 0,
      risk_score: process.data_risk_score || 0,
      market_timing_score: process.documentation_completeness_score || 0, // Use doc completeness as proxy
      overall_score: Math.round((executiveMetrics.valueScore + executiveMetrics.feasibilityScore) / 2)
    },
    sequencing_bucket: executiveMetrics.sequencingBucket,
    // Cost estimates - not in current schema, set to null
    dev_cost_est: null,
    integration_cost_est: null,
    training_cost_est: null,
    // Risk descriptions - not in current schema, generate from scores
    technical_risk: generateRiskDescription('technical', executiveMetrics.feasibilityScore),
    organizational_risk: generateRiskDescription('organizational', process.literacy_fit_score || 0),
    data_quality_risk: generateRiskDescription('data', process.data_risk_score || 0),
    steps: templateSteps
  };

  // 8. Build markdown
  const isoNow = new Date().toISOString();

  // Check if document already exists
  const { data: existingDoc } = await supabase
    .from('knowledge_documents')
    .select('id, current_version_id')
    .eq('client_id', clientId)
    .eq('source_entity_type', 'process')
    .eq('source_entity_id', processId)
    .maybeSingle();

  // Determine next version number
  let nextVersionNumber = 1;
  if (existingDoc) {
    const { data: versions } = await supabase
      .from('knowledge_document_versions')
      .select('version_number')
      .eq('document_id', existingDoc.id)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versions && versions.length > 0) {
      nextVersionNumber = versions[0].version_number + 1;
    }
  }

  const result = buildProcessKnowledgeMarkdown(templateInput, nextVersionNumber, isoNow);
  const contentHash = await sha256(result.markdown);

  // Check for changes if document already exists
  if (existingDoc && existingDoc.current_version_id) {
    const { data: currentVersion } = await supabase
      .from('knowledge_document_versions')
      .select('content_hash')
      .eq('id', existingDoc.current_version_id)
      .maybeSingle();

    if (currentVersion && currentVersion.content_hash === contentHash) {
      // No changes detected - return early without creating new version
      return {
        documentId: existingDoc.id,
        versionId: existingDoc.current_version_id,
        versionNumber: nextVersionNumber - 1,
        contentHash,
        markdown: result.markdown,
        noChanges: true
      };
    }
  }

  // 9. Upsert knowledge document
  const docSlug = toSlug(process.name);
  const documentData = {
    client_id: clientId,
    doc_type: 'process' as const,
    title: process.name,
    slug: docSlug,
    source_entity_type: 'process',
    source_entity_id: processId,
    status: 'active' as const,
    bucket: executiveMetrics.sequencingBucket,
    risk_level: executiveMetrics.riskClass,
    metadata: {
      scores: templateInput.scores,
      overall_score: templateInput.scores.overall_score,
      sequencing_bucket: executiveMetrics.sequencingBucket,
      generated_at: isoNow
    },
    updated_at: isoNow
  };

  let documentId: string;

  if (existingDoc) {
    // Update existing document
    const { error: updateError } = await supabase
      .from('knowledge_documents')
      .update(documentData)
      .eq('id', existingDoc.id);

    if (updateError) {
      throw new Error(`Failed to update knowledge document: ${updateError.message}`);
    }

    documentId = existingDoc.id;
  } else {
    // Insert new document
    const { data: newDoc, error: insertError } = await supabase
      .from('knowledge_documents')
      .insert(documentData)
      .select('id')
      .single();

    if (insertError || !newDoc) {
      throw new Error(`Failed to create knowledge document: ${insertError?.message || 'Unknown error'}`);
    }

    documentId = newDoc.id;
  }

  // 10. Insert new version
  const versionData = {
    document_id: documentId,
    version_number: nextVersionNumber,
    content_markdown: result.markdown,
    content_hash: contentHash,
    generation_mode: 'generated' as const,
    generated_from: {
      process_id: processId,
      process_updated_at: process.updated_at,
      step_count: processSteps.length,
      overall_score: templateInput.scores.overall_score,
      sequencing_bucket: executiveMetrics.sequencingBucket,
      scores: {
        documentation_completeness: process.documentation_completeness_score,
        automation_potential: process.automation_potential_score,
        data_risk: process.data_risk_score,
        literacy_fit: process.literacy_fit_score
      },
      executive_metrics: {
        value_score: executiveMetrics.valueScore,
        feasibility_score: executiveMetrics.feasibilityScore,
        risk_class: executiveMetrics.riskClass,
        sequencing_bucket: executiveMetrics.sequencingBucket
      },
      generated_at: isoNow
    }
  };

  const { data: newVersion, error: versionError } = await supabase
    .from('knowledge_document_versions')
    .insert(versionData)
    .select('id')
    .single();

  if (versionError || !newVersion) {
    throw new Error(`Failed to create document version: ${versionError?.message || 'Unknown error'}`);
  }

  const versionId = newVersion.id;

  // 11. Update current_version_id
  const { error: updateVersionError } = await supabase
    .from('knowledge_documents')
    .update({ current_version_id: versionId })
    .eq('id', documentId);

  if (updateVersionError) {
    throw new Error(`Failed to update current version: ${updateVersionError.message}`);
  }

  return {
    documentId,
    versionId,
    versionNumber: nextVersionNumber,
    contentHash,
    markdown: result.markdown
  };
}

/**
 * Generate a simple risk description based on score
 */
function generateRiskDescription(riskType: 'technical' | 'organizational' | 'data', score: number): string {
  const level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

  const descriptions: Record<string, Record<string, string>> = {
    technical: {
      low: 'Low technical risk - well-understood implementation patterns',
      medium: 'Medium technical risk - some complexity in implementation',
      high: 'High technical risk - significant technical challenges'
    },
    organizational: {
      low: 'Low organizational risk - team has necessary capabilities',
      medium: 'Medium organizational risk - some capability gaps exist',
      high: 'High organizational risk - significant capability development needed'
    },
    data: {
      low: 'Low data quality risk - data is well-structured and accessible',
      medium: 'Medium data quality risk - some data quality issues present',
      high: 'High data quality risk - significant data quality concerns'
    }
  };

  return descriptions[riskType][level] || '(not specified)';
}
