import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

interface ProcessStepFormProps {
  processId: string;
  clientId: string;
  step?: ProcessStep;
  nextOrder: number;
  onClose: () => void;
  onSave: () => void;
}

export default function ProcessStepForm({ processId, clientId, step, nextOrder, onClose, onSave }: ProcessStepFormProps) {
  const [formData, setFormData] = useState({
    step_order: step?.step_order || nextOrder,
    title: step?.title || '',
    description: step?.description || '',
    tool_id: step?.tool_id || '',
    role_id: step?.role_id || '',
    average_time_minutes: step?.average_time_minutes || 0,
    estimated_duration_minutes: step?.estimated_duration_minutes || 0,
    is_rule_based: step?.is_rule_based || 'mixed',
    risk_notes: step?.risk_notes || '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      const [rolesRes, toolsRes] = await Promise.all([
        supabase.from('roles').select('*').eq('client_id', clientId).order('title'),
        supabase.from('tools').select('*').order('name'),
      ]);

      setRoles(rolesRes.data || []);
      setTools(toolsRes.data || []);
    };

    loadOptions();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      ...formData,
      tool_id: formData.tool_id || null,
      role_id: formData.role_id || null,
    };

    if (step) {
      const { error } = await supabase
        .from('process_steps')
        .update(data)
        .eq('id', step.id);

      if (error) {
        console.error('Error updating step:', error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('process_steps')
        .insert([{ ...data, process_id: processId }]);

      if (error) {
        console.error('Error creating step:', error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#0F2147]">
            {step ? 'Edit Step' : 'New Step'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Order *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.step_order}
                onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Time (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.average_time_minutes}
                onChange={(e) => setFormData({ ...formData, average_time_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Duration (min)
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) })}
                placeholder="For cost calc"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Role
              </label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tool Used
              </label>
              <select
                value={formData.tool_id}
                onChange={(e) => setFormData({ ...formData, tool_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              >
                <option value="">Select tool</option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule-Based Nature
            </label>
            <select
              value={formData.is_rule_based}
              onChange={(e) => setFormData({ ...formData, is_rule_based: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
            >
              <option value="mostly_rules">Mostly Rules</option>
              <option value="mixed">Mixed</option>
              <option value="mostly_judgment">Mostly Judgment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Notes
            </label>
            <textarea
              value={formData.risk_notes}
              onChange={(e) => setFormData({ ...formData, risk_notes: e.target.value })}
              rows={2}
              placeholder="Any specific risks or concerns for this step"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
            />
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
              {saving ? 'Saving...' : step ? 'Update Step' : 'Create Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
