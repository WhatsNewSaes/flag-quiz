import { useParams, Link, Navigate } from 'react-router-dom';
import { findTerritoryBySlug, getTerritorySlug, getTerritoriesBySovereign } from '../data/territories';
import { countries } from '../data/countries';
import { flagFeatures, getSimilarFlags } from '../data/flagFeatures';
import { flagDescriptions } from '../data/flagDescriptions';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import { allFlagCodes, flagEntriesByContinent, resolveFlagEntry } from '../utils/flagEntry';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';
import { QuickFacts } from '../components/QuickFacts';
import { AboutThisFlag } from '../components/AboutThisFlag';
import { BorderingCountries } from '../components/BorderingCountries';
import { FlagActions } from '../components/FlagActions';
import { getCountryFacts } from '../data/countryFacts';
import { getCountryAdjective } from '../utils/adjective';

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

  const facts = getCountryFacts(territory.code);
  const features = flagFeatures[territory.code];
  const description = flagDescriptions[territory.code];
  const territorySlug = getTerritorySlug(territory);
  const flagFilename = `flag-${territorySlug}.svg`;
  const emoji = getFlagEmoji(territory.code);

  const similarCodes = features ? getSimilarFlags(territory.code, allFlagCodes()) : [];
  const similarEntries = similarCodes
    .map(resolveFlagEntry)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .slice(0, 5);

  const continentPeers = flagEntriesByContinent(territory.continent, territory.code).slice(0, 8);

  const pageTitle = `Flag of ${territory.name} - ${territory.sovereignName} Territory | Flag Arcade`;
  const pageDescription = description?.description
    || `Learn about the flag of ${territory.name}, a dependent territory of ${territory.sovereignName} located in ${territory.continent}.`;

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/flags/territories/${territorySlug}`}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: 'Territories', href: '/flags/territories' },
          { label: territory.name },
        ]} />

        {/* Flag display */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4 text-center">
          <div className="text-[8rem] leading-none mb-4" role="img" aria-label={`Flag of ${territory.name}`}>
            {emoji}
          </div>
          <h1 className="font-retro text-xl md:text-2xl text-retro-text mb-2">
            Flag of {territory.name}
          </h1>
          <p className="font-body text-sm text-retro-text-secondary mt-2">{territory.continent}</p>
          <p className="font-body text-xs text-retro-text-secondary/70 mt-1">ISO Code: {territory.code}</p>
          <FlagActions
            emoji={emoji}
            flagFilename={flagFilename}
            countryName={territory.name}
            hasDownloadable={true}
          />
        </div>

        {/* Quick Facts */}
        {facts && <QuickFacts facts={facts} flagAdopted={description?.adopted} />}

        {/* Sovereign info */}
        {territory.sovereignCode && (
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <p className="font-body text-sm text-retro-text text-center mb-4">
              <strong>{territory.name}</strong> is a dependent territory of <strong>{territory.sovereignName}</strong>.
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <span className="text-5xl sm:text-6xl leading-none">{emoji}</span>
                <span className="font-body text-base text-retro-text text-center truncate max-w-full">
                  {territory.name}
                </span>
                <span className="font-body text-[10px] uppercase tracking-wide text-retro-text-secondary/70">
                  Territory
                </span>
              </div>
              <div className="font-retro text-5xl sm:text-6xl text-retro-text-secondary shrink-0 leading-none -mt-5" aria-hidden="true">→</div>
              {parentCountry ? (
                <Link
                  to={`/flags/${getCountrySlug(parentCountry)}`}
                  className="flex flex-col items-center gap-1 min-w-0 flex-1 hover:bg-retro-accent/20 p-2 -m-2 transition-colors"
                >
                  <span className="text-5xl sm:text-6xl leading-none">{getFlagEmoji(territory.sovereignCode)}</span>
                  <span className="font-body text-base text-retro-text text-center truncate max-w-full">
                    {territory.sovereignName}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-wide text-retro-text-secondary/70">
                    Sovereign
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                  <span className="text-5xl sm:text-6xl leading-none">{getFlagEmoji(territory.sovereignCode)}</span>
                  <span className="font-body text-base text-retro-text text-center truncate max-w-full">
                    {territory.sovereignName}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-wide text-retro-text-secondary/70">
                    Sovereign
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About This Flag (description + colors/patterns) */}
        <AboutThisFlag description={description} features={features} />

        {/* Bordering */}
        {facts?.borders && facts.borders.length > 0 && (
          <BorderingCountries borderCodes={facts.borders} />
        )}

        {/* Fun Facts */}
        {description?.funFacts && description.funFacts.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Fun Facts</h2>
            <ul className="list-disc pl-5 space-y-4 marker:text-retro-text-secondary">
              {description.funFacts.map((fact, i) => (
                <li key={i} className="font-body text-retro-text-secondary leading-relaxed pl-1">{fact}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Similar Flags */}
        {similarEntries.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Similar looking flags</h2>
            <p className="font-body text-retro-text-secondary mb-3">
              These flags share similar colors and patterns — can you tell them apart?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similarEntries.map((entry) => (
                <Link
                  key={entry.code}
                  to={entry.href}
                  className="flex items-center gap-2 border border-retro-border/40 hover:border-retro-border p-2 hover:bg-retro-accent/30 transition-colors"
                >
                  <span className="text-5xl">{getFlagEmoji(entry.code)}</span>
                  <span className="flex-1 font-body text-base text-retro-text">
                    {entry.name}
                    {entry.kind === 'territory' && (
                      <span className="ml-1 font-body text-[10px] text-retro-text-secondary/70 uppercase">· Territory</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sibling territories */}
        {siblings.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              Other {getCountryAdjective(territory.sovereignCode, territory.sovereignName)} Territories ({siblings.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {siblings.map((t) => (
                <Link
                  key={t.code}
                  to={`/flags/territories/${getTerritorySlug(t)}`}
                  className="flex flex-col items-center gap-1 p-2 border border-retro-border/40 hover:border-retro-border hover:bg-retro-accent/30 transition-colors"
                >
                  <span className="text-5xl">{getFlagEmoji(t.code)}</span>
                  <span className="font-body text-base text-retro-text text-center">
                    {t.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Continent peers (countries + territories mixed) */}
        {continentPeers.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              More {territory.continent} Flags
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {continentPeers.map((peer) => (
                <Link
                  key={peer.code}
                  to={peer.href}
                  className="flex flex-col items-center gap-1 p-2 border border-retro-border/40 hover:border-retro-border hover:bg-retro-accent/30 transition-colors"
                >
                  <span className="text-5xl">{getFlagEmoji(peer.code)}</span>
                  <span className="font-body text-base text-retro-text text-center">{peer.name}</span>
                  {peer.kind === 'territory' && (
                    <span className="font-body text-[10px] text-retro-text-secondary/70 uppercase">Territory</span>
                  )}
                </Link>
              ))}
            </div>
            <Link
              to={`/flags/continent/${getContinentSlug(territory.continent)}`}
              className="block mt-3 font-body text-sm text-retro-neon-blue underline text-center"
            >
              View all {territory.continent} flags →
            </Link>
          </section>
        )}

        <QuizCTA />

        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags/territories" className="font-body text-sm text-retro-neon-blue underline">All Territories</Link>
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </nav>
      </div>
    </div>
  );
}
