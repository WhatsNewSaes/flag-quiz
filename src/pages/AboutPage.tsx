import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="About Us - Flag Arcade"
        description="Flag Arcade is a father-and-son project built to share a love for country flags with the world. Learn flags, geography, and have fun!"
        canonical="https://flagarcade.com/about"
      />

      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 md:p-10">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-6 text-center">
            About Flag Arcade
          </h1>

          <div className="space-y-4 font-body text-sm md:text-base text-retro-text-secondary leading-relaxed">
            <p>
              Flag Arcade started as a simple idea between a father and his son Abel. Abel has always had a fascination with country flags — he could name them before he could tie his shoes. We wanted to take that love and turn it into something the whole world could enjoy.
            </p>

            <p>
              What began as a weekend project quickly grew into a full game with six different modes, 197 countries, and a lot of pixel art. The goal has always been the same: make learning about flags, countries, and geography genuinely fun and accessible for everyone — whether you're a kid just getting curious about the world or an adult who wants to finally tell Chad and Romania apart.
            </p>

            <p>
              Flag Arcade is completely free, with no ads and no sign-up required. We built it because we believe learning should feel like play, and we hope it brings you as much joy as it brought us to make.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-retro-border/20 text-center">
            <p className="font-retro text-xs text-retro-text mb-4">Built with fun by a dad & his flag-obsessed kid.</p>
            <Link
              to="/play"
              className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-6 py-3 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
            >
              Play Flag Arcade
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-retro-border/20 text-center space-x-4">
            <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
            <Link to="/patterns" className="font-body text-sm text-retro-neon-blue underline">Patterns</Link>
            <Link to="/organizations" className="font-body text-sm text-retro-neon-blue underline">Organizations</Link>
            <Link to="/religions" className="font-body text-sm text-retro-neon-blue underline">Religions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
