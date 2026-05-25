import { Link } from 'react-router-dom';
import { territories, getTerritorySlug } from '../data/territories';
import { FlagImage } from '../components/FlagImage';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

// Group territories by sovereign country
function getGrouped() {
  const map = new Map<string, { sovereignName: string; sovereignCode: string; territories: typeof territories }>();

  for (const t of territories) {
    const key = t.sovereignCode || '_other';
    if (!map.has(key)) {
      map.set(key, {
        sovereignName: t.sovereignCode ? t.sovereignName : 'Other / Disputed',
        sovereignCode: t.sovereignCode,
        territories: [],
      });
    }
    map.get(key)!.territories.push(t);
  }

  // Sort: named sovereigns first (alphabetical), "Other" last
  return [...map.values()].sort((a, b) => {
    if (!a.sovereignCode) return 1;
    if (!b.sovereignCode) return -1;
    return a.sovereignName.localeCompare(b.sovereignName);
  });
}

export function TerritoriesPage() {
  const grouped = getGrouped();

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Dependent Territories & Non-Sovereign Flags | Flag Arcade"
        description={`Explore flags of ${territories.length} dependent territories and non-sovereign entities including Puerto Rico, Hong Kong, Greenland, Bermuda, and more.`}
        canonical="https://flagarcade.com/flags/territories"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: 'Territories' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">Dependent Territories</h1>
          <p className="font-body text-retro-text-secondary mb-1">
            Flags of {territories.length} dependent territories and non-sovereign entities from around the world.
          </p>
          <p className="font-body text-xs text-retro-text-secondary/70">
            These are regions that have their own flag but are not independent sovereign states.
          </p>
        </div>

        {grouped.map((group) => (
          <section key={group.sovereignCode || '_other'} className="mt-4">
            <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5">
              <div className="flex items-center gap-2 mb-4">
                {group.sovereignCode && (
                  <FlagImage code={group.sovereignCode} name={group.sovereignName} className="text-3xl" />
                )}
                <h2 className="font-retro text-sm text-retro-text">
                  {group.sovereignName}
                  <span className="font-body text-xs text-retro-text-secondary ml-2">
                    ({group.territories.length} {group.territories.length === 1 ? 'territory' : 'territories'})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {group.territories.map((territory) => (
                  <Link
                    key={territory.code}
                    to={`/flags/territories/${getTerritorySlug(territory)}`}
                    className="flex flex-col items-center gap-1 p-2 border border-retro-border/40 hover:border-retro-border hover:bg-retro-accent/30 transition-colors"
                  >
                    <FlagImage code={territory.code} name={territory.name} className="text-5xl" />
                    <span className="font-body text-base text-retro-text text-center">
                      {territory.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <QuizCTA />

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/flags/emoji" className="font-body text-sm text-retro-neon-blue underline">Emoji Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
