import { playMenuSelectSound } from '../utils/sounds';

export type JeopardyDifficulty = 'easy' | 'medium' | 'hard' | 'extra-hard';

interface JeopardyDifficultySelectProps {
  onSelect: (difficulty: JeopardyDifficulty) => void;
  onBack: () => void;
}

export function JeopardyDifficultySelect({ onSelect, onBack }: JeopardyDifficultySelectProps) {
  return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-yellow-300 mb-2">Flag Jeopardy</h1>
          <p className="text-white">Choose your difficulty level</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => { playMenuSelectSound(); onSelect('easy'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🟢</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Easy</h2>
                <p className="text-white text-base">Multiple choice options are random</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('medium'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🟡</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Medium</h2>
                <p className="text-white text-base">Multiple choice options are from same region</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('hard'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔴</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Hard</h2>
                <p className="text-white text-base">Multiple choice options look similar or are spelled similar</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { playMenuSelectSound(); onSelect('extra-hard'); }}
            className="w-full bg-[#2563EB] rounded-2xl p-5 text-left hover:bg-blue-500 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">💀</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-300">Extra Hard</h2>
                <p className="text-white text-base">No multiple choice. Must type out each answer</p>
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
