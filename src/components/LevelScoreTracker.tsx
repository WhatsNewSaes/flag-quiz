import { Difficulty, difficultyLabels } from '../data/countries';
import { LevelScore } from '../hooks/useCampaign';

interface LevelScoreTrackerProps {
  currentLevel: Difficulty;
  levelScores: Record<Difficulty, LevelScore>;
  currentFlagIndex: number;
  totalFlagsInLevel: number;
}

const levels: Difficulty[] = [1, 2, 3, 4, 5];

export function LevelScoreTracker({
  currentLevel,
  levelScores,
  currentFlagIndex,
  totalFlagsInLevel,
}: LevelScoreTrackerProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Campaign Progress
        </h3>
        <span className="text-sm text-gray-500">
          Flag {currentFlagIndex + 1} of {totalFlagsInLevel}
        </span>
      </div>

      <div className="flex gap-2">
        {levels.map(level => {
          const score = levelScores[level];
          const isCurrent = level === currentLevel;
          const isCompleted = score.total > 0 && level < currentLevel;

          let bgColor = 'bg-gray-100';
          let textColor = 'text-gray-400';
          let ringStyle = '';

          if (isCurrent) {
            bgColor = 'bg-indigo-100';
            textColor = 'text-indigo-700';
            ringStyle = 'ring-2 ring-indigo-500';
          } else if (isCompleted) {
            const percentage = score.total > 0 ? (score.correct / score.total) * 100 : 0;
            if (percentage >= 80) {
              bgColor = 'bg-green-100';
              textColor = 'text-green-700';
            } else if (percentage >= 50) {
              bgColor = 'bg-yellow-100';
              textColor = 'text-yellow-700';
            } else {
              bgColor = 'bg-orange-100';
              textColor = 'text-orange-700';
            }
          }

          return (
            <div
              key={level}
              className={`flex-1 rounded-lg p-2 text-center ${bgColor} ${textColor} ${ringStyle}`}
            >
              <div className="text-xs font-medium truncate">
                {difficultyLabels[level]}
              </div>
              {score.total > 0 ? (
                <div className="text-sm font-bold">
                  {score.correct}/{score.total}
                </div>
              ) : (
                <div className="text-sm font-bold">
                  {isCurrent ? `${score.correct}/${score.total}` : '-'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
