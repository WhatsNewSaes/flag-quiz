import { Link } from 'react-router-dom';
import { countries, continents } from '../data/countries';
import { getContinentSlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';

const quizModes = [
  {
    name: 'Journey Mode',
    description: 'Progress through worlds of increasing difficulty. Earn stars and unlock achievements.',
    emoji: '🗺️',
  },
  {
    name: 'Arcade Mode',
    description: 'Free play with all flags. Choose your difficulty and continent. No pressure, just fun.',
    emoji: '🕹️',
  },
  {
    name: 'Around the World',
    description: 'Race through flags from every continent. How many can you get right in one run?',
    emoji: '🌍',
  },
  {
    name: 'Jeopardy Mode',
    description: 'Answer-first format. See the country name and pick the correct flag. Five difficulty levels.',
    emoji: '❓',
  },
  {
    name: 'Presentation Mode',
    description: 'Perfect for classrooms and groups. Display flags on the big screen and quiz together.',
    emoji: '📺',
  },
  {
    name: 'Flag Runner',
    description: 'A pixel-art platformer game where you collect flags while running and jumping.',
    emoji: '🏃',
  },
];

export function QuizLandingPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flag Quiz - Free Online Flag Guessing Game | Flag Arcade"
        description="Play the ultimate free flag quiz! Guess flags from 197 countries across 6 game modes. Journey mode, arcade, jeopardy, and more. Learn world flags the fun way!"
        canonical="https://flagarcade.com/quiz"
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flag Quiz' },
        ]} />

        {/* Hero */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4 text-center">
          <div className="text-5xl mb-4">🏳️ 🌍 🏴</div>
          <h1 className="font-retro text-lg md:text-2xl text-retro-text mb-3">
            Flag Quiz
          </h1>
          <p className="font-body text-retro-text-secondary max-w-xl mx-auto mb-6">
            Test your knowledge of world flags! With {countries.length} countries across {continents.length} continents,
            Flag Arcade is the most fun way to learn flags from around the globe.
          </p>
          <Link
            to="/play"
            className="inline-block font-retro text-sm bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-8 py-4 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
          >
            Play Now — It's Free!
          </Link>
        </div>

        {/* Game Modes */}
        <section className="mt-6">
          <h2 className="font-retro text-sm text-retro-text mb-4 px-1">Game Modes</h2>
          <div className="grid gap-3">
            {quizModes.map((mode) => (
              <div
                key={mode.name}
                className="bg-retro-surface border-2 border-retro-border shadow-pixel p-4 flex items-start gap-4"
              >
                <span className="text-3xl flex-shrink-0">{mode.emoji}</span>
                <div>
                  <h3 className="font-retro text-xs text-retro-text mb-1">{mode.name}</h3>
                  <p className="font-body text-sm text-retro-text-secondary">{mode.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What you'll learn */}
        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-6">
          <h2 className="font-retro text-sm mb-3 text-retro-text">What You'll Learn</h2>
          <ul className="space-y-2 font-body text-sm text-retro-text-secondary">
            <li>• Identify flags from all {continents.length} continents</li>
            <li>• Recognize flag patterns: stripes, crosses, cantons, and more</li>
            <li>• Tell apart similar-looking flags (Italy vs. Ireland, anyone?)</li>
            <li>• Discover the meaning behind flag colors and symbols</li>
            <li>• Learn geography while having fun</li>
          </ul>
        </section>

        {/* Quiz by continent */}
        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-sm mb-3 text-retro-text">Quiz by Continent</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {continents.map((continent) => {
              const count = countries.filter((c) => c.continent === continent).length;
              return (
                <Link
                  key={continent}
                  to={`/quiz/${getContinentSlug(continent)}`}
                  className="border border-retro-border p-3 text-center hover:bg-retro-accent/30 transition-colors"
                >
                  <p className="font-retro text-xs text-retro-text">{continent}</p>
                  <p className="font-body text-xs text-retro-text-secondary mt-1">{count} flags</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-sm mb-4 text-retro-text">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-body font-bold text-sm text-retro-text">Is Flag Arcade free?</h3>
              <p className="font-body text-sm text-retro-text-secondary mt-1">
                Yes! Flag Arcade is completely free to play with no ads.
              </p>
            </div>
            <div>
              <h3 className="font-body font-bold text-sm text-retro-text">How many flags are in the quiz?</h3>
              <p className="font-body text-sm text-retro-text-secondary mt-1">
                Flag Arcade includes flags from all {countries.length} recognized countries across {continents.length} continents.
              </p>
            </div>
            <div>
              <h3 className="font-body font-bold text-sm text-retro-text">Can I play on my phone?</h3>
              <p className="font-body text-sm text-retro-text-secondary mt-1">
                Yes! Flag Arcade works on any device — phone, tablet, or desktop. Native iOS and Android apps are also available.
              </p>
            </div>
            <div>
              <h3 className="font-body font-bold text-sm text-retro-text">Is this good for classrooms?</h3>
              <p className="font-body text-sm text-retro-text-secondary mt-1">
                Absolutely! Presentation Mode is designed specifically for teachers and classroom use.
              </p>
            </div>
          </div>
        </section>

        {/* Browse flags link */}
        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">Browse All Flags</Link>
          <Link to="/play" className="font-body text-sm text-retro-neon-blue underline">Play Now</Link>
        </nav>
      </div>
    </div>
  );
}
