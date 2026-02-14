import { useEffect, useRef, useMemo } from 'react';
import { JourneyLevel, JourneyRegion, REGION_THEMES } from '../../data/journeyLevels';
import { LevelResult, Rank } from '../../hooks/useJourneyProgress';
import { StarDisplay } from './StarDisplay';
import { RankBadge } from './RankBadge';
import { PixelCharacter } from './PixelCharacter';
import { AuthButton } from '../AuthButton';

interface OverworldMapProps {
  regions: JourneyRegion[];
  allLevels: JourneyLevel[];
  levelResults: Record<string, LevelResult>;
  totalStars: number;
  currentRank: Rank;
  onSelectLevel: (level: JourneyLevel) => void;
  onOpenModes: () => void;
  onOpenAchievements: () => void;
  isLevelUnlocked: (levelId: string) => boolean;
}

export function OverworldMap({
  regions,
  allLevels,
  levelResults,
  totalStars,
  currentRank,
  onSelectLevel,
  onOpenModes,
  onOpenAchievements,
  isLevelUnlocked,
}: OverworldMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find current level (first unlocked incomplete level)
  const currentLevelIndex = useMemo(() => {
    for (let i = 0; i < allLevels.length; i++) {
      const unlocked = isLevelUnlocked(allLevels[i].id);
      const result = levelResults[allLevels[i].id];
      if (unlocked && (!result || result.stars < 1)) return i;
    }
    return allLevels.length - 1;
  }, [allLevels, isLevelUnlocked, levelResults]);

  // Auto-scroll to current level on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentEl = scrollRef.current.querySelector('[data-current="true"]');
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLevelIndex]);

  return (
    <div className="min-h-screen bg-retro-bg flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-retro-bg/95 backdrop-blur-sm border-b border-retro-border/20 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RankBadge rank={currentRank} />
            <span className="text-retro-gold font-retro text-sm">
              {totalStars} ★
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenModes}
              className="retro-btn px-3 py-2 text-sm font-retro bg-retro-accent text-retro-text"
            >
              Modes
            </button>
            <button
              onClick={onOpenAchievements}
              className="retro-btn px-3 py-2 text-sm font-retro bg-retro-accent text-retro-text"
            >
              🏆
            </button>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-4">
        <h1 className="font-retro text-xl text-retro-text drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]">Flag Arcade</h1>
        <p className="text-retro-text text-sm mt-1 opacity-70">Journey Mode</p>
      </div>


      {/* Scrollable level list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overworld-scroll px-4 pb-8">
        <div className="max-w-md mx-auto space-y-8">
          {regions.map((region) => {
            const theme = REGION_THEMES[region.regionIndex];
            if (!theme) return null;

            // Map region to a title bar color
            const regionColors = [
              'bg-retro-neon-green',  // Green Meadows
              'bg-retro-accent',      // Sandy Shores
              'bg-teal-500',          // Misty Forest
              'bg-orange-400',        // Rocky Mountains
              'bg-retro-neon-red',    // Volcanic Peak
            ];
            const titleBarColor = regionColors[region.regionIndex] || 'bg-retro-accent';
            const titleTextColor = region.regionIndex === 1 ? 'text-retro-text' : 'text-white';

            return (
              <div key={region.regionIndex} className="space-y-3">
                {/* Region header — display only */}
                <div className={`${titleBarColor} ${titleTextColor} rounded-lg px-4 py-2 font-retro text-sm text-center border-2 border-retro-border/30`}>
                  ✦ World {region.regionIndex + 1} — {theme.name} ✦
                </div>

                {/* Level tiles */}
                <div className="flex">
                  {/* Vertical connector line */}
                  <div className="w-12 flex-shrink-0 flex justify-center relative">
                    <div className="w-0.5 h-full bg-retro-border/30" />
                  </div>

                  <div className="flex-1 flex flex-col gap-3 pb-2">
                    {region.levels.map((level, levelIdx) => {
                      const unlocked = isLevelUnlocked(level.id);
                      const result = levelResults[level.id];
                      const completed = result && result.stars >= 1;
                      const stars = result?.stars ?? 0;
                      const isCurrent = level.globalLevelIndex === currentLevelIndex;
                      const isLast = levelIdx === region.levels.length - 1;

                      return (
                        <div key={level.id} className="flex items-center gap-0 relative">
                          {/* Branch connector */}
                          <div className="w-6 flex-shrink-0 flex items-center">
                            <div className="w-full h-0.5 bg-retro-border/30" />
                          </div>

                          {/* Status node on the vertical line */}
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                              !unlocked
                                ? 'bg-gray-300'
                                : completed
                                  ? 'bg-retro-neon-green'
                                  : isCurrent
                                    ? 'bg-retro-accent animate-node-pulse'
                                    : 'bg-retro-surface'
                            }`}
                            style={{
                              left: '-2.5rem',
                              border: `3px solid ${
                                !unlocked ? '#9CA3AF'
                                : completed ? '#15803d'
                                : isCurrent ? '#D4960A'
                                : 'rgba(45,45,45,0.4)'
                              }`,
                            }}
                          >
                            {completed && (
                              <svg viewBox="0 0 10 10" className="w-4 h-4 text-white">
                                <path d="M2 5 L4.5 7.5 L8 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {!unlocked && (
                              <span className="text-xs text-gray-500">🔒</span>
                            )}
                          </div>

                          {/* Pixel character */}
                          {isCurrent && (
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2">
                              <PixelCharacter />
                            </div>
                          )}

                          <button
                            data-current={isCurrent ? 'true' : undefined}
                            onClick={() => unlocked && onSelectLevel(level)}
                            disabled={!unlocked}
                            className={`flex-1 text-left transition-transform retro-window
                              ${!unlocked
                                ? 'opacity-50 cursor-not-allowed'
                                : isCurrent
                                  ? 'ring-2 ring-retro-neon-green/50 hover:brightness-105'
                                  : 'hover:brightness-105'
                              }`}
                          >
                            <div className={`retro-window-title flex items-center justify-between ${
                              !unlocked
                                ? 'bg-gray-400 text-gray-200'
                                : `${titleBarColor} ${titleTextColor}`
                            }`}>
                              <span>{!unlocked ? '🔒 Locked' : `Level ${level.levelIndexInRegion + 1}`}</span>
                              {unlocked && stars > 0 && (
                                <span className="text-retro-gold">
                                  <StarDisplay stars={stars} size="sm" />
                                </span>
                              )}
                            </div>
                            <div className="retro-window-body py-2 px-3">
                              <div className="flex items-center gap-3">
                                <span className="font-body text-base text-retro-text leading-relaxed">
                                  {level.countryCodes.length} flags
                                </span>
                                {result && result.bestPercentage > 0 && (
                                  <span className="text-retro-text-secondary text-xs">
                                    Best: {result.bestPercentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
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
