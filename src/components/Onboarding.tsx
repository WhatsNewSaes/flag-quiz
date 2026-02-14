import { useState, useMemo } from 'react';
import { countries } from '../data/countries';
import { getFlagEmoji } from '../utils/flagEmoji';

import boySouth from '../images/character/boy-south.png';
import girlSouth from '../images/character/girl-south.png';
import greenMeadowsImg from '../images/worlds/green meadows.png';

interface OnboardingProps {
  onComplete: (character: 'boy' | 'girl', flag: string) => void;
}

const POPULAR_FLAGS = ['US', 'GB', 'JP', 'BR', 'FR', 'IN', 'KR', 'MX'];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<'boy' | 'girl' | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      .slice(0, 20);
  }, [searchQuery]);

  if (step === 1) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <h1 className="font-retro text-lg sm:text-xl text-retro-text text-center mb-2">
          Pick Your Explorer
        </h1>
        <p className="text-retro-text-secondary text-sm text-center mb-8 max-w-xs">
          Choose your character to explore the world of flags!
        </p>

        <div className="flex gap-6 sm:gap-8">
          {/* Boy card */}
          <button
            onClick={() => { setSelectedCharacter('boy'); setStep(2); }}
            className="retro-window w-36 sm:w-40 flex flex-col items-center focus:outline-none"
          >
            <div className="retro-window-title bg-retro-neon-blue text-white text-center text-xs">
              Boy
            </div>
            <div className="retro-window-body flex items-center justify-center py-6">
              <img
                src={boySouth}
                alt="Boy explorer"
                className="w-24 h-24 sm:w-28 sm:h-28"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </button>

          {/* Girl card */}
          <button
            onClick={() => { setSelectedCharacter('girl'); setStep(2); }}
            className="retro-window w-36 sm:w-40 flex flex-col items-center focus:outline-none"
          >
            <div className="retro-window-title bg-retro-neon-red text-white text-center text-xs">
              Girl
            </div>
            <div className="retro-window-body flex items-center justify-center py-6">
              <img
                src={girlSouth}
                alt="Girl explorer"
                className="w-24 h-24 sm:w-28 sm:h-28"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
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
              onClick={() => { setSelectedFlag(code); setStep(3); }}
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
                  onClick={() => { setSelectedFlag(c.code); setStep(3); }}
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
          onClick={() => setStep(1)}
          className="mt-6 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  // Step 3: Welcome / Intro
  return (
    <div className="min-h-screen bg-retro-bg flex flex-col items-center px-4 py-6">
      {/* World 1 preview */}
      <div className="w-full max-w-sm rounded-lg border-2 border-retro-border/30 shadow-pixel-sm overflow-hidden mb-6">
        <div className="bg-retro-neon-green text-white px-2 py-2 font-retro text-[11px] text-center">
          World 1 — Green Meadows
        </div>
        <img src={greenMeadowsImg} alt="Green Meadows" className="w-full block" />
      </div>

      <h1 className="font-retro text-lg sm:text-xl text-retro-text text-center mb-3">
        Your Journey Begins!
      </h1>

      {/* Character + flag badge */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={selectedCharacter === 'girl' ? girlSouth : boySouth}
          alt="Your explorer"
          className="w-20 h-20"
          style={{ imageRendering: 'pixelated' }}
        />
        <span className="text-5xl">{selectedFlag ? getFlagEmoji(selectedFlag) : ''}</span>
      </div>

      <p className="text-retro-text text-sm text-center max-w-xs mb-6 leading-relaxed">
        Travel across 5 worlds, master flags from every corner of the globe, earn stars,
        unlock achievements, and become a Flag Champion!
      </p>

      <button
        onClick={() => {
          if (selectedCharacter && selectedFlag) {
            onComplete(selectedCharacter, selectedFlag);
          }
        }}
        className="retro-btn px-8 py-3 font-retro text-sm bg-retro-neon-green text-white"
      >
        Start Adventure
      </button>

      {/* Back button */}
      <button
        onClick={() => setStep(2)}
        className="mt-4 text-retro-text-secondary text-xs font-retro hover:text-retro-text transition-colors"
      >
        &larr; Back
      </button>
    </div>
  );
}
