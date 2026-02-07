import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent, Difficulty } from '../data/countries';
import { shuffle, getRandomElements } from '../utils/shuffle';

export type QuizMode = 'multiple-choice' | 'type-ahead' | 'flag-picker';

export interface QuizState {
  currentCountry: Country;
  options: Country[];
  streak: number;
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
}

interface UseQuizOptions {
  enabledContinents: Continent[];
  enabledDifficulties: Difficulty[];
  mode: QuizMode;
}

export function useQuiz({ enabledContinents, enabledDifficulties, mode }: UseQuizOptions) {
  const availableCountries = useMemo(() => {
    return countries.filter(
      c => enabledContinents.includes(c.continent) && enabledDifficulties.includes(c.difficulty)
    );
  }, [enabledContinents, enabledDifficulties]);

  const getNewQuestion = useCallback((): Pick<QuizState, 'currentCountry' | 'options'> => {
    if (availableCountries.length === 0) {
      throw new Error('No countries available with current filters');
    }

    const currentCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];

    // For multiple choice, generate 3 wrong answers
    // Prefer countries from the same continent for harder questions
    const sameContinent = availableCountries.filter(
      c => c.code !== currentCountry.code && c.continent === currentCountry.continent
    );
    const otherCountries = availableCountries.filter(
      c => c.code !== currentCountry.code
    );

    let wrongAnswers: Country[];
    if (sameContinent.length >= 3) {
      wrongAnswers = getRandomElements(sameContinent, 3);
    } else {
      wrongAnswers = getRandomElements(otherCountries, 3);
    }

    const options = shuffle([currentCountry, ...wrongAnswers]);

    return { currentCountry, options };
  }, [availableCountries]);

  const [state, setState] = useState<QuizState>(() => ({
    ...getNewQuestion(),
    streak: 0,
    answeredCorrectly: null,
    selectedAnswer: null,
  }));

  const checkAnswer = useCallback((answer: Country | string): boolean => {
    const normalizeString = (s: string) => s.toLowerCase().trim();

    let isCorrect: boolean;
    let selectedCountry: Country | null = null;

    if (typeof answer === 'string') {
      // Type-ahead mode: check against name and alternate names
      const normalizedAnswer = normalizeString(answer);
      isCorrect =
        normalizeString(state.currentCountry.name) === normalizedAnswer ||
        (state.currentCountry.alternateNames?.some(
          alt => normalizeString(alt) === normalizedAnswer
        ) ?? false);

      // Find the matching country for display purposes
      selectedCountry = countries.find(c =>
        normalizeString(c.name) === normalizedAnswer ||
        c.alternateNames?.some(alt => normalizeString(alt) === normalizedAnswer)
      ) ?? null;
    } else {
      // Multiple choice mode
      isCorrect = answer.code === state.currentCountry.code;
      selectedCountry = answer;
    }

    setState(prev => ({
      ...prev,
      streak: isCorrect ? prev.streak + 1 : 0,
      answeredCorrectly: isCorrect,
      selectedAnswer: selectedCountry,
    }));

    return isCorrect;
  }, [state.currentCountry]);

  const nextQuestion = useCallback(() => {
    setState(prev => ({
      ...getNewQuestion(),
      streak: prev.streak,
      answeredCorrectly: null,
      selectedAnswer: null,
    }));
  }, [getNewQuestion]);

  const resetStreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      streak: 0,
    }));
  }, []);

  return {
    ...state,
    availableCountries,
    checkAnswer,
    nextQuestion,
    resetStreak,
    mode,
  };
}
