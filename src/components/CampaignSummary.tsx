import { Difficulty, difficultyLabels } from '../data/countries';
import { LevelScore } from '../hooks/useCampaign';

interface CampaignSummaryProps {
  levelScores: Record<Difficulty, LevelScore>;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const levels: Difficulty[] = [1, 2, 3, 4, 5];

function getOverallMessage(percentage: number): { title: string; message: string; emoji: string } {
  if (percentage >= 95) {
    return {
      title: "Flag Master!",
      message: "Incredible! You've mastered flags from around the world!",
      emoji: "👑"
    };
  }
  if (percentage >= 85) {
    return {
      title: "Flag Expert!",
      message: "Amazing performance! You really know your geography!",
      emoji: "🏆"
    };
  }
  if (percentage >= 70) {
    return {
      title: "Flag Enthusiast!",
      message: "Great job! You've got solid flag knowledge!",
      emoji: "🌟"
    };
  }
  if (percentage >= 50) {
    return {
      title: "Flag Learner!",
      message: "Good effort! Keep practicing to improve!",
      emoji: "📚"
    };
  }
  return {
    title: "Flag Explorer!",
    message: "Nice try! Play again to learn more flags!",
    emoji: "🌍"
  };
}

export function CampaignSummary({ levelScores, onPlayAgain, onBackToMenu }: CampaignSummaryProps) {
  const totalCorrect = levels.reduce((sum, l) => sum + levelScores[l].correct, 0);
  const totalQuestions = levels.reduce((sum, l) => sum + levelScores[l].total, 0);
  const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const { title, message, emoji } = getOverallMessage(overallPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
          <div className="text-7xl mb-4">{emoji}</div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-white mb-1">
              {totalCorrect}/{totalQuestions}
            </div>
            <div className="text-indigo-100 text-lg">
              {overallPercentage}% overall
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Level Breakdown</h2>

          <div className="space-y-3">
            {levels.map(level => {
              const score = levelScores[level];
              const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

              let barColor = 'bg-gray-300';
              if (percentage >= 80) barColor = 'bg-green-500';
              else if (percentage >= 60) barColor = 'bg-yellow-500';
              else if (percentage >= 40) barColor = 'bg-orange-500';
              else barColor = 'bg-red-500';

              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      Level {level}: {difficultyLabels[level]}
                    </span>
                    <span className="text-gray-600">
                      {score.correct}/{score.total} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
          >
            Play Again
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
