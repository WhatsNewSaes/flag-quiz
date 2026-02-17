import { JourneyLevel, REGION_THEMES } from '../../data/journeyLevels';
import { ACHIEVEMENTS } from '../../data/achievements';
import { CHARACTER_MAP } from '../../data/characters';

import ArcadeIcon from '../../icons/entertainment-events-hobbies-game-machines-arcade-1--Streamline-Pixel.svg';
import GlobeIcon from '../../icons/ecology-global-warming-globe--Streamline-Pixel.svg';
import DiceIcon from '../../icons/entertainment-events-hobbies-board-game-dice--Streamline-Pixel.svg';
import FlagRunnerIcon from '../../icons/social-rewards-flag--Streamline-Pixel.svg';

import kitsuneSouth from '../../images/character/kitsune-south.png';
import krakenSouth from '../../images/character/kraken-south.png';
import dragonSouth from '../../images/character/dragon-south.png';
import eagleSouth from '../../images/character/eagle-south.png';
import phoenixSouth from '../../images/character/phoenix-south.png';

import greenMeadowsImg from '../../images/worlds/green meadows.png';
import sandyShoresImg from '../../images/worlds/sandy shores.png';
import mistyForestImg from '../../images/worlds/misty-forest.png';
import rockyMountainsImg from '../../images/worlds/rocky-mountains.png';
import volcanicPeakImg from '../../images/worlds/volcanic-peak.png';

const WORLD_IMAGES: string[] = [
  greenMeadowsImg,
  sandyShoresImg,
  mistyForestImg,
  rockyMountainsImg,
  volcanicPeakImg,
];

const CHARACTER_THUMBNAILS: Record<string, string> = {
  kitsune: kitsuneSouth,
  kraken: krakenSouth,
  dragon: dragonSouth,
  eagle: eagleSouth,
  phoenix: phoenixSouth,
};

const MODE_DISPLAY: Record<string, { icon: string; title: string; description: string }> = {
  'free-play': { icon: ArcadeIcon, title: 'Arcade Mode', description: 'Test your flag knowledge! Score points with streaks and difficulty bonuses.' },
  jeopardy: { icon: DiceIcon, title: 'Flag Jeopardy', description: 'Jeopardy-style board game. Pick by continent and difficulty. Daily Doubles included!' },
  'flag-runner': { icon: FlagRunnerIcon, title: 'Flag Runner', description: 'Dodge wrong flags, collect correct ones! How long can you survive?' },
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
  newlyUnlockedCharacters?: string[];
  newlyUnlockedWorlds?: number[];
}

export function JourneyLevelComplete({
  level,
  correct,
  total,
  stars,
  onNextLevel,
  onRetry,
  onPractice,
  onBackToMap,
  hasNextLevel,
  newAchievementIds = [],
  newlyUnlockedModes = [],
  newlyUnlockedCharacters = [],
  newlyUnlockedWorlds = [],
}: JourneyLevelCompleteProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const newAchievements = newAchievementIds
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  const regionName = REGION_THEMES[level.regionIndex]?.name ?? '';
  const levelNumber = `${level.regionIndex + 1}-${level.levelIndexInRegion + 1}`;

  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center px-4 relative">
      {/* Back to map — fixed top-left */}
      <button
        onClick={onBackToMap}
        className="absolute top-4 left-4 font-body text-[1rem] hover:opacity-80 transition-opacity"
        style={{ color: '#5C5340' }}
      >
        ← Back to Map
      </button>

      <div className="max-w-sm w-full">
        <div className="pixel-border bg-retro-surface rounded-lg overflow-hidden text-center">
          {/* Banner */}
          <div className="bg-retro-accent/40 px-4 py-3" style={{ borderBottom: '3px solid #2D2D2D' }}>
            <div className="font-body text-retro-text text-[1rem]">
              {regionName} {levelNumber}
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-retro text-[1rem] mb-4 rainbow-text">
              {stars >= 1 ? 'Level Complete!' : 'Keep Going!'}
            </h2>

            {/* Score */}
            <div className="mb-2">
              <div className="font-body text-retro-text text-[1rem]">
                You got <span className="font-bold">{correct}</span> out of <span className="font-bold">{total}</span> correct
              </div>
              <div className="font-retro text-2xl text-retro-text mt-4">
                {percentage}%
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: 3 }, (_, i) => (
                <span
                  key={i}
                  className={`text-5xl leading-none ${
                    i < stars ? 'text-retro-gold drop-shadow-[0_2px_0_#B8860B]' : 'text-retro-border/30'
                  } ${i < stars ? 'animate-bounce-in' : ''}`}
                  style={{
                    animationDelay: i < stars ? `${i * 200}ms` : undefined,
                    WebkitTextStroke: '1.5px #2D2D2D',
                  }}
                >
                  {i < stars ? '★' : '☆'}
                </span>
              ))}
            </div>

            {stars === 0 && (
              <div className="font-body text-red-700 text-xs mb-4">
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

            {/* Worlds unlocked */}
            {newlyUnlockedWorlds.length > 0 && (
              <div className="mb-4 space-y-2">
                {newlyUnlockedWorlds.map(regionIdx => {
                  const totalRegions = REGION_THEMES.length;
                  if (regionIdx === totalRegions - 1) {
                    return (
                      <div key="journey-complete">
                        <div className="font-retro text-[0.6rem] rainbow-text mb-2">
                          Journey Complete!
                        </div>
                        <div className="flex items-center gap-3 bg-retro-gold/10 border-2 border-retro-gold/50 rounded-lg px-3 py-2 animate-bounce-in">
                          <span className="text-2xl">🏆</span>
                          <div className="text-left">
                            <div className="font-body text-retro-text text-sm font-bold">
                              Congratulations!
                            </div>
                            <div className="font-body text-retro-text-secondary text-xs">
                              You've conquered every world!
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const nextIdx = regionIdx + 1;
                  const theme = REGION_THEMES[nextIdx];
                  const image = WORLD_IMAGES[nextIdx];
                  if (!theme) return null;
                  return (
                    <div key={regionIdx}>
                      <div className="font-retro text-[0.6rem] text-retro-gold mb-2">
                        New World Unlocked!
                      </div>
                      <div className="flex items-center gap-3 bg-retro-gold/10 border-2 border-retro-gold/50 rounded-lg px-3 py-2 animate-bounce-in">
                        {image && (
                          <img
                            src={image}
                            alt={theme.name}
                            className="w-12 h-12 rounded object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        )}
                        <div className="text-left">
                          <div className="font-body text-retro-text text-sm font-bold">
                            World {nextIdx + 1} &mdash; {theme.name}
                          </div>
                          <div className="font-body text-retro-text-secondary text-xs">
                            {theme.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Characters unlocked */}
            {newlyUnlockedCharacters.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="font-retro text-[0.6rem] text-retro-neon-blue">
                  New Character{newlyUnlockedCharacters.length > 1 ? 's' : ''} Unlocked!
                </div>
                {newlyUnlockedCharacters.map(charKey => {
                  const character = CHARACTER_MAP[charKey as keyof typeof CHARACTER_MAP];
                  const thumbnail = CHARACTER_THUMBNAILS[charKey];
                  if (!character || !thumbnail) return null;
                  return (
                    <div
                      key={charKey}
                      className="flex items-center gap-3 bg-retro-neon-blue/10 border-2 border-retro-neon-blue/40 rounded-lg px-3 py-2 animate-bounce-in"
                    >
                      <img src={thumbnail} alt={character.name} className="w-10 h-10" style={{ imageRendering: 'pixelated' }} />
                      <div className="text-left">
                        <div className="font-body text-retro-text text-sm font-bold">
                          {character.name}
                        </div>
                        <div className="font-body text-retro-text-secondary text-xs">
                          {character.storyText}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  Next Level <span className="text-lg">→</span>
                </button>
              )}
              {stars === 0 && (
                <button
                  onClick={onPractice}
                  className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-neon-blue text-white"
                >
                  Practice {levelNumber}
                </button>
              )}
              {stars === 0 && (
                <button
                  onClick={onRetry}
                  className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text"
                >
                  Retry {levelNumber}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
