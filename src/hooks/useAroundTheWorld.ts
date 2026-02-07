import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent } from '../data/countries';
import { shuffle, getRandomElements } from '../utils/shuffle';

// Countries too small to see on the world map
const excludedCountryCodes = new Set([
  // Microstates (basically invisible)
  'VA', 'MC', 'SM', 'LI', 'AD',
  // Tiny Islands - Caribbean
  'KN', 'AG', 'BB', 'DM', 'GD', 'LC', 'VC',
  // Tiny Islands - Pacific
  'PW', 'NR', 'TV', 'MH', 'FM', 'KI', 'WS', 'TO',
  // Tiny Islands - Indian Ocean/Africa
  'MV', 'SC', 'KM', 'MU', 'CV', 'ST',
]);

// Filtered countries for Around the World mode
const mapCountries = countries.filter(c => !excludedCountryCodes.has(c.code));

export interface ContinentStats {
  correct: number;
  total: number;
}

export interface AroundTheWorldState {
  currentCountry: Country;
  options: Country[];
  answeredCountries: Map<string, boolean>; // code -> correct/wrong
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
  continentStats: Record<Continent, ContinentStats>;
}

const initialContinentStats: Record<Continent, ContinentStats> = {
  'Africa': { correct: 0, total: 0 },
  'Asia': { correct: 0, total: 0 },
  'Europe': { correct: 0, total: 0 },
  'North America': { correct: 0, total: 0 },
  'South America': { correct: 0, total: 0 },
  'Oceania': { correct: 0, total: 0 },
};

function generateOptions(currentCountry: Country): Country[] {
  const others = mapCountries.filter(c => c.code !== currentCountry.code);
  const wrongAnswers = getRandomElements(others, 3);
  return shuffle([currentCountry, ...wrongAnswers]);
}

function getNextCountry(answeredCountries: Map<string, boolean>): Country {
  // Get countries that haven't been answered yet
  const unanswered = mapCountries.filter(c => !answeredCountries.has(c.code));

  if (unanswered.length > 0) {
    // Pick a random unanswered country
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  }

  // All countries answered, pick any random one (endless mode)
  return mapCountries[Math.floor(Math.random() * mapCountries.length)];
}

export function useAroundTheWorld() {
  const [state, setState] = useState<AroundTheWorldState>(() => {
    const currentCountry = mapCountries[Math.floor(Math.random() * mapCountries.length)];
    return {
      currentCountry,
      options: generateOptions(currentCountry),
      answeredCountries: new Map(),
      answeredCorrectly: null,
      selectedAnswer: null,
      continentStats: { ...initialContinentStats },
    };
  });

  const totalAnswered = state.answeredCountries.size;
  const totalCorrect = useMemo(() => {
    let count = 0;
    state.answeredCountries.forEach(correct => {
      if (correct) count++;
    });
    return count;
  }, [state.answeredCountries]);

  const checkAnswer = useCallback((answer: Country): boolean => {
    const isCorrect = answer.code === state.currentCountry.code;

    setState(prev => {
      const newAnsweredCountries = new Map(prev.answeredCountries);
      // Only record first attempt for each country
      if (!newAnsweredCountries.has(prev.currentCountry.code)) {
        newAnsweredCountries.set(prev.currentCountry.code, isCorrect);
      }

      const newContinentStats = { ...prev.continentStats };
      // Only update stats on first attempt
      if (!prev.answeredCountries.has(prev.currentCountry.code)) {
        newContinentStats[prev.currentCountry.continent] = {
          correct: newContinentStats[prev.currentCountry.continent].correct + (isCorrect ? 1 : 0),
          total: newContinentStats[prev.currentCountry.continent].total + 1,
        };
      }

      return {
        ...prev,
        answeredCorrectly: isCorrect,
        selectedAnswer: answer,
        answeredCountries: newAnsweredCountries,
        continentStats: newContinentStats,
      };
    });

    return isCorrect;
  }, [state.currentCountry]);

  const nextCountry = useCallback(() => {
    setState(prev => {
      const next = getNextCountry(prev.answeredCountries);
      return {
        ...prev,
        currentCountry: next,
        options: generateOptions(next),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    const currentCountry = mapCountries[Math.floor(Math.random() * mapCountries.length)];
    setState({
      currentCountry,
      options: generateOptions(currentCountry),
      answeredCountries: new Map(),
      answeredCorrectly: null,
      selectedAnswer: null,
      continentStats: { ...initialContinentStats },
    });
  }, []);

  return {
    ...state,
    totalAnswered,
    totalCorrect,
    totalCountries: mapCountries.length,
    checkAnswer,
    nextCountry,
    reset,
  };
}
