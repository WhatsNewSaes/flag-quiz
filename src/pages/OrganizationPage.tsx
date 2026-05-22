import { useParams, Link, Navigate } from 'react-router-dom';
import { findOrgBySlug, organizations } from '../data/organizations';
import { organizationMembers } from '../data/organizationMembers';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { JsonLd, breadcrumbListSchema } from '../components/seo/JsonLd';
import { pickWithinLimit, TITLE_MAX, DESCRIPTION_MAX } from '../utils/seo';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

export function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const org = findOrgBySlug(slug || '');

  if (!org) {
    return <Navigate to="/organizations" replace />;
  }

  const memberCodes = organizationMembers[org.slug] || [];
  const memberCountries = memberCodes
    .map((code) => countries.find((c) => c.code === code))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name));

  // Find other organizations to link to
  const otherOrgs = organizations.filter((o) => o.slug !== org.slug);

  const pageTitle = pickWithinLimit([
    `${org.name} (${org.abbreviation}) - Member Flags & Info | Flag Arcade`,
    `${org.name} (${org.abbreviation}) - Member Flags | Flag Arcade`,
    `${org.abbreviation} Member Flags & Info | Flag Arcade`,
    `${org.abbreviation} Member Flags | Flag Arcade`,
  ], TITLE_MAX);
  const pageDescription = pickWithinLimit([
    `Flags of all ${memberCountries.length} ${org.abbreviation} (${org.name}) member countries, with details on each nation's flag and membership.`,
    `Flags of all ${memberCountries.length} ${org.abbreviation} member countries — ${org.name}. See each nation's flag and details.`,
    `Flags of all ${memberCountries.length} ${org.abbreviation} member countries. See each nation's flag and details.`,
  ], DESCRIPTION_MAX);

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://flagarcade.com/organizations/${org.slug}`}
      />
      <JsonLd
        id="breadcrumbs"
        data={breadcrumbListSchema([
          { name: 'Home', url: '/' },
          { name: 'Organizations', url: '/organizations' },
          { name: org.abbreviation, url: `/organizations/${org.slug}` },
        ])}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Organizations', href: '/organizations' },
          { label: org.abbreviation },
        ]} />

        {/* Header */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <div className="flex items-start gap-4">
            <img
              src={`/flag-images/flag-${org.slug}.svg`}
              alt={`Flag of ${org.name}`}
              className="w-24 h-16 object-contain flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="font-retro text-lg md:text-xl text-retro-text">{org.name}</h1>
                <span className="font-body text-xs text-retro-text-secondary bg-retro-accent/40 border border-retro-border px-2 py-0.5">
                  {org.abbreviation}
                </span>
              </div>
              <p className="font-body text-sm text-retro-text-secondary mt-3 leading-relaxed">
                {org.description}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
                <span className="font-body text-xs text-retro-text-secondary">
                  <strong>Founded:</strong> {org.founded}
                </span>
                <span className="font-body text-xs text-retro-text-secondary">
                  <strong>HQ:</strong> {org.headquarters}
                </span>
                <span className="font-body text-xs text-retro-text-secondary">
                  <strong>Members:</strong> {org.members}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member flags grid */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-sm text-retro-text mb-4">
            Flags of {org.abbreviation} Members ({memberCountries.length})
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {memberCountries.map((country) => (
              <Link
                key={country!.code}
                to={`/flags/${getCountrySlug(country!)}`}
                className="flex flex-col items-center gap-1.5 p-3 border border-retro-border/30 hover:bg-retro-accent/20 hover:border-retro-border transition-colors"
              >
                <span className="text-5xl">{getFlagEmoji(country!.code)}</span>
                <span className="font-body text-xs text-retro-text text-center leading-tight">
                  {country!.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <QuizCTA
          heading="Test Your Flag Knowledge"
          message={`Can you identify the flags of ${org.abbreviation} member nations? Try our quiz!`}
        />

        {/* Other organizations */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-sm text-retro-text mb-3">Other Organizations</h2>
          <div className="flex flex-wrap gap-2">
            {otherOrgs.map((o) => (
              <Link
                key={o.slug}
                to={`/organizations/${o.slug}`}
                className="font-body text-xs border border-retro-border/40 hover:border-retro-border px-3 py-1.5 bg-white hover:bg-retro-accent/30 transition-colors flex items-center gap-2"
              >
                <img
                  src={`/flag-images/flag-${o.slug}.svg`}
                  alt=""
                  className="w-5 h-3.5 object-contain"
                  loading="lazy"
                />
                {o.abbreviation}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/organizations" className="font-body text-sm text-retro-neon-blue underline">All Organizations</Link>
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
