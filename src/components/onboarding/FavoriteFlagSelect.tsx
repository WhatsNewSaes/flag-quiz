import { useMemo, useState } from 'react';
import { countries } from '../../data/countries';
import { FlagImage } from '../FlagImage';

const POPULAR_FLAGS = ['US', 'GB', 'CN', 'JP', 'BR', 'FR', 'IN', 'KR', 'MX', 'DE', 'IT', 'CA'];

interface FavoriteFlagSelectProps {
  onSelect: (code: string) => void;
  title?: string;
}

export function FavoriteFlagSelect({ onSelect, title = 'Pick Your Flag' }: FavoriteFlagSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      .slice(0, 20);
  }, [searchQuery]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl mb-3">&#x1F30D;</div>
      <h2 className="font-retro text-center mb-5" style={{ fontSize: '1.25rem' }}>
        <span
          className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
          style={{ WebkitTextStroke: '1px #2D2D2D' }}
        >
          {title}
        </span>
      </h2>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        {POPULAR_FLAGS.map(code => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className="retro-btn w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center bg-retro-surface text-3xl sm:text-4xl rounded-lg"
          >
            <FlagImage code={code} />
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        <input
          type="text"
          placeholder="Search any country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full font-retro text-xs text-retro-text bg-retro-surface border-3 border-retro-border rounded-lg px-3 py-3 outline-none"
          style={{ borderWidth: 3 }}
        />

        {searchResults.length > 0 && (
          <div
            className="mt-2 bg-retro-surface border-3 border-retro-border rounded-lg overflow-y-auto"
            style={{ maxHeight: 240, borderWidth: 3 }}
          >
            {searchResults.map(c => (
              <button
                key={c.code}
                onClick={() => onSelect(c.code)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-retro-accent/20 transition-colors border-b border-retro-border/20 last:border-b-0"
              >
                <FlagImage code={c.code} name={c.name} className="text-2xl" />
                <span className="text-sm text-retro-text">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
