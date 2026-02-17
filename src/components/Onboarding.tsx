import { useState, useEffect, useMemo } from 'react';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

import boySouth from '../images/character/boy-south.png';
import girlSouth from '../images/character/girl-south.png';
import nicoSouth from '../images/character/nico-south.png';
import amaraSouth from '../images/character/amara-south.png';
import greenMeadowsImg from '../images/worlds/green meadows.png';

/** Human characters available during onboarding */
export type HumanCharacterKey = 'boy' | 'girl' | 'nico' | 'amara';

interface OnboardingProps {
  onComplete: (character: HumanCharacterKey, flag: string) => void;
}

const POPULAR_FLAGS = ['US', 'GB', 'CN', 'JP', 'BR', 'FR', 'IN', 'KR', 'MX', 'DE', 'IT', 'CA'];

const CHARACTER_IMAGES: Record<HumanCharacterKey, string> = {
  boy: boySouth,
  girl: girlSouth,
  nico: nicoSouth,
  amara: amaraSouth,
};

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<HumanCharacterKey | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSplashBtn, setShowSplashBtn] = useState(false);

  useEffect(() => {
    if (step !== 1) return;
    const timer = setTimeout(() => setShowSplashBtn(true), 800);
    return () => clearTimeout(timer);
  }, [step]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      .slice(0, 20);
  }, [searchQuery]);

  const handleFlagSelect = (code: string) => {
    setSelectedFlag(code);
    setStep(4);
  };

  // Step 1: Splash screen
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="w-full relative" style={{ maxWidth: 400 }}>
          <img
            src="/splash.png"
            alt="Flag Quest"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />

          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000"
            style={{ opacity: showSplashBtn ? 1 : 0 }}
          >
            <button
              onClick={() => setStep(2)}
              className="retro-btn px-10 py-4 font-retro text-sm bg-retro-neon-green text-white"
            >
              Start Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Pick character
  if (step === 2) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="text-6xl mb-4">&#x1F3AE;</div>
        <h1 className="font-retro text-center mb-8" style={{ fontSize: '1.5rem' }}>
          <span
            className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
            style={{ WebkitTextStroke: '1px #2D2D2D' }}
          >
            Choose Your Character
          </span>
        </h1>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {([
            { key: 'amara' as HumanCharacterKey, name: 'Amara', img: amaraSouth },
            { key: 'boy' as HumanCharacterKey, name: 'Abel', img: boySouth },
            { key: 'girl' as HumanCharacterKey, name: 'Eden', img: girlSouth },
            { key: 'nico' as HumanCharacterKey, name: 'Nico', img: nicoSouth },
          ]).map(({ key, name, img }) => (
            <button
              key={key}
              onClick={() => { setSelectedCharacter(key); setStep(3); }}
              className="w-36 sm:w-40 flex flex-col items-center focus:outline-none rounded-lg border-3 border-retro-border shadow-pixel"
              style={{ backgroundColor: '#FFF8E7', borderWidth: 3 }}
            >
              <div className="font-retro text-xs text-retro-text text-center pt-3 pb-1">
                {name}
              </div>
              <div className="flex items-center justify-center py-3 overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-28 h-28 sm:w-32 sm:h-32"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="mt-8 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  // Step 3: Pick flag
  if (step === 3) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="text-6xl mb-4">&#x1F30D;</div>
        <h1 className="font-retro text-center mb-6" style={{ fontSize: '1.5rem' }}>
          <span
            className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
            style={{ WebkitTextStroke: '1px #2D2D2D' }}
          >
            Pick Your Flag
          </span>
        </h1>

        {/* Popular flags grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {POPULAR_FLAGS.map(code => (
            <button
              key={code}
              onClick={() => handleFlagSelect(code)}
              className="retro-btn w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center bg-retro-surface text-3xl sm:text-4xl rounded-lg"
            >
              {getFlagEmoji(code)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="Search any country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full font-retro text-xs text-retro-text bg-retro-surface border-3 border-retro-border rounded-lg px-3 py-3 outline-none"
            style={{ borderWidth: 3 }}
          />

          {searchResults.length > 0 && (
            <div
              className="mt-2 bg-retro-surface border-3 border-retro-border rounded-lg overflow-y-auto"
              style={{ maxHeight: 240, borderWidth: 3 }}
            >
              {searchResults.map(c => (
                <button
                  key={c.code}
                  onClick={() => handleFlagSelect(c.code)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-retro-accent/20 transition-colors border-b border-retro-border/20 last:border-b-0"
                >
                  <span className="text-2xl">{getFlagEmoji(c.code)}</span>
                  <span className="text-sm text-retro-text">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setStep(2)}
          className="mt-6 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  // Step 4: Level briefing
  return (
    <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center w-full max-w-sm text-center">
        {/* World image container — matches journey screen style */}
        <div className="w-full rounded-lg border-2 border-retro-border/30 shadow-pixel-sm overflow-hidden mb-6">
          <div className="bg-retro-neon-green text-white px-2 py-2 font-retro text-[12px] sm:text-sm text-center whitespace-nowrap">
            &#x2726; World 1 — Green Meadows &#x2726;
          </div>
          <div className="relative">
            <img
              src={greenMeadowsImg}
              alt="Green Meadows"
              className="w-full block"
            />
            {selectedCharacter && (
              <img
                src={CHARACTER_IMAGES[selectedCharacter]}
                alt="Your character"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 mb-8">
          <div
            className="flex items-center gap-3 bg-retro-surface rounded-lg px-4 py-3 border-retro-border shadow-pixel-sm"
            style={{ borderWidth: 3 }}
          >
            <span className="shrink-0" style={{ fontSize: '2rem' }}>&#x1F1FA;&#x1F1F8;</span>
            <p className="font-retro text-retro-text text-left" style={{ fontSize: '0.7rem', lineHeight: '1.6' }}>
              Start off with easy, recognizable flags
            </p>
          </div>
          <div
            className="flex items-center gap-3 bg-retro-surface rounded-lg px-4 py-3 border-retro-border shadow-pixel-sm"
            style={{ borderWidth: 3 }}
          >
            <span className="shrink-0" style={{ fontSize: '2rem' }}>&#x2B50;</span>
            <p className="font-retro text-retro-text text-left" style={{ fontSize: '0.7rem', lineHeight: '1.6' }}>
              Get 70% correct to unlock the next level
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (selectedCharacter && selectedFlag) {
              onComplete(selectedCharacter, selectedFlag);
            }
          }}
          className="retro-btn px-10 py-4 font-retro text-sm bg-retro-neon-green text-white"
        >
          Start Level 1
        </button>

        <button
          onClick={() => setStep(3)}
          className="mt-6 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
}
