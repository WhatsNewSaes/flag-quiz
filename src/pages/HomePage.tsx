import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SEOHead } from '../components/seo/SEOHead';
import { countries, type Continent } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';
import { getCountrySlug, getContinentSlug } from '../utils/slugify';
import bigLogo from '../images/logo/big-logo.svg';

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
    path: '/play',
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
