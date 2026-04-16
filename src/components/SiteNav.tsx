import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

const CONTINENTS = [
  { name: 'Africa', slug: 'africa' },
  { name: 'Asia', slug: 'asia' },
  { name: 'Europe', slug: 'europe' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Oceania', slug: 'oceania' },
];

const GAME_MODES = [
  { name: 'Journey Mode', path: '/play', icon: '🗺️' },
  { name: 'Arcade Mode', path: '/play/arcade', icon: '🕹️' },
  { name: 'Around the World', path: '/play/around-the-world', icon: '🌍' },
  { name: 'Jeopardy Mode', path: '/play/jeopardy', icon: '❓' },
  { name: 'Practice Mode', path: '/play/presentation', icon: '📖' },
  { name: 'Flag Runner', path: '/play/flag-runner', icon: '🏃' },
];

const POPULAR_FLAGS = [
  { name: 'United States', slug: 'united-states', emoji: '🇺🇸' },
  { name: 'United Kingdom', slug: 'united-kingdom', emoji: '🇬🇧' },
  { name: 'Japan', slug: 'japan', emoji: '🇯🇵' },
  { name: 'Canada', slug: 'canada', emoji: '🇨🇦' },
  { name: 'Brazil', slug: 'brazil', emoji: '🇧🇷' },
  { name: 'Australia', slug: 'australia', emoji: '🇦🇺' },
  { name: 'France', slug: 'france', emoji: '🇫🇷' },
  { name: 'Germany', slug: 'germany', emoji: '🇩🇪' },
  { name: 'India', slug: 'india', emoji: '🇮🇳' },
  { name: 'Mexico', slug: 'mexico', emoji: '🇲🇽' },
];

type DropdownId = 'continents' | 'modes' | 'flags' | null;

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function SiteNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDesktop, setOpenDesktop] = useState<DropdownId>(null);
  const [openMobile, setOpenMobile] = useState<DropdownId>(null);
  const navRef = useRef<HTMLDivElement>(null);

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

  const toggleDesktop = useCallback((id: DropdownId) => {
    setOpenDesktop((prev) => (prev === id ? null : id));
  }, []);

  const toggleMobile = useCallback((id: DropdownId) => {
    setOpenMobile((prev) => (prev === id ? null : id));
  }, []);

  const btnClass = (active: boolean) =>
    `font-body text-sm px-3 py-2 rounded transition-colors flex items-center gap-1 ${
      active ? 'bg-retro-accent/40 text-retro-text font-bold' : 'text-retro-text-secondary hover:bg-retro-accent/20'
    }`;

  const mobileBtnClass = (active: boolean) =>
    `font-body text-sm text-left w-full px-3 py-2 rounded transition-colors flex items-center justify-between ${
      active ? 'bg-retro-accent/40 font-bold' : 'hover:bg-retro-accent/20'
    }`;

  const dropdownClass = 'absolute top-full left-0 mt-1 bg-retro-surface border-2 border-retro-border shadow-pixel z-40';
  const itemClass = 'block font-body text-sm px-4 py-1.5 hover:bg-retro-accent/30 transition-colors';
  const mobileItemClass = 'font-body text-xs px-3 py-1.5 rounded hover:bg-retro-accent/20 transition-colors';

  const isFlags = location.pathname.startsWith('/flags');

  return (
    <nav className="sticky top-0 z-30 bg-retro-surface/95 backdrop-blur border-b-2 border-retro-border">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14 md:h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl" aria-hidden>🌍</span>
          <span className="font-retro text-[11px] md:text-xs text-retro-text leading-none">
            Flag Arcade
          </span>
        </Link>

        {/* Desktop links */}
        <div ref={navRef} className="hidden md:flex items-center gap-1">
          {/* Continents dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('continents')}
              className={btnClass(isFlags && location.pathname.includes('/continent/'))}
            >
              🌎 Continents
              <ChevronDown open={openDesktop === 'continents'} />
            </button>
            {openDesktop === 'continents' && (
              <div className={`${dropdownClass} w-52`}>
                {CONTINENTS.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/flags/continent/${c.slug}`}
                    className={itemClass}
                  >
                    {c.name} Flags
                  </Link>
                ))}
                <Link
                  to="/flags"
                  className={`${itemClass} border-t-2 border-retro-border/30 font-semibold text-retro-neon-blue`}
                >
                  All Flags →
                </Link>
              </div>
            )}
          </div>

          {/* Game Modes dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('modes')}
              className={btnClass(location.pathname.startsWith('/play'))}
            >
              🕹️ Game Modes
              <ChevronDown open={openDesktop === 'modes'} />
            </button>
            {openDesktop === 'modes' && (
              <div className={`${dropdownClass} w-56`}>
                {GAME_MODES.map((m) => (
                  <Link
                    key={m.path}
                    to={m.path}
                    className={`${itemClass} flex items-center gap-2`}
                  >
                    <span>{m.icon}</span>
                    {m.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Popular Flags dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('flags')}
              className={btnClass(false)}
            >
              🏁 Popular Flags
              <ChevronDown open={openDesktop === 'flags'} />
            </button>
            {openDesktop === 'flags' && (
              <div className={`${dropdownClass} w-56`}>
                {POPULAR_FLAGS.map((f) => (
                  <Link
                    key={f.slug}
                    to={`/flags/${f.slug}`}
                    className={`${itemClass} flex items-center gap-2`}
                  >
                    <span className="text-lg">{f.emoji}</span>
                    {f.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* About Us */}
          <Link
            to="/about"
            className={btnClass(location.pathname === '/about')}
          >
            ℹ️ About Us
          </Link>
        </div>

        {/* Right side: PLAY CTA + mobile hamburger */}
        <div className="flex items-center gap-2">
          <Link
            to="/play/modes"
            className="font-retro text-[10px] md:text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel-sm px-4 py-2 md:px-5 md:py-2.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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
            {/* Continents */}
            <button onClick={() => toggleMobile('continents')} className={mobileBtnClass(false)}>
              🌎 Continents
              <ChevronDown open={openMobile === 'continents'} />
            </button>
            {openMobile === 'continents' && (
              <div className="ml-4 flex flex-col gap-0.5">
                {CONTINENTS.map((c) => (
                  <Link key={c.slug} to={`/flags/continent/${c.slug}`} className={mobileItemClass}>
                    {c.name} Flags
                  </Link>
                ))}
                <Link to="/flags" className={`${mobileItemClass} font-semibold text-retro-neon-blue`}>
                  All Flags →
                </Link>
              </div>
            )}

            {/* Game Modes */}
            <button onClick={() => toggleMobile('modes')} className={mobileBtnClass(false)}>
              🕹️ Game Modes
              <ChevronDown open={openMobile === 'modes'} />
            </button>
            {openMobile === 'modes' && (
              <div className="ml-4 flex flex-col gap-0.5">
                {GAME_MODES.map((m) => (
                  <Link key={m.path} to={m.path} className={`${mobileItemClass} flex items-center gap-2`}>
                    <span>{m.icon}</span>
                    {m.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Popular Flags */}
            <button onClick={() => toggleMobile('flags')} className={mobileBtnClass(false)}>
              🏁 Popular Flags
              <ChevronDown open={openMobile === 'flags'} />
            </button>
            {openMobile === 'flags' && (
              <div className="ml-4 flex flex-col gap-0.5">
                {POPULAR_FLAGS.map((f) => (
                  <Link key={f.slug} to={`/flags/${f.slug}`} className={`${mobileItemClass} flex items-center gap-2`}>
                    <span className="text-base">{f.emoji}</span>
                    {f.name}
                  </Link>
                ))}
              </div>
            )}

            {/* About Us */}
            <Link to="/about" className={mobileBtnClass(location.pathname === '/about')}>
              ℹ️ About Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
