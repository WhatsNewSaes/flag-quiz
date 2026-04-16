import { useParams, Link } from 'react-router-dom';
import { countries } from '../data/countries';
import { flagFeatures, getSimilarFlags } from '../data/flagFeatures';
import { flagDescriptions } from '../data/flagDescriptions';
import { getFlagEmoji } from '../utils/flagEmoji';
import { findCountryBySlug, getCountrySlug, getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

const colorHex: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#16A34A', yellow: '#FFD93D',
  white: '#FFFFFF', black: '#1F2937', orange: '#F59E0B', maroon: '#7F1D1D',
};

const patternLabels: Record<string, string> = {
  'horizontal-stripes': 'Horizontal Stripes',
  'vertical-stripes': 'Vertical Stripes',
  'diagonal': 'Diagonal Design',
  'cross': 'Cross Design',
  'canton': 'Canton Design',
  'solid': 'Solid Field',
  'complex': 'Complex Design',
};

export function CountryFlagPage() {
  const { slug } = useParams<{ slug: string }>();
  const country = findCountryBySlug(slug || '');

  if (!country) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-8 text-center">
          <h1 className="font-retro text-xl mb-4">Flag Not Found</h1>
          <p className="font-body mb-4">We couldn't find a flag for that country.</p>
          <Link to="/flags" className="font-retro text-sm text-retro-neon-blue underline">Browse All Flags</Link>
        </div>
      </div>
    );
  }

  const features = flagFeatures[country.code];
  const description = flagDescriptions[country.code];
  const emoji = getFlagEmoji(country.code);
  const allCodes = countries.map((c) => c.code);
  const similarCodes = features ? getSimilarFlags(country.code, allCodes) : [];
  const similarCountries = similarCodes
    .map((code) => countries.find((c) => c.code === code))
    .filter(Boolean)
    .slice(0, 5);
  const continentCountries = countries
    .filter((c) => c.continent === country.continent && c.code !== country.code)
    .slice(0, 12);

  const pageTitle = `${country.name} Flag - Colors, Meaning & History | Flag Arcade`;
  const pageDescription = description?.description
    || `Learn about the flag of ${country.name}. Explore the colors, meaning, and history, then test your knowledge in our flag quiz!`;

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/flags/${getCountrySlug(country)}`}
        ogImage={`https://flagarcade.com/og/${getCountrySlug(country)}.jpg`}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: country.continent, href: `/flags/continent/${getContinentSlug(country.continent)}` },
          { label: country.name },
        ]} />

        {/* Flag Display */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4 text-center">
          <div className="text-[8rem] leading-none mb-4" role="img" aria-label={`Flag of ${country.name}`}>
            {emoji}
          </div>
          <h1 className="font-retro text-xl md:text-2xl text-retro-text mb-2">
            Flag of {country.name}
          </h1>
          <p className="font-body text-sm text-retro-text-secondary mt-2">
            {country.continent}
          </p>
        </div>

        {/* Description */}
        {description && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">About This Flag</h2>
            <p className="font-body text-retro-text-secondary leading-relaxed">{description.description}</p>
            {description.capitalCity && (
              <p className="font-body text-sm text-retro-text-secondary mt-2">
                <strong>Capital:</strong> {description.capitalCity}
              </p>
            )}
            {description.adopted && (
              <p className="font-body text-sm text-retro-text-secondary mt-1">
                <strong>Current flag adopted:</strong> {description.adopted}
              </p>
            )}
          </section>
        )}

        {/* Colors & Pattern */}
        {features && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Colors & Design</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {features.colors.map((color) => (
                <div key={color} className="flex items-center gap-2 font-body text-sm border border-retro-border px-2 py-1">
                  <span
                    className="w-5 h-5 border border-retro-border inline-block"
                    style={{ backgroundColor: colorHex[color] || '#ccc' }}
                  />
                  <span className="capitalize">{color}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-sm text-retro-text-secondary">
              <strong>Pattern:</strong> {patternLabels[features.pattern] || features.pattern}
            </p>
          </section>
        )}

        {/* Fun Facts */}
        {description?.funFacts && description.funFacts.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Fun Facts</h2>
            <ul className="list-disc list-inside space-y-2">
              {description.funFacts.map((fact: string, i: number) => (
                <li key={i} className="font-body text-sm text-retro-text-secondary leading-relaxed">{fact}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Similar Flags */}
        {similarCountries.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Similar Flags</h2>
            <p className="font-body text-xs text-retro-text-secondary mb-3">
              These flags share similar colors and patterns — can you tell them apart?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similarCountries.map((c) => c && (
                <Link
                  key={c.code}
                  to={`/flags/${getCountrySlug(c)}`}
                  className="flex items-center gap-2 border border-retro-border p-2 hover:bg-retro-accent/30 transition-colors"
                >
                  <span className="text-5xl">{getFlagEmoji(c.code)}</span>
                  <span className="font-body text-base text-retro-text">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More from continent */}
        {continentCountries.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              More {country.continent} Flags
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {continentCountries.map((c) => (
                <Link
                  key={c.code}
                  to={`/flags/${getCountrySlug(c)}`}
                  className="flex flex-col items-center gap-1 p-2 border border-retro-border hover:bg-retro-accent/30 transition-colors"
                >
                  <span className="text-5xl">{getFlagEmoji(c.code)}</span>
                  <span className="font-body text-base text-retro-text text-center">{c.name}</span>
                </Link>
              ))}
            </div>
            <Link
              to={`/flags/continent/${getContinentSlug(country.continent)}`}
              className="block mt-3 font-body text-sm text-retro-neon-blue underline text-center"
            >
              View all {country.continent} flags →
            </Link>
          </section>
        )}

        {/* Related filter pages */}
        {features && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Explore by Category</h2>
            <div className="flex flex-wrap gap-2">
              {features.colors.map((color) => (
                <Link
                  key={color}
                  to={`/flags/with-${color}`}
                  className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors capitalize"
                >
                  Flags with {color}
                </Link>
              ))}
              {features.pattern === 'horizontal-stripes' && (
                <Link to="/flags/horizontal-stripes" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Horizontal Stripes</Link>
              )}
              {features.pattern === 'vertical-stripes' && (
                <Link to="/flags/vertical-stripes" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Vertical Stripes</Link>
              )}
              {features.pattern === 'cross' && (
                <Link to="/flags/with-crosses" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Flags with Crosses</Link>
              )}
              {features.pattern === 'diagonal' && (
                <Link to="/flags/diagonal-designs" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Diagonal Designs</Link>
              )}
              {features.pattern === 'canton' && (
                <Link to="/flags/canton-designs" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Canton Designs</Link>
              )}
              {features.colors.includes('red') && features.colors.includes('white') && features.colors.includes('blue') && (
                <Link to="/flags/red-white-and-blue-flags" className="font-body text-sm border border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors">Red, White & Blue Flags</Link>
              )}
            </div>
          </section>
        )}

        <QuizCTA countryName={country.name} />

        {/* Footer links */}
        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </nav>
      </div>
    </div>
  );
}
