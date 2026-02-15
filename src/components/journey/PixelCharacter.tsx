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

const CHARACTER_FRAMES: Record<string, string[]> = {
  boy: [abelF0, abelF1, abelF2, abelF3, abelF4, abelF5],
  girl: [edenF0, edenF1, edenF2, edenF3, edenF4, edenF5],
  nico: [nicoF0, nicoF1, nicoF2, nicoF3, nicoF4, nicoF5],
  amara: [amaraF0, amaraF1, amaraF2, amaraF3, amaraF4, amaraF5],
};
const FRAME_DURATION = 150; // ms per frame

export function PixelCharacter() {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => {
    const stored = localStorage.getItem('selected-character')?.replace(/"/g, '') || '';
    return CHARACTER_FRAMES[stored] || CHARACTER_FRAMES.boy;
  }, []);

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
