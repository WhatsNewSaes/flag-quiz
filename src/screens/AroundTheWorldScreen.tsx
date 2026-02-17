import { useState, useCallback } from 'react';
import { Celebration } from '../components/Celebration';
import { WorldMap } from '../components/WorldMap';
import { MapMultipleChoice } from '../components/MapMultipleChoice';
import { ContinentFilter } from '../components/ContinentFilter';
import { useAroundTheWorld } from '../hooks/useAroundTheWorld';
import { Difficulty, difficultyLabels } from '../data/countries';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';

interface AroundTheWorldScreenProps {
  onBack?: () => void;
}

export function AroundTheWorldScreen({ onBack }: AroundTheWorldScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const atw = useAroundTheWorld();
  const emptyMap = useState(() => new Map<string, boolean>())[0];

  const handleAnswer = useCallback((answer: typeof atw.options[0]) => {
    const isCorrect = atw.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        atw.nextCountry();
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        atw.nextCountry();
      }, 2000);
    }
  }, [atw]);

  // --- LOBBY PHASE ---
  if (atw.phase === 'lobby') {
    return (
      <div className="bg-retro-bg flex flex-col px-4 pb-4 pt-3" style={{ minHeight: 'calc(100dvh - 52px)' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="self-start font-body text-sm text-retro-text-secondary hover:text-retro-text transition-colors flex items-center gap-1 mb-2"
          >
            <span>&#8592;</span> Back
          </button>
        )}
        <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Preview map */}
          <div className="mb-4 rounded-xl overflow-hidden pointer-events-none opacity-90">
            <WorldMap
              highlightedCountry="BR"
              answeredCountries={emptyMap}
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-retro text-lg text-retro-text mb-2">Around the World</h1>
            <p className="font-body text-sm text-retro-text-secondary">
              Identify highlighted countries on a world map. Fill in the globe!
            </p>
          </div>

          {/* Country count */}
          <div className="text-center mb-6">
            <div className="inline-block pixel-border bg-retro-surface rounded-lg px-6 py-3">
              <span className="font-retro text-sm text-retro-gold">{atw.totalCountries}</span>
              <span className="font-body text-sm text-retro-text ml-2">countries ready!</span>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={atw.startGame}
            disabled={atw.totalCountries === 0}
            className="retro-btn w-full px-4 py-4 font-retro text-sm bg-retro-neon-green text-white mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play
          </button>

          {/* Options toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text mb-4"
          >
            {showOptions ? 'Hide Game Options' : 'Game Options'}
          </button>

          {/* Collapsible options */}
          {showOptions && (
            <div className="space-y-4">
              <p className="font-body text-xs text-retro-text-secondary">
                Tiny island nations hidden — too small to see on the map
              </p>
              {/* Difficulty filter */}
              <div>
                <h3 className="font-retro text-[0.6rem] text-retro-text-secondary mb-2">Difficulty</h3>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as Difficulty[]).map(level => {
                    const isEnabled = atw.enabledDifficulties.includes(level);
                    return (
                      <button
                        key={level}
                        onClick={() => atw.toggleDifficulty(level)}
                        className={`flex-1 rounded-full py-1.5 px-1 text-center transition-all ${
                          isEnabled
                            ? 'bg-retro-accent text-retro-text ring-2 ring-retro-gold'
                            : 'bg-white text-retro-text-secondary ring-1 ring-retro-border/20 hover:ring-retro-border/40'
                        }`}
                      >
                        <div className="text-xs font-medium truncate">
                          {difficultyLabels[level]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Continent filter */}
              <ContinentFilter
                enabledContinents={atw.enabledContinents}
                onToggle={atw.toggleContinent}
              />
            </div>
          )}

        </div>
        </div>
      </div>
    );
  }

  // --- PLAYING PHASE ---
  const isAnswered = atw.answeredCorrectly !== null;
  const focusContinent = atw.enabledContinents.length === 1
    ? atw.enabledContinents[0]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-2 sm:py-4 sm:px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-2 sm:px-0 w-full">
        <button
          onClick={atw.backToLobby}
          className="font-body text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 mb-2 px-2 sm:px-0"
        >
          <span>&#8592;</span> Back
        </button>
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
          <div className="lg:flex-1 max-h-[40vh] sm:max-h-none overflow-hidden sm:rounded-xl">
            <WorldMap
              highlightedCountry={atw.currentCountry.code}
              answeredCountries={atw.answeredCountries}
              focusContinent={focusContinent}
            />
          </div>
          <div className="lg:w-72 flex flex-col min-w-0 px-2 sm:px-0">
            <div className="text-center lg:text-left mb-2 sm:mb-4">
              <p className="text-base sm:text-lg text-gray-700">
                Which country is highlighted?
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <MapMultipleChoice
                options={atw.options}
                correctCountry={atw.currentCountry}
                selectedAnswer={atw.selectedAnswer}
                answeredCorrectly={atw.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            </div>
            <div className="mt-2 sm:mt-4 text-center lg:text-left text-xs sm:text-sm text-gray-700">
              {atw.totalCorrect}/{atw.totalAnswered} correct · {atw.totalAnswered} of {atw.totalCountries} explored
            </div>
          </div>
        </div>
      </div>

      <Celebration streak={1} show={showCelebration} />
    </div>
  );
}
