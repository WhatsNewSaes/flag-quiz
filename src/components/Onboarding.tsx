import { useState, useEffect, useMemo } from 'react';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

import boySouth from '../images/character/boy-south.png';
import girlSouth from '../images/character/girl-south.png';
import nicoSouth from '../images/character/nico-south.png';
import amaraSouth from '../images/character/amara-south.png';

export type CharacterKey = 'boy' | 'girl' | 'nico' | 'amara';

interface OnboardingProps {
  onComplete: (character: CharacterKey, flag: string) => void;
}

const POPULAR_FLAGS = ['US', 'GB', 'CN', 'JP', 'BR', 'FR', 'IN', 'KR', 'MX', 'DE', 'IT', 'CA'];
const INTRO_GIF_DURATION = 12900; // ms — matches the GIF length

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [introPhase, setIntroPhase] = useState<'playing' | 'ready'>('playing');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // After the GIF finishes, show the "Are you ready?" prompt
  useEffect(() => {
    if (step !== 1) return;
    const timer = setTimeout(() => setIntroPhase('ready'), INTRO_GIF_DURATION);
    return () => clearTimeout(timer);
  }, [step]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      .slice(0, 20);
  }, [searchQuery]);

  // Screen 1: Cinematic intro
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* GIF — natural aspect ratio, centered */}
        <div className="w-full max-w-2xl relative">
          <img
            src="/intro.gif"
            alt=""
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Dark overlay that fades in when GIF ends */}
          <div
            className="absolute inset-0 bg-black rounded-lg transition-opacity duration-700"
            style={{ opacity: introPhase === 'ready' ? 0.65 : 0 }}
          />

          {/* "Are you ready?" text — slams in over the GIF */}
          {introPhase === 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 animate-bounce-in">
              <h1 className="font-retro text-lg sm:text-2xl text-white text-center drop-shadow-[0_3px_0_rgba(0,0,0,0.9)]">
                Are you ready?
              </h1>
              <button
                onClick={() => setStep(2)}
                className="retro-btn px-10 py-4 font-retro text-sm bg-retro-neon-green text-white"
              >
                Let's Go!
              </button>
            </div>
          )}
        </div>

        {/* Skip button */}
        {introPhase === 'playing' && (
          <button
            onClick={() => setIntroPhase('ready')}
            className="absolute bottom-6 right-6 z-10 font-retro text-[10px] text-white/50 hover:text-white/80 transition-colors"
          >
            Skip &raquo;
          </button>
        )}
      </div>
    );
  }

  // Screen 2: Pick character
  if (step === 2) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <h1 className="font-retro text-lg sm:text-xl text-retro-text text-center mb-2">
          Pick Your Explorer
        </h1>
        <p className="text-retro-text-secondary text-sm text-center mb-8 max-w-xs">
          Choose your character to explore the world of flags!
        </p>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {([
            { key: 'boy' as CharacterKey, name: 'Abel', img: boySouth },
            { key: 'girl' as CharacterKey, name: 'Eden', img: girlSouth },
            { key: 'nico' as CharacterKey, name: 'Nico', img: nicoSouth },
            { key: 'amara' as CharacterKey, name: 'Amara', img: amaraSouth },
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

        {/* Back button */}
        <button
          onClick={() => setStep(1)}
          className="mt-8 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  // Screen 3: Pick flag → then straight into gameplay
  return (
    <div className="min-h-screen bg-retro-bg flex flex-col items-center px-4 py-8">
      <h1 className="font-retro text-lg sm:text-xl text-retro-text text-center mb-2">
        Pick Your Favorite Flag
      </h1>
      <p className="text-retro-text-secondary text-sm text-center mb-6 max-w-xs">
        This will be your flag badge!
      </p>

      {/* Popular flags grid: 2 rows of 4 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {POPULAR_FLAGS.map(code => (
          <button
            key={code}
            onClick={() => {
              if (selectedCharacter) onComplete(selectedCharacter, code);
            }}
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
                onClick={() => {
                  if (selectedCharacter) onComplete(selectedCharacter, c.code);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-retro-accent/20 transition-colors border-b border-retro-border/20 last:border-b-0"
              >
                <span className="text-2xl">{getFlagEmoji(c.code)}</span>
                <span className="text-sm text-retro-text">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={() => setStep(2)}
        className="mt-6 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
      >
        &larr; Back
      </button>
    </div>
  );
}
