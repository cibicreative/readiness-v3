import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Download, Copy } from 'lucide-react';
import { calculateExecutiveMetrics, getBudgetRangeBand } from '../lib/executiveScoring';
import type { Database } from '../lib/database.types';
import jsPDF from 'jspdf';

type Process = Database['public']['Tables']['processes']['Row'];
type ProcessStep = Database['public']['Tables']['process_steps']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface MemoData {
  client: Client;
  process: Process;
  steps: ProcessStep[];
  metrics: ReturnType<typeof calculateExecutiveMetrics>;
}

export default function InvestmentMemo({ clientId, processId }: { clientId: string; processId: string }) {
  const [data, setData] = useState<MemoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clientId, processId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: clientDataRaw } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      const clientData = clientDataRaw as Client | null;

      const { data: processDataRaw } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .maybeSingle();
      const processData = processDataRaw as Process | null;

      const { data: stepsRaw } = await supabase
        .from('process_steps')
        .select('*')
        .eq('process_id', processId)
        .order('step_order');
      const steps = stepsRaw as ProcessStep[] | null;

      if (clientData && processData) {
        const metrics = calculateExecutiveMetrics(
          processData,
          steps || [],
          clientData.risk_tolerance || 'unknown'
        );

        setData({
          client: clientData,
          process: processData,
          steps: steps || [],
          metrics
        });
      }
    } catch (error) {
      console.error('Error loading memo data:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateMemoText(): string {
    if (!data) return '';

    const { client, process, metrics } = data;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prerequisites: string[] = [];
    Object.entries(metrics.gateStatus).forEach(([gate, status]) => {
      if (status !== 'pass') {
        const gateName = gate.replace('Gate', '').replace(/([A-Z])/g, ' $1').trim();
        prerequisites.push(`${gateName} (${status === 'yellow' ? 'borderline' : 'not met'})`);
      }
    });

    const kpis = generateKPIs(process.category || 'other');
    const stopRules = generateStopRules(metrics.investmentCategory);

    return `INVESTMENT MEMO
${client.name}
${today}

INITIATIVE: ${process.name}

RECOMMENDED INVESTMENT CATEGORY: ${metrics.investmentCategory}

WHY NOW:
${generateWhyNow(data)}

WHY NOT YET:
${generateWhyNotYet(data)}

SEQUENCING: ${metrics.sequencingBucket}
Rationale: ${generateSequencingRationale(data)}

PREREQUISITES:
${prerequisites.length > 0 ? prerequisites.map(p => `- ${p}`).join('\n') : '- All gates passed'}

KEY PERFORMANCE INDICATORS:
${kpis.map((kpi, i) => `${i + 1}. ${kpi}`).join('\n')}

Baseline: Establish baseline measurements before implementation

RISK NOTES & GUARDRAILS:
- Risk Classification: ${metrics.riskClass}
- Data Risk Score: ${process.data_risk_score || 0}/100
${process.is_customer_facing ? '- Customer-facing process: requires extra validation' : ''}
${process.is_compliance_sensitive ? '- Compliance-sensitive: legal review required' : ''}

RECOMMENDED OWNER:
Role: ${process.owner_role || 'Process Owner (TBD)'}

BUDGET RANGE:
${getBudgetRangeBand(metrics.investmentCategory)}

STOP RULES / EXIT CRITERIA:
${stopRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

---
v3 Executive Memo | Process & Data Readiness Assessment
`;
  }

  function generateWhyNow(data: MemoData): string {
    const { process, metrics } = data;
    const reasons: string[] = [];

    if (metrics.valueScore >= 70) {
      reasons.push('High value potential with strong automation opportunity');
    } else if (metrics.valueScore >= 60) {
      reasons.push('Good value potential based on frequency and time investment');
    }

    if (metrics.feasibilityScore >= 70) {
      reasons.push('Process is well-documented and ready for implementation');
    }

    if (process.frequency === 'daily') {
      reasons.push('Daily frequency amplifies ROI potential');
    }

    if (metrics.riskClass === 'low') {
      reasons.push('Low risk profile allows for faster deployment');
    }

    return reasons.length > 0 ? reasons.join('\n') : 'Opportunity aligns with current strategic priorities';
  }

  function generateWhyNotYet(data: MemoData): string {
    const { process, metrics } = data;
    const blockers: string[] = [];

    if (process.documentation_completeness_score < 65) {
      blockers.push('Process documentation needs completion before implementation');
    }

    if (process.data_risk_score > 65) {
      blockers.push('Data quality and governance must be addressed first');
    }

    if (process.literacy_fit_score < 50) {
      blockers.push('Team literacy needs improvement for successful adoption');
    }

    if (metrics.riskClass === 'high') {
      blockers.push('High risk requires additional mitigation strategies');
    }

    const failedGates = Object.entries(metrics.gateStatus)
      .filter(([, status]) => status === 'fail')
      .map(([gate]) => gate.replace('Gate', ''));

    if (failedGates.length > 0) {
      blockers.push(`Investment gates not met: ${failedGates.join(', ')}`);
    }

    return blockers.length > 0 ? blockers.join('\n') : 'No significant blockers identified';
  }

  function generateSequencingRationale(data: MemoData): string {
    const { metrics } = data;

    switch (metrics.sequencingBucket) {
      case 'do_now':
        return 'High value, high feasibility, acceptable risk. Ready for immediate investment.';
      case 'prepare':
        return 'Valuable opportunity but requires foundational work before implementation.';
      case 'defer':
        return 'Either risk is too high or prerequisites are not yet met. Revisit after addressing blockers.';
      case 'avoid':
        return 'Low value potential or unacceptable risk profile. Not recommended for investment at this time.';
      default:
        return '';
    }
  }

  function generateKPIs(category: string): string[] {
    const baseKPIs = ['Time-to-complete reduction', 'Error rate reduction'];

    const categoryKPIs: Record<string, string[]> = {
      'sales': ['Conversion rate improvement', 'Deal cycle time reduction'],
      'marketing': ['Lead quality improvement', 'Campaign response time'],
      'operations': ['Throughput improvement', 'Cycle time reduction'],
      'customer support': ['Response time improvement', 'Customer satisfaction score'],
      'finance': ['Processing time reduction', 'Accuracy improvement']
    };

    return [...baseKPIs, ...(categoryKPIs[category] || ['Process efficiency gain'])].slice(0, 3);
  }

  function generateStopRules(category: string): string[] {
    const isQuickWin = ['automation', 'AI tools'].includes(category);
    const threshold = isQuickWin ? '20%' : '10%';
    const timeframe = isQuickWin ? '30 days' : '60 days';

    return [
      `If KPIs do not improve by at least ${threshold} within ${timeframe}, pause and reassess`,
      'If risk profile changes significantly during implementation, halt and re-evaluate',
      'If budget exceeds estimated range by 50% or more, escalate for executive review'
    ];
  }

  function downloadPDF() {
    if (!data) return;

    const doc = new jsPDF();
    const text = generateMemoText();
    const lines = text.split('\n');

    doc.setFontSize(10);
    let y = 20;

    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      if (line.startsWith('INVESTMENT MEMO') || line.startsWith('INITIATIVE:')) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
      } else if (line.match(/^[A-Z\s]+:$/)) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }

      const splitLine = doc.splitTextToSize(line, 180);
      doc.text(splitLine, 15, y);
      y += splitLine.length * 5 + 2;
    });

    doc.save(`investment-memo-${data.process.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  function copyMarkdown() {
    const text = generateMemoText();
    navigator.clipboard.writeText(text);
    alert('Memo copied to clipboard!');
  }

  if (loading) {
    return <div className="p-8 text-[#2B3D66]">Loading investment memo...</div>;
  }

  if (!data) {
    return <div className="p-8 text-[#2B3D66]">Memo data not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => window.location.hash = `#/client/${clientId}/executive`}
            className="flex items-center gap-2 text-[#2B3D66] hover:text-[#0F2147] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Executive Cockpit
          </button>

          <div className="flex gap-3">
            <button
              onClick={copyMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-[#2B3D66] text-white rounded-lg hover:bg-[#0F2147] transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Markdown
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#F5A96B] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#F5F5F6] p-12">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-[#0F2147] leading-relaxed">
              {generateMemoText()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
