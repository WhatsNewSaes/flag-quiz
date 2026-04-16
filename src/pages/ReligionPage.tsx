import { useParams, Link, Navigate } from 'react-router-dom';
import { findReligionBySlug, getCountriesForReligion } from '../data/religions';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';

export function ReligionPage() {
  const { slug } = useParams<{ slug: string }>();
  const religion = findReligionBySlug(slug || '');

  if (!religion) {
    return <Navigate to="/" replace />;
  }

  const adherents = getCountriesForReligion(religion);

  const pageTitle = `${religion.name} - Countries & Beliefs | Flag Arcade`;
  const pageDescription = `Learn about ${religion.name} and see the flags of the ${adherents.length} countries where it's practiced, ranked by share of population.`;

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/religions/${religion.slug}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: religion.name },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text">{religion.name}</h1>
          <p className="font-body text-sm text-retro-text-secondary mt-3 leading-relaxed">
            {religion.blurb}
          </p>
        </div>

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-sm text-retro-text mb-4">
            Countries by {religion.name} Population ({adherents.length})
          </h2>
          {adherents.length === 0 ? (
            <p className="font-body text-sm text-retro-text-secondary">
              No countries currently report {religion.name} adherence in our data set.
            </p>
          ) : (
            <ol className="space-y-2">
              {adherents.map((a, i) => {
                const country = countries.find((c) => c.code === a.code);
                if (!country) return null;
                return (
                  <li key={a.code}>
                    <Link
                      to={`/flags/${getCountrySlug(country)}`}
                      className="flex items-center gap-3 p-2 border border-retro-border/30 hover:bg-retro-accent/20 hover:border-retro-border transition-colors"
                    >
                      <span className="font-retro text-xs text-retro-text-secondary w-6 text-right">{i + 1}.</span>
                      <span className="text-3xl">{getFlagEmoji(country.code)}</span>
                      <span className="font-body text-sm text-retro-text flex-1">{country.name}</span>
                      <span className="font-body text-sm text-retro-text-secondary tabular-nums">{a.percent}%</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          {religion.undercount && adherents.length > 0 && (
            <p className="font-body text-xs text-retro-text-secondary mt-4 pt-3 border-t border-retro-border/30 leading-relaxed">
              <strong>Note:</strong> This list reflects only countries where the CIA World Factbook — our data source — explicitly uses the &ldquo;{religion.name}&rdquo; label. Adherents in many other countries are rolled into broader buckets such as Protestant, Evangelical, or country-specific denominations, so this ranking undercounts global presence.
            </p>
          )}
        </div>

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/religions" className="font-body text-sm text-retro-neon-blue underline">All Religions</Link>
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
