import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type DataSource = Database['public']['Tables']['data_sources']['Row'];
type DataTrustProfile = Database['public']['Tables']['data_trust_profiles']['Row'];

interface DataSourceWithTrust extends DataSource {
  trust?: DataTrustProfile;
}

interface DataSourceFormProps {
  clientId: string;
  dataSource?: DataSourceWithTrust;
  onClose: () => void;
  onSave: () => void;
}

export default function DataSourceForm({ clientId, dataSource, onClose, onSave }: DataSourceFormProps) {
  const [formData, setFormData] = useState({
    name: dataSource?.name || '',
    system_name: dataSource?.system_name || '',
    data_type: (dataSource?.data_type || 'structured') as 'structured' | 'documents' | 'email/messages' | 'audio/video' | 'other',
    owner_role: dataSource?.owner_role || '',
    update_frequency: (dataSource?.update_frequency || 'daily') as 'real-time' | 'daily' | 'weekly' | 'monthly' | 'ad hoc',
    is_source_of_truth: dataSource?.is_source_of_truth || false,
    description: dataSource?.description || '',
  });

  const [trustProfile, setTrustProfile] = useState({
    completeness: (dataSource?.trust?.completeness || 'medium') as 'low' | 'medium' | 'high',
    accuracy: (dataSource?.trust?.accuracy || 'medium') as 'low' | 'medium' | 'high',
    timeliness: (dataSource?.trust?.timeliness || 'medium') as 'low' | 'medium' | 'high',
    governance: (dataSource?.trust?.governance || 'medium') as 'low' | 'medium' | 'high',
    notes: dataSource?.trust?.notes || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataSourceData = {
      ...formData,
      system_name: formData.system_name || null,
      owner_role: formData.owner_role || null,
      description: formData.description || null,
    };

    const trustScoreMap = { low: 3, medium: 2, high: 1 };
    const avgTrustScore = (
      trustScoreMap[trustProfile.completeness] +
      trustScoreMap[trustProfile.accuracy] +
      trustScoreMap[trustProfile.timeliness] +
      trustScoreMap[trustProfile.governance]
    ) / 4;
    const overallRiskScore = Math.round((avgTrustScore - 1) * 50);

    const trustData = {
      ...trustProfile,
      overall_risk_score: overallRiskScore,
      notes: trustProfile.notes || null,
    };

    if (dataSource) {
      const { error: dsError } = await supabase
        .from('data_sources')
        .update(dataSourceData)
        .eq('id', dataSource.id);

      if (dsError) {
        console.error('Error updating data source:', dsError);
        setSaving(false);
        return;
      }

      if (dataSource.trust?.id) {
        const { error: trustError } = await supabase
          .from('data_trust_profiles')
          .update(trustData)
          .eq('id', dataSource.trust.id);

        if (trustError) {
          console.error('Error updating trust profile:', trustError);
        }
      } else {
        const { error: trustError } = await supabase
          .from('data_trust_profiles')
          .insert([{
            data_source_id: dataSource.id,
            ...trustData,
          }]);

        if (trustError) {
          console.error('Error creating trust profile:', trustError);
        }
      }
    } else {
      const { data: newDataSourceRaw, error: dsError } = await supabase
        .from('data_sources')
        .insert([{
          client_id: clientId,
          ...dataSourceData,
        }])
        .select()
        .single();
      const newDataSource = newDataSourceRaw as DataSource | null;

      if (dsError || !newDataSource) {
        console.error('Error creating data source:', dsError);
        setSaving(false);
        return;
      }

      const { error: trustError } = await supabase
        .from('data_trust_profiles')
        .insert([{
          data_source_id: newDataSource.id,
          ...trustData,
        }]);

      if (trustError) {
        console.error('Error creating trust profile:', trustError);
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#0F2147]">
            {dataSource ? 'Edit Data Source' : 'New Data Source'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-[#0F2147]">Data Source Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Source Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Name
              </label>
              <input
                type="text"
                value={formData.system_name}
                onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                placeholder="e.g., Salesforce, MySQL database"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type
                </label>
                <select
                  value={formData.data_type}
                  onChange={(e) => setFormData({ ...formData, data_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="structured">Structured</option>
                  <option value="documents">Documents</option>
                  <option value="email/messages">Email/Messages</option>
                  <option value="audio/video">Audio/Video</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Frequency
                </label>
                <select
                  value={formData.update_frequency}
                  onChange={(e) => setFormData({ ...formData, update_frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="real-time">Real-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="ad hoc">Ad Hoc</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Role
              </label>
              <input
                type="text"
                value={formData.owner_role}
                onChange={(e) => setFormData({ ...formData, owner_role: e.target.value })}
                placeholder="e.g., Data Team, Operations Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_source_of_truth}
                  onChange={(e) => setFormData({ ...formData, is_source_of_truth: e.target.checked })}
                  className="w-4 h-4 text-[#D46A3D] rounded focus:ring-2 focus:ring-[#D46A3D]"
                />
                <span className="text-sm text-gray-700">This is a source of truth</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#0F2147]">Trust Profile</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completeness
                </label>
                <select
                  value={trustProfile.completeness}
                  onChange={(e) => setTrustProfile({ ...trustProfile, completeness: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accuracy
                </label>
                <select
                  value={trustProfile.accuracy}
                  onChange={(e) => setTrustProfile({ ...trustProfile, accuracy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeliness
                </label>
                <select
                  value={trustProfile.timeliness}
                  onChange={(e) => setTrustProfile({ ...trustProfile, timeliness: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Governance
                </label>
                <select
                  value={trustProfile.governance}
                  onChange={(e) => setTrustProfile({ ...trustProfile, governance: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trust Notes
              </label>
              <textarea
                value={trustProfile.notes}
                onChange={(e) => setTrustProfile({ ...trustProfile, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : dataSource ? 'Update Data Source' : 'Create Data Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
