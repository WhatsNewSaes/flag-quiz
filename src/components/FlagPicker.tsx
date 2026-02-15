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
    const baseStyles = 'relative w-full pt-[1rem] pb-3 flex flex-col items-center justify-center transition-all transform keycap-btn';

    if (answeredCorrectly !== null) {
      if (option.code === correctCountry.code) {
        return `${baseStyles} keycap-btn-green keycap-btn-pressed text-white`;
      }
      if (selectedAnswer?.code === option.code && !answeredCorrectly) {
        return `${baseStyles} keycap-btn-red keycap-btn-pressed text-white animate-shake`;
      }
      return `${baseStyles} keycap-btn-faded opacity-60`;
    }

    return `${baseStyles} text-retro-text`;
  };

  return (
    <div className="keyboard-case w-full max-w-xl mx-auto">
      <div className="grid grid-cols-2" style={{ gap: '0.3rem' }}>
        {options.map((option, index) => (
          <button
            key={option.code}
            onClick={() => onSelect(option)}
            disabled={disabled}
            className={getButtonStyles(option)}
          >
            <span className="absolute top-1 left-2.5 sm:top-1.5 sm:left-3 font-mono opacity-70" style={{ fontSize: '11px' }}>
              {index + 1}
            </span>
            <span className="text-6xl sm:text-7xl select-none">
              {getFlagEmoji(option.code)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
