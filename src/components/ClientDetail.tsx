import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Share2, Copy, Check, ClipboardCheck, Trash2, TrendingUp, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateShareToken } from '../lib/scoring';
import { exportKnowledgePack } from '../lib/knowledge/exportKnowledgePack';
import type { Database } from '../lib/database.types';
import ClientForm from './ClientForm';
import ProcessesTab from './ProcessesTab';
import PeopleRolesTab from './PeopleRolesTab';
import DataSourcesTab from './DataSourcesTab';
import ToolsTab from './ToolsTab';
import KnowledgeDocumentsTab from './KnowledgeDocumentsTab';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientDetailProps {
  clientId: string;
}

type Tab = 'overview' | 'processes' | 'people' | 'data' | 'tools' | 'knowledge';

export default function ClientDetail({ clientId }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [literacyCopied, setLiteracyCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    processCount: 0,
    avgDocScore: 0,
    topAutomation: [] as any[],
    topRisk: [] as any[],
  });

  const loadClient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error loading client:', error);
        setLoading(false);
        return;
      }

      setClient(data);

      const { data: processes } = await supabase
        .from('processes')
        .select('*')
        .eq('client_id', clientId)
        .order('automation_potential_score', { ascending: false });

      if (processes) {
        const avgDoc = processes.length > 0
          ? processes.reduce((sum, p) => sum + p.documentation_completeness_score, 0) / processes.length
          : 0;

        const topAuto = processes.slice(0, 3);
        const topRiskProcesses = [...processes]
          .sort((a, b) => b.data_risk_score - a.data_risk_score)
          .slice(0, 3);

        setStats({
          processCount: processes.length,
          avgDocScore: Math.round(avgDoc),
          topAutomation: topAuto,
          topRisk: topRiskProcesses,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading client:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const handleGenerateShareLink = async () => {
    if (!client) return;

    const token = generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase
      .from('clients')
      .update({
        share_token: token,
        share_enabled: true,
        share_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', client.id);

    if (!error) {
      loadClient();
    }
  };

  const handleToggleShare = async (enabled: boolean) => {
    if (!client) return;

    const { error } = await supabase
      .from('clients')
      .update({
        share_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', client.id);

    if (!error) {
      loadClient();
    }
  };

  const copyShareLink = () => {
    if (!client?.share_token) return;

    const url = `${window.location.origin}${window.location.pathname}#/client-share/${client.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLiteracyCheckLink = () => {
    if (!client?.share_token) return;

    const url = `${window.location.origin}${window.location.pathname}#/c/${client.share_token}/literacy-check`;
    navigator.clipboard.writeText(url);
    setLiteracyCopied(true);
    setTimeout(() => setLiteracyCopied(false), 2000);
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    setDeleting(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    if (error) {
      console.error('Error deleting client:', error);
      setDeleting(false);
      return;
    }

    window.location.hash = '/';
  };

  const handleExportKnowledgePack = async () => {
    if (!client) return;

    setExporting(true);
    try {
      await exportKnowledgePack(client.id, client.name);
    } catch (error) {
      console.error('Error exporting knowledge pack:', error);
      alert('Failed to export knowledge pack. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a
            href="#/"
            className="inline-flex items-center gap-2 text-[#2B3D66] hover:text-[#D46A3D] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Clients
          </a>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-[#0F2147]">{client.name}</h1>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                {client.industry && <span>{client.industry}</span>}
                {client.company_size && <span>{client.company_size} employees</span>}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.hash = `#/client/${clientId}/executive`}
                className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#F5A96B] transition-colors"
              >
                <TrendingUp size={18} />
                Executive View
              </button>
              <button
                onClick={handleExportKnowledgePack}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-[#2B3D66] text-white rounded-lg hover:bg-[#0F2147] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                {exporting ? 'Exporting...' : 'Export Knowledge Pack'}
              </button>
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit size={18} />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'processes', label: 'Processes' },
              { id: 'people', label: 'People & Roles' },
              { id: 'data', label: 'Data Sources' },
              { id: 'tools', label: 'Tools' },
              { id: 'knowledge', label: 'Knowledge Docs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#D46A3D] text-[#D46A3D] font-medium'
                    : 'border-transparent text-gray-600 hover:text-[#0F2147]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Processes</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.processCount}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Avg Documentation</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.avgDocScore}%</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Risk Tolerance</div>
                <div className="text-2xl font-semibold text-[#0F2147] capitalize">{client.risk_tolerance || 'medium'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#0F2147] mb-4">Top Automation Opportunities</h3>
                {stats.topAutomation.length === 0 ? (
                  <p className="text-sm text-gray-500">No processes yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topAutomation.map((process) => (
                      <div key={process.id} className="flex justify-between items-center">
                        <span className="text-sm">{process.name}</span>
                        <span className="text-sm font-medium text-[#D46A3D]">
                          {process.automation_potential_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-[#0F2147] mb-4">Highest Data Risk</h3>
                {stats.topRisk.length === 0 ? (
                  <p className="text-sm text-gray-500">No processes yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topRisk.map((process) => (
                      <div key={process.id} className="flex justify-between items-center">
                        <span className="text-sm">{process.name}</span>
                        <span className="text-sm font-medium text-red-600">
                          {process.data_risk_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 size={20} className="text-[#0F2147]" />
                <h3 className="font-semibold text-[#0F2147]">Client Share Link</h3>
              </div>

              {!client.share_token ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate a secure link that allows the client to view and interact with their data.
                  </p>
                  <button
                    onClick={handleGenerateShareLink}
                    className="px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
                  >
                    Generate Share Link
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-[#F5F5F6] rounded-lg">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${window.location.pathname}#/client-share/${client.share_token}`}
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                    />
                    <button
                      onClick={copyShareLink}
                      className="p-2 hover:bg-white rounded transition-colors"
                    >
                      {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateShareLink}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Regenerate Link
                    </button>
                    <button
                      onClick={() => handleToggleShare(!client.share_enabled)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                        client.share_enabled
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {client.share_enabled ? 'Disable Link' : 'Enable Link'}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Status: <span className={client.share_enabled ? 'text-green-600' : 'text-red-600'}>
                      {client.share_enabled ? 'Active' : 'Disabled'}
                    </span>
                    {client.share_expires_at && (
                      <span> • Expires: {new Date(client.share_expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {client.share_token && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck size={20} className="text-[#0F2147]" />
                  <h3 className="font-semibold text-[#0F2147]">AI + Data Literacy Check Link</h3>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Share this link with your client to let them complete a quick AI and data literacy assessment.
                  Results are private and not stored in the database.
                </p>

                <div className="flex items-center gap-2 p-3 bg-[#F5F5F6] rounded-lg">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/c/${client.share_token}/literacy-check`}
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                  />
                  <button
                    onClick={copyLiteracyCheckLink}
                    className="p-2 hover:bg-white rounded transition-colors"
                  >
                    {literacyCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  This link shares the same access status as the Client Share Link above.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'processes' && <ProcessesTab clientId={clientId} />}
        {activeTab === 'people' && <PeopleRolesTab clientId={clientId} />}
        {activeTab === 'data' && <DataSourcesTab clientId={clientId} />}
        {activeTab === 'tools' && <ToolsTab clientId={clientId} />}
        {activeTab === 'knowledge' && <KnowledgeDocumentsTab clientId={clientId} />}
      </div>

      {showEditForm && (
        <ClientForm
          client={client}
          onClose={() => setShowEditForm(false)}
          onSave={() => {
            setShowEditForm(false);
            loadClient();
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#0F2147] mb-4">Delete Client</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{client?.name}</strong>? This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>All processes and process steps</li>
              <li>All people and their literacy assessments</li>
              <li>All roles</li>
              <li>All data sources and trust profiles</li>
              <li>Client share links and access tokens</li>
            </ul>
            <p className="text-red-600 font-medium text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
