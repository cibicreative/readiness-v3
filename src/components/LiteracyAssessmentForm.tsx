import { useState, useEffect } from 'react';
import { X, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type LiteracyAssessment = Database['public']['Tables']['literacy_assessments']['Row'];
type LiteracyAssessmentInsert = Database['public']['Tables']['literacy_assessments']['Insert'];

interface LiteracyAssessmentFormProps {
  personId: string;
  personName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function LiteracyAssessmentForm({
  personId,
  personName,
  onClose,
  onSave
}: LiteracyAssessmentFormProps) {
  const [assessments, setAssessments] = useState<LiteracyAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [formData, setFormData] = useState({
    overall_level: 'basic' as 'novice' | 'basic' | 'applied' | 'optimizer',
    score_numeric: 50,
    self_confidence_level: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
  });

  useEffect(() => {
    loadAssessments();
  }, [personId]);

  const loadAssessments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('literacy_assessments')
      .select('*')
      .eq('person_id', personId)
      .order('assessment_date', { ascending: false });

    setAssessments(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newAssessment: LiteracyAssessmentInsert = {
      person_id: personId,
      overall_level: formData.overall_level,
      score_numeric: formData.score_numeric,
      self_confidence_level: formData.self_confidence_level,
      notes: formData.notes || null,
      assessment_date: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('literacy_assessments')
      .insert(newAssessment);

    setSaving(false);

    if (!error) {
      setShowNewForm(false);
      setFormData({
        overall_level: 'basic',
        score_numeric: 50,
        self_confidence_level: 'medium',
        notes: '',
      });
      loadAssessments();
      onSave();
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'novice': return 'bg-red-100 text-red-800';
      case 'basic': return 'bg-yellow-100 text-yellow-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'optimizer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const levelDescriptions = {
    novice: 'Limited or no experience with AI and data tools',
    basic: 'Can use basic AI/data tools and understand simple reports',
    applied: 'Proficient with AI/data tools, can create analyses independently',
    optimizer: 'Expert level, can optimize AI/data processes and mentor others',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D46A3D] rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#0F2147]">AI and Data Literacy Assessment</h2>
              <p className="text-sm text-gray-600">{personName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="bg-[#F5F5F6] border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-[#D46A3D] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">About AI and Data Literacy Assessment</p>
                  <p>Track team members' proficiency with AI tools, data analytics, and digital processes. This helps identify training needs and ensures processes are matched to team capabilities.</p>
                </div>
              </div>
            </div>
          </div>

          {!showNewForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full px-4 py-3 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors font-medium"
              >
                Add New Assessment
              </button>
            </div>
          )}

          {showNewForm && (
            <div className="mb-6 bg-[#F5F5F6] border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#0F2147] mb-4">New Assessment</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall AI and Data Literacy Level
                  </label>
                  <select
                    value={formData.overall_level}
                    onChange={(e) => setFormData({ ...formData, overall_level: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
                    required
                  >
                    <option value="novice">Novice</option>
                    <option value="basic">Basic</option>
                    <option value="applied">Applied</option>
                    <option value="optimizer">Optimizer</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-600">
                    {levelDescriptions[formData.overall_level]}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numeric Score (0-100)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.score_numeric}
                      onChange={(e) => setFormData({ ...formData, score_numeric: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-[#0F2147] w-12 text-right">
                      {formData.score_numeric}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Self-Confidence Level
                  </label>
                  <select
                    value={formData.self_confidence_level}
                    onChange={(e) => setFormData({ ...formData, self_confidence_level: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
                    rows={3}
                    placeholder="Additional observations, training needs, or context..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#D46A3D] text-white rounded-lg hover:bg-[#c25f34] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Assessment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-[#0F2147] mb-4">Assessment History</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                No assessments recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getLevelBadgeColor(assessment.overall_level || 'basic')}`}>
                          {assessment.overall_level}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceBadgeColor(assessment.self_confidence_level || 'medium')}`}>
                          {assessment.self_confidence_level} confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp size={14} />
                        <span className="font-semibold">{assessment.score_numeric}/100</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(assessment.assessment_date || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {assessment.notes && (
                      <p className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-100">
                        {assessment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
