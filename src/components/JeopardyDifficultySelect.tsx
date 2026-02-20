import { playMenuSelectSound } from '../utils/sounds';

export type JeopardyQuizMode = 'pick-the-name' | 'pick-the-flag' | 'type-ahead';

interface JeopardyQuizModeSelectProps {
  onSelect: (mode: JeopardyQuizMode) => void;
  onBack: () => void;
}

export function JeopardyDifficultySelect({ onSelect, onBack }: JeopardyQuizModeSelectProps) {
  return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-yellow-300 mb-2">Flag Jeopardy</h1>
          <p className="text-white">Choose your quiz mode</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playMenuSelectSound(); onSelect('pick-the-name'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🏳️</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Pick the Name</h2>
                <p className="text-white text-base">See a flag, pick the country name</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('pick-the-flag'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Pick the Flag</h2>
                <p className="text-white text-base">See a country name, pick the flag</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('type-ahead'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">⌨️</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Type Answer</h2>
                <p className="text-white text-base">See a flag, type the country name</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-blue-100 font-medium hover:text-white transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
