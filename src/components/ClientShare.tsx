import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isShareTokenValid } from '../lib/scoring';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Process = Database['public']['Tables']['processes']['Row'];
type DataSource = Database['public']['Tables']['data_sources']['Row'];
type DataTrustProfile = Database['public']['Tables']['data_trust_profiles']['Row'];

interface ClientShareProps {
  token: string;
}

export default function ClientShare({ token }: ClientShareProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [dataSources, setDataSources] = useState<Array<DataSource & { trust?: DataTrustProfile }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClientData();
  }, [token]);

  const loadClientData = async () => {
    setLoading(true);
    setError(null);

    const { data: clientDataRaw, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    const clientData = clientDataRaw as Client | null;

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

    const [processesRes, dataSourcesRes] = await Promise.all([
      supabase
        .from('processes')
        .select('*')
        .eq('client_id', clientData.id)
        .order('name'),
      supabase
        .from('data_sources')
        .select('*')
        .eq('client_id', clientData.id)
        .order('name'),
    ]);

    setProcesses((processesRes.data || []) as Process[]);

    const dataSourcesData = (dataSourcesRes.data || []) as DataSource[];
    const sourcesWithTrust = await Promise.all(
      dataSourcesData.map(async (source) => {
        const { data: trustDataRaw } = await supabase
          .from('data_trust_profiles')
          .select('*')
          .eq('data_source_id', source.id)
          .maybeSingle();
        const trustData = trustDataRaw as DataTrustProfile | null;

        return { ...source, trust: trustData || undefined };
      })
    );

    setDataSources(sourcesWithTrust);
    setLoading(false);
  };

  const handleApproveProcess = async (processId: string, currentApproval: boolean) => {
    await supabase
      .from('processes')
      .update({
        client_approved_description: !currentApproval,
        updated_at: new Date().toISOString(),
      })
      .eq('id', processId);

    setProcesses(processes.map(p =>
      p.id === processId ? { ...p, client_approved_description: !currentApproval } : p
    ));
  };

  const getReadinessScore = (process: Process) => {
    const autoScore = process.automation_potential_score;
    const docScore = process.documentation_completeness_score;
    const riskScore = 100 - process.data_risk_score;

    const avgScore = (autoScore + docScore + riskScore) / 3;

    if (avgScore >= 70) return { label: 'High', color: 'text-green-600' };
    if (avgScore >= 40) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  const getTrustLabel = (trust?: DataTrustProfile) => {
    if (!trust) return { label: 'Not Assessed', color: 'text-gray-600' };

    const score = trust.overall_risk_score;
    if (score <= 33) return { label: 'High', color: 'text-green-600' };
    if (score <= 66) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
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

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-[#0F2147] text-white p-8">
        <div className="max-w-6xl mx-auto">
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#0F2147] mb-4">Welcome</h2>
          <p className="text-gray-700 mb-4">
            This assessment shows your organization's readiness for AI automation. Please review the
            information below and provide feedback where indicated.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Processes</div>
              <div className="text-2xl font-semibold text-[#0F2147]">{processes.length}</div>
            </div>
            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Data Sources</div>
              <div className="text-2xl font-semibold text-[#0F2147]">{dataSources.length}</div>
            </div>
            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Industry</div>
              <div className="text-lg font-semibold text-[#0F2147]">{client.industry || '-'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#0F2147] mb-4">Your Processes</h2>
          <p className="text-sm text-gray-600 mb-6">
            Review each process and approve the description if it accurately reflects your operations.
          </p>

          {processes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No processes documented yet.</p>
          ) : (
            <div className="space-y-4">
              {processes.map((process) => {
                const readiness = getReadinessScore(process);
                return (
                  <div key={process.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0F2147]">{process.name}</h3>
                        <div className="flex gap-4 mt-1 text-sm text-gray-600">
                          <span className="capitalize">{process.category}</span>
                          <span>{process.frequency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">Automation Readiness</div>
                        <div className={`text-lg font-semibold ${readiness.color}`}>
                          {readiness.label}
                        </div>
                      </div>
                    </div>

                    {process.description && (
                      <p className="text-sm text-gray-700 mb-3">{process.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleApproveProcess(process.id, process.client_approved_description)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                          process.client_approved_description
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle size={16} />
                        {process.client_approved_description ? 'Approved' : 'Approve Description'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[#0F2147] mb-4">Data Sources</h2>
          <p className="text-sm text-gray-600 mb-6">
            Overview of your organization's data sources and their trust levels.
          </p>

          {dataSources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data sources documented yet.</p>
          ) : (
            <div className="grid gap-4">
              {dataSources.map((source) => {
                const trustInfo = getTrustLabel(source.trust);
                return (
                  <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-[#0F2147]">{source.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{source.system_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">Trust Level</div>
                        <div className={`text-sm font-semibold ${trustInfo.color}`}>
                          {trustInfo.label}
                        </div>
                      </div>
                    </div>
                    {source.description && (
                      <p className="text-sm text-gray-600 mt-3">{source.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#F5F5F6] rounded-lg p-6 text-sm text-gray-600">
          <p>
            This assessment is part of your AI readiness evaluation. For questions or to discuss these
            findings, please contact your consultant.
          </p>
        </div>
      </div>
    </div>
  );
}
