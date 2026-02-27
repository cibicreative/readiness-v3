import { useEffect, useState } from 'react';
import { Plus, Edit, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ToolForm from './ToolForm';

type Tool = Database['public']['Tables']['tools']['Row'];

interface ToolsTabProps {
  clientId: string;
  readOnly?: boolean;
}

export default function ToolsTab({ clientId, readOnly = false }: ToolsTabProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | undefined>();

  const loadTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    if (error) {
      console.error('Error loading tools:', error);
    } else {
      setTools((data || []) as Tool[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTools();
  }, [clientId]);

  const getTotalMonthlyCost = () => {
    return tools.reduce((sum, tool) => {
      if (!tool.subscription_cost) return sum;

      if (tool.billing_cycle === 'yearly') {
        return sum + (tool.subscription_cost / 12);
      }
      return sum + tool.subscription_cost;
    }, 0);
  };

  const getTotalYearlyCost = () => {
    return tools.reduce((sum, tool) => {
      if (!tool.subscription_cost) return sum;

      if (tool.billing_cycle === 'yearly') {
        return sum + tool.subscription_cost;
      }
      return sum + (tool.subscription_cost * 12);
    }, 0);
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
        <p className="text-gray-600">Manage software tools and their subscription costs</p>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
          >
            <Plus size={20} />
            Add Tool
          </button>
        )}
      </div>

      {tools.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Monthly Cost</div>
            <div className="text-2xl font-semibold text-[#0F2147]">
              ${getTotalMonthlyCost().toFixed(2)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Yearly Cost</div>
            <div className="text-2xl font-semibold text-[#0F2147]">
              ${getTotalYearlyCost().toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {tools.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Wrench size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No tools added yet. Start tracking your software stack.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F5F6] border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Vendor</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Seats</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Cost</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Billing</th>
                {!readOnly && <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0F2147]">{tool.name}</div>
                    {tool.plan_name && (
                      <div className="text-xs text-gray-500 mt-1">{tool.plan_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{tool.type || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">{tool.vendor || '-'}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{tool.num_seats || '-'}</td>
                  <td className="px-6 py-4 text-right text-gray-700">
                    {tool.subscription_cost ? `$${tool.subscription_cost}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tool.billing_cycle && (
                      <span className="px-2 py-1 bg-[#F5F5F6] text-gray-700 rounded text-xs capitalize">
                        {tool.billing_cycle}
                      </span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingTool(tool);
                          setShowForm(true);
                        }}
                        className="p-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ToolForm
          tool={editingTool}
          onClose={() => {
            setShowForm(false);
            setEditingTool(undefined);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingTool(undefined);
            loadTools();
          }}
        />
      )}
    </div>
  );
}
