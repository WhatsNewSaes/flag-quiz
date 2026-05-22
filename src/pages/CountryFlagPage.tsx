import { useParams, Link } from 'react-router-dom';
import { flagFeatures, getSimilarFlags } from '../data/flagFeatures';
import { getTerritoriesBySovereign, getTerritorySlug } from '../data/territories';
import { organizations } from '../data/organizations';
import { organizationMembers } from '../data/organizationMembers';
import { getFlagEmoji } from '../utils/flagEmoji';
import { findCountryBySlug, getCountrySlug, getContinentSlug } from '../utils/slugify';
import { allFlagCodes, flagEntriesByContinent, resolveFlagEntry } from '../utils/flagEntry';
import { SEOHead } from '../components/seo/SEOHead';
import { JsonLd, breadcrumbListSchema } from '../components/seo/JsonLd';
import { pickWithinLimit, TITLE_MAX } from '../utils/seo';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';
import { QuickFacts } from '../components/QuickFacts';
import { AboutThisFlag } from '../components/AboutThisFlag';
import { BorderingCountries } from '../components/BorderingCountries';
import { FlagActions } from '../components/FlagActions';
import { useCountryFacts, useFlagDescription } from '../hooks/useCountryData';
import { getCountryAdjective } from '../utils/adjective';

export function CountryFlagPage() {
  const { slug } = useParams<{ slug: string }>();
  const country = findCountryBySlug(slug || '');
  const description = useFlagDescription(country?.code);
  const facts = useCountryFacts(country?.code);

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
  const emoji = getFlagEmoji(country.code);
  const countrySlug = getCountrySlug(country);
  const flagFilename = `flag-${countrySlug}.svg`;
  const similarCodes = features ? getSimilarFlags(country.code, allFlagCodes()) : [];
  const similarEntries = similarCodes
    .map(resolveFlagEntry)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .slice(0, 5);
  const continentPeers = flagEntriesByContinent(country.continent, country.code).slice(0, 8);
  const countryTerritories = getTerritoriesBySovereign(country.code);
  const countryOrgs = organizations.filter((org) => {
    const members = organizationMembers[org.slug];
    return members?.includes(country.code);
  });

  const pageTitle = pickWithinLimit([
    `${country.name} Flag - Colors, Meaning & History | Flag Arcade`,
    `${country.name} Flag - Meaning & History | Flag Arcade`,
    `${country.name} Flag | Flag Arcade`,
  ], TITLE_MAX);
  const pageDescription = `Learn about the flag of ${country.name} — colors, meaning, and history. Then test your knowledge in our free flag quiz.`;

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/flags/${getCountrySlug(country)}`}
        ogImage={`https://flagarcade.com/og/${getCountrySlug(country)}.jpg`}
      />
      <JsonLd
        id="breadcrumbs"
        data={breadcrumbListSchema([
          { name: 'Home', url: '/' },
          { name: 'Flags', url: '/flags' },
          { name: country.continent, url: `/flags/continent/${getContinentSlug(country.continent)}` },
          { name: country.name, url: `/flags/${getCountrySlug(country)}` },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          {
            label: country.continent,
            href: `/flags/continent/${getContinentSlug(country.continent)}`,
            dropdown: (['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const)
              .filter((c) => c !== country.continent)
              .map((c) => ({ label: c, href: `/flags/continent/${getContinentSlug(c)}` })),
          },
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
          <FlagActions
            emoji={emoji}
            flagFilename={flagFilename}
            countryName={country.name}
            hasDownloadable={true}
          />
        </div>

        {/* Quick Facts */}
        {facts && (
          <QuickFacts facts={facts} flagAdopted={description?.adopted} />
        )}

        {/* About This Flag */}
        <AboutThisFlag description={description ?? undefined} features={features} />

        {/* Bordering countries */}
        {facts?.borders && facts.borders.length > 0 && (
          <BorderingCountries borderCodes={facts.borders} />
        )}

        {/* Fun Facts */}
        {description?.funFacts && description.funFacts.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">Fun Facts</h2>
            <ul className="list-disc pl-5 space-y-4 marker:text-retro-text-secondary">
              {description.funFacts.map((fact: string, i: number) => (
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

        {/* Territories */}
        {countryTerritories.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              {getCountryAdjective(country.code, country.name)} Territories ({countryTerritories.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {countryTerritories.map((t) => (
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

        {/* More from continent (countries + territories mixed) */}
        {continentPeers.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              More {country.continent} Flags
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
              to={`/flags/continent/${getContinentSlug(country.continent)}`}
              className="block mt-3 font-body text-sm text-retro-neon-blue underline text-center"
            >
              View all {country.continent} flags →
            </Link>
          </section>
        )}


        {/* Organizations */}
        {countryOrgs.length > 0 && (
          <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
            <h2 className="font-retro text-sm mb-3 text-retro-text">
              International Organizations ({countryOrgs.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {countryOrgs.map((org) => (
                <Link
                  key={org.slug}
                  to={`/organizations/${org.slug}`}
                  className="flex items-center gap-2 font-body text-sm border border-retro-border/40 hover:border-retro-border px-3 py-1.5 hover:bg-retro-accent/30 transition-colors"
                >
                  <span>{org.emoji}</span>
                  <span>{org.abbreviation}</span>
                </Link>
              ))}
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
