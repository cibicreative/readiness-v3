import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { QUESTIONS } from './questions';
import { UserAnswers } from './scoring';

export function LiteracyCheckQuestions() {
  const token = window.location.hash.match(/\/c\/([^/]+)\//)?.[1] || '';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const userInfo = localStorage.getItem('literacyCheckUserInfo');
    if (!userInfo) {
      window.location.hash = `/c/${token}/literacy-check`;
      return;
    }

    const savedAnswers = localStorage.getItem('literacyCheckAnswers');
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [token]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('literacyCheckAnswers', JSON.stringify(answers));
    }
  }, [answers]);

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
    setError('');
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      setError('Please select an option before continuing');
      return;
    }

    if (isLastQuestion) {
      window.location.hash = `/c/${token}/literacy-check/results`;
    } else {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setError('');
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#F5F5F6] px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#0F2147]">
              Question {currentIndex + 1} of {QUESTIONS.length}
            </span>
            <span className="text-sm text-[#2B3D66]">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#D46A3D] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-[#F5A96B] bg-opacity-20 text-[#D46A3D] text-xs font-medium rounded-full mb-4">
              {currentQuestion.domain.charAt(0).toUpperCase() + currentQuestion.domain.slice(1)} Domain
            </div>
            <h2 className="text-2xl font-bold text-[#0F2147] mb-2">
              {currentQuestion.prompt}
            </h2>
            {currentQuestion.type === 'proof' && (
              <p className="text-sm text-[#2B3D66]">
                Scenario-based question
              </p>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-[#D46A3D] bg-[#F5A96B] bg-opacity-10'
                      : 'border-gray-200 hover:border-[#2B3D66] hover:bg-[#F5F5F6]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#D46A3D] bg-[#D46A3D]'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`${isSelected ? 'text-[#0F2147] font-medium' : 'text-[#2B3D66]'}`}>
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-[#F5F5F6] px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#0F2147] hover:bg-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-[#D46A3D] text-white rounded-lg font-medium hover:bg-[#C25A2D] transition-colors"
          >
            {isLastQuestion ? 'View Results' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
