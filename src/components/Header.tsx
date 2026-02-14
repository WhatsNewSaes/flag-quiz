import { useState } from 'react';
import { ModeToggle } from './ModeToggle';
import { ContinentFilter } from './ContinentFilter';
import { DifficultyFilter } from './DifficultyFilter';
import { StreakCounter } from './StreakCounter';
import { QuizMode } from '../hooks/useQuiz';
import { Continent, Difficulty } from '../data/countries';

interface HeaderProps {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  streak: number;
  enabledContinents: Continent[];
  onToggleContinent: (continent: Continent) => void;
  enabledDifficulties: Difficulty[];
  onToggleDifficulty: (difficulty: Difficulty) => void;
}

export function Header({
  mode,
  onModeChange,
  streak,
  enabledContinents,
  onToggleContinent,
  enabledDifficulties,
  onToggleDifficulty,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-retro text-retro-gold">
          Flag Arcade
        </h1>
        <div className="flex items-center gap-3">
          <StreakCounter streak={streak} />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${
              showSettings ? 'bg-retro-accent text-retro-text' : 'bg-retro-surface text-retro-text-secondary hover:bg-retro-surface'
            }`}
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <ModeToggle mode={mode} onModeChange={onModeChange} />
      </div>

      {showSettings && (
        <div className="mb-4 space-y-4">
          <DifficultyFilter
            enabledDifficulties={enabledDifficulties}
            onToggle={onToggleDifficulty}
          />
          <ContinentFilter
            enabledContinents={enabledContinents}
            onToggle={onToggleContinent}
          />
        </div>
      )}
    </header>
  );
}
