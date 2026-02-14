import { useMemo } from 'react';

// 32x32 "Flag Explorer" sprite at 2px per pixel = 64x64px rendered
// Palette-indexed: hex digits 0-F map to colors below
const PALETTE = [
  'transparent', // 0
  '#b91c1c',     // 1 – hat red
  '#dc2626',     // 2 – hat highlight
  '#fbbf24',     // 3 – skin
  '#f59e0b',     // 4 – skin shadow
  '#1e293b',     // 5 – dark (eyes, boots)
  '#ffffff',     // 6 – white (eye highlights, shirt)
  '#2563eb',     // 7 – blue vest
  '#1d4ed8',     // 8 – vest shadow
  '#92400e',     // 9 – brown pants
  '#78350f',     // A – pants shadow
  '#78716c',     // B – flag pole gray
  '#ef4444',     // C – flag red
  '#dc2626',     // D – flag red dark
  '#22c55e',     // E – globe green
  '#334155',     // F – boot dark
];

// 32 rows x 32 hex chars each
// 0 = transparent (not rendered)
const SPRITE: string[] = [
  // Row 0-5: Hat with brim + flag pole start
  '000000000011110000000000B0000000', // 0
  '000000001112211000000000BCCC0000', // 1
  '000000011111111100000000BCCCD000', // 2
  '000000111111111110000000BCCD0000', // 3
  '000001111122111111000000B0000000', // 4
  '000011111111111111100000B0000000', // 5
  // Row 6-10: Face
  '000000011333331100000000B0000000', // 6
  '000000013335333100000000B0000000', // 7
  '000000013356535100000000B0000000', // 8
  '000000013333333100000000B0000000', // 9
  '000000011343431100000000B0000000', // 10
  // Row 11-18: Blue vest over white shirt, arm reaching toward pole
  '000000016666661000000000B0000000', // 11
  '000000076666667000000000B0000000', // 12
  '000000776666677000000000B0000000', // 13
  '000003776666677300000000B0000000', // 14
  '000003877666778300000000B0000000', // 15
  '000000877666778333333330B0000000', // 16
  '000000087766780000000003B0000000', // 17
  '000000008877880000000000B0000000', // 18
  // Row 19-26: Brown pants
  '000000009999990000000000B0000000', // 19
  '00000009999999900000000000000000', // 20
  '00000009999999900000000000000000', // 21
  '00000009A9999A900000000000000000', // 22
  '00000009A9009A900000000000000000', // 23
  '00000009900099900000000000000000', // 24
  '00000009900099900000000000000000', // 25
  '00000009900099900000000000000000', // 26
  // Row 27-31: Dark boots
  '00000055500055500000000000000000', // 27
  '0000055FF00055F00000000000000000', // 28
  '0000055FF00055F00000000000000000', // 29
  '00000FFFF000FFF00000000000000000', // 30
  '00000000000000000000000000000000', // 31
];

const PX = 2; // pixels per sprite pixel

function buildBoxShadow(): string {
  const shadows: string[] = [];
  for (let y = 0; y < 32; y++) {
    const row = SPRITE[y];
    if (!row) continue;
    for (let x = 0; x < 32; x++) {
      const ch = row[x];
      if (!ch || ch === '0') continue;
      const colorIndex = parseInt(ch, 16);
      const color = PALETTE[colorIndex];
      if (!color || color === 'transparent') continue;
      shadows.push(`${x * PX}px ${y * PX}px 0 0 ${color}`);
    }
  }
  return shadows.join(',');
}

export function PixelCharacter() {
  const shadow = useMemo(() => buildBoxShadow(), []);

  const totalWidth = 32 * PX;
  const totalHeight = 32 * PX;

  return (
    <div
      className="animate-bounce-slow"
      style={{
        width: totalWidth,
        height: totalHeight,
        position: 'relative',
      }}
    >
      {/* Character sprite */}
      <div
        style={{
          width: PX,
          height: PX,
          boxShadow: shadow,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {/* Bounce shadow */}
      <div
        className="animate-bounce-slow-shadow"
        style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 6,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
        }}
      />
    </div>
  );
}
