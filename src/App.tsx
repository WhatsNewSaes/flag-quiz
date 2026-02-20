import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CelebrationTest } from './components/CelebrationTest';
import { GameModeSelect, GameMode } from './components/GameModeSelect';
import { JeopardyDifficultySelect, JeopardyQuizMode } from './components/JeopardyDifficultySelect';
import { ArcadeScreen } from './screens/ArcadeScreen';
import { AroundTheWorldScreen } from './screens/AroundTheWorldScreen';
import { JeopardyScreen } from './screens/JeopardyScreen';
import { PresentationScreen } from './screens/PresentationScreen';
import { FlagRunnerScreen } from './screens/FlagRunnerScreen';
import { NavBar } from './components/NavBar';
import { Onboarding } from './components/Onboarding';
import { OverworldMap } from './components/journey/OverworldMap';
import { JourneyLevelPlay } from './components/journey/JourneyLevelPlay';
import { LevelCompleteFlow } from './components/journey/LevelCompleteFlow';
import { JourneyPractice } from './components/journey/JourneyPractice';
import { AchievementsPage } from './components/journey/AchievementsPage';
import { CharactersPage } from './components/journey/CharactersPage';
import { AchievementToast } from './components/journey/AchievementToast';
import { buildJourneyRegions, getAllLevels, JourneyLevel } from './data/journeyLevels';
import { useJourneyProgress, getUnlockedModes, getUnlockedCharacters, getNewlyUnlockedWorlds, calculateStars } from './hooks/useJourneyProgress';
import { useJourneyGame } from './hooks/useJourneyGame';
import { useLocalStorage } from './hooks/useLocalStorage';
import { playCorrectSound, playIncorrectSound, playLevelCompleteSound, playStarEarnedSound, playAchievementSound } from './utils/sounds';

type AppScreen =
  | 'journey-map'
  | 'journey-quiz-select'
  | 'journey-play'
  | 'journey-practice'
  | 'journey-complete'
  | 'achievements'
  | 'characters'
  | 'mode-select'
  | 'arcade'
  | 'around-the-world'
  | 'jeopardy-difficulty-select'
  | 'jeopardy'
  | 'presentation'
  | 'flag-runner';

const VALID_SCREENS: Set<string> = new Set([
  'journey-map', 'journey-quiz-select', 'journey-play', 'journey-practice',
  'journey-complete', 'achievements', 'characters', 'mode-select', 'arcade',
  'around-the-world', 'jeopardy-difficulty-select',
  'jeopardy', 'presentation', 'flag-runner',
]);

function migrateScreen(raw: any): AppScreen {
  if (typeof raw === 'string') {
    // Migrate old screen names to arcade
    if (raw === 'free-play' || raw === 'campaign' || raw === 'campaign-quiz-select') return 'arcade';
    if (VALID_SCREENS.has(raw)) return raw as AppScreen;
  }
  return 'journey-map';
}

function App() {
  const [screen, setScreen] = useLocalStorage<AppScreen>('app-screen', 'journey-map', migrateScreen);

  // Journey state
  const regions = useMemo(() => buildJourneyRegions(), []);
  const allLevels = useMemo(() => getAllLevels(regions), [regions]);
  const journeyProgress = useJourneyProgress(regions, allLevels);
  const journeyGame = useJourneyGame();
  const [selectedLevel, setSelectedLevel] = useState<JourneyLevel | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    correct: number; total: number; stars: number; isNewBest: boolean; previousBestPct: number | null;
  } | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);
  const [newlyUnlockedModes, setNewlyUnlockedModes] = useState<string[]>([]);
  const [newlyUnlockedCharacters, setNewlyUnlockedCharacters] = useState<string[]>([]);
  const [newlyUnlockedWorlds, setNewlyUnlockedWorlds] = useState<number[]>([]);

  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage<string>('onboarding-complete', '');
  const [, setSelectedCharacter] = useLocalStorage<string>('selected-character', '');
  const [, setFavoriteFlag] = useLocalStorage<string>('favorite-flag', '');

  // Jeopardy quiz mode state
  const [jeopardyQuizMode, setJeopardyQuizMode] = useState<JeopardyQuizMode>('pick-the-name');

  // Hidden test page — type "devmode" anywhere to toggle
  const [showTestPage, setShowTestPage] = useState(false);
  const secretBuffer = useRef('');

  useEffect(() => {
    const SECRET = 'devmode';
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      secretBuffer.current = (secretBuffer.current + e.key).slice(-SECRET.length);
      if (secretBuffer.current === SECRET) {
        setShowTestPage(prev => !prev);
        secretBuffer.current = '';
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // --- Journey handlers ---
  const handleSelectLevel = useCallback((level: JourneyLevel) => {
    setSelectedLevel(level);
    setCompletionResult(null);
    journeyGame.startLevel(level);
    setScreen('journey-play');
  }, [journeyGame, setScreen]);

  const handleJourneyAnswer = useCallback((answer: any) => {
    const isCorrect = journeyGame.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        journeyGame.nextFlag();
      }, 1000);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        journeyGame.nextFlag();
      }, 1500);
    }
  }, [journeyGame]);

  // Handle journey level completion
  const handleJourneyComplete = useCallback(() => {
    if (!selectedLevel) return;
    const { correct, total } = { correct: journeyGame.correctCount, total: journeyGame.totalFlags };
    const existing = journeyProgress.progress.levelResults[selectedLevel.id];
    const previousBestPct = existing?.bestPercentage ?? null;

    // Capture modes and characters before saving result
    const modesBefore = getUnlockedModes(regions, journeyProgress.progress.levelResults);
    const charsBefore = getUnlockedCharacters(regions, journeyProgress.progress.levelResults);

    // Project what level results will look like after saving
    const newStars = calculateStars(correct, total);
    const existingStars = existing?.stars ?? 0;
    const projectedResults = {
      ...journeyProgress.progress.levelResults,
      [selectedLevel.id]: {
        ...existing,
        stars: Math.max(existingStars, newStars),
        bestScore: correct,
        totalFlags: total,
        bestPercentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        attempts: (existing?.attempts ?? 0) + 1,
        lastFailedAt: existing?.lastFailedAt ?? null,
      },
    };
    const modesAfter = getUnlockedModes(regions, projectedResults);
    const freshModes = modesAfter.filter(m => !modesBefore.includes(m));
    const charsAfter = getUnlockedCharacters(regions, projectedResults);
    const freshCharacters = charsAfter.filter(c => !charsBefore.includes(c));

    // Detect newly completed worlds
    const freshWorlds = getNewlyUnlockedWorlds(regions, journeyProgress.progress.levelResults, projectedResults);

    const result = journeyProgress.saveResult(selectedLevel.id, correct, total);
    playLevelCompleteSound();
    if (result.stars > 0) playStarEarnedSound();

    setNewlyUnlockedModes(freshModes);
    setNewlyUnlockedCharacters(freshCharacters);
    setNewlyUnlockedWorlds(freshWorlds);

    // Check achievements using projected state (saveResult queues async update)
    const projectedTotalStars = journeyProgress.progress.totalStars + (Math.max(existingStars, newStars) - existingStars);
    const newAchievements = journeyProgress.checkAchievements(
      selectedLevel.id, result.stars, result.percentage, selectedLevel.regionIndex,
      projectedResults, projectedTotalStars
    );
    if (newAchievements.length > 0) {
      playAchievementSound();
      setPendingAchievements(newAchievements);
    }

    setCompletionResult({
      correct,
      total,
      stars: result.stars,
      isNewBest: !previousBestPct || result.percentage > previousBestPct,
      previousBestPct,
    });
    setScreen('journey-complete');
  }, [selectedLevel, journeyGame, journeyProgress, regions, setScreen]);

  const handleNextLevel = useCallback(() => {
    if (!selectedLevel) return;
    const nextGlobalIdx = selectedLevel.globalLevelIndex + 1;
    setCompletionResult(null);

    if (nextGlobalIdx < allLevels.length) {
      const nextLevel = allLevels[nextGlobalIdx];
      setSelectedLevel(nextLevel);
      journeyGame.startLevel(nextLevel);
      setScreen('journey-play');
    } else {
      setScreen('journey-map');
    }
  }, [selectedLevel, allLevels, journeyGame, setScreen]);

  const hasNextLevel = useMemo(() => {
    if (!selectedLevel) return false;
    return selectedLevel.globalLevelIndex + 1 < allLevels.length;
  }, [selectedLevel, allLevels]);

  const handleRetryLevel = useCallback(() => {
    if (!selectedLevel) return;
    setCompletionResult(null);
    journeyGame.startLevel(selectedLevel);
    setScreen('journey-play');
  }, [selectedLevel, journeyGame, setScreen]);

  const handlePracticeLevel = useCallback(() => {
    setScreen('journey-practice');
  }, [setScreen]);

  // --- Other mode handlers ---
  const handleSelectGameMode = useCallback((gameMode: GameMode) => {
    if (gameMode === 'arcade') setScreen('arcade');
    else if (gameMode === 'around-the-world') setScreen('around-the-world');
    else if (gameMode === 'jeopardy') setScreen('jeopardy-difficulty-select');
    else if (gameMode === 'presentation') setScreen('presentation');
    else if (gameMode === 'flag-runner') setScreen('flag-runner');
  }, [setScreen]);

  // --- Onboarding handler ---
  const handleOnboardingComplete = useCallback((character: string, flag: string) => {
    setSelectedCharacter(character);
    setFavoriteFlag(flag);
    setOnboardingComplete('true');
    // Start level 1
    handleSelectLevel(allLevels[0]);
  }, [setSelectedCharacter, setFavoriteFlag, setOnboardingComplete, handleSelectLevel, allLevels]);

  // --- Navigation handlers ---
  const handleNavigate = useCallback((target: string) => {
    setScreen(target as AppScreen);
  }, [setScreen]);

  const handleBackToModeSelect = useCallback(() => {
    setScreen('mode-select');
  }, [setScreen]);

  // --- Check for level completion in play screen ---
  useEffect(() => {
    if (screen === 'journey-play' && journeyGame.isComplete && !completionResult) {
      handleJourneyComplete();
    }
  }, [screen, journeyGame.isComplete, completionResult, handleJourneyComplete]);

  // --- Render ---
  if (showTestPage) {
    return (
      <CelebrationTest
        onBack={() => setShowTestPage(false)}
        onNavigate={(target) => { setShowTestPage(false); setScreen(target as AppScreen); }}
      />
    );
  }

  // Onboarding gate: show onboarding for first-time users
  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Journey screens
  if (screen === 'journey-map') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <OverworldMap
          regions={regions}
          allLevels={allLevels}
          levelResults={journeyProgress.progress.levelResults}
          onSelectLevel={handleSelectLevel}
          isLevelUnlocked={journeyProgress.isUnlocked}
        />
        {pendingAchievements.length > 0 && (
          <AchievementToast
            achievementIds={pendingAchievements}
            onDone={() => setPendingAchievements([])}
          />
        )}
      </>
    );
  }

  // If someone has journey-quiz-select persisted, redirect to map
  if (screen === 'journey-quiz-select') {
    setScreen('journey-map');
    return null;
  }

  if (screen === 'journey-play') {
    if (!selectedLevel || !journeyGame.currentCountry) { setScreen('journey-map'); return null; }
    return (
      <JourneyLevelPlay
        level={selectedLevel}
        quizMode={journeyGame.currentQuizMode}
        currentCountry={journeyGame.currentCountry}
        currentIndex={journeyGame.currentIndex}
        totalFlags={journeyGame.totalFlags}
        options={journeyGame.options}
        selectedAnswer={journeyGame.selectedAnswer}
        answeredCorrectly={journeyGame.answeredCorrectly}
        correctCount={journeyGame.correctCount}
        onAnswer={handleJourneyAnswer}
        onQuit={() => setScreen('journey-map')}
        showCelebration={showCelebration}
        availableCountries={journeyGame.availableCountries}
      />
    );
  }

  if (screen === 'journey-complete') {
    if (!selectedLevel || !completionResult) { setScreen('journey-map'); return null; }
    return (
      <LevelCompleteFlow
        level={selectedLevel}
        correct={completionResult.correct}
        total={completionResult.total}
        stars={completionResult.stars}
        isNewBest={completionResult.isNewBest}
        previousBestPct={completionResult.previousBestPct}
        onNextLevel={handleNextLevel}
        onRetry={handleRetryLevel}
        onPractice={handlePracticeLevel}
        onBackToMap={() => { setPendingAchievements([]); setNewlyUnlockedModes([]); setNewlyUnlockedCharacters([]); setNewlyUnlockedWorlds([]); setScreen('journey-map'); }}
        hasNextLevel={hasNextLevel}
        newAchievementIds={pendingAchievements}
        newlyUnlockedModes={newlyUnlockedModes}
        newlyUnlockedCharacters={newlyUnlockedCharacters}
        newlyUnlockedWorlds={newlyUnlockedWorlds}
      />
    );
  }

  if (screen === 'journey-practice') {
    if (!selectedLevel) { setScreen('journey-map'); return null; }
    return (
      <JourneyPractice
        level={selectedLevel}
        onBack={() => setScreen('journey-map')}
        onRetry={handleRetryLevel}
      />
    );
  }

  if (screen === 'achievements') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <AchievementsPage
          unlockedAchievements={journeyProgress.progress.achievements}
        />
      </>
    );
  }

  if (screen === 'characters') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <CharactersPage
          unlockedCharacters={journeyProgress.unlockedCharacters}
        />
      </>
    );
  }

  if (screen === 'mode-select') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <GameModeSelect
          onSelectMode={handleSelectGameMode}
          unlockedModes={journeyProgress.unlockedModes}
          onJourney={() => setScreen('journey-map')}
        />
      </>
    );
  }

  if (screen === 'arcade') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <ArcadeScreen
          onBack={handleBackToModeSelect}
        />
      </>
    );
  }

  if (screen === 'jeopardy-difficulty-select') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} variant="dark" />
        <JeopardyDifficultySelect
          onSelect={(mode) => { setJeopardyQuizMode(mode); setScreen('jeopardy'); }}
          onBack={handleBackToModeSelect}
        />
      </>
    );
  }

  if (screen === 'around-the-world') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <AroundTheWorldScreen onBack={handleBackToModeSelect} />
      </>
    );
  }

  if (screen === 'jeopardy') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} variant="dark" />
        <JeopardyScreen quizMode={jeopardyQuizMode} />
      </>
    );
  }

  if (screen === 'presentation') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <PresentationScreen />
      </>
    );
  }

  if (screen === 'flag-runner') {
    return <FlagRunnerScreen onBack={handleBackToModeSelect} />;
  }

  // Fallback
  return null;
}

export default App;
