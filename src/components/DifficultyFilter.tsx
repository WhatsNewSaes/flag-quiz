import { Difficulty, difficultyLabels } from '../data/countries';

interface DifficultyFilterProps {
  enabledDifficulties: Difficulty[];
  onToggle: (difficulty: Difficulty) => void;
}

const difficulties: Difficulty[] = [1, 2, 3, 4, 5];

export function DifficultyFilter({ enabledDifficulties, onToggle }: DifficultyFilterProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Difficulty Levels
      </h3>
      <div className="flex flex-wrap gap-2">
        {difficulties.map(difficulty => {
          const isEnabled = enabledDifficulties.includes(difficulty);
          return (
            <button
              key={difficulty}
              onClick={() => onToggle(difficulty)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isEnabled
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {difficulty} - {difficultyLabels[difficulty]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
