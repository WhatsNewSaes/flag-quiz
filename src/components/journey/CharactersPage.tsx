import { useState } from 'react';
import { CHARACTERS, CharacterKey } from '../../data/characters';
import { playMenuSelectSound } from '../../utils/sounds';

import boySouth from '../../images/character/boy-south.png';
import girlSouth from '../../images/character/girl-south.png';
import nicoSouth from '../../images/character/nico-south.png';
import amaraSouth from '../../images/character/amara-south.png';
import kitsuneSouth from '../../images/character/kitsune-south.png';
import krakenSouth from '../../images/character/kraken-south.png';
import dragonSouth from '../../images/character/dragon-south.png';
import eagleSouth from '../../images/character/eagle-south.png';
import phoenixSouth from '../../images/character/phoenix-south.png';

const CHARACTER_THUMBS: Record<CharacterKey, string> = {
  boy: boySouth,
  girl: girlSouth,
  nico: nicoSouth,
  amara: amaraSouth,
  kitsune: kitsuneSouth,
  kraken: krakenSouth,
  dragon: dragonSouth,
  eagle: eagleSouth,
  phoenix: phoenixSouth,
};

interface CharactersPageProps {
  unlockedCharacters: string[];
}

export function CharactersPage({ unlockedCharacters }: CharactersPageProps) {
  const [selectedChar, setSelectedChar] = useState<string>(() =>
    localStorage.getItem('selected-character')?.replace(/"/g, '') || 'boy'
  );

  function selectCharacter(key: string) {
    localStorage.setItem('selected-character', JSON.stringify(key));
    setSelectedChar(key);
    window.dispatchEvent(new Event('character-changed'));
    playMenuSelectSound();
  }

  return (
    <div className="min-h-screen bg-retro-bg py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-retro text-sm text-retro-text">
            Characters
          </h1>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
          {CHARACTERS.map(c => {
            const isHuman = c.kind === 'human';
            const isUnlocked = isHuman || unlockedCharacters.includes(c.key);
            const isSelected = selectedChar === c.key;

            return (
              <button
                key={c.key}
                onClick={() => isUnlocked && selectCharacter(c.key)}
                disabled={!isUnlocked}
                className={`relative flex flex-col items-center rounded-lg p-3 border-[3px] transition-colors ${
                  isSelected
                    ? 'border-retro-gold bg-retro-gold/10'
                    : isUnlocked
                    ? 'border-retro-border/40 hover:border-retro-border bg-retro-surface'
                    : 'border-retro-border/20 bg-gray-200'
                }`}
              >
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {isUnlocked ? (
                    <img
                      src={CHARACTER_THUMBS[c.key]}
                      alt={c.name}
                      className="w-16 h-16"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-[3px] border-dashed border-retro-border/30 flex items-center justify-center">
                      <span className="font-retro text-retro-text-secondary text-xs">???</span>
                    </div>
                  )}
                </div>
                <span className={`font-retro text-xs mt-1 ${
                  isSelected
                    ? 'text-retro-text'
                    : isUnlocked
                    ? 'text-retro-text'
                    : 'text-retro-text-secondary'
                }`}>
                  {isUnlocked ? c.name : '???'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
