import { Link } from 'react-router-dom';
import type { FlagDescription } from '../data/flagDescriptions';
import type { FlagFeatures } from '../data/flagFeatures';
import { splitIntoParagraphs } from '../utils/splitParagraphs';

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

const patternLinks: Record<string, { href: string; emoji: string }> = {
  'horizontal-stripes': { href: '/flags/horizontal-stripes', emoji: '☰' },
  'vertical-stripes': { href: '/flags/vertical-stripes', emoji: '▐░▌' },
  'cross': { href: '/flags/with-crosses', emoji: '✚' },
  'diagonal': { href: '/flags/diagonal-designs', emoji: '◣' },
  'canton': { href: '/flags/canton-designs', emoji: '◲' },
};

interface AboutThisFlagProps {
  description?: FlagDescription;
  features?: FlagFeatures;
}

export function AboutThisFlag({ description, features }: AboutThisFlagProps) {
  if (!description && !features) return null;

  const linkedPatterns = features?.patterns.filter((p) => patternLinks[p]) ?? [];
  const unlinkedPatterns = features?.patterns.filter((p) => !patternLinks[p]) ?? [];

  return (
    <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
      <h2 className="font-retro text-sm mb-3 text-retro-text">About This Flag</h2>
      {description && (
        <>
          <div className="space-y-3">
            {splitIntoParagraphs(description.description).map((para, i) => (
              <p key={i} className="font-body text-retro-text-secondary leading-relaxed">{para}</p>
            ))}
          </div>
          {description.meaning && (
            <div className="mt-4 border-l-4 border-retro-neon-blue bg-retro-accent/20 p-4">
              <h3 className="font-retro text-xs mb-2 text-retro-text">What the colors & design mean</h3>
              <p className="font-body text-sm text-retro-text-secondary leading-relaxed">{description.meaning}</p>
            </div>
          )}
        </>
      )}
      {features && (
        <div className={description ? 'mt-4' : ''}>
          <div className="flex flex-wrap gap-2 mb-2">
            {features.colors.map((color) => (
              <Link
                key={color}
                to={`/flags/with-${color}`}
                className="flex items-center gap-2 font-body border border-retro-border/40 hover:border-retro-border px-2 py-1 hover:bg-retro-accent/30 transition-colors"
              >
                <span
                  className="w-5 h-5 border border-retro-border inline-block"
                  style={{ backgroundColor: colorHex[color] || '#ccc' }}
                />
                <span className="capitalize">{color}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedPatterns.map((p) => {
              const link = patternLinks[p];
              const label = patternLabels[p] || p;
              return (
                <Link
                  key={p}
                  to={link.href}
                  className="inline-flex items-center gap-2 font-body border border-retro-border/40 hover:border-retro-border px-2 py-1 hover:bg-retro-accent/30 transition-colors"
                >
                  <span>{link.emoji}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
            {unlinkedPatterns.map((p) => (
              <span
                key={p}
                className="inline-flex items-center font-body border border-retro-border/40 px-2 py-1 text-retro-text-secondary"
              >
                {patternLabels[p] || p}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
