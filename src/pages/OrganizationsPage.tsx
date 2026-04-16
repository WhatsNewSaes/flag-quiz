import { Link } from 'react-router-dom';
import { organizations } from '../data/organizations';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

export function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="International Organization Flags - UN, EU, NATO & More | Flag Arcade"
        description="Explore flags and details of major international organizations including the United Nations, European Union, NATO, African Union, ASEAN, and more."
        canonical="https://flagarcade.com/organizations"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Organizations' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">International Organizations</h1>
          <p className="font-body text-retro-text-secondary mb-1">
            Flags and details of {organizations.length} major international organizations from around the world.
          </p>
        </div>

        {/* Organization cards */}
        <div className="mt-4 space-y-3">
          {organizations.map((org) => (
            <Link
              key={org.slug}
              to={`/organizations/${org.slug}`}
              className="block bg-retro-surface border-2 border-retro-border shadow-pixel p-5 hover:bg-retro-accent/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <img
                  src={`/flag-images/flag-${org.slug}.svg`}
                  alt={`Flag of ${org.name}`}
                  className="w-20 h-14 object-contain flex-shrink-0 mt-1"
                  loading="lazy"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="font-retro text-sm text-retro-text">{org.name}</h2>
                    <span className="font-body text-xs text-retro-text-secondary bg-retro-accent/40 border border-retro-border px-2 py-0.5">
                      {org.abbreviation}
                    </span>
                  </div>

                  <p className="font-body text-sm text-retro-text-secondary mt-2 leading-relaxed">
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
            </Link>
          ))}
        </div>

        <QuizCTA
          heading="Test Your Flag Knowledge"
          message="Can you identify the flags of UN member nations? Try our quiz with flags from 197 countries!"
        />

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/flags/emoji" className="font-body text-sm text-retro-neon-blue underline">Emoji Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
