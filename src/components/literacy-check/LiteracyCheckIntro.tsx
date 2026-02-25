import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Confidence } from './scoring';

interface UserInfo {
  userName: string;
  userRole: string;
  company: string;
  managerEmail: string;
  managerName: string;
  selfConfidence: Confidence;
}

export function LiteracyCheckIntro() {
  const token = window.location.hash.match(/\/c\/([^/]+)\//)?.[1] || '';

  const [formData, setFormData] = useState<UserInfo>({
    userName: '',
    userRole: '',
    company: '',
    managerEmail: '',
    managerName: '',
    selfConfidence: 'medium',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<Record<keyof UserInfo, string>> = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Name is required';
    }
    if (!formData.userRole.trim()) {
      newErrors.userRole = 'Role is required';
    }
    if (!formData.selfConfidence) {
      newErrors.selfConfidence = 'Please select your confidence level';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    localStorage.setItem('literacyCheckUserInfo', JSON.stringify(formData));

    window.location.hash = `/c/${token}/literacy-check/questions`;
  };

  const handleChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0F2147] mb-4">
            Employee AI & Data Competency Assessment
          </h2>
          <p className="text-[#2B3D66] mb-4">
            Evaluate your skills in AI usage, data handling, and process automation. This assessment measures your current competency level and identifies growth opportunities.
          </p>
          <div className="bg-[#F5F5F6] rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#D46A3D] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#2B3D66]">Takes 10-15 minutes to complete</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#D46A3D] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#2B3D66]">40 questions covering AI knowledge, data competency, and automation</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#D46A3D] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#2B3D66]">Scored 0-100 with competency level classification</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#D46A3D] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#2B3D66]">Personalized learning recommendations</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#D46A3D] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#2B3D66]">Download PDF report to share with your manager</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-[#0F2147] mb-2">
              Your Name <span className="text-[#D46A3D]">*</span>
            </label>
            <input
              type="text"
              id="userName"
              value={formData.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent ${
                errors.userName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.userName && (
              <p className="mt-1 text-sm text-red-600">{errors.userName}</p>
            )}
          </div>

          <div>
            <label htmlFor="userRole" className="block text-sm font-medium text-[#0F2147] mb-2">
              Your Role <span className="text-[#D46A3D]">*</span>
            </label>
            <input
              type="text"
              id="userRole"
              value={formData.userRole}
              onChange={(e) => handleChange('userRole', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent ${
                errors.userRole ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Operations Manager"
            />
            {errors.userRole && (
              <p className="mt-1 text-sm text-red-600">{errors.userRole}</p>
            )}
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-[#0F2147] mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F2147] mb-2">
              How confident are you in your AI and data skills? <span className="text-[#D46A3D]">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'low', label: 'Low - I\'m just beginning to learn' },
                { value: 'medium', label: 'Medium - I have basic skills and am building competency' },
                { value: 'high', label: 'High - I\'m quite proficient and use these tools regularly' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-[#F5F5F6] transition-colors"
                >
                  <input
                    type="radio"
                    name="selfConfidence"
                    value={option.value}
                    checked={formData.selfConfidence === option.value}
                    onChange={(e) => handleChange('selfConfidence', e.target.value as Confidence)}
                    className="w-4 h-4 text-[#D46A3D] focus:ring-[#D46A3D]"
                  />
                  <span className="ml-3 text-[#2B3D66]">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.selfConfidence && (
              <p className="mt-1 text-sm text-red-600">{errors.selfConfidence}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-[#0F2147] mb-3">
              Optional: Manager Information
            </h3>
            <p className="text-sm text-[#2B3D66] mb-4">
              If you'd like to share your results with your manager, provide their details below.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="managerName" className="block text-sm font-medium text-[#0F2147] mb-2">
                  Manager's Name
                </label>
                <input
                  type="text"
                  id="managerName"
                  value={formData.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
                  placeholder="Manager's full name"
                />
              </div>

              <div>
                <label htmlFor="managerEmail" className="block text-sm font-medium text-[#0F2147] mb-2">
                  Manager's Email
                </label>
                <input
                  type="email"
                  id="managerEmail"
                  value={formData.managerEmail}
                  onChange={(e) => handleChange('managerEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D46A3D] focus:border-transparent"
                  placeholder="manager@company.com"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#D46A3D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#C25A2D] transition-colors flex items-center justify-center gap-2"
          >
            Start Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
