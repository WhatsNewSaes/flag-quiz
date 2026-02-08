import { useEffect, useState, useRef, useMemo } from 'react';
import { Country, countries } from '../data/countries';
import { JeopardyCell, JeopardyDifficulty } from '../hooks/useJeopardy';
import { getFlagEmoji } from '../utils/flagEmoji';

interface JeopardyQuestionProps {
  cell: JeopardyCell;
  options: Country[];
  selectedAnswer: Country | null;
  answeredCorrectly: boolean | null;
  onAnswer: (country: Country) => void;
  onClose: () => void;
  isDailyDouble: boolean;
  wager: number;
  gameDifficulty: JeopardyDifficulty;
}

export function JeopardyQuestion({
  cell,
  options,
  selectedAnswer,
  answeredCorrectly,
  onAnswer,
  onClose,
  isDailyDouble,
  wager,
  gameDifficulty,
}: JeopardyQuestionProps) {
  const isAnswered = answeredCorrectly !== null;
  const valueAtStake = isDailyDouble ? wager : cell.value;
  const isExtraHard = gameDifficulty === 'extra-hard';

  // Type-ahead state for extra-hard mode
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    if (!inputValue.trim()) return [];
    const searchTerm = inputValue.toLowerCase();
    return countries
      .filter(country => {
        const matchesName = country.name.toLowerCase().includes(searchTerm);
        const matchesAlt = country.alternateNames?.some(alt =>
          alt.toLowerCase().includes(searchTerm)
        );
        return matchesName || matchesAlt;
      })
      .slice(0, 6);
  }, [inputValue]);

  // Reset highlighted index when filtered countries change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCountries]);

  // Focus input in extra-hard mode
  useEffect(() => {
    if (isExtraHard && !isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExtraHard, isAnswered]);

  // Reset input when answered
  useEffect(() => {
    if (answeredCorrectly === null) {
      setInputValue('');
    }
  }, [answeredCorrectly]);

  // Keyboard shortcuts for multiple choice
  useEffect(() => {
    if (isAnswered || isExtraHard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const index = parseInt(key) - 1;
        if (options[index]) {
          onAnswer(options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onAnswer, isAnswered, isExtraHard]);

  // Auto-close after showing result
  useEffect(() => {
    if (isAnswered) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, onClose]);

  // Handle type-ahead keyboard navigation
  const handleTypeAheadKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredCountries.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries.length > 0 && highlightedIndex < filteredCountries.length) {
        handleTypeAheadSubmit(filteredCountries[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Submit type-ahead answer
  const handleTypeAheadSubmit = (country: Country) => {
    setIsDropdownOpen(false);
    onAnswer(country);
  };

  const getButtonStyles = (option: Country) => {
    const baseStyles = 'w-full py-3 px-4 font-medium rounded-xl transition-all flex items-center gap-3';

    if (answeredCorrectly !== null) {
      if (option.code === cell.country.code) {
        return `${baseStyles} bg-green-500 text-white shadow-lg scale-105`;
      }
      if (selectedAnswer?.code === option.code && !answeredCorrectly) {
        return `${baseStyles} bg-red-500 text-white`;
      }
      return `${baseStyles} bg-gray-200 text-gray-400`;
    }

    return `${baseStyles} bg-white text-gray-800 shadow-md hover:shadow-lg hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300`;
  };

  return (
    <div className="fixed inset-0 bg-blue-900/95 flex items-center justify-center p-4 z-50">
      <div className="max-w-lg w-full">
        {/* Value display */}
        <div className="text-center mb-6">
          <span className="text-yellow-400 text-4xl font-bold">
            ${valueAtStake}
          </span>
          {isDailyDouble && (
            <span className="block text-yellow-300 text-lg mt-1">Daily Double!</span>
          )}
        </div>

        {/* Question */}
        <div className="bg-blue-800 rounded-2xl p-6 mb-6">
          {cell.questionType === 'name-the-flag' ? (
            // Show flag, pick country name
            <div className="text-center">
              <span className="text-8xl block mb-4">{getFlagEmoji(cell.country.code)}</span>
              <p className="text-white text-lg">What country does this flag belong to?</p>
            </div>
          ) : (
            // Show country name, pick flag
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">{cell.country.name}</h2>
              <p className="text-blue-200 text-lg">Which flag belongs to this country?</p>
            </div>
          )}
        </div>

        {/* Answer options */}
        {isExtraHard ? (
          // Type-ahead input for extra-hard mode
          <div className="relative w-full max-w-md mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => {
                setInputValue(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              onKeyDown={handleTypeAheadKeyDown}
              disabled={isAnswered}
              placeholder="Type the country name..."
              className={`w-full px-6 py-4 text-xl rounded-xl border-2 outline-none transition-all ${
                answeredCorrectly === true
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : answeredCorrectly === false
                  ? 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-white border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'
              }`}
            />

            {/* Dropdown */}
            {isDropdownOpen && filteredCountries.length > 0 && !isAnswered && (
              <ul className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {filteredCountries.map((country, index) => (
                  <li
                    key={country.code}
                    onMouseDown={() => handleTypeAheadSubmit(country)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {country.name}
                  </li>
                ))}
              </ul>
            )}

            {/* Show correct answer after wrong guess */}
            {answeredCorrectly === false && (
              <p className="mt-3 text-center text-red-300 font-medium">
                Correct answer: {cell.country.name}
              </p>
            )}
          </div>
        ) : (
          // Multiple choice for other difficulties
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((option, index) => (
              <button
                key={option.code}
                onClick={() => onAnswer(option)}
                disabled={isAnswered}
                className={getButtonStyles(option)}
              >
                <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded shadow-sm flex-shrink-0">
                  {index + 1}
                </span>
                {cell.questionType === 'name-the-flag' ? (
                  // Show country names as options
                  <span className="text-lg">{option.name}</span>
                ) : (
                  // Show flags only as options
                  <span className="text-5xl">{getFlagEmoji(option.code)}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Result feedback */}
        {isAnswered && (
          <div className={`text-center mt-6 text-2xl font-bold ${answeredCorrectly ? 'text-green-400' : 'text-red-400'}`}>
            {answeredCorrectly ? `+$${valueAtStake}` : `-$${valueAtStake}`}
          </div>
        )}
      </div>
    </div>
  );
}
