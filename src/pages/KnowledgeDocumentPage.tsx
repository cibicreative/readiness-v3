import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Calendar, Tag, AlertCircle, Edit2, Save, X, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { saveEditedKnowledgeVersion } from '../lib/knowledge/saveEditedVersion';
import { generateKnowledgeFromProcess } from '../lib/knowledge/generateFromProcess';
import type { Database } from '../lib/database.types';

type KnowledgeDocument = Database['public']['Tables']['knowledge_documents']['Row'];
type KnowledgeDocumentVersion = Database['public']['Tables']['knowledge_document_versions']['Row'];

interface Props {
  clientId: string;
  documentId: string;
  onBack?: () => void;
  allowEdit?: boolean;
}

export default function KnowledgeDocumentPage({ clientId, documentId, onBack, allowEdit = true }: Props) {
  const [document, setDocument] = useState<KnowledgeDocument | null>(null);
  const [version, setVersion] = useState<KnowledgeDocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateMessage, setRegenerateMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDocument();
  }, [clientId, documentId]);

  async function loadDocument() {
    try {
      setLoading(true);
      setError(null);

      const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', documentId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (docError) {
        throw new Error(`Failed to load document: ${docError.message}`);
      }

      if (!doc) {
        throw new Error('Document not found');
      }

      setDocument(doc);

      if (doc.current_version_id) {
        const { data: versionData, error: versionError } = await supabase
          .from('knowledge_document_versions')
          .select('*')
          .eq('id', doc.current_version_id)
          .maybeSingle();

        if (versionError) {
          throw new Error(`Failed to load version: ${versionError.message}`);
        }

        setVersion(versionData);
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function extractYamlFrontMatter(markdown: string): { yaml: string; body: string } | null {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (match) {
      return {
        yaml: match[1],
        body: match[2],
      };
    }
    return null;
  }

  function handleEdit() {
    if (version?.content_markdown) {
      setEditContent(version.content_markdown);
      setIsEditMode(true);
      setSaveError(null);
    }
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditContent('');
    setSaveError(null);
  }

  async function handleSave() {
    if (!version || !document) return;

    try {
      setSaving(true);
      setSaveError(null);

      let contentToSave = editContent.trim();

      const hasYaml = contentToSave.startsWith('---\n');
      if (!hasYaml) {
        const originalParts = extractYamlFrontMatter(version.content_markdown);
        if (originalParts) {
          contentToSave = `---\n${originalParts.yaml}\n---\n${contentToSave}`;
        }
      }

      const result = await saveEditedKnowledgeVersion({
        documentId: document.id,
        contentMarkdown: contentToSave,
        editedFromVersionId: version.id,
      });

      await loadDocument();
      setIsEditMode(false);
      setEditContent('');
    } catch (err) {
      console.error('Error saving version:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!document || !document.source_entity_id) return;

    try {
      setRegenerating(true);
      setRegenerateMessage(null);

      const result = await generateKnowledgeFromProcess({
        clientId,
        processId: document.source_entity_id,
      });

      if (result.noChanges) {
        setRegenerateMessage({
          type: 'info',
          text: 'No changes detected. The current version is up-to-date with the process.'
        });
      } else {
        setRegenerateMessage({
          type: 'success',
          text: `Successfully regenerated! New version ${result.versionNumber} created.`
        });
        await loadDocument();
      }

      setTimeout(() => setRegenerateMessage(null), 5000);
    } catch (err) {
      console.error('Error regenerating:', err);
      setRegenerateMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to regenerate'
      });
    } finally {
      setRegenerating(false);
    }
  }

  function getBucketColor(bucket: string | null): string {
    switch (bucket) {
      case 'do_now': return 'bg-[#D46A3D] text-white';
      case 'prepare': return 'bg-[#F5A96B] text-[#0F2147]';
      case 'defer': return 'bg-[#2B3D66] text-white';
      case 'avoid': return 'bg-gray-400 text-white';
      default: return 'bg-gray-200 text-gray-600';
    }
  }

  function getRiskColor(risk: string | null): string {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-400';
    }
  }

  function formatBucket(bucket: string): string {
    return bucket.replace('_', ' ').toUpperCase();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#2B3D66]">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0F2147] text-center mb-2">Error Loading Document</h2>
          <p className="text-[#2B3D66] text-center mb-4">{error || 'Document not found'}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c45f35] transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#2B3D66] hover:text-[#D46A3D] transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#F5F5F6] rounded-lg">
                  <FileText className="w-6 h-6 text-[#0F2147]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F2147]">Metadata</h3>
                  <p className="text-xs text-gray-500">Document Info</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                  <p className="mt-1 text-sm text-[#0F2147] font-medium">{document.doc_type}</p>
                </div>

                {document.source_entity_type && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</label>
                    <p className="mt-1 text-sm text-[#0F2147]">
                      {document.source_entity_type}
                      {document.source_entity_id && (
                        <span className="text-xs text-gray-500 block truncate">
                          {document.source_entity_id}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <p className="mt-1">
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      document.status === 'active' ? 'bg-green-100 text-green-800' :
                      document.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.status.toUpperCase()}
                    </span>
                  </p>
                </div>

                {document.bucket && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bucket</label>
                    <p className="mt-1">
                      <span className={`inline-block text-xs px-2 py-1 rounded ${getBucketColor(document.bucket)}`}>
                        {formatBucket(document.bucket)}
                      </span>
                    </p>
                  </div>
                )}

                {document.risk_level && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Level</label>
                    <p className={`mt-1 text-sm font-semibold ${getRiskColor(document.risk_level)}`}>
                      {document.risk_level.toUpperCase()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar size={12} />
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm text-[#0F2147]">
                    {new Date(document.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {version && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Version</label>
                    <p className="mt-1 text-sm text-[#0F2147]">
                      v{version.version_number}
                      <span className="text-xs text-gray-500 block">
                        {version.generation_mode}
                      </span>
                    </p>
                  </div>
                )}

                {document.metadata && typeof document.metadata === 'object' && Object.keys(document.metadata).length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Tag size={12} />
                      Additional Info
                    </label>
                    <div className="mt-2 text-xs text-[#2B3D66] space-y-1">
                      {Object.entries(document.metadata).map(([key, value]) => {
                        if (key === 'scores' && typeof value === 'object') {
                          return null;
                        }
                        return (
                          <div key={key}>
                            <span className="font-medium">{key}:</span>{' '}
                            <span className="text-gray-600">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#0F2147]">{document.title}</h1>
                    {document.slug && (
                      <p className="text-sm text-gray-500 mt-1">/{document.slug}</p>
                    )}
                  </div>
                  {!isEditMode && (
                    <div className="flex items-center gap-2">
                      {document.source_entity_type === 'process' && document.source_entity_id && (
                        <button
                          onClick={handleRegenerate}
                          disabled={regenerating}
                          className="flex items-center gap-2 px-4 py-2 border border-[#2B3D66] text-[#2B3D66] rounded-lg hover:bg-[#F5F5F6] transition-colors disabled:opacity-50"
                        >
                          <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} />
                          {regenerating ? 'Regenerating...' : 'Regenerate from process'}
                        </button>
                      )}
                      {allowEdit && version && (
                        <button
                          onClick={handleEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c45f35] transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-[#2B3D66] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c45f35] transition-colors disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {saveError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-1">Save Failed</h4>
                      <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                  </div>
                )}

                {regenerateMessage && (
                  <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                    regenerateMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : regenerateMessage.type === 'info'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      regenerateMessage.type === 'success'
                        ? 'text-green-600'
                        : regenerateMessage.type === 'info'
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm ${
                        regenerateMessage.type === 'success'
                          ? 'text-green-700'
                          : regenerateMessage.type === 'info'
                          ? 'text-blue-700'
                          : 'text-red-700'
                      }`}>{regenerateMessage.text}</p>
                    </div>
                  </div>
                )}

                {!document.current_version_id || !version ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#0F2147] mb-2">No Content Yet</h3>
                    <p className="text-[#2B3D66] mb-4">
                      This document has been created but doesn't have any content yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Generate content from the source entity to populate this document.
                    </p>
                  </div>
                ) : isEditMode ? (
                  <div>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Editing markdown content.</strong> YAML front matter will be preserved automatically if removed.
                      </p>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-[600px] p-4 border border-gray-300 rounded-lg font-mono text-sm text-[#0F2147] focus:ring-2 focus:ring-[#D46A3D] focus:border-[#D46A3D] resize-y"
                      placeholder="Enter markdown content here..."
                    />
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-[#0F2147] mb-4 mt-6">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-semibold text-[#0F2147] mb-3 mt-6">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold text-[#0F2147] mb-2 mt-4">{children}</h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-lg font-semibold text-[#2B3D66] mb-2 mt-3">{children}</h4>
                        ),
                        p: ({ children }) => (
                          <p className="text-[#2B3D66] mb-4 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 text-[#2B3D66] space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-4 text-[#2B3D66] space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="ml-4">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[#D46A3D] pl-4 italic text-[#2B3D66] my-4">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-[#F5F5F6] text-[#D46A3D] px-1.5 py-0.5 rounded text-sm font-mono">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-[#F5F5F6] text-[#0F2147] p-4 rounded-lg text-sm font-mono overflow-x-auto">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-[#F5F5F6] rounded-lg p-4 overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-gray-200">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="bg-[#F5F5F6] border border-gray-200 px-4 py-2 text-left font-semibold text-[#0F2147]">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-200 px-4 py-2 text-[#2B3D66]">
                            {children}
                          </td>
                        ),
                        hr: () => (
                          <hr className="my-6 border-t border-gray-200" />
                        ),
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-[#D46A3D] hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {(() => {
                        const parts = extractYamlFrontMatter(version.content_markdown);
                        return parts ? parts.body : version.content_markdown;
                      })()}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
