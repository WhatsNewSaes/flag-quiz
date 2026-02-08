export type JeopardyDifficulty = 'easy' | 'medium' | 'hard';

interface JeopardyDifficultySelectProps {
  onSelect: (difficulty: JeopardyDifficulty) => void;
  onBack: () => void;
}

export function JeopardyDifficultySelect({ onSelect, onBack }: JeopardyDifficultySelectProps) {
  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Flag Jeopardy</h1>
          <p className="text-blue-200">Choose your difficulty level</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('easy')}
            className="w-full bg-blue-800 rounded-2xl p-5 text-left hover:bg-blue-700 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🟢</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-400">Easy</h2>
                <p className="text-blue-200 text-sm">Random answer options from any country</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('medium')}
            className="w-full bg-blue-800 rounded-2xl p-5 text-left hover:bg-blue-700 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🟡</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-400">Medium</h2>
                <p className="text-blue-200 text-sm">Answer options from the same continent</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('hard')}
            className="w-full bg-blue-800 rounded-2xl p-5 text-left hover:bg-blue-700 transition-colors border-2 border-transparent hover:border-yellow-400"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔴</div>
              <div>
                <h2 className="text-lg font-bold text-yellow-400">Hard</h2>
                <p className="text-blue-200 text-sm">Similar-looking flags for Pick the Flag questions</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 text-blue-300 font-medium hover:text-white transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
