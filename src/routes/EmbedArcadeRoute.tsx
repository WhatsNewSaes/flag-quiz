import { ArcadeScreen } from '../screens/ArcadeScreen';
import { SEOHead } from '../components/seo/SEOHead';

export function EmbedArcadeRoute() {
  return (
    <>
      <SEOHead
        title="Flag Arcade — Embedded Quiz"
        description="An embedded flag-guessing quiz from flagarcade.com."
        noindex
      />
      <div className="h-dvh bg-retro-bg flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0">
          <ArcadeScreen embedded />
        </div>
        <a
          href="https://flagarcade.com/play/modes?utm_source=embed&utm_medium=iframe&utm_campaign=arcade"
          target="_blank"
          rel="noopener"
          className="block flex-shrink-0 bg-retro-surface border-t-2 border-retro-border px-3 py-2 text-center font-body text-xs text-retro-text hover:bg-retro-accent/30 transition-colors"
        >
          Play more flag games at{' '}
          <span className="font-retro text-retro-neon-blue">flagarcade.com</span>{' '}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </>
  );
}
