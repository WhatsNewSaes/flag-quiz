import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { buildJourneyRegions, getAllLevels, type JourneyLevel, type JourneyRegion } from '../data/journeyLevels';
import { useJourneyProgress, getUnlockedCharacters, getNewlyUnlockedWorlds, calculateStars } from '../hooks/useJourneyProgress';
import { useJourneyGame } from '../hooks/useJourneyGame';
import { playCorrectSound, playIncorrectSound, playLevelCompleteSound, playStarEarnedSound, playAchievementSound } from '../utils/sounds';
import type { Country } from '../data/countries';

interface CompletionResult {
  correct: number;
  total: number;
  stars: number;
  isNewBest: boolean;
  previousBestPct: number | null;
}

interface GameContextValue {
  // Data
  regions: JourneyRegion[];
  allLevels: JourneyLevel[];
  journeyProgress: ReturnType<typeof useJourneyProgress>;
  journeyGame: ReturnType<typeof useJourneyGame>;

  // Journey state
  selectedLevel: JourneyLevel | null;
  completionResult: CompletionResult | null;
  pendingAchievements: string[];
  setPendingAchievements: (ids: string[]) => void;
  newlyUnlockedCharacters: string[];
  setNewlyUnlockedCharacters: (chars: string[]) => void;
  newlyUnlockedWorlds: number[];
  setNewlyUnlockedWorlds: (worlds: number[]) => void;
  showCelebration: boolean;
  hasNextLevel: boolean;

  // Journey handlers
  handleSelectLevel: (level: JourneyLevel) => void;
  handleJourneyAnswer: (answer: Country | string) => void;
  handleJourneyComplete: () => void;
  handleNextLevel: () => void;
  handleRetryLevel: () => void;
  handlePracticeLevel: () => void;

  // Setters for journey phase (used by JourneyScreen)
  setSelectedLevel: (level: JourneyLevel | null) => void;
  setCompletionResult: (result: CompletionResult | null) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}

interface GameProviderProps {
  children: ReactNode;
  onNavigateToPlay: () => void;
  onNavigateToComplete: () => void;
}

export function GameProvider({ children, onNavigateToPlay, onNavigateToComplete }: GameProviderProps) {
  const regions = useMemo(() => buildJourneyRegions(), []);
  const allLevels = useMemo(() => getAllLevels(regions), [regions]);
  const journeyProgress = useJourneyProgress(regions, allLevels);
  const journeyGame = useJourneyGame();

  const [selectedLevel, setSelectedLevel] = useState<JourneyLevel | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);
  const [newlyUnlockedCharacters, setNewlyUnlockedCharacters] = useState<string[]>([]);
  const [newlyUnlockedWorlds, setNewlyUnlockedWorlds] = useState<number[]>([]);

  const handleSelectLevel = useCallback((level: JourneyLevel) => {
    setSelectedLevel(level);
    setCompletionResult(null);
    journeyGame.startLevel(level);
    onNavigateToPlay();
  }, [journeyGame, onNavigateToPlay]);

  const handleJourneyAnswer = useCallback((answer: Country | string) => {
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

  const handleJourneyComplete = useCallback(() => {
    if (!selectedLevel) return;
    const { correct, total } = { correct: journeyGame.correctCount, total: journeyGame.totalFlags };
    const existing = journeyProgress.progress.levelResults[selectedLevel.id];
    const previousBestPct = existing?.bestPercentage ?? null;

    const charsBefore = getUnlockedCharacters(regions, journeyProgress.progress.levelResults);

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
    const charsAfter = getUnlockedCharacters(regions, projectedResults);
    const freshCharacters = charsAfter.filter(c => !charsBefore.includes(c));

    const freshWorlds = getNewlyUnlockedWorlds(regions, journeyProgress.progress.levelResults, projectedResults);

    const result = journeyProgress.saveResult(selectedLevel.id, correct, total);
    playLevelCompleteSound();
    if (result.stars > 0) playStarEarnedSound();

    setNewlyUnlockedCharacters(freshCharacters);
    setNewlyUnlockedWorlds(freshWorlds);

    const projectedTotalStars = journeyProgress.progress.totalStars + (Math.max(existingStars, newStars) - existingStars);
    const newAchievements = journeyProgress.checkAchievements(
      selectedLevel.id, result.stars, result.percentage, selectedLevel.regionIndex,
      projectedResults, projectedTotalStars
    );
    setPendingAchievements(newAchievements);
    if (newAchievements.length > 0) {
      playAchievementSound();
    }

    setCompletionResult({
      correct,
      total,
      stars: result.stars,
      isNewBest: !previousBestPct || result.percentage > previousBestPct,
      previousBestPct,
    });
    onNavigateToComplete();
  }, [selectedLevel, journeyGame, journeyProgress, regions, onNavigateToComplete]);

  const handleNextLevel = useCallback(() => {
    if (!selectedLevel) return;
    const nextGlobalIdx = selectedLevel.globalLevelIndex + 1;
    setCompletionResult(null);

    if (nextGlobalIdx < allLevels.length) {
      const nextLevel = allLevels[nextGlobalIdx];
      setSelectedLevel(nextLevel);
      journeyGame.startLevel(nextLevel);
      onNavigateToPlay();
    } else {
      // No more levels — go back to map (caller should navigate to /play)
    }
  }, [selectedLevel, allLevels, journeyGame, onNavigateToPlay]);

  const hasNextLevel = useMemo(() => {
    if (!selectedLevel) return false;
    return selectedLevel.globalLevelIndex + 1 < allLevels.length;
  }, [selectedLevel, allLevels]);

  const handleRetryLevel = useCallback(() => {
    if (!selectedLevel) return;
    setCompletionResult(null);
    journeyGame.startLevel(selectedLevel);
    onNavigateToPlay();
  }, [selectedLevel, journeyGame, onNavigateToPlay]);

  const handlePracticeLevel = useCallback(() => {
    // This transitions to practice phase — handled by JourneyScreen local state
  }, []);

  const value = useMemo<GameContextValue>(() => ({
    regions,
    allLevels,
    journeyProgress,
    journeyGame,
    selectedLevel,
    completionResult,
    pendingAchievements,
    setPendingAchievements,
    newlyUnlockedCharacters,
    setNewlyUnlockedCharacters,
    newlyUnlockedWorlds,
    setNewlyUnlockedWorlds,
    showCelebration,
    hasNextLevel,
    handleSelectLevel,
    handleJourneyAnswer,
    handleJourneyComplete,
    handleNextLevel,
    handleRetryLevel,
    handlePracticeLevel,
    setSelectedLevel,
    setCompletionResult,
  }), [
    regions, allLevels, journeyProgress, journeyGame,
    selectedLevel, completionResult, pendingAchievements,
    newlyUnlockedCharacters, newlyUnlockedWorlds,
    showCelebration, hasNextLevel,
    handleSelectLevel, handleJourneyAnswer, handleJourneyComplete,
    handleNextLevel, handleRetryLevel, handlePracticeLevel,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
