import { JourneyLevel } from '../../data/journeyLevels';
import { QuizMode } from '../../hooks/useQuiz';

interface JourneyQuizSelectProps {
  level: JourneyLevel;
  onSelect: (mode: QuizMode) => void;
  onBack: () => void;
}

export function JourneyQuizSelect({ level, onSelect, onBack }: JourneyQuizSelectProps) {
  const modes: { mode: QuizMode; label: string; emoji: string; description: string }[] = [
    {
      mode: 'multiple-choice',
      label: 'Multiple Choice',
      emoji: '🅰️',
      description: 'Pick the correct answer from 4 options',
    },
    {
      mode: 'type-ahead',
      label: 'Type Answer',
      emoji: '⌨️',
      description: 'Type the country name yourself',
    },
    {
      mode: 'flag-picker',
      label: 'Flag Picker',
      emoji: '🏁',
      description: 'Pick the correct flag from 4 options',
    },
  ];

  return (
    <div className="min-h-screen bg-retro-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="retro-btn px-3 py-2 text-xs font-retro bg-retro-surface text-retro-text-secondary mb-4"
          >
            ← Back
          </button>
          <h2 className="font-retro text-sm text-retro-text mb-2">
            {level.displayName}
          </h2>
          <p className="text-retro-text text-sm">
            {level.countryCodes.length} flags
          </p>
        </div>

        <div className="space-y-3">
          {modes.map(({ mode, label, emoji, description }) => (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              className="retro-btn w-full pixel-border p-4 bg-retro-surface text-left rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="font-retro text-xs text-retro-neon-green">{label}</div>
                  <div className="text-xs text-retro-text-secondary mt-1">{description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
