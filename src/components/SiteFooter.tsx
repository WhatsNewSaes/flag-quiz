import { Link } from 'react-router-dom';

const CONTINENTS = [
  { name: 'Africa', slug: 'africa' },
  { name: 'Asia', slug: 'asia' },
  { name: 'Europe', slug: 'europe' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Oceania', slug: 'oceania' },
];

const POPULAR_FLAGS = [
  { name: 'United States', slug: 'united-states' },
  { name: 'United Kingdom', slug: 'united-kingdom' },
  { name: 'Japan', slug: 'japan' },
  { name: 'Canada', slug: 'canada' },
  { name: 'Brazil', slug: 'brazil' },
  { name: 'Australia', slug: 'australia' },
  { name: 'France', slug: 'france' },
  { name: 'Germany', slug: 'germany' },
  { name: 'India', slug: 'india' },
  { name: 'Mexico', slug: 'mexico' },
];

const EXPLORE_LINKS = [
  { label: 'Hardest Flags', to: '/flags/hardest-flags' },
  { label: 'Easiest Flags', to: '/flags/easiest-flags' },
  { label: 'Similar Looking Flags', to: '/flags/similar-looking-flags' },
  { label: 'Red, White & Blue Flags', to: '/flags/red-white-and-blue-flags' },
  { label: 'Flags with Red', to: '/flags/with-red' },
  { label: 'Flags with Blue', to: '/flags/with-blue' },
  { label: 'Flags with Green', to: '/flags/with-green' },
  { label: 'Horizontal Stripes', to: '/flags/horizontal-stripes' },
  { label: 'Vertical Stripes', to: '/flags/vertical-stripes' },
  { label: 'Flags with Crosses', to: '/flags/with-crosses' },
];

const linkClass = 'font-body text-xs text-gray-400 hover:text-white transition-colors';
const headingClass = 'font-retro text-[10px] text-gray-200 mb-3 uppercase tracking-wider';

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-retro-border bg-retro-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Flags by Continent */}
          <div>
            <h3 className={headingClass}>Flags by Continent</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/flags" className={linkClass}>All Country Flags</Link>
              </li>
              {CONTINENTS.map((c) => (
                <li key={c.slug}>
                  <Link to={`/flags/continent/${c.slug}`} className={linkClass}>
                    {c.name} Flags
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Quizzes */}
          <div>
            <h3 className={headingClass}>Flag Quizzes</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/quiz" className={linkClass}>All Quizzes</Link>
              </li>
              {CONTINENTS.map((c) => (
                <li key={c.slug}>
                  <Link to={`/quiz/${c.slug}`} className={linkClass}>
                    {c.name} Quiz
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Popular Flags */}
          <div>
            <h3 className={headingClass}>Popular Flags</h3>
            <ul className="space-y-2">
              {POPULAR_FLAGS.map((f) => (
                <li key={f.slug}>
                  <Link to={`/flags/${f.slug}`} className={linkClass}>
                    {f.name} Flag
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Explore */}
          <div>
            <h3 className={headingClass}>Explore</h3>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkClass}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap justify-center gap-4">
            <Link to="/" className={linkClass}>Home</Link>
            <Link to="/flags" className={linkClass}>Browse Flags</Link>
            <Link to="/quiz" className={linkClass}>Quiz</Link>
            <Link to="/play" className={linkClass}>Play</Link>
            <a
              href="https://learntoship.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Built by LearnToShip.ai
            </a>
          </nav>
          <p className="font-retro text-[8px] text-gray-400">
            &copy; 2026 Flag Arcade
          </p>
        </div>
      </div>
    </footer>
  );
}
