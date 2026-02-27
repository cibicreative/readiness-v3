import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateAllProcessDocuments, generateProcessDocument, getDocumentMarkdown } from '../lib/markdownGeneration';
import type { Database } from '../lib/database.types';

type KnowledgeDocument = Database['public']['Tables']['knowledge_documents']['Row'];
type Process = Database['public']['Tables']['processes']['Row'];

interface Props {
  clientId: string;
}

export default function KnowledgeDocumentsTab({ clientId }: Props) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      setLoading(true);

      const [docsResult, processesResult] = await Promise.all([
        supabase
          .from('knowledge_documents')
          .select('*')
          .eq('client_id', clientId)
          .eq('doc_type', 'process')
          .order('created_at', { ascending: false }),
        supabase
          .from('processes')
          .select('*')
          .eq('client_id', clientId)
          .order('name')
      ]);

      setDocuments((docsResult.data || []) as KnowledgeDocument[]);
      setProcesses((processesResult.data || []) as Process[]);
    } catch (error) {
      console.error('Error loading knowledge documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAll() {
    try {
      setGenerating(true);
      setNotification(null);

      const results = await generateAllProcessDocuments(clientId);

      if (results.failed > 0) {
        console.error('Generation errors:', results.errors);
        setNotification({
          type: 'error',
          message: `Generated ${results.success} documents, ${results.failed} failed. Check console for details.`
        });
      } else {
        setNotification({
          type: 'success',
          message: `Successfully generated ${results.success} document${results.success !== 1 ? 's' : ''}`
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error generating documents:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate documents'
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateSingle(processId: string) {
    try {
      setGenerating(true);
      setNotification(null);

      await generateProcessDocument(processId, clientId);

      setNotification({
        type: 'success',
        message: 'Document generated successfully'
      });

      await loadData();
    } catch (error) {
      console.error('Error generating document:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate document'
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleViewDocument(documentId: string) {
    try {
      setSelectedDoc(documentId);
      const content = await getDocumentMarkdown(documentId);
      setMarkdownContent(content || 'No content available');
    } catch (error) {
      console.error('Error loading document:', error);
      setMarkdownContent('Error loading document content');
    }
  }

  function handleDownloadMarkdown(doc: KnowledgeDocument) {
    const content = markdownContent;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

  const documentedProcessIds = new Set(
    documents
      .filter(d => d.source_entity_type === 'process' && d.source_entity_id)
      .map(d => d.source_entity_id)
  );

  const undocumentedProcesses = processes.filter(p => !documentedProcessIds.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#2B3D66]">Loading knowledge documents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2147]">Knowledge Documents</h2>
          <p className="text-[#2B3D66] mt-1">Structured markdown documentation for processes</p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating || processes.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c45f35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate All'}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F2147] mb-4">
            Generated Documents ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="bg-[#F5F5F6] border border-gray-200 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#2B3D66] mb-2">No documents generated yet</p>
              <p className="text-sm text-gray-500">Click "Generate All" to create markdown docs from your processes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedDoc === doc.id
                      ? 'border-[#D46A3D] bg-[#D46A3D] bg-opacity-5'
                      : 'border-gray-200 hover:border-[#D46A3D] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-[#0F2147] flex-1">{doc.title}</h4>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => window.location.hash = `#/client/${clientId}/knowledge/${doc.id}`}
                        className="p-1.5 text-[#D46A3D] hover:bg-[#D46A3D] hover:text-white rounded transition-colors"
                        title="Open in viewer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className="p-1.5 text-[#2B3D66] hover:bg-[#2B3D66] hover:text-white rounded transition-colors"
                        title="Quick preview"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {doc.bucket && (
                      <span className={`text-xs px-2 py-1 rounded ${getBucketColor(doc.bucket)}`}>
                        {doc.bucket.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    {doc.risk_level && (
                      <span className={`text-xs px-2 py-1 rounded bg-gray-100 ${getRiskColor(doc.risk_level)}`}>
                        {doc.risk_level.toUpperCase()} RISK
                      </span>
                    )}
                    {doc.investment_category && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-[#2B3D66]">
                        {doc.investment_category}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Updated: {new Date(doc.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Undocumented Processes */}
          {undocumentedProcesses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#0F2147] mb-4">
                Undocumented Processes ({undocumentedProcesses.length})
              </h3>
              <div className="space-y-2">
                {undocumentedProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium text-[#0F2147]">{process.name}</h4>
                      {process.category && (
                        <span className="text-xs text-gray-500">{process.category}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleGenerateSingle(process.id)}
                      disabled={generating}
                      className="px-3 py-1 text-sm bg-[#F5F5F6] text-[#0F2147] rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Preview */}
        <div>
          <h3 className="text-lg font-semibold text-[#0F2147] mb-4">Preview</h3>

          {selectedDoc && markdownContent ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-[#F5F5F6] px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <span className="text-sm font-medium text-[#0F2147]">Markdown Content</span>
                <button
                  onClick={() => {
                    const doc = documents.find(d => d.id === selectedDoc);
                    if (doc) handleDownloadMarkdown(doc);
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-[#D46A3D] text-white rounded hover:bg-[#c45f35] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
              <div className="p-4 bg-white max-h-[600px] overflow-auto">
                <pre className="text-xs text-[#2B3D66] whitespace-pre-wrap font-mono leading-relaxed">
                  {markdownContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-8 text-center bg-[#F5F5F6]">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-[#2B3D66]">Select a document to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
