import { QuizMode } from '../hooks/useQuiz';

interface CampaignQuizTypeSelectProps {
  onSelect: (quizType: QuizMode) => void;
  onBack: () => void;
}

export function CampaignQuizTypeSelect({ onSelect, onBack }: CampaignQuizTypeSelectProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Campaign Mode</h1>
          <p className="text-gray-600">Choose how you want to play</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('multiple-choice')}
            className="w-full bg-white rounded-2xl shadow-lg p-5 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🏳️</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Pick the Name</h2>
                <p className="text-gray-500 text-sm">See a flag, pick the country name</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('flag-picker')}
            className="w-full bg-white rounded-2xl shadow-lg p-5 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Pick the Flag</h2>
                <p className="text-gray-500 text-sm">See a country name, pick the flag</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('type-ahead')}
            className="w-full bg-white rounded-2xl shadow-lg p-5 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-300"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">⌨️</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Type Answer</h2>
                <p className="text-gray-500 text-sm">See a flag, type the country name</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-gray-500 font-medium hover:text-gray-700 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
