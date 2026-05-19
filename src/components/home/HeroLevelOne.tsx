import { useEffect, useRef, useState } from 'react';
import { useJourneyGame } from '../../hooks/useJourneyGame';
import { buildJourneyRegions, getAllLevels } from '../../data/journeyLevels';
import { FlagDisplay } from '../FlagDisplay';
import { MultipleChoice } from '../MultipleChoice';
import { FlagPicker } from '../FlagPicker';
import { Celebration } from '../Celebration';
import { Country } from '../../data/countries';
import { playCorrectSound, playIncorrectSound } from '../../utils/sounds';

const LEVEL_ONE = getAllLevels(buildJourneyRegions())[0];

interface HeroLevelOneProps {
  onComplete: (result: { correct: number; total: number }) => void;
}

export function HeroLevelOne({ onComplete }: HeroLevelOneProps) {
  const game = useJourneyGame();
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const [pulse, setPulse] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    game.startLevel(LEVEL_ONE);
  }, [game]);

  useEffect(() => {
    if (game.isComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete({ correct: game.correctCount, total: game.totalFlags });
    }
  }, [game.isComplete, game.correctCount, game.totalFlags, onComplete]);

  const handleAnswer = (answer: Country | string) => {
    if (game.answeredCorrectly !== null) return;
    const isCorrect = game.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setStreak((s) => s + 1);
      setShowCelebration(true);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      setTimeout(() => setShowCelebration(false), 1400);
      setTimeout(() => game.nextFlag(), 1500);
    } else {
      playIncorrectSound();
      setStreak(0);
      setTimeout(() => game.nextFlag(), 1300);
    }
  };

  if (!game.currentCountry || !game.level) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="font-retro text-xs text-retro-text animate-blink-arcade">LOADING...</p>
      </div>
    );
  }

  const isAnswered = game.answeredCorrectly !== null;
  const progressPct = game.totalFlags > 0 ? (game.currentIndex / game.totalFlags) * 100 : 0;

  return (
    <section className="relative bg-retro-bg border-b-2 border-retro-border min-h-[80vh] flex items-center">
      <div className="w-full max-w-2xl mx-auto px-4 py-5 sm:py-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-retro text-[10px] sm:text-xs text-retro-text-secondary uppercase tracking-wider">
              Play Now
            </span>
            <span className="font-retro text-[10px] px-2 py-0.5 rounded-full bg-retro-neon-green text-white">
              World 1 · Level 1
            </span>
          </div>
          <span
            className={`font-retro text-xs sm:text-sm text-retro-text bg-retro-surface px-2.5 py-1 rounded border-2 border-retro-border shadow-pixel-sm transition-transform ${
              pulse ? 'scale-110' : ''
            }`}
          >
            {game.correctCount}/{game.currentIndex + (isAnswered ? 1 : 0)}
          </span>
        </div>

        <div
          className="w-full h-3 sm:h-4 bg-retro-surface rounded-md mb-4 overflow-hidden"
          style={{ border: '3px solid #2D2D2D', boxShadow: '3px 3px 0px 0px #2D2D2D' }}
        >
          <div
            className="h-full bg-retro-neon-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <main>
          {game.currentQuizMode === 'flag-picker' ? (
            <div className="flex flex-col items-center justify-center min-h-[140px] sm:min-h-[180px] mb-3">
              <h2
                key={game.currentCountry.code}
                className="text-2xl sm:text-3xl md:text-4xl font-retro text-retro-text animate-bounce-in text-center"
              >
                {game.currentCountry.name}
              </h2>
            </div>
          ) : (
            <div className="scale-90 sm:scale-100 origin-top">
              <FlagDisplay
                countryCode={game.currentCountry.code}
                animationKey={game.currentCountry.code}
                difficulty={game.currentCountry.difficulty}
                showDifficulty={false}
              />
            </div>
          )}

          <div className="mt-3 sm:mt-4">
            {game.currentQuizMode === 'multiple-choice' && (
              <MultipleChoice
                options={game.options}
                correctCountry={game.currentCountry}
                selectedAnswer={game.selectedAnswer}
                answeredCorrectly={game.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {game.currentQuizMode === 'flag-picker' && (
              <FlagPicker
                options={game.options}
                correctCountry={game.currentCountry}
                selectedAnswer={game.selectedAnswer}
                answeredCorrectly={game.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
          </div>
        </main>
      </div>

      <Celebration streak={streak} show={showCelebration} />
    </section>
  );
}
