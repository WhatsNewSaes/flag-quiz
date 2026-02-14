import { useState, useEffect, useCallback } from 'react';
import { JourneyLevel } from '../../data/journeyLevels';
import { ACHIEVEMENTS } from '../../data/achievements';
import { JourneyLevelComplete } from './JourneyLevelComplete';
import { playAchievementSound, playLevelCompleteSound } from '../../utils/sounds';

// Mode icons
import ArcadeIcon from '../../icons/entertainment-events-hobbies-game-machines-arcade-1--Streamline-Pixel.svg';
import GlobeIcon from '../../icons/ecology-global-warming-globe--Streamline-Pixel.svg';
import DiceIcon from '../../icons/entertainment-events-hobbies-board-game-dice--Streamline-Pixel.svg';

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
    title: 'Free Play',
    description: 'Practice with custom filters. Choose difficulty, continents, and quiz type.',
  },
  jeopardy: {
    id: 'jeopardy',
    icon: DiceIcon,
    title: 'Flag Jeopardy',
    description: 'Jeopardy-style board game. Pick by continent and difficulty. Daily Doubles included!',
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
}

type CardType =
  | { kind: 'achievement'; achievementId: string }
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
}: LevelCompleteFlowProps) {
  const cards: CardType[] = [];

  // Build card sequence
  for (const id of newAchievementIds) {
    cards.push({ kind: 'achievement', achievementId: id });
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
    if (currentCard.kind === 'achievement') {
      playAchievementSound();
    } else if (currentCard.kind === 'mode-unlock') {
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
          className={`pixel-border bg-retro-surface rounded-lg p-8 text-center relative z-10 ${
            animating ? 'animate-card-exit' : 'animate-card-enter'
          }`}
        >
          {currentCard.kind === 'achievement' && (
            <AchievementCard achievementId={currentCard.achievementId} />
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

// Map region-completion achievements to their world label
const ACHIEVEMENT_WORLD_LABELS: Record<string, string> = {
  'meadow-master': 'World 1 — Green Meadows',
  'shore-explorer': 'World 2 — Sandy Shores',
  'forest-guide': 'World 3 — Misty Forest',
  'mountain-climber': 'World 4 — Rocky Mountains',
  'volcano-conqueror': 'World 5 — Volcanic Peak',
};

function AchievementCard({ achievementId }: { achievementId: string }) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  const worldLabel = ACHIEVEMENT_WORLD_LABELS[achievementId];

  return (
    <>
      <div className="font-retro text-[1.4rem] text-retro-gold mb-4 leading-relaxed">
        Achievement Unlocked!
      </div>
      <div className="text-5xl mb-4">{achievement.icon}</div>
      <div className="font-retro text-sm text-retro-text mb-2">
        {achievement.name}
      </div>
      {worldLabel && (
        <div className="font-body text-retro-text text-sm font-bold mb-1">
          {worldLabel} Complete!
        </div>
      )}
      <div className="font-body text-retro-text-secondary text-sm">
        {achievement.description}
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
