import { useEffect } from 'react';
import { Country } from '../data/countries';
import { JeopardyCell } from '../hooks/useJeopardy';
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
}: JeopardyQuestionProps) {
  const isAnswered = answeredCorrectly !== null;
  const valueAtStake = isDailyDouble ? wager : cell.value;

  // Keyboard shortcuts
  useEffect(() => {
    if (isAnswered) return;

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
  }, [options, onAnswer, isAnswered]);

  // Auto-close after showing result
  useEffect(() => {
    if (isAnswered) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, onClose]);

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
