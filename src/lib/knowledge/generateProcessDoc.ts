/**
 * Example usage of process knowledge document generation
 * This demonstrates the complete workflow for creating a versioned knowledge document
 */

import { sha256 } from './hash';
import { buildProcessKnowledgeMarkdown, type ProcessKnowledgeInput } from './templates/processMarkdown';

/**
 * Generate a complete process knowledge document with version control
 *
 * @param processData - The process data to convert to markdown
 * @param versionNumber - The version number for this document (default: 1)
 * @returns Object containing the markdown content, hash, and metadata
 */
export async function generateProcessDocument(
  processData: ProcessKnowledgeInput,
  versionNumber: number = 1
) {
  const isoNow = new Date().toISOString();

  // Generate the markdown content
  const result = buildProcessKnowledgeMarkdown(processData, versionNumber, isoNow);

  // Calculate content hash for integrity verification
  const contentHash = await sha256(result.markdown);

  return {
    ...result,
    contentHash,
    generatedAt: isoNow
  };
}

/**
 * Example: Create a minimal process document
 */
export async function exampleUsage() {
  const exampleProcess: ProcessKnowledgeInput = {
    clientId: '123e4567-e89b-12d3-a456-426614174000',
    processId: '123e4567-e89b-12d3-a456-426614174001',
    processName: 'Customer Onboarding',
    processDescription: 'Process for onboarding new customers',
    category: 'sales',
    frequency: 'daily',
    trigger: 'New customer signs contract',
    desired_outcome: 'Customer is fully onboarded and ready to use the platform',
    is_customer_facing: true,
    is_compliance_sensitive: false,
    scores: {
      business_case_score: 85,
      data_readiness_score: 70,
      technical_feasibility_score: 90,
      org_capability_score: 75,
      risk_score: 65,
      market_timing_score: 80,
      overall_score: 77
    },
    sequencing_bucket: 'do_now',
    dev_cost_est: 50000,
    integration_cost_est: 25000,
    training_cost_est: 10000,
    technical_risk: 'Low risk - standard integration patterns',
    organizational_risk: 'Medium risk - requires coordination across teams',
    data_quality_risk: 'Low risk - data is well-structured',
    steps: [
      {
        step_number: 1,
        name: 'Collect Customer Information',
        description: 'Gather all required customer details and documentation',
        inputs: 'Signed contract, customer contact info',
        outputs: 'Complete customer profile',
        responsible_role: 'Sales Operations',
        tools_required: ['CRM', 'Document Management System'],
        estimated_duration: 30
      },
      {
        step_number: 2,
        name: 'Setup Customer Account',
        description: 'Create customer account in all systems',
        inputs: 'Customer profile',
        outputs: 'Active customer account',
        responsible_role: 'IT Operations',
        tools_required: ['Admin Portal', 'Provisioning System'],
        estimated_duration: 45
      }
    ]
  };

  const doc = await generateProcessDocument(exampleProcess);

  console.log('Generated Document:');
  console.log('Title:', doc.title);
  console.log('Slug:', doc.slug);
  console.log('Content Hash:', doc.contentHash);
  console.log('Metadata:', doc.metadataJson);
  console.log('\nMarkdown:\n', doc.markdown);

  return doc;
}
