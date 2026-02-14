import { ACHIEVEMENTS } from '../../data/achievements';

interface AchievementsPageProps {
  unlockedAchievements: Record<string, number | null>;
  onBack: () => void;
}

export function AchievementsPage({ unlockedAchievements, onBack }: AchievementsPageProps) {
  const unlockedCount = Object.values(unlockedAchievements).filter(Boolean).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-retro-bg py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="retro-btn px-3 py-2 text-xs font-retro bg-retro-surface text-retro-text-secondary"
          >
            ← Back
          </button>
          <h1 className="font-retro text-sm text-retro-gold">
            Achievements
          </h1>
        </div>

        <div className="text-center text-retro-text-secondary text-sm mb-6">
          {unlockedCount} / {totalCount} unlocked
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map(def => {
            const timestamp = unlockedAchievements[def.id];
            const unlocked = !!timestamp;

            return (
              <div
                key={def.id}
                className={`pixel-border rounded-lg p-4 ${
                  unlocked ? 'bg-retro-surface' : 'bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>
                    {unlocked ? def.icon : '❓'}
                  </span>
                  <div>
                    <div className={`font-retro text-xs ${unlocked ? 'text-retro-gold' : 'text-retro-text-secondary'}`}>
                      {unlocked ? def.name : '???'}
                    </div>
                    <div className="text-xs text-retro-text-secondary mt-1">
                      {unlocked ? def.description : 'Keep playing to unlock'}
                    </div>
                    {unlocked && timestamp && (
                      <div className="text-xs text-retro-text-secondary mt-1">
                        {new Date(timestamp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
