import { useEffect } from 'react';
import { Country } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

interface FlagPickerProps {
  options: Country[];
  correctCountry: Country;
  selectedAnswer: Country | null;
  answeredCorrectly: boolean | null;
  onSelect: (country: Country) => void;
  disabled: boolean;
}

export function FlagPicker({
  options,
  correctCountry,
  selectedAnswer,
  answeredCorrectly,
  onSelect,
  disabled,
}: FlagPickerProps) {
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
    const baseStyles = 'flex flex-col items-center justify-center py-4 px-6 rounded-xl transition-all transform relative';

    if (answeredCorrectly !== null) {
      // After answer
      if (option.code === correctCountry.code) {
        return `${baseStyles} bg-green-500 shadow-lg scale-105 ring-4 ring-green-300`;
      }
      if (selectedAnswer?.code === option.code && !answeredCorrectly) {
        return `${baseStyles} bg-red-500 animate-shake ring-4 ring-red-300`;
      }
      return `${baseStyles} bg-gray-200 opacity-50`;
    }

    // Before answer
    return `${baseStyles} bg-white shadow-md hover:shadow-lg hover:scale-105 active:scale-98 border-2 border-gray-200 hover:border-retro-neon-blue`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
      {options.map((option, index) => (
        <button
          key={option.code}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={getButtonStyles(option)}
        >
          <span className="hidden sm:inline-flex absolute top-2 left-2 items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded shadow-sm">
            {index + 1}
          </span>
          <span className="text-6xl sm:text-7xl select-none">
            {getFlagEmoji(option.code)}
          </span>
        </button>
      ))}
    </div>
  );
}
