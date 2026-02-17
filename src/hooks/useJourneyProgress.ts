import { useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSync } from '../contexts/SyncContext';
import { JourneyLevel, JourneyRegion } from '../data/journeyLevels';
import { ACHIEVEMENTS, AchievementContext } from '../data/achievements';
import { CHARACTERS } from '../data/characters';

export type Rank = 'Novice' | 'Explorer' | 'Cartographer' | 'Diplomat' | 'Ambassador' | 'World Leader';

export interface LevelResult {
  stars: number;
  bestScore: number;
  totalFlags: number;
  bestPercentage: number;
  attempts: number;
  lastFailedAt: number | null;
}

export interface JourneyProgressData {
  version: number;
  levelResults: Record<string, LevelResult>;
  totalStars: number;
  currentRank: Rank;
  achievements: Record<string, number | null>;
  unlockedModes: string[];
  unlockedCharacters: string[];
  completionStreak: number;
}

const CURRENT_VERSION = 3;

const INITIAL_PROGRESS: JourneyProgressData = {
  version: CURRENT_VERSION,
  levelResults: {},
  totalStars: 0,
  currentRank: 'Novice',
  achievements: {},
  unlockedModes: [],
  unlockedCharacters: [],
  completionStreak: 0,
};

const RANK_THRESHOLDS: [number, Rank][] = [
  [100, 'World Leader'],
  [75, 'Ambassador'],
  [50, 'Diplomat'],
  [30, 'Cartographer'],
  [10, 'Explorer'],
  [0, 'Novice'],
];

export function calculateStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const pct = (correct / total) * 100;
  if (pct >= 100) return 3;
  if (pct >= 85) return 2;
  if (pct >= 70) return 1;
  return 0;
}

export function calculateRank(totalStars: number): Rank {
  for (const [threshold, rank] of RANK_THRESHOLDS) {
    if (totalStars >= threshold) return rank;
  }
  return 'Novice';
}

export function isLevelUnlocked(
  levelId: string,
  allLevels: JourneyLevel[],
  levelResults: Record<string, LevelResult>
): boolean {
  const idx = allLevels.findIndex(l => l.id === levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;

  const prevLevel = allLevels[idx - 1];
  const prevResult = levelResults[prevLevel.id];
  return !!prevResult && prevResult.stars >= 1;
}

export function getUnlockedModes(
  regions: JourneyRegion[],
  levelResults: Record<string, LevelResult>
): string[] {
  const modes: string[] = [];

  // Check if all levels up through the second-to-last in a region are completed
  const secondLastCompleted = (idx: number) => {
    const region = regions[idx];
    if (!region || region.levels.length < 2) return false;
    const levelsToCheck = region.levels.slice(0, -1);
    return levelsToCheck.every(l => {
      const r = levelResults[l.id];
      return r && r.stars >= 1;
    });
  };

  // Arcade after W1 second-to-last (1-1)
  if (secondLastCompleted(0)) modes.push('free-play');
  // Flag Runner after W2 second-to-last (2-2)
  if (secondLastCompleted(1)) modes.push('flag-runner');
  // Jeopardy after W3 second-to-last (3-3)
  if (secondLastCompleted(2)) modes.push('jeopardy');
  // Around the World after W4 second-to-last (4-4)
  if (secondLastCompleted(3)) modes.push('around-the-world');

  return modes;
}

export function getUnlockedCharacters(
  regions: JourneyRegion[],
  levelResults: Record<string, LevelResult>
): string[] {
  const chars: string[] = [];

  const regionCompleted = (idx: number) => {
    const region = regions[idx];
    if (!region) return false;
    return region.levels.every(l => {
      const r = levelResults[l.id];
      return r && r.stars >= 1;
    });
  };

  for (const c of CHARACTERS) {
    if (c.kind === 'creature' && c.unlockRegion !== null && regionCompleted(c.unlockRegion)) {
      chars.push(c.key);
    }
  }

  return chars;
}

/**
 * Detect which worlds were newly unlocked by comparing before/after level results.
 * Returns an array of region indices that just became fully completed.
 * Only reports a region as newly unlocked if it wasn't complete before but is now.
 */
export function getNewlyUnlockedWorlds(
  regions: JourneyRegion[],
  resultsBefore: Record<string, LevelResult>,
  resultsAfter: Record<string, LevelResult>
): number[] {
  const regionComplete = (results: Record<string, LevelResult>, idx: number) => {
    const region = regions[idx];
    if (!region) return false;
    return region.levels.every(l => {
      const r = results[l.id];
      return r && r.stars >= 1;
    });
  };

  const unlocked: number[] = [];
  for (let i = 0; i < regions.length; i++) {
    if (!regionComplete(resultsBefore, i) && regionComplete(resultsAfter, i)) {
      unlocked.push(i);
    }
  }
  return unlocked;
}

function migrateProgress(data: any): JourneyProgressData {
  if (!data || !data.version || data.version < 2) {
    return INITIAL_PROGRESS;
  }
  // v2 -> v3: add unlockedCharacters
  if (data.version === 2) {
    return { ...data, version: 3, unlockedCharacters: [] };
  }
  return data as JourneyProgressData;
}

export function useJourneyProgress(regions: JourneyRegion[], allLevels: JourneyLevel[]) {
  const [progress, setProgress] = useLocalStorage<JourneyProgressData>(
    'journey-progress',
    INITIAL_PROGRESS,
    migrateProgress
  );
  const { pushProgress } = useSync();

  // Push progress to cloud whenever it changes
  useEffect(() => {
    if (progress.version >= CURRENT_VERSION) {
      pushProgress(progress);
    }
  }, [progress, pushProgress]);

  const saveResult = useCallback(
    (levelId: string, correct: number, total: number) => {
      const stars = calculateStars(correct, total);
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

      setProgress((prev) => {
        const existing = prev.levelResults[levelId];
        const isNewBest = !existing || pct > existing.bestPercentage;
        const newStars = existing ? Math.max(existing.stars, stars) : stars;
        const oldStars = existing?.stars ?? 0;
        const starDelta = newStars - oldStars;

        const newLevelResults = {
          ...prev.levelResults,
          [levelId]: {
            stars: newStars,
            bestScore: isNewBest ? correct : (existing?.bestScore ?? correct),
            totalFlags: total,
            bestPercentage: isNewBest ? pct : (existing?.bestPercentage ?? pct),
            attempts: (existing?.attempts ?? 0) + 1,
            lastFailedAt: stars === 0 ? Date.now() : (existing?.lastFailedAt ?? null),
          },
        };

        const newTotalStars = prev.totalStars + starDelta;
        const newRank = calculateRank(newTotalStars);
        const newStreak = stars >= 1 ? prev.completionStreak + 1 : 0;
        const unlockedModes = getUnlockedModes(regions, newLevelResults);
        const unlockedCharacters = getUnlockedCharacters(regions, newLevelResults);

        return {
          ...prev,
          levelResults: newLevelResults,
          totalStars: newTotalStars,
          currentRank: newRank,
          unlockedModes,
          unlockedCharacters,
          completionStreak: newStreak,
        };
      });

      return { stars, percentage: pct, isNewBest: true };
    },
    [setProgress, regions]
  );

  const checkAchievements = useCallback(
    (
      levelId: string,
      stars: number,
      percentage: number,
      regionIndex: number,
      projectedLevelResults?: Record<string, LevelResult>,
      projectedTotalStars?: number
    ) => {
      const levelResults = projectedLevelResults ?? progress.levelResults;
      const totalStars = projectedTotalStars ?? progress.totalStars;

      const ctx: AchievementContext = {
        levelId,
        stars,
        percentage,
        regionIndex,
        levelResults,
        totalStars,
        regions,
        allLevels,
        streak: progress.completionStreak,
      };

      const newlyUnlocked: string[] = [];
      const updatedAchievements = { ...progress.achievements };

      for (const def of ACHIEVEMENTS) {
        if (progress.achievements[def.id]) continue;
        if (def.check(ctx)) {
          updatedAchievements[def.id] = Date.now();
          newlyUnlocked.push(def.id);
        }
      }

      if (newlyUnlocked.length > 0) {
        setProgress((prev) => ({
          ...prev,
          achievements: { ...prev.achievements, ...updatedAchievements },
        }));
      }

      return newlyUnlocked;
    },
    [setProgress, regions, allLevels, progress]
  );

  const unlockedModes = useMemo(
    () => getUnlockedModes(regions, progress.levelResults),
    [regions, progress.levelResults]
  );

  const unlockedCharacters = useMemo(
    () => getUnlockedCharacters(regions, progress.levelResults),
    [regions, progress.levelResults]
  );

  const isUnlocked = useCallback(
    (levelId: string) => isLevelUnlocked(levelId, allLevels, progress.levelResults),
    [allLevels, progress.levelResults]
  );

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, [setProgress]);

  return {
    progress,
    saveResult,
    checkAchievements,
    unlockedModes,
    unlockedCharacters,
    isUnlocked,
    resetProgress,
  };
}
