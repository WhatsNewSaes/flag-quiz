import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Difficulty, difficultyLabels } from '../data/countries';
import { shuffle, getRandomElements } from '../utils/shuffle';
import { QuizMode } from './useQuiz';

export interface LevelScore {
  correct: number;
  total: number;
}

export interface CampaignState {
  currentLevel: Difficulty;
  levelScores: Record<Difficulty, LevelScore>;
  currentFlagIndex: number;
  remainingFlags: Country[];
  currentCountry: Country | null;
  options: Country[];
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
  showLevelSummary: boolean;
  showFinalSummary: boolean;
  quizType: QuizMode;
}

const initialLevelScores: Record<Difficulty, LevelScore> = {
  1: { correct: 0, total: 0 },
  2: { correct: 0, total: 0 },
  3: { correct: 0, total: 0 },
  4: { correct: 0, total: 0 },
  5: { correct: 0, total: 0 },
};

function getCountriesForLevel(level: Difficulty): Country[] {
  return shuffle(countries.filter(c => c.difficulty === level));
}

function generateOptions(currentCountry: Country, allCountries: Country[]): Country[] {
  const others = allCountries.filter(c => c.code !== currentCountry.code);
  const wrongAnswers = getRandomElements(others, 3);
  return shuffle([currentCountry, ...wrongAnswers]);
}

export function useCampaign(initialQuizType: QuizMode = 'multiple-choice') {
  const [state, setState] = useState<CampaignState>(() => {
    const flags = getCountriesForLevel(1);
    const currentCountry = flags[0];
    return {
      currentLevel: 1,
      levelScores: { ...initialLevelScores },
      currentFlagIndex: 0,
      remainingFlags: flags,
      currentCountry,
      options: generateOptions(currentCountry, countries),
      answeredCorrectly: null,
      selectedAnswer: null,
      showLevelSummary: false,
      showFinalSummary: false,
      quizType: initialQuizType,
    };
  });

  const totalFlagsInLevel = useMemo(() => {
    return countries.filter(c => c.difficulty === state.currentLevel).length;
  }, [state.currentLevel]);

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

    setState(prev => ({
      ...prev,
      answeredCorrectly: isCorrect,
      selectedAnswer: selectedCountry,
      levelScores: {
        ...prev.levelScores,
        [prev.currentLevel]: {
          correct: prev.levelScores[prev.currentLevel].correct + (isCorrect ? 1 : 0),
          total: prev.levelScores[prev.currentLevel].total + 1,
        },
      },
    }));

    return isCorrect;
  }, [state.currentCountry]);

  const nextFlag = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentFlagIndex + 1;

      // Check if level is complete
      if (nextIndex >= prev.remainingFlags.length) {
        // Check if this was the final level
        if (prev.currentLevel === 5) {
          return {
            ...prev,
            showFinalSummary: true,
            answeredCorrectly: null,
            selectedAnswer: null,
          };
        }
        // Show level summary before moving to next level
        return {
          ...prev,
          showLevelSummary: true,
          answeredCorrectly: null,
          selectedAnswer: null,
        };
      }

      // Move to next flag in current level
      const nextCountry = prev.remainingFlags[nextIndex];
      return {
        ...prev,
        currentFlagIndex: nextIndex,
        currentCountry: nextCountry,
        options: generateOptions(nextCountry, countries),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const startNextLevel = useCallback(() => {
    setState(prev => {
      const nextLevel = (prev.currentLevel + 1) as Difficulty;
      const flags = getCountriesForLevel(nextLevel);
      const currentCountry = flags[0];

      return {
        ...prev,
        currentLevel: nextLevel,
        currentFlagIndex: 0,
        remainingFlags: flags,
        currentCountry,
        options: generateOptions(currentCountry, countries),
        showLevelSummary: false,
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const resetCampaign = useCallback((quizType?: QuizMode) => {
    const flags = getCountriesForLevel(1);
    const currentCountry = flags[0];

    setState({
      currentLevel: 1,
      levelScores: { ...initialLevelScores },
      currentFlagIndex: 0,
      remainingFlags: flags,
      currentCountry,
      options: generateOptions(currentCountry, countries),
      answeredCorrectly: null,
      selectedAnswer: null,
      showLevelSummary: false,
      showFinalSummary: false,
      quizType: quizType ?? state.quizType,
    });
  }, [state.quizType]);

  const setQuizType = useCallback((quizType: QuizMode) => {
    setState(prev => ({ ...prev, quizType }));
  }, []);

  return {
    ...state,
    totalFlagsInLevel,
    checkAnswer,
    nextFlag,
    startNextLevel,
    resetCampaign,
    setQuizType,
    availableCountries: countries, // For type-ahead autocomplete
  };
}

export { difficultyLabels };
