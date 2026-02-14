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
            <div className="flex flex-col items-center py-8">
              <h2
                key={campaign.currentCountry?.code}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 animate-bounce-in text-center"
              >
                {campaign.currentCountry?.name}
              </h2>
              <span
                className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                  {
                    1: 'bg-green-100 text-green-700',
                    2: 'bg-blue-100 text-blue-700',
                    3: 'bg-yellow-100 text-yellow-700',
                    4: 'bg-orange-100 text-orange-700',
                    5: 'bg-red-100 text-red-700',
                  }[campaign.currentCountry?.difficulty || 1]
                }`}
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
