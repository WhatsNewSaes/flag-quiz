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
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
