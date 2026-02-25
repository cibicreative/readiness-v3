import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Process = Database['public']['Tables']['processes']['Row'];

interface ProcessFormProps {
  clientId: string;
  process?: Process;
  onClose: () => void;
  onSave: () => void;
}

export default function ProcessForm({ clientId, process, onClose, onSave }: ProcessFormProps) {
  const [formData, setFormData] = useState({
    name: process?.name || '',
    category: process?.category || 'operations',
    description: process?.description || '',
    owner_role: process?.owner_role || '',
    frequency: process?.frequency || 'weekly',
    trigger: process?.trigger || '',
    desired_outcome: process?.desired_outcome || '',
    is_customer_facing: process?.is_customer_facing || false,
    is_compliance_sensitive: process?.is_compliance_sensitive || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (process) {
      const { error } = await supabase
        .from('processes')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', process.id);

      if (error) {
        console.error('Error updating process:', error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('processes')
        .insert([{ ...formData, client_id: clientId }]);

      if (error) {
        console.error('Error creating process:', error);
        setSaving(false);
        return;
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
            {process ? 'Edit Process' : 'New Process'}
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
            <h3 className="font-semibold text-[#0F2147]">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Process Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="customer support">Customer Support</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency || ''}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
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
                placeholder="e.g., Sales Manager, Operations Lead"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
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
            <h3 className="font-semibold text-[#0F2147]">Process Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger
              </label>
              <input
                type="text"
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                placeholder="What initiates this process?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desired Outcome
              </label>
              <input
                type="text"
                value={formData.desired_outcome}
                onChange={(e) => setFormData({ ...formData, desired_outcome: e.target.value })}
                placeholder="What should this process achieve?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#0F2147]">Risk Flags</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_customer_facing}
                  onChange={(e) => setFormData({ ...formData, is_customer_facing: e.target.checked })}
                  className="w-4 h-4 text-[#D46A3D] rounded focus:ring-2 focus:ring-[#D46A3D]"
                />
                <span className="text-sm text-gray-700">Customer-facing process</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_compliance_sensitive}
                  onChange={(e) => setFormData({ ...formData, is_compliance_sensitive: e.target.checked })}
                  className="w-4 h-4 text-[#D46A3D] rounded focus:ring-2 focus:ring-[#D46A3D]"
                />
                <span className="text-sm text-gray-700">Compliance-sensitive process</span>
              </label>
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
              {saving ? 'Saving...' : process ? 'Update Process' : 'Create Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
