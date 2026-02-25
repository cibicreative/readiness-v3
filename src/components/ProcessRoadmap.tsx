import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, TrendingUp, Target } from 'lucide-react';
import { calculateExecutiveMetrics } from '../lib/executiveScoring';
import { generateProcessRoadmap } from '../lib/roadmapGeneration';
import { calculateProcessCost, calculateRoadmapCostEstimate } from '../lib/costCalculation';
import type { ProcessRoadmap as RoadmapType } from '../lib/roadmapGeneration';
import type { Database } from '../lib/database.types';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];
type Tool = Database['public']['Tables']['tools']['Row'];
type DataSource = Database['public']['Tables']['data_sources']['Row'];

export default function ProcessRoadmap({
  clientId,
  processId,
  onBack
}: {
  clientId: string;
  processId: string;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [process, setProcess] = useState<Process | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    loadRoadmap();
  }, [clientId, processId]);

  async function loadRoadmap() {
    try {
      setLoading(true);

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      setClient(clientData);

      const { data: processData } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .maybeSingle();

      if (!processData) return;
      setProcess(processData);

      const { data: steps } = await supabase
        .from('process_steps')
        .select('*')
        .eq('process_id', processId)
        .order('step_order');

      const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .eq('client_id', clientId);

      const { data: tools } = await supabase
        .from('tools')
        .select('*')
        .eq('client_id', clientId);

      const { data: dataSources } = await supabase
        .from('data_sources')
        .select('*')
        .eq('client_id', clientId);

      const { data: processTools } = await supabase
        .from('process_tools')
        .select('tool_id, step_id')
        .eq('process_id', processId);

      const stepToolMap: Record<string, string[]> = {};
      processTools?.forEach((pt) => {
        if (pt.step_id) {
          if (!stepToolMap[pt.step_id]) {
            stepToolMap[pt.step_id] = [];
          }
          stepToolMap[pt.step_id].push(pt.tool_id);
        }
      });

      const metrics = calculateExecutiveMetrics(
        processData,
        steps || [],
        clientData?.risk_tolerance || 'unknown'
      );

      const processCost = calculateProcessCost(
        steps || [],
        roles || [],
        tools || [],
        stepToolMap
      );

      const avgHourlyRate = roles && roles.length > 0
        ? roles.reduce((sum, role) => sum + (role.hourly_rate || 0), 0) / roles.length
        : 150;

      const teamSize = clientData?.team_size || 5;
      const literacyScore = processData.literacy_fit_score || 0;
      const dataRiskScore = processData.data_risk_score || 0;

      const failures: string[] = [];
      if (metrics.gateStatus.processGate === 'fail') failures.push('Process Documentation');
      if (metrics.gateStatus.dataGate === 'fail') failures.push('Data Quality');
      if (metrics.gateStatus.peopleGate === 'fail') failures.push('Team Literacy');
      if (metrics.gateStatus.financeGate === 'fail') failures.push('Budget Allocation');
      if (metrics.gateStatus.guardrailsGate === 'fail') failures.push('Risk & Compliance');

      const costEstimate = calculateRoadmapCostEstimate(
        processCost,
        failures,
        teamSize,
        dataSources?.length || 0,
        literacyScore,
        dataRiskScore,
        avgHourlyRate
      );

      const generatedRoadmap = generateProcessRoadmap(
        processData,
        steps || [],
        metrics,
        costEstimate
      );
      setRoadmap(generatedRoadmap);
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] p-8">
        <div className="text-[#2B3D66]">Loading roadmap...</div>
      </div>
    );
  }

  if (!roadmap || !process) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] p-8">
        <div className="text-[#2B3D66]">Unable to load roadmap</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#2B3D66] hover:text-[#0F2147] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Executive Cockpit
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F2147] mb-2">Implementation Roadmap</h1>
          <p className="text-xl text-[#2B3D66] mb-4">{roadmap.processName}</p>
          <p className="text-[#2B3D66]">{client?.name || 'Client'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#D46A3D] bg-opacity-10 rounded-lg">
                <Target className="w-5 h-5 text-[#D46A3D]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#2B3D66] mb-1">Current Status</h3>
                <p className="text-lg font-semibold text-[#0F2147]">{roadmap.currentStatus}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#F5A96B] bg-opacity-30 rounded-lg">
                <Clock className="w-5 h-5 text-[#D46A3D]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#2B3D66] mb-1">Timeline</h3>
                <p className="text-lg font-semibold text-[#0F2147]">{roadmap.overallTimeline}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#0F2147] bg-opacity-10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#0F2147]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#2B3D66] mb-1">Total Phases</h3>
                <p className="text-lg font-semibold text-[#0F2147]">{roadmap.phases.length}</p>
              </div>
            </div>
          </div>
        </div>

        {roadmap.criticalPath.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-[#F5F5F6] p-6 mb-8">
            <h2 className="text-xl font-bold text-[#0F2147] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#D46A3D]" />
              Critical Path
            </h2>
            <ol className="space-y-3">
              {roadmap.criticalPath.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D46A3D] bg-opacity-10 text-[#D46A3D] text-sm font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[#2B3D66] pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {roadmap.dependencies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-[#F5F5F6] p-6 mb-8">
            <h2 className="text-xl font-bold text-[#0F2147] mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F5A96B]" />
              Key Dependencies
            </h2>
            <ul className="space-y-2">
              {roadmap.dependencies.map((dep, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[#2B3D66]">
                  <span className="text-[#F5A96B] mt-1">•</span>
                  {dep}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-[#F5F5F6] p-6">
          <h2 className="text-xl font-bold text-[#0F2147] mb-6">Implementation Phases</h2>

          <div className="space-y-8">
            {roadmap.phases.map((phase) => (
              <div key={phase.phase} className="relative">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#D46A3D] text-white font-bold flex items-center justify-center text-lg">
                      {phase.phase + 1}
                    </div>
                    {phase.phase < roadmap.phases.length - 1 && (
                      <div className="w-0.5 h-full bg-[#F5F5F6] mt-2" style={{ minHeight: '80px' }}></div>
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0F2147] mb-1">{phase.name}</h3>
                        <p className="text-sm text-[#2B3D66] flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {phase.duration}
                          {phase.estimatedCost && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="font-medium">{phase.estimatedCost}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="text-[#2B3D66] font-medium mb-4">{phase.objective}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0F2147] mb-3">Key Actions</h4>
                        <ul className="space-y-2">
                          {phase.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-[#2B3D66]">
                              <span className="text-[#D46A3D] mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[#0F2147] mb-3">Success Criteria</h4>
                        <ul className="space-y-2">
                          {phase.successCriteria.map((criterion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-[#2B3D66]">
                              <CheckCircle2 className="w-4 h-4 text-[#D46A3D] flex-shrink-0 mt-0.5" />
                              <span>{criterion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#2B3D66] text-white rounded-lg hover:bg-[#0F2147] transition-colors"
          >
            Return to Executive Cockpit
          </button>
        </div>
      </div>
    </div>
  );
}
