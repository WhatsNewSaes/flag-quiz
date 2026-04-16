import { useParams, Link } from 'react-router-dom';
import { countries, type Country } from '../data/countries';
import { flagFeatures, type FlagColor, type FlagPattern } from '../data/flagFeatures';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { QuizCTA } from '../components/QuizCTA';

interface ContentPageConfig {
  title: string;
  h1: string;
  description: string;
  intro: string;
  getCountries: () => Country[];
}

const colorPages: [string, ContentPageConfig][] = (
  [
    ['red', 'Red'],
    ['blue', 'Blue'],
    ['green', 'Green'],
    ['yellow', 'Yellow'],
    ['white', 'White'],
    ['black', 'Black'],
    ['orange', 'Orange'],
  ] as const
).map(([color, label]) => [
  `with-${color}`,
  {
    title: `Flags with ${label} - Country Flags Featuring ${label} | Flag Arcade`,
    h1: `Flags with ${label}`,
    description: `Browse all country flags that feature the color ${color}. See which nations use ${color} in their flag and learn why.`,
    intro: `These country flags all feature the color ${color} prominently in their design. Explore each flag to learn about its colors, meaning, and history.`,
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.colors.includes(color as FlagColor)),
  },
]);

const patternPages: [string, ContentPageConfig][] = (
  [
    ['horizontal-stripes', 'horizontal-stripes', 'Horizontal Stripes'],
    ['vertical-stripes', 'vertical-stripes', 'Vertical Stripes'],
    ['with-crosses', 'cross', 'Crosses'],
    ['diagonal-designs', 'diagonal', 'Diagonal Designs'],
    ['canton-designs', 'canton', 'Canton Designs'],
  ] as const
).map(([slug, pattern, label]) => [
  slug,
  {
    title: `Flags with ${label} - ${label} Flag Designs | Flag Arcade`,
    h1: `Flags with ${label}`,
    description: `Browse all country flags featuring ${label.toLowerCase()} in their design. Compare flags that share similar patterns.`,
    intro: `These country flags all use a ${label.toLowerCase()} pattern. Many flags around the world share this design element — can you tell them apart?`,
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.pattern === (pattern as FlagPattern)),
  },
]);

const specialPages: [string, ContentPageConfig][] = [
  [
    'hardest-flags',
    {
      title: 'Hardest Flags to Identify - Most Difficult Country Flags | Flag Arcade',
      h1: 'Hardest Flags to Identify',
      description: "Think you know your flags? These are the hardest country flags to identify. Most players can't get them all right. See how many you know!",
      intro: "These flags are rated as the most difficult to identify. They're the ones that trip up even experienced flag enthusiasts. How many can you get right?",
      getCountries: () => countries.filter((c) => c.difficulty >= 4).sort((a, b) => b.difficulty - a.difficulty),
    },
  ],
  [
    'easiest-flags',
    {
      title: 'Easiest Flags to Identify - Most Recognizable Country Flags | Flag Arcade',
      h1: 'Easiest Flags to Identify',
      description: 'Start with the easiest flags! These are the most recognizable country flags in the world. Perfect for beginners learning world flags.',
      intro: "These are the most recognizable flags in the world. If you're just starting to learn flags, begin here — you probably already know most of these!",
      getCountries: () => countries.filter((c) => c.difficulty <= 2).sort((a, b) => a.difficulty - b.difficulty),
    },
  ],
  [
    'red-white-and-blue-flags',
    {
      title: 'Red, White, and Blue Flags - Countries with Red White Blue Flags | Flag Arcade',
      h1: 'Red, White, and Blue Flags',
      description: 'Which countries have red, white, and blue flags? Browse all flags featuring this popular color combination and learn what the colors represent.',
      intro: 'Red, white, and blue is one of the most popular color combinations in national flags. These countries all feature this classic trio — but can you tell them apart?',
      getCountries: () =>
        countries.filter((c) => {
          const f = flagFeatures[c.code];
          return f && f.colors.includes('red') && f.colors.includes('white') && f.colors.includes('blue');
        }),
    },
  ],
  [
    'similar-looking-flags',
    {
      title: 'Flags That Look Alike - Similar Country Flags | Flag Arcade',
      h1: 'Flags That Look Alike',
      description: 'Many country flags look surprisingly similar! Explore flags that share the same colors and patterns. Can you tell them apart?',
      intro: 'Did you know many countries have nearly identical flags? These flags share similar colors and patterns, making them easy to confuse. Learning the subtle differences is the key to mastering flag identification.',
      getCountries: () =>
        countries.filter((c) => {
          const f = flagFeatures[c.code];
          return f && f.colors.includes('green') && f.colors.includes('yellow') && f.colors.includes('red');
        }),
    },
  ],
];

const CONTENT_PAGES = new Map<string, ContentPageConfig>([
  ...colorPages,
  ...patternPages,
  ...specialPages,
]);

export function ContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? CONTENT_PAGES.get(slug) : undefined;

  if (!config) {
    return (
      <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel p-8 text-center">
          <h1 className="font-retro text-xl mb-4">Page Not Found</h1>
          <Link to="/flags" className="font-retro text-sm text-retro-neon-blue underline">
            Browse All Flags
          </Link>
        </div>
      </div>
    );
  }

  const matchedCountries = config.getCountries();

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title={config.title}
        description={config.description}
        canonical={`https://flagarcade.com/flags/${slug}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="px-4 py-2 font-body text-sm text-retro-text-secondary">
          <ol className="flex flex-wrap items-center gap-1">
            <li className="flex items-center gap-1">
              <Link to="/" className="underline hover:text-retro-text">Home</Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <Link to="/flags" className="underline hover:text-retro-text">Flags</Link>
            </li>
            <li className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              <span className="text-retro-text">{config.h1}</span>
            </li>
          </ol>
        </nav>

        {/* Header card */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-2">{config.h1}</h1>
          <p className="font-body text-retro-text-secondary mb-3">{config.intro}</p>
          <p className="font-body text-sm text-retro-text-secondary">
            {matchedCountries.length} {matchedCountries.length === 1 ? 'flag' : 'flags'}
          </p>
        </div>

        {/* Flag grid */}
        <section className="bg-retro-surface border-2 border-retro-border shadow-pixel p-5 mt-4">
          <h2 className="font-retro text-xs mb-3 text-retro-text">
            All Flags ({matchedCountries.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {matchedCountries.map((country) => (
              <Link
                key={country.code}
                to={`/flags/${getCountrySlug(country)}`}
                className="flex items-center gap-2 p-2 border border-retro-border hover:bg-retro-accent/30 transition-colors"
              >
                <span className="text-5xl flex-shrink-0">{getFlagEmoji(country.code)}</span>
                <span className="font-body text-base text-retro-text">{country.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <QuizCTA />

        <nav className="mt-6 pb-8 text-center space-x-4">
          <Link to="/flags" className="font-body text-sm text-retro-neon-blue underline">All Flags</Link>
          <Link to="/quiz" className="font-body text-sm text-retro-neon-blue underline">Flag Quiz</Link>
        </nav>
      </div>
    </div>
  );
}
