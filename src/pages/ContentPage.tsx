import { useParams, Link } from 'react-router-dom';
import { countries, type Country } from '../data/countries';
import { flagFeatures, type FlagColor, type FlagPattern } from '../data/flagFeatures';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug } from '../utils/slugify';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { QuizCTA } from '../components/QuizCTA';
import { splitIntoParagraphs } from '../utils/splitParagraphs';

interface ContentPageConfig {
  title: string;
  h1: string;
  description: string;
  intro: string;
  body?: string;
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

const patternBodies: Partial<Record<string, string>> = {
  'horizontal-stripes':
    "The horizontal tricolor is the single most common flag design on Earth. Its modern career began with the Dutch Statenvlag in the 1570s — orange, white, and blue bands that signaled rebellion against Spanish rule and later evolved into the red-white-blue Prinsenvlag still used today. Russia adopted a Dutch-style tricolor under Peter the Great in 1696, and the pattern became the visual shorthand for European republics across the next three centuries. The horizontal tricolor traveled the world through revolution and decolonization. Newly independent African states in the 1950s and 60s adopted the Pan-African colors of red, gold, and green in horizontal bands, following Ethiopia's example. Latin America inherited Gran Colombia's yellow-blue-red horizontal scheme, still visible today in the flags of Colombia, Venezuela, and Ecuador. Even when the colors differ, the underlying grammar — three equal bands stacked top to bottom — links Germany, India, Hungary, and dozens of others into the same visual family.",
  'vertical-stripes':
    "The vertical tricolor is the second-most common pattern in world vexillology, and almost every example traces back to revolutionary France. The 1794 French tricolor — blue at the hoist, white in the center, red at the fly — was deliberately designed by the painter Jacques-Louis David and the National Convention as a republican counterpoint to royal banners. Within two decades, the pattern had spread to every territory France touched, directly or by influence. Italy adopted vertical green-white-red bands in 1797, Belgium followed in 1831, and the Republic of Ireland's green-white-orange tricolor was first flown in 1848. Newly independent African states such as Mali, Senegal, Guinea, and Côte d'Ivoire all chose vertical tricolors in the early 1960s, layering the Pan-African colors onto a French structural template. The vertical band remains a marker of republican lineage and, often, a quiet acknowledgment of France's role in shaping modern statehood.",
  'with-crosses':
    "The cross is the oldest enduring motif in European vexillology. Most cross flags trace to the medieval crusades, when each Christian kingdom adopted a distinctive cross color to identify its troops on shared battlefields — England the red cross of St. George, Scotland the white saltire of St. Andrew, Denmark the white cross of the Dannebrog. The Dannebrog, in continuous use since at least 1370, is the oldest national flag still flown today. The off-center Nordic cross — vertical bar shifted toward the hoist — defines a regional family of its own. Denmark's pattern was copied by Sweden, Norway, Iceland, Finland, and the Faroe Islands, each substituting national colors but preserving the cross's exact proportions and offset. Outside Scandinavia, crosses appear on Switzerland's bold square white cross on red, Georgia's five-cross flag derived from medieval Georgian heraldry, and the British Union Jack — itself a layered combination of three crosses representing the union of England, Scotland, and Ireland.",
  'diagonal-designs':
    "Diagonal flags are a relatively modern invention, almost entirely a product of twentieth-century decolonization. Where stripes and crosses lock the eye into stable horizontal or vertical reading, a diagonal band suggests motion, division, or the sweep of a horizon — themes well suited to nations defining themselves at independence. Tanzania's flag, adopted in 1964 to mark the union of Tanganyika and Zanzibar, uses a black diagonal stripe to literally bridge the two former colonies' colors. Many other diagonal flags carry similar symbolism. The Democratic Republic of the Congo's yellow band cuts across a sky-blue field as a marker of national unity, while the Republic of the Congo, Trinidad and Tobago, and Namibia all use diagonals to represent rivers, the equator, or paths to nationhood. Pacific nations including the Solomon Islands, Marshall Islands, and Papua New Guinea favor diagonals because the angled line reads naturally as the horizon at sea, rooting each flag in the maritime geography of its people.",
  'canton-designs':
    "In vexillology, a canton is the upper-hoist quarter of a flag — the rectangle nearest the flagpole. The term comes from heraldry, where a small square in the chief corner of a shield was used to layer a secondary symbol over the main design. The most influential canton in the world is the blue field of fifty white stars on the United States flag, adopted in its first form in 1777. Its formula — a striped field with a star-filled canton — was deliberately echoed by Liberia in 1847 and Malaysia in 1950, both signaling political kinship with the American republic. A second great canton tradition comes from the British Union Jack, which still appears in the upper-hoist corner of Australia, New Zealand, Fiji, and Tuvalu as a marker of historical sovereignty layered onto each nation's own symbols.",
  'solid-designs':
    "A solid-field flag is the simplest possible vexillological statement: a single block of color, sometimes carrying a central emblem, with no stripes or divisions to break the field. The simplicity is intentional. A single dominant color reads at any distance, resists confusion with neighboring nations, and gives a central symbol — a sun, a crescent, an eagle, or a written inscription — maximum visual weight. Japan's white field with a single red disc, adopted in 1870 and reaffirmed in 1999, is the clearest expression of this idea. Several of the world's most recognizable flags fall in this category. China's red field with five gold stars, adopted in 1949, sets the smaller stars in orbit around a larger one to symbolize the people united around the Communist Party. Saudi Arabia's green flag carries the shahada in white Arabic calligraphy and is treated as so sacred that it is never flown at half-mast. Switzerland's square white cross on red — one of only two square national flags in the world — and Vietnam's red flag with a single yellow star round out a category that proves restraint can carry as much meaning as elaboration.",
  'complex-designs':
    "Complex flags are the outliers of national vexillology — designs that refuse to fit a single stripe, cross, or canton convention. Often they layer multiple geometric elements, carry detailed central emblems, or break flag-design rules entirely. South Africa's 1994 post-apartheid flag is the canonical example: six colors arranged into a horizontal Y that converges at the hoist, deliberately designed to represent the merging of diverse paths into a single nation. Nepal stands alone as the world's only non-rectangular national flag, formed by two stacked crimson pennants edged in blue, with a stylized white sun and moon at their centers. The current shape was codified in the 1962 constitution but the underlying double-pennant design has been used by Nepali rulers for centuries. Other complex flags include Sri Lanka, which encloses a golden lion holding a sword within bordering panels of green and orange; Bhutan, with its white thunder dragon clutching jewels across a yellow-and-orange diagonal field; and tiny Antigua and Barbuda, whose rising-sun motif sits inside a black, blue, and white V on a red field.",
};

const patternPages: [string, ContentPageConfig][] = (
  [
    ['horizontal-stripes', 'horizontal-stripes', 'Horizontal Stripes'],
    ['vertical-stripes', 'vertical-stripes', 'Vertical Stripes'],
    ['with-crosses', 'cross', 'Crosses'],
    ['diagonal-designs', 'diagonal', 'Diagonal Designs'],
    ['canton-designs', 'canton', 'Canton Designs'],
    ['solid-designs', 'solid', 'Solid Fields'],
    ['complex-designs', 'complex', 'Complex Designs'],
  ] as const
).map(([slug, pattern, label]) => [
  slug,
  {
    title: `Flags with ${label} - ${label} Flag Designs | Flag Arcade`,
    h1: `Flags with ${label}`,
    description: `Browse all country flags featuring ${label.toLowerCase()} in their design. Compare flags that share similar patterns.`,
    intro: `These country flags all use a ${label.toLowerCase()} pattern. Many flags around the world share this design element — can you tell them apart?`,
    body: patternBodies[slug],
    getCountries: () => countries.filter((c) => flagFeatures[c.code]?.patterns.includes(pattern as FlagPattern)),
  },
]);

const comboFilter = (c: { code: string }, ...colors: FlagColor[]) => {
  const f = flagFeatures[c.code];
  return f ? colors.every((col) => f.colors.includes(col)) : false;
};

const comboPages: [string, ContentPageConfig][] = [
  [
    'red-white-and-blue-flags',
    {
      title: 'Red, White, and Blue Flags — Countries List | Flag Arcade',
      h1: 'Red, White, and Blue Flags',
      description: 'Which countries have red, white, and blue flags? Browse all flags featuring this popular color combination and learn what the colors represent.',
      intro: 'Red, white, and blue is one of the most popular color combinations in national flags. These countries all feature this classic trio — but can you tell them apart?',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white', 'blue')),
    },
  ],
  [
    'green-white-and-red-flags',
    {
      title: 'Green, White, and Red Flags — Countries List | Flag Arcade',
      h1: 'Green, White, and Red Flags',
      description: 'Which countries have green, white, and red flags? See all national flags with this color combination — from Italy and Mexico to Hungary and Iran.',
      intro: 'Green, white, and red is a striking color trio shared by flags across multiple continents. From European tricolors to Middle Eastern banners, these flags all feature this bold combination.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'white', 'red')),
    },
  ],
  [
    'red-and-white-flags',
    {
      title: 'Red and White Flags — Countries with Red & White Flags | Flag Arcade',
      h1: 'Red and White Flags',
      description: 'Browse all country flags featuring red and white. From Japan and Canada to Turkey and Switzerland — see every red and white flag in the world.',
      intro: 'Red and white is one of the most common two-color combinations in world flags. These countries all prominently feature red and white in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white')),
    },
  ],
  [
    'red-yellow-and-green-flags',
    {
      title: 'Red, Yellow, and Green Flags — Countries List | Flag Arcade',
      h1: 'Red, Yellow, and Green Flags',
      description: 'Which countries have red, yellow, and green flags? These Pan-African colors appear on flags across Africa and beyond. See the full list.',
      intro: 'Red, yellow, and green — the Pan-African colors — appear on more national flags than almost any other trio. Rooted in the Ethiopian flag, this combination spread across Africa during decolonization and beyond.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'yellow', 'green')),
    },
  ],
  [
    'blue-and-white-flags',
    {
      title: 'Blue and White Flags — Countries with Blue & White Flags | Flag Arcade',
      h1: 'Blue and White Flags',
      description: 'Browse all country flags featuring blue and white. From Greece and Finland to Argentina and Israel — see every blue and white flag.',
      intro: 'Blue and white flags evoke sky, sea, and peace. These countries all feature blue and white prominently in their national flag designs.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'blue', 'white')),
    },
  ],
  [
    'blue-and-yellow-flags',
    {
      title: 'Blue and Yellow Flags — Countries with Blue & Yellow Flags | Flag Arcade',
      h1: 'Blue and Yellow Flags',
      description: 'Which countries have blue and yellow flags? From Ukraine and Sweden to Palau and Kazakhstan — browse all blue and yellow national flags.',
      intro: 'Blue and yellow is a vivid contrast seen on flags around the world. These countries all feature blue and yellow prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'blue', 'yellow')),
    },
  ],
  [
    'orange-white-and-green-flags',
    {
      title: 'Orange, White, and Green Flags — Countries List | Flag Arcade',
      h1: 'Orange, White, and Green Flags',
      description: 'Which countries have orange, white, and green flags? See all national flags featuring this color combination, including Ireland and India.',
      intro: 'Orange, white, and green is an instantly recognizable color combination. From Ireland to India, these flags share a vibrant palette with distinct cultural meanings in each nation.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'orange', 'white', 'green')),
    },
  ],
  [
    'black-red-and-yellow-flags',
    {
      title: 'Black, Red, and Yellow Flags — Countries List | Flag Arcade',
      h1: 'Black, Red, and Yellow Flags',
      description: 'Which countries have black, red, and yellow flags? From Germany and Belgium to Uganda and Angola — see all flags with this color combo.',
      intro: 'Black, red, and yellow is a bold combination found on flags across Europe and Africa. Germany\'s iconic tricolor is the most famous, but several other nations share this palette.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'black', 'red', 'yellow')),
    },
  ],
  [
    'red-white-and-black-flags',
    {
      title: 'Red, White, and Black Flags — Countries List | Flag Arcade',
      h1: 'Red, White, and Black Flags',
      description: 'Which countries have red, white, and black flags? Browse all national flags featuring this Pan-Arab color combination.',
      intro: 'Red, white, and black form the Pan-Arab colors, appearing on flags across the Middle East and North Africa. These colors trace back to historical Arab dynasties and the Arab Revolt.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'white', 'black')),
    },
  ],
  [
    'green-and-white-flags',
    {
      title: 'Green and White Flags — Countries with Green & White Flags | Flag Arcade',
      h1: 'Green and White Flags',
      description: 'Browse all country flags featuring green and white. From Nigeria and Pakistan to Saudi Arabia — see every green and white national flag.',
      intro: 'Green and white flags often carry associations with Islam, nature, or peace. These countries all feature green and white prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'white')),
    },
  ],
  [
    'red-and-yellow-flags',
    {
      title: 'Red and Yellow Flags — Countries with Red & Yellow Flags | Flag Arcade',
      h1: 'Red and Yellow Flags',
      description: 'Which countries have red and yellow flags? From China and Spain to Vietnam and Macedonia — browse all red and yellow national flags.',
      intro: 'Red and yellow create a high-contrast, eye-catching combination used on flags across Asia, Europe, and beyond. These countries all prominently feature red and yellow.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'yellow')),
    },
  ],
  [
    'red-black-white-and-green-flags',
    {
      title: 'Red, Black, White, and Green Flags — Countries List | Flag Arcade',
      h1: 'Red, Black, White, and Green Flags',
      description: 'Which countries have red, black, white, and green flags? These four Pan-Arab colors appear together on flags across the Middle East and Africa.',
      intro: 'Red, black, white, and green together form the complete set of Pan-Arab colors. Flags carrying all four trace their symbolism to the Arab Revolt of 1916 and the historical dynasties they represent.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'red', 'black', 'white', 'green')),
    },
  ],
  [
    'black-and-white-flags',
    {
      title: 'Black and White Flags — Countries with Black & White Flags | Flag Arcade',
      h1: 'Black and White Flags',
      description: 'Browse all country flags featuring black and white. See which nations use this striking monochrome combination on their national flags.',
      intro: 'Black and white flags are bold and distinctive. These countries all feature black and white prominently in their national flag designs.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'black', 'white')),
    },
  ],
  [
    'green-and-yellow-flags',
    {
      title: 'Green and Yellow Flags — Countries with Green & Yellow Flags | Flag Arcade',
      h1: 'Green and Yellow Flags',
      description: 'Which countries have green and yellow flags? From Brazil and Jamaica to Senegal and Mauritania — browse all green and yellow national flags.',
      intro: 'Green and yellow flags evoke tropical landscapes, agriculture, and natural wealth. These countries all feature green and yellow prominently in their national flag.',
      getCountries: () => countries.filter((c) => comboFilter(c, 'green', 'yellow')),
    },
  ],
];

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
  ...comboPages,
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
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Flags', href: '/flags' },
          { label: config.h1 },
        ]} />

        {/* Header card */}
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg p-6 mt-4">
          <h1 className="font-retro text-lg md:text-xl text-retro-text mb-3">{config.h1}</h1>
          {config.body ? (
            <div className="space-y-3 mb-3">
              {splitIntoParagraphs(config.body).map((para, i) => (
                <p key={i} className="font-body text-retro-text-secondary leading-relaxed">{para}</p>
              ))}
            </div>
          ) : (
            <p className="font-body text-retro-text-secondary mb-3">{config.intro}</p>
          )}
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
                className="flex items-center gap-2 p-2 border border-retro-border/40 hover:border-retro-border hover:bg-retro-accent/30 transition-colors"
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
