import { supabase } from '../supabase';
import { sha256 } from './hash';

interface SaveEditedVersionParams {
  documentId: string;
  contentMarkdown: string;
  editedFromVersionId?: string;
}

interface SaveEditedVersionResult {
  versionId: string;
  versionNumber: number;
}

export async function saveEditedKnowledgeVersion({
  documentId,
  contentMarkdown,
  editedFromVersionId,
}: SaveEditedVersionParams): Promise<SaveEditedVersionResult> {
  const { data: document, error: docError } = await supabase
    .from('knowledge_documents')
    .select('current_version_id')
    .eq('id', documentId)
    .maybeSingle();

  if (docError) {
    throw new Error(`Failed to load document: ${docError.message}`);
  }

  if (!document) {
    throw new Error('Document not found');
  }

  const { data: existingVersions, error: versionsError } = await supabase
    .from('knowledge_document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionsError) {
    throw new Error(`Failed to load versions: ${versionsError.message}`);
  }

  const nextVersionNumber = existingVersions && existingVersions.length > 0
    ? existingVersions[0].version_number + 1
    : 1;

  const contentHash = await sha256(contentMarkdown);

  const generatedFrom = editedFromVersionId
    ? { edited_from_version_id: editedFromVersionId }
    : (document.current_version_id ? { edited_from_version_id: document.current_version_id } : {});

  const { data: newVersion, error: insertError } = await supabase
    .from('knowledge_document_versions')
    .insert({
      document_id: documentId,
      version_number: nextVersionNumber,
      content_markdown: contentMarkdown,
      content_hash: contentHash,
      generation_mode: 'edited',
      generated_from: generatedFrom,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create new version: ${insertError.message}`);
  }

  if (!newVersion) {
    throw new Error('New version was not created');
  }

  const { error: updateError } = await supabase
    .from('knowledge_documents')
    .update({ current_version_id: newVersion.id })
    .eq('id', documentId);

  if (updateError) {
    throw new Error(`Failed to update current version: ${updateError.message}`);
  }

  return {
    versionId: newVersion.id,
    versionNumber: newVersion.version_number,
  };
}
