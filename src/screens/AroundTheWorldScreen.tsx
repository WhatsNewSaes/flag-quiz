import { useState, useCallback } from 'react';
import { Celebration } from '../components/Celebration';
import { WorldMap } from '../components/WorldMap';
import { MapMultipleChoice } from '../components/MapMultipleChoice';
import { AroundTheWorldSummary } from '../components/AroundTheWorldSummary';
import { useAroundTheWorld } from '../hooks/useAroundTheWorld';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';

export function AroundTheWorldScreen() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const aroundTheWorld = useAroundTheWorld();

  const handleAnswer = useCallback((answer: typeof aroundTheWorld.options[0]) => {
    const isCorrect = aroundTheWorld.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        aroundTheWorld.nextCountry();
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        aroundTheWorld.nextCountry();
      }, 2000);
    }
  }, [aroundTheWorld]);

  const handleReset = useCallback(() => {
    aroundTheWorld.reset();
  }, [aroundTheWorld]);

  const isAnswered = aroundTheWorld.answeredCorrectly !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-retro text-retro-gold">
            Around the World
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {aroundTheWorld.totalCorrect}/{aroundTheWorld.totalAnswered} correct
            </span>
            <button
              onClick={() => setShowSummary(true)}
              className="px-3 py-1.5 text-sm text-retro-text-secondary hover:text-retro-text bg-retro-surface border border-retro-border/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>📊</span> Stats
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-retro-text-secondary hover:text-retro-text bg-retro-surface border border-retro-border/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>↺</span> Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:flex-1">
            <WorldMap
              highlightedCountry={aroundTheWorld.currentCountry.code}
              answeredCountries={aroundTheWorld.answeredCountries}
            />
          </div>
          <div className="lg:w-72 flex flex-col">
            <div className="text-center lg:text-left mb-4">
              <p className="text-lg text-gray-600">
                Which country is highlighted?
              </p>
            </div>
            <div className="flex-1">
              <MapMultipleChoice
                options={aroundTheWorld.options}
                correctCountry={aroundTheWorld.currentCountry}
                selectedAnswer={aroundTheWorld.selectedAnswer}
                answeredCorrectly={aroundTheWorld.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            </div>
            <div className="mt-4 text-center lg:text-left text-sm text-gray-500">
              {aroundTheWorld.totalAnswered} of {aroundTheWorld.totalCountries} countries explored
            </div>
          </div>
        </div>
      </div>

      <Celebration streak={1} show={showCelebration} />

      {showSummary && (
        <AroundTheWorldSummary
          continentStats={aroundTheWorld.continentStats}
          totalCorrect={aroundTheWorld.totalCorrect}
          totalAnswered={aroundTheWorld.totalAnswered}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
