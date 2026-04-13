import { useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { countries, Difficulty } from '../data/countries';
import { findContinentBySlug, getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { FlagDisplay } from '../components/FlagDisplay';
import { MultipleChoice } from '../components/MultipleChoice';
import { FlagPicker } from '../components/FlagPicker';
import { TypeAhead } from '../components/TypeAhead';
import { Celebration } from '../components/Celebration';
import { ModeToggle } from '../components/ModeToggle';
import { useArcade, difficultyLabels } from '../hooks/useArcade';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';

export function ContinentQuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const continent = findContinentBySlug(slug || '');

  if (!continent) {
    return <Navigate to="/quiz" replace />;
  }

  const continentCountries = countries.filter(c => c.continent === continent);

  return (
    <ContinentQuizInner
      continent={continent}
      slug={slug!}
      flagCount={continentCountries.length}
    />
  );
}

function ContinentQuizInner({
  continent,
  slug,
  flagCount,
}: {
  continent: ReturnType<typeof findContinentBySlug> & {};
  slug: string;
  flagCount: number;
}) {
  const arcade = useArcade({ initialContinents: [continent], autoStart: true });
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPlayingOptions, setShowPlayingOptions] = useState(false);

  const handleAnswer = useCallback((answer: string | typeof arcade.options[0]) => {
    const isCorrect = arcade.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        arcade.nextFlag();
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        arcade.nextFlag();
      }, 2000);
    }
  }, [arcade]);

  // --- SUMMARY PHASE ---
  if (arcade.phase === 'summary' && arcade.summary) {
    const { totalScore, totalCorrect, totalFlags, accuracy, bestStreak, difficultyBreakdown } = arcade.summary;

    return (
      <div className="min-h-screen bg-retro-bg">
        <SEOHead
          title={`${continent} Flag Quiz Results | Flag Arcade`}
          description={`See your ${continent} flag quiz results. Test your knowledge of ${flagCount} ${continent.toLowerCase()} country flags!`}
          canonical={`https://flagarcade.com/quiz/${getContinentSlug(continent)}`}
        />

        <div className="max-w-3xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Quiz', href: '/quiz' },
            { label: `${continent} Flag Quiz` },
          ]} />

          <div className="flex items-center justify-center mt-4" style={{ minHeight: 'calc(100dvh - 200px)' }}>
            <div className="max-w-md w-full">
              <div className="pixel-border bg-retro-surface rounded-lg overflow-hidden">
                <div className="bg-retro-accent/40 px-4 py-3 text-center" style={{ borderBottom: '3px solid #2D2D2D' }}>
                  <h2 className="font-retro text-sm text-retro-text">{continent} Quiz Complete!</h2>
                </div>

                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="font-retro text-2xl text-retro-gold">{totalScore.toLocaleString()}</div>
                    <div className="font-body text-xs text-retro-text-secondary">Total Score</div>
                  </div>

                  <div className="flex justify-center gap-6 mb-6">
                    <div>
                      <div className="font-retro text-sm text-retro-text">{accuracy}%</div>
                      <div className="font-body text-xs text-retro-text-secondary">Accuracy</div>
                    </div>
                    <div>
                      <div className="font-retro text-sm text-retro-text">{totalCorrect}/{totalFlags}</div>
                      <div className="font-body text-xs text-retro-text-secondary">Correct</div>
                    </div>
                    <div>
                      <div className="font-retro text-sm text-retro-text">{bestStreak}</div>
                      <div className="font-body text-xs text-retro-text-secondary">Best Streak</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-retro text-[0.6rem] text-retro-text-secondary mb-2">Breakdown by Difficulty</h3>
                    <div className="space-y-1">
                      {([1, 2, 3, 4, 5] as Difficulty[]).map(d => {
                        const stats = difficultyBreakdown[d];
                        if (stats.total === 0) return null;
                        const pct = Math.round((stats.correct / stats.total) * 100);
                        return (
                          <div key={d} className="flex items-center justify-between text-sm font-body px-2">
                            <span className="text-retro-text">{difficultyLabels[d]}</span>
                            <span className="text-retro-text-secondary">{stats.correct}/{stats.total} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={arcade.startGame}
                      className="retro-btn w-full px-4 py-3 font-retro text-xs bg-retro-neon-green text-white"
                    >
                      Play Again
                    </button>
                    <Link
                      to={`/flags/continent/${slug}`}
                      className="retro-btn block w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text-secondary text-center"
                    >
                      Back to {continent} Flags
                    </Link>
                    <Link
                      to="/quiz"
                      className="retro-btn block w-full px-4 py-3 font-retro text-xs bg-retro-surface text-retro-text-secondary text-center"
                    >
                      Try Another Continent
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING / LOBBY (brief, auto-start transitions immediately) ---
  if (!arcade.currentCountry) {
    return (
      <div className="min-h-screen bg-retro-bg">
        <SEOHead
          title={`${continent} Flag Quiz - Guess All ${flagCount} Flags | Flag Arcade`}
          description={`Can you identify all ${flagCount} flags from ${continent}? Take the free ${continent.toLowerCase()} flag quiz and test your knowledge!`}
          canonical={`https://flagarcade.com/quiz/${getContinentSlug(continent)}`}
        />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Quiz', href: '/quiz' },
            { label: `${continent} Flag Quiz` },
          ]} />
          <div className="flex items-center justify-center mt-8">
            <p className="font-body text-retro-text-secondary">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING PHASE ---
  const isAnswered = arcade.answeredCorrectly !== null;
  const progress = arcade.totalFlags > 0
    ? Math.round((arcade.currentIndex / arcade.totalFlags) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-6 px-4">
      <SEOHead
        title={`${continent} Flag Quiz - Guess All ${flagCount} Flags | Flag Arcade`}
        description={`Can you identify all ${flagCount} flags from ${continent}? Take the free ${continent.toLowerCase()} flag quiz and test your knowledge!`}
        canonical={`https://flagarcade.com/quiz/${getContinentSlug(continent)}`}
      />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Link
            to={`/flags/continent/${slug}`}
            className="font-body text-sm text-retro-text-secondary hover:text-retro-text transition-colors flex items-center gap-1"
          >
            <span>&#8592;</span> {continent} Flags
          </Link>
          <button
            onClick={() => setShowPlayingOptions(prev => !prev)}
            className="font-body text-sm text-retro-text-secondary hover:text-retro-text transition-colors flex items-center gap-1"
          >
            Options <span className={`inline-block transition-transform ${showPlayingOptions ? 'rotate-180' : ''}`}>&#9662;</span>
          </button>
        </div>

        {showPlayingOptions && (
          <div className="relative z-10 mb-3 p-3 bg-white/40 rounded-xl space-y-3">
            <div>
              <h3 className="font-retro text-[0.6rem] text-retro-text-secondary mb-2">Quiz Type</h3>
              <ModeToggle mode={arcade.quizMode} onModeChange={arcade.setQuizMode} />
            </div>
          </div>
        )}

        {/* Top bar: progress + score */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-body text-sm text-retro-text">
            {arcade.currentIndex + 1} of {arcade.totalFlags}
          </div>
          <div className="flex items-center gap-3">
            {arcade.streak >= 3 && (
              <span className="font-retro text-xs text-retro-gold">
                {arcade.currentMultiplier}x
              </span>
            )}
            <div className="font-retro text-sm text-retro-text">
              {arcade.score.toLocaleString()} pts
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-retro-surface rounded-full mb-4 pixel-border overflow-hidden">
          <div
            className="h-full bg-retro-neon-green rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Streak display */}
        {arcade.streak > 0 && (
          <div className="text-center mb-2">
            <span className="font-retro text-xs text-retro-gold">
              Streak: {arcade.streak}
            </span>
          </div>
        )}

        {/* Question area */}
        <main>
          {arcade.quizMode === 'flag-picker' ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]">
              <h2
                key={arcade.currentCountry.code}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-retro-text animate-bounce-in text-center"
              >
                {arcade.currentCountry.name}
              </h2>
              <span
                className={`mt-3 px-3 py-1.5 text-xs font-retro rounded-lg border-2 border-retro-border ${
                  {
                    1: 'bg-retro-neon-green text-white',
                    2: 'bg-retro-neon-blue text-white',
                    3: 'bg-retro-accent text-retro-text',
                    4: 'bg-orange-700 text-white',
                    5: 'bg-retro-neon-red text-white',
                  }[arcade.currentCountry.difficulty]
                }`}
                style={{ boxShadow: '2px 2px 0px 0px #2D2D2D' }}
              >
                {difficultyLabels[arcade.currentCountry.difficulty]}
              </span>
            </div>
          ) : (
            <FlagDisplay
              countryCode={arcade.currentCountry.code}
              animationKey={`${arcade.currentCountry.code}-${arcade.currentIndex}`}
              difficulty={arcade.currentCountry.difficulty}
            />
          )}

          <div className="mt-6">
            {arcade.quizMode === 'multiple-choice' && (
              <MultipleChoice
                options={arcade.options}
                correctCountry={arcade.currentCountry}
                selectedAnswer={arcade.selectedAnswer}
                answeredCorrectly={arcade.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {arcade.quizMode === 'flag-picker' && (
              <FlagPicker
                options={arcade.options}
                correctCountry={arcade.currentCountry}
                selectedAnswer={arcade.selectedAnswer}
                answeredCorrectly={arcade.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {arcade.quizMode === 'type-ahead' && (
              <TypeAhead
                countries={arcade.availableCountries}
                onSubmit={handleAnswer}
                disabled={isAnswered}
                answeredCorrectly={arcade.answeredCorrectly}
                correctCountry={arcade.currentCountry}
              />
            )}
          </div>
        </main>
      </div>

      <Celebration streak={arcade.streak} show={showCelebration} />
    </div>
  );
}
