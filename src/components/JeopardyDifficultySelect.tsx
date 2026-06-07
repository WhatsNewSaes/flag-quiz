import { playMenuSelectSound } from '../utils/sounds';

export type JeopardyQuizMode = 'easy' | 'hard';

interface JeopardyQuizModeSelectProps {
  onSelect: (mode: JeopardyQuizMode) => void;
  onBack: () => void;
}

export function JeopardyDifficultySelect({ onSelect, onBack }: JeopardyQuizModeSelectProps) {
  return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/modes/jeopardy.webp" alt="Jeopardy Mode" className="w-full max-w-sm mx-auto rounded-lg pixel-border mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Flag Jeopardy</h1>
          <p className="text-white">Choose your difficulty</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playMenuSelectSound(); onSelect('easy'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎮</div>
              <div>
                <h2 className="text-lg font-bold text-white">Easy Mode</h2>
                <p className="text-white text-base">Pick the right name or flag from four options</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('hard'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">⌨️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Hard Mode</h2>
                <p className="text-white text-base">Type the country name instead of choosing from options</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-blue-50 font-medium hover:text-white transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
