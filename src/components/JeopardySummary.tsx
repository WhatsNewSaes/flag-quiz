interface JeopardySummaryProps {
  score: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function getScoreMessage(score: number): { title: string; message: string; emoji: string } {
  if (score >= 15000) {
    return {
      title: "Jeopardy Champion!",
      message: "Incredible performance! You're a flag master!",
      emoji: "👑"
    };
  }
  if (score >= 10000) {
    return {
      title: "Outstanding!",
      message: "You really know your flags!",
      emoji: "🏆"
    };
  }
  if (score >= 5000) {
    return {
      title: "Great Job!",
      message: "Solid flag knowledge!",
      emoji: "🌟"
    };
  }
  if (score >= 0) {
    return {
      title: "Good Effort!",
      message: "Keep practicing to improve!",
      emoji: "👏"
    };
  }
  return {
    title: "Tough Game!",
    message: "Don't give up - try again!",
    emoji: "💪"
  };
}

export function JeopardySummary({ score, onPlayAgain, onBackToMenu }: JeopardySummaryProps) {
  const { title, message, emoji } = getScoreMessage(score);

  return (
    <div className="fixed inset-0 bg-blue-900/95 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-4">{emoji}</div>

        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-blue-200 text-lg mb-8">{message}</p>

        <div className="bg-blue-800 rounded-2xl p-6 mb-8">
          <p className="text-blue-300 text-lg mb-2">Final Score</p>
          <p className={`text-5xl font-bold ${score >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            ${score.toLocaleString()}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-6 bg-yellow-400 text-blue-900 font-bold text-xl rounded-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
          >
            Play Again
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full py-3 px-6 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-600 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
