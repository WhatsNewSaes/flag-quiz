export type GameMode = 'free-play' | 'campaign' | 'around-the-world' | 'jeopardy' | 'presentation';

interface GameModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
}

export function GameModeSelect({ onSelectMode }: GameModeSelectProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Fantastic Flags
          </h1>
          <p className="text-gray-600">Test your knowledge of flags from around the world!</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectMode('free-play')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎮</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Free Play</h2>
                <p className="text-gray-600 text-sm">
                  Practice at your own pace. Choose your difficulty levels, continents, and quiz type.
                  No pressure, just fun!
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('campaign')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏆</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Campaign Mode</h2>
                <p className="text-gray-600 text-sm">
                  Challenge yourself through all 5 difficulty levels! Start with well-known flags
                  and work your way up to the most obscure. Track your progress as you go.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('around-the-world')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🗺️</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Around the World</h2>
                <p className="text-gray-600 text-sm">
                  Identify countries on a world map! Countries light up and you pick the correct
                  flag and name. Watch the map fill in as you explore the globe.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('jeopardy')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎰</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Flag Jeopardy</h2>
                <p className="text-gray-600 text-sm">
                  Classic Jeopardy-style game! Pick questions by continent and difficulty.
                  Earn money for correct answers, lose it for wrong ones. Watch out for Daily Doubles!
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('presentation')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow border-2 border-transparent hover:border-teal-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">📖</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Presentation Mode</h2>
                <p className="text-gray-600 text-sm">
                  Study and learn flags at your own pace. See a flag and reveal the name,
                  or see a name and reveal the flag. Perfect for learning!
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
