import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent, continents, Difficulty, difficultyLabels } from '../data/countries';
import { shuffle, getRandomElements } from '../utils/shuffle';
import { QuizMode } from './useQuiz';

export type ArcadePhase = 'lobby' | 'playing' | 'summary';

export interface DifficultyStats {
  correct: number;
  total: number;
}

export interface ArcadeSummary {
  totalScore: number;
  totalCorrect: number;
  totalFlags: number;
  accuracy: number;
  bestStreak: number;
  difficultyBreakdown: Record<Difficulty, DifficultyStats>;
}

interface ArcadeState {
  phase: ArcadePhase;
  // Lobby options
  enabledContinents: Continent[];
  enabledDifficulties: Difficulty[];
  quizMode: QuizMode;
  // Playing state
  flags: Country[];
  currentIndex: number;
  currentCountry: Country | null;
  options: Country[];
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
  score: number;
  streak: number;
  bestStreak: number;
  // Per-difficulty tracking
  difficultyStats: Record<Difficulty, DifficultyStats>;
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

function getBasePoints(difficulty: Difficulty): number {
  return difficulty * 100;
}

function generateOptions(currentCountry: Country, allCountries: Country[]): Country[] {
  const sameContinent = allCountries.filter(
    c => c.code !== currentCountry.code && c.continent === currentCountry.continent
  );
  const others = allCountries.filter(c => c.code !== currentCountry.code);

  let wrongAnswers: Country[];
  if (sameContinent.length >= 3) {
    wrongAnswers = getRandomElements(sameContinent, 3);
  } else {
    wrongAnswers = getRandomElements(others, 3);
  }

  return shuffle([currentCountry, ...wrongAnswers]);
}

const emptyDifficultyStats: Record<Difficulty, DifficultyStats> = {
  1: { correct: 0, total: 0 },
  2: { correct: 0, total: 0 },
  3: { correct: 0, total: 0 },
  4: { correct: 0, total: 0 },
  5: { correct: 0, total: 0 },
};

export function useArcade() {
  const [state, setState] = useState<ArcadeState>({
    phase: 'lobby',
    enabledContinents: [...continents],
    enabledDifficulties: [1, 2, 3, 4, 5],
    quizMode: 'multiple-choice',
    flags: [],
    currentIndex: 0,
    currentCountry: null,
    options: [],
    answeredCorrectly: null,
    selectedAnswer: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    difficultyStats: { ...emptyDifficultyStats },
  });

  const filteredCountries = useMemo(() => {
    return countries.filter(
      c => state.enabledContinents.includes(c.continent) && state.enabledDifficulties.includes(c.difficulty)
    );
  }, [state.enabledContinents, state.enabledDifficulties]);

  const flagCount = filteredCountries.length;

  const currentMultiplier = getStreakMultiplier(state.streak);

  const toggleContinent = useCallback((continent: Continent) => {
    setState(prev => {
      if (prev.phase !== 'lobby') return prev;
      const has = prev.enabledContinents.includes(continent);
      if (has && prev.enabledContinents.length === 1) return prev;
      return {
        ...prev,
        enabledContinents: has
          ? prev.enabledContinents.filter(c => c !== continent)
          : [...prev.enabledContinents, continent],
      };
    });
  }, []);

  const toggleDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => {
      if (prev.phase !== 'lobby') return prev;
      const has = prev.enabledDifficulties.includes(difficulty);
      if (has && prev.enabledDifficulties.length === 1) return prev;
      return {
        ...prev,
        enabledDifficulties: has
          ? prev.enabledDifficulties.filter(d => d !== difficulty)
          : [...prev.enabledDifficulties, difficulty],
      };
    });
  }, []);

  const setQuizMode = useCallback((quizMode: QuizMode) => {
    setState(prev => {
      if (prev.phase !== 'lobby') return prev;
      return { ...prev, quizMode };
    });
  }, []);

  const startGame = useCallback(() => {
    const matching = countries.filter(
      c => state.enabledContinents.includes(c.continent) && state.enabledDifficulties.includes(c.difficulty)
    );
    if (matching.length === 0) return;

    const shuffled = shuffle(matching);
    const first = shuffled[0];

    setState(prev => ({
      ...prev,
      phase: 'playing',
      flags: shuffled,
      currentIndex: 0,
      currentCountry: first,
      options: generateOptions(first, countries),
      answeredCorrectly: null,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      difficultyStats: {
        1: { correct: 0, total: 0 },
        2: { correct: 0, total: 0 },
        3: { correct: 0, total: 0 },
        4: { correct: 0, total: 0 },
        5: { correct: 0, total: 0 },
      },
    }));
  }, [state.enabledContinents, state.enabledDifficulties]);

  const checkAnswer = useCallback((answer: Country | string): boolean => {
    const normalizeString = (s: string) => s.toLowerCase().trim();

    let isCorrect: boolean;
    let selectedCountry: Country | null = null;

    if (typeof answer === 'string') {
      const normalizedAnswer = normalizeString(answer);
      isCorrect =
        normalizeString(state.currentCountry!.name) === normalizedAnswer ||
        (state.currentCountry!.alternateNames?.some(
          alt => normalizeString(alt) === normalizedAnswer
        ) ?? false);

      selectedCountry = countries.find(c =>
        normalizeString(c.name) === normalizedAnswer ||
        c.alternateNames?.some(alt => normalizeString(alt) === normalizedAnswer)
      ) ?? null;
    } else {
      isCorrect = answer.code === state.currentCountry!.code;
      selectedCountry = answer;
    }

    setState(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const multiplier = isCorrect ? getStreakMultiplier(newStreak) : 1;
      const points = isCorrect ? Math.round(getBasePoints(prev.currentCountry!.difficulty) * multiplier) : 0;
      const diff = prev.currentCountry!.difficulty;

      return {
        ...prev,
        answeredCorrectly: isCorrect,
        selectedAnswer: selectedCountry,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        score: prev.score + points,
        difficultyStats: {
          ...prev.difficultyStats,
          [diff]: {
            correct: prev.difficultyStats[diff].correct + (isCorrect ? 1 : 0),
            total: prev.difficultyStats[diff].total + 1,
          },
        },
      };
    });

    return isCorrect;
  }, [state.currentCountry]);

  const nextFlag = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;

      if (nextIndex >= prev.flags.length) {
        // Game over — show summary
        return {
          ...prev,
          phase: 'summary',
          answeredCorrectly: null,
          selectedAnswer: null,
        };
      }

      const nextCountry = prev.flags[nextIndex];
      return {
        ...prev,
        currentIndex: nextIndex,
        currentCountry: nextCountry,
        options: generateOptions(nextCountry, countries),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'lobby',
      flags: [],
      currentIndex: 0,
      currentCountry: null,
      options: [],
      answeredCorrectly: null,
      selectedAnswer: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      difficultyStats: {
        1: { correct: 0, total: 0 },
        2: { correct: 0, total: 0 },
        3: { correct: 0, total: 0 },
        4: { correct: 0, total: 0 },
        5: { correct: 0, total: 0 },
      },
    }));
  }, []);

  const summary: ArcadeSummary | null = state.phase === 'summary' ? {
    totalScore: state.score,
    totalCorrect: Object.values(state.difficultyStats).reduce((sum, s) => sum + s.correct, 0),
    totalFlags: state.flags.length,
    accuracy: state.flags.length > 0
      ? Math.round((Object.values(state.difficultyStats).reduce((sum, s) => sum + s.correct, 0) / state.flags.length) * 100)
      : 0,
    bestStreak: state.bestStreak,
    difficultyBreakdown: state.difficultyStats,
  } : null;

  return {
    // Phase
    phase: state.phase,
    // Lobby state
    enabledContinents: state.enabledContinents,
    enabledDifficulties: state.enabledDifficulties,
    quizMode: state.quizMode,
    flagCount,
    // Playing state
    currentCountry: state.currentCountry,
    currentIndex: state.currentIndex,
    totalFlags: state.flags.length,
    options: state.options,
    answeredCorrectly: state.answeredCorrectly,
    selectedAnswer: state.selectedAnswer,
    score: state.score,
    streak: state.streak,
    bestStreak: state.bestStreak,
    currentMultiplier,
    // For type-ahead autocomplete
    availableCountries: filteredCountries,
    // Summary
    summary,
    // Actions
    toggleContinent,
    toggleDifficulty,
    setQuizMode,
    startGame,
    checkAnswer,
    nextFlag,
    reset,
  };
}

export { difficultyLabels };
