import { useState, useCallback } from 'react';
import { countries, Country } from '../data/countries';
import { JourneyLevel } from '../data/journeyLevels';
import { shuffle, getRandomElements } from '../utils/shuffle';
import { QuizMode } from './useQuiz';

const ALTERNATING_MODES: QuizMode[] = ['multiple-choice', 'flag-picker'];

function modeForIndex(index: number): QuizMode {
  return ALTERNATING_MODES[index % ALTERNATING_MODES.length];
}

export interface JourneyGameState {
  level: JourneyLevel | null;
  flagCountries: Country[];
  currentIndex: number;
  currentCountry: Country | null;
  currentQuizMode: QuizMode;
  options: Country[];
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
  correctCount: number;
  isComplete: boolean;
}

function generateOptions(current: Country, allCountries: Country[]): Country[] {
  // Prefer wrong answers from same continent
  const sameContinent = allCountries.filter(
    c => c.code !== current.code && c.continent === current.continent
  );
  const others = allCountries.filter(
    c => c.code !== current.code && c.continent !== current.continent
  );

  let wrongAnswers: Country[];
  if (sameContinent.length >= 3) {
    wrongAnswers = getRandomElements(sameContinent, 3);
  } else {
    wrongAnswers = [
      ...getRandomElements(sameContinent, sameContinent.length),
      ...getRandomElements(others, 3 - sameContinent.length),
    ];
  }

  return shuffle([current, ...wrongAnswers]);
}

export function useJourneyGame() {
  const [state, setState] = useState<JourneyGameState>({
    level: null,
    flagCountries: [],
    currentIndex: 0,
    currentCountry: null,
    currentQuizMode: 'multiple-choice',
    options: [],
    answeredCorrectly: null,
    selectedAnswer: null,
    correctCount: 0,
    isComplete: false,
  });

  const startLevel = useCallback((level: JourneyLevel) => {
    const levelCountries = level.countryCodes
      .map(code => countries.find(c => c.code === code))
      .filter((c): c is Country => c !== undefined);
    const shuffled = shuffle(levelCountries);
    const first = shuffled[0];

    setState({
      level,
      flagCountries: shuffled,
      currentIndex: 0,
      currentCountry: first,
      currentQuizMode: modeForIndex(0),
      options: first ? generateOptions(first, countries) : [],
      answeredCorrectly: null,
      selectedAnswer: null,
      correctCount: 0,
      isComplete: false,
    });
  }, []);

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
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
    }));

    return isCorrect;
  }, [state.currentCountry]);

  const nextFlag = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;

      if (nextIndex >= prev.flagCountries.length) {
        return { ...prev, isComplete: true, answeredCorrectly: null, selectedAnswer: null };
      }

      const next = prev.flagCountries[nextIndex];
      return {
        ...prev,
        currentIndex: nextIndex,
        currentCountry: next,
        currentQuizMode: modeForIndex(nextIndex),
        options: generateOptions(next, countries),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  return {
    ...state,
    totalFlags: state.flagCountries.length,
    startLevel,
    checkAnswer,
    nextFlag,
    availableCountries: countries,
  };
}
