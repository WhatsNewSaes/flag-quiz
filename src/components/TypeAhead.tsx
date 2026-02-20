import { useState, useRef, useEffect, useMemo } from 'react';
import { Country } from '../data/countries';

interface TypeAheadProps {
  countries: Country[];
  onSubmit: (answer: string) => void;
  disabled: boolean;
  answeredCorrectly: boolean | null;
  correctCountry: Country;
}

export function TypeAhead({
  countries,
  onSubmit,
  disabled,
  answeredCorrectly,
  correctCountry,
}: TypeAheadProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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
      .slice(0, 8);
  }, [inputValue, countries]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCountries]);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Reset input when question changes
  useEffect(() => {
    if (answeredCorrectly === null) {
      setInputValue('');
    }
  }, [answeredCorrectly]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        setInputValue(filteredCountries[highlightedIndex].name);
        onSubmit(filteredCountries[highlightedIndex].name);
        setIsOpen(false);
      } else if (inputValue.trim()) {
        onSubmit(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getInputStyles = () => {
    const baseStyles = 'w-full px-6 py-4 text-xl rounded-xl border-2 outline-none transition-all';
    if (answeredCorrectly === true) {
      return `${baseStyles} bg-green-100 border-green-500 text-green-800`;
    }
    if (answeredCorrectly === false) {
      return `${baseStyles} bg-red-100 border-red-500 text-red-800 animate-shake`;
    }
    return `${baseStyles} bg-white border-gray-300 focus:border-retro-neon-blue focus:ring-2 focus:ring-retro-neon-blue/30`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type the country name..."
        className={getInputStyles()}
      />

      {/* Show correct answer after wrong guess */}
      {answeredCorrectly === false && (
        <p className="mt-2 text-center text-red-600 font-medium">
          Correct answer: {correctCountry.name}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && filteredCountries.length > 0 && !disabled && (
        <ul className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredCountries.map((country, index) => (
            <li
              key={country.code}
              onMouseDown={() => {
                setInputValue(country.name);
                onSubmit(country.name);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-retro-accent/30 text-retro-text'
                  : 'hover:bg-gray-50'
              }`}
            >
              {country.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
