import { Link } from 'react-router-dom';
import { organizations } from '../data/organizations';

const CONTINENTS = [
  { name: 'Africa', slug: 'africa' },
  { name: 'Asia', slug: 'asia' },
  { name: 'Europe', slug: 'europe' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Oceania', slug: 'oceania' },
];

const TERRITORY_LINKS = [
  { name: 'All Territories', path: '/flags/territories', emoji: '🗺️' },
  { name: 'Puerto Rico', path: '/flags/territories/puerto-rico', emoji: '🇵🇷' },
  { name: 'Hong Kong', path: '/flags/territories/hong-kong', emoji: '🇭🇰' },
  { name: 'Greenland', path: '/flags/territories/greenland', emoji: '🇬🇱' },
  { name: 'Bermuda', path: '/flags/territories/bermuda', emoji: '🇧🇲' },
  { name: 'French Polynesia', path: '/flags/territories/french-polynesia', emoji: '🇵🇫' },
  { name: 'Guam', path: '/flags/territories/guam', emoji: '🇬🇺' },
  { name: 'Aruba', path: '/flags/territories/aruba', emoji: '🇦🇼' },
  { name: 'Gibraltar', path: '/flags/territories/gibraltar', emoji: '🇬🇮' },
  { name: 'Cayman Islands', path: '/flags/territories/cayman-islands', emoji: '🇰🇾' },
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
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

          {/* Column 3: Organizations */}
          <div>
            <h3 className={headingClass}>Organizations</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/organizations" className={linkClass}>All Organizations</Link>
              </li>
              {organizations.slice(0, 10).map((org) => (
                <li key={org.slug}>
                  <Link to={`/organizations/${org.slug}`} className={`${linkClass} flex items-center gap-2`}>
                    <img
                      src={`/flag-images/flag-${org.slug}.svg`}
                      alt=""
                      className="w-5 h-3.5 object-contain"
                      loading="lazy"
                    />
                    {org.abbreviation}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Territories */}
          <div>
            <h3 className={headingClass}>Territories</h3>
            <ul className="space-y-2">
              {TERRITORY_LINKS.map((t) => (
                <li key={t.path}>
                  <Link to={t.path} className={linkClass}>
                    {t.emoji} {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Explore */}
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

          {/* Column 6: Emoji & More */}
          <div>
            <h3 className={headingClass}>More</h3>
            <ul className="space-y-2">
              <li><Link to="/flags/emoji" className={linkClass}>Emoji Flags</Link></li>
              <li><Link to="/about" className={linkClass}>About Us</Link></li>
              <li><Link to="/play" className={linkClass}>Play Game</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap justify-center gap-4">
            <Link to="/" className={linkClass}>Home</Link>
            <Link to="/flags" className={linkClass}>Browse Flags</Link>
            <Link to="/organizations" className={linkClass}>Organizations</Link>
            <Link to="/flags/territories" className={linkClass}>Territories</Link>
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
