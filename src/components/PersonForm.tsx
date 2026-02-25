import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Role = Database['public']['Tables']['roles']['Row'];
type Person = Database['public']['Tables']['people']['Row'];

interface PersonFormProps {
  clientId: string;
  roles: Role[];
  person?: Person;
  onClose: () => void;
  onSave: () => void;
}

export default function PersonForm({ clientId, roles, person, onClose, onSave }: PersonFormProps) {
  const [formData, setFormData] = useState({
    name: person?.name || '',
    email: person?.email || '',
    role_id: person?.role_id || '',
    hourly_rate_override: person?.hourly_rate_override ? String(person.hourly_rate_override) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name: formData.name,
      email: formData.email || null,
      role_id: formData.role_id || null,
      hourly_rate_override: formData.hourly_rate_override ? parseFloat(formData.hourly_rate_override) : null,
    };

    if (person) {
      const { error } = await supabase
        .from('people')
        .update(data)
        .eq('id', person.id);

      if (error) {
        console.error('Error updating person:', error);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('people').insert([{
        client_id: clientId,
        ...data,
      }]);

      if (error) {
        console.error('Error creating person:', error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#0F2147]">
            {person ? 'Edit Person' : 'New Person'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
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
              Hourly Rate Override
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.hourly_rate_override}
              onChange={(e) => setFormData({ ...formData, hourly_rate_override: e.target.value })}
              placeholder="Leave empty to use role's rate"
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
              {saving ? 'Saving...' : person ? 'Update Person' : 'Create Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
