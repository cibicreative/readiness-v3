# Knowledge Document Generation

Deterministic markdown generation for process-derived knowledge documents.

## Features

- **No LLM inference** - Uses actual data only
- **Deterministic output** - Same input always produces same output
- **YAML front matter** - Structured metadata in every document
- **Stable section headings** - Consistent document structure
- **Missing data handling** - Shows "(not specified)" or "(none captured)" for missing fields
- **Version tracking** - Built-in version numbering and timestamps
- **Content hashing** - SHA-256 for integrity verification and deduplication

## Files

### Core Utilities

- **`slug.ts`** - URL-safe slug generation from strings
- **`hash.ts`** - SHA-256 content hashing using Web Crypto API
- **`templates/processMarkdown.ts`** - Process document markdown template

### Helper

- **`generateProcessDoc.ts`** - Example usage and convenience wrapper

## Usage

### Basic Example

```typescript
import { generateProcessDocument } from './generateProcessDoc';
import type { ProcessKnowledgeInput } from './templates/processMarkdown';

const processData: ProcessKnowledgeInput = {
  clientId: 'client-uuid',
  processId: 'process-uuid',
  processName: 'Customer Onboarding',
  processDescription: 'Process for onboarding new customers',
  category: 'sales',
  frequency: 'daily',
  trigger: 'New customer signs contract',
  desired_outcome: 'Customer ready to use platform',
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
  technical_risk: 'Low risk',
  organizational_risk: 'Medium risk',
  data_quality_risk: 'Low risk',
  steps: [
    {
      step_number: 1,
      name: 'Collect Customer Information',
      description: 'Gather customer details',
      inputs: 'Signed contract',
      outputs: 'Customer profile',
      responsible_role: 'Sales Operations',
      tools_required: ['CRM'],
      estimated_duration: 30
    }
  ]
};

// Generate document
const doc = await generateProcessDocument(processData, 1);

console.log(doc.title);        // "Process: Customer Onboarding"
console.log(doc.slug);         // "process-customer-onboarding"
console.log(doc.contentHash);  // "abc123..."
console.log(doc.markdown);     // Full markdown with YAML front matter
```

### Using Individual Functions

```typescript
import { toSlug } from './slug';
import { sha256 } from './hash';
import { buildProcessKnowledgeMarkdown } from './templates/processMarkdown';

// Create slug
const slug = toSlug('My Process Name!'); // "my-process-name"

// Hash content
const hash = await sha256('content'); // "9b871...abc"

// Build markdown
const result = buildProcessKnowledgeMarkdown(
  processData,
  1,              // version number
  new Date().toISOString()
);

// Access parts
console.log(result.title);        // Display title
console.log(result.slug);         // URL-safe slug
console.log(result.frontMatter);  // YAML front matter only
console.log(result.markdown);     // Complete document
console.log(result.metadataJson); // JSON metadata object
```

## Document Structure

Every generated document follows this structure:

```markdown
---
doc_type: "process"
client_id: "uuid"
process_id: "uuid"
title: "Process Name"
sequencing_bucket: "do_now"
scores: { ... }
costs: { ... }
risks: { ... }
last_generated_at: "2024-01-01T00:00:00.000Z"
version: 1
---

# Process: Process Name

## Purpose
Description of the process...

## Executive Snapshot
Key facts and metadata...

## Scores
- Business Case: 85/100 (pass)
- Data Readiness: 70/100 (pass)
- ...

## Investment Recommendation
Sequencing bucket and rationale...

## Cost Estimate
- Development: $50,000
- Integration: $25,000
- Training: $10,000
- Total: $85,000

## Risk Profile
### Technical Risk
Details...

### Organizational Risk
Details...

### Data Quality Risk
Details...

## Steps
### Step 1: Step Name
Description and duration...

## Inputs and Outputs
Per-step inputs and outputs...

## Roles and Tools
Per-step roles and tools...

## Notes
Generation metadata...
```

## Integration with Database

To save to the database:

```typescript
import { supabase } from '../supabase';
import { generateProcessDocument } from './generateProcessDoc';

async function saveProcessDocument(processData: ProcessKnowledgeInput) {
  // Generate document
  const doc = await generateProcessDocument(processData, 1);

  // Create knowledge document record
  const { data: knowledgeDoc, error: docError } = await supabase
    .from('knowledge_documents')
    .insert({
      client_id: processData.clientId,
      doc_type: 'process',
      title: doc.title,
      slug: doc.slug,
      source_entity_type: 'process',
      source_entity_id: processData.processId,
      status: 'active',
      metadata: doc.metadataJson
    })
    .select()
    .single();

  if (docError) throw docError;

  // Create version record
  const { data: version, error: versionError } = await supabase
    .from('knowledge_document_versions')
    .insert({
      document_id: knowledgeDoc.id,
      version_number: 1,
      content_markdown: doc.markdown,
      content_hash: doc.contentHash,
      generation_mode: 'generated',
      generated_from: {
        process_id: processData.processId,
        generated_at: doc.generatedAt
      }
    })
    .select()
    .single();

  if (versionError) throw versionError;

  // Update current_version_id
  await supabase
    .from('knowledge_documents')
    .update({ current_version_id: version.id })
    .eq('id', knowledgeDoc.id);

  return { document: knowledgeDoc, version };
}
```

## Missing Data Handling

The template handles missing data gracefully:

- Missing strings: `"(not specified)"`
- Missing arrays: `"(none captured)"`
- Missing numbers: `"(not specified)"` or formatted as 0 where appropriate
- Boolean fields: Always shown as "Yes" or "No"

## Future Extensions

Additional templates can be added for:

- Data source documentation
- Tool documentation
- Gate reference documents
- Investment memo appendices
- Overview documents

Each follows the same pattern:
1. Define input interface with typed fields
2. Build YAML front matter
3. Generate stable markdown sections
4. Return structured output with hash
