import { useEffect } from 'react';
import { Country } from '../data/countries';

interface MultipleChoiceProps {
  options: Country[];
  correctCountry: Country;
  selectedAnswer: Country | null;
  answeredCorrectly: boolean | null;
  onSelect: (country: Country) => void;
  disabled: boolean;
}

export function MultipleChoice({
  options,
  correctCountry,
  selectedAnswer,
  answeredCorrectly,
  onSelect,
  disabled,
}: MultipleChoiceProps) {
  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const index = parseInt(key) - 1;
        if (options[index]) {
          onSelect(options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onSelect, disabled]);

  const getButtonStyles = (option: Country) => {
    const baseStyles = 'w-full py-3 px-3 sm:py-4 sm:px-6 text-base sm:text-lg font-medium transition-all transform flex items-center justify-center sm:justify-start retro-btn rounded-lg';

    if (answeredCorrectly !== null) {
      // After answer
      if (option.code === correctCountry.code) {
        return `${baseStyles} bg-retro-neon-green text-white scale-105`;
      }
      if (selectedAnswer?.code === option.code && !answeredCorrectly) {
        return `${baseStyles} bg-retro-neon-red text-white animate-shake`;
      }
      return `${baseStyles} bg-gray-300 text-gray-500 opacity-60`;
    }

    // Before answer
    return `${baseStyles} bg-retro-surface text-retro-text hover:bg-retro-accent`;
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-xl mx-auto">
      {options.map((option, index) => (
        <button
          key={option.code}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={getButtonStyles(option)}
        >
          <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 mr-3 text-xs font-retro text-retro-text-secondary bg-retro-bg/50 border-2 border-retro-border/30 rounded flex-shrink-0">
            {index + 1}
          </span>
          {option.name}
        </button>
      ))}
    </div>
  );
}
