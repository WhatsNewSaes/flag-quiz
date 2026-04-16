import { Link } from 'react-router-dom';
import { religions, getCountriesForReligion } from '../data/religions';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';

export function ReligionsIndexPage() {
  const entries = religions
    .map((r) => ({ religion: r, count: getCountriesForReligion(r).length }))
    .sort((a, b) => a.religion.name.localeCompare(b.religion.name));

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="World Religions - Countries & Beliefs | Flag Arcade"
        description="Browse the world's major religions and see the countries where each is practiced. Factual overviews of Christianity, Islam, Hinduism, Buddhism, Judaism, and more."
        canonical="https://flagarcade.com/religions"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Religions' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-3">World Religions</h1>
          <p className="font-body text-retro-text-secondary leading-relaxed">
            Every flag carries the story of the people who fly it — and religion is often a big part of
            that story. Browse the major faiths below for a factual overview and a ranked list of the
            countries where each tradition is most widely practiced.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {entries.map(({ religion, count }) => (
            <Link
              key={religion.slug}
              to={`/religions/${religion.slug}`}
              className="block bg-retro-surface border-2 border-retro-border shadow-pixel p-4 hover:bg-retro-accent/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0 leading-none" aria-hidden="true">
                  {religion.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="font-retro text-sm text-retro-text">{religion.name}</h2>
                    <span className="font-body text-xs text-retro-text-secondary bg-retro-accent/40 border border-retro-border px-2 py-0.5">
                      {count} {count === 1 ? 'country' : 'countries'}
                    </span>
                  </div>
                  <p className="font-body text-sm text-retro-text-secondary mt-2 leading-relaxed">
                    {religion.tagline}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
