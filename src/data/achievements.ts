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
