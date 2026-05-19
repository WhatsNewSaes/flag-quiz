import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroLevelOne } from './HeroLevelOne';
import { CharacterSelect, type HumanCharacterKey } from '../onboarding/CharacterSelect';
import { FavoriteFlagSelect } from '../onboarding/FavoriteFlagSelect';
import { AchievementToast } from '../journey/AchievementToast';
import { calculateStars, useJourneyProgress, type LevelResult } from '../../hooks/useJourneyProgress';
import { buildJourneyRegions, getAllLevels } from '../../data/journeyLevels';
import { playLevelCompleteSound, playStarEarnedSound, playAchievementSound } from '../../utils/sounds';

type Phase = 'playing' | 'celebration' | 'pickCharacter' | 'pickFlag' | 'launching';

const LEVEL_ONE_ID = 'r0-l0';
const DEFAULT_CHARACTER: HumanCharacterKey = 'boy';
const DEFAULT_FAVORITE_FLAG = 'US';

export function HeroJourneyFlow() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('playing');
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);

  const regions = useMemo(() => buildJourneyRegions(), []);
  const allLevels = useMemo(() => getAllLevels(regions), [regions]);
  const journeyProgress = useJourneyProgress(regions, allLevels);

  const handleLevelComplete = useCallback((r: { correct: number; total: number }) => {
    setResult(r);

    const levelOne = allLevels[0];
    const stars = calculateStars(r.correct, r.total);
    const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;

    const existing = journeyProgress.progress.levelResults[LEVEL_ONE_ID];
    const newStars = existing ? Math.max(existing.stars, stars) : stars;
    const oldStars = existing?.stars ?? 0;
    const starDelta = newStars - oldStars;
    const isNewBest = !existing || pct > existing.bestPercentage;

    const projectedResults: Record<string, LevelResult> = {
      ...journeyProgress.progress.levelResults,
      [LEVEL_ONE_ID]: {
        stars: newStars,
        bestScore: isNewBest ? r.correct : (existing?.bestScore ?? r.correct),
        totalFlags: r.total,
        bestPercentage: isNewBest ? pct : (existing?.bestPercentage ?? pct),
        attempts: (existing?.attempts ?? 0) + 1,
        lastFailedAt: stars === 0 ? Date.now() : (existing?.lastFailedAt ?? null),
      },
    };
    const projectedTotalStars = journeyProgress.progress.totalStars + starDelta;

    const saved = journeyProgress.saveResult(LEVEL_ONE_ID, r.correct, r.total);
    playLevelCompleteSound();
    if (saved.stars > 0) playStarEarnedSound();

    const newAchievements = journeyProgress.checkAchievements(
      LEVEL_ONE_ID,
      saved.stars,
      saved.percentage,
      levelOne.regionIndex,
      projectedResults,
      projectedTotalStars,
    );
    if (newAchievements.length > 0) {
      playAchievementSound();
      setPendingAchievements(newAchievements);
    }

    if (!window.localStorage.getItem('selected-character')) {
      window.localStorage.setItem('selected-character', JSON.stringify(DEFAULT_CHARACTER));
    }
    if (!window.localStorage.getItem('favorite-flag')) {
      window.localStorage.setItem('favorite-flag', JSON.stringify(DEFAULT_FAVORITE_FLAG));
    }
    window.localStorage.setItem('onboarding-complete', JSON.stringify('true'));

    setPhase('celebration');
  }, [allLevels, journeyProgress]);

  const handleCharacterPick = useCallback((key: HumanCharacterKey) => {
    window.localStorage.setItem('selected-character', JSON.stringify(key));
    setPhase('pickFlag');
  }, []);

  const handleFlagPick = useCallback((code: string) => {
    window.localStorage.setItem('favorite-flag', JSON.stringify(code));
    setPhase('launching');
    navigate('/play/journey');
  }, [navigate]);

  // Scroll to top of the hero section when phase changes (so picker is visible)
  useEffect(() => {
    if (phase === 'celebration' || phase === 'pickCharacter' || phase === 'pickFlag') {
      const root = document.getElementById('root');
      if (root) root.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [phase]);

  const toast = pendingAchievements.length > 0 ? (
    <AchievementToast
      achievementIds={pendingAchievements}
      onDone={() => setPendingAchievements([])}
    />
  ) : null;

  if (phase === 'playing') {
    return (
      <>
        <HeroLevelOne onComplete={handleLevelComplete} />
        {toast}
      </>
    );
  }

  if (phase === 'celebration' && result) {
    const stars = calculateStars(result.correct, result.total);
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

    return (
      <>
        <section className="relative bg-retro-bg border-b-2 border-retro-border min-h-[80vh] flex items-center">
          <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-10 text-center">
            <div className="text-5xl mb-2">&#x1F389;</div>
            <h2 className="font-retro text-base sm:text-xl text-retro-text mb-2">
              You&rsquo;re on a journey!
            </h2>
            <p className="font-body text-sm sm:text-base text-retro-text-secondary mb-5 max-w-md mx-auto">
              You got <span className="font-retro text-retro-neon-green">{result.correct}/{result.total}</span> ({pct}%) on World 1, Level 1.
            </p>

            <div className="flex items-center justify-center gap-2 mb-6" aria-label={`${stars} stars`}>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className={`text-3xl sm:text-4xl ${i < stars ? '' : 'opacity-25 grayscale'}`}
                >
                  &#x2B50;
                </span>
              ))}
            </div>

            <p className="font-body text-xs sm:text-sm text-retro-text-secondary mb-5">
              Pick a character and favorite flag to continue.
            </p>

            <button
              onClick={() => setPhase('pickCharacter')}
              className="retro-btn px-8 py-3 font-retro text-sm bg-retro-neon-green text-white"
            >
              Continue &rarr;
            </button>
          </div>
        </section>
        {toast}
      </>
    );
  }

  if (phase === 'pickCharacter') {
    return (
      <>
        <section className="relative bg-retro-bg border-b-2 border-retro-border min-h-[80vh] flex items-center">
          <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
            <CharacterSelect onSelect={handleCharacterPick} />
          </div>
        </section>
        {toast}
      </>
    );
  }

  if (phase === 'pickFlag') {
    return (
      <>
        <section className="relative bg-retro-bg border-b-2 border-retro-border min-h-[80vh] flex items-center">
          <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
            <FavoriteFlagSelect onSelect={handleFlagPick} />
          </div>
        </section>
        {toast}
      </>
    );
  }

  // launching — navigation is in flight; render a minimal placeholder
  return (
    <>
      <section className="relative bg-retro-bg border-b-2 border-retro-border min-h-[80vh] flex items-center">
        <div className="w-full max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="font-retro text-xs text-retro-text animate-blink-arcade">
            LOADING LEVEL 2...
          </p>
        </div>
      </section>
      {toast}
    </>
  );
}
