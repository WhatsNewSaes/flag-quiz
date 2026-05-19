import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SEOHead } from '../components/seo/SEOHead';
import { countries, type Continent } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import bigLogo from '../images/logo/big-logo.svg';
import { HeroJourneyFlow } from '../components/home/HeroJourneyFlow';
import { CHARACTER_IMAGES, type HumanCharacterKey } from '../components/onboarding/CharacterSelect';

const FLAG_EMOJIS = [
  '🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇧🇷','🇨🇦','🇦🇺','🇮🇳','🇨🇳',
  '🇲🇽','🇰🇷','🇮🇹','🇪🇸','🇷🇺','🇿🇦','🇳🇬','🇪🇬','🇹🇷','🇸🇪',
  '🇳🇴','🇦🇷','🇨🇴','🇵🇪','🇨🇱','🇵🇭','🇹🇭','🇻🇳','🇮🇩','🇲🇾',
  '🇳🇿','🇰🇪','🇬🇭','🇵🇰','🇧🇩','🇸🇦','🇦🇪','🇵🇱','🇳🇱','🇧🇪',
];

const GAME_MODES = [
  {
    title: 'Journey Mode',
    description: 'Progress through worlds of increasing difficulty. Earn stars and unlock achievements.',
    image: '/modes/journey.webp',
    path: '/play/journey',
  },
  {
    title: 'Arcade Mode',
    description: 'Free play with all flags. Choose your difficulty and continent.',
    image: '/modes/arcade.webp',
    path: '/play/arcade',
  },
  {
    title: 'Around the World',
    description: 'Race through flags from every continent in one run.',
    image: '/modes/around-the-world.webp',
    path: '/play/around-the-world',
  },
  {
    title: 'Jeopardy Mode',
    description: 'See the country name, pick the correct flag. Five difficulty levels.',
    image: '/modes/jeopardy.webp',
    path: '/play/jeopardy',
  },
  {
    title: 'Practice Mode',
    description: 'Flashcard-style study mode. Reveal answers at your own pace.',
    image: '/modes/presentation.webp',
    path: '/play/presentation',
  },
  {
    title: 'Flag Runner',
    description: 'A pixel-art platformer where you collect flags while running and jumping.',
    image: '/modes/flag-runner.webp',
    path: '/play/flag-runner',
    isNew: true,
  },
];

const CONTINENTS: { name: Continent; slug: string; count: number }[] = [
  { name: 'Africa', slug: 'africa', count: 54 },
  { name: 'Asia', slug: 'asia', count: 49 },
  { name: 'Europe', slug: 'europe', count: 45 },
  { name: 'North America', slug: 'north-america', count: 23 },
  { name: 'South America', slug: 'south-america', count: 12 },
  { name: 'Oceania', slug: 'oceania', count: 14 },
];

const PREVIEW_COUNT = 12;

function FlagExplorer() {
  const [activeTab, setActiveTab] = useState<Continent>('Africa');

  const flagsByContinent = useMemo(() => {
    const map: Partial<Record<Continent, typeof countries>> = {};
    for (const c of CONTINENTS) {
      map[c.name] = countries.filter((co) => co.continent === c.name).slice(0, PREVIEW_COUNT);
    }
    return map;
  }, []);

  const activeFlags = flagsByContinent[activeTab] ?? [];
  const activeSlug = getContinentSlug(activeTab);
  const activeContinent = CONTINENTS.find((c) => c.name === activeTab);

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <h2 className="font-retro text-sm md:text-base text-retro-text text-center mb-8">
        EXPLORE THE FLAGS
      </h2>

      <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg">
        {/* Window title bar */}
        <div className="bg-retro-neon-blue border-b-2 border-retro-border px-4 py-2">
          <span className="font-retro text-xs md:text-sm text-white">EXPLORE FLAGS</span>
        </div>

        <div className="p-4 md:p-6">
          {/* Continent tabs */}
          <div className="flex flex-wrap gap-1 mb-5">
            {CONTINENTS.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveTab(c.name)}
                className={`font-body text-sm md:text-base px-3 py-2 border-2 transition-colors ${
                  activeTab === c.name
                    ? 'bg-retro-neon-blue text-white border-retro-border shadow-pixel-sm'
                    : 'bg-white text-retro-text-secondary border-retro-border/40 hover:bg-retro-accent/20'
                }`}
              >
                {c.name}
                <span className="ml-1 opacity-50 text-xs">({c.count})</span>
              </button>
            ))}
          </div>

          {/* Flag grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-5">
            {activeFlags.map((country) => (
              <Link
                key={country.code}
                to={`/flags/${getCountrySlug(country)}`}
                className="flex flex-col items-center bg-white border border-retro-border/30 p-2 hover:bg-retro-accent/20 hover:shadow-pixel-sm transition-all group"
              >
                <span className="text-2xl md:text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {getFlagEmoji(country.code)}
                </span>
                <span className="font-body text-[11px] md:text-xs text-retro-text-secondary text-center leading-tight">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 items-center">
            <Link
              to={`/flags/continent/${activeSlug}`}
              className="font-body text-sm md:text-base text-retro-neon-blue hover:underline"
            >
              View all {activeContinent?.count} {activeTab} flags &rarr;
            </Link>
            <Link
              to="/flags"
              className="inline-block font-retro text-xs md:text-sm bg-retro-neon-blue text-white border-2 border-retro-border shadow-pixel px-5 py-2.5 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
            >
              Browse All {countries.length} Flags
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function isReturningUser(): boolean {
  try {
    const raw = window.localStorage.getItem('onboarding-complete');
    if (!raw) return false;
    return JSON.parse(raw) === 'true';
  } catch {
    return false;
  }
}

function readJourneySnapshot() {
  let character: HumanCharacterKey = 'boy';
  let totalStars = 0;
  let levelsCompleted = 0;
  try {
    const c = window.localStorage.getItem('selected-character')?.replace(/^"|"$/g, '');
    if (c && c in CHARACTER_IMAGES) character = c as HumanCharacterKey;
    const raw = window.localStorage.getItem('journey-progress');
    if (raw) {
      const p = JSON.parse(raw);
      totalStars = Number(p?.totalStars) || 0;
      levelsCompleted = Object.keys(p?.levelResults ?? {}).length;
    }
  } catch {
    // ignore — fall back to defaults
  }
  return { character, totalStars, levelsCompleted };
}

function ReturningUserContinue() {
  const { character, totalStars, levelsCompleted } = readJourneySnapshot();

  return (
    <section className="relative border-b-2 border-retro-border bg-gradient-to-br from-pink-200/40 via-yellow-100/40 to-sky-200/40 py-6 sm:py-8">
      {/* Decorative pixel flag emojis floating in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20" aria-hidden="true">
        <span className="absolute top-3 left-[8%] text-2xl">🇯🇵</span>
        <span className="absolute top-6 right-[12%] text-2xl">🇧🇷</span>
        <span className="absolute bottom-4 left-[15%] text-2xl">🇰🇪</span>
        <span className="absolute bottom-3 right-[8%] text-2xl">🇫🇷</span>
      </div>

      <div className="relative max-w-2xl mx-auto px-4">
        <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-lg overflow-hidden">
          {/* Rainbow title bar */}
          <div
            className="border-b-2 border-retro-border px-3 py-1.5 flex items-center justify-between"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #ef4444 0%, #f97316 20%, #facc15 40%, #22c55e 60%, #3b82f6 80%, #a855f7 100%)',
            }}
          >
            <span
              className="font-retro text-[10px] sm:text-xs text-white"
              style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}
            >
              ★ WELCOME BACK, ADVENTURER ★
            </span>
            <span
              className="hidden sm:inline font-retro text-[10px] text-white"
              style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}
            >
              SAVE 01
            </span>
          </div>

          <div className="p-3 sm:p-5 flex items-center gap-3 sm:gap-5">
            {/* Character portrait */}
            <div className="relative flex-shrink-0 bg-retro-accent/40 border-2 border-retro-border shadow-pixel-sm p-1 sm:p-2">
              <img
                src={CHARACTER_IMAGES[character]}
                alt="Your character"
                className="w-12 h-12 sm:w-20 sm:h-20 block"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Stats + CTA */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 font-retro text-[10px] sm:text-xs text-retro-text whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="text-retro-gold">★</span>
                  {totalStars} stars
                </span>
                <span className="text-retro-text-secondary">·</span>
                <span className="inline-flex items-center gap-1">
                  <span>🗺️</span>
                  {levelsCompleted} {levelsCompleted === 1 ? 'level' : 'levels'}
                </span>
              </div>
              <p className="font-body text-[11px] sm:text-sm text-retro-text-secondary mb-3 leading-snug whitespace-nowrap">
                Pick up where you left off.
              </p>
              <Link
                to="/play/journey"
                className="group relative inline-block"
              >
                <span className="absolute inset-0 translate-x-1 translate-y-1 bg-black/60 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                <span className="relative inline-flex items-center gap-2 font-retro text-xs sm:text-sm text-white bg-retro-neon-green border-2 border-retro-border px-4 py-2 sm:px-5 sm:py-2.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5">
                  Continue Journey &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  // Native apps skip the homepage entirely
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/play" replace />;
  }

  // Read synchronously to avoid flash between new-user game and returning-user CTA
  const [returning] = useState(() => isReturningUser());
  const [mounted, setMounted] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // IntersectionObserver for game mode cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setTimeout(() => {
                setVisibleCards((prev) => new Set(prev).add(index));
              }, index * 100);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // JSON-LD structured data
  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Flag Arcade',
      description: 'Free online flag quiz game. Learn and identify flags from 197 countries across 6 game modes.',
      url: 'https://flagarcade.com',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };

    let script = document.querySelector('script[data-homepage-ld]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-homepage-ld', '');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      script?.remove();
    };
  }, []);

  const marqueeStrip = FLAG_EMOJIS.join(' ');

  return (
    <div className="min-h-screen bg-retro-bg">
      <SEOHead
        title="Flag Arcade - The Ultimate World Flag Quiz Game"
        description="Test your knowledge of flags from 197 countries! Free retro-style flag quiz with 6 game modes: Journey, Arcade, Around the World, Jeopardy, Presentation, and Flag Runner."
        canonical="https://flagarcade.com/"
      />

      {/* ===== 0. PLAYABLE LEVEL 1 (new users) or CONTINUE CTA (returning) ===== */}
      {returning ? <ReturningUserContinue /> : <HeroJourneyFlow />}

      {/* ===== 1. HERO ===== */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 md:py-32 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.webp)' }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <img
            src={bigLogo}
            alt="Flag Arcade"
            className={`w-48 md:w-64 mb-6 drop-shadow-lg invert transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          />

          <p
            className={`font-retro text-xs md:text-sm text-white text-center max-w-lg mb-3 leading-relaxed drop-shadow-md transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            The ultimate world flag quiz
          </p>

          <p
            className={`font-body text-sm md:text-base text-white/80 text-center max-w-md mb-8 drop-shadow-sm transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            197 countries. 6 game modes. 100% free.
          </p>

          {/* START GAME button */}
          <Link
            to="/play"
            className={`
              group relative inline-block
              transition-all duration-700 delay-400
              ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
            `}
          >
            <span className="absolute inset-0 translate-x-1 translate-y-1 bg-black/60 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            <span className="relative flex items-center gap-3 font-retro text-sm md:text-base text-white bg-retro-neon-green border-2 border-retro-border px-8 py-4 md:px-12 md:py-5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5">
              START GAME
            </span>
          </Link>

          {/* Choose your mode arrow */}
          <a
            href="#modes"
            className={`mt-8 font-body text-xs text-white/60 hover:text-white transition-all duration-700 delay-500 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Choose your mode &darr;
          </a>
        </div>
      </section>

      {/* ===== 2. FLAG MARQUEE STRIP ===== */}
      <section className="border-y-2 border-retro-border bg-retro-border overflow-hidden py-3">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-2xl md:text-3xl tracking-widest px-4">{marqueeStrip}</span>
          <span className="text-2xl md:text-3xl tracking-widest px-4">{marqueeStrip}</span>
        </div>
      </section>

      {/* ===== 3. CHOOSE YOUR MODE ===== */}
      <section id="modes" className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <h2 className="font-retro text-sm md:text-base text-retro-text text-center mb-8">
          CHOOSE YOUR MODE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {GAME_MODES.map((mode, i) => (
            <div
              key={mode.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`
                relative group
                border-2 border-retro-border shadow-pixel overflow-hidden
                transition-all duration-500
                ${visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
              `}
            >
              {mode.isNew && (
                <span className="absolute top-2 right-2 z-20 font-retro text-[7px] bg-retro-neon-red text-white px-1.5 py-0.5 border border-retro-border shadow-pixel-sm">
                  NEW
                </span>
              )}

              <Link
                to={mode.path}
                className="flex flex-col h-full hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
              >
                {/* Image */}
                <div className="relative h-36 md:h-44 overflow-hidden flex-shrink-0">
                  <img
                    src={mode.image}
                    alt={mode.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {/* Card body */}
                <div className="bg-retro-surface p-3 md:p-4 border-t-2 border-retro-border flex-1">
                  <h3 className="font-retro text-[10px] md:text-xs text-retro-text mb-1.5">
                    {mode.title}
                  </h3>
                  <p className="font-body text-xs text-retro-text-secondary leading-snug">
                    {mode.description}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/play"
            className="inline-block font-retro text-xs bg-retro-neon-green text-white border-2 border-retro-border shadow-pixel px-6 py-3 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
          >
            START PLAYING
          </Link>
        </div>
      </section>

      {/* ===== 4. STATS STRIP ===== */}
      <section className="bg-retro-accent border-y-2 border-retro-border py-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-sm p-3 text-center">
            <p className="font-retro text-base md:text-lg text-retro-neon-green">10,000+</p>
            <p className="font-body text-[10px] text-retro-text-secondary mt-1">Games Played</p>
          </div>
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-sm p-3 text-center">
            <p className="font-retro text-base md:text-lg text-retro-neon-blue">195</p>
            <p className="font-body text-[10px] text-retro-text-secondary mt-1">Countries</p>
          </div>
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-sm p-3 text-center">
            <p className="font-retro text-base md:text-lg text-retro-neon-purple">6</p>
            <p className="font-body text-[10px] text-retro-text-secondary mt-1">Game Modes</p>
          </div>
          <div className="bg-retro-surface border-2 border-retro-border shadow-pixel-sm p-3 text-center">
            <p className="font-retro text-base md:text-lg text-retro-neon-orange">50,000+</p>
            <p className="font-body text-[10px] text-retro-text-secondary mt-1">Flags Guessed</p>
          </div>
        </div>
      </section>

      {/* ===== 5. EXPLORE FLAGS ===== */}
      <FlagExplorer />

      {/* ===== 6. FINAL CTA ===== */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-retro text-sm md:text-base text-retro-text mb-3">
            GAME OVER? NOT YET.
          </h2>
          <p className="font-body text-sm text-retro-text-secondary mb-8">
            Jump in and test your flag knowledge. Free, instant, no sign-up required.
          </p>
          <Link
            to="/play"
            className="inline-block font-retro text-xs md:text-sm bg-retro-neon-red text-white border-2 border-retro-border shadow-pixel-lg px-8 py-4 hover:translate-y-0.5 hover:shadow-pixel transition-all"
          >
            PLAY NOW &mdash; IT&apos;S FREE
          </Link>
          <p className="font-body text-[10px] text-retro-text-secondary/60 mt-4">
            No account needed
          </p>
        </div>
      </section>

    </div>
  );
}
