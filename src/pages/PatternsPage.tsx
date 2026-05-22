import { Link } from 'react-router-dom';
import { flagPatternInfos } from '../data/flagPatterns';
import { countries } from '../data/countries';
import { flagFeatures } from '../data/flagFeatures';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';

function countFlagsForPattern(pattern: string): number {
  return countries.filter((c) => flagFeatures[c.code]?.patterns.includes(pattern as never)).length;
}

export function PatternsPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flag Design Patterns - Stripes, Crosses & More | Flag Arcade"
        description="Browse country flags by design pattern — horizontal and vertical stripes, crosses, diagonals, cantons, solid fields, and complex designs."
        canonical="https://flagarcade.com/patterns"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Patterns' },
        ]} />

        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-3">Flag Design Patterns</h1>
          <p className="font-body text-retro-text-secondary leading-relaxed">
            Almost every national flag in the world fits into one of seven structural patterns. Stripes,
            crosses, and cantons are the visual building blocks of vexillology — and once you can spot them,
            you can read any flag at a glance. Browse the patterns below to see which countries share each
            design family.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {flagPatternInfos.map((info) => {
            const count = countFlagsForPattern(info.pattern);
            return (
              <Link
                key={info.slug}
                to={`/flags/${info.slug}`}
                className="block bg-retro-surface border-2 border-retro-border shadow-pixel p-5 hover:bg-retro-accent/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl flex-shrink-0 mt-1 leading-none" aria-hidden="true">
                    {info.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h2 className="font-retro text-sm text-retro-text">{info.name}</h2>
                      <span className="font-body text-xs text-retro-text-secondary bg-retro-accent/40 border border-retro-border px-2 py-0.5">
                        {count} {count === 1 ? 'flag' : 'flags'}
                      </span>
                    </div>
                    <p className="font-body text-sm text-retro-text-secondary mt-2 leading-relaxed">
                      {info.shortDescription}
                    </p>
                    <p className="font-body text-sm text-retro-text-secondary mt-2 leading-relaxed">
                      {info.longDescription}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <QuizCTA
          heading="Test Your Pattern Knowledge"
          message="Can you spot the canton, the cross, or the diagonal at a glance? Try our flag quiz with 197 countries."
        />

        <div className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/organizations" className="font-body text-sm text-retro-neon-blue underline">Organizations</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </div>
      </div>
    </div>
  );
}
