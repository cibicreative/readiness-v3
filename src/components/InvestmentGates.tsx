import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface GateDefinition {
  name: string;
  threshold: string;
  passCondition: string;
  yellowCondition: string;
  failCondition: string;
  why: string;
}

const gateDefinitions: GateDefinition[] = [
  {
    name: 'Process Gate',
    threshold: 'Documentation Completeness ≥ 65%',
    passCondition: 'Score ≥ 65',
    yellowCondition: 'Score 55-64',
    failCondition: 'Score < 55',
    why: 'Well-documented processes reduce implementation risk and enable accurate scoping'
  },
  {
    name: 'Data Gate',
    threshold: 'Data Risk Score ≤ 45',
    passCondition: 'Score ≤ 45',
    yellowCondition: 'Score 46-55',
    failCondition: 'Score > 55',
    why: 'Low data risk ensures reliable inputs and trustworthy outputs for automation'
  },
  {
    name: 'People Gate',
    threshold: 'Literacy Fit Score ≥ 60%',
    passCondition: 'Score ≥ 60',
    yellowCondition: 'Score 50-59',
    failCondition: 'Score < 50',
    why: 'Team capability determines adoption success and sustainable operation'
  },
  {
    name: 'Finance Gate',
    threshold: 'Budget Tolerance ≥ Medium',
    passCondition: 'Medium or High tolerance',
    yellowCondition: 'Unknown or not set',
    failCondition: 'Low tolerance',
    why: 'Budget availability ensures investment can be sustained through implementation'
  },
  {
    name: 'Guardrails Gate',
    threshold: 'Enhanced checks for sensitive processes',
    passCondition: 'For customer-facing or compliance-sensitive: Data Risk ≤ 40 AND Doc ≥ 70. Otherwise: pass by default',
    yellowCondition: 'Borderline on either metric',
    failCondition: 'Both metrics below threshold',
    why: 'Extra validation for processes with customer impact or regulatory requirements'
  }
];

export default function InvestmentGates({ clientId }: { clientId: string }) {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => window.location.hash = `#/client/${clientId}/executive`}
            className="flex items-center gap-2 text-[#2B3D66] hover:text-[#0F2147] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Executive Cockpit
          </button>

          <h1 className="text-3xl font-bold text-[#0F2147] mb-2">Investment Gates Reference</h1>
          <p className="text-[#2B3D66]">
            Each investment must pass these gates before proceeding. Yellow indicates borderline readiness. Red indicates blocking issues.
          </p>
        </div>

        <div className="space-y-6">
          {gateDefinitions.map((gate, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-[#F5F5F6] overflow-hidden">
              <div className="bg-[#0F2147] px-6 py-4">
                <h2 className="text-xl font-bold text-white">{gate.name}</h2>
                <p className="text-[#F5A96B] text-sm mt-1">{gate.threshold}</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-green-900 mb-1">Pass</div>
                      <div className="text-sm text-green-700">{gate.passCondition}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-yellow-900 mb-1">Yellow</div>
                      <div className="text-sm text-yellow-700">{gate.yellowCondition}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-red-900 mb-1">Fail</div>
                      <div className="text-sm text-red-700">{gate.failCondition}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F5F5F6]">
                  <h3 className="font-semibold text-[#0F2147] mb-2">Why This Gate Matters</h3>
                  <p className="text-[#2B3D66] text-sm">{gate.why}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-[#F5F5F6] p-6">
          <h2 className="text-xl font-bold text-[#0F2147] mb-4">Investment Categories</h2>
          <p className="text-[#2B3D66] mb-4">
            Based on gate status and process characteristics, investments are classified into these categories:
          </p>

          <div className="space-y-3">
            {[
              { name: 'Process', desc: 'Documentation and process improvement work', typical: 'Small ($5k-$25k)' },
              { name: 'Data', desc: 'Data quality, governance, and infrastructure improvements', typical: 'Small to Medium ($10k-$50k)' },
              { name: 'People', desc: 'Training, upskilling, and change management initiatives', typical: 'Small ($5k-$30k)' },
              { name: 'Automation', desc: 'Rule-based automation with clear deterministic logic', typical: 'Medium ($25k-$100k)' },
              { name: 'AI Tools', desc: 'Adoption of AI-enabled tools for existing workflows', typical: 'Small to Medium ($10k-$60k)' },
              { name: 'AI Implementation', desc: 'Custom AI integration requiring significant development', typical: 'Large ($50k-$250k+)' },
              { name: 'Traditional Software', desc: 'Standard software implementation or customization', typical: 'Medium to Large ($30k-$150k)' }
            ].map((category, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-[#F5F5F6] rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-[#0F2147]">{category.name}</div>
                  <div className="text-sm text-[#2B3D66] mt-1">{category.desc}</div>
                </div>
                <div className="text-sm text-[#2B3D66] font-medium whitespace-nowrap">{category.typical}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
