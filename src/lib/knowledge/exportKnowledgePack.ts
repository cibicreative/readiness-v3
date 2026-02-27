import JSZip from 'jszip';
import { supabase } from '../supabase';
import { toSlug } from './slug';

interface KnowledgeDocumentVersion {
  id: string;
  version_number: number;
  content_markdown: string;
  created_at: string;
}

interface ManifestEntry {
  id: string;
  title: string;
  type: string;
  slug: string;
  version_number: number;
  created_at: string;
  file_path: string;
}

/**
 * Export all knowledge documents for a client as a zip file
 */
export async function exportKnowledgePack(clientId: string, clientName: string): Promise<void> {
  try {
    // Fetch all knowledge documents with current version
    const { data: documents, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('id, doc_type, title, slug, current_version_id, created_at, updated_at')
      .eq('client_id', clientId)
      .not('current_version_id', 'is', null)
      .eq('status', 'active');

    if (docsError) {
      throw new Error(`Failed to fetch knowledge documents: ${docsError.message}`);
    }

    if (!documents || documents.length === 0) {
      throw new Error('No knowledge documents found for export');
    }

    // Fetch all versions for these documents
    const versionIds = documents
      .map(d => d.current_version_id)
      .filter(Boolean) as string[];

    const { data: versions, error: versionsError } = await supabase
      .from('knowledge_document_versions')
      .select('id, version_number, content_markdown, created_at')
      .in('id', versionIds);

    if (versionsError) {
      throw new Error(`Failed to fetch document versions: ${versionsError.message}`);
    }

    if (!versions || versions.length === 0) {
      throw new Error('No document versions found for export');
    }

    // Create a map for quick version lookup
    const versionMap = new Map<string, KnowledgeDocumentVersion>();
    versions.forEach(v => versionMap.set(v.id, v));

    // Create zip file
    const zip = new JSZip();
    const manifest: ManifestEntry[] = [];

    // Process each document
    for (const doc of documents) {
      if (!doc.current_version_id) continue;

      const version = versionMap.get(doc.current_version_id);
      if (!version) continue;

      // Determine file path based on doc_type
      let folder = 'reference';
      if (doc.doc_type === 'process') {
        folder = 'processes';
      } else if (doc.doc_type === 'data_source') {
        folder = 'data_sources';
      } else if (doc.doc_type === 'tool') {
        folder = 'tools';
      } else if (doc.doc_type === 'gate_reference') {
        folder = 'gates';
      } else if (doc.doc_type === 'investment_memo_appendix') {
        folder = 'memos';
      } else if (doc.doc_type === 'overview') {
        folder = 'overview';
      }

      // Determine filename
      const slug = doc.slug || toSlug(doc.title);
      const filename = `${slug}.md`;
      const filePath = `${folder}/${filename}`;

      // Add file to zip
      zip.file(filePath, version.content_markdown);

      // Add to manifest
      manifest.push({
        id: doc.id,
        title: doc.title,
        type: doc.doc_type,
        slug,
        version_number: version.version_number,
        created_at: version.created_at,
        file_path: filePath,
      });
    }

    // Add manifest.json
    zip.file('manifest.json', JSON.stringify({
      client_id: clientId,
      client_name: clientName,
      exported_at: new Date().toISOString(),
      document_count: manifest.length,
      documents: manifest,
    }, null, 2));

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Create safe filename
    const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${safeClientName}_knowledge_pack_${timestamp}.zip`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting knowledge pack:', error);
    throw error;
  }
}
