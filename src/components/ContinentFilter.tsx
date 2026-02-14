import { Continent, continents } from '../data/countries';

interface ContinentFilterProps {
  enabledContinents: Continent[];
  onToggle: (continent: Continent) => void;
}

const continentEmojis: Record<Continent, string> = {
  'Africa': '🌍',
  'Asia': '🌏',
  'Europe': '🌍',
  'North America': '🌎',
  'South America': '🌎',
  'Oceania': '🌏',
};

export function ContinentFilter({ enabledContinents, onToggle }: ContinentFilterProps) {
  return (
    <div className="bg-retro-surface pixel-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-retro-text-secondary uppercase tracking-wide mb-3">
        Filter by Continent
      </h3>
      <div className="flex flex-wrap gap-2">
        {continents.map(continent => {
          const isEnabled = enabledContinents.includes(continent);
          return (
            <button
              key={continent}
              onClick={() => onToggle(continent)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isEnabled
                  ? 'bg-retro-accent text-retro-text ring-2 ring-retro-gold'
                  : 'bg-white text-retro-text-secondary hover:bg-gray-100'
              }`}
            >
              <span>{continentEmojis[continent]}</span>
              <span>{continent}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
