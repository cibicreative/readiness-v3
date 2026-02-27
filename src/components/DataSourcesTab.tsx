import { useEffect, useState } from 'react';
import { Plus, Database, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database as DB } from '../lib/database.types';
import DataSourceForm from './DataSourceForm';

type DataSource = DB['public']['Tables']['data_sources']['Row'];
type DataTrustProfile = DB['public']['Tables']['data_trust_profiles']['Row'];

interface DataSourceWithTrust extends DataSource {
  trust?: DataTrustProfile;
}

interface DataSourcesTabProps {
  clientId: string;
  readOnly?: boolean;
}

export default function DataSourcesTab({ clientId, readOnly = false }: DataSourcesTabProps) {
  const [dataSources, setDataSources] = useState<DataSourceWithTrust[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSourceWithTrust | undefined>();

  const loadDataSources = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    if (error) {
      console.error('Error loading data sources:', error);
      setLoading(false);
      return;
    }

    const sourcesData = (data || []) as DataSource[];
    const sourcesWithTrust = await Promise.all(
      sourcesData.map(async (source) => {
        const { data: trustDataRaw } = await supabase
          .from('data_trust_profiles')
          .select('*')
          .eq('data_source_id', source.id)
          .maybeSingle();
        const trustData = trustDataRaw as DataTrustProfile | null;

        return {
          ...source,
          trust: trustData || undefined,
        };
      })
    );

    setDataSources(sourcesWithTrust);
    setLoading(false);
  };

  useEffect(() => {
    loadDataSources();
  }, [clientId]);

  const getTrustLabel = (trust?: DataTrustProfile) => {
    if (!trust) return { label: 'Not Assessed', color: 'bg-gray-100 text-gray-700' };

    const score = trust.overall_risk_score;
    if (score <= 33) return { label: 'High Trust', color: 'bg-green-100 text-green-700' };
    if (score <= 66) return { label: 'Medium Trust', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Low Trust', color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Document data sources and assess their trust profiles</p>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
          >
            <Plus size={20} />
            Add Data Source
          </button>
        )}
      </div>

      {dataSources.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Database size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No data sources yet. Add your first data source to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {dataSources.map((source) => {
            const trustInfo = getTrustLabel(source.trust);
            return (
              <div key={source.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-[#0F2147]">{source.name}</h4>
                    <p className="text-sm text-gray-600">{source.system_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <button
                        onClick={() => {
                          setEditingSource(source);
                          setShowForm(true);
                        }}
                        className="p-2 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded text-sm font-medium ${trustInfo.color}`}>
                      {trustInfo.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <div className="font-medium text-gray-900 mt-1">{source.data_type || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <div className="font-medium text-gray-900 mt-1">{source.owner_role || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Update Frequency:</span>
                    <div className="font-medium text-gray-900 mt-1">{source.update_frequency || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Source of Truth:</span>
                    <div className="font-medium text-gray-900 mt-1">
                      {source.is_source_of_truth ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {source.trust && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 mb-2">TRUST PROFILE</div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Completeness:</span>
                        <div className="font-medium text-gray-900 mt-1 capitalize">
                          {source.trust.completeness || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Accuracy:</span>
                        <div className="font-medium text-gray-900 mt-1 capitalize">
                          {source.trust.accuracy || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Timeliness:</span>
                        <div className="font-medium text-gray-900 mt-1 capitalize">
                          {source.trust.timeliness || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Governance:</span>
                        <div className="font-medium text-gray-900 mt-1 capitalize">
                          {source.trust.governance || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Risk Score:</span>
                        <div className="font-medium text-gray-900 mt-1">
                          {source.trust.overall_risk_score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {source.description && (
                  <p className="mt-4 text-sm text-gray-600">{source.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <DataSourceForm
          clientId={clientId}
          dataSource={editingSource}
          onClose={() => {
            setShowForm(false);
            setEditingSource(undefined);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingSource(undefined);
            loadDataSources();
          }}
        />
      )}
    </div>
  );
}
