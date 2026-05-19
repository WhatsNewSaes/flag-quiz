import { useState } from 'react';
import greenMeadowsImg from '../images/worlds/green meadows.png';
import {
  CharacterSelect,
  CHARACTER_IMAGES,
  type HumanCharacterKey,
} from './onboarding/CharacterSelect';
import { FavoriteFlagSelect } from './onboarding/FavoriteFlagSelect';

export type { HumanCharacterKey };

interface OnboardingProps {
  onComplete: (character: HumanCharacterKey, flag: string) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [selectedCharacter, setSelectedCharacter] = useState<HumanCharacterKey | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

  const handleCharacterSelect = (key: HumanCharacterKey) => {
    setSelectedCharacter(key);
    setStep(3);
  };

  const handleFlagSelect = (code: string) => {
    setSelectedFlag(code);
    setStep(4);
  };

  // Step 2: Pick character
  if (step === 2) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <CharacterSelect onSelect={handleCharacterSelect} />
      </div>
    );
  }

  // Step 3: Pick flag
  if (step === 3) {
    return (
      <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center px-4 py-8">
        <FavoriteFlagSelect onSelect={handleFlagSelect} />
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
