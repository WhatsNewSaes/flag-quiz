import { JourneyRegion } from './journeyLevels';

export interface AchievementContext {
  levelId: string;
  stars: number;
  percentage: number;
  regionIndex: number;
  levelResults: Record<string, { stars: number; bestPercentage: number }>;
  totalStars: number;
  regions: JourneyRegion[];
  allLevels: { id: string }[];
  streak: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

function regionCompleted(ctx: AchievementContext, regionIndex: number): boolean {
  const region = ctx.regions[regionIndex];
  if (!region) return false;
  return region.levels.every(level => {
    const result = ctx.levelResults[level.id];
    return result && result.stars >= 1;
  });
}

function regionPerfect(ctx: AchievementContext, regionIndex: number): boolean {
  const region = ctx.regions[regionIndex];
  if (!region) return false;
  return region.levels.every(level => {
    const result = ctx.levelResults[level.id];
    return result && result.stars >= 3;
  });
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first level',
    icon: '👣',
    check: (ctx) => ctx.stars >= 1,
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on any level',
    icon: '💯',
    check: (ctx) => ctx.percentage === 100,
  },
  {
    id: 'meadow-master',
    name: 'Meadow Master',
    description: 'Complete all Green Meadows levels',
    icon: '🌿',
    check: (ctx) => regionCompleted(ctx, 0),
  },
  {
    id: 'shore-explorer',
    name: 'Shore Explorer',
    description: 'Complete all Sandy Shores levels',
    icon: '🏖️',
    check: (ctx) => regionCompleted(ctx, 1),
  },
  {
    id: 'forest-guide',
    name: 'Forest Guide',
    description: 'Complete all Misty Forest levels',
    icon: '🌲',
    check: (ctx) => regionCompleted(ctx, 2),
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    description: 'Complete all Rocky Mountains levels',
    icon: '⛰️',
    check: (ctx) => regionCompleted(ctx, 3),
  },
  {
    id: 'volcano-conqueror',
    name: 'Volcano Conqueror',
    description: 'Complete all Volcanic Peak levels',
    icon: '🌋',
    check: (ctx) => regionCompleted(ctx, 4),
  },
  {
    id: 'star-collector-10',
    name: 'Star Collector',
    description: 'Earn 10 stars',
    icon: '⭐',
    check: (ctx) => ctx.totalStars >= 10,
  },
  {
    id: 'star-collector-30',
    name: 'Star Hoarder',
    description: 'Earn 30 stars',
    icon: '🌟',
    check: (ctx) => ctx.totalStars >= 30,
  },
  {
    id: 'star-collector-50',
    name: 'Star Master',
    description: 'Earn 50 stars',
    icon: '✨',
    check: (ctx) => ctx.totalStars >= 50,
  },
  {
    id: 'world-traveler',
    name: 'World Traveler',
    description: 'Complete at least one level in every region',
    icon: '✈️',
    check: (ctx) => {
      for (let i = 0; i < ctx.regions.length; i++) {
        const region = ctx.regions[i];
        const hasCompleted = region.levels.some(level => {
          const result = ctx.levelResults[level.id];
          return result && result.stars >= 1;
        });
        if (!hasCompleted) return false;
      }
      return true;
    },
  },
  {
    id: 'all-stars',
    name: 'All Stars',
    description: 'Earn 3 stars on every level',
    icon: '👑',
    check: (ctx) => {
      for (let i = 0; i < ctx.regions.length; i++) {
        if (!regionPerfect(ctx, i)) return false;
      }
      return true;
    },
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 5 levels in a row with at least 1 star',
    icon: '⚡',
    check: (ctx) => ctx.streak >= 5,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 3 stars on 10 different levels',
    icon: '🎯',
    check: (ctx) => {
      const threeStarCount = Object.values(ctx.levelResults).filter(r => r.stars >= 3).length;
      return threeStarCount >= 10;
    },
  },
];
