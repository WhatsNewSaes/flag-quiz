import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../../data/achievements';

interface AchievementToastProps {
  achievementIds: string[];
  onDone: () => void;
}

export function AchievementToast({ achievementIds, onDone }: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const defs = achievementIds
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (defs.length === 0) {
      onDone();
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < defs.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setVisible(false);
        setTimeout(onDone, 300);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex, defs.length, onDone]);

  if (defs.length === 0 || !visible) return null;

  const current = defs[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="pixel-border bg-retro-surface rounded-lg px-6 py-4 flex items-center gap-3 shadow-pixel-lg">
        <span className="text-3xl">{current.icon}</span>
        <div>
          <div className="font-retro text-xs text-retro-gold">
            Achievement Unlocked!
          </div>
          <div className="text-retro-text text-sm font-bold mt-1">
            {current.name}
          </div>
          <div className="text-retro-text-secondary text-xs mt-0.5">
            {current.description}
          </div>
        </div>
      </div>
    </div>
  );
}
