import { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { NavBar } from '../components/NavBar';
import { OverworldMap } from '../components/journey/OverworldMap';
import { JourneyLevelPlay } from '../components/journey/JourneyLevelPlay';
import { LevelCompleteFlow } from '../components/journey/LevelCompleteFlow';
import { JourneyPractice } from '../components/journey/JourneyPractice';

type JourneyPhase = 'map' | 'play' | 'complete' | 'practice';

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

  const [journeyPhase, setJourneyPhase] = useState<JourneyPhase>('map');

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
