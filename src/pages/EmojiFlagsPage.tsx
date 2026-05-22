import { useState } from 'react';
import { Link } from 'react-router-dom';
import { countries, continents, type Continent } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

function getUnicodeCodePoints(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => `U+${(127397 + c.charCodeAt(0)).toString(16).toUpperCase()}`)
    .join(' ');
}

function copyToClipboard(text: string, setId: (id: string) => void, id: string) {
  navigator.clipboard.writeText(text).then(() => {
    setId(id);
    setTimeout(() => setId(''), 1500);
  });
}

export function EmojiFlagsPage() {
  const [filter, setFilter] = useState<Continent | 'all'>('all');
  const [copiedId, setCopiedId] = useState('');
  const [search, setSearch] = useState('');

  const filtered = countries.filter((c) => {
    const matchContinent = filter === 'all' || c.continent === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return matchContinent && matchSearch;
  });

  const grouped = filter === 'all'
    ? continents.map((continent) => ({
        continent,
        countries: filtered.filter((c) => c.continent === continent),
      })).filter((g) => g.countries.length > 0)
    : [{ continent: filter, countries: filtered }];

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flag Emojis - Copy & Paste Country Flags | Flag Arcade"
        description="Copy and paste flag emojis for all 197 countries. Find any country's flag emoji with Unicode code points. Click to copy instantly!"
        canonical="https://flagarcade.com/flags/emoji"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: 'Emoji Flags' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">Flag Emojis</h1>
          <p className="font-body text-retro-text-secondary mb-2">
            All {countries.length} country flag emojis ready to copy and paste. Click the copy button next to any flag to add it to your clipboard.
          </p>
          <p className="font-body text-xs text-retro-text-secondary/70 mb-4">
            Note: Flag emojis may appear as two-letter country codes on some systems (like Windows) that don't support flag emoji rendering.
          </p>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full font-body text-sm border-2 border-retro-border px-3 py-2 bg-white focus:outline-none focus:border-retro-neon-blue"
            />
          </div>

          {/* Continent filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`font-body text-xs border border-retro-border px-3 py-1.5 shadow-pixel-sm transition-colors ${
                filter === 'all' ? 'bg-retro-accent text-retro-text' : 'bg-white text-retro-text-secondary hover:bg-retro-accent/30'
              }`}
            >
              All ({countries.length})
            </button>
            {continents.map((cont) => {
              const count = countries.filter((c) => c.continent === cont).length;
              return (
                <button
                  key={cont}
                  onClick={() => setFilter(cont)}
                  className={`font-body text-xs border border-retro-border px-3 py-1.5 shadow-pixel-sm transition-colors ${
                    filter === cont ? 'bg-retro-accent text-retro-text' : 'bg-white text-retro-text-secondary hover:bg-retro-accent/30'
                  }`}
                >
                  {cont} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Emoji table by continent */}
        {grouped.map(({ continent, countries: continentCountries }) => (
          <section key={continent} className="mt-4">
            <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-retro text-sm text-retro-text">{continent}</h2>
                <Link
                  to={`/flags/continent/${getContinentSlug(continent)}`}
                  className="font-body text-xs text-retro-neon-blue underline"
                >
                  View flags →
                </Link>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[3rem_1fr_4.5rem_10rem] gap-2 px-2 pb-2 border-b-2 border-retro-border mb-2">
                <span className="font-body text-xs text-retro-text-secondary font-bold">Flag</span>
                <span className="font-body text-xs text-retro-text-secondary font-bold">Country</span>
                <span className="font-body text-xs text-retro-text-secondary font-bold">Copy</span>
                <span className="font-body text-xs text-retro-text-secondary font-bold">Unicode</span>
              </div>

              {/* Flag rows */}
              {continentCountries.map((country) => {
                const emoji = getFlagEmoji(country.code);
                const unicode = getUnicodeCodePoints(country.code);
                const isCopied = copiedId === country.code;

                return (
                  <div
                    key={country.code}
                    className="grid grid-cols-[3rem_1fr_4.5rem] sm:grid-cols-[3rem_1fr_4.5rem_10rem] gap-2 items-center px-2 py-2 border-b border-retro-border/30 hover:bg-retro-accent/20 transition-colors"
                  >
                    {/* Flag emoji */}
                    <span className="text-3xl">{emoji}</span>

                    {/* Country name */}
                    <Link
                      to={`/flags/${getCountrySlug(country)}`}
                      className="font-body text-sm text-retro-text hover:text-retro-neon-blue transition-colors"
                    >
                      {country.name}
                    </Link>

                    {/* Copy button */}
                    <button
                      onClick={() => copyToClipboard(emoji, setCopiedId, country.code)}
                      className={`font-body text-xs border border-retro-border px-2 py-1 transition-all ${
                        isCopied
                          ? 'bg-retro-neon-green text-white border-retro-neon-green'
                          : 'bg-white hover:bg-retro-accent/30'
                      }`}
                    >
                      {isCopied ? 'Done!' : 'Copy'}
                    </button>

                    {/* Unicode code points */}
                    <span className="hidden sm:block font-mono text-xs text-retro-text-secondary">
                      {unicode}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Territories link */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4 text-center">
          <p className="font-body text-sm text-retro-text-secondary">
            Looking for territory flag emojis? See all dependent territory flags including Hong Kong, Puerto Rico, Greenland, and more.
          </p>
          <Link
            to="/flags/territories"
            className="inline-block font-retro text-xs border-2 border-retro-border shadow-pixel px-5 py-2 mt-3 bg-white hover:bg-retro-accent/30 transition-colors"
          >
            Territory Flags →
          </Link>
        </div>

        <QuizCTA />

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/flags/territories" className="font-body text-sm text-retro-neon-blue underline">Territory Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
