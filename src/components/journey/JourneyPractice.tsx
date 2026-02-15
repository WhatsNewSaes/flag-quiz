import { useState, useCallback, useMemo } from 'react';
import { JourneyLevel } from '../../data/journeyLevels';
import { countries, Country } from '../../data/countries';
import { shuffle } from '../../utils/shuffle';
import { getFlagEmoji } from '../../utils/flagEmoji';

interface JourneyPracticeProps {
  level: JourneyLevel;
  onBack: () => void;
  onRetry: () => void;
}

export function JourneyPractice({ level, onBack, onRetry }: JourneyPracticeProps) {
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

  const levelNumber = `W${level.regionIndex + 1}-L${level.levelIndexInRegion + 1}`;

  if (!currentCountry) return null;

  return (
    <div className="min-h-screen bg-retro-bg py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onBack} className="font-retro text-xs text-retro-text hover:text-retro-text-secondary transition-colors">
            ← Practice {levelNumber}
          </button>
          <button
            onClick={onRetry}
            className="retro-btn px-3 py-1.5 text-[0.6rem] font-retro bg-retro-neon-blue text-white"
          >
            Retry {levelNumber}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center mb-4">
          <div
            className="inline-flex rounded-lg overflow-hidden border-2 border-retro-border"
            style={{ boxShadow: '2px 2px 0px 0px #2D2D2D' }}
          >
            <button
              onClick={mode === 'name-to-flag' ? handleToggleMode : undefined}
              className={`px-4 py-2 text-[0.6rem] font-retro transition-colors ${
                mode === 'flag-to-name'
                  ? 'bg-retro-text text-white'
                  : 'bg-retro-surface text-retro-text-secondary hover:bg-gray-100'
              }`}
            >
              Flag → Name
            </button>
            <button
              onClick={mode === 'flag-to-name' ? handleToggleMode : undefined}
              className={`px-4 py-2 text-[0.6rem] font-retro transition-colors border-l-2 border-retro-border ${
                mode === 'name-to-flag'
                  ? 'bg-retro-text text-white'
                  : 'bg-retro-surface text-retro-text-secondary hover:bg-gray-100'
              }`}
            >
              Name → Flag
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center text-xs text-retro-text-secondary mb-4">
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
                  <span className="text-gray-600">{'\u{1F3F3}\u{FE0F}'}</span>
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
