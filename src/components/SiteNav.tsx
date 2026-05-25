import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { organizations } from '../data/organizations';
import { countries } from '../data/countries';
import { territories, getTerritorySlug } from '../data/territories';
import { flagPatternInfos } from '../data/flagPatterns';
import { FlagImage } from './FlagImage';
import { getCountrySlug } from '../utils/slugify';

type SearchItem =
  | { kind: 'country'; code: string; name: string; href: string }
  | { kind: 'territory'; code: string; name: string; href: string; sovereignName: string }
  | { kind: 'organization'; slug: string; name: string; abbreviation: string; emoji: string; href: string };

const SEARCH_INDEX: SearchItem[] = [
  ...countries.map<SearchItem>((c) => ({
    kind: 'country',
    code: c.code,
    name: c.name,
    href: `/flags/${getCountrySlug(c)}`,
  })),
  ...territories.map<SearchItem>((t) => ({
    kind: 'territory',
    code: t.code,
    name: t.name,
    href: `/flags/territories/${getTerritorySlug(t)}`,
    sovereignName: t.sovereignName,
  })),
  ...organizations.map<SearchItem>((o) => ({
    kind: 'organization',
    slug: o.slug,
    name: o.name,
    abbreviation: o.abbreviation,
    emoji: o.emoji,
    href: `/organizations/${o.slug}`,
  })),
];

const CONTINENTS = [
  { name: 'Africa', slug: 'africa' },
  { name: 'Asia', slug: 'asia' },
  { name: 'Europe', slug: 'europe' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Oceania', slug: 'oceania' },
];

const TERRITORY_GROUPS = [
  { name: 'All Territories', path: '/flags/territories', emoji: '🗺️' },
  { name: 'U.S. Territories', path: '/flags/territories/puerto-rico', emoji: '🇺🇸' },
  { name: 'UK Territories', path: '/flags/territories/bermuda', emoji: '🇬🇧' },
  { name: 'French Territories', path: '/flags/territories/french-polynesia', emoji: '🇫🇷' },
  { name: 'Hong Kong', path: '/flags/territories/hong-kong', emoji: '🇭🇰' },
  { name: 'Greenland', path: '/flags/territories/greenland', emoji: '🇬🇱' },
];

type DropdownId = 'continents' | 'orgs' | 'territories' | 'patterns' | null;

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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDesktop, setOpenDesktop] = useState<DropdownId>(null);
  const [openMobile, setOpenMobile] = useState<DropdownId>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX
      .filter((item) => {
        if (item.name.toLowerCase().includes(q)) return true;
        if (item.kind === 'organization' && item.abbreviation.toLowerCase().includes(q)) return true;
        return false;
      })
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [query]);

  // Reset highlight when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global hotkey: "/" or Cmd/Ctrl+K focuses the search input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target && target.isContentEditable);
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = e.key === '/' && !inEditable;
      if (!isCmdK && !isSlash) return;
      if (desktopSearchInputRef.current) {
        e.preventDefault();
        desktopSearchInputRef.current.focus();
        desktopSearchInputRef.current.select();
        setSearchFocused(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close desktop dropdown / search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (navRef.current && !navRef.current.contains(target)) {
        setOpenDesktop(null);
      }
      const inSearch = searchRef.current?.contains(target) ?? false;
      if (!inSearch) {
        setSearchFocused(false);
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
    setQuery('');
    setSearchFocused(false);
  }, [location.pathname]);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && searchResults.length > 0) {
      e.preventDefault();
      setSearchFocused(true);
      setSelectedIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
      e.preventDefault();
      setSearchFocused(true);
      setSelectedIndex((i) => (i - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      const idx = Math.min(selectedIndex, searchResults.length - 1);
      navigate(searchResults[idx].href);
    } else if (e.key === 'Escape') {
      setQuery('');
      setSearchFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  }

  function renderSearchResults(idPrefix: string) {
    if (!searchFocused || !query.trim()) return null;
    if (searchResults.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-retro-surface border-2 border-retro-border shadow-pixel z-40 px-3 py-2 font-body text-sm text-retro-text-secondary">
          No flags match "{query}"
        </div>
      );
    }
    return (
      <ul className="absolute top-full left-0 right-0 mt-1 bg-retro-surface border-2 border-retro-border shadow-pixel z-40 max-h-80 overflow-y-auto">
        {searchResults.map((item, i) => {
          const key = item.kind === 'organization' ? item.slug : item.code;
          const tag =
            item.kind === 'territory'
              ? `Territory · ${item.sovereignName}`
              : item.kind === 'organization'
                ? `Organization · ${item.abbreviation}`
                : null;
          return (
            <li key={`${idPrefix}-${item.kind}-${key}`}>
              <Link
                to={item.href}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center gap-2 px-3 py-2 font-body text-sm transition-colors ${
                  i === selectedIndex ? 'bg-retro-accent/40' : 'hover:bg-retro-accent/30'
                }`}
              >
                {item.kind === 'organization' ? (
                  <span className="text-lg" aria-hidden="true">{item.emoji}</span>
                ) : (
                  <FlagImage code={item.code} name={item.name} className="text-lg" alt="" />
                )}
                <span className="flex-1">{item.name}</span>
                {tag && (
                  <span className="font-body text-[10px] uppercase tracking-wide text-retro-text-secondary/70">
                    {tag}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  const toggleDesktop = useCallback((id: DropdownId) => {
    setOpenDesktop((prev) => (prev === id ? null : id));
  }, []);

  const toggleMobile = useCallback((id: DropdownId) => {
    setOpenMobile((prev) => (prev === id ? null : id));
  }, []);

  const btnClass = (active: boolean) =>
    `font-body text-sm px-1 py-1 xl:py-2 rounded transition-colors flex items-center gap-1 ${
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
  const isOrgs = location.pathname.startsWith('/organizations');
  const isPatterns = location.pathname.startsWith('/patterns');

  return (
    <nav className="sticky top-0 z-30 bg-retro-surface/95 backdrop-blur border-b-2 border-retro-border">
      <div className="w-full flex items-center justify-between px-4 h-14 md:h-16">
        {/* Logo */}
        <Link to="/" aria-label="Flag Arcade home" className="flex items-center gap-2 shrink-0">
          <span className="text-xl" aria-hidden>🌍</span>
          <span className="hidden sm:inline font-retro text-[11px] md:text-xs text-retro-text leading-none">
            Flag Arcade
          </span>
        </Link>

        {/* Desktop links */}
        <div ref={navRef} className="hidden lg:flex flex-1 items-center justify-around gap-1 px-2">
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

          {/* Patterns dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('patterns')}
              className={btnClass(isPatterns)}
            >
              ▦ Patterns
              <ChevronDown open={openDesktop === 'patterns'} />
            </button>
            {openDesktop === 'patterns' && (
              <div className={`${dropdownClass} w-60`}>
                {flagPatternInfos.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/flags/${p.slug}`}
                    className={`${itemClass} flex items-center gap-2`}
                  >
                    <span className="w-5 text-center">{p.emoji}</span>
                    {p.name}
                  </Link>
                ))}
                <Link
                  to="/patterns"
                  className={`${itemClass} border-t-2 border-retro-border/30 font-semibold text-retro-neon-blue`}
                >
                  All Patterns →
                </Link>
              </div>
            )}
          </div>

          {/* Organizations dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('orgs')}
              className={btnClass(isOrgs)}
            >
              🏛️ Organizations
              <ChevronDown open={openDesktop === 'orgs'} />
            </button>
            {openDesktop === 'orgs' && (
              <div className={`${dropdownClass} w-72 max-h-80 overflow-y-auto`}>
                {organizations.map((org) => (
                  <Link
                    key={org.slug}
                    to={`/organizations/${org.slug}`}
                    className={`${itemClass} flex items-center gap-2`}
                  >
                    <img
                      src={`/flag-images/flag-${org.slug}.svg`}
                      alt=""
                      className="w-6 h-4 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                    {org.abbreviation} — {org.name}
                  </Link>
                ))}
                <Link
                  to="/organizations"
                  className={`${itemClass} border-t-2 border-retro-border/30 font-semibold text-retro-neon-blue`}
                >
                  All Organizations →
                </Link>
              </div>
            )}
          </div>

          {/* Territories dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDesktop('territories')}
              className={btnClass(isFlags && location.pathname.includes('/territories'))}
            >
              🏝️ Territories
              <ChevronDown open={openDesktop === 'territories'} />
            </button>
            {openDesktop === 'territories' && (
              <div className={`${dropdownClass} w-56`}>
                {TERRITORY_GROUPS.map((t) => (
                  <Link
                    key={t.path}
                    to={t.path}
                    className={`${itemClass} flex items-center gap-2`}
                  >
                    <span>{t.emoji}</span>
                    {t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Inline search (mobile + desktop) */}
        <div ref={searchRef} className="relative flex-1 max-w-xs mx-2 lg:mx-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-retro-text/60 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={desktopSearchInputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchFocused(true); }}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search flags…"
            aria-label="Search country flags"
            className="w-full h-9 lg:h-10 font-body text-sm text-retro-text placeholder:text-retro-text/60 border-2 border-retro-border bg-[#EBE0C2] pl-9 pr-8 outline-none focus:border-retro-neon-blue"
          />
          {!query && !searchFocused && (
            <kbd
              aria-hidden="true"
              className="hidden lg:inline-block absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-[11px] text-retro-text/70 bg-retro-surface border border-retro-border shadow-pixel-sm px-1.5 py-0.5 leading-none"
            >
              /
            </kbd>
          )}
          {renderSearchResults('search-desktop')}
        </div>

        {/* Right side: Game Modes CTA + mobile hamburger */}
        <div className="flex items-center gap-2">
          <Link
            to="/play/modes"
            className="inline-flex items-center font-retro text-[10px] lg:text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel-sm h-9 lg:h-10 px-2.5 lg:px-5 hover:translate-y-0.5 hover:shadow-none transition-all whitespace-nowrap"
          >
            🕹️ Game Modes
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex justify-center items-center w-8 h-8 text-retro-text focus:outline-none focus-visible:ring-2 focus-visible:ring-retro-neon-blue/40 rounded"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="lg:hidden border-t-2 border-retro-border bg-retro-surface">
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

            {/* Patterns */}
            <button onClick={() => toggleMobile('patterns')} className={mobileBtnClass(isPatterns)}>
              ▦ Patterns
              <ChevronDown open={openMobile === 'patterns'} />
            </button>
            {openMobile === 'patterns' && (
              <div className="ml-4 flex flex-col gap-0.5">
                {flagPatternInfos.map((p) => (
                  <Link key={p.slug} to={`/flags/${p.slug}`} className={`${mobileItemClass} flex items-center gap-2`}>
                    <span className="w-5 text-center">{p.emoji}</span>
                    {p.name}
                  </Link>
                ))}
                <Link to="/patterns" className={`${mobileItemClass} font-semibold text-retro-neon-blue`}>
                  All Patterns →
                </Link>
              </div>
            )}

            {/* Organizations */}
            <button onClick={() => toggleMobile('orgs')} className={mobileBtnClass(isOrgs)}>
              🏛️ Organizations
              <ChevronDown open={openMobile === 'orgs'} />
            </button>
            {openMobile === 'orgs' && (
              <div className="ml-4 flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                {organizations.map((org) => (
                  <Link key={org.slug} to={`/organizations/${org.slug}`} className={`${mobileItemClass} flex items-center gap-2`}>
                    <img
                      src={`/flag-images/flag-${org.slug}.svg`}
                      alt=""
                      className="w-6 h-4 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                    {org.abbreviation}
                  </Link>
                ))}
                <Link to="/organizations" className={`${mobileItemClass} font-semibold text-retro-neon-blue`}>
                  All Organizations →
                </Link>
              </div>
            )}

            {/* Territories */}
            <button onClick={() => toggleMobile('territories')} className={mobileBtnClass(false)}>
              🏝️ Territories
              <ChevronDown open={openMobile === 'territories'} />
            </button>
            {openMobile === 'territories' && (
              <div className="ml-4 flex flex-col gap-0.5">
                {TERRITORY_GROUPS.map((t) => (
                  <Link key={t.path} to={t.path} className={`${mobileItemClass} flex items-center gap-2`}>
                    <span>{t.emoji}</span>
                    {t.name}
                  </Link>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </nav>
  );
}
