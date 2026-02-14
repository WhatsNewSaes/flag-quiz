import { JourneyLevel } from '../../data/journeyLevels';
import { FlagDisplay } from '../FlagDisplay';
import { MultipleChoice } from '../MultipleChoice';
import { FlagPicker } from '../FlagPicker';
import { Celebration } from '../Celebration';
import { Country, difficultyLabels } from '../../data/countries';
import { QuizMode } from '../../hooks/useQuiz';

const difficultyBadgeColors: Record<number, string> = {
  1: 'bg-retro-neon-green text-white',
  2: 'bg-retro-neon-blue text-white',
  3: 'bg-retro-accent text-retro-text',
  4: 'bg-orange-500 text-white',
  5: 'bg-retro-neon-red text-white',
};

interface JourneyLevelPlayProps {
  level: JourneyLevel;
  quizMode: QuizMode;
  currentCountry: Country | null;
  currentIndex: number;
  totalFlags: number;
  options: Country[];
  selectedAnswer: Country | null;
  answeredCorrectly: boolean | null;
  correctCount: number;
  onAnswer: (answer: Country | string) => void;
  onQuit: () => void;
  showCelebration: boolean;
  availableCountries: Country[];
}

export function JourneyLevelPlay({
  level,
  quizMode,
  currentCountry,
  currentIndex,
  totalFlags,
  options,
  selectedAnswer,
  answeredCorrectly,
  correctCount,
  onAnswer,
  onQuit,
  showCelebration,
}: JourneyLevelPlayProps) {
  if (!currentCountry) return null;

  const isAnswered = answeredCorrectly !== null;
  const progressPct = totalFlags > 0 ? ((currentIndex) / totalFlags) * 100 : 0;

  return (
    <div className="min-h-screen bg-retro-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-retro text-sm text-retro-text">
              W{level.regionIndex + 1}-L{level.levelIndexInRegion + 1}
            </span>
            <span className={`font-retro text-[10px] px-2 py-0.5 rounded-full ${difficultyBadgeColors[currentCountry.difficulty] || 'bg-gray-400 text-white'}`}>
              {difficultyLabels[currentCountry.difficulty]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-retro text-sm text-retro-text bg-retro-surface/80 px-2 py-1 rounded border border-retro-border/30">
              {correctCount}/{currentIndex + (isAnswered ? 1 : 0)}
            </span>
            <button
              onClick={onQuit}
              className="retro-btn px-3 py-1.5 text-xs font-retro bg-retro-surface text-retro-text"
            >
              Quit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-retro-surface rounded-lg mb-6 overflow-hidden border-3 border-retro-border" style={{ border: '3px solid #2D2D2D', boxShadow: '3px 3px 0px 0px #2D2D2D' }}>
          <div
            className="h-full bg-retro-neon-green transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="text-center text-sm text-retro-text font-medium mb-4">
          Flag {currentIndex + 1} of {totalFlags}
        </div>

        {/* Question area */}
        <main>
          {quizMode === 'flag-picker' ? (
            <div className="flex flex-col items-center py-8">
              <h2
                key={currentCountry.code}
                className="text-2xl sm:text-3xl md:text-4xl font-retro text-retro-text animate-bounce-in text-center"
              >
                {currentCountry.name}
              </h2>
            </div>
          ) : (
            <FlagDisplay
              countryCode={currentCountry.code}
              animationKey={currentCountry.code}
              difficulty={currentCountry.difficulty}
              showDifficulty={false}
            />
          )}

          <div className="mt-6">
            {quizMode === 'multiple-choice' && (
              <MultipleChoice
                options={options}
                correctCountry={currentCountry}
                selectedAnswer={selectedAnswer}
                answeredCorrectly={answeredCorrectly}
                onSelect={onAnswer}
                disabled={isAnswered}
              />
            )}
            {quizMode === 'flag-picker' && (
              <FlagPicker
                options={options}
                correctCountry={currentCountry}
                selectedAnswer={selectedAnswer}
                answeredCorrectly={answeredCorrectly}
                onSelect={onAnswer}
                disabled={isAnswered}
              />
            )}
          </div>
        </main>
      </div>

      <Celebration streak={1} show={showCelebration} />
    </div>
  );
}
