import type { Database } from './database.types';
import { calculateExecutiveMetrics, getBudgetRangeBand } from './executiveScoring';
import { supabase } from './supabase';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type DataSource = Database['public']['Tables']['data_sources']['Row'];

interface ProcessData {
  process: Process;
  steps: ProcessStep[];
  client: Client;
  tools: Tool[];
  roles: Role[];
  dataSources: DataSource[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateProcessMarkdown(data: ProcessData): string {
  const { process, steps, client, tools, roles, dataSources } = data;
  const metrics = calculateExecutiveMetrics(process, steps, client.risk_tolerance || 'unknown');

  const md: string[] = [];

  // Header
  md.push(`# ${process.name}`);
  md.push('');
  md.push(`**Client:** ${client.name}`);
  md.push(`**Category:** ${process.category || 'Not specified'}`);
  md.push(`**Owner Role:** ${process.owner_role || 'Not specified'}`);
  md.push(`**Frequency:** ${process.frequency || 'Not specified'}`);
  md.push('');

  // Overview Section
  md.push('## Overview');
  md.push('');
  if (process.description) {
    md.push(process.description);
    md.push('');
  }

  if (process.trigger) {
    md.push(`**Trigger:** ${process.trigger}`);
    md.push('');
  }

  if (process.desired_outcome) {
    md.push(`**Desired Outcome:** ${process.desired_outcome}`);
    md.push('');
  }

  // Process Characteristics
  md.push('## Process Characteristics');
  md.push('');
  md.push(`- **Customer Facing:** ${process.is_customer_facing ? 'Yes' : 'No'}`);
  md.push(`- **Compliance Sensitive:** ${process.is_compliance_sensitive ? 'Yes' : 'No'}`);
  md.push('');

  // Process Steps
  md.push('## Process Steps');
  md.push('');

  if (steps.length === 0) {
    md.push('_No steps documented yet._');
    md.push('');
  } else {
    steps.forEach((step, index) => {
      md.push(`### Step ${index + 1}: ${step.title || 'Untitled Step'}`);
      md.push('');

      if (step.description) {
        md.push(step.description);
        md.push('');
      }

      const stepDetails: string[] = [];

      if (step.average_time_minutes || step.estimated_duration_minutes) {
        const time = step.average_time_minutes || step.estimated_duration_minutes || 0;
        stepDetails.push(`**Time:** ${time} minutes`);
      }

      if (step.is_rule_based) {
        const ruleLabel = {
          'mostly_rules': 'Mostly Rule-Based',
          'mixed': 'Mixed (Rules + Judgment)',
          'mostly_judgment': 'Mostly Judgment-Based'
        }[step.is_rule_based] || step.is_rule_based;
        stepDetails.push(`**Decision Type:** ${ruleLabel}`);
      }

      if (step.tool_id) {
        const tool = tools.find(t => t.id === step.tool_id);
        if (tool) {
          stepDetails.push(`**Tool:** ${tool.name}${tool.vendor ? ` (${tool.vendor})` : ''}`);
        }
      }

      if (step.role_id) {
        const role = roles.find(r => r.id === step.role_id);
        if (role) {
          stepDetails.push(`**Role:** ${role.title}`);
        }
      }

      if (stepDetails.length > 0) {
        md.push(stepDetails.join(' | '));
        md.push('');
      }

      if (step.risk_notes) {
        md.push(`**Risk Notes:** ${step.risk_notes}`);
        md.push('');
      }
    });
  }

  // Data Sources
  if (dataSources.length > 0) {
    md.push('## Data Sources');
    md.push('');
    dataSources.forEach(ds => {
      md.push(`- **${ds.name}**${ds.system_name ? ` (${ds.system_name})` : ''}`);
      if (ds.data_type) {
        md.push(`  - Type: ${ds.data_type}`);
      }
      if (ds.is_source_of_truth) {
        md.push(`  - Source of Truth: Yes`);
      }
      if (ds.update_frequency) {
        md.push(`  - Update Frequency: ${ds.update_frequency}`);
      }
    });
    md.push('');
  }

  // Readiness Scores
  md.push('## Readiness Assessment');
  md.push('');
  md.push('### Scores');
  md.push('');
  md.push(`- **Documentation Completeness:** ${process.documentation_completeness_score || 0}/100`);
  md.push(`- **Automation Potential:** ${process.automation_potential_score || 0}/100`);
  md.push(`- **Data Risk Score:** ${process.data_risk_score || 0}/100`);
  md.push(`- **Literacy Fit:** ${process.literacy_fit_score || 0}/100`);
  md.push('');

  // Executive Metrics
  md.push('### Executive Metrics');
  md.push('');
  md.push(`- **Value Score:** ${metrics.valueScore}/100`);
  md.push(`- **Feasibility Score:** ${metrics.feasibilityScore}/100`);
  md.push(`- **Risk Classification:** ${metrics.riskClass}`);
  md.push(`- **Investment Category:** ${metrics.investmentCategory}`);
  md.push(`- **Sequencing Bucket:** ${metrics.sequencingBucket.replace('_', ' ').toUpperCase()}`);
  md.push(`- **Budget Range:** ${getBudgetRangeBand(metrics.investmentCategory)}`);
  md.push('');

  // Investment Gates
  md.push('### Investment Gates');
  md.push('');
  md.push(`- **Process Gate:** ${metrics.gateStatus.processGate}`);
  md.push(`- **Data Gate:** ${metrics.gateStatus.dataGate}`);
  md.push(`- **People Gate:** ${metrics.gateStatus.peopleGate}`);
  md.push(`- **Finance Gate:** ${metrics.gateStatus.financeGate}`);
  md.push(`- **Guardrails Gate:** ${metrics.gateStatus.guardrailsGate}`);
  md.push('');

  // Cost Estimation
  const totalTime = steps.reduce((sum, step) =>
    sum + (step.average_time_minutes || step.estimated_duration_minutes || 0), 0);

  if (totalTime > 0) {
    md.push('## Time & Cost');
    md.push('');
    md.push(`- **Total Process Time:** ${totalTime} minutes (${(totalTime / 60).toFixed(1)} hours)`);

    // Calculate annual frequency
    const frequencyMultipliers: Record<string, number> = {
      'daily': 250,
      'weekly': 52,
      'monthly': 12,
      'quarterly': 4,
      'ad hoc': 12
    };
    const annualOccurrences = frequencyMultipliers[process.frequency || 'ad hoc'] || 12;
    const annualHours = (totalTime / 60) * annualOccurrences;

    md.push(`- **Annual Time Investment:** ${annualHours.toFixed(0)} hours/year (${process.frequency || 'ad hoc'}, ~${annualOccurrences}x/year)`);
    md.push('');
  }

  // Footer metadata
  md.push('---');
  md.push('');
  md.push(`_Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}_`);
  md.push(`_Process ID: ${process.id}_`);

  return md.join('\n');
}

async function calculateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateProcessDocument(
  processId: string,
  clientId: string
): Promise<{ documentId: string; versionId: string }> {
  // Fetch all required data
  const [processResult, stepsResult, clientResult] = await Promise.all([
    supabase.from('processes').select('*').eq('id', processId).maybeSingle(),
    supabase.from('process_steps').select('*').eq('process_id', processId).order('step_order'),
    supabase.from('clients').select('*').eq('id', clientId).maybeSingle()
  ]);

  if (!processResult.data || !clientResult.data) {
    throw new Error('Process or client not found');
  }

  const process = processResult.data as Process;
  const steps = (stepsResult.data || []) as ProcessStep[];
  const client = clientResult.data as Client;

  // Fetch related tools
  const toolIds = steps.map(s => s.tool_id).filter(Boolean) as string[];
  let tools: Tool[] = [];
  if (toolIds.length > 0) {
    const { data: toolsData } = await supabase.from('tools').select('*').in('id', toolIds);
    tools = (toolsData || []) as Tool[];
  }

  // Fetch related roles
  const roleIds = steps.map(s => s.role_id).filter(Boolean) as string[];
  const ownerRoleId = process.owner_role;
  if (ownerRoleId) roleIds.push(ownerRoleId);
  const uniqueRoleIds = [...new Set(roleIds)];

  let roles: Role[] = [];
  if (uniqueRoleIds.length > 0) {
    const { data: rolesData } = await supabase.from('roles').select('*').in('id', uniqueRoleIds);
    roles = (rolesData || []) as Role[];
  }

  // Fetch related data sources
  const { data: processDataSources } = await supabase
    .from('process_data_sources')
    .select('data_source_id')
    .eq('process_id', processId);

  const dataSourceIds = (processDataSources || []).map(pds => pds.data_source_id);
  let dataSources: DataSource[] = [];
  if (dataSourceIds.length > 0) {
    const { data: dataSourcesData } = await supabase.from('data_sources').select('*').in('id', dataSourceIds);
    dataSources = (dataSourcesData || []) as DataSource[];
  }

  // Generate markdown
  const markdownContent = generateProcessMarkdown({
    process,
    steps,
    client,
    tools,
    roles,
    dataSources
  });

  const contentHash = await calculateContentHash(markdownContent);
  const slug = slugify(process.name);
  const metrics = calculateExecutiveMetrics(process, steps, client.risk_tolerance || 'unknown');

  // Check if document already exists
  const { data: existingDoc } = await supabase
    .from('knowledge_documents')
    .select('id, current_version_id')
    .eq('client_id', clientId)
    .eq('source_entity_id', processId)
    .eq('source_entity_type', 'process')
    .maybeSingle();

  let documentId: string;
  let versionNumber = 1;

  if (existingDoc) {
    documentId = existingDoc.id;

    // Get latest version number
    const { data: latestVersion } = await supabase
      .from('knowledge_document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion) {
      versionNumber = latestVersion.version_number + 1;
    }

    // Update document metadata
    await supabase
      .from('knowledge_documents')
      .update({
        title: process.name,
        slug,
        risk_level: metrics.riskClass,
        investment_category: metrics.investmentCategory,
        bucket: metrics.sequencingBucket,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
  } else {
    // Find matching role ID if owner_role is text
    let ownerRoleId: string | null = null;
    if (process.owner_role && typeof process.owner_role === 'string') {
      const { data: matchingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('client_id', clientId)
        .eq('title', process.owner_role)
        .maybeSingle();

      if (matchingRole) {
        ownerRoleId = matchingRole.id;
      }
    }

    // Create new document
    const { data: newDocRaw, error } = await supabase
      .from('knowledge_documents')
      .insert({
        client_id: clientId,
        doc_type: 'process',
        title: process.name,
        slug,
        source_entity_type: 'process',
        source_entity_id: processId,
        status: 'active',
        owner_role_id: ownerRoleId,
        risk_level: metrics.riskClass,
        investment_category: metrics.investmentCategory,
        bucket: metrics.sequencingBucket,
        tags: [],
        metadata: {}
      })
      .select()
      .single();
    const newDoc = newDocRaw as { id: string } | null;

    if (error || !newDoc) {
      console.error('Database error creating knowledge document:', error);
      throw new Error(`Failed to create knowledge document: ${error?.message || 'Unknown error'}`);
    }

    documentId = newDoc.id;
  }

  // Create new version
  const { data: newVersionRaw, error: versionError } = await supabase
    .from('knowledge_document_versions')
    .insert({
      document_id: documentId,
      version_number: versionNumber,
      content_markdown: markdownContent,
      content_hash: contentHash,
      generated_from: {
        process_id: processId,
        step_ids: steps.map(s => s.id),
        scores: {
          documentation_completeness: process.documentation_completeness_score,
          automation_potential: process.automation_potential_score,
          data_risk: process.data_risk_score,
          literacy_fit: process.literacy_fit_score
        },
        metrics: {
          value_score: metrics.valueScore,
          feasibility_score: metrics.feasibilityScore,
          risk_class: metrics.riskClass,
          investment_category: metrics.investmentCategory,
          sequencing_bucket: metrics.sequencingBucket
        }
      },
      generation_mode: 'generated'
    })
    .select()
    .single();
  const newVersion = newVersionRaw as { id: string } | null;

  if (versionError || !newVersion) {
    console.error('Database error creating document version:', versionError);
    throw new Error(`Failed to create document version: ${versionError?.message || 'Unknown error'}`);
  }

  // Update current_version_id
  await supabase
    .from('knowledge_documents')
    .update({ current_version_id: newVersion.id })
    .eq('id', documentId);

  return {
    documentId,
    versionId: newVersion.id
  };
}

export async function generateAllProcessDocuments(clientId: string): Promise<{
  success: number;
  failed: number;
  errors: Array<{ processId: string; error: string }>;
}> {
  // Fetch all processes for client
  const { data: processes } = await supabase
    .from('processes')
    .select('id, name')
    .eq('client_id', clientId);

  if (!processes || processes.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ processId: string; error: string }>
  };

  for (const process of processes) {
    try {
      await generateProcessDocument(process.id, clientId);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        processId: process.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

export async function getDocumentMarkdown(documentId: string): Promise<string | null> {
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('current_version_id')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc || !doc.current_version_id) {
    return null;
  }

  const { data: version } = await supabase
    .from('knowledge_document_versions')
    .select('content_markdown')
    .eq('id', doc.current_version_id)
    .maybeSingle();

  return version?.content_markdown || null;
}
