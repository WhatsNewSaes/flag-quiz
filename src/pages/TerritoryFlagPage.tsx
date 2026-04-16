import { useParams, Link, Navigate } from 'react-router-dom';
import { findTerritoryBySlug, getTerritorySlug, getTerritoriesBySovereign } from '../data/territories';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

export function TerritoryFlagPage() {
  const { slug } = useParams<{ slug: string }>();
  const territory = findTerritoryBySlug(slug || '');

  if (!territory) {
    return <Navigate to="/flags/territories" replace />;
  }

  const parentCountry = territory.sovereignCode
    ? countries.find((c) => c.code === territory.sovereignCode)
    : null;

  const siblings = territory.sovereignCode
    ? getTerritoriesBySovereign(territory.sovereignCode).filter((t) => t.code !== territory.code)
    : [];

  const pageTitle = `Flag of ${territory.name} - ${territory.sovereignName} Territory | Flag Arcade`;
  const pageDescription = `Learn about the flag of ${territory.name}, a dependent territory of ${territory.sovereignName} located in ${territory.continent}.`;

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/flags/territories/${getTerritorySlug(territory)}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: 'Territories', href: '/flags/territories' },
          { label: territory.name },
        ]} />

        {/* Flag display */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4 text-center">
          <div className="text-9xl mb-4">{getFlagEmoji(territory.code)}</div>
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-1">{territory.name}</h1>
          <p className="font-body text-sm text-retro-text-secondary">{territory.continent}</p>
          <p className="font-body text-xs text-retro-text-secondary/70 mt-1">ISO Code: {territory.code}</p>
        </div>

        {/* Sovereign info */}
        {territory.sovereignCode && (
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm text-retro-text mb-3">Sovereign State</h2>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{getFlagEmoji(territory.sovereignCode)}</span>
              <div>
                <p className="font-body text-sm text-retro-text">
                  {territory.name} is a dependent territory of <strong>{territory.sovereignName}</strong>
                </p>
                {parentCountry && (
                  <Link
                    to={`/flags/${getCountrySlug(parentCountry)}`}
                    className="font-body text-xs text-retro-neon-blue underline mt-1 inline-block"
                  >
                    View {territory.sovereignName} flag page →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sibling territories */}
        {siblings.length > 0 && (
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm text-retro-text mb-3">
              Other {territory.sovereignName} Territories ({siblings.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {siblings.map((t) => (
                <Link
                  key={t.code}
                  to={`/flags/territories/${getTerritorySlug(t)}`}
                  className="flex flex-col items-center gap-1.5 p-3 border border-retro-border/30 hover:bg-retro-accent/20 hover:border-retro-border transition-colors"
                >
                  <span className="text-4xl">{getFlagEmoji(t.code)}</span>
                  <span className="font-body text-xs text-retro-text text-center leading-tight">
                    {t.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <QuizCTA />

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags/territories" className="font-body text-sm text-retro-neon-blue underline">All Territories</Link>
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
