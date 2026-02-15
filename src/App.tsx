import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CelebrationTest } from './components/CelebrationTest';
import { GameModeSelect, GameMode } from './components/GameModeSelect';
import { CampaignQuizTypeSelect } from './components/CampaignQuizTypeSelect';
import { JeopardyDifficultySelect, JeopardyDifficulty } from './components/JeopardyDifficultySelect';
import { FreePlayScreen } from './screens/FreePlayScreen';
import { CampaignScreen } from './screens/CampaignScreen';
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
import { AchievementToast } from './components/journey/AchievementToast';
import { buildJourneyRegions, getAllLevels, JourneyLevel } from './data/journeyLevels';
import { useJourneyProgress, getUnlockedModes, calculateStars } from './hooks/useJourneyProgress';
import { useJourneyGame } from './hooks/useJourneyGame';
import { useLocalStorage } from './hooks/useLocalStorage';
import { QuizMode } from './hooks/useQuiz';
import { playCorrectSound, playIncorrectSound, playLevelCompleteSound, playStarEarnedSound, playAchievementSound } from './utils/sounds';

type AppScreen =
  | 'journey-map'
  | 'journey-quiz-select'
  | 'journey-play'
  | 'journey-practice'
  | 'journey-complete'
  | 'achievements'
  | 'mode-select'
  | 'campaign-quiz-select'
  | 'free-play'
  | 'campaign'
  | 'around-the-world'
  | 'jeopardy-difficulty-select'
  | 'jeopardy'
  | 'presentation'
  | 'flag-runner';

const VALID_SCREENS: Set<string> = new Set([
  'journey-map', 'journey-quiz-select', 'journey-play', 'journey-practice',
  'journey-complete', 'achievements', 'mode-select', 'campaign-quiz-select',
  'free-play', 'campaign', 'around-the-world', 'jeopardy-difficulty-select',
  'jeopardy', 'presentation', 'flag-runner',
]);

function migrateScreen(raw: any): AppScreen {
  if (typeof raw === 'string' && VALID_SCREENS.has(raw)) return raw as AppScreen;
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

  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useLocalStorage<string>('onboarding-complete', '');
  const [, setSelectedCharacter] = useLocalStorage<string>('selected-character', '');
  const [, setFavoriteFlag] = useLocalStorage<string>('favorite-flag', '');

  // Campaign/Jeopardy quiz type state
  const [campaignQuizType, setCampaignQuizType] = useState<QuizMode>('multiple-choice');
  const [jeopardyDifficulty, setJeopardyDifficulty] = useState<JeopardyDifficulty>('medium');

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
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        journeyGame.nextFlag();
      }, 2000);
    }
  }, [journeyGame]);

  // Handle journey level completion
  const handleJourneyComplete = useCallback(() => {
    if (!selectedLevel) return;
    const { correct, total } = { correct: journeyGame.correctCount, total: journeyGame.totalFlags };
    const existing = journeyProgress.progress.levelResults[selectedLevel.id];
    const previousBestPct = existing?.bestPercentage ?? null;

    // Capture modes before saving result
    const modesBefore = getUnlockedModes(regions, journeyProgress.progress.levelResults);

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

    const result = journeyProgress.saveResult(selectedLevel.id, correct, total);
    playLevelCompleteSound();
    if (result.stars > 0) playStarEarnedSound();

    setNewlyUnlockedModes(freshModes);

    // Check achievements
    const newAchievements = journeyProgress.checkAchievements(
      selectedLevel.id, result.stars, result.percentage, selectedLevel.regionIndex
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
    if (gameMode === 'free-play') setScreen('free-play');
    else if (gameMode === 'campaign') setScreen('campaign-quiz-select');
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
        onBackToMap={() => { setPendingAchievements([]); setNewlyUnlockedModes([]); setScreen('journey-map'); }}
        hasNextLevel={hasNextLevel}
        newAchievementIds={pendingAchievements}
        newlyUnlockedModes={newlyUnlockedModes}
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

  if (screen === 'campaign-quiz-select') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <CampaignQuizTypeSelect
          onSelect={(qt) => { setCampaignQuizType(qt); setScreen('campaign'); }}
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
          onSelect={(d) => { setJeopardyDifficulty(d); setScreen('jeopardy'); }}
          onBack={handleBackToModeSelect}
        />
      </>
    );
  }

  if (screen === 'free-play') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <FreePlayScreen />
      </>
    );
  }

  if (screen === 'campaign') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <CampaignScreen initialQuizType={campaignQuizType} />
      </>
    );
  }

  if (screen === 'around-the-world') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} />
        <AroundTheWorldScreen />
      </>
    );
  }

  if (screen === 'jeopardy') {
    return (
      <>
        <NavBar onNavigate={handleNavigate} totalStars={journeyProgress.progress.totalStars} unlockedModes={journeyProgress.unlockedModes} variant="dark" />
        <JeopardyScreen difficulty={jeopardyDifficulty} />
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
