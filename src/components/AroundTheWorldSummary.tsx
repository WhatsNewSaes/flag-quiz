import { Continent } from '../data/countries';
import { ContinentStats } from '../hooks/useAroundTheWorld';

interface AroundTheWorldSummaryProps {
  continentStats: Record<Continent, ContinentStats>;
  totalCorrect: number;
  totalAnswered: number;
  onClose: () => void;
}

const continents: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];

const continentEmojis: Record<Continent, string> = {
  'Africa': '🌍',
  'Asia': '🌏',
  'Europe': '🌍',
  'North America': '🌎',
  'South America': '🌎',
  'Oceania': '🌏',
};

export function AroundTheWorldSummary({
  continentStats,
  totalCorrect,
  totalAnswered,
  onClose,
}: AroundTheWorldSummaryProps) {
  const overallPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="retro-window max-w-md w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="retro-window-title bg-teal-600 text-white flex items-center justify-between">
          <span>✦</span><span>Your Progress</span><span>✦</span>
        </div>
        <div className="retro-window-body overflow-y-auto max-h-[80vh]">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌍</div>
          <h2 className="text-2xl font-bold text-retro-text">Your Progress</h2>
          <p className="text-retro-text-secondary mt-1">Around the World</p>
        </div>

        <div className="bg-retro-gold rounded-2xl p-5 mb-6 text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {totalCorrect}/{totalAnswered}
          </div>
          <div className="text-yellow-100">
            {overallPercentage}% correct
          </div>
        </div>

        <h3 className="text-lg font-bold text-retro-text mb-3">By Continent</h3>

        <div className="space-y-3 mb-6">
          {continents.map(continent => {
            const stats = continentStats[continent];
            const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

            let barColor = 'bg-gray-300';
            if (stats.total > 0) {
              if (percentage >= 80) barColor = 'bg-green-500';
              else if (percentage >= 60) barColor = 'bg-yellow-500';
              else if (percentage >= 40) barColor = 'bg-orange-500';
              else barColor = 'bg-red-500';
            }

            return (
              <div key={continent}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <span>{continentEmojis[continent]}</span>
                    {continent}
                  </span>
                  <span className="text-gray-600">
                    {stats.total > 0 ? `${stats.correct}/${stats.total} (${percentage}%)` : '-'}
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

        <button
          onClick={onClose}
          className="retro-btn w-full py-3 px-6 bg-retro-neon-blue text-white font-bold font-retro text-sm"
        >
          Continue Playing
        </button>
        </div>
      </div>
    </div>
  );
}
