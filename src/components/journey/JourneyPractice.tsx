import { useState, useCallback, useMemo } from 'react';
import { JourneyLevel } from '../../data/journeyLevels';
import { countries, Country } from '../../data/countries';
import { shuffle } from '../../utils/shuffle';
import { getFlagEmoji } from '../../utils/flagEmoji';

interface JourneyPracticeProps {
  level: JourneyLevel;
  onBack: () => void;
}

export function JourneyPractice({ level, onBack }: JourneyPracticeProps) {
  const levelCountries = useMemo(() => {
    const list = level.countryCodes
      .map(code => countries.find(c => c.code === code))
      .filter((c): c is Country => c !== undefined);
    return shuffle(list);
  }, [level]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffledCountries, setShuffledCountries] = useState(levelCountries);
  const [mode, setMode] = useState<'flag-to-name' | 'name-to-flag'>('flag-to-name');

  const currentCountry = shuffledCountries[currentIndex] || null;

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= shuffledCountries.length) {
      setShuffledCountries(shuffle([...levelCountries]));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIndex);
    }
    setRevealed(false);
  }, [currentIndex, shuffledCountries.length, levelCountries]);

  const handleToggleMode = useCallback(() => {
    setMode(prev => prev === 'flag-to-name' ? 'name-to-flag' : 'flag-to-name');
    setShuffledCountries(shuffle([...levelCountries]));
    setCurrentIndex(0);
    setRevealed(false);
  }, [levelCountries]);

  if (!currentCountry) return null;

  return (
    <div className="min-h-screen bg-retro-bg py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="retro-btn px-3 py-2 text-xs font-retro bg-retro-surface text-retro-text-secondary"
          >
            ← Back
          </button>
          <span className="font-retro text-xs text-retro-gold">
            Practice
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleToggleMode}
            className="retro-btn px-4 py-2 text-xs font-retro bg-retro-accent text-retro-text"
          >
            {mode === 'flag-to-name' ? 'Flag → Name' : 'Name → Flag'}
          </button>
        </div>

        {/* Progress */}
        <div className="text-center text-xs text-retro-text-secondary mb-6">
          {currentIndex + 1} of {shuffledCountries.length}
        </div>

        {/* Card */}
        <div className="pixel-border bg-retro-surface rounded-lg p-8 text-center">
          {mode === 'flag-to-name' ? (
            <>
              <div className="text-[100px] sm:text-[140px] leading-none mb-4">
                {getFlagEmoji(currentCountry.code)}
              </div>
              <div className="h-[50px] flex items-center justify-center">
                {revealed ? (
                  <h2 className="text-2xl font-bold text-retro-text animate-bounce-in">
                    {currentCountry.name}
                  </h2>
                ) : (
                  <div className="text-2xl text-gray-600">???</div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-retro-text mb-6">
                {currentCountry.name}
              </h2>
              <div className="text-[100px] sm:text-[140px] leading-none">
                {revealed ? (
                  <span className="animate-bounce-in inline-block">
                    {getFlagEmoji(currentCountry.code)}
                  </span>
                ) : (
                  <span className="text-gray-600">🏳️</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        <div className="mt-6 flex justify-center">
          {!revealed ? (
            <button
              onClick={handleReveal}
              className="retro-btn px-8 py-4 font-retro text-sm bg-retro-neon-green text-white"
            >
              Reveal
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="retro-btn px-8 py-4 font-retro text-sm bg-retro-neon-blue text-white"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
