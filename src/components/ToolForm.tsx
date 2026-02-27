import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Tool = Database['public']['Tables']['tools']['Row'];

interface ToolFormProps {
  tool?: Tool;
  clientId?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ToolForm({ tool, clientId, onClose, onSave }: ToolFormProps) {
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    type: tool?.type || '',
    vendor: tool?.vendor || '',
    plan_name: tool?.plan_name || '',
    billing_cycle: (tool?.billing_cycle || 'monthly') as 'monthly' | 'yearly',
    subscription_cost: tool?.subscription_cost ? String(tool.subscription_cost) : '',
    num_seats: tool?.num_seats ? String(tool.num_seats) : '',
    contract_notes: tool?.contract_notes || '',
    monthly_cost: tool?.monthly_cost ? String(tool.monthly_cost) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name: formData.name,
      type: formData.type || null,
      vendor: formData.vendor || null,
      plan_name: formData.plan_name || null,
      billing_cycle: formData.billing_cycle,
      subscription_cost: formData.subscription_cost ? parseFloat(formData.subscription_cost) : null,
      num_seats: formData.num_seats ? parseInt(formData.num_seats) : null,
      contract_notes: formData.contract_notes || null,
      monthly_cost: formData.monthly_cost ? parseFloat(formData.monthly_cost) : null,
    };

    if (tool) {
      const { error } = await supabase
        .from('tools')
        .update(data)
        .eq('id', tool.id);

      if (error) {
        console.error('Error updating tool:', error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('tools')
        .insert([{ ...data, client_id: clientId || null }]);

      if (error) {
        console.error('Error creating tool:', error);
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
            {tool ? 'Edit Tool' : 'New Tool'}
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
                Tool Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Salesforce, Slack, HubSpot"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., CRM, Communication, Marketing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., Salesforce, Slack Technologies"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={formData.plan_name}
                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                placeholder="e.g., Professional, Enterprise, Business"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#0F2147]">Subscription Details</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Period
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subscription_cost}
                  onChange={(e) => setFormData({ ...formData, subscription_cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Seats
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.num_seats}
                  onChange={(e) => setFormData({ ...formData, num_seats: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Cost for Cost Estimation ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_cost}
                  onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Monthly cost used for process cost estimation. Leave blank if tool cost is negligible.</p>
            </div>

            {formData.subscription_cost && (
              <div className="bg-[#F5F5F6] rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Cost Breakdown</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monthly: </span>
                    <span className="font-semibold text-[#0F2147]">
                      ${formData.billing_cycle === 'yearly'
                        ? (parseFloat(formData.subscription_cost) / 12).toFixed(2)
                        : parseFloat(formData.subscription_cost).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Yearly: </span>
                    <span className="font-semibold text-[#0F2147]">
                      ${formData.billing_cycle === 'yearly'
                        ? parseFloat(formData.subscription_cost).toFixed(2)
                        : (parseFloat(formData.subscription_cost) * 12).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Notes
              </label>
              <textarea
                value={formData.contract_notes}
                onChange={(e) => setFormData({ ...formData, contract_notes: e.target.value })}
                rows={3}
                placeholder="e.g., Annual contract, renews in 6 months"
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
              {saving ? 'Saving...' : tool ? 'Update Tool' : 'Create Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
