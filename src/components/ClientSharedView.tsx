import { useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isShareTokenValid } from '../lib/scoring';
import type { Database } from '../lib/database.types';
import ProcessesTab from './ProcessesTab';
import PeopleRolesTab from './PeopleRolesTab';
import DataSourcesTab from './DataSourcesTab';
import ToolsTab from './ToolsTab';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientSharedViewProps {
  token: string;
}

type Tab = 'overview' | 'processes' | 'people' | 'data' | 'tools';

export default function ClientSharedView({ token }: ClientSharedViewProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [literacyCopied, setLiteracyCopied] = useState(false);
  const [stats, setStats] = useState({
    processCount: 0,
    peopleCount: 0,
    dataSourceCount: 0,
    toolCount: 0,
    avgDocScore: 0,
  });

  useEffect(() => {
    loadClientData();
  }, [token]);

  const loadClientData = async () => {
    setLoading(true);
    setError(null);

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();

    if (clientError || !clientData) {
      setError('This link is invalid or has expired.');
      setLoading(false);
      return;
    }

    if (!isShareTokenValid(clientData.share_enabled, clientData.share_expires_at)) {
      setError('This link is invalid or has expired.');
      setLoading(false);
      return;
    }

    setClient(clientData);

    const [processesRes, peopleRes, dataSourcesRes, toolsRes] = await Promise.all([
      supabase
        .from('processes')
        .select('*')
        .eq('client_id', clientData.id),
      supabase
        .from('people')
        .select('*')
        .eq('client_id', clientData.id),
      supabase
        .from('data_sources')
        .select('*')
        .eq('client_id', clientData.id),
      supabase
        .from('tools')
        .select('*')
        .eq('client_id', clientData.id),
    ]);

    const processes = processesRes.data || [];
    const avgDoc = processes.length > 0
      ? processes.reduce((sum, p) => sum + p.documentation_completeness_score, 0) / processes.length
      : 0;

    setStats({
      processCount: processes.length,
      peopleCount: peopleRes.data?.length || 0,
      dataSourceCount: dataSourcesRes.data?.length || 0,
      toolCount: toolsRes.data?.length || 0,
      avgDocScore: Math.round(avgDoc),
    });

    setLoading(false);
  };

  const copyLiteracyCheckLink = () => {
    if (!client?.share_token) return;

    const url = `${window.location.origin}${window.location.pathname}#/c/${client.share_token}/literacy-check`;
    navigator.clipboard.writeText(url);
    setLiteracyCopied(true);
    setTimeout(() => setLiteracyCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-semibold text-[#0F2147] mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const canEdit = client.client_can_edit || false;

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-[#0F2147] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-4">
            <img
              src="/white_logo.png"
              alt="CiBi Creative"
              className="h-12"
            />
            <div>
              <h1 className="text-2xl font-semibold">Process & Data Readiness Assessment</h1>
              <p className="text-gray-300 mt-1">{client.name}</p>
            </div>
          </div>
          {!canEdit && (
            <div className="mt-4 px-4 py-2 bg-[#2B3D66] rounded-lg text-sm text-gray-300 inline-block">
              Read-Only View
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'processes', label: 'Processes' },
              { id: 'people', label: 'People & Roles' },
              { id: 'data', label: 'Data Sources' },
              { id: 'tools', label: 'Tools' },
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#0F2147] mb-4">Welcome</h2>
              <p className="text-gray-700 mb-4">
                This assessment shows your organization's readiness for AI automation. Use the tabs above to explore
                detailed information about your processes, people, data sources, and tools.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Processes</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.processCount}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">People & Roles</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.peopleCount}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Data Sources</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.dataSourceCount}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Tools</div>
                <div className="text-3xl font-semibold text-[#0F2147]">{stats.toolCount}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Industry</div>
                <div className="text-2xl font-semibold text-[#0F2147]">{client.industry || 'Not specified'}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Avg Documentation</div>
                <div className="text-2xl font-semibold text-[#0F2147]">{stats.avgDocScore}%</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck size={20} className="text-[#0F2147]" />
                <h3 className="font-semibold text-[#0F2147]">Take the AI + Data Literacy Check</h3>
              </div>

              <p className="text-gray-700 mb-4">
                Want to assess your organization's readiness for AI and data initiatives?
                Take our quick 5-minute literacy check to understand your strengths and areas for improvement.
              </p>

              <div className="flex items-center gap-2 p-3 bg-[#F5F5F6] rounded-lg mb-4">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}#/c/${client.share_token}/literacy-check`}
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={copyLiteracyCheckLink}
                  className="p-2 hover:bg-white rounded transition-colors"
                  title="Copy link"
                >
                  {literacyCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>

              <a
                href={`#/c/${client.share_token}/literacy-check`}
                className="inline-block px-6 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
              >
                Start Assessment
              </a>
            </div>
          </div>
        )}

        {activeTab === 'processes' && <ProcessesTab clientId={client.id} readOnly={!canEdit} />}
        {activeTab === 'people' && <PeopleRolesTab clientId={client.id} readOnly={!canEdit} />}
        {activeTab === 'data' && <DataSourcesTab clientId={client.id} readOnly={!canEdit} />}
        {activeTab === 'tools' && <ToolsTab clientId={client.id} readOnly={!canEdit} />}
      </div>
    </div>
  );
}
