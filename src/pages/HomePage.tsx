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
  },
];

const CONTINENTS: { name: Continent; slug: string }[] = [
  { name: 'Africa', slug: 'africa' },
  { name: 'Asia', slug: 'asia' },
  { name: 'Europe', slug: 'europe' },
  { name: 'North America', slug: 'north-america' },
  { name: 'South America', slug: 'south-america' },
  { name: 'Oceania', slug: 'oceania' },
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

  return (
    <section className="max-w-3xl mx-auto px-4 py-10 md:py-14">
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
              </button>
            ))}
          </div>

          {/* Flag grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 mb-5">
            {activeFlags.map((country) => (
              <Link
                key={country.code}
                to={`/flags/${getCountrySlug(country)}`}
                className="flex flex-col items-center bg-white border border-retro-border/30 p-2 hover:bg-retro-accent/20 hover:shadow-pixel-sm transition-all group"
              >
                <span className="text-3xl md:text-4xl mb-1 group-hover:scale-110 transition-transform">
                  {getFlagEmoji(country.code)}
                </span>
                <span className="font-body text-[9px] md:text-[10px] text-retro-text-secondary text-center leading-tight">
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
              See all {activeTab} flags &rarr;
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
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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
            const index = cardRefs.current.indexOf(entry.target as HTMLAnchorElement);
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

      {/* ===== 1. HERO / TITLE SCREEN ===== */}
      <section className="flex flex-col items-center justify-center px-4 pt-12 pb-8 md:pt-20 md:pb-12">
        <img
          src={bigLogo}
          alt="Flag Arcade"
          className={`w-48 md:w-64 mb-6 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        />
        <p
          className={`font-retro text-xs md:text-sm text-retro-text text-center mb-8 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          The Ultimate World Flag Quiz
        </p>

        {/* INSERT COIN button with rainbow shimmer */}
        <Link
          to="/play"
          className={`
            relative font-retro text-sm md:text-base text-white
            bg-retro-neon-green border-2 border-retro-border shadow-pixel-lg
            px-8 py-4 md:px-12 md:py-5
            hover:translate-y-0.5 hover:shadow-pixel transition-all
            overflow-hidden
            transition-all duration-700 delay-300
            ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
        >
          <span className="relative z-10">INSERT COIN</span>
          <span
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        </Link>

        {/* PRESS START blink */}
        <p
          className={`font-retro text-xs text-retro-text mt-6 transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ animation: mounted ? 'blink 1.2s step-end infinite' : 'none' }}
        >
          PRESS START
        </p>
      </section>

      {/* ===== 2. FLAG MARQUEE STRIP ===== */}
      <section className="border-y-2 border-retro-border bg-retro-border overflow-hidden py-3">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-2xl md:text-3xl tracking-widest px-4">{marqueeStrip}</span>
          <span className="text-2xl md:text-3xl tracking-widest px-4">{marqueeStrip}</span>
        </div>
      </section>

      {/* ===== 3. GAME MODES GRID ===== */}
      <section className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <h2 className="font-retro text-sm md:text-base text-retro-text text-center mb-8">
          CHOOSE YOUR MODE
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GAME_MODES.map((mode, i) => (
            <Link
              key={mode.title}
              to={mode.path}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`
                bg-retro-surface border-2 border-retro-border shadow-pixel
                transition-all duration-500 hover:translate-y-0.5 hover:shadow-pixel-sm
                ${visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
              `}
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
                  className="w-12 h-12 md:w-16 md:h-16 mb-2 pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="font-body text-xs text-retro-text-secondary leading-snug">
                  {mode.description}
                </p>
              </div>
            </Link>
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
      <section className="bg-retro-accent border-y-2 border-retro-border py-5">
        <div className="max-w-3xl mx-auto flex justify-center items-center gap-4 md:gap-8 px-4">
          <span className="font-retro text-[10px] md:text-xs text-retro-text text-center">197 COUNTRIES</span>
          <span className="font-retro text-[10px] md:text-xs text-retro-text">|</span>
          <span className="font-retro text-[10px] md:text-xs text-retro-text text-center">6 CONTINENTS</span>
          <span className="font-retro text-[10px] md:text-xs text-retro-text">|</span>
          <span className="font-retro text-[10px] md:text-xs text-retro-text text-center">6 GAME MODES</span>
        </div>
      </section>

      {/* ===== 5. EXPLORE FLAGS SECTION ===== */}
      <FlagExplorer />

      {/* ===== 6. FOOTER ===== */}
      <footer className="border-t-2 border-retro-border bg-retro-border py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex gap-4">
            <Link to="/flags" className="font-body text-xs text-gray-300 hover:text-white transition-colors">
              Browse Flags
            </Link>
            <Link to="/quiz" className="font-body text-xs text-gray-300 hover:text-white transition-colors">
              Quiz Info
            </Link>
            <Link to="/play" className="font-body text-xs text-gray-300 hover:text-white transition-colors">
              Play
            </Link>
          </nav>
          <p className="font-retro text-[8px] text-gray-300">
            Flag Arcade
          </p>
        </div>
      </footer>

      {/* Inline keyframes for shimmer and blink */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
