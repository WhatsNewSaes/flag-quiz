import { useEffect } from 'react';
import { Country } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

interface MapMultipleChoiceProps {
  options: Country[];
  correctCountry: Country;
  selectedAnswer: Country | null;
  answeredCorrectly: boolean | null;
  onSelect: (country: Country) => void;
  disabled: boolean;
}

export function MapMultipleChoice({
  options,
  correctCountry,
  selectedAnswer,
  answeredCorrectly,
  onSelect,
  disabled,
}: MapMultipleChoiceProps) {
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
    const baseStyles = 'relative w-full pt-[1rem] pb-3 transition-all transform flex items-center justify-center gap-2 lg:gap-3 keycap-btn';

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
    <div className="keyboard-case w-full lg:max-w-sm">
      <div className="grid grid-cols-2 lg:grid-cols-1" style={{ gap: '0.3rem' }}>
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
            <span className="text-xl lg:text-2xl">{getFlagEmoji(option.code)}</span>
            <span className="text-xs lg:text-base truncate">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
