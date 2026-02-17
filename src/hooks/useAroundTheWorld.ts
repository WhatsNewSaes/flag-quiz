import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent, continents, Difficulty } from '../data/countries';
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
const allMapCountries = countries.filter(c => !excludedCountryCodes.has(c.code));

export type ATWPhase = 'lobby' | 'playing';

export interface ContinentStats {
  correct: number;
  total: number;
}

export interface AroundTheWorldState {
  phase: ATWPhase;
  currentCountry: Country;
  options: Country[];
  answeredCountries: Map<string, boolean>;
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

function generateOptions(currentCountry: Country, pool: Country[]): Country[] {
  const others = pool.filter(c => c.code !== currentCountry.code);
  const wrongAnswers = getRandomElements(others.length >= 3 ? others : allMapCountries.filter(c => c.code !== currentCountry.code), 3);
  return shuffle([currentCountry, ...wrongAnswers]);
}

function getNextCountry(answeredCountries: Map<string, boolean>, pool: Country[]): Country {
  const unanswered = pool.filter(c => !answeredCountries.has(c.code));

  if (unanswered.length > 0) {
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

const placeholder = allMapCountries[0];

export function useAroundTheWorld() {
  const [enabledContinents, setEnabledContinents] = useState<Continent[]>([...continents]);
  const [enabledDifficulties, setEnabledDifficulties] = useState<Difficulty[]>([1, 2, 3, 4, 5]);

  const mapCountries = useMemo(() => {
    return allMapCountries.filter(
      c => enabledContinents.includes(c.continent) && enabledDifficulties.includes(c.difficulty)
    );
  }, [enabledContinents, enabledDifficulties]);

  const [state, setState] = useState<AroundTheWorldState>({
    phase: 'lobby',
    currentCountry: placeholder,
    options: [],
    answeredCountries: new Map(),
    answeredCorrectly: null,
    selectedAnswer: null,
    continentStats: { ...initialContinentStats },
  });

  const totalAnswered = useMemo(() => {
    let count = 0;
    state.answeredCountries.forEach((_, code) => {
      if (mapCountries.some(c => c.code === code)) count++;
    });
    return count;
  }, [state.answeredCountries, mapCountries]);

  const totalCorrect = useMemo(() => {
    let count = 0;
    state.answeredCountries.forEach((correct, code) => {
      if (correct && mapCountries.some(c => c.code === code)) count++;
    });
    return count;
  }, [state.answeredCountries, mapCountries]);

  const toggleContinent = useCallback((continent: Continent) => {
    setEnabledContinents(prev => {
      const has = prev.includes(continent);
      if (has && prev.length === 1) return prev;
      return has ? prev.filter(c => c !== continent) : [...prev, continent];
    });
  }, []);

  const toggleDifficulty = useCallback((difficulty: Difficulty) => {
    setEnabledDifficulties(prev => {
      const has = prev.includes(difficulty);
      if (has && prev.length === 1) return prev;
      return has ? prev.filter(d => d !== difficulty) : [...prev, difficulty];
    });
  }, []);

  const startGame = useCallback(() => {
    if (mapCountries.length === 0) return;
    const first = mapCountries[Math.floor(Math.random() * mapCountries.length)];
    setState({
      phase: 'playing',
      currentCountry: first,
      options: generateOptions(first, mapCountries),
      answeredCountries: new Map(),
      answeredCorrectly: null,
      selectedAnswer: null,
      continentStats: { ...initialContinentStats },
    });
  }, [mapCountries]);

  const backToLobby = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'lobby',
    }));
  }, []);

  const checkAnswer = useCallback((answer: Country): boolean => {
    const isCorrect = answer.code === state.currentCountry.code;

    setState(prev => {
      const newAnsweredCountries = new Map(prev.answeredCountries);
      if (!newAnsweredCountries.has(prev.currentCountry.code)) {
        newAnsweredCountries.set(prev.currentCountry.code, isCorrect);
      }

      const newContinentStats = { ...prev.continentStats };
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
      const next = getNextCountry(prev.answeredCountries, mapCountries);
      return {
        ...prev,
        currentCountry: next,
        options: generateOptions(next, mapCountries),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, [mapCountries]);

  return {
    phase: state.phase,
    currentCountry: state.currentCountry,
    options: state.options,
    answeredCountries: state.answeredCountries,
    answeredCorrectly: state.answeredCorrectly,
    selectedAnswer: state.selectedAnswer,
    continentStats: state.continentStats,
    totalAnswered,
    totalCorrect,
    totalCountries: mapCountries.length,
    enabledContinents,
    enabledDifficulties,
    toggleContinent,
    toggleDifficulty,
    startGame,
    backToLobby,
    checkAnswer,
    nextCountry,
  };
}
