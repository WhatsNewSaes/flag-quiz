import { JourneyLevel, REGION_THEMES } from '../../data/journeyLevels';
import { ACHIEVEMENTS } from '../../data/achievements';
import { StarDisplay } from './StarDisplay';
import { useAuth } from '../../contexts/AuthContext';

import ArcadeIcon from '../../icons/entertainment-events-hobbies-game-machines-arcade-1--Streamline-Pixel.svg';
import GlobeIcon from '../../icons/ecology-global-warming-globe--Streamline-Pixel.svg';
import DiceIcon from '../../icons/entertainment-events-hobbies-board-game-dice--Streamline-Pixel.svg';

const MODE_DISPLAY: Record<string, { icon: string; title: string; description: string }> = {
  'free-play': { icon: ArcadeIcon, title: 'Free Play', description: 'Practice with custom filters. Choose difficulty, continents, and quiz type.' },
  jeopardy: { icon: DiceIcon, title: 'Flag Jeopardy', description: 'Jeopardy-style board game. Pick by continent and difficulty. Daily Doubles included!' },
  'around-the-world': { icon: GlobeIcon, title: 'Around the World', description: 'Identify highlighted countries on a world map. Fill in the globe!' },
};

interface JourneyLevelCompleteProps {
  level: JourneyLevel;
  correct: number;
  total: number;
  stars: number;
  isNewBest: boolean;
  previousBestPct: number | null;
  onNextLevel: () => void;
  onRetry: () => void;
  onPractice: () => void;
  onBackToMap: () => void;
  hasNextLevel: boolean;
  newAchievementIds?: string[];
  newlyUnlockedModes?: string[];
}

export function JourneyLevelComplete({
  level,
  correct,
  total,
  stars,
  isNewBest,
  previousBestPct,
  onNextLevel,
  onRetry,
  onPractice,
  onBackToMap,
  hasNextLevel,
  newAchievementIds = [],
  newlyUnlockedModes = [],
}: JourneyLevelCompleteProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const newAchievements = newAchievementIds
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  const regionName = REGION_THEMES[level.regionIndex]?.name ?? '';
  const levelNumber = `${level.regionIndex + 1}-${level.levelIndexInRegion + 1}`;

  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="pixel-border bg-retro-surface rounded-lg overflow-hidden text-center">
          {/* Banner */}
          <div className="bg-retro-accent/40 px-4 py-3" style={{ borderBottom: '3px solid #2D2D2D' }}>
            <div className="font-body text-retro-text text-sm">
              {regionName} {levelNumber}
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-retro text-sm text-retro-gold mb-4">
              {stars >= 1 ? 'Level Complete!' : 'Keep Going!'}
            </h2>

            {/* Score box */}
            <div className="bg-white rounded-lg border-2 border-retro-border/20 px-4 py-3 mb-4 inline-block">
              <div className="font-body text-3xl font-bold text-retro-text mb-1">
                {correct}/{total}
              </div>
              <div className="font-body text-retro-neon-green text-lg">
                {percentage}%
              </div>
            </div>

            {/* Stars */}
            <div className="mb-4 text-retro-gold">
              <StarDisplay stars={stars} size="lg" animated />
            </div>

            {/* New best indicator */}
            {isNewBest && previousBestPct !== null && (
              <div className="font-retro text-xs text-retro-gold mb-4 animate-pulse">
                {percentage}% — New Best! <span className="text-retro-text-secondary">(was {previousBestPct}%)</span>
              </div>
            )}

            {stars === 0 && (
              <div className="font-body text-retro-neon-red text-xs mb-4">
                Need 70% to earn a star and unlock the next level
              </div>
            )}

            {/* Achievements unlocked */}
            {newAchievements.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="font-retro text-[0.6rem] text-retro-gold">
                  Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!
                </div>
                {newAchievements.map(achievement => (
                  <div
                    key={achievement!.id}
                    className="flex items-center gap-3 bg-retro-accent/30 border-2 border-retro-gold/50 rounded-lg px-3 py-2 animate-bounce-in"
                  >
                    <span className="text-2xl">{achievement!.icon}</span>
                    <div className="text-left">
                      <div className="font-body text-retro-text text-sm font-bold">
                        {achievement!.name}
                      </div>
                      <div className="font-body text-retro-text-secondary text-xs">
                        {achievement!.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Game modes unlocked */}
            {newlyUnlockedModes.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="font-retro text-[0.6rem] text-retro-neon-green">
                  New Game Mode{newlyUnlockedModes.length > 1 ? 's' : ''} Unlocked!
                </div>
                {newlyUnlockedModes.map(modeId => {
                  const mode = MODE_DISPLAY[modeId];
                  if (!mode) return null;
                  return (
                    <div
                      key={modeId}
                      className="flex items-center gap-3 bg-retro-neon-green/10 border-2 border-retro-neon-green/40 rounded-lg px-3 py-2 animate-bounce-in"
                    >
                      <img src={mode.icon} alt="" className="w-8 h-8" />
                      <div className="text-left">
                        <div className="font-body text-retro-text text-sm font-bold">
                          {mode.title}
                        </div>
                        <div className="font-body text-retro-text-secondary text-xs">
                          {mode.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 mt-6">
              {hasNextLevel && stars >= 1 && (
                <button
                  onClick={onNextLevel}
                  className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-neon-green text-white"
                >
                  Next Level →
                </button>
              )}
              {stars === 0 && (
                <button
                  onClick={onPractice}
                  className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-accent text-retro-text"
                >
                  Practice {levelNumber}
                </button>
              )}
              <button
                onClick={onRetry}
                className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-neon-blue text-white"
              >
                Retry {levelNumber}
              </button>
              <button
                onClick={onBackToMap}
                className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text-secondary"
              >
                Back to Map
              </button>
            </div>
          </div>
        </div>

        {/* Sign in callout — only when not logged in */}
        {!authLoading && !user && (
          <button
            onClick={signInWithGoogle}
            className="w-full mt-4 rounded-lg rainbow-shimmer cursor-pointer px-4 py-3 flex items-center justify-center gap-2 border-2 border-retro-border"
            style={{ boxShadow: '3px 3px 0px 0px #2D2D2D' }}
          >
            <span className="text-sm">💾</span>
            <span className="font-retro text-[0.6rem] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Sign in to save your progress
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
