import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { countries, continents } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { findContinentBySlug, getCountrySlug, getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { ContinentMap } from '../components/seo/ContinentMap';

export function ContinentFlagsPage() {
  const { slug } = useParams<{ slug: string }>();
  const continent = findContinentBySlug(slug || '');
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!continent) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-8 text-center">
          <h1 className="font-retro text-xl mb-4">Continent Not Found</h1>
          <Link to="/flags" className="font-retro text-sm text-retro-neon-blue underline">Browse All Flags</Link>
        </div>
      </div>
    );
  }

  const continentCountries = countries.filter((c) => c.continent === continent);

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={`${continent} Flags - All ${continentCountries.length} Country Flags | Flag Arcade`}
        description={`Explore all ${continentCountries.length} flags from ${continent}. Learn the colors, meanings, and history of every ${continent.toLowerCase()}n country flag. Test yourself with our ${continent.toLowerCase()} flag quiz!`}
        canonical={`https://flagarcade.com/flags/continent/${getContinentSlug(continent)}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="px-4 py-2 font-body text-sm text-retro-text-secondary">
          <ol className="flex flex-wrap items-center gap-1">
            <li className="flex items-center gap-1">
              <Link to="/" className="underline hover:text-retro-text">Home</Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <Link to="/flags" className="underline hover:text-retro-text">Flags</Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="text-retro-text font-body text-sm inline-flex items-center gap-1 underline hover:text-retro-neon-blue transition-colors cursor-pointer"
                >
                  {continent}
                  <svg className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                    <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-retro-surface border-2 border-retro-border shadow-pixel z-50 min-w-[160px]">
                    {continents.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate(`/flags/continent/${getContinentSlug(c)}`);
                        }}
                        className={`block w-full text-left px-3 py-2 font-body text-sm transition-colors ${
                          c === continent
                            ? 'bg-retro-accent/40 text-retro-text font-bold'
                            : 'text-retro-text-secondary hover:bg-retro-accent/20 hover:text-retro-text'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ContinentMap continent={continent} className="flex-shrink-0" />
            <div>
              <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">
                {continent} Flags
              </h1>
              <p className="font-body text-retro-text-secondary mb-3">
                All {continentCountries.length} country flags from {continent}.
              </p>
              <Link
                to={`/quiz/${getContinentSlug(continent)}`}
                className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-5 py-2.5 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
              >
                Take {continent} Quiz
              </Link>
            </div>
          </div>
        </div>

        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-xs mb-3 text-retro-text">
            All Flags ({continentCountries.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {continentCountries.map((country) => (
              <Link
                key={country.code}
                to={`/flags/${getCountrySlug(country)}`}
                className="flex items-center gap-2 p-2 border border-retro-border hover:bg-retro-accent/30 transition-colors"
              >
                <span className="text-5xl flex-shrink-0">{getFlagEmoji(country.code)}</span>
                <span className="font-body text-base text-retro-text">{country.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quiz CTA */}
        <section className="bg-retro-accent border-2 border-retro-border shadow-pixel-lg p-6 mt-6 text-center">
          <h2 className="font-retro text-sm mb-2 text-retro-text">
            Take the {continent} Flag Quiz!
          </h2>
          <p className="font-body text-sm text-retro-text-secondary mb-4">
            Can you identify all {continentCountries.length} flags from {continent}?
          </p>
          <Link
            to={`/quiz/${getContinentSlug(continent)}`}
            className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-6 py-3 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
          >
            Play Now
          </Link>
        </section>

        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </nav>
      </div>
    </div>
  );
}
