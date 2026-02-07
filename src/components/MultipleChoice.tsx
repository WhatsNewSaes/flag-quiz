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
    const baseStyles = 'w-full py-3 px-3 sm:py-4 sm:px-6 text-base sm:text-lg font-medium rounded-xl transition-all transform flex items-center justify-center sm:justify-start';

    if (answeredCorrectly !== null) {
      // After answer
      if (option.code === correctCountry.code) {
        return `${baseStyles} bg-green-500 text-white shadow-lg scale-105`;
      }
      if (selectedAnswer?.code === option.code && !answeredCorrectly) {
        return `${baseStyles} bg-red-500 text-white animate-shake`;
      }
      return `${baseStyles} bg-gray-200 text-gray-400`;
    }

    // Before answer
    return `${baseStyles} bg-white text-gray-800 shadow-md hover:shadow-lg hover:scale-102 active:scale-98 border-2 border-gray-200 hover:border-indigo-300`;
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
          <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 mr-3 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded shadow-sm flex-shrink-0">
            {index + 1}
          </span>
          {option.name}
        </button>
      ))}
    </div>
  );
}
