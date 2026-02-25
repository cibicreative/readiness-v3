import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ProcessForm from './ProcessForm';
import ProcessDetailModal from './ProcessDetailModal';
import { calculateProcessCost, formatCurrency } from '../lib/costCalculation';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

interface ProcessWithCost extends Process {
  estimatedCost?: number;
}

interface ProcessesTabProps {
  clientId: string;
  readOnly?: boolean;
}

export default function ProcessesTab({ clientId, readOnly = false }: ProcessesTabProps) {
  const [processes, setProcesses] = useState<ProcessWithCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const loadProcesses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    if (error) {
      console.error('Error loading processes:', error);
      setLoading(false);
      return;
    }

    const processesData = data || [];

    const [stepsRes, rolesRes, toolsRes] = await Promise.all([
      supabase.from('process_steps').select('*').in('process_id', processesData.map(p => p.id)),
      supabase.from('roles').select('*').eq('client_id', clientId),
      supabase.from('tools').select('*'),
    ]);

    const steps = stepsRes.data || [];
    const roles = rolesRes.data || [];
    const tools = toolsRes.data || [];

    const processesWithCost: ProcessWithCost[] = await Promise.all(
      processesData.map(async (process) => {
        const processSteps = steps.filter(s => s.process_id === process.id);

        const stepToolMap: Record<string, string[]> = {};

        const costSummary = calculateProcessCost(processSteps, roles, tools, stepToolMap);

        return {
          ...process,
          estimatedCost: costSummary.totalCost,
        };
      })
    );

    setProcesses(processesWithCost);
    setLoading(false);
  };

  useEffect(() => {
    loadProcesses();
  }, [clientId]);

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'sales': 'bg-blue-100 text-blue-700',
      'marketing': 'bg-purple-100 text-purple-700',
      'operations': 'bg-green-100 text-green-700',
      'customer support': 'bg-yellow-100 text-yellow-700',
      'finance': 'bg-red-100 text-red-700',
      'other': 'bg-gray-100 text-gray-700',
    };
    return colors[category || 'other'] || colors.other;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
        <p className="text-gray-600">Document and assess client processes for automation readiness</p>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
          >
            <Plus size={20} />
            Add Process
          </button>
        )}
      </div>

      {processes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No processes yet. Add your first process to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F5F6] border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Category</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#0F2147]">Owner</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#0F2147]">Est. Cost</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Doc</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Auto</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Risk</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-[#0F2147]">Literacy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processes.map((process) => (
                <tr
                  key={process.id}
                  onClick={() => setSelectedProcess(process)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0F2147]">{process.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{process.frequency}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(process.category)}`}>
                      {process.category || 'other'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{process.owner_role || '-'}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-[#0F2147]">
                    {process.estimatedCost && process.estimatedCost > 0 ? formatCurrency(process.estimatedCost) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${getScoreColor(process.documentation_completeness_score)}`}>
                      {process.documentation_completeness_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${getScoreColor(process.automation_potential_score)}`}>
                      {process.automation_potential_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${getScoreColor(100 - process.data_risk_score)}`}>
                      {process.data_risk_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${getScoreColor(process.literacy_fit_score)}`}>
                      {process.literacy_fit_score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProcessForm
          clientId={clientId}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            loadProcesses();
          }}
        />
      )}

      {selectedProcess && (
        <ProcessDetailModal
          process={selectedProcess}
          onClose={() => setSelectedProcess(null)}
          onUpdate={loadProcesses}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
