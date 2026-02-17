import { useState } from 'react';

interface JeopardyDailyDoubleProps {
  currentScore: number;
  onConfirmWager: (wager: number) => void;
}

export function JeopardyDailyDouble({ currentScore, onConfirmWager }: JeopardyDailyDoubleProps) {
  const maxWager = Math.max(currentScore, 1000);
  const [wager, setWager] = useState(Math.min(500, maxWager));

  const presetAmounts = [100, 250, 500, 1000].filter(amt => amt <= maxWager);

  return (
    <div className="fixed inset-0 bg-[#1E3A8A]/95 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        {/* Daily Double animation/title */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-4xl font-bold text-yellow-300 animate-pulse">
            DAILY DOUBLE!
          </h1>
        </div>

        {/* Current score */}
        <div className="mb-6">
          <p className="text-white text-lg">Your current score:</p>
          <p className="text-white text-3xl font-bold">${currentScore}</p>
        </div>

        {/* Wager input */}
        <div className="bg-[#2563EB] rounded-2xl p-6 mb-6">
          <p className="text-white text-lg mb-4">How much will you wager?</p>

          {/* Preset buttons */}
          <div className="flex gap-2 justify-center mb-4 flex-wrap">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setWager(amount)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  wager === amount
                    ? 'bg-yellow-400 text-blue-900'
                    : 'bg-blue-600 text-white hover:bg-blue-600'
                }`}
              >
                ${amount}
              </button>
            ))}
            <button
              onClick={() => setWager(maxWager)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                wager === maxWager
                  ? 'bg-yellow-400 text-blue-900'
                  : 'bg-blue-600 text-white hover:bg-blue-600'
              }`}
            >
              MAX
            </button>
          </div>

          {/* Custom input */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-300 text-2xl">$</span>
            <input
              type="number"
              min={0}
              max={maxWager}
              value={wager}
              onChange={(e) => setWager(Math.min(Math.max(0, parseInt(e.target.value) || 0), maxWager))}
              className="w-32 text-center text-2xl font-bold bg-blue-600 text-white rounded-lg py-2 px-4 border-2 border-blue-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <p className="text-blue-100 text-sm mt-2">
            Max wager: ${maxWager}
          </p>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => onConfirmWager(wager)}
          className="w-full py-4 px-6 bg-yellow-400 text-blue-900 font-bold text-xl rounded-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
        >
          Lock In Wager
        </button>
      </div>
    </div>
  );
}
