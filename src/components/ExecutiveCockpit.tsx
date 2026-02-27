import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Shield, Target, Filter, ArrowUpDown, BookOpen } from 'lucide-react';
import { calculateExecutiveMetrics } from '../lib/executiveScoring';
import { calculateKnowledgeMaturityForClient, type KnowledgeMaturityMetrics } from '../lib/knowledge/knowledgeMaturity';
import type { InvestmentCategory, RiskClass, SequencingBucket } from '../lib/executiveScoring';
import type { Database } from '../lib/database.types';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface ProcessWithMetrics extends Process {
  valueScore: number;
  feasibilityScore: number;
  riskClass: RiskClass;
  investmentCategory: InvestmentCategory;
  sequencingBucket: SequencingBucket;
  steps: ProcessStep[];
  hasKnowledgeDoc?: boolean;
}

export default function ExecutiveCockpit({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [processes, setProcesses] = useState<ProcessWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [knowledgeMaturity, setKnowledgeMaturity] = useState<KnowledgeMaturityMetrics | null>(null);

  const [filterBucket, setFilterBucket] = useState<SequencingBucket | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<InvestmentCategory | 'all'>('all');
  const [filterRisk, setFilterRisk] = useState<RiskClass | 'all'>('all');
  const [filterProcessCategory, setFilterProcessCategory] = useState<string>('all');
  const [filterMissingDocs, setFilterMissingDocs] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'value' | 'feasibility' | 'none'>('none');

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: clientDataRaw } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      const clientData = clientDataRaw as Client | null;

      setClient(clientData);

      const { data: processDataRaw } = await supabase
        .from('processes')
        .select('*')
        .eq('client_id', clientId);
      const processData = processDataRaw as Process[] | null;

      if (!processData) {
        setProcesses([]);
        return;
      }

      const processesWithMetrics: ProcessWithMetrics[] = [];

      // Get all knowledge documents for this client
      const { data: knowledgeDocs } = await supabase
        .from('knowledge_documents')
        .select('source_entity_id')
        .eq('client_id', clientId)
        .eq('doc_type', 'process')
        .eq('source_entity_type', 'process');

      const processIdsWithDocs = new Set(
        knowledgeDocs?.map(doc => doc.source_entity_id).filter(Boolean) || []
      );

      for (const process of processData) {
        const { data: stepsRaw } = await supabase
          .from('process_steps')
          .select('*')
          .eq('process_id', process.id)
          .order('step_order');
        const steps = stepsRaw as ProcessStep[] | null;

        const metrics = calculateExecutiveMetrics(
          process,
          steps || [],
          client?.risk_tolerance || 'unknown'
        );

        processesWithMetrics.push({
          ...process,
          steps: steps || [],
          ...metrics,
          hasKnowledgeDoc: processIdsWithDocs.has(process.id)
        });
      }

      setProcesses(processesWithMetrics);

      // Load knowledge maturity metrics
      const maturityMetrics = await calculateKnowledgeMaturityForClient(clientId);
      setKnowledgeMaturity(maturityMetrics);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProcesses = processes
    .filter(p => filterBucket === 'all' || p.sequencingBucket === filterBucket)
    .filter(p => filterCategory === 'all' || p.investmentCategory === filterCategory)
    .filter(p => filterRisk === 'all' || p.riskClass === filterRisk)
    .filter(p => filterProcessCategory === 'all' || p.category === filterProcessCategory)
    .filter(p => {
      if (!filterMissingDocs) return true;
      // Show only processes without knowledge docs
      return !p.hasKnowledgeDoc;
    });

  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    if (sortBy === 'value') return b.valueScore - a.valueScore;
    if (sortBy === 'feasibility') return b.feasibilityScore - a.feasibilityScore;
    return 0;
  });

  const doNowCount = processes.filter(p => p.sequencingBucket === 'do_now').length;
  const prepareCount = processes.filter(p => p.sequencingBucket === 'prepare').length;
  const investmentCategoryCounts = processes.reduce((acc, p) => {
    acc[p.investmentCategory] = (acc[p.investmentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(investmentCategoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const gateFailures = processes.reduce((acc, p) => {
    const metrics = calculateExecutiveMetrics(p, p.steps, client?.risk_tolerance || 'unknown');
    Object.entries(metrics.gateStatus).forEach(([gate, status]) => {
      if (status === 'fail') {
        acc[gate] = (acc[gate] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const topGateIssue = Object.entries(gateFailures)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const fundCandidates = processes
    .filter(p => p.sequencingBucket === 'do_now')
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 2);

  const fixCandidate = processes
    .filter(p => p.sequencingBucket === 'prepare')
    .sort((a, b) => b.valueScore - a.valueScore)[0];

  const dontFundCandidate = processes
    .filter(p => p.sequencingBucket === 'avoid')
    .sort((a, b) => b.valueScore - a.valueScore)[0];

  if (loading) {
    return <div className="p-8 text-[#2B3D66]">Loading executive cockpit...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F2147] mb-2">Executive Cockpit</h1>
          <p className="text-[#2B3D66]">{client?.name || 'Client'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#D46A3D] bg-opacity-10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#D46A3D]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-[#2B3D66] mb-2">Investment Posture</h3>
            <p className="text-2xl font-bold text-[#0F2147] mb-1">{topCategory}</p>
            <p className="text-sm text-[#2B3D66]">
              {doNowCount} ready now, {prepareCount} in preparation
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#F5A96B] bg-opacity-30 rounded-lg">
                <Shield className="w-6 h-6 text-[#D46A3D]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-[#2B3D66] mb-2">Readiness Gates</h3>
            <p className="text-2xl font-bold text-[#0F2147] mb-1">
              {topGateIssue === 'None' ? 'All Green' : `${topGateIssue} Gate`}
            </p>
            <p className="text-sm text-[#2B3D66]">
              {topGateIssue === 'None' ? 'No blocking issues' : 'Top blocker'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#0F2147] bg-opacity-10 rounded-lg">
                <Target className="w-6 h-6 text-[#0F2147]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-[#2B3D66] mb-2">This Week's Decisions</h3>
            <div className="space-y-1 text-sm text-[#2B3D66]">
              {fundCandidates.map(p => (
                <div key={p.id}>Fund: {p.name}</div>
              ))}
              {fixCandidate && <div>Fix: {fixCandidate.name}</div>}
              {dontFundCandidate && <div>Don't fund: {dontFundCandidate.name}</div>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-[#F5F5F6]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#2B3D66] bg-opacity-10 rounded-lg">
                <BookOpen className="w-6 h-6 text-[#2B3D66]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-[#2B3D66] mb-2">Knowledge Maturity</h3>
            {knowledgeMaturity ? (
              <>
                <p className="text-2xl font-bold text-[#0F2147] mb-1">
                  {knowledgeMaturity.averageMaturity}%
                </p>
                <p className="text-sm text-[#2B3D66] mb-2">
                  {knowledgeMaturity.percentProcessesWithDocs}% documented
                </p>
                {knowledgeMaturity.missingDocCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterMissingDocs(!filterMissingDocs);
                      if (!filterMissingDocs) {
                        // Reset other filters when showing missing docs
                        setFilterBucket('all');
                        setFilterCategory('all');
                        setFilterRisk('all');
                        setFilterProcessCategory('all');
                      }
                    }}
                    className="text-xs text-[#D46A3D] hover:underline"
                  >
                    {filterMissingDocs ? 'Show all' : `View ${knowledgeMaturity.missingDocCount} missing`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-[#2B3D66]">Loading...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#F5F5F6]">
          <div className="p-6 border-b border-[#F5F5F6]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F2147]">Opportunity Portfolio</h2>
                {filterMissingDocs && (
                  <p className="text-sm text-[#D46A3D] mt-1">Showing processes without knowledge documentation</p>
                )}
              </div>
              <button
                onClick={() => window.location.hash = `#/client/${clientId}/executive/gates`}
                className="px-4 py-2 text-sm bg-[#2B3D66] text-white rounded-lg hover:bg-[#0F2147] transition-colors"
              >
                View Gates Reference
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2B3D66]" />
                <select
                  value={filterBucket}
                  onChange={(e) => setFilterBucket(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-[#F5F5F6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
                >
                  <option value="all">All Buckets</option>
                  <option value="do_now">Do Now</option>
                  <option value="prepare">Prepare</option>
                  <option value="defer">Defer</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-[#F5F5F6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              >
                <option value="all">All Investment Types</option>
                <option value="process">Process</option>
                <option value="data">Data</option>
                <option value="people">People</option>
                <option value="automation">Automation</option>
                <option value="AI tools">AI Tools</option>
                <option value="AI implementation">AI Implementation</option>
                <option value="traditional software">Traditional Software</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-[#F5F5F6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>

              <select
                value={filterProcessCategory}
                onChange={(e) => setFilterProcessCategory(e.target.value)}
                className="px-3 py-1.5 text-sm border border-[#F5F5F6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D46A3D]"
              >
                <option value="all">All Process Categories</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="operations">Operations</option>
                <option value="customer support">Customer Support</option>
                <option value="finance">Finance</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={() => setSortBy(sortBy === 'value' ? 'feasibility' : sortBy === 'feasibility' ? 'none' : 'value')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[#F5F5F6] rounded-lg hover:bg-[#F5F5F6] transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortBy === 'value' ? 'Sort: Value' : sortBy === 'feasibility' ? 'Sort: Feasibility' : 'Sort'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F5F6] text-left text-sm font-medium text-[#2B3D66]">
                  <th className="px-6 py-3">Process Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Feasibility</th>
                  <th className="px-6 py-3">Risk</th>
                  <th className="px-6 py-3">Investment Type</th>
                  <th className="px-6 py-3">Sequencing</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.map((process) => (
                  <tr key={process.id} className="border-t border-[#F5F5F6] hover:bg-[#F5F5F6] hover:bg-opacity-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0F2147]">{process.name}</td>
                    <td className="px-6 py-4 text-sm text-[#2B3D66] capitalize">{process.category || 'other'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-[#F5F5F6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D46A3D]"
                            style={{ width: `${process.valueScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#2B3D66]">{process.valueScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-[#F5F5F6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2B3D66]"
                            style={{ width: `${process.feasibilityScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#2B3D66]">{process.feasibilityScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        process.riskClass === 'low' ? 'bg-green-100 text-green-800' :
                        process.riskClass === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {process.riskClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2B3D66]">{process.investmentCategory}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        process.sequencingBucket === 'do_now' ? 'bg-green-100 text-green-800' :
                        process.sequencingBucket === 'prepare' ? 'bg-blue-100 text-blue-800' :
                        process.sequencingBucket === 'defer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {process.sequencingBucket}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.location.hash = `#/client/${clientId}/executive/roadmap/${process.id}`}
                          className="px-3 py-1.5 text-sm bg-[#2B3D66] text-white rounded-lg hover:bg-[#0F2147] transition-colors"
                        >
                          View Roadmap
                        </button>
                        <button
                          onClick={() => window.location.hash = `#/client/${clientId}/executive/memo/${process.id}`}
                          className="px-3 py-1.5 text-sm bg-[#D46A3D] text-white rounded-lg hover:bg-[#F5A96B] transition-colors"
                        >
                          Create Memo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedProcesses.length === 0 && (
              <div className="p-12 text-center text-[#2B3D66]">
                No processes match the current filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
