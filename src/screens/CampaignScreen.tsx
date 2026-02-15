import { useState, useCallback } from 'react';
import { FlagDisplay } from '../components/FlagDisplay';
import { MultipleChoice } from '../components/MultipleChoice';
import { FlagPicker } from '../components/FlagPicker';
import { TypeAhead } from '../components/TypeAhead';
import { Celebration } from '../components/Celebration';
import { LevelScoreTracker } from '../components/LevelScoreTracker';
import { LevelSummary } from '../components/LevelSummary';
import { CampaignSummary } from '../components/CampaignSummary';
import { useCampaign } from '../hooks/useCampaign';
import { QuizMode } from '../hooks/useQuiz';
import { difficultyLabels } from '../data/countries';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';

interface CampaignScreenProps {
  initialQuizType: QuizMode;
}

export function CampaignScreen({ initialQuizType }: CampaignScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const campaign = useCampaign(initialQuizType);

  const handleAnswer = useCallback((answer: string | typeof campaign.options[0]) => {
    const isCorrect = campaign.checkAnswer(answer);
    if (isCorrect) {
      playCorrectSound();
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        campaign.nextFlag();
      }, 1500);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        campaign.nextFlag();
      }, 2000);
    }
  }, [campaign]);

  const handleReset = useCallback(() => {
    campaign.resetCampaign();
  }, [campaign]);

  if (campaign.showFinalSummary) {
    return (
      <CampaignSummary
        levelScores={campaign.levelScores}
        onPlayAgain={handleReset}
      />
    );
  }

  if (campaign.showLevelSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <LevelScoreTracker
            currentLevel={campaign.currentLevel}
            levelScores={campaign.levelScores}
            currentFlagIndex={campaign.currentFlagIndex}
            totalFlagsInLevel={campaign.totalFlagsInLevel}
          />
          <LevelSummary
            level={campaign.currentLevel}
            score={campaign.levelScores[campaign.currentLevel]}
            onContinue={campaign.startNextLevel}
          />
        </div>
      </div>
    );
  }

  const isAnswered = campaign.answeredCorrectly !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-retro text-retro-gold">
            Campaign Mode
          </h1>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-retro-text-secondary hover:text-retro-text bg-retro-surface border border-retro-border/20 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>↺</span> Reset
          </button>
        </div>

        <LevelScoreTracker
          currentLevel={campaign.currentLevel}
          levelScores={campaign.levelScores}
          currentFlagIndex={campaign.currentFlagIndex}
          totalFlagsInLevel={campaign.totalFlagsInLevel}
        />

        <main className="mt-4">
          {campaign.quizType === 'flag-picker' ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]">
              <h2
                key={campaign.currentCountry?.code}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 animate-bounce-in text-center"
              >
                {campaign.currentCountry?.name}
              </h2>
              <span
                className={`mt-3 px-3 py-1.5 text-xs font-retro rounded-lg border-2 border-retro-border ${
                  {
                    1: 'bg-retro-neon-green text-white',
                    2: 'bg-retro-neon-blue text-white',
                    3: 'bg-retro-accent text-retro-text',
                    4: 'bg-orange-500 text-white',
                    5: 'bg-retro-neon-red text-white',
                  }[campaign.currentCountry?.difficulty || 1]
                }`}
                style={{ boxShadow: '2px 2px 0px 0px #2D2D2D' }}
              >
                {difficultyLabels[campaign.currentCountry?.difficulty || 1]}
              </span>
            </div>
          ) : (
            <FlagDisplay
              countryCode={campaign.currentCountry?.code || ''}
              animationKey={campaign.currentCountry?.code || ''}
              difficulty={campaign.currentCountry?.difficulty || 1}
            />
          )}

          <div className="mt-6">
            {campaign.quizType === 'multiple-choice' && (
              <MultipleChoice
                options={campaign.options}
                correctCountry={campaign.currentCountry!}
                selectedAnswer={campaign.selectedAnswer}
                answeredCorrectly={campaign.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {campaign.quizType === 'flag-picker' && (
              <FlagPicker
                options={campaign.options}
                correctCountry={campaign.currentCountry!}
                selectedAnswer={campaign.selectedAnswer}
                answeredCorrectly={campaign.answeredCorrectly}
                onSelect={handleAnswer}
                disabled={isAnswered}
              />
            )}
            {campaign.quizType === 'type-ahead' && (
              <TypeAhead
                countries={campaign.availableCountries}
                onSubmit={handleAnswer}
                disabled={isAnswered}
                answeredCorrectly={campaign.answeredCorrectly}
                correctCountry={campaign.currentCountry!}
              />
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Level {campaign.currentLevel}: {difficultyLabels[campaign.currentLevel]}
          </div>
        </main>
      </div>

      <Celebration streak={1} show={showCelebration} />
    </div>
  );
}
