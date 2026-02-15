import { useState, useCallback, useEffect } from 'react';
import { Header } from '../components/Header';
import { FlagDisplay } from '../components/FlagDisplay';
import { MultipleChoice } from '../components/MultipleChoice';
import { FlagPicker } from '../components/FlagPicker';
import { TypeAhead } from '../components/TypeAhead';
import { Celebration } from '../components/Celebration';
import { useQuiz, QuizMode } from '../hooks/useQuiz';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Continent, continents, Difficulty, difficultyLabels } from '../data/countries';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';

export function FreePlayScreen() {
  const [mode, setMode] = useLocalStorage<QuizMode>('quiz-mode', 'multiple-choice');
  const [enabledContinents, setEnabledContinents] = useLocalStorage<Continent[]>(
    'enabled-continents',
    [...continents]
  );
  const [enabledDifficulties, setEnabledDifficulties] = useLocalStorage<Difficulty[]>(
    'enabled-difficulties',
    [1, 2, 3, 4, 5]
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const quiz = useQuiz({ enabledContinents, enabledDifficulties, mode });

  const handleToggleContinent = useCallback((continent: Continent) => {
    setEnabledContinents(prev => {
      if (prev.includes(continent)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== continent);
      }
      return [...prev, continent];
    });
  }, [setEnabledContinents]);

  const handleToggleDifficulty = useCallback((difficulty: Difficulty) => {
    setEnabledDifficulties(prev => {
      if (prev.includes(difficulty)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== difficulty);
      }
      return [...prev, difficulty];
    });
  }, [setEnabledDifficulties]);

  const handleAnswer = useCallback((answer: string | typeof quiz.options[0]) => {
    const isCorrect = quiz.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        quiz.nextQuestion();
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        quiz.nextQuestion();
      }, 2000);
    }
  }, [quiz]);

  useEffect(() => {
    if (quiz.availableCountries.length > 0) {
      quiz.nextQuestion();
    }
  }, [enabledContinents, enabledDifficulties]);

  if (quiz.availableCountries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No countries available!</p>
          <p className="text-gray-500 mb-4">Please enable at least one continent and difficulty level.</p>
        </div>
      </div>
    );
  }

  const isAnswered = quiz.answeredCorrectly !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Header
          mode={mode}
          onModeChange={setMode}
          streak={quiz.streak}
          enabledContinents={enabledContinents}
          onToggleContinent={handleToggleContinent}
          enabledDifficulties={enabledDifficulties}
          onToggleDifficulty={handleToggleDifficulty}
        />

        <main className="mt-4">
          {mode === 'flag-picker' ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]">
              <h2
                key={quiz.currentCountry.code}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 animate-bounce-in text-center"
              >
                {quiz.currentCountry.name}
              </h2>
              <span
                className={`mt-3 px-3 py-1.5 text-xs font-retro rounded-lg border-2 border-retro-border ${
                  {
                    1: 'bg-retro-neon-green text-white',
                    2: 'bg-retro-neon-blue text-white',
                    3: 'bg-retro-accent text-retro-text',
                    4: 'bg-orange-500 text-white',
                    5: 'bg-retro-neon-red text-white',
                  }[quiz.currentCountry.difficulty]
                }`}
                style={{ boxShadow: '2px 2px 0px 0px #2D2D2D' }}
              >
                {difficultyLabels[quiz.currentCountry.difficulty]}
              </span>
            </div>
          ) : (
            <FlagDisplay
              countryCode={quiz.currentCountry.code}
              animationKey={quiz.currentCountry.code}
              difficulty={quiz.currentCountry.difficulty}
            />
          )}

          <div className="mt-6">
            {mode === 'multiple-choice' && (
              <MultipleChoice
                options={quiz.options}
                correctCountry={quiz.currentCountry}
                selectedAnswer={quiz.selectedAnswer}
                answeredCorrectly={quiz.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {mode === 'flag-picker' && (
              <FlagPicker
                options={quiz.options}
                correctCountry={quiz.currentCountry}
                selectedAnswer={quiz.selectedAnswer}
                answeredCorrectly={quiz.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {mode === 'type-ahead' && (
              <TypeAhead
                countries={quiz.availableCountries}
                onSubmit={handleAnswer}
                disabled={isAnswered}
                answeredCorrectly={quiz.answeredCorrectly}
                correctCountry={quiz.currentCountry}
              />
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            {quiz.availableCountries.length} countries available
          </div>
        </main>
      </div>

      <Celebration streak={quiz.streak} show={showCelebration} />
    </div>
  );
}
