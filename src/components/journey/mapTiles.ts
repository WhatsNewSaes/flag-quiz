// SNES-style overworld map tile definitions
// SVG pattern generators, palettes, continent outline, node positions, and decoration sprites

// ── Palette ──────────────────────────────────────────────────────────────────

export interface TilePalette {
  ground: string;
  groundDark: string;
  grass: string;
  grassDark: string;
  path: string;
  pathEdge: string;
  water: string;
  waterLight: string;
  accent: string;
  sky: string;
}

export const PALETTES: TilePalette[] = [
  // 0 – Green Meadows
  {
    ground: '#5a8f3c',
    groundDark: '#4a7a2e',
    grass: '#7ec850',
    grassDark: '#5fa030',
    path: '#d2b48c',
    pathEdge: '#a0845c',
    water: '#3078c0',
    waterLight: '#58a0e0',
    accent: '#e8d44d',
    sky: '#88c8f8',
  },
  // 1 – Sandy Shores
  {
    ground: '#c8a862',
    groundDark: '#b09050',
    grass: '#d4c070',
    grassDark: '#b8a050',
    path: '#f0e0c0',
    pathEdge: '#c8b890',
    water: '#20a0a0',
    waterLight: '#48c8c8',
    accent: '#f09030',
    sky: '#b8e0f0',
  },
  // 2 – Misty Forest
  {
    ground: '#2a6858',
    groundDark: '#1e5848',
    grass: '#3a9878',
    grassDark: '#2a7860',
    path: '#88a890',
    pathEdge: '#607868',
    water: '#185858',
    waterLight: '#288878',
    accent: '#c8a0d8',
    sky: '#607880',
  },
  // 3 – Rocky Mountains
  {
    ground: '#707880',
    groundDark: '#585f68',
    grass: '#98a0a8',
    grassDark: '#808890',
    path: '#607080',
    pathEdge: '#484f58',
    water: '#3868a8',
    waterLight: '#5888c8',
    accent: '#f09848',
    sky: '#a0a8b0',
  },
  // 4 – Volcanic Peak
  {
    ground: '#602020',
    groundDark: '#481818',
    grass: '#c04820',
    grassDark: '#983818',
    path: '#b87040',
    pathEdge: '#885030',
    water: '#c02020',
    waterLight: '#e04838',
    accent: '#f8d020',
    sky: '#483030',
  },
];

// ── SVG Pattern Generators ───────────────────────────────────────────────────
// Each returns raw SVG string to be used inside <defs>

function rect(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

export function groundPatternSvg(id: string, p: TilePalette): string {
  // 8x8 flat terrain with dithered texture
  let rects = rect(0, 0, 8, 8, p.ground);
  // Dither: scattered darker pixels
  const dither = [[1,1],[3,2],[5,0],[6,4],[0,5],[2,6],[4,3],[7,7],[1,4],[5,6]];
  for (const [dx, dy] of dither) {
    rects += rect(dx, dy, 1, 1, p.groundDark);
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8">${rects}</pattern>`;
}

export function grassPatternSvg(id: string, p: TilePalette): string {
  // 8x8 ground with V-shaped grass tufts on top rows
  let rects = rect(0, 0, 8, 8, p.ground);
  // Dither on ground
  rects += rect(2, 5, 1, 1, p.groundDark);
  rects += rect(5, 6, 1, 1, p.groundDark);
  rects += rect(0, 7, 1, 1, p.groundDark);
  rects += rect(7, 4, 1, 1, p.groundDark);
  // Grass tufts - V shapes
  // Tuft 1
  rects += rect(1, 2, 1, 1, p.grass);
  rects += rect(0, 1, 1, 1, p.grassDark);
  rects += rect(2, 1, 1, 1, p.grassDark);
  rects += rect(1, 0, 1, 1, p.grass);
  // Tuft 2
  rects += rect(5, 3, 1, 1, p.grass);
  rects += rect(4, 2, 1, 1, p.grassDark);
  rects += rect(6, 2, 1, 1, p.grassDark);
  rects += rect(5, 1, 1, 1, p.grass);

  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8">${rects}</pattern>`;
}

export function pathPatternSvg(id: string, p: TilePalette): string {
  // 8x8 road tile with darker edge pixels
  let rects = rect(0, 0, 8, 8, p.path);
  // Darker edges on left and right columns
  for (let y = 0; y < 8; y++) {
    rects += rect(0, y, 1, 1, p.pathEdge);
    rects += rect(7, y, 1, 1, p.pathEdge);
  }
  // Top and bottom edges
  for (let x = 1; x < 7; x++) {
    rects += rect(x, 0, 1, 1, p.pathEdge);
    rects += rect(x, 7, 1, 1, p.pathEdge);
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8">${rects}</pattern>`;
}

export function waterPatternSvg(id: string, p: TilePalette): string {
  // 16x16 water with diagonal wave highlights
  let rects = rect(0, 0, 16, 16, p.water);
  // Wave highlights: diagonal stripes
  const waves = [
    [1,0],[2,1],[3,2],[4,3],
    [9,0],[10,1],[11,2],[12,3],
    [0,8],[1,9],[2,10],[3,11],
    [8,8],[9,9],[10,10],[11,11],
    [5,6],[6,7],[13,6],[14,7],
  ];
  for (const [wx, wy] of waves) {
    rects += rect(wx, wy, 1, 1, p.waterLight);
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="16" height="16">${rects}</pattern>`;
}

export function generateAllPatternsSvg(): string {
  const types = ['ground', 'grass', 'path', 'water'] as const;
  const generators = {
    ground: groundPatternSvg,
    grass: grassPatternSvg,
    path: pathPatternSvg,
    water: waterPatternSvg,
  };

  let defs = '';
  for (let r = 0; r < PALETTES.length; r++) {
    const palette = PALETTES[r];
    for (const t of types) {
      defs += generators[t](`tile-${r}-${t}`, palette);
    }
  }
  return defs;
}

// ── Continent Outline ────────────────────────────────────────────────────────
// Hand-authored SVG path: irregular island silhouette with stairstep edges
// viewBox is 0 0 400 2200, continent floats within ~30px margin

export const CONTINENT_OUTLINE = `
M 80,40
L 120,30 L 160,28 L 200,30 L 240,26 L 280,32 L 320,38
L 330,50 L 336,80 L 340,120 L 338,160 L 342,200
L 348,240 L 350,280 L 346,320 L 340,360
L 344,400 L 350,440 L 354,480 L 348,520 L 340,560
L 334,580 L 320,600 L 310,620 L 300,640
L 296,680 L 300,720 L 306,760
L 316,800 L 326,840 L 330,880
L 328,920 L 320,960 L 316,1000
L 322,1040 L 332,1080 L 340,1120
L 346,1160 L 348,1200 L 344,1240
L 336,1280 L 326,1300 L 314,1320
L 300,1340 L 290,1360 L 286,1400
L 290,1440 L 300,1480 L 310,1520
L 318,1560 L 322,1600 L 320,1640
L 314,1680 L 306,1720 L 296,1760
L 288,1800 L 282,1840 L 280,1880
L 276,1920 L 268,1960 L 254,1990
L 240,2010 L 220,2020 L 200,2030
L 180,2028 L 160,2020 L 140,2006
L 124,1980 L 112,1950 L 104,1920
L 100,1880 L 96,1840 L 94,1800
L 90,1760 L 86,1720 L 80,1680
L 74,1640 L 70,1600 L 68,1560
L 72,1520 L 78,1480 L 84,1440
L 88,1400 L 86,1360 L 80,1320
L 74,1280 L 70,1240 L 66,1200
L 62,1160 L 58,1120 L 54,1080
L 50,1040 L 52,1000 L 58,960
L 64,920 L 66,880 L 62,840
L 56,800 L 52,760 L 54,720
L 60,680 L 66,640 L 72,600
L 76,560 L 72,520 L 66,480
L 60,440 L 56,400 L 54,360
L 56,320 L 62,280 L 66,240
L 64,200 L 60,160 L 56,120
L 58,80 L 64,50 L 72,42
Z
`.trim();

// Region vertical bounds (y ranges for clipping each region's fill)
export const REGION_BOUNDS: [number, number][] = [
  [20, 460],    // 0 – Green Meadows
  [460, 880],   // 1 – Sandy Shores
  [880, 1320],  // 2 – Misty Forest
  [1320, 1720], // 3 – Rocky Mountains
  [1720, 2060], // 4 – Volcanic Peak
];

// ── Node Positions ───────────────────────────────────────────────────────────
// 20 level nodes creating a winding path through the continent
// Total levels: 2+2+3+5+8 = 20

export const NODE_POSITIONS: [number, number][] = [
  // Region 0 – Green Meadows (2 nodes)
  [180, 120],
  [240, 300],
  // Region 1 – Sandy Shores (2 nodes)
  [160, 540],
  [260, 720],
  // Region 2 – Misty Forest (3 nodes)
  [180, 940],
  [140, 1080],
  [240, 1220],
  // Region 3 – Rocky Mountains (5 nodes)
  [180, 1380],
  [120, 1440],
  [220, 1520],
  [160, 1580],
  [240, 1660],
  // Region 4 – Volcanic Peak (8 nodes)
  [200, 1760],
  [140, 1810],
  [230, 1850],
  [170, 1890],
  [220, 1920],
  [160, 1950],
  [200, 1980],
  [190, 2010],
];

// ── Decoration Sprites ───────────────────────────────────────────────────────
// Small SVG strings for pixel-art decorations (trees, bushes, rocks, flowers)

export function treeSvg(p: TilePalette): string {
  // 16x16 pixel tree
  const trunk = p.pathEdge;
  const leaves = p.grass;
  const leavesDark = p.grassDark;
  return `
    ${rect(7, 12, 2, 4, trunk)}
    ${rect(5, 4, 6, 8, leaves)}
    ${rect(6, 2, 4, 2, leaves)}
    ${rect(7, 1, 2, 1, leaves)}
    ${rect(5, 5, 1, 2, leavesDark)}
    ${rect(6, 7, 2, 2, leavesDark)}
    ${rect(9, 4, 1, 1, leavesDark)}
  `;
}

export function bushSvg(p: TilePalette): string {
  // 8x8 pixel bush
  return `
    ${rect(1, 3, 6, 4, p.grass)}
    ${rect(2, 2, 4, 1, p.grass)}
    ${rect(3, 1, 2, 1, p.grassDark)}
    ${rect(2, 4, 2, 2, p.grassDark)}
    ${rect(1, 7, 6, 1, p.groundDark)}
  `;
}

export function rockSvg(p: TilePalette): string {
  // 8x8 pixel rock
  const c = p.groundDark;
  const h = p.ground;
  return `
    ${rect(2, 3, 4, 4, c)}
    ${rect(1, 4, 1, 2, c)}
    ${rect(6, 4, 1, 2, c)}
    ${rect(3, 2, 2, 1, c)}
    ${rect(3, 3, 2, 1, h)}
    ${rect(2, 7, 4, 1, c)}
  `;
}

export function flowerSvg(p: TilePalette): string {
  // 6x6 pixel flower
  return `
    ${rect(2, 4, 1, 2, p.grassDark)}
    ${rect(1, 1, 1, 1, p.accent)}
    ${rect(3, 1, 1, 1, p.accent)}
    ${rect(2, 0, 1, 1, p.accent)}
    ${rect(2, 2, 1, 1, p.accent)}
    ${rect(2, 1, 1, 1, p.grass)}
    ${rect(1, 3, 2, 1, p.grassDark)}
  `;
}

// ── Seeded RNG ───────────────────────────────────────────────────────────────

export function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
