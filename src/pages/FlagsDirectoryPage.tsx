import { useState } from 'react';
import { Link } from 'react-router-dom';
import { countries, continents, type Continent } from '../data/countries';
import { territories } from '../data/territories';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';

export function FlagsDirectoryPage() {
  const [filter, setFilter] = useState<Continent | 'all'>('all');

  const filtered = filter === 'all'
    ? countries
    : countries.filter((c) => c.continent === filter);

  const grouped = continents.map((continent) => ({
    continent,
    countries: filtered.filter((c) => c.continent === continent),
  })).filter((g) => g.countries.length > 0);

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flags of the World - All 197 Country Flags | Flag Arcade"
        description="Browse all 197 country flags of the world organized by continent. Learn flag colors, meanings, and fun facts. Play our free flag quiz to test your knowledge!"
        canonical="https://flagarcade.com/flags"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">Flags of the World</h1>
          <p className="font-body text-retro-text-secondary mb-4">
            Explore all {countries.length} country flags from every continent. Click any flag to learn about its colors, meaning, and history.
          </p>

          {/* Continent filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`font-body text-base border border-retro-border px-3 py-1.5 shadow-pixel-sm transition-colors ${
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
                  className={`font-body text-base border border-retro-border px-3 py-1.5 shadow-pixel-sm transition-colors ${
                    filter === cont ? 'bg-retro-accent text-retro-text' : 'bg-white text-retro-text-secondary hover:bg-retro-accent/30'
                  }`}
                >
                  {cont} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Flag grid by continent */}
        {grouped.map(({ continent, countries: continentCountries }) => (
          <section key={continent} className="mt-4">
            <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-retro text-sm text-retro-text">{continent}</h2>
                <Link
                  to={`/flags/continent/${getContinentSlug(continent)}`}
                  className="font-body text-xs text-retro-neon-blue underline"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {continentCountries.map((country) => (
                  <Link
                    key={country.code}
                    to={`/flags/${getCountrySlug(country)}`}
                    className="flex flex-col items-center gap-1 p-2 border border-retro-border/40 hover:border-retro-border hover:bg-retro-accent/30 transition-colors"
                  >
                    <span className="text-5xl">{getFlagEmoji(country.code)}</span>
                    <span className="font-body text-sm text-retro-text text-center">{country.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Territories promo */}
        <section className="mt-4">
          <Link
            to="/flags/territories"
            className="block bg-retro-surface border-2 border-retro-border shadow-pixel p-5 hover:bg-retro-accent/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-retro text-sm text-retro-text">Dependent Territories</h2>
              <span className="font-body text-xs text-retro-neon-blue underline">View all →</span>
            </div>
            <p className="font-body text-sm text-retro-text-secondary mb-3">
              Explore flags from {territories.length} dependent territories and non-sovereign entities including Hong Kong, Puerto Rico, Greenland, and more.
            </p>
            <div className="flex gap-2 text-3xl">
              {['HK', 'PR', 'GL', 'BM', 'PF', 'GI', 'AW', 'GU'].map((code) => (
                <span key={code}>{getFlagEmoji(code)}</span>
              ))}
            </div>
          </Link>
        </section>

        {/* Quiz CTA */}
        <section className="bg-retro-accent border-2 border-retro-border shadow-pixel-lg p-6 mt-6 text-center">
          <h2 className="font-retro text-sm mb-2 text-retro-text">How Many Flags Can You Identify?</h2>
          <p className="font-body text-sm text-retro-text-secondary mb-4">
            Put your flag knowledge to the test with our free quiz game!
          </p>
          <Link
            to="/play"
            className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-6 py-3 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
          >
            Play Flag Quiz
          </Link>
        </section>

        <div className="mt-6 pb-8 text-center">
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
