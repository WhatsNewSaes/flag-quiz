import { Difficulty, difficultyLabels } from '../data/countries';
import { LevelScore } from '../hooks/useCampaign';

interface LevelSummaryProps {
  level: Difficulty;
  score: LevelScore;
  onContinue: () => void;
}

function getEncouragement(percentage: number): { message: string; emoji: string } {
  if (percentage === 100) {
    return { message: "Perfect score! You're a flag master!", emoji: "🏆" };
  }
  if (percentage >= 90) {
    return { message: "Outstanding! Almost perfect!", emoji: "🌟" };
  }
  if (percentage >= 80) {
    return { message: "Great job! You really know your flags!", emoji: "🎉" };
  }
  if (percentage >= 70) {
    return { message: "Nice work! Keep it up!", emoji: "👏" };
  }
  if (percentage >= 60) {
    return { message: "Good effort! You're learning!", emoji: "💪" };
  }
  if (percentage >= 50) {
    return { message: "Not bad! Practice makes perfect!", emoji: "📚" };
  }
  return { message: "Keep trying! You'll get better!", emoji: "🌱" };
}

export function LevelSummary({ level, score, onContinue }: LevelSummaryProps) {
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const { message, emoji } = getEncouragement(percentage);
  const nextLevel = (level + 1) as Difficulty;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="retro-window max-w-sm w-full text-center">
        <div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between">
          <span>✦</span><span>Level Complete</span><span>✦</span>
        </div>
        <div className="retro-window-body p-8">
          <div className="text-6xl mb-4">{emoji}</div>

          <h2 className="text-2xl font-bold text-retro-text mb-2">
            Level {level} Complete!
          </h2>

          <p className="text-retro-text-secondary mb-4">{difficultyLabels[level]}</p>

          <div className="bg-retro-gold rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-white mb-1">
              {score.correct}/{score.total}
            </div>
            <div className="text-yellow-100 text-lg">
              {percentage}% correct
            </div>
          </div>

          <p className="text-retro-text-secondary mb-6">{message}</p>

          <button
            onClick={onContinue}
            className="retro-btn w-full py-4 px-6 bg-retro-neon-blue text-white font-bold font-retro text-sm"
          >
            Continue to Level {nextLevel}
            <span className="block text-xs font-normal text-blue-100 mt-1">
              {difficultyLabels[nextLevel]}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
