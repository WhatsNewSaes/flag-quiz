import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SEOHead } from '../components/seo/SEOHead';
import { countries, type Continent } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import bigLogo from '../images/logo/big-logo.svg';
import journeyIcon from '../images/modes/journey.png';
import arcadeIcon from '../images/modes/arcade.png';
import aroundTheWorldIcon from '../images/modes/around-the-world.png';
import jeopardyIcon from '../images/modes/jeopardy.png';
import presentationIcon from '../images/modes/practice.png';
import flagRunnerIcon from '../images/modes/flag-runner.png';

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
    icon: journeyIcon,
    color: 'bg-retro-neon-green',
    path: '/play',
  },
  {
    title: 'Arcade Mode',
    description: 'Free play with all flags. Choose your difficulty and continent.',
    icon: arcadeIcon,
    color: 'bg-retro-neon-blue',
    path: '/play/arcade',
  },
  {
    title: 'Around the World',
    description: 'Race through flags from every continent in one run.',
    icon: aroundTheWorldIcon,
    color: 'bg-retro-neon-blue',
    path: '/play/around-the-world',
  },
  {
    title: 'Jeopardy Mode',
    description: 'See the country name, pick the correct flag. Five difficulty levels.',
    icon: jeopardyIcon,
    color: 'bg-retro-neon-purple',
    path: '/play/jeopardy',
  },
  {
    title: 'Presentation Mode',
    description: 'Perfect for classrooms. Display flags on the big screen.',
    icon: presentationIcon,
    color: 'bg-retro-neon-red',
    path: '/play/presentation',
  },
  {
    title: 'Flag Runner',
    description: 'A pixel-art platformer where you collect flags while running and jumping.',
    icon: flagRunnerIcon,
    color: 'bg-retro-accent',
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
          <span className="font-retro text-[10px] md:text-xs text-white">EXPLORE FLAGS</span>
        </div>

        <div className="p-4 md:p-6">
          {/* Continent tabs */}
          <div className="flex flex-wrap gap-1 mb-5">
            {CONTINENTS.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveTab(c.name)}
                className={`font-body text-[10px] md:text-xs px-2.5 py-1.5 border-2 transition-colors ${
                  activeTab === c.name
                    ? 'bg-retro-neon-blue text-white border-retro-border shadow-pixel-sm'
                    : 'bg-white text-retro-text-secondary border-retro-border/40 hover:bg-retro-accent/20'
                }`}
              >
                {c.name}
                <span className="ml-1 opacity-50 text-[8px]">({c.count})</span>
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
                <span className="font-body text-[8px] md:text-[9px] text-retro-text-secondary text-center leading-tight">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 items-center">
            <Link
              to={`/flags/continent/${activeSlug}`}
              className="font-body text-xs text-retro-neon-blue hover:underline"
            >
              View all {activeContinent?.count} {activeTab} flags &rarr;
            </Link>
            <Link
              to="/flags"
              className="inline-block font-retro text-[10px] md:text-xs bg-retro-neon-blue text-white border-2 border-retro-border shadow-pixel px-5 py-2.5 hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
            >
              Browse All {countries.length} Flags
            </Link>
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
        canonical="https://flagarcade.com"
      />

      {/* ===== 1. HERO ===== */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-12 pb-8 md:pt-20 md:pb-12 overflow-hidden">
        {/* Background flag emoji grid (faded) */}
        <div
          className="absolute inset-0 flex flex-wrap justify-center items-center gap-4 text-4xl opacity-[0.06] pointer-events-none select-none overflow-hidden"
          aria-hidden
        >
          {FLAG_EMOJIS.map((emoji, i) => (
            <span
              key={i}
              className="animate-slide-up-fade"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* INSERT COIN blink */}
        <p
          className={`font-retro text-[10px] text-retro-text/50 tracking-[6px] uppercase mb-4 transition-all duration-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          } animate-blink-arcade`}
        >
          INSERT COIN
        </p>

        <img
          src={bigLogo}
          alt="Flag Arcade"
          className={`w-48 md:w-64 mb-6 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        />

        <p
          className={`font-retro text-xs md:text-sm text-retro-text text-center max-w-md mb-8 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          The ultimate world flag quiz. 197 countries. 6 game modes.
        </p>

        {/* START GAME button */}
        <Link
          to="/play"
          className={`
            relative font-retro text-sm md:text-base text-white
            bg-retro-neon-green border-2 border-retro-border shadow-pixel-lg
            px-8 py-4 md:px-12 md:py-5
            hover:translate-y-0.5 hover:shadow-pixel transition-all
            overflow-hidden
            duration-700 delay-300
            ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
        >
          <span className="relative z-10">START GAME</span>
          <span
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        </Link>

        {/* Choose your mode arrow */}
        <a
          href="#modes"
          className={`mt-6 font-body text-xs text-retro-text-secondary hover:text-retro-text transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Choose your mode &darr;
        </a>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GAME_MODES.map((mode, i) => (
            <div
              key={mode.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`
                relative group
                bg-retro-surface border-2 border-retro-border shadow-pixel
                transition-all duration-500
                ${visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
              `}
            >
              {mode.isNew && (
                <span className="absolute -top-2 -right-2 z-10 font-retro text-[7px] bg-retro-neon-red text-white px-1.5 py-0.5 border border-retro-border shadow-pixel-sm">
                  NEW
                </span>
              )}

              <Link
                to={mode.path}
                className="block hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
              >
                {/* Title bar */}
                <div className={`${mode.color} border-b-2 border-retro-border px-3 py-1.5`}>
                  <span className="font-retro text-[9px] md:text-[10px] text-white leading-tight">
                    {mode.title}
                  </span>
                </div>
                {/* Card body */}
                <div className="p-3 md:p-4 flex flex-col items-center text-center">
                  <img
                    src={mode.icon}
                    alt={mode.title}
                    className="w-12 h-12 md:w-16 md:h-16 mb-2"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <p className="font-body text-xs text-retro-text-secondary leading-snug mb-2">
                    {mode.description}
                  </p>
                  {/* SELECT button — visible on hover */}
                  <span className="font-retro text-[8px] text-retro-text/40 py-1 px-3 border border-retro-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    SELECT
                  </span>
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

      {/* ===== 7. FOOTER ===== */}
      <footer className="border-t-2 border-retro-border bg-retro-border py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex gap-4">
            <Link to="/flags" className="font-body text-xs text-gray-300 hover:text-white transition-colors">
              Browse Flags
            </Link>
            <Link to="/quiz" className="font-body text-xs text-gray-300 hover:text-white transition-colors">
              Quiz
            </Link>
            <a
              href="https://learntoship.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-xs text-gray-300 hover:text-white transition-colors"
            >
              Built by LearnToShip.ai
            </a>
          </nav>
          <p className="font-retro text-[8px] text-gray-300">
            &copy; 2026 Flag Arcade
          </p>
        </div>
      </footer>

      {/* Inline keyframes for shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
