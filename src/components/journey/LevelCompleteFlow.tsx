import { useState, useEffect, useCallback } from 'react';
import { JourneyLevel, REGION_THEMES } from '../../data/journeyLevels';
import { ACHIEVEMENTS } from '../../data/achievements';
import { CHARACTER_MAP } from '../../data/characters';
import { JourneyLevelComplete } from './JourneyLevelComplete';
import { playAchievementSound, playLevelCompleteSound } from '../../utils/sounds';

// World preview images
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

// Mode icons
import ArcadeIcon from '../../icons/entertainment-events-hobbies-game-machines-arcade-1--Streamline-Pixel.svg';
import GlobeIcon from '../../icons/ecology-global-warming-globe--Streamline-Pixel.svg';
import DiceIcon from '../../icons/entertainment-events-hobbies-board-game-dice--Streamline-Pixel.svg';
import FlagRunnerIcon from '../../icons/social-rewards-flag--Streamline-Pixel.svg';

// Character thumbnails for unlock cards
import kitsuneSouth from '../../images/character/kitsune-south.png';
import krakenSouth from '../../images/character/kraken-south.png';
import dragonSouth from '../../images/character/dragon-south.png';
import eagleSouth from '../../images/character/eagle-south.png';
import phoenixSouth from '../../images/character/phoenix-south.png';

const CHARACTER_THUMBNAILS: Record<string, string> = {
  kitsune: kitsuneSouth,
  kraken: krakenSouth,
  dragon: dragonSouth,
  eagle: eagleSouth,
  phoenix: phoenixSouth,
};

interface ModeInfo {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const MODE_INFO: Record<string, ModeInfo> = {
  'free-play': {
    id: 'free-play',
    icon: ArcadeIcon,
    title: 'Arcade Mode',
    description: 'Test your flag knowledge! Score points with streaks and difficulty bonuses.',
  },
  jeopardy: {
    id: 'jeopardy',
    icon: DiceIcon,
    title: 'Flag Jeopardy',
    description: 'Jeopardy-style board game. Pick by continent and difficulty. Daily Doubles included!',
  },
  'flag-runner': {
    id: 'flag-runner',
    icon: FlagRunnerIcon,
    title: 'Flag Runner',
    description: 'Dodge wrong flags, collect correct ones! How long can you survive?',
  },
  'around-the-world': {
    id: 'around-the-world',
    icon: GlobeIcon,
    title: 'Around the World',
    description: 'Identify highlighted countries on a world map. Fill in the globe!',
  },
};

interface LevelCompleteFlowProps {
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
  newAchievementIds: string[];
  newlyUnlockedModes: string[];
  newlyUnlockedCharacters: string[];
  newlyUnlockedWorlds: number[];
}

type CardType =
  | { kind: 'achievement'; achievementId: string }
  | { kind: 'world-unlock'; nextRegionIndex: number }
  | { kind: 'journey-complete' }
  | { kind: 'character-unlock'; characterKey: string }
  | { kind: 'mode-unlock'; modeId: string }
  | { kind: 'summary' };

export function LevelCompleteFlow({
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
  newAchievementIds,
  newlyUnlockedModes,
  newlyUnlockedCharacters,
  newlyUnlockedWorlds,
}: LevelCompleteFlowProps) {
  const cards: CardType[] = [];

  // Build card sequence: achievements -> world unlocks -> character unlocks -> mode unlocks -> summary
  for (const id of newAchievementIds) {
    cards.push({ kind: 'achievement', achievementId: id });
  }
  for (const regionIdx of newlyUnlockedWorlds) {
    const totalRegions = REGION_THEMES.length;
    if (regionIdx === totalRegions - 1) {
      // Completed the last world — show journey complete finale
      cards.push({ kind: 'journey-complete' });
    } else {
      // Show the next world that's now unlocked
      cards.push({ kind: 'world-unlock', nextRegionIndex: regionIdx + 1 });
    }
  }
  for (const charKey of newlyUnlockedCharacters) {
    cards.push({ kind: 'character-unlock', characterKey: charKey });
  }
  for (const modeId of newlyUnlockedModes) {
    cards.push({ kind: 'mode-unlock', modeId });
  }
  cards.push({ kind: 'summary' });

  // If only the summary card, render JourneyLevelComplete directly
  if (cards.length === 1) {
    return (
      <JourneyLevelComplete
        level={level}
        correct={correct}
        total={total}
        stars={stars}
        isNewBest={isNewBest}
        previousBestPct={previousBestPct}
        onNextLevel={onNextLevel}
        onRetry={onRetry}
        onPractice={onPractice}
        onBackToMap={onBackToMap}
        hasNextLevel={hasNextLevel}
        newAchievementIds={newAchievementIds}
        newlyUnlockedModes={newlyUnlockedModes}
        newlyUnlockedCharacters={newlyUnlockedCharacters}
        newlyUnlockedWorlds={newlyUnlockedWorlds}
      />
    );
  }

  return (
    <CardFlow
      cards={cards}
      level={level}
      correct={correct}
      total={total}
      stars={stars}
      isNewBest={isNewBest}
      previousBestPct={previousBestPct}
      onNextLevel={onNextLevel}
      onRetry={onRetry}
      onPractice={onPractice}
      onBackToMap={onBackToMap}
      hasNextLevel={hasNextLevel}
      newAchievementIds={newAchievementIds}
      newlyUnlockedModes={newlyUnlockedModes}
      newlyUnlockedCharacters={newlyUnlockedCharacters}
      newlyUnlockedWorlds={newlyUnlockedWorlds}
    />
  );
}

interface CardFlowProps {
  cards: CardType[];
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
  newAchievementIds: string[];
  newlyUnlockedModes: string[];
  newlyUnlockedCharacters: string[];
  newlyUnlockedWorlds: number[];
}

function CardFlow({
  cards,
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
  newAchievementIds,
  newlyUnlockedModes,
  newlyUnlockedCharacters,
  newlyUnlockedWorlds,
}: CardFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const currentCard = cards[currentIndex];

  const advance = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setAnimating(false);
    }, 300);
  }, [animating]);

  // Play sounds when cards appear
  useEffect(() => {
    if (currentCard.kind === 'achievement' || currentCard.kind === 'character-unlock') {
      playAchievementSound();
    } else if (currentCard.kind === 'mode-unlock' || currentCard.kind === 'world-unlock' || currentCard.kind === 'journey-complete') {
      playLevelCompleteSound();
    }
  }, [currentIndex, currentCard.kind]);

  // Summary card (last card): render JourneyLevelComplete directly
  if (currentCard.kind === 'summary') {
    return (
      <JourneyLevelComplete
        level={level}
        correct={correct}
        total={total}
        stars={stars}
        isNewBest={isNewBest}
        previousBestPct={previousBestPct}
        onNextLevel={onNextLevel}
        onRetry={onRetry}
        onPractice={onPractice}
        onBackToMap={onBackToMap}
        hasNextLevel={hasNextLevel}
        newAchievementIds={newAchievementIds}
        newlyUnlockedModes={newlyUnlockedModes}
        newlyUnlockedCharacters={newlyUnlockedCharacters}
        newlyUnlockedWorlds={newlyUnlockedWorlds}
      />
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full relative">
        {/* Stacked card backgrounds */}
        <div className="card-stack-bg-1" />
        <div className="card-stack-bg-2" />

        {/* Active card */}
        <div
          key={currentIndex}
          className={`pixel-border bg-retro-surface rounded-lg p-5 text-center relative z-10 ${
            animating ? 'animate-card-exit' : 'animate-card-enter'
          }`}
        >
          {currentCard.kind === 'achievement' && (
            <AchievementCard achievementId={currentCard.achievementId} />
          )}
          {currentCard.kind === 'world-unlock' && (
            <WorldUnlockCard nextRegionIndex={currentCard.nextRegionIndex} />
          )}
          {currentCard.kind === 'journey-complete' && (
            <JourneyCompleteCard />
          )}
          {currentCard.kind === 'character-unlock' && (
            <CharacterUnlockCard characterKey={currentCard.characterKey} />
          )}
          {currentCard.kind === 'mode-unlock' && (
            <ModeUnlockCard modeId={currentCard.modeId} />
          )}

          {/* Next button */}
          <button
            onClick={advance}
            disabled={animating}
            className="retro-btn mt-6 w-full px-4 py-3 font-retro text-xs bg-retro-accent text-retro-text"
          >
            Next →
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full border-2 border-retro-border transition-colors ${
                i === currentIndex ? 'bg-retro-accent' : 'bg-retro-surface/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  return (
    <>
      <div className="font-retro text-[1.4rem] text-retro-gold mb-4 leading-relaxed">
        Achievement Unlocked!
      </div>
      <div className="text-5xl mb-4">{achievement.icon}</div>
      <div className="font-retro text-sm text-retro-text mb-2">
        {achievement.name}
      </div>
      <div className="font-body text-retro-text-secondary text-sm">
        {achievement.description}
      </div>
    </>
  );
}

function WorldUnlockCard({ nextRegionIndex }: { nextRegionIndex: number }) {
  const theme = REGION_THEMES[nextRegionIndex];
  const image = WORLD_IMAGES[nextRegionIndex];
  if (!theme) return null;

  return (
    <>
      <div className="font-retro text-[1.4rem] text-retro-gold mb-4 leading-relaxed">
        New World Unlocked!
      </div>
      {image && (
        <div className="flex justify-center mb-4">
          <div className="pixel-border bg-retro-gold/10 rounded-lg p-2 overflow-hidden">
            <img
              src={image}
              alt={theme.name}
              className="w-48 h-32 object-cover rounded"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      )}
      <div className="font-retro text-sm text-retro-text mb-2">
        World {nextRegionIndex + 1} &mdash; {theme.name}
      </div>
      <div className="font-body text-retro-text-secondary text-sm">
        {theme.description}
      </div>
    </>
  );
}

function JourneyCompleteCard() {
  return (
    <>
      <div className="font-retro text-[1.4rem] rainbow-text mb-4 leading-relaxed">
        Journey Complete!
      </div>
      <div className="text-6xl mb-4">
        🏆
      </div>
      <div className="font-retro text-sm text-retro-gold mb-2">
        Congratulations!
      </div>
      <div className="font-body text-retro-text-secondary text-sm">
        You've conquered every world and proven yourself a true flag master!
      </div>
    </>
  );
}

function CharacterUnlockCard({ characterKey }: { characterKey: string }) {
  const character = CHARACTER_MAP[characterKey as keyof typeof CHARACTER_MAP];
  const thumbnail = CHARACTER_THUMBNAILS[characterKey];
  if (!character || !thumbnail) return null;

  return (
    <>
      <div className="font-retro text-[1.4rem] text-retro-neon-blue mb-4 leading-relaxed">
        New Character Unlocked!
      </div>
      <div className="flex justify-center mb-4">
        <div className="pixel-border bg-retro-neon-blue/10 rounded-lg p-2">
          <img
            src={thumbnail}
            alt={character.name}
            className="w-32 h-32"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="font-retro text-sm text-retro-text mb-2">
        {character.name}
      </div>
      <div className="font-body text-retro-text-secondary text-sm">
        {character.storyText}
      </div>
    </>
  );
}

function ModeUnlockCard({ modeId }: { modeId: string }) {
  const mode = MODE_INFO[modeId];
  if (!mode) return null;

  return (
    <>
      <div className="font-retro text-[1.4rem] text-retro-neon-green mb-4 leading-relaxed">
        New Game Mode Unlocked!
      </div>
      <div className="flex justify-center mb-4">
        <img src={mode.icon} alt="" className="w-14 h-14" />
      </div>
      <div className="font-retro text-sm text-retro-text mb-2">
        {mode.title}
      </div>
      <div className="font-body text-retro-text-secondary text-sm">
        {mode.description}
      </div>
    </>
  );
}
