import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FlagDisplay } from './components/FlagDisplay';
import { MultipleChoice } from './components/MultipleChoice';
import { FlagPicker } from './components/FlagPicker';
import { TypeAhead } from './components/TypeAhead';
import { Celebration } from './components/Celebration';
import { GameModeSelect, GameMode } from './components/GameModeSelect';
import { CampaignQuizTypeSelect } from './components/CampaignQuizTypeSelect';
import { LevelScoreTracker } from './components/LevelScoreTracker';
import { LevelSummary } from './components/LevelSummary';
import { CampaignSummary } from './components/CampaignSummary';
import { WorldMap } from './components/WorldMap';
import { MapMultipleChoice } from './components/MapMultipleChoice';
import { AroundTheWorldSummary } from './components/AroundTheWorldSummary';
import { JeopardyBoard } from './components/JeopardyBoard';
import { JeopardyQuestion } from './components/JeopardyQuestion';
import { JeopardyDailyDouble } from './components/JeopardyDailyDouble';
import { JeopardySummary } from './components/JeopardySummary';
import { ContinentFilter } from './components/ContinentFilter';
import { DifficultyFilter } from './components/DifficultyFilter';
import { useQuiz, QuizMode } from './hooks/useQuiz';
import { useCampaign } from './hooks/useCampaign';
import { useAroundTheWorld } from './hooks/useAroundTheWorld';
import { useJeopardy } from './hooks/useJeopardy';
import { usePresentation } from './hooks/usePresentation';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Continent, continents, Difficulty, difficultyLabels } from './data/countries';
import { getFlagEmoji } from './utils/flagEmoji';

type AppScreen = 'mode-select' | 'campaign-quiz-select' | 'free-play' | 'campaign' | 'around-the-world' | 'jeopardy' | 'presentation';

function App() {
  const [screen, setScreen] = useLocalStorage<AppScreen>('app-screen', 'mode-select');

  // Free play state
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

  // Presentation mode state (separate from free play)
  const [presentationContinents, setPresentationContinents] = useLocalStorage<Continent[]>(
    'presentation-continents',
    [...continents]
  );
  const [presentationDifficulties, setPresentationDifficulties] = useLocalStorage<Difficulty[]>(
    'presentation-difficulties',
    [1, 2, 3, 4, 5]
  );
  const [showPresentationSettings, setShowPresentationSettings] = useState(false);

  const quiz = useQuiz({ enabledContinents, enabledDifficulties, mode });
  const campaign = useCampaign();
  const aroundTheWorld = useAroundTheWorld();
  const jeopardy = useJeopardy();
  const presentation = usePresentation({
    enabledContinents: presentationContinents,
    enabledDifficulties: presentationDifficulties
  });
  const [showATWSummary, setShowATWSummary] = useState(false);

  // Handle game mode selection
  const handleSelectGameMode = useCallback((gameMode: GameMode) => {
    if (gameMode === 'free-play') {
      setScreen('free-play');
    } else if (gameMode === 'campaign') {
      setScreen('campaign-quiz-select');
    } else if (gameMode === 'around-the-world') {
      aroundTheWorld.reset();
      setScreen('around-the-world');
    } else if (gameMode === 'jeopardy') {
      jeopardy.resetGame();
      setScreen('jeopardy');
    } else if (gameMode === 'presentation') {
      presentation.reset();
      setScreen('presentation');
    }
  }, [setScreen, aroundTheWorld, jeopardy]);

  // Handle campaign quiz type selection
  const handleSelectCampaignQuizType = useCallback((quizType: QuizMode) => {
    campaign.resetCampaign(quizType);
    setScreen('campaign');
  }, [campaign, setScreen]);

  // Presentation filter handlers
  const handleTogglePresentationContinent = useCallback((continent: Continent) => {
    setPresentationContinents(prev => {
      if (prev.includes(continent)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== continent);
      }
      return [...prev, continent];
    });
  }, [setPresentationContinents]);

  const handleTogglePresentationDifficulty = useCallback((difficulty: Difficulty) => {
    setPresentationDifficulties(prev => {
      if (prev.includes(difficulty)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== difficulty);
      }
      return [...prev, difficulty];
    });
  }, [setPresentationDifficulties]);

  // Free play handlers
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

  const handleFreePlayAnswer = useCallback((answer: string | typeof quiz.options[0]) => {
    const isCorrect = quiz.checkAnswer(answer);

    if (isCorrect) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        quiz.nextQuestion();
      }, 1500);
    } else {
      setTimeout(() => {
        quiz.nextQuestion();
      }, 2000);
    }
  }, [quiz]);

  // Campaign handlers
  const handleCampaignAnswer = useCallback((answer: string | typeof campaign.options[0]) => {
    const isCorrect = campaign.checkAnswer(answer);

    if (isCorrect) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        campaign.nextFlag();
      }, 1500);
    } else {
      setTimeout(() => {
        campaign.nextFlag();
      }, 2000);
    }
  }, [campaign]);

  const handleBackToMenu = useCallback(() => {
    setScreen('mode-select');
  }, [setScreen]);

  const handleResetCampaign = useCallback(() => {
    campaign.resetCampaign();
  }, [campaign]);

  // Around the World handlers
  const handleATWAnswer = useCallback((answer: typeof aroundTheWorld.options[0]) => {
    const isCorrect = aroundTheWorld.checkAnswer(answer);

    if (isCorrect) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        aroundTheWorld.nextCountry();
      }, 1500);
    } else {
      setTimeout(() => {
        aroundTheWorld.nextCountry();
      }, 2000);
    }
  }, [aroundTheWorld]);

  const handleResetATW = useCallback(() => {
    aroundTheWorld.reset();
  }, [aroundTheWorld]);

  // Reset question when free play filters change
  useEffect(() => {
    if (screen === 'free-play' && quiz.availableCountries.length > 0) {
      quiz.nextQuestion();
    }
  }, [enabledContinents, enabledDifficulties]);

  // Reset presentation when filters change
  useEffect(() => {
    if (screen === 'presentation') {
      presentation.reset();
    }
  }, [presentationContinents, presentationDifficulties]);

  // Render based on current screen
  if (screen === 'mode-select') {
    return <GameModeSelect onSelectMode={handleSelectGameMode} />;
  }

  if (screen === 'campaign-quiz-select') {
    return (
      <CampaignQuizTypeSelect
        onSelect={handleSelectCampaignQuizType}
        onBack={handleBackToMenu}
      />
    );
  }

  if (screen === 'presentation') {
    const currentCountry = presentation.currentCountry;

    if (!currentCountry) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-4">No countries available!</p>
            <p className="text-gray-500 mb-4">Please adjust your filters using the settings button.</p>
            <button
              onClick={() => setShowPresentationSettings(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 mr-2"
            >
              Open Settings
            </button>
            <button
              onClick={handleBackToMenu}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Menu
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Flashcard Mode
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPresentationSettings(!showPresentationSettings)}
                className={`p-2 rounded-full transition-colors ${
                  showPresentationSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors"
              >
                Menu
              </button>
            </div>
          </div>

          {/* Flashcard Type Toggle - Always visible */}
          <div className="flex justify-center mb-4">
            <div className="flex bg-gray-200 rounded-full p-1">
              <button
                onClick={() => presentation.setPresentationType('flag-to-name')}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  presentation.presentationType === 'flag-to-name'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pick the Name
              </button>
              <button
                onClick={() => presentation.setPresentationType('name-to-flag')}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  presentation.presentationType === 'name-to-flag'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pick the Flag
              </button>
            </div>
          </div>

          {/* Difficulty Toggles - Always visible */}
          <div className="flex gap-2 mb-4">
            {([1, 2, 3, 4, 5] as Difficulty[]).map(level => {
              const isEnabled = presentationDifficulties.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => handleTogglePresentationDifficulty(level)}
                  className={`flex-1 rounded-full py-1.5 px-1 text-center transition-all ${
                    isEnabled
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium truncate">
                    {difficultyLabels[level]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Settings Panel - Continent filters only */}
          {showPresentationSettings && (
            <div className="mb-4">
              <ContinentFilter
                enabledContinents={presentationContinents}
                onToggle={handleTogglePresentationContinent}
              />
            </div>
          )}

          {/* Progress Counter */}
          <div className="text-center mb-6 text-gray-600">
            {presentation.currentIndex + 1} of {presentation.totalCount}
          </div>

          {/* Main Content - Fixed height container */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {presentation.presentationType === 'flag-to-name' ? (
              // Flag → Name: Show flag, reveal name
              <div className="flex flex-col items-center h-[280px] sm:h-[320px] justify-center">
                <span
                  className={`mb-4 px-3 py-1 rounded-full text-xs font-medium ${
                    {
                      1: 'bg-green-100 text-green-700',
                      2: 'bg-blue-100 text-blue-700',
                      3: 'bg-yellow-100 text-yellow-700',
                      4: 'bg-orange-100 text-orange-700',
                      5: 'bg-red-100 text-red-700',
                    }[currentCountry.difficulty]
                  }`}
                >
                  {difficultyLabels[currentCountry.difficulty]}
                </span>

                <div className="text-[120px] sm:text-[160px] leading-none">
                  {getFlagEmoji(currentCountry.code)}
                </div>

                <div className="h-[50px] flex items-center justify-center mt-4">
                  {presentation.revealed ? (
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 animate-bounce-in">
                      {currentCountry.name}
                    </h2>
                  ) : (
                    <div className="text-3xl text-gray-300">???</div>
                  )}
                </div>
              </div>
            ) : (
              // Name → Flag: Show name, reveal flag
              <div className="flex flex-col items-center h-[280px] sm:h-[320px] justify-center">
                <span
                  className={`mb-4 px-3 py-1 rounded-full text-xs font-medium ${
                    {
                      1: 'bg-green-100 text-green-700',
                      2: 'bg-blue-100 text-blue-700',
                      3: 'bg-yellow-100 text-yellow-700',
                      4: 'bg-orange-100 text-orange-700',
                      5: 'bg-red-100 text-red-700',
                    }[currentCountry.difficulty]
                  }`}
                >
                  {difficultyLabels[currentCountry.difficulty]}
                </span>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                  {currentCountry.name}
                </h2>

                <div className="text-[120px] sm:text-[160px] leading-none">
                  {presentation.revealed ? (
                    <span className="animate-bounce-in inline-block">
                      {getFlagEmoji(currentCountry.code)}
                    </span>
                  ) : (
                    <span className="text-gray-200">🏳️</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            {!presentation.revealed ? (
              <button
                onClick={presentation.reveal}
                className="px-8 py-4 bg-indigo-500 text-white text-lg font-semibold rounded-xl hover:bg-indigo-600 transition-colors shadow-lg"
              >
                Reveal
              </button>
            ) : (
              <button
                onClick={presentation.next}
                className="px-8 py-4 bg-purple-500 text-white text-lg font-semibold rounded-xl hover:bg-purple-600 transition-colors shadow-lg"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'campaign') {
    // Campaign final summary
    if (campaign.showFinalSummary) {
      return (
        <CampaignSummary
          levelScores={campaign.levelScores}
          onPlayAgain={handleResetCampaign}
          onBackToMenu={handleBackToMenu}
        />
      );
    }

    // Campaign level summary
    if (campaign.showLevelSummary) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4">
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

    // Campaign gameplay
    const isAnswered = campaign.answeredCorrectly !== null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Campaign Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Campaign Mode
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCampaign}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>↺</span> Reset
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors"
              >
                Menu
              </button>
            </div>
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
                  onSelect={handleCampaignAnswer}
                  disabled={isAnswered}
                />
              )}
              {campaign.quizType === 'flag-picker' && (
                <FlagPicker
                  options={campaign.options}
                  correctCountry={campaign.currentCountry!}
                  selectedAnswer={campaign.selectedAnswer}
                  answeredCorrectly={campaign.answeredCorrectly}
                  onSelect={handleCampaignAnswer}
                  disabled={isAnswered}
                />
              )}
              {campaign.quizType === 'type-ahead' && (
                <TypeAhead
                  countries={campaign.availableCountries}
                  onSubmit={handleCampaignAnswer}
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

  // Around the World mode
  if (screen === 'around-the-world') {
    const isAnswered = aroundTheWorld.answeredCorrectly !== null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Around the World
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {aroundTheWorld.totalCorrect}/{aroundTheWorld.totalAnswered} correct
              </span>
              <button
                onClick={() => setShowATWSummary(true)}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>📊</span> Stats
              </button>
              <button
                onClick={handleResetATW}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>↺</span> Reset
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors"
              >
                Menu
              </button>
            </div>
          </div>

          {/* Main content - side by side on desktop */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* World Map */}
            <div className="lg:flex-1">
              <WorldMap
                highlightedCountry={aroundTheWorld.currentCountry.code}
                answeredCountries={aroundTheWorld.answeredCountries}
              />
            </div>

            {/* Right panel - Question and Options */}
            <div className="lg:w-72 flex flex-col">
              {/* Question */}
              <div className="text-center lg:text-left mb-4">
                <p className="text-lg text-gray-600">
                  Which country is highlighted?
                </p>
              </div>

              {/* Multiple Choice - vertical on desktop */}
              <div className="flex-1">
                <MapMultipleChoice
                  options={aroundTheWorld.options}
                  correctCountry={aroundTheWorld.currentCountry}
                  selectedAnswer={aroundTheWorld.selectedAnswer}
                  answeredCorrectly={aroundTheWorld.answeredCorrectly}
                  onSelect={handleATWAnswer}
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

        {showATWSummary && (
          <AroundTheWorldSummary
            continentStats={aroundTheWorld.continentStats}
            totalCorrect={aroundTheWorld.totalCorrect}
            totalAnswered={aroundTheWorld.totalAnswered}
            onClose={() => setShowATWSummary(false)}
          />
        )}
      </div>
    );
  }

  // Jeopardy mode
  if (screen === 'jeopardy') {
    const isDailyDouble = jeopardy.selectedCell &&
      jeopardy.dailyDoubleLocation.row === jeopardy.selectedCell.row &&
      jeopardy.dailyDoubleLocation.col === jeopardy.selectedCell.col;

    return (
      <div className="min-h-screen bg-blue-900 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-400">
              Flag Jeopardy
            </h1>
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-bold ${jeopardy.score >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                ${jeopardy.score.toLocaleString()}
              </span>
              <button
                onClick={() => jeopardy.resetGame()}
                className="px-3 py-1.5 text-sm text-blue-200 hover:text-white border border-blue-400 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>↺</span> Reset
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-3 py-1.5 text-sm text-blue-200 hover:text-white border border-blue-400 rounded-lg transition-colors"
              >
                Menu
              </button>
            </div>
          </div>

          {/* Jeopardy Board */}
          <JeopardyBoard
            board={jeopardy.board}
            onSelectCell={jeopardy.selectCell}
          />

          <div className="mt-4 text-center text-sm text-blue-300">
            {jeopardy.remainingCells} questions remaining
          </div>
        </div>

        {/* Daily Double Wager Modal */}
        {jeopardy.showDailyDouble && (
          <JeopardyDailyDouble
            currentScore={jeopardy.score}
            onConfirmWager={(wager) => {
              jeopardy.setDailyDoubleWager(wager);
              jeopardy.confirmDailyDoubleWager();
            }}
          />
        )}

        {/* Question Modal */}
        {jeopardy.currentQuestion && !jeopardy.showDailyDouble && (
          <JeopardyQuestion
            cell={jeopardy.currentQuestion}
            options={jeopardy.options}
            selectedAnswer={jeopardy.selectedAnswer}
            answeredCorrectly={jeopardy.answeredCorrectly}
            onAnswer={jeopardy.checkAnswer}
            onClose={jeopardy.closeQuestion}
            isDailyDouble={isDailyDouble || false}
            wager={jeopardy.dailyDoubleWager}
          />
        )}

        {/* Game Over Summary */}
        {jeopardy.gameOver && (
          <JeopardySummary
            score={jeopardy.score}
            onPlayAgain={() => jeopardy.resetGame()}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
    );
  }

  // Free Play mode
  if (quiz.availableCountries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No countries available!</p>
          <p className="text-gray-500 mb-4">Please enable at least one continent and difficulty level.</p>
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = quiz.answeredCorrectly !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBackToMenu}
            className="text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Menu
          </button>
        </div>

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
            <div className="flex flex-col items-center py-8">
              <h2
                key={quiz.currentCountry.code}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 animate-bounce-in text-center"
              >
                {quiz.currentCountry.name}
              </h2>
              <span
                className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                  {
                    1: 'bg-green-100 text-green-700',
                    2: 'bg-blue-100 text-blue-700',
                    3: 'bg-yellow-100 text-yellow-700',
                    4: 'bg-orange-100 text-orange-700',
                    5: 'bg-red-100 text-red-700',
                  }[quiz.currentCountry.difficulty]
                }`}
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
                onSelect={handleFreePlayAnswer}
                disabled={isAnswered}
              />
            )}
            {mode === 'flag-picker' && (
              <FlagPicker
                options={quiz.options}
                correctCountry={quiz.currentCountry}
                selectedAnswer={quiz.selectedAnswer}
                answeredCorrectly={quiz.answeredCorrectly}
                onSelect={handleFreePlayAnswer}
                disabled={isAnswered}
              />
            )}
            {mode === 'type-ahead' && (
              <TypeAhead
                countries={quiz.availableCountries}
                onSubmit={handleFreePlayAnswer}
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

export default App;
