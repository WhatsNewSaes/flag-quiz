import { useState, useEffect, useMemo } from 'react';

import abelF0 from '../../images/character-abel/walk-south/frame_000.png';
import abelF1 from '../../images/character-abel/walk-south/frame_001.png';
import abelF2 from '../../images/character-abel/walk-south/frame_002.png';
import abelF3 from '../../images/character-abel/walk-south/frame_003.png';
import abelF4 from '../../images/character-abel/walk-south/frame_004.png';
import abelF5 from '../../images/character-abel/walk-south/frame_005.png';

import edenF0 from '../../images/character-eden/walk-south/frame_000.png';
import edenF1 from '../../images/character-eden/walk-south/frame_001.png';
import edenF2 from '../../images/character-eden/walk-south/frame_002.png';
import edenF3 from '../../images/character-eden/walk-south/frame_003.png';
import edenF4 from '../../images/character-eden/walk-south/frame_004.png';
import edenF5 from '../../images/character-eden/walk-south/frame_005.png';

import nicoF0 from '../../images/character-nico/walk-south/frame_000.png';
import nicoF1 from '../../images/character-nico/walk-south/frame_001.png';
import nicoF2 from '../../images/character-nico/walk-south/frame_002.png';
import nicoF3 from '../../images/character-nico/walk-south/frame_003.png';
import nicoF4 from '../../images/character-nico/walk-south/frame_004.png';
import nicoF5 from '../../images/character-nico/walk-south/frame_005.png';

import amaraF0 from '../../images/character-amara/walk-south/frame_000.png';
import amaraF1 from '../../images/character-amara/walk-south/frame_001.png';
import amaraF2 from '../../images/character-amara/walk-south/frame_002.png';
import amaraF3 from '../../images/character-amara/walk-south/frame_003.png';
import amaraF4 from '../../images/character-amara/walk-south/frame_004.png';
import amaraF5 from '../../images/character-amara/walk-south/frame_005.png';

import kitsuneF0 from '../../images/character-kitsune/walk-south/frame_000.png';
import kitsuneF1 from '../../images/character-kitsune/walk-south/frame_001.png';
import kitsuneF2 from '../../images/character-kitsune/walk-south/frame_002.png';
import kitsuneF3 from '../../images/character-kitsune/walk-south/frame_003.png';
import kitsuneF4 from '../../images/character-kitsune/walk-south/frame_004.png';
import kitsuneF5 from '../../images/character-kitsune/walk-south/frame_005.png';

import krakenF0 from '../../images/character-kraken/walk-south/frame_000.png';
import krakenF1 from '../../images/character-kraken/walk-south/frame_001.png';
import krakenF2 from '../../images/character-kraken/walk-south/frame_002.png';
import krakenF3 from '../../images/character-kraken/walk-south/frame_003.png';
import krakenF4 from '../../images/character-kraken/walk-south/frame_004.png';
import krakenF5 from '../../images/character-kraken/walk-south/frame_005.png';

import dragonF0 from '../../images/character-dragon/walk-south/frame_000.png';
import dragonF1 from '../../images/character-dragon/walk-south/frame_001.png';
import dragonF2 from '../../images/character-dragon/walk-south/frame_002.png';
import dragonF3 from '../../images/character-dragon/walk-south/frame_003.png';
import dragonF4 from '../../images/character-dragon/walk-south/frame_004.png';
import dragonF5 from '../../images/character-dragon/walk-south/frame_005.png';

import eagleF0 from '../../images/character-eagle/walk-south/frame_000.png';
import eagleF1 from '../../images/character-eagle/walk-south/frame_001.png';
import eagleF2 from '../../images/character-eagle/walk-south/frame_002.png';
import eagleF3 from '../../images/character-eagle/walk-south/frame_003.png';
import eagleF4 from '../../images/character-eagle/walk-south/frame_004.png';
import eagleF5 from '../../images/character-eagle/walk-south/frame_005.png';

import phoenixF0 from '../../images/character-phoenix/walk-south/frame_000.png';
import phoenixF1 from '../../images/character-phoenix/walk-south/frame_001.png';
import phoenixF2 from '../../images/character-phoenix/walk-south/frame_002.png';
import phoenixF3 from '../../images/character-phoenix/walk-south/frame_003.png';
import phoenixF4 from '../../images/character-phoenix/walk-south/frame_004.png';
import phoenixF5 from '../../images/character-phoenix/walk-south/frame_005.png';

const CHARACTER_FRAMES: Record<string, string[]> = {
  boy: [abelF0, abelF1, abelF2, abelF3, abelF4, abelF5],
  girl: [edenF0, edenF1, edenF2, edenF3, edenF4, edenF5],
  nico: [nicoF0, nicoF1, nicoF2, nicoF3, nicoF4, nicoF5],
  amara: [amaraF0, amaraF1, amaraF2, amaraF3, amaraF4, amaraF5],
  kitsune: [kitsuneF0, kitsuneF1, kitsuneF2, kitsuneF3, kitsuneF4, kitsuneF5],
  kraken: [krakenF0, krakenF1, krakenF2, krakenF3, krakenF4, krakenF5],
  dragon: [dragonF0, dragonF1, dragonF2, dragonF3, dragonF4, dragonF5],
  eagle: [eagleF0, eagleF1, eagleF2, eagleF3, eagleF4, eagleF5],
  phoenix: [phoenixF0, phoenixF1, phoenixF2, phoenixF3, phoenixF4, phoenixF5],
};
const FRAME_DURATION = 150; // ms per frame

export function PixelCharacter() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [charKey, setCharKey] = useState(() =>
    localStorage.getItem('selected-character')?.replace(/"/g, '') || 'boy'
  );

  // Listen for character-changed events from NavBar
  useEffect(() => {
    const handler = () => {
      setCharKey(localStorage.getItem('selected-character')?.replace(/"/g, '') || 'boy');
      setFrameIndex(0);
    };
    window.addEventListener('character-changed', handler);
    return () => window.removeEventListener('character-changed', handler);
  }, []);

  const frames = useMemo(() => {
    return CHARACTER_FRAMES[charKey] || CHARACTER_FRAMES.boy;
  }, [charKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, FRAME_DURATION);
    return () => clearInterval(interval);
  }, [frames]);

  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      <img
        src={frames[frameIndex]}
        alt="Explorer"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Bounce shadow */}
      <div
        className="animate-bounce-slow-shadow"
        style={{
          position: 'absolute',
          bottom: -3,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 5,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}
