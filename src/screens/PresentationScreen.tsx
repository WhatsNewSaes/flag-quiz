import { useState, useCallback, useEffect } from 'react';
import { ContinentFilter } from '../components/ContinentFilter';
import { usePresentation } from '../hooks/usePresentation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Continent, continents, Difficulty, difficultyLabels } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

export function PresentationScreen() {
  const [presentationContinents, setPresentationContinents] = useLocalStorage<Continent[]>(
    'presentation-continents',
    [...continents]
  );
  const [presentationDifficulties, setPresentationDifficulties] = useLocalStorage<Difficulty[]>(
    'presentation-difficulties',
    [1, 2, 3, 4, 5]
  );
  const [showSettings, setShowSettings] = useState(false);

  const presentation = usePresentation({
    enabledContinents: presentationContinents,
    enabledDifficulties: presentationDifficulties,
  });

  const handleToggleContinent = useCallback((continent: Continent) => {
    setPresentationContinents(prev => {
      if (prev.includes(continent)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== continent);
      }
      return [...prev, continent];
    });
  }, [setPresentationContinents]);

  const handleToggleDifficulty = useCallback((difficulty: Difficulty) => {
    setPresentationDifficulties(prev => {
      if (prev.includes(difficulty)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== difficulty);
      }
      return [...prev, difficulty];
    });
  }, [setPresentationDifficulties]);

  useEffect(() => {
    presentation.reset();
  }, [presentationContinents, presentationDifficulties]);

  const currentCountry = presentation.currentCountry;

  if (!currentCountry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No countries available!</p>
          <p className="text-gray-500 mb-4">Please adjust your filters using the settings button.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-retro-neon-blue text-white rounded-lg hover:bg-blue-600"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-retro text-retro-gold">
            Flashcard Mode
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${
                showSettings ? 'bg-retro-accent text-retro-text' : 'bg-retro-surface border border-retro-border/20 text-retro-text-secondary hover:bg-retro-surface'
              }`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Flashcard Type Toggle */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-200 rounded-full p-1">
            <button
              onClick={() => presentation.setPresentationType('flag-to-name')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                presentation.presentationType === 'flag-to-name'
                  ? 'bg-retro-accent text-retro-text shadow-sm'
                  : 'text-retro-text-secondary hover:text-retro-text'
              }`}
            >
              Pick the Name
            </button>
            <button
              onClick={() => presentation.setPresentationType('name-to-flag')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                presentation.presentationType === 'name-to-flag'
                  ? 'bg-retro-accent text-retro-text shadow-sm'
                  : 'text-retro-text-secondary hover:text-retro-text'
              }`}
            >
              Pick the Flag
            </button>
          </div>
        </div>

        {/* Difficulty Toggles */}
        <div className="flex gap-2 mb-4">
          {([1, 2, 3, 4, 5] as Difficulty[]).map(level => {
            const isEnabled = presentationDifficulties.includes(level);
            return (
              <button
                key={level}
                onClick={() => handleToggleDifficulty(level)}
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

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4">
            <ContinentFilter
              enabledContinents={presentationContinents}
              onToggle={handleToggleContinent}
            />
          </div>
        )}

        {/* Progress Counter */}
        <div className="text-center mb-6 text-retro-text-secondary">
          {presentation.currentIndex + 1} of {presentation.totalCount}
        </div>

        {/* Main Content */}
        <div className="retro-window"><div className="retro-window-title bg-retro-accent text-retro-text flex items-center justify-between"><span>✦</span><span>Flashcard</span><span>✦</span></div><div className="retro-window-body p-8">
          {presentation.presentationType === 'flag-to-name' ? (
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
        </div></div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          {!presentation.revealed ? (
            <button
              onClick={presentation.reveal}
              className="retro-btn px-8 py-4 bg-retro-neon-green text-white text-lg font-retro"
            >
              Reveal
            </button>
          ) : (
            <button
              onClick={presentation.next}
              className="retro-btn px-8 py-4 bg-retro-neon-blue text-white text-lg font-retro"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
