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
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Pick the Name
      </button>
      <button
        onClick={() => onModeChange('flag-picker')}
        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
          mode === 'flag-picker'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Pick the Flag
      </button>
      <button
        onClick={() => onModeChange('type-ahead')}
        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
          mode === 'type-ahead'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Type Answer
      </button>
    </div>
  );
}
