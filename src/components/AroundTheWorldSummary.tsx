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
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌍</div>
          <h2 className="text-2xl font-bold text-gray-800">Your Progress</h2>
          <p className="text-gray-500 mt-1">Around the World</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 mb-6 text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {totalCorrect}/{totalAnswered}
          </div>
          <div className="text-indigo-100">
            {overallPercentage}% correct
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-3">By Continent</h3>

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
          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all"
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
}
