import { useEffect, useState } from 'react';
import { X, Plus, Edit, Trash2, Calculator, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  calculateDocumentationScore,
  calculateAutomationPotentialScore,
  calculateDataRiskScore,
  calculateLiteracyFitScore,
} from '../lib/scoring';
import { calculateProcessCost, formatCurrency, formatDuration, type ProcessCostSummary } from '../lib/costCalculation';
import { generateKnowledgeFromProcess } from '../lib/knowledge/generateFromProcess';
import type { Database } from '../lib/database.types';
import ProcessForm from './ProcessForm';
import ProcessStepForm from './ProcessStepForm';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type DataSource = Database['public']['Tables']['data_sources']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];

interface ProcessDetailModalProps {
  process: Process;
  onClose: () => void;
  onUpdate: () => void;
  readOnly?: boolean;
}

export default function ProcessDetailModal({ process, onClose, onUpdate, readOnly = false }: ProcessDetailModalProps) {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [linkedDataSources, setLinkedDataSources] = useState<DataSource[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [_tools, setTools] = useState<Tool[]>([]);
  const [costSummary, setCostSummary] = useState<ProcessCostSummary | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | undefined>();
  const [loading, setLoading] = useState(true);
  const [generatingKnowledge, setGeneratingKnowledge] = useState(false);
  const [knowledgeGenerated, setKnowledgeGenerated] = useState(false);
  const [_knowledgeDocId, setKnowledgeDocId] = useState<string | null>(null);

  const loadProcessData = async () => {
    setLoading(true);

    const [stepsRes, dataSourcesRes, rolesRes, toolsRes] = await Promise.all([
      supabase
        .from('process_steps')
        .select('*')
        .eq('process_id', process.id)
        .order('step_order'),
      supabase
        .from('process_data_sources')
        .select('data_source_id, data_sources(*)')
        .eq('process_id', process.id),
      supabase
        .from('roles')
        .select('*')
        .eq('client_id', process.client_id),
      supabase
        .from('tools')
        .select('*'),
    ]);

    const stepsData = (stepsRes.data || []) as ProcessStep[];
    const rolesData = (rolesRes.data || []) as Role[];
    const toolsData = (toolsRes.data || []) as Tool[];

    setSteps(stepsData);
    setLinkedDataSources(
      (dataSourcesRes.data || [])
        .map((ds: any) => ds.data_sources)
        .filter(Boolean)
    );
    setRoles(rolesData);
    setTools(toolsData);

    const stepToolMap: Record<string, string[]> = {};
    const summary = calculateProcessCost(stepsData, rolesData, toolsData, stepToolMap);
    setCostSummary(summary);

    setLoading(false);
  };

  useEffect(() => {
    loadProcessData();
  }, [process.id]);

  const handleRecalculateScores = async () => {
    const { data: trustProfilesRaw } = await supabase
      .from('data_trust_profiles')
      .select('*')
      .in('data_source_id', linkedDataSources.map(ds => ds.id));
    const trustProfiles = trustProfilesRaw as Database['public']['Tables']['data_trust_profiles']['Row'][] | null;

    const { data: assessmentsRaw } = await supabase
      .from('literacy_assessments')
      .select('*')
      .in('person_id', await getRelevantPeopleIds());
    const assessments = assessmentsRaw as Database['public']['Tables']['literacy_assessments']['Row'][] | null;

    const docScore = calculateDocumentationScore(process, steps, linkedDataSources);
    const autoScore = calculateAutomationPotentialScore(process, steps);
    const riskScore = calculateDataRiskScore(process, linkedDataSources, trustProfiles || []);
    const litScore = calculateLiteracyFitScore(assessments || []);

    await supabase
      .from('processes')
      .update({
        documentation_completeness_score: docScore,
        automation_potential_score: autoScore,
        data_risk_score: riskScore,
        literacy_fit_score: litScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', process.id);

    onUpdate();
  };

  const handleGenerateKnowledge = async () => {
    setGeneratingKnowledge(true);
    setKnowledgeGenerated(false);

    try {
      const result = await generateKnowledgeFromProcess({
        clientId: process.client_id,
        processId: process.id
      });

      setKnowledgeDocId(result.documentId);
      setKnowledgeGenerated(true);

      setTimeout(() => {
        setKnowledgeGenerated(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to generate knowledge document:', error);
      alert(`Failed to generate knowledge document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingKnowledge(false);
    }
  };

  const getRelevantPeopleIds = async (): Promise<string[]> => {
    const roleIds = steps.map(s => s.role_id).filter(Boolean) as string[];
    if (roleIds.length === 0) return [];

    const { data } = await supabase
      .from('people')
      .select('id')
      .in('role_id', roleIds);

    return (data || []).map(p => p.id);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return;

    await supabase.from('process_steps').delete().eq('id', stepId);
    loadProcessData();
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return '-';
    return roles.find(r => r.id === roleId)?.title || '-';
  };

  const totalTimeMinutes = steps.reduce((sum, step) => sum + (step.average_time_minutes || 0), 0);
  const totalHours = Math.round(totalTimeMinutes / 60 * 10) / 10;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#0F2147]">{process.name}</h2>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={() => setShowEditForm(true)}
                className="p-2 text-gray-600 hover:text-[#D46A3D] transition-colors"
              >
                <Edit size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Documentation</div>
              <div className="text-2xl font-semibold text-[#0F2147]">
                {process.documentation_completeness_score}%
              </div>
            </div>

            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Automation</div>
              <div className="text-2xl font-semibold text-[#0F2147]">
                {process.automation_potential_score}%
              </div>
            </div>

            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Data Risk</div>
              <div className="text-2xl font-semibold text-[#0F2147]">
                {process.data_risk_score}%
              </div>
            </div>

            <div className="bg-[#F5F5F6] rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Literacy Fit</div>
              <div className="text-2xl font-semibold text-[#0F2147]">
                {process.literacy_fit_score}%
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecalculateScores}
                className="flex items-center gap-2 text-sm text-[#2B3D66] hover:text-[#D46A3D] transition-colors"
              >
                <Calculator size={16} />
                Recalculate All Scores
              </button>
              <button
                onClick={handleGenerateKnowledge}
                disabled={generatingKnowledge}
                className="flex items-center gap-2 text-sm text-[#2B3D66] hover:text-[#D46A3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                {generatingKnowledge ? 'Generating...' : 'Generate Knowledge File'}
              </button>
              {knowledgeGenerated && (
                <span className="text-sm text-green-600 font-medium">
                  Knowledge document created successfully
                </span>
              )}
            </div>
          )}

          {costSummary && costSummary.totalCost > 0 && (
            <div className="bg-gradient-to-br from-[#F5F5F6] to-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-[#D46A3D]" />
                <h3 className="font-semibold text-[#0F2147]">Estimated Process Cost</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Labor Cost</div>
                  <div className="text-xl font-semibold text-[#0F2147]">
                    {formatCurrency(costSummary.totalLaborCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Tool Cost</div>
                  <div className="text-xl font-semibold text-[#0F2147]">
                    {formatCurrency(costSummary.totalToolCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Total Cost</div>
                  <div className="text-2xl font-bold text-[#D46A3D]">
                    {formatCurrency(costSummary.totalCost)}
                  </div>
                </div>
              </div>

              {costSummary.stepBreakdowns.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-[#2B3D66] hover:text-[#D46A3D] cursor-pointer font-medium">
                    View Cost Breakdown by Step
                  </summary>
                  <div className="mt-3 space-y-2">
                    {costSummary.stepBreakdowns.map((breakdown) => (
                      <div key={breakdown.stepId} className="bg-white rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-[#0F2147]">{breakdown.stepTitle}</span>
                          <span className="font-semibold text-[#D46A3D]">{formatCurrency(breakdown.totalCost)}</span>
                        </div>
                        {breakdown.roleName && (
                          <div className="text-xs text-gray-600">
                            Role: {breakdown.roleName} • Duration: {formatDuration(breakdown.duration)} • Labor: {formatCurrency(breakdown.laborCost)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {process.description && (
            <div>
              <h3 className="font-semibold text-[#0F2147] mb-2">Description</h3>
              <p className="text-gray-700">{process.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Category:</span>{' '}
              <span className="text-gray-900">{process.category}</span>
            </div>
            <div>
              <span className="text-gray-600">Frequency:</span>{' '}
              <span className="text-gray-900">{process.frequency}</span>
            </div>
            <div>
              <span className="text-gray-600">Owner:</span>{' '}
              <span className="text-gray-900">{process.owner_role || '-'}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#0F2147]">Process Steps</h3>
              {!readOnly && (
                <button
                  onClick={() => {
                    setEditingStep(undefined);
                    setShowStepForm(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors"
                >
                  <Plus size={16} />
                  Add Step
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : steps.length === 0 ? (
              <div className="bg-[#F5F5F6] rounded-lg p-8 text-center text-gray-500">
                No steps defined yet
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F5F6]">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-[#0F2147] w-12">#</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#0F2147]">Title</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#0F2147]">Role</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#0F2147]">Time</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#0F2147]">Rule-Based</th>
                      {!readOnly && <th className="text-right px-4 py-2 font-semibold text-[#0F2147]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {steps.map((step) => (
                      <tr key={step.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{step.step_order}</td>
                        <td className="px-4 py-3 text-gray-900">{step.title || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{getRoleName(step.role_id)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {step.average_time_minutes ? `${step.average_time_minutes}m` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {step.is_rule_based || '-'}
                        </td>
                        {!readOnly && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setEditingStep(step);
                                setShowStepForm(true);
                              }}
                              className="p-1 text-[#2B3D66] hover:text-[#D46A3D] transition-colors mr-2"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-600">
              Total time per run: <span className="font-medium text-gray-900">{totalHours} hours</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#0F2147] mb-2">Linked Data Sources</h3>
            {linkedDataSources.length === 0 ? (
              <p className="text-sm text-gray-500">No data sources linked</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {linkedDataSources.map((ds) => (
                  <span
                    key={ds.id}
                    className="px-3 py-1 bg-[#F5F5F6] text-sm text-gray-700 rounded"
                  >
                    {ds.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <ProcessForm
          clientId={process.client_id}
          process={process}
          onClose={() => setShowEditForm(false)}
          onSave={() => {
            setShowEditForm(false);
            onUpdate();
            onClose();
          }}
        />
      )}

      {showStepForm && (
        <ProcessStepForm
          processId={process.id}
          clientId={process.client_id}
          step={editingStep}
          nextOrder={steps.length + 1}
          onClose={() => {
            setShowStepForm(false);
            setEditingStep(undefined);
          }}
          onSave={() => {
            setShowStepForm(false);
            setEditingStep(undefined);
            loadProcessData();
          }}
        />
      )}
    </div>
  );
}
