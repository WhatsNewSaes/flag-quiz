import { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { NavBar } from '../components/NavBar';
import { Onboarding } from '../components/Onboarding';
import { OverworldMap } from '../components/journey/OverworldMap';
import { JourneyLevelPlay } from '../components/journey/JourneyLevelPlay';
import { LevelCompleteFlow } from '../components/journey/LevelCompleteFlow';
import { JourneyPractice } from '../components/journey/JourneyPractice';
import { SEOHead } from '../components/seo/SEOHead';
import { MODE_OG_IMAGES } from '../utils/modeOgImages';

type JourneyPhase = 'map' | 'play' | 'complete' | 'practice';
const DEFAULT_CHARACTER = 'boy';
const DEFAULT_FAVORITE_FLAG = 'US';

export function JourneyScreen() {
  const {
    regions, allLevels, journeyProgress, journeyGame,
    selectedLevel, completionResult, pendingAchievements, setPendingAchievements,
    newlyUnlockedCharacters, setNewlyUnlockedCharacters,
    newlyUnlockedWorlds, setNewlyUnlockedWorlds,
    showCelebration, hasNextLevel,
    handleSelectLevel, handleJourneyAnswer, handleJourneyComplete,
    handleNextLevel, handleRetryLevel,
  } = useGameContext();

  const [onboardingComplete, setOnboardingComplete] = useLocalStorage<string>('onboarding-complete', '');
  const [selectedCharacter, setSelectedCharacter] = useLocalStorage<string>('selected-character', '');
  const [favoriteFlag, setFavoriteFlag] = useLocalStorage<string>('favorite-flag', '');

  const [journeyPhase, setJourneyPhase] = useState<JourneyPhase>('map');
  const hasJourneyHistory = Object.keys(journeyProgress.progress.levelResults).length > 0
    || journeyProgress.progress.totalStars > 0;
  const hasOnboardingComplete = onboardingComplete === 'true'
    || Boolean(selectedCharacter)
    || hasJourneyHistory;

  const handleOnboardingComplete = useCallback((character: string, flag: string) => {
    setSelectedCharacter(character);
    setFavoriteFlag(flag);
    setOnboardingComplete('true');
    handleSelectLevel(allLevels[0]);
    setJourneyPhase('play');
  }, [setSelectedCharacter, setFavoriteFlag, setOnboardingComplete, handleSelectLevel, allLevels]);

  // Wrap handleSelectLevel to also transition phase
  const onSelectLevel = useCallback((level: Parameters<typeof handleSelectLevel>[0]) => {
    handleSelectLevel(level);
    setJourneyPhase('play');
  }, [handleSelectLevel]);

  // Wrap handleNextLevel to stay in play phase
  const onNextLevel = useCallback(() => {
    handleNextLevel();
    setJourneyPhase('play');
  }, [handleNextLevel]);

  // Wrap handleRetryLevel to stay in play phase
  const onRetryLevel = useCallback(() => {
    handleRetryLevel();
    setJourneyPhase('play');
  }, [handleRetryLevel]);

  const onPractice = useCallback(() => {
    setJourneyPhase('practice');
  }, []);

  const onBackToMap = useCallback(() => {
    setPendingAchievements([]);
    setNewlyUnlockedCharacters([]);
    setNewlyUnlockedWorlds([]);
    setJourneyPhase('map');
  }, [setPendingAchievements, setNewlyUnlockedCharacters, setNewlyUnlockedWorlds]);

  // Detect level completion during play
  useEffect(() => {
    if (journeyPhase === 'play' && journeyGame.isComplete && !completionResult) {
      handleJourneyComplete();
      setJourneyPhase('complete');
    }
  }, [journeyPhase, journeyGame.isComplete, completionResult, handleJourneyComplete]);

  useEffect(() => {
    if (onboardingComplete !== 'true' && (selectedCharacter || hasJourneyHistory)) {
      if (!selectedCharacter) {
        setSelectedCharacter(DEFAULT_CHARACTER);
      }
      if (!favoriteFlag) {
        setFavoriteFlag(DEFAULT_FAVORITE_FLAG);
      }
      setOnboardingComplete('true');
    }
  }, [
    onboardingComplete,
    selectedCharacter,
    favoriteFlag,
    hasJourneyHistory,
    setSelectedCharacter,
    setFavoriteFlag,
    setOnboardingComplete,
  ]);

  if (!hasOnboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (journeyPhase === 'play') {
    if (!selectedLevel || !journeyGame.currentCountry) {
      // Invalid state — fall back to map
      setJourneyPhase('map');
      return null;
    }
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
        onQuit={() => setJourneyPhase('map')}
        showCelebration={showCelebration}
        availableCountries={journeyGame.availableCountries}
      />
    );
  }

  if (journeyPhase === 'complete') {
    if (!selectedLevel || !completionResult) {
      setJourneyPhase('map');
      return null;
    }
    return (
      <LevelCompleteFlow
        level={selectedLevel}
        correct={completionResult.correct}
        total={completionResult.total}
        stars={completionResult.stars}
        isNewBest={completionResult.isNewBest}
        previousBestPct={completionResult.previousBestPct}
        onNextLevel={onNextLevel}
        onRetry={onRetryLevel}
        onPractice={onPractice}
        onBackToMap={onBackToMap}
        hasNextLevel={hasNextLevel}
        newAchievementIds={pendingAchievements}
        newlyUnlockedCharacters={newlyUnlockedCharacters}
        newlyUnlockedWorlds={newlyUnlockedWorlds}
      />
    );
  }

  if (journeyPhase === 'practice') {
    if (!selectedLevel) {
      setJourneyPhase('map');
      return null;
    }
    return (
      <JourneyPractice
        level={selectedLevel}
        onBack={() => setJourneyPhase('map')}
        onRetry={onRetryLevel}
      />
    );
  }

  // Default: map phase
  return (
    <>
      <SEOHead
        title="Journey Mode - Flag Quiz Adventure | Flag Arcade"
        description="Progress through worlds of increasing difficulty. Earn stars, unlock characters, and master every country flag in our free Journey mode."
        canonical="https://flagarcade.com/play/journey"
        ogImage={MODE_OG_IMAGES.journey}
      />
      <NavBar />
      <OverworldMap
        regions={regions}
        allLevels={allLevels}
        levelResults={journeyProgress.progress.levelResults}
        onSelectLevel={onSelectLevel}
        isLevelUnlocked={journeyProgress.isUnlocked}
      />
    </>
  );
}
