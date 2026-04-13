import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Top 5 largest countries per continent (by population)
const CONTINENTS = [
  {
    name: 'Africa',
    slug: 'africa',
    topCountries: ['Nigeria', 'Ethiopia', 'Egypt', 'DR Congo', 'South Africa'],
    topSlugs: ['nigeria', 'ethiopia', 'egypt', 'democratic-republic-of-the-congo', 'south-africa'],
  },
  {
    name: 'Asia',
    slug: 'asia',
    topCountries: ['China', 'India', 'Indonesia', 'Pakistan', 'Bangladesh'],
    topSlugs: ['china', 'india', 'indonesia', 'pakistan', 'bangladesh'],
  },
  {
    name: 'Europe',
    slug: 'europe',
    topCountries: ['Russia', 'Germany', 'United Kingdom', 'France', 'Italy'],
    topSlugs: ['russia', 'germany', 'united-kingdom', 'france', 'italy'],
  },
  {
    name: 'N. America',
    fullName: 'North American',
    slug: 'north-america',
    topCountries: ['United States', 'Mexico', 'Canada', 'Guatemala', 'Cuba'],
    topSlugs: ['united-states', 'mexico', 'canada', 'guatemala', 'cuba'],
  },
  {
    name: 'S. America',
    fullName: 'South American',
    slug: 'south-america',
    topCountries: ['Brazil', 'Colombia', 'Argentina', 'Peru', 'Venezuela'],
    topSlugs: ['brazil', 'colombia', 'argentina', 'peru', 'venezuela'],
  },
  {
    name: 'Oceania',
    slug: 'oceania',
    topCountries: ['Australia', 'Papua New Guinea', 'New Zealand', 'Fiji', 'Solomon Islands'],
    topSlugs: ['australia', 'papua-new-guinea', 'new-zealand', 'fiji', 'solomon-islands'],
  },
];

export function SiteNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDesktop, setOpenDesktop] = useState<string | null>(null);
  const [openMobile, setOpenMobile] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const isFlags = location.pathname.startsWith('/flags');
  const isQuiz = location.pathname.startsWith('/quiz');

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDesktop(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close everything on navigation
  useEffect(() => {
    setMobileOpen(false);
    setOpenMobile(null);
    setOpenDesktop(null);
  }, [location.pathname]);

  const toggleDesktop = useCallback((slug: string) => {
    setOpenDesktop((prev) => (prev === slug ? null : slug));
  }, []);

  const toggleMobile = useCallback((slug: string) => {
    setOpenMobile((prev) => (prev === slug ? null : slug));
  }, []);

  return (
    <nav className="sticky top-0 z-30 bg-retro-surface/95 backdrop-blur border-b-2 border-retro-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-12 md:h-14">
        {/* Logo / brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg" aria-hidden>🌍</span>
          <span className="font-retro text-[9px] md:text-[10px] text-retro-text leading-none">
            Flag Arcade
          </span>
        </Link>

        {/* Desktop links */}
        <div ref={navRef} className="hidden md:flex items-center gap-0.5">
          {CONTINENTS.map((c) => (
            <div key={c.slug} className="relative">
              <button
                onClick={() => toggleDesktop(c.slug)}
                className={`font-body text-[11px] px-2 py-1.5 rounded transition-colors ${
                  isFlags && location.pathname.includes(c.slug)
                    ? 'bg-retro-accent/40 text-retro-text font-bold'
                    : 'text-retro-text-secondary hover:bg-retro-accent/20'
                }`}
              >
                {c.name}
                <span className="ml-0.5 text-[9px]">{openDesktop === c.slug ? '▴' : '▾'}</span>
              </button>

              {openDesktop === c.slug && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-retro-surface border-2 border-retro-border shadow-pixel z-40">
                  {c.topCountries.map((country, i) => (
                    <Link
                      key={c.topSlugs[i]}
                      to={`/flags/${c.topSlugs[i]}`}
                      className="block font-body text-xs px-4 py-2 hover:bg-retro-accent/30 transition-colors"
                    >
                      {country}
                    </Link>
                  ))}
                  <Link
                    to={`/flags/continent/${c.slug}`}
                    className="block font-body text-xs px-4 py-2 hover:bg-retro-accent/30 transition-colors border-t border-retro-border/30 font-semibold text-retro-gold"
                  >
                    See all {c.fullName ?? c.name} flags →
                  </Link>
                  <Link
                    to={`/quiz/${c.slug}`}
                    className="block font-body text-xs px-4 py-2 hover:bg-retro-accent/30 transition-colors border-t border-retro-border/30 font-semibold text-retro-neon-green"
                  >
                    Take {c.name} Quiz →
                  </Link>
                </div>
              )}
            </div>
          ))}

          {/* Quiz link */}
          <Link
            to="/quiz"
            className={`font-body text-[11px] px-2 py-1.5 rounded transition-colors ${
              isQuiz
                ? 'bg-retro-accent/40 text-retro-text font-bold'
                : 'text-retro-text-secondary hover:bg-retro-accent/20'
            }`}
          >
            Quiz
          </Link>
        </div>

        {/* Right side: PLAY CTA + mobile hamburger */}
        <div className="flex items-center gap-2">
          <Link
            to="/play/modes"
            className="font-retro text-[8px] md:text-[10px] bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel-sm px-3 py-1.5 md:px-4 md:py-2 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            PLAY
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-retro-text transition-transform ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-retro-text transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-retro-text transition-transform ${mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-retro-border bg-retro-surface">
          <div className="px-4 py-3 flex flex-col gap-1">
            {CONTINENTS.map((c) => (
              <div key={c.slug}>
                <button
                  onClick={() => toggleMobile(c.slug)}
                  className={`font-body text-sm text-left w-full px-3 py-2 rounded transition-colors ${
                    isFlags && location.pathname.includes(c.slug)
                      ? 'bg-retro-accent/40 font-bold'
                      : 'hover:bg-retro-accent/20'
                  }`}
                >
                  {c.name}
                  <span className="ml-1 text-xs">{openMobile === c.slug ? '▴' : '▾'}</span>
                </button>

                {openMobile === c.slug && (
                  <div className="ml-4 flex flex-col gap-0.5">
                    {c.topCountries.map((country, i) => (
                      <Link
                        key={c.topSlugs[i]}
                        to={`/flags/${c.topSlugs[i]}`}
                        className="font-body text-xs px-3 py-1.5 rounded hover:bg-retro-accent/20 transition-colors"
                      >
                        {country}
                      </Link>
                    ))}
                    <Link
                      to={`/flags/continent/${c.slug}`}
                      className="font-body text-xs px-3 py-1.5 rounded hover:bg-retro-accent/20 transition-colors font-semibold text-retro-gold"
                    >
                      See all {c.fullName ?? c.name} flags →
                    </Link>
                    <Link
                      to={`/quiz/${c.slug}`}
                      className="font-body text-xs px-3 py-1.5 rounded hover:bg-retro-accent/20 transition-colors font-semibold text-retro-neon-green"
                    >
                      Take {c.name} Quiz →
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {/* Quiz link */}
            <Link
              to="/quiz"
              className={`font-body text-sm px-3 py-2 rounded transition-colors ${
                isQuiz ? 'bg-retro-accent/40 font-bold' : 'hover:bg-retro-accent/20'
              }`}
            >
              Quiz
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
