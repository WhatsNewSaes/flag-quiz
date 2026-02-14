import { getFlagEmoji } from '../utils/flagEmoji';
import { Difficulty, difficultyLabels } from '../data/countries';

interface FlagDisplayProps {
  countryCode: string;
  animationKey: string | number;
  difficulty: Difficulty;
}

const difficultyColors: Record<Difficulty, string> = {
  1: 'bg-retro-neon-green text-white',
  2: 'bg-retro-neon-blue text-white',
  3: 'bg-retro-accent text-retro-text',
  4: 'bg-orange-500 text-white',
  5: 'bg-retro-neon-red text-white',
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
        className={`mt-2 px-3 py-1.5 text-xs font-retro rounded-lg border-2 border-retro-border ${difficultyColors[difficulty]}`}
        style={{ boxShadow: '2px 2px 0px 0px #2D2D2D' }}
      >
        {difficultyLabels[difficulty]}
      </span>
    </div>
  );
}
