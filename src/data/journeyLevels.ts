import { countries, Difficulty } from './countries';

export interface RegionTheme {
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  pathColor: string;
  decorEmojis: string[];
}

export const REGION_THEMES: RegionTheme[] = [
  {
    name: 'Green Meadows',
    emoji: '🌿',
    description: 'Friendly flags from around the world',
    gradient: 'from-green-900/40 to-emerald-900/40',
    pathColor: '#4ade80',
    decorEmojis: ['🌿', '🌻', '🦋', '🌳', '🍃'],
  },
  {
    name: 'Sandy Shores',
    emoji: '🏖️',
    description: 'Coastal nations and island states',
    gradient: 'from-amber-900/40 to-yellow-900/40',
    pathColor: '#fbbf24',
    decorEmojis: ['🏖️', '🐚', '🌴', '🦀', '🌊'],
  },
  {
    name: 'Misty Forest',
    emoji: '🌲',
    description: 'Venture deeper into the unknown',
    gradient: 'from-teal-900/40 to-cyan-900/40',
    pathColor: '#2dd4bf',
    decorEmojis: ['🌲', '🍄', '🦉', '🌿', '🦌'],
  },
  {
    name: 'Rocky Mountains',
    emoji: '⛰️',
    description: 'The challenge gets steeper',
    gradient: 'from-slate-800/40 to-stone-800/40',
    pathColor: '#f97316',
    decorEmojis: ['⛰️', '🦅', '🏔️', '🪨', '🐐'],
  },
  {
    name: 'Volcanic Peak',
    emoji: '🌋',
    description: 'Only the bravest reach the summit',
    gradient: 'from-red-900/40 to-orange-900/40',
    pathColor: '#ef4444',
    decorEmojis: ['🌋', '🔥', '💎', '🐉', '⚡'],
  },
];

const DIFFICULTY_FOR_REGION: Difficulty[] = [1, 2, 3, 4, 5];
const LEVELS_PER_REGION = [2, 2, 3, 5, 8];

export interface JourneyLevel {
  id: string;
  regionIndex: number;
  levelIndexInRegion: number;
  globalLevelIndex: number;
  difficulty: Difficulty;
  countryCodes: string[];
  displayName: string;
}

export interface JourneyRegion {
  regionIndex: number;
  theme: RegionTheme;
  difficulty: Difficulty;
  levels: JourneyLevel[];
}

export function buildJourneyRegions(): JourneyRegion[] {
  const regions: JourneyRegion[] = [];
  let globalLevelIndex = 0;

  for (let r = 0; r < 5; r++) {
    const difficulty = DIFFICULTY_FOR_REGION[r];
    const theme = REGION_THEMES[r];
    const numLevels = LEVELS_PER_REGION[r];

    // Get all countries at this difficulty, sorted alphabetically
    const regionCountries = countries
      .filter(c => c.difficulty === difficulty)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Distribute evenly across levels
    const levels: JourneyLevel[] = [];
    const totalFlags = regionCountries.length;
    const basePerLevel = Math.floor(totalFlags / numLevels);
    const remainder = totalFlags % numLevels;

    let offset = 0;
    for (let l = 0; l < numLevels; l++) {
      // First 'remainder' levels get one extra flag
      const count = basePerLevel + (l < remainder ? 1 : 0);
      const codes = regionCountries.slice(offset, offset + count).map(c => c.code);
      offset += count;

      const levelLabel = numLevels > 1 ? ` Level ${l + 1}` : '';
      const displayName = `World ${r + 1}${levelLabel}`;

      levels.push({
        id: `r${r}-l${l}`,
        regionIndex: r,
        levelIndexInRegion: l,
        globalLevelIndex,
        difficulty,
        countryCodes: codes,
        displayName,
      });

      globalLevelIndex++;
    }

    regions.push({
      regionIndex: r,
      theme,
      difficulty,
      levels,
    });
  }

  return regions;
}

export function getAllLevels(regions: JourneyRegion[]): JourneyLevel[] {
  return regions.flatMap(r => r.levels);
}
