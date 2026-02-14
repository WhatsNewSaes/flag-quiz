import { QuizMode } from '../hooks/useQuiz';

interface ModeToggleProps {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex bg-gray-200 rounded-full p-1">
      <button
        onClick={() => onModeChange('multiple-choice')}
        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
          mode === 'multiple-choice'
            ? 'bg-retro-accent text-retro-text shadow-sm'
            : 'text-retro-text-secondary hover:text-retro-text'
        }`}
      >
        Pick the Name
      </button>
      <button
        onClick={() => onModeChange('flag-picker')}
        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
          mode === 'flag-picker'
            ? 'bg-retro-accent text-retro-text shadow-sm'
            : 'text-retro-text-secondary hover:text-retro-text'
        }`}
      >
        Pick the Flag
      </button>
      <button
        onClick={() => onModeChange('type-ahead')}
        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
          mode === 'type-ahead'
            ? 'bg-retro-accent text-retro-text shadow-sm'
            : 'text-retro-text-secondary hover:text-retro-text'
        }`}
      >
        Type Answer
      </button>
    </div>
  );
}
