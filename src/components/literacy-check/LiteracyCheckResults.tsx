import { useEffect, useState } from 'react';
import { Download, Mail, Copy, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { calculateResults, AssessmentResults, Confidence, UserAnswers } from './scoring';
import { Domain } from './questions';

interface UserInfo {
  userName: string;
  userRole: string;
  company: string;
  managerEmail: string;
  managerName: string;
  selfConfidence: Confidence;
}

const getDomainDisplayName = (domain: Domain): string => {
  const names: Record<Domain, string> = {
    ai_knowledge: 'AI Knowledge',
    data_competency: 'Data Competency',
    automation: 'Process Automation',
  };
  return names[domain];
};

export function LiteracyCheckResults() {
  const token = window.location.hash.match(/\/c\/([^/]+)\//)?.[1] || '';
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUserInfo = localStorage.getItem('literacyCheckUserInfo');
    const savedAnswers = localStorage.getItem('literacyCheckAnswers');

    if (!savedUserInfo || !savedAnswers) {
      window.location.hash = `/c/${token}/literacy-check`;
      return;
    }

    const userInfoData: UserInfo = JSON.parse(savedUserInfo);
    const answers: UserAnswers = JSON.parse(savedAnswers);

    setUserInfo(userInfoData);
    const calculatedResults = calculateResults(answers, userInfoData.selfConfidence);
    setResults(calculatedResults);
  }, [token]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'optimizer': return 'text-green-700 bg-green-100';
      case 'applied': return 'text-blue-700 bg-blue-100';
      case 'basic': return 'text-yellow-700 bg-yellow-100';
      case 'novice': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getCalibrationIcon = (flag: string) => {
    if (flag === 'aligned') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getCalibrationMessage = (flag: string) => {
    switch (flag) {
      case 'aligned':
        return 'Your self-assessment aligns well with your results.';
      case 'overconfident risk':
        return 'Your confidence is higher than your current readiness suggests - focus on building foundational skills.';
      case 'underconfident potential':
        return 'You\'re more ready than you think! Consider taking on more advanced initiatives.';
      default:
        return '';
    }
  };

  const generatePDF = () => {
    if (!results || !userInfo) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(20);
    doc.setTextColor(15, 33, 71);
    doc.text('Employee AI & Data Competency Report', pageWidth / 2, y, { align: 'center' });

    y += 15;
    doc.setFontSize(10);
    doc.setTextColor(43, 61, 102);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' });
    doc.text('Assessment Version: v1', pageWidth / 2, y + 5, { align: 'center' });

    y += 20;
    doc.setDrawColor(212, 106, 61);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(15, 33, 71);
    doc.text('Participant Information', 20, y);

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(43, 61, 102);
    doc.text(`Name: ${userInfo.userName}`, 25, y);
    y += 6;
    doc.text(`Role: ${userInfo.userRole}`, 25, y);
    if (userInfo.company) {
      y += 6;
      doc.text(`Company: ${userInfo.company}`, 25, y);
    }

    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(15, 33, 71);
    doc.text('Overall Assessment', 20, y);

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(43, 61, 102);
    doc.text(`Overall Score: ${results.overallScore}/100`, 25, y);
    y += 6;
    doc.text(`Readiness Level: ${results.overallLevel.toUpperCase()}`, 25, y);
    y += 6;
    doc.text(`Self Confidence: ${results.selfConfidence.toUpperCase()}`, 25, y);
    y += 6;
    doc.text(`Calibration: ${results.calibrationFlag}`, 25, y);

    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(15, 33, 71);
    doc.text('Domain Scores', 20, y);

    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(43, 61, 102);
    const domains: { key: Domain; label: string }[] = [
      { key: 'ai_knowledge', label: 'AI Knowledge' },
      { key: 'data_competency', label: 'Data Competency' },
      { key: 'automation', label: 'Process Automation' },
    ];
    domains.forEach(({ key, label }) => {
      doc.text(`${label}: ${results.domainScores[key]}/100`, 25, y);
      y += 6;
    });

    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(15, 33, 71);
    doc.text('Areas for Development', 20, y);

    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(43, 61, 102);
    results.topRisks.forEach((risk, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${risk}`, pageWidth - 50);
      doc.text(lines, 25, y);
      y += lines.length * 5;
    });

    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(15, 33, 71);
    doc.text('Learning Recommendations', 20, y);

    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(43, 61, 102);
    results.nextActions.forEach((action, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${action}`, pageWidth - 50);
      doc.text(lines, 25, y);
      y += lines.length * 5;
    });

    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      y += 15;
    }

    doc.setDrawColor(212, 106, 61);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(15, 33, 71);
    doc.text('Import Block (for systems integration)', 20, y);

    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const importData = {
      version: results.version,
      timestamp: results.timestamp,
      overallLevel: results.overallLevel,
      overallScore: results.overallScore,
      selfConfidence: results.selfConfidence,
      calibrationFlag: results.calibrationFlag,
      domainScores: results.domainScores,
    };
    const importText = JSON.stringify(importData, null, 2);
    const importLines = doc.splitTextToSize(importText, pageWidth - 40);
    doc.text(importLines, 20, y);

    const fileName = `AI-Data-Competency_Report_${userInfo.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    setPdfDownloaded(true);
  };

  const handleEmailManager = () => {
    if (!userInfo || !results) return;

    if (!pdfDownloaded) {
      generatePDF();
    }

    const subject = `AI & Data Competency Assessment: ${userInfo.userName}${userInfo.company ? ` (${userInfo.company})` : ''}`;
    const fileName = `AI-Data-Competency_Report_${userInfo.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    const body = `Hi${userInfo.managerName ? ` ${userInfo.managerName}` : ''},

I've completed an AI & Data Competency assessment. Here are my results:

Overall Score: ${results.overallScore}/100
Competency Level: ${results.overallLevel.toUpperCase()}
Calibration: ${results.calibrationFlag}

Domain Scores:
- AI Knowledge: ${results.domainScores.ai_knowledge}/100
- Data Competency: ${results.domainScores.data_competency}/100
- Process Automation: ${results.domainScores.automation}/100

Areas for Development:
${results.topRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Learning Recommendations:
${results.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Please find the detailed PDF report attached (${fileName}).

Best regards,
${userInfo.userName}`;

    const mailtoLink = `mailto:${userInfo.managerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const copySummary = async () => {
    if (!results || !userInfo) return;

    const summary = `Employee AI & Data Competency Assessment Results

Name: ${userInfo.userName}
Role: ${userInfo.userRole}
${userInfo.company ? `Company: ${userInfo.company}\n` : ''}
Date: ${new Date().toLocaleDateString()}

Overall Score: ${results.overallScore}/100
Competency Level: ${results.overallLevel.toUpperCase()}
Self Confidence: ${results.selfConfidence.toUpperCase()}
Calibration: ${results.calibrationFlag}

Domain Scores:
- AI Knowledge: ${results.domainScores.ai_knowledge}/100
- Data Competency: ${results.domainScores.data_competency}/100
- Process Automation: ${results.domainScores.automation}/100

Areas for Development:
${results.topRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Learning Recommendations:
${results.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStartOver = () => {
    localStorage.removeItem('literacyCheckUserInfo');
    localStorage.removeItem('literacyCheckAnswers');
    window.location.hash = `/c/${token}/literacy-check`;
  };

  if (!results || !userInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2B3D66]">Calculating your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D46A3D] bg-opacity-10 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-[#D46A3D]" />
          </div>
          <h2 className="text-3xl font-bold text-[#0F2147] mb-2">Assessment Complete!</h2>
          <p className="text-[#2B3D66]">Here are your AI & Data Competency results</p>
        </div>

        <div className="bg-gradient-to-br from-[#0F2147] to-[#2B3D66] rounded-lg p-8 text-white mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{results.overallScore}</div>
            <div className="text-xl mb-4">out of 100</div>
            <div className={`inline-block px-4 py-2 rounded-full font-medium ${getLevelColor(results.overallLevel)} text-lg`}>
              {results.overallLevel.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#0F2147] mb-4">Domain Scores</h3>
          <div className="space-y-4">
            {(Object.keys(results.domainScores) as Domain[]).map(domain => (
              <div key={domain}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#0F2147]">{getDomainDisplayName(domain)}</span>
                  <span className="text-sm font-bold text-[#2B3D66]">{results.domainScores[domain]}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#D46A3D] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${results.domainScores[domain]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F5F5F6] rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            {getCalibrationIcon(results.calibrationFlag)}
            <div>
              <h4 className="font-bold text-[#0F2147] mb-1">
                Calibration: {results.calibrationFlag}
              </h4>
              <p className="text-sm text-[#2B3D66]">
                {getCalibrationMessage(results.calibrationFlag)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#0F2147] mb-3">Areas for Development</h3>
          <ul className="space-y-2">
            {results.topRisks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D46A3D] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B3D66]">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#0F2147] mb-3">Learning Recommendations</h3>
          <ul className="space-y-2">
            {results.nextActions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#2B3D66]">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={generatePDF}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#D46A3D] text-white rounded-lg font-medium hover:bg-[#C25A2D] transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>

          {userInfo.managerEmail && (
            <button
              onClick={handleEmailManager}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0F2147] text-white rounded-lg font-medium hover:bg-[#2B3D66] transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email Manager
            </button>
          )}

          <button
            onClick={copySummary}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#0F2147] text-[#0F2147] rounded-lg font-medium hover:bg-[#F5F5F6] transition-colors"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>

          <button
            onClick={handleStartOver}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-[#2B3D66] rounded-lg font-medium hover:bg-[#F5F5F6] transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </button>
        </div>

        {!pdfDownloaded && userInfo.managerEmail && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              When emailing your manager, make sure to attach the PDF report that will be downloaded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
