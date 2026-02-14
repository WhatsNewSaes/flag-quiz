import { useState, useEffect, useMemo } from 'react';

import boyFrame0 from '../../images/character/frame_000.png';
import boyFrame1 from '../../images/character/frame_001.png';
import boyFrame2 from '../../images/character/frame_002.png';
import boyFrame3 from '../../images/character/frame_003.png';
import boyFrame4 from '../../images/character/frame_004.png';
import boyFrame5 from '../../images/character/frame_005.png';

import girlFrame0 from '../../images/character-girl/frame_000.png';
import girlFrame1 from '../../images/character-girl/frame_001.png';
import girlFrame2 from '../../images/character-girl/frame_002.png';
import girlFrame3 from '../../images/character-girl/frame_003.png';
import girlFrame4 from '../../images/character-girl/frame_004.png';
import girlFrame5 from '../../images/character-girl/frame_005.png';

const BOY_FRAMES = [boyFrame0, boyFrame1, boyFrame2, boyFrame3, boyFrame4, boyFrame5];
const GIRL_FRAMES = [girlFrame0, girlFrame1, girlFrame2, girlFrame3, girlFrame4, girlFrame5];
const FRAME_DURATION = 150; // ms per frame

export function PixelCharacter() {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => {
    const stored = localStorage.getItem('selected-character')?.replace(/"/g, '') || '';
    return stored === 'girl' ? GIRL_FRAMES : BOY_FRAMES;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, FRAME_DURATION);
    return () => clearInterval(interval);
  }, [frames]);

  return (
    <div className="relative" style={{ width: 35, height: 60 }}>
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
