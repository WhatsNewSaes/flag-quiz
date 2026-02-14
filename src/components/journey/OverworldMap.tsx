import { useEffect, useRef, useMemo } from 'react';
import { JourneyLevel, JourneyRegion, REGION_THEMES } from '../../data/journeyLevels';
import { LevelResult } from '../../hooks/useJourneyProgress';
import { StarDisplay } from './StarDisplay';
import { PixelCharacter } from './PixelCharacter';
import { getFlagEmoji } from '../../utils/flagEmoji';

import greenMeadowsImg from '../../images/worlds/green meadows.png';
import sandyShoresImg from '../../images/worlds/sandy shores.png';
import mistyForestImg from '../../images/worlds/misty-forest.png';
import rockyMountainsImg from '../../images/worlds/rocky-mountains.png';
import volcanicPeakImg from '../../images/worlds/volcanic-peak.png';

const WORLD_IMAGES = [
  greenMeadowsImg,
  sandyShoresImg,
  mistyForestImg,
  rockyMountainsImg,
  volcanicPeakImg,
];

interface OverworldMapProps {
  regions: JourneyRegion[];
  allLevels: JourneyLevel[];
  levelResults: Record<string, LevelResult>;
  onSelectLevel: (level: JourneyLevel) => void;
  isLevelUnlocked: (levelId: string) => boolean;
}

export function OverworldMap({
  regions,
  allLevels,
  levelResults,
  onSelectLevel,
  isLevelUnlocked,
}: OverworldMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const favoriteFlag = useMemo(() => localStorage.getItem('favorite-flag')?.replace(/"/g, '') || '', []);

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
              <div key={region.regionIndex}>
                {/* Region header + world image */}
                <div className="rounded-lg border-2 border-retro-border/30 shadow-pixel-sm overflow-hidden">
                  <div className={`${titleBarColor} ${titleTextColor} px-2 py-2 font-retro text-[12px] sm:text-sm text-center whitespace-nowrap`}>
                    ✦ World {region.regionIndex + 1} — {theme.name} ✦
                  </div>
                  {WORLD_IMAGES[region.regionIndex] && (
                    <img
                      src={WORLD_IMAGES[region.regionIndex]}
                      alt={theme.name}
                      className="w-full block"
                    />
                  )}
                </div>

                {/* Level tiles */}
                <div className="flex">
                  {/* Vertical connector rail */}
                  <div className="w-12 flex-shrink-0 relative">
                    {/* Line segments rendered per-row via absolute positioning on level rows */}
                  </div>

                  <div className="flex-1 flex flex-col gap-3 pt-3 pb-2">
                    {region.levels.map((level, levelIdx) => {
                      const unlocked = isLevelUnlocked(level.id);
                      const result = levelResults[level.id];
                      const completed = result && result.stars >= 1;
                      const stars = result?.stars ?? 0;
                      const isCurrent = level.globalLevelIndex === currentLevelIndex;
                      const isFirst = levelIdx === 0;
                      const isLast = levelIdx === region.levels.length - 1;

                      return (
                        <div key={level.id} className="flex items-center gap-0 relative">
                          {/* Branch connector */}
                          <div className="w-6 flex-shrink-0 flex items-center">
                            <div className="w-full h-0.5 bg-retro-border/30" />
                          </div>

                          {/* Vertical line: above node (from top of row to center) */}
                          <div
                            className="absolute w-0.5 bg-retro-border/30"
                            style={{
                              left: '-1.5rem',
                              transform: 'translateX(-50%)',
                              top: isFirst ? '-0.75rem' : 0,
                              bottom: '50%',
                            }}
                          />
                          {/* Vertical line: below node (from center to bottom of row + gap) — skip on last */}
                          {!isLast && (
                            <div
                              className="absolute w-0.5 bg-retro-border/30"
                              style={{
                                left: '-1.5rem',
                                transform: 'translateX(-50%)',
                                top: '50%',
                                bottom: '-0.75rem',
                              }}
                            />
                          )}

                          {/* Status node on the vertical line — hidden for current level (character shows instead) */}
                          {!isCurrent && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                !unlocked
                                  ? 'bg-gray-300'
                                  : completed
                                    ? 'bg-retro-neon-green'
                                    : 'bg-retro-surface'
                              }`}
                              style={{
                                left: '-2.5rem',
                                border: `3px solid ${
                                  !unlocked ? '#9CA3AF'
                                  : completed ? '#15803d'
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
                          )}

                          {/* Pixel character + flag badge */}
                          {isCurrent && (
                            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '-2.7rem' }}>
                              <PixelCharacter />
                              {favoriteFlag && (
                                <span
                                  className="absolute text-xs"
                                  style={{ top: -4, right: -10 }}
                                >
                                  {getFlagEmoji(favoriteFlag)}
                                </span>
                              )}
                            </div>
                          )}

                          <button
                            data-current={isCurrent ? 'true' : undefined}
                            onClick={() => unlocked && onSelectLevel(level)}
                            disabled={!unlocked}
                            className={`flex-1 text-left transition-transform bg-retro-surface border-2 border-retro-border/20 rounded-lg px-3 py-2 shadow-pixel-sm
                              ${!unlocked
                                ? 'opacity-40 cursor-not-allowed'
                                : isCurrent
                                  ? 'animate-tile-shimmer hover:brightness-105'
                                  : 'hover:brightness-105'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-retro text-xs text-retro-text-secondary">
                                {!unlocked ? '🔒 Locked' : `Level ${level.levelIndexInRegion + 1}`}
                              </span>
                              {unlocked && stars > 0 && (
                                <StarDisplay stars={stars} size="sm" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-body text-sm text-retro-text">
                                {level.countryCodes.length} flags
                              </span>
                              {result && result.bestPercentage > 0 && (
                                <span className="text-retro-text-secondary text-xs">
                                  Best: {result.bestPercentage}%
                                </span>
                              )}
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
