import { useState } from 'react';
import { Celebration } from './Celebration';
import { Onboarding } from './Onboarding';
import { LevelCompleteFlow } from './journey/LevelCompleteFlow';
import { JourneyPractice } from './journey/JourneyPractice';
import { JourneyLevel } from '../data/journeyLevels';

const MOCK_LEVEL: JourneyLevel = {
  id: 'test-level-1',
  regionIndex: 0,
  levelIndexInRegion: 0,
  globalLevelIndex: 0,
  difficulty: 1,
  countryCodes: ['US', 'GB', 'FR', 'DE', 'JP', 'BR', 'AU', 'CA', 'IT', 'ES'],
  displayName: 'Green Meadows 1-1',
};

type DemoScreen = 'menu' | 'level-only' | 'level-achievement' | 'level-achievement-mode' | 'level-failed' | 'level-barely-failed' | 'practice' | 'onboarding';

interface CelebrationTestProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function CelebrationTest({ onBack, onNavigate }: CelebrationTestProps) {
  const [activeStreak, setActiveStreak] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [demoScreen, setDemoScreen] = useState<DemoScreen>('menu');

  const triggerCelebration = (streak: number) => {
    setActiveStreak(streak);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 2000);
  };

  // Practice demo
  if (demoScreen === 'practice') {
    return (
      <JourneyPractice
        level={MOCK_LEVEL}
        onBack={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
      />
    );
  }

  // Onboarding demo
  if (demoScreen === 'onboarding') {
    return (
      <Onboarding
        onComplete={(character, flag) => {
          console.log('Onboarding complete:', character, flag);
          setDemoScreen('menu');
        }}
      />
    );
  }

  // Level complete demo screens
  if (demoScreen === 'level-only') {
    return (
      <LevelCompleteFlow
        level={MOCK_LEVEL}
        correct={9}
        total={10}
        stars={2}
        isNewBest={true}
        previousBestPct={70}
        onNextLevel={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
        onPractice={() => setDemoScreen('practice')}
        onBackToMap={() => setDemoScreen('menu')}
        hasNextLevel={true}
        newAchievementIds={[]}
        newlyUnlockedModes={[]}
        newlyUnlockedCharacters={[]}
        newlyUnlockedWorlds={[]}
      />
    );
  }

  if (demoScreen === 'level-achievement') {
    return (
      <LevelCompleteFlow
        level={MOCK_LEVEL}
        correct={10}
        total={10}
        stars={3}
        isNewBest={true}
        previousBestPct={90}
        onNextLevel={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
        onPractice={() => setDemoScreen('practice')}
        onBackToMap={() => setDemoScreen('menu')}
        hasNextLevel={true}
        newAchievementIds={['first-steps', 'perfect-score']}
        newlyUnlockedModes={[]}
        newlyUnlockedCharacters={[]}
        newlyUnlockedWorlds={[]}
      />
    );
  }

  if (demoScreen === 'level-achievement-mode') {
    return (
      <LevelCompleteFlow
        level={MOCK_LEVEL}
        correct={8}
        total={10}
        stars={2}
        isNewBest={true}
        previousBestPct={null}
        onNextLevel={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
        onPractice={() => setDemoScreen('practice')}
        onBackToMap={() => setDemoScreen('menu')}
        hasNextLevel={true}
        newAchievementIds={[]}
        newlyUnlockedModes={['free-play']}
        newlyUnlockedCharacters={['kitsune']}
        newlyUnlockedWorlds={[0]}
      />
    );
  }

  if (demoScreen === 'level-failed') {
    return (
      <LevelCompleteFlow
        level={MOCK_LEVEL}
        correct={3}
        total={10}
        stars={0}
        isNewBest={false}
        previousBestPct={null}
        onNextLevel={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
        onPractice={() => setDemoScreen('practice')}
        onBackToMap={() => setDemoScreen('menu')}
        hasNextLevel={true}
        newAchievementIds={[]}
        newlyUnlockedModes={[]}
        newlyUnlockedCharacters={[]}
        newlyUnlockedWorlds={[]}
      />
    );
  }

  if (demoScreen === 'level-barely-failed') {
    return (
      <LevelCompleteFlow
        level={MOCK_LEVEL}
        correct={6}
        total={10}
        stars={0}
        isNewBest={true}
        previousBestPct={50}
        onNextLevel={() => setDemoScreen('menu')}
        onRetry={() => setDemoScreen('menu')}
        onPractice={() => setDemoScreen('practice')}
        onBackToMap={() => setDemoScreen('menu')}
        hasNextLevel={true}
        newAchievementIds={[]}
        newlyUnlockedModes={[]}
        newlyUnlockedCharacters={[]}
        newlyUnlockedWorlds={[]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg p-6">
      <Celebration streak={activeStreak || 1} show={showCelebration} />

      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="retro-btn px-4 py-2 font-retro text-[0.6rem] bg-retro-surface text-retro-text mb-6"
        >
          ← Back
        </button>

        <h1 className="font-retro text-sm text-retro-text mb-1">Test Page</h1>
        <p className="font-body text-retro-text-secondary text-sm mb-8">
          Tap any button to preview that celebration or flow.
        </p>

        {/* Mock flag area */}
        <div className="pixel-border bg-retro-surface rounded-lg p-8 mb-8 text-center">
          <span className="text-7xl">🇦🇷</span>
          <p className="font-body mt-3 text-retro-text-secondary text-xs">Mock flag area</p>
        </div>

        {/* Section: Regular celebrations */}
        <h2 className="font-retro text-[0.6rem] text-retro-text mb-3">Regular Streaks</h2>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[1, 2, 3, 4].map((streak) => (
            <button
              key={streak}
              onClick={() => triggerCelebration(streak)}
              className="retro-btn py-3 px-2 font-retro text-[0.5rem] bg-retro-neon-green text-white"
            >
              Streak {streak}
            </button>
          ))}
        </div>

        {/* Section: Milestone celebrations */}
        <h2 className="font-retro text-[0.6rem] text-retro-text mb-3">Milestone Streaks</h2>
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[5, 10, 25, 50, 100].map((streak) => (
            <button
              key={streak}
              onClick={() => triggerCelebration(streak)}
              className="retro-btn py-3 px-2 font-retro text-[0.5rem] bg-retro-accent text-retro-text"
            >
              {streak} Streak
            </button>
          ))}
        </div>

        {/* Section: Level complete flows */}
        <h2 className="font-retro text-[0.6rem] text-retro-text mb-3">Level Complete Flows</h2>
        <div className="space-y-3">
          <button
            onClick={() => setDemoScreen('level-only')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-text mb-1">
              Level Complete Only
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              Beat a level with 90% — no achievements or unlocks. Goes straight to summary.
            </div>
          </button>

          <button
            onClick={() => setDemoScreen('level-achievement')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-gold mb-1">
              Level + Achievements
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              Perfect score — unlocks "First Steps" and "Perfect Score" achievements, then shows summary.
            </div>
          </button>

          <button
            onClick={() => setDemoScreen('level-achievement-mode')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-neon-green mb-1">
              Level + Achievement + Mode Unlock
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              Completes Green Meadows — "New World Unlocked" card with Sandy Shores preview, then "Arcade Mode" unlock card, then summary.
            </div>
          </button>

          <button
            onClick={() => setDemoScreen('level-failed')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-neon-red mb-1">
              Level Failed (30%)
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              3/10 correct, 0 stars. Shows "Keep Going!" heading with Practice and Retry buttons.
            </div>
          </button>

          <button
            onClick={() => setDemoScreen('level-barely-failed')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-orange-500 mb-1">
              Level Barely Failed (60%)
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              6/10 correct, 0 stars but new best (was 50%). Close to passing — shows Practice and Retry.
            </div>
          </button>
        </div>

        {/* Section: Onboarding */}
        <h2 className="font-retro text-[0.6rem] text-retro-text mb-3 mt-8">Onboarding</h2>
        <div className="space-y-3">
          <button
            onClick={() => setDemoScreen('onboarding')}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-neon-blue mb-1">
              Preview Onboarding Flow
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              Walk through all 3 screens: character select, flag pick, welcome intro. Does not save to localStorage.
            </div>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('onboarding-complete');
              localStorage.removeItem('selected-character');
              localStorage.removeItem('favorite-flag');
              window.location.hash = '';
              window.location.reload();
            }}
            className="retro-btn w-full py-4 px-4 bg-retro-surface text-left"
          >
            <div className="font-retro text-[0.55rem] text-retro-neon-red mb-1">
              Reset Onboarding & Reload
            </div>
            <div className="font-body text-retro-text-secondary text-xs">
              Clears onboarding localStorage keys and reloads the app so the real onboarding gate triggers.
            </div>
          </button>
        </div>

        {/* Section: Game Modes */}
        {onNavigate && (
          <>
            <h2 className="font-retro text-[0.6rem] text-retro-text mb-3 mt-8">Game Modes</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { screen: 'arcade', label: 'Arcade Mode', color: 'bg-retro-accent text-retro-text' },
                { screen: 'around-the-world', label: 'Around the World', color: 'bg-teal-600 text-white' },
                { screen: 'jeopardy-difficulty-select', label: 'Flag Jeopardy', color: 'bg-retro-neon-blue text-white' },
                { screen: 'presentation', label: 'Practice Mode', color: 'bg-purple-600 text-white' },
                { screen: 'flag-runner', label: 'Flag Runner', color: 'bg-emerald-500 text-white' },
                { screen: 'journey-map', label: 'Journey', color: 'bg-retro-neon-green text-white' },
              ].map(({ screen, label, color }) => (
                <button
                  key={screen}
                  onClick={() => { onBack(); onNavigate(screen); }}
                  className={`retro-btn py-3 px-2 font-retro text-[0.5rem] ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
