import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent, Difficulty } from '../data/countries';
import { shuffle } from '../utils/shuffle';

export type PresentationType = 'flag-to-name' | 'name-to-flag';

export interface PresentationState {
  currentIndex: number;
  shuffledCountries: Country[];
  revealed: boolean;
  presentationType: PresentationType;
}

interface UsePresentationOptions {
  enabledContinents: Continent[];
  enabledDifficulties: Difficulty[];
}

export function usePresentation({ enabledContinents, enabledDifficulties }: UsePresentationOptions) {
  const availableCountries = useMemo(() => {
    return countries.filter(
      c => enabledContinents.includes(c.continent) && enabledDifficulties.includes(c.difficulty)
    );
  }, [enabledContinents, enabledDifficulties]);

  const [state, setState] = useState<PresentationState>(() => ({
    currentIndex: 0,
    shuffledCountries: shuffle([...availableCountries]),
    revealed: false,
    presentationType: 'flag-to-name',
  }));

  const currentCountry = state.shuffledCountries[state.currentIndex] || null;
  const totalCount = state.shuffledCountries.length;

  const reveal = useCallback(() => {
    setState(prev => ({ ...prev, revealed: true }));
  }, []);

  const next = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;
      // If we've gone through all, reshuffle and start over
      if (nextIndex >= prev.shuffledCountries.length) {
        return {
          ...prev,
          currentIndex: 0,
          shuffledCountries: shuffle([...availableCountries]),
          revealed: false,
        };
      }
      return {
        ...prev,
        currentIndex: nextIndex,
        revealed: false,
      };
    });
  }, [availableCountries]);

  const setPresentationType = useCallback((type: PresentationType) => {
    setState(prev => ({
      ...prev,
      presentationType: type,
      currentIndex: 0,
      shuffledCountries: shuffle([...availableCountries]),
      revealed: false,
    }));
  }, [availableCountries]);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: 0,
      shuffledCountries: shuffle([...availableCountries]),
      revealed: false,
    }));
  }, [availableCountries]);

  return {
    currentCountry,
    currentIndex: state.currentIndex,
    totalCount,
    revealed: state.revealed,
    presentationType: state.presentationType,
    reveal,
    next,
    setPresentationType,
    reset,
  };
}
