import { getFlagEmoji } from '../utils/flagEmoji';
import { Difficulty, difficultyLabels } from '../data/countries';

interface FlagDisplayProps {
  countryCode: string;
  animationKey: string | number;
  difficulty: Difficulty;
}

const difficultyColors: Record<Difficulty, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

export function FlagDisplay({ countryCode, animationKey, difficulty }: FlagDisplayProps) {
  return (
    <div className="flex flex-col items-center py-4">
      <span
        key={animationKey}
        className="text-[8rem] sm:text-[10rem] md:text-[12rem] animate-bounce-in select-none"
        role="img"
        aria-label="Flag"
      >
        {getFlagEmoji(countryCode)}
      </span>
      <span
        className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}
      >
        {difficultyLabels[difficulty]}
      </span>
    </div>
  );
}
