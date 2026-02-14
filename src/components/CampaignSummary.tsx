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
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="retro-window text-center mb-6">
          <div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between">
            <span>✦</span><span>Campaign Complete</span><span>✦</span>
          </div>
          <div className="retro-window-body p-8">
            <div className="text-7xl mb-4">{emoji}</div>

            <h1 className="text-3xl font-retro text-retro-gold mb-2">{title}</h1>
            <p className="text-retro-text-secondary mb-6">{message}</p>

            <div className="bg-retro-gold rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-white mb-1">
                {totalCorrect}/{totalQuestions}
              </div>
              <div className="text-yellow-100 text-lg">
                {overallPercentage}% overall
              </div>
            </div>
          </div>
        </div>

        <div className="bg-retro-surface pixel-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-retro-text mb-4">Level Breakdown</h2>

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
            className="retro-btn w-full py-4 px-6 bg-retro-neon-blue text-white font-bold font-retro text-sm"
          >
            Play Again
          </button>

          <button
            onClick={onBackToMenu}
            className="retro-btn w-full py-3 px-6 bg-retro-surface text-retro-text-secondary font-medium"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
